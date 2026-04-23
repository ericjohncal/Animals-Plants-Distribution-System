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
