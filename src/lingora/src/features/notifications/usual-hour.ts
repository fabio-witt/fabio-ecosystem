/** "Auto" reminder: -1 means "when I usually learn". */
export const AUTO_REMINDER = -1;

/** The hour you most often finish lessons; 19:00 until there is enough history. */
export function usualLearningHour(hours: number[] | undefined, fallback = 19) {
  const recent = (hours ?? []).slice(-20);
  if (recent.length < 3) return fallback;
  const counts = new Map<number, number>();
  for (const hour of recent) counts.set(hour, (counts.get(hour) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}

export function resolveReminderHour(hour: number | null, lessonHours: number[] | undefined) {
  return hour === AUTO_REMINDER ? usualLearningHour(lessonHours) : hour;
}
