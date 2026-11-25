-- Audit follow-up (Supabase advisors, 2026-11-12):
-- 1. RLS policies call auth.uid() once per statement instead of once per row.
-- 2. Every foreign key gets a covering index.

do $$
declare
  p record;
  new_qual text;
  new_check text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (qual ~ 'auth\.uid\(\)' or with_check ~ 'auth\.uid\(\)')
  loop
    -- Leave calls that are already wrapped in a sub-select untouched.
    new_qual := regexp_replace(regexp_replace(p.qual, '\(\s*select\s+auth\.uid\(\)\s*(as\s+uid)?\s*\)', '__UID__', 'gi'),
      'auth\.uid\(\)', '(select auth.uid())', 'g');
    new_qual := replace(new_qual, '__UID__', '(select auth.uid())');
    new_check := regexp_replace(regexp_replace(p.with_check, '\(\s*select\s+auth\.uid\(\)\s*(as\s+uid)?\s*\)', '__UID__', 'gi'),
      'auth\.uid\(\)', '(select auth.uid())', 'g');
    new_check := replace(new_check, '__UID__', '(select auth.uid())');
    if new_qual is distinct from p.qual or new_check is distinct from p.with_check then
      execute format('alter policy %I on %I.%I %s %s', p.policyname, p.schemaname, p.tablename,
        case when new_qual is not null then format('using (%s)', new_qual) else '' end,
        case when new_check is not null then format('with check (%s)', new_check) else '' end);
    end if;
  end loop;
end;
$$;

create index if not exists content_reports_subject_idx on private.content_reports (subject_id);
create index if not exists suspensions_created_by_idx on private.suspensions (created_by);
create index if not exists activity_inbox_actor_idx on public.activity_inbox (actor_id);
create index if not exists clubs_created_by_idx on public.clubs (created_by);
create index if not exists clubs_language_idx on public.clubs (language_id);
create index if not exists comments_user_idx on public.comments (user_id);
create index if not exists conversations_created_by_idx on public.conversations (created_by);
create index if not exists learn_progress_entry_idx on public.learn_progress (entry_id);
create index if not exists messages_corrects_idx on public.messages (corrects_id);
create index if not exists messages_sender_idx on public.messages (sender_id);
create index if not exists notifications_actor_idx on public.notifications (actor_id);
create index if not exists post_likes_user_idx on public.post_likes (user_id);
create index if not exists posts_accepted_comment_idx on public.posts (accepted_comment_id);
create index if not exists posts_language_idx on public.posts (language_id);
create index if not exists user_languages_language_idx on public.user_languages (language_id);
create index if not exists user_lesson_progress_lesson_idx on public.user_lesson_progress (lesson_id);
