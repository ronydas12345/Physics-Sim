/**
 * Universal gravitation for Simulation 2.6.
 * Fg = G m1 m2 / r² between object centers. The pair is equal, opposite, and attractive.
 */

import { DT, DIAGRAM_DT, DURATION_MAX, DURATION_MIN, PLAYBACK_SPEEDS } from "./forces.js";
import { clamp, formatSigned, formatUnsigned } from "./kinematics1d.js";

export {
  DIAGRAM_DT,
  DT,
  DURATION_MAX,
  DURATION_MIN,
  PLAYBACK_SPEEDS,
  formatSigned,
  formatUnsigned,
};

export const G = 6.6743e-11;
export const EARTH_MASS = 5.972e24;
export const EARTH_RADIUS = 6.371e6;
export const MIN_R = 1e-3;
export const MASS_MIN = 1e-6;
export const BASIC_MASS_MAX = 1e6;

export const MASS1_TRIALS = Object.freeze([1000, 2000, 3000, 4000, 5000]);
export const DIST_TRIALS = Object.freeze([1, 2, 3, 4, 5]);
export const INVSQ_TRIALS = Object.freeze([1, 2, 4, 8]);
export const GUIDED_INVSQ = Object.freeze([10, 20, 40, 80]);
export const HEIGHT_PRESETS = Object.freeze([0, 1e3, 1e4, 1e5, 1e6, EARTH_RADIUS]);

export const SCENARIOS = [
  { id: "basic", label: "Basic attraction", m1: 1000, m2: 1000, r: 10, layout: "line" },
  { id: "double-one", label: "Double one mass", m1: 2000, m2: 1000, r: 10, layout: "line" },
  { id: "double-both", label: "Double both masses", m1: 2000, m2: 2000, r: 10, layout: "line" },
  { id: "double-distance", label: "Double distance", m1: 1000, m2: 1000, r: 20, layout: "line" },
  { id: "unequal", label: "Unequal masses", m1: 1000, m2: 5000, r: 10, layout: "line" },
  { id: "earth-surface", label: "Earth surface", m1: EARTH_MASS, m2: 1, r: EARTH_RADIUS, layout: "earth", h: 0 },
  { id: "earth-altitude", label: "Earth at altitude", m1: EARTH_MASS, m2: 1, r: EARTH_RADIUS, layout: "earth", h: 1e5 },
  { id: "orbit", label: "Orbit extension", m1: EARTH_MASS, m2: 1000, r: 7.5e6, layout: "orbit" },
];

export function scenarioById(id) {
  return SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
}

export function clampMass(m) {
  const n = Number(m);
  if (!Number.isFinite(n) || n <= 0) return MASS_MIN;
  return n;
}

export function safeR(r) {
  const n = Math.abs(Number(r));
  if (!Number.isFinite(n) || n < MIN_R) return MIN_R;
  return n;
}

export function gravitationalForceMagnitude(m1, m2, r) {
  const F = (G * clampMass(m1) * clampMass(m2)) / (safeR(r) * safeR(r));
  return Number.isFinite(F) ? F : 0;
}

export function gravitationalField(sourceMass, r) {
  const g = (G * clampMass(sourceMass)) / (safeR(r) * safeR(r));
  return Number.isFinite(g) ? g : 0;
}

export function earthSurfaceG() {
  return gravitationalField(EARTH_MASS, EARTH_RADIUS);
}

export function gAtHeight(h = 0) {
  return gravitationalField(EARTH_MASS, EARTH_RADIUS + Math.max(0, Number(h) || 0));
}

