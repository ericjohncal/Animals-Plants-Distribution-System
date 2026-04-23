import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import Filters from "../components/Filters";
import SightingCard from "../components/SightingCard";
import SightingModal from "../components/SightingModal";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const DEFAULT_FILTERS = {
  category: "All",
  timeRange: "All time",
  status: "All",
};

export default function ExplorePage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSighting, setSelectedSighting] = useState(null);

  useEffect(() => {
    const loadSightings = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/sightings`);
        if (response.ok) {
          const data = await response.json();
          setSightings(data);
        } else {
          setError("Failed to load sightings.");
        }
      } catch {
        setError("Failed to load sightings.");
      } finally {
        setLoading(false);
      }
    };

    loadSightings();
  }, []);

  const filtered = useMemo(() => {
    return sightings.filter((s) => {
      if (filters.category !== "All" && s.type !== filters.category) return false;
      return !(filters.status !== "All" && s.status !== filters.status);
    });
  }, [sightings, filters]);

  return (
    <main className="main">
      <section className="hero">
        <div className="hero-text">
          <h1 className="hero-heading">Explore all sightings</h1>
          <p className="hero-sub">
            Browse the full community database of plant and animal sightings.
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

      <section className="section">
        <Filters filters={filters} onChange={setFilters} />
      </section>

      <section className="section">
        {loading ? (
          <p>Loading sightings...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <div className="cards-grid">
            {filtered.map((s) => (
              <SightingCard
                key={s.id}
                sighting={s}
                onClick={() => setSelectedSighting(s)}
              />
            ))}
          </div>
        )}
      </section>

      <SightingModal
        sighting={selectedSighting}
        isOpen={!!selectedSighting}
        onClose={() => setSelectedSighting(null)}
      />
    </main>
  );
}