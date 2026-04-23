import React, { useState, useMemo } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import MapView from "./components/MapView";
import Filters from "./components/Filters";
import SightingCard from "./components/SightingCard";
import ReportModal from "./components/ReportModal";
import { SIGHTINGS } from "./data/sightings";

const DEFAULT_FILTERS = {
  category: "All",
  timeRange: "All time",
  status: "All",
};

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sightings, setSightings] = useState(SIGHTINGS);

  const filtered = useMemo(() => {
    return sightings.filter((s) => {
      if (filters.category !== "All" && s.type !== filters.category) return false;
      return !(filters.status !== "All" && s.status !== filters.status);

    });
  }, [sightings, filters]);

  const handleNewSighting = (sighting) => {
    setSightings((prev) => [sighting, ...prev]);
  };

  return (
    <div className="app">
      <Navbar onReportClick={() => setModalOpen(true)} />

      <main className="main">
        {/* Hero */}
        <section className="hero">
          <div className="hero-text">
            <h1 className="hero-heading">
              Track where <em>nature</em> is thriving.
            </h1>
            <p className="hero-sub">
              A community-powered database mapping the distribution of plants and
              animals across ecosystems. Contribute sightings, explore patterns,
              support conservation.
            </p>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <div className="stat-num">{sightings.length.toLocaleString()}</div>
              <div className="stat-label">Sightings</div>
            </div>
            <div className="stat">
              <div className="stat-num">2,100</div>
              <div className="stat-label">Species</div>
            </div>
            <div className="stat">
              <div className="stat-num">312</div>
              <div className="stat-label">Contributors</div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="section">
          <Filters filters={filters} onChange={setFilters} />
        </section>

        {/* Map */}
        <section className="section">
          <MapView sightings={filtered} onReportClick={() => setModalOpen(true)} />
        </section>

        {/* Recent sightings */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Recent sightings</h2>
            <span className="see-all">{filtered.length} total →</span>
          </div>
          <div className="cards-grid">
            {filtered.map((s) => (
              <SightingCard key={s.id} sighting={s} />
            ))}
          </div>
        </section>
      </main>

      <ReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleNewSighting}
      />
    </div>
  );
}