export function calculateGravitationalForce(m1, m2, r, x1 = 0, x2) {
  const X2 = Number.isFinite(x2) ? x2 : x1 + safeR(r);
  const dx = X2 - x1;
  const dist = Math.abs(dx);
  const mag = gravitationalForceMagnitude(m1, m2, dist);
  const sign = dist < MIN_R ? 0 : Math.sign(dx);
  const onA = mag * sign;
  const onB = -onA;
  const M1 = clampMass(m1);
  const M2 = clampMass(m2);
  return {
    magnitude: mag,
    r: Math.max(dist, MIN_R),
    onA,
    onB,
    aA: onA / M1,
    aB: onB / M2,
    gAtA: gravitationalField(M2, dist),
    gAtB: gravitationalField(M1, dist),
  };
}

export function calculateGravitationalForce2d(m1, m2, p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);
  const mag = gravitationalForceMagnitude(m1, m2, dist);
  const ux = dist >= MIN_R ? dx / dist : 0;
  const uy = dist >= MIN_R ? dy / dist : 0;
  const M1 = clampMass(m1);
  const M2 = clampMass(m2);
  return {
    magnitude: mag,
    r: Math.max(dist, MIN_R),
    onA: { x: mag * ux, y: mag * uy },
    onB: { x: -mag * ux, y: -mag * uy },
    aA: { x: (mag * ux) / M1, y: (mag * uy) / M1 },
    aB: { x: (-mag * ux) / M2, y: (-mag * uy) / M2 },
  };
}

export function circularOrbitSpeed(M, r) {
  return Math.sqrt((G * clampMass(M)) / safeR(r));
}

export function formatQuantity(value, unit = "", sci = true, digits = 4) {
  if (!Number.isFinite(value)) return unit ? `— ${unit}` : "—";
  const abs = Math.abs(value);
  const suffix = unit ? ` ${unit}` : "";
  const useSci = sci || (abs !== 0 && (abs < 1e-3 || abs >= 1e5));
  if (useSci) {
    const exp = value.toExponential(digits);
    return `${exp.replace("e+", "×10^").replace("e-", "×10^−").replace("×10^", "e")}${suffix}`.replace(
      /e([+-]?)(\d+)/,
      (_, sign, n) => ` × 10${sign === "-" ? "⁻" : ""}${toSuperscript(n)}`,
    );
  }
  if (abs >= 100) return `${value.toFixed(1)}${suffix}`;
  if (abs >= 1) return `${value.toFixed(3)}${suffix}`;
  return `${value.toFixed(6)}${suffix}`;
}

function toSuperscript(digits) {
  const map = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  return String(digits).split("").map((ch) => map[ch] || ch).join("");
}

export function formatCompact(value, unit = "", sci = true) {
  if (!Number.isFinite(value)) return unit ? `— ${unit}` : "—";
  const abs = Math.abs(value);
  const suffix = unit ? ` ${unit}` : "";
  if (sci || abs === 0 || abs < 1e-3 || abs >= 1e4) return `${value.toExponential(4)}${suffix}`;
  if (abs >= 100) return `${value.toFixed(2)}${suffix}`;
  return `${value.toFixed(4)}${suffix}`;
}

function placePair(layout, r, h) {
  if (layout === "earth") {
    const height = Math.max(0, Number(h) || 0);
    const sep = EARTH_RADIUS + height;
    return { x1: 0, y1: 0, x2: sep, y2: 0, r: sep, h: height };
  }
  if (layout === "orbit") {
    const R = safeR(r);
    return { x1: 0, y1: 0, x2: R, y2: 0, r: R, h: 0 };
  }
  const sep = safeR(r);
  return { x1: -sep / 2, y1: 0, x2: sep / 2, y2: 0, r: sep, h: 0 };
}

