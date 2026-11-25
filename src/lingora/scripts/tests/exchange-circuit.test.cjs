const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load.cjs');
const { exchangeInvitation, readExchangeInvitation, exchangeProgress, exchangeConfirmations } = load('features/chats/exchange-table.ts');
const { circuitMedal, circuitQuestions, saveCircuitScore, weekMedals } = load('features/game/daily-circuit.ts');

test('only known exchange invitations open a scenario', () => {
  assert.deepEqual(readExchangeInvitation(exchangeInvitation('cafe', 'Would you like to practise?')), { id: 'cafe', text: 'Would you like to practise?' });
  assert.equal(readExchangeInvitation('Invite\n[lingora:exchange-unknown]'), undefined);
  assert.equal(readExchangeInvitation('Invite\n[lingora:exchange-cafe] followed by text'), undefined);
});

test('confirmations attach to their prior invitation and count each partner once', () => {
  const id = 'a0000000-0000-0000-0000-000000000001';
  const another = 'a0000000-0000-0000-0000-000000000002';
  const reply = (sender_id, invitation, round) => ({ id: sender_id, sender_id, content: exchangeProgress(invitation, round, 'Done'), message_type: 'text' });
  const records = [
    reply('first', id, 1), reply('second', id, 2), reply('second', another, 1),
    reply('second', id, 1), reply('first', id, 1),
    { id, sender_id: 'first', content: exchangeInvitation('station', 'Let’s practise'), message_type: 'text' },
    reply('first', id, 2),
  ];
  const result = exchangeConfirmations(records);
  assert.equal(result.get(id).get(1).size, 2);
  assert.deepEqual([...result.get(id).get(2)], ['second']);
  assert.equal(result.has(another), false);
});

test('daily circuit questions repeat for the same course and day, and weaker replays cannot erase a medal', () => {
  const pairs = Array.from({ length: 20 }, (_, i) => ({ key: String(i), word: `word${i}`, meaning: `meaning${i}` }));
  const day = '2026-11-25';
  const round = circuitQuestions(pairs, 'de', day);
  assert.equal(round.length, 5);
  assert.deepEqual(round, circuitQuestions(pairs, 'de', day));
  assert.notDeepEqual(round, circuitQuestions(pairs, 'de', '2026-11-26'));
  const result = saveCircuitScore({ [day]: 4 }, day, 2);
  assert.equal(circuitMedal(result[day], 5), 'silver');
  assert.equal(circuitMedal(5, 5), 'gold');
  assert.equal(circuitMedal(0, 0), null);
});

test('weekly medal goal starts again on Monday and counts the current day', () => {
  const history = { '2026-11-29': 5, '2026-11-30': 4, '2026-12-01': 0, '2026-12-02': 5, '2026-12-03': 5 };
  assert.equal(weekMedals(history, '2026-11-30', 5), 1);
  assert.equal(weekMedals(history, '2026-12-02', 5), 2);
});
