import { seededRandom } from '@/features/game/quiz';
import type { Topic } from '@/features/vocabulary/catalog';
import { vocabularyFor } from '@/features/vocabulary/catalog';

import { cefrLevels, courseSections, levelForUnit, type CefrLevel, type Course } from './catalog';
import type { ScoredExercise } from './exercise';

/** Share of correct answers needed to pass a level exam. */
export const EXAM_PASS = 80;
export const EXAM_QUESTIONS = 20;

export function examId(courseId: string, level: CefrLevel) {
  return `${courseId}-exam-${level}`;
}

/** Levels of a course that have lessons, in order. */
export function courseLevels(course: Course): CefrLevel[] {
  return courseSections(course, true).filter(({ data }) => data.length > 0).map(({ level }) => level);
}

/** Every level of every course has an exam (used for the server registry). */
export function allExamIds(courses: Course[]) {
  return courses.flatMap((course) => courseLevels(course).map((level) => ({ id: examId(course.id, level), courseId: course.id })));
}

function shuffle<T>(items: T[], random: () => number) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export type ExamQuestion = { exercise: ScoredExercise; lessonId: string; lessonTitle: string };

/**
 * A fresh exam each attempt: questions from every grammar lesson of the level
 * (round robin, so all topics are covered), at most EXAM_QUESTIONS.
 */
export function examQuestions(course: Course, level: CefrLevel, seed: number): ExamQuestion[] {
  const random = seededRandom(seed);
  // Grammar lessons and the reading/listening texts of the level, not the alphabet.
  const lessons = (courseSections(course, false).find((section) => section.level === level)?.data ?? [])
    .filter((entry) => !('alphabet' in entry && entry.alphabet));
  const pools = shuffle(lessons, random).map((lesson) => shuffle(
    lesson.ex.filter((exercise): exercise is ScoredExercise => exercise.type !== 'writing')
      .map((exercise) => ({ exercise, lessonId: lesson.id, lessonTitle: lesson.title })),
    random,
  )).filter((pool) => pool.length > 0);
  const picked: ExamQuestion[] = [];
  for (let round = 0; picked.length < EXAM_QUESTIONS && pools.some((pool) => pool.length > round); round++) {
    for (const pool of pools) {
      if (picked.length >= EXAM_QUESTIONS) break;
      if (pool[round]) picked.push(pool[round]);
    }
  }
  return shuffle(picked, random);
}

/** The highest level whose exam was passed, per score map (entry id → best score). */
export function passedLevels(course: Course, scores: Record<string, number> | undefined) {
  return courseLevels(course).filter((level) => (scores?.[examId(course.id, level)] ?? 0) >= EXAM_PASS);
}

/** Index of the last unit of each level, so the path can place the exam after it. */
export function lastUnitOfLevel(course: Course) {
  const result = new Map<number, CefrLevel>();
  course.units.forEach((_, index) => {
    const level = levelForUnit(course, index);
    const nextLevel = index + 1 < course.units.length ? levelForUnit(course, index + 1) : null;
    if (nextLevel !== level) result.set(index, level);
  });
  return result;
}

export function levelBelow(a: CefrLevel, b: CefrLevel) {
  return cefrLevels.indexOf(a) < cefrLevels.indexOf(b);
}

// ---- Word stations ------------------------------------------------------
// Every unit gets one vocabulary stop in path order, so learners meet the
// most useful words while they learn the grammar: first the themes (food,
// work, travel …), then the most frequent words of the language in packs of
// 12, then the unit's own example sentences.

const FREQUENT_PACK = 12;

export function wordStationKey(courseId: string, unitIndex: number) {
  return `${courseId}:${unitIndex}`;
}

const stationCache = new Map<string, Map<number, Topic>>();
export function wordStations(course: Course): Map<number, Topic> {
  const cached = stationCache.get(course.id);
  if (cached) return cached;
  const catalog = vocabularyFor(course);
  const translated = (topic: Topic) => topic.words.filter(([word, meaning]) => meaning && meaning !== word).length >= 4;
  const themes = catalog.categories.filter(translated);
  const stations = new Map<number, Topic>();
  // Frequent words that have a translation and are not already in a theme.
  const themed = new Set(themes.flatMap((topic) => topic.words.map(([word]) => word.toLowerCase())));
  const frequent = catalog.frequency.words.filter(([word, meaning]) => meaning && meaning !== word && !themed.has(word.toLowerCase()));
  let next = 0;
  let pack = 0;
  course.units.forEach((unit, index) => {
    // The "Start here" unit is about sounds; words start with the first real unit.
    if (index === 0) return;
    const theme = themes[next];
    const words = frequent.slice(pack * FREQUENT_PACK, (pack + 1) * FREQUENT_PACK);
    if (theme) {
      stations.set(index, theme);
      next++;
    } else if (words.length >= 8) {
      stations.set(index, { id: `frequent-${pack}`, title: `Frequent words ${pack + 1}`, words, examples: [] });
      pack++;
    } else {
      const phrases = catalog.review.find((topic) => topic.title === unit.title);
      if (phrases && translated(phrases)) stations.set(index, phrases);
    }
  });
  stationCache.set(course.id, stations);
  return stations;
}
