"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

function greetingForTime(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function WelcomeBanner() {
  const { user, isLoaded } = useUser();
  const [greeting, setGreeting] = useState<string | null>(null);

  // Compute greeting only after client mount to avoid SSR/CSR mismatch on
  // the server's UTC hour vs the client's local hour.
  useEffect(() => {
    setGreeting(greetingForTime(new Date().getHours()));
  }, []);

  const firstName = isLoaded && user?.firstName ? user.firstName : "";

  return (
    <div className="mb-4">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {greeting ?? "Welcome"}{firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Welcome to Elite Tools. Real-time data wiring lands in the next iteration.
      </p>
    </div>
  );
}
