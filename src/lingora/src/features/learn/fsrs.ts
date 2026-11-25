/**
 * FSRS (Free Spaced Repetition Scheduler, v4.5 with its default weights),
 * reduced to two answers: remembered or forgotten. Each card keeps a
 * stability (days until recall drops to 90 %) and a difficulty (1–10).
 */
const W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
const DECAY = -0.5;
const FACTOR = 19 / 81;
const DAY = 86_400_000;
const MAX_DAYS = 365;

export type FsrsCard = { s: number; d: number; last: number };

const clampD = (d: number) => Math.min(10, Math.max(1, d));

/** Probability of remembering after `days` with stability `s`. */
export function retrievability(days: number, s: number) {
  return Math.pow(1 + (FACTOR * days) / s, DECAY);
}

/** Next state and the interval in days (target retention 90 %). */
export function fsrsReview(card: FsrsCard | undefined, remembered: boolean, now = Date.now()): FsrsCard & { days: number } {
  const grade = remembered ? 3 : 1;
  let s: number;
  let d: number;
  if (!card) {
    s = W[grade - 1];
    d = clampD(W[4] - (grade - 3) * W[5]);
  } else {
    const elapsed = Math.max(0, (now - card.last) / DAY);
    const r = retrievability(elapsed, card.s);
    const d0 = W[4];
    d = clampD(W[7] * d0 + (1 - W[7]) * (card.d - W[6] * (grade - 3)));
    s = remembered
      ? card.s * (Math.exp(W[8]) * (11 - card.d) * Math.pow(card.s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) + 1)
      : Math.min(card.s, W[11] * Math.pow(card.d, -W[12]) * (Math.pow(card.s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)));
  }
  s = Math.max(0.1, s);
  const days = remembered ? Math.min(MAX_DAYS, Math.max(1, Math.round(s))) : 0;
  return { s, d, last: now, days };
}
