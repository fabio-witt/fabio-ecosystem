import { useTabReselect } from '@/hooks/use-tab-reselect';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { PostCard } from '@/components/post-card';
import {
  AppText,
  Avatar,
  EmptyState,
  ErrorState,
  LoadingState,
  PressableCard,
  Screen,
} from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { communityKeys, useFeed, type FeedFilter, type FeedPost } from '@/features/community/api';
import { useMyProfile } from '@/features/profile/api';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { t } from '@/lib/i18n';
import { useIsGuest } from '@/features/guest/guest';
import { GuestGate } from '@/features/guest/guest-gate';

const FILTERS: { value: FeedFilter; label: string }[] = [
  { value: 'all', label: 'All posts' },
  { value: 'questions', label: '❓ Questions' },
  { value: 'mine', label: 'My posts' },
];

function CommunityScreenContent() {
  const { colors, styles } = useThemedStyles(createStyles);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const scroll = useRef<FlatList<FeedPost>>(null);
  useTabReselect('community', () => {
    setFilter('all');
    scroll.current?.scrollToOffset({ offset: 0, animated: true });
  });
  const feed = useFeed(filter);
  const me = useMyProfile();
  useRefreshOnFocus(communityKeys.feeds());

  const posts = feed.data?.pages.flat() ?? [];
  const myName = me.data?.profile?.full_name || me.data?.profile?.username || 'You';

  const header = (
    <View>
      <View style={styles.titleBlock}>
        <AppText variant="display">{t("Community")}</AppText>
        <AppText variant="caption" color="textSecondary">
          {t("Questions and posts from other learners.")}
        </AppText>
      </View>

      <PressableCard
        style={styles.composeTrigger}
        onPress={() => router.push('/post/compose')}
        accessibilityLabel={t("Create a post")}
      >
        <Avatar name={myName} uri={me.data?.profile?.avatar_url} size={40} />
        <AppText variant="callout" color="textMuted" style={styles.flex}>
          {t("Write a post")}
        </AppText>
        <View style={styles.plus}>
          <AppText variant="heading" color="onPrimary">
            ＋
          </AppText>
        </View>
      </PressableCard>

      <PressableCard style={styles.forum} onPress={() => router.push('/forum')} accessibilityLabel={t('Open the forum')}>
        <AppText style={styles.forumIcon} accessible={false}>🗣</AppText>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{t('Forum')}</AppText>
          <AppText variant="small" color="textSecondary">{t('Grammar, words, pronunciation and culture – sorted by topic and language')}</AppText>
        </View>
        <AppText variant="heading" color="primary" accessible={false}>›</AppText>
      </PressableCard>

      <View style={styles.shortcuts}>
        <PressableCard
          style={styles.shortcut}
          onPress={() => router.push({ pathname: '/post/compose', params: { kind: 'question' } })}
          accessibilityLabel={t("Ask a question")}
        >
          <AppText variant="bodyStrong">{t("❓ Ask")}</AppText>
          <AppText variant="small" color="textSecondary">{t("Native speakers answer")}</AppText>
        </PressableCard>
        <PressableCard style={styles.shortcut} onPress={() => router.push('/clubs')} accessibilityLabel={t("Open language clubs")}>
          <AppText variant="bodyStrong">{t("👥 Clubs")}</AppText>
          <AppText variant="small" color="textSecondary">{t("Join learners like you")}</AppText>
        </PressableCard>
      </View>

      <View style={styles.filters} accessibilityRole="tablist">
        {FILTERS.map((item) => {
          const active = item.value === filter;
          return (
            <Pressable
              key={item.value}
              onPress={() => setFilter(item.value)}
              style={[styles.filter, active && styles.filterActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <AppText
                variant="caption"
                color={active ? 'onPrimary' : 'textSecondary'}
                style={styles.filterText}
              >
                {t(item.label)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <Screen>
      <FlatList
        ref={scroll}
        data={feed.isPending || feed.isError ? [] : posts}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefetching && !feed.isFetchingNextPage}
            onRefresh={() => {
              feed.refetch();
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          feed.isPending ? (
            <LoadingState />
          ) : feed.isError ? (
            <ErrorState
              title={t("Could not load posts")}
              message={feed.error.message}
              onRetry={() => feed.refetch()}
            />
          ) : filter === 'mine' ? (
            <EmptyState
              title={t("You have not posted yet")}
              message={t("Share a learning win, a question or a cultural moment.")}
              actionLabel={t("Create a post")}
              onAction={() => router.push('/post/compose')}
            />
          ) : (
            <EmptyState
              title={t("No posts yet")}
              message={t("Be the first to share something!")}
              actionLabel={t("Create a post")}
              onAction={() => router.push('/post/compose')}
            />
          )
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={styles.footerSpinner} />
          ) : undefined
        }
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  forum: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md, borderWidth: 2, borderColor: colors.primary },
  forumIcon: { fontSize: 28, lineHeight: 34 },
  shortcuts: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  shortcut: { flex: 1, gap: spacing.xxs },
  list: {
    flexGrow: 1,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  flex: {
    flex: 1,
  },
  titleBlock: {
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  composeTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  plus: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filter: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterActive: {
    backgroundColor: colors.action,
    borderColor: colors.primary,
  },
  filterText: {
    fontWeight: '700',
  },
  footerSpinner: {
    marginVertical: spacing.xl,
  },
});

export default function CommunityScreen() {
  const guest = useIsGuest();
  if (guest) return <GuestGate title={t('Join the community with a free account')} message={t('Ask questions, share progress and help other learners.')} />;
  return <CommunityScreenContent />;
}
