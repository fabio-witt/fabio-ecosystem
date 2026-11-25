/**
 * What is free and what needs Lingora Plus.
 *
 * Free forever: the whole A1 level of every course, word stations, reviews,
 * level tests and the community. From A2 on, free learners can start a few
 * new lessons per day (repeating a lesson is always free) and buy one or two
 * extra lessons with gems. Plus removes every limit.
 *
 * Pure rules, so they can be tested without React.
 */
import type { CefrLevel } from '@/features/learn/catalog';

export const FREE_LEVELS: readonly CefrLevel[] = ['A1'];
export const FREE_DAILY_LESSONS = 3;
export const GEM_UNLOCK_PRICE = 40;
export const MAX_GEM_UNLOCKS = 2;

/** New lessons above A1 started today ("ids") and extra lessons bought with gems. */
export type FreeDay = { day: string; ids: string[]; gems: number };

export type Access =
  | { allowed: true; reason: 'plus' | 'free-level' | 'repeat' | 'started' | 'daily'; left: number }
  | { allowed: false; reason: 'limit'; left: 0; canBuy: boolean };

export function todayUsage(freeDay: FreeDay | undefined, today: string): FreeDay {
  return freeDay && freeDay.day === today ? freeDay : { day: today, ids: [], gems: 0 };
}

/** Free lessons still open today. */
export function lessonsLeft(freeDay: FreeDay | undefined, today: string) {
  const usage = todayUsage(freeDay, today);
  return Math.max(0, FREE_DAILY_LESSONS + usage.gems - usage.ids.length);
}

export function lessonAccess(input: {
  id: string; level: CefrLevel; completed: boolean; isPlus: boolean; enforced: boolean;
  freeDay: FreeDay | undefined; today: string;
}): Access {
  const left = lessonsLeft(input.freeDay, input.today);
  if (input.isPlus || !input.enforced) return { allowed: true, reason: 'plus', left };
  if (FREE_LEVELS.includes(input.level)) return { allowed: true, reason: 'free-level', left };
  if (input.completed) return { allowed: true, reason: 'repeat', left };
  if (todayUsage(input.freeDay, input.today).ids.includes(input.id)) return { allowed: true, reason: 'started', left };
  if (left > 0) return { allowed: true, reason: 'daily', left };
  return { allowed: false, reason: 'limit', left: 0, canBuy: todayUsage(input.freeDay, input.today).gems < MAX_GEM_UNLOCKS };
}

/** Counts a new lesson against today's free lessons (no-op when it is already counted). */
export function countFreeLesson(freeDay: FreeDay | undefined, today: string, id: string): FreeDay {
  const usage = todayUsage(freeDay, today);
  return usage.ids.includes(id) ? usage : { ...usage, ids: [...usage.ids, id] };
}

/** One more free lesson today, paid with gems. */
export function buyExtraLesson(freeDay: FreeDay | undefined, today: string): FreeDay | null {
  const usage = todayUsage(freeDay, today);
  return usage.gems >= MAX_GEM_UNLOCKS ? null : { ...usage, gems: usage.gems + 1 };
}
