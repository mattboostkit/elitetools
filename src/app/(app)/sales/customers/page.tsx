import { PageHeader } from "@/components/ui/page-header";

export default function CustomersPage() {
  return (
    <>
      <PageHeader
        title="Customers"
        description="All customers across every property, with full history."
      />
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Coming in the next iteration.
      </div>
    </>
  );
}
