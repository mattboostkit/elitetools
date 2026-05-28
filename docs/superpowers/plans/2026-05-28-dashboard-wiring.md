# Dashboard Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded `—` KPI values on the `/dashboard` page with live Convex data, showing honest empty states for KPIs whose data source does not exist yet.

**Architecture:** One bundled `dashboard.overview` Convex query (approach A) computes every band's figures in a single round-trip from the `enquiries`, `deals`, and `quotes` tables, plus availability flags for the empty `googleAdsMetrics`/`commissionPayouts` tables. All arithmetic lives in a pure, unit-tested `convex/dashboardCalc.ts` module. A thin `DashboardKpis` client component subscribes to the query and renders four `KpiBand`s; the page stays a server shell.

**Tech Stack:** Next.js 16 (App Router), Convex, Clerk (auth via `requireAdmin`), shadcn/ui, Tailwind v4, lucide-react, vitest (node env).

**Spec:** `docs/superpowers/specs/2026-05-28-dashboard-wiring-design.md`

---

## File structure

| File | Responsibility |
|---|---|
| `convex/dashboardCalc.ts` | New. Pure aggregation helpers, zero Convex imports. |
| `convex/dashboardCalc.test.ts` | New. Vitest unit tests for the helpers. |
| `convex/dashboard.ts` | New. `overview` query — I/O + calls helpers. |
| `src/components/dashboard/kpi-card.tsx` | Modify. Add `null` value, `state`, `delta`, `loading`. |
| `src/components/dashboard/dashboard-kpis.tsx` | New. `"use client"` component, `useQuery(api.dashboard.overview)`. |
| `src/components/dashboard/welcome-banner.tsx` | Modify. Drop the "next iteration" copy. |
| `src/app/(app)/dashboard/page.tsx` | Modify. Render `<DashboardKpis/>` instead of hardcoded bands. |

---

### Task 1: Pure aggregation helpers (TDD)

**Files:**
- Create: `convex/dashboardCalc.ts`
- Test: `convex/dashboardCalc.test.ts`

- [ ] **Step 1: Write the failing test**

Create `convex/dashboardCalc.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  monthKeyFromTimestamp,
  addMonths,
  dayOfMonth,
  isoInMonthUpToDay,
  conversionRate,
  pctDelta,
  topByCount,
  topByValue,
} from "./dashboardCalc";

// 2026-05-15T12:00:00Z
const MAY_15 = Date.UTC(2026, 4, 15, 12, 0, 0);

describe("monthKeyFromTimestamp", () => {
  it("formats a timestamp as YYYY-MM in UTC", () => {
    expect(monthKeyFromTimestamp(MAY_15)).toBe("2026-05");
  });
  it("uses UTC, not local time, at month boundaries", () => {
    // 2026-01-01T00:00:00Z
    expect(monthKeyFromTimestamp(Date.UTC(2026, 0, 1, 0, 0, 0))).toBe("2026-01");
  });
});

describe("addMonths", () => {
  it("subtracts within a year", () => {
    expect(addMonths("2026-05", -1)).toBe("2026-04");
    expect(addMonths("2026-05", -2)).toBe("2026-03");
  });
  it("wraps across the year boundary", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-01", -2)).toBe("2025-11");
  });
});

describe("dayOfMonth", () => {
  it("returns the UTC day of month", () => {
    expect(dayOfMonth(MAY_15)).toBe(15);
  });
});

describe("isoInMonthUpToDay", () => {
  it("includes dates in the month up to and including the day", () => {
    expect(isoInMonthUpToDay("2026-05-10", "2026-05", 15)).toBe(true);
    expect(isoInMonthUpToDay("2026-05-15", "2026-05", 15)).toBe(true);
  });
  it("excludes later days in the same month", () => {
    expect(isoInMonthUpToDay("2026-05-20", "2026-05", 15)).toBe(false);
  });
  it("excludes other months", () => {
    expect(isoInMonthUpToDay("2026-04-10", "2026-05", 15)).toBe(false);
  });
  it("handles datetime ISO strings (slices first 10 chars)", () => {
    expect(isoInMonthUpToDay("2026-05-09T08:30:00Z", "2026-05", 15)).toBe(true);
  });
});

describe("conversionRate", () => {
  it("returns booked / total", () => {
    expect(conversionRate(3, 12)).toBe(0.25);
  });
  it("returns 0 when total is 0 (no divide-by-zero)", () => {
    expect(conversionRate(0, 0)).toBe(0);
  });
});

describe("pctDelta", () => {
  it("returns the fractional change", () => {
    expect(pctDelta(120, 100)).toBeCloseTo(0.2);
    expect(pctDelta(80, 100)).toBeCloseTo(-0.2);
  });
  it("returns null when previous is 0", () => {
    expect(pctDelta(50, 0)).toBeNull();
  });
});

describe("topByCount", () => {
  it("returns the most frequent key", () => {
    const rows = [{ s: "google" }, { s: "google" }, { s: "facebook" }];
    expect(topByCount(rows, (r) => r.s)).toEqual({ key: "google", count: 2 });
  });
  it("skips undefined keys", () => {
    const rows = [{ s: undefined }, { s: "google" }];
    expect(topByCount(rows, (r) => r.s)).toEqual({ key: "google", count: 1 });
  });
  it("returns null for an empty set", () => {
    expect(topByCount([] as { s?: string }[], (r) => r.s)).toBeNull();
  });
  it("breaks ties by first-seen", () => {
    const rows = [{ s: "a" }, { s: "b" }, { s: "a" }, { s: "b" }];
    expect(topByCount(rows, (r) => r.s)).toEqual({ key: "a", count: 2 });
  });
});

describe("topByValue", () => {
  it("returns the key with the highest summed value", () => {
    const rows = [
      { p: "owp", v: 100 },
      { p: "salomons", v: 250 },
      { p: "owp", v: 200 },
    ];
    expect(topByValue(rows, (r) => r.p, (r) => r.v)).toEqual({
      key: "owp",
      value: 300,
    });
  });
  it("returns null for an empty set", () => {
    expect(topByValue([] as { p?: string; v: number }[], (r) => r.p, (r) => r.v)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run convex/dashboardCalc.test.ts`
