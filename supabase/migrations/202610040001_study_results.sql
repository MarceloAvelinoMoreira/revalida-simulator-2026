-- Execute once in your project's SQL Editor. No administrative key goes in the app.
create table public.study_results (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null check (length(question_id) between 1 and 100),
  answer text not null check (answer in ('A','B','C','D','E')),
  elapsed_ms double precision check (elapsed_ms >= 0 and elapsed_ms <= 31536000000),
  updated_at timestamptz not null,
  primary key (user_id, question_id)
);
alter table public.study_results enable row level security;
revoke all on public.study_results from anon;
grant select, insert, update on public.study_results to authenticated;
create policy "Read own results" on public.study_results for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own results" on public.study_results for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own results" on public.study_results for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Atomic per-question merge: the latest answer timestamp wins, not the whole snapshot.
-- SECURITY INVOKER applies RLS even when called directly via the public client.
create function public.sync_study_results(entries jsonb)
returns jsonb
language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(entries) is distinct from 'array' or jsonb_array_length(entries) > 2000 then
    raise exception 'Invalid results';
  end if;
  if exists (select 1 from jsonb_to_recordset(entries) as r(updated_at timestamptz)
    where r.updated_at is null or r.updated_at > now() + interval '5 minutes') then
    raise exception 'Invalid timestamp';
  end if;
  insert into public.study_results as existing (user_id,question_id,answer,elapsed_ms,updated_at)
  select auth.uid(), r.question_id, r.answer, r.elapsed_ms, r.updated_at
  from jsonb_to_recordset(entries) as r(question_id text,answer text,elapsed_ms double precision,updated_at timestamptz)
  on conflict on constraint study_results_pkey do update
    set answer = excluded.answer, elapsed_ms = excluded.elapsed_ms, updated_at = excluded.updated_at
    where excluded.updated_at > existing.updated_at;
  -- A single JSON value avoids the Data API's default 1000-row truncation.
  return (select coalesce(jsonb_agg(jsonb_build_object('question_id',s.question_id,
    'answer',s.answer,'elapsed_ms',s.elapsed_ms,'updated_at',s.updated_at) order by s.question_id),'[]'::jsonb)
    from public.study_results s where s.user_id = auth.uid());
end;
$$;
revoke all on function public.sync_study_results(jsonb) from public, anon;
grant execute on function public.sync_study_results(jsonb) to authenticated;
