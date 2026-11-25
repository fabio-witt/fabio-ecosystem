import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  Avatar,
  Button,
  Card,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
} from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useStartConversation } from '@/features/chats/api';
import { LanguageBadges } from '@/features/learn/badges';
import { ReviewsSection } from '@/features/partners/reviews-section';
import { usePlusTiers } from '@/features/plus/api';
import { PlusBadge } from '@/features/plus/plus-badge';
import { BlockButton, ReportButton } from '@/features/safety/actions';
import { ExchangeDetailsCard } from '@/features/profile/exchange-details-card';
import {
  displayNameOf,
  usePublicProfile,
  useToggleFollow,
  type ConnectionType,
} from '@/features/users/api';
import { formatLocation, formatRelativeTime } from '@/lib/format';
import { useSession } from '@/providers/session-provider';
import { t } from '@/lib/i18n';
import { LocationMap } from '@/features/profile/location-map';
import { FriendGames } from '@/features/game/friend-games';
import { useIsGuest } from '@/features/guest/guest';

export default function UserProfileScreen() {
  const guest = useIsGuest();
  const { colors, styles } = useThemedStyles(createStyles);
  const { id, task } = useLocalSearchParams<{ id: string; task?: string }>();
  const { user } = useSession();
  const isMe = !!user && user.id === id;

  const profileQuery = usePublicProfile(id);
  const toggleFollow = useToggleFollow(id);
  const startConversation = useStartConversation();
  const plus = usePlusTiers(id ? [id] : []);

  if (profileQuery.isPending) {
    return (
      <Screen>
        <ScreenHeader />
        <LoadingState />
      </Screen>
    );
  }

  if (profileQuery.isError) {
    return (
      <Screen>
        <ScreenHeader />
        <ErrorState
          title={t("Could not load this profile")}
          message={profileQuery.error.message}
          onRetry={() => profileQuery.refetch()}
        />
      </Screen>
    );
  }

  const { profile, languages, followers, following, posts, isFollowing, recentPosts } =
    profileQuery.data;
  const name = displayNameOf(profile);
  const location = formatLocation(profile.city, profile.country);
  const native = languages.filter((language) => language.type === 'native');
  const learning = languages.filter((language) => language.type === 'learning');

  function openConnections(type: ConnectionType) {
    router.push({ pathname: '/connections/[id]', params: { id, type, name } });
  }

  function onFollowPress() {
    toggleFollow.mutate(!isFollowing, {
      onError: (error) => Alert.alert(t("Error"), error.message),
    });
  }

  function onMessagePress() {
    startConversation.mutate(id, {
      onSuccess: (conversationId) =>
        router.push({ pathname: '/chat/[id]', params: { id: conversationId, ...(task ? { task } : {}) } }),
      onError: (error) => Alert.alert(t("Could not open chat"), error.message),
    });
  }

  return (
    <Screen>
      <ScreenHeader title={profile.username ? `@${profile.username}` : name} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={profileQuery.isRefetching}
            onRefresh={() => {
              profileQuery.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Identity */}
        <View style={styles.identity}>
          <Avatar name={name} uri={profile.avatar_url} size={96} />
          <AppText variant="title" align="center">
            {name}
          </AppText>
          <PlusBadge tier={plus.data?.get(profile.id)} />
          {location ? (
            <AppText variant="caption" color="textSecondary" align="center">
              📍 {location}
            </AppText>
          ) : null}
        </View>

        {/* Counters */}
        <Card style={styles.counters}>
          <Counter value={posts} label={t("Posts")} />
          <View style={styles.divider} />
          <Counter value={followers} label={t("Followers")} onPress={() => openConnections('followers')} />
          <View style={styles.divider} />
          <Counter value={following} label={t("Following")} onPress={() => openConnections('following')} />
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          {guest && !isMe ? (
            <Button title={t('Create a free account to follow and chat')} style={styles.flex}
              onPress={() => router.push('/create-account')} />
          ) : isMe ? (
            <Button
              title={t("Edit profile")}
              variant="secondary"
              style={styles.flex}
              onPress={() => router.push('/edit-profile')}
            />
          ) : (
            <>
              <Button
                title={isFollowing ? t("Following ✓") : t("Follow")}
                variant={isFollowing ? 'secondary' : 'primary'}
                style={styles.flex}
                onPress={onFollowPress}
                disabled={toggleFollow.isPending}
              />
              <Button
                title={t("Message")}
                variant="secondary"
                style={styles.flex}
                onPress={onMessagePress}
                loading={startConversation.isPending}
              />
              <Button title={t('Exchange table')} variant="secondary"
                onPress={() => router.push({ pathname: '/exchange-table', params: { partner: id } })} />
            </>
          )}
        </View>


        {/* About */}
        {profile.bio ? (
          <Section title={t("About")}>
            <AppText variant="callout">{profile.bio}</AppText>
          </Section>
        ) : null}

        {/* Languages */}
        {languages.length > 0 ? (
          <Section title={t("Languages")}>
            {native.length > 0 ? (
              <LanguageRow
                label={t("Speaks")}
                items={native.map((l) => `${l.flagEmoji ?? '🌐'} ${l.name}`)}
              />
            ) : null}
            {learning.length > 0 ? (
              <LanguageRow
                label={t("Learning")}
                items={learning.map(
                  (l) => `${l.flagEmoji ?? '🌐'} ${l.name}${l.level ? ` · ${l.level}` : ''}`
                )}
              />
            ) : null}
          </Section>
        ) : null}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 ? (
          <Section title={t("Interests")}>
            <View style={styles.chips}>
              {profile.interests.map((interest) => (
                <View key={interest} style={styles.chip}>
                  <AppText variant="small" color="primary" style={styles.chipText}>
                    {interest}
                  </AppText>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {!isMe && !guest ? <FriendGames userId={profile.id} name={name} /> : null}

        <LocationMap city={profile.city} country={profile.country} />

        <ExchangeDetailsCard details={profile} />

        <LanguageBadges userId={profile.id} isMe={isMe} />

        <ReviewsSection userId={profile.id} name={name} isMe={isMe} />

        {/* Posts */}
        <AppText variant="heading" style={styles.sectionTitle}>
          {t("Recent posts")}
        </AppText>
        {recentPosts.length === 0 ? (
          <Card>
            <AppText variant="callout" color="textSecondary" align="center">
              {isMe ? t("You have not posted anything yet.") : `${name} has not posted anything yet.`}
            </AppText>
          </Card>
        ) : (
          recentPosts.map((post) => (
            <Card key={post.id} style={styles.post}>
              {post.content ? <AppText variant="callout">{post.content}</AppText> : null}
              {post.image_url ? (
                <Image
                  source={{ uri: post.image_url }}
                  style={styles.postImage}
                  contentFit="cover"
                  transition={150}
                  accessibilityLabel={t("Post image")}
                />
              ) : null}
              <AppText variant="small" color="textMuted">
                {formatRelativeTime(post.created_at)}
              </AppText>
            </Card>
          ))
        )}

        {!isMe && (
          <View style={styles.safetyRow}>
            <ReportButton kind="profile" id={profile.id} />
            <BlockButton id={profile.id} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Counter({ value, label, onPress }: { value: number; label: string; onPress?: () => void }) {
  const { styles } = useThemedStyles(createStyles);
  const content = (
    <>
      <AppText variant="heading" align="center">
        {value.toLocaleString('en-GB')}
      </AppText>
      <AppText variant="small" color="textSecondary" align="center">
        {label}
      </AppText>
    </>
  );

  if (!onPress) return <View style={styles.counter}>{content}</View>;

  return (
    <Pressable
      style={({ pressed }) => [styles.counter, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}. Show list`}
    >
      {content}
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.section}>
      <AppText variant="heading" style={styles.sectionTitle}>
        {title}
      </AppText>
      <Card style={styles.sectionCard}>{children}</Card>
    </View>
  );
}

function LanguageRow({ label, items }: { label: string; items: string[] }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.languageRow}>
      <AppText variant="label" color="textMuted">
        {label}
      </AppText>
      <AppText variant="callout">{items.join('   ')}</AppText>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safetyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xxl,
    opacity: 0.7,
  },
  container: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
  identity: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  counters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  counter: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  sectionCard: {
    gap: spacing.md,
  },
  languageRow: {
    gap: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  chipText: {
    fontWeight: '700',
  },
  post: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  postImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
});
