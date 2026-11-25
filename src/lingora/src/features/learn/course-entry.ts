const key = 'lingora.pending-course';
type CourseEntry = { id: string; lesson?: string };
let pending: CourseEntry | null = null;

export function rememberCourse(id: string, lesson?: string) {
  pending = { id, lesson };
  try { globalThis.sessionStorage?.setItem(key, JSON.stringify(pending)); } catch { /* In-memory fallback. */ }
}

export function takeCourse() {
  let entry = pending;
  pending = null;
  try {
    const stored = globalThis.sessionStorage?.getItem(key);
    globalThis.sessionStorage?.removeItem(key);
    if (!entry && stored) entry = JSON.parse(stored);
  } catch { /* In-memory fallback. */ }
  return entry;
}

const exchangeKey = 'lingora.pending-exchange';
let exchange: string | null = null;

export function rememberExchange(task: string) {
  exchange = task;
  try { globalThis.sessionStorage?.setItem(exchangeKey, task); } catch { /* In-memory fallback. */ }
}

export function takeExchange() {
  let task = exchange;
  exchange = null;
  try {
    task ??= globalThis.sessionStorage?.getItem(exchangeKey) ?? null;
    globalThis.sessionStorage?.removeItem(exchangeKey);
  } catch { /* In-memory fallback. */ }
  return task;
}
