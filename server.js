// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const DATA_FILE = path.join(__dirname, "data.json");
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// inicializar data file si no existe
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]), "utf8");
}

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "[]");
  } catch (e) {
    return [];
  }
}

function writeData(arr) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), "utf8");
}

// POST /api/brainrots
app.post("/api/brainrots", (req, res) => {
  const body = req.body || {};
  if (!body.name || body.jobId == null) {
    return res.status(400).json({ ok: false, error: "name and jobId required" });
  }

  const arr = readData();

  // key para identificar (name + jobId)
  const key = `${body.name}__${body.jobId}`;

  // buscar existente
  const idx = arr.findIndex(it => it.key === key);
  const record = {
    key,
    placeId: body.placeId || null,
    jobId: body.jobId || null,
    name: body.name || "",
    genText: body.genText || "",
    genValue: body.genValue || 0,
    players: body.players || 0,
    maxPlayers: body.maxPlayers || 0,
    joinLink: body.joinLink || "",
    pcScript: body.pcScript || "",
    detectedAt: body.detectedAt || new Date().toISOString()
  };

  if (idx >= 0) {
    // actualizar registro existente
    arr[idx] = Object.assign(arr[idx], record);
  } else {
    arr.push(record);
  }

  // limitar tamaño por seguridad (ej. últimos 1000)
  if (arr.length > 1000) arr.splice(0, arr.length - 1000);

  writeData(arr);
  res.json({ ok: true, stored: record });
});

// GET /api/brainrots -> devuelve ordenado por fecha (más recientes primero)
app.get("/api/brainrots", (req, res) => {
  let arr = readData();
  arr.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));
  res.json(arr);
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
