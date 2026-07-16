"use client";

import type { TimelineEvent } from "@/data/seed";

const ICONS: Record<TimelineEvent["type"], string> = {
  transit_alert: "⚠️",
  kickoff: "⚽",
  score_update: "⚽",
  extra_time: "⏱",
  full_time: "🏁",
};

/** Floating toast shown when the replay advances — makes reranks visible. */
export default function Toast({ event }: { event: TimelineEvent | null }) {
  if (!event) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-[1200] w-[min(92vw,420px)] -translate-x-1/2">
      <div
        key={event.id}
        className="animate-toast flex items-start gap-3 rounded-2xl border border-white/15 bg-slate-900/90 p-3.5 shadow-2xl shadow-black/50 backdrop-blur-md"
        role="status"
        aria-live="polite"
      >
        <span aria-hidden className="mt-0.5 text-lg leading-none">
          {ICONS[event.type]}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white">{event.title}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-white/60">{event.detail}</p>
        </div>
      </div>
    </div>
  );
}
