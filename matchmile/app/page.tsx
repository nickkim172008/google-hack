"use client";

/**
 * MatchMile — matchday mobility copilot (demo replay).
 *
 * Layout: a full-screen Leaflet map is the persistent canvas; all UI floats
 * above it as glass panels. Screens are overlay states:
 *   1. Plan your matchday  → left panel (form)
 *   2. Recommended plan    → left panel (after "Build my plan")
 *   3. Live matchday       → right panel (desktop) / toggled sheet (mobile)
 *
 * Replay controls (keyboard only, no on-screen buttons):
 *   n → advance to the next scripted event      b → go back one event
 */
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { dataFreshnessSeconds, origins, timeline, type TimelineEvent } from "@/data/seed";
import { deriveReplayView } from "@/lib/replay";
import PlanPanel from "@/components/PlanPanel";
import RecommendedPanel from "@/components/RecommendedPanel";
import LivePanel from "@/components/LivePanel";
import Toast from "@/components/Toast";

// Leaflet touches `window` — render the map client-side only.
const MapCanvas = dynamic(() => import("@/components/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-[#0b1210] text-xs text-white/30">
      Loading Toronto…
    </div>
  ),
});

export default function Home() {
  // ----- Plan form state ---------------------------------------------------
  const [originId, setOriginId] = useState(origins[0].id);
  const [buffer, setBuffer] = useState(75);
  const [priority, setPriority] = useState("least-crowded");
  const [planBuilt, setPlanBuilt] = useState(false);

  // ----- Shared replay state (drives every panel + the map) ---------------
  const [eventIndex, setEventIndex] = useState(0);
  const [toastEvent, setToastEvent] = useState<TimelineEvent | null>(null);
  const prevIndex = useRef(0);

  // ----- Mobile: which sheet is visible ------------------------------------
  const [mobilePane, setMobilePane] = useState<"plan" | "live">("plan");

  const view = deriveReplayView(eventIndex);
  const origin = origins.find((o) => o.id === originId) ?? origins[0];

  // Keyboard-only replay controls: `n` next, `b` back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "n" || e.key === "N") {
        setEventIndex((i) => Math.min(i + 1, timeline.length));
      } else if (e.key === "b" || e.key === "B") {
        setEventIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Toast on every forward step so judges see the change land.
  useEffect(() => {
    if (eventIndex > prevIndex.current) {
      setToastEvent(timeline[eventIndex - 1]);
      prevIndex.current = eventIndex;
      const t = setTimeout(() => setToastEvent(null), 4500);
      return () => clearTimeout(t);
    }
    prevIndex.current = eventIndex;
  }, [eventIndex]);

  const panelShell =
    "pointer-events-auto flex flex-col overflow-hidden border border-white/10 bg-slate-900/85 shadow-2xl shadow-black/50 backdrop-blur-md";

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#0b1210]">
      {/* Persistent full-screen map canvas */}
      <div className="absolute inset-0 z-0">
        <MapCanvas origin={origin} alertActive={view.alertActive} planBuilt={planBuilt} />
      </div>

      {/* Floating UI layer — panels re-enable pointer events individually */}
      <div className="pointer-events-none absolute inset-0 z-[1000]">
        {/* Brand — top left */}
        <div className="pointer-events-auto absolute left-4 top-4 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-slate-900/85 px-3.5 py-2 shadow-lg backdrop-blur-md">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-emerald-300 to-emerald-500 text-sm">
            <span aria-hidden>⚽</span>
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-white">
              Match<span className="text-emerald-300">Mile</span>
            </p>
            <p className="text-[9px] uppercase tracking-[0.16em] text-white/40">
              Toronto · World Cup 2026
            </p>
          </div>
        </div>

        {/* Honesty pills — top right, visible on every screen */}
        <div className="pointer-events-auto absolute right-4 top-4 flex flex-col items-end gap-1.5 sm:flex-row sm:items-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-slate-900/85 px-3 py-1.5 text-[10px] font-bold tracking-wider text-amber-300 shadow-lg backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
            DEMO REPLAY
          </span>
          <span className="rounded-full border border-white/10 bg-slate-900/85 px-3 py-1.5 text-[10px] text-white/55 shadow-lg backdrop-blur-md">
            Data freshness: {dataFreshnessSeconds}s
          </span>
        </div>

        {/* Mobile pane toggle (desktop shows both panels side by side) */}
        {planBuilt && (
          <div className="pointer-events-auto absolute left-1/2 top-16 flex -translate-x-1/2 rounded-full border border-white/10 bg-slate-900/85 p-1 shadow-lg backdrop-blur-md md:hidden">
            {(
              [
                ["plan", "Your plan"],
                ["live", "Live matchday"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMobilePane(id)}
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-colors ${
                  mobilePane === id
                    ? "bg-emerald-400 text-emerald-950"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Left panel — Plan form / Recommended plan */}
        <section
          aria-label={planBuilt ? "Recommended plan" : "Plan your matchday"}
          className={`${panelShell} absolute bottom-0 left-0 right-0 max-h-[62dvh] rounded-t-2xl md:bottom-4 md:left-4 md:right-auto md:top-[74px] md:max-h-none md:w-[400px] md:rounded-2xl ${
            !planBuilt || mobilePane === "plan" ? "flex" : "hidden"
          } md:flex`}
        >
          <div className="scroll-area flex-1 overflow-y-auto overscroll-contain">
            {planBuilt ? (
              <RecommendedPanel
                view={view}
                origin={origin}
                onEdit={() => {
                  setPlanBuilt(false);
                  setMobilePane("plan");
                }}
              />
            ) : (
              <PlanPanel
                originId={originId}
                setOriginId={setOriginId}
                buffer={buffer}
                setBuffer={setBuffer}
                priority={priority}
                setPriority={setPriority}
                onBuild={() => {
                  setPlanBuilt(true);
                  setMobilePane("plan");
                }}
              />
            )}
          </div>
        </section>

        {/* Right panel — Live matchday */}
        {planBuilt && (
          <section
            aria-label="Live matchday"
            className={`${panelShell} absolute bottom-0 left-0 right-0 max-h-[62dvh] rounded-t-2xl md:bottom-10 md:left-auto md:right-4 md:top-[74px] md:max-h-none md:w-[370px] md:rounded-2xl ${
              mobilePane === "live" ? "flex" : "hidden"
            } md:flex`}
          >
            <div className="scroll-area flex-1 overflow-y-auto overscroll-contain">
              <LivePanel view={view} />
            </div>
          </section>
        )}

        {/* Operator hint — subtle, desktop only */}
        <p className="absolute bottom-2.5 left-1/2 hidden -translate-x-1/2 text-[10px] text-white/25 md:block">
          demo replay · <kbd className="rounded bg-white/10 px-1">n</kbd> next event ·{" "}
          <kbd className="rounded bg-white/10 px-1">b</kbd> back
        </p>
      </div>

      {/* Event toast */}
      <Toast event={toastEvent} />
    </main>
  );
}
