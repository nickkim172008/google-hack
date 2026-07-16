/**
 * Derives the entire UI state for a given replay position.
 * Index 0 = pre-match plan as built; index N = after timeline[N-1] applied.
 * Pure function of the seed data — no side effects, fully deterministic.
 */
import {
  egress,
  match,
  plan,
  routes,
  timeline,
  type Route,
  type TimelineEvent,
} from "@/data/seed";

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
}

export function routeById(id: string): Route {
  const r = routes.find((r) => r.id === id);
  if (!r) throw new Error(`Unknown route id: ${id}`);
  return r;
}

function lastIndexOfType(applied: TimelineEvent[], type: TimelineEvent["type"]): boolean {
  return applied.some((e) => e.type === type);
}

export function deriveReplayView(index: number): ReplayView {
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

  // ----- Plan (reranked by the transit alert) ------------------------------
  const planView: PlanView = alertActive
    ? {
        recommendedRouteId: plan.afterAlert.recommendedRouteId,
        alternativeRouteId: plan.afterAlert.alternativeRouteId,
        fallbackRouteId: plan.afterAlert.demotedRouteId, // demoted B stays visible as compromised
        demotedRouteId: plan.afterAlert.demotedRouteId,
        leaveBy: plan.afterAlert.leaveBy,
        arriveBy: plan.afterAlert.arriveBy,
        countdown: plan.afterAlert.countdown,
        tradeoff: plan.initial.tradeoff,
        whyChanged: plan.afterAlert.whyChanged,
        warningBanner: plan.afterAlert.warningBanner,
      }
    : {
        recommendedRouteId: plan.initial.recommendedRouteId,
        alternativeRouteId: plan.initial.alternativeRouteId,
        fallbackRouteId: plan.initial.fallbackRouteId,
        demotedRouteId: null,
        leaveBy: plan.initial.leaveBy,
        arriveBy: plan.initial.arriveBy,
        countdown: plan.initial.countdown,
        tradeoff: plan.initial.tradeoff,
        whyChanged: null,
        warningBanner: null,
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
  };
}

export { egress, timeline };
