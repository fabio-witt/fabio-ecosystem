import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { t } from '@/lib/i18n';

import { nextTier, tierFor, useDuels, useWeeklyLeague } from './social';
import { useGame } from './store';
import { weekTotals } from './weekly';

/** Home card: league tier, rank, waiting duels and this week's recap. */
export function LeagueCard({ compact = false }: { compact?: boolean }) {
  const { styles } = useThemedStyles(createStyles);
  const game = useGame();
  const league = useWeeklyLeague().data ?? [];
  const duels = useDuels().data ?? [];
  const meIndex = league.findIndex((row) => row.is_me);
  const me = league[meIndex];
  const xp = me?.weekly_xp ?? 0;
  const tier = tierFor(xp);
  const next = nextTier(xp);
  const week = weekTotals(game.state);
  const waiting = duels.filter((duel) => duel.opponent_score === null && duel.challenger_id !== me?.user_id).length;
  const { markLeagueGold } = game;

  useEffect(() => {
    if (xp >= 250) markLeagueGold();
  }, [xp, markLeagueGold]);

  return (
    <Card style={styles.card}>
      <Pressable onPress={() => router.push('/league')} accessibilityRole="button" style={styles.head}
        accessibilityLabel={`${t(tier.name)}. ${t('Open the league')}`}>
        <AppText style={styles.tierIcon} accessible={false}>{tier.icon}</AppText>
        <View style={styles.flex}>
          <AppText variant="heading">{t(tier.name)}</AppText>
          <AppText variant="caption" color="textSecondary">
            {me ? t('Rank {rank} · {xp} XP this week', { rank: meIndex + 1, xp }) : t('Finish a lesson to join this week’s league.')}
          </AppText>
        </View>
        <AppText variant="heading" color="textMuted" accessible={false}>›</AppText>
      </Pressable>
      {next ? (
        <AppText variant="caption" color="textSecondary">
          {t('{n} XP more for the {tier}.', { n: next.min - xp, tier: t(next.name) })}
        </AppText>
      ) : null}
      {waiting > 0 ? (
        <Pressable onPress={() => router.push('/league')} style={styles.duel} accessibilityRole="button">
          <AppText variant="bodyStrong" style={styles.onGold}>
            {waiting === 1 ? t('⚔️ 1 duel is waiting for you') : t('⚔️ {n} duels are waiting for you', { n: waiting })}
          </AppText>
        </Pressable>
      ) : null}
      {compact ? null : <AppText variant="label" color="primary">{t('YOUR WEEK')}</AppText>}
      {compact ? null : <View style={styles.stats}>
        <Stat value={week.days} label={t('active days')} />
        <Stat value={week.lessons} label={t('lessons')} />
        <Stat value={week.words} label={t('words')} />
        <Stat value={week.mistakes} label={t('mistakes fixed')} />
      </View>}
    </Card>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>
      <AppText variant="heading">{value}</AppText>
      <AppText variant="small" color="textSecondary" align="center">{label}</AppText>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tierIcon: { fontSize: 36, lineHeight: 44 },
  flex: { flex: 1, gap: 2 },
  duel: { padding: spacing.sm, borderRadius: radius.lg, backgroundColor: '#F2B705', borderBottomWidth: 3, borderBottomColor: '#B98A00' },
  onGold: { color: '#3D2E00' },
  stats: { flexDirection: 'row', gap: spacing.xs },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
});
