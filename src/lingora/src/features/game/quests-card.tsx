import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useWiggle } from '@/components/motion';
import { AppText, Card } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { t } from '@/lib/i18n';

import { GameHelp } from './game-help';
import { dayKey, MAX_HEARTS, QUEST_CHEST_GEMS, questsFor, useGame } from './store';
import { useNow } from '@/hooks/use-now';

/** Today's three quests with progress, and the chest when all are done. */
export function QuestsCard() {
  const { colors, styles } = useThemedStyles(createStyles);
  const game = useGame();
  const key = dayKey();
  const quests = questsFor(key);
  const done = quests.filter((quest) => quest.value(game.today) >= quest.goal).length;
  const claimed = game.state.questChests.includes(key);
  const ready = done === quests.length && !claimed;
  const wiggle = useWiggle(ready);
  const [help, setHelp] = useState(false);
  const now = useNow();
  const boostMinutes = Math.ceil((game.state.boostUntil - now) / 60000);

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <AppText variant="heading" style={styles.flex}>{t('🎯 Daily quests')}</AppText>
        <Pressable onPress={() => router.push('/shop')} accessibilityRole="button" style={styles.wallet}
          accessibilityLabel={t('{n} gems. Open the wardrobe.', { n: game.state.gems })}>
          <AppText variant="bodyStrong">💎 {game.state.gems}</AppText>
        </Pressable>
        <Pressable onPress={() => setHelp(true)} accessibilityRole="button" style={styles.wallet}
          accessibilityLabel={t('What do the symbols mean?')}>
          <AppText variant="bodyStrong">❤️ {game.isPlus ? '∞' : `${game.hearts.count}/${MAX_HEARTS}`}</AppText>
        </Pressable>
        <GameHelp visible={help} onClose={() => setHelp(false)} />
      </View>
      {boostMinutes > 0 ? (
        <View style={styles.boost} accessibilityLiveRegion="polite">
          <AppText variant="bodyStrong" style={styles.onGold}>{t('⚡ Double XP active · {n} min left', { n: boostMinutes })}</AppText>
        </View>
      ) : (
        <AppText variant="caption" color="textSecondary">{t('Tip: a perfect lesson unlocks 15 minutes of double XP.')}</AppText>
      )}
      {quests.map((quest) => {
        const value = Math.min(quest.value(game.today), quest.goal);
        const complete = value >= quest.goal;
        return (
          <View key={quest.id} style={styles.quest}>
            <AppText style={styles.questIcon} accessible={false}>{complete ? '✅' : quest.icon}</AppText>
            <View style={styles.flex}>
              <AppText variant="callout" style={complete ? styles.strike : undefined}>{t(quest.title)}</AppText>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${(value / quest.goal) * 100}%`, backgroundColor: complete ? colors.success : '#F2B705' }]} />
              </View>
            </View>
            <AppText variant="caption" color="textSecondary">{value}/{quest.goal}</AppText>
          </View>
        );
      })}
      <Animated.View style={wiggle}>
        <Pressable
          disabled={!ready}
          onPress={game.openQuestChest}
          accessibilityRole="button"
          style={({ pressed }) => [styles.chest, ready && styles.chestReady, claimed && styles.chestDone, pressed && styles.pressed]}
        >
          <AppText style={styles.chestIcon}>{claimed ? '📭' : '🎁'}</AppText>
          <AppText variant="bodyStrong" style={ready ? styles.onGold : undefined}>
            {claimed ? t('Chest opened. New quests tomorrow!')
              : ready ? t('Open your chest! +{n} 💎', { n: QUEST_CHEST_GEMS })
                : t('{done} of 3 quests done', { done })}
          </AppText>
        </Pressable>
      </Animated.View>
    </Card>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  wallet: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.surfaceMuted },
  quest: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  questIcon: { fontSize: 22, lineHeight: 28, width: 30, textAlign: 'center' },
  strike: { textDecorationLine: 'line-through', opacity: 0.7 },
  track: { height: 8, marginTop: 4, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
  chest: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md,
    borderRadius: radius.xl, backgroundColor: colors.surfaceMuted,
  },
  chestReady: { backgroundColor: '#F2B705', borderBottomWidth: 4, borderBottomColor: '#B98A00' },
  chestDone: { opacity: 0.7 },
  chestIcon: { fontSize: 28, lineHeight: 34 },
  onGold: { color: '#3D2E00' },
  pressed: { transform: [{ translateY: 2 }] },
  boost: { padding: spacing.sm, borderRadius: radius.lg, backgroundColor: '#F2B705' },
});
