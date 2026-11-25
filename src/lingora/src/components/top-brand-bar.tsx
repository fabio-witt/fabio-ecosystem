import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { t } from '@/lib/i18n';

import { BrandLogo } from './brand-logo';
import { Flag } from './flag';
import { useActiveCourse } from '@/features/learn/active-course';
import { LanguagePickerModal } from '@/features/learn/language-picker';

export { TopInsetProvider } from './top-inset';

/** Thin bar above every main tab: Lingora logo top left, inbox top right. */
export function TopBrandBar() {
  const { styles } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { course } = useActiveCourse();
  const [picking, setPicking] = useState(false);
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 6 }]}>
      {course ? (
        // While learning a language its flag replaces the L; tapping it switches the language.
        <Pressable onPress={() => setPicking(true)} accessibilityRole="button" hitSlop={6} style={styles.flagButton}
          accessibilityLabel={t('Learning {language}. Change language', { language: t(course.name) })}>
          <Flag emoji={course.flag} size={32} />
          <AppText style={styles.name}>Lingora</AppText>
          <AppText variant="caption" color="textSecondary" accessible={false}>▾</AppText>
        </Pressable>
      ) : (
        <Pressable onPress={() => setPicking(true)} accessibilityRole="button" accessibilityLabel={t('Choose a language')} hitSlop={6}>
          <BrandLogo size={32} />
        </Pressable>
      )}
      <LanguagePickerModal visible={picking} onClose={() => setPicking(false)} />
      <Pressable onPress={() => router.push('/notifications')} accessibilityRole="button"
        accessibilityLabel={t('Activity inbox')} hitSlop={8} style={styles.bell}>
        <AppText style={styles.bellIcon} accessible={false}>🔔</AppText>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: 6,
    backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
  },
  flagButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 20, lineHeight: 26, fontWeight: '900', letterSpacing: -0.5 },
  bell: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  bellIcon: { fontSize: 17, lineHeight: 21 },
});
