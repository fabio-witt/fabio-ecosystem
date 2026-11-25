-- Group chats for clubs, voice messages, call links, meetups and scheduled exchanges.

-- ------------------------------------------------------------ Group chats
alter table public.conversations add column if not exists club_id uuid unique references public.clubs(id) on delete cascade;

-- In group chats one block must not hide the whole group: only the blocked person's messages disappear.
create or replace function private.can_see_conversation(p_conversation uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid())) and (
    exists (select 1 from public.conversations c where c.id = p_conversation and coalesce(c.is_group, false))
    or not exists (
      select 1 from public.conversation_members m
      where m.conversation_id = p_conversation and private.has_block((select auth.uid()), m.user_id)
    )
  );
$$;
create policy block_group_senders on public.messages as restrictive for select to authenticated
  using (private.can_see_user(sender_id));

-- Club members open (or create) their club's group chat.
create function public.open_club_chat(p_club uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  chat uuid;
  club_name text;
begin
  if me is null or private.is_guest() then raise exception 'Create an account to join the club chat.'; end if;
  if not exists (select 1 from public.club_members where club_id = p_club and user_id = me) then
    raise exception 'Join the club first.';
  end if;
  select id into chat from public.conversations where club_id = p_club;
  if chat is null then
    select name into club_name from public.clubs where id = p_club;
    insert into public.conversations (is_group, title, club_id, created_by)
      values (true, club_name, p_club, me)
      on conflict (club_id) do nothing
      returning id into chat;
    if chat is null then select id into chat from public.conversations where club_id = p_club; end if;
  end if;
  insert into public.conversation_members (conversation_id, user_id) values (chat, me)
    on conflict do nothing;
  return chat;
end;
$$;

-- Leaving a club also leaves its chat.
create function private.leave_club_chat()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.conversation_members m using public.conversations c
  where c.club_id = old.club_id and m.conversation_id = c.id and m.user_id = old.user_id;
  return old;
end;
$$;
create trigger club_member_left after delete on public.club_members
  for each row execute function private.leave_club_chat();

-- ------------------------------------------------- Voice messages and calls
-- voice: content is the storage path "<conversation>/<file>.<ext>" in the private "voice" bucket.
-- call: content is a room name "lingora-<16 chars>" for a free Jitsi video call.
alter table public.messages drop constraint if exists messages_message_type_check;
alter table public.messages add constraint messages_message_type_check
  check (message_type in ('text', 'image', 'system', 'correction', 'voice', 'call'));
drop policy text_or_correction_messages on public.messages;
create policy text_or_correction_messages on public.messages as restrictive for insert to authenticated
  with check (
    ((message_type is null or message_type = 'text') and corrects_id is null)
    or (message_type = 'correction' and corrects_id is not null)
    or (message_type = 'voice' and corrects_id is null
        and content ~ ('^' || conversation_id::text || '/[0-9a-f-]{36}\.(webm|m4a|mp4|ogg|wav)$'))
    or (message_type = 'call' and corrects_id is null and content ~ '^lingora-[a-z0-9]{16}$')
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voice', 'voice', false, 3145728, array['audio/webm', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/aac'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy voice_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'voice' and not private.is_guest() and private.can_post()
    and private.is_conversation_member(((storage.foldername(name))[1])::uuid, (select auth.uid()))
    and private.can_see_conversation(((storage.foldername(name))[1])::uuid)
  );
create policy voice_read on storage.objects for select to authenticated
  using (
    bucket_id = 'voice'
    and private.is_conversation_member(((storage.foldername(name))[1])::uuid, (select auth.uid()))
    and private.can_see_conversation(((storage.foldername(name))[1])::uuid)
  );
create policy voice_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'voice' and owner_id = (select auth.uid())::text);

