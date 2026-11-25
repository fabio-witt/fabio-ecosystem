import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useThemedStyles, type ThemeColors } from '@/constants/theme';
import { useTopInsetHandled } from '@/components/top-inset';

type ScreenProps = {
  children: ReactNode;
  /** Safe-area edges to pad. Tab screens skip the bottom (the tab bar handles it). */
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
};

/** Root wrapper for every screen: background color, safe area, status bar. */
export function Screen({ children, edges = ['top', 'left', 'right'], style }: ScreenProps) {
  const { styles } = useThemedStyles(createStyles);
  // Under the brand bar the top inset is already applied.
  const topHandled = useTopInsetHandled();
  return (
    <SafeAreaView style={styles.safeArea} edges={topHandled ? edges.filter((edge) => edge !== 'top') : edges}>
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
});
