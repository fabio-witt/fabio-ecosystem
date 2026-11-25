import { StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';

export type Notice = {
  tone: 'error' | 'info' | 'success';
  title: string;
  message?: string;
  action?: { title: string; onPress: () => void; loading?: boolean };
};

/**
 * Message box shown inside a form. Used instead of Alert.alert for sign-in
 * and sign-up so the result is visible on every platform, including the web.
 */
export function FormNotice({ notice }: { notice: Notice | null }) {
  const { colors, styles } = useThemedStyles(createStyles);
  if (!notice) return null;
  const tint = notice.tone === 'error'
    ? { background: colors.dangerSoft, border: colors.danger, text: 'danger' as const }
    : notice.tone === 'success'
      ? { background: colors.successSoft, border: colors.success, text: 'success' as const }
      : { background: colors.primarySoft, border: colors.primary, text: 'primary' as const };

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.box, { backgroundColor: tint.background, borderColor: tint.border }]}
    >
      <AppText variant="bodyStrong" color={tint.text}>{notice.title}</AppText>
      {notice.message ? <AppText variant="callout">{notice.message}</AppText> : null}
      {notice.action ? (
        <Button
          title={notice.action.title}
          variant="secondary"
          size="sm"
          loading={notice.action.loading}
          onPress={notice.action.onPress}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const createStyles = (_colors: ThemeColors) => StyleSheet.create({
  box: {
    marginTop: spacing.xl,
    padding: spacing.md,
    gap: spacing.xs,
    borderRadius: radius.xl,
    borderWidth: 2,
  },
  action: { alignSelf: 'flex-start', marginTop: spacing.xs },
});
