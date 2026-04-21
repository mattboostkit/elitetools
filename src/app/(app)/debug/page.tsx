"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

type TokenState =
  | { status: "loading" }
  | { status: "ok"; hasToken: boolean; preview: string | null; error: null }
  | { status: "error"; hasToken: false; preview: null; error: string };

export default function DebugPage() {
  const { isLoaded, isSignedIn, getToken, userId, sessionId } = useAuth();
  const whoami = useQuery(api.debug.whoami);
  const [tokenState, setTokenState] = useState<TokenState>({
    status: "loading",
  });

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken({ template: "convex" });
        if (cancelled) return;
        setTokenState({
          status: "ok",
          hasToken: !!token,
          preview: token ? `${token.slice(0, 20)}…${token.slice(-10)}` : null,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setTokenState({
          status: "error",
          hasToken: false,
          preview: null,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Auth debug</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Diagnostic page — remove once auth is working.
        </p>
      </div>

      <Section title="1. Clerk session (client-side)">
        <Row label="isLoaded" value={String(isLoaded)} />
        <Row label="isSignedIn" value={String(isSignedIn)} />
        <Row label="userId" value={userId ?? "(none)"} />
        <Row label="sessionId" value={sessionId ?? "(none)"} />
      </Section>

      <Section title="2. Clerk getToken({ template: 'convex' })">
        {tokenState.status === "loading" && <Row label="status" value="loading…" />}
        {tokenState.status === "ok" && (
          <>
            <Row label="hasToken" value={String(tokenState.hasToken)} />
            <Row label="preview" value={tokenState.preview ?? "(null)"} />
          </>
        )}
        {tokenState.status === "error" && (
          <>
            <Row label="hasToken" value="false" />
            <Row label="error" value={tokenState.error} />
          </>
        )}
      </Section>

      <Section title="3. Convex ctx.auth.getUserIdentity() (server-side)">
        {whoami === undefined ? (
          <Row label="status" value="loading…" />
        ) : (
          <pre className="text-xs bg-zinc-50 rounded p-3 overflow-x-auto">
            {JSON.stringify(whoami, null, 2)}
          </pre>
        )}
      </Section>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium mb-2">How to read this:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>
            Section 1 all <code>true</code> / populated → Clerk session is fine.
          </li>
          <li>
            Section 2 <code>hasToken: false</code> with an error → the Clerk JWT
            template isn&apos;t named <code>convex</code>, or another Clerk-side
            misconfig. Fix in Clerk dashboard.
          </li>
          <li>
            Section 2 <code>hasToken: true</code> but Section 3
            <code>hasIdentity: false</code> → token is being sent but Convex is
            rejecting it. Check Convex logs for audience / issuer / signature
            mismatch.
          </li>
          <li>
            Section 3 <code>hasIdentity: true</code> with correct
            <code>issuer</code> → auth is working end-to-end; the original
            error must be from somewhere else.
          </li>
        </ul>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-zinc-900 mb-3">{title}</h2>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm font-mono">
      <span className="text-zinc-500 min-w-[120px]">{label}</span>
      <span className="text-zinc-900 break-all">{value}</span>
    </div>
  );
}
