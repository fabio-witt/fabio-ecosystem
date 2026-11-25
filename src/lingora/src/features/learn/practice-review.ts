import { useMemo } from 'react';

import { useDeviceState } from '@/lib/device-state';
import { useSession } from '@/providers/session-provider';

import { findLesson, type Exercise } from './catalog';
import { fsrsReview } from './fsrs';

export type ReviewSchedule = { stage: number; dueAt: number; s?: number; d?: number; last?: number };
export type MistakeCard = ReviewSchedule & { entryId: string; index: number; version: string };
type ReviewState = { mistakes: Record<string, MistakeCard>; words: Record<string, ReviewSchedule> };
const empty: ReviewState = { mistakes: {}, words: {} };
const day = 86_400_000;
const intervals = [1, 3, 7, 14, 30];

/** Next review time, planned with FSRS; older cards without FSRS data start from their stage. */
export function nextReview(previous: ReviewSchedule | undefined, remembered: boolean, now = Date.now()): ReviewSchedule {
  const stage = remembered ? Math.min((previous?.stage ?? -1) + 1, intervals.length - 1) : 0;
  const card = previous
    ? { s: previous.s ?? intervals[Math.max(0, Math.min(previous.stage, intervals.length - 1))], d: previous.d ?? 5, last: previous.last ?? previous.dueAt - intervals[Math.max(0, previous.stage)] * day }
    : undefined;
  const next = fsrsReview(card, remembered, now);
  return { stage, s: next.s, d: next.d, last: now, dueAt: now + (remembered ? next.days * day : 5 * 60_000) };
}

export { wordReviewKey } from '@/features/vocabulary/pairs';

export function validMistake(card: MistakeCard) {
  const lesson = findLesson(card.entryId);
  const exercise = lesson?.entry.ex[card.index];
  return lesson && exercise && exercise.type !== 'writing' && JSON.stringify(exercise) === card.version
    ? { ...card, lesson, exercise }
    : undefined;
}

export function usePracticeReview() {
  const { user } = useSession();
  const [state, write] = useDeviceState<ReviewState>(user?.id, 'practice-review', empty);
  const mistakes = useMemo(() => Object.entries(state.mistakes)
    .flatMap(([key, card]) => { const item = validMistake(card); return item ? [{ ...item, key }] : []; })
    .sort((a, b) => a.dueAt - b.dueAt), [state.mistakes]);

  function recordAnswer(entryId: string, index: number, exercise: Exercise, correct: boolean) {
    if (exercise.type === 'writing') return;
    const key = JSON.stringify([entryId, index]);
    write(current => {
      const before = current ?? empty;
      const existing = before.mistakes[key];
      if (correct && !existing) return before;
      const version = JSON.stringify(exercise);
      const previous = existing?.version === version ? existing : undefined;
      const schedule = correct ? nextReview(previous, true) : { stage: 0, dueAt: Date.now() };
      return { ...before, mistakes: { ...before.mistakes, [key]: { entryId, index, version, ...schedule } } };
    });
  }

  function rateMistake(key: string, remembered: boolean) {
    write(current => {
      const before = current ?? empty;
      const card = before.mistakes[key];
      if (!card) return before;
      return { ...before, mistakes: { ...before.mistakes, [key]: { ...card, ...nextReview(card, remembered) } } };
    });
  }

  function rateWord(key: string, remembered: boolean) {
    write(current => {
      const before = current ?? empty;
      return { ...before, words: { ...before.words, [key]: nextReview(before.words[key], remembered) } };
    });
  }
  return { mistakes, words: state.words, recordAnswer, rateMistake, rateWord };
}
