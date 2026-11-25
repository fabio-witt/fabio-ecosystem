import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Card, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import {
  FORUM_REPLY_MAX, useAcceptReply, useAddReply, useDeleteForumItem, useModerateThread, useMyVotes, useReplies,
  useThread, useVote, type ForumReply, type ForumThread,
} from '@/features/forum/api';
import { categoryLabel, speechCourse, VoteBox } from '@/features/forum/ui';
import { useIsGuest } from '@/features/guest/guest';
import { useIsAdmin } from '@/features/moderation/api';
import { ReportButton } from '@/features/safety/actions';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import { canSpeak, speak, useVoicesReady } from '@/lib/speech';
import { useSession } from '@/providers/session-provider';

export default function ForumThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { styles } = useThemedStyles(createStyles);
  const thread = useThread(id);
  const replies = useReplies(id);

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Forum')} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {thread.isPending ? <LoadingState /> : thread.isError ? <ErrorState message={t('Could not load this topic.')} onRetry={() => thread.refetch()} />
          : !thread.data ? <EmptyState title={t('Topic not found')} message={t('It may have been deleted.')} />
            : <ThreadBody thread={thread.data} replies={replies.data ?? []} loading={replies.isPending} />}
      </KeyboardAvoidingView>
    </Screen>
  );
}

