/**
 * Confetti and a short reward card for big moments: perfect lessons, streak
 * milestones, opened chests, new badges and records. Anything can call
 * celebrate(); the layer in the root layout shows it.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui';
import { radius, spacing, useThemedStyles, type ThemeColors } from '@/constants/theme';
import { t } from '@/lib/i18n';

export type Celebration = { icon: string; title: string; message?: string; gems?: number };

const listeners = new Set<(celebration: Celebration) => void>();
let queue: Celebration[] = [];

export function celebrate(celebration: Celebration) {
  if (listeners.size === 0) {
    queue = [...queue, celebration].slice(-3);
    return;
  }
  listeners.forEach((listener) => listener(celebration));
}

const COLORS = ['#F2B705', '#E76F51', '#2A9D8F', '#6554C4', '#D1495B', '#3C6FD1', '#3E9B6B'];

function Piece({ index, width, height }: { index: number; width: number; height: number }) {
  const y = useSharedValue(-40);
  const spin = useSharedValue(0);
  const start = useMemo(() => ({
    x: (index * 37) % Math.max(width, 1),
    drift: ((index * 53) % 120) - 60,
    delay: (index * 23) % 400,
    size: 6 + (index % 5) * 2,
    color: COLORS[index % COLORS.length],
  }), [index, width]);

  useEffect(() => {
    y.value = withDelay(start.delay, withTiming(height + 40, { duration: 1800 + (index % 7) * 120, easing: Easing.in(Easing.quad) }));
    spin.value = withDelay(start.delay, withTiming(540, { duration: 2000 }));
  }, [height, index, spin, start.delay, y]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: y.value },
      { translateX: (start.drift * y.value) / Math.max(height, 1) },
      { rotate: `${spin.value}deg` },
    ],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: start.x, top: 0, width: start.size, height: start.size * 1.6, borderRadius: 2, backgroundColor: start.color }, style]} />
  );
}

export function CelebrationLayer() {
  const { styles } = useThemedStyles(createStyles);
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const [current, setCurrent] = useState<(Celebration & { id: number }) | null>(null);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    let id = 0;
    const show = (celebration: Celebration) => {
      id += 1;
      setCurrent({ ...celebration, id });
    };
    listeners.add(show);
    queue.forEach(show);
    queue = [];
    return () => { listeners.delete(show); };
  }, []);

  useEffect(() => {
    if (!current) return;
    scale.value = 0.8;
    opacity.value = 0;
    scale.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.back(2)) });
    opacity.value = withTiming(1, { duration: 200 });
    const timer = setTimeout(() => setCurrent(null), 2600);
    return () => clearTimeout(timer);
  }, [current, opacity, scale]);

  const card = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  if (!current) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {!reduced ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: 42 }, (_, index) => (
            <Piece key={`${current.id}-${index}`} index={index} width={width} height={height} />
          ))}
        </View>
      ) : null}
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View style={card}>
          <Pressable onPress={() => setCurrent(null)} style={styles.card} accessibilityRole="alert"
            accessibilityLabel={`${t(current.title)} ${current.message ? t(current.message) : ''}`}>
            <AppText style={styles.icon}>{current.icon}</AppText>
            <AppText variant="heading" align="center">{t(current.title)}</AppText>
            {current.message ? <AppText align="center" color="textSecondary">{t(current.message)}</AppText> : null}
            {current.gems ? <AppText variant="bodyStrong" style={styles.gems}>+{current.gems} 💎</AppText> : null}
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: {
    minWidth: 220,
    maxWidth: 320,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xl,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: '#F2B705',
    boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
  },
  icon: { fontSize: 52, lineHeight: 62 },
  gems: { color: '#3C6FD1', marginTop: spacing.xs },
});
