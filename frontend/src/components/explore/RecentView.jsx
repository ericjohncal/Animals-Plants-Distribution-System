import React, { useCallback } from "react";
import { fetchRecent } from "../../services/ebird";
import { useEbird } from "../../hooks/useEbird";
import { BirdCard } from "./BirdCard";

export function RecentView({ region, onSelectSpecies }) {
  const fetcher = useCallback(() => fetchRecent(region.regionCode), [region.regionCode]);
  const { loading, data, error } = useEbird(fetcher, region.regionCode);

  if (loading) return <div className="view-skeleton" aria-live="polite">Loading recent sightings…</div>;
  if (error)   return <div className="view-error">Couldn't reach eBird — <button onClick={() => window.location.reload()}>retry</button></div>;
  if (!data || data.length === 0) {
    return <div className="view-empty">No recent sightings in {region.label} — try a larger area.</div>;
  }
  return (
    <div className="recent-grid explore-grid">
      {data.map((s) => (
        <BirdCard key={`${s.speciesCode}-${s.obsDt}-${s.locId || ""}`} sighting={s} onClick={() => onSelectSpecies(s)} />
      ))}
    </div>
  );
}