export function createState(raw = {}) {
  const scenario = scenarioById(raw.scenario || raw.id);
  const layout = raw.layout || scenario.layout;
  const m1 = clampMass(raw.m1 ?? scenario.m1);
  const m2 = clampMass(raw.m2 ?? scenario.m2);
  const h = raw.h != null ? Math.max(0, Number(raw.h) || 0) : scenario.h || 0;
  const r0 = layout === "earth" ? EARTH_RADIUS + h : Number(raw.r) || scenario.r;
  const placed = placePair(layout, r0, h);
  const vCirc = circularOrbitSpeed(m1, placed.r);
  const state = {
    scenario: scenario.id,
    layout,
    m1,
    m2,
    r0: placed.r,
    h,
    A: {
      x: Number.isFinite(raw.x1) ? Number(raw.x1) : placed.x1,
      y: Number.isFinite(raw.y1) ? Number(raw.y1) : placed.y1,
      vx: Number.isFinite(raw.vx1) ? Number(raw.vx1) : 0,
      vy: Number.isFinite(raw.vy1) ? Number(raw.vy1) : 0,
    },
    B: {
      x: Number.isFinite(raw.x2) ? Number(raw.x2) : placed.x2,
      y: Number.isFinite(raw.y2) ? Number(raw.y2) : placed.y2,
      vx: Number.isFinite(raw.vx2) ? Number(raw.vx2) : 0,
      vy: Number.isFinite(raw.vy2) ? Number(raw.vy2) : layout === "orbit" ? vCirc : 0,
    },
    extraA: Number(raw.extraA) || 0,
    duration: clamp(Number(raw.duration) || 20, DURATION_MIN, DURATION_MAX),
    time: 0,
    showVelocity: raw.showVelocity !== false,
    showAccel: raw.showAccel !== false,
    showField: Boolean(raw.showField),
    showNet: raw.showNet !== false,
    sci: raw.sci !== false,
    motion: raw.motion !== false || layout === "orbit",
    history: [],
    trail: [],
  };
  recordSample(state);
  return state;
}

function pair(state) {
  if (state.layout === "orbit") {
    const two = calculateGravitationalForce2d(state.m1, state.m2, state.A, state.B);
    const extra = Number(state.extraA) || 0;
    return {
      ...two,
      netA: { x: two.onA.x + extra, y: two.onA.y },
      netB: two.onB,
      aA: { x: (two.onA.x + extra) / state.m1, y: two.onA.y / state.m1 },
      aB: two.aB,
    };
  }
  const one = calculateGravitationalForce(state.m1, state.m2, 0, state.A.x, state.B.x);
  const extra = Number(state.extraA) || 0;
  const netA = one.onA + extra;
  return {
    magnitude: one.magnitude,
    r: one.r,
    onA: { x: one.onA, y: 0 },
    onB: { x: one.onB, y: 0 },
    netA: { x: netA, y: 0 },
    netB: { x: one.onB, y: 0 },
    aA: { x: netA / state.m1, y: 0 },
    aB: { x: one.aB, y: 0 },
    gAtA: one.gAtA,
    gAtB: one.gAtB,
  };
}

function sampleFrom(state) {
  const live = pair(state);
  return {
    time: state.time,
    m1: state.m1,
    m2: state.m2,
    r: live.r,
    invsq: 1 / (live.r * live.r),
    Fg: live.magnitude,
    FA: live.onA.x,
    FB: live.onB.x,
    aA: live.aA.x,
    aB: live.aB.x,
    g: live.gAtB ?? gravitationalField(state.m1, live.r),
    x1: state.A.x,
    x2: state.B.x,
    y1: state.A.y,
    y2: state.B.y,
  };
}

function recordSample(state) {
  const sample = sampleFrom(state);
  const last = state.history[state.history.length - 1];
  if (last && Math.abs(last.time - sample.time) < DT * 0.5) {
    Object.assign(last, sample);
  } else {
    state.history.push(sample);
  }
  if (state.layout === "orbit") {
    state.trail.push({ x: state.B.x, y: state.B.y });
    if (state.trail.length > 800) state.trail.shift();
  }
}

function contactSeparation(state) {
  if (state.layout === "earth" || state.layout === "orbit") return EARTH_RADIUS;
  return Math.max(MIN_R, 0.06 * (state.r0 || 1));
}

