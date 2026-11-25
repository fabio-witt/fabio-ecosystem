import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Refetches stale queries under `queryKey` whenever the screen comes back
 * into focus (e.g. switching tabs). Skips the first focus, because the
 * query already loads on mount.
 */
export function useRefreshOnFocus(queryKey: QueryKey) {
  const queryClient = useQueryClient();
  const isFirstFocus = useRef(true);

  // Compare keys by value, so a new array with the same content
  // does not re-trigger the effect on every render.
  const keyString = JSON.stringify(queryKey);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }

      queryClient.refetchQueries({
        queryKey: JSON.parse(keyString) as QueryKey,
        stale: true,
        type: 'active',
      });
    }, [queryClient, keyString])
  );
}
