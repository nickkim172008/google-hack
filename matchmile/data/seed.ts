/**
 * ============================================================================
 * MatchMile — SEED DATA (demo replay)
 * ============================================================================
 * ALL demo data lives in this one file. Edit freely — the UI reads everything
 * from here. No live APIs are called anywhere in the app.
 *
 * Quick map:
 *   match      → the fixture shown on the Plan screen
 *   origins    → the 3 preset origin chips
 *   venue      → BMO Field (destination)
 *   fanZone    → official fan festival (used in the post-match egress plan)
 *   routes     → Route A / B / C with steps, polylines and crowd-risk factors
 *   plan       → leave-by / arrive-by copy, before and after the transit alert
 *   egress     → post-match departure copy (89' options, extra time, full-time)
 *   timeline   → THE scripted replay. Press `n` to advance, `b` to go back.
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
  { id: "liberty", label: "Liberty Village", lat: 43.6371, lng: -79.42 },
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
      [43.647, -79.3812], // walk north to King St
      [43.6478, -79.3854], // King & University
      [43.6463, -79.3913], // King & John
      [43.6452, -79.3957], // King & Spadina
      [43.6442, -79.4022], // King & Bathurst
      [43.6427, -79.4073], // King & Niagara
      [43.6414, -79.4103], // King & Strachan
      [43.6389, -79.413], // south on Strachan
      [43.6365, -79.4155], // Exhibition Loop
      [43.6348, -79.4172],
      [43.6332, -79.4186], // BMO Field
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
      [43.6453, -79.3806], // Union Station
      [43.644, -79.385], // rail corridor SW
      [43.6425, -79.3905],
      [43.641, -79.3965],
      [43.6398, -79.403],
      [43.6388, -79.409],
      [43.638, -79.4145],
      [43.6355, -79.4193], // Exhibition GO
      [43.6345, -79.419],
      [43.6332, -79.4186], // BMO Field
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
      [43.642, -79.38], // Bay & Queens Quay
      [43.6395, -79.385], // Queens Quay & York
      [43.6385, -79.392], // Queens Quay & Rees
      [43.637, -79.399], // Queens Quay & Spadina
      [43.636, -79.405],
      [43.6355, -79.4105], // Fleet & Bathurst
      [43.6338, -79.413], // Fleet St loop
      [43.6325, -79.4155], // Martin Goodman Trail
      [43.6328, -79.4175],
      [43.6332, -79.4186], // BMO Field
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

/* ----------------------------- Plan copy ---------------------------------
 * Leave-by / arrive-by strings shown in the hero, before and after the
 * scripted transit alert reranks the routes.
 * ------------------------------------------------------------------------ */

export const plan = {
  /** Initial state — Route B recommended (least crowded) */
  initial: {
    recommendedRouteId: "route-b",
    alternativeRouteId: "route-a",
    fallbackRouteId: "route-c",
    leaveBy: "5:42 PM",
    arriveBy: "~6:15 PM",
    countdown: "Departure window opens in 42 min",
    tradeoff: "Adds 6 minutes vs Route A, avoids the primary stadium arrival corridor.",
  },
  /** After the transit alert — Route A promoted, Route B demoted */
  afterAlert: {
    recommendedRouteId: "route-a",
    alternativeRouteId: "route-c",
    demotedRouteId: "route-b",
    leaveBy: "5:32 PM",
    arriveBy: "~6:00 PM",
    countdown: "Departure window opens in 12 min",
    whyChanged:
      "Alert affects Route B rail segment; Route A now recommended despite higher corridor exposure — leave 10 min earlier to compensate.",
    warningBanner:
      "Service alert: GO Lakeshore West — delays at Exhibition GO. Plan reranked.",
  },
};

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
    location: [43.6355, -79.4193], // Exhibition GO
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
