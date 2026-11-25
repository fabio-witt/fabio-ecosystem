import { localDay } from './zurich-adventure';

export type Mastery = { recognised?: string; recalled?: string; rememberedLater?: boolean };

export function ratePhrase(previous: Mastery, mode: 'recognise' | 'recall', now: Date): Mastery {
  const day = localDay(now);
  if (mode === 'recognise') return { ...previous, recognised: previous.recognised ?? day };
  return {
    ...previous,
    recalled: previous.recalled ?? day,
    rememberedLater: !!previous.rememberedLater || (!!previous.recalled && previous.recalled !== day),
  };
}

export function phraseStars(value: Mastery = {}) {
  return Number(!!value.recognised) + Number(!!value.recalled) + Number(!!value.rememberedLater);
}
