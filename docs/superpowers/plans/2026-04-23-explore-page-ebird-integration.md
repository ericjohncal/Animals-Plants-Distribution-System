# Explore Page eBird Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stub Explore tab with a live, eBird-powered page that lets a user pick a US region and see three views — Recent sightings, Month-by-month Migration, and per-Species detail — all served through a server-side Vercel Function proxy.

**Architecture:** A Vercel Function at `frontend/api/ebird/[...path].js` proxies an allowlisted subset of the eBird v2 API, injecting the secret key and setting per-path `Cache-Control` for edge caching. The React side talks only to `/api/ebird/...`, composes three view components inside the renamed `MigrationTab`, and aggregates 24 historic-day responses client-side into a month-by-month bar chart.

**Tech Stack:** React 18 (CRA / react-scripts), Leaflet (unchanged on Map tab), Vercel Functions (Node, Fluid Compute default), Jest + @testing-library/react for tests, eBird API v2, US Census Geocoder.

**Spec:** [docs/superpowers/specs/2026-04-23-explore-page-ebird-integration-design.md](../specs/2026-04-23-explore-page-ebird-integration-design.md)

**Conventions (follow exactly):**
- All paths in this plan are **relative to the repo root** `/Users/ejayan/Projects/Animals-Plants-Distribution-System-main`.
- Run all `npm` commands from `frontend/` unless stated otherwise.
- One task = one commit. The commit command is the last step of each task.
- Never commit `EBIRD_API_KEY` or anything prefixed `REACT_APP_EBIRD_*`.
- Match existing code style (see `frontend/src/components/MapTab.jsx` as the reference).

---

## Task 0: Install testing dependencies

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install Testing Library**

```bash
cd frontend && npm install --save-dev \
  @testing-library/react@^14 \
  @testing-library/jest-dom@^6 \
  @testing-library/user-event@^14
```

- [ ] **Step 2: Create Jest setup to enable jest-dom matchers**

Create `frontend/src/setupTests.js` (CRA auto-loads this file):

```js
import "@testing-library/jest-dom";
```

- [ ] **Step 3: Sanity-check the test runner**

```bash
cd frontend && CI=true npm test -- --watchAll=false --passWithNoTests
```

Expected: `Ran all test suites.` exit code 0.

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/setupTests.js
git commit -m "chore(test): add @testing-library/react for the Explore page tests"
```

---

## Task 1: eBird proxy config (allowlist + cache headers)

**Files:**
- Create: `frontend/src/services/ebirdProxyConfig.js`
- Test: `frontend/src/services/__tests__/ebirdProxyConfig.test.js`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/services/__tests__/ebirdProxyConfig.test.js`:

```js
import { isAllowedPath, cacheHeaderFor } from "../ebirdProxyConfig";

describe("isAllowedPath", () => {
  test.each([
    "data/obs/US-TX-303/recent",
    "data/obs/geo/recent",
    "data/obs/US-TX-303/recent/amerob",
    "data/obs/US-TX-303/historic/2025/4/15",
    "ref/region/list/subnational1/US",
    "ref/region/list/subnational2/US-TX",
    "ref/taxonomy/ebird",
  ])("allows %s", (path) => {
    expect(isAllowedPath(path)).toBe(true);
  });

  test.each([
    "",
    "data/obs/US-TX-303",                 // missing trailing segment
    "data/obs/US-TX-303/historic/2025/4", // missing day
    "ref/region/list/country/world",      // not allowlisted
    "product/spplist/US-TX-303",          // not in v1
    "../secret",                          // traversal attempt
  ])("rejects %s", (path) => {
    expect(isAllowedPath(path)).toBe(false);
  });
});

describe("cacheHeaderFor", () => {
  test("historic paths are cached 30 days", () => {
    expect(cacheHeaderFor("data/obs/US-TX-303/historic/2025/4/15"))
      .toBe("public, s-maxage=2592000, stale-while-revalidate=86400");
  });

  test("ref paths are cached 30 days", () => {
    expect(cacheHeaderFor("ref/region/list/subnational1/US"))
      .toBe("public, s-maxage=2592000, stale-while-revalidate=86400");
  });

  test("recent paths are cached 5 min", () => {
    expect(cacheHeaderFor("data/obs/US-TX-303/recent"))
      .toBe("public, s-maxage=300, stale-while-revalidate=60");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && CI=true npm test -- --testPathPattern='ebirdProxyConfig' --watchAll=false
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Write the implementation**

Create `frontend/src/services/ebirdProxyConfig.js`:

```js
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

export function isAllowedPath(path) {
  if (typeof path !== "string" || path.length === 0) return false;
  if (path.includes("..")) return false;
  return ALLOWLIST.some((rx) => rx.test(path));
}

