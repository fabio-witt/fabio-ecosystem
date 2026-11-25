-- Lingora Plus bought on the web with Stripe.
-- Memberships are written only by the stripe-webhook edge function
-- (service role); members can read them, nobody can write them from the app.
alter table public.plus_members drop constraint if exists plus_members_source_check;
alter table public.plus_members add constraint plus_members_source_check
  check (source in ('manual', 'app_store', 'play_store', 'promo', 'stripe'));
alter table public.plus_members add column if not exists external_id text;
create unique index if not exists plus_members_external_idx on public.plus_members (external_id) where external_id is not null;
