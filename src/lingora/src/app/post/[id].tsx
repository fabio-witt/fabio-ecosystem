import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { PostCard } from '@/components/post-card';
import {
  AppText,
  Avatar,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { radius, screenPadding, spacing, typography, useThemedStyles, type ThemeColors } from '@/constants/theme';
import {
  COMMENT_MAX_LENGTH,
  useAcceptAnswer,
  useAddComment,
  useComments,
  useDeleteComment,
  usePost,
  type PostComment,
} from '@/features/community/api';
import { ReportButton } from '@/features/safety/actions';
import { displayNameOf } from '@/features/users/api';
import { formatRelativeTime } from '@/lib/format';
import { useSession } from '@/providers/session-provider';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';

export default function PostDetailScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const postQuery = usePost(id);
  const commentsQuery = useComments(id);
  const addComment = useAddComment(id);
  const deleteComment = useDeleteComment(id);
  const acceptAnswer = useAcceptAnswer(id);
  const [draft, setDraft] = useState('');
  // HelloTalk-style: rewrite the post with your corrections next to your comment.
  const [correcting, setCorrecting] = useState(false);
  const [correction, setCorrection] = useState('');

  function send() {
    const content = draft.trim();
    if (!content) return;

    addComment.mutate({ content, correction: correcting ? correction : undefined }, {
      onSuccess: () => { setDraft(''); setCorrection(''); setCorrecting(false); feedback('ok'); },
      onError: (error) => Alert.alert(t("Comment not sent"), error.message),
    });
  }

  function confirmDeleteComment(comment: PostComment) {
    Alert.alert(t("Delete comment?"), undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteComment.mutate(comment.id, {
            onError: (error) => Alert.alert(t("Could not delete comment"), error.message),
          }),
      },
    ]);
  }

  if (postQuery.isPending) {
    return (
      <Screen>
        <ScreenHeader title={t("Post")} />
        <LoadingState />
      </Screen>
    );
  }

  if (postQuery.isError) {
    return (
      <Screen>
        <ScreenHeader title={t("Post")} />
        <ErrorState
          title={t("Could not load this post")}
          message={postQuery.error.message}
          onRetry={() => postQuery.refetch()}
        />
      </Screen>
    );
  }

  const post = postQuery.data;
  const isQuestion = post.kind === 'question';
  const isAsker = post.user_id === user?.id;
  // The accepted answer is shown first.
  const comments = [...(commentsQuery.data ?? [])].sort((a, b) =>
    Number(b.id === post.accepted_comment_id) - Number(a.id === post.accepted_comment_id));

  function toggleAccepted(comment: PostComment) {
    const next = post.accepted_comment_id === comment.id ? null : comment.id;
    acceptAnswer.mutate(next, {
      onError: (error) => Alert.alert(t("Could not update the best answer"), error.message),
    });
  }

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title={t("Post")} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={comments}
          keyExtractor={(comment) => comment.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              <PostCard
                post={postQuery.data}
                showCommentButton={false}
                onDeleted={() => router.back()}
              />
              <AppText variant="heading" style={styles.commentsTitle}>
                {isQuestion ? t("Answers") : t("Comments")} ({postQuery.data.comment_count})
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <CommentRow
              comment={item}
              isMine={item.user_id === user?.id}
              onDelete={() => confirmDeleteComment(item)}
              accepted={item.id === post.accepted_comment_id}
              onToggleAccepted={isQuestion && isAsker && item.user_id !== user?.id
                ? () => toggleAccepted(item) : undefined}
            />
          )}
          ListEmptyComponent={
            commentsQuery.isPending ? (
              <ActivityIndicator color={colors.primary} />
            ) : commentsQuery.isError ? (
              <AppText variant="caption" color="danger" align="center">
                {t("Comments could not be loaded.")}
              </AppText>
            ) : (
              <AppText variant="caption" color="textSecondary" align="center">
                {t("No comments yet. Be the first!")}
              </AppText>
            )
          }
        />

        {postQuery.data && postQuery.data.user_id !== user?.id ? (
          <View style={styles.correctBar}>
            {correcting ? (
              <TextInput value={correction} onChangeText={setCorrection} multiline maxLength={2000}
                accessibilityLabel={t('Corrected version')} placeholder={t('Write the corrected sentence here')}
                placeholderTextColor={colors.textMuted} style={[styles.input, styles.correctInput]} />
            ) : null}
            <Pressable onPress={() => { if (!correcting) setCorrection(postQuery.data!.content); setCorrecting(!correcting); }}
              accessibilityRole="button" hitSlop={6}>
              <AppText variant="small" color="primary" style={styles.acceptedLabel}>
                {correcting ? t('Remove correction') : t('✏️ Correct this post')}
              </AppText>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.inputBar}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
                        placeholder={isQuestion ? t("Write an answer...") : t("Write a comment...")}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            maxLength={COMMENT_MAX_LENGTH}
            accessibilityLabel={t("Write a comment")}
          />
          <Pressable
            onPress={send}
            disabled={!draft.trim() || addComment.isPending}
            style={[styles.sendButton, (!draft.trim() || addComment.isPending) && styles.disabled]}
            accessibilityRole="button"
            accessibilityLabel={t("Send comment")}
          >
            {addComment.isPending ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <AppText variant="bodyStrong" color="onPrimary">
                ➤
              </AppText>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function CommentRow({
  comment,
  isMine,
  onDelete,
  accepted = false,
  onToggleAccepted,
}: {
  comment: PostComment;
  isMine: boolean;
  onDelete: () => void;
  accepted?: boolean;
  onToggleAccepted?: () => void;
}) {
  const { styles } = useThemedStyles(createStyles);
  const name = displayNameOf(comment.author);

  return (
    <View style={styles.commentRow}>
      <Pressable
        onPress={() => router.push({ pathname: '/user/[id]', params: { id: comment.user_id } })}
        accessibilityRole="button"
        accessibilityLabel={t('Open profile of {name}', { name: name })}
      >
        <Avatar name={name} uri={comment.author?.avatar_url} size={34} />
      </Pressable>
      <View style={styles.flex}>
        {accepted ? (
          <AppText variant="small" color="success" style={styles.acceptedLabel}>{t("✅ Best answer")}</AppText>
        ) : null}
        <Pressable
          style={[styles.bubble, accepted && styles.bubbleAccepted]}
          onLongPress={isMine ? onDelete : undefined}
          accessibilityHint={isMine ? t("Long press to delete") : undefined}
        >
          <AppText variant="caption" style={styles.commentAuthor}>
            {name}
          </AppText>
          {comment.correction ? (
            <View style={styles.correction}>
              <AppText variant="small" style={styles.correctionLabel}>{t('✏️ Corrected version')}</AppText>
              <AppText variant="callout" selectable style={styles.correctionText}>{comment.correction}</AppText>
            </View>
          ) : null}
          <AppText variant="callout">{comment.content}</AppText>
        </Pressable>
        <AppText variant="small" color="textMuted" style={styles.commentTime}>
          {formatRelativeTime(comment.created_at)}
          {isMine ? ' · hold to delete' : ''}
        </AppText>
        <View style={styles.commentActions}>
          {onToggleAccepted ? (
            <Pressable onPress={onToggleAccepted} accessibilityRole="button" hitSlop={6}>
              <AppText variant="small" color={accepted ? 'textSecondary' : 'success'} style={styles.acceptedLabel}>
                {accepted ? t("Unmark best answer") : '✓ Mark as best answer'}
              </AppText>
            </Pressable>
          ) : null}
          {!isMine && <ReportButton kind="comment" id={comment.id} />}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  acceptedLabel: { fontWeight: '700' },
  bubbleAccepted: { borderWidth: 1, borderColor: colors.success, backgroundColor: colors.successSoft },
  commentActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  list: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  commentsTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  commentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bubble: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  commentAuthor: {
    fontWeight: '800',
    marginBottom: spacing.xxs,
  },
  commentTime: {
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  correctBar: {
    gap: spacing.xs,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  correctInput: { flex: 0, borderWidth: 1, borderColor: colors.success },
  correction: { borderLeftWidth: 3, borderLeftColor: colors.success, backgroundColor: colors.successSoft, borderRadius: radius.sm, padding: spacing.sm, gap: 2, marginVertical: 4 },
  correctionLabel: { fontWeight: '800', color: colors.success },
  correctionText: { fontWeight: '600' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: screenPadding,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    ...typography.callout,
    color: colors.text,
    maxHeight: 120,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
