"use client";

/**
 * "Make it a matchday" — pre-match city experiences (FIFA activations, photo
 * ops, the fan festival) a visiting fan can fold into their plan. Adding a
 * stop shifts the plan's leave-by earlier by (detour + time on site); the
 * parent owns that state. Adding is only offered pre-match.
 */
import { useState } from "react";
import { cityStops } from "@/data/seed";

export default function CityStops({
  addedIds,
  onToggle,
  preMatch,
  defaultOpen = false,
}: {
  addedIds: string[];
  onToggle: (id: string) => void;
  preMatch: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between p-3.5 text-left text-xs font-semibold text-slate-700 transition-colors hover:text-slate-900 dark:text-white/80 dark:hover:text-white"
      >
        <span className="flex items-center gap-2">
          Make it a matchday
          <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-white/10 dark:text-white/60">
            {cityStops.length}
          </span>
          {addedIds.length > 0 && (
            <span className="rounded-full border border-emerald-300 bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-300">
              {addedIds.length} in your plan
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
        <div className="animate-fade-slide border-t border-slate-200 p-3.5 dark:border-white/10">
          <p className="mb-2.5 text-[11px] leading-relaxed text-slate-500 dark:text-white/45">
            Visiting for the match? Fold a FIFA activation or photo stop into
            the trip — your leave-by time adjusts to fit it.
          </p>
          <ul className="space-y-2.5">
            {cityStops.map((s) => {
              const added = addedIds.includes(s.id);
              return (
                <li
                  key={s.id}
                  className={`rounded-xl border p-3 transition-colors ${
                    added
                      ? "border-emerald-400/60 bg-emerald-50/80 dark:border-emerald-400/40 dark:bg-emerald-400/[0.06]"
                      : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span aria-hidden className="mt-0.5 text-sm leading-none">
                      {s.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {s.name}
                        </p>
                        {s.photoOp && (
                          <span className="rounded-full border border-slate-300 bg-slate-100 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-slate-600 dark:border-white/15 dark:bg-white/10 dark:text-white/60">
                            📸 photo op
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-white/45">
                        {s.venue} · {s.openLabel}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-white/60">
                        {s.description}
                      </p>
                      <p className="mt-1 text-[10px] italic text-slate-400 dark:text-white/35">
                        Tip: {s.tip}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] tabular-nums text-slate-500 dark:text-white/50">
                          ≈{s.dwellMinutes} min on site · +{s.detourMinutes} min travel
                        </span>
                        {preMatch ? (
                          <button
                            type="button"
                            onClick={() => onToggle(s.id)}
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                              added
                                ? "border-emerald-500/60 bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
                                : "border-slate-300 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-700 dark:border-white/15 dark:bg-white/[0.04] dark:text-white/70 dark:hover:border-emerald-400/50 dark:hover:text-emerald-300"
                            }`}
                          >
                            {added ? "✓ In your plan — remove" : "+ Add to plan"}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-white/35">
                            Pre-match window has passed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
