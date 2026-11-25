begin;

-- ---------------------------------------------------------------- Forum
-- Topic threads by category and language, with replies, votes, accepted
-- answers and optional corrections (HelloTalk-style "here is the corrected
-- sentence"). Same safety rules as posts: blocks, suspensions, guests read-only,
-- content filter, reports and rate limits.

create table public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  category text not null check (category in ('grammar', 'vocabulary', 'pronunciation', 'culture', 'methods', 'exchange', 'offtopic')),
  language_id bigint references public.languages(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 5 and 140),
  content text not null check (char_length(btrim(content)) between 1 and 5000),
  reply_count integer not null default 0,
  score integer not null default 0,
  accepted_reply_id uuid,
  is_pinned boolean not null default false,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);
create index forum_threads_activity_idx on public.forum_threads (is_pinned desc, last_activity_at desc);
create index forum_threads_category_idx on public.forum_threads (category, last_activity_at desc);
create index forum_threads_language_idx on public.forum_threads (language_id, last_activity_at desc);
create index forum_threads_user_idx on public.forum_threads (user_id, created_at desc);

create table public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 4000),
  correction text check (correction is null or char_length(btrim(correction)) between 1 and 2000),
  score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index forum_replies_thread_idx on public.forum_replies (thread_id, created_at);
create index forum_replies_user_idx on public.forum_replies (user_id, created_at desc);
alter table public.forum_threads add constraint forum_threads_accepted_fk
  foreign key (accepted_reply_id) references public.forum_replies(id) on delete set null;
create index forum_threads_accepted_idx on public.forum_threads (accepted_reply_id);

create table public.forum_votes (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  target_kind text not null check (target_kind in ('thread', 'reply')),
  target_id uuid not null,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (user_id, target_kind, target_id)
);
create index forum_votes_target_idx on public.forum_votes (target_kind, target_id);

alter table public.forum_threads enable row level security;
alter table public.forum_replies enable row level security;
alter table public.forum_votes enable row level security;

-- Column rights: counters, pins and accepted answers are only changed by the server.
revoke all on public.forum_threads, public.forum_replies, public.forum_votes from anon, authenticated;
grant select on public.forum_threads, public.forum_replies to authenticated;
grant insert (category, language_id, title, content) on public.forum_threads to authenticated;
grant update (title, content) on public.forum_threads to authenticated;
grant delete on public.forum_threads to authenticated;
grant insert (thread_id, content, correction) on public.forum_replies to authenticated;
grant update (content, correction) on public.forum_replies to authenticated;
grant delete on public.forum_replies to authenticated;
grant select, insert (target_kind, target_id, value), update (value), delete on public.forum_votes to authenticated;

-- Threads
create policy forum_threads_read on public.forum_threads for select to authenticated using (true);
create policy forum_threads_insert on public.forum_threads for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy forum_threads_update on public.forum_threads for update to authenticated
  using (user_id = (select auth.uid()) and not is_locked) with check (user_id = (select auth.uid()));
create policy forum_threads_delete on public.forum_threads for delete to authenticated
  using (user_id = (select auth.uid()));
create policy block_forum_threads on public.forum_threads as restrictive for select to authenticated
  using (private.can_see_user(user_id));
create policy guests_no_forum_threads on public.forum_threads as restrictive for insert to authenticated
  with check (not private.is_guest());
create policy suspended_forum_threads on public.forum_threads as restrictive for insert to authenticated
  with check (private.can_post());

-- Replies
create policy forum_replies_read on public.forum_replies for select to authenticated
  using (exists (select 1 from public.forum_threads t where t.id = thread_id));
create policy forum_replies_insert on public.forum_replies for insert to authenticated
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.forum_threads t where t.id = thread_id and not t.is_locked));
create policy forum_replies_update on public.forum_replies for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy forum_replies_delete on public.forum_replies for delete to authenticated
  using (user_id = (select auth.uid()));
