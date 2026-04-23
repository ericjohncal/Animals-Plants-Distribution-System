import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RegionPicker } from "../RegionPicker";

jest.mock("../../../services/regions", () => ({
  DEFAULT_REGION: { regionCode: "US-TX-303", label: "Lubbock County, TX" },
  fetchStates: jest.fn(),
  fetchCounties: jest.fn(),
  geolocateToRegion: jest.fn(),
}));

import { fetchStates, fetchCounties, geolocateToRegion } from "../../../services/regions";

beforeEach(() => {
  fetchStates.mockResolvedValue([
    { code: "US-CA", name: "California" },
    { code: "US-TX", name: "Texas" },
  ]);
  fetchCounties.mockImplementation((state) =>
    Promise.resolve(
      state === "US-TX"
        ? [{ code: "US-TX-303", name: "Lubbock County" }]
        : [{ code: "US-CA-075", name: "San Francisco County" }]
    )
  );
});

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
