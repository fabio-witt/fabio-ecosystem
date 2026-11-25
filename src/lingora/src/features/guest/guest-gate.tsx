import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Medved } from '@/components/medved';
import { AppText, Button, Card, Screen } from '@/components/ui';
import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { t } from '@/lib/i18n';

const perks: [string, string][] = [
  ['🤝', 'Find language partners near you or worldwide'],
  ['💬', 'Chat and get corrections from native speakers'],
  ['⚔️', 'Duels, the weekly league and shared streaks'],
  ['☁️', 'Your progress is saved safely on every device'],
];

/** Shown instead of community screens while someone is a guest. */
export function GuestGate({ title, message }: { title: string; message: string }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Medved mood="happy" size={120} />
        <AppText variant="title" align="center">{title}</AppText>
        <AppText align="center" color="textSecondary">{message}</AppText>
        <Card style={styles.card}>
          {perks.map(([icon, text]) => (
            <View key={text} style={styles.perk}>
              <AppText style={styles.icon} accessible={false}>{icon}</AppText>
              <AppText style={styles.flex}>{t(text)}</AppText>
            </View>
          ))}
        </Card>
        <Button title={t('Create a free account')} size="lg" fullWidth onPress={() => router.push('/create-account')} />
        <Button title={t('Keep learning as a guest')} variant="ghost" onPress={() => router.navigate('/learn')} />
      </ScrollView>
    </Screen>
  );
}

/** Small reminder on Home and Profile that progress is not tied to an account yet. */
export function GuestBanner() {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.banner}>
      <AppText style={styles.icon} accessible={false}>👋</AppText>
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{t('You are learning as a guest')}</AppText>
        <AppText variant="caption" color="textSecondary">
          {t('Create a free account to keep your progress and practise with real people.')}
        </AppText>
      </View>
      <Button title={t('Sign up')} size="sm" onPress={() => router.push('/create-account')} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', alignItems: 'center', padding: screenPadding, gap: spacing.md },
  card: { alignSelf: 'stretch', gap: spacing.sm },
  perk: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { fontSize: 24, lineHeight: 30 },
  flex: { flex: 1, gap: 2 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md,
    borderRadius: radius.xl, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary,
  },
});
