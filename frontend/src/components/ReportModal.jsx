import React, { useState } from "react";
import "./ReportModal.css";

const TYPES = ["Plant", "Mammal", "Bird", "Insect", "Reptile", "Other"];

const EMPTY_FORM = {
  type: "Plant",
  commonName: "",
  scientificName: "",
  location: "",
  lat: "",
  lng: "",
  date: new Date().toISOString().slice(0, 10),
  status: "Native",
  notes: "",
  reporter: "",
};

export default function ReportModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.commonName || !form.location) return;
    onSubmit({ ...form, id: Date.now(), lat: parseFloat(form.lat) || 39, lng: parseFloat(form.lng) || -98 });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm(EMPTY_FORM);
      onClose();
    }, 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Report a sighting</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {submitted ? (
          <div className="modal-success">
            <div className="success-icon">✓</div>
            <p>Sighting submitted! Thank you.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="field">
              <label>Type</label>
              <div className="type-toggle">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`type-chip ${form.type === t ? "type-chip-active" : ""}`}
                    onClick={() => set("type", t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Common name *</label>
                <input
                  type="text"
                  placeholder="e.g. Bald Eagle"
                  value={form.commonName}
                  onChange={(e) => set("commonName", e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Scientific name</label>
                <input
                  type="text"
                  placeholder="e.g. Haliaeetus leucocephalus"
                  value={form.scientificName}
                  onChange={(e) => set("scientificName", e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label>Location *</label>
              <input
                type="text"
                placeholder="City, state or region"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                required
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label>Latitude</label>
                <input
                  type="number"
                  placeholder="e.g. 38.5"
                  value={form.lat}
                  onChange={(e) => set("lat", e.target.value)}
                  step="any"
                />
              </div>
              <div className="field">
                <label>Longitude</label>
                <input
                  type="number"
                  placeholder="e.g. -96.0"
                  value={form.lng}
                  onChange={(e) => set("lng", e.target.value)}
                  step="any"
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Date observed</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option>Native</option>
                  <option>Invasive</option>
                  <option>Unknown</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Your name</label>
              <input
                type="text"
                placeholder="Optional"
                value={form.reporter}
                onChange={(e) => set("reporter", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Notes</label>
              <textarea
                placeholder="Describe what you observed — behavior, habitat, quantity, conditions..."
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>

            <button type="submit" className="submit-btn">
              Submit sighting
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
