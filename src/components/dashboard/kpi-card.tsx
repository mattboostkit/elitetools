import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
  className?: string;
}

export function KpiCard({ label, value, hint, mono, className }: KpiCardProps) {
  return (
    <div className={cn("rounded-lg border bg-white p-4", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tracking-tight text-foreground",
          mono && "font-mono"
        )}
        data-stub="true"
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
