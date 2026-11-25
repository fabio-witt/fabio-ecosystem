-- European Portuguese course (src/features/learn/content/pt.ts), adapted
-- from the LERNWERK Portuguese material. Lessons can only be completed when
-- their id is listed here.
insert into private.learn_entries (id, course_id)
values
  ('pt1', 'pt'), ('pt2', 'pt'), ('pt3', 'pt'), ('pt-r1', 'pt'),
  ('pt4', 'pt'), ('pt5', 'pt'), ('pt6', 'pt'), ('pt-r2', 'pt'),
  ('pt7', 'pt'), ('pt8', 'pt'), ('pt9', 'pt'), ('pt-r3', 'pt'),
  ('pt10', 'pt'), ('pt11', 'pt'), ('pt12', 'pt'), ('pt-r4', 'pt'),
  ('pt13', 'pt'), ('pt14', 'pt'), ('pt15', 'pt'), ('pt16', 'pt'), ('pt-r5', 'pt'),
  ('pt17', 'pt'), ('pt18', 'pt'), ('pt19', 'pt'), ('pt20', 'pt'), ('pt-r6', 'pt')
on conflict (id) do nothing;
