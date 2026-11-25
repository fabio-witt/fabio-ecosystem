/**
 * Small looping and one-shot animations shared by the mascot, the lesson
 * path and exercise feedback. All of them stay still when the device asks
 * for reduced motion.
 */

import { useEffect } from 'react';
import {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const ease = Easing.inOut(Easing.quad);

/** Gentle up-and-down float, used for the next lesson on the path. */
export function useBob(active: boolean, distance = 4, duration = 1200) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (!active || reduced) {
      cancelAnimation(y);
      y.value = 0;
      return;
    }
    y.value = withRepeat(withTiming(-distance, { duration, easing: ease }), -1, true);
    return () => cancelAnimation(y);
  }, [active, reduced, distance, duration, y]);
  return useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
}

/** Slow squash-and-stretch so the mascot looks alive. */
export function useBreathe(active: boolean) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!active || reduced) {
      cancelAnimation(t);
      t.value = 0;
      return;
    }
    t.value = withRepeat(withTiming(1, { duration: 1600, easing: ease }), -1, true);
    return () => cancelAnimation(t);
  }, [active, reduced, t]);
  return useAnimatedStyle(() => ({
    transformOrigin: 'bottom',
    transform: [{ scaleX: 1 + t.value * 0.025 }, { scaleY: 1 - t.value * 0.025 }],
  }));
}

/** Rotating wiggle every couple of seconds, like a wave hello. */
export function useWiggle(active: boolean) {
  const reduced = useReducedMotion();
  const r = useSharedValue(0);
  useEffect(() => {
    if (!active || reduced) {
      cancelAnimation(r);
      r.value = 0;
      return;
    }
    r.value = withRepeat(withSequence(
      withTiming(0, { duration: 1800 }),
      withTiming(-7, { duration: 120 }),
      withTiming(7, { duration: 160 }),
      withTiming(-4, { duration: 140 }),
      withTiming(0, { duration: 120 }),
    ), -1);
    return () => cancelAnimation(r);
  }, [active, reduced, r]);
  return useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
}

/** Scale-and-fade in whenever `trigger` changes. */
export function usePop(trigger: unknown) {
  const reduced = useReducedMotion();
  const s = useSharedValue(reduced ? 1 : 0.85);
  const o = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) {
      s.value = 1;
      o.value = 1;
      return;
    }
    s.value = 0.85;
    o.value = 0;
    s.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.back(2)) });
    o.value = withTiming(1, { duration: 200 });
  }, [trigger, reduced, s, o]);
  return useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: s.value }] }));
}

export type Trick = 'wave' | 'spin' | 'hop';

/**
 * A playful one-off move on demand: a wave, a full spin or a double hop.
 * Returns the animated style and `play(trick?)`, which picks a random trick
 * when none is given. With reduced motion it only does a tiny nod.
 */
export function useTrick() {
  const reduced = useReducedMotion();
  const rotate = useSharedValue(0);
  const lift = useSharedValue(0);
  const scale = useSharedValue(1);

  function play(trick?: Trick) {
    const tricks: Trick[] = ['wave', 'spin', 'hop'];
    const next = trick ?? tricks[Math.floor(Math.random() * tricks.length)];
    cancelAnimation(rotate);
    cancelAnimation(lift);
    cancelAnimation(scale);
    rotate.value = 0;
    lift.value = 0;
    scale.value = 1;
    if (reduced) {
      scale.value = withSequence(withTiming(1.06, { duration: 120 }), withTiming(1, { duration: 120 }));
      return;
    }
    if (next === 'wave') {
      rotate.value = withSequence(
        withTiming(-14, { duration: 120 }), withTiming(14, { duration: 180 }),
        withTiming(-12, { duration: 170 }), withTiming(12, { duration: 170 }),
        withTiming(0, { duration: 140 }),
      );
    } else if (next === 'spin') {
      scale.value = withSequence(withTiming(0.9, { duration: 120 }), withTiming(1, { duration: 500 }));
      rotate.value = withTiming(360, { duration: 650, easing: Easing.inOut(Easing.cubic) }, (finished) => {
        if (finished) rotate.value = 0;
      });
    } else {
      lift.value = withSequence(
        withTiming(-28, { duration: 200, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) }),
        withTiming(-16, { duration: 160, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) }),
      );
      scale.value = withSequence(
        withTiming(1, { duration: 400 }), withTiming(1.08, { duration: 80 }), withTiming(1, { duration: 160 }),
      );
    }
  }

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { rotate: `${rotate.value}deg` }, { scale: scale.value }],
  }));
  return { style, play };
}

/** Short horizontal shake, played each time `count` goes up. */
export function useShake(count: number) {
  const reduced = useReducedMotion();
  const x = useSharedValue(0);
  useEffect(() => {
    if (!count || reduced) return;
    x.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 80 }),
      withTiming(-6, { duration: 70 }),
      withTiming(4, { duration: 60 }),
      withTiming(0, { duration: 50 }),
    );
  }, [count, reduced, x]);
  return useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
}
