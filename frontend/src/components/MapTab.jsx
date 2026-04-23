import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const LUBBOCK = [33.5779, -101.8552];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MapTab({ sightings }) {
  const [filter, setFilter] = useState("All");

  const speciesList = useMemo(() => {
    const set = new Set(sightings.map((s) => s.species));
    return ["All", ...Array.from(set).sort()];
  }, [sightings]);

  const visible =
    filter === "All" ? sightings : sightings.filter((s) => s.species === filter);

  return (
    <section className="tab-section">
      <div className="filter-row">
        <label htmlFor="species-filter" className="filter-label">
          Filter by species
        </label>
        <select
          id="species-filter"
          className="filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {speciesList.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="filter-count">
          {visible.length} sighting{visible.length !== 1 ? "s" : ""}
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
          {visible.map((s) => (
            <Marker key={s.id} position={[s.lat, s.lng]}>
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
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}
