const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load.cjs');
const { partnerTopics, commonPartnerTopics, partnerTopicTask, readPartnerTopicTask } = load('features/partners/partner-topics.ts');

test('partner starters use supported, shared topics from the profile', () => {
  const me = { interests: ['Music'], conversation_topics: 'Coffee, Travel, Music' };
  const partner = { interests: ['Travel', 'Music', '<unknown>'], conversation_topics: 'Work, Travel' };
  assert.deepEqual(commonPartnerTopics(me, partner), ['Travel', 'Music']);
  assert.deepEqual(partnerTopics(partner), ['Travel', 'Music', 'Work']);
  assert.equal(readPartnerTopicTask(partnerTopicTask('Travel')), 'Travel');
  assert.equal(readPartnerTopicTask('partner-topic:<unknown>'), undefined);
  assert.equal(partnerTopicTask('Coffee'), 'partner-intro');
});
