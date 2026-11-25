-- Profile photos are allowed again. Post and chat images stay paused
-- (see 20261110140000_release_safety.sql).
--
-- A profile photo must be an image the user uploaded to their own folder in
-- the public avatars bucket, so no outside image address can be set.

drop trigger if exists pause_profile_images on public.profiles;

create or replace function private.require_own_avatar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated'
     and new.avatar_url is not null
     and new.avatar_url is distinct from old.avatar_url
     and new.avatar_url not like '%/storage/v1/object/public/avatars/' || auth.uid()::text || '/%' then
    raise exception 'Profile photos must be uploaded in Lingora.';
  end if;
  return new;
end;
$$;

create trigger require_own_avatar before update of avatar_url on public.profiles
  for each row execute function private.require_own_avatar();

drop policy if exists pause_user_image_uploads on storage.objects;
drop policy if exists pause_user_image_overwrites on storage.objects;

create policy pause_user_image_uploads on storage.objects as restrictive for insert to authenticated, anon
  with check (bucket_id not in ('post-images', 'chat-images'));
create policy pause_user_image_overwrites on storage.objects as restrictive for update to authenticated, anon
  using (bucket_id not in ('post-images', 'chat-images'))
  with check (bucket_id not in ('post-images', 'chat-images'));
