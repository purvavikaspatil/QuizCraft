"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Remaining time until `deadline` (epoch ms), or null for untimed quizzes.
 *
 * The value is always recomputed from the deadline timestamp, never by
 * counting ticks, so throttled tabs, sleep and refreshes can't skew it.
 * `onExpire` is called from the timer callback once the deadline has passed;
 * callers must make it idempotent (finalization already is).
 */
export function useCountdown(deadline: number | null, onExpire: () => void): number | null {
  const [now, setNow] = useState(() => Date.now());
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    if (deadline === null) return;

    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (current >= deadline) onExpireRef.current();
    };

    const interval = window.setInterval(tick, 250);
    // Fire precisely at the deadline too, in case intervals are throttled.
    const timeout = window.setTimeout(tick, Math.max(0, deadline - Date.now()) + 20);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [deadline]);

  return deadline === null ? null : Math.max(0, deadline - now);
}
