"use client";

/**
 * Collapsible "Events nearby" section — other seeded events tonight and their
 * one-line mobility impact. Events whose impact window overlaps the current
 * replay phase get an amber "affects your plan" chip.
 */
import { useState } from "react";
import { nearbyEvents, type HeatPhaseKey } from "@/data/seed";

export default function EventsNearby({
  heatPhase,
  defaultOpen = false,
}: {
  heatPhase: HeatPhaseKey;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const affectedCount = nearbyEvents.filter((e) => e.affectsDuring.includes(heatPhase)).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between p-3.5 text-left text-xs font-semibold text-slate-700 transition-colors hover:text-slate-900 dark:text-white/80 dark:hover:text-white"
      >
        <span className="flex items-center gap-2">
          Events nearby
          <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-white/60">
            {nearbyEvents.length}
          </span>
          {affectedCount > 0 && (
            <span className="rounded-full border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-300">
              {affectedCount} affecting your plan
            </span>
          )}
        </span>
        <span
          aria-hidden
          className={`text-slate-400 transition-transform duration-300 dark:text-white/40 ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {open && (
        <ul className="animate-fade-slide space-y-2.5 border-t border-slate-200 p-3.5 dark:border-white/10">
          {nearbyEvents.map((e) => {
            const affects = e.affectsDuring.includes(heatPhase);
            return (
              <li key={e.id} className="flex items-start gap-2.5">
                <span aria-hidden className="mt-0.5 text-sm leading-none">
                  {e.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {e.name}
                    </p>
                    {affects && (
                      <span className="rounded-full border border-amber-300 bg-amber-100 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-amber-800 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-300">
                        affects your plan
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-white/45">
                    {e.venue} · {e.timeLabel}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-white/60">
                    {e.mobilityImpact}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
