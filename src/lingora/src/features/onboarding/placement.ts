import { courseSections, type CefrLevel, type Course, type Exercise } from '@/features/learn/catalog';

type Choice = Extract<Exercise, { type: 'choice' }>;
export type PlacementQuestion = { level: CefrLevel; lesson: string; exercise: Choice };
export type PlacementStage = { level: CefrLevel; questions: PlacementQuestion[] };

/** Questions asked per level. A level counts as known with two of three right. */
export const QUESTIONS_PER_LEVEL = 3;

function usable(item: Exercise): item is Choice {
  return item.type === 'choice' && item.options.length >= 3 && item.options.every((option) => option.length < 100);
}

/**
 * A few multiple-choice questions per CEFR level, each from a different
 * lesson spread across that level (start, middle, end).
 */
export function placementStages(course: Course): PlacementStage[] {
  if (course.id === 'ga') return [];
  return courseSections(course, true).flatMap(({ level, data }) => {
    // The "Start here" lessons are about sounds and greetings, not grammar.
    const candidates = data.filter((entry) => !entry.id.includes('-start')).flatMap((entry) => {
      const exercise = entry.ex.find(usable);
      return exercise ? [{ level, lesson: entry.title, exercise }] : [];
    });
    if (candidates.length === 0) return [];
    const count = Math.min(QUESTIONS_PER_LEVEL, candidates.length);
    const picks = Array.from({ length: count }, (_, index) =>
      candidates[Math.round((index * (candidates.length - 1)) / Math.max(count - 1, 1))]);
    return [{ level, questions: [...new Set(picks)] }];
  });
}

/** Correct answers needed to pass a level with `total` questions. */
export function passMark(total: number) {
  return Math.max(1, Math.ceil((total * 2) / 3));
}

export type StageResult = { level: CefrLevel; correct: number; total: number; passed: boolean };

/**
 * The level to start with: the first level the learner did not pass, or the
 * highest level when every level was passed.
 */
export function placementLevel(stages: PlacementStage[], results: StageResult[]): CefrLevel {
  const failed = results.find(({ passed }) => !passed);
  return failed?.level ?? results.at(-1)?.level ?? stages[0]?.level ?? 'A1';
}
