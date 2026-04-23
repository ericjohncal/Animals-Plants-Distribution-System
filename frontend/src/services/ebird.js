const PROXY_BASE = "/api/ebird";
const TOP_N = 30;

async function proxyFetch(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${PROXY_BASE}/${path}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`eBird proxy ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export function fetchRecent(regionCode, { back = 14 } = {}) {
  return proxyFetch(`data/obs/${regionCode}/recent`, { back });
}

export function fetchRecentByGeo(lat, lng, { back = 14 } = {}) {
  return proxyFetch(`data/obs/geo/recent`, { lat, lng, back });
}

export function fetchRecentForSpecies(regionCode, speciesCode) {
  return proxyFetch(`data/obs/${regionCode}/recent/${speciesCode}`);
}

export function fetchStates() {
  return proxyFetch(`ref/region/list/subnational1/US`);
}

export function fetchCounties(stateCode) {
  return proxyFetch(`ref/region/list/subnational2/${stateCode}`);
}

export async function fetchHistoric(regionCode, year, month, day = 15) {
  const obs = await proxyFetch(`data/obs/${regionCode}/historic/${year}/${month}/${day}`);
  return { month, observations: Array.isArray(obs) ? obs : [] };
}

export async function fetchMigrationSamples(regionCode, { years } = {}) {
  const now = new Date();
  const yrs = years || [now.getUTCFullYear() - 1, now.getUTCFullYear()];
  const tasks = [];
  for (const y of yrs) {
    for (let m = 1; m <= 12; m++) tasks.push(fetchHistoric(regionCode, y, m));
  }
  return Promise.all(tasks);
}

export function aggregateMigration(samples) {
  const bySpecies = new Map();
  for (const sample of samples) {
    for (const o of sample.observations || []) {
      const row =
        bySpecies.get(o.speciesCode) ||
        { speciesCode: o.speciesCode, comName: o.comName, sciName: o.sciName, monthCounts: new Array(12).fill(0), total: 0 };
      row.monthCounts[sample.month - 1] += 1;
      row.total += 1;
      bySpecies.set(o.speciesCode, row);
    }
  }
  return Array.from(bySpecies.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, TOP_N);
}
