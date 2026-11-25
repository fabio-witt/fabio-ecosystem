import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, PressableCard } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { t } from '@/lib/i18n';

export function SocialShortcuts({ course }: { course?: string }) {
  const params = course ? { course } : {};
  return (
    <View style={styles.section}>
      <AppText variant="heading">{t('Learn with others')}</AppText>
      <View style={styles.row}>
        <PressableCard style={styles.tile} onPress={() => router.push({ pathname: '/exchange-table', params })}>
          <AppText variant="bodyStrong">{t('Exchange table')}</AppText>
          <AppText variant="caption" color="textSecondary">{t('Swap roles and languages with a partner')}</AppText>
        </PressableCard>
        <PressableCard style={styles.tile} onPress={() => router.push({ pathname: '/explore', params })}>
          <AppText variant="bodyStrong">{t('Find Partner')}</AppText>
          <AppText variant="caption" color="textSecondary">{t('Find a reciprocal language match')}</AppText>
        </PressableCard>
        <PressableCard style={styles.tile} onPress={() => router.push({ pathname: '/meetups', params })}>
          <AppText variant="bodyStrong">{t('Live rooms')}</AppText>
          <AppText variant="caption" color="textSecondary">{t('Talk in a small group')}</AppText>
        </PressableCard>
        <PressableCard style={styles.tile} onPress={() => router.push({ pathname: '/forum', params })}>
          <AppText variant="bodyStrong">{t('Forum')}</AppText>
          <AppText variant="caption" color="textSecondary">{t('Ask about words and grammar')}</AppText>
        </PressableCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { flexGrow: 1, flexBasis: 100, gap: spacing.xs },
});
