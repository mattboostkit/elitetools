"use client";

import Link from "next/link";
import { Plus, Phone, Upload, PoundSterling, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const actions: QuickAction[] = [
  { label: "New Lead", href: "/sales/leads", icon: Plus },
  { label: "New Deal", href: "/sales/deals", icon: Plus },
  { label: "New Quote", href: "/sales/quotes", icon: Plus },
  { label: "Log Activity", href: "/operations/activities", icon: Phone },
  { label: "Upload Contract", href: "/sales/contracts", icon: Upload },
  { label: "Run Commission", href: "/insights/commissions", icon: PoundSterling },
  { label: "Ads Report", href: "/marketing/google-ads", icon: BarChart3 },
];

export function QuickActions() {
  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Quick Actions
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/60"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {action.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
