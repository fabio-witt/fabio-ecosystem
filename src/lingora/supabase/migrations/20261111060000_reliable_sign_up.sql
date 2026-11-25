-- Sign-up must never fail because a username is taken.
--
-- 1. The app checks a username before signing up (username_available).
-- 2. If two people still pick the same name at the same moment, the new
--    profile gets a short suffix instead of the whole sign-up failing with
--    "Database error saving new user".

create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.profiles
    where lower(username) = lower(trim(p_username))
  );
$$;

revoke execute on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted text := nullif(lower(trim(new.raw_user_meta_data ->> 'username')), '');
  chosen text := wanted;
begin
  if chosen is not null and exists (select 1 from public.profiles where lower(username) = chosen) then
    chosen := left(chosen, 15) || '_' || substr(md5(new.id::text), 1, 4);
  end if;

  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    chosen,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );

  insert into public.user_statistics (user_id)
  values (new.id);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
