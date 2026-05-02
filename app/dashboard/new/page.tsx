"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, Check, ChevronLeft, RefreshCcw, Loader2, Plus } from "lucide-react";

const AIRBNB =
  "https://a0.muscache.com/im/pictures/hosting/Hosting-1313306687285416653/original";
const samplePhotos = [
  { src: `${AIRBNB}/0609000d-b3f8-40ac-a563-104ab2182867.jpeg?im_w=720`, name: "IMG_4382.jpg" },
  { src: `${AIRBNB}/091631a4-7baa-48a2-aa21-f6acf3844dd0.jpeg?im_w=720`, name: "IMG_4391.jpg" },
  { src: `${AIRBNB}/0a5f395f-2db9-4d9d-a807-452e440c9c2b.jpeg?im_w=720`, name: "IMG_4407.jpg" },
  { src: `${AIRBNB}/1f5b6a20-a368-4609-a1b3-bc7b8e69f1c5.jpeg?im_w=720`, name: "IMG_4412.jpg" },
  { src: `${AIRBNB}/217b792d-daba-4f0d-97ed-74631e327c0e.jpeg?im_w=720`, name: "IMG_4418.jpg" },
  { src: `${AIRBNB}/2c3425fc-5184-45d8-b335-cd5842e290c8.jpeg?im_w=720`, name: "IMG_4425.jpg" },
  { src: `${AIRBNB}/320b29b0-f0bd-4afe-ad94-c6437371f528.jpeg?im_w=720`, name: "IMG_4431.jpg" },
  { src: `${AIRBNB}/405069b5-f2b5-43ab-a9eb-3aa16ff2c20c.jpeg?im_w=720`, name: "IMG_4437.jpg" },
  { src: `${AIRBNB}/492e3595-6aee-454d-aafd-df2ef1b1b5e5.jpeg?im_w=720`, name: "IMG_4442.jpg" },
  { src: `${AIRBNB}/5679b926-bceb-4af5-b912-c9847bb8444a.jpeg?im_w=720`, name: "IMG_4449.jpg" },
];

export type Archetype = "family" | "couple" | "remote" | "business";
const ARCHETYPE_LABEL: Record<Archetype, string> = {
  family: "Family",
  couple: "Couple",
  remote: "Remote",
  business: "Business",
};
function archetypeLabel(a: Archetype): string {
  return ARCHETYPE_LABEL[a] ?? a;
}
export type SuggestedPersona = {
  id: string;
  name: string;
  desc: string;
  why: string;
  archetype: Archetype;
};

