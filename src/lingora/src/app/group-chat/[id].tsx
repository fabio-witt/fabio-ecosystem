import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Avatar, Button, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, typography, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useGroupMembers } from '@/features/chats/group';
import { useMarkConversationRead, useMessageSubscription, useMessages, useSendMessage, type ChatMessage } from '@/features/chats/messages';
import { CallCard, VoiceButton, VoicePlayer, newCallRoom, openCall } from '@/features/chats/voice';
import { ReportButton } from '@/features/safety/actions';
import { t } from '@/lib/i18n';
import { useSession } from '@/providers/session-provider';

/** Group chat of a club: text, voice messages and a shared video call. */
export default function GroupChatScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const { user } = useSession();
  const messages = useMessages(id);
  const members = useGroupMembers(id);
  const send = useSendMessage(id);
  const markRead = useMarkConversationRead(id);
  const [draft, setDraft] = useState('');
  const [actionsFor, setActionsFor] = useState<string>();
  const list = useRef<FlatList<ChatMessage>>(null);
  const items = useMemo(() => messages.data?.pages.flat() ?? [], [messages.data]);
  const markReadNow = markRead.mutate;
  useMessageSubscription(id, useCallback(() => {
    markReadNow();
    requestAnimationFrame(() => list.current?.scrollToOffset({ offset: 0, animated: true }));
  }, [markReadNow]));

  function submit() {
    const content = draft.trim();
    if (!content || send.isPending) return;
    send.mutate({ content }, { onSuccess: () => setDraft('') });
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={title ?? t('Club chat')} right={(
        <Button title="📞" size="sm" variant="secondary" accessibilityLabel={t('Start a group video call')}
          onPress={() => { const room = newCallRoom(); send.mutate({ content: room, type: 'call' }); openCall(room); }} />
      )} />
      <AppText variant="caption" color="textSecondary" style={styles.hint}>
        {t('{n} members · Be kind, write in the language you learn.', { n: members.data?.size ?? 0 })}
      </AppText>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {messages.isPending ? <LoadingState /> : messages.isError ? <ErrorState message={t('Could not load this conversation.')} onRetry={() => messages.refetch()} /> : (
          <FlatList
            ref={list}
            inverted
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            onEndReached={() => { if (messages.hasNextPage) void messages.fetchNextPage(); }}
            ListEmptyComponent={<EmptyState title={t('Say hello to your club!')} message={t('Introduce yourself in the language you are learning.')} />}
            renderItem={({ item }) => {
              const mine = item.sender_id === user?.id;
              const author = members.data?.get(item.sender_id);
              const name = author?.full_name || author?.username || t('Member');
              return (
                <View style={[styles.row, mine && styles.rowMine]}>
                  {!mine ? (
                    <Pressable onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.sender_id } })} accessibilityLabel={t('Open profile of {name}', { name })}>
                      <Avatar name={name} uri={author?.avatar_url} size={30} />
                    </Pressable>
                  ) : null}
                  <Pressable onLongPress={() => setActionsFor(item.id)} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                    {!mine ? <AppText variant="small" style={styles.name}>{name}</AppText> : null}
                    {item.message_type === 'voice' ? <VoicePlayer path={item.content} mine={mine} />
                      : item.message_type === 'call' ? <CallCard room={item.content} mine={mine} />
                        : <AppText color={mine ? 'onPrimary' : 'text'} selectable>{item.content}</AppText>}
                  </Pressable>
                  {actionsFor === item.id && !mine ? <ReportButton kind="message" id={item.id} /> : null}
                </View>
              );
            }}
          />
        )}
        {send.isError ? <AppText color="danger" style={styles.hint}>{send.error.message}</AppText> : null}
        <View style={styles.composer}>
          <VoiceButton conversationId={id} disabled={send.isPending} onRecorded={(path) => send.mutate({ content: path, type: 'voice' })} />
          <TextInput style={styles.input} value={draft} onChangeText={setDraft} placeholder={t('Write a message…')}
            placeholderTextColor={colors.textMuted} multiline maxLength={2000} accessibilityLabel={t('Message')} />
          <Button title={t('Send')} size="sm" disabled={!draft.trim()} loading={send.isPending} onPress={submit} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  hint: { paddingHorizontal: screenPadding },
  list: { padding: screenPadding, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, maxWidth: '88%' },
  rowMine: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  bubble: { borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 2, flexShrink: 1 },
  mine: { backgroundColor: colors.primary },
  theirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle },
  name: { fontWeight: '800', color: colors.primary },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: screenPadding, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, ...typography.callout, color: colors.text, maxHeight: 120, minHeight: 44, paddingHorizontal: spacing.md, paddingTop: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.background },
});
