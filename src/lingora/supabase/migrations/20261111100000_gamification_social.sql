-- Gamification, part 2: XP booster, weekly league, shared streaks,
-- friendly duels and a counter for corrections given in chats.
begin;

alter table public.user_statistics add column if not exists boost_until timestamptz;

create or replace function public.complete_lesson(p_entry_id text, p_score integer, p_time_zone text default null)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  s public.user_statistics;
  previous public.learn_progress;
  first_time boolean;
  today date;
  earned integer;
  new_stars smallint;
  day_total integer;
  goal_reached boolean := false;
  freeze_used boolean := false;
  freeze_earned boolean := false;
  zone text := private.valid_time_zone(p_time_zone);
  boosted boolean := false;
  new_boost timestamptz;
begin
  if viewer is null then raise exception 'Sign in to save your progress.'; end if;
  if p_score is null or p_score < 0 or p_score > 100 then raise exception 'Invalid score.'; end if;
  if not exists (select 1 from private.learn_entries where id = p_entry_id) then
    raise exception 'Unknown lesson.';
  end if;

  insert into public.user_statistics (user_id) values (viewer) on conflict (user_id) do nothing;
  select * into s from public.user_statistics where user_id = viewer for update;
  if zone is not null and zone is distinct from s.time_zone then
    s.time_zone := zone;
  end if;
  today := (now() at time zone s.time_zone)::date;

  select * into previous from public.learn_progress where user_id = viewer and entry_id = p_entry_id;
  first_time := not found;
  if not first_time and previous.last_completed_at > now() - interval '20 seconds' then
    raise exception 'Please wait a moment before finishing this lesson again.';
  end if;

  new_stars := case when p_score = 100 then 3 when p_score >= 80 then 2 else 1 end;
  -- 10 XP for a new lesson, 5 XP for practising it again (once per lesson per day),
  -- plus 5 XP for a perfect score.
  if first_time then
    earned := 10;
  elsif (previous.last_completed_at at time zone s.time_zone)::date = today then
    earned := 0;
  else
    earned := 5;
  end if;
  if earned > 0 and p_score = 100 then earned := earned + 5; end if;
  -- XP booster: a perfect lesson doubles XP for the next 15 minutes.
  if earned > 0 and s.boost_until is not null and s.boost_until > now() then
    earned := earned * 2;
    boosted := true;
  elsif earned > 0 and p_score = 100 then
    new_boost := now() + interval '15 minutes';
  end if;

  insert into public.learn_progress (user_id, entry_id, best_score, stars)
    values (viewer, p_entry_id, p_score, new_stars)
  on conflict (user_id, entry_id) do update set
    best_score = greatest(public.learn_progress.best_score, excluded.best_score),
    stars = greatest(public.learn_progress.stars, excluded.stars),
    completions = public.learn_progress.completions + 1,
    last_completed_at = now();

  insert into public.daily_xp (user_id, day, xp, lessons) values (viewer, today, earned, 1)
  on conflict (user_id, day) do update set
    xp = public.daily_xp.xp + excluded.xp,
    lessons = public.daily_xp.lessons + 1
  returning xp into day_total;

  if day_total >= s.daily_goal_xp and s.last_learning_date is distinct from today then
    goal_reached := true;
    if s.last_learning_date = today - 1 then
      s.current_streak := s.current_streak + 1;
    elsif s.last_learning_date = today - 2 and s.streak_freezes > 0 then
      s.streak_freezes := s.streak_freezes - 1;
      s.current_streak := s.current_streak + 1;
      freeze_used := true;
    else
      s.current_streak := 1;
    end if;
    if s.current_streak % 7 = 0 and s.streak_freezes < 2 then
      s.streak_freezes := s.streak_freezes + 1;
      freeze_earned := true;
    end if;
    s.last_learning_date := today;
    s.total_learning_days := s.total_learning_days + 1;
    s.longest_streak := greatest(s.longest_streak, s.current_streak);
  end if;

  update public.user_statistics set
    total_xp = s.total_xp + earned,
    completed_lessons = s.completed_lessons + case when first_time then 1 else 0 end,
    current_streak = s.current_streak,
    longest_streak = s.longest_streak,
    last_learning_date = s.last_learning_date,
    total_learning_days = s.total_learning_days,
    streak_freezes = s.streak_freezes,
    time_zone = s.time_zone,
    boost_until = coalesce(new_boost, s.boost_until),
    updated_at = now()
  where user_id = viewer;

  return jsonb_build_object(
    'earned_xp', earned,
    'stars', new_stars,
    'first_completion', first_time,
    'new_best', first_time or p_score > previous.best_score,
    'daily_xp', day_total,
    'daily_goal_xp', s.daily_goal_xp,
    'goal_reached', goal_reached,
    'streak', private.effective_streak(s, today),
    'freeze_used', freeze_used,
    'freeze_earned', freeze_earned,
    'total_xp', s.total_xp + earned,
    'boosted', boosted,
    'boost_until', coalesce(new_boost, case when s.boost_until > now() then s.boost_until end)
  );
end;
$$;

-- Corrections this user has sent in chats (for the "Helpful" badge).
create or replace function public.count_my_corrections()
returns integer language sql stable security definer set search_path = ''
as $$
  select count(*)::integer from public.messages
  where sender_id = (select auth.uid()) and corrects_id is not null;
$$;

