"use client";

// Generation screen — the "agent at work" view.
// Subscribes to /api/generate/stream via SSE and renders a live reasoning trace.
// PRD §4.4 — this is the demo's hero screen during 0:18-0:35.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import type { AgentEvent } from "@/lib/agent/events";
import type { PersonaId } from "@/lib/personas";

const DEFAULT_ORDER: PersonaId[] = ["family", "couple", "remote", "business"];
const ARCHETYPE_FALLBACK_LABEL: Record<PersonaId, string> = {
  family: "Family",
  couple: "Couple",
  remote: "Remote Worker",
  business: "Business",
};

// One row per generated film. `archetype` is the cinematic base the agent
// uses internally; `displayName` + `brief` are the bespoke persona surfaced
// to the host (and later to the traveler in the widget).
type PersonaRow = {
  archetype: PersonaId;
  displayName: string;
  brief?: string;
};

type Platform = {
  id: string;
  label: string;
  ratio: "16:9" | "9:16" | "1:1";
  uploadUrl: string;       // where the host completes the post
  short: string;           // 1-line label e.g. "9:16"
};
const PLATFORMS: Platform[] = [
  { id: "web",       label: "Web",            ratio: "16:9", short: "16:9", uploadUrl: ""                                  },
  { id: "tiktok",    label: "TikTok",         ratio: "9:16", short: "9:16", uploadUrl: "https://www.tiktok.com/upload"      },
  { id: "ig-reels",  label: "IG Reels",       ratio: "9:16", short: "9:16", uploadUrl: "https://www.instagram.com/"         },
  { id: "ig-feed",   label: "IG Feed",        ratio: "1:1",  short: "1:1",  uploadUrl: "https://www.instagram.com/"         },
  { id: "yt-shorts", label: "YouTube Shorts", ratio: "9:16", short: "9:16", uploadUrl: "https://www.youtube.com/upload"     },
];
const RATIO_CLASS: Record<Platform["ratio"], string> = {
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16] max-h-[420px] mx-auto",
  "1:1":  "aspect-square",
};

// Cached mp4 per archetype — kept in sync with /public/demo-videos and
// lib/seedance/mock.ts. Lets the preview play immediately on persona_start
// rather than waiting for the brief/script/QA trace to complete.
const ARCHETYPE_VIDEO: Record<PersonaId, string> = {
  family: "/demo-videos/family.mp4",
  couple: "/demo-videos/couple.mp4",
  remote: "/demo-videos/remote.mp4",
  business: "/demo-videos/business.mp4",
};
const SHOTS_PER_PERSONA = 4;

type PersonaState = {
  status: "queued" | "briefing" | "scripting" | "rendering" | "done";
  currentShot: number;     // 0-based, the shot being worked on (or last completed)
  completedShots: number;  // count of shots that passed QA
  failures: number;
  videoUrl?: string;
  hint?: string;           // current activity blurb
};

const INITIAL_STATE: Record<PersonaId, PersonaState> = {
  family:   { status: "queued", currentShot: 0, completedShots: 0, failures: 0 },
  couple:   { status: "queued", currentShot: 0, completedShots: 0, failures: 0 },
  remote:   { status: "queued", currentShot: 0, completedShots: 0, failures: 0 },
  business: { status: "queued", currentShot: 0, completedShots: 0, failures: 0 },
};

type ConsoleLine = {
  id: number;
  level: "info" | "tool" | "ok" | "warn" | "muted";
  text: string;
};

