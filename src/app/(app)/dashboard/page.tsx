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
