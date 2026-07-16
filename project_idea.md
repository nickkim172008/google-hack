# MatchMile — FIFA Host City Navigator

**Document purpose:** Complete product, engineering, data, UX, demo, and delivery specification for an AI-enabled FIFA World Cup host-city mobility hackathon project.

**Version:** 1.0  
**Primary demo:** Toronto, Canada  
**Platform claim:** Configurable for every FIFA World Cup 2026 host city; deeply operational for 2–3 launch/demo cities.  
**Recommended stack:** Next.js PWA + FastAPI + Mapbox + event replay service.

---

## 1. One-sentence pitch

**MatchMile is a FIFA matchday mobility copilot that recommends when and how fans should travel to stadiums and official fan zones, adapting routes to tournament operations, crowd-risk forecasts, accessibility needs, local disruptions, and the live state of a match.**

Unlike a standard maps product, MatchMile does not only return directions. It returns a matchday plan:

- The best time to leave
- The best route for the user’s priority
- Estimated relative crowd risk
- Closure and accessibility warnings
- A fallback route
- A post-match departure plan

---

## 2. Problem statement

The 2026 FIFA World Cup takes place across multiple host cities in Canada, Mexico, and the United States. Fans will often be unfamiliar with local transit, stadium access rules, temporary road closures, fan zones, rideshare restrictions, and expected crowd behavior.

The actual fan question is not:

> How do I get from A to B?

It is:

> I am staying downtown, attending tonight’s match, traveling with my family, need limited walking, and want to avoid the largest crowd surge. When should we leave, which route is best, and how do we get back if the match goes to extra time?

### Key pain points

- Event information is fragmented across transit agencies, stadium websites, FIFA information, city notices, and mapping apps.
- World Cup matchdays create temporary restrictions and unusual crowd demand.
- The fastest route may not be the least stressful or least crowded route.
- Fans have different needs: wheelchair access, children, luggage, language, walking tolerance, or cost constraints.
- Match duration is uncertain because of stoppage time, extra time, and penalties.
- Visitors may not understand local fare systems, transit networks, pickup areas, or event zones.

---

## 3. Product definition

### What MatchMile is

MatchMile is a mobile-first decision-support platform for FIFA World Cup mobility.

It combines:

- FIFA match metadata and live/replayed match state
- Host-city venue and fan-zone information
- Route candidates from a mapping provider
- Transit operations and alerts where available
- Temporary closure and restricted-zone rules
- User preferences and accessibility needs
- A transparent relative crowd-risk model

### What MatchMile is not

MatchMile is not:

- A replacement for Google Maps, Apple Maps, transit agencies, emergency services, or official stadium instructions
- A system that claims exact live crowd density without a legitimate data source
- A generic LLM travel chatbot
- A guarantee of travel time, route capacity, service availability, or safety

### Truthful language

Use:

- “Estimated crowd risk”
- “Forecasted relative congestion”
- “Recommended based on available mobility data”
- “Route may change based on service updates”

Do not use:

- “Live crowd density” unless real occupancy data is connected
- “Guaranteed fastest route”
- “Guaranteed safe route”
- “Real-time transit capacity” without official live capacity data

---

## 4. Target users

| Persona | Situation | Job to be done |
|---|---|---|
| International visitor | Does not know the city or transit system | Arrive reliably without reading multiple local websites |
| Family/group traveler | Needs predictable travel, walking, and arrival time | Make matchday travel lower-stress |
| Accessibility-first fan | Needs step-free or low-walking routing | Find a viable route matching mobility needs |
| Local fan | Knows the city but not World Cup operations | Avoid temporary closures and exceptional crowding |
| Post-match traveler | Needs a plan after stadium egress | Decide whether to leave immediately or wait |
| Fan-zone visitor | Wants to travel to an official viewing location | Find the best route during event peaks |

---

## 5. Core user flow

### User inputs

The user selects:

