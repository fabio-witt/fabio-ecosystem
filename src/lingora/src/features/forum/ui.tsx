import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';

import { forumCategories, type ForumCategory } from './api';

export function categoryLabel(id: ForumCategory) {
  const category = forumCategories.find((item) => item.id === id);
  return category ? `${category.icon} ${t(category.label)}` : id;
}

/** Course id for reading a thread aloud in its language (Croatian family → sh). */
export function speechCourse(code: string | null | undefined) {
  if (!code) return undefined;
  const base = code.toLowerCase().split('-')[0];
  if (['hr', 'sr', 'bs', 'sh'].includes(base)) return 'sh';
  return base;
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}>
      <AppText variant="caption" style={[styles.chipText, active && styles.chipTextActive]}>{label}</AppText>
    </Pressable>
  );
}

/** Up / down arrows with the score in between, like a forum. */
export function VoteBox({ score, mine, disabled, onVote }: {
  score: number; mine: number | undefined; disabled?: boolean; onVote: (value: -1 | 0 | 1) => void;
}) {
  const { styles } = useThemedStyles(createStyles);
  const press = (value: -1 | 1) => { feedback('tap'); onVote(mine === value ? 0 : value); };
  return (
    <View style={styles.vote}>
      <Pressable disabled={disabled} onPress={() => press(1)} accessibilityRole="button" accessibilityLabel={t('Helpful')}
        accessibilityState={{ selected: mine === 1, disabled }} hitSlop={6}
        style={[styles.arrow, mine === 1 && styles.arrowUp]}>
        <AppText style={[styles.arrowText, mine === 1 && styles.arrowTextOn]}>▲</AppText>
      </Pressable>
      <AppText variant="bodyStrong" accessibilityLabel={t('{n} points', { n: score })}>{score}</AppText>
      <Pressable disabled={disabled} onPress={() => press(-1)} accessibilityRole="button" accessibilityLabel={t('Not helpful')}
        accessibilityState={{ selected: mine === -1, disabled }} hitSlop={6}
        style={[styles.arrow, mine === -1 && styles.arrowDown]}>
        <AppText style={[styles.arrowText, mine === -1 && styles.arrowTextOn]}>▼</AppText>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontWeight: '700', color: colors.text },
  chipTextActive: { color: colors.onPrimary },
  pressed: { opacity: 0.75 },
  vote: { alignItems: 'center', gap: 2, minWidth: 40 },
  arrow: { width: 34, height: 28, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  arrowUp: { backgroundColor: colors.successSoft },
  arrowDown: { backgroundColor: colors.dangerSoft },
  arrowText: { fontSize: 14, lineHeight: 18, color: colors.textSecondary },
  arrowTextOn: { color: colors.text },
});
