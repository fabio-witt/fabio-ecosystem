-- Level exams (src/features/learn/exams.ts): one per course and CEFR level.
-- A level badge needs a passed exam (best score of at least 80 %).
insert into private.learn_entries (id, course_id)
values ('de-exam-A1', 'de'), ('de-exam-A2', 'de'), ('de-exam-B1', 'de'), ('de-exam-B2', 'de'), ('de-exam-C1', 'de'), ('de-exam-C2', 'de'), ('en-exam-A1', 'en'), ('en-exam-A2', 'en'), ('en-exam-B1', 'en'), ('en-exam-B2', 'en'), ('en-exam-C1', 'en'), ('en-exam-C2', 'en'), ('es-exam-A1', 'es'), ('es-exam-A2', 'es'), ('es-exam-B1', 'es'), ('es-exam-B2', 'es'), ('es-exam-C1', 'es'), ('es-exam-C2', 'es'), ('fr-exam-A1', 'fr'), ('fr-exam-A2', 'fr'), ('fr-exam-B1', 'fr'), ('fr-exam-B2', 'fr'), ('fr-exam-C1', 'fr'), ('fr-exam-C2', 'fr'), ('ru-exam-A1', 'ru'), ('ru-exam-A2', 'ru'), ('ru-exam-B1', 'ru'), ('ru-exam-B2', 'ru'), ('ru-exam-C1', 'ru'), ('ru-exam-C2', 'ru'), ('pl-exam-A1', 'pl'), ('pl-exam-A2', 'pl'), ('pl-exam-B1', 'pl'), ('pl-exam-B2', 'pl'), ('pl-exam-C1', 'pl'), ('pl-exam-C2', 'pl'), ('gsw-exam-A1', 'gsw'), ('gsw-exam-A2', 'gsw'), ('gsw-exam-B1', 'gsw'), ('gsw-exam-B2', 'gsw'), ('gsw-exam-C1', 'gsw'), ('gsw-exam-C2', 'gsw'), ('it-exam-A1', 'it'), ('it-exam-A2', 'it'), ('it-exam-B1', 'it'), ('it-exam-B2', 'it'), ('it-exam-C1', 'it'), ('it-exam-C2', 'it'), ('ga-exam-A1', 'ga'), ('ga-exam-A2', 'ga'), ('pt-exam-A1', 'pt'), ('pt-exam-A2', 'pt'), ('pt-exam-B1', 'pt'), ('pt-exam-B2', 'pt'), ('sh-exam-A1', 'sh'), ('sh-exam-A2', 'sh'), ('sh-exam-B1', 'sh')
on conflict (id) do nothing;

-- Profiles show badges from completed entries; an exam only counts when passed.
create or replace function public.get_completed_entries(p_user uuid)
returns setof text language sql stable security definer set search_path = ''
as $$
  select lp.entry_id from public.learn_progress lp
  where lp.user_id = p_user
    and (select auth.uid()) is not null
    and private.can_see_user(p_user)
    and (lp.entry_id not like '%-exam-%' or lp.best_score >= 80);
$$;