Expected: FAIL — cannot resolve `./dashboardCalc` / functions not defined.

- [ ] **Step 3: Write minimal implementation**

Create `convex/dashboardCalc.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run convex/dashboardCalc.test.ts`
Expected: PASS — all describe blocks green.

- [ ] **Step 5: Commit**

```bash
git add convex/dashboardCalc.ts convex/dashboardCalc.test.ts
git commit -m "feat(dashboard): pure aggregation helpers for KPI overview"
```

---

### Task 2: The `dashboard.overview` Convex query

**Files:**
- Create: `convex/dashboard.ts`

Note: Convex query handlers need a deployment to execute, so this task is verified by `convex dev` deploy + the typecheck/build in Task 6, not a vitest unit test (the arithmetic is already covered by Task 1).

- [ ] **Step 1: Write the query**

Create `convex/dashboard.ts`:

```ts
import { query } from "./_generated/server";
import { requireAdmin } from "./adminAuth";
import {
  monthKeyFromTimestamp,
  addMonths,
  dayOfMonth,
  isoInMonthUpToDay,
  conversionRate,
  topByCount,
  topByValue,
} from "./dashboardCalc";

/**
 * Dashboard KPI bundle — approach A. One query → one round-trip.
 * Scans the three populated tables (enquiries, deals, quotes) once each
 * and probes the two empty-by-default tables (googleAdsMetrics,
 * commissionPayouts) for availability. Fine at current volume
 * (~700 enquiries, low hundreds of deals/quotes); revisit when this
 * crosses a few thousand. All arithmetic lives in dashboardCalc.ts.
 */
export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const thisMonth = monthKeyFromTimestamp(now);
    const lastMonth = addMonths(thisMonth, -1);
    const priorMonth = addMonths(thisMonth, -2);
    const today = dayOfMonth(now);

    const enquiries = await ctx.db.query("enquiries").collect();
    const deals = await ctx.db.query("deals").collect();
    const quotes = await ctx.db.query("quotes").collect();

    // Cancelled deals never count toward revenue or contracts signed.
    const liveDeals = deals.filter((d) => d.status !== "cancelled");

    // --- Sales Pipeline ---
    const open = deals.filter(
      (d) => d.status === "provisional" || d.status === "contracted"
    );
    const openValue = open.reduce((s, d) => s + d.contractValue, 0);

    const contractsSignedThisMonth = liveDeals.filter(
      (d) => d.signedDate.slice(0, 7) === thisMonth
    ).length;

    const pendingSent = quotes.filter((q) => q.status === "sent").length;
    const draftQuotes = quotes.filter((q) => q.status === "draft").length;

    // Headline conversion = all-time booked / total. Delta compares the
    // last full month cohort to the month before (both mature), by
    // enquiry createdAt.
    const bookedAll = enquiries.filter((e) => e.status === "booked").length;
    const cohortRate = (mk: string) => {
      const inMonth = enquiries.filter(
        (e) => monthKeyFromTimestamp(e.createdAt) === mk
      );
      const booked = inMonth.filter((e) => e.status === "booked").length;
      return conversionRate(booked, inMonth.length);
    };

    // --- Insights ---
    const revenueMTD = liveDeals
      .filter((d) => isoInMonthUpToDay(d.signedDate, thisMonth, today))
      .reduce((s, d) => s + d.contractValue, 0);
    const revenuePrevMonth = liveDeals
      .filter((d) => isoInMonthUpToDay(d.signedDate, lastMonth, today))
      .reduce((s, d) => s + d.contractValue, 0);

    const topProp = topByValue(
      liveDeals,
      (d) => d.property,
      (d) => d.contractValue
    );
    const bestSrc = topByCount(
      enquiries,
      (e) => e.source ?? e.utmSource ?? undefined
    );

    // Commission: read-only sum of this period's payout runs, if any.
    const payouts = await ctx.db
      .query("commissionPayouts")
      .withIndex("by_period", (q) => q.eq("period", thisMonth))
      .collect();
    const commissionAccrued =
      payouts.length > 0
        ? payouts.reduce((s, p) => s + p.grossTotal, 0)
        : null;

    // Marketing availability probe — empty until an ingestion cron exists.
    const adRow = await ctx.db.query("googleAdsMetrics").first();

    return {
      generatedAt: now,
      salesPipeline: {
        openOpportunities: { count: open.length, value: openValue },
        pendingQuotes: { sent: pendingSent, draft: draftQuotes },
        contractsSignedThisMonth,
        conversionRate: conversionRate(bookedAll, enquiries.length),
        conversionRateLastMonth: cohortRate(lastMonth),
        conversionRatePriorMonth: cohortRate(priorMonth),
      },
      insights: {
        revenueMTD,
        revenuePrevMonth,
        topProperty: topProp
          ? { property: topProp.key, value: topProp.value }
          : null,
        bestSource: bestSrc
          ? { source: bestSrc.key, count: bestSrc.count }
          : null,
        commissionAccrued,
      },
      marketingDataAvailable: adRow !== null,
      commissionDataAvailable: commissionAccrued !== null,
    };
  },
});
```

