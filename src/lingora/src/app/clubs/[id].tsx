import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { PostCard } from '@/components/post-card';
import {
  AppText, Button, Card, EmptyState, ErrorState, LoadingState, Screen, ScreenHeader,
} from '@/components/ui';
import { screenPadding, spacing, useColors } from '@/constants/theme';
import { clubPractice } from '@/features/clubs/weekly-practice';
import { useClub, useJoinClub } from '@/features/clubs/api';
import { useOpenClubChat } from '@/features/chats/group';
import { useFeed } from '@/features/community/api';
import { t } from '@/lib/i18n';

export default function ClubScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const club = useClub(id);
  const [weekly, setWeekly] = useState(false);
  const practice = clubPractice(new Date(), club.data?.language?.name);
  const feed = useFeed(`club:${id}`, weekly ? practice.week : undefined);
  const join = useJoinClub();
  const openChat = useOpenClubChat();

  if (club.isPending) {
    return <Screen><ScreenHeader title={t("Club")} /><LoadingState /></Screen>;
  }
  if (club.isError) {
    return (
      <Screen>
        <ScreenHeader title={t("Club")} />
        <ErrorState message={club.error.message} onRetry={() => club.refetch()} />
      </Screen>
    );
  }

  const data = club.data;
  const posts = feed.data?.pages.flat() ?? [];

  function writePractice() {
    setWeekly(true);
    router.push({
      pathname: '/post/compose',
      params: { clubId: data.id, clubName: data.name, practice: practice.id, practiceWeek: practice.week },
    });
  }

  function toggleMembership() {
    if (data.isMember && data.role === 'owner') {
      Alert.alert(t("Leave your club?"), t("You created this club. It stays open for its members."), [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => join.mutate({ clubId: data.id, join: false }) },
      ]);
      return;
    }
    join.mutate({ clubId: data.id, join: !data.isMember }, {
      onError: (error) => Alert.alert(t("Something went wrong"), error.message),
    });
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={data.name} />
      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => <PostCard post={item} />}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefetching && !feed.isFetchingNextPage}
            onRefresh={() => {
              void feed.refetch();
              void club.refetch();
            }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Card style={styles.hero}>
              <AppText style={styles.emoji} accessible={false}>{data.emoji}</AppText>
              <AppText variant="title" align="center">{data.name}</AppText>
              {data.description ? <AppText align="center" color="textSecondary">{data.description}</AppText> : null}
              <AppText variant="caption" color="textMuted" align="center">
                {t('{n} members', { n: data.member_count })}
                {data.language ? ` · ${data.language.flag_emoji ?? ''} ${data.language.name}` : ''}
                {data.is_official ? ' · ' + t('Official club') : ''}
              </AppText>
              <View style={styles.actions}>
                <Button
                  title={data.isMember ? t("Leave club") : t("Join club")}
                  variant={data.isMember ? 'secondary' : 'primary'}
                  size="sm"
                  style={styles.flex}
                  loading={join.isPending}
                  onPress={toggleMembership}
                />
                {data.isMember ? (
                  <Button
                    title={t("Write a post")}
                    size="sm"
                    style={styles.flex}
                    onPress={() => router.push({ pathname: '/post/compose', params: { clubId: data.id, clubName: data.name } })}
                  />
                ) : null}
              </View>
              {data.isMember ? (
                <Button title={t('💬 Open club chat')} variant="secondary" disabled={openChat.isPending}
                  onPress={() => openChat.mutate(data.id, { onSuccess: (chatId) => router.push({ pathname: '/group-chat/[id]', params: { id: chatId, title: data.name } }) })} />
              ) : null}
              {openChat.isError ? <AppText color="danger">{openChat.error.message}</AppText> : null}
            </Card>
            <Card style={styles.practice}>
              <AppText variant="label" color="primary">{t("Weekly practice")}</AppText>
              <AppText variant="heading">{practice.title}</AppText>
              <AppText>{practice.task}</AppText>
              {data.language && <AppText color="textSecondary">{t('Write your response in {language}.', { language: t(data.language.name) })}</AppText>}
              <AppText variant="caption" color="textSecondary">{t('{language} model', { language: t(practice.modelLanguage) })}</AppText>
              <AppText>{practice.example}</AppText>
              <AppText variant="caption" color="textSecondary">{t('Useful phrases: {phrases}', { phrases: practice.phrases.join(' · ') })}</AppText>
              {data.isMember && <Button title={t("Write your response")} variant="secondary" onPress={writePractice} />}
            </Card>
            <View style={styles.actions}>
              <Button title={t("All posts")} variant={weekly ? 'secondary' : 'primary'} onPress={() => setWeekly(false)} />
              <Button title={t("This week’s thread")} variant={weekly ? 'primary' : 'secondary'} onPress={() => setWeekly(true)} />
            </View>
          </View>
        }
        ListEmptyComponent={
          feed.isPending ? <LoadingState /> : feed.isError ? (
            <ErrorState message={feed.error.message} onRetry={() => feed.refetch()} />
          ) : (
            <EmptyState
              title={weekly ? t("No responses yet") : t("No posts yet")}
              message={data.isMember ? t("Start the conversation!") : t("Join the club to write the first post.")}
              actionLabel={data.isMember ? t("Try this week’s prompt") : t("Join club")}
              onAction={data.isMember ? writePractice : toggleMembership}
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
  header: { gap: spacing.md },
  practice: { gap: spacing.sm },
  hero: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  emoji: { fontSize: 48, lineHeight: 58 },
  actions: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch', marginTop: spacing.sm },
});
