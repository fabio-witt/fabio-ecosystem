// Checks the SQL migrations for the security rules the app relies on.
const test = require('node:test');
const assert = require('node:assert/strict');
const { migrationsText } = require('./load.cjs');

const sql = migrationsText();

test('tables with personal data have row level security', () => {
  for (const table of ['synced_state', 'app_events', 'feedback', 'client_errors', 'duels', 'plus_members']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`), table);
  }
});

test('members can never write their own Plus membership', () => {
  assert.match(sql, /revoke insert, update, delete, truncate on public\.plus_members from anon, authenticated/);
});

test('guests are blocked from community writes', () => {
  for (const table of ['messages', 'posts', 'comments', 'follows', 'post_likes']) {
    assert.match(sql, new RegExp(`create policy guests_no_\\w+ on public\\.${table}`), table);
  }
});

test('admin insights check the admin list', () => {
  assert.match(sql, /function public\.admin_insights[\s\S]*private\.admins/);
});

test('feedback, events and errors are rate limited', () => {
  for (const table of ['app_events', 'feedback', 'client_errors']) {
    assert.match(sql, new RegExp(`before insert on public\\.${table} for each row execute function private\\.limit_rows_per_hour`), table);
  }
});

test('security definer functions pin the search path', () => {
  const definers = sql.match(/create (or replace )?function public\.\w+\([^)]*\)[^$]*?security definer[^$]*?\$\$/gi) ?? [];
  for (const definition of definers) {
    assert.match(definition, /set search_path = ''/, definition.slice(0, 80));
  }
});

test('forum tables are protected like posts', () => {
  for (const table of ['forum_threads', 'forum_replies', 'forum_votes']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`), table);
  }
  assert.match(sql, /revoke all on public\.forum_threads, public\.forum_replies, public\.forum_votes from anon, authenticated/);
  for (const policy of ['guests_no_forum_threads', 'guests_no_forum_replies', 'guests_no_forum_votes', 'block_forum_threads', 'block_forum_replies', 'suspended_forum_threads', 'suspended_forum_replies']) {
    assert.match(sql, new RegExp(`create policy ${policy} `), policy);
  }
  assert.match(sql, /You cannot vote for your own post/);
});

test('new community and growth tables have row level security and no direct writes to secrets', () => {
  for (const table of ['meetups', 'meetup_attendees', 'exchange_sessions', 'referrals', 'classes', 'class_members', 'class_assignments']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`), table);
  }
  // The video room name is never selectable directly.
  assert.match(sql, /grant select \(id, host_id, language_id, level, title, content, starts_at, duration_minutes, capacity, attendee_count, created_at\)\s+on public\.meetups/);
  // Voice files must live in the folder of a conversation the sender belongs to.
  assert.match(sql, /create policy voice_upload on storage\.objects/);
  assert.match(sql, /is_conversation_member\(\(\(storage\.foldername\(name\)\)\[1\]\)::uuid/);
  // Only the edge function may count AI messages.
  assert.match(sql, /grant execute on function public\.ai_usage_bump\(uuid, integer\) to service_role/);
});