function bounceApart(state, live) {
  const min = contactSeparation(state);
  if (live.r >= min) return;
  const mx = (state.A.x + state.B.x) / 2;
  const my = (state.A.y + state.B.y) / 2;
  const dx = state.B.x - state.A.x;
  const dy = state.B.y - state.A.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const half = min / 2;
  state.A.x = mx - ux * half;
  state.A.y = my - uy * half;
  state.B.x = mx + ux * half;
  state.B.y = my + uy * half;
  const rel = (state.B.vx - state.A.vx) * ux + (state.B.vy - state.A.vy) * uy;
  if (rel < 0) {
    state.A.vx += rel * ux;
    state.A.vy += rel * uy;
    state.B.vx -= rel * ux;
    state.B.vy -= rel * uy;
  }
}

export function motionWarp(state) {
  const live = pair(state);
  const relA = Math.hypot(live.aA.x - live.aB.x, live.aA.y - live.aB.y);
  if (!(relA > 0) || !(live.r > 0)) return 1;
  const duration = Math.max(Number(state.duration) || 10, 1);
  if (state.layout === "orbit") {
    const period = 2 * Math.PI * Math.sqrt((live.r ** 3) / (G * Math.max(state.m1, MASS_MIN)));
    if (!Number.isFinite(period) || period <= 0) return 1;
    return Math.min(1e8, Math.max(1, (0.8 * period) / duration));
  }
  if (state.layout === "earth" && live.r <= EARTH_RADIUS + 2) return 1;
  const tPhys = Math.sqrt((2 * 0.4 * live.r) / relA);
  if (!Number.isFinite(tPhys) || tPhys <= 0) return 1;
  return Math.min(1e8, Math.max(1, tPhys / duration));
}

export function liveState(state) {
  const live = pair(state);
  const dirA = live.onA.x > 0 ? "→" : live.onA.x < 0 ? "←" : "·";
  const dirB = live.onB.x > 0 ? "→" : live.onB.x < 0 ? "←" : "·";
  return {
    ...live,
    m1: state.m1,
    m2: state.m2,
    time: state.time,
    scenario: state.scenario,
    layout: state.layout,
    h: state.h,
    extraA: state.extraA,
    dirA,
    dirB,
    g: live.gAtB ?? gravitationalField(state.m1, live.r),
    gTest: live.magnitude / state.m2,
    earthLike: state.layout === "earth" || state.scenario.startsWith("earth"),
  };
}

export function snapshot(state) {
  const live = liveState(state);
  return {
    time: state.time,
    scenario: state.scenario,
    layout: state.layout,
    m1: state.m1,
    m2: state.m2,
    r: live.r,
    h: state.h,
    Fg: live.magnitude,
    FA: live.onA.x,
    FB: live.onB.x,
    aA: live.aA.x,
    aB: live.aB.x,
    g: live.g,
    invsq: 1 / (live.r * live.r),
    A: { ...state.A },
    B: { ...state.B },
    extraA: state.extraA,
  };
}

export function reset(state) {
  return createState({
    scenario: state.scenario,
    layout: state.layout,
    m1: state.m1,
    m2: state.m2,
    r: state.r0,
    h: state.h,
    extraA: state.extraA,
    duration: state.duration,
    showVelocity: state.showVelocity,
    showAccel: state.showAccel,
    showField: state.showField,
    showNet: state.showNet,
    sci: state.sci,
    motion: state.motion,
  });
}

function integrateMotion(state, dtPhys) {
  const live = pair(state);
  if (state.layout === "earth" && live.r <= EARTH_RADIUS + 2) {
    state.A.vx = 0;
    state.A.vy = 0;
    state.B.vx = 0;
    state.B.vy = 0;
    return;
  }
  const steps = Math.min(40, Math.max(1, Math.ceil(dtPhys / 0.05)));
  const h = dtPhys / steps;
  for (let i = 0; i < steps; i += 1) {
    const now = pair(state);
    state.A.vx += now.aA.x * h;
    state.A.vy += now.aA.y * h;
    state.B.vx += now.aB.x * h;
    state.B.vy += now.aB.y * h;
    state.A.x += state.A.vx * h;
    state.A.y += state.A.vy * h;
    state.B.x += state.B.vx * h;
    state.B.y += state.B.vy * h;
    bounceApart(state, pair(state));
  }
}

