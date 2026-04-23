import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const LUBBOCK = [33.5779, -101.8552];

export default function App() {
  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ margin: "0 0 12px 0" }}>WildAtlas — Smoke Test</h1>
      <p style={{ margin: "0 0 12px 0", color: "#555" }}>
        If you see a map of Lubbock with one marker, Leaflet is wired up
        correctly.
      </p>
      <div style={{ height: "70vh" }}>
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
          <Marker position={LUBBOCK}>
            <Popup>Lubbock, TX (smoke test marker)</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
