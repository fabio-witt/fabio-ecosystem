import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';

import { BrandIcon } from './brand-icon';

export { BrandIcon };


/** Icon plus the "Lingora" wordmark, used in the top left corner. */
export function BrandLogo({ size = 34, showName = true }: { size?: number; showName?: boolean }) {
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="Lingora">
      <BrandIcon size={size} />
      {showName ? (
        <AppText style={[styles.name, { fontSize: size * 0.62, lineHeight: size * 0.8 }]}>Lingora</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontWeight: '900', letterSpacing: -0.5 },
});
