import React from "react";
import "./Filters.css";
import { CATEGORIES, TIME_RANGES, STATUSES } from "../constants/sightingConstants";

export default function Filters({ filters, onChange }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="filters">
      <div className="filter-group">
        <label className="filter-label">Category</label>
        <div className="chip-row">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`chip ${filters.category === c ? "chip-active" : ""}`}
              onClick={() => set("category", c)}
              type="button"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">Time range</label>
        <div className="chip-row">
          {TIME_RANGES.map((t) => (
            <button
              key={t}
              className={`chip ${filters.timeRange === t ? "chip-active" : ""}`}
              onClick={() => set("timeRange", t)}
              type="button"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">Status</label>
        <div className="chip-row">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`chip ${filters.status === s ? "chip-active" : ""}`}
              onClick={() => set("status", s)}
              type="button"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
