import { PageHeader } from "@/components/ui/page-header";

export default function CronsPage() {
  return (
    <>
      <PageHeader
        title="Scheduled Jobs"
        description="Cron health and run history."
      />
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Coming in the next iteration.
      </div>
    </>
  );
}
