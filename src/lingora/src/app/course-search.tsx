import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput } from 'react-native';

import { AppText, Card, EmptyState, PressableCard, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { activityLabel, courses, courseSections } from '@/features/learn/catalog';
import { vocabularyFor } from '@/features/vocabulary/catalog';
import { t } from '@/lib/i18n';

function normalise(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export default function CourseSearchScreen() {
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const course = courses.find((item) => item.id === courseId);
  const { colors, styles } = useThemedStyles(createStyles);
  const [query, setQuery] = useState('');
  const term = normalise(query.trim());
  const results = useMemo(() => {
    if (!course || term.length < 2) return [];
    const matches = (value: string) => normalise(value).includes(term);
    const lessons = courseSections(course, false).flatMap(({ level, data }) => data.flatMap((entry) => {
      const detail = 'rule' in entry ? [entry.rule, entry.structure, entry.more ?? '', ...entry.examples.flat().filter(Boolean)].join(' ') : entry.text;
      if (!matches(entry.title) && !matches(detail)) return [];
      return [{ id: entry.id, title: entry.title, level, label: activityLabel(entry) }];
    })).sort((a, b) => Number(matches(b.title)) - Number(matches(a.title))).slice(0, 15);
    const vocabulary = vocabularyFor(course);
    const words = new Map<string, string>();
    for (const topic of [...vocabulary.categories, vocabulary.frequency]) {
      for (const [word, meaning] of topic.words) {
        if (matches(word) || (meaning && matches(meaning))) {
          if (!words.has(word)) words.set(word, meaning ?? '');
        }
      }
    }
    return [
      ...lessons.map((item) => ({ ...item, grammar: false })),
      ...lessons.filter(({ label }) => label === 'Lesson').map((item) => ({ ...item, grammar: true, label: t("Grammar rule") })),
      ...[...words].slice(0, 15).map(([title, label]) => ({ id: '', title, label, level: undefined, grammar: false })),
    ];
  }, [course, term]);

  return (
    <Screen>
      <ScreenHeader title={course ? `Search ${t(course.name)}` : t("Course search")} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput style={styles.input} value={query} onChangeText={setQuery} autoCorrect={false}
          placeholder={t("Search lessons, grammar and words")} accessibilityLabel={t("Search course")}
          placeholderTextColor={colors.textMuted} returnKeyType="search" />
        {term.length < 2 ? <AppText color="textSecondary">{t("Enter at least two characters.")}</AppText>
          : results.length === 0 ? <EmptyState title={t("No matching content")} message={t("Try another term.")} />
            : results.map((item, index) => item.id ? (
              <PressableCard key={`${item.id}-${item.grammar}`} onPress={() => router.push({
                pathname: '/lesson/[id]', params: { id: item.id, ...(item.grammar ? { view: 'grammar' } : {}) },
              })}>
                <AppText variant="bodyStrong">{item.title}</AppText>
                <AppText color="textSecondary">{item.level} · {item.label}</AppText>
              </PressableCard>
            ) : <Card key={`word-${index}`}><AppText variant="bodyStrong">{item.title}</AppText><AppText color="textSecondary">{item.label || 'Vocabulary'}</AppText></Card>)}
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { padding: screenPadding, gap: spacing.sm },
  input: { minHeight: 48, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.surface },
});
