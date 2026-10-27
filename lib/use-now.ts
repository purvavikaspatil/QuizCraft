"use client";

import { useEffect, useState } from "react";

/**
 * Current time, refreshed on an interval and whenever the tab becomes visible
 * again. Callers derive durations from timestamps, so a throttled background
 * tab never drifts.
 */
export function useNow(intervalMs: number, enabled = true): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [intervalMs, enabled]);

  return now;
}
