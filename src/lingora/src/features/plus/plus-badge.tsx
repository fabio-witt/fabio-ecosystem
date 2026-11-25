import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { radius, spacing } from '@/constants/theme';

import type { PlusTier } from './api';
import { t } from '@/lib/i18n';

/** Small badge next to a name for Lingora Plus or VIP members. */
export function PlusBadge({ tier }: { tier?: PlusTier | null }) {
  if (!tier) return null;
  const vip = tier === 'vip';
  return (
    <View style={[styles.badge, vip ? styles.vip : styles.plus]} accessibilityLabel={vip ? t("VIP member") : t("Lingora Plus member")}>
      <AppText variant="label" style={styles.text}>{vip ? '👑 VIP' : '✦ PLUS'}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, alignSelf: 'center' },
  plus: { backgroundColor: '#6554C4' },
  vip: { backgroundColor: '#B8860B' },
  text: { color: '#FFFFFF', fontWeight: '800' },
});
