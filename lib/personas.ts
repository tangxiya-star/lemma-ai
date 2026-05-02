// Persona prompt templates for the Lemma Director Agent.
// These are the *cinematic direction* layer — separate from store.Persona which
// holds product-level metadata (name, tagline, copy). The agent composes a final
// shot prompt by combining this template with a per-shot scene description.

export type PersonaId = "family" | "couple" | "remote" | "business";

export type PersonaSpec = {
  id: PersonaId;
  name: string;

  // Cinematic direction
  mood: string;
  lighting: string;
  cameraStyle: string;
  pace: string;

  // Human presence policy — Seedance struggles with full faces at short durations.
  // Prefer "trace of human" over "human in frame".
  humanPresence:
    | "implied_traces"      // family: kid drawings, toys, breakfast plate
    | "silhouette_or_hands" // couple: hands holding wine glass, two pairs of slippers
    | "fresh_traces"        // remote: warm coffee, half-open laptop, recent footprint
    | "none";               // business: pristine, untouched

  do: string[];
  dont: string[];

  // Hero photo hint — used as the agent's default first-shot reference if it
  // doesn't have a stronger signal. Format: a substring of the photo file name.
  heroPhotoHint: string;
};

export const PERSONAS: Record<PersonaId, PersonaSpec> = {
  family: {
    id: "family",
    name: "Family",
    mood: "warm, safe, full of small joys",
    lighting: "soft golden morning light, gentle window glow",
    cameraStyle: "wide stable framing, slow dolly forward, occasional gentle pan",
    pace: "unhurried, lived-in",
    humanPresence: "implied_traces",
    do: [
      "show spaciousness — wide shots, open floor",
      "include traces of family life: a child's drawing on the fridge, plush toy on the sofa, breakfast plate half eaten",
      "natural daylight; warm color grade",
    ],
    dont: [
      "no full human faces in frame",
      "no fast cuts or jittery motion",
      "no moody / dark / nightclub atmosphere",
    ],
    heroPhotoHint: "IMG_4412", // sofa + plant + big windows: family living room
  },

  couple: {
    id: "couple",
    name: "Couple",
    mood: "intimate, slow, romantic escape",
    lighting: "low golden-hour warmth, candlelight tones, soft window backlight",
    cameraStyle: "shallow depth of field, slow push-in, gentle handheld",
    pace: "slow, sensual",
    humanPresence: "silhouette_or_hands",
    do: [
      "two of everything: two wine glasses, two coffee cups, two pairs of slippers",
      "hands or silhouettes only — never faces",
      "warm tactile textures: linen, wood, ceramic",
    ],
    dont: [
      "no children, no toys, no clutter",
      "no harsh overhead lighting",
      "no kitchen-as-utility shots",
    ],
    heroPhotoHint: "IMG_4449", // sofa with warm window light: couple-friendly
  },

  remote: {
    id: "remote",
    name: "Remote Worker",
    mood: "calm, focused, restorative",
    lighting: "even diffuse natural daylight, no drama",
    cameraStyle: "static or extremely slow drift, locked-off frames",
    pace: "still, meditative",
    humanPresence: "fresh_traces",
    do: [
      "show 'someone was just here': steam rising from coffee, half-open laptop, notebook with a pen on it",
      "emphasize quiet and natural light",
      "include workspace cues: desk, chair, strong wifi-feeling signal of order",
    ],
    dont: [
      "no people in frame",
      "no nightlife / party / family scenes",
      "no fast camera moves",
    ],
    heroPhotoHint: "IMG_4437", // counter with coffee maker + plant: workspace-adjacent
  },

  business: {
    id: "business",
    name: "Business Traveler",
    mood: "efficient, premium, frictionless",
    lighting: "clean cool daylight or crisp evening interior light",
    cameraStyle: "precise locked frames, architectural composition, minimal movement",
    pace: "crisp, deliberate",
    humanPresence: "none",
    do: [
      "pristine, untouched surfaces",
      "show convenience: in-unit laundry, fast self check-in vibes, blackout curtains",
      "minimalist, hotel-like styling",
    ],
    dont: [
      "no clutter, no personal items, no warmth-overload",
      "no children, couples, or workspace coffee mugs",
      "no shaky camera",
    ],
    heroPhotoHint: "IMG_4442", // clean kitchen with window: efficient minimal
  },
};

