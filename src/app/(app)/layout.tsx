import { AuthGate } from "@/components/AuthGate";
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </AuthGate>
  );
}
