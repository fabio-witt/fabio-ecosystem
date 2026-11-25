import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, PressableCard } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { t } from '@/lib/i18n';

import { levelForUnit, type Course } from './catalog';

const covers = ['🏙️', '☕', '🚆', '🏖️', '🛒', '🎉', '🏔️', '📮', '🍝', '🎭', '🌧️', '🚲', '🏠', '🎶', '🌅', '📚'];

/** Every reading and listening text of the course as a story shelf. */
export function CourseStories({ course, scores }: { course: Course; scores: Record<string, number> }) {
  const { styles } = useThemedStyles(createStyles);
  const stories = course.units.flatMap((unit, index) => (unit.reading ? [{ reading: unit.reading, unit, index }] : []));
  const done = stories.filter(({ reading }) => scores[reading.id] !== undefined).length;

  return (
    <ScrollView contentContainerStyle={styles.list}>
      <View style={styles.hero}>
        <AppText style={styles.heroIcon} accessible={false}>📖</AppText>
        <View style={styles.flex}>
          <AppText variant="heading">{t('Stories')}</AppText>
          <AppText variant="caption" color="textSecondary">
            {t('Short stories and dialogues that use what you learned. {done} of {total} read.', { done, total: stories.length })}
          </AppText>
        </View>
      </View>
      {stories.length === 0 ? (
        <AppText color="textSecondary">{t('This course has no stories yet.')}</AppText>
      ) : null}
      {stories.map(({ reading, unit, index }) => {
        const score = scores[reading.id];
        const read = score !== undefined;
        return (
          <PressableCard key={reading.id} style={styles.row}
            onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: reading.id } })}
            accessibilityLabel={`${reading.title}. ${t(unit.title)}. ${read ? t('Read') : t('Not read yet')}`}>
            <View style={[styles.cover, read && styles.coverDone]}>
              <AppText style={styles.coverIcon} accessible={false}>{covers[index % covers.length]}</AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong" numberOfLines={2}>{reading.title}</AppText>
              <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                {levelForUnit(course, index)} · {reading.listening ? t('🎧 Listening') : t('📖 Reading')} · {t(unit.title)}
              </AppText>
              <AppText variant="small" color="textSecondary" numberOfLines={2}>{reading.text.replace(/\*+/g, '').slice(0, 90)}…</AppText>
            </View>
            <AppText variant="heading" accessible={false}>{read ? (score === 100 ? '⭐' : '✓') : '›'}</AppText>
          </PressableCard>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  list: { padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.sm },
  flex: { flex: 1, gap: 2 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.primarySoft },
  heroIcon: { fontSize: 40, lineHeight: 48 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cover: { width: 56, height: 72, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  coverDone: { backgroundColor: 'rgba(242,183,5,0.25)' },
  coverIcon: { fontSize: 30, lineHeight: 36 },
});
