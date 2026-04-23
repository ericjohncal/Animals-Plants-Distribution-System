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
