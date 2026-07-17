/**
 * LIVE routing engine — replaces the seeded polylines/durations.
 *
 * Geometry and travel times are fetched from OSRM (the public FOSSGIS
 * routing servers — keyless, CORS-enabled, OpenStreetMap data):
 *   - walking legs  → routed-foot profile, real sidewalk/trail geometry
 *   - streetcar legs → routed-car profile pinned through the real TTC stop
 *     sequence (streetcars run on streets), scaled by a stop-dwell factor
 *   - GO rail leg   → fixed track geometry (it's rail infrastructure) with a
 *     schedule-based ride+platform buffer; the walks on both ends are live
 *
 * Crowd risk is computed, not hardcoded: each route's live geometry is
 * intersected with the forecasted crowd hotspots and scored by proximity ×
 * intensity + walking exposure. If any OSRM call fails, the caller falls
 * back to the seeded routes in data/seed.ts so the demo never breaks.
 */
import {
  heatPhases,
  venue,
  type CrowdRisk,
  type RiskFactor,
  type Route,
  type RouteStep,
} from "@/data/seed";

type LatLng = [number, number];

const OSRM_BASE = "https://routing.openstreetmap.de";

/** Streetcars average well below car speed: stop dwell + signals + boarding */
const STREETCAR_FACTOR = 1.6;
/** Typical matchday headway wait folded into the ride step */
const STREETCAR_WAIT_MIN = 4;
/** GO Lakeshore West Union → Exhibition: ride + matchday platform buffer */
const RAIL_MINUTES = 24;

/* ----------------------------- Fixed places ----------------------------- */

const UNION: LatLng = [43.6453, -79.3806];
const EXHIBITION_LOOP: LatLng = [43.6362, -79.4145];
const EXHIBITION_GO: LatLng = [43.6356, -79.42];
const FLEET_STRACHAN: LatLng = [43.6357, -79.4092];
const BMO: LatLng = [venue.lat, venue.lng];

/** Union → Exhibition GO rail corridor (track geometry — genuinely fixed) */
const RAIL_CORRIDOR: LatLng[] = [
  UNION,
  [43.6437, -79.386],
  [43.6423, -79.3915],
  [43.641, -79.397],
  [43.6399, -79.4025],
  [43.639, -79.408],
  [43.6379, -79.4135],
  [43.6367, -79.418],
  EXHIBITION_GO,
];

interface Stop {
  name: string;
  at: LatLng;
}

/** 504/511 King St W westbound boarding stops (order matters: east → west) */
const KING_STOPS: Stop[] = [
  { name: "King & Bay", at: [43.6489, -79.3785] },
  { name: "King & University", at: [43.6472, -79.3852] },
  { name: "King & Spadina", at: [43.6448, -79.3947] },
  { name: "King & Bathurst", at: [43.6441, -79.4024] },
  { name: "King & Strachan", at: [43.6425, -79.4093] },
];

/** 509 Harbourfront westbound boarding stops (east → west) */
const HARBOURFRONT_STOPS: Stop[] = [
  { name: "Union Station loop", at: UNION },
  { name: "Queens Quay & York", at: [43.6398, -79.3812] },
  { name: "Queens Quay & Spadina", at: [43.6362, -79.3936] },
  { name: "Fleet & Bathurst", at: [43.6362, -79.4008] },
];

/* ----------------------------- Geometry math ---------------------------- */

function distMeters(a: LatLng, b: LatLng): number {
  const cos = Math.cos(((a[0] + b[0]) / 2) * (Math.PI / 180));
  const dx = (b[1] - a[1]) * 111320 * cos;
  const dy = (b[0] - a[0]) * 110540;
  return Math.hypot(dx, dy);
}

function nearestStop(from: LatLng, stops: Stop[]): Stop {
  return stops.reduce((best, s) =>
    distMeters(from, s.at) < distMeters(from, best.at) ? s : best
  );
}

/** Min distance (m) from a point to a polyline, planar approximation */
function minDistToPolyline(p: LatLng, line: LatLng[]): number {
  const cos = Math.cos(p[0] * (Math.PI / 180));
  const toXY = ([lat, lng]: LatLng): [number, number] => [
    (lng - p[1]) * 111320 * cos,
    (lat - p[0]) * 110540,
  ];
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const [x1, y1] = toXY(line[i]);
    const [x2, y2] = toXY(line[i + 1]);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, (-x1 * dx - y1 * dy) / l2));
    best = Math.min(best, Math.hypot(x1 + t * dx, y1 + t * dy));
  }
  return best;
}

/* ----------------------------- OSRM client ------------------------------ */