-- -------------------------------------------------------------- Meetups
-- Scheduled group video rooms per language and level (live rooms).
create table public.meetups (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  language_id bigint references public.languages(id) on delete set null,
  level text check (level is null or level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  title text not null check (char_length(btrim(title)) between 5 and 100),
  content text not null default '' check (char_length(content) <= 1000),
  starts_at timestamptz not null,
  duration_minutes integer not null default 45 check (duration_minutes between 15 and 180),
  capacity integer not null default 8 check (capacity between 2 and 50),
  attendee_count integer not null default 0,
  room text not null default ('lingora-' || substr(md5(gen_random_uuid()::text), 1, 16)),
  created_at timestamptz not null default now(),
  user_id uuid generated always as (host_id) stored
);
create index meetups_upcoming_idx on public.meetups (starts_at);
create index meetups_host_idx on public.meetups (host_id);
create index meetups_language_idx on public.meetups (language_id);
create table public.meetup_attendees (
  meetup_id uuid not null references public.meetups(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (meetup_id, user_id)
);
create index meetup_attendees_user_idx on public.meetup_attendees (user_id);
alter table public.meetups enable row level security;
alter table public.meetup_attendees enable row level security;
revoke all on public.meetups, public.meetup_attendees from anon, authenticated;
-- The room name stays secret; attendees get it through meetup_room().
grant select (id, host_id, language_id, level, title, content, starts_at, duration_minutes, capacity, attendee_count, created_at)
  on public.meetups to authenticated;
grant insert (language_id, level, title, content, starts_at, duration_minutes, capacity) on public.meetups to authenticated;
grant delete on public.meetups to authenticated;
grant select, insert (meetup_id), delete on public.meetup_attendees to authenticated;

create policy meetups_read on public.meetups for select to authenticated using (private.can_see_user(host_id));
create policy meetups_insert on public.meetups for insert to authenticated
  with check (host_id = (select auth.uid()) and not private.is_guest() and private.can_post()
    and starts_at > now() and starts_at < now() + interval '60 days');
create policy meetups_delete on public.meetups for delete to authenticated using (host_id = (select auth.uid()));
create policy meetup_attendees_read on public.meetup_attendees for select to authenticated
  using (user_id = (select auth.uid()) or exists (select 1 from public.meetups m where m.id = meetup_id and m.host_id = (select auth.uid())));
create policy meetup_attendees_join on public.meetup_attendees for insert to authenticated
  with check (user_id = (select auth.uid()) and not private.is_guest()
    and exists (select 1 from public.meetups m where m.id = meetup_id and m.starts_at + make_interval(mins => m.duration_minutes) > now()));
create policy meetup_attendees_leave on public.meetup_attendees for delete to authenticated using (user_id = (select auth.uid()));

create trigger moderate_meetups before insert or update of content on public.meetups
  for each row execute function private.enforce_content_rules();
create trigger moderate_meetup_titles before insert or update of title on public.meetups
  for each row execute function private.forum_title_rules();
create trigger meetups_limit before insert on public.meetups
  for each row execute function private.limit_rows_per_hour('3');

create function private.meetup_count()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare m public.meetups;
begin
  if tg_op = 'INSERT' then
    select * into m from public.meetups where id = new.meetup_id for update;
    if m.attendee_count >= m.capacity then raise exception 'This meetup is full.'; end if;
    update public.meetups set attendee_count = attendee_count + 1 where id = new.meetup_id;
    return new;
  end if;
  update public.meetups set attendee_count = greatest(attendee_count - 1, 0) where id = old.meetup_id;
  return old;
end;
$$;
create trigger meetup_count_join before insert on public.meetup_attendees for each row execute function private.meetup_count();
create trigger meetup_count_leave after delete on public.meetup_attendees for each row execute function private.meetup_count();

-- The video room opens 15 minutes before the start, for the host and attendees.
create function public.meetup_room(p_meetup uuid)
returns text language plpgsql stable security definer set search_path = ''
as $$
declare m public.meetups;
begin
  select * into m from public.meetups where id = p_meetup;
  if m.id is null then raise exception 'Meetup not found.'; end if;
  if m.host_id <> auth.uid() and not exists (select 1 from public.meetup_attendees where meetup_id = p_meetup and user_id = auth.uid()) then
    raise exception 'Join the meetup first.';
  end if;
  if now() < m.starts_at - interval '15 minutes' then raise exception 'The room opens 15 minutes before the start.'; end if;
  if now() > m.starts_at + make_interval(mins => m.duration_minutes + 30) then raise exception 'This meetup is over.'; end if;
  return m.room;
end;
$$;

-- ------------------------------------------------- Scheduled exchanges
-- Two chat partners agree on a time for a language exchange call.
create table public.exchange_sessions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  proposer_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  minutes integer not null default 30 check (minutes in (15, 30, 45, 60, 90)),
  topic text not null default '' check (char_length(topic) <= 200),
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'declined', 'cancelled')),
  room text not null default ('lingora-' || substr(md5(gen_random_uuid()::text), 1, 16)),
  created_at timestamptz not null default now(),
  user_id uuid generated always as (proposer_id) stored
);
create index exchange_sessions_conversation_idx on public.exchange_sessions (conversation_id, starts_at);
create index exchange_sessions_proposer_idx on public.exchange_sessions (proposer_id);
alter table public.exchange_sessions enable row level security;
revoke all on public.exchange_sessions from anon, authenticated;
grant select on public.exchange_sessions to authenticated;
grant insert (conversation_id, starts_at, minutes, topic) on public.exchange_sessions to authenticated;
create policy exchange_read on public.exchange_sessions for select to authenticated
  using (private.is_conversation_member(conversation_id, (select auth.uid())) and private.can_see_conversation(conversation_id));
