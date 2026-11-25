import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Card } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useDeletePost, useToggleLike, type FeedPost } from '@/features/community/api';
import { ReportButton } from '@/features/safety/actions';
import { displayNameOf } from '@/features/users/api';
import { formatRelativeTime } from '@/lib/format';
import { useSession } from '@/providers/session-provider';
import { t } from '@/lib/i18n';

type PostCardProps = {
  post: FeedPost;
  /** In the detail screen the comment button is not needed. */
  showCommentButton?: boolean;
  /** Called after the post was deleted (e.g. to leave the detail screen). */
  onDeleted?: () => void;
};

export function PostCard({ post, showCommentButton = true, onDeleted }: PostCardProps) {
  const { styles } = useThemedStyles(createStyles);
  const { user } = useSession();
  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();

  const isMine = user?.id === post.user_id;
  const name = displayNameOf(post.author);
  const wasEdited =
    !!post.updated_at &&
    !!post.created_at &&
    new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 60 * 1000;

  function openAuthor() {
    router.push({ pathname: '/user/[id]', params: { id: post.user_id } });
  }

  function openPost() {
    router.push({ pathname: '/post/[id]', params: { id: post.id } });
  }

  function confirmDelete() {
    Alert.alert(t("Delete post?"), t("This cannot be undone."), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deletePost.mutate(post, {
            onSuccess: () => onDeleted?.(),
            onError: (error) => Alert.alert(t("Could not delete post"), error.message),
          }),
      },
    ]);
  }

  function openMenu() {
    Alert.alert(t("Your post"), undefined, [
      {
        text: 'Edit',
        onPress: () => router.push({ pathname: '/post/compose', params: { id: post.id } }),
      },
      { text: 'Delete', style: 'destructive', onPress: confirmDelete },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function share() {
    try {
      await Share.share({
        message: `${name} on GrammarBay:\n\n${post.content}`,
      });
    } catch {
      // User closed the share sheet – nothing to do.
    }
  }

  return (
    <Card style={[styles.card, deletePost.isPending && styles.deleting]}>
      {/* Author */}
      <View style={styles.header}>
        <Pressable
          style={styles.author}
          onPress={openAuthor}
          accessibilityRole="button"
          accessibilityLabel={t('Open profile of {name}', { name: name })}
        >
          <Avatar name={name} uri={post.author?.avatar_url} size={42} />
          <View style={styles.flex}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {name}
            </AppText>
            <AppText variant="small" color="textMuted" numberOfLines={1}>
              {formatRelativeTime(post.created_at)}
              {wasEdited ? ' · edited' : ''}
              {post.author?.country ? ` · ${post.author.country}` : ''}
            </AppText>
          </View>
        </Pressable>

        {isMine ? (
          <Pressable
            onPress={openMenu}
            hitSlop={10}
            style={styles.menuButton}
            accessibilityRole="button"
            accessibilityLabel={t("Post options")}
          >
            <AppText variant="heading" color="textMuted">
              ⋯
            </AppText>
          </Pressable>
        ) : <ReportButton kind="post" id={post.id} />}
      </View>

      {post.kind === 'question' ? (
        <View style={styles.questionRow}>
          <View style={styles.questionBadge}>
            <AppText variant="small" color="primary" style={styles.badgeText}>
              {t('❓ Question')}{post.language ? ` · ${post.language.flag_emoji ?? '🌐'} ${post.language.name}` : ''}
            </AppText>
          </View>
          {post.accepted_comment_id ? (
            <View style={styles.answeredBadge}>
              <AppText variant="small" color="success" style={styles.badgeText}>{t("✅ Answered")}</AppText>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Content */}
      {post.content ? (
        <AppText variant={post.kind === 'question' ? 'bodyStrong' : 'body'}>{post.content}</AppText>
      ) : null}

      {post.image_url ? (
        <Image
          source={{ uri: post.image_url }}
          style={styles.image}
          contentFit="cover"
          transition={150}
          accessibilityLabel={t("Post image")}
        />
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <ActionButton
          label={post.likedByMe ? `♥ ${post.like_count}` : `♡ ${post.like_count}`}
          active={post.likedByMe}
          accessibilityLabel={(post.likedByMe ? t('Unlike') : t('Like')) + '. ' + t('{n} likes', { n: post.like_count })}
          onPress={() => toggleLike.mutate({ postId: post.id, like: !post.likedByMe })}
        />
        {showCommentButton ? (
          <ActionButton
            label={`💬 ${post.comment_count}`}
            accessibilityLabel={t('{n} comments. Open comments', { n: post.comment_count })}
            onPress={openPost}
          />
        ) : null}
        <ActionButton label={t("↗ Share")} accessibilityLabel={t("Share post")} onPress={share} />
      </View>
    </Card>
  );
}

function ActionButton({
  label,
  active = false,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  active?: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.action, active && styles.actionActive, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <AppText variant="caption" color={active ? 'primary' : 'textSecondary'} style={styles.actionText}>
        {label}
      </AppText>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  questionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  questionBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.full, backgroundColor: colors.primarySoft },
  answeredBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.full, backgroundColor: colors.successSoft },
  badgeText: { fontWeight: '700' },
  card: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  deleting: {
    opacity: 0.4,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  author: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuButton: {
    paddingHorizontal: spacing.xs,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  actionActive: {
    backgroundColor: colors.primarySoft,
  },
  actionText: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
