"use client";

import { useEffect, useState } from "react";
import { Star, MapPin, Wifi, Coffee, Home, Play, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Listing, Persona } from "@/lib/store";

const ABNB =
  "https://a0.muscache.com/im/pictures/hosting/Hosting-1313306687285416653/original";
const photos = [
  `${ABNB}/0609000d-b3f8-40ac-a563-104ab2182867.jpeg?im_w=1440`,
  `${ABNB}/091631a4-7baa-48a2-aa21-f6acf3844dd0.jpeg?im_w=720`,
  `${ABNB}/0a5f395f-2db9-4d9d-a807-452e440c9c2b.jpeg?im_w=720`,
  `${ABNB}/1f5b6a20-a368-4609-a1b3-bc7b8e69f1c5.jpeg?im_w=720`,
  `${ABNB}/217b792d-daba-4f0d-97ed-74631e327c0e.jpeg?im_w=720`,
];

const personaMeta: Record<
  string,
  { tag: string; kind: string; emoji: string; whoYouAre: string }
> = {
  family: { tag: "FAMILY", kind: "WARM", emoji: "⌂", whoYouAre: "with kids" },
  couple: { tag: "COUPLE", kind: "QUIET", emoji: "♡", whoYouAre: "as a couple" },
  remote: {
    tag: "REMOTE",
    kind: "FOCUS",
    emoji: "◐",
    whoYouAre: "solo, working remote",
  },
  business: {
    tag: "BUSINESS",
    kind: "SHARP",
    emoji: "▤",
    whoYouAre: "for work",
  },
};

