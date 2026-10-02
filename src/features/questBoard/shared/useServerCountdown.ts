import { useEffect, useState } from "react";

import { serverNow } from "@/api/serverClock";

/** Formats a millisecond duration as `MM:SS`, never negative. */
export function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Milliseconds left until a Server-owned deadline (`expiresAt`), read from
 * `serverNow()` on every render and re-rendered once per second while the
 * deadline is in the future. Returns `null` when there is no valid deadline;
 * `0` once expired. The client never creates its own deadline.
 */
export function useServerCountdown(
  expiresAt: string | null | undefined
): number | null {
  const deadline = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  const [, setTick] = useState(0);
  const live = Number.isFinite(deadline) && deadline > serverNow();

  useEffect(() => {
    if (!live) return undefined;
    const interval = setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, [live, deadline]);

  return Number.isFinite(deadline) ? Math.max(0, deadline - serverNow()) : null;
}
