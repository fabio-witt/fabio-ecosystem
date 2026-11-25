import { exchangeFields, interestOptions, splitAnswers } from '@/features/profile/exchange-details';

type PublicPreferences = { interests?: string[] | null; conversation_topics?: string | null };
const topics: readonly string[] = [
  ...interestOptions,
  ...exchangeFields.find(field => field.key === 'conversation_topics')!.options,
];

export function partnerTopics(profile?: PublicPreferences | null) {
  return [...new Set([...(profile?.interests ?? []), ...splitAnswers(profile?.conversation_topics)])]
    .filter(topic => topics.includes(topic));
}

export function commonPartnerTopics(me?: PublicPreferences | null, partner?: PublicPreferences | null) {
  const mine = new Set(partnerTopics(me));
  return partnerTopics(partner).filter(topic => mine.has(topic));
}

export function partnerTopicTask(topic?: string) {
  return topic && topics.includes(topic) ? 'partner-topic:' + topic : 'partner-intro';
}

export function readPartnerTopicTask(task: string) {
  const prefix = 'partner-topic:';
  if (!task.startsWith(prefix)) return undefined;
  const topic = task.slice(prefix.length);
  return topics.includes(topic) ? topic : undefined;
}
