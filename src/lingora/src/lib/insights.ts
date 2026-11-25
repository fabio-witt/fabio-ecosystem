import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * Privacy-friendly product insights: a handful of funnel events stored in our
 * own database (no third-party tracker, no cookies, no content). Only admins
 * can read them, through admin_insights().
 */
export type InsightEvent =
  | 'onboarding_started' | 'onboarding_completed' | 'guest_started' | 'account_created'
  | 'lesson_completed' | 'exam_started' | 'exam_passed' | 'daily_review_completed'
  | 'word_station_passed' | 'plus_viewed' | 'checkout_started' | 'donation_viewed'
  | 'partner_message_started' | 'feedback_sent';

// Some events only count once per app session (e.g. opening the Plus page).
const oncePerSession = new Set<InsightEvent>(['plus_viewed', 'donation_viewed', 'onboarding_started']);
const sent = new Set<string>();

export function track(event: InsightEvent, props: Record<string, string | number | boolean> = {}) {
  if (oncePerSession.has(event)) {
    if (sent.has(event)) return;
    sent.add(event);
  }
  void (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      await supabase.from('app_events').insert({ event, props });
    } catch {
      // Insights must never disturb learning.
    }
  })();
}

// ---- Error reports ------------------------------------------------------

let reported = 0;
const MAX_REPORTS_PER_SESSION = 5;

/** Sends a crash or unhandled error to the admin overview (at most 5 per session). */
export function reportError(error: unknown, path?: string) {
  if (reported >= MAX_REPORTS_PER_SESSION) return;
  const e = error instanceof Error ? error : new Error(String(error));
  const message = (e.message || 'Unknown error').slice(0, 500);
  // Network hiccups are not bugs.
  if (/network|fetch|load failed|aborted/i.test(message)) return;
  reported++;
  const currentPath = path ?? (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.pathname : undefined);
  void (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      await supabase.from('client_errors').insert({
        message,
        stack: e.stack?.slice(0, 4000) ?? null,
        path: currentPath?.slice(0, 200) ?? null,
        platform: `${Platform.OS}`.slice(0, 40),
      });
    } catch {
      // Never let error reporting cause another error.
    }
  })();
}

/** Catches errors that no screen handled (web). */
export function installGlobalErrorReporting() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  window.addEventListener('error', (event) => reportError(event.error ?? event.message));
  window.addEventListener('unhandledrejection', (event) => reportError(event.reason));
}
