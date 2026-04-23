# SightMap — Wildlife & Plant Sighting Tracker

A citizen-science web app where users report local wildlife and plant sightings, get AI-powered species identification, and explore sightings and bird migration patterns on an interactive map.


---

## Features

- **Report a Sighting** — Upload a photo (or use a pre-staged demo photo), auto-detect your location, and submit a sighting in seconds.
- **AI Species Identification** — Uses the iNaturalist Computer Vision API to return the top 3 species predictions with confidence scores. Accept a result or enter your own.
- **Interactive Map** — All sightings rendered as pins on a Leaflet/OpenStreetMap map. Click any pin for photo, species name, date, and reporter info. Filter by species.
- **Bird Migration View** — Select American Robin and drag a month slider (Jan → Dec) to watch migration patterns shift north in spring and south in fall.

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
git clone https://github.com/YOUR_USERNAME/sightmap.git
cd sightmap
npm install
npm run dev
```

App runs at **http://localhost:5173**

---

## AI Mock Mode (Offline Fallback)

If the iNaturalist API is unavailable or you're demoing without reliable Wi-Fi, enable the mock AI:

```bash
# In your .env file (create it at the project root):
VITE_USE_MOCK_AI=true
```

Mock returns hardcoded predictions after a 1-second simulated delay:
| Rank | Common Name | Scientific Name | Confidence |
|------|-------------|-----------------|------------|
| 1 | American Robin | *Turdus migratorius* | 94% |
| 2 | Northern Cardinal | *Cardinalis cardinalis* | 73% |
| 3 | Blue Jay | *Cyanocitta cristata* | 61% |

**Always test both paths before the demo.**

---

## Demo Script (5–7 min)

| Time | Action |
|------|--------|
| 0:00–0:30 | Problem hook — why citizen science matters for local biodiversity |
| 0:30–1:30 | Report tab → select demo photo 1, click "Use My Location", submit |
| 1:30–2:30 | "Identify with AI" → loading spinner → top 3 results → Accept #1 |
| 2:30–4:00 | Map tab → 15+ pins loaded, click a few, use species filter dropdown |
| 4:00–5:00 | Migration tab → select American Robin → drag slider Jan → Dec |
| 5:00–5:30 | "What's next" — mention planned production stack |

### Recording a Backup Demo

If you want a screen recording as a safety net, run:

```bash
# macOS (QuickTime)
# Open QuickTime Player → File → New Screen Recording → Record

# Or with ffmpeg (if installed):
ffmpeg -f avfoundation -i "1:0" -t 90 demo-backup.mp4
```

Save the output as `demo-backup.mp4` in the project root. If live demo fails, share your screen and play this file.

---

## Project Structure

sightmap/
├── public/
│ └── demo-photos/ # Pre-staged robin, cardinal, squirrel photos
├── src/
│ ├── components/ # Map, MigrationMap, ReportForm, Navbar
│ ├── data/
│ │ ├── sightings.json # 15 pre-seeded local sightings (Lubbock, TX area)
│ │ └── migration.json # American Robin monthly lat/lng points
│ ├── App.tsx
│ └── main.tsx
├── .env.example
├── README.md
└── FUTURE_WORK.md



---

## Known Limitations

This is a **demo prototype** built for a capstone presentation. It is not production software.

- **No backend** — all state lives in the browser
- **No persistence** — refreshing the page loses any newly submitted sightings
- **No authentication** — no user accounts or access control
- **No tests** — no unit, integration, or end-to-end tests
- **No deployment** — runs locally only (`npm run dev`)
- **Single migration species** — only American Robin is populated in the migration view
- **Photo storage** — uses Unsplash URLs for seeded data; uploaded photos are held in memory only

---

## Future Work

See [`FUTURE_WORK.md`](./FUTURE_WORK.md) for the full planned production stack, including:

- FastAPI / Node.js backend with PostgreSQL + PostGIS
- AWS S3 for photo storage, Redis for caching
- Custom TensorFlow species model trained on regional data
- BirdCast API integration for live migration data
- User auth, badges, and gamification
- Docker + Kubernetes + GitHub Actions CI/CD
- Jest / Pytest / Cypress test coverage ≥ 80%

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React + TypeScript |
| Styling | Tailwind CSS + Montserrat (Google Fonts) |
| Maps | Leaflet via `react-leaflet`, OpenStreetMap tiles |
| Species AI | iNaturalist Computer Vision API |
| State | React `useState` (in-memory, App-level) |

---

## About

SightMap is a citizen-science prototype for reporting and tracking local wildlife sightings, built for the **TTU CS Senior Capstone, Spring 2026** (Whitacre College of Engineering). Seed data is centered around Lubbock, TX (33.5779°N, 101.8552°W).

---

*Built by Eric Jayan — Texas Tech University, Computer Science & Mathematics*
