import { exchangeInvitation, exchangeConfirmations, exchangeScenarios, readExchangeInvitation, readExchangeProgress } from '@/features/chats/exchange-table';
import * as Clipboard from 'expo-clipboard';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View,
} from 'react-native';

import { AppText, Avatar, Button, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, typography, useThemedStyles, type ThemeColors } from '@/constants/theme';
import {
  useChatPartner, useChatReadBoundary, useMarkConversationRead, useMessageSubscription, useMessages, useSendMessage, type ChatMessage,
} from '@/features/chats/messages';
import { practiceMissions, missionDraft, missionSteps } from '@/features/chats/practice-missions';
import { conversationTask } from '@/features/learn/conversation-tasks';
import { useCorrectionAction } from '@/features/learn/correction-review';
import { useReviewStatus } from '@/features/partners/api';
import { ExchangeSessions, ScheduleButton } from '@/features/chats/exchange';
import { CallCard, VoiceButton, VoicePlayer, newCallRoom, openCall } from '@/features/chats/voice';
import { BlockButton } from '@/features/safety/actions';
import { useDeviceState } from '@/lib/device-state';
import { useSession } from '@/providers/session-provider';
import { t } from '@/lib/i18n';

const MAX_LENGTH = 2000;

function formatTime(date: string | null) {
  if (!date) return '';
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? '' : value.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function ChatDetailScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const { id, task } = useLocalSearchParams<{ id: string; task?: string }>();
  const { user } = useSession();
  const partner = useChatPartner(id);
  const messages = useMessages(id);
  const send = useSendMessage(id);
  const markRead = useMarkConversationRead(id);
  const review = useReviewStatus(partner.data?.id);

  const [draft, writeDraft] = useDeviceState(user?.id, `chat.${id}`, '');
  const [usedStarter, setUsedStarter] = useState<string>();
  const starter = task !== usedStarter && conversationTask(task);
  const [correcting, setCorrecting] = useState<ChatMessage | null>(null);
  const [correctionText, setCorrectionText] = useState('');
  const [actionsFor, setActionsFor] = useState<ChatMessage>();
  const [copyStatus, setCopyStatus] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const atLatest = useRef(true);
  const jumpedOnOpen = useRef(false);
  const focused = useRef(false);
  const boundary = useChatReadBoundary(id);
  const exchangeDraft = !correcting ? readExchangeInvitation(draft) : undefined;
  const input = correcting ? correctionText : exchangeDraft?.text ?? draft;
  function setInput(value: string) {
    if (correcting) setCorrectionText(value);
    else writeDraft(exchangeDraft && value ? exchangeInvitation(exchangeDraft.id, value) : value);
  }

  const markReadNow = markRead.mutate;
  const onIncoming = useCallback(() => {
    if (!focused.current) return;
    if (!atLatest.current) {
      setShowNew(true);
      return;
    }
    markReadNow();
    requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));
  }, [markReadNow]);
  useMessageSubscription(id, onIncoming);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    if (boundary.isSuccess && atLatest.current) markReadNow();
    return () => { focused.current = false; };
  }, [boundary.isSuccess, markReadNow]));

  const items = useMemo(() => messages.data?.pages.flat() ?? [], [messages.data]);
  const confirmations = useMemo(() => exchangeConfirmations(items), [items]);
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const oldestUnread = items.findLastIndex((item) =>
    boundary.isSuccess && item.sender_id !== user?.id && item.created_at
      && (!boundary.data || Date.parse(item.created_at) > Date.parse(boundary.data)));
  const unreadExtendsPastPage = oldestUnread === items.length - 1 && oldestUnread >= 0 && messages.hasNextPage;

  useEffect(() => {
    if (!partner.isSuccess || jumpedOnOpen.current || oldestUnread < 0 || unreadExtendsPastPage || !listRef.current) return;
    jumpedOnOpen.current = true;
    listRef.current.scrollToIndex({ index: oldestUnread, animated: false, viewPosition: 0.5 });
  }, [oldestUnread, partner.isSuccess, unreadExtendsPastPage]);

  function jumpToUnread() {
    if (unreadExtendsPastPage) {
      void messages.fetchNextPage();
      return;
    }
    if (oldestUnread >= 0) listRef.current?.scrollToIndex({ index: oldestUnread, animated: true, viewPosition: 0.5 });
  }

  function startCorrection(message: ChatMessage) {
    setActionsFor(undefined);
    setCorrecting(message);
    setCorrectionText(message.content);
  }

  function submit() {
    const content = input.trim();
    if (!content || send.isPending) return;
    if (correcting && content === correcting.content.trim()) {
      Alert.alert(t("Nothing changed"), t("Edit the text to show the correction."));
      return;
    }
    const message = exchangeDraft ? exchangeInvitation(exchangeDraft.id, content) : content;
    send.mutate({ content: message, correctsId: correcting?.id }, {
      onSuccess: () => {
        if (correcting) setCorrectionText('');
        else writeDraft(null);
        setCorrecting(null);
      },
    });
  }

  if (partner.isPending || messages.isPending) {
    return (
      <Screen>
        <ScreenHeader title={t("Chat")} />
        <LoadingState message={t("Loading conversation…")} />
      </Screen>
    );
  }

  if (partner.isError || messages.isError) {
    return (
      <Screen>
        <ScreenHeader title={t("Chat")} />
        <ErrorState message={t("Could not load this conversation. Your draft is still saved.")}
          onRetry={() => { void partner.refetch(); void messages.refetch(); }} />
      </Screen>
    );
  }
  if (!partner.data) {
    return (
      <Screen>
        <ScreenHeader title={t("Chat")} />
        <EmptyState title={t("This conversation is unavailable")} message={t("It may have been removed or blocked.")} />
      </Screen>
    );
  }

  const partnerData = partner.data;
  const showReviewBanner = review.data?.eligible && !review.data.my_review;

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader
        title={partnerData.name}
        right={(
          <View style={styles.headerActions}>
            <Button title="📞" size="sm" variant="secondary" accessibilityLabel={t('Start a video call')}
              onPress={() => { const room = newCallRoom(); send.mutate({ content: room, type: 'call' }); openCall(room); }} />
            <ScheduleButton conversationId={id} />
            <BlockButton id={partnerData.id} />
          </View>
        )}
      />
      <Pressable
        style={styles.partnerRow}
        onPress={() => router.push({ pathname: '/user/[id]', params: { id: partnerData.id } })}
        accessibilityRole="button"
        accessibilityLabel={t('Open profile of {name}', { name: partnerData.name })}
      >
        <Avatar name={partnerData.name} uri={partnerData.avatar_url} size={32} />
        <AppText variant="caption" color="textSecondary">{t("View profile · Long-press a message to correct it")}</AppText>
      </Pressable>

      {showReviewBanner ? (
        <Pressable
          style={styles.banner}
          onPress={() => router.push({ pathname: '/review/[id]', params: { id: partnerData.id, name: partnerData.name } })}
          accessibilityRole="button"
        >
          <AppText variant="caption" color="primary" style={styles.bold}>
            {t('You have exchanged 50 messages. Leave {name} a review!', { name: partnerData.name })}
          </AppText>
        </Pressable>
      ) : null}

      <Button title={showMissions ? t('Close practice ideas') : t('Practise together')} variant="ghost" onPress={() => setShowMissions(value => !value)} />
      {showMissions && <View style={{ gap: spacing.sm, paddingHorizontal: screenPadding }}>
        <AppText variant="caption">{t('Choose a mission. Your invitation stays a draft until you send it.')}</AppText>
        {practiceMissions.map(mission => <Button key={mission.id} title={t(mission.title)} variant="secondary" size="sm" disabled={!!draft || !!correcting} onPress={() => {
          writeDraft(missionDraft(draft ?? '', t(mission.invitation)));
          setShowMissions(false);
        }} />)}
        {!!draft && <AppText variant="caption">{t('Send or clear your draft before choosing a mission.')}</AppText>}
        {missionSteps.map((step, index) => <AppText key={step} variant="caption">{index + 1}. {t(step)}</AppText>)}
        <Button title={t('Exchange table')} variant="ghost" onPress={() => router.push({ pathname: '/exchange-table', params: { partner: partnerData.id } })} />
        <Button title={t('Team quests')} variant="ghost" onPress={() => router.push('/team-quests')} />
        <Button title={t('Saved corrections')} variant="ghost" onPress={() => router.push('/correction-review')} />
        <Button title={t('Practice circles')} variant="ghost" onPress={() => router.push('/clubs')} />
        <Button title={t('Safety and privacy')} variant="ghost" onPress={() => router.push('/settings')} />
      </View>}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {oldestUnread >= 0 && (
          <Button title={unreadExtendsPastPage ? t("Load earlier unread messages") : t("Jump to unread")} variant="ghost"
            loading={messages.isFetchingNextPage} onPress={jumpToUnread} />
        )}
        {showNew && <Button title={t("Go to latest messages")} variant="secondary" onPress={() => {
          listRef.current?.scrollToOffset({ offset: 0, animated: true });
          setShowNew(false);
        }} />}
        <FlatList
          ref={listRef}
          inverted
          maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 80 }}
          keyboardShouldPersistTaps="handled"
          onScroll={({ nativeEvent }) => {
            const latest = nativeEvent.contentOffset.y < 80;
            if (latest && !atLatest.current) {
              setShowNew(false);
              markReadNow();
            }
            atLatest.current = latest;
          }}
          scrollEventThrottle={100}
          onScrollToIndexFailed={({ index, averageItemLength }) => {
            listRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: false });
          }}
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.3}
          onEndReached={() => {
            if (messages.hasNextPage && !messages.isFetchingNextPage) void messages.fetchNextPage();
          }}
          ListFooterComponent={messages.isFetchingNextPage ? <LoadingState /> : undefined}
          ListEmptyComponent={
            <View style={styles.empty}>
              <AppText style={styles.wave}>👋</AppText>
              <AppText variant="heading" align="center">{t("Say hello!")}</AppText>
              <AppText variant="caption" color="textSecondary" align="center">
                {t("Introduce yourself and the language you are learning.")}
              </AppText>
            </View>
          }
          renderItem={({ item, index }) => {
            const invite = (item.message_type ?? 'text') === 'text' ? readExchangeInvitation(item.content) : undefined;
            const mine = item.sender_id === user?.id;
            const progress = (item.message_type ?? 'text') === 'text' ? readExchangeProgress(item.content) : undefined;
            const rounds = invite ? confirmations.get(item.id) : undefined;
            return (
            <View>
              <MessageBubble
                message={invite || progress ? { ...item, content: (invite ?? progress)!.text } : item}
                mine={item.sender_id === user?.id}
                original={item.corrects_id ? byId.get(item.corrects_id) : undefined}
                onLongPress={() => { setActionsFor(item); setCopyStatus(''); }}
              />
              {invite && <View style={styles.messageActions}>
                {rounds && <AppText variant="caption">{t('Round 1: {first}/2 · Round 2: {second}/2 confirmed', {
                  first: Math.min(2, rounds.get(1)?.size ?? 0), second: Math.min(2, rounds.get(2)?.size ?? 0),
                })}</AppText>}
                <Button title={t('Open exchange: {title}', { title: t(exchangeScenarios[invite.id].title) })} size="sm" variant="secondary"
                  onPress={() => router.push({ pathname: '/exchange-table', params: { scenario: invite.id, role: mine ? 'A' : 'B', chat: id, invite: item.id, round: user && rounds?.get(1)?.has(user.id) ? '2' : '1' } })} />
              </View>}
              {actionsFor?.id === item.id && (
                <View style={styles.messageActions}>
                  {!invite && !progress && item.sender_id !== user?.id && (item.message_type ?? 'text') === 'text' && (
                    <Button title={t("Correct")} size="sm" variant="secondary" onPress={() => startCorrection(item)} />
                  )}
                  <Button title={t("Copy")} size="sm" variant="secondary" onPress={async () => {
                    try { setCopyStatus(await Clipboard.setStringAsync(item.content) ? 'Copied' : 'Could not copy'); }
                    catch { setCopyStatus('Could not copy'); }
                  }} />
                  {item.sender_id !== user?.id && <Button title={t("Report")} size="sm" variant="ghost"
                    onPress={() => router.push({ pathname: '/safety-action', params: { kind: 'message', id: item.id } })} />}
                  <Button title={t("Close")} size="sm" variant="ghost" onPress={() => setActionsFor(undefined)} />
                  {!!copyStatus && <AppText accessibilityLiveRegion="polite">{copyStatus}</AppText>}
                </View>
              )}
              {item.message_type === 'correction' && item.sender_id !== user?.id && item.corrects_id && (
                <SaveCorrection id={item.id} />
              )}
              {index === oldestUnread && !unreadExtendsPastPage && (
                <AppText align="center" variant="label" color="primary">{t("New messages")}</AppText>
              )}
            </View>
          ); }}
        />

        {correcting ? (
          <View style={styles.correctionBar}>
            <View style={styles.flex}>
              <AppText variant="label" color="success">{t("✏️ Correcting")}</AppText>
              <AppText variant="caption" color="textSecondary" numberOfLines={1}>{correcting.content}</AppText>
            </View>
            <Button title={t("Cancel")} variant="ghost" size="sm" onPress={() => { setCorrecting(null); setCorrectionText(''); }} />
          </View>
        ) : null}

        {starter && !correcting && !input && (
          <Button title={t("Use conversation starter")} variant="secondary" size="sm" onPress={() => {
            const invitation = readExchangeInvitation(starter.starter);
            writeDraft(invitation ? exchangeInvitation(invitation.id, t('Would you like to practise with me? Situation: {title}. I’ll take role A if you take role B. Then we swap roles and languages.', {
              title: t(exchangeScenarios[invitation.id].title),
            })) : starter.starter);
            setUsedStarter(task);
          }} />
        )}
        {send.isError && (
          <View style={styles.messageActions}>
            <AppText color="danger" accessibilityLiveRegion="polite">{t("Could not send. Your draft is still here.")}</AppText>
            <Button title={t("Retry")} variant="secondary" size="sm" onPress={submit} disabled={!input.trim()} />
          </View>
        )}
        {exchangeDraft && <View style={styles.messageActions}>
          <AppText variant="caption">{t('Open exchange: {title}', { title: t(exchangeScenarios[exchangeDraft.id].title) })}</AppText>
          <Button title={t('Remove exercise link')} variant="ghost" size="sm" onPress={() => writeDraft(exchangeDraft.text)} />
        </View>}
        <ExchangeSessions conversationId={id} />
        <View style={styles.composer}>
          {!correcting ? (
            <VoiceButton conversationId={id} disabled={send.isPending}
              onRecorded={(path) => send.mutate({ content: path, type: 'voice' })} />
          ) : null}
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={(text) => { setInput(text); if (send.isError) send.reset(); }}
            editable={!send.isPending}
            placeholder={correcting ? t("Write the corrected sentence…") : t("Write a message…")}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={MAX_LENGTH - (exchangeDraft ? exchangeInvitation(exchangeDraft.id, '').length : 0)}
            accessibilityLabel={correcting ? t("Corrected message") : t("Message")}
          />
          <Button
            title={correcting ? t("Send fix") : t("Send")}
            size="sm"
            disabled={!input.trim()}
            loading={send.isPending}
            onPress={submit}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function SaveCorrection({ id }: { id: string }) {
  const save = useCorrectionAction();
  return (
    <View>
      <Button title={save.isSuccess ? t("Saved for review") : t("Save correction for review")} variant="ghost" size="sm"
        loading={save.isPending} disabled={save.isSuccess}
        onPress={() => save.mutate({ id, action: 'save' })} />
      {save.isError && <AppText color="danger">{save.error.message}</AppText>}
    </View>
  );
}

