import React, { useState } from "react";
import { useRegion } from "../../hooks/useRegion";
import { Attribution } from "./Attribution";
import { RegionPicker } from "./RegionPicker";
import { ViewSwitcher } from "./ViewSwitcher";
import { RecentView } from "./RecentView";
import { MigrationView } from "./MigrationView";
import { SpeciesView } from "./SpeciesView";
import "./Explore.css";

export function ExploreTab() {
  const { region, setRegion } = useRegion();
  const [view, setView] = useState("recent");
  const [species, setSpecies] = useState(null);

  function selectSpecies(s) {
    setSpecies(s);
    setView("species");
  }

  return (
    <section className="tab-section explore">
      <div className="hero">
        <h1 className="hero-heading">
          See which <em>birds</em> are where, by month.
        </h1>
        <p className="hero-sub">
          Live bird data from eBird. Pick a region to start.
        </p>
      </div>

      <RegionPicker region={region} onChange={setRegion} />
      <ViewSwitcher value={view} onChange={setView} speciesEnabled={!!species} />

      <div className="explore-view">
        {view === "recent" && <RecentView region={region} onSelectSpecies={selectSpecies} />}
        {view === "migration" && <MigrationView region={region} onSelectSpecies={selectSpecies} />}
        {view === "species" && species && (
          <SpeciesView region={region} species={species} onBack={() => setView("recent")} />
        )}
        {view === "species" && !species && (
          <div className="view-empty">Pick a bird from Recent or Migration to see details.</div>
        )}
      </div>

      <Attribution />
    </section>
  );
}
