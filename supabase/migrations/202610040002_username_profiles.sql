-- Anonymous Auth still supplies an authenticated identity. Names are NOT credentials.
create table public.study_profiles (
  id uuid primary key,
  name text not null check (length(btrim(name)) between 2 and 40),
  recovery_hash text not null unique check (recovery_hash ~ '^[a-f0-9]{64}$')
);
create table public.study_profile_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile_id uuid not null references public.study_profiles(id) on delete cascade
);
create index on public.study_profile_members(profile_id);
create table public.study_profile_results (
  profile_id uuid not null references public.study_profiles(id) on delete cascade,
  question_id text not null check (length(question_id) between 1 and 100),
  answer text not null check (answer in ('A','B','C','D','E')),
  elapsed_ms double precision check (elapsed_ms >= 0 and elapsed_ms <= 31536000000),
  updated_at timestamptz not null,
  primary key (profile_id,question_id)
);
alter table public.study_profiles enable row level security;
alter table public.study_profile_members enable row level security;
alter table public.study_profile_results enable row level security;
revoke all on public.study_profiles, public.study_profile_members, public.study_profile_results from anon, authenticated;
grant select on public.study_profile_members to authenticated;
grant select, insert, update on public.study_profile_results to authenticated;
create policy "Read own membership" on public.study_profile_members for select to authenticated using (user_id = (select auth.uid()));
create policy "Read linked profile results" on public.study_profile_results for select to authenticated using (
  profile_id in (select m.profile_id from public.study_profile_members m where m.user_id = (select auth.uid()))
);
create policy "Insert linked profile results" on public.study_profile_results for insert to authenticated with check (
  profile_id in (select m.profile_id from public.study_profile_members m where m.user_id = (select auth.uid()))
);
create policy "Update linked profile results" on public.study_profile_results for update to authenticated using (
  profile_id in (select m.profile_id from public.study_profile_members m where m.user_id = (select auth.uid()))
) with check (
  profile_id in (select m.profile_id from public.study_profile_members m where m.user_id = (select auth.uid()))
);

-- Narrow privileged function: attaches only the caller and only with the 128-bit
-- capability proof. It never returns the hash or lists/searches profiles by name.
create function public.connect_study_profile(profile_id uuid, display_name text, recovery_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare target public.study_profiles%rowtype;
begin
  if auth.uid() is null or recovery_hash is null or recovery_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid profile'; end if;
  if profile_id is null then
    select p.* into target from public.study_profiles p where p.recovery_hash = connect_study_profile.recovery_hash;
    if not found then raise exception 'Invalid profile'; end if;
  else
    select p.* into target from public.study_profiles p where p.id = connect_study_profile.profile_id;
    if found then
      if target.recovery_hash <> connect_study_profile.recovery_hash then raise exception 'Invalid profile'; end if;
    else
      insert into public.study_profiles(id,name,recovery_hash) values (profile_id,btrim(display_name),recovery_hash)
      returning * into target;
    end if;
  end if;
  insert into public.study_profile_members(user_id,profile_id) values (auth.uid(),target.id)
    on conflict (user_id) do update set profile_id = excluded.profile_id;
  return jsonb_build_object('id',target.id,'name',target.name);
end;
$$;
revoke all on function public.connect_study_profile(uuid,text,text) from public, anon;
grant execute on function public.connect_study_profile(uuid,text,text) to authenticated;

-- Preserves the existing frontend contract; old user results table remains intact.
create or replace function public.sync_study_results(entries jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare target uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select m.profile_id into target from public.study_profile_members m where m.user_id = auth.uid();
  if target is null then raise exception 'Profile required'; end if;
  if jsonb_typeof(entries) is distinct from 'array' or jsonb_array_length(entries) > 2000 then raise exception 'Invalid results'; end if;
  if exists (select 1 from jsonb_to_recordset(entries) as r(updated_at timestamptz)
    where r.updated_at is null or r.updated_at > now() + interval '5 minutes') then raise exception 'Invalid timestamp'; end if;
  insert into public.study_profile_results as existing (profile_id,question_id,answer,elapsed_ms,updated_at)
    select target,r.question_id,r.answer,r.elapsed_ms,r.updated_at
    from jsonb_to_recordset(entries) as r(question_id text,answer text,elapsed_ms double precision,updated_at timestamptz)
    on conflict on constraint study_profile_results_pkey do update
    set answer = excluded.answer,elapsed_ms = excluded.elapsed_ms,updated_at = excluded.updated_at
    where excluded.updated_at > existing.updated_at;
  return (select coalesce(jsonb_agg(jsonb_build_object('question_id',s.question_id,'answer',s.answer,
    'elapsed_ms',s.elapsed_ms,'updated_at',s.updated_at) order by s.question_id),'[]'::jsonb)
    from public.study_profile_results s where s.profile_id = target);
end;
$$;
revoke all on function public.sync_study_results(jsonb) from public, anon;
grant execute on function public.sync_study_results(jsonb) to authenticated;
