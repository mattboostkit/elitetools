# Dashboard wiring — design

**Date:** 2026-05-28
**Status:** Approved (pending spec review)
**Scope:** Replace the hardcoded `—` KPI values on the dashboard landing page
with live Convex data, using honest empty states for KPIs whose data source
does not exist yet.

---

## Goal

The dashboard at `/dashboard` currently renders 16 KPI cards across four bands
(Sales Pipeline, Marketing & Ads, Operations, Insights), every value hardcoded
to `—`. This change wires the cards that have a real data source to live
figures, and gives the cards that do not yet have a data source a clear,
honest empty state rather than a fake number.

Three tiers of KPI exist:

- **Tier 1 — real data now:** backed by the populated `enquiries`, `deals`,
  and `quotes` tables. These show live numbers.
- **Tier 2 — table exists but empty:** `googleAdsMetrics` (no ingestion cron
  exists yet) and `commissionPayouts` (no commission-run UI exists yet).
  These probe the table and, finding nothing, show an "awaiting" empty state.
- **Tier 3 — no table at all:** the Operations band (no `activities`,
  `tasks`, or `viewings` tables in the schema). These show a "not tracked
  yet" empty state.

## Non-goals

Explicitly out of scope for this work:

- Building the missing data sources (Google Ads ingestion cron, commission
  accrual engine, Operations tables). Each is its own future design.
- Per-property dashboard filtering. The bands are global (all properties)
  for now.
- The weekly-trend chart. `kpis.overview` already returns a 12-week series;
  rendering it is a later enhancement.

---

## Architecture

### Backend — single bundled query (approach A)

A new file `convex/dashboard.ts` exports one query, `overview`, gated by
`requireAdmin` (matching every other admin query in the codebase). It scans
the three populated tables once each and probes the two empty tables for
availability, returning a single structured payload for all four bands in one
round-trip. This mirrors the established `kpis.overview` "one query → one
round-trip" pattern.

Tables read:

- `enquiries` (full collect) — conversion rate, best source, and the
  current-vs-previous-month split for the conversion delta.
- `deals` (full collect) — open opportunities, contracts signed this month,
  revenue MTD (+ previous month for the delta), top property by value.
- `quotes` (full collect) — pending (sent) count and draft count.
- `googleAdsMetrics` — a `.first()` probe (or current-month index lookup) to
  set `marketingDataAvailable`.
- `commissionPayouts` — a `.first()` probe to set `commissionDataAvailable`.

Volume is low (~700 enquiries, low hundreds of deals/quotes), so full
`collect()` scans are fine. A comment records the revisit threshold, matching
the note already in `kpis.ts`.

### Return shape

```ts
{
  generatedAt: number,            // Date.now(), for a "last updated" line
  salesPipeline: {
    openOpportunities: { count: number, value: number },
    pendingQuotes: { sent: number, draft: number },
    contractsSignedThisMonth: number,
    conversionRate: number,        // 0..1, all-time booked / total enquiries (headline)
    conversionRateLastMonth: number,   // last full month cohort, by enquiry createdAt
    conversionRatePriorMonth: number,  // month before that — baseline for the delta
  },
  insights: {
    revenueMTD: number,
    revenuePrevMonth: number,
    topProperty: { property: PropertyKey, value: number } | null,
    bestSource: { source: string, count: number } | null,
  },
  marketingDataAvailable: boolean, // false → marketing band shows empty state
  commissionDataAvailable: boolean,// false → commission card shows empty state
  // Operations has no table; the page hardcodes its cards to the empty state.
}
```

Period semantics:

- "This month" / MTD = the deal's `signedDate` (ISO `YYYY-MM-DD`) falls in the
  current calendar month (UTC). Cancelled deals are excluded from revenue and
  contracts-signed counts.
- Revenue MTD delta = current month-to-date (1st → today) versus the previous
  month's equivalent range (1st → same day-of-month), so the comparison is
  like-for-like rather than MTD-vs-full-month.
- Conversion rate headline = all-time `booked / total` enquiries (stable;
  matches the definition in `kpis.ts`). The delta chip compares the **last
  full calendar month** cohort against the **month before that**, grouping
  enquiries by `createdAt`. Both cohorts are mature, which avoids the
  this-month-hasn't-converted-yet distortion. The chip is labelled "vs prior
  month" in the hint.
- Best source groups enquiries by `source`, falling back to `utmSource` when
  `source` is absent. Ties broken by first-seen.

### Pure helpers — isolation for testability

