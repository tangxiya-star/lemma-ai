// End-to-end smoke test for the Director Agent.
// Run: npx tsx --env-file=.env.local scripts/test-director.ts
//
// Prints the agent event stream as a terminal trace, exactly the way the
// reasoning console in the dashboard will render it.

import { runDirector } from "../lib/agent/director";
import { BAYVIEW_PHOTOS } from "../lib/personas";

async function main() {
  const t0 = Date.now();

  for await (const event of runDirector({
    listingId: "bayview-001",
    listingName: "Bayview Retreat",
    photos: BAYVIEW_PHOTOS,
    personas: ["family", "couple", "remote", "business"],
  })) {
    const t = ((event.ts - t0) / 1000).toFixed(1).padStart(5);
    print(t, event);
  }
}

function print(t: string, e: any) {
  switch (e.type) {
    case "session_start":
      console.log(`[${t}s] ▶ session_start  listing=${e.listingId} personas=[${e.personas.join(", ")}]`);
      break;
    case "tool_start":
      console.log(`[${t}s] → ${e.tool}${e.persona ? ` (${e.persona}${e.shotIndex !== undefined ? `:${e.shotIndex}` : ""})` : ""}  ${JSON.stringify(e.args)}`);
      break;
    case "tool_end":
      if (e.ok) {
        console.log(`[${t}s] ✓ ${e.tool}${e.persona ? ` (${e.persona}${e.shotIndex !== undefined ? `:${e.shotIndex}` : ""})` : ""}`);
      } else {
        console.log(`[${t}s] ✗ ${e.tool}${e.persona ? ` (${e.persona}${e.shotIndex !== undefined ? `:${e.shotIndex}` : ""})` : ""}  ${e.error}${e.issues ? ` [${e.issues.join("; ")}]` : ""}`);
      }
      break;
    case "reasoning":
      console.log(`[${t}s]   💭 ${e.text}`);
      break;
    case "persona_start":
      console.log(`[${t}s] ── persona_start ${e.persona}`);
      break;
    case "persona_done":
      console.log(`[${t}s] ── persona_done  ${e.persona}  → ${e.videoUrl}`);
      break;
    case "session_end":
      console.log(`[${t}s] ■ session_end  ${(e.durationMs / 1000).toFixed(1)}s  tokens=${e.totalTokens}`);
      break;
    case "error":
      console.log(`[${t}s] ✗ ERROR  ${e.message}`);
      break;
  }
}

main().catch((err) => {
  console.error("✗", err);
  process.exit(1);
});
