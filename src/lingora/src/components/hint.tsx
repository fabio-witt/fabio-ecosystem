import { useEffect, useState, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { feedback } from '@/lib/feedback';

type Hint = { id: number; icon: string; title: string; text: string };

let current: Hint | null = null;
let counter = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/** Shows a small explanation bubble at the top that disappears by itself. */
export function showHint(icon: string, title: string, text: string) {
  current = { id: ++counter, icon, title, text };
  feedback('tap');
  emit();
}

function hide(id: number) {
  if (current?.id === id) { current = null; emit(); }
}

/** Mounted once in the root layout. */
export function HintLayer() {
  const { styles } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const hint = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    () => current,
    () => null,
  );
  // Longer texts stay a little longer.
  useEffect(() => {
    if (!hint) return;
    const timer = setTimeout(() => hide(hint.id), Math.min(5000, 2200 + hint.text.length * 20));
    return () => clearTimeout(timer);
  }, [hint]);
  if (!hint) return null;
  return (
    <View pointerEvents="box-none" style={[styles.layer, { top: insets.top + 64 }]}>
      <Animated.View key={hint.id} entering={FadeInDown.duration(180).reduceMotion(ReduceMotion.System)}
        exiting={FadeOutUp.duration(180).reduceMotion(ReduceMotion.System)} style={styles.bubble}>
        <Pressable onPress={() => hide(hint.id)} accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.row}>
          <AppText style={styles.icon} accessible={false}>{hint.icon}</AppText>
          <View style={styles.flex}>
            <AppText variant="bodyStrong" style={styles.title}>{hint.title}</AppText>
            <AppText variant="caption" style={styles.text}>{hint.text}</AppText>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

/** A stat (icon + value) that explains itself when tapped. */
export function HintStat({ icon, value, title, text, style, children }: {
  icon: string; value?: string | number; title: string; text: string;
  style?: object; children?: React.ReactNode;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable onPress={() => showHint(icon, title, text)} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}
      accessibilityRole="button" accessibilityLabel={`${value ?? ''} ${title}`.trim()} accessibilityHint={text}
      hitSlop={6} style={[style, pressed && { opacity: 0.7 }]}>
      {children}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  layer: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 1000, paddingHorizontal: spacing.md },
  bubble: { width: '100%', maxWidth: 420, borderRadius: radius.lg, backgroundColor: colors.text, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  icon: { fontSize: 26, lineHeight: 32 },
  title: { color: colors.background },
  text: { color: colors.background, opacity: 0.85 },
});
