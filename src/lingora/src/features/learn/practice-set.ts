/**
 * The exercises of one lesson session.
 *
 * Every grammar lesson already has hand-written exercises. On top of that the
 * examples from the rule (sentence + translation) become three extra
 * exercises, so learners practise exactly the sentences they just read:
 *
 * - match: example sentences ↔ their meanings (warm-up)
 * - listen: hear a sentence and choose its meaning
 * - build: put a sentence together from its translation (hardest, last)
 *
 * Order goes from easy to hard: match → choice → listen → build → writing.
 * Pure and deterministic, so saved drafts and reviews keep their positions.
 */
import type { Exercise, Lesson, Reading } from './catalog';

export type PracticeItem = {
  exercise: Exercise;
  /** Position in the lesson's own exercises, for the mistake review. Generated items have none. */
  source?: number;
  generated?: 'match' | 'listen' | 'build' | 'dictation';
};

const MAX_WORDS_BUILD = 9;

function seedOf(text: string) {
  let seed = 0;
  for (let index = 0; index < text.length; index++) seed = (seed * 31 + text.charCodeAt(index)) | 0;
  return Math.abs(seed);
}

// Word tiles without punctuation: "libros." would give the answer away.
const words = (text: string) => text.trim().split(/\s+/).map((word) => word.replace(/[.,!?;:…¿¡"“”«»]+/g, '')).filter(Boolean);
const clean = (text: string) => text.trim();

/** Examples that have a real translation and are short enough to practise. */
function usableExamples(lesson: Lesson) {
  return lesson.examples
    .filter((example): example is [string, string] => !!example[1] && clean(example[1]) !== clean(example[0]))
    .map(([text, meaning]) => [clean(text), clean(meaning)] as [string, string])
    .filter(([text]) => text.length <= 80 && !/[_…]{2,}/.test(text))
    .filter(([text], index, list) => list.findIndex(([other]) => other === text) === index);
}

export function generatedExercises(lesson: Lesson, dictation = false): PracticeItem[] {
  const examples = usableExamples(lesson);
  const explain = lesson.structure || undefined;
  const items: PracticeItem[] = [];
  if (examples.length >= 3) {
    const pairs = examples.slice(0, 4).filter(([text, meaning]) => text.length <= 48 && meaning.length <= 48);
    const distinctMeanings = new Set(pairs.map(([, meaning]) => meaning.toLowerCase()));
    if (pairs.length >= 3 && distinctMeanings.size === pairs.length) {
      items.push({ generated: 'match', exercise: { type: 'match', prompt: 'Match each sentence with its meaning.', pairs } });
    }
    const [heard, meaning] = examples[0];
    const others = [...new Set(examples.slice(1).map(([, other]) => other))].filter((other) => other !== meaning).slice(0, 3);
    if (others.length >= 2) {
      const options = [...others];
      const answer = seedOf(heard) % (options.length + 1);
      options.splice(answer, 0, meaning);
      items.push({ generated: 'listen', exercise: { type: 'choice', prompt: 'Listen and choose the meaning.', audio: heard, options, answer, explain } });
    }
  }
  const buildable = examples.filter(([text]) => words(text).length >= 3 && words(text).length <= MAX_WORDS_BUILD);
  const target = buildable[buildable.length - 1];
  if (target) {
    const [text, meaning] = target;
    const inAnswer = new Set(words(text).map((word) => word.toLowerCase()));
    const extra = [...new Set(examples.flatMap(([other]) => words(other)))]
      .filter((word) => !inAnswer.has(word.toLowerCase()))
      .sort((a, b) => seedOf(a + text) - seedOf(b + text))
      .slice(0, 2);
    items.push({ generated: 'build', exercise: { type: 'build', prompt: `Translate: ${meaning}`, answer: words(text).join(' '), extra, explain } });
  }
  // Hard mode with audio: write down a sentence you hear (dictation).
  if (dictation) {
    const heard = examples.find(([text]) => words(text).length >= 3 && text.length <= 60);
    if (heard) {
      const plain = words(heard[0]).join(' ');
      items.push({ generated: 'dictation', exercise: { type: 'type', prompt: 'Listen and write what you hear.', audio: heard[0], accept: [heard[0], plain], explain: heard[1] } });
    }
  }
  return items;
}

const difficulty = (item: PracticeItem) => {
  if (item.generated === 'match') return 0;
  if (item.exercise.type === 'writing') return 5;
  if (item.generated === 'build') return 4;
  if (item.generated === 'dictation') return 4.5;
  if (item.generated === 'listen') return 2.5;
  return item.exercise.type === 'match' ? 1 : item.exercise.type === 'choice' ? 2 : 3;
};

/** All exercises for a session, easy first. Readings and workshops keep their own order. */
export function practiceSet(entry: Lesson | Reading, options: { dictation?: boolean } = {}): PracticeItem[] {
  const own: PracticeItem[] = entry.ex.map((exercise, source) => ({ exercise, source }));
  if ('text' in entry || ('alphabet' in entry && entry.alphabet) || own.some((item) => item.exercise.type === 'writing')) return own;
  return [...own, ...generatedExercises(entry, options.dictation)]
    .map((item, position) => ({ item, position }))
    .sort((a, b) => difficulty(a.item) - difficulty(b.item) || a.position - b.position)
    .map(({ item }) => item);
}
