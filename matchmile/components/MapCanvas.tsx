"use client";

/**
 * Full-screen Leaflet canvas (react-leaflet v5). Rendered client-only via
 * next/dynamic (ssr: false) from app/page.tsx. All UI floats above this.
 *
 * Route styling is driven entirely by the replay state:
 *  - initial:  Route B emerald (recommended), Route A slate dashed
 *  - alerted:  Route A emerald (promoted), Route B rose dashed + alert badge,
 *              Route C drawn (fallback becomes active) as slate dotted
 */
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMemo } from "react";
import { routes, venue, timeline, type Origin } from "@/data/seed";

interface MapCanvasProps {
  origin: Origin;
  alertActive: boolean;
  /** Routes are only drawn once a plan has been built */
  planBuilt: boolean;
}

const routeA = routes.find((r) => r.id === "route-a")!;
const routeB = routes.find((r) => r.id === "route-b")!;
const routeC = routes.find((r) => r.id === "route-c")!;
const alertEvent = timeline.find((e) => e.type === "transit_alert");

/** Midpoint between Union Station and BMO Field */
const CENTER: [number, number] = [43.6402, -79.3995];

const RECOMMENDED = { color: "#34d399", weight: 5, opacity: 0.95 };
const ALTERNATIVE = { color: "#94a3b8", weight: 3.5, opacity: 0.6, dashArray: "7 9" };
const DEMOTED = { color: "#fb7185", weight: 4, opacity: 0.75, dashArray: "5 8" };
const FALLBACK = { color: "#64748b", weight: 3, opacity: 0.55, dashArray: "2 8" };

export default function MapCanvas({ origin, alertActive, planBuilt }: MapCanvasProps) {
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

      {planBuilt && (
        <>
          {/* Route A — alternative initially, promoted to recommended on alert */}
          <Polyline
            positions={routeA.polyline}
            pathOptions={alertActive ? RECOMMENDED : ALTERNATIVE}
          />
          {/* Route B — recommended initially, demoted (alert) after the event */}
          <Polyline
            positions={routeB.polyline}
            pathOptions={alertActive ? DEMOTED : RECOMMENDED}
          />
          {/* Route C — fallback, drawn only once it becomes active */}
          {alertActive && <Polyline positions={routeC.polyline} pathOptions={FALLBACK} />}

          {/* Alert badge on the affected Route B rail segment (Exhibition GO) */}
          {alertActive && alertEvent?.location && (
            <Marker position={alertEvent.location} icon={alertIcon} />
          )}
        </>
      )}

      <Marker position={[origin.lat, origin.lng]} icon={originIcon} />
      <Marker position={[venue.lat, venue.lng]} icon={venueIcon} />
    </MapContainer>
  );
}
