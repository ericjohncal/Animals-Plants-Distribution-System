# Explore Page — eBird API Integration

**Status:** Draft for review
**Date:** 2026-04-23
**Owner:** Eric Jayan

## 1. Goal

Replace the current stub Explore tab with a live, eBird-powered page that lets
a user pick a US region and see three views of bird data: recent sightings,
month-by-month observation patterns, and per-species detail.

All bird data must come from the public eBird API (free tier) via a
server-side proxy. Cornell Lab's attribution and acceptable-use terms must be
honored.

## 2. Non-goals

- Non-US regions (v2).
- Cornell's Status & Trends animated heatmaps (gated product; we deep-link
  and embed their public species pages instead).
- Single-species migration mode with a picker (all ~30 top species rendered
  at once is the v1 experience; click a bar to drill into that species).
- Caching beyond Vercel's edge cache (no Redis, no KV).

## 3. User experience

### Page shell

The Explore tab loads with a region already selected (localStorage default
`US-TX-303` = Lubbock County, TX — matches the Map tab). Top of page:

- Hero heading: *"See which birds are where, by month."*
- Sub: *"Live bird data from eBird. Pick a region to start."*
- Region picker:
  - `📍 Use my location` button (browser geolocation → US Census geocoder
    → eBird region code)
  - Cascading dropdowns: Country (US, locked for v1) → State → optional
    County
- Segmented control below the picker: **Recent / Migration / Species**

A persistent footer reads *"Bird data from [eBird.org](https://ebird.org) —
Cornell Lab of Ornithology."*

### Recent view

Default view on first visit. Fetches `data/obs/{region}/recent?back=14`.
Renders a grid of cards (reusing the recent-sightings card styling from
the Map tab) showing species common + scientific name, location name,
date, and observer count. Click → Species view for that species.

### Migration view

Fetches `data/obs/{region}/historic/{y}/{m}/15` for 24 combinations
(months 1–12, current year and previous year). All 24 calls dispatched
in parallel; each is edge-cached for 30 days so repeat visits are free.

Aggregates into `Map<speciesCode, {name, sci, monthCounts[12]}>`. Keeps the
top ~30 species by total count; renders a month slider (Jan–Dec) driving
a horizontal bar chart: one bar per species, bar length = observation
count for the selected month summed across both years. Clicking a bar
switches to Species view for that species.

### Species view

Shows for one species: common + scientific name, a recent-sightings table
in the active region (from `data/obs/{region}/recent/{speciesCode}`), and
an embedded iframe of that species' eBird page at
`https://ebird.org/species/{speciesCode}/{regionCode}`.

Cornell sets `X-Frame-Options` on some pages, and the `load` event fires
even when embedding is blocked, so JS detection is unreliable. Instead,
always render an `Open on eBird →` link immediately below the iframe as
a permanent, no-JS fallback. If the iframe blanks out, the user still
has a one-click path out.

### Error / empty / loading

- Skeletons (not spinners) while loading.
- Upstream 4xx → `"Region not found"` + reset button.
- Upstream 5xx / proxy timeout → toast with retry; keep the previously
  rendered data on screen.
- Empty result → `"No recent sightings in {region} — try a larger area"`.
- Geolocation denied → silently fall back to the dropdown.

## 4. Architecture

### Data flow

```
Browser                 Vercel Function              eBird API
─────                  ───────────────               ─────────
hooks/useRegion   ──►
hooks/useEbird    ──►  /api/ebird/[...path]      ──► api.ebird.org/v2
                        │
                        ├─ path allowlist
                        ├─ X-eBirdApiToken header
                        ├─ Cache-Control per path
                        └─ transparent JSON / status passthrough
```

All client fetches go to the proxy. The eBird API key is never exposed
to the browser.

### Proxy function

Location: `frontend/api/ebird/[...path].js`
Runtime: default Vercel Node (Fluid Compute).

Responsibilities:

1. Join `req.query.path` into a URL path.
2. Reject paths not matching the allowlist (regex array; see below) with
   HTTP 400.
3. Build an upstream URL: `https://api.ebird.org/v2/{path}?{passthroughQs}`.
4. Fetch with `X-eBirdApiToken: process.env.EBIRD_API_KEY`.
5. Mirror upstream status and body on error.
6. On success, set `Cache-Control` per the table below and return JSON.

Allowlist:

| Regex | Purpose |
|---|---|
| `^data/obs/[^/]+/recent$` | Recent by region |
| `^data/obs/geo/recent$` | Recent by lat/lng |
| `^data/obs/[^/]+/recent/[^/]+$` | Recent by region + species |
| `^data/obs/[^/]+/historic/\d{4}/\d{1,2}/\d{1,2}$` | Historic by date |
| `^ref/region/list/subnational1/US$` | US state list |
| `^ref/region/list/subnational2/US-[A-Z]{2}$` | Counties per state |
| `^ref/taxonomy/ebird$` | Species taxonomy |

