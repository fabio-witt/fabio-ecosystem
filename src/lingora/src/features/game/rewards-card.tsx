import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, PressableCard } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { celebrate } from '@/features/game/celebrations';
import { useLearnSummary } from '@/features/learn/progress';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';

import { dailyChestState, divisionFor, isGemWeekend, levelFromXp, levelTitle, weekTotals } from './progression';
import { useGame } from './store';

/** Home card: level bar, division and whether today's chest is waiting. */
export function RewardsCard() {
  const { styles } = useThemedStyles(createStyles);
  const game = useGame();
  const summary = useLearnSummary().data;
  const level = levelFromXp(summary?.total_xp ?? 0);
  const chest = dailyChestState(game.state.dailyChest?.last, game.state.dailyChest?.run ?? 0);
  const division = divisionFor(weekTotals(game.state.days).xp);
  const seen = game.state.levelSeen ?? 1;

  useEffect(() => {
    if (!summary || level.level <= seen) return;
    celebrate({ icon: '⬆️', title: t('Level {n}!', { n: level.level }), message: t(levelTitle(level.level)) });
    feedback('levelup');
    game.markLevelSeen(level.level);
  }, [summary, level.level, seen, game]);

  return (
    <PressableCard style={styles.card} onPress={() => router.push('/rewards')} accessibilityLabel={t('Open rewards')}>
      <View style={styles.row}>
        <View style={styles.badge}><AppText style={styles.badgeText}>{level.level}</AppText></View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{t('Level {n} · {title}', { n: level.level, title: t(levelTitle(level.level)) })}</AppText>
          <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(3, level.progress * 100)}%` }]} /></View>
        </View>
        <AppText style={styles.division} accessibilityLabel={t('{name} division', { name: t(division.name) })}>{division.icon}</AppText>
      </View>
      <View style={styles.row}>
        <AppText variant="caption" style={[styles.pill, !chest.claimedToday && styles.pillHot]}>
          {chest.claimedToday ? t('🎁 Chest opened · day {n}/7', { n: chest.day }) : t('🎁 Your daily chest is waiting!')}
        </AppText>
        {isGemWeekend() ? <AppText variant="caption" style={[styles.pill, styles.pillHot]}>{t('💎 ×2 weekend')}</AppText> : null}
      </View>
    </PressableCard>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  flex: { flex: 1, gap: 4 },
  badge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6554C4', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F2B705' },
  badgeText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  track: { height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full, backgroundColor: '#6554C4' },
  division: { fontSize: 26, lineHeight: 32 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, fontWeight: '700', overflow: 'hidden' },
  pillHot: { backgroundColor: '#FFF4D6', color: '#8A5A00' },
});
