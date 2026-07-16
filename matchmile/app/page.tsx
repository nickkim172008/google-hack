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
import { dataFreshnessSeconds, origins, timeline, type Origin } from "@/data/seed";
import { deriveReplayView } from "@/lib/replay";
import PlanPanel, { type MyLocationState } from "@/components/PlanPanel";
import RecommendedPanel from "@/components/RecommendedPanel";
import LivePanel from "@/components/LivePanel";
import Toast, { type ToastNotice } from "@/components/Toast";
import Chatbot from "@/components/Chatbot";

// Leaflet touches `window` — render the map client-side only.
const MapCanvas = dynamic(() => import("@/components/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-slate-200 text-xs text-slate-500 dark:bg-[#0b1210] dark:text-white/30">
      Loading Toronto…
    </div>
  ),
});

type Theme = "light" | "dark";
const THEME_KEY = "mm-theme";

const EVENT_ICONS: Record<string, string> = {
  transit_alert: "⚠️",
  kickoff: "⚽",
  score_update: "⚽",
  extra_time: "⏱",
  full_time: "🏁",
};

/** Downtown Toronto demo area — routes are seeded for this bbox only */
const DEMO_BBOX = { latMin: 43.6, latMax: 43.69, lngMin: -79.48, lngMax: -79.3 };
const inDemoArea = (lat: number, lng: number) =>
  lat >= DEMO_BBOX.latMin &&
  lat <= DEMO_BBOX.latMax &&
  lng >= DEMO_BBOX.lngMin &&
  lng <= DEMO_BBOX.lngMax;

