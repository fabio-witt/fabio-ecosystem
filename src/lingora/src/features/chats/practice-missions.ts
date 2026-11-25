export const practiceMissions = [
  { id: 'introduce', title: 'Introduce yourself', invitation: 'Would you like to practise introductions? Let’s each write three sentences about ourselves and ask one follow-up question.' },
  { id: 'weekend', title: 'Plan a weekend', invitation: 'Would you like to plan an imaginary weekend together? Suggest a place and an activity, then let’s agree on a plan.' },
  { id: 'cafe', title: 'At the café', invitation: 'Would you like to practise ordering at a café? One of us can be the customer and the other the waiter. Then we switch roles.' },
  { id: 'expression', title: 'Exchange an expression', invitation: 'Shall we each share an everyday expression in our language, explain its meaning and try it in a sentence?' },
] as const;

// Explicit consent before replacing a saved draft, including whitespace-only drafts.
export function missionDraft(current: string, invitation: string): string {
  return current.length ? current : invitation;
}

/** Shared, low-pressure structure for every exchange: no message-volume reward. */
export const missionSteps = [
  'Ask whether your partner wants to practise.',
  'Take turns and ask one follow-up question.',
  'Offer a correction only if your partner wants one.',
  'Share one expression you want to remember.',
] as const;
