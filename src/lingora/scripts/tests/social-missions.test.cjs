const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load.cjs');
const { practiceMissions, missionDraft } = load('features/chats/practice-missions.ts');
test('practice invitations never replace an existing draft', () => {
  assert.equal(missionDraft('Private unfinished message', 'Invitation'), 'Private unfinished message');
  assert.equal(missionDraft(' ', 'Invitation'), ' ');
  assert.equal(missionDraft('', 'Invitation'), 'Invitation');
});
test('missions have stable unique identifiers and actionable invitations', () => {
  assert.equal(new Set(practiceMissions.map(m => m.id)).size, practiceMissions.length);
  assert.ok(practiceMissions.length >= 4);
  for (const mission of practiceMissions) assert.ok(mission.title && mission.invitation.length > 40);
});
