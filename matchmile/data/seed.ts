/**
 * ============================================================================
 * MatchMile — SEED DATA (scripted replay + offline fallback)
 * ============================================================================
 * ROUTES ARE LIVE: geometry, durations and leave-by times are computed at
 * runtime from OSRM (lib/routing.ts) for the actual origin. The `routes`
 * below are only the OFFLINE FALLBACK used if OSRM is unreachable — the demo
 * degrades gracefully instead of breaking.
 *
 * The match events (timeline) remain a deterministic scripted replay, and the
 * crowd-pressure hotspots are a forecast model — both intentionally seeded.
 *
 * Quick map:
 *   match      → the fixture shown on the Plan screen
 *   origins    → the 3 preset origin chips
 *   venue      → BMO Field (destination)
 *   fanZone    → official fan festival (used in the post-match egress plan)
 *   routes     → OFFLINE FALLBACK Route A / B / C (live versions from OSRM)
 *   egress     → post-match departure copy (89' options, extra time, full-time)
 *   timeline   → THE scripted replay. Press `n` to advance, `b` to go back.
 *   heatPhases → forecasted crowd-pressure hotspots per replay phase (map heat)
 *   nearbyEvents → other seeded events tonight (fan festival, concert, Jays)
 *   cityStops  → pre-match city experiences (activations, photo ops) that can
 *                be added to the plan — leave-by shifts earlier to fit them
 * ============================================================================
 */

/* ----------------------------- Types ------------------------------------ */

export type Mode = "rail" | "streetcar" | "walk";

export interface RouteStep {
  mode: Mode;
  instruction: string;
  minutes: number;
}

export type RiskLabel = "low" | "medium" | "high";

export interface CrowdRisk {
  /** 0–100, relative — this is a forecast, not measured density */
  score: number;
  label: RiskLabel;
}

export interface RiskFactor {
  name: string;
  impact: "none" | "low" | "medium" | "high";
  description: string;
}

export interface Route {
  id: string;
  name: string;
  /** Short human summary of the modes, shown under the route name */
  modeSummary: string;
  steps: RouteStep[];
  totalMinutes: number;
  walkMinutes: number;
  /** [lat, lng] waypoints, drawn on the Leaflet map. Refine freely. */
  polyline: [number, number][];
  crowdRisk: CrowdRisk;
  /** Transparent reasons behind the risk score — rendered in "Why this route?" */
  factors: RiskFactor[];
}

