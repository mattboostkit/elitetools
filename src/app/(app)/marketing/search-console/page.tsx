import { PageHeader } from "@/components/ui/page-header";

export default function SearchConsolePage() {
  return (
    <>
      <PageHeader
        title="Search Console"
        description="Top queries, impressions, clicks, CTR per property."
      />
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Coming in the next iteration.
      </div>
    </>
  );
}