- Host city
- Match
- Starting location
- Destination: stadium, fan festival, hotel, airport, or designated pickup zone
- Desired arrival buffer, defaulting to 75 minutes before kickoff
- Priority:
  - Fastest
  - Least crowded
  - Accessible
  - Lowest walking
  - Lowest cost
- Optional constraints:
  - Wheelchair / step-free requirement
  - Maximum walking time
  - Traveling with children
  - Luggage
  - Preferred language

### Product outputs

MatchMile returns:

1. Recommended leave-by time
2. Recommended route
3. Estimated arrival time
4. Transit and walking steps
5. Crowd-risk label: Low, Medium, or High
6. Explanation of why the route was selected
7. Temporary closure or operational warnings
8. A viable fallback route
9. A post-match departure plan
10. Data freshness and whether the app is in live or replay mode

### Example result

> **Leave at 5:42 PM** to arrive around 6:15 PM for a 7:30 PM kickoff.  
>
> **Recommended route:** Take commuter rail to Stadium Station, then walk 9 minutes.  
>
> **Why this route:** It adds six minutes compared with the fastest option, but avoids the primary pre-match crowd corridor and has less walking.  
>
> **Crowd risk:** Low.  
>
> **Fallback:** Use Route B if the rail service alert becomes active.  
>
> **Post-match:** Wait near the official fan zone for 20 minutes after full-time; immediate station crowd risk is expected to be high.

---

## 6. FIFA live-match integration

MatchMile should feel connected to a live FIFA match, not like a static event planner.

The product responds to match lifecycle events:

| Match state | Mobility impact | Product response |
|---|---|---|
| Three hours before kickoff | Fans begin arriving | Recommend early-arrival routes and fan-zone options |
| Ninety to thirty minutes before kickoff | Arrival demand peaks | Increase crowd risk on key corridors |
| Kickoff | Stadium access demand ends | Shift focus toward in-match status |
| Half-time | Concession demand rises inside venue | Avoid unnecessary travel prompts |
| Eightieth minute in close match | End time uncertainty rises | Prepare multiple post-match strategies |
| Full-time | Large coordinated exit begins | Activate egress recommendation |
| Extra time begins | Original departure forecast becomes outdated | Recalculate expected end and egress risk |
| Penalty shootout | End time becomes volatile | Show broader departure estimate |
| Transit disruption | Route availability changes | Re-rank routes and explain update |

### Important causal rule

Goals, red cards, and VAR decisions should not automatically be treated as crowd signals.

They should only affect mobility recommendations when there is a clear operational reason, for example:

- Extra time changes the expected match end time
- Full-time activates stadium egress forecasting
- A delayed kickoff shifts arrival timing
- An official evacuation or transit alert changes routing

---

## 7. Why this is different from Google Maps

| Capability | Generic maps product | MatchMile |
|---|---|---|
| Route from A to B | Yes | Yes |
| FIFA match and stadium context | Limited | Core product data |
| Recommended leave-by time | Partially | Primary output |
| Match-specific arrival planning | Limited | Yes |
| Stadium/fan-zone operating rules | Often fragmented | First-class configuration |
| Closure-aware event logic | May be incomplete | Explicit geofenced rules |
| Relative crowd-risk forecast | Usually opaque | Transparent score and explanation |
| Accessibility versus crowd trade-off | Limited | User-configurable |
| Full-time / extra-time egress planning | No | Yes |
| Multi-host-city event model | No | Yes |

The product value is not map rendering. The value is **event-aware recommendation under uncertainty**.

---

## 8. MVP scope

### Must-have features

- Mobile-first web interface
- City selector
- Match selector
- Origin and destination selection
- Two to three candidate routes
- One deeply configured city
- One additional configured city
- Route ranking based on user preference
- Closure-aware route filtering
- Relative crowd-risk scoring
- Route explanation
- Fallback route
- WebSocket or SSE match-event replay
- Extra-time or full-time route recalculation
- Visible live/replay data mode
- Seeded scenario for reliable judging demo

### Strong additions if time permits

