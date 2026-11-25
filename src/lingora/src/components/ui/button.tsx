import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Platform,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { radius, spacing, useColors, type ColorName, type ThemeColors } from '@/constants/theme';

import { AppText } from './app-text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// Chunky "pressable key" look from GrammarFirst: a darker bottom edge that the
// button sinks into when pressed.
const EDGE = 4;

const variantStyles = (colors: ThemeColors): Record<
  Variant,
  { background: string; pressed: string; text: ColorName; edge?: string; border?: string }
> => ({
  primary: { background: colors.action, pressed: colors.action, text: 'onPrimary', edge: colors.actionPressed },
  secondary: {
    background: colors.surface, pressed: colors.surfaceMuted, text: 'primary', edge: colors.border, border: colors.border,
  },
  ghost: { background: 'transparent', pressed: colors.surfaceMuted, text: 'primary' },
  danger: { background: colors.dangerSoft, pressed: colors.dangerSoft, text: 'danger', edge: `${colors.danger}55` },
});

const sizeStyles: Record<Size, { minHeight: number; paddingHorizontal: number }> = {
  sm: { minHeight: 44, paddingHorizontal: spacing.md },
  md: { minHeight: 46, paddingHorizontal: spacing.lg },
  lg: { minHeight: 54, paddingHorizontal: spacing.xl },
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  fullWidth = false,
  icon,
  style,
  onFocus,
  onBlur,
  accessibilityState,
  ...props
}: ButtonProps) {
  const colors = useColors();
  const v = variantStyles(colors)[variant];
  const isDisabled = disabled || loading;
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      {...props}
      onFocus={(event) => { setFocused(true); onFocus?.(event); }}
      onBlur={(event) => { setFocused(false); onBlur?.(event); }}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        { backgroundColor: pressed ? v.pressed : v.background },
        v.border && { borderWidth: 2, borderColor: v.border },
        v.edge && { borderBottomWidth: EDGE, borderBottomColor: v.edge },
        v.edge && pressed && !isDisabled && styles.sunk,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
        Platform.OS === 'web' && focused && { outlineColor: colors.primary, outlineStyle: 'solid', outlineWidth: 2, outlineOffset: 2 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors[v.text]} />
      ) : (
        <View style={styles.content}>
          {icon}
          <AppText variant={size === 'sm' ? 'caption' : 'bodyStrong'} color={v.text} style={styles.label} align="center">
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flexShrink: 1 },
  content: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  sunk: {
    transform: [{ translateY: 2 }],
    borderBottomWidth: 2,
    marginBottom: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
