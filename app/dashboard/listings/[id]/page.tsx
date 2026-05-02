"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Copy,
  Check,
  Play,
  RefreshCcw,
  ExternalLink,
} from "lucide-react";
import type { Listing, Persona } from "@/lib/store";
import { findListing } from "@/lib/listings";

type AspectFormat = {
  id: string;
  label: string;
  platform: string;
  ratio: string;
};
const aspectFormats: AspectFormat[] = [
  { id: "16:9", label: "Original", platform: "Web embed", ratio: "16/9" },
  { id: "9:16-tt", label: "TikTok", platform: "Vertical 9:16", ratio: "9/16" },
  { id: "1:1", label: "Instagram", platform: "Feed 1:1", ratio: "1/1" },
  { id: "9:16-yt", label: "YouTube Shorts", platform: "Vertical 9:16", ratio: "9/16" },
];

const personaArt: Record<string, { tag: string; kind: string; img: string }> = {
  family:   { tag: "FAMILY",   kind: "WARM",  img: "/demo-videos/family_cover.jpg" },
  couple:   { tag: "COUPLE",   kind: "QUIET", img: "/demo-videos/couple_cover.jpg" },
  remote:   { tag: "REMOTE",   kind: "FOCUS", img: "/demo-videos/remote_cover.jpg" },
  business: { tag: "BUSINESS", kind: "SHARP", img: "/demo-videos/business_cover.jpg" },
};

export default function ListingDetail() {
  const params = useParams<{ id: string }>();
  const meta = findListing(params.id);
  const [listing, setListing] = useState<Listing | null>(null);
  const [activeFormat, setActiveFormat] = useState("16:9");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!meta) return;
    if (meta.id === "bayview") {
      // Real listing — pull from /api/generate (which reads Butterbase).
      fetch(`/api/generate?listingId=demo-123`).then((r) => r.json()).then(setListing);
    } else {
      // Placeholder listings reuse the same persona content — for IA demo only.
      fetch(`/api/generate?listingId=demo-123`).then((r) => r.json()).then(setListing);
    }
  }, [meta?.id]);

  if (!meta) return notFound();

  const embed = `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js" data-listing-id="${meta.id}"></script>`;
  function copy() {
    navigator.clipboard.writeText(embed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="px-10 py-10 max-w-6xl">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.22em] text-bone/55 hover:text-cream mb-6">
        <ChevronLeft className="w-3.5 h-3.5" /> All listings
      </Link>

      {/* Listing hero */}
      <div className="grid md:grid-cols-[1.4fr_1fr] gap-6 mb-12">
        <div className="aspect-[16/10] rounded-3xl overflow-hidden ring-1 ring-white/10 relative">
          <img src={meta.cover} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="text-[10px] uppercase tracking-[0.28em] text-cream/80 mb-2">
              {meta.location}
            </div>
            <h1 className="font-display text-5xl tracking-tight text-cream">{meta.name}</h1>
          </div>
        </div>

        <div className="space-y-3">
          <Stat label="Status" value={meta.status === "ready" ? "Ready" : "Draft"} accent={meta.status === "ready" ? "emerald" : "muted"} />
          <Stat label="Films generated" value={`${meta.filmCount} / 4`} />
          <Stat label="Vibe" value={meta.vibe} mono />
          <Stat label="Price" value={`$${meta.price}/night`} />
          <Link
            href={`/demo-listing`}
            target="_blank"
            className="block text-center px-5 py-3.5 rounded-full bg-cream text-ink text-sm font-medium hover:bg-white flex items-center justify-center gap-2"
          >
            View on listing site <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Films + platform export */}
      <div className="mb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-bone/50 mb-2">
              The four films
            </div>
            <h2 className="font-display text-3xl">
              One stay, <em className="italic text-bone/80">told four ways.</em>
            </h2>
          </div>
          <button className="text-[11px] uppercase tracking-[0.22em] text-bone/55 hover:text-cream flex items-center gap-1.5">
            <RefreshCcw className="w-3 h-3" /> Re-generate
          </button>
        </div>

        {/* Platform / aspect format selector */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex flex-wrap gap-2">
            {aspectFormats.map((f) => {
              const active = activeFormat === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFormat(f.id)}
                  className={`px-4 py-2 rounded-full text-xs flex items-center gap-2 transition border ${
                    active
                      ? "bg-cream text-ink border-cream"
                      : "border-white/15 text-bone/65 hover:border-white/40 hover:text-cream"
                  }`}
                >
                  <span
                    className="inline-block border"
                    style={{
                      width: f.ratio === "9/16" ? 7 : f.ratio === "1/1" ? 11 : 14,
                      height: f.ratio === "9/16" ? 12 : f.ratio === "1/1" ? 11 : 8,
                      borderColor: active ? "rgb(0 0 0 / 0.5)" : "rgb(244 239 230 / 0.5)",
                    }}
                  />
                  <span className="font-medium">{f.label}</span>
                  <span className={active ? "text-ink/55" : "text-bone/40"}>· {f.platform}</span>
                </button>
              );
            })}
          </div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-bone/35">
            preview only · re-renders queue server-side
          </div>
        </div>

        {!listing ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{ aspectRatio: aspectFormats.find((f) => f.id === activeFormat)?.ratio }}
                className="rounded-3xl bg-white/[0.04] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className={
            activeFormat === "16:9"
              ? "grid md:grid-cols-2 lg:grid-cols-4 gap-4"
              : "grid grid-cols-2 md:grid-cols-4 gap-4"
          }>
            {listing.personas.map((p, i) => (
              <FilmCard
                key={p.id}
                p={p}
                delay={i * 0.06}
                aspect={aspectFormats.find((f) => f.id === activeFormat)?.ratio || "3/4"}
              />
            ))}
          </div>
        )}
      </div>

      {/* Embed snippet */}
      <div className="mb-16 rounded-3xl border border-white/10 bg-white/[0.02] p-8">
        <div className="flex items-start justify-between gap-6 flex-wrap mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-bone/50 mb-2">Embed</div>
            <h3 className="font-display text-2xl">
              Drop this on your <em className="italic">direct booking site.</em>
            </h3>
          </div>
          <button
            onClick={copy}
            className="px-4 py-2.5 rounded-full bg-cream text-ink text-xs flex items-center gap-2 hover:bg-white"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy snippet"}
          </button>
        </div>
        <pre className="p-4 rounded-xl bg-black border border-white/10 text-xs text-bone/80 overflow-x-auto font-mono">
          {embed}
        </pre>
      </div>

      {/* Per-listing analytics */}
      <ListingAnalytics name={meta.name} />
    </section>
  );
}

