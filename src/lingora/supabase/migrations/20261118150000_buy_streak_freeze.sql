-- Streak freeze from the gem shop: at most 2 held, at most one purchase per day.
create table private.freeze_purchases (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null default current_date,
  primary key (user_id, day)
);
alter table private.freeze_purchases enable row level security;

create function public.buy_streak_freeze()
returns integer language plpgsql security definer set search_path = ''
as $$
declare me uuid := auth.uid(); held smallint;
begin
  if me is null or private.is_guest() then raise exception 'Create an account to protect your streak.'; end if;
  insert into public.user_statistics (user_id) values (me) on conflict (user_id) do nothing;
  select streak_freezes into held from public.user_statistics where user_id = me for update;
  if held >= 2 then raise exception 'You already hold 2 streak freezes.'; end if;
  insert into private.freeze_purchases (user_id) values (me);
  update public.user_statistics set streak_freezes = streak_freezes + 1 where user_id = me;
  return held + 1;
exception when unique_violation then
  raise exception 'You can buy one streak freeze per day.';
end;
$$;
revoke all on function public.buy_streak_freeze() from public, anon;
grant execute on function public.buy_streak_freeze() to authenticated;
