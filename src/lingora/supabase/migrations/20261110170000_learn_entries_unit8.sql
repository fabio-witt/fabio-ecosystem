-- Unit 8 lessons from src/features/learn/extra-units.ts (Irish intentionally excluded).
insert into private.learn_entries (id, course_id)
select c || n, c from unnest(array['de', 'en', 'es', 'fr', 'ru', 'pl', 'gsw', 'it']) c, generate_series(31, 34) n
union all
select c || '-r8', c from unnest(array['de', 'en', 'es', 'fr', 'ru', 'pl', 'gsw', 'it']) c
on conflict (id) do nothing;
