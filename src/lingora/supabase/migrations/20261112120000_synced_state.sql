-- Learner state that used to live only on one device (gems, quests, badges,
-- saved words, review schedules, current course). Each person can only read
-- and write their own rows. Size is capped so the table cannot be abused as storage.
create table if not exists public.synced_state (
  user_id uuid not null references public.profiles(id) on delete cascade,
  feature text not null check (feature in ('game', 'practice-review', 'active-course')),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, feature),
  check (pg_column_size(data) <= 262144)
);
alter table public.synced_state enable row level security;
revoke all on public.synced_state from anon;
grant select, insert, update, delete on public.synced_state to authenticated;
drop policy if exists synced_state_own on public.synced_state;
create policy synced_state_own on public.synced_state for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
