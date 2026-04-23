import React, { useEffect, useState } from "react";
import { fetchStates, fetchCounties, geolocateToRegion } from "../../services/regions";

function countyLabel(countyName, stateCode) {
  const name = String(countyName).replace(/ County$/i, "");
  const usps = stateCode.split("-")[1];
  return `${name} County, ${usps}`;
}

export function RegionPicker({ region, onChange }) {
  const [open, setOpen] = useState(false);
  const [states, setStates] = useState([]);
  const [stateCode, setStateCode] = useState("");
  const [counties, setCounties] = useState([]);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchStates().then(setStates).catch(() => setStates([]));
  }, [open]);

  useEffect(() => {
    if (!stateCode) { setCounties([]); return; }
    fetchCounties(stateCode).then(setCounties).catch(() => setCounties([]));
  }, [stateCode]);

  async function handleUseLocation() {
    setLocating(true);
    try {
      const result = await geolocateToRegion();
      if (result) onChange(result);
    } catch { /* silently fall back */ }
    finally { setLocating(false); }
  }

  function handleCountyChange(e) {
    const code = e.target.value;
    const county = counties.find((c) => c.code === code);
    if (!county) return;
    onChange({ regionCode: code, label: countyLabel(county.name, stateCode) });
    setOpen(false);
  }

  return (
    <div className="region-picker">
      <div className="region-current">
        <span className="region-pin" aria-hidden="true">📍</span>
        <span className="region-label">{region.label}</span>
        <button type="button" className="region-change" onClick={() => setOpen((v) => !v)}>
          Change region
        </button>
        <button
          type="button"
          className="region-locate"
          onClick={handleUseLocation}
          disabled={locating}
        >
          {locating ? "Locating…" : "Use my location"}
        </button>
      </div>

      {open && (
        <div className="region-dropdown">
          <label>
            State
            <select value={stateCode} onChange={(e) => setStateCode(e.target.value)}>
              <option value="">Select a state…</option>
              {states.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            County
            <select disabled={!counties.length} onChange={handleCountyChange} defaultValue="">
              <option value="">Select a county…</option>
              {counties.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
