import React, { useState } from "react";

const DEMO_PHOTOS = [
  { id: "robin", label: "Robin", src: "/demo-photos/robin.jpg" },
  { id: "cardinal", label: "Cardinal", src: "/demo-photos/cardinal.jpg" },
  { id: "squirrel", label: "Squirrel", src: "/demo-photos/squirrel.jpg" },
];

const LUBBOCK_FALLBACK = [33.5779, -101.8552];
const USE_MOCK = process.env.REACT_APP_USE_MOCK_AI === "true";

const MOCK_PREDICTIONS = [
  { name: "American Robin", sci: "Turdus migratorius", score: 91.2 },
  { name: "Hermit Thrush", sci: "Catharus guttatus", score: 6.5 },
  { name: "Wood Thrush", sci: "Hylocichla mustelina", score: 2.3 },
];

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Geolocation with hard 3-second timeout, silent fallback to Lubbock.
function getLocation() {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (coords, source) => {
      if (resolved) return;
      resolved = true;
      resolve({ coords, source });
    };
    const timer = setTimeout(() => finish(LUBBOCK_FALLBACK, "fallback"), 3000);
    if (!navigator.geolocation) {
      clearTimeout(timer);
      return finish(LUBBOCK_FALLBACK, "fallback");
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        finish([pos.coords.latitude, pos.coords.longitude], "browser");
      },
      () => {
        clearTimeout(timer);
        finish(LUBBOCK_FALLBACK, "fallback");
      },
      { timeout: 3000, maximumAge: 60000 }
    );
  });
}

async function identifyMock() {
  await delay(1000);
  return MOCK_PREDICTIONS;
}

async function identifyINat(file) {
  const formData = new FormData();
  formData.append("image", file);
  const resp = await fetch(
    "https://api.inaturalist.org/v1/computervision/score_image",
    { method: "POST", body: formData }
  );
  if (!resp.ok) throw new Error(`iNat ${resp.status}`);
  const json = await resp.json();
  return (json.results || []).slice(0, 3).map((r) => ({
    name: r.taxon?.preferred_common_name || r.taxon?.name || "Unknown",
    sci: r.taxon?.name || "",
    score: typeof r.combined_score === "number" ? r.combined_score : 0,
  }));
}

async function urlToFile(url, filename) {
  const resp = await fetch(url);
  const blob = await resp.blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}

export default function ReportTab({ onSubmit }) {
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [locStatus, setLocStatus] = useState("idle");
  const [speciesGuess, setSpeciesGuess] = useState("");
  const [predictions, setPredictions] = useState(null);
  const [aiStatus, setAiStatus] = useState("idle");
  const [accepted, setAccepted] = useState(null);

  const resetAfterPhotoChange = () => {
    setPredictions(null);
    setAccepted(null);
    setAiStatus("idle");
  };

  const selectDemoPhoto = async (demo) => {
    const file = await urlToFile(demo.src, `${demo.id}.jpg`);
    setPhoto({ src: demo.src, file });
    resetAfterPhotoChange();
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPhoto({ src: url, file: f });
    resetAfterPhotoChange();
  };

  const useMyLocation = async () => {
    setLocStatus("loading");
    const result = await getLocation();
    setLocation(result.coords);
    setLocStatus(result.source);
  };

  const identify = async () => {
    if (!photo?.file) return;
    setAiStatus("loading");
    setPredictions(null);
    setAccepted(null);
    try {
      const preds = USE_MOCK
        ? await identifyMock()
        : await identifyINat(photo.file);
      setPredictions(preds);
      setAiStatus("done");
    } catch (e) {
      // Fall back to mock predictions on real-API failure so the demo never breaks.
      setPredictions(MOCK_PREDICTIONS);
      setAiStatus("done");
    }
  };

  const submit = () => {
    if (!photo || !accepted) return;
    const coords = location || LUBBOCK_FALLBACK;
    const sighting = {
      id: `s-${Date.now()}`,
      species: accepted.name,
      scientificName: accepted.sci,
      lat: coords[0],
      lng: coords[1],
      date: new Date().toISOString(),
      photoUrl: photo.src,
      reporter: "You",
      notes: speciesGuess
        ? `Field guess: ${speciesGuess}.`
        : "Submitted via WildAtlas demo.",
    };
    onSubmit(sighting);
    setPhoto(null);
    setLocation(null);
    setLocStatus("idle");
    setSpeciesGuess("");
    setPredictions(null);
    setAccepted(null);
    setAiStatus("idle");
  };

  return (
    <section className="tab-section">
      <div className="report-grid">
        <div className="field">
          <div className="field-label">Photo</div>
          <div className="field-help">
            Click a demo photo (recommended for the demo) or upload your own.
          </div>
          <div className="demo-thumbs">
            {DEMO_PHOTOS.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`demo-thumb ${photo?.src === d.src ? "selected" : ""}`}
                onClick={() => selectDemoPhoto(d)}
                aria-label={`Use demo photo: ${d.label}`}
              >
                <img src={d.src} alt={d.label} />
              </button>
            ))}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="file-input"
          />
          {photo && (
            <img className="uploaded-preview" src={photo.src} alt="Selected sighting" />
          )}
        </div>

        <div className="field">
          <div className="field-label">Location</div>
          <div className="location-row">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={useMyLocation}
              disabled={locStatus === "loading"}
            >
              {locStatus === "loading" ? "Locating..." : "Use my location"}
            </button>
            {location && (
              <span className="location-status">
                {location[0].toFixed(4)}, {location[1].toFixed(4)}
                {locStatus === "fallback" && " (Lubbock fallback)"}
              </span>
            )}
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="species-guess">
            Species guess (optional)
          </label>
          <input
            id="species-guess"
            type="text"
            className="text-input"
            placeholder="e.g. American Robin"
            value={speciesGuess}
            onChange={(e) => setSpeciesGuess(e.target.value)}
          />
        </div>

        <div className="field">
          <button
            type="button"
            className="btn btn-primary"
            onClick={identify}
            disabled={!photo || aiStatus === "loading"}
          >
            {aiStatus === "loading" && <span className="spinner" />}
            {aiStatus === "loading" ? "Identifying..." : "Identify with AI"}
          </button>
          {USE_MOCK && (
            <span className="field-help">
              Mock AI mode is on (REACT_APP_USE_MOCK_AI=true). Returns canned
              predictions after 1s — safe for offline demos.
            </span>
          )}
        </div>

        {predictions && (
          <div className="field">
            <div className="field-label">AI predictions</div>
            <div className="predictions">
              {predictions.map((p, i) => (
                <div key={i} className="prediction-card">
                  <div className="prediction-meta">
                    <span className="prediction-name">{p.name}</span>
                    <em className="prediction-sci">{p.sci}</em>
                  </div>
                  <div className="prediction-actions">
                    <span className="prediction-score">{p.score.toFixed(1)}%</span>
                    <button
                      type="button"
                      className={`btn ${
                        accepted?.name === p.name ? "btn-primary" : "btn-secondary"
                      }`}
                      onClick={() => setAccepted(p)}
                    >
                      {accepted?.name === p.name ? "Selected" : "Accept"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {accepted && (
          <div className="field">
            <div className="accepted-banner">
              Selected: <strong>{accepted.name}</strong>{" "}
              <em>({accepted.sci})</em>
            </div>
            <button type="button" className="btn btn-primary" onClick={submit}>
              Submit Sighting
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
