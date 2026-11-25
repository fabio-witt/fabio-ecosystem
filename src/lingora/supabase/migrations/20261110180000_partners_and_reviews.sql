-- Language partner search with a 0–100 match score, and partner reviews
-- that unlock after 50 messages (at least 15 from each person).
begin;

-- ---------------------------------------------------------------- Reviews
create table public.partner_reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  content text not null default '' check (char_length(content) <= 500),
  tags text[] not null default '{}' check (
    tags <@ array['patient', 'helpful_corrections', 'reliable', 'fun', 'great_teacher', 'good_listener']
    and cardinality(tags) <= 3
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reviewer_id, reviewee_id),
  check (reviewer_id <> reviewee_id)
);
create index on public.partner_reviews (reviewee_id, created_at desc);

alter table public.partner_reviews enable row level security;
revoke insert, update, delete, truncate on public.partner_reviews from anon, authenticated;
revoke select on public.partner_reviews from anon;
grant select on public.partner_reviews to authenticated;
-- Authors see their own reviews directly. Everything else goes through the functions below.
create policy own_reviews on public.partner_reviews for select to authenticated
  using (reviewer_id = (select auth.uid()));

-- Reuse the text filter from the release safety migration.
create trigger moderate_reviews before insert or update of content on public.partner_reviews
  for each row execute function private.enforce_content_rules();

-- Messages exchanged between two people in their shared one-to-one chats.
create function private.message_counts(p_a uuid, p_b uuid)
returns table (from_a integer, from_b integer)
language sql stable security definer set search_path = ''
as $$
  select
    count(*) filter (where m.sender_id = p_a)::integer,
    count(*) filter (where m.sender_id = p_b)::integer
  from public.messages m
  join public.conversations c on c.id = m.conversation_id and coalesce(c.is_group, false) = false
  where exists (select 1 from public.conversation_members x where x.conversation_id = c.id and x.user_id = p_a)
    and exists (select 1 from public.conversation_members y where y.conversation_id = c.id and y.user_id = p_b);
$$;

-- Double-blind: a review is shown once both people reviewed each other, or after 14 days.
create function private.review_revealed(p_reviewer uuid, p_reviewee uuid, p_created timestamptz)
returns boolean language sql stable security definer set search_path = ''
as $$
  select p_created < now() - interval '14 days' or exists (
    select 1 from public.partner_reviews r where r.reviewer_id = p_reviewee and r.reviewee_id = p_reviewer
  );
$$;

create function private.review_summary(p_user uuid)
returns table (average numeric, total integer)
language sql stable security definer set search_path = ''
as $$
  select round(avg(r.rating)::numeric, 1), count(*)::integer
  from public.partner_reviews r
  where r.reviewee_id = p_user and private.review_revealed(r.reviewer_id, r.reviewee_id, r.created_at);
$$;

create function public.get_review_status(p_user uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  counts record;
  mine public.partner_reviews;
begin
  if viewer is null then raise exception 'Sign in to see reviews.'; end if;
  select * into counts from private.message_counts(viewer, p_user);
  select * into mine from public.partner_reviews where reviewer_id = viewer and reviewee_id = p_user;
  return jsonb_build_object(
    'required_total', 50,
    'required_each', 15,
    'my_messages', counts.from_a,
    'their_messages', counts.from_b,
    'eligible', viewer <> p_user and private.can_see_user(p_user)
      and counts.from_a + counts.from_b >= 50 and counts.from_a >= 15 and counts.from_b >= 15,
    'my_review', case when mine.id is null then null else jsonb_build_object(
      'rating', mine.rating, 'content', mine.content, 'tags', mine.tags, 'updated_at', mine.updated_at) end,
    'they_reviewed_me', exists (select 1 from public.partner_reviews where reviewer_id = p_user and reviewee_id = viewer)
  );
end;
$$;

create function public.submit_review(p_user uuid, p_rating integer, p_content text, p_tags text[])
returns void language plpgsql security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  counts record;
begin
  if viewer is null then raise exception 'Sign in to write a review.'; end if;
  if p_user is null or p_user = viewer or not private.can_see_user(p_user) then
    raise exception 'This person cannot be reviewed.';
  end if;
  select * into counts from private.message_counts(viewer, p_user);
  if counts.from_a + counts.from_b < 50 or counts.from_a < 15 or counts.from_b < 15 then
    raise exception 'Exchange at least 50 messages (15 from each of you) before writing a review.';
  end if;
  insert into public.partner_reviews (reviewer_id, reviewee_id, rating, content, tags)
    values (viewer, p_user, p_rating, coalesce(trim(p_content), ''), coalesce(p_tags, '{}'))
  on conflict (reviewer_id, reviewee_id) do update set
    rating = excluded.rating, content = excluded.content, tags = excluded.tags, updated_at = now();
end;
$$;

create function public.get_profile_reviews(p_user uuid, p_limit integer default 20)
returns jsonb language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'average', s.average,
    'total', s.total,
    'reviews', coalesce((
      select jsonb_agg(row_to_json(x) order by x.created_at desc)
      from (
        select r.id, r.rating, r.content, r.tags, r.created_at,
          p.id as reviewer_id, p.full_name as reviewer_name, p.username as reviewer_username,
          p.avatar_url as reviewer_avatar
        from public.partner_reviews r
        join public.profiles p on p.id = r.reviewer_id
        where r.reviewee_id = p_user
          and private.review_revealed(r.reviewer_id, r.reviewee_id, r.created_at)
          and private.can_see_user(r.reviewer_id)
        order by r.created_at desc
        limit least(greatest(p_limit, 1), 50)
      ) x
    ), '[]'::jsonb)
  )
  from private.review_summary(p_user) s
  where (select auth.uid()) is not null and private.can_see_user(p_user);
