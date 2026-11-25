import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

import { achievements, useGame } from './store';

/** All badges: earned ones in colour, the rest greyed out with how to get them. */
export function AchievementsGrid() {
  const { styles } = useThemedStyles(createStyles);
  const game = useGame();
  const { user } = useSession();
  const earned = Object.keys(game.state.achievements).length;
  const { setCorrections } = game;

  // The "Helpful" badge counts corrections given in chats (server side).
  useEffect(() => {
    if (!user) return;
    void supabase.rpc('count_my_corrections').then(({ data, error }) => {
      if (!error && typeof data === 'number') setCorrections(data);
    });
  }, [user, setCorrections]);

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <AppText variant="heading" style={styles.flex}>{t('Achievements')}</AppText>
        <AppText variant="caption" color="textSecondary">{t('{n} of {total}', { n: earned, total: achievements.length })}</AppText>
      </View>
      <View style={styles.grid}>
        {achievements.map((achievement) => {
          const unlocked = !!game.state.achievements[achievement.id];
          return (
            <View key={achievement.id} style={[styles.badge, unlocked ? styles.badgeOn : styles.badgeOff]}
              accessible accessibilityLabel={`${t(achievement.title)}. ${t(achievement.description)} ${unlocked ? t('Earned') : t('Not earned yet')}`}>
              <AppText style={[styles.icon, !unlocked && styles.iconOff]}>{achievement.icon}</AppText>
              <AppText variant="small" align="center" numberOfLines={2} style={styles.bold}>{t(achievement.title)}</AppText>
              {!unlocked ? <AppText variant="small" align="center" color="textSecondary" numberOfLines={3} style={styles.hint}>{t(achievement.description)}</AppText> : null}
            </View>
          );
        })}
      </View>
      {game.state.totals.corrections > 0 ? (
        <AppText variant="caption" color="textSecondary">
          {t('✏️ You have corrected {n} messages for your partners. Thank you for helping!', { n: game.state.totals.corrections })}
        </AppText>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '800' },
  section: { gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.lg },
  head: { flexDirection: 'row', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: {
    width: '31%', minWidth: 96, alignItems: 'center', gap: 2, padding: spacing.sm,
    borderRadius: radius.xl, borderWidth: 2, borderBottomWidth: 4,
  },
  badgeOn: { borderColor: '#F2B705', borderBottomColor: '#B98A00', backgroundColor: 'rgba(242,183,5,0.12)' },
  badgeOff: { borderColor: colors.borderSubtle, backgroundColor: colors.surface },
  icon: { fontSize: 30, lineHeight: 38 },
  iconOff: { opacity: 0.3 },
  hint: { fontSize: 10, lineHeight: 13 },
});
