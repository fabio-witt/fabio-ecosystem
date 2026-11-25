-- Moderation: admin role, report review, content removal and temporary suspensions.
begin;

create table private.admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table private.admins enable row level security;

-- Project owner (fabiowitt@gmx.de).
insert into private.admins (user_id)
select id from public.profiles where id = 'f07b9eef-50ed-41b2-8716-78497dddc4b3'
on conflict do nothing;

create table private.suspensions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  until timestamptz not null,
  reason text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table private.suspensions enable row level security;

create function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from private.admins where user_id = (select auth.uid()));
$$;

-- True while the signed-in user is not suspended.
create function private.can_post()
returns boolean language sql stable security definer set search_path = ''
as $$
  select not exists (
    select 1 from private.suspensions where user_id = (select auth.uid()) and until > now()
  );
$$;

revoke all on function private.is_admin(), private.can_post() from public, anon;
grant execute on function private.can_post() to authenticated;

-- Suspended users cannot publish anything.
create policy suspended_posts on public.posts as restrictive for insert to authenticated with check (private.can_post());
create policy suspended_comments on public.comments as restrictive for insert to authenticated with check (private.can_post());
create policy suspended_messages on public.messages as restrictive for insert to authenticated with check (private.can_post());

create or replace function public.submit_review(p_user uuid, p_rating integer, p_content text, p_tags text[])
returns void language plpgsql security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  counts record;
begin
  if viewer is null then raise exception 'Sign in to write a review.'; end if;
  if not private.can_post() then raise exception 'Your account is temporarily restricted.'; end if;
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

create or replace function public.create_club(p_name text, p_description text, p_language_id bigint, p_emoji text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  new_id uuid;
begin
  if viewer is null then raise exception 'Sign in to create a club.'; end if;
  if not private.can_post() then raise exception 'Your account is temporarily restricted.'; end if;
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

create function public.am_i_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select private.is_admin(); $$;

create function public.admin_list_reports(p_open_only boolean default true)
returns table (
  id bigint, created_at timestamptz, target_kind text, target_id uuid, reason text, evidence jsonb,
  reviewed_at timestamptz, resolution text,
  reporter_id uuid, reporter_name text, subject_id uuid, subject_name text,
  subject_report_count integer, subject_suspended_until timestamptz
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'Not allowed.'; end if;
  return query
  select r.id, r.created_at, r.target_kind, r.target_id, r.reason, r.evidence, r.reviewed_at, r.resolution,
    r.reporter_id, coalesce(nullif(rp.full_name, ''), rp.username, 'Lingora user'),
    r.subject_id, coalesce(nullif(sp.full_name, ''), sp.username, 'Lingora user'),
    (select count(*)::integer from private.content_reports x where x.subject_id = r.subject_id),
    (select s.until from private.suspensions s where s.user_id = r.subject_id and s.until > now())
  from private.content_reports r
  left join public.profiles rp on rp.id = r.reporter_id
  left join public.profiles sp on sp.id = r.subject_id
  where not p_open_only or r.reviewed_at is null
  order by r.reviewed_at nulls first, r.created_at
  limit 200;
end;
$$;

-- p_action: 'dismiss' | 'remove' | 'remove_and_suspend'
create function public.admin_resolve_report(p_report bigint, p_action text, p_note text default '', p_days integer default 7)
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

  -- Resolve every open report about the same content.
  update private.content_reports set reviewed_at = now(),
    resolution = p_action || case when coalesce(p_note, '') <> '' then ': ' || p_note else '' end
  where target_kind = r.target_kind and target_id = r.target_id and reviewed_at is null;
end;
$$;

create function public.admin_lift_suspension(p_user uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'Not allowed.'; end if;
  delete from private.suspensions where user_id = p_user;
end;
$$;

revoke all on function public.am_i_admin(), public.admin_list_reports(boolean),
  public.admin_resolve_report(bigint, text, text, integer), public.admin_lift_suspension(uuid) from public, anon;
grant execute on function public.am_i_admin(), public.admin_list_reports(boolean),
  public.admin_resolve_report(bigint, text, text, integer), public.admin_lift_suspension(uuid) to authenticated;

commit;
