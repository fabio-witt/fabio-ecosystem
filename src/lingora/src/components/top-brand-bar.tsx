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

/** Thin bar above every main tab: GrammarBay logo top left, inbox top right. */
export function TopBrandBar() {
  const { styles } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { course } = useActiveCourse();
  const [picking, setPicking] = useState(false);
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 6 }]}>
      <Pressable onPress={() => setPicking(true)} accessibilityRole="button" hitSlop={6} style={styles.languageButton}
        accessibilityLabel={course ? t('Learning {language}. Change language', { language: t(course.name) }) : t('Choose a language')}>
        <BrandLogo size={32} />
        <View style={styles.language} aria-hidden>
          {course && <Flag emoji={course.flag} size={22} />}
          <AppText variant="caption" color="textSecondary" accessible={false}>▾</AppText>
        </View>
      </Pressable>
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
  languageButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  language: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bell: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  bellIcon: { fontSize: 17, lineHeight: 21 },
});
