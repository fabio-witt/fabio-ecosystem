begin;

-- Storage metadata is read here. Actual object removal always uses the Storage API.
create function public.account_deletion_objects(p_user_id uuid)
returns table (bucket_id text, name text)
language sql stable security definer set search_path = ''
as $$
  select o.bucket_id, o.name from storage.objects o
  where o.owner_id = p_user_id::text or o.owner = p_user_id
     or (o.bucket_id in ('avatars', 'post-images') and split_part(o.name, '/', 1) = p_user_id::text)
  order by o.bucket_id, o.name
  limit 100;
$$;

-- Auth and database records are removed in one transaction. If a foreign key
-- in the live schema rejects deletion, no database records are lost.
create function public.erase_lingora_account(p_user_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  perform 1 from auth.users where id = p_user_id for update;
  if not found then return; end if;

  if exists (select 1 from public.account_deletion_objects(p_user_id)) then
    raise exception 'Storage cleanup is incomplete.';
  end if;

  delete from private.content_reports where reporter_id = p_user_id or subject_id = p_user_id;
  delete from public.notifications where user_id = p_user_id or actor_id = p_user_id;
  delete from public.messages where sender_id = p_user_id;
  delete from public.conversation_members where user_id = p_user_id;
  update public.conversations set created_by = null where created_by = p_user_id;
  delete from public.follows where follower_id = p_user_id or following_id = p_user_id;
  delete from public.comments where user_id = p_user_id
    or post_id in (select id from public.posts where user_id = p_user_id);
  delete from public.post_likes where user_id = p_user_id
    or post_id in (select id from public.posts where user_id = p_user_id);
  delete from public.posts where user_id = p_user_id;
  delete from public.matching_preferences where user_id = p_user_id;
  delete from public.user_lesson_progress where user_id = p_user_id;
  delete from public.user_languages where user_id = p_user_id;
  delete from public.user_statistics where user_id = p_user_id;
  delete from public.profiles where id = p_user_id;
  delete from auth.users where id = p_user_id;
end;
$$;

revoke all on function public.account_deletion_objects(uuid), public.erase_lingora_account(uuid)
  from public, anon, authenticated;
grant execute on function public.account_deletion_objects(uuid), public.erase_lingora_account(uuid)
  to service_role;

commit;