- GTFS-realtime transit alerts
- Weather-aware walking penalty
- Step-free filtering
- English, French, and Spanish interface support
- Crowd-risk timeline for the next three hours
- Browser notification simulation
- Observability dashboard
- Accessibility-first screen-reader mode

### Explicitly out of scope

- Real-time CCTV crowd counting
- Exact passenger occupancy predictions
- Native mobile app development
- Deep support for all 16 cities in one hackathon
- Restaurant recommendation engine
- Ticket purchasing
- User accounts
- Training a complex ML model without defensible data

---

## 9. Multi-city platform strategy

MatchMile must be architected as a reusable host-city platform.

### Product positioning

> MatchMile supports FIFA host cities through configurable city adapters. The hackathon demo provides deep operational support for two cities and basic support for additional host cities.

### City adapter structure

```text
cities/
  toronto/
    city.json
    venues.json
    destinations.json
    transit_hubs.json
    closure_rules.json
    mobility_profile.json
    demo_scenarios.json

  los_angeles/
    city.json
    venues.json
    destinations.json
    transit_hubs.json
    closure_rules.json
    mobility_profile.json
    demo_scenarios.json

  mexico_city/
    city.json
    venues.json
    destinations.json
    transit_hubs.json
    closure_rules.json
    mobility_profile.json
    demo_scenarios.json
```

### City configuration responsibilities

Each city adapter stores:

- City name, timezone, language, and currency
- Stadium and gate coordinates
- Fan-zone locations
- Transit hubs
- Curated pickup/drop-off zones
- Closure geofences
- Time-based access restrictions
- Transit mode preferences
- Crowd profile weights
- Accessibility metadata
- Data support level
- Demo scenarios

### Example city configuration

```json
{
  "city_id": "toronto",
  "display_name": "Toronto",
  "timezone": "America/Toronto",
  "default_language": "en",
  "currency": "CAD",
  "routing_provider": "mapbox",
  "mobility_profile": {
    "primary_modes": ["rail", "streetcar", "walk"],
    "base_pre_event_peak_minutes": 75,
    "base_post_event_peak_minutes": 45,
    "crowd_weight": 1.0
  },
  "data_capabilities": {
    "static_transit": true,
    "realtime_alerts": false,
    "official_closures": true,
    "accessibility_metadata": "partial"
  }
}
```

### Recommended demo cities

| City | Why it matters |
|---|---|
| Toronto | Local relevance, transit-heavy matchday access, fan-zone model |
| Los Angeles | Car-oriented mobility, rideshare constraints, long first/last-mile challenge |
| Mexico City | Dense metro system, multilingual needs, high-throughput transit |
| Seattle | Alternative transit-oriented city with rail/bus trade-offs |

---

## 10. Data sources

### Required data categories

| Data type | Use | MVP approach |
|---|---|---|
| FIFA fixtures | Match selection and kickoff times | Curated JSON fixture data |
| Stadiums and venues | Destination and last-mile routing | Curated data or OpenStreetMap |
| Fan zones | Official alternative destinations | Curated per-city configuration |
| Transit schedules | Route candidates | Mapping API or GTFS static data |
| Transit service alerts | Route invalidation | Optional GTFS-realtime or mocked alerts |
| Closure zones | Filter invalid routes | City-configured geofences |
| Match events | Match-state replay | Seeded event stream |
| Weather | Walking penalty | Optional weather API |
| Accessibility metadata | Constraint filtering | Curated city/station configuration |

### Data integrity rules

- Do not scrape websites in violation of terms of service.
- Record source name and freshness timestamp.
- Never represent seeded data as live.
- Use clear `data_mode` values:
  - `demo_replay`
  - `static`
  - `live`
- Avoid storing exact user origins unless necessary.
- Do not expose API keys in the frontend.

---

## 11. Crowd-risk engine

### Product objective

The risk engine estimates **relative route congestion**, not exact crowd density.

### Core formula

For a candidate route \(r\), at time \(t\), in city \(c\):

