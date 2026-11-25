import type { DayLog } from './store';

export type Challenge = { id: string; icon: string; title: string; goal: number; value: number; gems: number };

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** This month's challenges, computed from the daily log (keys "YYYY-MM-DD"). */
export function monthlyChallenges(days: Record<string, DayLog>, month = monthKey()): Challenge[] {
  const logs = Object.entries(days).filter(([key]) => key.startsWith(month)).map(([, day]) => day);
  const sum = (pick: (day: DayLog) => number) => logs.reduce((total, day) => total + (pick(day) || 0), 0);
  const active = logs.filter((day) => day.lessons > 0 || day.words > 0 || day.sprints > 0).length;
  return [
    { id: `${month}:days15`, icon: '📅', title: 'Learn on 15 days this month', goal: 15, value: active, gems: 100 },
    { id: `${month}:lessons30`, icon: '📚', title: 'Finish 30 lessons', goal: 30, value: sum((day) => day.lessons), gems: 80 },
    { id: `${month}:xp1000`, icon: '⚡', title: 'Collect 1000 XP', goal: 1000, value: sum((day) => day.xp), gems: 80 },
    { id: `${month}:perfect10`, icon: '💯', title: '10 perfect lessons', goal: 10, value: sum((day) => day.perfect), gems: 60 },
    { id: `${month}:words200`, icon: '🗂', title: 'Practise 200 words', goal: 200, value: sum((day) => day.words), gems: 60 },
  ];
}

/** Totals for a range of days ending today (inclusive), for the weekly report. */
export function rangeTotals(days: Record<string, DayLog>, from: Date, to: Date) {
  const start = localKey(from);
  const end = localKey(to);
  const logs = Object.entries(days).filter(([key]) => key >= start && key <= end).map(([, day]) => day);
  const sum = (pick: (day: DayLog) => number) => logs.reduce((total, day) => total + (pick(day) || 0), 0);
  return {
    activeDays: logs.filter((day) => day.lessons > 0 || day.words > 0).length,
    lessons: sum((day) => day.lessons), xp: sum((day) => day.xp), words: sum((day) => day.words),
    mistakes: sum((day) => day.mistakes), perfect: sum((day) => day.perfect),
  };
}

function localKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
