import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import "../App.css";
import MapView from "../components/MapView";
import Filters from "../components/Filters";
import SightingCard from "../components/SightingCard";
import SightingModal from "../components/SightingModal";
import ReportModal from "../components/ReportModal";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const DEFAULT_FILTERS = {
  category: "All",
  timeRange: "All time",
  status: "All",
};

function matchesTimeRange(sightingDate, timeRange) {
  if (timeRange === "All time") return true;

  const date = new Date(sightingDate);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const diffMs = now - date;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (timeRange === "This week") return diffDays <= 7;
  if (timeRange === "This month") return diffDays <= 30;
  if (timeRange === "This year") return diffDays <= 365;

  return true;
}

function isAllowedValidity(value) {
  return value === "" || value === "yes" || value === undefined || value === null;
}

export default function MapPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSighting, setSelectedSighting] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

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

  useEffect(() => {
    const handleSightingCreated = (event) => {
      setSightings((prev) => [event.detail, ...prev]);
    };

    window.addEventListener("sighting-created", handleSightingCreated);
    return () => window.removeEventListener("sighting-created", handleSightingCreated);
  }, []);

  const filtered = useMemo(() => {
    return sightings.filter((s) => {
      if (s.status !== "Approved") return false;
      if (!isAllowedValidity(s.isValid)) return false;
      if (filters.category !== "All" && s.type !== filters.category) return false;
      return matchesTimeRange(s.date, filters.timeRange);
    });
  }, [sightings, filters]);

  const recentSightings = filtered.slice(0, 4);

  const handleReportSubmit = (newSighting) => {
    setSightings((prev) => [newSighting, ...prev]);
    setReportOpen(false);
  };

  return (
    <main className="main">
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
          <MapView sightings={filtered} onReportClick={() => setReportOpen(true)} />
        )}
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Recent sightings</h2>
          <Link className="see-all" to="/explore">
            Show all →
          </Link>
        </div>
        <div className="cards-grid">
          {recentSightings.map((s) => (
            <SightingCard
              key={s.id}
              sighting={s}
              onClick={() => setSelectedSighting(s)}
            />
          ))}
        </div>
      </section>

      <SightingModal
        sighting={selectedSighting}
        isOpen={!!selectedSighting}
        onClose={() => setSelectedSighting(null)}
      />

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReportSubmit}
      />
    </main>
  );
}