export function stepTo(state, targetTime) {
  const goal = clamp(targetTime, 0, state.duration);
  if (goal + 1e-12 < state.time) return state;
  const moving = state.motion || state.layout === "orbit";
  while (state.time + 1e-12 < goal) {
    const dt = Math.min(DT, goal - state.time);
    if (moving) integrateMotion(state, dt * motionWarp(state));
    state.time += dt;
    recordSample(state);
  }
  return state;
}

export function setMasses(state, m1, m2) {
  if (m1 != null) state.m1 = clampMass(m1);
  if (m2 != null) state.m2 = clampMass(m2);
  return state;
}

export function setSeparation(state, r) {
  const live = pair(state);
  const next = safeR(r);
  if (state.layout === "earth") {
    state.h = Math.max(0, next - EARTH_RADIUS);
    state.r0 = EARTH_RADIUS + state.h;
    state.A.x = 0;
    state.A.y = 0;
    state.B.x = state.r0;
    state.B.y = 0;
    return state;
  }
  if (state.layout === "orbit") {
    const speed = Math.hypot(state.B.vx, state.B.vy) || circularOrbitSpeed(state.m1, next);
    state.r0 = next;
    state.A.x = 0;
    state.A.y = 0;
    state.B.x = next;
    state.B.y = 0;
    state.B.vx = 0;
    state.B.vy = speed;
    return state;
  }
  const mid = (state.A.x + state.B.x) / 2;
  const sign = state.B.x >= state.A.x ? 1 : -1;
  state.r0 = next;
  state.A.x = mid - sign * next / 2;
  state.B.x = mid + sign * next / 2;
  state.A.y = 0;
  state.B.y = 0;
  void live;
  return state;
}

export function setHeight(state, h) {
  state.layout = "earth";
  state.scenario = state.h && Number(h) > 0 ? "earth-altitude" : "earth-surface";
  state.h = Math.max(0, Number(h) || 0);
  return setSeparation(state, EARTH_RADIUS + state.h);
}

export function scaleMass(state, which, factor) {
  if (which === "m1" || which === "both") state.m1 = clampMass(state.m1 * factor);
  if (which === "m2" || which === "both") state.m2 = clampMass(state.m2 * factor);
  return state;
}

export function scaleDistance(state, factor) {
  return setSeparation(state, pair(state).r * factor);
}

export function historySeries(state) {
  return state.history.map((sample) => ({ ...sample }));
}

export function sampleHistory(state, t) {
  const history = state.history;
  if (!history.length) return sampleFrom({ ...state, time: t });
  if (t <= history[0].time) return history[0];
  const last = history[history.length - 1];
  if (t >= last.time) return last;
  for (let i = 1; i < history.length; i += 1) {
    if (history[i].time >= t) return history[i - 1];
  }
  return last;
}

export function predictedForce({ m1, m2, r }) {
  return gravitationalForceMagnitude(m1, m2, r);
}