export function cacheHeaderFor(path) {
  if (/\/historic\//.test(path)) return CACHE_30D;
  if (/^ref\//.test(path))       return CACHE_30D;
  return CACHE_5M;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && CI=true npm test -- --testPathPattern='ebirdProxyConfig' --watchAll=false
```

Expected: PASS (3 describe blocks, all tests green).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/ebirdProxyConfig.js \
        frontend/src/services/__tests__/ebirdProxyConfig.test.js
git commit -m "feat(ebird): allowlist + cache-header config for the proxy"
```

---

## Task 2: eBird proxy handler (fetch logic)

**Files:**
- Create: `frontend/src/services/ebirdProxyHandler.js`
- Test: `frontend/src/services/__tests__/ebirdProxyHandler.test.js`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/services/__tests__/ebirdProxyHandler.test.js`:

```js
import { handleEbirdProxy } from "../ebirdProxyHandler";

function makeFetch(responses) {
  return jest.fn(async () => responses.shift());
}

function mockResponse({ status = 200, body = "{}", text } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text ?? body,
  };
}

describe("handleEbirdProxy", () => {
  test("rejects disallowed paths with 400", async () => {
    const res = await handleEbirdProxy({
      path: "product/spplist/US-TX-303",
      query: {},
      apiKey: "KEY",
      fetchFn: jest.fn(),
    });
    expect(res.status).toBe(400);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(JSON.parse(res.body).error).toMatch(/not allowed/i);
  });

  test("rejects when api key is missing with 500", async () => {
    const res = await handleEbirdProxy({
      path: "data/obs/US-TX-303/recent",
      query: {},
      apiKey: "",
      fetchFn: jest.fn(),
    });
    expect(res.status).toBe(500);
    expect(JSON.parse(res.body).error).toMatch(/api key/i);
  });

  test("calls upstream with X-eBirdApiToken and forwards JSON", async () => {
    const fetchFn = makeFetch([mockResponse({ status: 200, body: '[{"x":1}]' })]);
    const res = await handleEbirdProxy({
      path: "data/obs/US-TX-303/recent",
      query: { back: "14" },
      apiKey: "KEY",
      fetchFn,
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.ebird.org/v2/data/obs/US-TX-303/recent?back=14");
    expect(init.headers["X-eBirdApiToken"]).toBe("KEY");
    expect(res.status).toBe(200);
    expect(res.body).toBe('[{"x":1}]');
    expect(res.headers["cache-control"]).toMatch(/s-maxage=300/);
  });

  test("applies 30-day cache header for historic paths", async () => {
    const fetchFn = makeFetch([mockResponse({ body: "[]" })]);
    const res = await handleEbirdProxy({
      path: "data/obs/US-TX-303/historic/2025/4/15",
      query: {},
      apiKey: "KEY",
      fetchFn,
    });
    expect(res.headers["cache-control"]).toMatch(/s-maxage=2592000/);
  });

  test("mirrors upstream non-2xx status and body", async () => {
    const fetchFn = makeFetch([mockResponse({ status: 404, text: "not found" })]);
    const res = await handleEbirdProxy({
      path: "data/obs/US-XX-999/recent",
      query: {},
      apiKey: "KEY",
      fetchFn,
    });
    expect(res.status).toBe(404);
    expect(res.body).toBe("not found");
    // no cache header on upstream errors
    expect(res.headers["cache-control"]).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && CI=true npm test -- --testPathPattern='ebirdProxyHandler' --watchAll=false
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Write the implementation**

Create `frontend/src/services/ebirdProxyHandler.js`:

```js
import { isAllowedPath, cacheHeaderFor } from "./ebirdProxyConfig";

const EBIRD_BASE = "https://api.ebird.org/v2";

function json(status, obj) {
  return {
    status,
    body: JSON.stringify(obj),
    headers: { "content-type": "application/json; charset=utf-8" },
  };
}

export async function handleEbirdProxy({ path, query, apiKey, fetchFn = fetch }) {
  if (!isAllowedPath(path)) {
    return json(400, { error: "endpoint not allowed" });
  }
  if (!apiKey) {
    return json(500, { error: "EBIRD_API_KEY not configured" });
  }

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query || {})) {
    if (k === "path") continue;
    if (Array.isArray(v)) v.forEach((x) => qs.append(k, x));
    else if (v != null)   qs.append(k, String(v));
  }
  const qsString = qs.toString();
  const url = `${EBIRD_BASE}/${path}${qsString ? `?${qsString}` : ""}`;

  const upstream = await fetchFn(url, {
    headers: { "X-eBirdApiToken": apiKey },
  });
  const body = await upstream.text();

  if (!upstream.ok) {
    return {
      status: upstream.status,
      body,
      headers: { "content-type": "application/json; charset=utf-8" },
    };
  }

  return {
    status: 200,
    body,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheHeaderFor(path),
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && CI=true npm test -- --testPathPattern='ebirdProxyHandler' --watchAll=false
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/ebirdProxyHandler.js \
        frontend/src/services/__tests__/ebirdProxyHandler.test.js
git commit -m "feat(ebird): pure proxy handler with mocked-fetch tests"
```

---

## Task 3: Vercel Function adapter

**Files:**
- Create: `frontend/api/ebird/[...path].js`

(No unit tests — this file is thin HTTP wiring; the pure logic it calls is already tested. It will be smoke-tested against a preview deployment in Task 17.)

- [ ] **Step 1: Write the adapter**

Create `frontend/api/ebird/[...path].js`:

```js
const { handleEbirdProxy } = require("../../src/services/ebirdProxyHandler");

module.exports = async (req, res) => {
  const rawPath = req.query.path;
  const path = Array.isArray(rawPath) ? rawPath.join("/") : (rawPath || "");

  const { status, body, headers } = await handleEbirdProxy({
    path,
    query: req.query,
    apiKey: process.env.EBIRD_API_KEY,
    fetchFn: fetch,
  });

  for (const [k, v] of Object.entries(headers)) {
    res.setHeader(k, v);
  }
  res.status(status).send(body);
};
```

Note: `fetch` is available globally in Node 18+ (Vercel default).

- [ ] **Step 2: Commit**

```bash
git add frontend/api/ebird/[...path].js
git commit -m "feat(ebird): Vercel Function adapter for the eBird proxy"
```

---

## Task 4: Client eBird service (fetcher + aggregation)

**Files:**
- Create: `frontend/src/services/ebird.js`
- Test: `frontend/src/services/__tests__/ebird.test.js`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/services/__tests__/ebird.test.js`:

```js
import { aggregateMigration } from "../ebird";

function obs(speciesCode, comName, sciName) {
  return { speciesCode, comName, sciName, howMany: 1 };
}

describe("aggregateMigration", () => {
  test("collapses 24 samples into per-species monthly counts", () => {
    const samples = [
      // year A
      { month: 1, observations: [obs("amerob", "American Robin", "Turdus migratorius")] },
      { month: 2, observations: [obs("amerob", "American Robin", "Turdus migratorius"), obs("norcar", "Northern Cardinal", "Cardinalis cardinalis")] },
      // year B
      { month: 1, observations: [obs("amerob", "American Robin", "Turdus migratorius")] },
      { month: 2, observations: [] },
    ];
    const result = aggregateMigration(samples);
    const robin = result.find((r) => r.speciesCode === "amerob");
    expect(robin.monthCounts[0]).toBe(2); // Jan across 2 years
    expect(robin.monthCounts[1]).toBe(1); // Feb across 2 years
    expect(robin.total).toBe(3);
    const cardinal = result.find((r) => r.speciesCode === "norcar");
    expect(cardinal.monthCounts[1]).toBe(1);
    expect(cardinal.total).toBe(1);
  });

  test("returns rows sorted by total descending", () => {
    const samples = [
      { month: 1, observations: [obs("a", "A", "a"), obs("a", "A", "a"), obs("b", "B", "b")] },
    ];
    const result = aggregateMigration(samples);
    expect(result.map((r) => r.speciesCode)).toEqual(["a", "b"]);
  });

  test("caps result to top 30 species", () => {
    const many = { month: 1, observations: [] };
    for (let i = 0; i < 50; i++) {
      many.observations.push(obs(`sp${i}`, `Sp ${i}`, "s"));
    }
    const result = aggregateMigration([many]);
    expect(result.length).toBe(30);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && CI=true npm test -- --testPathPattern='services/__tests__/ebird.test' --watchAll=false
```

Expected: FAIL — `aggregateMigration` is not a function.

- [ ] **Step 3: Write the implementation**

Create `frontend/src/services/ebird.js`:

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && CI=true npm test -- --testPathPattern='services/__tests__/ebird.test' --watchAll=false
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/services/ebird.js \
        frontend/src/services/__tests__/ebird.test.js
git commit -m "feat(ebird): client service with fetchers and migration aggregation"
```

---

## Task 5: Regions service (state list + geo→eBird code)

**Files:**
- Create: `frontend/src/services/regions.js`
- Create: `frontend/src/services/usStates.js` (static FIPS-to-USPS table)
- Test: `frontend/src/services/__tests__/regions.test.js`

- [ ] **Step 1: Write the static state table**

Create `frontend/src/services/usStates.js`:

```js
// 50 states + DC. FIPS → USPS. Used for composing eBird region codes.
export const FIPS_TO_USPS = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};
```

- [ ] **Step 2: Write failing tests**

Create `frontend/src/services/__tests__/regions.test.js`:

```js
import { fipsToEbirdRegion, geocoderToEbird } from "../regions";

describe("fipsToEbirdRegion", () => {
  test("Lubbock County, TX → US-TX-303", () => {
    expect(fipsToEbirdRegion("48", "303")).toBe("US-TX-303");
  });
  test("pads county to 3 digits", () => {
    expect(fipsToEbirdRegion("06", "1")).toBe("US-CA-001");
  });
  test("returns null for unknown state FIPS", () => {
    expect(fipsToEbirdRegion("99", "001")).toBe(null);
  });
});

describe("geocoderToEbird", () => {
  test("parses a Census geocoder response", () => {
    const payload = {
      result: {
        geographies: {
          "Counties": [{ STATE: "48", COUNTY: "303", NAME: "Lubbock County" }],
        },
      },
    };
    expect(geocoderToEbird(payload)).toEqual({
      regionCode: "US-TX-303",
      label: "Lubbock County, TX",
    });
  });

  test("returns null on malformed payload", () => {
    expect(geocoderToEbird({})).toBe(null);
    expect(geocoderToEbird({ result: { geographies: { Counties: [] } } })).toBe(null);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd frontend && CI=true npm test -- --testPathPattern='regions.test' --watchAll=false
```

Expected: FAIL — module does not exist.

- [ ] **Step 4: Write the implementation**

Create `frontend/src/services/regions.js`:

```js
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
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd frontend && CI=true npm test -- --testPathPattern='regions.test' --watchAll=false
```

Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/services/regions.js \
        frontend/src/services/usStates.js \
        frontend/src/services/__tests__/regions.test.js
git commit -m "feat(regions): state FIPS table + Census geocoder → eBird region code"
```

---

## Task 6: `useRegion` hook (localStorage-persisted)

**Files:**
- Create: `frontend/src/hooks/useRegion.js`
- Test: `frontend/src/hooks/__tests__/useRegion.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/hooks/__tests__/useRegion.test.jsx`:

```jsx
import { act, renderHook } from "@testing-library/react";
import { useRegion } from "../useRegion";

beforeEach(() => localStorage.clear());

test("returns the default region on first load", () => {
  const { result } = renderHook(() => useRegion());
  expect(result.current.region.regionCode).toBe("US-TX-303");
});

test("persists region changes to localStorage", () => {
  const { result } = renderHook(() => useRegion());
  act(() => result.current.setRegion({ regionCode: "US-CA-075", label: "San Francisco County, CA" }));
  expect(JSON.parse(localStorage.getItem("wildtrack.region")).regionCode).toBe("US-CA-075");
});

test("rehydrates from localStorage on mount", () => {
  localStorage.setItem("wildtrack.region", JSON.stringify({ regionCode: "US-NY-061", label: "New York County, NY" }));
  const { result } = renderHook(() => useRegion());
  expect(result.current.region.label).toBe("New York County, NY");
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && CI=true npm test -- --testPathPattern='useRegion' --watchAll=false
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Write the implementation**

Create `frontend/src/hooks/useRegion.js`:

```js
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_REGION } from "../services/regions";

const KEY = "wildtrack.region";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_REGION;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.regionCode && parsed.label) return parsed;
    return DEFAULT_REGION;
  } catch {
    return DEFAULT_REGION;
  }
}

export function useRegion() {
  const [region, setRegionState] = useState(read);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(region)); } catch {}
  }, [region]);

  const setRegion = useCallback((next) => {
    if (next && next.regionCode && next.label) setRegionState(next);
  }, []);

  return { region, setRegion };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && CI=true npm test -- --testPathPattern='useRegion' --watchAll=false
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useRegion.js \
        frontend/src/hooks/__tests__/useRegion.test.jsx
git commit -m "feat(hooks): useRegion with localStorage persistence"
```

---

## Task 7: `useEbird` hook

**Files:**
- Create: `frontend/src/hooks/useEbird.js`
- Test: `frontend/src/hooks/__tests__/useEbird.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/hooks/__tests__/useEbird.test.jsx`:

```jsx
import { renderHook, waitFor } from "@testing-library/react";
import { useEbird } from "../useEbird";

test("starts in loading state, resolves with data", async () => {
  const fetcher = jest.fn().mockResolvedValue([{ x: 1 }]);
  const { result } = renderHook(() => useEbird(fetcher, ["key"]));
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toEqual([{ x: 1 }]);
  expect(result.current.error).toBe(null);
});

test("surfaces errors", async () => {
  const fetcher = jest.fn().mockRejectedValue(new Error("boom"));
  const { result } = renderHook(() => useEbird(fetcher, ["key"]));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error.message).toBe("boom");
  expect(result.current.data).toBe(null);
});

test("skips when key is null", async () => {
  const fetcher = jest.fn();
  const { result } = renderHook(() => useEbird(fetcher, null));
  expect(result.current.loading).toBe(false);
  expect(fetcher).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && CI=true npm test -- --testPathPattern='useEbird' --watchAll=false
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Write the implementation**

Create `frontend/src/hooks/useEbird.js`:

```js
import { useEffect, useRef, useState } from "react";

export function useEbird(fetcher, key) {
  const [state, setState] = useState({ loading: !!key, data: null, error: null });
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const serialized = JSON.stringify(key);
  useEffect(() => {
    if (!key) { setState({ loading: false, data: null, error: null }); return; }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve(fetcher())
      .then((data) => { if (!cancelled) setState({ loading: false, data, error: null }); })
      .catch((error) => { if (!cancelled) setState({ loading: false, data: null, error }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);

  return state;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && CI=true npm test -- --testPathPattern='useEbird' --watchAll=false
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useEbird.js \
        frontend/src/hooks/__tests__/useEbird.test.jsx
git commit -m "feat(hooks): useEbird fetch + loading/error state"
```

---

## Task 8: Leaf components — Attribution, BirdCard, MonthSlider, FrequencyBars

These four components are small enough that we batch them into one task but still write tests first.

**Files:**
- Create: `frontend/src/components/explore/Attribution.jsx`
- Create: `frontend/src/components/explore/BirdCard.jsx`
- Create: `frontend/src/components/explore/MonthSlider.jsx`
- Create: `frontend/src/components/explore/FrequencyBars.jsx`
- Test: `frontend/src/components/explore/__tests__/leaf.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/components/explore/__tests__/leaf.test.jsx`:

```jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Attribution } from "../Attribution";
import { BirdCard } from "../BirdCard";
import { MonthSlider } from "../MonthSlider";
import { FrequencyBars } from "../FrequencyBars";

test("Attribution renders eBird.org link", () => {
  render(<Attribution />);
  const link = screen.getByRole("link", { name: /ebird\.org/i });
  expect(link).toHaveAttribute("href", "https://ebird.org");
});

test("BirdCard shows common, scientific, location, date", () => {
  render(
    <BirdCard
      sighting={{
        comName: "American Robin",
        sciName: "Turdus migratorius",
        locName: "Mae Simmons Park",
        obsDt: "2026-04-18 08:23",
        howMany: 2,
      }}
    />
  );
  expect(screen.getByText("American Robin")).toBeInTheDocument();
  expect(screen.getByText("Turdus migratorius")).toBeInTheDocument();
  expect(screen.getByText(/Mae Simmons Park/)).toBeInTheDocument();
  expect(screen.getByText(/2026/)).toBeInTheDocument();
});

test("MonthSlider fires onChange with selected month 1..12", () => {
  const onChange = jest.fn();
  render(<MonthSlider value={4} onChange={onChange} />);
  fireEvent.change(screen.getByRole("slider"), { target: { value: "7" } });
  expect(onChange).toHaveBeenCalledWith(7);
});

test("FrequencyBars renders one row per species and highlights non-zero", () => {
  render(
    <FrequencyBars
      month={4}
      rows={[
        { speciesCode: "amerob", comName: "American Robin", sciName: "Turdus migratorius", monthCounts: [0,0,0,5,0,0,0,0,0,0,0,0] },
        { speciesCode: "norcar", comName: "Northern Cardinal", sciName: "Cardinalis cardinalis", monthCounts: new Array(12).fill(0) },
      ]}
      onSelect={jest.fn()}
    />
  );
  expect(screen.getByText("American Robin")).toBeInTheDocument();
  expect(screen.getByText("Northern Cardinal")).toBeInTheDocument();
  // The April row for robin should have a visible bar width
  const robinRow = screen.getByText("American Robin").closest("[data-species]");
  expect(robinRow).toHaveAttribute("data-count", "5");
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && CI=true npm test -- --testPathPattern='explore/__tests__/leaf' --watchAll=false
```

Expected: FAIL — modules do not exist.

- [ ] **Step 3: Write Attribution**

Create `frontend/src/components/explore/Attribution.jsx`:

```jsx
import React from "react";

export function Attribution() {
  return (
    <p className="attribution">
      Bird data from{" "}
      <a href="https://ebird.org" target="_blank" rel="noreferrer">
        eBird.org
      </a>{" "}
      — Cornell Lab of Ornithology.
    </p>
  );
}
```

- [ ] **Step 4: Write BirdCard**

Create `frontend/src/components/explore/BirdCard.jsx`:

```jsx
import React from "react";

function formatObsDate(obsDt) {
  const d = new Date((obsDt || "").replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return obsDt || "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function BirdCard({ sighting, onClick }) {
  return (
    <button
      type="button"
      className="bird-card"
      onClick={onClick}
      data-species={sighting.speciesCode}
    >
      <div className="bird-name">{sighting.comName}</div>
      <div className="bird-sci">{sighting.sciName}</div>
      <div className="bird-meta">
        <span>{sighting.locName}</span>
        <span>· {formatObsDate(sighting.obsDt)}</span>
        {Number(sighting.howMany) > 1 && <span>· ×{sighting.howMany}</span>}
      </div>
    </button>
  );
}
```

- [ ] **Step 5: Write MonthSlider**

Create `frontend/src/components/explore/MonthSlider.jsx`:

```jsx
import React from "react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function MonthSlider({ value, onChange }) {
  return (
    <div className="month-slider-row">
      <input
        type="range"
        min={1}
        max={12}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="month-slider"
        aria-label="Month"
      />
      <span className="month-name">{MONTHS[value - 1]}</span>
    </div>
  );
}
```

- [ ] **Step 6: Write FrequencyBars**

Create `frontend/src/components/explore/FrequencyBars.jsx`:

```jsx
import React, { useMemo } from "react";

export function FrequencyBars({ month, rows, onSelect }) {
  const max = useMemo(
    () => Math.max(1, ...rows.map((r) => r.monthCounts[month - 1])),
    [rows, month]
  );
  return (
    <ul className="freq-bars">
      {rows.map((r) => {
        const count = r.monthCounts[month - 1];
        const pct = Math.round((count / max) * 100);
        return (
          <li key={r.speciesCode} data-species={r.speciesCode} data-count={count}>
            <button
              type="button"
              className="freq-row"
              onClick={() => onSelect(r)}
            >
              <span className="freq-name">{r.comName}</span>
              <span className="freq-bar" style={{ width: `${pct}%` }} />
              <span className="freq-count">{count}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

```bash
cd frontend && CI=true npm test -- --testPathPattern='explore/__tests__/leaf' --watchAll=false
```

Expected: PASS (4 tests).

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/explore/Attribution.jsx \
        frontend/src/components/explore/BirdCard.jsx \
        frontend/src/components/explore/MonthSlider.jsx \
        frontend/src/components/explore/FrequencyBars.jsx \
        frontend/src/components/explore/__tests__/leaf.test.jsx
git commit -m "feat(explore): leaf components (Attribution, BirdCard, MonthSlider, FrequencyBars)"
```

---

## Task 9: RegionPicker component

**Files:**
- Create: `frontend/src/components/explore/RegionPicker.jsx`
- Test: `frontend/src/components/explore/__tests__/RegionPicker.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/components/explore/__tests__/RegionPicker.test.jsx`:

```jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RegionPicker } from "../RegionPicker";

jest.mock("../../../services/regions", () => ({
  DEFAULT_REGION: { regionCode: "US-TX-303", label: "Lubbock County, TX" },
  fetchStates: jest.fn().mockResolvedValue([
    { code: "US-CA", name: "California" },
    { code: "US-TX", name: "Texas" },
  ]),
  fetchCounties: jest.fn().mockImplementation((state) =>
    Promise.resolve(
      state === "US-TX"
        ? [{ code: "US-TX-303", name: "Lubbock County" }]
        : [{ code: "US-CA-075", name: "San Francisco County" }]
    )
  ),
  geolocateToRegion: jest.fn(),
}));

import { fetchStates, fetchCounties, geolocateToRegion } from "../../../services/regions";

test("renders default region label", () => {
  render(<RegionPicker region={{ regionCode: "US-TX-303", label: "Lubbock County, TX" }} onChange={jest.fn()} />);
  expect(screen.getByText(/Lubbock County, TX/)).toBeInTheDocument();
});

test("state → county cascade calls onChange with composed region", async () => {
  const onChange = jest.fn();
  render(<RegionPicker region={{ regionCode: "US-TX-303", label: "Lubbock County, TX" }} onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: /change region/i }));
  await waitFor(() => expect(fetchStates).toHaveBeenCalled());
  fireEvent.change(screen.getByLabelText(/state/i), { target: { value: "US-CA" } });
  await waitFor(() => expect(fetchCounties).toHaveBeenCalledWith("US-CA"));
  fireEvent.change(screen.getByLabelText(/county/i), { target: { value: "US-CA-075" } });
  expect(onChange).toHaveBeenCalledWith({
    regionCode: "US-CA-075",
    label: "San Francisco County, CA",
  });
});

test("use-location button calls geolocateToRegion and fires onChange", async () => {
  const onChange = jest.fn();
  geolocateToRegion.mockResolvedValueOnce({ regionCode: "US-NY-061", label: "New York County, NY" });
  render(<RegionPicker region={{ regionCode: "US-TX-303", label: "Lubbock County, TX" }} onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: /use my location/i }));
  await waitFor(() => expect(onChange).toHaveBeenCalledWith({ regionCode: "US-NY-061", label: "New York County, NY" }));
});

test("use-location silently falls back when denied", async () => {
  const onChange = jest.fn();
  geolocateToRegion.mockRejectedValueOnce(new Error("denied"));
  render(<RegionPicker region={{ regionCode: "US-TX-303", label: "Lubbock County, TX" }} onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: /use my location/i }));
  await waitFor(() => expect(screen.getByRole("button", { name: /use my location/i })).not.toBeDisabled());
  expect(onChange).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && CI=true npm test -- --testPathPattern='RegionPicker' --watchAll=false
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Write the implementation**

Create `frontend/src/components/explore/RegionPicker.jsx`:

```jsx
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && CI=true npm test -- --testPathPattern='RegionPicker' --watchAll=false
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/explore/RegionPicker.jsx \
        frontend/src/components/explore/__tests__/RegionPicker.test.jsx
git commit -m "feat(explore): RegionPicker with geolocation + state/county cascade"
```

---

## Task 10: RecentView, MigrationView, SpeciesView

**Files:**
- Create: `frontend/src/components/explore/RecentView.jsx`
- Create: `frontend/src/components/explore/MigrationView.jsx`
- Create: `frontend/src/components/explore/SpeciesView.jsx`
- Test: `frontend/src/components/explore/__tests__/views.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/components/explore/__tests__/views.test.jsx`:

```jsx
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { RecentView } from "../RecentView";
import { MigrationView } from "../MigrationView";
import { SpeciesView } from "../SpeciesView";

jest.mock("../../../services/ebird", () => ({
  fetchRecent: jest.fn(),
  fetchRecentForSpecies: jest.fn(),
  fetchMigrationSamples: jest.fn(),
  aggregateMigration: jest.requireActual("../../../services/ebird").aggregateMigration,
}));

import {
  fetchRecent,
  fetchRecentForSpecies,
  fetchMigrationSamples,
} from "../../../services/ebird";

const region = { regionCode: "US-TX-303", label: "Lubbock County, TX" };

describe("RecentView", () => {
  test("shows empty state when no sightings", async () => {
    fetchRecent.mockResolvedValueOnce([]);
    render(<RecentView region={region} onSelectSpecies={jest.fn()} />);
    await waitFor(() => expect(screen.getByText(/No recent sightings/i)).toBeInTheDocument());
  });

  test("renders sightings and wires clicks", async () => {
    fetchRecent.mockResolvedValueOnce([
      { speciesCode: "amerob", comName: "American Robin", sciName: "Turdus migratorius", locName: "Mae Simmons Park", obsDt: "2026-04-18 08:23", howMany: 1 },
    ]);
    const onSelect = jest.fn();
    render(<RecentView region={region} onSelectSpecies={onSelect} />);
    await waitFor(() => expect(screen.getByText("American Robin")).toBeInTheDocument());
    fireEvent.click(screen.getByText("American Robin"));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ speciesCode: "amerob" }));
  });
});

describe("MigrationView", () => {
  test("aggregates samples and renders bar rows", async () => {
    fetchMigrationSamples.mockResolvedValueOnce([
      { month: 4, observations: [{ speciesCode: "amerob", comName: "American Robin", sciName: "Turdus migratorius" }] },
      { month: 4, observations: [{ speciesCode: "amerob", comName: "American Robin", sciName: "Turdus migratorius" }] },
    ]);
    render(<MigrationView region={region} onSelectSpecies={jest.fn()} />);
    await waitFor(() => expect(screen.getByText("American Robin")).toBeInTheDocument());
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });
});

describe("SpeciesView", () => {
  test("renders header, recent table, and fallback link", async () => {
    fetchRecentForSpecies.mockResolvedValueOnce([
      { speciesCode: "amerob", comName: "American Robin", sciName: "Turdus migratorius", locName: "Mae Simmons Park", obsDt: "2026-04-18 08:23", howMany: 1 },
    ]);
    render(<SpeciesView region={region} species={{ speciesCode: "amerob", comName: "American Robin", sciName: "Turdus migratorius" }} onBack={jest.fn()} />);
    await waitFor(() => expect(screen.getByRole("heading", { name: /American Robin/ })).toBeInTheDocument());
    expect(screen.getByRole("iframe")).toHaveAttribute("src", expect.stringContaining("ebird.org/species/amerob/US-TX-303"));
    expect(screen.getByRole("link", { name: /Open on eBird/i })).toBeInTheDocument();
  });
});
```

Note: jest-dom's `getByRole("iframe")` works because we'll render an `<iframe title="…">` element.

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && CI=true npm test -- --testPathPattern='views.test' --watchAll=false
```

Expected: FAIL — modules do not exist.

- [ ] **Step 3: Write RecentView**

Create `frontend/src/components/explore/RecentView.jsx`:

```jsx
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
```

- [ ] **Step 4: Write MigrationView**

Create `frontend/src/components/explore/MigrationView.jsx`:

```jsx
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
```

- [ ] **Step 5: Write SpeciesView**

Create `frontend/src/components/explore/SpeciesView.jsx`:

```jsx
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
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd frontend && CI=true npm test -- --testPathPattern='views.test' --watchAll=false
```

Expected: PASS (4 tests across 3 describes).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/explore/RecentView.jsx \
        frontend/src/components/explore/MigrationView.jsx \
        frontend/src/components/explore/SpeciesView.jsx \
        frontend/src/components/explore/__tests__/views.test.jsx
git commit -m "feat(explore): Recent, Migration, and Species views"
```

---

## Task 11: ViewSwitcher + ExploreTab composition

**Files:**
- Create: `frontend/src/components/explore/ViewSwitcher.jsx`
- Create: `frontend/src/components/explore/ExploreTab.jsx`
- Test: `frontend/src/components/explore/__tests__/ExploreTab.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/components/explore/__tests__/ExploreTab.test.jsx`:

```jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExploreTab } from "../ExploreTab";

jest.mock("../../../services/ebird", () => ({
  fetchRecent: jest.fn().mockResolvedValue([]),
  fetchRecentForSpecies: jest.fn().mockResolvedValue([]),
  fetchMigrationSamples: jest.fn().mockResolvedValue([]),
  aggregateMigration: () => [],
}));

test("renders hero, region picker, view switcher, and attribution", async () => {
  render(<ExploreTab />);
  expect(screen.getByRole("heading", { name: /nature|birds|where/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /ebird\.org/i })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /Recent/i })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /Migration/i })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /Species/i })).toBeInTheDocument();
});

test("switches to Migration view when tab is clicked", async () => {
  render(<ExploreTab />);
  fireEvent.click(screen.getByRole("tab", { name: /Migration/i }));
  await waitFor(() => expect(screen.getByRole("tab", { name: /Migration/i })).toHaveAttribute("aria-selected", "true"));
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && CI=true npm test -- --testPathPattern='ExploreTab.test' --watchAll=false
```

Expected: FAIL — module does not exist.

- [ ] **Step 3: Write ViewSwitcher**

Create `frontend/src/components/explore/ViewSwitcher.jsx`:

```jsx
import React from "react";

const VIEWS = [
  { id: "recent", label: "Recent" },
  { id: "migration", label: "Migration" },
  { id: "species", label: "Species" },
];

export function ViewSwitcher({ value, onChange, speciesEnabled }) {
  return (
    <div className="view-switcher" role="tablist">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          type="button"
          role="tab"
          aria-selected={value === v.id}
          className={`view-tab ${value === v.id ? "active" : ""}`}
          onClick={() => onChange(v.id)}
          disabled={v.id === "species" && !speciesEnabled}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Write ExploreTab**

Create `frontend/src/components/explore/ExploreTab.jsx`:

```jsx
import React, { useState } from "react";
import { useRegion } from "../../hooks/useRegion";
import { Attribution } from "./Attribution";
import { RegionPicker } from "./RegionPicker";
import { ViewSwitcher } from "./ViewSwitcher";
import { RecentView } from "./RecentView";
import { MigrationView } from "./MigrationView";
import { SpeciesView } from "./SpeciesView";

export function ExploreTab() {
  const { region, setRegion } = useRegion();
  const [view, setView] = useState("recent");
  const [species, setSpecies] = useState(null);

  function selectSpecies(s) {
    setSpecies(s);
    setView("species");
  }

  return (
    <section className="tab-section explore">
      <div className="hero">
        <h1 className="hero-heading">
          See which <em>birds</em> are where, by month.
        </h1>
        <p className="hero-sub">
          Live bird data from eBird. Pick a region to start.
        </p>
      </div>

      <RegionPicker region={region} onChange={setRegion} />
      <ViewSwitcher value={view} onChange={setView} speciesEnabled={!!species} />

      <div className="explore-view">
        {view === "recent" && <RecentView region={region} onSelectSpecies={selectSpecies} />}
        {view === "migration" && <MigrationView region={region} onSelectSpecies={selectSpecies} />}
        {view === "species" && species && (
          <SpeciesView region={region} species={species} onBack={() => setView("recent")} />
        )}
        {view === "species" && !species && (
          <div className="view-empty">Pick a bird from Recent or Migration to see details.</div>
        )}
      </div>

      <Attribution />
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd frontend && CI=true npm test -- --testPathPattern='ExploreTab.test' --watchAll=false
```

Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/explore/ViewSwitcher.jsx \
        frontend/src/components/explore/ExploreTab.jsx \
        frontend/src/components/explore/__tests__/ExploreTab.test.jsx
git commit -m "feat(explore): ViewSwitcher and ExploreTab composition"
```

---

## Task 12: Wire ExploreTab into MigrationTab.jsx

**Files:**
- Modify: `frontend/src/components/MigrationTab.jsx`

- [ ] **Step 1: Replace MigrationTab to delegate to ExploreTab**

Overwrite `frontend/src/components/MigrationTab.jsx` with:

```jsx
import React from "react";
import { ExploreTab } from "./explore/ExploreTab";

export default function MigrationTab() {
  return <ExploreTab />;
}
```

(The file keeps its existing name and default export so `App.jsx` doesn't change.)

- [ ] **Step 2: Run full test suite**

```bash
cd frontend && CI=true npm test -- --watchAll=false
```

Expected: ALL green.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/MigrationTab.jsx
git commit -m "feat(explore): wire ExploreTab into the Explore tab"
```

---

## Task 13: Styles for the Explore views

**Files:**
- Create: `frontend/src/components/explore/Explore.css`
- Modify: `frontend/src/components/explore/ExploreTab.jsx` (add CSS import)

- [ ] **Step 1: Add CSS import**

In `frontend/src/components/explore/ExploreTab.jsx`, add at the top with the other imports:

```js
import "./Explore.css";
```

- [ ] **Step 2: Write stylesheet**

Create `frontend/src/components/explore/Explore.css`:

```css
/* Explore tab — scoped styles. Tokens from colors_and_type.css. */

.region-picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.region-current {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  flex-wrap: wrap;
}
.region-pin { font-size: 1rem; }
.region-label { font-weight: 600; color: var(--text-primary); }
.region-change, .region-locate {
  margin-left: auto;
  font: inherit;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-secondary);
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  cursor: pointer;
}
.region-change:hover, .region-locate:hover { border-color: var(--accent-green); color: var(--accent-green); }
.region-locate[disabled] { opacity: 0.5; cursor: progress; }

.region-dropdown {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.region-dropdown label {
  display: flex; flex-direction: column; gap: var(--space-1);
  font-size: var(--fs-meta); color: var(--text-muted);
  text-transform: uppercase; letter-spacing: var(--tracking-wide);
  font-weight: 600;
}
.region-dropdown select {
  font: inherit; padding: 8px 10px;
  border-radius: var(--radius-md); border: 1px solid var(--border);
  background: var(--bg-card); color: var(--text-primary);
}

.view-switcher {
  display: inline-flex; gap: var(--space-1);
  padding: 4px; background: var(--bg-subtle);
  border: 1px solid var(--border); border-radius: var(--radius-pill);
}
.view-tab {
  font: inherit; padding: 6px 16px; border: none;
  background: transparent; color: var(--text-secondary);
  border-radius: var(--radius-pill); cursor: pointer;
}
.view-tab.active { background: var(--bg-card); color: var(--accent-green); font-weight: 600; box-shadow: var(--shadow-sm); }
.view-tab[disabled] { opacity: 0.4; cursor: not-allowed; }

.explore-view { min-height: 320px; }

.explore-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-4);
}

.bird-card {
  text-align: left; background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: var(--space-4) var(--space-5);
  display: flex; flex-direction: column; gap: var(--space-1);
  cursor: pointer; font: inherit;
}
.bird-card:hover { border-color: var(--accent-green); box-shadow: var(--shadow-md); }
.bird-name { font-weight: 600; color: var(--text-primary); }
.bird-sci { font-style: italic; font-size: var(--fs-meta); color: var(--text-muted); }
.bird-meta { font-size: var(--fs-meta); color: var(--text-muted); display: flex; flex-wrap: wrap; gap: 4px; margin-top: var(--space-2); }

.month-slider-row {
  display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3) 0;
}
.freq-bars { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.freq-bars li { display: block; }
.freq-row {
  display: grid; grid-template-columns: 180px 1fr 40px; align-items: center;
  gap: var(--space-3); width: 100%; text-align: left;
  background: transparent; border: none; padding: 4px 0; cursor: pointer; font: inherit;
}
.freq-row:hover .freq-name { color: var(--accent-green); }
.freq-name { font-size: var(--fs-body-sm); color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.freq-bar { height: 10px; background: var(--accent-green); border-radius: 999px; }
.freq-count { font-size: var(--fs-meta); color: var(--text-muted); font-variant-numeric: tabular-nums; text-align: right; }

.species-header {
  display: flex; align-items: baseline; gap: var(--space-3);
  border-bottom: 1px solid var(--border); padding-bottom: var(--space-3);
}
.species-back {
  background: none; border: none; color: var(--accent-green); cursor: pointer;
  font: inherit; padding: 0;
}
.species-header h2 { font-size: var(--fs-h2); color: var(--text-primary); margin: 0; }
.species-sci { color: var(--text-muted); font-style: italic; }

.species-recent { margin-top: var(--space-5); }
.species-embed { margin-top: var(--space-6); display: flex; flex-direction: column; gap: var(--space-2); }
.species-embed iframe {
  width: 100%; height: 640px;
  border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--bg-subtle);
}
.species-open { align-self: flex-end; color: var(--accent-green); font-weight: 600; }

.view-skeleton, .view-empty, .view-error {
  padding: var(--space-6) var(--space-4); text-align: center;
  background: var(--bg-card); border: 1px dashed var(--border); border-radius: var(--radius-lg); color: var(--text-muted);
}

.attribution {
  margin-top: var(--space-6); text-align: center; font-size: var(--fs-meta); color: var(--text-muted);
}
.attribution a { color: var(--accent-green); }
```

- [ ] **Step 3: Run full test suite**

```bash
cd frontend && CI=true npm test -- --watchAll=false
```

Expected: ALL green (CSS import doesn't affect Jest).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/explore/Explore.css \
        frontend/src/components/explore/ExploreTab.jsx
git commit -m "style(explore): scoped stylesheet for the Explore tab views"
```

---

## Task 14: Build verification + local smoke check

- [ ] **Step 1: Production build**

```bash
cd frontend && CI=true npm run build 2>&1 | tail -20
```

Expected: `Compiled successfully.` CSS/JS bundle sizes printed.

- [ ] **Step 2: Start dev server**

```bash
cd frontend && BROWSER=none PORT=3000 npm start
```

(Runs in background; stop with Ctrl-C when done.)

- [ ] **Step 3: Smoke check — Explore tab loads**

In a browser at `http://localhost:3000`:

1. Click the Explore tab → page should render.
2. Attribution footer visible? ✓
3. Region picker shows "Lubbock County, TX"? ✓
4. All three view tabs visible (Recent / Migration / Species)? ✓

**Note:** The Recent/Migration views will show the error state (`Couldn't reach eBird`) locally because `/api/ebird/*` has no handler on `npm start`. This is expected — the proxy only runs under `vercel dev` or on a deployment.

- [ ] **Step 4: No commit needed** (no file changes this task).

---

## Task 15: Vercel env var + preview deploy

This task is **operational**, not code. It runs in the Vercel dashboard + local CLI.

- [ ] **Step 1: Add EBIRD_API_KEY in Vercel**

In the Vercel dashboard → Project → Settings → Environment Variables, add:

- Name: `EBIRD_API_KEY`
- Value: (the key you received from Cornell — never paste it into a file)
- Environments: Production, Preview, Development (all three checked)
- Save.

- [ ] **Step 2: Push the branch**

```bash
git push origin demo-eric
```

This triggers a preview deployment automatically.

- [ ] **Step 3: Verify the proxy works on the preview URL**

From the preview URL printed in the Vercel dashboard (e.g. `https://wild-track-xxxxx.vercel.app`):

```bash
curl -sS "https://<preview-url>/api/ebird/data/obs/US-TX-303/recent?back=14" \
  | head -200
```

Expected: a JSON array of recent observations. Not an error, not HTML.

Confirm headers:

```bash
curl -sSI "https://<preview-url>/api/ebird/data/obs/US-TX-303/recent?back=14" \
  | grep -iE 'cache-control|content-type'
```

Expected: `cache-control: public, s-maxage=300, …` and `content-type: application/json…`.

- [ ] **Step 4: Verify an allowlist rejection**

```bash
curl -sS "https://<preview-url>/api/ebird/product/spplist/US-TX-303"
```

Expected: `{"error":"endpoint not allowed"}` with HTTP 400.

- [ ] **Step 5: Browser smoke test**

Open the preview URL, click Explore, confirm:

- Recent view loads real eBird sightings.
- Migration view loads (may take a few seconds for the first 24 calls; subsequent visits are instant due to edge cache).
- Clicking a bird opens Species view with a working iframe + "Open on eBird" link.
- Attribution footer is visible on every view.

---

## Task 16: Merge to `main` for production

- [ ] **Step 1: Open a PR**

```bash
gh pr create --base main --head demo-eric \
  --title "feat: Explore tab with live eBird integration" \
  --body "$(cat <<'EOF'
## Summary
- Adds Explore tab with three views: Recent, Migration, Species
- All bird data comes through a Vercel Function proxy (`/api/ebird/*`)
- eBird API key kept server-side only
- Includes edge caching (5 min for recent, 30 days for historic/ref)
- Attribution to eBird.org on every Explore view

## Test plan
- [ ] `npm test` passes (unit + component)
- [ ] `npm run build` compiles
- [ ] Preview deploy: Recent view loads real sightings for US-TX-303
- [ ] Preview deploy: Migration view renders bars after ~24 samples load
- [ ] Preview deploy: Species view loads iframe + "Open on eBird" link
- [ ] Preview deploy: `/api/ebird/product/spplist/*` returns 400
EOF
)"
```

- [ ] **Step 2: Wait for CI and preview to go green**, then merge via the GitHub UI or:

```bash
gh pr merge --squash
```

- [ ] **Step 3: Confirm production deploy**

Once merged to `main`, production deploy kicks off. Repeat Task 15 Step 3–5 against the production URL.

---

## Self-Review

### 1. Spec coverage

| Spec section | Task(s) |
|---|---|
| §3 Page shell, hero, region picker, segmented control | 9, 11 |
| §3 Recent view | 10 |
| §3 Migration view (24 samples, top 30, bar chart, click → species) | 4, 8, 10 |
| §3 Species view (header, recent table, iframe + fallback link) | 10 |
| §3 Error/empty/loading states | 10 (each view), 8 (skeleton markup in CSS) |
| §4 Data flow + proxy function | 1, 2, 3, 15 |
| §4 Geolocation → region code | 5, 9 |
| §5 File structure | all |
| §6 EBIRD_API_KEY env var | 15 |
| §7 Testing (proxy, aggregation, RegionPicker, ExploreTab) | 1, 2, 4, 9, 11 |
| §8 Attribution + compliance | 8 (component), 11 (always mounted), 15 (env secrecy) |

No gaps.

### 2. Placeholders — none. Every step has full code or a concrete command.

### 3. Type consistency — confirmed:
- `region` shape `{ regionCode, label }` is identical everywhere it flows.
- `species` shape `{ speciesCode, comName, sciName }` (plus extra fields from eBird) used consistently in `BirdCard`, `SpeciesView`, `FrequencyBars.onSelect`.
- `handleEbirdProxy` return shape `{ status, body, headers }` used by both the Vercel adapter (Task 3) and its tests (Task 2).
- `fetchMigrationSamples` returns `[{ month, observations }]` as consumed by `aggregateMigration` tests (Task 4).
