import { PageHeader } from "@/components/ui/page-header";

export default function DealsPage() {
  return (
    <>
      <PageHeader
        title="Deals"
        description="Active deals, by stage, with commission accrual."
      />
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Coming in the next iteration.
      </div>
    </>
  );
}
