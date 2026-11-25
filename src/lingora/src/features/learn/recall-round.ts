import type { ScoredExercise } from './exercise';

export function recallRound(examples: [string, string?][]): ScoredExercise[] {
  const seen = new Set<string>();
  const round: ScoredExercise[] = [];
  for (const [sentence, meaning] of examples) {
    const clean = sentence.trim();
    if (!meaning?.trim() || seen.has(clean)) continue;
    const match = clean.match(/([\p{L}\p{M}’'-]+)([^\p{L}\p{M}]*)$/u);
    if (!match || !/\p{L}/u.test(match[1]) || !clean.slice(0, match.index).trim()) continue;
    seen.add(clean);
    round.push({
      type: 'type',
      prompt: `${clean.slice(0, match.index)}___${match[2]}\n${meaning}`,
      accept: [match[1]],
      explain: clean,
    });
    if (round.length === 3) break;
  }
  return round;
}
