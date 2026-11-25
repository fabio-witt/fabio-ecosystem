-- "Time and routine" (A2) unit for every course: three lessons each.
insert into private.learn_entries (id, course_id)
select id, split_part(id, '-', 1) from unnest(array[
  'en-routine-1', 'en-routine-2', 'en-routine-3',
  'de-routine-1', 'de-routine-2', 'de-routine-3',
  'es-routine-1', 'es-routine-2', 'es-routine-3',
  'fr-routine-1', 'fr-routine-2', 'fr-routine-3',
  'it-routine-1', 'it-routine-2', 'it-routine-3',
  'ru-routine-1', 'ru-routine-2', 'ru-routine-3',
  'pl-routine-1', 'pl-routine-2', 'pl-routine-3',
  'gsw-routine-1', 'gsw-routine-2', 'gsw-routine-3',
  'ga-routine-1', 'ga-routine-2', 'ga-routine-3',
  'pt-routine-1', 'pt-routine-2', 'pt-routine-3',
  'sh-routine-1', 'sh-routine-2', 'sh-routine-3',
  'id-routine-1', 'id-routine-2', 'id-routine-3'
]) id
on conflict (id) do nothing;