\[
Risk(r,t,c) =
w_1 P_{event}(t) +
w_2 C_{corridor}(r) +
w_3 D_{service}(r,t) +
w_4 X_{closure}(r,t) +
w_5 W_{weather}(t) -
w_6 K_{capacity}(r)
\]

Where:

- \(P_{event}(t)\): event-time demand pressure
- \(C_{corridor}(r)\): route proximity to high-demand corridors
- \(D_{service}(r,t)\): transit disruption penalty
- \(X_{closure}(r,t)\): restriction or closure impact
- \(W_{weather}(t)\): weather-related walking penalty
- \(K_{capacity}(r)\): capacity proxy for the route

### Risk labels

| Score | Label |
|---|---|
| 0–33 | Low |
| 34–66 | Medium |
| 67–100 | High |

### Example structured result

```json
{
  "route_id": "route_b",
  "crowd_risk_score": 31,
  "crowd_risk_label": "low",
  "factors": [
    {
      "name": "event_peak",
      "impact": "medium",
      "description": "Travel occurs 60 minutes before kickoff"
    },
    {
      "name": "corridor_load",
      "impact": "low",
      "description": "Route avoids the primary stadium arrival corridor"
    },
    {
      "name": "service_alert",
      "impact": "none",
      "description": "No active alerts affect this route"
    }
  ]
}
```

### Future ML version

When legally usable historical transit or event-demand data exists:

1. Build 15-minute route/corridor snapshots.
2. Create congestion or delay targets.
3. Train an interpretable baseline model.
4. Compare against a rules-based baseline.
5. Use temporal holdout validation.
6. Calibrate confidence scores.
7. Retain rules-based fallback for cities with poor data coverage.

Do not describe the MVP as machine learning unless it includes a trained, evaluated model.

---

## 12. Recommendation engine

### Candidate generation flow

1. Receive user trip request.
2. Query Mapbox or Google Routes for route candidates.
3. Normalize routes to an internal schema.
4. Apply closure and restricted-zone filters.
5. Apply accessibility and walking constraints.
6. Score valid candidates.
7. Rank candidates based on user priority.
8. Select a recommended route and fallback route.
9. Return transparent reasoning factors.

### Ranking formula

\[
Score(r) =
\alpha ETA(r) +
\beta Risk(r) +
\gamma Accessibility(r) +
\delta Walking(r) +
\epsilon Cost(r) +
\zeta Reliability(r)
\]

The weights depend on the selected preference.

### Example weights: least crowded

```json
{
  "eta_weight": 0.15,
  "crowd_risk_weight": 0.45,
  "accessibility_weight": 0.15,
  "walking_weight": 0.10,
  "cost_weight": 0.05,
  "reliability_weight": 0.10
}
```

### Explanation policy

The recommendation engine produces structured facts. An LLM may rewrite the explanation, but it must not invent route details.

```json
{
  "recommended_route_id": "route_b",
  "tradeoff": "Adds 6 minutes compared with Route A",
  "reasons": [
    "Avoids the primary stadium corridor during the pre-kickoff peak",
    "Requires one fewer transfer",
    "Remains outside the restricted vehicle zone"
  ],
  "risk": "medium",
  "data_freshness_seconds": 90
}
```

---

## 13. Technical architecture

```text
                         +----------------------------+
                         | Match Event Feed            |
                         | Live API or Replay Fixture  |
                         +-------------+--------------+
                                       |
                              WebSocket / SSE
                                       |
+----------------+         +-----------v-----------+         +----------------------+
| City Configs   +---------> Match State Service   |         | Transit / Routing    |
| Venues/Closures|         | Phase and end-time    |         | Mapbox/Google/GTFS   |
+-------+--------+         +-----------+-----------+         +----------+-----------+
        |                              |                                |
        |                       +------v--------------------------------v------+
        +-----------------------> Mobility Context Service                      |
                                | Alerts, closures, profiles, freshness        |
                                +----------------------+-----------------------+
                                                       |
                                             +---------v----------+
                                             | Route Ranker        |
                                             | Risk + constraints  |
                                             +---------+----------+
                                                       |
                                             +---------v----------+
                                             | FastAPI API         |
                                             | REST + WS/SSE       |
                                             +---------+----------+
                                                       |
                                            +----------v-----------+
                                            | Next.js PWA           |
                                            | Map + route cards     |
                                            +----------------------+
```

