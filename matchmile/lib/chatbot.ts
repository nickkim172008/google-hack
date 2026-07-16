/**
 * Scripted Q&A engine for the matchday assistant. No live LLM — answers are
 * template strings grounded entirely in the seeded plan/replay state, in
 * keeping with the "no live APIs" approach in data/seed.ts. Keyword matching
 * only; the suggested-question chips in the UI guarantee a good answer even
 * if free-text input misses.
 */
import { egress, match, nearbyEvents, type HeatPhaseKey, type Origin } from "@/data/seed";
import { routeById, type ReplayView } from "@/lib/replay";

export const SUGGESTED_QUESTIONS = [
  "When should I leave?",
  "Why this route?",
  "How crowded will it be?",
  "Any delays?",
  "What's the score?",
  "Events nearby?",
  "How do I get home?",
];

const HEAT_DESCRIPTIONS: Record<HeatPhaseKey, string> = {
  pre_match:
    "Pre-match arrival crowds are building along the King St W corridor and at Exhibition Loop.",
  in_match: "Streets are quiet during the match — most crowd pressure is inside the stadium.",
  post_match: "Egress surge is peaking at Exhibition GO as fans leave the stadium.",
};

interface ChatRule {
  keywords: string[];
  answer: (view: ReplayView, origin: Origin) => string;
}

const rules: ChatRule[] = [
  {
    keywords: ["leave", "depart", "what time", "when should"],
    answer: (view) =>
      `Leave by ${view.planView.leaveBy} to arrive ${view.planView.arriveBy}. ${view.planView.countdown}.`,
  },
  {
    keywords: ["why", "route", "recommend"],
    answer: (view) => {
      const r = routeById(view.planView.recommendedRouteId);
      const topFactor = r.factors[0];
      const reason = view.planView.whyChanged ?? view.planView.tradeoff;
      return `${r.name} is recommended (${r.modeSummary}, ${r.totalMinutes} min). ${reason} Key factor: ${topFactor.name} — ${topFactor.description}`;
    },
  },
  {
    keywords: ["crowd", "busy", "packed", "how full"],
    answer: (view) => {
      const r = routeById(view.planView.recommendedRouteId);
      return `Est. crowd risk on ${r.name}: ${r.crowdRisk.label} (score ${r.crowdRisk.score}/100). ${HEAT_DESCRIPTIONS[view.heatPhase]}`;
    },
  },
  {
    keywords: ["delay", "alert", "disrupt", "problem", "issue"],
    answer: (view) =>
      view.alertActive
        ? `${view.planView.warningBanner ?? "There's an active service alert."} ${view.planView.whyChanged ?? ""}`.trim()
        : "No active service alerts right now — your plan is holding steady.",
  },
  {
    keywords: ["score", "goal", "winning", "clock"],
    answer: (view) => `${match.home.code} ${view.score.home}–${view.score.away} ${match.away.code} · ${view.matchClock} (${view.phase}).`,
  },
  {
    keywords: ["event", "nearby", "else tonight", "happening"],
    answer: (view) => {
      const affecting = nearbyEvents.filter((e) => e.affectsDuring.includes(view.heatPhase));
      if (affecting.length === 0) {
        return `There are ${nearbyEvents.length} other events tonight nearby, but none are affecting your plan right now.`;
      }
      return affecting.map((e) => `${e.icon} ${e.name} (${e.venue}) — ${e.mobilityImpact}`).join(" ");
    },
  },
  {
    keywords: ["after", "home", "egress", "get back", "post-match", "post match", "leaving the stadium"],
    answer: (view) => {
      if (view.egressStage === "full_time") return egress.fullTime.detail;
      if (view.egressStage === "extra_time") return egress.extraTime.note;
      if (view.egressStage === "options") return egress.scoreUpdate.hint;
      return "The egress plan isn't active yet — check back after full-time for the staggered departure plan.";
    },
  },
];

export function answerQuestion(question: string, view: ReplayView, origin: Origin): string {
  const q = question.toLowerCase();
  const rule = rules.find((r) => r.keywords.some((k) => q.includes(k)));
  if (rule) return rule.answer(view, origin);
  return `I can help with leave times, route reasoning, crowd risk, delays, the score, nearby events, or getting home from ${origin.label}. Try one of the suggested questions below.`;
}