function FilmCard({ p, delay, aspect }: { p: Persona; delay: number; aspect: string }) {
  const [playing, setPlaying] = useState(false);
  const art = personaArt[p.id] || personaArt.couple;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      style={{ aspectRatio: aspect }}
      className="relative rounded-3xl overflow-hidden ring-1 ring-white/10 group"
    >
      {playing ? (
        <video
          src={p.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <img src={art.img} className="absolute inset-0 w-full h-full object-cover transition group-hover:scale-105" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />

      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.24em] text-cream/85">{art.tag}</span>
        <span className="text-[9px] uppercase tracking-[0.18em] text-cream/85 px-1.5 py-0.5 border border-cream/40 rounded">
          {art.kind}
        </span>
      </div>

      {!playing && (
        <button onClick={() => setPlaying(true)} className="absolute inset-0 grid place-items-center" aria-label="Play">
          <span className="w-12 h-12 rounded-full bg-cream/95 text-ink grid place-items-center group-hover:scale-110 transition">
            <Play className="w-4 h-4 ml-0.5" />
          </span>
        </button>
      )}

      <div className="absolute bottom-4 left-4 right-4">
        <div className="font-display text-lg leading-tight">{p.tagline}</div>
      </div>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  accent,
  mono,
}: {
  label: string;
  value: string;
  accent?: "emerald" | "muted";
  mono?: boolean;
}) {
  const valueClass =
    accent === "emerald"
      ? "text-emerald-300"
      : accent === "muted"
      ? "text-bone/55"
      : "";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-[0.22em] text-bone/45">{label}</span>
      <span className={`text-sm ${mono ? "font-mono" : "font-display"} ${valueClass}`}>{value}</span>
    </div>
  );
}

function ListingAnalytics({ name }: { name: string }) {
  const [stats, setStats] = useState<{
    total: number;
    counts: Record<string, number>;
    recent: { persona: string | null; ts: string }[];
  } | null>(null);
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

  const order = ["family", "couple", "remote", "business"];
  const meta: Record<string, { name: string; color: string }> = {
    family: { name: "Family", color: "bg-amber-300/70" },
    couple: { name: "Couple", color: "bg-rose-300/70" },
    remote: { name: "Solo / Remote", color: "bg-sky-300/70" },
    business: { name: "Business", color: "bg-emerald-300/70" },
  };
  const max = stats ? Math.max(1, ...order.map((k) => stats.counts[k] || 0)) : 1;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
      <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.32em] text-bone/50 mb-2 flex items-center gap-2">
            Live · last 24h
            <span className={`inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 transition ${pulse ? "scale-150" : "scale-100"}`} />
          </div>
          <h3 className="font-display text-2xl">
            Who's <em className="italic">watching</em> {name}?
          </h3>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl">{stats?.total ?? "—"}</div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-bone/40">total views</div>
        </div>
      </div>

      <div className="space-y-2.5">
        {order.map((k) => {
          const n = stats?.counts[k] || 0;
          const pct = (n / max) * 100;
          return (
            <div key={k} className="flex items-center gap-4">
              <div className="w-32 text-sm font-display">{meta[k].name}</div>
              <div className="flex-1 h-6 rounded-md bg-white/[0.04] overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full ${meta[k].color}`}
                />
                <div className="absolute inset-0 px-3 flex items-center text-xs font-mono text-bone/80">
                  {n}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 text-[10px] uppercase tracking-[0.22em] text-bone/30 font-mono">
        SELECT persona_selected, COUNT(*) FROM widget_views WHERE listing_id = $1 AND timestamp &gt; now() - interval '24h'
      </div>
    </div>
  );
}