- [ ] **Step 2: Codegen + typecheck the query**

Run: `npx convex codegen`
Expected: regenerates `convex/_generated/api.d.ts` with `api.dashboard.overview`. No errors.

If `npx convex dev` is running in another terminal, it deploys automatically; otherwise the codegen above is enough for the frontend `api` types. A deploy error here means a schema/field mismatch — fix before continuing.

- [ ] **Step 3: Commit**

```bash
git add convex/dashboard.ts convex/_generated
git commit -m "feat(dashboard): overview query bundling all KPI bands"
```

---

### Task 3: Extend the `KpiCard` component

**Files:**
- Modify: `src/components/dashboard/kpi-card.tsx`

- [ ] **Step 1: Replace the component**

Replace the entire contents of `src/components/dashboard/kpi-card.tsx` with:

```tsx
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp } from "lucide-react";

export interface KpiDelta {
  pct: number; // fractional change, e.g. 0.2 = +20%
  direction: "up" | "down";
}

export interface KpiCardProps {
  label: string;
  /** null → render the empty-state dash regardless of `state`. */
  value: string | null;
  hint?: string;
  mono?: boolean;
  /** "empty" muted-dashes the value (used for un-backed KPIs). */
  state?: "ok" | "empty";
  delta?: KpiDelta | null;
  loading?: boolean;
  className?: string;
}

export function KpiCard({
  label,
  value,
  hint,
  mono,
  state = "ok",
  delta,
  loading,
  className,
}: KpiCardProps) {
  const isEmpty = state === "empty" || value === null;
  return (
    <div className={cn("rounded-lg border bg-white p-4", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="mt-1.5 h-7 w-20" />
      ) : isEmpty ? (
        <p className="mt-1 text-2xl font-semibold tracking-tight text-muted-foreground/40">
          —
        </p>
      ) : (
        <div className="mt-1 flex items-baseline gap-2">
          <p
            className={cn(
              "text-2xl font-semibold tracking-tight text-foreground",
              mono && "font-mono"
            )}
          >
            {value}
          </p>
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                delta.direction === "up" ? "text-emerald-600" : "text-red-600"
              )}
            >
              {delta.direction === "up" ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {Math.abs(delta.pct * 100).toFixed(0)}%
            </span>
          )}
        </div>
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors from `kpi-card.tsx`. (The dashboard page still passes the old props at this point — those are all still valid since `value: string` satisfies `string | null` and the new props are optional, so the page keeps compiling until Task 5.)

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/kpi-card.tsx
git commit -m "feat(dashboard): KpiCard supports empty state, delta chip, loading"
```

