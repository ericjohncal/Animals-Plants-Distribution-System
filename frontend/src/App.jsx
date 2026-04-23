import React, { useEffect, useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import MapTab from "./components/MapTab";
import MigrationTab from "./components/MigrationTab";
import ReportTab from "./components/ReportTab";
import seedSightings from "./data/sightings.json";

export default function App() {
  const [activeTab, setActiveTab] = useState("map");
  const [sightings, setSightings] = useState(seedSightings);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSubmit = (sighting) => {
    setSightings((prev) => [sighting, ...prev]);
    setToast("Sighting submitted!");
    setActiveTab("map");
  };

  return (
    <div className="app">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main">
        {activeTab === "map" && (
          <MapTab sightings={sightings} onReport={() => setActiveTab("report")} />
        )}
        {activeTab === "explore" && <MigrationTab />}
        {activeTab === "about" && (
          <section className="tab-section">
            <div className="hero">
              <h1 className="hero-heading">
                About <em>Wild Track</em>.
              </h1>
              <p className="hero-sub">
                A community-powered database mapping the distribution of plants
                and animals across ecosystems. Contribute sightings, explore
                patterns, support conservation.
              </p>
            </div>
          </section>
        )}
        {activeTab === "report" && <ReportTab onSubmit={handleSubmit} />}
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