export default function DemoListing() {
  const [listing, setListing] = useState<Listing | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(true);

  useEffect(() => {
    fetch("/api/generate?listingId=demo-123")
      .then((r) => r.json())
      .then(setListing);
  }, []);

  const activePersona = listing?.personas.find((p) => p.id === active);

  return (
    <main className="min-h-screen bg-[#faf7f2] text-[#0a0a0a]">
      <header className="border-b border-black/10 sticky top-0 bg-[#faf7f2]/90 backdrop-blur z-30">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="font-display text-xl tracking-tight">
            bayviewretreat.com
          </div>
          <nav className="text-[11px] uppercase tracking-[0.22em] text-black/60 flex gap-6">
            <a>Stay</a>
            <a>Amenities</a>
            <a>Book</a>
          </nav>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-black/50 mb-4">
          <MapPin className="w-3.5 h-3.5" /> Mendocino, California
        </div>
        <h1 className="font-display text-6xl tracking-tight mb-3">
          Bayview <em className="italic">Retreat.</em>
        </h1>
        <div className="flex items-center gap-3 text-sm text-black/60 mb-8">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-current" /> 4.97
          </span>
          <span>·</span>
          <span>128 reviews</span>
          <span>·</span>
          <span>Superhost</span>
        </div>

        <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-3xl overflow-hidden mb-12 h-[460px]">
          <img
            src={photos[0]}
            className="col-span-2 row-span-2 w-full h-full object-cover"
          />
          <img src={photos[1]} className="w-full h-full object-cover" />
          <img src={photos[2]} className="w-full h-full object-cover" />
          <img src={photos[3]} className="w-full h-full object-cover" />
          <img src={photos[4]} className="w-full h-full object-cover" />
        </div>

        {/* ============ ADAPTIVE TOUR BLOCK (C-side) ============ */}
        <div className="relative mb-16">
          <div className="rounded-3xl overflow-hidden bg-black text-[#f4efe6] relative aspect-[16/9] ring-1 ring-black/10">
            {/* STATE 1: persona picker (one-time gate) */}
            {!active && listing && (
              <>
                <img
                  src={photos[0]}
                  className="absolute inset-0 w-full h-full object-cover opacity-35"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <div className="text-[11px] uppercase tracking-[0.32em] text-[#f4efe6]/55 mb-4">
                    Take a tour
                  </div>
                  <h3 className="font-display text-4xl md:text-5xl mb-3 max-w-xl">
                    Who's traveling{" "}
                    <em className="italic text-[#f4efe6]/85">with you?</em>
                  </h3>
                  <p className="text-[#f4efe6]/55 text-sm max-w-sm mb-8">
                    We'll show you the version of this stay that fits.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-2xl">
                    {listing.personas.map((p) => {
                      const m = personaMeta[p.id];
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setActive(p.id);
                            fetch("/api/widget/track", {
                              method: "POST",
                              headers: { "content-type": "application/json" },
                              body: JSON.stringify({ persona_selected: p.id }),
                            }).catch(() => {});
                          }}
                          className="rounded-xl border border-[#f4efe6]/15 bg-white/[0.04] hover:bg-white/[0.1] hover:border-[#f4efe6]/40 transition px-4 py-4 text-center"
                        >
                          <div className="text-xl mb-1.5">{m?.emoji || "•"}</div>
                          <div className="font-display text-base">{p.name}</div>
                          <div className="text-[10px] uppercase tracking-[0.18em] text-[#f4efe6]/45 mt-1">
                            {m?.whoYouAre || ""}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-6 text-[10px] uppercase tracking-[0.28em] text-[#f4efe6]/35">
                    Powered by Lemma
                  </div>
                </div>
              </>
            )}

            {/* STATE 2: single tailored video (no other personas visible) */}
            <AnimatePresence mode="wait">
              {activePersona && (
                <motion.div
                  key={activePersona.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <video
                    key={activePersona.videoUrl}
                    src={activePersona.videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />
                  <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.28em] text-[#f4efe6]/85">
                      A tour for you
                    </span>
                    <button
                      onClick={() => setActive(null)}
                      className="text-[10px] uppercase tracking-[0.22em] text-[#f4efe6]/55 hover:text-[#f4efe6] underline underline-offset-4"
                    >
                      not me?
                    </button>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="font-display text-3xl md:text-4xl leading-tight">
                      {activePersona.tagline}
                    </h3>
                    <p className="font-display italic text-[#f4efe6]/80 text-base mt-2 max-w-xl">
                      {activePersona.script || activePersona.description}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* demo-only meta strip — explains what just happened */}
          <div className="mt-4 flex items-start justify-between gap-6 text-xs text-black/45 leading-relaxed">
            <div className="flex items-center gap-2 text-black/55">
              <Sparkles className="w-3 h-3" />
              <span className="uppercase tracking-[0.22em] text-[10px]">
                {active
                  ? `Demo · this guest sees the ${personaMeta[active!]?.tag.toLowerCase()} version. The other 3 are invisible to them.`
                  : `Demo · in production, the persona is auto-picked from signals (referrer, query, session). The picker shown here is just for you to try each version.`}
              </span>
            </div>
          </div>
        </div>

        {/* ============ existing listing body ============ */}
        <div className="grid md:grid-cols-3 gap-12 pt-8 border-t border-black/10">
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="font-display text-3xl mb-3">A quiet bayside home</h2>
              <p className="text-black/70 leading-relaxed text-lg">
                {activePersona?.script ||
                  "Cliffside windows, a sun-soaked workspace, and the slow rhythm of the Pacific. Bayview Retreat is built for unhurried days and easy mornings."}
              </p>
              {activePersona && (
                <div className="mt-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-black/50 bg-black/5 rounded-full px-3 py-1.5">
                  <Sparkles className="w-3 h-3" /> Adapted for your trip
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Feature icon={<Home className="w-4 h-4" />} label="Entire home" />
              <Feature
                icon={<Wifi className="w-4 h-4" />}
                label="Fast Wi-Fi · 400 Mbps"
              />
              <Feature
                icon={<Coffee className="w-4 h-4" />}
                label="Espresso bar"
              />
              <Feature icon={<Star className="w-4 h-4" />} label="Superhost" />
            </div>
          </div>

          <aside className="border border-black/10 rounded-3xl p-6 h-fit shadow-sm bg-white">
            <div className="font-display text-3xl">
              $284{" "}
              <span className="text-base font-normal text-black/50 font-sans">
                / night
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
              <div className="border border-black/10 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-widest text-black/50">
                  Check-in
                </div>
                <div>Jun 12</div>
              </div>
              <div className="border border-black/10 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-widest text-black/50">
                  Check-out
                </div>
                <div>Jun 17</div>
              </div>
            </div>
            <button className="mt-4 w-full py-3 rounded-full bg-black text-[#faf7f2]">
              Reserve your stay
            </button>
            <div className="text-xs text-black/50 text-center mt-2">
              You won't be charged yet
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl border border-black/10">
      <div className="text-black/70">{icon}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}
