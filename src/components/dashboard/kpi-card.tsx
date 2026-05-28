import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp } from "lucide-react";

export interface KpiDelta {
  pct: number; // fractional change, e.g. 0.2 = +20%
  direction: "up" | "down";
}

export interface KpiCardProps {
  label: string;
  /** null → render the empty-state dash regardless of `state`. */
  value: string | null;
  hint?: string;
  mono?: boolean;
  /** "empty" muted-dashes the value (used for un-backed KPIs). */
  state?: "ok" | "empty";
  delta?: KpiDelta | null;
  loading?: boolean;
  className?: string;
}

export function KpiCard({
  label,
  value,
  hint,
  mono,
  state = "ok",
  delta,
  loading,
  className,
}: KpiCardProps) {
  const isEmpty = state === "empty" || value === null;
  return (
    <div className={cn("rounded-lg border bg-white p-4", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="mt-1.5 h-7 w-20" />
      ) : isEmpty ? (
        <p className="mt-1 text-2xl font-semibold tracking-tight text-muted-foreground/40">
          —
        </p>
      ) : (
        <div className="mt-1 flex items-baseline gap-2">
          <p
            className={cn(
              "text-2xl font-semibold tracking-tight text-foreground",
              mono && "font-mono"
            )}
          >
            {value}
          </p>
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                delta.direction === "up" ? "text-emerald-600" : "text-red-600"
              )}
            >
              {delta.direction === "up" ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {Math.abs(delta.pct * 100).toFixed(0)}%
            </span>
          )}
        </div>
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
