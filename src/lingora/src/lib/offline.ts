/**
 * Offline mode for the web build: registers the service worker that the
 * GrammarFirst build script writes next to the app (sw.js). Lessons are part
 * of the app bundle, so once loaded they keep working without internet;
 * results are queued and sent later (see game store "pending").
 */
export function registerOfflineMode() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const base = '/grammarfirst/lingora/';
  if (!window.location.pathname.startsWith(base)) return;
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      // Without a service worker the app still works online.
    });
  });
}
