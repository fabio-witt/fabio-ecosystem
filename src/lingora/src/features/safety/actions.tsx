import { router } from 'expo-router';

import { Button } from '@/components/ui';
import { t } from '@/lib/i18n';

export const reportKinds = ['profile', 'post', 'comment', 'message', 'review', 'forum_thread', 'forum_reply'] as const;
export type ReportKind = typeof reportKinds[number];

export const reportReasons = [
  ['harassment', 'Harassment or threats'],
  ['hate', 'Hate or discrimination'],
  ['sexual', 'Sexual content'],
  ['violence', 'Violence or self-harm'],
  ['spam', 'Spam or scams'],
  ['other', 'Other'],
] as const;

const KIND_LABEL: Partial<Record<ReportKind, string>> = { forum_thread: 'topic', forum_reply: 'answer' };

export function ReportButton({ kind, id }: { kind: ReportKind; id: string }) {
  return (
    <Button title={t('Report {kind}', { kind: t(KIND_LABEL[kind] ?? kind) })} variant="ghost" size="sm"
      onPress={() => router.push({ pathname: '/safety-action', params: { kind, id } })} />
  );
}

export function BlockButton({ id }: { id: string }) {
  return (
    <Button title={t("Block user")} variant="ghost" size="sm"
      onPress={() => router.push({ pathname: '/safety-action', params: { kind: 'block', id } })} />
  );
}
