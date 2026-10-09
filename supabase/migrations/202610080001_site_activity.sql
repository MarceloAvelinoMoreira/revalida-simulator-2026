-- Aggregate usage only; never stores names, IPs or study results.
create table public.site_visits (
  session_id uuid primary key,
  created_at timestamptz not null default now()
);
create table public.site_presence (
  device_id uuid primary key,
  last_seen timestamptz not null default now()
);
create index site_presence_seen on public.site_presence(last_seen);
alter table public.site_visits enable row level security;
alter table public.site_presence enable row level security;
revoke all on public.site_visits, public.site_presence from anon, authenticated;

create function public.site_activity(session_id uuid, device_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if session_id is null or device_id is null then raise exception 'Invalid activity'; end if;
  insert into public.site_visits(session_id) values (site_activity.session_id) on conflict do nothing;
  insert into public.site_presence(device_id,last_seen) values (site_activity.device_id,now())
    on conflict on constraint site_presence_pkey do update set last_seen=excluded.last_seen;
  -- Bound presence storage; expiry is also applied to the aggregate below.
  delete from public.site_presence where last_seen < now() - interval '1 day';
  return jsonb_build_object(
    'accesses',(select count(*) from public.site_visits),
    'online',(select count(*) from public.site_presence where last_seen > now() - interval '90 seconds')
  );
end;
$$;
revoke all on function public.site_activity(uuid,uuid) from public;
grant execute on function public.site_activity(uuid,uuid) to anon, authenticated;
