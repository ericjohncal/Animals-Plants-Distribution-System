// One-shot generator for frontend/src/data/migration.json.
// Run with: node scripts/gen-migration.js
const fs = require("fs");
const path = require("path");

const POINTS_PER_MONTH = 20;
const SPECIES = "American Robin";

// Lat/lng ranges per month, tuned for a visually obvious northward
// shift in spring and southward retreat in fall.
const RANGES = {
  1:  { lat: [28, 33], lng: [-100, -85] },
  2:  { lat: [28, 33], lng: [-100, -85] },
  3:  { lat: [33, 40], lng: [-100, -82] },
  4:  { lat: [36, 42], lng: [-100, -78] },
  5:  { lat: [38, 44], lng: [-100, -75] },
  6:  { lat: [42, 52], lng: [-100, -75] },
  7:  { lat: [42, 52], lng: [-100, -75] },
  8:  { lat: [42, 52], lng: [-100, -75] },
  9:  { lat: [38, 44], lng: [-100, -78] },
  10: { lat: [36, 42], lng: [-100, -82] },
  11: { lat: [33, 38], lng: [-100, -85] },
  12: { lat: [28, 33], lng: [-100, -85] },
};

const round4 = (n) => Math.round(n * 10000) / 10000;
const rand = (min, max) => min + Math.random() * (max - min);

function genMonth(range) {
  const points = [];
  for (let i = 0; i < POINTS_PER_MONTH; i++) {
    points.push([round4(rand(range.lat[0], range.lat[1])), round4(rand(range.lng[0], range.lng[1]))]);
  }
  return points;
}

const data = { [SPECIES]: {} };
for (let m = 1; m <= 12; m++) {
  data[SPECIES][String(m)] = genMonth(RANGES[m]);
}

const outPath = path.join(__dirname, "..", "frontend", "src", "data", "migration.json");
fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
console.log(`Wrote ${outPath} with ${POINTS_PER_MONTH} points x 12 months for "${SPECIES}".`);
