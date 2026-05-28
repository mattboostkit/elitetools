"use client";

import { useUser } from "@clerk/nextjs";

function greetingForTime(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function WelcomeBanner() {
  const { user } = useUser();
  const firstName = user?.firstName ?? "there";
  const hour = new Date().getHours();
  const greeting = greetingForTime(hour);

  return (
    <div className="mb-4">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {greeting}, {firstName}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Welcome to Elite Tools. Real-time data wiring lands in the next iteration.
      </p>
    </div>
  );
}
