import React, { useCallback } from "react";
import { fetchRecentForSpecies } from "../../services/ebird";
import { useEbird } from "../../hooks/useEbird";
import { BirdCard } from "./BirdCard";

export function SpeciesView({ region, species, onBack }) {
  const fetcher = useCallback(
    () => fetchRecentForSpecies(region.regionCode, species.speciesCode),
    [region.regionCode, species.speciesCode]
  );
  const { loading, data, error } = useEbird(fetcher, `${region.regionCode}/${species.speciesCode}`);
  const ebirdUrl = `https://ebird.org/species/${species.speciesCode}/${region.regionCode}`;

  return (
    <div className="species-view">
      <header className="species-header">
        <button type="button" className="species-back" onClick={onBack}>← Back</button>
        <h2>{species.comName}</h2>
        <em className="species-sci">{species.sciName}</em>
      </header>

      <section className="species-recent">
        <h3>Recent in {region.label}</h3>
        {loading && <div className="view-skeleton">Loading…</div>}
        {error && <div className="view-error">Couldn't reach eBird.</div>}
        {!loading && !error && (!data || data.length === 0) && (
          <div className="view-empty">No recent reports for this species in this region.</div>
        )}
        {!loading && !error && data && data.length > 0 && (
          <div className="recent-grid explore-grid">
            {data.map((s, i) => (
              <BirdCard key={i} sighting={s} />
            ))}
          </div>
        )}
      </section>

      <section className="species-embed">
        <iframe
          title={`eBird page for ${species.comName}`}
          src={ebirdUrl}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
        <a className="species-open" href={ebirdUrl} target="_blank" rel="noreferrer">
          Open on eBird →
        </a>
      </section>
    </div>
  );
}