create policy block_forum_replies on public.forum_replies as restrictive for select to authenticated
  using (private.can_see_user(user_id));
create policy guests_no_forum_replies on public.forum_replies as restrictive for insert to authenticated
  with check (not private.is_guest());
create policy suspended_forum_replies on public.forum_replies as restrictive for insert to authenticated
  with check (private.can_post());

-- Votes: only your own, never on your own content.
create policy forum_votes_own on public.forum_votes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy guests_no_forum_votes on public.forum_votes as restrictive for insert to authenticated
  with check (not private.is_guest());

-- Content filter, rate limits and updated_at
create trigger moderate_forum_threads before insert or update of content on public.forum_threads
  for each row execute function private.enforce_content_rules();
create trigger moderate_forum_replies before insert or update of content on public.forum_replies
  for each row execute function private.enforce_content_rules();

create function private.forum_title_rules()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' or new.title is distinct from old.title) and exists (
    select 1 from private.blocked_text_patterns
    where regexp_replace(normalize(coalesce(new.title, ''), NFKC), '\s+', ' ', 'g') ~* pattern
  ) then
    raise exception 'This content could not be published. Please review the Community Guidelines.';
  end if;
  return new;
end;
$$;
create function private.forum_correction_rules()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.correction is not null and (tg_op = 'INSERT' or new.correction is distinct from old.correction) and exists (
    select 1 from private.blocked_text_patterns
    where regexp_replace(normalize(new.correction, NFKC), '\s+', ' ', 'g') ~* pattern
  ) then
    raise exception 'This content could not be published. Please review the Community Guidelines.';
  end if;
  return new;
end;
$$;
create trigger moderate_forum_titles before insert or update of title on public.forum_threads
  for each row execute function private.forum_title_rules();
create trigger moderate_forum_corrections before insert or update of correction on public.forum_replies
  for each row execute function private.forum_correction_rules();

create trigger forum_threads_limit before insert on public.forum_threads
  for each row execute function private.limit_rows_per_hour('6');
create trigger forum_replies_limit before insert on public.forum_replies
  for each row execute function private.limit_rows_per_hour('40');

create function private.forum_touch()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger forum_threads_touch before update of title, content on public.forum_threads
  for each row execute function private.forum_touch();
create trigger forum_replies_touch before update of content, correction on public.forum_replies
  for each row execute function private.forum_touch();

-- Reply counter and last activity
create function private.forum_reply_counter()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_threads set reply_count = reply_count + 1, last_activity_at = now() where id = new.thread_id;
  elsif tg_op = 'DELETE' then
    update public.forum_threads set reply_count = greatest(reply_count - 1, 0) where id = old.thread_id;
  end if;
  return null;
end;
$$;
create trigger forum_reply_counter after insert or delete on public.forum_replies
  for each row execute function private.forum_reply_counter();

-- Votes: valid target, not your own content, and keep the score in sync.
create function private.forum_vote_check()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare author uuid;
begin
  if new.target_kind = 'thread' then
    select user_id into author from public.forum_threads where id = new.target_id;
  else
    select user_id into author from public.forum_replies where id = new.target_id;
  end if;
  if author is null then raise exception 'This post is unavailable.'; end if;
  if author = new.user_id then raise exception 'You cannot vote for your own post.'; end if;
  return new;
end;
$$;
create trigger forum_vote_check before insert on public.forum_votes
  for each row execute function private.forum_vote_check();

create function private.forum_vote_score()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  kind text := coalesce(new.target_kind, old.target_kind);
  target uuid := coalesce(new.target_id, old.target_id);
  delta integer := coalesce(new.value, 0) - coalesce(old.value, 0);
begin
  if tg_op = 'DELETE' then delta := -old.value; end if;
  if kind = 'thread' then
    update public.forum_threads set score = score + delta where id = target;
  else
    update public.forum_replies set score = score + delta where id = target;
  end if;
  return null;