function ThreadBody({ thread, replies, loading }: { thread: ForumThread; replies: ForumReply[]; loading: boolean }) {
  const { colors, styles } = useThemedStyles(createStyles);
  const { user } = useSession();
  const guest = useIsGuest();
  const admin = useIsAdmin().data === true;
  useVoicesReady();
  const vote = useVote();
  const threadVotes = useMyVotes('thread', [thread.id]);
  const replyVotes = useMyVotes('reply', replies.map((reply) => reply.id));
  const accept = useAcceptReply(thread.id);
  const remove = useDeleteForumItem();
  const moderate = useModerateThread(thread.id);
  const add = useAddReply(thread.id);
  const [text, setText] = useState('');
  const [correcting, setCorrecting] = useState(false);
  const [correction, setCorrection] = useState('');
  const mineThread = thread.user_id === user?.id;
  const course = speechCourse(thread.language?.language_code);
  const speakable = !!course && canSpeak(course);
  // The best answer first, then the rest by time.
  const ordered = [...replies].sort((a, b) => (b.id === thread.accepted_reply_id ? 1 : 0) - (a.id === thread.accepted_reply_id ? 1 : 0));

  function send() {
    if (!text.trim()) return;
    add.mutate({ content: text, correction: correcting ? correction : undefined }, {
      onSuccess: () => { feedback('ok'); setText(''); setCorrection(''); setCorrecting(false); },
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card style={styles.thread}>
        <View style={styles.row}>
          <VoteBox score={thread.score} mine={threadVotes.data?.[thread.id]} disabled={guest || mineThread || vote.isPending}
            onVote={(value) => vote.mutate({ kind: 'thread', id: thread.id, value })} />
          <View style={styles.flex}>
            <AppText variant="caption" color="textSecondary">
              {thread.is_pinned ? '📌 ' : ''}{categoryLabel(thread.category)}{thread.language ? ` · ${thread.language.flag_emoji ?? ''} ${t(thread.language.name)}` : ''}
            </AppText>
            <AppText variant="title" accessibilityRole="header">{thread.is_locked ? '🔒 ' : ''}{thread.title}</AppText>
            <AppText variant="caption" color="textSecondary">
              {thread.author?.full_name || thread.author?.username || t('Member')} · {new Date(thread.created_at).toLocaleString()}
            </AppText>
          </View>
        </View>
        <AppText selectable>{thread.content}</AppText>
        <View style={styles.actions}>
          {speakable ? <Button title={t('🔊 Listen')} size="sm" variant="secondary" onPress={() => speak(`${thread.title}. ${thread.content}`, course!)} /> : null}
          {thread.author ? <Button title={t('Profile')} size="sm" variant="ghost" onPress={() => router.push({ pathname: '/user/[id]', params: { id: thread.user_id } })} /> : null}
          {mineThread ? (
            <Button title={t('Delete')} size="sm" variant="ghost" disabled={remove.isPending}
              onPress={() => remove.mutate({ kind: 'thread', id: thread.id }, { onSuccess: () => router.back() })} />
          ) : !guest ? <ReportButton kind="forum_thread" id={thread.id} /> : null}
          {admin ? (
            <>
              <Button title={thread.is_pinned ? t('Unpin') : t('Pin')} size="sm" variant="ghost" onPress={() => moderate.mutate({ pinned: !thread.is_pinned })} />
              <Button title={thread.is_locked ? t('Unlock') : t('Lock')} size="sm" variant="ghost" onPress={() => moderate.mutate({ locked: !thread.is_locked })} />
            </>
          ) : null}
        </View>
      </Card>

      <AppText variant="heading">{replies.length === 1 ? t('1 answer') : t('{n} answers', { n: replies.length })}</AppText>
      {loading ? <LoadingState /> : ordered.map((reply) => {
        const best = reply.id === thread.accepted_reply_id;
        const mine = reply.user_id === user?.id;
        return (
          <Card key={reply.id} style={[styles.reply, best && { borderColor: colors.success, borderWidth: 2 }]}>
            {best ? <AppText variant="caption" style={styles.best}>{t('✓ Best answer')}</AppText> : null}
            <View style={styles.row}>
              <VoteBox score={reply.score} mine={replyVotes.data?.[reply.id]} disabled={guest || mine || vote.isPending}
                onVote={(value) => vote.mutate({ kind: 'reply', id: reply.id, value })} />
              <View style={[styles.flex, styles.replyBody]}>
                <AppText variant="caption" color="textSecondary">
                  {reply.author?.full_name || reply.author?.username || t('Member')} · {new Date(reply.created_at).toLocaleString()}
                </AppText>
                {reply.correction ? (
                  <View style={styles.correction}>
                    <AppText variant="caption" style={styles.correctionLabel}>{t('✏️ Corrected version')}</AppText>
                    <AppText selectable style={styles.correctionText}>{reply.correction}</AppText>
                  </View>
                ) : null}
                <AppText selectable>{reply.content}</AppText>
                <View style={styles.actions}>
                  {mineThread && !best ? <Button title={t('Mark as best answer')} size="sm" variant="secondary" disabled={accept.isPending}
                    onPress={() => { feedback('win'); accept.mutate(reply.id); }} /> : null}
                  {mineThread && best ? <Button title={t('Unmark')} size="sm" variant="ghost" onPress={() => accept.mutate(null)} /> : null}
                  {mine ? <Button title={t('Delete')} size="sm" variant="ghost" onPress={() => remove.mutate({ kind: 'reply', id: reply.id })} />
                    : !guest ? <ReportButton kind="forum_reply" id={reply.id} /> : null}
                </View>
              </View>
            </View>
          </Card>
        );
      })}

      {thread.is_locked ? (
        <AppText color="textSecondary" align="center">{t('This topic is closed for new answers.')}</AppText>
      ) : guest ? (
        <Card style={styles.reply}>
          <AppText>{t('Create a free account to answer and vote.')}</AppText>
          <Button title={t('Create account')} onPress={() => router.push('/create-account')} />
        </Card>
      ) : (
        <Card style={styles.reply}>
          <AppText variant="bodyStrong">{t('Your answer')}</AppText>
          <TextInput value={text} onChangeText={setText} multiline maxLength={FORUM_REPLY_MAX}
            placeholder={t('Explain it simply. Examples help most.')} placeholderTextColor={colors.textMuted}
            accessibilityLabel={t('Your answer')} style={[styles.input, styles.tall]} />
          {correcting ? (
            <TextInput value={correction} onChangeText={setCorrection} multiline maxLength={2000}
              placeholder={t('Write the corrected sentence here')} placeholderTextColor={colors.textMuted}
              accessibilityLabel={t('Corrected version')} style={styles.input} />
          ) : null}
          <View style={styles.actions}>
            <Button title={correcting ? t('Remove correction') : t('✏️ Add a correction')} size="sm" variant="ghost"
              onPress={() => { if (!correcting) setCorrection(thread.content); setCorrecting(!correcting); }} />
          </View>
          {add.isError ? <AppText color="danger">{add.error.message}</AppText> : null}
          <Button title={add.isPending ? t('Sending…') : t('Post answer')} disabled={!text.trim() || add.isPending} onPress={send} />
        </Card>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  thread: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },
  reply: { gap: spacing.sm },
  replyBody: { gap: spacing.xs },
  best: { color: colors.success, fontWeight: '800' },
  correction: { borderLeftWidth: 3, borderLeftColor: colors.success, backgroundColor: colors.successSoft, borderRadius: radius.sm, padding: spacing.sm, gap: 2 },
  correctionLabel: { fontWeight: '800', color: colors.success },
  correctionText: { fontWeight: '600' },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, padding: spacing.md, fontSize: 16, minHeight: 48, textAlignVertical: 'top' },
  tall: { minHeight: 110 },
});
