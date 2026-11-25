import { useMessages, useSendMessage } from '@/features/chats/messages';
import { useStartConversation } from '@/features/chats/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AppText, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { exchangeConfirmations, exchangeProgress, exchangeScenarioId, exchangeScenarios, exchangeUuid, exchangeTaskId, type ExchangeScenarioId } from '@/features/chats/exchange-table';
import { useActiveCourse } from '@/features/learn/active-course';
import { rememberExchange } from '@/features/learn/course-entry';
import { useNow } from '@/hooks/use-now';
import { t } from '@/lib/i18n';
import { useSession } from '@/providers/session-provider';

export default function ExchangeTable() {
  const { scenario: requested, course: suggested, role: initialRole, partner, chat, invite, round: initialRound } = useLocalSearchParams<{
    scenario?: string; course?: string; role?: string; partner?: string; chat?: string; invite?: string; round?: string;
  }>();
  const { user } = useSession();
  const { course } = useActiveCourse();
  const conversation = useStartConversation();
  const send = useSendMessage(typeof chat === 'string' ? chat : '');
  const messages = useMessages(exchangeUuid(chat) ? chat : undefined);
  const confirmed = useMemo(() => exchangeConfirmations(messages.data?.pages.flat() ?? []).get(invite ?? ''), [invite, messages.data]);
  const shared = !!user && !user.is_anonymous && exchangeUuid(chat) && exchangeUuid(invite);
  const [selected, select] = useState<ExchangeScenarioId | undefined>(exchangeScenarioId(requested));
  const startsInSecondRound = initialRound === '2';
  const [role, setRole] = useState<'A' | 'B'>((initialRole === 'B') !== startsInSecondRound ? 'B' : 'A');
  const [phase, setPhase] = useState<1 | 2>(startsInSecondRound ? 2 : 1);
  const isConfirmed = !!user && !!confirmed?.get(phase)?.has(user.id);
  const [secret, setSecret] = useState(false);
  const [endAt, setEndAt] = useState<number>();
  const now = useNow(500);
  const remaining = endAt === undefined ? undefined : Math.max(0, Math.ceil((endAt - now) / 1000));
  const scenario = selected ? exchangeScenarios[selected] : undefined;
  const language = suggested ?? course?.id;

  function chooseRole(next: 'A' | 'B') {
    setRole(next);
    setSecret(false);
  }

  function findPartner(id: ExchangeScenarioId) {
    const task = exchangeTaskId(id);
    if (!user || user.is_anonymous) {
      rememberExchange(task);
      router.push(user ? '/create-account' : '/login');
      return;
    }
    if (partner) {
      conversation.mutate(partner, { onSuccess: id => router.push({ pathname: '/chat/[id]', params: { id, task } }) });
    } else {
      router.push({ pathname: '/community', params: { section: 'partners', task, ...(language ? { course: language } : {}) } });
    }
  }

  return (
    <Screen>
      <ScreenHeader title={t('Exchange table')} />
      <ScrollView contentContainerStyle={{ padding: screenPadding, gap: spacing.md, paddingBottom: spacing.xxxl }}>
        {!scenario || !selected ? <>
          <AppText>{t('Solve a scene together. Switch roles and languages for the second round.')}</AppText>
          {(Object.keys(exchangeScenarios) as ExchangeScenarioId[]).map(id => (
            <Button key={id} title={t(exchangeScenarios[id].title)} variant="secondary" onPress={() => {
              select(id);
              setPhase(1);
              chooseRole('A');
              setEndAt(undefined);
            }} />
          ))}
        </> : <>
          <Button title={t('Choose another situation')} variant="ghost" onPress={() => select(undefined)} />
          <Card style={{ gap: spacing.sm }}>
            <AppText variant="heading">{t(scenario.title)}</AppText>
            <AppText>{t(scenario.goal)}</AppText>
            <AppText variant="caption">{phase === 1
              ? t('Round 1: agree on your first practice language.')
              : t('Round 2: use your partner’s language and swap roles.')}</AppText>
            <AppText>{t('Each person opens a different role. Keep your clue to yourself and explain it aloud or in chat.')}</AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {(['A', 'B'] as const).map(option => (
                <Button key={option} title={t('Role {role}', { role: option })}
                  accessibilityState={{ selected: role === option }} variant={role === option ? 'primary' : 'secondary'}
                  onPress={() => chooseRole(option)} />
              ))}
            </View>
            <Button title={secret ? t('Hide my clue') : t('Show my clue')} size="sm" variant="secondary" onPress={() => setSecret(value => !value)} />
            {secret && <AppText>{t(role === 'A' ? scenario.roleA : scenario.roleB)}</AppText>}
            <AppText variant="caption" color="textSecondary">{t(scenario.phrases)}</AppText>
            <Button title={remaining === undefined ? t('Start optional two-minute timer') : t('Restart timer')}
              variant="ghost" onPress={() => setEndAt(Date.now() + 120_000)} />
            {remaining !== undefined && <AppText variant="bodyStrong">{remaining === 0
              ? t('Time to switch or keep talking')
              : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}</AppText>}
            {shared && <Button title={isConfirmed ? t('Round confirmed') : t('Confirm this round in chat')}
              variant="secondary" disabled={isConfirmed || send.isPending} loading={send.isPending}
              onPress={() => {
                const round = phase;
                send.mutate({ content: exchangeProgress(invite, round, t('I finished round {n} of our exchange.', { n: round })) });
              }} />}
            {send.isError && <AppText color="danger">{t('Could not confirm the round. Try again.')}</AppText>}
            {phase === 1 && <Button title={t('Switch roles and languages')} onPress={() => {
              setPhase(2);
              chooseRole(role === 'A' ? 'B' : 'A');
              setEndAt(undefined);
            }} />}
          </Card>
          {!shared && <Button title={t('Invite a partner')} variant="secondary" loading={conversation.isPending} onPress={() => findPartner(selected)} />}
          {conversation.isError && <AppText color="danger">{t('Could not start the chat')}</AppText>}
          {user && !user.is_anonymous && !shared && <Button title={t('Find a partner in the forum')}
            variant="secondary" onPress={() => router.push({ pathname: '/forum/new', params: {
              practice: 'exchange-table', scenario: selected, ...(language ? { course: language } : {}),
            } })} />}
          {user && !user.is_anonymous && <Button title={t('Open a room for this topic')} variant="secondary"
            onPress={() => router.push({ pathname: '/meetups', params: { topic: selected, ...(language ? { course: language } : {}) } })} />}
        </>}
      </ScrollView>
    </Screen>
  );
}
