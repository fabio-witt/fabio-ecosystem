import { useMemo } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const positions = new Map<string, number>();

/** Restores an in-session offset when navigation recreates a list. */
export function useScrollPosition(key: string) {
  return useMemo(() => ({
    contentOffset: { x: 0, y: positions.get(key) ?? 0 },
    onScroll: ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      positions.set(key, Math.max(0, nativeEvent.contentOffset.y));
    },
    scrollEventThrottle: 100,
  }), [key]);
}
