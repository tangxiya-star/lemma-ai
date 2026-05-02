"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ownedListings } from "@/lib/listings";

const personaMeta: Record<string, { name: string; color: string }> = {
  family: { name: "Family", color: "bg-amber-300/70" },
  couple: { name: "Couple", color: "bg-rose-300/70" },
  remote: { name: "Solo / Remote", color: "bg-sky-300/70" },
  business: { name: "Business", color: "bg-emerald-300/70" },
};
const order = ["family", "couple", "remote", "business"];

type Stats = {
  total: number;
  counts: Record<string, number>;
  recent: { persona: string | null; ts: string }[];
};

export default function Analytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const r = await fetch("/api/widget/stats?hours=24", { cache: "no-store" });
        const data = await r.json();
        if (!alive) return;
        setStats(data);
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      } catch {}
    }
    tick();
    const id = setInterval(tick, 4000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const max = stats ? Math.max(1, ...order.map((k) => stats.counts[k] || 0)) : 1;
  const winner = stats
    ? [...order].sort((a, b) => (stats.counts[b] || 0) - (stats.counts[a] || 0))[0]
    : null;

  return (
    <section className="px-10 py-10 max-w-6xl">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="text-[11px] uppercase tracking-[0.32em] text-bone/50 mb-3 flex items-center gap-2">
            All listings · last 24 hours
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 transition ${
                pulse ? "scale-150" : "scale-100"
              }`}
            />
          </div>
          <h1 className="font-display text-5xl tracking-tight">
            Who's <em className="italic text-bone/85">watching?</em>
          </h1>
          <p className="text-bone/55 mt-3 max-w-xl text-sm leading-relaxed">
            Real-time persona engagement across every embedded widget. Each guest
            click writes a row to <span className="font-mono text-bone/75">widget_views</span> in
            Butterbase. Numbers below are live SQL aggregates.
          </p>
        </div>
        <div className="text-right">
          <div className="font-display text-6xl tabular-nums">{stats?.total ?? "—"}</div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-bone/40 mt-2">
            total views
          </div>
        </div>
      </div>

      {/* Persona breakdown */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 mb-8">
        <div className="text-[10px] uppercase tracking-[0.28em] text-bone/50 mb-5">
          Persona breakdown
        </div>
        <div className="space-y-3">
          {order.map((k) => {
            const n = stats?.counts[k] || 0;
            const pct = (n / max) * 100;
            const isWinner = winner === k && n > 0;
            return (
              <div key={k} className="flex items-center gap-4">
                <div className="w-36 flex items-center gap-2">
                  <span className="font-display text-sm">{personaMeta[k].name}</span>
                  {isWinner && (
                    <span className="text-[9px] uppercase tracking-[0.18em] text-emerald-300/90 px-1.5 py-0.5 border border-emerald-300/30 rounded">
                      top
                    </span>
                  )}
                </div>
                <div className="flex-1 h-7 rounded-md bg-white/[0.04] overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full ${personaMeta[k].color}`}
                  />
                  <div className="absolute inset-0 px-3 flex items-center text-xs font-mono text-bone/85">
                    {n}
                  </div>
                </div>
                <div className="w-16 text-right text-[11px] text-bone/50 tabular-nums">
                  {stats && stats.total > 0 ? `${Math.round((n / stats.total) * 100)}%` : "—"}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 text-[10px] uppercase tracking-[0.22em] text-bone/30 font-mono">
          SELECT persona_selected, COUNT(*) FROM widget_views WHERE timestamp &gt; now() - interval '24h' GROUP BY persona_selected
        </div>
      </div>

      {/* Per-listing breakdown (placeholder — only Bayview has real data) */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 mb-8">
        <div className="text-[10px] uppercase tracking-[0.28em] text-bone/50 mb-5">
          By listing
        </div>
        <div className="space-y-3">
          {ownedListings.map((l) => {
            const isReal = l.id === "bayview";
            return (
              <Link
                key={l.id}
                href={`/dashboard/listings/${l.id}`}
                className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/8 hover:border-white/20 hover:bg-white/[0.02] transition"
              >
                <img src={l.cover} className="w-12 h-12 rounded-md object-cover" />
                <div className="flex-1">
                  <div className="font-display text-base">{l.name}</div>
                  <div className="text-[11px] text-bone/45">{l.location}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm tabular-nums">
                    {isReal ? stats?.total ?? "—" : "0"}
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.18em] text-bone/40">
                    views · 24h
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-bone/30" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent stream */}
      {stats && stats.recent.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <div className="text-[10px] uppercase tracking-[0.28em] text-bone/50 mb-4">
            Recent events
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.recent.slice(0, 24).map((r, i) => (
              <span
                key={i}
                className="text-[10px] font-mono text-bone/65 px-2.5 py-1 rounded bg-white/[0.04]"
              >
                {r.persona || "skipped"} · {timeAgo(r.ts)}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}
