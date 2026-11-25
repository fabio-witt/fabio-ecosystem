-- Learning progress, XP, daily goal and streaks are calculated on the server,
-- so they survive device changes and cannot be edited directly by clients.
begin;

-- Valid lesson ids from src/features/learn (grammarfirst.json + advanced-courses.ts).
-- Add new ids here when new lessons ship, otherwise they cannot be completed.
create table private.learn_entries (
  id text primary key,
  course_id text not null
);
alter table private.learn_entries enable row level security;

insert into private.learn_entries (id, course_id)
select c || n, c from unnest(array['de', 'en', 'es', 'fr', 'ru', 'pl', 'gsw', 'it']) c, generate_series(1, 30) n
union all
select c || '-r' || n, c from unnest(array['de', 'en', 'es', 'fr', 'ru', 'pl', 'gsw', 'it']) c, generate_series(1, 7) n
union all
select 'ga' || n, 'ga' from generate_series(1, 22) n
union all
select id, split_part(id, '-', 1) from unnest(array[
  'de-c1-indirect-report', 'de-c1-nominal-style', 'de-c2-focus-particles', 'de-c2-understatement',
  'en-c1-inversion', 'en-c1-hedging', 'en-c2-implicature', 'en-c2-negation-scope',
  'es-c1-concessive-mood', 'es-c1-por-mas-que', 'es-c2-correction-scope', 'es-c2-qualified-criticism',
  'fr-c1-avant-apres', 'fr-c1-ce-dont', 'fr-c2-focus-ne-que', 'fr-c2-diplomatic-reservations',
  'ru-c1-participle-clause', 'ru-c1-adverbial-participles', 'ru-c2-particles', 'ru-c2-attribution',
  'pl-c1-participles', 'pl-c1-relative-case', 'pl-c2-exception', 'pl-c2-diplomatic-stance',
  'gsw-c1-relative-wo', 'gsw-c1-purpose-zum', 'gsw-c2-scho-aber', 'gsw-c2-indirect-refusal',
  'it-c1-reported-conditional', 'it-c1-relative-register', 'it-c2-nonche-anziche', 'it-c2-understatement'
]) id;

alter table public.user_statistics
  add column daily_goal_xp smallint not null default 20 check (daily_goal_xp in (10, 20, 30, 50)),
  add column streak_freezes smallint not null default 0 check (streak_freezes between 0 and 2),
  add column time_zone text not null default 'UTC';

create table public.learn_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_id text not null references private.learn_entries(id),
  best_score smallint not null check (best_score between 0 and 100),
  stars smallint not null check (stars between 1 and 3),
  completions integer not null default 1,
  first_completed_at timestamptz not null default now(),
  last_completed_at timestamptz not null default now(),
  primary key (user_id, entry_id)
);

create table public.daily_xp (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  xp integer not null default 0 check (xp >= 0),
  lessons integer not null default 0 check (lessons >= 0),
  primary key (user_id, day)
);

alter table public.learn_progress enable row level security;
alter table public.daily_xp enable row level security;
revoke insert, update, delete, truncate on public.learn_progress, public.daily_xp from anon, authenticated;
revoke select on public.learn_progress, public.daily_xp from anon;
grant select on public.learn_progress, public.daily_xp to authenticated;

create policy own_learn_progress on public.learn_progress for select to authenticated
  using (user_id = (select auth.uid()));
create policy own_daily_xp on public.daily_xp for select to authenticated
  using (user_id = (select auth.uid()));

-- Statistics can only change through the functions below.
revoke insert, update, delete on public.user_statistics from anon, authenticated;

create function private.valid_time_zone(p_time_zone text)
returns text language sql stable set search_path = ''
as $$
  select name from pg_catalog.pg_timezone_names where name = p_time_zone limit 1;
$$;