export interface Origin {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export type TimelineEventType =
  | "transit_alert"
  | "kickoff"
  | "score_update"
  | "extra_time"
  | "full_time";

export interface TimelineEvent {
  /** Unique id — keeps replay idempotent if events are re-applied */
  id: string;
  type: TimelineEventType;
  /** Display time in the live feed (wall clock or match minute) */
  clock: string;
  title: string;
  detail: string;
  /** Score after this event, if it changes */
  score?: { home: number; away: number };
  /** Match clock chip shown in the live header after this event */
  matchClock?: string;
  /** Map coordinate for alert badges (used by the transit alert) */
  location?: [number, number];
}

/* ----------------------------- Match ------------------------------------ */

export const match = {
  id: "demo-match-001",
  home: { name: "Canada", code: "CAN", flag: "🇨🇦" },
  away: { name: "Italy", code: "ITA", flag: "🇮🇹" },
  stage: "Group stage",
  venueName: "BMO Field",
  city: "Toronto",
  /** Tonight, 7:30 PM America/Toronto */
  kickoffISO: "2026-07-16T19:30:00-04:00",
  kickoffLabel: "7:30 PM",
  dateLabel: "Tonight · Thu Jul 16",
};

/* ----------------------------- Places ----------------------------------- */

export const origins: Origin[] = [
  { id: "union", label: "Union Station", lat: 43.6453, lng: -79.3806 },
  { id: "hotel", label: "Downtown Hotel — King & Bay", lat: 43.6487, lng: -79.3817 },
  { id: "liberty", label: "Liberty Village", lat: 43.6387, lng: -79.4198 },
];

export const venue = {
  id: "bmo-field",
  name: "BMO Field",
  lat: 43.6332,
  lng: -79.4186,
};

export const fanZone = {
  id: "fan-festival",
  name: "Official Fan Festival — Exhibition Place",
  lat: 43.635,
  lng: -79.413,
};

/* ----------------------------- Routes -----------------------------------
 * OFFLINE FALLBACK ONLY — live routes come from OSRM via lib/routing.ts.
 * Route A — fastest, but runs through the primary pre-match crowd corridor.
 * Route B — recommended by default: rail bypasses the corridor entirely.
 * Route C — fallback: waterfront streetcar + Martin Goodman Trail walk.
 * ------------------------------------------------------------------------ */

export const routes: Route[] = [
  {
    id: "route-a",
    name: "Route A — King streetcar",
    modeSummary: "504/511 streetcar via King St W → Exhibition Loop",
    steps: [
      { mode: "walk", instruction: "Walk to the King & Bay streetcar stop", minutes: 3 },
      { mode: "streetcar", instruction: "Ride the 504/511 west along King St W to Exhibition Loop", minutes: 21 },
      { mode: "walk", instruction: "Walk from Exhibition Loop to the BMO Field east gate", minutes: 3 },
    ],
    totalMinutes: 27,
    walkMinutes: 6,
    polyline: [
      [43.6453, -79.3806], // Union Station
      [43.6489, -79.3785], // King & Bay streetcar stop
      [43.6482, -79.3818], // King & York
      [43.6472, -79.3852], // King & University
      [43.6459, -79.391], // King & John
      [43.6448, -79.3947], // King & Spadina
      [43.6444, -79.3987], // King & Portland
      [43.6441, -79.4024], // King & Bathurst
      [43.6434, -79.4056], // King & Niagara
      [43.6425, -79.4093], // King & Strachan
      [43.6403, -79.411], // Strachan Ave south, over the rail corridor
      [43.6383, -79.4125], // Strachan & Fleet
      [43.6362, -79.4145], // Exhibition Loop
      [43.6345, -79.4165], // through Exhibition grounds
      [43.6332, -79.4186], // BMO Field east gate
    ],
    crowdRisk: { score: 68, label: "high" },
    factors: [
      {
        name: "Corridor load",
        impact: "high",
        description:
          "King St W is the primary pre-match crowd corridor — streetcars are forecast to arrive full by Bathurst.",
      },
      {
        name: "Event peak",
        impact: "medium",
        description: "Travel window overlaps the 60–90 min pre-kickoff arrival peak.",
      },
      {
        name: "Service alerts",
        impact: "none",
        description: "No active alerts affect this route.",
      },
    ],
  },
  {
    id: "route-b",
    name: "Route B — GO Lakeshore West",
    modeSummary: "GO train Union → Exhibition GO, then a short walk",
    steps: [
      { mode: "walk", instruction: "Walk to the GO concourse at Union Station", minutes: 3 },
      { mode: "rail", instruction: "GO Lakeshore West train to Exhibition GO (includes platform buffer)", minutes: 24 },
      { mode: "walk", instruction: "Walk through the Exhibition grounds to the BMO Field west gate", minutes: 6 },
    ],
    totalMinutes: 33,
    walkMinutes: 9,
    polyline: [
      [43.6453, -79.3806], // Union Station GO concourse
      [43.6437, -79.386], // rail corridor SW past the Rogers Centre
      [43.6423, -79.3915],
      [43.641, -79.397],
      [43.6399, -79.4025],
      [43.639, -79.408], // passing Fort York
      [43.6379, -79.4135],
      [43.6367, -79.418],
      [43.6356, -79.42], // Exhibition GO
      [43.6344, -79.4193], // walk through the Exhibition grounds
      [43.6332, -79.4186], // BMO Field west gate
    ],
    crowdRisk: { score: 24, label: "low" },
    factors: [
      {
        name: "Corridor load",
        impact: "low",
        description: "The rail corridor bypasses the King St W arrival crowds entirely.",
      },
      {
        name: "Event peak",
        impact: "medium",
        description: "Travel occurs about 75 minutes before kickoff.",
      },
      {
        name: "Capacity",
        impact: "low",
        description: "GO adds matchday train capacity; boarding at Union is ahead of the surge.",
      },
    ],
  },
  {
    id: "route-c",
    name: "Route C — Harbourfront (fallback)",
    modeSummary: "509 streetcar via Queens Quay → walk the Martin Goodman Trail",
    steps: [
      { mode: "streetcar", instruction: "509 Harbourfront from the Union Station loop to Fleet & Bathurst", minutes: 27 },
      { mode: "walk", instruction: "Walk the Martin Goodman Trail along the waterfront to the BMO Field south gate", minutes: 14 },
    ],
    totalMinutes: 41,
    walkMinutes: 14,
    polyline: [
      [43.6453, -79.3806], // Union Station (509 loop)
      [43.6404, -79.3771], // Queens Quay & Bay (out of the tunnel)
      [43.6398, -79.3812], // Queens Quay & York
      [43.6389, -79.386], // Queens Quay & Rees
      [43.6377, -79.3905], // Queens Quay & Lower Spadina approach
      [43.6362, -79.3936], // Queens Quay & Spadina
      [43.636, -79.3975], // Queens Quay & Dan Leckie Way
      [43.6362, -79.4008], // Fleet & Bathurst
      [43.6359, -79.4055], // Fleet St west
      [43.6357, -79.4092], // Fleet & Strachan loop
      [43.634, -79.411], // south to the waterfront
      [43.6325, -79.414], // Martin Goodman Trail west
      [43.6318, -79.417], // trail at Ontario Place approach
      [43.6332, -79.4186], // BMO Field south gate
    ],
    crowdRisk: { score: 35, label: "medium" },
    factors: [
      {
        name: "Corridor load",
        impact: "low",
        description: "Waterfront route avoids King St W, though the Fleet St loop gets busy near kickoff.",
      },
      {
        name: "Walking exposure",
        impact: "medium",
        description: "14 minutes outdoors on the Martin Goodman Trail.",
      },
      {
        name: "Service alerts",
        impact: "none",
        description: "No active alerts affect this route.",
      },
    ],
  },
];

/* ----------------------------- Egress copy ------------------------------- */

export const egress = {
  /** Shown after the 89' score update */
  scoreUpdate: {
    hint: "End time uncertain — preparing departure options",
    options: [
      {
        id: "leave-now",
        title: "Leave now",
        detail: "Beat the full-time surge — depart via Exhibition GO before crowd risk peaks.",
        risk: "medium" as RiskLabel,
      },
      {
        id: "wait-fan-zone",
        title: "Wait 20 min at fan zone",
        detail: "Let the first wave clear at the Official Fan Festival; forecast station risk eases to medium.",
        risk: "low" as RiskLabel,
      },
    ],
  },
  /** Shown when extra time begins */
  extraTime: {
    expectedEnd: "~10:15 PM",
    note: "Expected end time recalculated: ~10:15 PM. Departure options shifted to the new window.",
  },
  /** Shown at full-time — the staggered egress plan */
  fullTime: {
    headline: "Staggered egress plan active",
    detail:
      "Station crowd risk HIGH for first 25 min. Recommended: walk to the official fan zone, depart 9:55 PM via Exhibition GO.",
    departLabel: "Depart 9:55 PM · Exhibition GO",
    stationRisk: { score: 82, label: "high" as RiskLabel },
    /** Post-match route summary */
    steps: [
      { mode: "walk" as Mode, instruction: "Walk east to the Official Fan Festival (Exhibition Place)", minutes: 6 },
      { mode: "walk" as Mode, instruction: "Head to Exhibition GO once the first wave clears", minutes: 4 },
      { mode: "rail" as Mode, instruction: "GO Lakeshore West east to Union Station", minutes: 12 },
    ],
  },
};

/* ----------------------------- Timeline ----------------------------------
 * THE scripted replay. Index 0 = pre-match plan as built.
 * Keyboard: `n` advances one event, `b` goes back one. No on-screen buttons.
 * ------------------------------------------------------------------------ */

export const timeline: TimelineEvent[] = [
  {
    id: "evt-001",
    type: "transit_alert",
    clock: "5:20 PM",
    title: "Service alert: GO Lakeshore West",
    detail: "Service alert: GO Lakeshore West delays at Exhibition GO. Route B rail segment affected — plan reranked.",
    location: [43.6356, -79.42], // Exhibition GO
  },
  {
    id: "evt-002",
    type: "kickoff",
    clock: "7:30 PM",
    title: "Kickoff — match under way",
    detail: "Canada vs Italy is under way at BMO Field.",
    score: { home: 0, away: 0 },
    matchClock: "1'",
  },
  {
    id: "evt-003",
    type: "score_update",
    clock: "89'",
    title: "Goal — Italy equalize, 1–1",
    detail: "End time uncertain — preparing departure options.",
    score: { home: 1, away: 1 },
    matchClock: "89'",
  },
  {
    id: "evt-004",
    type: "extra_time",
    clock: "90'+5",
    title: "Extra time confirmed",
    detail: "Expected end time recalculated: ~10:15 PM.",
    score: { home: 1, away: 1 },
    matchClock: "ET 91'",
  },
  {
    id: "evt-005",
    type: "full_time",
    clock: "Full-time",
    title: "Full-time — Canada win 2–1",
    detail: "Staggered egress plan activated. Station crowd risk HIGH for the first 25 min.",
    score: { home: 2, away: 1 },
    matchClock: "FT",
  },
];

/* ----------------------------- Misc ------------------------------------- */

export const cities = [
  { id: "toronto", label: "Toronto", available: true },
  { id: "vancouver", label: "Vancouver", available: false },
  { id: "los-angeles", label: "Los Angeles", available: false },
  { id: "mexico-city", label: "Mexico City", available: false },
];

export const priorities = [
  { id: "fastest", label: "Fastest" },
  { id: "least-crowded", label: "Least crowded" },
  { id: "accessible", label: "Accessible" },
  { id: "lowest-walking", label: "Lowest walking" },
];

export const arrivalBuffers = [45, 60, 75, 90]; // minutes before kickoff

export const dataFreshnessSeconds = 20;

/* ----------------------------- Crowd heat --------------------------------
 * Forecasted RELATIVE crowd pressure per replay phase — drawn as translucent
 * concentric circles on the map (never presented as live density).
 * intensity is 0–1: < 0.45 renders amber, 0.45–0.74 orange, ≥ 0.75 rose.
 * The active phase follows the replay: press `n` and the heat evolves.
 * ------------------------------------------------------------------------ */

export type HeatPhaseKey = "pre_match" | "in_match" | "post_match";

export interface HeatSpot {
  /** Editor-facing label (not rendered) */
  name: string;
  lat: number;
  lng: number;
  /** 0–1 relative forecasted crowd pressure */
  intensity: number;
}

export const heatPhases: Record<HeatPhaseKey, HeatSpot[]> = {
  /** Arrival surge: King St W corridor + Exhibition Loop + stadium gates */
  pre_match: [
    { name: "King & Spadina", lat: 43.6448, lng: -79.3947, intensity: 0.55 },
    { name: "King & Bathurst", lat: 43.6441, lng: -79.4024, intensity: 0.62 },
    { name: "King & Strachan", lat: 43.6425, lng: -79.4093, intensity: 0.68 },
    { name: "Exhibition Loop", lat: 43.6362, lng: -79.4145, intensity: 0.85 },
    { name: "Union Station", lat: 43.6453, lng: -79.3806, intensity: 0.5 },
    { name: "BMO Field gates", lat: 43.6332, lng: -79.4186, intensity: 0.8 },
  ],
  /** During the match: streets quiet, pressure inside the stadium */
  in_match: [
    { name: "Union Station", lat: 43.6453, lng: -79.3806, intensity: 0.25 },
    { name: "King St W corridor", lat: 43.6444, lng: -79.3987, intensity: 0.2 },
    { name: "BMO Field (in-stadium)", lat: 43.6332, lng: -79.4186, intensity: 0.5 },
  ],
  /** Egress surge (extra time & full-time): Exhibition GO peaks */
  post_match: [
    { name: "Exhibition GO", lat: 43.6356, lng: -79.42, intensity: 0.95 },
    { name: "BMO Field gates", lat: 43.6332, lng: -79.4186, intensity: 0.8 },
    { name: "Fan Festival", lat: 43.635, lng: -79.413, intensity: 0.55 },
    { name: "King St W corridor", lat: 43.6434, lng: -79.4056, intensity: 0.45 },
  ],
};

/* ----------------------------- Nearby events -----------------------------
 * Other seeded events tonight — shown as map markers (🎪 🎵 ⚾) and in the
 * collapsible "Events nearby" panel. `affectsDuring` controls when the amber
 * "affects your plan" chip appears (keyed to the replay phase).
 * ------------------------------------------------------------------------ */

export interface NearbyEvent {
  id: string;
  name: string;
  venue: string;
  lat: number;
  lng: number;
  timeLabel: string;
  category: "fan-festival" | "concert" | "sports";
  /** Emoji used for the map marker */
  icon: string;
  /** One-line mobility impact, honest and specific */
  mobilityImpact: string;
  /** Replay phases during which this event adds pressure to the user's plan */
  affectsDuring: HeatPhaseKey[];
}

/* ----------------------------- City stops --------------------------------
 * Pre-match city experiences for visiting fans — FIFA activation sites,
 * photo ops and the fan festival. "Add to plan" folds one into the matchday
 * plan: leave-by moves earlier by (detour + time on site). Seeded, like
 * everything else.
 * ------------------------------------------------------------------------ */

export interface CityStop {
  id: string;
  name: string;
  venue: string;
  lat: number;
  lng: number;
  /** Emoji used for the map marker */
  icon: string;
  /** What's actually there, one honest line */
  description: string;
  photoOp: boolean;
  openLabel: string;
  /** Suggested time on site */
  dwellMinutes: number;
  /** Extra travel vs the direct route */
  detourMinutes: number;
  /** One practical visitor tip */
  tip: string;
}

export const cityStops: CityStop[] = [
  {
    id: "nathan-phillips",
    name: "FIFA Fan Activation — Nathan Phillips Square",
    venue: "Toronto City Hall",
    lat: 43.6525,
    lng: -79.3835,
    icon: "🏆",
    description:
      "Giant WORLD CUP letters, a trophy-replica photo op and sponsor activations under the City Hall arches.",
    photoOp: true,
    openLabel: "10 AM – 10 PM",
    dwellMinutes: 40,
    detourMinutes: 15,
    tip: "Busiest at lunch — mid-afternoon has the shortest photo line.",
  },
  {
    id: "fan-festival-early",
    name: "Fan Festival — arrive early",
    venue: "Exhibition Place",
    lat: 43.6357,
    lng: -79.4118,
    icon: "🎪",
    description:
      "Live DJs, big screens and food trucks right beside the stadium — fold it in before gates open.",
    photoOp: true,
    openLabel: "3 – 11 PM",
    dwellMinutes: 45,
    detourMinutes: 5,
    tip: "It sits beside BMO Field, so it barely adds travel — you just leave earlier.",
  },
  {
    id: "harbourfront-mural",
    name: "Waterfront Trophy Mural",
    venue: "Harbourfront Centre — Queens Quay",
    lat: 43.6387,
    lng: -79.383,
    icon: "📸",
    description:
      "Block-long World Cup mural with the skyline behind it, right on the Martin Goodman Trail.",
    photoOp: true,
    openLabel: "All day",
    dwellMinutes: 20,
    detourMinutes: 10,
    tip: "Golden-hour light off the lake lands around 6 PM — right in your departure window.",
  },
];

export const nearbyEvents: NearbyEvent[] = [
  {
    id: "fan-festival",
    name: "FIFA Fan Festival",
    venue: "Exhibition Place",
    lat: 43.635,
    lng: -79.413,
    timeLabel: "3–11 PM",
    category: "fan-festival",
    icon: "🎪",
    mobilityImpact: "Adds steady crowd across the Exhibition grounds all evening",
    affectsDuring: ["pre_match", "post_match"],
  },
  {
    id: "budweiser-stage-concert",
    name: "Concert",
    venue: "Budweiser Stage",
    lat: 43.6289,
    lng: -79.4155,
    timeLabel: "8:00 PM",
    category: "concert",
    icon: "🎵",
    mobilityImpact: "Ends ≈10 PM — overlaps match egress, adds pressure at Exhibition GO",
    affectsDuring: ["post_match"],
  },
  {
    id: "jays-red-sox",
    name: "Blue Jays vs Red Sox",
    venue: "Rogers Centre",
    lat: 43.6414,
    lng: -79.3894,
    timeLabel: "7:05 PM",
    category: "sports",
    icon: "⚾",
    mobilityImpact: "Union Station busy 6–7 PM and again ≈9:45 PM",
    affectsDuring: ["pre_match"],
  },
];
