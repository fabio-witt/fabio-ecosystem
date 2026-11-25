import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { spacing } from '@/constants/theme';

import { exchangeFields, splitAnswers, type ExchangeDetails } from './exchange-details';
import { t } from '@/lib/i18n';

export function ExchangeDetailsCard({ details }: { details?: ExchangeDetails | null }) {
  const fields = exchangeFields.filter(({ key }) => details?.[key]?.trim());
  if (!fields.length) return null;

  return (
    <View style={styles.section}>
      <AppText variant="heading" accessibilityRole="header">{t("Language exchange")}</AppText>
      <Card style={styles.section}>
        {fields.map(({ key, label }) => (
          <View key={key} style={styles.field}>
            <AppText variant="label" color="textSecondary">{t(label)}</AppText>
            <AppText>{splitAnswers(details?.[key]).map(answer => t(answer)).join(', ')}</AppText>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  field: { gap: spacing.xxs },
});
