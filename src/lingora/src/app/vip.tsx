import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { ScrollView, StyleSheet, View } from 'react-native';

import { MedvedSays } from '@/components/medved';
import { AppText, Button, Card, PressableCard, Screen, ScreenHeader } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { DONATION_AMOUNTS, paypalLink } from '@/features/vip/donation';
import { t } from '@/lib/i18n';
import { track } from '@/lib/insights';
import { useEffect } from 'react';

const reasons: [string, string, string][] = [
  ['🆓', 'Lingora stays free', 'Lessons, partners and chats are free for everyone. No ads, no paywall.'],
  ['📚', 'More languages and lessons', 'Your support pays for new courses, stories and audio.'],
  ['🖥️', 'Servers and email', 'Every chat, lesson and login runs on servers that cost money each month.'],
];

/** VIP page: a thank-you page where people can support Lingora with a donation. */
export default function VipScreen() {
  const { styles } = useThemedStyles(createStyles);
  const link = paypalLink();
  useEffect(() => { track('donation_viewed'); }, []);

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={t('⭐ VIP · Support Lingora')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <AppText style={styles.heroIcon} accessible={false}>⭐</AppText>
          <AppText variant="title" align="center" style={styles.onGold}>{t('Become a VIP supporter')}</AppText>
          <AppText align="center" style={styles.onGoldSoft}>
            {t('Lingora is made by one person with a lot of love. A small donation helps keep it free for everyone.')}
          </AppText>
        </View>

        <MedvedSays mood="cheer" message={t('Every coffee helps me learn new languages! Thank you! 🐻☕')} />

        {link ? (
          <>
            <AppText variant="heading">{t('Donate with PayPal')}</AppText>
            <View style={styles.amounts}>
              {DONATION_AMOUNTS.map((amount) => (
                <PressableCard key={amount} style={styles.amount} accessibilityLabel={t('Donate {n} euros with PayPal', { n: amount })}
                  onPress={() => void Linking.openURL(paypalLink(amount)!)}>
                  <AppText style={styles.amountIcon} accessible={false}>{amount <= 3 ? '☕' : amount <= 5 ? '🥐' : amount <= 10 ? '🍕' : '💛'}</AppText>
                  <AppText variant="heading">{amount} €</AppText>
                </PressableCard>
              ))}
            </View>
            <Button title={t('Choose your own amount')} variant="secondary" fullWidth onPress={() => void Linking.openURL(link)} />
            <AppText variant="caption" color="textSecondary" align="center">
              {t('You are taken to PayPal. Lingora never sees your payment details.')}
            </AppText>
          </>
        ) : (
          <Card><AppText color="textSecondary">{t('Donations are being set up. Please check back soon!')}</AppText></Card>
        )}

        <AppText variant="heading">{t('What your support does')}</AppText>
        {reasons.map(([icon, title, text]) => (
          <Card key={title} style={styles.reason}>
            <AppText style={styles.reasonIcon} accessible={false}>{icon}</AppText>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{t(title)}</AppText>
              <AppText variant="caption" color="textSecondary">{t(text)}</AppText>
            </View>
          </Card>
        ))}
        <Button title={t('See what Lingora Plus will offer')} variant="ghost" onPress={() => router.push('/plus')} />
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: screenPadding, gap: spacing.md, paddingBottom: spacing.xxxl },
  flex: { flex: 1, gap: 2 },
  hero: {
    alignItems: 'center', gap: spacing.sm, padding: spacing.xl, borderRadius: radius.xxl,
    backgroundColor: '#F2B705', borderBottomWidth: 5, borderBottomColor: '#B98A00',
  },
  heroIcon: { fontSize: 54, lineHeight: 64 },
  onGold: { color: '#3D2E00' },
  onGoldSoft: { color: '#5C4600' },
  amounts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  amount: { flexGrow: 1, flexBasis: '22%', minWidth: 72, alignItems: 'center', gap: 2, paddingVertical: spacing.md },
  amountIcon: { fontSize: 26, lineHeight: 32 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reasonIcon: { fontSize: 28, lineHeight: 34 },
});
