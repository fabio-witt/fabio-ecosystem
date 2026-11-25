begin;

create table public.correction_cards (
  user_id uuid not null references public.profiles(id) on delete cascade,
  correction_id uuid not null references public.messages(id) on delete cascade,
  due_at timestamptz not null default now(),
  interval_days integer not null default 0 check (interval_days between 0 and 30),
  primary key (user_id, correction_id)
);
create index correction_cards_due on public.correction_cards (user_id, due_at, correction_id);
create index correction_cards_message on public.correction_cards (correction_id);
alter table public.correction_cards enable row level security;
revoke all on public.correction_cards from anon, authenticated;
grant select, delete on public.correction_cards to authenticated;
create policy own_correction_cards on public.correction_cards for select to authenticated using (user_id = (select auth.uid()));
create policy delete_own_correction_cards on public.correction_cards for delete to authenticated using (user_id = (select auth.uid()));

create function public.save_correction_card(p_correction_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare viewer uuid := auth.uid();
begin
  if not exists (
    select 1 from public.messages fix
    join public.messages original on original.id = fix.corrects_id
      and original.conversation_id = fix.conversation_id
    where fix.id = p_correction_id and fix.message_type = 'correction'
      and original.sender_id = viewer and fix.sender_id <> viewer
      and exists (
        select 1 from public.conversation_members member
        where member.conversation_id = fix.conversation_id and member.user_id = viewer
      )
      and private.can_see_conversation(fix.conversation_id)
  ) then
    raise exception 'This correction is unavailable.';
  end if;
  insert into public.correction_cards (user_id, correction_id) values (viewer, p_correction_id)
    on conflict (user_id, correction_id) do nothing;
end;
$$;

create function public.list_correction_cards()
returns table (correction_id uuid, original text, corrected text, due_at timestamptz, due boolean)
language sql stable set search_path = ''
as $$
  select c.correction_id, original.content, fix.content, c.due_at, c.due_at <= now()
  from public.correction_cards c
  join public.messages fix on fix.id = c.correction_id
  join public.messages original on original.id = fix.corrects_id
  where c.user_id = (select auth.uid())
  order by c.due_at, c.correction_id
  limit 100;
$$;

create function public.review_correction_card(p_correction_id uuid, p_remembered boolean)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  update public.correction_cards c
  set due_at = now() + case when p_remembered then make_interval(days => least(30, greatest(1, c.interval_days * 2)))
    else interval '10 minutes' end,
    interval_days = case when p_remembered then least(30, greatest(1, c.interval_days * 2)) else 0 end
  where c.user_id = (select auth.uid()) and c.correction_id = p_correction_id and c.due_at <= now()
    and exists (select 1 from public.messages m where m.id = c.correction_id
      and private.can_see_conversation(m.conversation_id));
end;
$$;

create function public.remove_correction_card(p_correction_id uuid)
returns void language sql set search_path = ''
as $$
  delete from public.correction_cards where user_id = (select auth.uid()) and correction_id = p_correction_id;
$$;

revoke all on function public.save_correction_card(uuid), public.list_correction_cards(),
  public.review_correction_card(uuid, boolean), public.remove_correction_card(uuid) from public, anon;
grant execute on function public.save_correction_card(uuid), public.list_correction_cards(),
  public.review_correction_card(uuid, boolean), public.remove_correction_card(uuid) to authenticated;

commit;
