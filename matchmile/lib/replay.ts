/**
 * Derives the entire UI state for a given replay position.
 * Index 0 = pre-match plan as built; index N = after timeline[N-1] applied.
 *
 * The match events are a scripted replay (deterministic), but the PLAN is
 * computed live: routes come from OSRM (lib/routing.ts) via the `live`
 * inputs, and leave-by / arrive-by / ranking are derived from real route
 * durations, the actual kickoff time, and the user's buffer + priority.
 * Seeded routes are only used as an offline fallback.
 */
import {
  egress,
  match,
  priorities,
  routes as seedRoutes,
  timeline,
  type HeatPhaseKey,
  type Route,
  type TimelineEvent,
} from "@/data/seed";
import { formatTorontoClock } from "@/lib/time";

export type Phase = "Pre-match" | "Kickoff" | "2nd Half" | "Extra Time" | "Full-time";

export type EgressStage = "none" | "options" | "extra_time" | "full_time";

export interface PlanView {
  recommendedRouteId: string;
  alternativeRouteId: string;
  fallbackRouteId: string;
  /** Route demoted by the transit alert (Route B), if any */
  demotedRouteId: string | null;
  leaveBy: string;
  arriveBy: string;
  countdown: string;
  tradeoff: string;
  whyChanged: string | null;
  warningBanner: string | null;
  /** Label of the ranking priority in effect (e.g. "Least crowded") */
  priorityLabel: string;
}

export interface LiveInputs {
  /** Live OSRM routes, or the seeded fallback */
  routes: Route[];
  routesSource: "live" | "seeded";
  /** Arrive-before-kickoff buffer chosen on the plan screen (minutes) */
  bufferMinutes: number;
  /** Ranking priority id chosen on the plan screen */
  priority: string;
  /** Current wall-clock ms — null until mounted (avoids hydration mismatch) */
  now: number | null;
}

export interface ReplayView {
  index: number;
  maxIndex: number;
  alertActive: boolean;
  phase: Phase;
  score: { home: number; away: number };
  matchClock: string;
  /** Events applied so far, newest first (for the live feed) */
  feed: TimelineEvent[];
  planView: PlanView;
  egressStage: EgressStage;
  /** Which crowd-heat phase (and "affects your plan" window) is active */
  heatPhase: HeatPhaseKey;
  /** The route set every panel should resolve ids against */
  routes: Route[];
  routesSource: "live" | "seeded";
}

export function routeById(id: string, routes: Route[]): Route {
  const r = routes.find((r) => r.id === id);
  if (!r) throw new Error(`Unknown route id: ${id}`);
  return r;
}

function lastIndexOfType(applied: TimelineEvent[], type: TimelineEvent["type"]): boolean {
  return applied.some((e) => e.type === type);
}

/** "Route A — King streetcar" → "Route A" */
const shortName = (r: Route) => r.name.split(" — ")[0];

/** Rank routes by the selected priority; ties broken by total time */
function rankRoutes(routes: Route[], priority: string): Route[] {
  const key = (r: Route): number => {
    switch (priority) {
      case "fastest":
        return r.totalMinutes;
      case "lowest-walking":
        return r.walkMinutes * 1000 + r.totalMinutes;
      case "accessible":
        // Level-boarding rail beats street-level streetcar stops
        return (r.steps.some((s) => s.mode === "rail") ? 0 : 100_000) + r.walkMinutes * 1000 + r.totalMinutes;
      default: // least-crowded
        return r.crowdRisk.score * 1000 + r.totalMinutes;
    }
  };
  return [...routes].sort((a, b) => key(a) - key(b));
}

function countdownCopy(leave: Date, now: number | null): string {
  if (now === null) return "Departure window syncing…";
  const mins = Math.round((leave.getTime() - now) / 60_000);
  if (mins > 90) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `Departure window opens in ${h}h${m > 0 ? ` ${m}m` : ""}`;
  }
  if (mins > 0) return `Departure window opens in ${mins} min`;
  return "Departure window is open — leave when ready";
}

