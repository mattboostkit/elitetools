import { PageHeader } from "@/components/ui/page-header";

export default function AuditLogPage() {
  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Every mutation logged with actor + before/after."
      />
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Coming in the next iteration.
      </div>
    </>
  );
}
