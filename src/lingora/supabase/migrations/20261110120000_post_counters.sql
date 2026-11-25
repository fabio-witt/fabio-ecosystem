-- Lingora – Schritt 1.3: Zähler für Likes/Kommentare, Bearbeiten von Posts

begin;

-- ---------------------------------------------------------------------------
-- 1) Zähler direkt am Post speichern
-- ---------------------------------------------------------------------------
-- Bisher hat die App ALLE Likes und Kommentare heruntergeladen, nur um sie zu
-- zählen. Jetzt pflegt die Datenbank die Zahlen selbst per Trigger.
alter table public.posts
  add column if not exists like_count integer not null default 0,
  add column if not exists comment_count integer not null default 0;

update public.posts p
set like_count = (select count(*) from public.post_likes l where l.post_id = p.id),
    comment_count = (select count(*) from public.comments c where c.post_id = p.id);

create or replace function private.update_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create or replace function private.update_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

revoke execute on function private.update_post_like_count() from public, anon, authenticated;
revoke execute on function private.update_post_comment_count() from public, anon, authenticated;

drop trigger if exists post_likes_count on public.post_likes;
create trigger post_likes_count
  after insert or delete on public.post_likes
  for each row execute function private.update_post_like_count();

drop trigger if exists comments_count on public.comments;
create trigger comments_count
  after insert or delete on public.comments
  for each row execute function private.update_post_comment_count();

-- ---------------------------------------------------------------------------
-- 2) Zähler dürfen nicht vom Client gesetzt werden
-- ---------------------------------------------------------------------------
-- Ohne diese Einschränkung könnte man sich beim Anlegen oder Bearbeiten
-- eines Posts selbst 10'000 Likes eintragen.
revoke insert, update on public.posts from anon, authenticated;
grant insert (user_id, content, image_url) on public.posts to authenticated;
grant update (content, image_url) on public.posts to authenticated;

-- updated_at automatisch setzen, wenn der Inhalt bearbeitet wird
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update of content, image_url on public.posts
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3) Längenbegrenzung und Index
-- ---------------------------------------------------------------------------
alter table public.posts
  add constraint posts_content_length check (char_length(content) <= 5000);
alter table public.comments
  add constraint comments_content_length check (char_length(content) between 1 and 2000);

-- Für "My posts" und die Post-Liste auf Profilseiten
create index if not exists posts_user_created_idx
  on public.posts (user_id, created_at desc);

commit;
