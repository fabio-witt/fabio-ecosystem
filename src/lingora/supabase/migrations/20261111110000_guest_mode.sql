-- Guest mode: people can start learning with an anonymous Supabase account
-- and create a real account later (same user id, progress is kept).
-- Guests can learn, but cannot appear in or write to the community.

create or replace function private.is_guest()
returns boolean language sql stable set search_path = ''
as $$
  select coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false);
$$;
grant execute on function private.is_guest() to authenticated;

alter table public.profiles add column if not exists is_guest boolean not null default false;

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

  insert into public.profiles (id, username, full_name, is_guest)
  values (
    new.id,
    chosen,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.is_anonymous, false)
  );

  insert into public.user_statistics (user_id)
  values (new.id);

  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- When a guest confirms an email (or links Apple/Google), they become a member.
create or replace function private.sync_guest_flag()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.profiles set is_guest = coalesce(new.is_anonymous, false) where id = new.id;
  return new;
end;
$$;
revoke execute on function private.sync_guest_flag() from public, anon, authenticated;
drop trigger if exists on_auth_user_guest_change on auth.users;
create trigger on_auth_user_guest_change
  after update of is_anonymous on auth.users
  for each row when (old.is_anonymous is distinct from new.is_anonymous)
  execute function private.sync_guest_flag();

-- Guests are invisible to everyone else.
drop policy if exists hide_guests on public.profiles;
create policy hide_guests on public.profiles as restrictive for select to authenticated
  using (not is_guest or id = (select auth.uid()));

-- Guests cannot write anything others can see.
drop policy if exists guests_no_messages on public.messages;
create policy guests_no_messages on public.messages as restrictive for insert to authenticated with check (not private.is_guest());
drop policy if exists guests_no_posts on public.posts;
create policy guests_no_posts on public.posts as restrictive for insert to authenticated with check (not private.is_guest());
drop policy if exists guests_no_comments on public.comments;
create policy guests_no_comments on public.comments as restrictive for insert to authenticated with check (not private.is_guest());
drop policy if exists guests_no_follows on public.follows;
create policy guests_no_follows on public.follows as restrictive for insert to authenticated with check (not private.is_guest());
drop policy if exists guests_no_likes on public.post_likes;
create policy guests_no_likes on public.post_likes as restrictive for insert to authenticated with check (not private.is_guest());

-- Community functions refuse guests.
do $$
declare
  fn record;
  definition text;
begin
  for fn in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'create_club', 'create_direct_conversation', 'create_duel', 'join_club',
      'submit_review', 'accept_answer', 'play_duel')
  loop
    definition := pg_get_functiondef(fn.oid);
    if definition not like '%private.is_guest()%' then
      execute regexp_replace(definition, '\mbegin\M',
        E'begin\n  if private.is_guest() then raise exception ''Create a free account to use this feature.''; end if;', 'i');
    end if;
  end loop;
end;
$$;

-- The weekly league never lists guests (except yourself).
create or replace function public.get_weekly_league()
returns table (user_id uuid, name text, username text, avatar_url text, weekly_xp integer, is_me boolean)
language sql stable security definer set search_path = ''
as $$
  with me as (select (select auth.uid()) as id),
  week as (select date_trunc('week', now())::date as start),
  totals as (
    select d.user_id, sum(d.xp)::integer as xp
    from public.daily_xp d, week
    where d.day >= week.start
    group by d.user_id
  ),
  candidates as (
    select id as user_id from me
    union select f.following_id from public.follows f, me where f.follower_id = me.id
    union select t.user_id from (
      select totals.user_id from totals join public.profiles g on g.id = totals.user_id
      where totals.xp > 0 and not g.is_guest order by totals.xp desc limit 30) t
  )
  select p.id, coalesce(nullif(p.full_name, ''), p.username, 'Guest'), p.username, p.avatar_url,
    coalesce(t.xp, 0), p.id = (select id from me)
  from candidates c
  join public.profiles p on p.id = c.user_id
  left join totals t on t.user_id = c.user_id
  where (select id from me) is not null and private.can_see_user(p.id)
    and (not p.is_guest or p.id = (select id from me))
  order by coalesce(t.xp, 0) desc, p.username
  limit 30;
$$;
