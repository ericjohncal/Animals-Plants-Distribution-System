# WildAtlas — Wildlife & Plant Sighting Tracker

A citizen-science web app where users report local wildlife and plant sightings, get AI-powered species identification, and explore sightings and bird migration patterns on an interactive map.

> **Demo prototype** built for the TTU CS Senior Capstone (Spring 2026). Optimized for a reliable 5–7 minute live demo, not for production. See `Known Limitations` below.

---

## Features

- **Report a Sighting** — Pick a pre-staged demo photo (or upload your own), auto-detect your location, and submit a sighting in seconds.
- **AI Species Identification** — Real iNaturalist Computer Vision API call returns the top 3 species predictions with confidence scores. Mock mode (default) returns canned predictions offline.
- **Interactive Map** — All sightings rendered as pins on a Leaflet/OpenStreetMap map. Click any pin for photo, species name, date, reporter, and notes. Filter by species.
- **Bird Migration View** — Select American Robin and drag a month slider (Jan → Dec) to watch migration patterns shift north in spring and south in fall.

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
git clone https://github.com/ericjohncal/Animals-Plants-Distribution-System.git
cd Animals-Plants-Distribution-System/frontend
npm install
npm start
```

App opens at **http://localhost:3000**.

---

## AI Mock Mode (default for demos)

Mock AI is **on by default** via `frontend/.env`:

```
REACT_APP_USE_MOCK_AI=true
```

Mock returns hardcoded predictions after a 1-second simulated delay:

| Rank | Common Name | Scientific Name | Confidence |
|------|-------------|-----------------|------------|
| 1 | American Robin | *Turdus migratorius* | 91.2% |
| 2 | Hermit Thrush | *Catharus guttatus* | 6.5% |
| 3 | Wood Thrush | *Hylocichla mustelina* | 2.3% |

To use the real iNaturalist Computer Vision API instead, **delete that line from `frontend/.env`** (or set the value to anything other than `true`) and restart `npm start`. If a real API call fails, the app silently falls back to mock predictions so the demo never breaks.

**Test both paths before any live demo.**

---

## Demo Script (5–7 min)

| Time | Action |
|------|--------|
| 0:00–0:30 | Problem hook — why citizen science matters for local biodiversity |
| 0:30–1:30 | Report tab → click the robin demo photo → "Use my location" → "Identify with AI" |
| 1:30–2:30 | Top-3 prediction cards appear → click "Accept" on American Robin → "Submit Sighting" |
| 2:30–4:00 | Auto-switches to Map tab with the new pin → click pins → use species filter dropdown |
| 4:00–5:00 | Migration tab → American Robin already selected → drag month slider Jan → Dec and back |
| 5:00–5:30 | "What's next" — mention planned production stack (see `FUTURE_WORK.md`) |

### Recording a Backup Demo

If you want a screen recording as a safety net:

```bash
# macOS (recommended): QuickTime Player
# File → New Screen Recording → record the 90s flow above
# Save to repo root as demo-backup.mp4
```

If the live demo fails, share your screen and play `demo-backup.mp4`.

---

## Project Structure

```
Animals-Plants-Distribution-System/
├── frontend/
│   ├── public/
│   │   ├── index.html             # Loads Montserrat from Google Fonts
│   │   └── demo-photos/           # robin.jpg, cardinal.jpg, squirrel.jpg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # WildAtlas brand + Map/Migration/Report pill tabs
│   │   │   ├── MapTab.jsx         # All sightings as Leaflet markers, species filter
│   │   │   ├── MigrationTab.jsx   # CircleMarker swap on month slider drag
│   │   │   └── ReportTab.jsx      # Photo + geolocation + AI + submit flow
│   │   ├── data/
│   │   │   ├── sightings.json     # 15 seeded sightings around Lubbock, TX
│   │   │   └── migration.json     # American Robin: 12 months × 20 lat/lng points
│   │   ├── App.jsx                # Tab state + sightings array + toast
│   │   ├── App.css                # Design system (Montserrat, terracotta accent)
│   │   └── index.js               # Leaflet CSS first import + marker icon fix
│   ├── .env                       # REACT_APP_USE_MOCK_AI=true (mock on by default)
│   └── package.json
├── scripts/
│   └── gen-migration.js           # Regenerates migration.json (12 months × 20 points)
├── README.md
└── FUTURE_WORK.md
```

---

## Known Limitations

This is a **demo prototype**, not production software.

- **No backend** — all state lives in the browser
- **No persistence** — refreshing the page loses any newly submitted sightings
- **No authentication** — no user accounts or access control
- **No tests** — no unit, integration, or end-to-end tests
- **No deployment** — runs locally only (`npm start`)
- **Single migration species** — only American Robin is populated in the migration view
- **Photo storage** — uploaded photos are held in memory only via `URL.createObjectURL`; seed data uses hot-linked Unsplash URLs

---

## Future Work

See [`FUTURE_WORK.md`](./FUTURE_WORK.md) for the planned production stack, including a real backend, persistence, auth, deployment, and a custom species model.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Create React App + React 18 (JavaScript, `.jsx`) |
| Styling | Plain CSS with design tokens, Montserrat via Google Fonts |
| Maps | Leaflet via `react-leaflet@4`, OpenStreetMap tiles |
| Species AI | iNaturalist Computer Vision API (with offline mock fallback) |
| State | React `useState` (in-memory, App-level) |

---

## About

WildAtlas is a citizen-science prototype for reporting and tracking local wildlife sightings, built for the **TTU CS Senior Capstone, Spring 2026** (Whitacre College of Engineering). Seed data is centered around Lubbock, TX (33.5779°N, 101.8552°W).

---

*Built by Eric Jayan — Texas Tech University, Computer Science & Mathematics*
