import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Card, EmptyState, PressableCard } from '@/components/ui';
import { radius, screenPadding, spacing, typography, useThemedStyles, type ThemeColors } from '@/constants/theme';
import type { Course } from '@/features/learn/catalog';
import { canSpeak, speak, useVoicesReady } from '@/lib/speech';

import { usePracticeReview, wordReviewKey } from '@/features/learn/practice-review';

import { VocabularyFlashcards } from './flashcards';
import { themeLook } from './theme-icons';
import { trainerPairs, VocabularyTrainer } from './vocabulary-trainer';
import { frequencySource, vocabularyFor, type Topic } from './catalog';
import { t } from '@/lib/i18n';
import { useGame } from '@/features/game/store';
import { sortThemesForGoal } from '@/features/onboarding/goals';
import { useMyProfile } from '@/features/profile/api';
import { canPractiseSpeaking, SpeakingPractice } from './speaking-practice';

export function CourseVocabulary({ course }: { course: Course }) {
  useVoicesReady();
  const [topicId, setTopicId] = useState<string | null>(null);
  const [training, setTraining] = useState<null | 'mixed' | 'listen' | 'speak'>(null);
  const goal = useMyProfile().data?.profile?.learning_goal;
  const catalog = useMemo(() => {
    const result = vocabularyFor(course);
    return { ...result, categories: sortThemesForGoal(result.categories, goal) };
  }, [course, goal]);
  const game = useGame();
  const savedWords = game.state.saved;
  const mine = useMemo<Topic>(() => ({
    id: 'saved',
    title: 'My words',
    words: savedWords.filter((item) => item.courseId === course.id).map((item) => [item.word, item.meaning]),
    examples: [],
  }), [savedWords, course.id]);
  const themes = [mine, ...catalog.categories, ...catalog.review];
  const review = usePracticeReview();
  const baseTopics = catalog.categories.length ? catalog.categories : catalog.review;
  const trainerTopics = useMemo(() => (mine.words.length ? [mine, ...baseTopics] : baseTopics), [mine, baseTopics]);
  const pairs = useMemo(() => trainerPairs(course.id, trainerTopics), [course.id, trainerTopics]);
  const learned = pairs.filter((pair) => (review.words[pair.key]?.stage ?? -1) >= 1).length;
  const topic = topicId === catalog.frequency.id
    ? catalog.frequency
    : themes.find((item) => item.id === topicId);

  if (training === 'speak') return <SpeakingPractice courseId={course.id} topics={trainerTopics} onBack={() => setTraining(null)} />;
  if (training) return <VocabularyTrainer courseId={course.id} topics={trainerTopics} mode={training} onBack={() => setTraining(null)} />;
  if (topic) {
    return <VocabularyTopic key={topic.id} topic={topic} languageId={course.id}
      onBack={() => setTopicId(null)} />;
  }

  return (
    <ScrollView contentContainerStyle={baseStyles.list}>
      {pairs.length >= 4 ? (
        <TrainerCard learned={learned} total={pairs.length} onStart={() => setTraining('mixed')} />
      ) : null}
      {pairs.length >= 4 ? (
        <View style={baseStyles.modes}>
          {canSpeak(course.id) ? <ModeButton icon="🎧" title={t('Listening')} onPress={() => setTraining('listen')} /> : null}
          {canPractiseSpeaking(course.id) ? <ModeButton icon="🎤" title={t('Speaking')} onPress={() => setTraining('speak')} /> : null}
          <ModeButton icon="⏱️" title={t('Sprint')} onPress={() => router.push({ pathname: '/sprint', params: { course: course.id } })} />
        </View>
      ) : null}
      <ThemeRow title="My words" icon="⭐" words={mine.words} courseId={course.id}
        subtitle={mine.words.length ? t('{n} saved words', { n: mine.words.length }) : t('Tap ☆ next to any word to save it here.')}
        onPress={() => setTopicId('saved')} />
      {catalog.frequency.words.length > 0 && (
        <ThemeRow title={catalog.frequency.title} subtitle={t("Ranked by frequency in the source corpus")}
          words={catalog.frequency.words} courseId={course.id} onPress={() => setTopicId(catalog.frequency.id)} />
      )}
      {catalog.categories.length > 0 && (
        <AppText variant="heading" accessibilityRole="header">{t("Vocabulary by theme")}</AppText>
      )}
      {catalog.categories.map((item) => (
        <ThemeRow key={item.id} title={item.title} words={item.words} courseId={course.id}
          subtitle={t('{n} words and expressions', { n: item.words.length })} onPress={() => setTopicId(item.id)} />
      ))}
      {catalog.review.length > 0 && (
        <AppText variant="heading" accessibilityRole="header">{t("Phrases from your course")}</AppText>
      )}
      {catalog.review.map((item) => (
        <ThemeRow key={item.id} title={item.title} words={item.words} courseId={course.id} icon="📘"
          subtitle={t('{n} phrases', { n: item.words.length })} onPress={() => setTopicId(item.id)} />
      ))}
    </ScrollView>
  );
}

