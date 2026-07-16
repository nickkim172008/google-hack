# MatchMile — FIFA Matchday Navigator (Downtown Toronto)

**Document purpose:** Product and engineering spec for the hackathon build — what we are actually shipping.

**Version:** 2.0 (hackathon build — supersedes the v1.0 multi-city platform spec, preserved in git history at commit `90ca8f0`)
**Scope:** Downtown Toronto only — the corridor around BMO Field (Union Station ↔ Exhibition Place)
**Stack:** Single Next.js app, react-leaflet, seeded data, no backend

---

## 1. One-sentence pitch

**MatchMile is a FIFA matchday mobility copilot for downtown Toronto that recommends when and how fans should travel to BMO Field, adapting the plan to crowd-risk forecasts, transit disruptions, and the live state of the match.**

It does not just return directions. It returns a matchday plan:

- The best time to leave
- The best route for the user's priority (not necessarily the fastest)
- Estimated relative crowd risk, with reasons
- A fallback route
- A post-match departure plan that reacts to extra time and full-time

## 2. Problem statement

World Cup fans in Toronto will be unfamiliar with local transit, matchday closures, and crowd behavior around BMO Field. The real fan question is not "how do I get from A to B?" — it is:

> I'm staying downtown, attending tonight's match, traveling with my family, need limited walking, and want to avoid the largest crowd surge. When should we leave, which route is best, and how do we get back if the match goes to extra time?

## 3. Scope

### In scope (this build)

- **Geography:** downtown Toronto only — Union Station / King & Bay / Liberty Village → BMO Field, via the King St W streetcar corridor, the Lakeshore West rail corridor (Union → Exhibition GO), and the Queens Quay / Martin Goodman Trail
- **One match:** Canada vs Italy, BMO Field, 7:30 PM kickoff (demo fixture)
- Route recommendation with explainable crowd-risk scoring (seeded)
- Scripted match-event replay: transit alert → rerank, kickoff, 89' tied, extra time, full-time → staggered egress plan
- Honest "DEMO REPLAY" labeling at all times

### Out of scope (cut from v1.0)

- Multi-city support / city adapters (future roadmap only)
- Any backend (FastAPI, PostgreSQL, Redis, WebSockets) — none exists
- Live routing APIs (Mapbox/Google), GTFS feeds, weather, real transit alerts
- Accounts, notifications, deployment pipeline, ML models

## 4. Architecture (as built)

```text
data/seed.ts  — single hand-curated file: match, origins, venue,
   |            3 routes (steps, polylines, risk factors), event timeline
   v
Replay controller — React state; keyboard `n` advances / `b` rewinds
   |                the deterministic event timeline
   v
+---------------------------------------------------------------+
| Next.js (App Router, TypeScript, Tailwind) — single page       |
|                                                                 |
|  Full-screen react-leaflet MapContainer (OSM tiles, no keys)    |
|   • divIcon markers: origins, BMO Field                         |
|   • route polylines re-draw in place on rerank                  |
|                                                                 |
|  Floating overlay panels (dark glass, z-index above map panes)  |
|   • Plan form  → Recommended plan (leave-by hero, route cards,  |
|     "Why this route?", fallback)                                |
|   • Live matchday (match clock, event feed, egress plan)        |
|   • Corner pills: DEMO REPLAY · data freshness                  |
+---------------------------------------------------------------+
```

Key properties:

- **Zero external services.** No API keys. The only network dependency is OpenStreetMap tile images. `npm install && npm run dev` is the entire setup.
- **Everything editable lives in `matchmile/data/seed.ts`** — coordinates, route steps, risk factors, timeline copy. Structure is fixed; values are hand-curated.
- **The map is the app.** All UI floats over a persistent interactive map, so the rerank moment is visible as route lines changing live.
- **Deterministic replay, honestly labeled.** The demo is a scripted event feed advanced by keyboard — the judging-safe equivalent of a live feed, and shown as such on screen.

## 5. Core user flow

