-- "Start here" units (src/features/learn/content/starter.ts): sounds and
-- first sentences at the beginning of every course.
insert into private.learn_entries (id, course_id)
values
  ('de-start1', 'de'), ('de-start2', 'de'), ('en-start1', 'en'), ('en-start2', 'en'),
  ('es-start1', 'es'), ('es-start2', 'es'), ('fr-start1', 'fr'), ('fr-start2', 'fr'),
  ('ru-start1', 'ru'), ('ru-start2', 'ru'), ('pl-start1', 'pl'), ('pl-start2', 'pl'),
  ('gsw-start1', 'gsw'), ('gsw-start2', 'gsw'), ('it-start1', 'it'), ('it-start2', 'it'),
  ('ga-start1', 'ga'), ('ga-start2', 'ga'), ('pt-start1', 'pt'), ('pt-start2', 'pt'),
  ('sh-start1', 'sh'), ('sh-start2', 'sh')
on conflict (id) do nothing;
