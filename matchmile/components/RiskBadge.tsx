import type { RiskLabel } from "@/data/seed";

/**
 * Crowd-risk badge. Always text + color, never color alone.
 * Copy is deliberately "Est." — this is a forecast, not measured density.
 */
const STYLES: Record<RiskLabel, string> = {
  low: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30",
  medium: "bg-amber-500/10 text-amber-300 border-amber-400/30",
  high: "bg-rose-500/10 text-rose-300 border-rose-400/30",
};

const LABELS: Record<RiskLabel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function RiskBadge({
  label,
  score,
  compact = false,
}: {
  label: RiskLabel;
  score: number;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STYLES[label]}`}
    >
      {compact ? `${LABELS[label]} risk` : `Est. crowd risk: ${LABELS[label]}`}
      <span className="opacity-60">· {score}</span>
    </span>
  );
}
