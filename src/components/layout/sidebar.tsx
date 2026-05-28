"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { useModuleConfig } from "@/hooks/use-module-config";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { navSections, canSeeSection, canSeeItem } from "./nav-config";
import { Wordmark } from "@/components/ui/wordmark";

export function Sidebar() {
  const pathname = usePathname();
  const permissions = usePermissions();
  const { modules } = useModuleConfig();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:border-r bg-white">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/" aria-label="Elite Tools — Home">
          <Wordmark />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navSections
          .filter((s) => canSeeSection(s, permissions.isLoading ? null : permissions, modules))
          .map((section) => (
            <div key={section.title} className="mb-2">
              <button
                onClick={() => toggleSection(section.title)}
                className={cn(
                  "flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wider hover:text-foreground transition-colors",
                  section.accentText ?? "text-muted-foreground"
                )}
              >
                <span className="flex items-center gap-1.5">
                  {section.accentText && (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        section.accentText.replace("text-", "bg-")
                      )}
                    />
                  )}
                  {section.title}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    collapsedSections.has(section.title) && "-rotate-90"
                  )}
                />
              </button>

              {!collapsedSections.has(section.title) && (
                <div
                  className={cn(
                    "mt-1 space-y-0.5",
                    section.accentBorder && "border-l-2 ml-2 pl-1",
                    section.accentBorder
                  )}
                >
                  {section.items
                    .filter((item) => canSeeItem(item, permissions.isLoading ? null : permissions))
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? cn(
                                  section.accentBg ?? "bg-primary/10",
                                  section.accentText ?? "text-primary",
                                  "font-semibold"
                                )
                              : "text-foreground/70 hover:bg-accent/60 hover:text-accent-foreground"
                          )}
                        >
                          <Icon
                            className={cn("h-4 w-4", isActive && (section.accentText ?? "text-primary"))}
                          />
                          {item.label}
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>
          ))}
      </nav>
    </aside>
  );
}
