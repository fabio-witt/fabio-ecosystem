import { buildQuestions, type QuizPair } from './quiz';

export function daySeed(course: string, date: string) {
  let seed = 0;
  for (const character of `${course}:${date}`) seed = (seed * 31 + character.charCodeAt(0)) | 0;
  return seed;
}

export function circuitQuestions(pairs: QuizPair[], course: string, date: string) {
  return buildQuestions(pairs, 5, daySeed(course, date));
}

export function circuitMedal(correct: number, total: number) {
  if (!total || correct < total - 1) return null;
  return correct === total ? 'gold' : 'silver';
}

export function saveCircuitScore(previous: Record<string, number>, date: string, score: number) {
  const record = { ...previous, [date]: Math.max(previous[date] ?? 0, score) };
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => b.localeCompare(a)).slice(0, 60));
}

export function weekMedals(scores: Record<string, number>, day: string, total: number) {
  const monday = new Date(`${day}T00:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  const start = monday.toISOString().slice(0, 10);
  return Object.entries(scores).filter(([date, score]) =>
    date >= start && date <= day && circuitMedal(score, total)).length;
}
