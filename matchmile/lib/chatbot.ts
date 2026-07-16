/**
 * Scripted Q&A engine for the matchday assistant. No live LLM — answers are
 * template strings grounded entirely in the seeded plan/replay state, in
 * keeping with the "no live APIs" approach in data/seed.ts. Keyword matching
 * only; the suggested-question chips in the UI guarantee a good answer even
 * if free-text input misses.
 */
import {
  cityStops,
  egress,
  match,
  nearbyEvents,
  type CityStop,
  type HeatPhaseKey,
  type Origin,
} from "@/data/seed";
import { routeById, type ReplayView } from "@/lib/replay";

export const SUGGESTED_QUESTIONS = [
  "When should I leave?",
  "What can I do before the match?",
  "Why this route?",
  "How crowded will it be?",
  "Any delays?",
  "What's the score?",
  "Events nearby?",
  "How do I get home?",
];

/** Everything an answer can be grounded in — owned by the page, not the bot */
export interface ChatContext {
  view: ReplayView;
  origin: Origin;
  /** Pre-match city stops folded into the plan */
  addedStops: CityStop[];
  /** Leave-by after stop adjustment (equals planView.leaveBy with no stops) */
  leaveBy: string;
}

const HEAT_DESCRIPTIONS: Record<HeatPhaseKey, string> = {
  pre_match:
    "Pre-match arrival crowds are building along the King St W corridor and at Exhibition Loop.",
  in_match: "Streets are quiet during the match — most crowd pressure is inside the stadium.",
  post_match: "Egress surge is peaking at Exhibition GO as fans leave the stadium.",
};

interface ChatRule {
  keywords: string[];
  answer: (ctx: ChatContext) => string;
}

const rules: ChatRule[] = [
  {
    keywords: ["leave", "depart", "what time", "when should"],
    answer: ({ view, addedStops, leaveBy }) => {
      const base = `Leave by ${leaveBy} to arrive ${view.planView.arriveBy}. ${view.planView.countdown}.`;
      if (addedStops.length === 0) return base;
      const extra = addedStops.reduce((n, s) => n + s.dwellMinutes + s.detourMinutes, 0);
      const names = addedStops.map((s) => s.name).join(" and ");
      return `${base} That includes ≈${extra} min for ${names} — leaving at ${view.planView.leaveBy} would skip ${addedStops.length === 1 ? "it" : "them"}.`;
    },
  },
  {
    keywords: [
      "do before",
      "things to do",
      "explore",
      "photo",
      "activation",
      "fan fest",
      "nathan",
      "experience",
      "visit",
      "tourist",
      "see in",
    ],
    answer: ({ view, addedStops }) => {
      if (view.heatPhase !== "pre_match") {
        return "The pre-match window has passed — after full-time, the Fan Festival at Exhibition Place is the recommended place to wait out the egress surge.";
      }
      const list = cityStops
        .map((s) => `${s.icon} ${s.name} (≈${s.dwellMinutes} min) — ${s.description}`)
        .join(" ");
      const added =
        addedStops.length > 0
          ? ` You already have ${addedStops.map((s) => s.name).join(" and ")} in your plan.`
          : ' Tap "Add to plan" under Make it a matchday and your leave-by time adjusts to fit.';
      return `${list}${added}`;
    },
  },
  {
    keywords: ["why", "route", "recommend"],
    answer: ({ view }) => {
      const r = routeById(view.planView.recommendedRouteId);
      const topFactor = r.factors[0];
      const reason = view.planView.whyChanged ?? view.planView.tradeoff;
      return `${r.name} is recommended (${r.modeSummary}, ${r.totalMinutes} min). ${reason} Key factor: ${topFactor.name} — ${topFactor.description}`;
    },
  },
  {
    keywords: ["crowd", "busy", "packed", "how full"],
    answer: ({ view }) => {
      const r = routeById(view.planView.recommendedRouteId);
      return `Est. crowd risk on ${r.name}: ${r.crowdRisk.label} (score ${r.crowdRisk.score}/100). ${HEAT_DESCRIPTIONS[view.heatPhase]}`;
    },
  },
  {
    keywords: ["delay", "alert", "disrupt", "problem", "issue"],
    answer: ({ view }) =>
      view.alertActive
        ? `${view.planView.warningBanner ?? "There's an active service alert."} ${view.planView.whyChanged ?? ""}`.trim()
        : "No active service alerts right now — your plan is holding steady.",
  },
  {
    keywords: ["score", "goal", "winning", "clock"],
    answer: ({ view }) =>
      `${match.home.code} ${view.score.home}–${view.score.away} ${match.away.code} · ${view.matchClock} (${view.phase}).`,
  },
  {
    keywords: ["event", "nearby", "else tonight", "happening"],
    answer: ({ view }) => {
      const affecting = nearbyEvents.filter((e) => e.affectsDuring.includes(view.heatPhase));
      if (affecting.length === 0) {
        return `There are ${nearbyEvents.length} other events tonight nearby, but none are affecting your plan right now.`;
      }
      return affecting.map((e) => `${e.icon} ${e.name} (${e.venue}) — ${e.mobilityImpact}`).join(" ");
    },
  },
  {
    keywords: ["after", "home", "egress", "get back", "post-match", "post match", "leaving the stadium"],
    answer: ({ view }) => {
      if (view.egressStage === "full_time") return egress.fullTime.detail;
      if (view.egressStage === "extra_time") return egress.extraTime.note;
      if (view.egressStage === "options") return egress.scoreUpdate.hint;
      return "The egress plan isn't active yet — check back after full-time for the staggered departure plan.";
    },
  },
];

export function answerQuestion(question: string, ctx: ChatContext): string {
  const q = question.toLowerCase();
  const rule = rules.find((r) => r.keywords.some((k) => q.includes(k)));
  if (rule) return rule.answer(ctx);
  return `I can help with leave times, pre-match experiences, route reasoning, crowd risk, delays, the score, nearby events, or getting home from ${ctx.origin.label}. Try one of the suggested questions below.`;
}
