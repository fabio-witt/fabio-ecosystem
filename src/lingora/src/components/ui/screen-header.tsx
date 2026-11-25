import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, screenPadding, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';

import { BrandIcon } from '../brand-icon';
import { AppText } from './app-text';
import { t } from '@/lib/i18n';

type ScreenHeaderProps = {
  title?: string;
  right?: ReactNode;
};

/** Top bar for stacked (non-tab) screens with a back button. */
export function ScreenHeader({ title, right }: ScreenHeaderProps) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.header}>
      {/* The GrammarBay logo is always top left; it leads home from anywhere, also from a lesson. */}
      <Pressable onPress={() => router.replace('/')} accessibilityRole="button"
        accessibilityLabel={t('GrammarBay home')} hitSlop={6} style={({ pressed }) => pressed && styles.pressed}>
        <BrandIcon size={34} />
      </Pressable>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={t("Go back")}
        hitSlop={8}
      >
        <AppText variant="title" color="text">
          ‹
        </AppText>
      </Pressable>

      <AppText variant="subheading" numberOfLines={2} accessibilityRole="header" style={styles.title}>
        {title ?? ''}
      </AppText>

      <View style={styles.right}>{right}</View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: screenPadding,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 44,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    marginRight: 42,
  },
  right: {
    minWidth: 44,
    maxWidth: '34%',
    alignItems: 'flex-end',
  },
});
