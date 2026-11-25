import type { Topic } from './catalog';

export type WordPair = { key: string; word: string; meaning: string };

/** The key under which a word's review schedule is stored. */
export function wordReviewKey(courseId: string, word: string) {
  return JSON.stringify([courseId, word.normalize('NFC')]);
}

/** Every word with a translation, once, across the given themes. */
export function trainerPairs(courseId: string, topics: Topic[]): WordPair[] {
  const pairs = new Map<string, WordPair>();
  for (const topic of topics) {
    for (const [word, meaning] of topic.words) {
      if (!meaning || meaning === word || word.length > 40 || meaning.length > 60) continue;
      const key = wordReviewKey(courseId, word);
      if (!pairs.has(key)) pairs.set(key, { key, word, meaning });
    }
  }
  return [...pairs.values()];
}
