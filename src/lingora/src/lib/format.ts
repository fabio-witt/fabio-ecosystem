/** "Just now", "5 min ago", "3 h ago", "2 d ago", or a short date. */
export function formatRelativeTime(dateString: string | null | undefined) {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)} d ago`;

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** City and country joined, e.g. "Zurich, Switzerland". */
export function formatLocation(city?: string | null, country?: string | null) {
  return [city, country].filter(Boolean).join(', ');
}
