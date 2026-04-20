import { SignUp } from "@clerk/nextjs";

// Sign-up is gated by Clerk's allowlist / invitations configuration.
// Disable public sign-ups in the Clerk dashboard once you're ready.
export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Elite Tools</h1>
          <p className="text-sm text-zinc-500 mt-1">
            CRM for Elite Leisure Collection
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
