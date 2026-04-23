import React from "react";
import "./SightingModal.css";
import { TYPE_COLORS } from "../constants/sightingConstants";

export default function SightingModal({ sighting, isOpen, onClose }) {
    if (!isOpen || !sighting) return null;

    const colors = TYPE_COLORS[sighting.type] || TYPE_COLORS.Other;
    const place = [sighting.city, sighting.country].filter(Boolean).join(", ");

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal sighting-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{sighting.commonName}</h2>
                    <button className="modal-close" onClick={onClose} type="button">
                        ×
                    </button>
                </div>

                {sighting.imageUrl && (
                    <div className="sighting-modal-image-wrap">
                        <img
                            className="sighting-modal-image"
                            src={sighting.imageUrl}
                            alt={sighting.commonName}
                        />
                    </div>
                )}

                <div className="sighting-modal-content">
          <span
              className="popup-tag"
              style={{ background: colors.bg, color: colors.text }}
          >
            {sighting.type}
          </span>

                    <div className="sighting-modal-row">
                        <strong>Location:</strong> <span>{place || "Unknown"}</span>
                    </div>

                    <div className="sighting-modal-row">
                        <strong>Date:</strong> <span>{sighting.date}</span>
                    </div>

                    <div className="sighting-modal-row">
                        <strong>Reported by:</strong> <span>{sighting.reporter || "Anonymous"}</span>
                    </div>

                    {sighting.notes && (
                        <div className="sighting-modal-notes">
                            <strong>Notes:</strong>
                            <p>{sighting.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}