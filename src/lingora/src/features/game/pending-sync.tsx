import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { findLesson } from '@/features/learn/catalog';
import { learnKeys, type LessonResult } from '@/features/learn/progress';
import { profileKeys } from '@/features/profile/api';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/session-provider';

import { useGame } from './store';

function timeZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return undefined; }
}

/**
 * Lessons finished without a connection are kept on the device and sent to
 * the server as soon as the app is online again.
 */
export function PendingResultsSync() {
  const { user } = useSession();
  const game = useGame();
  const client = useQueryClient();
  const busy = useRef(false);
  const pending = game.state.pending;
  const { clearPending, recordLesson } = game;

  useEffect(() => {
    if (!user || pending.length === 0) return;
    const send = async () => {
      if (busy.current) return;
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.onLine === false) return;
      busy.current = true;
      try {
        for (const item of pending) {
          const { data, error } = await supabase.rpc('complete_lesson', {
            p_entry_id: item.entryId, p_score: item.score, p_time_zone: timeZone(),
          });
          if (error) {
            // Unknown or rejected results are dropped; connection problems retry later.
            if (!/fetch|network|connection/i.test(error.message)) clearPending(item.entryId);
            continue;
          }
          const result = data as unknown as LessonResult;
          clearPending(item.entryId);
          const course = findLesson(item.entryId)?.course;
          if (course) recordLesson({ courseId: course.id, score: item.score, xp: result.earned_xp, streak: result.streak });
        }
        void client.invalidateQueries({ queryKey: learnKeys.all });
        void client.invalidateQueries({ queryKey: profileKeys.all });
      } finally {
        busy.current = false;
      }
    };
    void send();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void send(); });
    const online = () => void send();
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.addEventListener('online', online);
    return () => {
      subscription.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.removeEventListener('online', online);
    };
  }, [user, pending, clearPending, recordLesson, client]);

  return null;
}
