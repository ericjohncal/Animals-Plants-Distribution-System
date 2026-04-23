import React from "react";
import "./SightingCard.css";
import { TYPE_COLORS } from "../constants/sightingConstants";

export default function SightingCard({ sighting }) {
    const colors = TYPE_COLORS[sighting.type] || TYPE_COLORS.Other;

    return (
        <div className="sighting-card">
      <span
          className="sighting-tag"
          style={{ background: colors.bg, color: colors.text }}
      >
        {sighting.type}
      </span>
            <div className="sighting-name">{sighting.commonName}</div>
            <div className="sighting-meta">
                <span>📍 {sighting.location}</span>
                <span>{sighting.date}</span>
            </div>
            {sighting.imageUrl && (
                <img className="sighting-image" src={sighting.imageUrl} alt={sighting.commonName} />
            )}
            {sighting.status === "Invasive" && (
                <span className="invasive-badge">Invasive</span>
            )}
        </div>
    );
}