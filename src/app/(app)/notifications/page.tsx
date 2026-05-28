import { PageHeader } from "@/components/ui/page-header";

export default function NotificationsPage() {
  return (
    <>
      <PageHeader
        title="Notifications"
        description="Recent activity across the platform."
      />
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Coming in the next iteration.
      </div>
    </>
  );
}
