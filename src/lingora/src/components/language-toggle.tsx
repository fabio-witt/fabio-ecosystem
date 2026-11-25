import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { setUiLanguage, t, uiLanguages, useT } from '@/lib/i18n';

/** Small "EN | DE" switch for the app language, like in GrammarFirst. */
export function LanguageToggle({ wide = false }: { wide?: boolean }) {
  const { styles } = useThemedStyles(createStyles);
  const { language } = useT();
  return (
    <View style={[styles.toggle, wide && styles.wide]} accessibilityRole="radiogroup" accessibilityLabel={t('App language')}>
      {uiLanguages.map((item) => {
        const selected = item.id === language;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={item.label}
            onPress={() => setUiLanguage(item.id)}
            style={[styles.option, wide && styles.optionWide, selected && styles.selected]}
          >
            <AppText variant={wide ? 'bodyStrong' : 'caption'} color={selected ? 'onPrimary' : 'textSecondary'} style={styles.bold}>
              {wide ? item.label : item.id.toUpperCase()}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    padding: 3,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  wide: { alignSelf: 'stretch' },
  option: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  optionWide: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  selected: { backgroundColor: colors.action },
  bold: { fontWeight: '700' },
});
