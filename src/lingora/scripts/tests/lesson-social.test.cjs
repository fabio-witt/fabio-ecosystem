const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./load.cjs');
const { recallRound } = load('features/learn/recall-round.ts');
const { courseLanguage } = load('features/learn/course-language.ts');

test('recall prompts keep punctuation and the clue but hide the answer', () => {
  const examples = [['Je cherche la bibliothèque.', 'I am looking for the library.'],
    ['Je cherche la bibliothèque.', 'Duplicate'], ['Bonsoir.'], ['Bonjour.', 'Hello.']];
  const result = recallRound(examples);
  assert.equal(result.length, 1);
  assert.equal(result[0].prompt, 'Je cherche la ___.\nI am looking for the library.');
  assert.deepEqual(result[0].accept, ['bibliothèque']);
});

test('course filters allow regional variants but do not confuse short prefixes', () => {
  const languages = [{ id: 4, language_code: 'gsw-CH' }, { id: 2, language_code: 'de-CH' }, { id: 9, language_code: 'hr' }];
  assert.equal(courseLanguage(languages, 'gsw'), 4);
  assert.equal(courseLanguage(languages, 'de'), 2);
  assert.equal(courseLanguage(languages, 'sh'), 9);
  assert.equal(courseLanguage(languages, 'd'), undefined);
});