export default function Home() {
  // ----- Theme (light default; persisted) ----------------------------------
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      // Mount-time setState is intentional: reading localStorage in a lazy
      // initializer would desync SSR markup and cause a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "dark" || saved === "light") setTheme(saved);
    } catch {
      /* private mode etc. — keep default */
    }
  }, []);
  const toggleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* non-blocking */
    }
  };

  // ----- Plan form state ----------------------------------------------------
  const [originId, setOriginId] = useState(origins[0].id);
  const [buffer, setBuffer] = useState(75);
  const [priority, setPriority] = useState("least-crowded");
  const [planBuilt, setPlanBuilt] = useState(false);

  // ----- Browser geolocation ("Use my location") ---------------------------
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [myLocationState, setMyLocationState] = useState<MyLocationState>("none");

  // ----- Crowd-heat overlay -------------------------------------------------
  const [heatOn, setHeatOn] = useState(true);

  // ----- Shared replay state (drives every panel + the map) -----------------
  const [eventIndex, setEventIndex] = useState(0);
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const prevIndex = useRef(0);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ----- Mobile: which sheet is visible --------------------------------------
  const [mobilePane, setMobilePane] = useState<"plan" | "live">("plan");

  const view = deriveReplayView(eventIndex);

  const showNotice = (n: ToastNotice) => {
    setNotice(n);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4500);
  };

  const requestLocation = () => {
    // Re-selecting the chip when we already have a fix: no new prompt needed.
    if (userLocation) {
      setOriginId("my-location");
      setMyLocationState(inDemoArea(userLocation.lat, userLocation.lng) ? "ok" : "outside");
      return;
    }
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      showNotice({
        id: `geo-${Date.now()}`,
        icon: "📍",
        title: "Location unavailable — pick a preset origin",
        detail: "This browser does not expose geolocation.",
      });
      return;
    }
    setMyLocationState("pending");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setOriginId("my-location");
        setMyLocationState(inDemoArea(loc.lat, loc.lng) ? "ok" : "outside");
      },
      () => {
        setMyLocationState("none");
        showNotice({
          id: `geo-${Date.now()}`,
          icon: "📍",
          title: "Location unavailable — pick a preset origin",
          detail: "Permission denied or timed out. The demo works fine with the presets.",
        });
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  // Effective origin: browser location only counts inside the seeded demo
  // area; otherwise Union Station honestly remains the route origin.
  const presetOrigin = origins.find((o) => o.id === originId) ?? origins[0];
  const usingMyLocation = originId === "my-location";
  const myLocationUsable =
    usingMyLocation && userLocation !== null && inDemoArea(userLocation.lat, userLocation.lng);
  const origin: Origin = myLocationUsable
    ? { id: "my-location", label: "My location", lat: userLocation!.lat, lng: userLocation!.lng }
    : usingMyLocation
      ? origins[0]
      : presetOrigin;
  const locationNote =
    usingMyLocation && myLocationState === "outside"
      ? "You're outside the demo area — routes are seeded for downtown Toronto, so Union Station stays the route origin."
      : null;

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
      const evt = timeline[eventIndex - 1];
      setNotice({
        id: evt.id,
        icon: EVENT_ICONS[evt.type] ?? "•",
        title: evt.title,
        detail: evt.detail,
      });
      prevIndex.current = eventIndex;
      const t = setTimeout(() => setNotice(null), 4500);
      return () => clearTimeout(t);
    }
    prevIndex.current = eventIndex;
  }, [eventIndex]);

  const panelShell =
    "pointer-events-auto flex flex-col overflow-hidden border border-slate-200 bg-white/85 shadow-2xl shadow-slate-900/10 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/85 dark:shadow-black/50";
  const chipShell =
    "border-slate-200 bg-white/85 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/85";

  return (
    <main
      data-theme={theme}
      className="relative h-dvh w-full overflow-hidden bg-slate-100 dark:bg-[#0b1210]"
    >
      {/* Persistent full-screen map canvas */}
      <div className="absolute inset-0 z-0">
        <MapCanvas
          origin={origin}
          alertActive={view.alertActive}
          planBuilt={planBuilt}
          theme={theme}
          heatOn={heatOn}
          heatPhase={view.heatPhase}
          userLocation={userLocation}
          showOriginMarker={!myLocationUsable}
        />
      </div>

      {/* Floating UI layer — panels re-enable pointer events individually */}
      <div className="pointer-events-none absolute inset-0 z-[1000]">
        {/* Brand — top left */}
        <div
          className={`pointer-events-auto absolute left-4 top-4 flex items-center gap-2.5 rounded-2xl border px-3.5 py-2 ${chipShell}`}
        >
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-to-br from-emerald-300 to-emerald-500 text-sm">
            <span aria-hidden>⚽</span>
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              Match<span className="text-emerald-600 dark:text-emerald-300">Mile</span>
            </p>
            <p className="text-[9px] uppercase tracking-[0.16em] text-slate-400 dark:text-white/40">
              Toronto · World Cup 2026
            </p>
          </div>
        </div>

        {/* Controls + honesty pills — top right, visible on every screen */}
        <div className="pointer-events-auto absolute right-4 top-4 flex max-w-[72vw] flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            className={`grid h-8 w-8 place-items-center rounded-full border text-sm transition-transform hover:scale-105 ${chipShell}`}
          >
            <span aria-hidden>{theme === "light" ? "🌙" : "☀️"}</span>
          </button>
          {planBuilt && (
            <button
              type="button"
              onClick={() => setHeatOn((h) => !h)}
              aria-pressed={heatOn}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-wider transition-colors ${
                heatOn
                  ? "border-orange-400/70 bg-white/85 text-orange-700 shadow-lg backdrop-blur-md dark:border-orange-400/50 dark:bg-slate-900/85 dark:text-orange-300"
                  : `${chipShell} text-slate-400 dark:text-white/40`
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${heatOn ? "bg-orange-500 dark:bg-orange-300" : "bg-slate-300 dark:bg-white/20"}`}
              />
              CROWD HEAT
            </button>
          )}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold tracking-wider text-amber-700 dark:text-amber-300 ${chipShell} border-amber-500/50 dark:border-amber-400/40`}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500 dark:bg-amber-300" />
            DEMO REPLAY
          </span>
          <span
            className={`rounded-full border px-3 py-1.5 text-[10px] text-slate-500 dark:text-white/55 ${chipShell}`}
          >
            Data freshness: {dataFreshnessSeconds}s
          </span>
        </div>

        {/* Mobile pane toggle (desktop shows both panels side by side) */}
        {planBuilt && (
          <div
            className={`pointer-events-auto absolute left-1/2 top-[4.5rem] flex -translate-x-1/2 rounded-full border p-1 md:hidden ${chipShell}`}
          >
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
                    ? "bg-emerald-500 text-white dark:bg-emerald-400 dark:text-emerald-950"
                    : "text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white"
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
                locationNote={locationNote}
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
                onUseLocation={requestLocation}
                myLocationState={myLocationState}
                heatPhase={view.heatPhase}
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

        {/* Heat legend — honest wording, never "live density" */}
        {planBuilt && heatOn && (
          <div
            className={`absolute bottom-2.5 left-4 hidden items-center gap-2 rounded-full border px-3 py-1.5 md:flex ${chipShell}`}
          >
            <span className="text-[10px] font-medium text-slate-500 dark:text-white/55">
              Forecasted crowd pressure (relative)
            </span>
            <span className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-white/40">
              <span className="h-2 w-2 rounded-full bg-amber-400/70" /> lower
              <span className="ml-1 h-2 w-2 rounded-full bg-orange-500/70" /> med
              <span className="ml-1 h-2 w-2 rounded-full bg-rose-500/70" /> higher
            </span>
          </div>
        )}

        {/* Operator hint — subtle, desktop only */}
        <p className="absolute bottom-2.5 left-1/2 hidden -translate-x-1/2 text-[10px] text-slate-400 dark:text-white/25 md:block">
          demo replay ·{" "}
          <kbd className="rounded bg-slate-200 px-1 dark:bg-white/10">n</kbd> next event ·{" "}
          <kbd className="rounded bg-slate-200 px-1 dark:bg-white/10">b</kbd> back
        </p>
      </div>

      {/* Event + app notices */}
      <Toast notice={notice} />

      {/* Scripted matchday assistant */}
      {planBuilt && <Chatbot view={view} origin={origin} />}
    </main>
  );
}
