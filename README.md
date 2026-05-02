# Lemma

Persona-aware video generation for short-term rental hosts.

## Run

```bash
npm install
npm run dev
```

Then open:

- http://localhost:3000/dashboard — host uploads listing, generates persona videos, copies embed
- http://localhost:3000/demo-listing — direct booking page with widget mounted
- http://localhost:3000/widget.js — embeddable widget script
- http://localhost:3000/api/generate — mocked Director Agent pipeline

## Demo flow

1. Visit `/dashboard`, name the listing, click **Generate Persona Videos**.
2. Copy the embed snippet.
3. Visit `/demo-listing` — the widget pops up asking who's traveling, then plays the matching video.
