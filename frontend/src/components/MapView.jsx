import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";
import "leaflet/dist/leaflet.css";
import "./MapView.css";
import { TYPE_COLORS } from "../constants/sightingConstants";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function MapView({ sightings, onReportClick }) {
  const [activeMarker, setActiveMarker] = useState(null);
  const [showBirdcast, setShowBirdcast] = useState(false);
  const [birdcast, setBirdcast] = useState(null);
  const [birdcastLoading, setBirdcastLoading] = useState(false);

  useEffect(() => {
    const loadBirdcast = async () => {
      if (!showBirdcast) return;

      setBirdcastLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/birdcast/overlay`);
        if (response.ok) {
          const data = await response.json();
          setBirdcast(data);
        }
      } catch {
        setBirdcast(null);
      } finally {
        setBirdcastLoading(false);
      }
    };

    loadBirdcast();
  }, [showBirdcast]);

  return (
      <div className="map-wrapper">
        <div className="map-toolbar">
        <span className="map-count">
          {sightings.length} sighting{sightings.length !== 1 ? "s" : ""} visible
        </span>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <label className="birdcast-toggle">
              <input
                  type="checkbox"
                  checked={showBirdcast}
                  onChange={(e) => setShowBirdcast(e.target.checked)}
              />
              Bird Migration Overlay
            </label>

            <span className="live-badge">
            <span className="live-dot" />
            Live updates
          </span>
          </div>
        </div>

        <div className="map-canvas">
          <MapContainer
              center={[38.5, -96]}
              zoom={4}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
          >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {showBirdcast && birdcastLoading && (
                <div className="birdcast-loading">Loading live migration data...</div>
            )}

            {showBirdcast && birdcast?.regions && (
                <HeatmapLayer
                    points={birdcast.regions}
                    longitudeExtractor={(m) => m.lng}
                    latitudeExtractor={(m) => m.lat}
                    intensityExtractor={(m) => m.level}
                    radius={25}
                    blur={15}
                    max={1.0}
                    gradient={{
                      0.4: "blue",
                      0.6: "cyan",
                      0.7: "lime",
                      0.8: "yellow",
                      1.0: "red",
                    }}
                />
            )}

            {sightings.map((s) => {
              const color = TYPE_COLORS[s.type] || TYPE_COLORS.Bird;
              const place = [s.city, s.country].filter(Boolean).join(", ");

              return (
                  <CircleMarker
                      key={s.id}
                      center={[s.lat, s.lng]}
                      radius={activeMarker === s.id ? 12 : 9}
                      pathOptions={{
                        color: "#fff",
                        weight: 2,
                        fillColor: color.marker,
                        fillOpacity: 0.9,
                      }}
                      eventHandlers={{
                        click: () => setActiveMarker(s.id),
                      }}
                  >
                    <Popup>
                      <div className="map-popup">
                        {s.imageUrl && (
                            <img className="popup-image" src={s.imageUrl} alt={s.commonName} />
                        )}
                        <span
                            className="popup-tag"
                            style={{ background: color.bg, color: color.text }}
                        >
                      {s.type}
                    </span>
                        <strong className="popup-name">{s.commonName}</strong>
                        <span className="popup-loc">📍 {place || "Unknown location"}</span>
                        <span className="popup-date">{s.date}</span>
                        <span className="popup-date">Reported by {s.reporter}</span>
                        {s.notes && <p className="popup-notes">{s.notes}</p>}
                      </div>
                    </Popup>
                  </CircleMarker>
              );
            })}
          </MapContainer>

          <div className="map-legend">
            {Object.entries(TYPE_COLORS).map(([type, colors]) => (
                <div key={type} className="legend-item">
                  <span className="legend-dot" style={{ background: colors.marker }} />
                  {type}
                </div>
            ))}
            {showBirdcast && (
                <div className="legend-item">
              <span
                  className="legend-dot"
                  style={{
                    background: "linear-gradient(to right, blue, red)",
                    borderRadius: "2px",
                    width: "20px"
                  }}
              />
                  Migration Heat
                </div>
            )}
          </div>

          <button className="map-fab" onClick={onReportClick} type="button">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                  d="M7 2V12M2 7H12"
                  stroke="#c0dd97"
                  strokeWidth="1.8"
                  strokeLinecap="round"
              />
            </svg>
            Report sighting
          </button>
        </div>
      </div>
  );
}