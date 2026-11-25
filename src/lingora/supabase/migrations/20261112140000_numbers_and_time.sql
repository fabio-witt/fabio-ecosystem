-- "Numbers, time and days" units (src/features/learn/content/basics.ts).
insert into private.learn_entries (id, course_id)
values
  ('en-numbers', 'en'), ('en-time', 'en'), ('es-numbers', 'es'), ('es-time', 'es'),
  ('fr-numbers', 'fr'), ('fr-time', 'fr'), ('it-numbers', 'it'), ('it-time', 'it'),
  ('pt-numbers', 'pt'), ('pt-time', 'pt'), ('ru-numbers', 'ru'), ('ru-time', 'ru'),
  ('pl-numbers', 'pl'), ('pl-time', 'pl')
on conflict (id) do nothing;
