-- Lesson 0 of every course: the alphabet with pronunciation
-- (src/features/learn/content/alphabets.ts).
insert into private.learn_entries (id, course_id)
values
  ('de-start0', 'de'), ('en-start0', 'en'), ('es-start0', 'es'), ('fr-start0', 'fr'),
  ('ru-start0', 'ru'), ('pl-start0', 'pl'), ('gsw-start0', 'gsw'), ('it-start0', 'it'),
  ('ga-start0', 'ga'), ('pt-start0', 'pt'), ('sh-start0', 'sh')
on conflict (id) do nothing;
