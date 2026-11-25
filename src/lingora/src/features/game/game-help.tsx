import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { t } from '@/lib/i18n';

const items: [string, string, string][] = [
  ['🔥', 'Streak', 'Days in a row on which you reached your daily goal. A streak freeze (🧊) protects it once if you miss a day; you earn one every 7 days.'],
  ['💎', 'Gems', 'Rewards for lessons, chests, quests and badges. Spend them in Fabio’s wardrobe on hats, glasses and scarves.'],
  ['❤️', 'Hearts', 'You have 5. A wrong answer in a lesson costs one. A heart comes back every 30 minutes, or right away when you fix a mistake in your review. Exams never cost hearts.'],
  ['🎯', 'Daily goal', 'The XP you want to earn each day. A new lesson gives 10 XP, a perfect one 15. Change your goal in Learn.'],
  ['⚡', 'XP booster', 'After a perfect lesson you earn double XP for 15 minutes.'],
  ['🗂', 'Word stations', 'Vocabulary stops on the path. 7 of 10 right passes the station.'],
  ['🎓', 'Final exams', 'At the end of each level. Pass with 80% to earn the level badge and a certificate.'],
];

/** Explains the symbols at the top of the learning path. */
export function GameHelp({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('Close')}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <ScrollView contentContainerStyle={styles.content}>
            <AppText variant="title">{t('What do the symbols mean?')}</AppText>
            {items.map(([icon, title, text]) => (
              <View key={title} style={styles.row}>
                <AppText style={styles.icon} accessible={false}>{icon}</AppText>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">{t(title)}</AppText>
                  <AppText variant="caption" color="textSecondary">{t(text)}</AppText>
                </View>
              </View>
            ))}
            <Button title={t('Got it')} fullWidth onPress={onClose} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: spacing.md },
  sheet: { width: '100%', maxWidth: 520, maxHeight: '88%', alignSelf: 'center', borderRadius: radius.xxl, backgroundColor: colors.background, overflow: 'hidden' },
  content: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  icon: { fontSize: 26, lineHeight: 32, width: 34, textAlign: 'center' },
  flex: { flex: 1, gap: 2 },
});
