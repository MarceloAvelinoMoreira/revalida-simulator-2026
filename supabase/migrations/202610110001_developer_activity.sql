-- Anonymous browser identifiers only; no IP, name, or student results.
create table public.site_devices (
  device_id uuid primary key,
  visits bigint not null default 0,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
alter table public.site_devices enable row level security;
revoke all on public.site_devices from anon, authenticated;
alter table public.site_visits add column device_id uuid;
create table public.site_developer_settings (id boolean primary key default true check(id), code_hash text not null);
alter table public.site_developer_settings enable row level security;
revoke all on public.site_developer_settings from anon, authenticated;
-- Configure the owner code privately after applying this migration.
-- Keep both the code and its hash out of the public repository.
create table public.site_developer_attempts (client_id uuid primary key, tries integer not null, window_start timestamptz not null);
alter table public.site_developer_attempts enable row level security;
revoke all on public.site_developer_attempts from anon, authenticated;

create or replace function public.site_activity(session_id uuid, device_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare inserted integer;
begin
  if session_id is null or device_id is null then raise exception 'Invalid activity'; end if;
  insert into public.site_visits(session_id,device_id) values(site_activity.session_id,site_activity.device_id) on conflict do nothing;
  get diagnostics inserted = row_count;
  insert into public.site_devices(device_id,visits) values(site_activity.device_id,inserted)
    on conflict on constraint site_devices_pkey do update set visits=site_devices.visits+excluded.visits,last_seen=now();
  insert into public.site_presence(device_id,last_seen) values(site_activity.device_id,now())
    on conflict on constraint site_presence_pkey do update set last_seen=excluded.last_seen;
  delete from public.site_presence where last_seen < now()-interval '1 day';
  return jsonb_build_object('accesses',(select count(*) from public.site_visits),'online',(select count(*) from public.site_presence where last_seen > now()-interval '90 seconds'));
end; $$;

create function public.site_developer_activity(access_code text, client_id uuid, page_offset integer default 0)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare attempts integer; global_attempts integer;
begin
  if client_id is null or page_offset is null or page_offset < 0 or page_offset > 100000 then
    return jsonb_build_object('error','invalid_request');
  end if;
  delete from public.site_developer_attempts where window_start < now()-interval '1 day';
  -- Global ceiling remains effective when callers rotate their client UUID.
  insert into public.site_developer_attempts values('00000000-0000-0000-0000-000000000000',1,now())
    on conflict on constraint site_developer_attempts_pkey do update set
      tries=case when site_developer_attempts.window_start < now()-interval '1 minute' then 1 else site_developer_attempts.tries+1 end,
      window_start=case when site_developer_attempts.window_start < now()-interval '1 minute' then now() else site_developer_attempts.window_start end
    returning tries into global_attempts;
  if global_attempts > 30 or client_id='00000000-0000-0000-0000-000000000000' then return jsonb_build_object('error','rate_limited'); end if;
  insert into public.site_developer_attempts values(client_id,1,now())
    on conflict on constraint site_developer_attempts_pkey do update set
      tries=case when site_developer_attempts.window_start < now()-interval '15 minutes' then 1 else site_developer_attempts.tries+1 end,
      window_start=case when site_developer_attempts.window_start < now()-interval '15 minutes' then now() else site_developer_attempts.window_start end
    returning tries into attempts;
  if attempts > 5 then return jsonb_build_object('error','rate_limited'); end if;
  if access_code is null or access_code !~ '^[0-9]{8}$' or not exists (
    select 1 from public.site_developer_settings where code_hash=encode(sha256(convert_to(access_code,'UTF8')),'hex')
  ) then return jsonb_build_object('error','unauthorized'); end if;
  update public.site_developer_attempts set tries=0 where site_developer_attempts.client_id=site_developer_activity.client_id;
  return jsonb_build_object(
    'devices',(select count(*) from public.site_devices),
    'visits',(select count(*) from public.site_visits),
    'unmapped_visits',(select count(*) from public.site_visits where device_id is null),
    'rows',coalesce((select jsonb_agg(t) from (select device_id,visits,first_seen,last_seen from public.site_devices order by last_seen desc,device_id limit 100 offset page_offset) t),'[]'::jsonb)
  );
end; $$;
revoke all on function public.site_developer_activity(text,uuid,integer) from public;
grant execute on function public.site_developer_activity(text,uuid,integer) to anon, authenticated;
