import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { AppText, Screen, ScreenHeader } from '@/components/ui';
import { screenPadding, spacing } from '@/constants/theme';

export const supportEmail = 'fabiowitt@gmx.de';

export function PolicyPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScreenHeader title={title} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title" accessibilityRole="header">{title}</AppText>
        {children}
      </ScrollView>
    </Screen>
  );
}

export function SupportEmail() {
  return (
    <Link href={`mailto:${supportEmail}`}>
      <AppText color="primary">{supportEmail}</AppText>
    </Link>
  );
}

const styles = StyleSheet.create({
  content: { padding: screenPadding, paddingBottom: spacing.xxxl, gap: spacing.md },
});
