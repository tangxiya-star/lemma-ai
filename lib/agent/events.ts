// Director Agent event protocol — what the SSE stream sends to the client.
// Each event is a discriminated union so the UI can render distinct components
// for tool calls, reasoning, errors, etc.

import type { PersonaId } from "../personas";

export type AgentEvent =
  | { type: "session_start"; listingId: string; personas: PersonaId[]; ts: number }
  | { type: "reasoning"; text: string; ts: number }
  | {
      type: "tool_start";
      tool: string;
      args: Record<string, unknown>;
      persona?: PersonaId;
      shotIndex?: number;
      ts: number;
    }
  | {
      type: "tool_end";
      tool: string;
      ok: true;
      result: Record<string, unknown>;
      persona?: PersonaId;
      shotIndex?: number;
      ts: number;
    }
  | {
      type: "tool_end";
      tool: string;
      ok: false;
      error: string;
      issues?: string[];
      persona?: PersonaId;
      shotIndex?: number;
      ts: number;
    }
  | { type: "persona_start"; persona: PersonaId; ts: number }
  | {
      type: "persona_done";
      persona: PersonaId;
      videoUrl: string;
      shotsCount: number;
      ts: number;
    }
  | { type: "session_end"; durationMs: number; totalTokens: number; ts: number }
  | { type: "error"; message: string; ts: number };
