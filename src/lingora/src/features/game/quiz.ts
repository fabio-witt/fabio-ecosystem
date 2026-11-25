import type { Course } from '@/features/learn/catalog';
import { vocabularyFor } from '@/features/vocabulary/catalog';
import { trainerPairs } from '@/features/vocabulary/pairs';

export type QuizPair = { key: string; word: string; meaning: string };
export type QuizQuestion = { pair: QuizPair; options: string[]; answer: string };

/** Small deterministic random generator, so two duel players get the same questions. */
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWith<T>(items: T[], random: () => number) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

/** Every translated word of a course: themes first, then course phrases. */
export function coursePairs(course: Course): QuizPair[] {
  const catalog = vocabularyFor(course);
  const short = (pair: QuizPair) => pair.word.length <= 30 && pair.meaning.length <= 40;
  // Single words make fairer options; course phrases only fill in when a course has few themes.
  const words = trainerPairs(course.id, catalog.categories).filter(short);
  return words.length >= 20 ? words : trainerPairs(course.id, [...catalog.categories, ...catalog.review]).filter(short);
}

/** Word → meaning questions with three wrong options each. */
export function buildQuestions(pairs: QuizPair[], count: number, seed = Math.floor(Math.random() * 2 ** 31)): QuizQuestion[] {
  if (pairs.length < 4) return [];
  const random = seededRandom(seed);
  const picked = shuffleWith(pairs, random).slice(0, count);
  return picked.map((pair) => {
    const others = shuffleWith(pairs.filter((item) => item.key !== pair.key), random)
      .map((item) => item.meaning)
      .filter((value, position, list) => value !== pair.meaning && list.indexOf(value) === position)
      .slice(0, 3);
    return { pair, answer: pair.meaning, options: shuffleWith([pair.meaning, ...others], random) };
  });
}
