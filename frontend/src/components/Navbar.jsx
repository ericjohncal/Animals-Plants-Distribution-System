import React from "react";

const TABS = [
  { id: "map", label: "Map" },
  { id: "explore", label: "Explore" },
  { id: "about", label: "About" },
];

export default function Navbar({ activeTab, onTabChange }) {
  return (
    <nav className="navbar">
      <button
        type="button"
        className="brand"
        onClick={() => onTabChange("map")}
        aria-label="WildAtlas home"
      >
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3c-5 0-10 3-10 10 0 3 1 5 1 5s2-8 9-10" />
            <path d="M8 18c0-5 3-9 9-10" />
          </svg>
        </span>
        <span className="brand-text">
          <span className="brand-name">WildAtlas</span>
          <span className="brand-sub">Community Sightings Map</span>
        </span>
      </button>

      <div className="navbar-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-primary btn-report"
        onClick={() => onTabChange("report")}
      >
        <span aria-hidden="true" className="btn-plus">+</span>
        Report sighting
      </button>
    </nav>
  );
}
