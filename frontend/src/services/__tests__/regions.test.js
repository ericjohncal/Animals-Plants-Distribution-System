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
