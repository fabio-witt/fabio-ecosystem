-- Referrals (a week of Plus for both), friend quests and classes for teachers and families.

-- ------------------------------------------------------------ Referrals
create table public.referrals (
  referred_id uuid primary key references public.profiles(id) on delete cascade,
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index referrals_referrer_idx on public.referrals (referrer_id, created_at desc);
alter table public.referrals enable row level security;
revoke all on public.referrals from anon, authenticated;
grant select on public.referrals to authenticated;
create policy referrals_own on public.referrals for select to authenticated
  using (referrer_id = (select auth.uid()) or referred_id = (select auth.uid()));

-- Gives a user `days` of Plus unless a paid or lifetime membership is active.
create function private.grant_plus_days(p_user uuid, p_days integer)
returns void language plpgsql security definer set search_path = ''
as $$
declare current_row public.plus_members;
begin
  select * into current_row from public.plus_members where user_id = p_user for update;
  if current_row.user_id is not null and current_row.source <> 'promo'
     and (current_row.expires_at is null or current_row.expires_at > now()) then
    return;
  end if;
  insert into public.plus_members (user_id, tier, source, started_at, expires_at)
    values (p_user, 'plus', 'promo', now(), now() + make_interval(days => p_days))
  on conflict (user_id) do update set
    source = 'promo', tier = 'plus',
    expires_at = greatest(coalesce(public.plus_members.expires_at, now()), now()) + make_interval(days => p_days);
end;
$$;
revoke all on function private.grant_plus_days(uuid, integer) from public, anon, authenticated;

-- A new member enters the username of the friend who invited them.
create function public.redeem_referral(p_code text)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  friend uuid;
  joined timestamptz;
begin
  if me is null or private.is_guest() then raise exception 'Create an account first.'; end if;
  select created_at into joined from public.profiles where id = me;
  if joined < now() - interval '14 days' then raise exception 'Invite codes work in the first 14 days after joining.'; end if;
  if exists (select 1 from public.referrals where referred_id = me) then raise exception 'You already used an invite code.'; end if;
  select id into friend from public.profiles
    where lower(username) = lower(btrim(p_code, ' @')) and not coalesce(is_guest, false);
  if friend is null then raise exception 'This invite code does not exist.'; end if;
  if friend = me then raise exception 'You cannot invite yourself.'; end if;
  if (select count(*) from public.referrals where referrer_id = friend and created_at > now() - interval '30 days') >= 10 then
    raise exception 'This invite code has reached its monthly limit.';
  end if;
  insert into public.referrals (referred_id, referrer_id) values (me, friend);
  perform private.grant_plus_days(me, 7);
  perform private.grant_plus_days(friend, 7);
  return 'ok';
end;
$$;

-- ------------------------------------------------------- Friend quests
-- Weekly XP of you and a chat partner (only people you share a 1:1 chat with).
create function public.friend_week(p_partner uuid)
returns table (my_xp integer, partner_xp integer)
language plpgsql stable security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  week_start date := date_trunc('week', current_date)::date;
begin
  if not exists (
    select 1 from public.conversation_members a
    join public.conversation_members b on b.conversation_id = a.conversation_id and b.user_id = p_partner
    join public.conversations c on c.id = a.conversation_id and not coalesce(c.is_group, false)
    where a.user_id = me
  ) or private.has_block(me, p_partner) then
    raise exception 'Only for your chat partners.';
  end if;
  return query select
    coalesce((select sum(xp) from public.daily_xp where user_id = me and day >= week_start), 0)::integer,
    coalesce((select sum(xp) from public.daily_xp where user_id = p_partner and day >= week_start), 0)::integer;
end;
$$;

-- -------------------------------------------------------------- Classes
-- Teachers (or parents) create a class, share a code, assign lessons and see progress.
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 3 and 80),
  course_id text not null check (char_length(course_id) between 2 and 8),
  join_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_at timestamptz not null default now(),
  user_id uuid generated always as (teacher_id) stored
);
create index classes_teacher_idx on public.classes (teacher_id);
create table public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);
create index class_members_user_idx on public.class_members (user_id);
create table public.class_assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  entry_id text not null check (char_length(entry_id) between 1 and 80),
  due_date date,
  created_at timestamptz not null default now(),
  unique (class_id, entry_id)
);
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.class_assignments enable row level security;
revoke all on public.classes, public.class_members, public.class_assignments from anon, authenticated;
grant select, delete on public.classes to authenticated;
grant insert (name, course_id) on public.classes to authenticated;
grant select, delete on public.class_members to authenticated;
grant select, delete on public.class_assignments to authenticated;
grant insert (class_id, entry_id, due_date) on public.class_assignments to authenticated;