export default function GeneratePage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId") ?? params.jobId;
  const listingName = searchParams.get("name") ?? "Bayview Retreat";

  const [personaStates, setPersonaStates] = useState(INITIAL_STATE);
  const [personaRows, setPersonaRows] = useState<PersonaRow[]>(() =>
    DEFAULT_ORDER.map((a) => ({ archetype: a, displayName: ARCHETYPE_FALLBACK_LABEL[a] }))
  );
  const [platform, setPlatform] = useState<Platform>(PLATFORMS[0]);
  const [toast, setToast] = useState<string>("");
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);

  // Pull bespoke personas the host selected on /dashboard/new.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem(`lemma:job:${params.jobId}`);
    if (!raw) return;
    try {
      const chosen = JSON.parse(raw) as Array<{
        archetype: PersonaId;
        name: string;
        desc?: string;
        why?: string;
      }>;
      if (Array.isArray(chosen) && chosen.length) {
        setPersonaRows(
          chosen.map((p) => ({
            archetype: p.archetype,
            displayName: p.name,
            brief: p.why || p.desc,
          }))
        );
      }
    } catch {
      /* fall through to defaults */
    }
  }, [params.jobId]);
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<"idle" | "running" | "done" | "error">("idle");
  const [totalTokens, setTotalTokens] = useState(0);
  const startedAtRef = useRef<number>(Date.now());
  const consoleRef = useRef<HTMLDivElement>(null);
  const lineIdRef = useRef(0);

  // -------- timer
  useEffect(() => {
    if (phase !== "running") return;
    const t = setInterval(() => {
      setElapsed((Date.now() - startedAtRef.current) / 1000);
    }, 100);
    return () => clearInterval(t);
  }, [phase]);

  // -------- auto-scroll console
  useEffect(() => {
    consoleRef.current?.scrollTo({ top: 9e9, behavior: "smooth" });
  }, [lines]);

  // -------- SSE subscription
  useEffect(() => {
    const url = `/api/generate/stream?listingId=${encodeURIComponent(listingId)}&name=${encodeURIComponent(listingName)}`;
    const es = new EventSource(url);
    startedAtRef.current = Date.now();
    setPhase("running");

    const pushLine = (level: ConsoleLine["level"], text: string) => {
      setLines((ls) => [...ls, { id: lineIdRef.current++, level, text }]);
    };

    es.addEventListener("agent", (e: MessageEvent) => {
      const ev = JSON.parse(e.data) as AgentEvent;
      handleEvent(ev, setPersonaStates, pushLine, setTotalTokens);
    });

    es.addEventListener("done", () => {
      setPhase("done");
      es.close();
      // No auto-redirect — the user clicks "Open booking page" themselves.
    });

    es.onerror = () => {
      pushLine("warn", "Connection error. The agent stopped streaming.");
      setPhase("error");
      es.close();
    };

    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, listingName]);

  return (
    <main className="min-h-screen relative grain text-bone">
      {/* Header */}
      <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.32em] text-bone/50">
            Director Agent
          </div>
          <h1 className="font-display text-3xl mt-1">
            {phase === "done" ? (
              <>Personas <em className="italic text-bone/80">delivered.</em></>
            ) : (
              <>Director agent <em className="italic text-bone/80">at work.</em></>
            )}
          </h1>
          <div className="text-xs text-bone/40 mt-1">{listingName}</div>
        </div>
        <div className="flex items-center gap-6">
          {phase === "done" && (
            <a
              href="#embed"
              className="text-[10px] uppercase tracking-[0.24em] px-3 py-1.5 rounded-full bg-cream text-ink hover:bg-white transition"
            >
              Get embed code →
            </a>
          )}
          <Stat label="elapsed" value={`${elapsed.toFixed(1)}s`} />
          <Stat label="tokens" value={fmtTokens(totalTokens)} />
          <span
            className={`text-[10px] uppercase tracking-[0.24em] px-3 py-1.5 rounded-full ring-1 ${
              phase === "done"
                ? "bg-emerald-500/10 ring-emerald-400/40 text-emerald-200"
                : phase === "error"
                ? "bg-red-500/10 ring-red-400/40 text-red-200"
                : "bg-cream/5 ring-cream/30 text-cream"
            }`}
          >
            {phase === "running" && "● live"}
            {phase === "done" && "✓ done"}
            {phase === "error" && "✗ error"}
            {phase === "idle" && "starting"}
          </span>
        </div>
      </header>

      {/* Format / share toolbar */}
      <section className="px-8 pt-8 pb-3 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="text-[10px] uppercase tracking-[0.32em] text-bone/40">
            Reframe & share
          </div>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const on = platform.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p)}
                  className={`px-3 py-1.5 rounded-full text-[11px] tracking-wide ring-1 transition ${
                    on
                      ? "bg-cream text-ink ring-cream"
                      : "ring-bone/20 text-bone/70 hover:text-cream hover:ring-bone/40"
                  }`}
                >
                  {p.label}
                  <span className={`ml-2 text-[9px] ${on ? "text-ink/60" : "text-bone/40"}`}>
                    {p.short}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Persona tracks */}
      <section className="px-8 pt-3 pb-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {personaRows.map((row) => (
            <PersonaTrack
              key={row.archetype}
              id={row.archetype}
              displayName={row.displayName}
              brief={row.brief}
              state={personaStates[row.archetype]}
              platform={platform}
              listingName={listingName}
              onShared={(msg) => setToast(msg)}
              onExpand={(url, title) => setLightbox({ url, title })}
            />
          ))}
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-cream text-ink text-xs shadow-lg"
          onAnimationEnd={() => setToast("")}
        >
          {toast}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-8 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[min(1100px,90vw)] max-h-[88vh]"
          >
            <video
              src={lightbox.url}
              autoPlay
              loop
              controls
              playsInline
              className="max-h-[88vh] max-w-full rounded-xl shadow-2xl"
            />
            <div className="absolute -top-8 left-0 text-xs uppercase tracking-[0.28em] text-bone/70">
              {lightbox.title}
            </div>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-bone/60 hover:text-cream text-sm"
              aria-label="Close"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

      {/* Embed code */}
      {phase === "done" && (
        <EmbedSection
          listingId={listingId}
          onCopied={() => setToast("Embed code copied")}
        />
      )}

      {/* Reasoning console */}
      <section className="px-8 pb-16 max-w-7xl mx-auto">
        <div className="text-[10px] uppercase tracking-[0.32em] text-bone/40 mb-3">
          Reasoning trace
        </div>
        <div
          ref={consoleRef}
          className="rounded-2xl bg-black/70 ring-1 ring-bone/10 p-6 md:p-8 font-mono text-[12.5px] leading-[1.85] h-[420px] overflow-y-auto"
        >
          {lines.length === 0 && (
            <div className="text-bone/40 italic">› waking up the director…</div>
          )}
          {lines.map((l) => (
            <div key={l.id} className={lineColor(l.level)}>
              {l.text}
            </div>
          ))}
          {phase === "running" && <Cursor />}
        </div>
      </section>
    </main>
  );
}

