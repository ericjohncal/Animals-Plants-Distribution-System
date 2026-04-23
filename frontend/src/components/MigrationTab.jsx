import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import migrationData from "../data/migration.json";

const ACCENT = "#C49A6C";
const US_VIEW = { center: [40, -90], zoom: 4 };
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SPECIES_OPTIONS = [
  { value: "American Robin", label: "American Robin", available: true },
  { value: "_coming", label: "More species coming soon", available: false },
];

export default function MigrationTab() {
  const [species, setSpecies] = useState("American Robin");
  const [month, setMonth] = useState(1);

  const points = useMemo(() => {
    const speciesData = migrationData[species];
    if (!speciesData) return [];
    return speciesData[String(month)] || [];
  }, [species, month]);

  const handleSpeciesChange = (e) => {
    const opt = SPECIES_OPTIONS.find((o) => o.value === e.target.value);
    if (opt && opt.available) setSpecies(e.target.value);
  };

  return (
    <section className="tab-section">
      <div className="filter-row">
        <label htmlFor="migration-species" className="filter-label">
          Species
        </label>
        <select
          id="migration-species"
          className="filter-select"
          value={species}
          onChange={handleSpeciesChange}
        >
          {SPECIES_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} disabled={!o.available}>
              {o.label}
            </option>
          ))}
        </select>

        <label
          htmlFor="migration-month"
          className="filter-label"
          style={{ marginLeft: 16 }}
        >
          Month
        </label>
        <input
          id="migration-month"
          type="range"
          min="1"
          max="12"
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="month-slider"
        />
        <span className="filter-count month-name">{MONTH_NAMES[month - 1]}</span>
      </div>

      <div className="map-container">
        <MapContainer
          center={US_VIEW.center}
          zoom={US_VIEW.zoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map(([lat, lng], i) => (
            <CircleMarker
              key={`${month}-${i}`}
              center={[lat, lng]}
              radius={6}
              pathOptions={{
                color: ACCENT,
                fillColor: ACCENT,
                fillOpacity: 0.7,
                weight: 1,
              }}
            />
          ))}
        </MapContainer>
      </div>

      <p className="caption">
        Data source: eBird occurrence records (demo subset).
      </p>
    </section>
  );
}
