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
