"use client";

/**
 * Full-screen Leaflet canvas (react-leaflet v5). Rendered client-only via
 * next/dynamic (ssr: false) from app/page.tsx. All UI floats above this.
 *
 * Route styling is driven entirely by the replay state:
 *  - initial:  Route B emerald (recommended), Route A slate dashed
 *  - alerted:  Route A emerald (promoted), Route B rose dashed + alert badge,
 *              Route C drawn (fallback becomes active) as slate dotted
 *
 * Extras: faked crowd-heat overlay (concentric translucent circles — no
 * plugin), nearby-event markers, and the browser-geolocation dot.
 */
import { Circle, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import {
  cityStops,
  heatPhases,
  nearbyEvents,
  timeline,
  venue,
  type HeatPhaseKey,
  type Origin,
  type Route,
} from "@/data/seed";

export interface LatLng {
  lat: number;
  lng: number;
}

interface MapCanvasProps {
  origin: Origin;
  /** Route set to draw — live OSRM geometry, or the seeded fallback */
  routes: Route[];
  alertActive: boolean;
  /** Routes are only drawn once a plan has been built */
  planBuilt: boolean;
  theme: "light" | "dark";
  /** Crowd-heat overlay (faked with layered circles, no plugin) */
  heatOn: boolean;
  heatPhase: HeatPhaseKey;
  /** Browser geolocation result, if the user shared it */
  userLocation: LatLng | null;
  /** Hide the emerald origin dot when the blue user dot IS the origin */
  showOriginMarker: boolean;
  /** Pre-match city stops folded into the plan — highlighted + side-trip line */
  addedStopIds: string[];
}

const alertEvent = timeline.find((e) => e.type === "transit_alert");

/** Midpoint between Union Station and BMO Field */
const CENTER: [number, number] = [43.6402, -79.3995];

/** Route colors per theme — darker strokes so lines stay legible on light tiles */
const ROUTE_STYLES = {
  dark: {
    recommended: { color: "#34d399", weight: 5, opacity: 0.95 },
    alternative: { color: "#94a3b8", weight: 3.5, opacity: 0.6, dashArray: "7 9" },
    demoted: { color: "#fb7185", weight: 4, opacity: 0.75, dashArray: "5 8" },
    fallback: { color: "#64748b", weight: 3, opacity: 0.55, dashArray: "2 8" },
  },
  light: {
    recommended: { color: "#059669", weight: 5, opacity: 0.95 },
    alternative: { color: "#475569", weight: 3.5, opacity: 0.65, dashArray: "7 9" },
    demoted: { color: "#e11d48", weight: 4, opacity: 0.8, dashArray: "5 8" },
    fallback: { color: "#475569", weight: 3, opacity: 0.5, dashArray: "2 8" },
  },
} as const;

/** amber → orange → rose ramp by forecast intensity */
function heatColor(intensity: number): string {
  if (intensity >= 0.75) return "#f43f5e";
  if (intensity >= 0.45) return "#f97316";
  return "#f59e0b";
}

/** Concentric radii (m) + per-ring base opacity — stacks toward the center */
const HEAT_RINGS: Array<[number, number]> = [
  [400, 0.07],
  [250, 0.1],
  [120, 0.16],
];

/** Pans the map to include the user's location when it first arrives. */
function PanToUser({ userLocation }: { userLocation: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation) {
      map.flyToBounds(
        L.latLngBounds([
          [userLocation.lat, userLocation.lng],
          [venue.lat, venue.lng],
        ]).pad(0.2),
        { duration: 0.8 }
      );
    }
  }, [userLocation, map]);
  return null;
}

