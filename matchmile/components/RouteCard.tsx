import type { Mode, Route } from "@/data/seed";
import RiskBadge from "@/components/RiskBadge";

export const MODE_ICONS: Record<Mode, string> = {
  rail: "🚆",
  streetcar: "🚋",
  walk: "🚶",
};

type Tag = "recommended" | "alternative" | "fallback" | "alert";

const TAG_STYLES: Record<Tag, string> = {
  recommended:
    "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-400/15 dark:text-emerald-300 dark:border-emerald-400/40",
  alternative:
    "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-400/10 dark:text-slate-300 dark:border-slate-400/30",
  fallback:
    "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-400/10 dark:text-slate-300 dark:border-slate-400/30",
  alert:
    "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-400/40",
};

const TAG_LABELS: Record<Tag, string> = {
  recommended: "Recommended",
  alternative: "Alternative",
  fallback: "Fallback",
  alert: "⚠ Service alert",
};

export function TagChip({ tag }: { tag: Tag }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TAG_STYLES[tag]}`}
    >
      {TAG_LABELS[tag]}
    </span>
  );
}

/** Full route card — steps, duration, walk time, risk badge */
export function RouteCardFull({ route, tag }: { route: Route; tag: Tag }) {
  return (
    <div
      key={route.id}
      className={`animate-fade-slide rounded-2xl border p-4 transition-colors duration-500 ${
        tag === "recommended"
          ? "animate-flash border-emerald-400/60 bg-emerald-50/80 dark:border-emerald-400/40 dark:bg-emerald-400/[0.06]"
          : "border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.03]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <TagChip tag={tag} />
          <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
            {route.name}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-white/50">{route.modeSummary}</p>
        </div>
        <RiskBadge label={route.crowdRisk.label} score={route.crowdRisk.score} compact />
      </div>

      <ol className="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-white/10">
        {route.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2.5 text-xs">
            <span aria-hidden className="mt-px text-sm leading-none">
              {MODE_ICONS[step.mode]}
            </span>
            <span className="flex-1 text-slate-600 dark:text-white/75">{step.instruction}</span>
            <span className="shrink-0 tabular-nums text-slate-400 dark:text-white/40">
              {step.minutes} min
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-3 flex gap-2 border-t border-slate-200 pt-3 text-[11px] text-slate-500 dark:border-white/10 dark:text-white/60">
        <span className="rounded-full bg-slate-200/70 px-2.5 py-1 dark:bg-white/5">
          ⏱ {route.totalMinutes} min total
        </span>
        <span className="rounded-full bg-slate-200/70 px-2.5 py-1 dark:bg-white/5">
          🚶 {route.walkMinutes} min walking
        </span>
      </div>
    </div>
  );
}

/** Compact route card — one-line summary for alternative / fallback routes */
export function RouteCardCompact({ route, tag }: { route: Route; tag: Tag }) {
  return (
    <div
      className={`animate-fade-slide rounded-2xl border p-3 transition-colors duration-500 ${
        tag === "alert"
          ? "border-rose-300 bg-rose-50/80 dark:border-rose-400/30 dark:bg-rose-500/[0.05]"
          : "border-slate-200 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TagChip tag={tag} />
          </div>
          <h4 className="mt-1.5 truncate text-xs font-semibold text-slate-900 dark:text-white">
            {route.name}
          </h4>
          <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-white/45">
            {route.modeSummary}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <RiskBadge label={route.crowdRisk.label} score={route.crowdRisk.score} compact />
          <span className="text-[11px] tabular-nums text-slate-500 dark:text-white/50">
            {route.totalMinutes} min · {route.walkMinutes} min walk
          </span>
        </div>
      </div>
    </div>
  );
}
