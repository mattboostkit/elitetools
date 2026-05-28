import { cn } from "@/lib/utils";
import { DEPARTMENT_COLOURS } from "@/components/layout/nav-config";

export interface KpiBandProps {
  title: string;
  icon: string;
  accent: keyof typeof DEPARTMENT_COLOURS;
  children: React.ReactNode;
}

export function KpiBand({ title, icon, accent, children }: KpiBandProps) {
  const colours = DEPARTMENT_COLOURS[accent];
  return (
    <section className={cn("mb-6 border-l-4 pl-4", colours.border)}>
      <div className="mb-3 flex items-center gap-1.5">
        <span className={cn("text-sm", colours.text)}>{icon}</span>
        <h2 className={cn("text-sm font-semibold", colours.text)}>{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
    </section>
  );
}
