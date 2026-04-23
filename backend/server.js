const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 5000;

const DATA_DIR = path.join(__dirname, "data");
const SIGHTINGS_FILE = path.join(DATA_DIR, "sightings.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const EBIRD_API_KEY = "c143ddonqbn6";
const EBIRD_BASE_URL = "https://api.ebird.org/v2";
const REPO_DIR = path.join(__dirname, "..");
const GIT_BRANCH = process.env.GIT_BRANCH || "main";

app.use(cors());
app.use(express.json());

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function ensureFile(filePath, defaultValue) {
  ensureDataDir();

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
  }
}

function readJsonFile(filePath, defaultValue) {
  ensureFile(filePath, defaultValue);

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return raw.trim() ? JSON.parse(raw) : defaultValue;
  } catch (error) {
    console.error(`Failed to read JSON file ${filePath}:`, error.message);
    return defaultValue;
  }
}

function writeJsonFile(filePath, data) {
  ensureFile(filePath, Array.isArray(data) ? [] : {});
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: REPO_DIR }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || stdout || error.message));
        return;
      }

      resolve(stdout);
    });
  });
}

async function pullLatestSightings() {
  try {
    await runCommand(`git pull origin ${GIT_BRANCH}`);
  } catch (error) {
    console.error("Git pull failed:", error.message);
  }
}

async function commitAndPushSightings(message) {
  try {
    await runCommand("git add backend/data/sightings.json");

    try {
      await runCommand(`git commit -m "${message.replace(/"/g, '\\"')}"`);
    } catch (commitError) {
      if (
        commitError.message.includes("nothing to commit") ||
        commitError.message.includes("no changes added to commit")
      ) {
        return;
      }

      console.error("Commit failed:", commitError.message);
      return;
    }

    await runCommand(`git push origin ${GIT_BRANCH}`);
  } catch (error) {
    console.error("Git push failed:", error.message);
  }
}


app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/sightings", async (req, res) => {
  await pullLatestSightings();
  const sightings = readJsonFile(SIGHTINGS_FILE, []);
  res.json(sightings);
});

app.get("/api/sightings/:id", async (req, res) => {
  await pullLatestSightings();

  const sightings = readJsonFile(SIGHTINGS_FILE, []);
  const sighting = sightings.find((entry) => String(entry.id) === String(req.params.id));

  if (!sighting) {
    return res.status(404).json({ message: "Sighting not found." });
  }

  return res.json(sighting);
});

app.post("/api/sightings", async (req, res) => {
  const sightings = readJsonFile(SIGHTINGS_FILE, []);
  const sighting = req.body || {};

  if (!sighting.type || !sighting.commonName || !sighting.date) {
    return res.status(400).json({
      message: "type, commonName, and date are required.",
    });
  }

  if (!sighting.reporter) {
    return res.status(400).json({
      message: "Reporter is required.",
    });
  }

  const newSighting = {
    id: Date.now(),
    type: String(sighting.type),
    commonName: String(sighting.commonName),
    suggestedName: "",
    city: String(sighting.city || "").trim(),
    country: String(sighting.country || "").trim(),
    lat: sighting.lat ?? null,
    lng: sighting.lng ?? null,
    notes: String(sighting.notes || ""),
    date: String(sighting.date),
    reporter: String(sighting.reporter),
    imageUrl: String(sighting.imageUrl || ""),
    status: "Reported",
    isValid: "",
  };

  sightings.unshift(newSighting);
  writeJsonFile(SIGHTINGS_FILE, sightings);

  await commitAndPushSightings(`Add sighting ${newSighting.id}`);

  return res.status(201).json(newSighting);
});

app.get("/api/birdcast/overlay", async (req, res) => {
  try {
    const response = await fetch(
      `${EBIRD_BASE_URL}/data/obs/US/recent/notable?back=3&detail=simple`,
      {
        headers: { "X-eBirdApiToken": EBIRD_API_KEY },
      }
    );

    if (!response.ok) {
      console.error("eBird API unreachable");
      return res.status(502).json({ message: "Failed to fetch live migration data" });
    }

    const obsList = await response.json();

    const regions = obsList.map((obs, index) => ({
      id: `ebird-${index}`,
      lat: obs.lat,
      lng: obs.lng,
      level: Math.random() * 0.5 + 0.5,
      species: obs.comName,
      howMany: obs.howMany || 1,
    }));

    return res.json({
      updatedAt: new Date().toISOString(),
      regions,
    });
  } catch (error) {
    console.error("Migration data error:", error);
    return res.status(500).json({ message: "Failed to fetch live migration data" });
  }
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, location = "" } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  const users = readJsonFile(USERS_FILE, []);
  const existingUser = users.find(
      (user) => user.email.toLowerCase() === String(email).toLowerCase()
  );

  if (existingUser) {
    return res.status(409).json({ message: "An account with that email already exists." });
  }

  const newUser = {
    id: Date.now().toString(),
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    password: String(password),
    location: String(location || "").trim(),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeJsonFile(USERS_FILE, users);

  return res.status(201).json({
    message: "Registration successful.",
    user: sanitizeUser(newUser),
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const users = readJsonFile(USERS_FILE, []);
  const user = users.find(
      (entry) =>
          entry.email.toLowerCase() === String(email).toLowerCase() &&
          entry.password === String(password)
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  return res.json({
    message: "Login successful.",
    user: sanitizeUser(user),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});