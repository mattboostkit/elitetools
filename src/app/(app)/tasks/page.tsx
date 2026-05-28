import { PageHeader } from "@/components/ui/page-header";

export default function TasksPage() {
  return (
    <>
      <PageHeader
        title="My Tasks"
        description="Personal task list and follow-ups."
      />
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Coming in the next iteration.
      </div>
    </>
  );
}
