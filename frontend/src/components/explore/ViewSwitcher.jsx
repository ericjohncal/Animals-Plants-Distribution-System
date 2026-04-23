import React from "react";

const VIEWS = [
  { id: "recent", label: "Recent" },
  { id: "migration", label: "Migration" },
  { id: "species", label: "Species" },
];

export function ViewSwitcher({ value, onChange, speciesEnabled }) {
  return (
    <div className="view-switcher" role="tablist">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          type="button"
          role="tab"
          aria-selected={value === v.id}
          className={`view-tab ${value === v.id ? "active" : ""}`}
          onClick={() => onChange(v.id)}
          disabled={v.id === "species" && !speciesEnabled}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