### Recommended stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Next.js, TypeScript, Tailwind | Fast PWA development and responsive UI |
| Map | Mapbox GL JS | Interactive map and directions support |
| Backend | FastAPI, Pydantic | Typed Python APIs and simple model integration |
| Real-time | WebSocket or SSE | Live match and alert updates |
| Database | PostgreSQL or Supabase | Configs, scenarios, optional audit data |
| Cache | Redis, optional | Route caching and match state |
| Deployment | Vercel + Render/Fly/Railway | Fast hackathon deployment |
| CI | GitHub Actions | Linting, tests, build validation |

---

## 14. API contracts

### Create recommendation

`POST /v1/recommendations`

```json
{
  "city_id": "toronto",
  "match_id": "demo-match-001",
  "origin": {
    "lat": 43.645,
    "lng": -79.38,
    "label": "Union Station"
  },
  "destination_type": "stadium",
  "arrival_buffer_minutes": 75,
  "priority": "least_crowded",
  "constraints": {
    "wheelchair": false,
    "max_walk_minutes": 18,
    "travelling_with_children": false,
    "luggage": true
  },
  "at_time": "2026-07-16T17:00:00-04:00"
}
```

Example response:

```json
{
  "recommendation_id": "rec_123",
  "data_mode": "demo_replay",
  "generated_at": "2026-07-16T17:00:02-04:00",
  "match_state": {
    "phase": "pre_match",
    "minutes_to_kickoff": 150
  },
  "recommended": {
    "route_id": "tor_rail_01",
    "leave_by": "2026-07-16T17:42:00-04:00",
    "arrival_estimate": "2026-07-16T18:15:00-04:00",
    "duration_minutes": 33,
    "walk_minutes": 9,
    "crowd_risk": {
      "label": "low",
      "score": 24
    },
    "reasoning": [
      "Avoids the primary stadium corridor during the expected arrival peak",
      "Has a lower walking burden than the fastest alternative"
    ],
    "steps": []
  },
  "alternatives": [],
  "warnings": [],
  "freshness": {
    "routing_seconds": 20,
    "mobility_seconds": 120
  }
}
```

### Match state endpoint

`GET /v1/matches/{match_id}/state`

Returns:

- Match phase
- Kickoff time
- Estimated end time
- Current replay/live status
- Latest match event
- Data freshness

### City support endpoint

`GET /v1/cities`

Returns:

- City metadata
- Stadiums
- Feature support level
- Available data sources
- Accessibility metadata coverage

### Realtime endpoint

`WS /v1/stream`

Events:

- `match_event`
- `match_state_changed`
- `mobility_alert`
- `recommendation_invalidated`
- `route_reranked`

---

## 15. Data model

### Entities

- `City`
- `Venue`
- `Destination`
- `TransitHub`
- `ClosureRule`
- `MobilityAlert`
- `Match`
- `MatchEvent`
- `MatchState`
- `RouteCandidate`
- `RouteAssessment`
- `Recommendation`
- `DemoScenario`

### Match event example

```json
{
  "source_event_id": "demo-event-042",
  "match_id": "demo-match-001",
  "timestamp": "2026-07-16T21:15:00-04:00",
  "type": "extra_time_started",
  "source": "demo_replay",
  "payload": {
    "score_home": 1,
    "score_away": 1
  }
}
```

### Idempotency requirement

Every incoming event must include a unique `source_event_id`.

The backend must prevent duplicate processing, so duplicate event delivery does not create:

- Duplicate notifications
- Duplicate route updates
- Multiple full-time transitions
- Incorrect match-state changes

---

## 16. UX specification

### Screen 1: Plan your matchday

Components:

