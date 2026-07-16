# Person 2 — Pitch & Demo Owner

You own everything the judges hear. Deliverables, in order:

---

## Deliverable 1 — The 3-minute pitch script (write this first, ~25 min)

Use the draft below as your starting point. Rewrite it in your own voice — you're the one saying it. Time each section out loud; cut until it fits in 2:45 (leaves buffer for lag).

### Draft script

**HOOK (~30 sec)**

> Next summer, the World Cup hits 16 cities across 3 countries — millions of fans in cities they've never seen. Google Maps can tell them how to get from A to B. But that's not the question fans actually have. The real question is: *"I'm downtown with my family, we can't walk far, and I want to avoid the crush — when do we leave, which route do we take, and how do we get home if the match goes to extra time?"*
>
> That's MatchMile: a matchday mobility copilot for World Cup host cities. This is Toronto, tonight's match: Canada vs Italy at BMO Field, 7:30 kickoff.

**DEMO NARRATION (~1:50)** — you talk, the driver clicks. Cue sheet below.

> [Driver fills the form] We're a visiting family staying downtown. Priority: least crowded, limited walking. Build my plan.
>
> [Plan appears] Notice what it leads with — not a map, a decision: **leave by 5:42**. And look at the route it picked: it is NOT the fastest one. Route B is six minutes slower — [driver opens "Why this route?"] — and the app tells you exactly why: it avoids the main pre-match crowd corridor, and it has less walking. Every recommendation is explainable. No black box.
>
> [Driver presses `n` — transit alert] Now matchday happens: a service alert hits our rail line. Watch the map — [route reranks live] — the plan adapts in real time, tells you what changed and why, and updates your leave-by time.
>
> [Driver presses `n` through kickoff → 89'] The match is on, and here's what no maps product does: it's 1–1 in the 89th minute. That means nobody knows when this match ends — so MatchMile is already preparing two departure plans.
>
> [`n` — extra time] Extra time. The expected end time just moved — recalculated. [`n` — full time] Full time: 20,000 people leave at once. The app doesn't say "walk to the station" — it says the station is at peak crush for 25 minutes, wait at the fan zone, depart at 9:55. That's a *matchday plan*, not directions.

**CLOSE (~30 sec)**

> Under the hood, the engine is deterministic and explainable — routes are scored on transparent crowd-risk factors, and no AI ever invents a route or a closure. We scoped this build deliberately: downtown Toronto, around BMO Field, done properly — and because every input is structured data, extending to another host city is a config file, not a rewrite. Google Maps gives you directions. **MatchMile gives you a matchday plan.**

---

## Deliverable 2 — Demo cue sheet (the driver follows this)

| # | Your line (cue) | Driver action |
|---|---|---|
| 1 | "Build my plan" | Fill form: Least crowded → submit |
| 2 | "why this route?" | Expand the Why panel |
| 3 | "matchday happens" | Press `n` (transit alert → rerank) |
| 4 | "the match is on" | Press `n` (kickoff), then `n` (89' 1–1) |
| 5 | "Extra time" | Press `n` |
| 6 | "Full time" | Press `n` |

- `n` = next event, `b` = go back one (recovery if you overshoot)
- Presenter never drives. Agree on the cue words above and don't improvise them.

---

## Deliverable 3 — Judge Q&A prep (~10 min)

Have crisp answers ready for:

- **"Is this live data?"** → "It's a deterministic replay, labeled 'DEMO REPLAY' on screen — deliberately, so we never fake liveness. The architecture consumes live feeds per city; replay is also how we make judging reproducible."
- **"How is the crowd risk calculated?"** → "A transparent weighted score: event-time demand, corridor proximity, service disruptions, closures. Every score ships with its reason factors — you saw them in the Why panel."
- **"Where's the AI?"** → "The recommendation engine is deterministic on purpose — an LLM may polish explanations but can never invent routes, closures, or timings. That's a safety stance: wrong travel advice at a mega-event is a real harm."
- **"Why not just Google Maps?"** → "Maps optimizes ETA. We optimize a matchday: leave-by time, crowd exposure, accessibility constraints, and an egress plan that reacts to extra time. Different objective function."
- **"How does this scale to other cities?"** → "Today it's downtown Toronto around BMO Field — scoped deliberately so one corridor works end to end. But the engine only consumes structured data — venues, routes, risk factors, events — so another city is a new data file, not new code. That's the roadmap, not the build."

---

## Deliverable 4 — Rehearsal (T-30 minutes, non-negotiable)

- [ ] One full dress run: live app + script + cue sheet, timed
- [ ] Confirm wifi on the demo laptop (map tiles need it)
- [ ] Practice one recovery: overshoot an event, press `b`, keep talking
- [ ] Agree the opening state: app loaded, form empty, map centered
- [ ] Backup: screen-record the rehearsal pass — if everything dies, present the recording
