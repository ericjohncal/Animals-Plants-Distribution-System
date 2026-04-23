import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

const LUBBOCK = [33.5779, -101.8552];

const CATEGORIES = ["All", "Plant", "Mammal", "Bird", "Insect", "Reptile"];
const TIME_RANGES = [
  { id: "week", label: "This week", days: 7 },
  { id: "month", label: "This month", days: 31 },
  { id: "year", label: "This year", days: 365 },
  { id: "all", label: "All time", days: null },
];
const STATUSES = ["All", "Native", "Invasive"];

const CATEGORY_COLORS = {
  Plant: "var(--tag-plant)",
  Mammal: "var(--tag-mammal)",
  Bird: "var(--tag-bird)",
  Insect: "var(--tag-insect)",
  Reptile: "var(--tag-reptile)",
  Other: "var(--tag-other)",
};

const SPECIES_CATEGORY = {
  "American Robin": "Bird",
  "Northern Cardinal": "Bird",
  "Blue Jay": "Bird",
  "Mallard": "Bird",
  "Red-tailed Hawk": "Bird",
  "Gray Squirrel": "Mammal",
  "Eastern Cottontail": "Mammal",
  "Monarch Butterfly": "Insect",
  "Sunflower": "Plant",
  "Prickly Pear": "Plant",
  "Bluebonnet": "Plant",
};

const INVASIVE_SPECIES = new Set(["Prickly Pear"]);

function categoryOf(sighting) {
  return sighting.category || SPECIES_CATEGORY[sighting.species] || "Other";
}
function statusOf(sighting) {
  return sighting.status || (INVASIVE_SPECIES.has(sighting.species) ? "Invasive" : "Native");
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  return ms / (1000 * 60 * 60 * 24);
}

function PillGroup({ label, options, value, onChange, idKey = "id" }) {
  return (
    <div className="filter-group">
      <div className="filter-label">{label}</div>
      <div className="pill-row" role="tablist">
        {options.map((opt) => {
          const id = typeof opt === "string" ? opt : opt[idKey];
          const text = typeof opt === "string" ? opt : opt.label;
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`pill ${active ? "active" : ""}`}
              onClick={() => onChange(id)}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MapTab({ sightings, onReport }) {
  const [category, setCategory] = useState("All");
  const [timeRange, setTimeRange] = useState("all");
  const [status, setStatus] = useState("All");

  const visible = useMemo(() => {
    const range = TIME_RANGES.find((r) => r.id === timeRange);
    return sightings.filter((s) => {
      if (category !== "All" && categoryOf(s) !== category) return false;
      if (status !== "All" && statusOf(s) !== status) return false;
      if (range && range.days != null && daysAgo(s.date) > range.days) return false;
      return true;
    });
  }, [sightings, category, timeRange, status]);

  const stats = useMemo(() => {
    const speciesSet = new Set(sightings.map((s) => s.species));
    const contributors = new Set(sightings.map((s) => s.reporter));
    return {
      sightings: sightings.length,
      species: speciesSet.size,
      contributors: contributors.size,
    };
  }, [sightings]);

  const recent = useMemo(
    () => [...visible].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6),
    [visible]
  );

  return (
    <section className="tab-section">
      <div className="hero-row">
        <div className="hero">
          <h1 className="hero-heading">
            Track where <em>nature</em> is thriving.
          </h1>
          <p className="hero-sub">
            A community-powered database mapping the distribution of plants and
            animals across ecosystems. Contribute sightings, explore patterns,
            support conservation.
          </p>
        </div>
        <aside className="stats-card" aria-label="Platform statistics">
          <div className="stat">
            <div className="stat-num">{stats.sightings}</div>
            <div className="stat-label">Sightings</div>
          </div>
          <div className="stat">
            <div className="stat-num">2,100</div>
            <div className="stat-label">Species</div>
          </div>
          <div className="stat">
            <div className="stat-num">312</div>
            <div className="stat-label">Contributors</div>
          </div>
        </aside>
      </div>

      <div className="filter-bar">
        <PillGroup
          label="Category"
          options={CATEGORIES}
          value={category}
          onChange={setCategory}
        />
        <PillGroup
          label="Time range"
          options={TIME_RANGES}
          value={timeRange}
          onChange={setTimeRange}
        />
        <PillGroup
          label="Status"
          options={STATUSES}
          value={status}
          onChange={setStatus}
        />
      </div>

      <div className="map-card">
        <div className="map-card-header">
          <span className="map-count">
            {visible.length} sighting{visible.length !== 1 ? "s" : ""} visible
          </span>
          <span className="live-indicator">
            <span className="live-dot" aria-hidden="true" />
            Live updates
          </span>
        </div>

        <div className="map-container">
          <MapContainer
            center={LUBBOCK}
            zoom={11}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {visible.map((s) => {
              const cat = categoryOf(s);
              const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other;
              return (
                <CircleMarker
                  key={s.id}
                  center={[s.lat, s.lng]}
                  radius={8}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 2,
                    fillColor: color,
                    fillOpacity: 1,
                  }}
                >
                  <Popup>
                    <div className="popup">
                      {s.photoUrl && (
                        <img
                          className="popup-img"
                          src={s.photoUrl}
                          alt={s.species}
                          width={120}
                          height={90}
                        />
                      )}
                      <span className="popup-species">{s.species}</span>
                      <em className="popup-sci">{s.scientificName}</em>
                      <div className="popup-meta">
                        <span>{formatDate(s.date)}</span>
                        <span>· {s.reporter}</span>
                      </div>
                      {s.notes && <p className="popup-notes">{s.notes}</p>}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          <div className="map-legend" aria-label="Legend">
            {["Plant", "Mammal", "Bird", "Insect", "Reptile"].map((c) => (
              <div key={c} className="legend-row">
                <span
                  className="legend-dot"
                  style={{ background: CATEGORY_COLORS[c] }}
                  aria-hidden="true"
                />
                <span>{c}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-primary fab-report"
            onClick={onReport}
          >
            <span aria-hidden="true" className="btn-plus">+</span>
            Report sighting
          </button>
        </div>
      </div>

      <div className="recent-header">
        <div className="filter-label">Recent sightings</div>
        <button type="button" className="recent-link">
          {visible.length} total <span aria-hidden="true">→</span>
        </button>
      </div>
      <div className="recent-grid">
        {recent.map((s) => {
          const cat = categoryOf(s);
          return (
            <article key={s.id} className="recent-card">
              <span
                className="recent-tag"
                style={{
                  background: `var(--tag-${cat.toLowerCase()}-bg, var(--tag-other-bg))`,
                  color: CATEGORY_COLORS[cat],
                }}
              >
                {cat}
              </span>
              <div className="recent-name">{s.species}</div>
              <div className="recent-sci">{s.scientificName}</div>
              <div className="recent-meta">
                <span>{formatDate(s.date)}</span>
                <span>· {s.reporter}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