**Inputs:** origin (3 downtown presets: Union Station, Downtown Hotel — King & Bay, Liberty Village), destination (BMO Field, pre-selected), arrival buffer (default 75 min), priority (fastest / least crowded / accessible / lowest walking).

**Outputs:** leave-by time, recommended route with steps, crowd-risk label (Low/Medium/High) with reason factors, tradeoff explanation, fallback route, and — once the match runs — a reactive egress plan.

### Routes (seeded)

| Route | Path | Time | Risk | Role |
|---|---|---|---|---|
| A | 504/511 streetcar via King St W → Exhibition Loop | 27 min | High (68) — primary pre-match crowd corridor | Fastest |
| B | GO Lakeshore West, Union → Exhibition GO + 9 min walk | 33 min | Low (24) — avoids main corridor | **Recommended** |
| C | 509 Harbourfront streetcar → Martin Goodman Trail | 41 min | Medium (35) | Fallback |

The headline product moment: with priority "least crowded," MatchMile recommends Route B *even though it is 6 minutes slower*, and explains why.

## 6. Match-event replay (the demo mechanic)

Keyboard-driven deterministic timeline (`n` next / `b` back — no visible buttons):

| # | Event | Product response |
|---|---|---|
| 0 | Pre-match | Initial plan: Route B recommended |
| 1 | Transit alert — GO delays at Exhibition GO | Route B flagged; app visibly reranks to Route A with "why this changed" + updated leave-by time |
| 2 | Kickoff | Phase chip → Kickoff; feed entry |
| 3 | 89', 1–1 | "End time uncertain" — two egress options prepared (leave now vs wait at fan zone) |
| 4 | Extra time | Expected end recalculated (~10:15 PM); egress plan updated |
| 5 | Full-time | Staggered egress activated: station crowd risk HIGH for 25 min → wait at fan zone, depart 9:55 PM via Exhibition GO |

Causal rule preserved from v1.0: match events affect recommendations only for defensible operational reasons (end-time changes, egress activation) — goals and cards are not treated as crowd signals.

## 7. Truthful language (unchanged from v1.0 — non-negotiable)

Use: "estimated crowd risk," "forecasted relative congestion," "recommended based on available mobility data."
Never: "live crowd density," "guaranteed fastest/safe route," "real-time transit capacity."
Risk labels are always text + color, never color alone. The DEMO REPLAY pill is always visible.

## 8. Team split (hackathon)

| Person | Owns |
|---|---|
| 1 | Build (Claude/Fable one-shot), seed-data integration, verification |
| 2 | Pitch script, demo cue sheet, judge Q&A, rehearsal (see `PERSON2_PITCH_TASKS.md`) |
| 3 | Route waypoint curation in `seed.ts`, submission requirements, README |

**T-30 minutes:** feature freeze + full dress rehearsal.

## 9. Demo risks and mitigations

| Risk | Mitigation |
|---|---|
| No live match during judging | Deterministic replay is the design, labeled honestly |
| Venue wifi fails | OSM tiles cached from rehearsal; overlay panels work offline; screen recording as last resort |
| Overshooting an event mid-pitch | `b` key rewinds one event |
| Judges ask "where's the AI?" | Deterministic explainable ranker by design; LLMs must never invent routes, closures, or timings |

## 10. Future roadmap (not built, honest framing)

The v1.0 spec (git history) describes the full platform vision: city config adapters for other host cities, a FastAPI recommendation service, live GTFS-realtime feeds, WebSocket match-state streaming, and an interpretable ML crowd model. This build is the downtown-Toronto vertical slice of that vision — the engine's inputs (routes, risk factors, events) are structured exactly as that architecture would produce them, so the seeded layer is swappable for live services.

## 11. Final project statement

MatchMile is not a better map. It is a **matchday mobility decision engine for downtown Toronto** that combines routing, crowd-risk estimation, transit disruptions, and live match timing into one explainable plan — when to leave, how to go, and how to get home when the match refuses to end on time.
