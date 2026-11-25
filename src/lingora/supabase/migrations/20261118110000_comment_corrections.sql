-- HelloTalk-style corrections on posts: a comment can carry a corrected version of the post.
alter table public.comments add column if not exists correction text
  check (correction is null or char_length(btrim(correction)) between 1 and 2000);
create trigger moderate_comment_corrections before insert or update of correction on public.comments
  for each row execute function private.forum_correction_rules();
