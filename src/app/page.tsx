import { redirect } from "next/navigation";

// Middleware has already ensured the user is signed in by the time this
// renders. Route them straight into the dashboard.
export default function RootPage() {
  redirect("/dashboard");
}
