"use client";

/**
 * Screen 3 — "Live matchday". Right-docked panel: match header (score, clock,
 * phase), current plan status (rerank + egress), and the scripted event feed.
 */
import { egress, match, type TimelineEvent } from "@/data/seed";
import { deriveReplayView, routeById, type Phase } from "@/lib/replay";
import RiskBadge from "@/components/RiskBadge";
import { MODE_ICONS } from "@/components/RouteCard";

const PHASE_STYLES: Record<Phase, string> = {
  "Pre-match":
    "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-400/30 dark:bg-slate-400/10 dark:text-slate-300",
  Kickoff:
    "border-emerald-400 bg-emerald-100 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-300",
  "2nd Half":
    "border-emerald-400 bg-emerald-100 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-300",
  "Extra Time":
    "border-amber-400 bg-amber-100 text-amber-800 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-300",
  "Full-time":
    "border-rose-400 bg-rose-100 text-rose-800 dark:border-rose-400/40 dark:bg-rose-400/10 dark:text-rose-300",
};

const FEED_ICONS: Record<TimelineEvent["type"], string> = {
  transit_alert: "⚠️",
  kickoff: "⚽",
  score_update: "⚽",
  extra_time: "⏱",
  full_time: "🏁",
};

export default function LivePanel({
  view,
  adjustedLeaveBy,
}: {
  view: ReturnType<typeof deriveReplayView>;
  /** Leave-by shifted earlier for added city stops (null = no stops) */
  adjustedLeaveBy?: string | null;
}) {
  const recommended = routeById(view.planView.recommendedRouteId);
  const leaveBy = adjustedLeaveBy ?? view.planView.leaveBy;

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Match header */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${PHASE_STYLES[view.phase]}`}
          >
            {view.phase}
          </span>
          <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-white/60">
            {view.matchClock}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <span aria-hidden className="text-lg">{match.home.flag}</span>
            {match.home.code}
          </span>
          <span
            key={`${view.score.home}-${view.score.away}`}
            className="animate-fade-slide rounded-xl bg-slate-200/70 px-3 py-1 text-xl font-bold tabular-nums text-slate-900 dark:bg-white/5 dark:text-white"
          >
            {view.score.home}–{view.score.away}
          </span>
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            {match.away.code}
            <span aria-hidden className="text-lg">{match.away.flag}</span>
          </span>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-white/35">
          {match.venueName} · {match.stage} · scripted replay
        </p>
      </div>

      {/* Current plan status */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-white/40">
          Current plan status
        </p>

        {view.egressStage === "none" && (
          <div key={recommended.id} className="animate-fade-slide mt-2">
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              {view.alertActive ? "Reranked — " : "Plan locked — "}
              {recommended.name}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-white/55">
              Leave by{" "}
              <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                {leaveBy}
              </span>
              , arrive {view.planView.arriveBy}.
              {adjustedLeaveBy && ` Includes pre-match stop time (direct: ${view.planView.leaveBy}).`}
              {view.alertActive && " Route B demoted after the GO Lakeshore West alert."}
            </p>
          </div>
        )}

        {view.egressStage === "options" && (
          <div className="animate-fade-slide mt-2 space-y-2">
            <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
              {egress.scoreUpdate.hint}
            </p>
            {egress.scoreUpdate.options.map((opt) => (
              <div
                key={opt.id}
                className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {opt.title}
                  </p>
                  <RiskBadge label={opt.risk} score={opt.risk === "low" ? 28 : 52} compact />
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-white/55">
                  {opt.detail}
                </p>
              </div>
            ))}
          </div>
        )}

        {view.egressStage === "extra_time" && (
          <div className="animate-fade-slide mt-2 space-y-2">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              Expected end recalculated: {egress.extraTime.expectedEnd}
            </p>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-white/55">
              {egress.extraTime.note}
            </p>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
              Both departure options remain staged — the recommendation window
              shifts with the new estimated end time.
            </div>
          </div>
        )}

        {view.egressStage === "full_time" && (
          <div className="animate-fade-slide mt-2 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {egress.fullTime.headline}
              </p>
              <RiskBadge
                label={egress.fullTime.stationRisk.label}
                score={egress.fullTime.stationRisk.score}
                compact
              />
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-white/70">
              {egress.fullTime.detail}
            </p>
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 p-3 dark:border-emerald-400/25 dark:bg-emerald-400/[0.06]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300/80">
                Post-match route · {egress.fullTime.departLabel}
              </p>
              <ol className="mt-2 space-y-1.5">
                {egress.fullTime.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px]">
                    <span aria-hidden className="leading-none">{MODE_ICONS[s.mode]}</span>
                    <span className="flex-1 text-slate-600 dark:text-white/70">
                      {s.instruction}
                    </span>
                    <span className="shrink-0 tabular-nums text-slate-400 dark:text-white/40">
                      {s.minutes} min
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Event feed — newest on top */}
      <div>
        <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-white/40">
          Matchday feed
        </p>
        <div className="mt-2 space-y-2">
          {view.feed.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-[11px] text-slate-400 dark:border-white/10 dark:text-white/35">
              Waiting for matchday events…
            </p>
          )}
          {view.feed.map((e, i) => (
            <div
              key={e.id}
              className={`flex items-start gap-2.5 rounded-2xl border p-3 ${
                i === 0
                  ? "animate-slide-in border-slate-300 bg-white dark:border-white/20 dark:bg-white/[0.06]"
                  : "border-slate-200 bg-slate-50/60 opacity-70 dark:border-white/10 dark:bg-white/[0.02]"
              }`}
            >
              <span aria-hidden className="mt-0.5 text-sm leading-none">
                {FEED_ICONS[e.type]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {e.title}
                  </p>
                  <span className="shrink-0 text-[10px] tabular-nums text-slate-400 dark:text-white/40">
                    {e.clock}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-white/55">
                  {e.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
