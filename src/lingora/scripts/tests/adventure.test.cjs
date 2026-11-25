const assert = require('node:assert/strict');
const { test } = require('node:test');
const { load } = require('./load.cjs');
const { scenes, revenge, localDay, weeklyDays } = load('features/learn/zurich-adventure.ts');
const { phraseStars, ratePhrase } = load('features/learn/phrase-mastery.ts');
const { conversationTask } = load('features/learn/conversation-tasks.ts');

test('all dialogue branches reach the ending and every mistake has a transfer question', () => {
  function follow(id, seen) {
    if (id === 'finish') return;
    assert.ok(!seen.includes(id), `Cycle at ${id}`);
    const scene = scenes[id];
    assert.ok(scene?.choices.length, `Missing scene or choice: ${id}`);
    for (const choice of scene.choices) {
      if (choice.mistake) {
        const question = revenge[choice.mistake];
        assert.ok(question?.options[question.answer], choice.mistake);
      }
      follow(choice.next, [...seen, id]);
    }
  }
  for (const id of Object.keys(scenes)) follow(id, []);
});

test('a week counts distinct practice days and resets on Monday', () => {
  const sun = new Date(2026, 10, 29);
  const mon = new Date(2026, 10, 30);
  const days = [localDay(sun), localDay(sun)];
  assert.equal(weeklyDays(days, sun), 1);
  assert.equal(weeklyDays(days, mon), 0);
});

test('the delayed recall star requires a different day', () => {
  const day = new Date(2026, 10, 25);
  const later = new Date(2026, 10, 26);
  let mastery = ratePhrase({}, 'recognise', day);
  mastery = ratePhrase(mastery, 'recall', day);
  assert.equal(phraseStars(ratePhrase(mastery, 'recall', day)), 2);
  assert.equal(phraseStars(ratePhrase(mastery, 'recall', later)), 3);
});

test('adventure invitations resolve through the existing chat starter lookup', () => {
  for (const task of ['coop', 'story', 'corrections', 'week']) assert.ok(conversationTask(`zurich-${task}`)?.starter);
  assert.equal(conversationTask('zurich-unknown'), undefined);
});