export function deriveReplayView(index: number, live?: LiveInputs): ReplayView {
  const clamped = Math.max(0, Math.min(index, timeline.length));
  const applied = timeline.slice(0, clamped);

  const alertActive = lastIndexOfType(applied, "transit_alert");
  const kickedOff = lastIndexOfType(applied, "kickoff");
  const scoreUpdate = lastIndexOfType(applied, "score_update");
  const extraTime = lastIndexOfType(applied, "extra_time");
  const fullTime = lastIndexOfType(applied, "full_time");

  // ----- Match phase ------------------------------------------------------
  let phase: Phase = "Pre-match";
  if (fullTime) phase = "Full-time";
  else if (extraTime) phase = "Extra Time";
  else if (scoreUpdate) phase = "2nd Half";
  else if (kickedOff) phase = "Kickoff";

  // ----- Score + clock (latest event that carries them wins) --------------
  let score = { home: 0, away: 0 };
  let matchClock = `KO ${match.kickoffLabel}`;
  for (const e of applied) {
    if (e.score) score = e.score;
    if (e.matchClock) matchClock = e.matchClock;
  }

  // ----- Egress stage -----------------------------------------------------
  let egressStage: EgressStage = "none";
  if (fullTime) egressStage = "full_time";
  else if (extraTime) egressStage = "extra_time";
  else if (scoreUpdate) egressStage = "options";

  // ----- Crowd-heat phase (drives the map heat overlay + nearby events) ---
  let heatPhase: HeatPhaseKey = "pre_match";
  if (extraTime || fullTime) heatPhase = "post_match";
  else if (kickedOff) heatPhase = "in_match";

  // ----- Plan: computed from route durations + kickoff + user inputs ------
  const routes = live?.routes ?? seedRoutes;
  const routesSource = live?.routesSource ?? "seeded";
  const bufferMinutes = live?.bufferMinutes ?? 75;
  const priority = live?.priority ?? "least-crowded";
  const priorityLabel = priorities.find((p) => p.id === priority)?.label ?? "Least crowded";

  const ranked = rankRoutes(routes, priority);
  let recommended: Route;
  let alternative: Route;
  let fallbackR: Route;
  let demoted: Route | null = null;
  if (alertActive) {
    // Scripted alert hits the Route B rail segment: demote it, rerank the rest
    demoted = routeById("route-b", routes);
    const rest = ranked.filter((r) => r.id !== "route-b");
    recommended = rest[0];
    alternative = rest[1];
    fallbackR = demoted; // stays visible as compromised
  } else {
    [recommended, alternative, fallbackR] = ranked;
  }

  // Leave earlier when the alert is standing — absorb corridor crowds
  const safetyMinutes = alertActive ? 15 : 0;
  const kickoff = new Date(match.kickoffISO);
  const arrive = new Date(kickoff.getTime() - (bufferMinutes + safetyMinutes) * 60_000);
  const leave = new Date(arrive.getTime() - recommended.totalMinutes * 60_000);

  const fastest = [...routes].sort((a, b) => a.totalMinutes - b.totalMinutes)[0];
  const tradeoff = alertActive
    ? `With the rail alert standing, ${shortName(recommended)} is the lowest-risk arrival — departure moved ${safetyMinutes} min earlier to absorb corridor crowds.`
    : recommended.id === fastest.id
      ? `Fastest of the three options (${recommended.totalMinutes} min) under tonight's crowd forecast.`
      : `Adds ${recommended.totalMinutes - fastest.totalMinutes} min vs ${shortName(fastest)}, but carries ${recommended.crowdRisk.label} crowd risk instead of ${fastest.crowdRisk.label}.`;

  const planView: PlanView = {
    recommendedRouteId: recommended.id,
    alternativeRouteId: alternative.id,
    fallbackRouteId: fallbackR.id,
    demotedRouteId: demoted?.id ?? null,
    leaveBy: formatTorontoClock(leave),
    arriveBy: `~${formatTorontoClock(arrive)}`,
    countdown: countdownCopy(leave, live?.now ?? null),
    tradeoff,
    whyChanged: alertActive
      ? `Alert affects the Route B rail segment; ${shortName(recommended)} now recommended despite ${recommended.crowdRisk.label} corridor exposure — leave ${safetyMinutes} min earlier to compensate.`
      : null,
    warningBanner: alertActive
      ? "Service alert: GO Lakeshore West — delays at Exhibition GO. Plan reranked."
      : null,
    priorityLabel,
  };

  return {
    index: clamped,
    maxIndex: timeline.length,
    alertActive,
    phase,
    score,
    matchClock,
    feed: [...applied].reverse(),
    planView,
    egressStage,
    heatPhase,
    routes,
    routesSource,
  };
}

export { egress, timeline };
