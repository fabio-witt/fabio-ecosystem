begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table private.user_blocks (
  blocker_id uuid references public.profiles(id) on delete cascade,
  blocked_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index on private.user_blocks (blocked_id, blocker_id);

create table private.content_reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.profiles(id) on delete cascade,
  target_kind text not null check (target_kind in ('profile', 'post', 'comment', 'message')),
  target_id uuid not null,
  evidence jsonb not null,
  reason text not null check (reason in ('harassment', 'hate', 'sexual', 'violence', 'spam', 'other')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  resolution text,
  unique (reporter_id, target_kind, target_id)
);
create index on private.content_reports (created_at) where reviewed_at is null;

create table private.blocked_text_patterns (pattern text primary key);
-- Start with explicit threats and harmful requests. The moderation operator can
-- update the patterns as reports identify gaps in supported languages.
insert into private.blocked_text_patterns (pattern) values
  ('\m(i will|i''ll|im going to|i am going to) (kill|rape) you\M'),
  ('\m(ich werde dich (umbringen|vergewaltigen)|ich bringe dich um)\M'),
  ('\m(te voy a (matar|violar)|voy a (matarte|violarte))\M'),
  ('\mje vais te (tuer|violer)\M'),
  ('\mti (ucciderò|violenterò)\M'),
  ('\mя тебя (убью|изнасилую)\M'),
  ('\m(zabiję|zgwałcę) cię\M');

alter table private.user_blocks enable row level security;
alter table private.content_reports enable row level security;
alter table private.blocked_text_patterns enable row level security;

create function private.has_block(p_viewer uuid, p_other uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from private.user_blocks
    where (blocker_id = p_viewer and blocked_id = p_other)
       or (blocked_id = p_viewer and blocker_id = p_other)
  );
$$;

create function private.can_see_user(p_other uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()))
    and not private.has_block((select auth.uid()), p_other);
$$;

create function private.can_see_conversation(p_conversation uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid())) and not exists (
    select 1 from public.conversation_members m
    where m.conversation_id = p_conversation and private.has_block((select auth.uid()), m.user_id)
  );
$$;

revoke all on function private.has_block(uuid, uuid), private.can_see_user(uuid),
  private.can_see_conversation(uuid) from public, anon;
grant execute on function private.can_see_user(uuid), private.can_see_conversation(uuid) to authenticated;

create policy block_profiles on public.profiles as restrictive for select to authenticated
  using (private.can_see_user(id));
create policy block_languages on public.user_languages as restrictive for select to authenticated
  using (private.can_see_user(user_id));
create policy block_statistics on public.user_statistics as restrictive for select to authenticated
  using (private.can_see_user(user_id));
create policy block_posts on public.posts as restrictive for select to authenticated
  using (private.can_see_user(user_id));
create policy block_comments on public.comments as restrictive for select to authenticated
  using (private.can_see_user(user_id) and exists (select 1 from public.posts p where p.id = post_id));
create policy block_follows_read on public.follows as restrictive for select to authenticated
  using (private.can_see_user(follower_id) and private.can_see_user(following_id));
create policy block_follows_write on public.follows as restrictive for insert to authenticated
  with check (private.can_see_user(follower_id) and private.can_see_user(following_id));
create policy block_likes_read on public.post_likes as restrictive for select to authenticated
  using (private.can_see_user(user_id) and exists (select 1 from public.posts p where p.id = post_id));
create policy block_likes_write on public.post_likes as restrictive for insert to authenticated
  with check (exists (select 1 from public.posts p where p.id = post_id));
create policy block_comments_write on public.comments as restrictive for insert to authenticated
  with check (exists (select 1 from public.posts p where p.id = post_id));
create policy block_notifications on public.notifications as restrictive for select to authenticated
  using (private.can_see_user(actor_id));
create policy block_conversations on public.conversations as restrictive for select to authenticated
  using (private.can_see_conversation(id));
create policy block_members on public.conversation_members as restrictive for select to authenticated
  using (private.can_see_conversation(conversation_id));
create policy block_messages_read on public.messages as restrictive for select to authenticated
  using (private.can_see_conversation(conversation_id));
create policy block_messages_write on public.messages as restrictive for insert to authenticated
  with check (private.can_see_conversation(conversation_id));
create policy block_messages_edit on public.messages as restrictive for update to authenticated
  using (private.can_see_conversation(conversation_id))
  with check (private.can_see_conversation(conversation_id));