// =========================================================================
// Components
// =========================================================================

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-[9px] uppercase tracking-[0.28em] text-bone/40">{label}</div>
      <div className="font-mono text-sm text-cream tabular-nums">{value}</div>
    </div>
  );
}

function PersonaTrack({
  id,
  displayName,
  brief,
  state,
  platform,
  listingName,
  onShared,
  onExpand,
}: {
  id: PersonaId;
  displayName: string;
  brief?: string;
  state: PersonaState;
  platform: Platform;
  listingName: string;
  onShared: (msg: string) => void;
  onExpand: (url: string, title: string) => void;
}) {
  const isActive = state.status !== "queued" && state.status !== "done";
  const isDone = state.status === "done";

  async function handleShare() {
    if (!state.videoUrl) return;
    const caption = `${listingName} — for ${displayName}.${brief ? "\n\n" + brief : ""}\n\n#lemma #stayfilm`;

    // Try the native share sheet first (mobile / Safari) — picks up TikTok,
    // IG, etc. as share targets directly.
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `${displayName} · ${listingName}`,
          text: caption,
          url: state.videoUrl,
        });
        onShared(`Shared via system sheet`);
        return;
      } catch {
        /* user cancelled or unsupported — fall through */
      }
    }

    // Desktop fallback: copy caption to clipboard, open the platform's
    // upload flow in a new tab. Host pastes caption + uploads the file.
    try {
      await navigator.clipboard.writeText(caption);
    } catch {}
    if (platform.uploadUrl) {
      window.open(platform.uploadUrl, "_blank", "noopener,noreferrer");
      onShared(`Caption copied · opening ${platform.label}`);
    } else {
      onShared(`Caption copied to clipboard`);
    }
  }

  return (
    <div
      className={`relative rounded-2xl ring-1 p-5 transition-colors ${
        isDone
          ? "ring-emerald-400/30 bg-emerald-500/5"
          : isActive
          ? "ring-cream/30 bg-cream/[0.03]"
          : "ring-bone/10 bg-black/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[9px] uppercase tracking-[0.24em] text-cream/55 mb-1">
            {ARCHETYPE_FALLBACK_LABEL[id]} archetype
          </div>
          <div className="font-display text-[19px] leading-[1.15] text-cream">
            {displayName}
          </div>
        </div>
        <StatusBadge state={state} />
      </div>
      {brief && (
        <div className="mt-2.5 text-[11px] italic text-bone/60 line-clamp-2 leading-snug">
          {brief}
        </div>
      )}

      {/* Video preview / placeholder */}
      <div
        onClick={() => state.videoUrl && onExpand(state.videoUrl, `${displayName} · ${listingName}`)}
        className={`mt-4 ${RATIO_CLASS[platform.ratio]} rounded-lg overflow-hidden bg-black/60 ring-1 ring-white/5 relative group ${
          state.videoUrl ? "cursor-zoom-in" : ""
        }`}
      >
        {state.videoUrl ? (
          <>
            <video
              src={state.videoUrl}
              className="w-full h-full object-cover pointer-events-none"
              autoPlay
              muted
              loop
              playsInline
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
              <div className="px-3 py-1.5 rounded-full bg-cream/95 text-ink text-[10px] uppercase tracking-[0.22em] flex items-center gap-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9"/>
                  <polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/>
                  <line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
                Expand
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-bone/30 text-[10px] uppercase tracking-[0.28em]">
            {state.status === "queued" ? "queued" : `shot ${state.currentShot + 1} / ${SHOTS_PER_PERSONA}`}
          </div>
        )}
        {isActive && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cream animate-pulse" />
        )}
      </div>

      {/* Shot progress dots */}
      <div className="flex gap-1.5 mt-4">
        {Array.from({ length: SHOTS_PER_PERSONA }).map((_, i) => {
          const filled = i < state.completedShots;
          const current = i === state.currentShot && isActive;
          return (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full ${
                filled
                  ? "bg-cream"
                  : current
                  ? "bg-cream/40 animate-pulse"
                  : "bg-bone/10"
              }`}
            />
          );
        })}
      </div>

      <div className="mt-3 text-[11px] text-bone/50 min-h-[16px] truncate">
        {state.hint ?? statusHint(state.status)}
      </div>

      {state.failures > 0 && (
        <div className="mt-1 text-[10px] text-amber-300/70">
          {state.failures} qa retry · self-corrected
        </div>
      )}

      {state.videoUrl && (
        <button
          onClick={handleShare}
          className="mt-3 w-full px-3 py-2 rounded-full bg-cream text-ink text-[11px] font-medium tracking-wide hover:bg-white transition flex items-center justify-center gap-1.5"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          Share to {platform.label}
        </button>
      )}
    </div>
  );
}

