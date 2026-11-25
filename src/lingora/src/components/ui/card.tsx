import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';

type CardProps = ViewProps & {
  padded?: boolean;
};

/** White rounded surface for grouped content. */
export function Card({ padded = true, style, ...props }: CardProps) {
  const { styles } = useThemedStyles(createStyles);
  return <View {...props} style={[styles.card, padded && styles.padded, style]} />;
}

type PressableCardProps = Omit<PressableProps, 'style'> & {
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Card that reacts to taps, e.g. list rows that open a detail screen. */
export function PressableCard({ padded = true, style, ...props }: PressableCardProps) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      {...props}
      style={({ pressed }) => [
        styles.card,
        padded && styles.padded,
        pressed && styles.pressed,
        style,
      ]}
    />
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  padded: {
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.85,
  },
});
