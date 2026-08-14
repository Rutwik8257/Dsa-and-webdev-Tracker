/**
 * DSA + WebDev Tracker — backend API
 * -----------------------------------
 * Stores the tracker's entire state as one JSON document in MongoDB
 * (mirrors what the frontend already sends — no schema surgery needed
 * every time you add a field in the app).
 *
 * Routes:
 *   GET  /health          -> liveness check
 *   GET  /api/state        -> { data: <your tracker state> | null }
 *   PUT  /api/state        -> body: { data: <your tracker state> }  -> { ok: true }
 *
 * Auth: every /api/* route requires header  x-api-key: <API_KEY>
 * (set API_KEY as an env var on your host — see README.md)
 */

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors()); // the frontend is a static file served from anywhere (incl. Claude artifacts), so allow all origins
app.use(express.json({ limit: "5mb" }));

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const API_KEY = process.env.API_KEY;

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI environment variable. Set it before starting the server.");
  process.exit(1);
}
if (!API_KEY) {
  console.warn("WARNING: No API_KEY set. Your /api/state endpoint will be open to anyone with the URL. Set API_KEY before going live.");
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

const StateSchema = new mongoose.Schema({
  _id: { type: String, default: "default" },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  updatedAt: { type: Date, default: Date.now },
});
const StateModel = mongoose.model("TrackerState", StateSchema);

function checkAuth(req, res, next) {
  if (!API_KEY) return next(); // no key configured -> open (dev only, see warning above)
  const key = req.header("x-api-key");
  if (key !== API_KEY) return res.status(401).json({ error: "Unauthorized — missing or invalid x-api-key header" });
  next();
}

app.get("/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.get("/api/state", checkAuth, async (req, res) => {
  try {
    const doc = await StateModel.findById("default").lean();
    res.json({ data: doc ? doc.data : null, updatedAt: doc ? doc.updatedAt : null });
  } catch (e) {
    console.error("GET /api/state failed:", e);
    res.status(500).json({ error: "Failed to load state" });
  }
});

app.put("/api/state", checkAuth, async (req, res) => {
  try {
    const data = req.body ? req.body.data : undefined;
    if (data === undefined) return res.status(400).json({ error: "Request body must be { data: <state object> }" });
    await StateModel.findByIdAndUpdate(
      "default",
      { data, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("PUT /api/state failed:", e);
    res.status(500).json({ error: "Failed to save state" });
  }
});

app.listen(PORT, () => console.log(`Tracker backend listening on port ${PORT}`));