---

### Task 4: `DashboardKpis` client component

**Files:**
- Create: `src/components/dashboard/dashboard-kpis.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/dashboard/dashboard-kpis.tsx`:

```tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { KpiBand } from "./kpi-band";
import { KpiCard, type KpiDelta } from "./kpi-card";

const PROPERTY_LABEL: Record<string, string> = {
  owp: "One Warwick Park",
  salomons: "Salomons Estate",
  "bewl-water": "Bewl Water",
  "bewl-adventures": "Bewl Adventures",
};

function gbp(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
}

function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

/** Build a delta chip from two figures; null when no meaningful change. */
function deltaFrom(current: number, previous: number): KpiDelta | null {
  if (previous === 0) return null;
  const d = (current - previous) / previous;
  if (d === 0) return null;
  return { pct: d, direction: d > 0 ? "up" : "down" };
}

export function DashboardKpis() {
  const data = useQuery(api.dashboard.overview);
  const loading = data === undefined;
  const sp = data?.salesPipeline;
  const ins = data?.insights;

  return (
    <>
      <KpiBand title="Sales Pipeline" icon="🛒" accent="sales">
        <KpiCard
          label="Open opportunities"
          loading={loading}
          value={sp ? String(sp.openOpportunities.count) : null}
          hint={sp ? `Value ${gbp(sp.openOpportunities.value)}` : "Value —"}
          mono
        />
        <KpiCard
          label="Pending quotes"
          loading={loading}
          value={sp ? String(sp.pendingQuotes.sent) : null}
          hint={sp ? `${sp.pendingQuotes.draft} draft` : "Sent / awaiting"}
          mono
        />
        <KpiCard
          label="Contracts signed"
          loading={loading}
          value={sp ? String(sp.contractsSignedThisMonth) : null}
          hint="This month"
          mono
        />
        <KpiCard
          label="Conv rate"
          loading={loading}
          value={sp ? pct(sp.conversionRate) : null}
          delta={
            sp
              ? deltaFrom(sp.conversionRateLastMonth, sp.conversionRatePriorMonth)
              : null
          }
          hint="All-time · vs prior month"
          mono
        />
      </KpiBand>

      <KpiBand title="Marketing & Ads" icon="🎯" accent="marketing">
        <KpiCard label="Ad spend MTD" loading={loading} value={null} state="empty" hint="Awaiting Google Ads sync" mono />
        <KpiCard label="Cost per lead" loading={loading} value={null} state="empty" hint="Awaiting Google Ads sync" mono />
        <KpiCard label="Top campaign" loading={loading} value={null} state="empty" hint="Awaiting Google Ads sync" />
        <KpiCard label="Pipeline ROAS" loading={loading} value={null} state="empty" hint="Awaiting Google Ads sync" mono />
      </KpiBand>

      <KpiBand title="Operations" icon="📦" accent="operations">
        <KpiCard label="Activities today" loading={loading} value={null} state="empty" hint="Not tracked yet" mono />
        <KpiCard label="Overdue follow-ups" loading={loading} value={null} state="empty" hint="Not tracked yet" mono />
        <KpiCard label="Viewings this week" loading={loading} value={null} state="empty" hint="Not tracked yet" mono />
        <KpiCard label="My open tasks" loading={loading} value={null} state="empty" hint="Not tracked yet" mono />
      </KpiBand>

      <KpiBand title="Insights" icon="📈" accent="insights">
        <KpiCard
          label="Revenue MTD"
          loading={loading}
          value={ins ? gbp(ins.revenueMTD) : null}
          delta={ins ? deltaFrom(ins.revenueMTD, ins.revenuePrevMonth) : null}
          hint="vs prev month"
          mono
        />
        <KpiCard
          label="Commission accrued"
          loading={loading}
          value={ins && ins.commissionAccrued !== null ? gbp(ins.commissionAccrued) : null}
          state={ins && ins.commissionAccrued !== null ? "ok" : "empty"}
          hint={
            ins && ins.commissionAccrued !== null
              ? "Current period · across reps"
              : "No commission run yet"
          }
          mono
        />
        <KpiCard
          label="Top property"
          loading={loading}
          value={
            ins?.topProperty
              ? PROPERTY_LABEL[ins.topProperty.property] ?? ins.topProperty.property
              : null
          }
          hint={
            ins?.topProperty
              ? `By revenue · ${gbp(ins.topProperty.value)}`
              : "By revenue"
          }
        />
        <KpiCard
          label="Best source"
          loading={loading}
          value={ins?.bestSource ? ins.bestSource.source : null}
          hint={ins?.bestSource ? `${ins.bestSource.count} leads` : "By lead count"}
        />
      </KpiBand>
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. Confirms `api.dashboard.overview` types from Task 2 line up with the field accesses here (`salesPipeline.*`, `insights.*`, `marketingDataAvailable`, `commissionDataAvailable`).

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/dashboard-kpis.tsx
git commit -m "feat(dashboard): DashboardKpis client component wired to overview query"
```

