begin;

create function public.find_partners_filtered(
  p_language_id bigint default null,
  p_country text default null,
  p_query text default null,
  p_limit integer default 20,
  p_offset integer default 0,
  p_level text default null,
  p_practice text default null,
  p_availability text default null
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
    where (p_language_id is null or p_language_id = any(c.native))
      and (p_level is null or exists (
        select 1 from public.user_languages ul
        where ul.user_id = c.id and ul.language_type = 'learning'
          and ul.proficiency_level = p_level and (cardinality(me.native) = 0 or ul.language_id = any(me.native))
      ))
      and (p_practice is null or p_practice = any(regexp_split_to_array(coalesce(c.practice_preference, ''), ',\s*')))
      and (p_availability is null or p_availability = any(regexp_split_to_array(coalesce(c.availability, ''), ',\s*')))
  )
  select id, full_name, username, avatar_url, city, country, bio,
    native_json, learning_json, least(score, 100)::integer,
    average, total, coalesce(active, false)
  from scored
  order by score desc, created_at desc nulls last, id
  limit least(greatest(p_limit, 1), 50) offset greatest(p_offset, 0);
$$;

revoke all on function public.find_partners_filtered(bigint,text,text,integer,integer,text,text,text) from public, anon;
grant execute on function public.find_partners_filtered(bigint,text,text,integer,integer,text,text,text) to authenticated;

alter table public.posts add column club_practice_week date;
alter table public.posts add constraint club_practice_posts_only check (
  club_practice_week is null or (club_id is not null and kind = 'post' and extract(isodow from club_practice_week) = 1)
);
create index posts_club_practice_week_idx on public.posts (club_id, club_practice_week, created_at desc)
  where club_practice_week is not null;
grant insert (club_practice_week) on public.posts to authenticated;

commit;
