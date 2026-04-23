import React from "react";

const TABS = [
  { id: "map", label: "Map" },
  { id: "migration", label: "Migration" },
  { id: "report", label: "Report" },
];

export default function Navbar({ activeTab, onTabChange }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">WildAtlas</div>
      <div className="navbar-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
