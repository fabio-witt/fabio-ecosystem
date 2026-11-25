-- Daily message counter for the AI conversation partner (only the edge function writes it).
create table private.ai_usage (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null default current_date,
  count integer not null default 0,
  primary key (user_id, day)
);
alter table private.ai_usage enable row level security;

-- Counts one message; returns the new count, or -1 when the daily limit is reached.
create function public.ai_usage_bump(p_user uuid, p_limit integer)
returns integer language plpgsql security definer set search_path = ''
as $$
declare used integer;
begin
  insert into private.ai_usage (user_id, day, count) values (p_user, current_date, 0)
    on conflict (user_id, day) do nothing;
  update private.ai_usage set count = count + 1
    where user_id = p_user and day = current_date and count < p_limit
    returning count into used;
  return coalesce(used, -1);
end;
$$;
revoke all on function public.ai_usage_bump(uuid, integer) from public, anon, authenticated;
grant execute on function public.ai_usage_bump(uuid, integer) to service_role;
