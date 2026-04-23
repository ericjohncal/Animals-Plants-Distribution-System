import React, { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./MapView.css";
import { TYPE_COLORS } from "../constants/sightingConstants";

export default function MapView({ sightings, onReportClick }) {
  const [activeMarker, setActiveMarker] = useState(null);

  return (
    <div className="map-wrapper">
      <div className="map-toolbar">
        <span className="map-count">
          {sightings.length} sighting{sightings.length !== 1 ? "s" : ""} visible
        </span>
        <span className="live-badge">
          <span className="live-dot" />
          Live updates
        </span>
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

          {sightings.map((s) => {
            const color = TYPE_COLORS[s.type] || TYPE_COLORS.Other;
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
                    <span className="popup-loc">📍 {s.location}</span>
                    <span className="popup-date">{s.date}</span>
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
