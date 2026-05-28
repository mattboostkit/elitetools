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