---

### Task 5: Wire the page + refresh the welcome banner

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/components/dashboard/welcome-banner.tsx`

- [ ] **Step 1: Replace the dashboard page**

Replace the entire contents of `src/app/(app)/dashboard/page.tsx` with:

```tsx
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { DashboardKpis } from "@/components/dashboard/dashboard-kpis";

export default function DashboardPage() {
  return (
    <>
      <WelcomeBanner />
      <QuickActions />
      <DashboardKpis />
    </>
  );
}
```

- [ ] **Step 2: Update the welcome banner copy**

In `src/components/dashboard/welcome-banner.tsx`, replace the subtitle paragraph. Change:

```tsx
      <p className="mt-1 text-sm text-muted-foreground">
        Real-time data wiring lands in the next iteration.
      </p>
```

to:

```tsx
      <p className="mt-1 text-sm text-muted-foreground">
        Live across every property. Cards update in real time as leads, deals,
        and quotes change.
      </p>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. The old `KpiBand`/`KpiCard` imports are gone from the page; they now live only in `dashboard-kpis.tsx`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/dashboard/page.tsx" src/components/dashboard/welcome-banner.tsx
git commit -m "feat(dashboard): render live KpiBands, refresh welcome copy"
```

---

### Task 6: Full verification + push

**Files:** none (verification only)

- [ ] **Step 1: Run the unit tests**

Run: `npx vitest run`
Expected: PASS — both `dashboardCalc.test.ts` and the existing `nav-config.test.ts`.

- [ ] **Step 2: Typecheck the whole project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Production build (local)**

Run: `npm run build:local`
Expected: `convex codegen` then `next build` complete with no errors. (`build:local` skips the `convex deploy` step, so it does not need a deploy key.)

- [ ] **Step 4: Manual verification**

In two terminals:

```bash
npx convex dev      # terminal 1 — leave running
npm run dev         # terminal 2 — leave running
```

Open `http://localhost:3000`, sign in, and confirm on `/dashboard`:
- A brief `Skeleton` flashes on each card on first load.
- **Sales Pipeline** + **Revenue/Top property/Best source** show real figures (or `—` only where the underlying table is genuinely empty, e.g. no deals yet).
- **Marketing** cards read "Awaiting Google Ads sync"; **Operations** cards read "Not tracked yet"; **Commission accrued** reads "No commission run yet".
- The conversion-rate and revenue cards show a coloured delta chip when prior-period data exists.
- No `Unauthorised` error in the browser console (AuthGate defers the query until authenticated).

- [ ] **Step 5: Push**

```bash
git push
git status   # confirm "up to date with 'origin/main'"
```

Then state: pushed, Vercel will redeploy.

---

## Notes for the implementer

- **Import depth:** `dashboard-kpis.tsx` lives at `src/components/dashboard/`, so Convex generated code is `../../../convex/_generated/api` (three levels up to repo root). This differs from the Leads page (`../../../../../`) because that page is nested deeper.
- **No `data-stub` on wired cards:** the old `KpiCard` carried `data-stub="true"`; the rewrite drops it. Nothing depends on it (grep confirms no selector references it).
- **Property union:** `PROPERTY_LABEL` covers all four schema literals (`owp`, `salomons`, `bewl-water`, `bewl-adventures`). The `?? topProperty.property` fallback keeps it safe if the union widens before this map is updated.
- **Availability booleans look unused — they are intentional contract.** The query returns `marketingDataAvailable` and `commissionDataAvailable` (the spec's return shape), but this iteration the Marketing cards are hardcoded to the empty state (their *values* are out of scope until a Google Ads sync exists) and the Commission card derives its state from `commissionAccrued !== null`. The booleans are returned for the future iteration that adds value computation; do not delete them to silence an unused-field impression, and do not block on wiring them into the UI now.
- **Commit hygiene:** no `Co-Authored-By` trailer, no "Generated with" footer (per project convention). Commit messages are in the first person / plain voice.