The query handler does I/O only. All arithmetic lives in a new
`convex/dashboardCalc.ts` with zero Convex imports, exporting pure functions:

- `monthKey(isoDate: string): string` → `"YYYY-MM"` (or accepts a timestamp
  for "now").
- `currentMonthKey(now: number)` and `prevMonthKey(now: number)`.
- `conversionRate(booked: number, total: number): number` (0 when total is 0).
- `pctDelta(current: number, previous: number): number | null` (null when
  previous is 0 to avoid divide-by-zero / infinite growth).
- `topByCount<T>(rows, keyFn): { key, count } | null`.
- `topByValue<T>(rows, keyFn, valueFn): { key, value } | null`.

These are unit-tested in `convex/dashboardCalc.test.ts` (vitest, node
environment, next to source — matching `nav-config.test.ts`). Cases include:
zero enquiries, all-cancelled deals, month-boundary dates, empty/missing
source, and previous-month-zero delta.

### Frontend

- **`KpiCard`** (`src/components/dashboard/kpi-card.tsx`) extended:
  - `value: string | null`
  - `state?: "ok" | "empty"` — `empty` renders muted placeholder text (the
    `hint` carries the reason, e.g. "Awaiting Google Ads sync") and no number.
  - `delta?: { pct: number; direction: "up" | "down" } | null` — renders a
    small chip: green `↑` for up, red `↓` for down, formatted `%`.
  - `loading?: boolean` — renders a `Skeleton` (component already exists) in
    place of the value while the query is `undefined`.
  - The existing `data-stub="true"` attribute is dropped from wired cards.

- **`DashboardKpis`** — new `"use client"` component
  (`src/components/dashboard/dashboard-kpis.tsx`) that calls
  `useQuery(api.dashboard.overview)` and renders the four `KpiBand`s. While
  the result is `undefined` it passes `loading` to every card. It formats
  currency in GBP and percentages for display.

- **Dashboard page** (`src/app/(app)/dashboard/page.tsx`) becomes a thin
  shell: `<WelcomeBanner/> <QuickActions/> <DashboardKpis/>`. The page is
  already inside `<AuthGate>` (via `(app)/layout.tsx`), so the query does not
  fire until Convex has authenticated at least once — this is why the
  `Unauthorised`-on-first-render failure mode does not apply here.

- **`WelcomeBanner`** copy updated to drop "Real-time data wiring lands in the
  next iteration"; replace with a neutral greeting line.

### Empty-state copy

- Marketing band cards (when `!marketingDataAvailable`): value hidden,
  hint = "Awaiting Google Ads sync".
- Commission card (when `!commissionDataAvailable`): value hidden,
  hint = "No commission run yet".
- Operations band cards (always, until a table exists): value hidden,
  hint = "Not tracked yet".

---

## Data flow

1. Page renders inside `AuthGate`; once authenticated, `DashboardKpis` mounts.
2. `useQuery(api.dashboard.overview)` returns `undefined` → all cards show
   skeletons.
3. Query resolves → cards render live numbers, deltas, or empty states.
4. Convex subscriptions keep the numbers live: a new deal or enquiry updates
   the relevant cards without a refresh.

## Error handling

- The query is `requireAdmin`-gated; a non-admin session throws `Unauthorised`,
  consistent with every other admin query. `AuthGate` ensures the query only
  fires post-auth.
- Empty tables are a normal state, not an error: the availability booleans
  drive the empty-state rendering. No try/catch needed in the handler.
- Division guards (`conversionRate`, `pctDelta`) live in the pure helpers and
  are unit-tested.

## Testing

- `convex/dashboardCalc.test.ts` — unit tests for every pure helper, covering
  the edge cases listed above. Run with the existing vitest setup.
- Manual verification: `npm run dev` + `npx convex dev`, sign in, confirm
  Sales Pipeline and Insights show real figures, Marketing/Operations show
  their empty states, and a `Skeleton` flashes on first load.

## Files touched

| File | Change |
|---|---|
| `convex/dashboard.ts` | New — `overview` query (approach A) |
| `convex/dashboardCalc.ts` | New — pure aggregation helpers |
| `convex/dashboardCalc.test.ts` | New — vitest unit tests |
| `src/components/dashboard/kpi-card.tsx` | Extend: null value, state, delta, loading |
| `src/components/dashboard/dashboard-kpis.tsx` | New — client component, `useQuery` |
| `src/components/dashboard/welcome-banner.tsx` | Copy update |
| `src/app/(app)/dashboard/page.tsx` | Thin shell rendering `DashboardKpis` |
