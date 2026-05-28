import { PageHeader } from "@/components/ui/page-header";

export default function UsersPage() {
  return (
    <>
      <PageHeader
        title="Users"
        description="All signed-in users, roles, last-active."
      />
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Coming in the next iteration.
      </div>
    </>
  );
}
