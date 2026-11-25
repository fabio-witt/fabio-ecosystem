-- Product insights without third-party trackers:
-- * app_events: a few funnel events (no content, no device fingerprints)
-- * feedback: messages from the in-app feedback form
-- * client_errors: crashes and unhandled errors from the app
-- People can only write their own rows; only admins can read, via admin_insights().

create table if not exists public.app_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade default auth.uid(),
  event text not null check (event in (
    'onboarding_started', 'onboarding_completed', 'guest_started', 'account_created',
    'lesson_completed', 'exam_started', 'exam_passed', 'daily_review_completed',
    'word_station_passed', 'plus_viewed', 'checkout_started', 'donation_viewed',
    'partner_message_started', 'feedback_sent')),
  props jsonb not null default '{}' check (pg_column_size(props) <= 1024),
  created_at timestamptz not null default now()
);
create index if not exists app_events_event_time_idx on public.app_events (event, created_at desc);
create index if not exists app_events_user_idx on public.app_events (user_id);
alter table public.app_events enable row level security;
revoke all on public.app_events from anon;
grant insert on public.app_events to authenticated;
drop policy if exists app_events_insert_own on public.app_events;
create policy app_events_insert_own on public.app_events for insert to authenticated
  with check (user_id = (select auth.uid()));

create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade default auth.uid(),
  rating smallint check (rating between 1 and 5),
  message text not null check (char_length(message) between 1 and 2000),
  context text check (char_length(context) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists feedback_time_idx on public.feedback (created_at desc);
create index if not exists feedback_user_idx on public.feedback (user_id);
alter table public.feedback enable row level security;
revoke all on public.feedback from anon;
grant insert on public.feedback to authenticated;
drop policy if exists feedback_insert_own on public.feedback;
create policy feedback_insert_own on public.feedback for insert to authenticated
  with check (user_id = (select auth.uid()));

create table if not exists public.client_errors (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null default auth.uid(),
  message text not null check (char_length(message) between 1 and 500),
  stack text check (char_length(stack) <= 4000),
  path text check (char_length(path) <= 200),
  platform text check (char_length(platform) <= 40),
  created_at timestamptz not null default now()
);
create index if not exists client_errors_time_idx on public.client_errors (created_at desc);
create index if not exists client_errors_user_idx on public.client_errors (user_id);
alter table public.client_errors enable row level security;
revoke all on public.client_errors from anon;
grant insert on public.client_errors to authenticated;
drop policy if exists client_errors_insert_own on public.client_errors;
create policy client_errors_insert_own on public.client_errors for insert to authenticated
  with check (user_id = (select auth.uid()));

-- Spam protection: at most 30 events, 5 feedback messages and 20 errors per person per hour.
create or replace function private.limit_rows_per_hour()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  recent integer;
  allowed integer := tg_argv[0]::integer;
begin
  execute format('select count(*) from %I.%I where user_id = $1 and created_at > now() - interval ''1 hour''',
    tg_table_schema, tg_table_name) into recent using new.user_id;
  if recent >= allowed then
    raise exception 'Too many requests. Please try again later.';
  end if;
  return new;
end;
$$;
revoke all on function private.limit_rows_per_hour() from public, anon, authenticated;
drop trigger if exists app_events_limit on public.app_events;
create trigger app_events_limit before insert on public.app_events for each row execute function private.limit_rows_per_hour('30');
drop trigger if exists feedback_limit on public.feedback;
create trigger feedback_limit before insert on public.feedback for each row execute function private.limit_rows_per_hour('5');
drop trigger if exists client_errors_limit on public.client_errors;
create trigger client_errors_limit before insert on public.client_errors for each row execute function private.limit_rows_per_hour('20');

-- One overview for admins: funnel, activity, money, feedback and errors.
create or replace function public.admin_insights(p_days integer default 30)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 365)));
begin
  if not exists (select 1 from private.admins where user_id = (select auth.uid())) then
    raise exception 'Only admins can see insights.';
  end if;
  return jsonb_build_object(
    'days', p_days,
    'new_accounts', (select count(*) from public.profiles where created_at >= since and not is_guest),
    'new_guests', (select count(*) from public.profiles where created_at >= since and is_guest),
    'total_accounts', (select count(*) from public.profiles where not is_guest),
    'active_learners', (select count(distinct user_id) from public.daily_xp where day >= (since)::date),
    'active_last_7_days', (select count(distinct user_id) from public.daily_xp where day >= current_date - 6),
    'lessons_done', (select coalesce(sum(lessons), 0) from public.daily_xp where day >= (since)::date),
    'events', (select coalesce(jsonb_object_agg(event, n), '{}') from (
      select event, count(*) as n from public.app_events where created_at >= since group by event) e),
    'courses', (select coalesce(jsonb_object_agg(course_id, n), '{}') from (
      select e.course_id, count(distinct lp.user_id) as n from public.learn_progress lp
      join private.learn_entries e on e.id = lp.entry_id
      where lp.last_completed_at >= since group by e.course_id) c),
    'plus_members', (select count(*) from public.plus_members where expires_at is null or expires_at > now()),
    'messages_sent', (select count(*) from public.messages where created_at >= since),
    'feedback', (select coalesce(jsonb_agg(f order by f.created_at desc), '[]') from (
      select fb.created_at, fb.rating, fb.message, fb.context, p.username
      from public.feedback fb left join public.profiles p on p.id = fb.user_id
      where fb.created_at >= since order by fb.created_at desc limit 30) f),
    'errors', (select coalesce(jsonb_agg(er order by er.last_seen desc), '[]') from (
      select message, count(*) as count, max(created_at) as last_seen, max(path) as path, max(platform) as platform
      from public.client_errors where created_at >= since group by message order by max(created_at) desc limit 30) er)
  );
end;
$$;
revoke all on function public.admin_insights(integer) from public, anon;
grant execute on function public.admin_insights(integer) to authenticated;
