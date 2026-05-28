import { PageHeader } from "@/components/ui/page-header";

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendar"
        description="Combined calendar across reps and properties."
      />
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Coming in the next iteration.
      </div>
    </>
  );
}
