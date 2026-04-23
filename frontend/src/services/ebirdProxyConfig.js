const ALLOWLIST = [
  /^data\/obs\/[A-Za-z0-9-]+\/recent$/,
  /^data\/obs\/geo\/recent$/,
  /^data\/obs\/[A-Za-z0-9-]+\/recent\/[A-Za-z0-9]+$/,
  /^data\/obs\/[A-Za-z0-9-]+\/historic\/\d{4}\/\d{1,2}\/\d{1,2}$/,
  /^ref\/region\/list\/subnational1\/US$/,
  /^ref\/region\/list\/subnational2\/US-[A-Z]{2}$/,
  /^ref\/taxonomy\/ebird$/,
];

const CACHE_30D = "public, s-maxage=2592000, stale-while-revalidate=86400";
const CACHE_5M  = "public, s-maxage=300, stale-while-revalidate=60";

function isAllowedPath(path) {
  if (typeof path !== "string" || path.length === 0) return false;
  if (path.includes("..")) return false;
  return ALLOWLIST.some((rx) => rx.test(path));
}

function cacheHeaderFor(path) {
  if (/\/historic\//.test(path)) return CACHE_30D;
  if (/^ref\//.test(path))       return CACHE_30D;
  return CACHE_5M;
}

module.exports = { isAllowedPath, cacheHeaderFor };
