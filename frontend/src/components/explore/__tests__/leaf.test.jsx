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