function ModeButton({ icon, title, onPress }: { icon: string; title: string; onPress: () => void }) {
  return (
    <PressableCard onPress={onPress} style={baseStyles.mode} accessibilityLabel={title}>
      <AppText style={baseStyles.modeIcon} accessible={false}>{icon}</AppText>
      <AppText variant="bodyStrong">{title}</AppText>
    </PressableCard>
  );
}

/** Big entry card for the vocabulary game. */
function TrainerCard({ learned, total, onStart }: { learned: number; total: number; onStart: () => void }) {
  const { styles } = useThemedStyles(createListStyles);
  const share = total ? learned / total : 0;
  return (
    <View style={styles.trainer}>
      <View style={styles.trainerHead}>
        <AppText style={styles.trainerIcon} accessible={false}>🎯</AppText>
        <View style={styles.flex}>
          <AppText variant="heading" style={styles.onDark}>{t('Vocabulary trainer')}</AppText>
          <AppText variant="caption" style={styles.onDarkSoft}>{t('10 quick questions · combos give bonus points')}</AppText>
        </View>
      </View>
      <View style={styles.trainerTrack}>
        <View style={[styles.trainerFill, { width: `${Math.max(share * 100, 3)}%` }]} />
      </View>
      <AppText variant="caption" style={styles.onDarkSoft}>{t('{learned} of {total} words learned', { learned, total })}</AppText>
      <Button title={t('Start training →')} size="lg" fullWidth onPress={onStart} variant="secondary" />
    </View>
  );
}

/** One vocabulary theme: symbol tile, title, size and how much is learned. */
function ThemeRow({ title, subtitle, words, courseId, icon, onPress }: {
  title: string; subtitle: string; words: Topic['words']; courseId: string; icon?: string; onPress: () => void;
}) {
  const { styles } = useThemedStyles(createListStyles);
  const review = usePracticeReview();
  const look = themeLook(title);
  const known = words.filter(([word]) => (review.words[wordReviewKey(courseId, word)]?.stage ?? -1) >= 1).length;
  const share = words.length ? known / words.length : 0;
  const label = t(title === 'Home' ? 'Home vocabulary' : title);
  return (
    <PressableCard onPress={onPress} style={styles.row} accessibilityLabel={`${label}. ${subtitle}`}>
      <View style={[styles.tile, { backgroundColor: `${look.tint}26` }]}>
        <AppText style={styles.tileIcon} accessible={false}>{icon ?? look.icon}</AppText>
      </View>
      <View style={styles.flex}>
        <AppText variant="bodyStrong" numberOfLines={2}>{label}</AppText>
        <AppText variant="caption" color="textSecondary">{subtitle}</AppText>
        {known > 0 ? (
          <View style={styles.miniTrack}>
            <View style={[styles.miniFill, { width: `${share * 100}%`, backgroundColor: look.tint }]} />
          </View>
        ) : null}
      </View>
      <AppText variant="heading" color="textMuted" accessible={false}>›</AppText>
    </PressableCard>
  );
}

const createListStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tile: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  tileIcon: { fontSize: 28, lineHeight: 34 },
  miniTrack: { height: 6, marginTop: spacing.xs, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  miniFill: { height: '100%', borderRadius: radius.full },
  trainer: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: colors.action,
    borderBottomWidth: 5,
    borderBottomColor: colors.actionPressed,
  },
  trainerHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  trainerIcon: { fontSize: 40, lineHeight: 48 },
  onDark: { color: '#FFFFFF' },
  onDarkSoft: { color: 'rgba(255,255,255,0.85)' },
  trainerTrack: { height: 10, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  trainerFill: { height: '100%', borderRadius: radius.full, backgroundColor: '#F2B705' },
});

