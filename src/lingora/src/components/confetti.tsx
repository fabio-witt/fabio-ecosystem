import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const COLORS = ['#F2B705', '#2E9D5B', '#E3342F', '#3A86FF', '#8338EC', '#FF8FAB'];
const PIECES = 48;

/** A short burst of falling confetti over the whole screen. Never blocks taps. */
export function Confetti() {
  const reduced = useReducedMotion();
  const { height } = useWindowDimensions();
  if (reduced) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: PIECES }, (_, index) => <Piece key={index} index={index} height={height} />)}
    </View>
  );
}

function Piece({ index, height }: { index: number; height: number }) {
  const progress = useSharedValue(0);
  const left = (index * 37) % 100;
  const drift = ((index * 53) % 60) - 30;
  const spin = 180 + ((index * 97) % 540);
  useEffect(() => {
    progress.value = withDelay((index % 12) * 50, withTiming(1, { duration: 1700 + (index % 5) * 120, easing: Easing.in(Easing.quad) }));
  }, [index, progress]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 0.85 ? 1 : (1 - progress.value) / 0.15,
    transform: [
      { translateY: -20 + progress.value * (height + 40) },
      { translateX: progress.value * drift },
      { rotate: `${progress.value * spin}deg` },
    ],
  }));
  return (
    <Animated.View style={[styles.piece, { left: `${left}%`, backgroundColor: COLORS[index % COLORS.length] }, style]} />
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0, width: 8, height: 14, borderRadius: 2 },
});
