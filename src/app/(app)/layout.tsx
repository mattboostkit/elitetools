import { Sidebar } from "@/components/Sidebar";
import { AuthGate } from "@/components/AuthGate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-8 max-w-7xl">
          <AuthGate>{children}</AuthGate>
        </div>
      </main>
    </div>
  );
}
