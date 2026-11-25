-- German course expansion to 100 lessons (src/features/learn/content/de-*.ts).
insert into private.learn_entries (id, course_id)
select 'de' || n, 'de' from generate_series(35, 80) n
union all
select 'de-r' || n, 'de' from generate_series(9, 16) n
on conflict (id) do nothing;