end;
$$;
create trigger forum_vote_score after insert or update of value or delete on public.forum_votes
  for each row execute function private.forum_vote_score();

-- Thread author marks the most helpful answer.
create function public.forum_accept_reply(p_thread uuid, p_reply uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.forum_threads where id = p_thread and user_id = (select auth.uid())) then
    raise exception 'Only the author can mark the best answer.';
  end if;
  if p_reply is not null and not exists (select 1 from public.forum_replies where id = p_reply and thread_id = p_thread) then
    raise exception 'This answer belongs to another thread.';
  end if;
  update public.forum_threads set accepted_reply_id = p_reply where id = p_thread;
end;
$$;

-- Admins pin or lock threads.
create function public.forum_moderate(p_thread uuid, p_pinned boolean, p_locked boolean)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'Not allowed.'; end if;
  update public.forum_threads set is_pinned = coalesce(p_pinned, is_pinned), is_locked = coalesce(p_locked, is_locked)
  where id = p_thread;
end;
$$;
revoke all on function public.forum_accept_reply(uuid, uuid), public.forum_moderate(uuid, boolean, boolean) from public, anon;
grant execute on function public.forum_accept_reply(uuid, uuid), public.forum_moderate(uuid, boolean, boolean) to authenticated;
revoke all on function private.forum_title_rules(), private.forum_correction_rules(), private.forum_touch(),
  private.forum_reply_counter(), private.forum_vote_check(), private.forum_vote_score() from public, anon, authenticated;

-- Inbox: tell thread authors about new answers.
alter table public.activity_inbox drop constraint activity_inbox_kind_check;
alter table public.activity_inbox add constraint activity_inbox_kind_check check (kind in ('message', 'reply', 'forum'));
drop policy inbox_owner_read on public.activity_inbox;
create policy inbox_owner_read on public.activity_inbox for select to authenticated
  using (user_id = (select auth.uid()) and private.can_see_user(actor_id)
    and (case kind
      when 'message' then exists (select 1 from public.conversations c where c.id = target_id)
      when 'reply' then exists (select 1 from public.posts p where p.id = target_id)
      when 'forum' then exists (select 1 from public.forum_threads t where t.id = target_id)
    end));

create function private.inbox_forum_reply()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.activity_inbox (user_id, actor_id, kind, target_id)
  select t.user_id, new.user_id, 'forum', t.id
  from public.forum_threads t where t.id = new.thread_id and t.user_id <> new.user_id
    and not private.has_block(t.user_id, new.user_id)
  on conflict (user_id, kind, target_id) do update
    set actor_id = excluded.actor_id, updated_at = now(), read_at = null;
  return new;
end;
$$;
revoke all on function private.inbox_forum_reply() from public, anon, authenticated;
create trigger activity_inbox_forum after insert on public.forum_replies
  for each row execute function private.inbox_forum_reply();

-- Reports and moderation also cover the forum.
alter table private.content_reports drop constraint content_reports_target_kind_check;
alter table private.content_reports add constraint content_reports_target_kind_check
  check (target_kind in ('profile', 'post', 'comment', 'message', 'review', 'forum_thread', 'forum_reply'));