function StatusBadge({ state }: { state: PersonaState }) {
  const map: Record<PersonaState["status"], { text: string; cls: string }> = {
    queued:    { text: "queued",    cls: "bg-bone/5 text-bone/40" },
    briefing:  { text: "brief",     cls: "bg-cream/10 text-cream" },
    scripting: { text: "script",    cls: "bg-cream/10 text-cream" },
    rendering: { text: "rendering", cls: "bg-cream/10 text-cream" },
    done:      { text: "ready",     cls: "bg-emerald-500/15 text-emerald-200" },
  };
  const m = map[state.status];
  return (
    <span className={`text-[9px] uppercase tracking-[0.24em] px-2 py-0.5 rounded-full ${m.cls}`}>
      {m.text}
    </span>
  );
}

function Cursor() {
  return <span className="inline-block w-2 h-4 bg-cream/80 align-middle ml-1 animate-pulse" />;
}

// =========================================================================
// Embed section — shown after generation completes. Gives the host the
// one-line <script> tag and per-platform paste instructions (PRD §4.5).
// =========================================================================

const EMBED_PLATFORMS = [
  {
    id: "html",
    label: "Custom HTML",
    instr: "Paste anywhere inside your <body>. Loads async.",
  },
  {
    id: "hostaway",
    label: "Hostaway",
    instr: "Listing → Settings → Custom HTML → paste in the Hero block.",
  },
  {
    id: "lodgify",
    label: "Lodgify",
    instr: "Website Editor → Add Section → HTML/Embed → paste.",
  },
  {
    id: "wordpress",
    label: "WordPress",
    instr: "Add a Custom HTML block to your listing page and paste.",
  },
];