function randInt(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function generateChallenge(rng = Math.random) {
  const roll = rng();
  if (roll < 0.25) {
    const m1 = 2;
    const m2 = 3;
    const r = 4;
    const Fg = gravitationalForceMagnitude(m1, m2, r);
    return {
      type: "find-F",
      prompt: "Two masses sit a known distance apart. Find the gravitational force magnitude.",
      givens: [
        { label: "m1", value: formatUnsigned(m1, "kg", 0) },
        { label: "m2", value: formatUnsigned(m2, "kg", 0) },
        { label: "r", value: formatUnsigned(r, "m", 0) },
      ],
      params: { scenario: "custom", m1, m2, r, layout: "line" },
      targets: { Fg },
      unknownLabel: "Fg",
      goalLabel: formatCompact(Fg, "N"),
      solutionHint: `Fg = G m1 m2 / r² = (${G})(2)(3)/16 = ${formatCompact(Fg, "N")}.`,
    };
  }
  if (roll < 0.5) {
    return {
      type: "double-r",
      prompt: "If the center-to-center separation doubles and the masses stay the same, what fraction of the original force remains?",
      givens: [
        { label: "Change", value: "r → 2r" },
      ],
      params: { scenario: "basic" },
      targets: { ratio: 0.25 },
      unknownLabel: "F_new / F_old",
      goalLabel: "1/4",
      solutionHint: "Fg ∝ 1/r², so doubling r multiplies force by 1/4.",
    };
  }
  if (roll < 0.75) {
    const g = earthSurfaceG();
    return {
      type: "earth-g",
      prompt: "A test mass sits at Earth’s mean radius in the spherical model. What is g?",
      givens: [
        { label: "M_E", value: formatCompact(EARTH_MASS, "kg") },
        { label: "R_E", value: formatCompact(EARTH_RADIUS, "m") },
      ],
      params: { scenario: "earth-surface" },
      targets: { g },
      unknownLabel: "g",
      goalLabel: "about 9.8 m/s²",
      solutionHint: `g = G M_E / R_E² ≈ ${g.toFixed(2)} m/s². It does not depend on the test mass.`,
    };
  }
  return {
    type: "unequal-a",
    prompt: "1000 kg and 5000 kg attract each other. Which object has the greater gravitational force, and which has the greater acceleration?",
    givens: [
      { label: "m1", value: "1000 kg" },
      { label: "m2", value: "5000 kg" },
      { label: "r", value: "10 m" },
    ],
    params: { scenario: "unequal" },
    targets: { Fg: gravitationalForceMagnitude(1000, 5000, 10) },
    unknownLabel: "force pair and accelerations",
    goalLabel: "equal forces; larger a on 1000 kg",
    solutionHint: "The force magnitudes are equal (third law). a = F/m, so the smaller mass has the larger acceleration.",
  };
}

export function challengeTolerance(value) {
  return Math.max(1e-16, 0.06 * Math.abs(value || 1));
}

export function evaluateChallenge(measured, spec) {
  if (spec.type === "double-r") {
    return { ok: true, note: "ratio" };
  }
  if (spec.type === "earth-g") {
    const g = measured.g ?? 0;
    return { ok: Math.abs(g - spec.targets.g) <= 0.15, g };
  }
  if (spec.type === "unequal-a") {
    const equal = Math.abs(Math.abs(measured.FA) - Math.abs(measured.FB)) <= challengeTolerance(measured.Fg);
    return { ok: equal && Math.abs(measured.aA) > Math.abs(measured.aB), FA: measured.FA, aA: measured.aA };
  }
  const Fg = measured.Fg ?? 0;
  return { ok: Math.abs(Fg - spec.targets.Fg) <= challengeTolerance(spec.targets.Fg), Fg };
}

export function teacherReport(state) {
  const snap = snapshot(state);
  const warp = motionWarp(state);
  return (
    `Fg = ${formatCompact(snap.Fg, "N")} · r = ${formatCompact(snap.r, "m")} · ` +
    `|FA| = |FB| = ${formatCompact(Math.abs(snap.FA), "N")} · ` +
    `a_A = ${formatCompact(snap.aA, "m/s²")} · a_B = ${formatCompact(snap.aB, "m/s²")} · ` +
    `g_source = ${formatCompact(snap.g, "m/s²")} · motion ×${warp.toExponential(2)}. ` +
    `Forces use real G; playback is sped up so the attraction is visible.`
  );
}

export function cameraObjectCount() {
  return 2;
}

export function forceRatio(before, after) {
  if (!before) return NaN;
  return after / before;
}
