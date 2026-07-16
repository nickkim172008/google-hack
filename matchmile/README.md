# MatchMile — FIFA Matchday Navigator (Downtown Toronto)

**A matchday mobility copilot for World Cup fans.** Google Maps answers "how do I get from A to B?" MatchMile answers the question fans actually have: *when should we leave, which route avoids the crowd surge, and how do we get home if the match goes to extra time?*

Built for downtown Toronto around BMO Field: Union Station, King & Bay, and Liberty Village origins across three real corridors (King St W streetcar, GO Lakeshore West rail, Queens Quay / Martin Goodman Trail).

## Run it

```bash
npm install
npm run dev
```

Open the URL Next.js prints (usually http://localhost:3000; it auto-bumps to 3001 if 3000 is busy). Requires internet for OpenStreetMap tiles — nothing else. **No API keys, no accounts, no backend.**

## The demo

1. Build a plan (priority: **least crowded**) → MatchMile recommends the GO train route **even though it's 6 minutes slower**, and explains why in "Why this route?"
2. Press **`n`** — a transit alert hits the recommended route → watch the map rerank live, with an updated leave-by time and a "why this changed" explanation
3. Keep pressing **`n`**: kickoff → 89' tied 1–1 (two departure options prepared) → extra time (end time recalculated) → full-time (**staggered egress plan**: "station crowd risk HIGH for 25 min — wait at the fan zone, depart 9:55 PM")

**`b`** steps the replay back one event.

## What's real vs. replayed (honesty section)

- The event feed is a **deterministic scripted replay**, labeled "DEMO REPLAY" on screen at all times — we never fake liveness.
- Crowd risk is a **forecasted relative score with transparent reason factors**, not measured density. We never claim "live crowd density" or "guaranteed" anything.
- Routes, timings, and risk factors are hand-curated seed data (`data/seed.ts`) shaped exactly like the structured output a live routing + events pipeline would produce — the seeded layer is swappable for live services.

## Architecture

- **Next.js (App Router) + TypeScript + Tailwind** — single page, no backend
- **react-leaflet** full-screen map as the persistent canvas; all UI floats above it as glass panels, so the rerank is visible as route lines changing live
- **`data/seed.ts`** — every route, coordinate, risk factor, and event in one typed file
- **`lib/replay.ts`** — pure deterministic state derivation from the event index (same input → same demo, every time)

The recommendation logic is deliberately **deterministic and explainable** — no LLM ever invents a route, closure, or timing. Wrong travel advice at a mega-event is a real harm; every recommendation ships with its reasons.

## Team

Built at GDG Hacks 2026. Product spec: [`../project_idea.md`](../project_idea.md).
