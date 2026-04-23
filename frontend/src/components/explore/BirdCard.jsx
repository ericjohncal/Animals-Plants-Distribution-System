import React from "react";

function formatObsDate(obsDt) {
  const d = new Date((obsDt || "").replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return obsDt || "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function BirdCard({ sighting, onClick }) {
  return (
    <button
      type="button"
      className="bird-card"
      onClick={onClick}
      data-species={sighting.speciesCode}
    >
      <div className="bird-name">{sighting.comName}</div>
      <div className="bird-sci">{sighting.sciName}</div>
      <div className="bird-meta">
        <span>{sighting.locName}</span>
        <span>· {formatObsDate(sighting.obsDt)}</span>
        {Number(sighting.howMany) > 1 && <span>· ×{sighting.howMany}</span>}
      </div>
    </button>
  );
}