function EmbedSection({
  listingId,
  onCopied,
}: {
  listingId: string;
  onCopied: () => void;
}) {
  const [tab, setTab] = useState(EMBED_PLATFORMS[0].id);
  const snippet = `<!-- Lemma adaptive video widget -->\n<script src="https://lemma.app/widget.js"\n        data-listing-id="${listingId}"\n        data-position="hero"\n        async></script>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      onCopied();
    } catch {
      /* clipboard blocked — silently noop */
    }
  }

  const active = EMBED_PLATFORMS.find((p) => p.id === tab) ?? EMBED_PLATFORMS[0];

  return (
    <section id="embed" className="px-8 pb-10 max-w-7xl mx-auto scroll-mt-24">
      <div className="rounded-2xl ring-1 ring-cream/15 bg-cream/[0.02] p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-cream/60 mb-1.5">
              Embed in 60 seconds
            </div>
            <h2 className="font-display text-2xl md:text-3xl">
              One line of code. <em className="italic text-bone/70">That's it.</em>
            </h2>
          </div>
          <button
            onClick={copy}
            className="px-4 py-2 rounded-full bg-cream text-ink text-[11px] font-medium tracking-wide hover:bg-white transition flex items-center gap-1.5"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy snippet
          </button>
        </div>

        {/* Platform tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {EMBED_PLATFORMS.map((p) => {
            const on = p.id === tab;
            return (
              <button
                key={p.id}
                onClick={() => setTab(p.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] tracking-wide ring-1 transition ${
                  on
                    ? "bg-cream/15 ring-cream/40 text-cream"
                    : "ring-bone/15 text-bone/55 hover:text-cream hover:ring-bone/35"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Snippet */}
        <pre className="rounded-xl bg-black/70 ring-1 ring-bone/10 p-5 md:p-6 font-mono text-[12.5px] leading-[1.85] overflow-x-auto whitespace-pre text-bone/85">
{snippet}
        </pre>

        <div className="mt-4 text-xs text-bone/55 leading-relaxed">
          <span className="text-cream/80">{active.label}:</span> {active.instr}
        </div>
      </div>
    </section>
  );
}

// =========================================================================
// Event handling
// =========================================================================

function handleEvent(
  ev: AgentEvent,
  setPersonaStates: React.Dispatch<React.SetStateAction<typeof INITIAL_STATE>>,
  pushLine: (level: ConsoleLine["level"], text: string) => void,
  setTotalTokens: React.Dispatch<React.SetStateAction<number>>
) {
  switch (ev.type) {
    case "session_start":
      pushLine("muted", `▶ session started · personas=${ev.personas.join(", ")}`);
      break;

    case "tool_start":
      pushLine(
        "tool",
        `→ ${ev.tool}(${formatArgs(ev.args)})${ev.persona ? ` · ${ev.persona}${ev.shotIndex !== undefined ? `:${ev.shotIndex}` : ""}` : ""}`
      );
      if (ev.persona) {
        setPersonaStates((s) => updateOnToolStart(s, ev.persona!, ev.tool, ev.shotIndex));
      }
      break;

    case "tool_end":
      if (ev.ok) {
        pushLine("ok", `✓ ${ev.tool}${ev.persona ? ` · ${ev.persona}` : ""}`);
        if (ev.persona) {
          setPersonaStates((s) => updateOnToolEnd(s, ev.persona!, ev.tool, ev.result, ev.shotIndex));
        }
      } else {
        pushLine(
          "warn",
          `⚠ ${ev.tool} failed — ${ev.error}${ev.issues ? ` [${ev.issues.join("; ")}]` : ""}`
        );
        if (ev.persona) {
          setPersonaStates((s) => ({
            ...s,
            [ev.persona!]: { ...s[ev.persona!], failures: s[ev.persona!].failures + 1 },
          }));
        }
      }
      break;

    case "reasoning":
      pushLine("muted", `  💭 ${ev.text}`);
      break;

    case "persona_start":
      pushLine("info", `── ${ev.persona} pipeline started`);
      // Cached mp4 per archetype is known up-front — start playing it now while
      // brief/script/QA continue in the trace below. Don't make the host wait.
      setPersonaStates((s) => ({
        ...s,
        [ev.persona]: {
          ...s[ev.persona],
          status: "briefing",
          videoUrl: s[ev.persona].videoUrl ?? ARCHETYPE_VIDEO[ev.persona],
        },
      }));
      break;

    case "persona_done":
      pushLine("ok", `── ${ev.persona} ready · ${ev.shotsCount} shots`);
      setPersonaStates((s) => ({
        ...s,
        [ev.persona]: {
          ...s[ev.persona],
          status: "done",
          completedShots: SHOTS_PER_PERSONA,
          videoUrl: ev.videoUrl,
        },
      }));
      break;

    case "session_end":
      setTotalTokens(ev.totalTokens);
      pushLine("ok", `■ session complete · ${(ev.durationMs / 1000).toFixed(1)}s · ${fmtTokens(ev.totalTokens)} tokens`);
      break;

    case "error":
      pushLine("warn", `✗ error: ${ev.message}`);
      break;
  }
}

function updateOnToolStart(
  s: typeof INITIAL_STATE,
  persona: PersonaId,
  tool: string,
  shotIndex?: number
): typeof INITIAL_STATE {
  const cur = s[persona];
  const next: PersonaState = { ...cur };

  switch (tool) {
    case "generate_persona_brief":
      next.status = "briefing";
      next.hint = "Drafting the creative brief…";
      break;
    case "write_shot_script":
      next.status = "scripting";
      next.hint = "Choosing photos and writing 4 shots…";
      break;
    case "generate_video_shot":
      next.status = "rendering";
      next.currentShot = shotIndex ?? cur.currentShot;
      next.hint = `Rendering shot ${(shotIndex ?? 0) + 1}…`;
      break;
    case "concatenate_shots":
      next.hint = "Stitching shots into final cut…";
      break;
  }
  return { ...s, [persona]: next };
}

function updateOnToolEnd(
  s: typeof INITIAL_STATE,
  persona: PersonaId,
  tool: string,
  result: Record<string, unknown>,
  shotIndex?: number
): typeof INITIAL_STATE {
  const cur = s[persona];
  if (tool === "qa_check" && shotIndex !== undefined) {
    return {
      ...s,
      [persona]: {
        ...cur,
        completedShots: Math.max(cur.completedShots, shotIndex + 1),
      },
    };
  }
  return s;
}

// =========================================================================
// Helpers
// =========================================================================

function statusHint(status: PersonaState["status"]): string {
  switch (status) {
    case "queued": return "Waiting for the director…";
    case "briefing": return "Drafting brief";
    case "scripting": return "Writing shot script";
    case "rendering": return "Rendering shots";
    case "done": return "All four shots delivered";
  }
}

function formatArgs(args: Record<string, unknown>): string {
  const parts = Object.entries(args)
    .slice(0, 2)
    .map(([k, v]) => `${k}=${typeof v === "string" ? `"${v}"` : JSON.stringify(v)}`);
  return parts.join(", ");
}

function lineColor(level: ConsoleLine["level"]): string {
  switch (level) {
    case "tool":  return "text-cream";
    case "ok":    return "text-emerald-300/85";
    case "warn":  return "text-amber-300/85";
    case "info":  return "text-bone/70";
    case "muted": return "text-bone/45";
  }
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}
