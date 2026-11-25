-- Indonesian course with a focus on life in Bali as a digital nomad
-- (src/features/learn/content/id.ts), its alphabet, starter lessons and exams.
insert into public.languages (name, flag_emoji, language_code)
select 'Indonesian', '🇮🇩', 'id'
where not exists (select 1 from public.languages where language_code = 'id' or name = 'Indonesian');

insert into private.learn_entries (id, course_id)
values ('id-start0', 'id'), ('id-start1', 'id'), ('id-start2', 'id'), ('id1', 'id'), ('id2', 'id'), ('id3', 'id'), ('id-r1', 'id'), ('id4', 'id'), ('id5', 'id'), ('id6', 'id'), ('id-r2', 'id'), ('id7', 'id'), ('id8', 'id'), ('id9', 'id'), ('id-r3', 'id'), ('id10', 'id'), ('id11', 'id'), ('id12', 'id'), ('id-r4', 'id'), ('id13', 'id'), ('id14', 'id'), ('id15', 'id'), ('id-r5', 'id'), ('id16', 'id'), ('id17', 'id'), ('id18', 'id'), ('id19', 'id'), ('id-r6', 'id'), ('id-exam-A1', 'id'), ('id-exam-A2', 'id'), ('id-exam-B1', 'id')
on conflict (id) do nothing;
