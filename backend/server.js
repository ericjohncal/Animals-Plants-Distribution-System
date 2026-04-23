const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

const DATA_DIR = path.join(__dirname, "data");
const SIGHTINGS_FILE = path.join(DATA_DIR, "sightings.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

app.use(cors());
app.use(express.json());

function ensureFile(filePath, defaultValue) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
  }
}

function readJsonFile(filePath, defaultValue) {
  ensureFile(filePath, defaultValue);
  const raw = fs.readFileSync(filePath, "utf8");
  return raw.trim() ? JSON.parse(raw) : defaultValue;
}

function writeJsonFile(filePath, data) {
  ensureFile(filePath, []);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/sightings", (req, res) => {
  const sightings = readJsonFile(SIGHTINGS_FILE, []);
  res.json(sightings);
});

app.post("/api/sightings", (req, res) => {
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
    type: sighting.type,
    commonName: sighting.commonName,
    location: sighting.location || "",
    lat: sighting.lat ?? null,
    lng: sighting.lng ?? null,
    notes: sighting.notes || "",
    date: sighting.date,
    status: sighting.status || "Native",
    reporter: sighting.reporter,
    imageUrl: sighting.imageUrl || "",
  };

  sightings.unshift(newSighting);
  writeJsonFile(SIGHTINGS_FILE, sightings);

  res.status(201).json(newSighting);
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