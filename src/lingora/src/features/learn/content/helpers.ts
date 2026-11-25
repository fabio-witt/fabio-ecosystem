import type { Exercise, Lesson, Reading } from '../catalog';

export function lesson(
  id: string, title: string, rule: string, structure: string,
  examples: Lesson['examples'], tip: string, ...ex: Exercise[]
): Lesson {
  return { id, title, rule, structure, examples, tip, ex };
}

export function reading(id: string, title: string, text: string, tr: string, ...ex: Exercise[]): Reading {
  return { id, title, text, tr, ex };
}

export const choice = (prompt: string, options: string[], answer: number, explain: string): Exercise =>
  ({ type: 'choice', prompt, options, answer, explain });
export const build = (prompt: string, answer: string, extra: string[], explain: string): Exercise =>
  ({ type: 'build', prompt, answer, extra, explain });
export const match = (prompt: string, pairs: [string, string][]): Exercise =>
  ({ type: 'match', prompt, pairs });