function MessageBubble({ message, mine, original, onLongPress }: {
  message: ChatMessage;
  mine: boolean;
  original?: ChatMessage;
  onLongPress: () => void;
}) {
  const { styles } = useThemedStyles(createStyles);
  const correction = message.message_type === 'correction';

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={300}
        accessibilityHint={t("Long press to open message actions")}
        style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs, correction && styles.bubbleCorrection]}
      >
        {correction ? (
          <>
            <AppText variant="label" color="success">{t("✏️ Correction")}</AppText>
            {original ? (
              <AppText variant="caption" color="textMuted" style={styles.strike}>{original.content}</AppText>
            ) : null}
            <AppText variant="body" color="success" style={styles.bold}>{message.content}</AppText>
          </>
        ) : message.message_type === 'voice' ? (
          <VoicePlayer path={message.content} mine={mine} />
        ) : message.message_type === 'call' ? (
          <CallCard room={message.content} mine={mine} />
        ) : (
          <AppText variant="body" color={mine ? 'onPrimary' : 'text'}>{message.content}</AppText>
        )}
        <AppText
          variant="small"
          color={mine && !correction ? 'onPrimary' : 'textMuted'}
          style={[styles.time, mine && !correction && styles.timeMine]}
        >
          {formatTime(message.created_at)}
        </AppText>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t("Message actions")} onPress={onLongPress} style={styles.messageMenu}>
        <AppText color="textSecondary" variant="bodyStrong">⋯</AppText>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  partnerRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: screenPadding, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
  },
  banner: {
    marginHorizontal: screenPadding, marginTop: spacing.sm, padding: spacing.md,
    borderRadius: radius.lg, backgroundColor: colors.primarySoft,
  },
  list: { paddingHorizontal: screenPadding, paddingVertical: spacing.md, gap: spacing.xs, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.xxxl,
    transform: [{ scaleY: -1 }] },
  wave: { fontSize: 40, lineHeight: 48 },
  row: { flexDirection: 'row', marginVertical: 2 },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.xl, gap: 2 },
  bubbleMine: { backgroundColor: colors.action, borderBottomRightRadius: radius.sm },
  bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, borderBottomLeftRadius: radius.sm },
  bubbleCorrection: { backgroundColor: colors.successSoft, borderWidth: 1, borderColor: colors.success },
  strike: { textDecorationLine: 'line-through' },
  time: { alignSelf: 'flex-end', marginTop: 2 },
  timeMine: { opacity: 0.8 },
  messageActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.sm, alignItems: 'center' },
  messageMenu: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  correctionBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: screenPadding, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.borderSubtle, backgroundColor: colors.successSoft,
  },
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    paddingHorizontal: screenPadding, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.borderSubtle, backgroundColor: colors.surface,
  },
  input: {
    ...typography.body, flex: 1, minHeight: 40, maxHeight: 120,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm,
    borderRadius: radius.lg, backgroundColor: colors.surfaceMuted, color: colors.text,
  },
});
