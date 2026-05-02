// Demo-time mock for Seedance video generation.
//
// Why this exists:
//   The Director Agent's reasoning loop (analyze → brief → script → render → QA)
//   should run *live* in front of judges so they see real tool use. But each real
//   Seedance call takes 100-160s — way too long for a 60s pitch. So during demo
//   we swap the actual Seedance call with this mock, which:
//     1. Returns a pre-rendered video URL from public/demo-videos/
//     2. Pretends to take ~2s so the trace feels real, not instant
//     3. Optionally fails the first attempt for a given shot to demonstrate
//        the agent's QA self-correction (Director Agent's "killer detail")
//
// Production toggles back to the real client via USE_MOCK_SEEDANCE=false.

import { generateShot as realGenerateShot } from "./client";
import type { GenerateShotInput, GenerateShotResult } from "./client";
import type { PersonaId } from "../personas";

const MOCK_LATENCY_MS = 600;

const PERSONA_VIDEO: Record<PersonaId, string> = {
  family: "/demo-videos/family.mp4",
  couple: "/demo-videos/couple.mp4",
  remote: "/demo-videos/remote.mp4",
  business: "/demo-videos/business.mp4",
};

// Tracks which (persona, shot) pairs have already failed once, so we only
// fake-fail each one a single time during a demo run.
const failedOnce = new Set<string>();

export type MockGenerateShotInput = GenerateShotInput & {
  persona: PersonaId;
  shotIndex: number;       // 0-3, used to decide which shot scripts a fake QA failure
  scriptedFailShot?: number; // which shot index should fail-then-recover (default: 1)
};

export class QaFailedError extends Error {
  constructor(public readonly issues: string[]) {
    super(`QA failed: ${issues.join("; ")}`);
    this.name = "QaFailedError";
  }
}

export async function mockGenerateShot(
  input: MockGenerateShotInput
): Promise<GenerateShotResult> {
  const failShot = input.scriptedFailShot ?? 1;
  const failKey = `${input.persona}:${failShot}`;

  await sleep(MOCK_LATENCY_MS);

  // Scripted failure: first time this shot is attempted, throw a QA-style error.
  // The agent's outer loop should catch and retry — second attempt succeeds.
  if (input.shotIndex === failShot && !failedOnce.has(failKey)) {
    failedOnce.add(failKey);
    throw new QaFailedError([
      "lighting drift between reference and output",
      "camera motion exceeds direction",
    ]);
  }

  return {
    videoUrl: PERSONA_VIDEO[input.persona],
    durationSeconds: input.duration ?? 5,
    resolution: input.resolution ?? "720p",
    aspectRatio: input.aspectRatio ?? "16:9",
    taskId: `mock-${input.persona}-${input.shotIndex}-${Date.now()}`,
    totalTokens: 108_900, // matches what fast variant actually returned in our tests
  };
}

// Routes between real and mock based on env. Default: mock during dev / demo.
export async function generateShotForDemo(
  input: MockGenerateShotInput
): Promise<GenerateShotResult> {
  const useMock = process.env.USE_MOCK_SEEDANCE !== "false";
  if (useMock) return mockGenerateShot(input);
  return realGenerateShot(input);
}

// Reset the scripted-failure memory between demo runs (e.g. when "regenerate" is clicked).
export function resetMockState() {
  failedOnce.clear();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