interface OsrmLeg {
  polyline: LatLng[];
  minutes: number;
  meters: number;
}

/** Cache per waypoint set — repeat origin toggles cost zero extra requests */
const legCache = new Map<string, Promise<OsrmLeg>>();

async function osrmLeg(profile: "foot" | "car", points: LatLng[]): Promise<OsrmLeg> {
  const server = profile === "foot" ? "routed-foot" : "routed-car";
  const osrmProfile = profile === "foot" ? "foot" : "driving";
  const coords = points.map(([lat, lng]) => `${lng.toFixed(6)},${lat.toFixed(6)}`).join(";");
  const url = `${OSRM_BASE}/${server}/route/v1/${osrmProfile}/${coords}?overview=full&geometries=geojson&steps=false`;

  const cached = legCache.get(url);
  if (cached) return cached;

  const request = (async (): Promise<OsrmLeg> => {
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const json = await res.json();
    const route = json?.routes?.[0];
    if (json?.code !== "Ok" || !route) throw new Error(`OSRM: ${json?.code ?? "no route"}`);
    return {
      polyline: (route.geometry.coordinates as [number, number][]).map(
        ([lng, lat]): LatLng => [lat, lng]
      ),
      minutes: route.duration / 60,
      meters: route.distance,
    };
  })().catch((err) => {
    legCache.delete(url); // don't cache failures — allow retry
    throw err;
  });

  legCache.set(url, request);
  return request;
}

/* ----------------------------- Crowd risk ------------------------------- */

/**
 * Score a route's live geometry against the forecasted pre-match hotspots:
 * full weight within 120 m of the line, half weight within 250 m, plus a
 * small penalty per walking minute (outdoor exposure). 0–100, relative.
 */
function assessCrowdRisk(
  polyline: LatLng[],
  walkMinutes: number
): { crowdRisk: CrowdRisk; factors: RiskFactor[] } {
  let exposure = 0;
  const hits: { name: string; weighted: number }[] = [];
  for (const spot of heatPhases.pre_match) {
    const d = minDistToPolyline([spot.lat, spot.lng], polyline);
    const w = d < 120 ? 1 : d < 250 ? 0.5 : 0;
    if (w > 0) {
      exposure += spot.intensity * w;
      hits.push({ name: spot.name, weighted: spot.intensity * w });
    }
  }
  const score = Math.min(95, Math.max(5, Math.round(10 + exposure * 13 + walkMinutes * 0.7)));
  const label = score >= 60 ? "high" : score >= 36 ? "medium" : "low";
  const peak = hits.sort((a, b) => b.weighted - a.weighted)[0];

  const factors: RiskFactor[] = [
    {
      name: "Corridor load",
      impact: exposure >= 3 ? "high" : exposure >= 1.8 ? "medium" : "low",
      description:
        hits.length > 0
          ? `Passes ${hits.length} forecasted crowd hotspot${hits.length === 1 ? "" : "s"} (heaviest: ${peak.name}).`
          : "Clears all forecasted crowd hotspots.",
    },
    {
      name: "Walking exposure",
      impact: walkMinutes >= 20 ? "high" : walkMinutes >= 10 ? "medium" : "low",
      description: `${walkMinutes} min on foot along this route.`,
    },
    {
      name: "Event peak",
      impact: "medium",
      description: "Travel window overlaps the pre-kickoff arrival peak.",
    },
  ];

  return { crowdRisk: { score, label: label as CrowdRisk["label"] }, factors };
}

/* ----------------------------- Route builders --------------------------- */

const round = (min: number) => Math.max(1, Math.round(min));

async function buildKingRoute(origin: LatLng): Promise<Route> {
  const board = nearestStop(origin, KING_STOPS);
  const downstream = KING_STOPS.slice(KING_STOPS.indexOf(board) + 1).map((s) => s.at);
  const [walk1, ride, walk2] = await Promise.all([
    osrmLeg("foot", [origin, board.at]),
    osrmLeg("car", [board.at, ...downstream, EXHIBITION_LOOP]),
    osrmLeg("foot", [EXHIBITION_LOOP, BMO]),
  ]);

  const w1 = Math.round(walk1.minutes);
  const w2 = round(walk2.minutes);
  const rideMin = round(ride.minutes * STREETCAR_FACTOR + STREETCAR_WAIT_MIN);

  const steps: RouteStep[] = [
    ...(w1 >= 1
      ? [{ mode: "walk" as const, instruction: `Walk to the ${board.name} streetcar stop`, minutes: w1 }]
      : []),
    {
      mode: "streetcar",
      instruction: `Ride the 504/511 west along King St W from ${board.name} to Exhibition Loop (incl. ≈${STREETCAR_WAIT_MIN} min wait)`,
      minutes: rideMin,
    },
    { mode: "walk", instruction: "Walk from Exhibition Loop to the BMO Field east gate", minutes: w2 },
  ];

  const polyline = [...walk1.polyline, ...ride.polyline, ...walk2.polyline];
  const walkMinutes = Math.max(0, w1) + w2;
  return {
    id: "route-a",
    name: "Route A — King streetcar",
    modeSummary: `504/511 streetcar from ${board.name} → Exhibition Loop`,
    steps,
    totalMinutes: steps.reduce((n, s) => n + s.minutes, 0),
    walkMinutes,
    polyline,
    ...assessCrowdRisk(polyline, walkMinutes),
  };
}

