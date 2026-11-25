export const exchangeScenarios = {
  station: {
    title: 'Find the last train',
    goal: 'Agree on a route and tell each other when and where to meet.',
    roleA: 'Your train is cancelled. You need to arrive by 20:00. Ask what options you have and confirm the new platform.',
    roleB: 'You work at the station. The 18:45 train from platform 4 is delayed until 19:10. The 19:00 from platform 2 arrives at 19:50. Explain the options.',
    phrases: 'Which platform does it leave from? · Could you repeat the time?',
  },
  cafe: {
    title: 'Order at a café',
    goal: 'Agree on an order and confirm the price.',
    roleA: 'You have eight francs. Order something warm and ask whether an ingredient can be left out.',
    roleB: 'You work at the café. Soup costs six francs and you can leave out the cream. A sandwich costs nine francs. Offer an alternative and confirm the order.',
    phrases: 'Could I have it without …? · How much does that cost?',
  },
  plans: {
    title: 'Change a plan',
    goal: 'Agree on a new time and place.',
    roleA: 'You planned to meet on Tuesday. You can only make Thursday after work. Explain the change and ask about your partner’s availability.',
    roleB: 'Thursday works after 18:30, but the original meeting place is closed. Suggest a new place and check the time.',
    phrases: 'Would Thursday work for you? · Shall we meet at … instead?',
  },
} as const;

export type ExchangeScenarioId = keyof typeof exchangeScenarios;

export function exchangeScenarioId(value: unknown): ExchangeScenarioId | undefined {
  return typeof value === 'string' && Object.hasOwn(exchangeScenarios, value) ? value as ExchangeScenarioId : undefined;
}

export function exchangeTaskId(id: ExchangeScenarioId) {
  return `exchange-${id}`;
}

export function exchangeInvitation(id: ExchangeScenarioId, text: string) {
  return `${text}\n[lingora:${exchangeTaskId(id)}]`;
}

export function readExchangeInvitation(content: string) {
  const match = content.match(/\n\[lingora:exchange-([a-z]+)\]$/);
  const id = exchangeScenarioId(match?.[1]);
  return match && id ? { id, text: content.slice(0, match.index) } : undefined;
}

export function exchangeTask(task: string | undefined) {
  const id = task?.startsWith('exchange-') ? exchangeScenarioId(task.slice(9)) : undefined;
  if (!id) return undefined;
  return { id, ...exchangeScenarios[id] };
}

const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const progressMarker = new RegExp(`\\n\\[lingora:exchange-done:(${uuid}):([12])\\]$`, 'i');

export function exchangeUuid(value: unknown): value is string {
  return typeof value === 'string' && new RegExp(`^${uuid}$`, 'i').test(value);
}

export function exchangeProgress(invitation: string, round: 1 | 2, text: string) {
  return `${text}\n[lingora:exchange-done:${invitation}:${round}]`;
}

export function readExchangeProgress(content: string) {
  const match = content.match(progressMarker);
  if (!match) return undefined;
  return { invitation: match[1], round: match[2] === '2' ? 2 : 1, text: content.slice(0, match.index) };
}

export function exchangeConfirmations(messages: {
  id: string; sender_id: string; content: string; message_type: string | null;
}[]) {
  const confirmations = new Map<string, Map<number, Set<string>>>();
  // Chat messages arrive newest first. Register the invitation before its replies.
  const invitations = new Set<string>();
  for (const message of [...messages].reverse()) {
    if ((message.message_type ?? 'text') !== 'text') continue;
    if (readExchangeInvitation(message.content)) invitations.add(message.id);
    const progress = readExchangeProgress(message.content);
    if (!progress || !invitations.has(progress.invitation)) continue;
    const rounds = confirmations.get(progress.invitation) ?? new Map<number, Set<string>>();
    const people = rounds.get(progress.round) ?? new Set<string>();
    people.add(message.sender_id);
    rounds.set(progress.round, people);
    confirmations.set(progress.invitation, rounds);
  }
  return confirmations;
}