Cache-Control:

| Path shape | Value |
|---|---|
| `historic/…` | `public, s-maxage=2592000, stale-while-revalidate=86400` |
| `ref/…` | `public, s-maxage=2592000, stale-while-revalidate=86400` |
| everything else (recent) | `public, s-maxage=300, stale-while-revalidate=60` |

### Geolocation → region code

Browser geolocation returns lat/lng. Hit the free US Census Geocoder
(`geocoding.geo.census.gov/geocoder/geographies/coordinates`) for FIPS
state + county, then compose the eBird region code as
`US-{stateAbbrev}-{countyFips3}`, where `{countyFips3}` is the 3-digit
county FIPS code, zero-padded (e.g. FIPS `303` for Lubbock → `US-TX-303`).
State FIPS is mapped to its USPS abbreviation via a static table. Result
is cached client-side per session.

This request goes browser → Census directly (no proxy needed; Census has
CORS and no key).

### Rate / volume profile

Target: &lt; 1,000 upstream requests / day across all users.

Worst case for a first-ever visit to a fresh region:
24 historic + 1 recent + 1 county list = 26 upstream calls.
After edge caching, subsequent visits are 1–2 calls (just the "recent"
endpoints, which expire every 5 min).

## 5. Components

```
src/components/explore/
  RegionPicker.jsx         Geolocation button + state/county cascade
  ViewSwitcher.jsx         Segmented control (Recent/Migration/Species)
  RecentView.jsx           Grid of recent sightings
  MigrationView.jsx        Month slider + FrequencyBars
  MonthSlider.jsx          1–12 month selector (Jan/Feb/…)
  FrequencyBars.jsx        Horizontal bar chart for selected month
  SpeciesView.jsx          Header + recent table + iframe embed
  BirdCard.jsx             Shared sighting card (used by Recent + Species)
  Attribution.jsx          Persistent eBird/Cornell credit

src/services/
  ebird.js                 Thin client for /api/ebird/* + aggregation
  regions.js               US state list; county fetch/cache; geocoding

src/hooks/
  useRegion.js             localStorage-persisted { regionCode, label }
  useEbird.js              fetch + loading/error + in-memory dedupe

frontend/api/ebird/
  [...path].js             Proxy function (see §4)
```

`components/MigrationTab.jsx` stays at its current path (to avoid churn
in `App.jsx`) but its default export is now the `ExploreTab` composition
that mounts RegionPicker + ViewSwitcher + the three views.

## 6. Environment variables

Set in **Vercel Project → Settings → Environment Variables** for all
environments (Production, Preview, Development):

- `EBIRD_API_KEY` — the key issued by Cornell. Never committed. Never
  prefixed with `REACT_APP_` (that would bake it into the client bundle).

## 7. Testing

CRA ships Jest. Add `@testing-library/react` and write:

- `frontend/api/ebird/__tests__/proxy.test.js` — allowlist enforcement,
  per-path `Cache-Control`, upstream error status/body passthrough.
- `src/services/__tests__/ebird.test.js` — aggregation of 24 historic
  samples into bar-chart rows; deterministic fixtures; no network.
- `src/components/explore/__tests__/RegionPicker.test.jsx` — state
  cascade, geolocation success, geolocation denied fallback, Census
  geocoder mocked.
- `src/components/explore/__tests__/ExploreTab.test.jsx` — renders in
  each of the three modes with mocked hooks; asserts attribution link
  is present.

No snapshot tests; no per-view integration tests.

## 8. Compliance with eBird terms

Design accommodates the attribution and acceptable-use terms issued with
the API key:

- Attribution footer on every Explore view links to eBird.org.
- Non-commercial use only; a TODO note is added near the Vercel project
  settings that any monetization requires a new agreement with Cornell.
- API key lives only in Vercel environment variables on the server side.
- Rate-limit posture: edge caching keeps typical per-user upstream
  traffic below 5 requests and total volume well under 1k/day.
- No framing or stripping of notices — iframe embed on the Species view
  points at Cornell's own species pages with their chrome intact.

## 9. Open questions / v2 backlog

- Add non-US regions once the state/county cascade pattern is validated.
- Let users favorite species and regions; surface them as quick picks.
- A "notable birds" pill on Recent view using `data/obs/{region}/recent/notable`.
- Consider a single-species migration mode as a secondary tab if user
  testing shows the all-species bar chart is too dense.
