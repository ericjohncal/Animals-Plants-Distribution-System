import { FIPS_TO_USPS } from "./usStates";
import { fetchStates, fetchCounties } from "./ebird";

export const DEFAULT_REGION = { regionCode: "US-TX-303", label: "Lubbock County, TX" };

export function fipsToEbirdRegion(stateFips, countyFips) {
  const usps = FIPS_TO_USPS[stateFips];
  if (!usps) return null;
  const county3 = String(countyFips).padStart(3, "0");
  return `US-${usps}-${county3}`;
}

export function geocoderToEbird(payload) {
  const counties = payload?.result?.geographies?.Counties;
  if (!Array.isArray(counties) || counties.length === 0) return null;
  const c = counties[0];
  const regionCode = fipsToEbirdRegion(c.STATE, c.COUNTY);
  if (!regionCode) return null;
  const usps = FIPS_TO_USPS[c.STATE];
  const countyName = String(c.NAME || "").replace(/ County$/i, "");
  return { regionCode, label: `${countyName} County, ${usps}` };
}

const GEOCODER_URL = "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";

export async function geolocateToRegion({ signal } = {}) {
  const pos = await new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("no geolocation"));
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
  });
  const { latitude: lat, longitude: lon } = pos.coords;
  const qs = new URLSearchParams({
    x: String(lon),
    y: String(lat),
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    layers: "Counties",
    format: "json",
  });
  const res = await fetch(`${GEOCODER_URL}?${qs}`, { signal });
  if (!res.ok) throw new Error(`census geocoder ${res.status}`);
  return geocoderToEbird(await res.json());
}

export { fetchStates, fetchCounties };
