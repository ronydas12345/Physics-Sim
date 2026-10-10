/**
 * Kinetic and static friction for Simulation 2.7.
 * Horizontal surface: N = mg. Static friction balances up to μs N. Kinetic friction is μk N opposite sliding.
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

export const G = 9.81;
export const VEL_EPSILON = 0.05;
export const ACCEL_EPSILON = 0.05;
export const FORCE_EPSILON = 0.001;
export const MASS_MIN = 0.5;
export const MASS_MAX = 50;
export const MU_MIN = 0;
export const MU_MAX = 1.5;
export const FAPP_MIN = -100;
export const FAPP_MAX = 100;
export const G_MIN = 1;
export const G_MAX = 20;

export const FAPP_TRIALS = Object.freeze([0, 5, 10, 15, 20, 24.5, 25, 30]);
export const MASS_TRIALS = Object.freeze([2, 5, 8, 10, 15]);

export const SURFACES = [
  { id: "ice", label: "Low-friction (illustrative)", muS: 0.1, muK: 0.05 },
  { id: "wood", label: "Wood-like (illustrative)", muS: 0.5, muK: 0.3 },
  { id: "rubber", label: "Rubber-like (illustrative)", muS: 0.9, muK: 0.7 },
  { id: "rough", label: "Rough pair (illustrative)", muS: 1.2, muK: 0.9 },
  { id: "custom", label: "Custom", muS: 0.5, muK: 0.3 },
];

export function clampMass(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 5;
  return clamp(n, MASS_MIN, MASS_MAX);
}

export function clampG(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return G;
  return clamp(n, G_MIN, G_MAX);
}

export function clampMu(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return clamp(n, MU_MIN, MU_MAX);
}

export function clampFapp(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return clamp(n, FAPP_MIN, FAPP_MAX);
}

export function weightOf(mass, g = G) {
  return clampMass(mass) * clampG(g);
}

export function normalForceOf(mass, g = G) {
  return weightOf(mass, g);
}

export function maxStaticFriction(muS, N) {
  return clampMu(muS) * Math.max(0, Number(N) || 0);
}

export function kineticFrictionOf(muK, N) {
  return clampMu(muK) * Math.max(0, Number(N) || 0);
}

export function surfaceById(id) {
  return SURFACES.find((s) => s.id === id) || SURFACES[1];
}

export function surfaceIdFor(muS, muK) {
  const match = SURFACES.find((s) => s.id !== "custom" && Math.abs(s.muS - muS) < 1e-9 && Math.abs(s.muK - muK) < 1e-9);
  return match ? match.id : "custom";
}

export const SCENARIOS = [
  { id: "rest", label: "No applied force", mass: 5, Fapp: 0, vx0: 0, muS: 0.5, muK: 0.3, g: G },
  { id: "below", label: "Below threshold", mass: 5, Fapp: 10, vx0: 0, muS: 0.5, muK: 0.3, g: G },
  { id: "near", label: "Near threshold", mass: 5, Fapp: 24.5, vx0: 0, muS: 0.5, muK: 0.3, g: G },
  { id: "sliding", label: "Sliding", mass: 5, Fapp: 30, vx0: 0, muS: 0.5, muK: 0.3, g: G },
  { id: "coast", label: "Constant-speed sliding", mass: 5, Fapp: 14.715, vx0: 2, muS: 0.5, muK: 0.3, g: G },
  { id: "decel", label: "Decelerating", mass: 5, Fapp: 0, vx0: 2, muS: 0.5, muK: 0.3, g: G },
  { id: "leftward", label: "Leftward motion", mass: 5, Fapp: -30, vx0: 0, muS: 0.5, muK: 0.3, g: G },
  { id: "custom", label: "Custom", mass: 5, Fapp: 0, vx0: 0, muS: 0.5, muK: 0.3, g: G },
];

export function scenarioById(id) {
  return SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
}

export function motionLabel({ sliding, vx, ax, atLimit }) {
  if (atLimit && !sliding) return "At Threshold";
  if (!sliding && Math.abs(vx) < VEL_EPSILON) return "Stationary";
  if (Math.abs(ax) < ACCEL_EPSILON) return Math.abs(vx) < VEL_EPSILON ? "Stationary" : "Constant Velocity";
  if (vx * ax < 0) return "Slowing Down";
  return "Sliding";
}

export function evaluateFriction({ mass, g, muS, muK, Fapp, vx, sliding }) {
  const m = Math.max(clampMass(mass), 1e-9);
  const grav = clampG(g);
  const N = normalForceOf(m, grav);
  const W = N;
  const fsMax = maxStaticFriction(muS, N);
  const fk = kineticFrictionOf(muK, N);
  const F = Number(Fapp) || 0;
  const v = Number(vx) || 0;
  const moving = Math.abs(v) >= VEL_EPSILON;
  const unusual = clampMu(muK) > clampMu(muS) + 1e-12;

  if (!moving && !sliding) {
    const required = Math.abs(F);
    if (required <= fsMax + 1e-12) {
      const fSigned = required < FORCE_EPSILON ? 0 : -Math.sign(F) * required;
      return {
        mass: m,
        g: grav,
        N,
        W,
        fsMax,
        fk,
        Fapp: F,
        friction: fSigned,
        frictionMag: Math.abs(fSigned),
        kind: "static",
        sliding: false,
        atLimit: Math.abs(required - fsMax) <= 0.05 && required > FORCE_EPSILON,
        Fnet: 0,
        ax: 0,
        vx: 0,
        unusual,
      };
    }
    const dir = Math.sign(F) || 1;
    const fSigned = -dir * fk;
    const Fnet = F + fSigned;
    return {
      mass: m,
      g: grav,
      N,
      W,
      fsMax,
      fk,
      Fapp: F,
      friction: fSigned,
      frictionMag: fk,
      kind: "kinetic",
      sliding: true,
      atLimit: false,
      Fnet,
      ax: Fnet / m,
      vx: v,
      unusual,
    };
  }

  const dir = moving ? Math.sign(v) : Math.sign(F) || 1;
  const fSigned = -dir * fk;
  const Fnet = F + fSigned;
  return {
    mass: m,
    g: grav,
    N,
    W,
    fsMax,
    fk,
    Fapp: F,
    friction: fSigned,
    frictionMag: fk,
    kind: "kinetic",
    sliding: true,
    atLimit: false,
    Fnet,
    ax: Fnet / m,
    vx: v,
    unusual,
  };
}

function recordSample(state) {
  const live = evaluateFriction(state);
  const sample = {
    time: state.time,
    x: state.x,
    vx: state.vx,
    ax: live.ax,
    Fapp: state.Fapp,
    friction: live.friction,
    frictionMag: live.frictionMag,
    Fnet: live.Fnet,
    N: live.N,
    fsMax: live.fsMax,
    fk: live.fk,
    sliding: live.sliding,
    kind: live.kind,
  };
  const last = state.history[state.history.length - 1];
  if (last && Math.abs(last.time - sample.time) < DT * 0.5) Object.assign(last, sample);
  else state.history.push(sample);
}

export function createState(raw = {}) {
  const scenario = scenarioById(raw.scenario || raw.id);
  const mass = clampMass(raw.mass ?? scenario.mass);
  const g = clampG(raw.g ?? scenario.g ?? G);
  const muS = clampMu(raw.muS ?? scenario.muS);
  const muK = clampMu(raw.muK ?? scenario.muK);
  const Fapp = clampFapp(raw.Fapp ?? scenario.Fapp);
  const vx0 = Number.isFinite(Number(raw.vx0)) ? Number(raw.vx0) : scenario.vx0;
  const x0 = Number.isFinite(Number(raw.x0)) ? Number(raw.x0) : -8;
  const sliding0 = Math.abs(vx0) >= VEL_EPSILON;
  const state = {
    scenario: scenario.id,
    mass,
    g,
    muS,
    muK,
    Fapp,
    x0,
    vx0,
    x: Number.isFinite(Number(raw.x)) ? Number(raw.x) : x0,
    vx: vx0,
    ax: 0,
    sliding: sliding0,
    duration: clamp(Number(raw.duration) || 10, DURATION_MIN, DURATION_MAX),
    time: 0,
    showVectors: raw.showVectors !== false,
    showVelocity: raw.showVelocity !== false,
    showAccel: raw.showAccel !== false,
    showNet: raw.showNet !== false,
    planetId: raw.planetId || "earth",
    backgroundsOn: raw.backgroundsOn !== false,
    history: [],
  };
  const live = evaluateFriction(state);
  state.sliding = live.sliding;
  state.ax = live.ax;
  if (!live.sliding) state.vx = 0;
  recordSample(state);
  return state;
}

export function liveState(state) {
  const live = evaluateFriction(state);
  const vx = live.sliding ? state.vx : 0;
  const label = motionLabel({ sliding: live.sliding, vx, ax: live.ax, atLimit: live.atLimit });
  return {
    ...live,
    x: state.x,
    vx,
    time: state.time,
    scenario: state.scenario,
    muS: state.muS,
    muK: state.muK,
    surface: surfaceIdFor(state.muS, state.muK),
    motion: label,
    dx: state.x - state.x0,
  };
}

export function snapshot(state) {
  const live = liveState(state);
  return {
    time: state.time,
    scenario: state.scenario,
    mass: state.mass,
    g: state.g,
    muS: state.muS,
    muK: state.muK,
    Fapp: state.Fapp,
    N: live.N,
    W: live.W,
    fsMax: live.fsMax,
    fk: live.fk,
    friction: live.friction,
    frictionMag: live.frictionMag,
    kind: live.kind,
    sliding: live.sliding,
    atLimit: live.atLimit,
    Fnet: live.Fnet,
    ax: live.ax,
    vx: live.vx,
    x: live.x,
    dx: live.dx,
    motion: live.motion,
    unusual: live.unusual,
    surface: live.surface,
  };
}

export function reset(state) {
  return createState({
    scenario: state.scenario,
    mass: state.mass,
    g: state.g,
    muS: state.muS,
    muK: state.muK,
    Fapp: state.Fapp,
    x0: state.x0,
    vx0: state.vx0,
    duration: state.duration,
    showVectors: state.showVectors,
    showVelocity: state.showVelocity,
    showAccel: state.showAccel,
    showNet: state.showNet,
    planetId: state.planetId,
    backgroundsOn: state.backgroundsOn,
  });
}

export function stepTo(state, targetTime) {
  const goal = clamp(targetTime, 0, state.duration);
  if (goal + 1e-12 < state.time) return state;
  while (state.time + 1e-12 < goal) {
    const dt = Math.min(DT, goal - state.time);
    const now = evaluateFriction(state);
    if (!now.sliding) {
      state.vx = 0;
      state.ax = 0;
      state.sliding = false;
      state.time += dt;
      recordSample(state);
      continue;
    }
    const vx0 = state.vx;
    const ax = now.ax;
    let vx = vx0 + ax * dt;
    let x = state.x + vx0 * dt + 0.5 * ax * dt * dt;
    if (Math.abs(vx0) >= VEL_EPSILON && vx * vx0 <= 0 && ax * vx0 < 0) {
      const tStop = Math.abs(ax) > 1e-12 ? -vx0 / ax : 0;
      if (tStop >= 0 && tStop <= dt) {
        x = state.x + vx0 * tStop + 0.5 * ax * tStop * tStop;
        state.x = x;
        state.vx = 0;
        state.ax = 0;
        state.sliding = false;
        const rest = evaluateFriction(state);
        if (rest.sliding) {
          state.sliding = true;
          state.ax = rest.ax;
          const left = dt - tStop;
          state.vx = rest.ax * left;
          state.x += 0.5 * rest.ax * left * left;
        }
        state.time += dt;
        recordSample(state);
        continue;
      }
    }
    if (Math.abs(vx0) >= VEL_EPSILON && Math.abs(vx) < VEL_EPSILON && ax * vx0 <= 0) {
      state.x = x;
      state.vx = 0;
      state.ax = 0;
      state.sliding = false;
    } else {
      state.x = x;
      state.vx = vx;
      state.ax = ax;
      state.sliding = true;
    }
    state.time += dt;
    recordSample(state);
  }
  return state;
}

export function setMass(state, mass) {
  state.mass = clampMass(mass);
  return state;
}

export function setFapp(state, F) {
  state.Fapp = clampFapp(F);
  return state;
}

export function setMu(state, muS, muK) {
  if (muS != null) state.muS = clampMu(muS);
  if (muK != null) state.muK = clampMu(muK);
  return state;
}

export function setGravity(state, g) {
  state.g = clampG(g);
  return state;
}

export function setInitial(state, { x0, vx0 } = {}) {
  if (x0 != null) {
    state.x0 = Number(x0) || 0;
    state.x = state.x0;
  }
  if (vx0 != null) {
    state.vx0 = Number(vx0) || 0;
    state.vx = state.vx0;
    state.sliding = Math.abs(state.vx0) >= VEL_EPSILON;
  }
  return state;
}

export function historySeries(state) {
  return state.history.map((sample) => ({ ...sample }));
}

export function sampleHistory(state, t) {
  const history = state.history;
  if (!history.length) return { time: t, x: state.x, vx: state.vx, ax: state.ax, Fnet: 0 };
  if (t <= history[0].time) return history[0];
  const last = history[history.length - 1];
  if (t >= last.time) return last;
  for (let i = 1; i < history.length; i += 1) {
    if (history[i].time >= t) return history[i - 1];
  }
  return last;
}

function randInt(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function generateChallenge(rng = Math.random) {
  const roll = rng();
  if (roll < 0.25) {
    const m = 5;
    const muS = 0.5;
    const N = m * G;
    const fsMax = muS * N;
    return {
      type: "fsmax",
      prompt: "A 5 kg block rests on a horizontal surface with μs = 0.50. Find the maximum static friction.",
      givens: [
        { label: "m", value: formatUnsigned(m, "kg") },
        { label: "μs", value: "0.50" },
        { label: "g", value: formatUnsigned(G, "m/s²") },
      ],
      params: { scenario: "rest", mass: m, muS, muK: 0.3, Fapp: 0 },
      targets: { fsMax },
      unknownLabel: "fs,max",
      goalLabel: formatUnsigned(fsMax, "N"),
      solutionHint: `N = mg = 5 × 9.81 = 49.05 N. fs,max = μs N = 0.50 × 49.05 = ${formatUnsigned(fsMax, "N")}. That is the limit, not the friction at every rest.`,
    };
  }
  if (roll < 0.5) {
    return {
      type: "will-slide",
      prompt: "A 6 kg block has μs = 0.40. Does a 15 N applied force start it sliding?",
      givens: [
        { label: "m", value: "6 kg" },
        { label: "μs", value: "0.40" },
        { label: "F_app", value: "15 N" },
      ],
      params: { scenario: "custom", mass: 6, muS: 0.4, muK: 0.25, Fapp: 15, vx0: 0 },
      targets: { sliding: false, fsMax: 0.4 * 6 * G },
      unknownLabel: "motion",
      goalLabel: "remains stationary",
      solutionHint: `N = 58.86 N. fs,max = 23.544 N. 15 N < 23.544 N, so static friction balances and the block stays at rest.`,
    };
  }
  if (roll < 0.75) {
    const m = 5;
    const F = 30;
    const fk = 0.3 * m * G;
    const a = (F - fk) / m;
    return {
      type: "find-a",
      prompt: "The 5 kg block is sliding under a 30 N applied force with μk = 0.30. Find the acceleration.",
      givens: [
        { label: "m", value: "5 kg" },
        { label: "F_app", value: "30 N" },
        { label: "μk", value: "0.30" },
      ],
      params: { scenario: "sliding" },
      targets: { ax: a, fk },
      unknownLabel: "a",
      goalLabel: formatSigned(a, "m/s²"),
      solutionHint: `fk = 0.30 × 49.05 = 14.715 N. a = (30 − 14.715)/5 = ${formatSigned(a, "m/s²")}. Use kinetic friction, not fs,max.`,
    };
  }
  return {
    type: "actual-vs-max",
    prompt: "A stationary 5 kg block has F_app = 10 N and μs = 0.50. What is the actual static friction?",
    givens: [
      { label: "F_app", value: "10 N" },
      { label: "μs", value: "0.50" },
    ],
    params: { scenario: "below" },
    targets: { frictionMag: 10, sliding: false },
    unknownLabel: "actual fs",
    goalLabel: "10 N (not 24.525 N)",
    solutionHint: "Static friction equals the 10 N it must balance. fs,max = 24.525 N is only the ceiling.",
  };
}

export function challengeTolerance(value) {
  return Math.max(0.08, 0.04 * Math.abs(value || 1));
}

export function evaluateChallenge(measured, spec) {
  if (spec.type === "will-slide") {
    return { ok: measured.sliding === false && measured.frictionMag <= spec.targets.fsMax + 0.2, sliding: measured.sliding };
  }
  if (spec.type === "actual-vs-max") {
    return { ok: Math.abs(measured.frictionMag - 10) <= 0.2 && measured.sliding === false, frictionMag: measured.frictionMag };
  }
  if (spec.type === "find-a") {
    return { ok: Math.abs((measured.ax ?? 0) - spec.targets.ax) <= challengeTolerance(spec.targets.ax), ax: measured.ax };
  }
  return { ok: Math.abs((measured.fsMax ?? 0) - spec.targets.fsMax) <= challengeTolerance(spec.targets.fsMax), fsMax: measured.fsMax };
}

export function teacherReport(state) {
  const snap = snapshot(state);
  return (
    `${snap.motion} · ${snap.kind} f = ${formatSigned(snap.friction, "N")} · ` +
    `fs,max = ${formatUnsigned(snap.fsMax, "N")} · fk = ${formatUnsigned(snap.fk, "N")} · ` +
    `F_net = ${formatSigned(snap.Fnet, "N")} · a = ${formatSigned(snap.ax, "m/s²")} · ` +
    `v = ${formatSigned(snap.vx, "m/s")}. Static friction is not always μs N.`
  );
}

export function cameraObjectCount() {
  return 1;
}

export function predictedFsMax({ mass, g = G, muS }) {
  return maxStaticFriction(muS, normalForceOf(mass, g));
}

export function predictedFk({ mass, g = G, muK }) {
  return kineticFrictionOf(muK, normalForceOf(mass, g));
}
