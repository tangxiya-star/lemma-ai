"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Plus,
  BarChart3,
  Code2,
  ArrowUpRight,
  Settings,
} from "lucide-react";
import { ownedListings } from "@/lib/listings";

const nav = [
  { href: "/dashboard", label: "Listings", icon: LayoutGrid, match: (p: string) => p === "/dashboard" || p.startsWith("/dashboard/listings") },
  { href: "/dashboard/new", label: "New listing", icon: Plus, match: (p: string) => p.startsWith("/dashboard/new") || p.startsWith("/dashboard/generate") },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, match: (p: string) => p.startsWith("/dashboard/analytics") },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/dashboard";

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-r border-white/8 flex flex-col bg-black/40 sticky top-0 h-screen">
        <Link href="/dashboard" className="px-6 py-6 flex items-center gap-2 border-b border-white/5">
          <span className="font-display text-xl tracking-tight">Lemma</span>
          <span className="text-[9px] uppercase tracking-[0.28em] text-bone/45 ml-1 pl-2 border-l border-white/10">
            Host
          </span>
        </Link>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {nav.map((n) => {
            const active = n.match(pathname);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  active
                    ? "bg-cream/10 text-cream"
                    : "text-bone/60 hover:text-cream hover:bg-white/[0.03]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{n.label}</span>
                {n.label === "Listings" && (
                  <span className="ml-auto text-[10px] text-bone/40 tabular-nums">
                    {ownedListings.length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-5 border-t border-white/5">
          <a
            href="/demo-listing"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-bone/55 hover:text-cream hover:bg-white/[0.03] transition"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>See widget live</span>
            <ArrowUpRight className="w-3 h-3 ml-auto" />
          </a>
          <button
            disabled
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-bone/35 cursor-not-allowed"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Account</span>
          </button>
          <div className="mt-4 px-3 text-[9px] uppercase tracking-[0.22em] text-bone/30">
            demo-host@lemma.app
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 grain relative">{children}</main>
    </div>
  );
}
