begin;

create table public.activity_inbox (
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('message', 'reply')),
  target_id uuid not null,
  updated_at timestamptz not null default now(),
  read_at timestamptz,
  primary key (user_id, kind, target_id)
);
create index activity_inbox_recent on public.activity_inbox (user_id, updated_at desc);
alter table public.activity_inbox enable row level security;
revoke all on public.activity_inbox from anon, authenticated;
grant select, update (read_at) on public.activity_inbox to authenticated;
create policy inbox_owner_read on public.activity_inbox for select to authenticated
  using (user_id = (select auth.uid()) and private.can_see_user(actor_id)
    and (case kind
      when 'message' then exists (select 1 from public.conversations c where c.id = target_id)
      when 'reply' then exists (select 1 from public.posts p where p.id = target_id)
    end));
create policy inbox_owner_update on public.activity_inbox for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create function private.inbox_message()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.activity_inbox (user_id, actor_id, kind, target_id)
  select distinct m.user_id, new.sender_id, 'message', new.conversation_id
  from public.conversation_members m
  where m.conversation_id = new.conversation_id and m.user_id <> new.sender_id
    and not private.has_block(m.user_id, new.sender_id)
  on conflict (user_id, kind, target_id) do update
    set actor_id = excluded.actor_id, updated_at = now(), read_at = null;
  return new;
end;
$$;

create function private.inbox_reply()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.activity_inbox (user_id, actor_id, kind, target_id)
  select p.user_id, new.user_id, 'reply', p.id
  from public.posts p where p.id = new.post_id and p.user_id <> new.user_id
    and not private.has_block(p.user_id, new.user_id)
  on conflict (user_id, kind, target_id) do update
    set actor_id = excluded.actor_id, updated_at = now(), read_at = null;
  return new;
end;
$$;

revoke all on function private.inbox_message(), private.inbox_reply() from public, anon, authenticated;
create trigger activity_inbox_message after insert on public.messages for each row execute function private.inbox_message();
create trigger activity_inbox_reply after insert on public.comments for each row execute function private.inbox_reply();

commit;
