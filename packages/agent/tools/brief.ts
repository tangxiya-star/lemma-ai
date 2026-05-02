import { zaiChat } from "../../zai/client";

export type Persona = "family" | "solo" | "couple" | "business";

export interface ListingAnalysis {
  rooms: string[];
  features: string[];
  vibe: string;
  lighting: string;
  family_friendly: boolean;
  has_workspace: boolean;
  has_outdoor_space: boolean;
}

export interface PersonaBrief {
  angle: string;
  tone: string;
  must_show: string[];
  avoid: string[];
  music_direction: string;
  voiceover_style: string;
}

const SYSTEM = `You are a creative director for short-term rental video ads.
Given a property's analyzed features and a target persona, write a tight
creative brief. Output strict JSON matching the requested schema.`;

export async function generatePersonaBrief(
  persona: Persona,
  analysis: ListingAnalysis
): Promise<PersonaBrief> {
  const user = `Persona: ${persona}
Listing analysis: ${JSON.stringify(analysis, null, 2)}

Return JSON with keys: angle, tone, must_show (array), avoid (array),
music_direction, voiceover_style.

Tailor must_show and avoid to the persona. A family brief should highlight
safety and space; a couple brief should highlight intimacy; a solo/remote
worker brief should highlight quiet and workspace; a business brief should
highlight productivity and reliability.`;

  return zaiChat<PersonaBrief>({
    system: SYSTEM,
    user,
    jsonSchema: {},
  });
}
