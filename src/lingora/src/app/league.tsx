import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Avatar, Button, Card, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { tierFor, tiers, useDuels, useWeeklyLeague, type Duel } from '@/features/game/social';
import { LeagueCard } from '@/features/game/league-card';
import { courses } from '@/features/learn/catalog';
import { t } from '@/lib/i18n';
import { useSession } from '@/providers/session-provider';

/** Weekly league (resets every Monday) and friendly duels. */
export default function LeagueScreen() {
  const { colors, styles } = useThemedStyles(createStyles);
  const { user } = useSession();
  const league = useWeeklyLeague();
  const duels = useDuels();
  const rows = league.data ?? [];

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('🏆 League & duels')} />
      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={league.isRefetching} tintColor={colors.primary}
          onRefresh={() => { void league.refetch(); void duels.refetch(); }} />}>
        <LeagueCard />

        <View style={styles.tiers}>
          {[...tiers].reverse().map((tier) => (
            <View key={tier.id} style={styles.tier}>
              <AppText style={styles.tierIcon}>{tier.icon}</AppText>
              <AppText variant="small" align="center" style={styles.bold}>{t(tier.name)}</AppText>
              <AppText variant="small" color="textSecondary">{tier.min}+ XP</AppText>
            </View>
          ))}
        </View>

        <AppText variant="heading">{t('This week')}</AppText>
        <AppText variant="caption" color="textSecondary">
          {t('You, the people you follow and the most active learners. The league starts again every Monday.')}
        </AppText>
        {rows.map((row, index) => {
          const tier = tierFor(row.weekly_xp);
          return (
            <Card key={row.user_id} style={[styles.row, row.is_me && styles.rowMe]}
              accessible accessibilityLabel={`${index + 1}. ${row.name}, ${row.weekly_xp} XP`}>
              <AppText variant="bodyStrong" style={styles.rank}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
              </AppText>
              <Avatar name={row.name} uri={row.avatar_url} size={36} />
              <AppText variant="bodyStrong" numberOfLines={1} style={styles.flex}
                onPress={row.is_me ? undefined : () => router.push(`/user/${row.user_id}`)}>
                {row.is_me ? t('You') : row.name}
              </AppText>
              <AppText variant="caption" color="textSecondary">{tier.icon} {row.weekly_xp} XP</AppText>
            </Card>
          );
        })}
        {league.isError ? <AppText color="danger">{t('The league could not be loaded. Pull to try again.')}</AppText> : null}

        <AppText variant="heading" style={styles.section}>{t('⚔️ Duels')}</AppText>
        <AppText variant="caption" color="textSecondary">
          {t('Challenge people from their profile. You both answer the same five questions.')}
        </AppText>
        {(duels.data ?? []).length === 0 ? (
          <Card><AppText color="textSecondary">{t('No duels yet. Open a profile and tap “Challenge to a duel”.')}</AppText></Card>
        ) : null}
        {(duels.data ?? []).map((duel) => <DuelRow key={duel.id} duel={duel} me={user?.id} />)}
      </ScrollView>
    </Screen>
  );
}

function DuelRow({ duel, me }: { duel: Duel; me?: string }) {
  const { styles } = useThemedStyles(createStyles);
  const mine = duel.challenger_id === me;
  const other = mine ? duel.opponent_name : duel.challenger_name;
  const course = courses.find((item) => item.id === duel.course_id);
  const myScore = mine ? duel.challenger_score : duel.opponent_score;
  const theirScore = mine ? duel.opponent_score : duel.challenger_score;
  const open = duel.opponent_score === null;
  const result = open ? null : myScore! > theirScore! ? 'won' : myScore === theirScore ? 'tie' : 'lost';
  return (
    <Card style={styles.duel}>
      <View style={styles.duelHead}>
        <AppText style={styles.duelIcon}>{result === 'won' ? '🏆' : result === 'lost' ? '😅' : result === 'tie' ? '🤝' : '⚔️'}</AppText>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{other}</AppText>
          <AppText variant="caption" color="textSecondary">{course ? `${course.flag} ${t(course.name)}` : duel.course_id}</AppText>
        </View>
        {!open ? <AppText variant="bodyStrong">{myScore}% : {theirScore}%</AppText> : null}
      </View>
      {open && !mine ? (
        <Button title={t('Play now')} fullWidth onPress={() => router.push({
          pathname: '/duel',
          params: { id: duel.id, course: duel.course_id, seed: String(duel.seed), name: other, theirs: String(duel.challenger_score) },
        })} />
      ) : open ? (
        <AppText variant="caption" color="textSecondary">{t('Waiting for {name} to play.', { name: other })}</AppText>
      ) : (
        <AppText variant="caption" color="textSecondary">
          {result === 'won' ? t('You won!') : result === 'tie' ? t("It's a tie!") : t('{name} won this time.', { name: other })}
        </AppText>
      )}
    </Card>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.sm },
  bold: { fontWeight: '800' },
  flex: { flex: 1 },
  section: { marginTop: spacing.lg },
  tiers: { flexDirection: 'row', gap: spacing.xs, marginVertical: spacing.sm },
  tier: { flex: 1, alignItems: 'center', padding: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
  tierIcon: { fontSize: 26, lineHeight: 32 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm },
  rowMe: { borderColor: '#F2B705', borderWidth: 2 },
  rank: { width: 28, textAlign: 'center' },
  duel: { gap: spacing.sm },
  duelHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  duelIcon: { fontSize: 26, lineHeight: 32 },
});
