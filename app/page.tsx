"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const cards = [
  {
    tag: "FAMILY",
    kind: "WARM",
    title: "Sunday Morning",
    sub: "Pancakes, soft light, slow hours.",
    img: "/demo-videos/family_cover.jpg",
    rotate: -8,
    x: -260,
    z: 10,
  },
  {
    tag: "COUPLE",
    kind: "QUIET",
    title: "Bayview Retreat",
    sub: "Soft tides. A view to share.",
    img: "/demo-videos/couple_cover.jpg",
    rotate: 0,
    x: 0,
    z: 30,
  },
  {
    tag: "REMOTE",
    kind: "FOCUS",
    title: "The North Desk",
    sub: "Daylight, deep work, fast Wi-Fi.",
    img: "/demo-videos/remote_cover.jpg",
    rotate: 8,
    x: 260,
    z: 20,
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden grain">
      <nav className="relative z-30 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl tracking-tight">Lemma</span>
        </div>
        <div className="flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-bone/70">
          <a>Product</a>
          <a>Hosts</a>
          <Link href="/dashboard" className="text-cream">Dashboard →</Link>
        </div>
      </nav>

      <section className="relative z-10 px-8 pt-16 pb-32 max-w-6xl mx-auto text-center">
        <div className="text-[11px] uppercase tracking-[0.32em] text-bone/60 mb-8">
          Adaptive listings · for short-term rental hosts
        </div>
        <h1 className="font-display text-6xl md:text-7xl leading-[1.05] tracking-tight">
          One stay,<br />
          <em className="italic text-bone/90">told four ways.</em>
        </h1>
        <p className="mt-8 text-bone/60 max-w-xl mx-auto leading-relaxed">
          Lemma's Director Agent reads your space and writes a different film
          for every guest who finds it — family, couple, remote worker, business.
        </p>

        <div className="mt-10 flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-full bg-cream text-ink text-sm font-medium hover:bg-white transition"
          >
            Open Host Dashboard
          </Link>
          <Link
            href="/demo-listing"
            className="px-6 py-3 rounded-full border border-bone/30 text-bone text-sm hover:bg-cream/5 transition"
          >
            See it on a listing
          </Link>
        </div>
      </section>

      {/* layered cards */}
      <div className="relative h-[520px] flex items-center justify-center">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 60, rotate: c.rotate }}
            animate={{ opacity: 1, y: 0, rotate: c.rotate }}
            transition={{ delay: 0.15 * i, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
            whileHover={{ y: -12, rotate: c.rotate * 0.4, scale: 1.03 }}
            style={{ x: c.x, zIndex: c.z }}
            className="absolute w-[300px] md:w-[360px] aspect-[3/4] rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
          >
            <img src={c.img} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />
            <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.28em] text-cream/80">{c.tag}</span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-cream/80 px-2 py-1 border border-cream/40 rounded-md">
                {c.kind}
              </span>
            </div>
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="font-display text-2xl font-semibold leading-tight">{c.title}</h3>
              <p className="font-display italic text-sm text-bone/85 mt-1">{c.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 mt-10 mb-32 text-center text-[10px] uppercase tracking-[0.3em] text-bone/40">
        Powered by the Director Agent
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative z-10 px-8 py-32 max-w-6xl mx-auto border-t border-bone/10">
        <div className="text-[11px] uppercase tracking-[0.32em] text-bone/50 mb-6 text-center">
          How it works
        </div>
        <h2 className="font-display text-5xl md:text-6xl text-center leading-[1.05] tracking-tight mb-20">
          Three steps. <em className="italic text-bone/80">Sixty seconds.</em>
        </h2>

        <div className="grid md:grid-cols-3 gap-10">
          {[
            {
              n: "01",
              t: "Upload your space",
              d: "Drop in 10–20 photos of your listing. Tell us the vibe in one line. That's the entire input.",
            },
            {
              n: "02",
              t: "Director Agent writes",
              d: "It studies your space, drafts a script per persona, and renders cinematic shots — family, couple, solo, business.",
            },
            {
              n: "03",
              t: "Embed anywhere",
              d: "One <script> tag on your direct-booking page. Each guest sees the version made for them.",
            },
          ].map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: 0.1 * i, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative"
            >
              <div className="font-display text-7xl text-bone/15 mb-6 leading-none">{s.n}</div>
              <h3 className="font-display text-2xl mb-3">{s.t}</h3>
              <p className="text-bone/55 leading-relaxed text-sm">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── COMPARE ─── */}
      <section className="relative z-10 px-8 py-32 max-w-6xl mx-auto border-t border-bone/10">
        <h2 className="font-display text-5xl md:text-6xl text-center leading-[1.05] tracking-tight mb-4">
          One listing. <em className="italic text-bone/80">Many stories.</em>
        </h2>
        <p className="text-bone/55 text-center max-w-xl mx-auto mb-16 leading-relaxed">
          Today every guest sees the same generic walkthrough. Lemma reframes the same space for the
          person actually watching.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="text-[10px] uppercase tracking-[0.28em] text-bone/40 mb-3">Today</div>
            <div className="aspect-[16/10] rounded-2xl overflow-hidden ring-1 ring-white/5 relative">
              <img
                src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80"
                className="w-full h-full object-cover grayscale opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              <div className="absolute bottom-5 left-5 right-5 font-display italic text-bone/70 text-lg">
                "Beautiful 2BR with ocean view…"
              </div>
            </div>
            <p className="text-xs text-bone/40 mt-4">One video. Everyone.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            <div className="text-[10px] uppercase tracking-[0.28em] text-cream mb-3">With Lemma</div>
            <div className="aspect-[16/10] rounded-2xl overflow-hidden ring-1 ring-cream/20 relative">
              <img
                src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />
              <div className="absolute top-5 left-5 px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] bg-cream text-ink rounded-md">
                For couples
              </div>
              <div className="absolute bottom-5 left-5 right-5 font-display italic text-cream text-lg">
                "Tucked into the cliffs — made for two."
              </div>
            </div>
            <p className="text-xs text-bone/60 mt-4">A different story per guest.</p>
          </motion.div>
        </div>
      </section>

      {/* ─── LIVE AGENT ─── */}
      <section className="relative z-10 px-8 py-32 max-w-5xl mx-auto border-t border-bone/10">
        <div className="text-[11px] uppercase tracking-[0.32em] text-bone/50 mb-6 text-center">
          The Director Agent
        </div>
        <h2 className="font-display text-5xl md:text-6xl text-center leading-[1.05] tracking-tight mb-16">
          Watch it <em className="italic text-bone/80">think.</em>
        </h2>

        <div className="rounded-2xl bg-black/60 ring-1 ring-bone/10 p-8 md:p-10 font-mono text-[13px] leading-[1.85] relative overflow-hidden">
          <div className="flex gap-1.5 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-bone/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-bone/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-bone/15" />
          </div>
          {[
            { c: "text-bone/50 italic", t: "› analyzing 12 photos for The Cabin in Bolinas…" },
            { c: "text-emerald-300/80", t: "✓ detected: cabin · ocean view · fireplace · kid bedroom" },
            { c: "text-cream", t: "→ generate_persona_brief(persona: \"couple\")" },
            { c: "text-bone/60", t: "  brief: intimate, restorative. highlight: fireplace + soaking tub." },
            { c: "text-cream", t: "→ write_shot_script(persona: \"couple\")" },
            { c: "text-bone/60", t: "  shot 1: fireplace at golden hour · shot 2: deck sunset" },
            { c: "text-cream", t: "→ generate_video_shot(shot: 1, ref: @photo_3)" },
            { c: "text-emerald-300/80", t: "✓ shot 1 rendered · qa_check passed" },
            { c: "text-amber-300/80", t: "⚠ qa_check: lighting drift in shot 3 — regenerating" },
            { c: "text-emerald-300/80", t: "✓ couple variant ready · 28s · 4 shots" },
          ].map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 * i, duration: 0.4 }}
              className={l.c}
            >
              {l.t}
            </motion.div>
          ))}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ─── EMBED ─── */}
      <section className="relative z-10 px-8 py-32 max-w-4xl mx-auto border-t border-bone/10 text-center">
        <div className="text-[11px] uppercase tracking-[0.32em] text-bone/50 mb-6">
          Embed in 60 seconds
        </div>
        <h2 className="font-display text-5xl md:text-6xl leading-[1.05] tracking-tight mb-10">
          One line of code. <em className="italic text-bone/80">That's it.</em>
        </h2>

        <div className="rounded-xl bg-black/60 ring-1 ring-bone/10 p-6 md:p-8 font-mono text-sm md:text-[15px] text-left leading-relaxed">
          <span className="text-bone/40">{"<"}</span>
          <span className="text-emerald-300/90">script</span>{" "}
          <span className="text-amber-300/90">src</span>
          <span className="text-bone/50">=</span>
          <span className="text-cream">"https://lemma.app/widget.js"</span>
          <br />
          <span className="ml-8 text-amber-300/90">data-listing-id</span>
          <span className="text-bone/50">=</span>
          <span className="text-cream">"bolinas-cabin-001"</span>{" "}
          <span className="text-amber-300/90">async</span>
          <span className="text-bone/40">{"></"}</span>
          <span className="text-emerald-300/90">script</span>
          <span className="text-bone/40">{">"}</span>
        </div>

        <p className="text-bone/50 text-sm mt-6">
          Works with Hostaway, Lodgify, WordPress, or any HTML page.
        </p>
      </section>

      {/* ─── FOOTER CTA ─── */}
      <section className="relative z-10 px-8 py-40 max-w-4xl mx-auto text-center border-t border-bone/10">
        <h2 className="font-display text-6xl md:text-7xl leading-[1.02] tracking-tight">
          Tell your stay <br />
          <em className="italic text-bone/80">the way it deserves.</em>
        </h2>
        <div className="mt-12 flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-7 py-3.5 rounded-full bg-cream text-ink text-sm font-medium hover:bg-white transition"
          >
            Open Host Dashboard
          </Link>
          <Link
            href="/demo-listing"
            className="px-7 py-3.5 rounded-full border border-bone/30 text-bone text-sm hover:bg-cream/5 transition"
          >
            See it on a listing
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-bone/10 px-8 py-10 flex justify-between items-center text-[10px] uppercase tracking-[0.28em] text-bone/40">
        <span>Lemma · Adaptive listings</span>
        <span>Powered by the Director Agent</span>
      </footer>
    </main>
  );
}
