import { query } from "./_generated/server";
import { requireAdmin } from "./adminAuth";

/**
 * Dashboard KPI bundle. One query → one round-trip.
 * Reads the full enquiries + enquiryEvents tables and computes
 * everything server-side so the client gets only the aggregates it
 * needs. Fine at current volume (~700 enquiries); revisit when this
 * crosses a few thousand.
 */
export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const enquiries = await ctx.db.query("enquiries").collect();
    const events = await ctx.db.query("enquiryEvents").collect();

    // Totals + per-property + conversion rate (booked / total)
    type PropStats = {
      total: number;
      new: number;
      quoted: number;
      booked: number;
      declined: number;
    };
    const properties = ["owp", "salomons"] as const;
    const byProperty: Record<(typeof properties)[number], PropStats> = {
      owp: { total: 0, new: 0, quoted: 0, booked: 0, declined: 0 },
      salomons: { total: 0, new: 0, quoted: 0, booked: 0, declined: 0 },
    };
    let grandTotal = 0;
    let grandBooked = 0;
    let grandQuoted = 0;
    let grandNew = 0;

    for (const e of enquiries) {
      const p = e.property;
      if (p && p in byProperty) {
        const row = byProperty[p];
        row.total++;
        if (e.status === "new") row.new++;
        if (e.status === "quoted") row.quoted++;
        if (e.status === "booked") row.booked++;
        if (e.status === "declined") row.declined++;
      }
      grandTotal++;
      if (e.status === "new") grandNew++;
      if (e.status === "quoted") grandQuoted++;
      if (e.status === "booked") grandBooked++;
    }

    // Response time: median of (first-status-change-from-new - createdAt)
    // across every enquiry that's actually been actioned. Answers "how
    // long does it take us to respond?".
    const firstOutOfNew = new Map<string, number>();
    for (const ev of events) {
      if (ev.type !== "status_change") continue;
      if (ev.fromValue !== "new") continue;
      const prev = firstOutOfNew.get(ev.enquiryId);
      if (prev === undefined || ev.createdAt < prev) {
        firstOutOfNew.set(ev.enquiryId, ev.createdAt);
      }
    }
    const responseMs: number[] = [];
    for (const e of enquiries) {
      const first = firstOutOfNew.get(e._id);
      if (first !== undefined && first > e.createdAt) {
        responseMs.push(first - e.createdAt);
      }
    }
    responseMs.sort((a, b) => a - b);
    const medianResponseMs =
      responseMs.length > 0
        ? responseMs[Math.floor(responseMs.length / 2)]
        : null;

    // Weekly trend: number of enquiries received per week for the last
    // 12 weeks, anchored to the current week (Monday-start).
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    const msInWeek = 7 * msInDay;
    // Align end-of-current-week to tomorrow so today's leads are included
    const alignedEnd = now + msInDay;
    const weekly = Array.from({ length: 12 }, (_, i) => {
      const end = alignedEnd - (11 - i) * msInWeek;
      const start = end - msInWeek;
      const count = enquiries.filter(
        (e) => e.createdAt >= start && e.createdAt < end
      ).length;
      return { weekStart: start, weekEnd: end, count };
    });

    const conversionRate =
      grandBooked + grandQuoted + grandNew > 0
        ? grandBooked / grandTotal
        : 0;

    return {
      totals: {
        total: grandTotal,
        new: grandNew,
        quoted: grandQuoted,
        booked: grandBooked,
        conversionRate,
      },
      byProperty,
      medianResponseMs,
      responseSampleSize: responseMs.length,
      weekly,
    };
  },
});