create function private.is_class_member(p_class uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.class_members where class_id = p_class and user_id = (select auth.uid()));
$$;
create function private.is_class_teacher(p_class uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.classes where id = p_class and teacher_id = (select auth.uid()));
$$;
revoke all on function private.is_class_member(uuid), private.is_class_teacher(uuid) from public, anon;
grant execute on function private.is_class_member(uuid), private.is_class_teacher(uuid) to authenticated;

create policy classes_read on public.classes for select to authenticated
  using (teacher_id = (select auth.uid()) or private.is_class_member(id));
create policy classes_insert on public.classes for insert to authenticated
  with check (teacher_id = (select auth.uid()) and not private.is_guest() and private.can_post());
create policy classes_delete on public.classes for delete to authenticated using (teacher_id = (select auth.uid()));
create policy class_members_read on public.class_members for select to authenticated
  using (user_id = (select auth.uid()) or private.is_class_teacher(class_id));
create policy class_members_leave on public.class_members for delete to authenticated
  using (user_id = (select auth.uid()) or private.is_class_teacher(class_id));
create policy class_assignments_read on public.class_assignments for select to authenticated
  using (private.is_class_teacher(class_id) or private.is_class_member(class_id));
create policy class_assignments_write on public.class_assignments for insert to authenticated
  with check (private.is_class_teacher(class_id));
create policy class_assignments_delete on public.class_assignments for delete to authenticated
  using (private.is_class_teacher(class_id));
create trigger classes_limit before insert on public.classes
  for each row execute function private.limit_rows_per_hour('5');
create trigger moderate_class_names before insert on public.classes
  for each row execute function private.check_text_field('name');

create function public.join_class(p_code text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare me uuid := auth.uid(); target uuid;
begin
  if me is null or private.is_guest() then raise exception 'Create an account to join a class.'; end if;
  select id into target from public.classes where join_code = upper(btrim(p_code));
  if target is null then raise exception 'No class with this code.'; end if;
  if (select count(*) from public.class_members where class_id = target) >= 60 then raise exception 'This class is full.'; end if;
  insert into public.class_members (class_id, user_id) values (target, me) on conflict do nothing;
  return target;
end;
$$;

-- Teacher view: every student with their best score per assigned lesson.
create function public.class_progress(p_class uuid)
returns table (user_id uuid, name text, entry_id text, best_score integer, last_completed_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_class_teacher(p_class) then raise exception 'Only the teacher can see progress.'; end if;
  return query
    select m.user_id, coalesce(nullif(p.full_name, ''), p.username, 'Student'), a.entry_id,
      lp.best_score::integer, lp.last_completed_at
    from public.class_members m
    join public.profiles p on p.id = m.user_id
    cross join public.class_assignments a
    left join public.learn_progress lp on lp.user_id = m.user_id and lp.entry_id = a.entry_id
    where m.class_id = p_class and a.class_id = p_class
    order by 2, a.created_at;
end;
$$;

revoke all on function public.redeem_referral(text), public.friend_week(uuid), public.join_class(text), public.class_progress(uuid) from public, anon;
grant execute on function public.redeem_referral(text), public.friend_week(uuid), public.join_class(text), public.class_progress(uuid) to authenticated;
