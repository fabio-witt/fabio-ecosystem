-- Serbo-Croatian course (src/features/learn/content/sh.ts), A1 to B2.
-- Lessons can only be completed when their id is listed here.
insert into private.learn_entries (id, course_id)
values
  ('sh1', 'sh'), ('sh2', 'sh'), ('sh3', 'sh'),
  ('sh4', 'sh'), ('sh5', 'sh'), ('sh6', 'sh'),
  ('sh7', 'sh'), ('sh8', 'sh'), ('sh9', 'sh'),
  ('sh10', 'sh'), ('sh11', 'sh'), ('sh12', 'sh'),
  ('sh13', 'sh'), ('sh14', 'sh'), ('sh15', 'sh'), ('sh16', 'sh'),
  ('sh17', 'sh'), ('sh18', 'sh'), ('sh19', 'sh'), ('sh20', 'sh')
on conflict (id) do nothing;

-- Make the language selectable in onboarding and on profiles.
insert into public.languages (name, native_name, language_code, flag_emoji)
select 'Serbo-Croatian', 'Srpskohrvatski / Hrvatskosrpski', 'sh', '🗣️'
where not exists (select 1 from public.languages where language_code = 'sh' or name = 'Serbo-Croatian');