- Host city selector
- Match selector
- Origin search
- Quick origin chips: hotel, airport, downtown, saved location
- Destination selector
- Arrival buffer selector
- Priority selector
- Trip preferences drawer
- “Build my plan” button

### Screen 2: Recommended plan

Components:

- Large leave-by time
- Countdown to departure
- Map
- Route card
- Transit/walking steps
- Crowd-risk badge
- “Why this route?” panel
- Fallback route
- Operational warnings
- Data freshness indicator
- “Live” or “Demo replay” state label

### Screen 3: Live matchday

Components:

- Match clock and phase
- Current plan status
- Event timeline
- Route update alerts
- Egress plan
- Alternative departure options
- Match-ended / extra-time update state

### Screen 4: Host city explorer

Optional showcase screen:

- FIFA host-city map
- City cards
- Support labels:
  - Detailed
  - Basic
  - Coming soon
- Venue and fan-zone summary

### Accessibility requirements

- Strong color contrast
- Risk labels cannot rely only on color
- Keyboard navigation
- Screen-reader labels
- Clear route instructions
- No critical information only on map markers
- Step-free and low-walking filters
- English, French, and Spanish-ready content structure

---

## 17. Main demo scenario

### Toronto scenario

**User:** Visiting fan staying downtown  
**Match kickoff:** 7:30 PM  
**Priority:** Least crowded  
**Constraint:** Maximum 15 minutes walking  

### Demo sequence

1. At 5:00 PM, the fan asks for a route to the stadium.
2. MatchMile provides two routes.
3. It recommends Route B, even though it is six minutes slower, because Route A passes through a higher-risk pre-match corridor.
4. At 5:20 PM, a simulated transit alert affects Route B.
5. MatchMile receives the alert through WebSocket.
6. The recommendation engine reranks available routes.
7. The interface explains why the plan changed.
8. The match begins.
9. At the eighty-ninth minute, the game is tied.
10. MatchMile prepares immediate and delayed egress plans.
11. Extra time begins.
12. MatchMile recalculates expected end time.
13. At full-time, the app activates a staggered departure plan.

### Cross-city demonstration

Run the same user request for a second city.

Example:

> “Get me from downtown to tonight’s match. I want low walking and the least crowded route.”

Show that:

- The user experience remains consistent.
- The routing strategy changes.
- The transit modes differ.
- City-specific closures and demand profiles affect the recommendation.

---

## 18. Metrics

### Product metrics

- First recommendation available in under five seconds in demo mode
- Every recommendation contains at least one traceable explanation factor
- Closed or prohibited routes are filtered correctly
- At least one live rerank event is shown in the demo
- A user can understand the recommendation without reading a map

### Technical metrics

- P95 recommendation latency below two seconds with cached candidates
- Event-to-UI update latency below one second in replay mode
- Zero duplicate notifications for duplicate events
- City config validation passes in CI
- Demo scenario integration tests pass deterministically

### Trust metrics

- Data mode is always visible
- Risk score always includes reason factors
- Stale data has a visible warning
- No unsupported claim of exact live crowd density

---

## 19. Testing plan

### Unit tests

- Crowd-risk score behaves predictably
- Closure geofence blocks restricted routes
- User priority changes route ranking
- Accessibility constraints remove invalid routes
- Match-state machine handles:
  - Kickoff
  - Half-time
  - Full-time
  - Extra time
  - Penalties
- Duplicate events do not change state twice

### Integration tests

- City config loads successfully
- Route candidates are normalized
- Closure rules filter candidates
- Risk engine scores candidates
- Recommendation endpoint returns ranked routes
- Transit alert triggers reranking
- Extra-time event changes expected match end

### Manual acceptance checks

- Mobile layout works
- Route and crowd risk are visually distinct
- The “why this route” explanation matches structured data
- The fallback route is valid
- Demo works without live APIs

---

## 20. Security, privacy, and safety

