-- Community extras: questions with accepted answers, language clubs, and the
-- Lingora Plus membership badge (written only by the server / payment webhook).
begin;

-- Course languages that were missing from the language list.
insert into public.languages (name, native_name, language_code, flag_emoji)
select v.name, v.native_name, v.code, v.flag
from (values ('Polish', 'Polski', 'pl', '🇵🇱'), ('Swiss German', 'Schwiizerdütsch', 'gsw', '🇨🇭'))
  as v(name, native_name, code, flag)
where not exists (select 1 from public.languages l where l.language_code = v.code or l.name = v.name);

-- ------------------------------------------------------------------ Clubs
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 3 and 60),
  description text not null default '' check (char_length(description) <= 300),
  emoji text not null default '💬' check (char_length(emoji) <= 8),
  language_id bigint references public.languages(id),
  created_by uuid references public.profiles(id) on delete set null,
  is_official boolean not null default false,
  member_count integer not null default 0,
  created_at timestamptz not null default now()
);
create table public.club_members (
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);
create index on public.club_members (user_id);

alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
revoke insert, update, delete, truncate on public.clubs, public.club_members from anon, authenticated;
revoke select on public.clubs, public.club_members from anon;
grant select on public.clubs, public.club_members to authenticated;
create policy clubs_visible on public.clubs for select to authenticated using (true);
create policy club_members_visible on public.club_members for select to authenticated
  using (private.can_see_user(user_id));

create function private.update_club_member_count()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.clubs set member_count = member_count + 1 where id = new.club_id;
  else
    update public.clubs set member_count = greatest(member_count - 1, 0) where id = old.club_id;
  end if;
  return null;
end;
$$;
create trigger club_member_count after insert or delete on public.club_members
  for each row execute function private.update_club_member_count();

-- Extend the text filter to club names and descriptions.
create or replace function private.enforce_content_rules()
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
  elsif tg_table_name = 'clubs' then
    fields := array['name', 'description'];
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
create trigger moderate_clubs before insert or update of name, description on public.clubs
  for each row execute function private.enforce_content_rules();

create function public.create_club(p_name text, p_description text, p_language_id bigint, p_emoji text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  new_id uuid;
begin
  if viewer is null then raise exception 'Sign in to create a club.'; end if;
  if (select count(*) from public.clubs where created_by = viewer and created_at > now() - interval '1 day') >= 3 then
    raise exception 'You can create up to 3 clubs per day.';
  end if;
  insert into public.clubs (name, description, language_id, emoji, created_by)
    values (trim(p_name), coalesce(trim(p_description), ''), p_language_id, coalesce(nullif(trim(p_emoji), ''), '💬'), viewer)
    returning id into new_id;
  insert into public.club_members (club_id, user_id, role) values (new_id, viewer, 'owner');
  return new_id;
end;
$$;

create function public.join_club(p_club uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Sign in to join a club.'; end if;
  if not exists (select 1 from public.clubs where id = p_club) then raise exception 'Club not found.'; end if;
  insert into public.club_members (club_id, user_id) values (p_club, auth.uid()) on conflict do nothing;
end;
$$;

create function public.leave_club(p_club uuid)
returns void language sql security definer set search_path = ''
as $$
  delete from public.club_members where club_id = p_club and user_id = (select auth.uid());
$$;

-- Official starter clubs, one per course language.
insert into public.clubs (name, description, emoji, language_id, is_official)
select v.name, v.description, v.emoji, l.id, true
from (values
  ('German learners', 'Practise German together, ask questions and share tips.', '🇩🇪', 'German'),
  ('English learners', 'Practise English together, ask questions and share tips.', '🇬🇧', 'English'),
  ('Spanish learners', 'Practise Spanish together, ask questions and share tips.', '🇪🇸', 'Spanish'),
  ('French learners', 'Practise French together, ask questions and share tips.', '🇫🇷', 'French'),
  ('Italian learners', 'Practise Italian together, ask questions and share tips.', '🇮🇹', 'Italian'),
  ('Russian learners', 'Practise Russian together, ask questions and share tips.', '🇷🇺', 'Russian'),
  ('Polish learners', 'Practise Polish together, ask questions and share tips.', '🇵🇱', 'Polish'),
  ('Züritüütsch', 'Learn Zurich German with locals and newcomers.', '🇨🇭', 'Swiss German')
) as v(name, description, emoji, language)
join public.languages l on l.name = v.language;

-- ------------------------------------------------------- Questions and club posts
alter table public.posts
  add column kind text not null default 'post' check (kind in ('post', 'question')),
  add column language_id bigint references public.languages(id),
  add column club_id uuid references public.clubs(id) on delete cascade,
  add column accepted_comment_id uuid references public.comments(id) on delete set null;
alter table public.posts add constraint posts_question_language check (kind <> 'question' or language_id is not null);
create index posts_club_created_idx on public.posts (club_id, created_at desc) where club_id is not null;
create index posts_kind_created_idx on public.posts (kind, created_at desc);
grant insert (kind, language_id, club_id) on public.posts to authenticated;

create policy club_posts_members_only on public.posts as restrictive for insert to authenticated
  with check (club_id is null or exists (
    select 1 from public.club_members m where m.club_id = posts.club_id and m.user_id = (select auth.uid())
  ));

-- The question author marks (or unmarks) the best answer.
create function public.accept_answer(p_post uuid, p_comment uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare q public.posts;
begin
  select * into q from public.posts where id = p_post for update;
  if q.id is null or q.user_id <> auth.uid() or q.kind <> 'question' then
    raise exception 'Only the person who asked can choose the best answer.';
  end if;
  if p_comment is not null and not exists (
    select 1 from public.comments c where c.id = p_comment and c.post_id = p_post and c.user_id <> q.user_id
  ) then
    raise exception 'Choose an answer from another person.';
  end if;
  update public.posts set accepted_comment_id = p_comment where id = p_post;
end;
$$;

-- -------------------------------------------------------------- Lingora Plus
create table public.plus_members (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  tier text not null default 'plus' check (tier in ('plus', 'vip')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  source text not null default 'manual' check (source in ('manual', 'app_store', 'play_store', 'promo'))
);
alter table public.plus_members enable row level security;
revoke insert, update, delete, truncate on public.plus_members from anon, authenticated;
revoke select on public.plus_members from anon;
grant select on public.plus_members to authenticated;
-- Badges are public; only the server writes memberships.
create policy plus_visible on public.plus_members for select to authenticated using (true);

revoke all on function private.update_club_member_count() from public, anon, authenticated;
revoke all on function public.create_club(text, text, bigint, text), public.join_club(uuid),
  public.leave_club(uuid), public.accept_answer(uuid, uuid) from public, anon;
grant execute on function public.create_club(text, text, bigint, text), public.join_club(uuid),
  public.leave_club(uuid), public.accept_answer(uuid, uuid) to authenticated;

commit;
