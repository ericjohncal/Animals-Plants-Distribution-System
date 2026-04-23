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
    expect(screen.getByTitle(/eBird page for American Robin/i)).toHaveAttribute("src", expect.stringContaining("ebird.org/species/amerob/US-TX-303"));
    expect(screen.getByRole("link", { name: /Open on eBird/i })).toBeInTheDocument();
  });
});