- Do not require login for MVP.
- Keep user location in browser state where possible.
- Do not store exact origins by default.
- Keep API keys server-side.
- Restrict mapping API keys by domain and API permissions.
- Rate-limit recommendation endpoints.
- Validate all coordinate, time, city, and enum inputs.
- Display stale-data warnings.
- Link to official city, stadium, or transit guidance.
- Instruct users to follow event staff, signage, emergency alerts, and official directions.

---

## 21. Repository structure

```text
MatchMile/
  apps/
    web/
      app/
      components/
      lib/
      public/

  services/
    api/
      app/
        api/
        domain/
        services/
        adapters/
        schemas/
        tests/

  packages/
    city-config/
    shared-types/

  data/
    cities/
      toronto/
      los_angeles/
      mexico_city/
    scenarios/

  infra/
    docker-compose.yml

  scripts/
    replay_scenario.py
    validate_city_configs.py

  .github/
    workflows/
      ci.yml

  README.md
  ARCHITECTURE.md
  DEMO.md
  CONTRIBUTING.md
```

---

## 22. Implementation plan

### Phase 0: Decisions

- Pick Mapbox or Google Routes.
- Check free-tier limits and API terms.
- Pick Toronto plus one additional city.
- Define city support levels honestly.
- Create deterministic replay scenarios.
- Decide whether real transit alerts are feasible.

### Phase 1: Vertical slice

- Create Next.js frontend.
- Create FastAPI backend.
- Add Toronto city config.
- Add one venue and two sample origins.
- Hard-code route candidates initially.
- Display leave-by time and route card.
- Add unit tests for basic ranking.

### Phase 2: Routing and city rules

- Integrate routing provider.
- Normalize route data.
- Add closure rules.
- Add restricted-zone filtering.
- Add map rendering.
- Add route explanation panel.

### Phase 3: Match state and risk

- Build crowd-risk calculator.
- Build match state machine.
- Create replay event feed.
- Add WebSocket/SSE updates.
- Implement extra-time recalculation.
- Implement fallback route logic.

### Phase 4: Multi-city and polish

- Add second city configuration.
- Add data freshness indicators.
- Add demo/live labels.
- Improve mobile layout.
- Add accessibility improvements.
- Add observability page if time permits.

### Phase 5: Deployment and rehearsal

- Dockerize backend.
- Deploy frontend and API.
- Add GitHub Actions.
- Add linting, tests, config validation, and build checks.
- Rehearse the exact demo path.
- Test cold start and API failure fallback.

---

## 23. Team task split

### Frontend engineer

- Next.js UI
- Mobile responsiveness
- Map integration
- Route cards
- City/match selection
- Risk visualization
- Demo polish

### Backend/data engineer

- FastAPI
- City config schema
- Route normalization
- Closure rules
- Ranking API
- Test fixtures
- Deployment

### Realtime/AI engineer

- Match-event replay
- WebSocket or SSE
- Match-state machine
- Crowd-risk score
- Reranking events
- Observability instrumentation

### Solo developer priority order

1. Working UI vertical slice
2. Deterministic route candidates
3. Rules-based ranker
4. City closure configuration
5. Match replay
6. Reranking behavior
7. Second city
8. Polish and deployment

---

## 24. Pitch script

### Thirty-second version

> World Cup fans will enter unfamiliar cities at the same time, while road restrictions, venue rules, and transit conditions change by matchday. Google Maps gives directions, but it does not give an event-aware plan. MatchMile combines host-city operations, fan preferences, accessibility needs, and the live state of the match to recommend when to leave, which route has lower crowd risk, why it was chosen, and how to get home if the match runs long.

### Judge-facing technical statement

> The LLM is optional presentation polish. The core recommendation is deterministic: route candidates are validated against city restrictions, scored with interpretable crowd-risk factors, and reranked when transit or match-state events arrive.

### Demo flow

1. Show user trip request.
2. Show two candidate routes.
3. Explain why the recommended route is not necessarily the fastest.
4. Trigger a transit alert.
5. Show reranking.
6. Trigger extra time.
7. Show post-match plan update.
8. Switch to another city.
9. Show that the same engine uses different city configuration.

