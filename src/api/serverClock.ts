/**
 * Offset between the Server clock and the device clock, learned from the HTTP
 * `Date` header of every API response. Quest eligibility windows (`startTime`,
 * `dueAt`) are Server-owned, so countdowns and gates must read `serverNow()`
 * instead of `Date.now()`. The header has 1-second resolution and includes
 * network latency, so treat results as accurate to about a second.
 */
let offsetMs = 0;

/** Current Server time in epoch milliseconds. */
export function serverNow(): number {
  return Date.now() + offsetMs;
}

/**
 * Records the offset from a response's `Date` header. A response replayed from
 * an HTTP cache (`Age` present) carries an old `Date`, so it is ignored.
 */
export function syncServerClock(
  dateHeader: string | null,
  ageHeader: string | null
): void {
  if (ageHeader !== null || dateHeader === null) return;
  const serverMs = Date.parse(dateHeader);
  if (Number.isFinite(serverMs)) offsetMs = serverMs - Date.now();
}

/** Test seam: forget the learned offset. */
export function resetServerClock(): void {
  offsetMs = 0;
}