async function buildRailRoute(origin: LatLng): Promise<Route> {
  const [walk1, walk2] = await Promise.all([
    osrmLeg("foot", [origin, UNION]),
    osrmLeg("foot", [EXHIBITION_GO, BMO]),
  ]);

  // Station navigation to the GO concourse is never under ~3 min
  const w1 = Math.max(3, Math.round(walk1.minutes));
  const w2 = round(walk2.minutes);

  const steps: RouteStep[] = [
    { mode: "walk", instruction: "Walk to the GO concourse at Union Station", minutes: w1 },
    {
      mode: "rail",
      instruction: "GO Lakeshore West train to Exhibition GO (includes platform buffer)",
      minutes: RAIL_MINUTES,
    },
    {
      mode: "walk",
      instruction: "Walk through the Exhibition grounds to the BMO Field west gate",
      minutes: w2,
    },
  ];

  const polyline = [...walk1.polyline, ...RAIL_CORRIDOR, ...walk2.polyline];
  const walkMinutes = w1 + w2;
  return {
    id: "route-b",
    name: "Route B — GO Lakeshore West",
    modeSummary: "GO train Union → Exhibition GO, then a short walk",
    steps,
    totalMinutes: steps.reduce((n, s) => n + s.minutes, 0),
    walkMinutes,
    polyline,
    ...assessCrowdRisk(polyline, walkMinutes),
  };
}

async function buildWaterfrontRoute(origin: LatLng): Promise<Route> {
  const board = nearestStop(origin, HARBOURFRONT_STOPS);
  const downstream = HARBOURFRONT_STOPS.slice(HARBOURFRONT_STOPS.indexOf(board) + 1).map(
    (s) => s.at
  );
  const [walk1, ride, walk2] = await Promise.all([
    osrmLeg("foot", [origin, board.at]),
    osrmLeg("car", [board.at, ...downstream, FLEET_STRACHAN]),
    osrmLeg("foot", [FLEET_STRACHAN, BMO]),
  ]);

  const w1 = Math.round(walk1.minutes);
  const w2 = round(walk2.minutes);
  const rideMin = round(ride.minutes * STREETCAR_FACTOR + STREETCAR_WAIT_MIN);

  const steps: RouteStep[] = [
    ...(w1 >= 1
      ? [{ mode: "walk" as const, instruction: `Walk to the ${board.name} streetcar stop`, minutes: w1 }]
      : []),
    {
      mode: "streetcar",
      instruction: `509 Harbourfront from ${board.name} to the Fleet & Strachan loop (incl. ≈${STREETCAR_WAIT_MIN} min wait)`,
      minutes: rideMin,
    },
    {
      mode: "walk",
      instruction: "Walk the Martin Goodman Trail along the waterfront to the BMO Field south gate",
      minutes: w2,
    },
  ];

  const polyline = [...walk1.polyline, ...ride.polyline, ...walk2.polyline];
  const walkMinutes = Math.max(0, w1) + w2;
  return {
    id: "route-c",
    name: "Route C — Harbourfront (fallback)",
    modeSummary: `509 streetcar from ${board.name} → waterfront trail walk`,
    steps,
    totalMinutes: steps.reduce((n, s) => n + s.minutes, 0),
    walkMinutes,
    polyline,
    ...assessCrowdRisk(polyline, walkMinutes),
  };
}

/* ----------------------------- Public API ------------------------------- */

/**
 * Builds all three route options live from the given origin.
 * Throws if OSRM is unreachable — callers fall back to the seeded routes.
 */
export async function buildLiveRoutes(origin: { lat: number; lng: number }): Promise<Route[]> {
  const o: LatLng = [origin.lat, origin.lng];
  return Promise.all([buildKingRoute(o), buildRailRoute(o), buildWaterfrontRoute(o)]);
}
