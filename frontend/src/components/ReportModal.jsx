import React, { useState } from "react";
import "./ReportModal.css";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function ReportModal({ isOpen, onClose, onSubmit }) {
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    speciesName: "",
    type: "Bird",
    location: "",
    date: "",
    notes: "",
    lat: "",
    lng: "",
    imageUrl: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setFormData((prev) => ({
          ...prev,
          lat: latitude.toString(),
          lng: longitude.toString(),
        }));

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          setFormData((prev) => ({
            ...prev,
            location: data.display_name || `${latitude}, ${longitude}`,
            lat: latitude.toString(),
            lng: longitude.toString(),
          }));
        } catch {
          setFormData((prev) => ({
            ...prev,
            location: `${latitude}, ${longitude}`,
          }));
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        alert("Unable to access your location.");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!isAuthenticated) {
      setSubmitError("You must be logged in to submit a report.");
      return;
    }

    const hasLatLng = formData.lat !== "" && formData.lng !== "";
    const hasLocation = formData.location.trim() !== "";

    if (!hasLatLng && !hasLocation) {
      setSubmitError("Please enter either a location OR latitude/longitude.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        type: formData.type,
        commonName: formData.speciesName,
        location: hasLocation ? formData.location : "",
        date: formData.date,
        notes: formData.notes,
        lat: hasLatLng ? Number(formData.lat) : null,
        lng: hasLatLng ? Number(formData.lng) : null,
        status: "Native",
        reporter: user?.name || "Anonymous",
        imageUrl: formData.imageUrl.trim(),
      };

      const response = await fetch(`${API_BASE_URL}/api/sightings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        onSubmit(data);

        setFormData({
          speciesName: "",
          type: "Bird",
          location: "",
          date: "",
          notes: "",
          lat: "",
          lng: "",
          imageUrl: "",
        });

        onClose();
      } else {
        setSubmitError(data.message || "Failed to submit sighting.");
      }
    } catch {
      setSubmitError("Failed to submit sighting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const locationDisabled = formData.lat !== "" || formData.lng !== "";
  const latLngDisabled = formData.location.trim() !== "";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Report a sighting</h2>
          <button className="modal-close" onClick={onClose} type="button">
            ×
          </button>
        </div>

        {!isAuthenticated && (
          <p style={{ color: "#b42318", marginBottom: "12px" }}>
            You must be logged in to submit a report.
          </p>
        )}

        {submitError && (
          <p style={{ color: "#b42318", marginBottom: "12px" }}>{submitError}</p>
        )}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Species name</label>
            <input
              name="speciesName"
              value={formData.speciesName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label>Image URL</label>
            <input
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Type</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option>Bird</option>
                <option>Mammal</option>
                <option>Plant</option>
                <option>Reptile</option>
                <option>Amphibian</option>
                <option>Insect</option>
                <option>Other</option>
              </select>
            </div>

            <div className="field">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>
            Enter either a location OR latitude/longitude (not both).
          </p>

          <div className="field">
            <label>Location (Address or place name)</label>
            <div className="location-row">
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Palo Duro Canyon, TX"
                disabled={locationDisabled}
              />
              <button
                type="button"
                className="autofill-btn"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
              >
                {isLocating ? "Getting location..." : "Use current location"}
              </button>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Latitude</label>
              <input
                name="lat"
                type="number"
                step="any"
                value={formData.lat}
                onChange={handleChange}
                placeholder="e.g. 34.9489"
                disabled={latLngDisabled}
              />
            </div>

            <div className="field">
              <label>Longitude</label>
              <input
                name="lng"
                type="number"
                step="any"
                value={formData.lng}
                onChange={handleChange}
                placeholder="e.g. -101.7181"
                disabled={latLngDisabled}
              />
            </div>
          </div>

          <div className="field">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <button className="submit-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit sighting"}
          </button>
        </form>
      </div>
    </div>
  );
}