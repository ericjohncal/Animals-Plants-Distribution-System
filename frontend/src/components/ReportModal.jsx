import React, { useState } from "react";
import "./ReportModal.css";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const EMPTY_FORM = {
  speciesName: "",
  type: "Bird",
  city: "",
  country: "",
  date: "",
  notes: "",
  lat: "",
  lng: "",
  imageUrl: "",
};

export default function ReportModal({ isOpen, onClose, onSubmit }) {
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearForm = () => {
    setFormData(EMPTY_FORM);
    setSubmitError("");
  };

  const lookupCoordsFromPlace = async (city, country) => {
    const query = encodeURIComponent(`${city}, ${country}`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${query}&limit=1`
    );
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      return {
        lat: String(data[0].lat),
        lng: String(data[0].lon),
      };
    }

    return null;
  };

  const lookupPlaceFromCoords = async (latitude, longitude) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
    );
    const data = await response.json();

    const address = data.address || {};
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.hamlet ||
      address.county ||
      "";
    const country = address.country || "";

    return { city, country };
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

        try {
          const place = await lookupPlaceFromCoords(latitude, longitude);

          setFormData((prev) => ({
            ...prev,
            city: place.city,
            country: place.country,
            lat: latitude.toString(),
            lng: longitude.toString(),
          }));
        } catch {
          setFormData((prev) => ({
            ...prev,
            lat: latitude.toString(),
            lng: longitude.toString(),
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

  const handleAutoFillCoords = async () => {
    const city = formData.city.trim();
    const country = formData.country.trim();

    if (!city || !country) {
      setSubmitError("Enter both city and country to autofill latitude/longitude.");
      return;
    }

    setIsLocating(true);
    setSubmitError("");

    try {
      const coords = await lookupCoordsFromPlace(city, country);

      if (!coords) {
        setSubmitError("Could not find coordinates for that city and country.");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        lat: coords.lat,
        lng: coords.lng,
      }));
    } catch {
      setSubmitError("Could not find coordinates for that city and country.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleAutoFillPlace = async () => {
    const lat = formData.lat.trim();
    const lng = formData.lng.trim();

    if (!lat || !lng) {
      setSubmitError("Enter both latitude and longitude to autofill city/country.");
      return;
    }

    setIsLocating(true);
    setSubmitError("");

    try {
      const place = await lookupPlaceFromCoords(lat, lng);
      setFormData((prev) => ({
        ...prev,
        city: place.city,
        country: place.country,
      }));
    } catch {
      setSubmitError("Could not find city and country for those coordinates.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!isAuthenticated) {
      setSubmitError("You must be logged in to submit a report.");
      return;
    }

    const hasLatLng = formData.lat.trim() !== "" && formData.lng.trim() !== "";
    const hasPlace = formData.city.trim() !== "" && formData.country.trim() !== "";

    if (!hasLatLng && !hasPlace) {
      setSubmitError("Please enter either city/country OR latitude/longitude.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        type: formData.type,
        commonName: formData.speciesName,
        city: formData.city.trim(),
        country: formData.country.trim(),
        date: formData.date,
        notes: formData.notes,
        lat: hasLatLng ? Number(formData.lat) : null,
        lng: hasLatLng ? Number(formData.lng) : null,
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
        setFormData(EMPTY_FORM);
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
          <p style={{ color: "#b42318", marginBottom: "12px" }}>
            {submitError}
          </p>
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
            You can fill either city/country or latitude/longitude. Both are editable.
          </p>

          <div className="field-row">
            <div className="field">
              <label>City</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Austin"
              />
            </div>

            <div className="field">
              <label>Country</label>
              <input
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="e.g. United States"
              />
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

          <div className="field-row">
            <button
              type="button"
              className="autofill-btn"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
            >
              {isLocating ? "Getting location..." : "Use current location"}
            </button>

            <button
              type="button"
              className="autofill-btn"
              onClick={handleAutoFillCoords}
              disabled={isLocating}
            >
              Autofill coordinates
            </button>

            <button
              type="button"
              className="autofill-btn"
              onClick={handleAutoFillPlace}
              disabled={isLocating}
            >
              Autofill city/country
            </button>

            <button
              type="button"
              className="autofill-btn"
              onClick={handleClearForm}
            >
              Clear form
            </button>
          </div>

          <button className="submit-btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit sighting"}
          </button>
        </form>
      </div>
    </div>
  );
}