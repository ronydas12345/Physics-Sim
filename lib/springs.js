/**
 * Spring forces for Simulation 2.8.
 * Horizontal ideal spring: Fs = -kx. Position mode holds x. Motion mode integrates Fnet = -kx + Fapp.
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

export const G = 9.8;
export const FORCE_EPSILON = 0.001;
export const VEL_EPSILON = 0.02;
export const ACCEL_EPSILON = 0.05;
export const MASS_MIN = 0.5;
export const MASS_MAX = 20;
export const K_MIN = 1;
export const K_MAX = 200;
export const X_MIN = -0.5;
export const X_MAX = 0.5;
export const FAPP_MIN = -50;
export const FAPP_MAX = 50;
export const V_MIN = -5;
export const V_MAX = 5;

export const X_TRIALS = Object.freeze([-0.2, -0.1, 0, 0.1, 0.2]);
export const K_TRIALS = Object.freeze([10, 20, 40, 80]);
export const MASS_TRIALS = Object.freeze([0.5, 1, 2, 4, 8]);

export function clampMass(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return clamp(n, MASS_MIN, MASS_MAX);
}

export function clampK(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 20;
  return clamp(n, K_MIN, K_MAX);
}

export function clampX(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return clamp(n, X_MIN, X_MAX);
}

export function clampFapp(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return clamp(n, FAPP_MIN, FAPP_MAX);
}

export function clampVel(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return clamp(n, V_MIN, V_MAX);
}

export function springForce(k, x) {
  return -clampK(k) * (Number(x) || 0);
}

export function springEnergy(k, x) {
  const d = Number(x) || 0;
  return 0.5 * clampK(k) * d * d;
}

export function kineticEnergy(mass, vx) {
  const v = Number(vx) || 0;
  return 0.5 * Math.max(clampMass(mass), 1e-9) * v * v;
}

export function periodOf(mass, k) {
  return 2 * Math.PI * Math.sqrt(Math.max(clampMass(mass), 1e-9) / clampK(k));
}

export function omegaOf(mass, k) {
  return Math.sqrt(clampK(k) / Math.max(clampMass(mass), 1e-9));
}

export function equilibriumX(Fapp, k) {
  return clampFapp(Fapp) / clampK(k);
}

export const SCENARIOS = [
  { id: "equilibrium", label: "Equilibrium", mass: 1, k: 20, x0: 0, vx0: 0, Fapp: 0, held: true },
  { id: "stretch", label: "Stretch +0.10 m", mass: 1, k: 20, x0: 0.1, vx0: 0, Fapp: 0, held: true },
  { id: "compress", label: "Compress −0.10 m", mass: 1, k: 20, x0: -0.1, vx0: 0, Fapp: 0, held: true },
  { id: "double-x", label: "Double displacement", mass: 1, k: 20, x0: 0.2, vx0: 0, Fapp: 0, held: true },
  { id: "double-k", label: "Double k", mass: 1, k: 40, x0: 0.1, vx0: 0, Fapp: 0, held: true },
  { id: "double-both", label: "Double both", mass: 1, k: 40, x0: 0.2, vx0: 0, Fapp: 0, held: true },
  { id: "heavy", label: "Larger mass", mass: 4, k: 20, x0: 0.1, vx0: 0, Fapp: 0, held: true },
  { id: "shifted", label: "Shifted equilibrium", mass: 1, k: 20, x0: 0.2, vx0: 0, Fapp: 4, held: true },
  { id: "oscillate", label: "Oscillation", mass: 1, k: 20, x0: 0.1, vx0: 0, Fapp: 0, held: false },
  { id: "custom", label: "Custom", mass: 1, k: 20, x0: 0.1, vx0: 0, Fapp: 0, held: true },
];

export function scenarioById(id) {
  return SCENARIOS.find((s) => s.id === id) || SCENARIOS[1];
}

export function motionLabel({ held, vx, ax, x, Fapp }) {
  if (held) return "Held";
  if (Math.abs(ax) < ACCEL_EPSILON && Math.abs(vx) < VEL_EPSILON) return "At Rest";
  if (Math.abs(x) < 0.005 && Math.abs(Fapp) < FORCE_EPSILON && Math.abs(vx) >= VEL_EPSILON) return "Through Equilibrium";
  if (vx * ax < 0) return "Slowing";
  if (vx * ax > 0) return "Speeding Up";
  return "Oscillating";
}

export function evaluateSpring({ mass, k, x, vx, Fapp, held }) {
  const m = Math.max(clampMass(mass), 1e-9);
  const stiff = clampK(k);
  const F = clampFapp(Fapp);
  const pos = Number(x) || 0;
  const v = Number(vx) || 0;
  const Fs = -stiff * pos;
  const Ffree = Fs + F;
  const aFree = Ffree / m;
  const Us = 0.5 * stiff * pos * pos;
  const K = 0.5 * m * v * v;
  const xEq = F / stiff;
  if (held) {
    return {
      mass: m,
      k: stiff,
      x: pos,
      vx: 0,
      Fapp: F,
      Fs,
      FsMag: Math.abs(Fs),
      Fnet: 0,
      Ffree,
      holding: -Ffree,
      ax: 0,
      aFree,
      Us,
      K: 0,
      E: Us,
      xEq,
      held: true,
      T: periodOf(m, stiff),
      omega: omegaOf(m, stiff),
    };
  }
  return {
    mass: m,
    k: stiff,
    x: pos,
    vx: v,
    Fapp: F,
    Fs,
    FsMag: Math.abs(Fs),
    Fnet: Ffree,
    Ffree,
    holding: 0,
    ax: aFree,
    aFree,
    Us,
    K,
    E: Us + K,
    xEq,
    held: false,
    T: periodOf(m, stiff),
    omega: omegaOf(m, stiff),
  };
}

function recordSample(state) {
  const live = evaluateSpring(state);
  const sample = {
    time: state.time,
    x: state.x,
    vx: live.vx,
    ax: live.ax,
    Fs: live.Fs,
    FsMag: live.FsMag,
    xAbs: Math.abs(state.x),
    Fapp: state.Fapp,
    Fnet: live.Fnet,
    Ffree: live.Ffree,
    Us: live.Us,
    K: live.K,
    E: live.E,
    held: live.held,
  };
  const last = state.history[state.history.length - 1];
  if (last && Math.abs(last.time - sample.time) < DT * 0.5) Object.assign(last, sample);
  else state.history.push(sample);
}

export function createState(raw = {}) {
  const scenario = scenarioById(raw.scenario || raw.id);
  const mass = clampMass(raw.mass ?? scenario.mass);
  const k = clampK(raw.k ?? scenario.k);
  const x0 = Number.isFinite(Number(raw.x0)) ? Number(raw.x0) : scenario.x0;
  const vx0 = clampVel(raw.vx0 ?? scenario.vx0);
  const Fapp = clampFapp(raw.Fapp ?? scenario.Fapp);
  const held = raw.held != null ? Boolean(raw.held) : scenario.held;
  const state = {
    scenario: scenario.id,
    mass,
    k,
    Fapp,
    x0,
    vx0,
    x: Number.isFinite(Number(raw.x)) ? Number(raw.x) : x0,
    vx: held ? 0 : vx0,
    ax: 0,
    held,
    duration: clamp(Number(raw.duration) || 10, DURATION_MIN, DURATION_MAX),
    time: 0,
    showVectors: raw.showVectors !== false,
    showVelocity: raw.showVelocity !== false,
    showAccel: raw.showAccel !== false,
    showNet: raw.showNet !== false,
    showEnergy: raw.showEnergy !== false,
    history: [],
  };
  const live = evaluateSpring(state);
  state.ax = live.ax;
  if (held) state.vx = 0;
  recordSample(state);
  return state;
}

export function liveState(state) {
  const live = evaluateSpring(state);
  const label = motionLabel({
    held: live.held,
    vx: live.vx,
    ax: live.aFree,
    x: live.x,
    Fapp: live.Fapp,
  });
  return {
    ...live,
    time: state.time,
    scenario: state.scenario,
    motion: label,
    W: live.mass * G,
    N: live.mass * G,
  };
}

export function snapshot(state) {
  const live = liveState(state);
  return {
    time: state.time,
    scenario: state.scenario,
    mass: state.mass,
    k: state.k,
    x: live.x,
    vx: live.vx,
    ax: live.ax,
    aFree: live.aFree,
    Fs: live.Fs,
    FsMag: live.FsMag,
    Fapp: live.Fapp,
    Fnet: live.Fnet,
    Ffree: live.Ffree,
    holding: live.holding,
    Us: live.Us,
    K: live.K,
    E: live.E,
    xEq: live.xEq,
    T: live.T,
    omega: live.omega,
    held: live.held,
    motion: live.motion,
    x0: state.x0,
    vx0: state.vx0,
  };
}

export function reset(state) {
  return createState({
    scenario: state.scenario,
    mass: state.mass,
    k: state.k,
    Fapp: state.Fapp,
    x0: state.x0,
    vx0: state.vx0,
    held: state.held,
    duration: state.duration,
    showVectors: state.showVectors,
    showVelocity: state.showVelocity,
    showAccel: state.showAccel,
    showNet: state.showNet,
    showEnergy: state.showEnergy,
  });
}

export function stepTo(state, targetTime) {
  const goal = clamp(targetTime, 0, state.duration);
  if (goal + 1e-12 < state.time) return state;
  while (state.time + 1e-12 < goal) {
    const dt = Math.min(DT, goal - state.time);
    if (state.held) {
      state.vx = 0;
      state.ax = 0;
      state.time += dt;
      recordSample(state);
      continue;
    }
    const now = evaluateSpring(state);
    const ax0 = now.ax;
    const x1 = state.x + state.vx * dt + 0.5 * ax0 * dt * dt;
    const ax1 = evaluateSpring({ ...state, x: x1 }).ax;
    const vx1 = state.vx + 0.5 * (ax0 + ax1) * dt;
    state.x = x1;
    state.vx = vx1;
    state.ax = ax1;
    state.time += dt;
    recordSample(state);
  }
  return state;
}

export function setMass(state, mass) {
  state.mass = clampMass(mass);
  return state;
}

export function setK(state, k) {
  state.k = clampK(k);
  return state;
}

export function setX(state, x) {
  const next = Number(x);
  if (!Number.isFinite(next)) return state;
  state.x = next;
  if (state.held) {
    state.x0 = next;
    state.vx = 0;
  }
  return state;
}

export function setFapp(state, F) {
  state.Fapp = clampFapp(F);
  return state;
}

export function setHeld(state, held) {
  const next = Boolean(held);
  if (next && !state.held) {
    state.x0 = state.x;
    state.vx = 0;
  }
  if (!next && state.held) {
    state.x0 = state.x;
    state.vx = state.vx0;
  }
  state.held = next;
  return state;
}

export function setInitial(state, { x0, vx0 } = {}) {
  if (x0 != null) {
    const next = Number(x0);
    if (Number.isFinite(next)) {
      state.x0 = next;
      if (state.held || state.time < 1e-12) state.x = next;
    }
  }
  if (vx0 != null) {
    state.vx0 = clampVel(vx0);
    if (!state.held && state.time < 1e-12) state.vx = state.vx0;
  }
  return state;
}

export function historySeries(state) {
  return state.history.map((sample) => ({ ...sample }));
}

export function sampleHistory(state, t) {
  const history = state.history;
  if (!history.length) return { time: t, x: state.x, vx: state.vx, ax: state.ax, Fs: 0 };
  if (t <= history[0].time) return history[0];
  const last = history[history.length - 1];
  if (t >= last.time) return last;
  for (let i = 1; i < history.length; i += 1) {
    if (history[i].time >= t) return history[i - 1];
  }
  return last;
}

export function generateChallenge(rng = Math.random) {
  const roll = rng();
  if (roll < 0.25) {
    return {
      type: "find-fs",
      prompt: "An ideal spring has k = 20 N/m and x = +0.10 m. Find the spring force.",
      givens: [
        { label: "k", value: "20 N/m" },
        { label: "x", value: "+0.10 m" },
      ],
      params: { scenario: "stretch", mass: 1, k: 20, x0: 0.1, Fapp: 0, held: true },
      targets: { Fs: -2 },
      unknownLabel: "Fs",
      goalLabel: formatSigned(-2, "N"),
      solutionHint: "Fs = −kx = −(20)(+0.10) = −2.0 N. The force points left, opposite the displacement.",
    };
  }
  if (roll < 0.5) {
    return {
      type: "find-a",
      prompt: "A 4 kg block is held at x = +0.10 m on a 20 N/m spring. What is a if it is released with F_app = 0?",
      givens: [
        { label: "m", value: "4 kg" },
        { label: "k", value: "20 N/m" },
        { label: "x", value: "+0.10 m" },
      ],
      params: { scenario: "heavy", mass: 4, k: 20, x0: 0.1, Fapp: 0, held: true },
      targets: { aFree: -0.5, Fs: -2 },
      unknownLabel: "a (if released)",
      goalLabel: formatSigned(-0.5, "m/s²"),
      solutionHint: "Fs is still −2.0 N because k and x did not change. a = Fs/m = −2.0/4 = −0.50 m/s².",
    };
  }
  if (roll < 0.75) {
    return {
      type: "xeq",
      prompt: "A 20 N/m spring has a constant F_app = +4 N. Where is the net-force equilibrium?",
      givens: [
        { label: "k", value: "20 N/m" },
        { label: "F_app", value: "+4 N" },
      ],
      params: { scenario: "shifted", mass: 1, k: 20, x0: 0.2, Fapp: 4, held: true },
      targets: { xEq: 0.2, Fnet: 0 },
      unknownLabel: "x_eq",
      goalLabel: formatSigned(0.2, "m"),
      solutionHint: "−k x_eq + F_app = 0, so x_eq = F_app/k = 4/20 = +0.20 m. Fs is −4 N there, not zero.",
    };
  }
  return {
    type: "combined",
    prompt: "m = 2.0 kg, k = 30 N/m, x = −0.15 m, F_app = +2.0 N. Find the initial acceleration if released.",
    givens: [
      { label: "m", value: "2.0 kg" },
      { label: "k", value: "30 N/m" },
      { label: "x", value: "−0.15 m" },
      { label: "F_app", value: "+2.0 N" },
    ],
    params: { scenario: "custom", mass: 2, k: 30, x0: -0.15, Fapp: 2, held: true },
    targets: { Fs: 4.5, Ffree: 6.5, aFree: 3.25 },
    unknownLabel: "a",
    goalLabel: formatSigned(3.25, "m/s²"),
    solutionHint: "Fs = −(30)(−0.15) = +4.5 N. F_net = 4.5 + 2.0 = +6.5 N. a = 6.5/2 = +3.25 m/s², to the right.",
  };
}

export function challengeTolerance(value) {
  return Math.max(0.06, 0.04 * Math.abs(value || 1));
}

export function evaluateChallenge(measured, spec) {
  if (spec.type === "find-fs") {
    return { ok: Math.abs((measured.Fs ?? 0) - spec.targets.Fs) <= challengeTolerance(spec.targets.Fs), Fs: measured.Fs };
  }
  if (spec.type === "find-a") {
    const a = measured.held ? measured.aFree : measured.ax;
    return { ok: Math.abs((a ?? 0) - spec.targets.aFree) <= challengeTolerance(spec.targets.aFree), a };
  }
  if (spec.type === "xeq") {
    return { ok: Math.abs((measured.xEq ?? 0) - spec.targets.xEq) <= 0.02, xEq: measured.xEq };
  }
  const a = measured.held ? measured.aFree : measured.ax;
  return { ok: Math.abs((a ?? 0) - spec.targets.aFree) <= challengeTolerance(spec.targets.aFree), a };
}

export function teacherReport(state) {
  const snap = snapshot(state);
  return (
    `${snap.motion} · Fs = ${formatSigned(snap.Fs, "N")} · ` +
    `F_net ${snap.held ? "(if released)" : ""} = ${formatSigned(snap.Ffree, "N")} · ` +
    `a ${snap.held ? "(if released)" : ""} = ${formatSigned(snap.aFree, "m/s²")} · ` +
    `x_eq = ${formatSigned(snap.xEq, "m")} · T = ${formatUnsigned(snap.T, "s")}. Fs = −kx.`
  );
}

export function cameraObjectCount() {
  return 1;
}

export function predictedFs({ k, x }) {
  return springForce(k, x);
}

export function predictedUs({ k, x }) {
  return springEnergy(k, x);
}