-- Reuse the existing conversation RPC while making the block check mandatory.
alter function public.create_direct_conversation(uuid) set schema private;
revoke all on function private.create_direct_conversation(uuid) from public, anon, authenticated;
create function public.create_direct_conversation(p_other_user_id uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
begin
  if not private.can_see_user(p_other_user_id) then
    raise exception 'This conversation is unavailable.';
  end if;
  return private.create_direct_conversation(p_other_user_id);
end;
$$;

create function public.block_user(p_user_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare viewer uuid := auth.uid();
begin
  if viewer is null or p_user_id is null or viewer = p_user_id then
    raise exception 'Invalid user.';
  end if;
  insert into private.user_blocks (blocker_id, blocked_id)
    values (viewer, p_user_id) on conflict do nothing;
  delete from public.follows
    where (follower_id = viewer and following_id = p_user_id)
       or (following_id = viewer and follower_id = p_user_id);
end;
$$;

create function public.unblock_user(p_user_id uuid)
returns void language sql security definer set search_path = ''
as $$
  delete from private.user_blocks where blocker_id = (select auth.uid()) and blocked_id = p_user_id;
$$;

create function public.list_blocked_users()
returns table (id uuid, name text) language sql stable security definer set search_path = ''
as $$
  select p.id, coalesce(nullif(p.full_name, ''), p.username, 'Lingora user')
  from private.user_blocks b join public.profiles p on p.id = b.blocked_id
  where b.blocker_id = (select auth.uid())
  order by b.created_at desc;
$$;

create function public.report_content(p_kind text, p_id uuid, p_reason text)
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

revoke all on function public.create_direct_conversation(uuid), public.block_user(uuid),
  public.unblock_user(uuid), public.list_blocked_users(), public.report_content(text, uuid, text)
  from public, anon;
grant execute on function public.create_direct_conversation(uuid), public.block_user(uuid),
  public.unblock_user(uuid), public.list_blocked_users(), public.report_content(text, uuid, text)
  to authenticated;

create function private.enforce_content_rules()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  fields text[];
  field text;
  current_row jsonb := to_jsonb(new);
  previous_row jsonb;
begin
  if tg_op = 'UPDATE' then previous_row := to_jsonb(old); end if;
  if tg_table_name = 'profiles' then
    fields := array['full_name', 'username', 'bio', 'city', 'country', 'interests',
      'learning_goal', 'conversation_topics', 'practice_preference', 'availability', 'occupation'];
  else
    fields := array['content'];
  end if;
  foreach field in array fields loop
    if current_row ->> field is distinct from previous_row ->> field and exists (
      select 1 from private.blocked_text_patterns
      where regexp_replace(normalize(coalesce(current_row ->> field, ''), NFKC), '\s+', ' ', 'g') ~* pattern
    ) then
      raise exception 'This content could not be published. Please review the Community Guidelines.';
    end if;
  end loop;
  return new;
end;
$$;

create trigger moderate_profiles before insert or update on public.profiles
  for each row execute function private.enforce_content_rules();
create trigger moderate_posts before insert or update of content on public.posts
  for each row execute function private.enforce_content_rules();
create trigger moderate_comments before insert or update of content on public.comments
  for each row execute function private.enforce_content_rules();
create trigger moderate_messages before insert or update of content on public.messages
  for each row execute function private.enforce_content_rules();

-- Keep existing media available for review/removal. New images are disabled
-- until a pre-publication image review path exists.
create function private.prevent_unreviewed_image()
returns trigger language plpgsql set search_path = ''
as $$
declare image text := to_jsonb(new) ->> tg_argv[0];
begin
  if current_user = 'authenticated' and image is not null then
    if tg_op = 'INSERT' or image is distinct from to_jsonb(old) ->> tg_argv[0] then
      raise exception 'New image uploads are temporarily unavailable.';
    end if;
  end if;
  return new;
end;
$$;
create trigger pause_profile_images before insert or update of avatar_url on public.profiles
  for each row execute function private.prevent_unreviewed_image('avatar_url');
create trigger pause_post_images before insert or update of image_url on public.posts
  for each row execute function private.prevent_unreviewed_image('image_url');
create policy pause_user_image_uploads on storage.objects as restrictive for insert to authenticated, anon
  with check (bucket_id not in ('avatars', 'post-images', 'chat-images'));
create policy pause_user_image_overwrites on storage.objects as restrictive for update to authenticated, anon
  using (bucket_id not in ('avatars', 'post-images', 'chat-images'))
  with check (bucket_id not in ('avatars', 'post-images', 'chat-images'));
-- The chat composer currently supports text only. Prevent a direct API caller
-- from publishing an unsupported attachment type.
create policy text_only_messages on public.messages as restrictive for insert to authenticated
  with check (message_type is null or message_type = 'text');

commit;