export default function MapCanvas({
  origin,
  routes,
  alertActive,
  planBuilt,
  theme,
  heatOn,
  heatPhase,
  userLocation,
  showOriginMarker,
  addedStopIds,
}: MapCanvasProps) {
  const styles = ROUTE_STYLES[theme];
  const routeA = routes.find((r) => r.id === "route-a")!;
  const routeB = routes.find((r) => r.id === "route-b")!;
  const routeC = routes.find((r) => r.id === "route-c")!;

  const originIcon = useMemo(
    () =>
      L.divIcon({
        className: "mm-divicon",
        html: `<div class="mm-marker-origin"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    []
  );

  const userIcon = useMemo(
    () =>
      L.divIcon({
        className: "mm-divicon",
        html: `<div class="mm-marker-user"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    []
  );

  const venueIcon = useMemo(
    () =>
      L.divIcon({
        className: "mm-divicon",
        html: `<div class="mm-marker-venue"><span class="mm-marker-venue-dot">&#9917;</span><span>${venue.name}</span></div>`,
        iconSize: [110, 30],
        iconAnchor: [55, 15],
      }),
    []
  );

  const alertIcon = useMemo(
    () =>
      L.divIcon({
        className: "mm-divicon",
        html: `<div class="mm-marker-alert">&#9888;</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      }),
    []
  );

  const eventIcons = useMemo(
    () =>
      Object.fromEntries(
        nearbyEvents.map((e) => [
          e.id,
          L.divIcon({
            className: "mm-divicon",
            html: `<div class="mm-marker-event">${e.icon}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        ])
      ),
    []
  );

  // Rebuilt when a stop is added/removed so the emerald ring appears.
  const stopIcons = useMemo(
    () =>
      Object.fromEntries(
        cityStops.map((s) => [
          s.id,
          L.divIcon({
            className: "mm-divicon",
            html: `<div class="mm-marker-event${addedStopIds.includes(s.id) ? " mm-marker-stop-active" : ""}">${s.icon}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        ])
      ),
    [addedStopIds]
  );

  const addedStops = cityStops.filter((s) => addedStopIds.includes(s.id));
  const sideTripStyle = {
    color: theme === "dark" ? "#34d399" : "#059669",
    weight: 3,
    opacity: 0.55,
    dashArray: "3 7",
  };

  return (
    <MapContainer
      center={CENTER}
      zoom={14}
      zoomControl={false}
      scrollWheelZoom
      className="mm-map h-full w-full"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <PanToUser userLocation={userLocation} />

      {/* Forecasted crowd-pressure overlay — drawn first so routes sit on top */}
      {planBuilt &&
        heatOn &&
        heatPhases[heatPhase].map((spot) => {
          const color = heatColor(spot.intensity);
          const scale = 0.5 + spot.intensity * 0.7;
          return HEAT_RINGS.map(([radius, baseOpacity]) => (
            <Circle
              key={`${heatPhase}-${spot.name}-${radius}`}
              center={[spot.lat, spot.lng]}
              radius={radius}
              interactive={false}
              pathOptions={{
                stroke: false,
                fillColor: color,
                fillOpacity: baseOpacity * scale,
              }}
            />
          ));
        })}

      {planBuilt && (
        <>
          {/* Route A — alternative initially, promoted to recommended on alert */}
          <Polyline
            positions={routeA.polyline}
            pathOptions={alertActive ? styles.recommended : styles.alternative}
          />
          {/* Route B — recommended initially, demoted (alert) after the event */}
          <Polyline
            positions={routeB.polyline}
            pathOptions={alertActive ? styles.demoted : styles.recommended}
          />
          {/* Route C — fallback, drawn only once it becomes active */}
          {alertActive && <Polyline positions={routeC.polyline} pathOptions={styles.fallback} />}

          {/* Alert badge on the affected Route B rail segment (Exhibition GO) */}
          {alertActive && alertEvent?.location && (
            <Marker position={alertEvent.location} icon={alertIcon} />
          )}
        </>
      )}

      {/* Nearby events — always visible context (🎪 🎵 ⚾) */}
      {nearbyEvents.map((e) => (
        <Marker key={e.id} position={[e.lat, e.lng]} icon={eventIcons[e.id]}>
          <Tooltip direction="top" offset={[0, -14]}>
            {e.name} · {e.timeLabel}
          </Tooltip>
        </Marker>
      ))}

      {/* Pre-match city stops (🏆 🎪 📸) — added ones get an emerald ring
          and a schematic dashed side-trip line from the origin */}
      {planBuilt &&
        addedStops.map((s) => (
          <Polyline
            key={`side-trip-${s.id}`}
            positions={[
              [origin.lat, origin.lng],
              [s.lat, s.lng],
            ]}
            pathOptions={sideTripStyle}
          />
        ))}
      {planBuilt &&
        cityStops.map((s) => (
          <Marker key={s.id} position={[s.lat, s.lng]} icon={stopIcons[s.id]}>
            <Tooltip direction="top" offset={[0, -14]}>
              {s.name} · {s.openLabel}
              {addedStopIds.includes(s.id) ? " · in your plan" : ""}
            </Tooltip>
          </Marker>
        ))}

      {showOriginMarker && <Marker position={[origin.lat, origin.lng]} icon={originIcon} />}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Tooltip direction="top" offset={[0, -10]}>My location</Tooltip>
        </Marker>
      )}
      <Marker position={[venue.lat, venue.lng]} icon={venueIcon} />
    </MapContainer>
  );
}
