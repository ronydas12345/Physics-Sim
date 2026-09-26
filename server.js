import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import {
  analyzeLaunch,
  anglesForRange,
  DEFAULTS,
  sweepAngles,
} from "./lib/projectile.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/lib", express.static(path.join(__dirname, "lib")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, lab: "projectile-motion" });
});

app.post("/api/analyze", (req, res) => {
  try {
    const v0 = Number(req.body.v0 ?? DEFAULTS.v0);
    const angleDeg = Number(req.body.angle ?? req.body.angleDeg ?? DEFAULTS.angleDeg);
    const g = Number(req.body.g ?? DEFAULTS.g);
    if (![v0, angleDeg, g].every(Number.isFinite)) {
      res.status(400).json({ error: "v0, angle, and g must be numbers." });
      return;
    }
    res.json(analyzeLaunch({ v0, angleDeg, g }));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/curve", (req, res) => {
  try {
    const v0 = Number(req.query.v0 ?? DEFAULTS.v0);
    const g = Number(req.query.g ?? DEFAULTS.g);
    const stepDeg = Number(req.query.step ?? 1);
    res.json(sweepAngles({ v0, g, stepDeg }));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/challenge/solve", (req, res) => {
  try {
    const targetRange = Number(req.body.targetRange);
    const v0 = Number(req.body.v0 ?? DEFAULTS.v0);
    const g = Number(req.body.g ?? DEFAULTS.g);
    res.json(anglesForRange(targetRange, v0, g));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/simulations/projectile", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "projectile.html"));
});

app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    next();
    return;
  }
  if (req.path.startsWith("/api") || req.path.startsWith("/lib")) {
    next();
    return;
  }
  if (path.extname(req.path)) {
    next();
    return;
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`AP Physics 1 Simulation Platform → http://localhost:${PORT}`);
});
