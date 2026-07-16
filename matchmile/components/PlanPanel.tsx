"use client";

/**
 * Screen 1 — "Plan your matchday". Floating glass panel over the map.
 */
import {
  arrivalBuffers,
  cities,
  match,
  origins,
  priorities,
  venue,
} from "@/data/seed";

interface PlanPanelProps {
  originId: string;
  setOriginId: (id: string) => void;
  buffer: number;
  setBuffer: (min: number) => void;
  priority: string;
  setPriority: (id: string) => void;
  onBuild: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
      {children}
    </p>
  );
}

function Chip({
  selected,
  disabled,
  onClick,
  children,
  title,
}: {
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
        selected
          ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
          : disabled
            ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/25"
            : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/25 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function PlanPanel({
  originId,
  setOriginId,
  buffer,
  setBuffer,
  priority,
  setPriority,
  onBuild,
}: PlanPanelProps) {
  return (
    <div className="flex flex-col gap-5 p-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">
          Plan your matchday
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-white/50">
          Not just directions — when to leave, which route carries the lowest
          forecasted crowd risk, and how you get home.
        </p>
      </div>

      {/* City */}
      <div className="space-y-2">
        <SectionLabel>Host city</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {cities.map((c) => (
            <Chip
              key={c.id}
              selected={c.available}
              disabled={!c.available}
              title={c.available ? undefined : "Coming soon"}
            >
              {c.label}
              {!c.available && <span className="ml-1 opacity-60">· soon</span>}
            </Chip>
          ))}
        </div>
      </div>

      {/* Match card */}
      <div className="space-y-2">
        <SectionLabel>Tonight&apos;s match</SectionLabel>
        <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-400/10 to-transparent p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/80">
              World Cup 2026 · {match.stage}
            </span>
            <span className="text-[10px] text-white/40">{match.dateLabel}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
            <span aria-hidden>{match.home.flag}</span> {match.home.name}
            <span className="text-white/40">vs</span>
            {match.away.name} <span aria-hidden>{match.away.flag}</span>
          </div>
          <p className="mt-1 text-xs text-white/50">
            {match.venueName} · Kickoff {match.kickoffLabel}
          </p>
        </div>
      </div>

      {/* Origin */}
      <div className="space-y-2">
        <SectionLabel>Starting from</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {origins.map((o) => (
            <Chip
              key={o.id}
              selected={originId === o.id}
              onClick={() => setOriginId(o.id)}
            >
              {o.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Destination */}
      <div className="space-y-2">
        <SectionLabel>Destination</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          <Chip selected>Stadium — {venue.name}</Chip>
          <Chip disabled title="Coming soon">
            Official Fan Festival · soon
          </Chip>
        </div>
      </div>

      {/* Arrival buffer */}
      <div className="space-y-2">
        <SectionLabel>Arrive before kickoff</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {arrivalBuffers.map((min) => (
            <Chip key={min} selected={buffer === min} onClick={() => setBuffer(min)}>
              {min} min
            </Chip>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <SectionLabel>Priority</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {priorities.map((p) => (
            <Chip
              key={p.id}
              selected={priority === p.id}
              onClick={() => setPriority(p.id)}
            >
              {p.label}
            </Chip>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onBuild}
        className="mt-1 h-12 w-full rounded-2xl bg-emerald-400 text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:bg-emerald-300 active:scale-[0.98]"
      >
        Build my plan
      </button>

      <p className="text-center text-[10px] leading-relaxed text-white/30">
        Recommendations use forecasted relative congestion — not live crowd
        density. Follow event staff and official signage on site.
      </p>
    </div>
  );
}
