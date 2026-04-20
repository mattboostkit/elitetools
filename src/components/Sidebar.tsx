"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Mail,
  Heart,
  FileText,
  AlertTriangle,
  Building2,
  ExternalLink,
} from "lucide-react";
import { clsx } from "clsx";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Enquiries", href: "/enquiries", icon: Mail },
  { name: "Wedding Proposals", href: "/proposals", icon: Heart },
  { name: "Quotes", href: "/quotes", icon: FileText },
  { name: "Form Errors", href: "/form-errors", icon: AlertTriangle },
];

const properties = [
  {
    name: "One Warwick Park",
    href: "https://www.onewarwickpark.co.uk",
    dot: "bg-amber-500",
  },
  {
    name: "Salomons Estate",
    href: "https://www.salomons-estate.com",
    dot: "bg-emerald-500",
  },
  {
    name: "Bewl Water",
    href: "https://www.bewlwater.co.uk",
    dot: "bg-blue-500",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-zinc-900 text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-zinc-400" />
          <h1 className="font-semibold">Elite Tools</h1>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Multi-property CRM
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-4 border-t border-white/10 pt-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider px-3 mb-2">
          Websites
        </p>
        {properties.map((p) => (
          <a
            key={p.name}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-xs text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <span className={clsx("w-2 h-2 rounded-full", p.dot)} />
            <span className="flex-1">{p.name}</span>
            <ExternalLink size={12} />
          </a>
        ))}
      </div>

      <div className="p-4 border-t border-white/10 flex items-center gap-3">
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "w-8 h-8",
            },
          }}
        />
        <span className="text-xs text-zinc-500">Signed in</span>
      </div>
    </aside>
  );
}
