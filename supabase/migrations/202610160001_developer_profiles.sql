-- Reuse the existing access-code verification and rate limits. Never return
-- recovery hashes, auth user identifiers or individual study answers.
create function public.site_developer_profiles(access_code text, client_id uuid, page_offset integer default 0)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare authorization_result jsonb;
begin
  authorization_result := public.site_developer_activity(access_code, client_id, page_offset);
  if authorization_result ? 'error' then return authorization_result; end if;
  return jsonb_build_object(
    'total', (select count(*) from public.study_profiles),
    'rows', coalesce((select jsonb_agg(t order by t.name,t.profile_id) from (
      select p.id as profile_id, p.name,
        (select count(*) from public.study_profile_members m where m.profile_id=p.id) as devices,
        (select count(*) from public.study_profile_results r where r.profile_id=p.id) as saved_questions,
        (select max(r.updated_at) from public.study_profile_results r where r.profile_id=p.id) as last_synced_answer
      from public.study_profiles p order by p.name,p.id limit 100 offset page_offset
    ) t),'[]'::jsonb)
  );
end; $$;
revoke all on function public.site_developer_profiles(text,uuid,integer) from public;
grant execute on function public.site_developer_profiles(text,uuid,integer) to anon, authenticated;