-- Streak shown to the user: a missed day ends it unless a freeze covers it.
create function private.effective_streak(s public.user_statistics, p_today date)
returns integer language sql stable set search_path = ''
as $$
  select case
    when s.last_learning_date >= p_today - 1 then s.current_streak
    when s.last_learning_date = p_today - 2 and s.streak_freezes > 0 then s.current_streak
    else 0
  end;
$$;

create function public.complete_lesson(p_entry_id text, p_score integer, p_time_zone text default null)
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
    'total_xp', s.total_xp + earned
  );
end;
$$;

create function public.get_learn_summary(p_time_zone text default null)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  s public.user_statistics;
  today date;
  today_xp integer;
begin
  if viewer is null then raise exception 'Sign in to see your progress.'; end if;
  select * into s from public.user_statistics where user_id = viewer;
  if not found then
    return jsonb_build_object('streak', 0, 'longest_streak', 0, 'total_xp', 0, 'completed_lessons', 0,
      'daily_xp', 0, 'daily_goal_xp', 20, 'streak_freezes', 0, 'goal_done_today', false);
  end if;
  today := (now() at time zone coalesce(private.valid_time_zone(p_time_zone), s.time_zone))::date;
  select xp into today_xp from public.daily_xp where user_id = viewer and day = today;
  return jsonb_build_object(
    'streak', private.effective_streak(s, today),
    'longest_streak', s.longest_streak,
    'total_xp', s.total_xp,
    'completed_lessons', s.completed_lessons,
    'daily_xp', coalesce(today_xp, 0),
    'daily_goal_xp', s.daily_goal_xp,
    'streak_freezes', s.streak_freezes,
    'goal_done_today', coalesce(s.last_learning_date = today, false)
  );
end;
$$;

create function public.set_daily_goal(p_goal integer)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in to change your goal.'; end if;
  if p_goal not in (10, 20, 30, 50) then raise exception 'Choose 10, 20, 30 or 50 XP.'; end if;
  insert into public.user_statistics (user_id, daily_goal_xp) values (auth.uid(), p_goal)
  on conflict (user_id) do update set daily_goal_xp = excluded.daily_goal_xp, updated_at = now();
end;
$$;

-- One-time move of progress that earlier app versions stored on the device.
-- Only lessons without server progress are imported, each worth 10 XP.
create function public.import_learn_progress(p_scores jsonb)
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  imported integer;
begin
  if viewer is null then raise exception 'Sign in to import progress.'; end if;
  if jsonb_typeof(p_scores) is distinct from 'object' then raise exception 'Invalid progress.'; end if;
  insert into public.user_statistics (user_id) values (viewer) on conflict (user_id) do nothing;
  with incoming as (
    select key as entry_id, (value #>> '{}')::integer as score
    from jsonb_each(p_scores)
    where jsonb_typeof(value) = 'number' and (value #>> '{}') ~ '^\d{1,3}$'
  ), inserted as (
    insert into public.learn_progress (user_id, entry_id, best_score, stars)
    select viewer, i.entry_id, i.score,
      case when i.score = 100 then 3 when i.score >= 80 then 2 else 1 end
    from incoming i
    join private.learn_entries e on e.id = i.entry_id
    where i.score between 0 and 100
    on conflict (user_id, entry_id) do nothing
    returning 1
  )
  select count(*) into imported from inserted;
  update public.user_statistics set
    total_xp = total_xp + imported * 10,
    completed_lessons = completed_lessons + imported,
    updated_at = now()
  where user_id = viewer;
  return imported;
end;
$$;

revoke all on function private.valid_time_zone(text), private.effective_streak(public.user_statistics, date)
  from public, anon, authenticated;
revoke all on function public.complete_lesson(text, integer, text), public.get_learn_summary(text),
  public.set_daily_goal(integer), public.import_learn_progress(jsonb) from public, anon;
grant execute on function public.complete_lesson(text, integer, text), public.get_learn_summary(text),
  public.set_daily_goal(integer), public.import_learn_progress(jsonb) to authenticated;

commit;
