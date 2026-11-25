-- Chat upgrade: one-query chat list with unread counts, message corrections,
-- and cleanup of duplicate one-to-one conversations created before 2026-11-10.
begin;

-- Merge duplicate direct conversations into the oldest one per pair.
do $$
declare r record;
begin
  for r in
    with pairs as (
      select c.id, c.created_at, least(a.user_id, b.user_id) as u1, greatest(a.user_id, b.user_id) as u2
      from public.conversations c
      join public.conversation_members a on a.conversation_id = c.id
      join public.conversation_members b on b.conversation_id = c.id and a.user_id < b.user_id
      where coalesce(c.is_group, false) = false
    )
    select id, first_value(id) over (partition by u1, u2 order by created_at, id) as keep from pairs
  loop
    if r.id <> r.keep then
      update public.messages set conversation_id = r.keep where conversation_id = r.id;
      delete from public.conversation_members where conversation_id = r.id;
      delete from public.conversations where id = r.id;
    end if;
  end loop;
end;
$$;

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at desc);

-- Corrections: a message of type 'correction' points at the partner's message it corrects.
alter table public.messages add column corrects_id uuid references public.messages(id) on delete set null;
alter table public.messages drop constraint messages_message_type_check;
alter table public.messages add constraint messages_message_type_check
  check (message_type in ('text', 'image', 'system', 'correction'));
grant insert (corrects_id) on public.messages to authenticated;

drop policy text_only_messages on public.messages;
create policy text_or_correction_messages on public.messages as restrictive for insert to authenticated
  with check (
    ((message_type is null or message_type = 'text') and corrects_id is null)
    or (message_type = 'correction' and corrects_id is not null)
  );

create function private.validate_correction()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.corrects_id is not null and not exists (
    select 1 from public.messages o
    where o.id = new.corrects_id
      and o.conversation_id = new.conversation_id
      and o.sender_id <> new.sender_id
      and coalesce(o.message_type, 'text') = 'text'
  ) then
    raise exception 'You can only correct your partner''s messages in this chat.';
  end if;
  return new;
end;
$$;
create trigger validate_correction before insert on public.messages
  for each row execute function private.validate_correction();

-- Chat list with partner, last message and unread count. Runs with the caller's
-- rights, so membership and block policies apply.
create function public.get_my_chats()
returns table (
  conversation_id uuid, partner_id uuid, partner_name text, partner_username text,
  partner_avatar text, partner_country text, last_message text, last_message_type text,
  last_sender_id uuid, last_message_at timestamptz, unread_count integer
)
language sql stable set search_path = ''
as $$
  select c.id, p.id, coalesce(nullif(p.full_name, ''), p.username, 'Lingora user'), p.username,
    p.avatar_url, p.country, lm.content, lm.message_type, lm.sender_id,
    coalesce(lm.created_at, c.created_at),
    (select count(*) from public.messages u
      where u.conversation_id = c.id and u.sender_id <> me.user_id
        and u.created_at > coalesce(me.last_read_at, '-infinity'::timestamptz))::integer
  from public.conversation_members me
  join public.conversations c on c.id = me.conversation_id and coalesce(c.is_group, false) = false
  join public.conversation_members other on other.conversation_id = c.id and other.user_id <> me.user_id
  join public.profiles p on p.id = other.user_id
  left join lateral (
    select m.content, m.message_type, m.sender_id, m.created_at
    from public.messages m where m.conversation_id = c.id
    order by m.created_at desc limit 1
  ) lm on true
  where me.user_id = (select auth.uid())
  order by coalesce(lm.created_at, c.created_at) desc;
$$;

revoke all on function private.validate_correction() from public, anon, authenticated;
revoke all on function public.get_my_chats() from public, anon;
grant execute on function public.get_my_chats() to authenticated;

commit;