$$;

-- Reviews can be reported like other content.
alter table private.content_reports drop constraint content_reports_target_kind_check;
alter table private.content_reports add constraint content_reports_target_kind_check
  check (target_kind in ('profile', 'post', 'comment', 'message', 'review'));

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

-- --------------------------------------------------------- Partner search
-- Runs with the caller's rights, so profile RLS and blocks apply automatically.
create function public.find_partners(
  p_language_id bigint default null,
  p_country text default null,
  p_query text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid, full_name text, username text, avatar_url text, city text, country text, bio text,
  native_languages jsonb, learning_languages jsonb, match_score integer,
  review_average numeric, review_total integer, active_recently boolean
)
language sql stable set search_path = ''
as $$
  with me as (
    select
      coalesce(array_agg(language_id) filter (where language_type = 'native'), '{}') as native,
      coalesce(array_agg(language_id) filter (where language_type = 'learning'), '{}') as learning
    from public.user_languages where user_id = (select auth.uid())
  ),
  my_profile as (
    select coalesce(interests, '{}') as interests from public.profiles where id = (select auth.uid())
  ),
  candidates as (
    select p.*,
      coalesce(array_agg(ul.language_id) filter (where ul.language_type = 'native'), '{}') as native,
      coalesce(array_agg(ul.language_id) filter (where ul.language_type = 'learning'), '{}') as learning,
      coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name, 'flag', l.flag_emoji))
        filter (where ul.language_type = 'native'), '[]') as native_json,
      coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name, 'flag', l.flag_emoji, 'level', ul.proficiency_level))
        filter (where ul.language_type = 'learning'), '[]') as learning_json
    from public.profiles p
    left join public.user_languages ul on ul.user_id = p.id
    left join public.languages l on l.id = ul.language_id
    where p.id <> (select auth.uid())
      and (p_country is null or p.country ilike p_country)
      and (p_query is null or p.full_name ilike '%' || p_query || '%' or p.username ilike '%' || p_query || '%')
    group by p.id
  ),
  scored as (
    select c.*,
      (case when c.native && me.learning then 40 else 0 end)
      + (case when c.learning && me.native then 30 else 0 end)
      + least(10, 5 * cardinality(array(
          select unnest(coalesce(c.interests, '{}')) intersect select unnest(mp.interests))))
      + (case when c.avatar_url is not null then 3 else 0 end)
      + (case when coalesce(c.bio, '') <> '' then 3 else 0 end)
      + (case when coalesce(c.learning_goal, '') <> '' then 2 else 0 end)
      + (case when s.last_learning_date >= current_date - 7 then 7 else 0 end)
      + (case when rs.average >= 4 then 5 else 0 end) as score,
      s.last_learning_date >= current_date - 7 as active,
      rs.average, rs.total
    from candidates c
    cross join me
    cross join my_profile mp
    left join public.user_statistics s on s.user_id = c.id
    cross join lateral private.review_summary(c.id) rs
    where p_language_id is null or p_language_id = any(c.native)
  )
  select id, full_name, username, avatar_url, city, country, bio,
    native_json, learning_json, least(score, 100)::integer,
    average, total, coalesce(active, false)
  from scored
  order by score desc, created_at desc nulls last, id
  limit least(greatest(p_limit, 1), 50) offset greatest(p_offset, 0);
$$;

revoke all on function private.message_counts(uuid, uuid), private.review_revealed(uuid, uuid, timestamptz)
  from public, anon, authenticated;
revoke all on function private.review_summary(uuid) from public, anon;
grant execute on function private.review_summary(uuid) to authenticated;

revoke all on function public.get_review_status(uuid), public.submit_review(uuid, integer, text, text[]),
  public.get_profile_reviews(uuid, integer),
  public.find_partners(bigint, text, text, integer, integer) from public, anon;
grant execute on function public.get_review_status(uuid), public.submit_review(uuid, integer, text, text[]),
  public.get_profile_reviews(uuid, integer),
  public.find_partners(bigint, text, text, integer, integer) to authenticated;

commit;
