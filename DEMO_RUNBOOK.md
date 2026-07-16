# MatchMile — Demo Runbook

Everything needed to run the 3-minute demo, from cold laptop to final keypress.
(The pitch *script* — what to say — is in `PERSON2_PITCH_TASKS.md`. This file is *how to drive*.)

---

## 1. Setup (do once, ~5 min, BEFORE walking to the judges)

```bash
cd matchmile
npm install        # first time only
npm run dev
```

- Next.js prints the URL. **Watch the port**: `http://localhost:3000` normally, auto-bumps to 3001 if another dev server holds 3000. Read the port off the `npm run dev` output and use that.
- **Disable page-altering extensions for localhost — especially Dark Reader.** It repaints the app's colors (flattening the light/dark themes), breaks React hydration (red "Issue" badge), and can wash out map tiles. Click the Dark Reader icon → disable for this site → reload. Do this on whatever laptop presents.
- Open the URL in Chrome, full-screen the window (`Cmd+Ctrl+F`).
- Confirm the map tiles load (needs wifi) and the plan form panel is visible.
- **Warm the tile cache:** pan/zoom around the Union → BMO Field area once. If venue wifi dies mid-demo, cached tiles keep the map alive.

## 2. Pre-demo checklist (T-5 min)

- [ ] Dev server running, page loaded, map tiles visible
- [ ] Page is FRESH (reload with `Cmd+R`) → replay starts at event 0
- [ ] **Location permission pre-granted:** click "📍 Use my location" once during rehearsal and choose Allow — so no permission popup appears mid-demo
- [ ] **Theme set** to your chosen default (toggle top-right; choice persists in localStorage)
- [ ] **Crowd heat toggle ON** (it defaults on once a plan is built — just confirm)
- [ ] Click once anywhere on the page background so keyboard focus is on the page (not the URL bar) — otherwise `n` types into the address bar
- [ ] Notifications off / Do Not Disturb on (`Cmd+Shift+D` on macOS or Control Center)
- [ ] Laptop plugged in or >50% battery
- [ ] Know your recovery keys: `b` = step back, `Cmd+R` = full reset to start

## 3. The demo sequence (driver's crib sheet)

| # | Presenter cue | You do | What appears |
|---|---|---|---|
| 0a | "I'm a visiting fan" | Click **📍 Use my location** | Permission already granted (see checklist) → pulsing blue dot + "outside the demo area" note; then click **Union Station** chip to proceed |
| 0b | "Build my plan" | Select **Least crowded** priority, click **Build my plan** | Leave-by 5:42 PM hero, Route B (emerald) recommended on map, Route A alternative, **crowd heatmap glowing on King St corridor** |
| 1 | "why this route?" | Click **Why this route?** | Factor panel: corridor load, event peak, tradeoff line |
| 1b | "and it's not just the match" | Point at (or expand) **Events nearby** | 🎪 Fan Festival · 🎵 Budweiser Stage concert · ⚾ Jays at Rogers Centre, each with a mobility-impact line |
| 2 | "matchday happens" | Press **`n`** | Transit alert toast → Route A promoted to emerald, Route B dashed rose with ⚠ at Exhibition GO, leave-by 5:42→5:32, "Why this changed" |
| 3 | "the match is on" | Press **`n`** | Kickoff — phase chip, feed entry, **heatmap cools to in-match levels** |
| 4 | *(no cue — flow on)* | Press **`n`** | 89' — Italy equalize 1–1, two egress options: Leave now vs Wait at fan zone |
| 5 | "Extra time" | Press **`n`** | Expected end recalculated ~10:15 PM |
| 6 | "Full time" | Press **`n`** | Canada win 2–1 → staggered egress plan (depart 9:55 PM via Exhibition GO) + **heat migrates to Exhibition GO / stadium gates** — point at the map |

Total: 1 click-path + 5 presses of `n`. Practice until you can do it watching the presenter, not the keyboard.

**Optional flourishes (only if time feels comfortable):**
- Theme toggle (top-right sun/moon): one flip light↔dark mid-demo reads as polish. Pick your default look in rehearsal and start there.
- The 🎵 concert marker at full-time: "the concert next door lets out at ten — the egress plan already knows."

## 4. Recovery moves

| Problem | Fix |
|---|---|
| Pressed `n` too early / too many times | **`b`** steps back one event — keep talking, judges won't notice |
| Keyboard does nothing | Click the page background once (focus left the page), press again |
| Location permission denied / times out | App shows a toast and falls back to preset origins — click Union Station and move on; it's a 2-second blip |
| Heatmap looks noisy on the projector | Click the "Crowd heat" toggle off — every other beat still works |
| Page in a weird state | `Cmd+R` — replay is deterministic, you're back at event 0 in 2 seconds; re-click Build my plan |
| Wifi dies | Cached tiles keep the map; ALL app logic is local — the demo still works, tiles just stop refining |
| Total disaster | Play the screen recording from the dress rehearsal (record it — see below) |

## 5. Dress rehearsal (T-30, non-negotiable)

1. Full run: presenter reads the script from `PERSON2_PITCH_TASKS.md`, driver follows §3 above. Time it — target 2:45.
2. **Screen-record this pass** (QuickTime → New Screen Recording, or `Cmd+Shift+5`). This recording is the disaster backup.
3. Practice one deliberate mistake: overshoot an event, recover with `b` without stopping the narration.
4. After rehearsal: `Cmd+R` to reset, leave the tab open, do not touch it again until the demo.

## 6. Submission blurb (paste into Devpost/form)

> **MatchMile — the FIFA matchday copilot.** World Cup fans don't need directions; they need a plan. MatchMile recommends when to leave, which route carries the lowest crowd risk (with transparent, explainable reasons — it deliberately picks a slower route when the fastest one runs through the pre-match crowd corridor), a fallback, and a post-match egress plan that reacts live to the state of the match: a tied 89th minute, extra time, full-time surge. A forecasted crowd-pressure heatmap evolves with the match — watch the heat migrate from the King St corridor to the station at full-time — and the plan is aware of everything else happening downtown: the fan festival, the concert next door letting out at ten, the Jays game pressuring Union Station. Finds you via live geolocation, light and dark themes, built for downtown Toronto around BMO Field with real transit corridors (GO Lakeshore West, King St streetcar, Martin Goodman Trail). Deterministic, honest, and demoable: every event is a labeled replay, every recommendation ships with its reasons, and no AI ever invents a route.

**Submission checklist** (fill in what the hackathon asks for):
- [ ] Repo link: https://github.com/nickkim172008/google-hack
- [ ] Demo video (use the dress-rehearsal recording)
- [ ] Team names + emails
- [ ] Track/category selection
- [ ] Blurb above, trimmed to their character limit

## 7. Judge Q&A quick answers

Full versions in `PERSON2_PITCH_TASKS.md` §3. One-liners:

- **Live data?** "Deterministic replay, labeled on screen — the honest, reproducible way to judge an events product."
- **Is the heatmap real crowd data?** "It's forecasted relative pressure — seeded and labeled as such. We never claim live density; with a real telemetry partner the same layer renders their data."
- **Where's the AI?** "The ranker is deliberately deterministic and explainable — an LLM may polish wording but can never invent a route. Safety stance."
- **Other cities?** "This build is downtown Toronto done properly. The engine only eats structured data, so a new city is a data file, not a rewrite."