create policy exchange_insert on public.exchange_sessions for insert to authenticated
  with check (proposer_id = (select auth.uid()) and not private.is_guest() and private.can_post()
    and private.is_conversation_member(conversation_id, (select auth.uid())) and private.can_see_conversation(conversation_id)
    and starts_at > now() and starts_at < now() + interval '60 days');
create trigger exchange_limit before insert on public.exchange_sessions
  for each row execute function private.limit_rows_per_hour('10');
create function private.check_text_field()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare value text := to_jsonb(new) ->> tg_argv[0];
begin
  if value is not null and exists (
    select 1 from private.blocked_text_patterns
    where regexp_replace(normalize(value, NFKC), '\s+', ' ', 'g') ~* pattern
  ) then
    raise exception 'This content could not be published. Please review the Community Guidelines.';
  end if;
  return new;
end;
$$;
revoke all on function private.check_text_field() from public, anon, authenticated;
create trigger moderate_exchange_topic before insert on public.exchange_sessions
  for each row execute function private.check_text_field('topic');

create function public.respond_exchange(p_session uuid, p_status text)
returns void language plpgsql security definer set search_path = ''
as $$
declare s public.exchange_sessions;
begin
  select * into s from public.exchange_sessions where id = p_session for update;
  if s.id is null or not private.is_conversation_member(s.conversation_id, auth.uid()) then raise exception 'Session not found.'; end if;
  if p_status = 'cancelled' then
    update public.exchange_sessions set status = 'cancelled' where id = p_session;
  elsif p_status in ('accepted', 'declined') then
    if s.proposer_id = auth.uid() then raise exception 'Your partner answers the proposal.'; end if;
    if s.status <> 'proposed' then raise exception 'This proposal was already answered.'; end if;
    update public.exchange_sessions set status = p_status where id = p_session;
  else
    raise exception 'Unknown answer.';
  end if;
end;
$$;

revoke all on function public.open_club_chat(uuid), public.meetup_room(uuid), public.respond_exchange(uuid, text) from public, anon;
grant execute on function public.open_club_chat(uuid), public.meetup_room(uuid), public.respond_exchange(uuid, text) to authenticated;
revoke all on function private.leave_club_chat(), private.meetup_count() from public, anon, authenticated;