-- This week's XP for me, the people I follow and the most active learners.
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
    union select t.user_id from (select user_id from totals where xp > 0 order by xp desc limit 30) t
  )
  select p.id, coalesce(nullif(p.full_name, ''), p.username), p.username, p.avatar_url,
    coalesce(t.xp, 0), p.id = (select id from me)
  from candidates c
  join public.profiles p on p.id = c.user_id
  left join totals t on t.user_id = c.user_id
  where (select id from me) is not null and private.can_see_user(p.id)
  order by coalesce(t.xp, 0) desc, p.username
  limit 30;
$$;

-- Days in a row on which both people finished at least one lesson.
create or replace function public.get_shared_streak(p_partner uuid)
returns integer language plpgsql stable security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  check_day date := current_date;
  streak integer := 0;
begin
  if viewer is null or p_partner is null or p_partner = viewer or not private.can_see_user(p_partner) then
    return 0;
  end if;
  if not exists (
    select 1 from public.follows
    where (follower_id = viewer and following_id = p_partner) or (follower_id = p_partner and following_id = viewer)
  ) then
    return 0;
  end if;
  -- Today may still be in progress, so a streak can end yesterday.
  if not (exists (select 1 from public.daily_xp where user_id = viewer and daily_xp.day = current_date and lessons > 0)
      and exists (select 1 from public.daily_xp where user_id = p_partner and daily_xp.day = current_date and lessons > 0)) then
    check_day := current_date - 1;
  end if;
  loop
    exit when not exists (select 1 from public.daily_xp d where d.user_id = viewer and d.day = check_day and d.lessons > 0)
      or not exists (select 1 from public.daily_xp d where d.user_id = p_partner and d.day = check_day and d.lessons > 0)
      or streak >= 365;
    streak := streak + 1;
    check_day := check_day - 1;
  end loop;
  return streak;
end;
$$;

-- Friendly duels: both players answer the same five questions.
create table if not exists public.duels (
  id uuid primary key default gen_random_uuid(),
  course_id text not null check (char_length(course_id) between 1 and 40),
  seed integer not null,
  challenger_id uuid not null references public.profiles(id) on delete cascade,
  opponent_id uuid not null references public.profiles(id) on delete cascade,
  challenger_score smallint not null check (challenger_score between 0 and 100),
  opponent_score smallint check (opponent_score between 0 and 100),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (challenger_id <> opponent_id)
);
create index if not exists duels_challenger_idx on public.duels (challenger_id, created_at desc);
create index if not exists duels_opponent_idx on public.duels (opponent_id, created_at desc);
alter table public.duels enable row level security;
drop policy if exists duels_players_read on public.duels;
create policy duels_players_read on public.duels for select to authenticated
  using ((select auth.uid()) in (challenger_id, opponent_id));

create or replace function public.create_duel(p_opponent uuid, p_course text, p_seed integer, p_score integer)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  new_id uuid;
begin
  if viewer is null then raise exception 'Sign in to start a duel.'; end if;
  if p_opponent is null or p_opponent = viewer or not private.can_see_user(p_opponent)
    or not exists (select 1 from public.profiles where id = p_opponent) then
    raise exception 'This person cannot be challenged.';
  end if;
  if p_score is null or p_score < 0 or p_score > 100 then raise exception 'Invalid score.'; end if;
  if (select count(*) from public.duels where challenger_id = viewer and created_at > now() - interval '1 day') >= 20 then
    raise exception 'You have started a lot of duels today. Try again tomorrow.';
  end if;
  insert into public.duels (course_id, seed, challenger_id, opponent_id, challenger_score)
    values (p_course, p_seed, viewer, p_opponent, p_score)
    returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.play_duel(p_duel uuid, p_score integer)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
begin
  if p_score is null or p_score < 0 or p_score > 100 then raise exception 'Invalid score.'; end if;
  update public.duels set opponent_score = p_score, completed_at = now()
    where id = p_duel and opponent_id = viewer and opponent_score is null;
  if not found then raise exception 'This duel is not waiting for you.'; end if;
end;
$$;

create or replace function public.list_my_duels()
returns table (id uuid, course_id text, seed integer, challenger_id uuid, opponent_id uuid,
  challenger_name text, opponent_name text, challenger_score smallint, opponent_score smallint,
  created_at timestamptz, completed_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select d.id, d.course_id, d.seed, d.challenger_id, d.opponent_id,
    coalesce(nullif(c.full_name, ''), c.username), coalesce(nullif(o.full_name, ''), o.username),
    d.challenger_score, d.opponent_score, d.created_at, d.completed_at
  from public.duels d
  join public.profiles c on c.id = d.challenger_id
  join public.profiles o on o.id = d.opponent_id
  where (select auth.uid()) in (d.challenger_id, d.opponent_id)
    and private.can_see_user(case when d.challenger_id = (select auth.uid()) then d.opponent_id else d.challenger_id end)
  order by d.completed_at is not null, d.created_at desc
  limit 30;
$$;

revoke all on function public.count_my_corrections(), public.get_weekly_league(), public.get_shared_streak(uuid),
  public.create_duel(uuid, text, integer, integer), public.play_duel(uuid, integer), public.list_my_duels() from public, anon;
grant execute on function public.count_my_corrections(), public.get_weekly_league(), public.get_shared_streak(uuid),
  public.create_duel(uuid, text, integer, integer), public.play_duel(uuid, integer), public.list_my_duels() to authenticated;

commit;
