/**
 * Pure aggregation helpers for the dashboard overview query.
 * No Convex imports — kept side-effect-free so they unit-test cleanly
 * under vitest (node env). The query handler in dashboard.ts does the I/O
 * and delegates all arithmetic here.
 */

/** Timestamp → "YYYY-MM" in UTC. */
export function monthKeyFromTimestamp(ts: number): string {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Shift a "YYYY-MM" key by `delta` months (negative = earlier). */
export function addMonths(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1 + delta, 1));
  const yy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

/** UTC day-of-month (1–31) for a timestamp. */
export function dayOfMonth(ts: number): number {
  return new Date(ts).getUTCDate();
}

/**
 * True if an ISO date string (YYYY-MM-DD or longer) falls in `monthKey`
 * on or before `day`. Powers like-for-like MTD comparisons.
 */
export function isoInMonthUpToDay(
  iso: string,
  monthKey: string,
  day: number
): boolean {
  if (iso.slice(0, 7) !== monthKey) return false;
  return Number(iso.slice(8, 10)) <= day;
}

/** booked / total, guarding against divide-by-zero. */
export function conversionRate(booked: number, total: number): number {
  return total > 0 ? booked / total : 0;
}

/** Fractional change current vs previous; null when previous is 0. */
export function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}

/**
 * Most frequent key across rows. Undefined keys are skipped. Ties resolve
 * to the first key seen (insertion order, strict > comparison). Null when
 * nothing counted.
 */
export function topByCount<T>(
  rows: T[],
  keyFn: (r: T) => string | undefined
): { key: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const k = keyFn(r);
    if (!k) continue;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let best: { key: string; count: number } | null = null;
  for (const [key, count] of counts) {
    if (!best || count > best.count) best = { key, count };
  }
  return best;
}

/**
 * Key with the highest summed value across rows. Same tie/skip/empty
 * semantics as topByCount.
 */
export function topByValue<T>(
  rows: T[],
  keyFn: (r: T) => string | undefined,
  valueFn: (r: T) => number
): { key: string; value: number } | null {
  const sums = new Map<string, number>();
  for (const r of rows) {
    const k = keyFn(r);
    if (!k) continue;
    sums.set(k, (sums.get(k) ?? 0) + valueFn(r));
  }
  let best: { key: string; value: number } | null = null;
  for (const [key, value] of sums) {
    if (!best || value > best.value) best = { key, value };
  }
  return best;
}
