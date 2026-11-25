import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Medved } from '@/components/medved';
import { AppText, Button, Screen } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';
import { t } from '@/lib/i18n';

/** Shown for links that do not lead anywhere. */
export default function NotFoundScreen() {
  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.center}>
        <Medved mood="sad" size={120} />
        <AppText variant="title" align="center">{t('This page does not exist')}</AppText>
        <AppText align="center" color="textSecondary">{t('The link may be old or mistyped. Let’s get you back to learning.')}</AppText>
        <Button title={t('Back to GrammarBay')} size="lg" onPress={() => router.replace('/')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: screenPadding },
});
