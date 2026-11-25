-- Lingora – Schritt 0.2: Sicherheits-Härtung (RLS, Rechte, Funktionen)
-- Läuft komplett in einer Transaktion: entweder alles oder nichts.

begin;

-- ---------------------------------------------------------------------------
-- 1) KRITISCH: Mitgliedschaften und Nachrichten dürfen nicht "umgehängt" werden
-- ---------------------------------------------------------------------------
-- Bisher durfte ein Nutzer seine eigene Zeile in conversation_members komplett
-- ändern – auch conversation_id. Damit konnte man sich in jede fremde
-- Unterhaltung setzen und deren Nachrichten lesen.
-- Lösung: Nur noch die Spalte last_read_at darf geändert werden.
revoke update on public.conversation_members from anon, authenticated;
grant update (last_read_at) on public.conversation_members to authenticated;

-- Gleiches Problem bei messages: conversation_id / sender_id waren änderbar.
-- Erlaubt bleibt nur das Bearbeiten des Textes.
revoke update on public.messages from anon, authenticated;
grant update (content, edited_at) on public.messages to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Unterhaltungen nur noch über create_direct_conversation() anlegen
-- ---------------------------------------------------------------------------
-- Die App nutzt ausschliesslich die RPC-Funktion. Direkte Inserts erlaubten,
-- beliebige Nutzer ungefragt in eigene Unterhaltungen zu stecken.
drop policy if exists "Users can create conversations" on public.conversations;
drop policy if exists "Conversation creator can add participants" on public.conversation_members;

-- create_direct_conversation: gibt eine bestehende 1:1-Unterhaltung zurück,
-- statt bei jedem "Connect" eine neue (doppelte) anzulegen.
create or replace function public.create_direct_conversation(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation_id uuid;
begin
  if v_user_id is null then
    raise exception 'You must be logged in.';
  end if;

  if p_other_user_id is null or p_other_user_id = v_user_id then
    raise exception 'Invalid conversation participant.';
  end if;

  if not exists (select 1 from auth.users where id = p_other_user_id) then
    raise exception 'User does not exist.';
  end if;

  -- Bestehende 1:1-Unterhaltung zwischen genau diesen beiden suchen
  select c.id into v_conversation_id
  from public.conversations c
  where c.is_group is not true
    and exists (select 1 from public.conversation_members m
                where m.conversation_id = c.id and m.user_id = v_user_id)
    and exists (select 1 from public.conversation_members m
                where m.conversation_id = c.id and m.user_id = p_other_user_id)
    and (select count(*) from public.conversation_members m
         where m.conversation_id = c.id) = 2
  order by c.created_at
  limit 1;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  insert into public.conversations (created_by, is_group)
  values (v_user_id, false)
  returning id into v_conversation_id;

  insert into public.conversation_members (conversation_id, user_id)
  values (v_conversation_id, v_user_id),
         (v_conversation_id, p_other_user_id);

  return v_conversation_id;
end;
$$;

revoke execute on function public.create_direct_conversation(uuid) from public, anon;
grant execute on function public.create_direct_conversation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Hilfsfunktionen aus der öffentlichen API entfernen
-- ---------------------------------------------------------------------------
-- is_conversation_member / is_conversation_creator waren per
-- /rest/v1/rpc/... sogar ohne Login aufrufbar. Im Schema "private" sind sie
-- nicht über die API erreichbar. Die RLS-Policies verweisen intern auf die
-- Funktion (nicht auf den Namen) und funktionieren unverändert weiter.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

alter function public.is_conversation_member(uuid, uuid) set schema private;
alter function public.is_conversation_creator(uuid, uuid) set schema private;

revoke execute on function private.is_conversation_member(uuid, uuid) from public, anon;
revoke execute on function private.is_conversation_creator(uuid, uuid) from public, anon;
grant execute on function private.is_conversation_member(uuid, uuid) to authenticated;
grant execute on function private.is_conversation_creator(uuid, uuid) to authenticated;

-- handle_new_user ist eine Trigger-Funktion und braucht kein EXECUTE-Recht.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) Statistiken (XP, Streaks) nicht vom Client fälschbar
-- ---------------------------------------------------------------------------
-- Die App schreibt user_statistics aktuell nicht. Die Zeile wird beim
-- Registrieren von handle_new_user angelegt. XP-Updates kommen später über
-- eine sichere Server-Funktion (Phase 3).
drop policy if exists "Users can create own statistics" on public.user_statistics;
drop policy if exists "Users can update own statistics" on public.user_statistics;

-- ---------------------------------------------------------------------------
-- 5) Community-Daten nur für angemeldete Nutzer (Datenschutz / Scraping)
-- ---------------------------------------------------------------------------
-- Bisher konnte jeder ohne Login alle Profile, Posts usw. über die API
-- abrufen. Die App verlangt ohnehin immer einen Login.
alter policy "Public profiles are viewable by everyone" on public.profiles to authenticated;
alter policy "User languages are viewable by everyone" on public.user_languages to authenticated;
alter policy "Follows are publicly visible" on public.follows to authenticated;
alter policy "Posts are viewable by everyone" on public.posts to authenticated;
alter policy "Comments are viewable by everyone" on public.comments to authenticated;
alter policy "Likes are viewable by everyone" on public.post_likes to authenticated;
alter policy "Statistics are publicly viewable" on public.user_statistics to authenticated;
-- languages, lessons, lesson_exercises bleiben öffentlich (keine Personendaten).

commit;
