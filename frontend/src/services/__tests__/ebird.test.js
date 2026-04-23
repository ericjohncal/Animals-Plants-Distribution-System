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
