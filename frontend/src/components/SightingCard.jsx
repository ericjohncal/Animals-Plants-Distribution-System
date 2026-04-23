import React from "react";
import "./SightingCard.css";
import { TYPE_COLORS } from "../constants/sightingConstants";

export default function SightingCard({ sighting, onClick }) {
    const colors = TYPE_COLORS[sighting.type] || TYPE_COLORS.Other;

    return (
        <div className="sighting-card" onClick={onClick} role="button" tabIndex={0}>
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
                <div className="sighting-image-wrap">
                    <img className="sighting-image" src={sighting.imageUrl} alt={sighting.commonName} />
                </div>
            )}
            {sighting.status === "Invasive" && (
                <span className="invasive-badge">Invasive</span>
            )}
        </div>
    );
}