"use client";

import { Bell } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export function TopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-6">
      <div className="flex-1 max-w-lg">
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-1.5">
          <span className="text-sm text-muted-foreground">
            Search leads, deals, customers, campaigns...
          </span>
          <kbd className="rounded border bg-white px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            CtrlK
          </kbd>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          aria-label="Notifications"
          className="text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
        </button>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-7 w-7",
            },
          }}
        />
      </div>
    </header>
  );
}
