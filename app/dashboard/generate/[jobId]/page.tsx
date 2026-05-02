"use client";

// Generation screen — the "agent at work" view.
// Subscribes to /api/generate/stream via SSE and renders a live reasoning trace.
// PRD §4.4 — this is the demo's hero screen during 0:18-0:35.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import type { AgentEvent } from "@/lib/agent/events";
import type { PersonaId } from "@/lib/personas";

const PERSONA_ORDER: PersonaId[] = ["family", "couple", "remote", "business"];
const PERSONA_LABEL: Record<PersonaId, string> = {
  family: "Family",
  couple: "Couple",
  remote: "Remote Worker",
  business: "Business",
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

      {/* Persona tracks */}
      <section className="px-8 pt-8 pb-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PERSONA_ORDER.map((id) => (
            <PersonaTrack key={id} id={id} state={personaStates[id]} />
          ))}
        </div>
      </section>

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

function PersonaTrack({ id, state }: { id: PersonaId; state: PersonaState }) {
  const isActive = state.status !== "queued" && state.status !== "done";
  const isDone = state.status === "done";

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
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.28em] text-bone/60">
          {PERSONA_LABEL[id]}
        </div>
        <StatusBadge state={state} />
      </div>

      {/* Video preview / placeholder */}
      <div className="mt-4 aspect-video rounded-lg overflow-hidden bg-black/60 ring-1 ring-white/5 relative">
        {isDone && state.videoUrl ? (
          <video
            src={state.videoUrl}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
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
      setPersonaStates((s) => ({ ...s, [ev.persona]: { ...s[ev.persona], status: "briefing" } }));
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
