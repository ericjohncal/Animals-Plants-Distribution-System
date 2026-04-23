import React, { useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import MapTab from "./components/MapTab";
import seedSightings from "./data/sightings.json";

export default function App() {
  const [activeTab, setActiveTab] = useState("map");
  const [sightings, setSightings] = useState(seedSightings);

  return (
    <div className="app">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main">
        {activeTab === "map" && <MapTab sightings={sightings} />}
        {activeTab === "migration" && (
          <div className="placeholder">Migration tab — coming next.</div>
        )}
        {activeTab === "report" && (
          <div className="placeholder">Report tab — coming next.</div>
        )}
      </main>
    </div>
  );
}
