import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { celebrate } from '@/features/game/celebrations';
import { feedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';

import { monthlyChallenges } from './challenges';
import { useGame } from './store';

/** Monthly challenges with progress bars; finished ones pay gems once. */
export function ChallengesCard() {
  const { colors, styles } = useThemedStyles(createStyles);
  const game = useGame();
  const list = monthlyChallenges(game.state.days);
  const done = game.state.challenges ?? [];
  const newlyDone = list.find((item) => item.value >= item.goal && !done.includes(item.id));

  useEffect(() => {
    if (!newlyDone) return;
    game.completeChallenge(newlyDone.id, newlyDone.gems);
    feedback('win');
    celebrate({ icon: '🏅', title: t('Challenge done!'), message: t('{title} · +{n} gems', { title: t(newlyDone.title), n: newlyDone.gems }) });
  }, [newlyDone, game]);

  const month = new Date().toLocaleDateString(undefined, { month: 'long' });
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <AppText variant="heading" style={styles.flex}>{t('🏅 {month} challenges', { month })}</AppText>
        <Button title={t('Report')} size="sm" variant="ghost" onPress={() => router.push('/report')} />
      </View>
      {list.map((item) => {
        const complete = done.includes(item.id) || item.value >= item.goal;
        const percent = Math.min(100, Math.round((item.value / item.goal) * 100));
        return (
          <View key={item.id} style={styles.item}>
            <View style={styles.head}>
              <AppText style={styles.flex}>{item.icon} {t(item.title)}</AppText>
              <AppText variant="caption" color={complete ? 'success' : 'textSecondary'}>
                {complete ? t('✓ +{n} 💎', { n: item.gems }) : `${Math.min(item.value, item.goal)}/${item.goal}`}
              </AppText>
            </View>
            <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(percent, 3)}%`, backgroundColor: complete ? colors.success : '#F2B705' }]} /></View>
          </View>
        );
      })}
    </Card>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  item: { gap: 4 },
  track: { height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
});
