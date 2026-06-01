// Pure de-duplication logic for idempotent lead capture.
//
// The Bewl Water "Ranger" chatbot can fire its capture_lead tool more than
// once in a single conversation (the tool-call history is not persisted
// between chat requests, so the model cannot see that it already captured).
// Each call previously inserted a fresh enquiry, producing duplicate leads.
//
// This module decides whether an incoming capture matches an enquiry that
// already exists, so the mutation can update that one instead of inserting a
// duplicate. No Convex imports — kept pure so it unit-tests cleanly under
// vitest (node env), mirroring convex/dashboardCalc.ts.

/** How long after the first capture a repeat counts as the same enquiry. */
export const DEFAULT_DEDUPE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

export interface DedupeCandidate {
  email: string;
  source?: string;
  createdAt: number;
}

export interface DedupeQuery {
  email: string;
  source?: string;
  /** "now" in epoch ms — passed in so the function stays pure/testable. */
  now: number;
  windowMs: number;
}

/**
 * Returns the most recent candidate that is the same lead as `query`:
 * same email (case-insensitive) AND same source, created within the window
 * ending at `now`. Returns null when nothing matches.
 *
 * Candidates are expected to already be scoped to one property by the caller
 * (via the by_property index), so property is not re-checked here.
 */
export function findRecentDuplicate<T extends DedupeCandidate>(
  candidates: T[],
  query: DedupeQuery
): T | null {
  const email = query.email.trim().toLowerCase();
  const source = query.source ?? undefined;
  const cutoff = query.now - query.windowMs;

  let best: T | null = null;
  for (const c of candidates) {
    if (c.createdAt < cutoff) continue;
    if (c.createdAt > query.now) continue; // ignore clock-skew future rows
    if (c.email.trim().toLowerCase() !== email) continue;
    if ((c.source ?? undefined) !== source) continue;
    if (best === null || c.createdAt > best.createdAt) best = c;
  }
  return best;
}