create or replace function public.report_content(p_kind text, p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  author uuid;
  snapshot jsonb;
begin
  if viewer is null then raise exception 'Sign in to report content.'; end if;
  case p_kind
    when 'profile' then
      select p.id, to_jsonb(p) - array['created_at', 'updated_at'] into author, snapshot
      from public.profiles p where p.id = p_id;
    when 'post' then
      select user_id, jsonb_build_object('text', left(content, 3000), 'image_url', image_url)
      into author, snapshot from public.posts where id = p_id;
    when 'comment' then
      select c.user_id, jsonb_build_object('text', left(c.content, 3000)) into author, snapshot
      from public.comments c join public.posts p on p.id = c.post_id
      where c.id = p_id and private.can_see_user(p.user_id);
    when 'message' then
      select m.sender_id, jsonb_build_object('text', left(m.content, 3000)) into author, snapshot
      from public.messages m
      where m.id = p_id and exists (
        select 1 from public.conversation_members cm
        where cm.conversation_id = m.conversation_id and cm.user_id = viewer
      )
        and private.can_see_conversation(m.conversation_id);
    when 'review' then
      select r.reviewer_id, jsonb_build_object('text', r.content, 'rating', r.rating, 'tags', r.tags)
      into author, snapshot from public.partner_reviews r
      where r.id = p_id and private.review_revealed(r.reviewer_id, r.reviewee_id, r.created_at);
    when 'forum_thread' then
      select user_id, jsonb_build_object('title', title, 'text', left(content, 3000))
      into author, snapshot from public.forum_threads where id = p_id;
    when 'forum_reply' then
      select r.user_id, jsonb_build_object('text', left(r.content, 3000), 'correction', r.correction)
      into author, snapshot from public.forum_replies r join public.forum_threads t on t.id = r.thread_id
      where r.id = p_id and private.can_see_user(t.user_id);
    else raise exception 'Invalid report target.';
  end case;
  if author is null or author = viewer or not private.can_see_user(author) then
    raise exception 'This content is unavailable for reporting.';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(viewer::text, 42));
  if exists (
    select 1 from private.content_reports
    where reporter_id = viewer and target_kind = p_kind and target_id = p_id
  ) then return; end if;
  if (select count(*) from private.content_reports where reporter_id = viewer
      and created_at >= now() - interval '1 day') >= 20 then
    raise exception 'You have reached the daily report limit. Please contact support.';
  end if;
  insert into private.content_reports (reporter_id, subject_id, target_kind, target_id, reason, evidence)
    values (viewer, author, p_kind, p_id, p_reason, snapshot);
end;
$$;

create or replace function public.admin_resolve_report(p_report bigint, p_action text, p_note text default '', p_days integer default 7)
returns void language plpgsql security definer set search_path = ''
as $$
declare r private.content_reports;
begin
  if not private.is_admin() then raise exception 'Not allowed.'; end if;
  if p_action not in ('dismiss', 'remove', 'remove_and_suspend') then raise exception 'Unknown action.'; end if;
  select * into r from private.content_reports where id = p_report for update;
  if r.id is null then raise exception 'Report not found.'; end if;

  if p_action in ('remove', 'remove_and_suspend') then
    case r.target_kind
      when 'post' then delete from public.posts where id = r.target_id;
      when 'comment' then delete from public.comments where id = r.target_id;
      when 'message' then delete from public.messages where id = r.target_id;
      when 'review' then delete from public.partner_reviews where id = r.target_id;
      when 'forum_thread' then delete from public.forum_threads where id = r.target_id;
      when 'forum_reply' then delete from public.forum_replies where id = r.target_id;
      when 'profile' then
        update public.profiles set bio = null, learning_goal = null, conversation_topics = null,
          practice_preference = null, availability = null, occupation = null, avatar_url = null
        where id = r.target_id;
    end case;
  end if;

  if p_action = 'remove_and_suspend' then
    insert into private.suspensions (user_id, until, reason, created_by)
      values (r.subject_id, now() + make_interval(days => greatest(least(p_days, 3650), 1)), coalesce(p_note, ''), auth.uid())
    on conflict (user_id) do update set until = excluded.until, reason = excluded.reason,
      created_by = excluded.created_by, created_at = now();
  end if;

  update private.content_reports set reviewed_at = now(),
    resolution = p_action || case when coalesce(p_note, '') <> '' then ': ' || p_note else '' end
  where target_kind = r.target_kind and target_id = r.target_id and reviewed_at is null;
end;
$$;

-- Starter threads are added by the app's first users; nothing is seeded here.
commit;
