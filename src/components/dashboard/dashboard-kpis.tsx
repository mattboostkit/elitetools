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
          hint={sp ? `Value ${gbp(sp.openOpportunities.value)}` : undefined}
          mono
        />
        <KpiCard
          label="Pending quotes"
          loading={loading}
          value={sp ? String(sp.pendingQuotes.sent) : null}
          hint={sp ? `${sp.pendingQuotes.draft} draft` : undefined}
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
