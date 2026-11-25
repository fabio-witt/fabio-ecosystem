import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Medved } from '@/components/medved';
import { AppText, Button, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useGame } from '@/features/game/store';
import { wardrobe, type WardrobeSlot } from '@/features/game/wardrobe';
import { t } from '@/lib/i18n';

const slots: { slot: WardrobeSlot; title: string }[] = [
  { slot: 'hat', title: 'Hats' },
  { slot: 'glasses', title: 'Glasses' },
  { slot: 'scarf', title: 'Scarves' },
];

/** Fabio's wardrobe: spend gems on hats, glasses and scarves. */
export default function ShopScreen() {
  const { styles } = useThemedStyles(createStyles);
  const game = useGame();
  const { gems, owned, equipped } = game.state;

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t("Fabio's wardrobe")} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Medved mood="cheer" size={130} />
          <View style={styles.balance}>
            <AppText variant="caption" color="textSecondary">{t('Your gems')}</AppText>
            <AppText style={styles.gems}>💎 {gems}</AppText>
            <AppText variant="small" color="textSecondary">{t('Earn gems with lessons, chests, quests and badges.')}</AppText>
          </View>
        </View>
        <Button title={t('🧊 Streak freeze and chests → Rewards')} variant="secondary" onPress={() => router.push('/rewards')} />

        {slots.map(({ slot, title }) => (
          <View key={slot} style={styles.section}>
            <AppText variant="heading">{t(title)}</AppText>
            <View style={styles.grid}>
              {wardrobe.filter((item) => item.slot === slot).map((item) => {
                const has = owned.includes(item.id);
                const wearing = equipped[slot] === item.id;
                const affordable = gems >= item.price;
                const needsPlus = !!item.plus && !game.isPlus;
                const needsLevel = !!item.level && (game.state.levelSeen ?? 1) < item.level;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${t(item.name)}. ${wearing ? t('Wearing') : has ? t('Wear') : t('{n} gems', { n: item.price })}`}
                    disabled={(!has && !affordable && !needsPlus) || needsLevel}
                    onPress={() => (needsPlus ? router.push('/plus') : wearing ? game.unequip(slot) : game.buy(item.id, item.price, slot))}
                    style={({ pressed }) => [styles.item, wearing && styles.itemWearing, ((!has && !affordable && !needsPlus) || needsLevel) && styles.itemLocked, item.plus && styles.itemPlus, pressed && styles.pressed]}
                  >
                    <AppText style={[styles.itemIcon, item.color ? { color: item.color } : null]}>{item.icon}</AppText>
                    {item.color ? <View style={[styles.swatch, { backgroundColor: item.color }]} /> : null}
                    <AppText variant="caption" align="center" numberOfLines={1} style={styles.bold}>{t(item.name)}</AppText>
                    <View style={[styles.price, wearing && styles.priceWearing, has && !wearing && styles.priceOwned]}>
                      <AppText variant="small" style={[styles.bold, wearing && styles.onGold]}>
                        {needsLevel ? t('🔒 Level {n}', { n: item.level! }) : needsPlus ? '✦ Plus' : wearing ? t('Wearing ✓') : has ? t('Wear') : item.plus || item.level ? t('Free') : `💎 ${item.price}`}
                      </AppText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.lg },
  bold: { fontWeight: '800' },
  pressed: { transform: [{ translateY: 2 }] },
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg,
    borderRadius: radius.xxl, backgroundColor: colors.primarySoft,
  },
  balance: { flex: 1, gap: 2 },
  gems: { fontSize: 32, lineHeight: 40, fontWeight: '900', color: colors.text },
  section: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  item: {
    width: '31%', minWidth: 96, alignItems: 'center', gap: spacing.xs, padding: spacing.md,
    borderRadius: radius.xl, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.borderSubtle, backgroundColor: colors.surface,
  },
  itemWearing: { borderColor: '#F2B705', borderBottomColor: '#B98A00' },
  itemLocked: { opacity: 0.5 },
  itemPlus: { borderColor: '#8E7CF8' },
  itemIcon: { fontSize: 38, lineHeight: 46 },
  swatch: { width: 28, height: 6, borderRadius: 3 },
  price: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.surfaceMuted },
  priceOwned: { backgroundColor: colors.successSoft },
  priceWearing: { backgroundColor: '#F2B705' },
  onGold: { color: '#3D2E00' },
});
