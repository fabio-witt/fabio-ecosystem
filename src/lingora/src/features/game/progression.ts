/**
 * Pure game rules: player level, divisions, daily and weekly chests,
 * the season pass, lesson crowns and the learning journey. No React here,
 * so everything can be unit tested.
 */
import type { DayLog } from './store';

// ---------- player level ----------

/** Total XP needed to reach a level: 0, 50, 150, 300, 500, … */
export function xpForLevel(level: number) {
  return 25 * (level - 1) * level;
}

export function levelFromXp(totalXp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) level++;
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  return { level, into: totalXp - start, span: end - start, progress: (totalXp - start) / (end - start) };
}

export function levelTitle(level: number) {
  if (level >= 30) return 'Polyglot';
  if (level >= 20) return 'Language pro';
  if (level >= 10) return 'Globetrotter';
  if (level >= 5) return 'Traveller';
  return 'Explorer';
}

// ---------- divisions (by XP this week) ----------

export const divisions = [
  { id: 'bronze', icon: '🥉', name: 'Bronze', min: 0 },
  { id: 'silver', icon: '🥈', name: 'Silver', min: 100 },
  { id: 'gold', icon: '🥇', name: 'Gold', min: 300 },
  { id: 'sapphire', icon: '💠', name: 'Sapphire', min: 600 },
  { id: 'ruby', icon: '♦️', name: 'Ruby', min: 1000 },
  { id: 'diamond', icon: '💎', name: 'Diamond', min: 1600 },
] as const;

export function divisionFor(weekXp: number) {
  let index = 0;
  divisions.forEach((division, i) => { if (weekXp >= division.min) index = i; });
  const next = divisions[index + 1];
  return { ...divisions[index], index, next, toNext: next ? next.min - weekXp : 0 };
}

// ---------- dates ----------

export function dayKeyOf(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Monday of the week as "YYYY-MM-DD". */
export function weekKey(date = new Date()) {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return dayKeyOf(monday);
}

export function weekTotals(days: Record<string, DayLog>, date = new Date()) {
  const start = new Date(date);
  start.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  let xp = 0;
  let active = 0;
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const log = days[dayKeyOf(day)];
    if (!log) continue;
    xp += log.xp || 0;
    if (log.lessons > 0 || log.words > 0) active++;
  }
  return { xp, active };
}

export function isGemWeekend(date = new Date()) {
  return date.getDay() === 0 || date.getDay() === 6;
}

// ---------- daily chest (7-day calendar) ----------

export const DAILY_REWARDS = [10, 15, 20, 25, 30, 40, 75];

/** Next day in the calendar: continues if you claimed yesterday, else starts again at day 1. */
export function dailyChestState(last: string | undefined, run: number, today = new Date()) {
  const todayKey = dayKeyOf(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const claimedToday = last === todayKey;
  const continues = last === dayKeyOf(yesterday);
  const nextRun = claimedToday ? run : continues ? (run % 7) + 1 : 1;
  return { claimedToday, day: nextRun, reward: DAILY_REWARDS[nextRun - 1], todayKey };
}

// ---------- season pass ----------

export const SEASON_DAYS = 28;
export const SEASON_TIERS = 20;
export const XP_PER_TIER = 120;
const SEASON_START = Date.UTC(2026, 0, 5); // a Monday

export function currentSeason(now = new Date()) {
  const index = Math.floor((now.getTime() - SEASON_START) / (SEASON_DAYS * 86_400_000));
  const start = new Date(SEASON_START + index * SEASON_DAYS * 86_400_000);
  const end = new Date(start.getTime() + SEASON_DAYS * 86_400_000);
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
  return { id: `s${index}`, number: index + 1, start, end, daysLeft };
}

export function seasonXp(days: Record<string, DayLog>, start: Date, end: Date) {
  const from = dayKeyOf(start);
  const to = dayKeyOf(new Date(end.getTime() - 1));
  return Object.entries(days).filter(([key]) => key >= from && key <= to).reduce((sum, [, day]) => sum + (day.xp || 0), 0);
}

/** Reward of a tier: gems every tier, bigger ones every 5th; Plus doubles it. */
export function tierReward(tier: number, plus: boolean) {
  const base = tier % 5 === 0 ? 50 : 10 + tier;
  return plus ? base * 2 : base;
}

// ---------- lesson crowns ----------

/** 1 crown per completion milestone: 1, 2, 4, 7, 10 completions. */
export function crownsFor(completions: number | undefined) {
  const n = completions ?? 0;
  return n >= 10 ? 5 : n >= 7 ? 4 : n >= 4 ? 3 : n >= 2 ? 2 : n >= 1 ? 1 : 0;
}

// ---------- journey ----------

export const journeyStops = [
  { level: 'A1', icon: '✈️', title: 'Arrival', text: 'Greetings, numbers, finding your way.' },
  { level: 'A2', icon: '☕', title: 'First friends', text: 'Small talk, shopping, everyday life.' },
  { level: 'B1', icon: '🏠', title: 'Settling in', text: 'Flat, work, opinions and plans.' },
  { level: 'B2', icon: '💼', title: 'At work', text: 'Meetings, debates, the news.' },
  { level: 'C1', icon: '🎭', title: 'Like a local', text: 'Humour, idioms, culture.' },
  { level: 'C2', icon: '🏔', title: 'Summit', text: 'Mastery – nuance and style.' },
] as const;
