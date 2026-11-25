import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { spacing, useColors } from '@/constants/theme';

import { AppText } from './app-text';
import { Button } from './button';
import { t } from '@/lib/i18n';

type LoadingStateProps = {
  message?: string;
};

/** Centered spinner while a screen loads its data. */
export function LoadingState({ message }: LoadingStateProps) {
  const colors = useColors();
  return (
    <View style={styles.container} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <AppText variant="caption" color="textSecondary" align="center" style={styles.spaced}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

type EmptyStateProps = {
  emoji?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Friendly placeholder when a list has nothing to show yet. */
export function EmptyState({ emoji, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {emoji ? <AppText style={styles.emoji}>{emoji}</AppText> : null}
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="caption" color="textSecondary" align="center" style={styles.spaced}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

/** Shown when loading failed, with an optional retry button. */
export function ErrorState({
  title = 'Something went wrong',
  message = 'Please check your connection and try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      <AppText variant="caption" color="textSecondary" align="center" style={styles.spaced}>
        {message}
      </AppText>
      {onRetry ? (
        <Button title={t("Try again")} variant="secondary" onPress={onRetry} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emoji: {
    fontSize: 36,
    lineHeight: 44,
    marginBottom: spacing.md,
  },
  spaced: {
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  action: {
    marginTop: spacing.xl,
  },
});
