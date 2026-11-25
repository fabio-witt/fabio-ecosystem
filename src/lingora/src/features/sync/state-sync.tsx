import { useEffect } from 'react';
import { AppState } from 'react-native';

import { deviceStateKey, onDeviceStateWrite, readDeviceState, replaceDeviceState } from '@/lib/device-state';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

/** Device state that also lives on the server, so it survives a new phone or browser. */
export const SYNCED_FEATURES = ['game', 'practice-review', 'active-course'] as const;
type Feature = typeof SYNCED_FEATURES[number];

const PUSH_DELAY = 2500;

/**
 * Keeps the synced features in step with public.synced_state:
 * on start the newer copy wins; afterwards every change is sent a moment later.
 */
export function StateSync() {
  const { user } = useSession();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let ready = false;
    const timers = new Map<Feature, ReturnType<typeof setTimeout>>();

    async function push(feature: Feature) {
      const { raw, at } = readDeviceState(userId!, feature);
      if (!raw) return;
      let data: unknown;
      try { data = JSON.parse(raw); } catch { return; }
      await supabase.from('synced_state').upsert({
        user_id: userId!, feature, data: data as never, updated_at: new Date(at || Date.now()).toISOString(),
      });
    }

    async function pull() {
      const { data, error } = await supabase.from('synced_state').select('feature, data, updated_at').eq('user_id', userId!);
      if (cancelled || error) return;
      const remote = new Map((data ?? []).map((row) => [row.feature as Feature, row]));
      for (const feature of SYNCED_FEATURES) {
        const local = readDeviceState(userId!, feature);
        const row = remote.get(feature);
        const remoteAt = row ? Date.parse(row.updated_at) : 0;
        if (row && remoteAt > local.at) {
          replaceDeviceState(userId!, feature, JSON.stringify(row.data), remoteAt);
        } else if (local.raw && local.at >= remoteAt) {
          // First sync of this device, or the device is newer.
          void push(feature);
        }
      }
      ready = true;
    }

    const keys = new Map(SYNCED_FEATURES.map((feature) => [deviceStateKey(userId, feature), feature]));
    const stop = onDeviceStateWrite((key) => {
      const feature = keys.get(key);
      if (!feature || !ready) return;
      clearTimeout(timers.get(feature));
      timers.set(feature, setTimeout(() => void push(feature), PUSH_DELAY));
    });

    void pull();
    // Coming back to the app: another device may have learned in the meantime.
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void pull(); });

    return () => {
      cancelled = true;
      stop();
      subscription.remove();
      // Send pending changes right away instead of dropping them.
      for (const [feature, timer] of timers) { clearTimeout(timer); void push(feature); }
    };
  }, [userId]);

  return null;
}
