import { useEffect, useState } from 'react';

/** Current time that refreshes every `ms` (default 30 s), so "opens in 15 min" states update. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
