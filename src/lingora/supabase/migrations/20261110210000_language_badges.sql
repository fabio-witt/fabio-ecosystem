-- Completed lesson ids for any visible user, so profiles can show level badges
-- (e.g. "Spanish B1"). Only ids are returned, no scores or dates.
begin;

create function public.get_completed_entries(p_user uuid)
returns setof text language sql stable security definer set search_path = ''
as $$
  select lp.entry_id from public.learn_progress lp
  where lp.user_id = p_user
    and (select auth.uid()) is not null
    and private.can_see_user(p_user);
$$;

revoke all on function public.get_completed_entries(uuid) from public, anon;
grant execute on function public.get_completed_entries(uuid) to authenticated;

commit;
