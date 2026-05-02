// Demo listings shown in the host dashboard. In production these come from
// Butterbase (`listings` table). Bayview Retreat is the only listing wired to
// real Butterbase data; the others are placeholders for the IA / multi-listing
// demo so judges see a populated host dashboard, not a single row.

// Unsplash covers chosen to evoke each listing's region (Mendocino coast,
// Bolinas cliff, Russian River redwoods). Swap for real Butterbase S3 URLs
// once each listing has its own photo set.
const COVER_BAYVIEW =
  "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200&q=80"; // Mendocino-style cliff coast
const COVER_CLIFF_HOUSE =
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80"; // Bolinas-style coastal cliff
const COVER_NORTH_CABIN =
  "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1200&q=80"; // Russian River redwood cabin

export type ListingCard = {
  id: string;
  butterbaseId?: string; // present only if the listing exists in Butterbase
  name: string;
  location: string;
  cover: string;
  status: "ready" | "draft";
  filmCount: number;
  vibe: string;
  price: number;
};

export const ownedListings: ListingCard[] = [
  {
    id: "bayview",
    butterbaseId: "ea1e48cd-bfec-40ce-8102-8c9c0a281851",
    name: "Bayview Retreat",
    location: "Mendocino, CA",
    cover: COVER_BAYVIEW,
    status: "ready",
    filmCount: 4,
    vibe: "calm_minimal",
    price: 284,
  },
  {
    id: "cliff-house",
    name: "Cliff House Marin",
    location: "Bolinas, CA",
    cover: COVER_CLIFF_HOUSE,
    status: "ready",
    filmCount: 4,
    vibe: "coastal_warm",
    price: 412,
  },
  {
    id: "russian-river",
    name: "The North Cabin",
    location: "Russian River, CA",
    cover: COVER_NORTH_CABIN,
    status: "draft",
    filmCount: 0,
    vibe: "—",
    price: 198,
  },
];

export function findListing(id: string): ListingCard | undefined {
  return ownedListings.find((l) => l.id === id);
}
