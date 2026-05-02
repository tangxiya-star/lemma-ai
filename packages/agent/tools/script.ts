import { zaiChat } from "../../zai/client";
import type { PersonaBrief } from "./brief";

export interface Shot {
  index: number;
  reference_photo: string;
  duration_seconds: number;
  camera: string;
  description: string;
  voiceover: string;
}

export interface ShotScript {
  shots: Shot[];
}

const SYSTEM = `You are a cinematographer writing shot lists for short
property videos. Each video has exactly 4 shots, 6-8 seconds each.
Each shot picks one reference photo from the available list and describes
camera movement, scene action, and a one-line voiceover. Output strict JSON.`;

export async function writeShotScript(
  brief: PersonaBrief,
  availablePhotos: string[]
): Promise<ShotScript> {
  const user = `Brief: ${JSON.stringify(brief, null, 2)}

Available photos (URLs):
${availablePhotos.map((u, i) => `[${i}] ${u}`).join("\n")}

Produce 4 shots that together tell the persona's story.
Return JSON: { "shots": [{ "index", "reference_photo", "duration_seconds",
"camera", "description", "voiceover" }, ...] }

Camera direction examples: "slow dolly forward", "static wide", "handheld
follow", "crane down to eye level". Match the brief's tone.`;

  return zaiChat<ShotScript>({
    system: SYSTEM,
    user,
    jsonSchema: {},
  });
}