export default function NewListing() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [usingSamples, setUsingSamples] = useState(true);
  const [name, setName] = useState("The Sunset Studio");
  const [vibe, setVibe] = useState("Compact city apartment · in-unit laundry");
  const [location, setLocation] = useState("San Francisco, CA");
  const [suggestions, setSuggestions] = useState<SuggestedPersona[]>([]);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [observed, setObserved] = useState<string>("");
  const [photosSeen, setPhotosSeen] = useState<number>(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function togglePersona(id: string) {
    setSelectedPersonas((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  }

  async function analyze() {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const r = await fetch("/api/personas/suggest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          vibe,
          location,
          // Don't pre-seed features — let the vision model report what it sees.
          features: [],
          photoUrls: samplePhotos.map((p) => p.src),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "analyze failed");
      setSuggestions(data.personas);
      setObserved(String(data.observed || ""));
      setPhotosSeen(Number(data.photosSeen || 0));
      setSelectedPersonas(data.personas.map((p: SuggestedPersona) => p.id));
    } catch (e: any) {
      setAnalyzeError(String(e?.message || e));
    } finally {
      setAnalyzing(false);
    }
  }

  // Auto-analyze on mount so the page lands populated.
  useEffect(() => {
    analyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function generate() {
    const jobId = `job-${Date.now()}`;

    // Selected bespoke personas, deduped by archetype (first-wins) so each
    // film maps to a unique cinematic base. The agent uses `archetype` for
    // prompting/shot template; UI shows `name` + `desc` + `why` (the brief).
    const seen = new Set<Archetype>();
    const chosen = suggestions
      .filter((p) => selectedPersonas.includes(p.id))
      .filter((p) => {
        if (seen.has(p.archetype)) return false;
        seen.add(p.archetype);
        return true;
      });

    if (typeof window !== "undefined") {
      sessionStorage.setItem(`lemma:job:${jobId}`, JSON.stringify(chosen));
    }
    const archetypes = chosen.map((p) => p.archetype).join(",");
    router.push(
      `/dashboard/generate/${jobId}?listingId=demo-123&name=${encodeURIComponent(
        name
      )}&personas=${archetypes}`
    );
  }

  return (
    <section className="px-10 py-10 max-w-5xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.22em] text-bone/55 hover:text-cream mb-6"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> All listings
      </Link>

      <div className="text-[11px] uppercase tracking-[0.32em] text-bone/50 mb-3">
        New listing · Step 1 of 2
      </div>
      <h1 className="font-display text-5xl tracking-tight max-w-3xl mb-12">
        Upload your home.<br />
        <em className="italic text-bone/85">The agent picks the personas.</em>
      </h1>

      <div className="grid md:grid-cols-[1.2fr_1fr] gap-10">
        {/* Left: name, photos */}
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.28em] text-bone/50 mb-2">
              Listing name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-b border-white/15 pb-2 text-2xl font-display focus:outline-none focus:border-cream/60 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.28em] text-bone/50 mb-2">
                Location
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent border-b border-white/15 pb-2 text-lg font-display focus:outline-none focus:border-cream/60 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.28em] text-bone/50 mb-2">
                Vibe (one line)
              </label>
              <input
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                className="w-full bg-transparent border-b border-white/15 pb-2 text-lg font-display focus:outline-none focus:border-cream/60 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.28em] text-bone/50 mb-3">
              Photos · {files.length || samplePhotos.length} loaded
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                setFiles(Array.from(e.dataTransfer.files));
                setUsingSamples(false);
              }}
              className="border border-dashed border-white/15 rounded-2xl p-8 text-center cursor-pointer hover:border-cream/40 hover:bg-white/[0.02] transition mb-3"
            >
              <Upload className="w-5 h-5 mx-auto mb-2 text-bone/60" />
              <div className="font-display italic text-bone/80">
                {files.length > 0
                  ? `${files.length} photo(s) ready`
                  : usingSamples
                  ? `${samplePhotos.length} sample photos loaded`
                  : "Drop your listing photos here"}
              </div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-bone/40 mt-1.5">
                {usingSamples && files.length === 0
                  ? "demo mode · click to replace with your own"
                  : "JPG, PNG · up to 24"}
              </div>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  setFiles(Array.from(e.target.files || []));
                  setUsingSamples(false);
                }}
              />
            </div>

            {usingSamples && files.length === 0 && (
              <div className="grid grid-cols-5 gap-2">
                {samplePhotos.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * i, duration: 0.4 }}
                    className="relative aspect-square rounded-md overflow-hidden ring-1 ring-white/10"
                  >
                    <img src={p.src} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-1 left-1.5 right-1.5 text-[8px] font-mono text-bone/70 truncate">
                      {p.name}
                    </div>
                    <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-cream/90 grid place-items-center">
                      <Check className="w-2 h-2 text-ink" strokeWidth={3} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: persona selection + CTA */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] uppercase tracking-[0.28em] text-bone/50 flex items-center gap-2">
                Personas · suggested for you
                {analyzing && <Loader2 className="w-3 h-3 animate-spin text-bone/50" />}
              </div>
              <button
                onClick={analyze}
                disabled={analyzing}
                className="text-[10px] uppercase tracking-[0.22em] text-bone/55 hover:text-cream flex items-center gap-1 disabled:opacity-40"
              >
                <RefreshCcw className="w-3 h-3" /> Re-analyze
              </button>
            </div>
            <p className="text-xs text-bone/55 mb-4 leading-relaxed">
              The Director Agent reads your photos + vibe and proposes traveler types
              tailored to <span className="text-bone/85">this</span> home. Each maps to a
              cinematic archetype <span className="text-bone/70">(Family · Couple · Remote · Business)</span>
              {" "}— shown as a tag on each card.
            </p>

            {analyzeError && (
              <div className="mb-3 px-3 py-2 rounded-lg border border-amber-300/30 bg-amber-300/[0.04] text-xs text-amber-200/80">
                {analyzeError}
              </div>
            )}

            {observed && (
              <div className="mb-3 px-3 py-2.5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.04]">
                <div className="text-[9px] uppercase tracking-[0.28em] text-emerald-200/70 mb-1">
                  ⦿ Agent observed · {photosSeen} photos
                </div>
                <div className="text-[12px] italic text-bone/80 leading-snug">
                  {observed}
                </div>
              </div>
            )}

            <div className="space-y-2 min-h-[200px]">
              {analyzing && suggestions.length === 0 ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[68px] rounded-xl bg-white/[0.03] animate-pulse"
                  />
                ))
              ) : (
                <AnimatePresence mode="popLayout">
                  {suggestions.map((p, i) => {
                    const on = selectedPersonas.includes(p.id);
                    return (
                      <motion.button
                        key={p.id}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.35 }}
                        onClick={() => togglePersona(p.id)}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border transition ${
                          on
                            ? "border-cream/50 bg-cream/[0.06]"
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-display text-sm leading-snug">{p.name}</div>
                            {p.archetype && (
                              <span className="text-[8.5px] uppercase tracking-[0.22em] text-bone/55 px-1.5 py-0.5 rounded border border-bone/20">
                                {archetypeLabel(p.archetype)}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-bone/55 mt-0.5">{p.desc}</div>
                          <div className="text-[10px] text-cream/55 mt-1.5 flex items-start gap-1.5 italic">
                            <Sparkles className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                            <span>{p.why}</span>
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 mt-0.5 rounded grid place-items-center shrink-0 ${
                            on ? "bg-cream text-ink" : "border border-bone/30"
                          }`}
                        >
                          {on && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={selectedPersonas.length === 0}
            className="w-full px-6 py-4 rounded-full bg-cream text-ink font-medium flex items-center justify-center gap-2 hover:bg-white disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" /> Generate {selectedPersonas.length} films
          </button>
          <div className="text-center text-[10px] uppercase tracking-[0.22em] text-bone/40">
            ~90 seconds · Director Agent
          </div>
        </div>
      </div>
    </section>
  );
}
