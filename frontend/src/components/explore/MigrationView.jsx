import React, { useCallback, useMemo, useState } from "react";
import { fetchMigrationSamples, aggregateMigration } from "../../services/ebird";
import { useEbird } from "../../hooks/useEbird";
import { MonthSlider } from "./MonthSlider";
import { FrequencyBars } from "./FrequencyBars";

export function MigrationView({ region, onSelectSpecies }) {
  const fetcher = useCallback(() => fetchMigrationSamples(region.regionCode), [region.regionCode]);
  const { loading, data, error } = useEbird(fetcher, region.regionCode);
  const [month, setMonth] = useState(new Date().getUTCMonth() + 1);

  const rows = useMemo(() => (data ? aggregateMigration(data) : []), [data]);

  if (loading) return <div className="view-skeleton">Loading 24 monthly samples…</div>;
  if (error)   return <div className="view-error">Couldn't reach eBird.</div>;
  if (rows.length === 0) return <div className="view-empty">Not enough historic data for {region.label}.</div>;

  return (
    <div className="migration-view">
      <MonthSlider value={month} onChange={setMonth} />
      <FrequencyBars month={month} rows={rows} onSelect={onSelectSpecies} />
    </div>
  );
}
