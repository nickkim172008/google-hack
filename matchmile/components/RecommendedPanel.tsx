"use client";

/**
 * Screen 2 — "Recommended plan". Left panel: leave-by hero, warnings,
 * recommended route, "Why this route?", alternative + fallback cards,
 * nearby events. Everything re-derives from the shared replay state, so the
 * scripted transit alert visibly reranks this panel in place.
 */
import { useState } from "react";
import { dataFreshnessSeconds, match, type Origin } from "@/data/seed";
import { deriveReplayView, routeById } from "@/lib/replay";
import { RouteCardFull, RouteCardCompact } from "@/components/RouteCard";
import EventsNearby from "@/components/EventsNearby";
import CityStops from "@/components/CityStops";

interface RecommendedPanelProps {
  view: ReturnType<typeof deriveReplayView>;
  origin: Origin;
  onEdit: () => void;
  /** Honest note when browser location is outside the seeded demo area */
  locationNote?: string | null;
  /** Pre-match city stops folded into the plan */
  addedStopIds: string[];
  onToggleStop: (id: string) => void;
  /** Leave-by shifted earlier to fit the added stops (null = no stops) */
  adjustedLeaveBy: string | null;
  stopExtraMinutes: number;
}

const IMPACT_STYLES: Record<string, string> = {
  none: "text-slate-400 dark:text-white/40",
  low: "text-emerald-700 dark:text-emerald-300",
  medium: "text-amber-700 dark:text-amber-300",
  high: "text-rose-700 dark:text-rose-300",
};

export default function RecommendedPanel({
  view,
  origin,
  onEdit,
  locationNote,
  addedStopIds,
  onToggleStop,
  adjustedLeaveBy,
  stopExtraMinutes,
}: RecommendedPanelProps) {
  const [whyOpen, setWhyOpen] = useState(false);
  const { planView } = view;

  const recommended = routeById(planView.recommendedRouteId);
  const alternative = routeById(planView.alternativeRouteId);
  const demoted = planView.demotedRouteId ? routeById(planView.demotedRouteId) : null;
  const fallback = !planView.demotedRouteId ? routeById(planView.fallbackRouteId) : null;

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-white/40">
            Recommended plan · Least crowded
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-white/45">
            {origin.label} → {match.venueName}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-white/10 dark:text-white/60 dark:hover:border-white/30 dark:hover:text-white"
        >
          Edit
        </button>
      </div>

      {locationNote && (
        <p className="animate-fade-slide rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-200">
          {locationNote}
        </p>
      )}

      {/* Hero — leave-by time */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <p
          key={adjustedLeaveBy ?? planView.leaveBy}
          className="animate-fade-slide text-4xl font-bold tracking-tight text-slate-900 dark:text-white"
        >
          Leave by{" "}
          <span className="text-emerald-600 dark:text-emerald-300">
            {adjustedLeaveBy ?? planView.leaveBy}
          </span>
        </p>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-white/55">
          arrive {planView.arriveBy} for the {match.kickoffLabel} kickoff
        </p>
        {adjustedLeaveBy && (
          <p className="animate-fade-slide mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            Includes ≈{stopExtraMinutes} min for {addedStopIds.length} pre-match{" "}
            {addedStopIds.length === 1 ? "stop" : "stops"} · direct: {planView.leaveBy}
          </p>
        )}
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 dark:bg-emerald-300" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-300" />
          </span>
          {planView.countdown}
        </div>
      </div>

      {/* Warnings area — empty initially, alert banner after the event */}
      {planView.warningBanner ? (
        <div className="animate-slide-in flex items-start gap-2.5 rounded-2xl border border-amber-400/70 bg-amber-50 p-3.5 dark:border-amber-400/40 dark:bg-amber-400/10">
          <span aria-hidden className="text-base leading-none">⚠️</span>
          <div>
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              {planView.warningBanner}
            </p>
            <p className="mt-0.5 text-[11px] text-amber-700/80 dark:text-amber-200/60">
              Reranked {dataFreshnessSeconds}s ago · demo replay event
            </p>
          </div>
        </div>
      ) : (
        <p className="px-1 text-[11px] text-slate-400 dark:text-white/30">
          Operational warnings: none active.
        </p>
      )}

      {/* Why this changed — appears only after the rerank */}
      {planView.whyChanged && (
        <div className="animate-slide-in rounded-2xl border border-emerald-500/40 bg-emerald-50 p-3.5 dark:border-emerald-400/30 dark:bg-emerald-400/[0.07]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Why this changed
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-white/75">
            {planView.whyChanged}
          </p>
        </div>
      )}

      {/* Recommended route */}
      <RouteCardFull route={recommended} tag="recommended" />

      {/* Why this route? */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.03]">
        <button
          type="button"
          onClick={() => setWhyOpen((o) => !o)}
          aria-expanded={whyOpen}
          className="flex w-full items-center justify-between p-3.5 text-left text-xs font-semibold text-slate-700 transition-colors hover:text-slate-900 dark:text-white/80 dark:hover:text-white"
        >
          Why this route?
          <span
            aria-hidden
            className={`text-slate-400 transition-transform duration-300 dark:text-white/40 ${whyOpen ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>
        {whyOpen && (
          <div className="animate-fade-slide space-y-2.5 border-t border-slate-200 p-3.5 dark:border-white/10">
            {recommended.factors.map((f) => (
              <div key={f.name} className="flex items-start gap-2 text-[11px]">
                <span
                  className={`mt-px w-16 shrink-0 font-semibold uppercase tracking-wide ${IMPACT_STYLES[f.impact]}`}
                >
                  {f.impact}
                </span>
                <span className="text-slate-600 dark:text-white/65">
                  <span className="font-medium text-slate-900 dark:text-white/85">
                    {f.name}.
                  </span>{" "}
                  {f.description}
                </span>
              </div>
            ))}
            <p className="border-t border-slate-200 pt-2.5 text-[11px] italic text-slate-500 dark:border-white/10 dark:text-white/50">
              {planView.tradeoff}
            </p>
          </div>
        )}
      </div>

      {/* Alternative + fallback / demoted */}
      <div className="space-y-2">
        <RouteCardCompact
          route={alternative}
          tag={planView.demotedRouteId ? "fallback" : "alternative"}
        />
        {demoted && <RouteCardCompact route={demoted} tag="alert" />}
        {fallback && <RouteCardCompact route={fallback} tag="fallback" />}
      </div>

      {/* Pre-match city experiences — add-to-plan shifts the leave-by */}
      <CityStops
        addedIds={addedStopIds}
        onToggle={onToggleStop}
        preMatch={view.heatPhase === "pre_match"}
        defaultOpen={addedStopIds.length > 0}
      />

      {/* Nearby events — chips key off the current replay phase */}
      <EventsNearby heatPhase={view.heatPhase} defaultOpen />

      {/* Footer pills */}
      <div className="flex items-center gap-2 border-t border-slate-200 pt-3 dark:border-white/10">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/60 bg-amber-100 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500 dark:bg-amber-300" />
          DEMO REPLAY
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/50">
          Data freshness: {dataFreshnessSeconds}s
        </span>
      </div>
    </div>
  );
}
