import { courseLanguage } from '@/features/learn/course-language';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, EmptyState, ErrorState, LoadingState, PressableCard, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useLanguages } from '@/features/community/api';
import { forumCategories, useThreads, type ForumCategory, type ForumSort, type ForumThread } from '@/features/forum/api';
import { categoryLabel, Chip } from '@/features/forum/ui';
import { useIsGuest } from '@/features/guest/guest';
import { t } from '@/lib/i18n';

const SORTS: { id: ForumSort; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'new', label: 'New' },
  { id: 'top', label: 'Top' },
  { id: 'unanswered', label: 'Unanswered' },
];

/** The Lingora forum: questions and discussions by topic and language. */
export default function ForumScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const guest = useIsGuest();
  const [category, setCategory] = useState<ForumCategory>();
  const { course } = useLocalSearchParams<{ course?: string }>();
  const [languageChoice, setLanguageId] = useState<number | null>();
  const [sort, setSort] = useState<ForumSort>('active');
  const [mine, setMine] = useState(false);
  const [search, setSearch] = useState('');
  const languages = useLanguages();
  const languageId = languageChoice === undefined ? courseLanguage(languages.data, course) : languageChoice ?? undefined;
  const threads = useThreads({ category, languageId, sort, mine, search });
  const items = threads.data?.pages.flat() ?? [];
  // Languages that matter most to learners come first.
  const languageChips = (languages.data ?? []).filter((language) => language.flag_emoji).slice(0, 40);

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('Forum')} right={!guest ? (
        <Button title={t('+ New')} size="sm" onPress={() => router.push({ pathname: '/forum/new', params: { ...(languageId !== undefined ? { languageId: String(languageId) } : {}) } })} />
      ) : undefined} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        onEndReached={() => { if (threads.hasNextPage && !threads.isFetchingNextPage) void threads.fetchNextPage(); }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={(
          <View style={styles.filters}>
            <AppText color="textSecondary">{t('Ask about grammar, words and culture. Native speakers answer, the best answer is marked.')}</AppText>
            <TextInput value={search} onChangeText={setSearch} placeholder={t('Search the forum…')} placeholderTextColor={colors.textMuted}
              accessibilityLabel={t('Search the forum')} style={styles.search} autoCorrect={false} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {SORTS.map((item) => <Chip key={item.id} label={t(item.label)} active={sort === item.id} onPress={() => setSort(item.id)} />)}
              {!guest ? <Chip label={t('My topics')} active={mine} onPress={() => setMine(!mine)} /> : null}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              <Chip label={t('All topics')} active={!category} onPress={() => setCategory(undefined)} />
              {forumCategories.map((item) => (
                <Chip key={item.id} label={categoryLabel(item.id)} active={category === item.id}
                  onPress={() => setCategory(category === item.id ? undefined : item.id)} />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              <Chip label={t('All languages')} active={!languageId} onPress={() => setLanguageId(null)} />
              {languageChips.map((language) => (
                <Chip key={language.id} label={`${language.flag_emoji} ${t(language.name)}`} active={languageId === language.id}
                  onPress={() => setLanguageId(languageId === language.id ? undefined : language.id)} />
              ))}
            </ScrollView>
            {guest ? (
              <AppText variant="caption" color="textSecondary">{t('You can read everything. Create a free account to ask and answer.')}</AppText>
            ) : null}
          </View>
        )}
        renderItem={({ item }) => <ThreadCard thread={item} />}
        ListEmptyComponent={threads.isPending ? <LoadingState /> : threads.isError
          ? <ErrorState message={t('Could not load the forum.')} onRetry={() => threads.refetch()} />
          : <EmptyState title={t('No topics yet')} message={guest ? t('Be the first to ask once you have an account.') : t('Ask the first question – someone will answer.')} />}
        ListFooterComponent={threads.isFetchingNextPage ? <LoadingState /> : undefined}
      />
    </Screen>
  );
}

function ThreadCard({ thread }: { thread: ForumThread }) {
  const { styles } = useThemedStyles(createStyles);
  const answered = !!thread.accepted_reply_id;
  return (
    <PressableCard onPress={() => router.push({ pathname: '/forum/[id]', params: { id: thread.id } })} style={styles.card}>
      <View style={styles.cardTop}>
        <AppText variant="caption" color="textSecondary" style={styles.flex} numberOfLines={1}>
          {thread.is_pinned ? '📌 ' : ''}{categoryLabel(thread.category)}{thread.language ? ` · ${thread.language.flag_emoji ?? ''} ${t(thread.language.name)}` : ''}
        </AppText>
        {answered ? <AppText variant="caption" style={styles.solved}>{t('✓ Solved')}</AppText> : null}
      </View>
      <AppText variant="bodyStrong" numberOfLines={2}>{thread.is_locked ? '🔒 ' : ''}{thread.title}</AppText>
      <AppText color="textSecondary" numberOfLines={2}>{thread.content}</AppText>
      <View style={styles.meta}>
        <AppText variant="caption" color="textSecondary" style={styles.flex} numberOfLines={1}>
          {thread.author?.full_name || thread.author?.username || t('Member')} · {new Date(thread.last_activity_at).toLocaleDateString()}
        </AppText>
        <AppText variant="caption" color="textSecondary">▲ {thread.score}  ·  💬 {thread.reply_count}</AppText>
      </View>
    </PressableCard>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.sm },
  filters: { gap: spacing.sm, marginBottom: spacing.sm },
  row: { gap: spacing.xs, paddingRight: spacing.md },
  search: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 46, fontSize: 16 },
  card: { gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  solved: { color: colors.success, fontWeight: '800' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  flex: { flex: 1 },
});
