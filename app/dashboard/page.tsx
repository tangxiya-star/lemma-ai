"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Eye } from "lucide-react";
import { ownedListings } from "@/lib/listings";

type Stats = { total: number; counts: Record<string, number> };

export default function ListingsIndex() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const r = await fetch("/api/widget/stats?hours=24", { cache: "no-store" });
        const data = await r.json();
        if (alive) setStats(data);
      } catch {}
    }
    tick();
    const id = setInterval(tick, 6000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <section className="px-10 py-12 max-w-6xl">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="text-[11px] uppercase tracking-[0.32em] text-bone/50 mb-3">
            Your listings
          </div>
          <h1 className="font-display text-5xl tracking-tight">
            Three stays, <em className="italic text-bone/85">told twelve ways.</em>
          </h1>
        </div>
        <Link
          href="/dashboard/new"
          className="px-5 py-3 rounded-full bg-cream text-ink text-sm font-medium hover:bg-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New listing
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ownedListings.map((l, i) => (
          <ListingTile key={l.id} l={l} delay={i * 0.06} totalViews={stats?.total} />
        ))}

        <Link
          href="/dashboard/new"
          className="aspect-[4/5] rounded-3xl border border-dashed border-white/15 hover:border-cream/50 hover:bg-white/[0.02] transition flex flex-col items-center justify-center gap-3 text-bone/45 hover:text-cream"
        >
          <div className="w-12 h-12 rounded-full border border-current grid place-items-center">
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-display text-lg">Add a listing</span>
          <span className="text-[10px] uppercase tracking-[0.22em]">~90 seconds · Director Agent</span>
        </Link>
      </div>
    </section>
  );
}

function ListingTile({
  l,
  delay,
  totalViews,
}: {
  l: (typeof ownedListings)[number];
  delay: number;
  totalViews?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Link
        href={l.status === "ready" ? `/dashboard/listings/${l.id}` : "/dashboard/new"}
        className="group block aspect-[4/5] rounded-3xl overflow-hidden ring-1 ring-white/10 hover:ring-cream/50 transition relative"
      >
        <img
          src={l.cover}
          className="absolute inset-0 w-full h-full object-cover transition group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />

        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          <span className="text-[10px] uppercase tracking-[0.22em] text-cream/85">
            {l.location}
          </span>
          {l.status === "ready" ? (
            <span className="text-[9px] uppercase tracking-[0.22em] text-emerald-300/95 px-1.5 py-0.5 border border-emerald-300/40 rounded">
              ● {l.filmCount} films
            </span>
          ) : (
            <span className="text-[9px] uppercase tracking-[0.22em] text-bone/55 px-1.5 py-0.5 border border-bone/25 rounded">
              draft
            </span>
          )}
        </div>

        <div className="absolute bottom-5 left-5 right-5">
          <div className="font-display text-3xl leading-tight text-cream mb-2">
            {l.name}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-bone/65">
            <span>${l.price}/night</span>
            {l.status === "ready" && totalViews != null && l.id === "bayview" && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {totalViews} views · 24h
                </span>
              </>
            )}
            {l.status === "ready" && l.id !== "bayview" && (
              <>
                <span>·</span>
                <span className="text-bone/40">— views · 24h</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
