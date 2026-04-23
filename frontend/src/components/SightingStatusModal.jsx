import React from "react";

export default function SightingStatusModal({ sighting, isOpen, status, onClose }) {
  if (!isOpen || !sighting) return null;

  const isReported = status === "Reported";
  const isApproved = status === "Approved";
  const isDenied = status === "Denied";

  let title = "Sighting submitted";
  let message = "Your sighting is being reviewed.";
  if (isApproved) {
    title = "Sighting approved";
    message = "Your sighting has been approved.";
  } else if (isDenied) {
    title = "Sighting denied";
    message = "Your sighting has been denied.";
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <p style={{ marginBottom: "12px" }}>{message}</p>

        {isReported && (
          <p style={{ fontSize: "0.9rem", opacity: 0.75 }}>
            Waiting for review...
          </p>
        )}
      </div>
    </div>
  );
}