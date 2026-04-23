import React, { useState } from "react";
import "./ReportModal.css";

export default function ReportModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    commonName: "",
    scientificName: "",
    type: "Bird",
    location: "",
    date: "",
    notes: "",
    lat: "",
    lng: "",
  });
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({
      id: Date.now(),
      commonName: formData.commonName,
      scientificName: formData.scientificName,
      type: formData.type,
      location: formData.location,
      date: formData.date,
      notes: formData.notes,
      lat: Number(formData.lat),
      lng: Number(formData.lng),
      image: imagePreview,
      imageFile,
    });

    setFormData({
      commonName: "",
      scientificName: "",
      type: "Bird",
      location: "",
      date: "",
      notes: "",
      lat: "",
      lng: "",
    });
    setImagePreview("");
    setImageFile(null);
    onClose();
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

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Common name</label>
            <input
              name="commonName"
              value={formData.commonName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label>Scientific name</label>
            <input
              name="scientificName"
              value={formData.scientificName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label>Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}

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

          <div className="field-row">
            <div className="field">
              <label>Latitude</label>
              <input
                name="lat"
                type="number"
                step="any"
                value={formData.lat}
                onChange={handleChange}
                required
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
                required
              />
            </div>
          </div>

          <div className="field">
            <label>Location</label>
            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <button className="submit-btn" type="submit">
            Submit sighting
          </button>
        </form>
      </div>
    </div>
  );
}
