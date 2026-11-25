import { dayKey, type DayLog, type GameState } from './store';

/** Lessons, words and fixed mistakes from Monday until today (device log). */
export function weekTotals(state: GameState, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const totals: DayLog & { days: number } = { lessons: 0, perfect: 0, words: 0, mistakes: 0, xp: 0, sprints: 0, days: 0 };
  for (let day = new Date(start); day <= now; day.setDate(day.getDate() + 1)) {
    const log = state.days[dayKey(day)];
    if (!log) continue;
    totals.lessons += log.lessons; totals.perfect += log.perfect; totals.words += log.words;
    totals.mistakes += log.mistakes; totals.xp += log.xp; totals.sprints += log.sprints;
    if (log.lessons + log.words + log.sprints > 0) totals.days += 1;
  }
  return totals;
}
