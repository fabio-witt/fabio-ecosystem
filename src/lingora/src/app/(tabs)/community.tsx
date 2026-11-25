import { PartnerBrowser } from '@/features/partners/partner-browser';
import { SocialShortcuts } from '@/features/learn/social-shortcuts';
import { useTabReselect } from '@/hooks/use-tab-reselect';
import { router, useLocalSearchParams } from 'expo-router';
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
  Button,
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
      <View style={styles.social}><SocialShortcuts showPartners={false} /></View>

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

      <View style={styles.shortcuts}>
        <PressableCard
          style={styles.shortcut}
          onPress={() => router.push('/forum/new')}
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
  social: { marginBottom: spacing.md },
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
  switcher: { paddingHorizontal: screenPadding, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: spacing.sm },
  hidden: { display: 'none' },
  switchRow: { flexDirection: 'row', gap: spacing.sm },
  guestShortcuts: { paddingHorizontal: screenPadding, paddingVertical: spacing.sm },
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
  const { styles } = useThemedStyles(createStyles);
  const { section } = useLocalSearchParams<{ section?: string }>();
  const partners = section === 'partners';
  const [keepPosts, setKeepPosts] = useState(false);
  const [keepPartners, setKeepPartners] = useState(false);

  function switchTo(next: 'posts' | 'partners') {
    if (partners) setKeepPartners(true);
    else setKeepPosts(true);
    router.setParams({ section: next });
  }
  const guest = useIsGuest();
  return (
    <Screen>
      <View style={styles.switcher}>
        <AppText variant="heading" accessibilityRole="header">{t('Community')}</AppText>
        <View style={styles.switchRow} accessibilityRole="tablist">
          <Button title={t('Posts')} accessibilityRole="tab" accessibilityState={{ selected: !partners }}
            style={styles.flex} variant={partners ? 'secondary' : 'primary'}
            onPress={() => switchTo('posts')} />
          <Button title={t('Language partners')} accessibilityRole="tab" accessibilityState={{ selected: partners }}
            style={styles.flex} variant={partners ? 'primary' : 'secondary'}
            onPress={() => switchTo('partners')} />
        </View>
      </View>
      {guest ? (
        <>
          {!partners && <View style={styles.guestShortcuts}><SocialShortcuts showPartners={false} /></View>}
          {partners
            ? <GuestGate title={t('Find partners with a free account')} message={t('Meet people who speak the language you learn and want to learn yours.')} />
            : <GuestGate title={t('Join the community with a free account')} message={t('Ask questions, share progress and help other learners.')} />}
        </>
      ) : <>
        {(partners || keepPartners) && (
          <View style={partners ? styles.flex : styles.hidden} importantForAccessibility={partners ? 'auto' : 'no-hide-descendants'}>
            <PartnerBrowser />
          </View>
        )}
        {(!partners || keepPosts) && (
          <View style={!partners ? styles.flex : styles.hidden} importantForAccessibility={!partners ? 'auto' : 'no-hide-descendants'}>
            <CommunityScreenContent />
          </View>
        )}
      </>}
    </Screen>
  );
}
