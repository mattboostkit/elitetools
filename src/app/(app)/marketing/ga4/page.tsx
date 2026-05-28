import { PageHeader } from "@/components/ui/page-header";

export default function Ga4Page() {
  return (
    <>
      <PageHeader
        title="GA4 Analytics"
        description="Sessions, users, bounce rate, attribution by source."
      />
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Coming in the next iteration.
      </div>
    </>
  );
}
