import { useNow } from '@/hooks/use-now';
import { coursePairs, seededRandom } from '@/features/game/quiz';

import { useActiveCourse } from './active-course';
import { courses } from './catalog';
import type { ScoredExercise } from './exercise';
import { usePracticeReview } from './practice-review';

export const DAILY_REVIEW_SIZE = 10;
const NEW_WORDS = 5;

export type ReviewItem =
  | { kind: 'mistake'; key: string; exercise: ScoredExercise; source: string }
  | { kind: 'word'; key: string; exercise: ScoredExercise; source: string; fresh: boolean };

function shuffle<T>(items: T[], random: () => number) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

const pairCache = new Map<string, ReturnType<typeof coursePairs>>();
function pairsFor(courseId: string) {
  if (!pairCache.has(courseId)) {
    const course = courses.find((item) => item.id === courseId);
    pairCache.set(courseId, course ? coursePairs(course) : []);
  }
  return pairCache.get(courseId)!;
}

function wordQuestion(courseId: string, key: string, seed: number): ScoredExercise | undefined {
  const pairs = pairsFor(courseId);
  const pair = pairs.find((item) => item.key === key);
  if (!pair || pairs.length < 4) return undefined;
  const random = seededRandom(seed);
  const wrong = shuffle(pairs.filter((item) => item.meaning !== pair.meaning), random)
    .map((item) => item.meaning)
    .filter((value, position, list) => list.indexOf(value) === position)
    .slice(0, 3);
  return { type: 'choice', prompt: `What does "${pair.word}" mean?`, options: [pair.meaning, ...wrong], answer: 0 };
}

/**
 * Today's review: mistakes and words that are due (oldest first), topped up
 * with a few new words from the current course so there is always something useful.
 */
export function useDailyReview() {
  const review = usePracticeReview();
  const { course } = useActiveCourse();
  const now = useNow();
  // Recompute at most once a minute, not on every answer.
  const minute = Math.floor(now / 60_000);
  const at = minute * 60_000;
    const items: ReviewItem[] = [];
    for (const card of review.mistakes) {
      if (card.dueAt > at || items.length >= DAILY_REVIEW_SIZE) continue;
      items.push({ kind: 'mistake', key: card.key, exercise: card.exercise, source: `${card.lesson.course.name} · ${card.lesson.entry.title}` });
    }
    const dueWords = Object.entries(review.words).filter(([, schedule]) => schedule.dueAt <= at).sort((a, b) => a[1].dueAt - b[1].dueAt);
    for (const [key] of dueWords) {
      if (items.length >= DAILY_REVIEW_SIZE) break;
      let courseId = '';
      try { courseId = (JSON.parse(key) as [string, string])[0]; } catch { continue; }
      const exercise = wordQuestion(courseId, key, minute + items.length);
      const name = courses.find((item) => item.id === courseId)?.name ?? '';
      if (exercise) items.push({ kind: 'word', key, exercise, source: name, fresh: false });
    }
    const due = items.length;
    if (course && items.length < DAILY_REVIEW_SIZE) {
      const fresh = pairsFor(course.id).filter((pair) => !review.words[pair.key]).slice(0, Math.min(NEW_WORDS, DAILY_REVIEW_SIZE - items.length));
      for (const pair of fresh) {
        const exercise = wordQuestion(course.id, pair.key, minute + items.length);
        if (exercise) items.push({ kind: 'word', key: pair.key, exercise, source: course.name, fresh: true });
      }
    }
    return { items, due };
}
