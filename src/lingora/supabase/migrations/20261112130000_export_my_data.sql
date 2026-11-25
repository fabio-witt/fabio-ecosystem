-- Data export (right of access, GDPR art. 15 / Swiss FADP art. 25):
-- everything Lingora stores about the signed-in person, as one JSON document.
-- Messages are limited to the ones the person wrote; other people's messages
-- are their data.
create or replace function public.export_my_data()
returns jsonb language sql stable security definer set search_path = ''
as $$
  with me as (select (select auth.uid()) as id)
  select jsonb_build_object(
    'exported_at', now(),
    'account', (select jsonb_build_object('id', u.id, 'email', u.email, 'created_at', u.created_at, 'is_guest', u.is_anonymous)
                from auth.users u, me where u.id = me.id),
    'profile', (select to_jsonb(p) from public.profiles p, me where p.id = me.id),
    'languages', (select coalesce(jsonb_agg(jsonb_build_object('language', l.name, 'type', ul.language_type, 'level', ul.proficiency_level)), '[]')
                  from public.user_languages ul join public.languages l on l.id = ul.language_id, me where ul.user_id = me.id),
    'statistics', (select to_jsonb(s) from public.user_statistics s, me where s.user_id = me.id),
    'lesson_progress', (select coalesce(jsonb_agg(to_jsonb(lp) - 'user_id'), '[]') from public.learn_progress lp, me where lp.user_id = me.id),
    'daily_xp', (select coalesce(jsonb_agg(to_jsonb(d) - 'user_id'), '[]') from public.daily_xp d, me where d.user_id = me.id),
    'app_state', (select coalesce(jsonb_object_agg(ss.feature, ss.data), '{}') from public.synced_state ss, me where ss.user_id = me.id),
    'posts', (select coalesce(jsonb_agg(to_jsonb(po) - 'user_id'), '[]') from public.posts po, me where po.user_id = me.id),
    'comments', (select coalesce(jsonb_agg(to_jsonb(c) - 'user_id'), '[]') from public.comments c, me where c.user_id = me.id),
    'messages_sent', (select coalesce(jsonb_agg(jsonb_build_object('conversation_id', m.conversation_id, 'content', m.content, 'created_at', m.created_at)), '[]')
                      from public.messages m, me where m.sender_id = me.id),
    'following', (select coalesce(jsonb_agg(f.following_id), '[]') from public.follows f, me where f.follower_id = me.id),
    'clubs', (select coalesce(jsonb_agg(jsonb_build_object('club', cl.name, 'role', cm.role, 'joined_at', cm.joined_at)), '[]')
              from public.club_members cm join public.clubs cl on cl.id = cm.club_id, me where cm.user_id = me.id),
    'reviews_written', (select coalesce(jsonb_agg(to_jsonb(r) - 'reviewer_id'), '[]') from public.partner_reviews r, me where r.reviewer_id = me.id),
    'duels', (select coalesce(jsonb_agg(to_jsonb(du)), '[]') from public.duels du, me where me.id in (du.challenger_id, du.opponent_id)),
    'plus_membership', (select to_jsonb(pm) - 'user_id' from public.plus_members pm, me where pm.user_id = me.id)
  )
  from me where me.id is not null;
$$;
revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
