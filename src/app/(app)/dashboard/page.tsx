import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { KpiBand } from "@/components/dashboard/kpi-band";
import { KpiCard } from "@/components/dashboard/kpi-card";

export default function DashboardPage() {
  return (
    <>
      <WelcomeBanner />
      <QuickActions />

      <KpiBand title="Sales Pipeline" icon="🛒" accent="sales">
        <KpiCard label="Open opportunities" value="—" hint="Value —" mono />
        <KpiCard label="Pending quotes" value="—" hint="Sent / awaiting" mono />
        <KpiCard label="Contracts signed" value="—" hint="This month" mono />
        <KpiCard label="Conv rate" value="—" hint="vs prev month" mono />
      </KpiBand>

      <KpiBand title="Marketing & Ads" icon="🎯" accent="marketing">
        <KpiCard label="Ad spend MTD" value="—" hint="Across accounts" mono />
        <KpiCard label="Cost per lead" value="—" hint="vs prev month" mono />
        <KpiCard label="Top campaign" value="—" hint="By leads" />
        <KpiCard label="Pipeline ROAS" value="—" hint="Pipeline £ / ad spend" mono />
      </KpiBand>

      <KpiBand title="Operations" icon="📦" accent="operations">
        <KpiCard label="Activities today" value="—" hint="Calls + meetings" mono />
        <KpiCard label="Overdue follow-ups" value="—" hint="Needs attention" mono />
        <KpiCard label="Viewings this week" value="—" hint="Across venues" mono />
        <KpiCard label="My open tasks" value="—" hint="Due today" mono />
      </KpiBand>

      <KpiBand title="Insights" icon="📈" accent="insights">
        <KpiCard label="Revenue MTD" value="—" hint="vs prev month" mono />
        <KpiCard label="Commission accrued" value="—" hint="Across reps" mono />
        <KpiCard label="Top property" value="—" hint="By revenue" />
        <KpiCard label="Best source" value="—" hint="By lead count" />
      </KpiBand>
    </>
  );
}
