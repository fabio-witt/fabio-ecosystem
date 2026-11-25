-- C1 and C2 reading/listening workshops in src/features/learn/content/de-workshops.ts.
insert into private.learn_entries (id, course_id)
values ('de-r17', 'de'), ('de-r18', 'de'), ('de-r19', 'de'), ('de-r20', 'de')
on conflict (id) do nothing;