---

## 25. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| No live FIFA match during judging | Cannot rely on live data | Deterministic replay mode |
| Routing provider outage | Demo can fail | Seeded route candidates |
| No real crowd data | Cannot claim exact occupancy | Relative risk scoring |
| Uneven city data | Platform may overpromise | City support labels |
| Transit data complexity | Consumes hackathon time | Use routing provider first |
| Too many host cities | Shallow implementation | Deep support for two cities |
| LLM hallucination | Incorrect travel guidance | Structured facts first |
| Weak match-to-mobility connection | Feels artificial | Use match events only for defensible timing changes |

---

## 26. Future roadmap

- Official transit partnerships
- Real-time vehicle capacity feeds
- Elevator outage-aware accessibility routing
- Multilingual voice interface
- Group coordination and shared meetup planning
- Historical event-demand ML model
- Low-emissions route optimization
- Official venue operations dashboard
- Verified local business and fan-zone recommendations
- Personalized push notifications during matchday

---

## 27. Final checklist

### Product

- [ ] The app tells users when to leave before showing detailed directions
- [ ] The user sees a recommended route and fallback route
- [ ] Each recommendation includes traceable reasons
- [ ] Live, replay, and stale-data states are visible
- [ ] At least one accessibility or walking preference works

### Engineering

- [ ] Replay works without an external live feed
- [ ] Events are idempotent
- [ ] Closure logic is tested
- [ ] API keys are not committed
- [ ] CI validates code and city configs
- [ ] Local setup works from README instructions

### Demo

- [ ] Toronto works end to end
- [ ] Second city demonstrates portability
- [ ] Extra time or full-time updates egress recommendation
- [ ] Transit alert triggers a rerank
- [ ] Limitations are stated honestly

---

## 28. Prompt for another LLM

```text
Act as a principal product engineer and ML systems architect.

Review this MatchMile project specification critically. Do not begin coding immediately.

First, identify:
- vague assumptions
- invalid causal claims
- missing data dependencies
- API and licensing risks
- unsafe UX risks
- scope creep
- architecture weaknesses
- places where the project may be overstating capabilities

Then produce:

1. A refined PRD with measurable acceptance criteria.
2. A revised hackathon MVP that is credible and finishable.
3. A full system design with component contracts and data flows.
4. A routing-provider and data-source decision matrix including cost, reliability, licensing, rate limits, and fallback options.
5. JSON schemas for:
   - city configurations
   - venue configurations
   - closure rules
   - match events
   - route candidates
   - recommendation responses
6. A dependency-ordered implementation plan.
7. A full repository tree and file-by-file plan.
8. Unit, integration, and end-to-end test specifications.
9. A deterministic demo scenario with exact sample inputs and outputs.
10. A three-minute judging script.
11. A list of product claims we must not make without validated data.
12. Security, privacy, and accessibility improvements.

Preserve these non-negotiables:

- The product supports a multi-host-city architecture.
- Toronto can be the deepest demo city, but not the only city.
- The product must connect to live or replayed FIFA match state.
- Do not claim exact live crowd density without legitimate data.
- Route ranking must rely on structured, explainable factors.
- LLMs must not invent routes, closures, service status, or timing.
- The final MVP must be achievable during a hackathon.
```

---

## 29. Recommended initial sources

Verify current terms, accuracy, and availability before integrating any source.

- FIFA World Cup host cities
- FIFA fixture and stadium information
- Official city mobility plans
- Transit agency GTFS feeds
- GTFS-realtime feeds
- Mapbox Directions API or Google Routes API
- Official fan-zone and stadium access information
- OpenStreetMap venue and station metadata

---

## 30. Final project statement

MatchMile is not a better map.

It is a **FIFA-aware host-city mobility decision engine** that helps fans navigate unfamiliar World Cup environments by combining routing, event operations, accessibility needs, estimated crowd pressure, transit disruptions, and live match timing into one explainable plan.