// Bayview Retreat sample photo set — used by the agent and test scripts.
export const BAYVIEW_PHOTOS = [
  { name: "IMG_4382.jpg", url: airbnb("0609000d-b3f8-40ac-a563-104ab2182867"), tag: "kitchenware" },
  { name: "IMG_4391.jpg", url: airbnb("091631a4-7baa-48a2-aa21-f6acf3844dd0"), tag: "tv_corner" },
  { name: "IMG_4407.jpg", url: airbnb("0a5f395f-2db9-4d9d-a807-452e440c9c2b"), tag: "shower_bath" },
  { name: "IMG_4412.jpg", url: airbnb("1f5b6a20-a368-4609-a1b3-bc7b8e69f1c5"), tag: "living_room_wide" },
  { name: "IMG_4418.jpg", url: airbnb("217b792d-daba-4f0d-97ed-74631e327c0e"), tag: "laundry" },
  { name: "IMG_4425.jpg", url: airbnb("2c3425fc-5184-45d8-b335-cd5842e290c8"), tag: "vanity" },
  { name: "IMG_4431.jpg", url: airbnb("320b29b0-f0bd-4afe-ad94-c6437371f528"), tag: "art_wall" },
  { name: "IMG_4437.jpg", url: airbnb("405069b5-f2b5-43ab-a9eb-3aa16ff2c20c"), tag: "coffee_corner" },
  { name: "IMG_4442.jpg", url: airbnb("492e3595-6aee-454d-aafd-df2ef1b1b5e5"), tag: "kitchen_clean" },
  { name: "IMG_4449.jpg", url: airbnb("5679b926-bceb-4af5-b912-c9847bb8444a"), tag: "living_room_warm" },
];

function airbnb(id: string): string {
  return `https://a0.muscache.com/im/pictures/hosting/Hosting-1313306687285416653/original/${id}.jpeg?im_w=720`;
}

// Listing-level metadata for Bayview Retreat. The Director Agent reads this
// alongside photo analysis to propose target personas — description text and
// amenity tags are the highest-quality signal a host curates themselves on
// Airbnb / Hostaway / Lodgify.
export const BAYVIEW_LISTING = {
  name: "Bayview Retreat",
  location: "Mendocino, California",
  description:
    "A quiet bayfront retreat tucked into the Mendocino cliffs. Wake up to sunlight on the bay, work from the daylit corner, and end the day by the fireplace. Hotel-grade linens, fast Wi-Fi, and a fully-equipped kitchen. Ideal for a slow weekend, a focused work week, or a low-key family stay.",
  amenities: [
    "ocean_view",
    "fireplace",
    "fast_wifi",
    "workspace_desk",
    "in_unit_laundry",
    "fully_equipped_kitchen",
    "blackout_curtains",
    "self_check_in",
    "hotel_linens",
    "free_parking",
  ],
};

export function findPhoto(hint: string) {
  return BAYVIEW_PHOTOS.find((p) => p.name.startsWith(hint));
}

// Compose a shot prompt from persona spec + scene-specific direction.
export function composeShotPrompt(
  persona: PersonaSpec,
  scene: { description: string; cameraOverride?: string }
): string {
  const camera = scene.cameraOverride ?? persona.cameraStyle;
  return [
    scene.description,
    `Mood: ${persona.mood}.`,
    `Lighting: ${persona.lighting}.`,
    `Camera: ${camera}.`,
    `Pace: ${persona.pace}.`,
    presenceLine(persona.humanPresence),
  ].join(" ");
}

function presenceLine(p: PersonaSpec["humanPresence"]): string {
  // Note: humanPresence is a hint about WHEN people appear in the narrative.
  // The specific characters (ethnicity, age, dress) are locked at the shot
  // description layer — see scripts/rebuild-with-consistency.ts. We never
  // invent props or amenities, but people are permitted as aspirational
  // marketing figures (industry standard for hospitality).
  switch (p) {
    case "implied_traces":
      return "Show the people described in the scene naturally and warmly.";
    case "silhouette_or_hands":
      return "Show the couple described in the scene; capture them tenderly, no awkward poses.";
    case "fresh_traces":
      return "Show the solo person described in the scene focused and at ease, alone in the space.";
    case "none":
      return "No people in this shot — pristine, untouched space.";
  }
}
