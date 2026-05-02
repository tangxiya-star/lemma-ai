// Simple in-memory store. Persists across requests in dev.

export type Persona = {
  id: string;
  name: string;
  description: string;
  videoUrl: string;
  script: string;
  tagline: string;
};

export type Listing = {
  listingId: string;
  name: string;
  features: string[];
  vibe: string;
  personas: Persona[];
  createdAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __LEMMA_STORE__: Map<string, Listing> | undefined;
}

export const store: Map<string, Listing> =
  globalThis.__LEMMA_STORE__ ?? (globalThis.__LEMMA_STORE__ = new Map());

// Seed a demo listing so the widget works immediately.
if (!store.has("demo-123")) {
  store.set("demo-123", {
    listingId: "demo-123",
    name: "Bayview Retreat",
    features: ["natural_light", "workspace", "cozy_bed", "ocean_view"],
    vibe: "calm_minimal",
    createdAt: Date.now(),
    personas: defaultPersonas(),
  });
}

export function defaultPersonas(): Persona[] {
  // Real Seedance 2.0 outputs for the Bayview Retreat demo listing.
  // Generated locally tonight via scripts/test-personas.ts and cached in public/.
  const v1 = "/demo-videos/family.mp4";
  const v2 = "/demo-videos/couple.mp4";
  const v3 = "/demo-videos/remote.mp4";
  const v4 = "/demo-videos/business.mp4";
  return [
    {
      id: "family",
      name: "Family",
      tagline: "Room to roam, together.",
      description: "Spacious, safe, and full of memories waiting to happen.",
      videoUrl: v1,
      script:
        "Wake up to pancakes by the bay window. The kids have space to play, you have space to breathe.",
    },
    {
      id: "couple",
      name: "Couple",
      tagline: "A quiet escape for two.",
      description: "Soft light, slow mornings, and an ocean view to share.",
      videoUrl: v2,
      script:
        "Pour two glasses. Step onto the deck. Let the tide handle the schedule.",
    },
    {
      id: "remote",
      name: "Remote Worker",
      tagline: "Focus, with a view.",
      description: "A dedicated workspace, fast Wi-Fi, and natural light all day.",
      videoUrl: v3,
      script:
        "Standing desk by the window. Strong signal. Your most productive week starts here.",
    },
    {
      id: "business",
      name: "Business Traveler",
      tagline: "Effortless, every visit.",
      description: "Self check-in, blackout curtains, and a desk that means business.",
      videoUrl: v4,
      script:
        "Land, unlock, unwind. Pressed sheets, quiet floor, and coffee ready by 6.",
    },
  ];
}