function VocabularyTopic({ topic, languageId, onBack }: {
  topic: Topic;
  languageId: string;
  onBack: () => void;
}) {
  useVoicesReady();
  const { colors, styles } = useThemedStyles(createStyles);
  const [query, setQuery] = useState('');
  const [cards, setCards] = useState(false);
  const ranked = topic.id === 'common';
  const game = useGame();
  const savedKeys = new Set(game.state.saved.filter((item) => item.courseId === languageId).map((item) => item.word));
  const source = frequencySource(languageId);
  const search = query.normalize('NFC').trim().toLowerCase();
  const rows = topic.words.map(([word, meaning], index) => ({ word, meaning, rank: index + 1 }))
    .filter(({ word, meaning }) => !search ||
      word.toLowerCase().includes(search) || meaning?.toLowerCase().includes(search));

  if (cards) return <VocabularyFlashcards topic={topic} courseId={languageId} onBack={() => setCards(false)} />;
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button title={t("‹ Vocabulary")} variant="ghost" style={baseStyles.back} onPress={onBack} />
        <AppText variant="title" accessibilityRole="header">{t(topic.title === 'Home' ? 'Home vocabulary' : topic.title)}</AppText>
        {topic.words.some(([word, meaning]) => meaning && meaning !== word) &&
          <Button title={t('Practise with cards')} variant="secondary" onPress={() => setCards(true)} />}
        {ranked && (
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder={t("Search this list")}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={t("Search the frequency list")}
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
      </View>
      <FlatList
        style={styles.container}
        contentContainerStyle={baseStyles.list}
        keyboardShouldPersistTaps="handled"
        data={rows}
        keyExtractor={({ rank }) => String(rank)}
        ListHeaderComponent={ranked ? (
          <View style={styles.context}>
            <AppText variant="caption" color="textSecondary">{t(source.note)} {t('English meanings are shown where available.')}</AppText>
            <Link href={source.source}>
              <AppText color="primary" variant="caption">{source.name} · {source.license}</AppText>
            </Link>
          </View>
        ) : undefined}
        renderItem={({ item }) => (
          <Card style={styles.word}>
            {ranked && <AppText variant="small" color="textMuted" style={styles.rank}>{item.rank}</AppText>}
            <View style={styles.wordText}>
              <AppText variant="bodyStrong">{item.word}</AppText>
              {item.meaning && item.meaning !== item.word && (
                <AppText variant="caption" color="textSecondary">{item.meaning}</AppText>
              )}
            </View>
            <Pressable
              onPress={() => game.toggleSaved({ courseId: languageId, word: item.word, meaning: item.meaning, at: Date.now() })}
              accessibilityRole="button"
              accessibilityState={{ selected: savedKeys.has(item.word) }}
              accessibilityLabel={savedKeys.has(item.word) ? t('Remove {word} from my words', { word: item.word }) : t('Save {word} to my words', { word: item.word })}
              hitSlop={8}
              style={({ pressed }) => [styles.speaker, pressed && styles.speakerPressed]}
            >
              <AppText variant="heading">{savedKeys.has(item.word) ? '⭐' : '☆'}</AppText>
            </Pressable>
            {canSpeak(languageId) ? (
              <Pressable
                onPress={() => speak(item.word, languageId)}
                accessibilityRole="button"
                accessibilityLabel={t('Play pronunciation of {word}', { word: item.word })}
                hitSlop={8}
                style={({ pressed }) => [styles.speaker, pressed && styles.speakerPressed]}
              >
                <AppText variant="heading">🔊</AppText>
              </Pressable>
            ) : null}
          </Card>
        )}
        ListEmptyComponent={topic.id === 'saved' && !search
          ? <EmptyState title={t("No saved words yet")} message={t("Tap ☆ next to any word to save it here.")} />
          : <EmptyState title={t("No matching words")} message={t("Try another spelling or search term.")} />}
        ListFooterComponent={topic.examples.length || topic.recap ? (
          <View style={styles.context}>
            {topic.examples.length > 0 && (
              <AppText variant="heading" accessibilityRole="header">{t("In context")}</AppText>
            )}
            {topic.examples.map((example) => (
              <Card style={styles.context} key={example.text}>
                {example.review > 0 && (
                  <AppText variant="label" color="primary">
                    {example.review === 1 ? t("Revisits 1 earlier term") : t('Revisits {n} earlier terms', { n: example.review })}
                  </AppText>
                )}
                <AppText>{example.text}</AppText>
                {example.translation && <AppText color="textSecondary">{example.translation}</AppText>}
              </Card>
            ))}
            {topic.recap && (
              <Card style={styles.context}>
                <AppText variant="label" color="primary">{t('Review')} · {topic.recap.theme}</AppText>
                <AppText>{topic.recap.text}</AppText>
                {topic.recap.translation && <AppText color="textSecondary">{topic.recap.translation}</AppText>}
              </Card>
            )}
          </View>
        ) : undefined}
      />
    </View>
  );
}

const baseStyles = StyleSheet.create({
  list: { padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.sm },
  back: { alignSelf: 'flex-start', marginLeft: -spacing.md },
  modes: { flexDirection: 'row', gap: spacing.sm },
  mode: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.md },
  modeIcon: { fontSize: 28, lineHeight: 34 },
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  speaker: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22,
    backgroundColor: colors.primarySoft },
  speakerPressed: { opacity: 0.6 },
  container: { flex: 1, minHeight: 0 },
  header: { gap: spacing.sm, paddingHorizontal: screenPadding, paddingTop: spacing.sm },
  word: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  wordText: { flex: 1 },
  rank: { minWidth: 30 },
  context: { gap: spacing.sm },
  search: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
