/**
 * Newton's second law for Simulation 2.5.
 * Horizontal motion: a = F_net / m. Acceleration follows net force, not velocity.
 */

import {
  CARDINALS,
  DEFAULT_G,
  DEFAULT_MASS,
  DIAGRAM_DT,
  DT,
  DURATION_MAX,
  DURATION_MIN,
  FORCE_EPSILON,
  PLAYBACK_SPEEDS,
  addForce as addForceOn,
  calculateAcceleration,
  calculateNetForce,
  clampForce,
  clampMass,
  createAppliedForce,
  createFrictionForce,
  createGravityForce,
  createNormalForce,
  directionInfo,
  enabledForces,
  formatSigned,
  formatUnsigned,
  isBalanced,
  makeForce,
  netDirection,
  removeForce as removeForceOn,
  setForce as setForceOn,
} from "./forces.js";
import { clamp } from "./kinematics1d.js";

export {
  CARDINALS,
  DEFAULT_G,
  DEFAULT_MASS,
  DIAGRAM_DT,
  DT,
  FORCE_EPSILON,
  PLAYBACK_SPEEDS,
  addForceOn,
  calculateAcceleration,
  calculateNetForce,
  clampForce,
  clampMass,
  createAppliedForce,
  createFrictionForce,
  createGravityForce,
  createNormalForce,
  directionInfo,
  enabledForces,
  formatSigned,
  formatUnsigned,
  isBalanced,
  makeForce,
  netDirection,
};

export const VEL_EPSILON = 0.05;
export const ACCEL_EPSILON = 0.05;
export const FORCE_TRIALS = Object.freeze([0, 5, 10, 15, 20, 25]);
export const MASS_TRIALS = Object.freeze([1, 2, 4, 5, 10]);
export const FORCE_SWEEP = FORCE_TRIALS;
export const MASS_SWEEP = MASS_TRIALS;

function verticalPair(mass, g = DEFAULT_G) {
  return [createGravityForce({ mass, g }), createNormalForce(mass * g)];
}

function appliedNet(F, extras = {}) {
  const mag = Math.abs(Number(F) || 0);
  if (mag < FORCE_EPSILON) return [];
  return [createAppliedForce(mag, F >= 0 ? 0 : 180, { id: "applied", name: F >= 0 ? "Applied right" : "Applied left", ...extras })];
}

export const THREE_STAGE = Object.freeze([
  { t0: 0, t1: 2, Fnetx: 10 },
  { t0: 2, t1: 4, Fnetx: 0 },
  { t0: 4, t1: 6, Fnetx: -10 },
]);

export const SCENARIOS = [
  {
    id: "basic",
    label: "Basic: F = 10 N",
    mass: 5,
    x0: -8,
    vx0: 0,
    forces: ({ mass, g }) => [...verticalPair(mass, g), ...appliedNet(10)],
  },
  {
    id: "double-force",
    label: "Double force",
    mass: 5,
    x0: -8,
    vx0: 0,
    forces: ({ mass, g }) => [...verticalPair(mass, g), ...appliedNet(20)],
  },
  {
    id: "double-mass",
    label: "Double mass",
    mass: 10,
    x0: -8,
    vx0: 0,
    forces: ({ mass, g }) => [...verticalPair(mass, g), ...appliedNet(10)],
  },
  {
    id: "zero-net",
    label: "Zero net force",
    mass: 5,
    x0: -8,
    vx0: 5,
    forces: ({ mass, g }) => [
      ...verticalPair(mass, g),
      createAppliedForce(20, 0, { id: "applied", name: "Applied right" }),
      createAppliedForce(20, 180, { id: "applied-b", name: "Applied left", source: "Opposer" }),
    ],
  },
  {
    id: "negative-net",
    label: "Negative net force",
    mass: 5,
    x0: 8,
    vx0: 0,
    forces: ({ mass, g }) => [
      ...verticalPair(mass, g),
      createAppliedForce(10, 0, { id: "applied", name: "Applied right" }),
      createAppliedForce(30, 180, { id: "applied-b", name: "Applied left", source: "Opposer" }),
    ],
  },
  {
    id: "opp-signs",
    label: "v right, a left",
    mass: 5,
    x0: -4,
    vx0: 8,
    forces: ({ mass, g }) => [...verticalPair(mass, g), ...appliedNet(-10)],
  },
  {
    id: "friction",
    label: "Friction and net force",
    mass: 5,
    x0: -8,
    vx0: 0,
    forces: ({ mass, g }) => [
      ...verticalPair(mass, g),
      createAppliedForce(30, 0, { id: "applied", name: "Applied right" }),
      createFrictionForce(10, 180, { enabled: true, autoDirection: false }),
    ],
  },
  {
    id: "three-stage",
    label: "Three-stage motion",
    mass: 5,
    x0: -8,
    vx0: 0,
    duration: 8,
    schedule: THREE_STAGE,
    forces: ({ mass, g }) => [...verticalPair(mass, g), ...appliedNet(10)],
  },
  {
    id: "custom",
    label: "Custom",
    mass: 5,
    x0: 0,
    vx0: 0,
    forces: ({ mass, g }) => verticalPair(mass, g),
  },
];

export function scenarioById(id) {
  return SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
}

export function motionLabel(vx, ax) {
  const v = Number(vx) || 0;
  const a = Number(ax) || 0;
  if (Math.abs(a) < ACCEL_EPSILON) return Math.abs(v) < VEL_EPSILON ? "At Rest" : "Constant Velocity";
  if (Math.abs(v) < VEL_EPSILON) return "Speeding Up";
  if (v * a > 0) return "Speeding Up";
  if (Math.abs(v) < 0.4) return "Changing Direction";
  return "Slowing Down";
}

function objectForces(raw, scenario, mass, g, includeVertical) {
  let list;
  if (raw.forces?.length) list = raw.forces.map((f) => makeForce(f));
  else list = scenario.forces({ mass, g }).map((f) => makeForce(f));
  if (!includeVertical) list = list.filter((f) => f.type !== "gravity" && f.type !== "normal");
  return list;
}

export function stageAt(schedule, t) {
  if (!schedule?.length) return null;
  for (const stage of schedule) {
    if (t + 1e-12 >= stage.t0 && t < stage.t1 - 1e-15) return stage;
  }
  return schedule[schedule.length - 1];
}

export function liveFromSchedule(mass, x0, vx0, schedule, t) {
  let x = x0;
  let vx = vx0;
  let ax = 0;
  let Fnetx = 0;
  const m = Math.max(clampMass(mass), 1e-9);
  for (const stage of schedule) {
    const start = Number(stage.t0) || 0;
    const end = Number(stage.t1);
    if (t <= start + 1e-15) break;
    const span = Math.min(t, end) - start;
    Fnetx = Number(stage.Fnetx) || 0;
    ax = Fnetx / m;
    x += vx * span + 0.5 * ax * span * span;
    vx += ax * span;
    if (t <= end + 1e-15) return { x, vx, ax, Fnetx };
  }
  if (t > schedule[schedule.length - 1].t1) {
    const last = schedule[schedule.length - 1];
    Fnetx = Number(last.Fnetx) || 0;
    ax = Fnetx / m;
  }
  return { x, vx, ax, Fnetx };
}

export function createState(raw = {}) {
  const scenario = scenarioById(raw.scenario || raw.id);
  const T = clamp(Number(raw.duration) || scenario.duration || 10, DURATION_MIN, DURATION_MAX);
  const g = Number.isFinite(Number(raw.g)) ? Number(raw.g) : DEFAULT_G;
  const includeVertical = raw.includeVertical !== false;
  const mass = clampMass(raw.mass ?? scenario.mass);
  const schedule = raw.schedule === null ? null : raw.schedule || scenario.schedule || null;
  const state = {
    scenario: scenario.id,
    mass,
    g,
    x0: Number.isFinite(Number(raw.x0)) ? Number(raw.x0) : scenario.x0,
    vx0: Number.isFinite(Number(raw.vx0)) ? Number(raw.vx0) : scenario.vx0,
    duration: T,
    time: 0,
    forces: objectForces(raw, scenario, mass, g, includeVertical),
    includeVertical,
    schedule: schedule ? schedule.map((s) => ({ ...s })) : null,
    showNetForce: raw.showNetForce !== false,
    showVelocity: raw.showVelocity !== false,
    showAccel: raw.showAccel !== false,
    history: [],
  };
  syncVertical(state);
  recordSample(state);
  return state;
}

function syncVertical(state) {
  if (!state.includeVertical) {
    state.forces = state.forces.filter((f) => f.type !== "gravity" && f.type !== "normal").map((f) => makeForce(f));
    return state;
  }
  const grav = state.mass * state.g;
  const hasG = state.forces.some((f) => f.type === "gravity");
  const hasN = state.forces.some((f) => f.type === "normal");
  if (!hasG) state.forces.unshift(createGravityForce({ mass: state.mass, g: state.g }));
  if (!hasN) state.forces.splice(1, 0, createNormalForce(grav));
  state.forces = state.forces.map((force) => {
    if (force.type === "gravity") return makeForce({ ...force, magnitude: grav, direction: 270 });
    if (force.type === "normal") return makeForce({ ...force, magnitude: grav, direction: 90 });
    return makeForce(force);
  });
  return state;
}

export function setIncludeVertical(state, on) {
  state.includeVertical = Boolean(on);
  if (state.includeVertical) syncVertical(state);
  else state.forces = state.forces.filter((f) => f.type !== "gravity" && f.type !== "normal").map((f) => makeForce(f));
  return state;
}

export function displayForces(state, t = state.time) {
  if (!state.schedule) return state.forces;
  const stage = stageAt(state.schedule, t);
  const F = stage ? Number(stage.Fnetx) || 0 : 0;
  const vertical = state.includeVertical ? verticalPair(state.mass, state.g) : [];
  return [...vertical, ...appliedNet(F)].map((f) => makeForce(f));
}

export function liveState(state, t = state.time) {
  if (state.schedule?.length) {
    const piece = liveFromSchedule(state.mass, state.x0, state.vx0, state.schedule, t);
    const forces = displayForces(state, t);
    const net = { x: piece.Fnetx, y: 0, magnitude: Math.abs(piece.Fnetx), direction: piece.Fnetx >= 0 ? 0 : 180 };
    return {
      x: piece.x,
      vx: piece.vx,
      ax: piece.ax,
      net,
      a: { x: piece.ax, y: 0, magnitude: Math.abs(piece.ax), direction: piece.ax >= 0 ? 0 : 180 },
      balanced: Math.abs(piece.Fnetx) < FORCE_EPSILON,
      motion: motionLabel(piece.vx, piece.ax),
      forces,
    };
  }
  const net = calculateNetForce(state.forces);
  const a = calculateAcceleration(net, state.mass);
  const ax = Math.abs(a.x) < ACCEL_EPSILON && Math.abs(net.x) < FORCE_EPSILON ? 0 : a.x;
  return {
    x: state.x0 + state.vx0 * t + 0.5 * ax * t * t,
    vx: state.vx0 + ax * t,
    ax,
    net,
    a: { ...a, x: ax },
    balanced: isBalanced(net),
    motion: motionLabel(state.vx0 + ax * t, ax),
    forces: state.forces,
  };
}

function sampleFrom(state) {
  const live = liveState(state);
  return {
    time: state.time,
    x: live.x,
    vx: live.vx,
    ax: live.ax,
    Fnetx: live.net.x,
    Fnety: live.net.y,
    Fnet: live.net.magnitude,
    mass: state.mass,
    invMass: 1 / Math.max(state.mass, 1e-9),
  };
}

function recordSample(state) {
  const sample = sampleFrom(state);
  const last = state.history[state.history.length - 1];
  if (last && Math.abs(last.time - sample.time) < DT * 0.5) {
    Object.assign(last, sample);
    return;
  }
  state.history.push(sample);
}

export function snapshot(state) {
  const live = liveState(state);
  const dir = netDirection(live.net);
  const forces = live.forces || state.forces;
  return {
    time: state.time,
    scenario: state.scenario,
    mass: state.mass,
    g: state.g,
    forces: forces.map((f) => ({ ...f })),
    enabled: enabledForces(forces),
    net: live.net,
    balanced: live.balanced,
    forceState: live.balanced ? "EQUILIBRIUM" : "NON-EQUILIBRIUM",
    motion: live.motion,
    netDir: dir,
    a: live.a,
    x: live.x,
    vx: live.vx,
    ax: live.ax,
    includeVertical: state.includeVertical,
    right: enabledForces(forces).reduce((sum, f) => sum + Math.max(0, f.x), 0),
    left: enabledForces(forces).reduce((sum, f) => sum + Math.max(0, -f.x), 0),
  };
}

export function reset(state) {
  return createState({
    scenario: state.scenario,
    mass: state.mass,
    g: state.g,
    x0: state.x0,
    vx0: state.vx0,
    duration: state.duration,
    forces: state.schedule ? undefined : state.forces,
    schedule: state.schedule,
    includeVertical: state.includeVertical,
    showNetForce: state.showNetForce,
    showVelocity: state.showVelocity,
    showAccel: state.showAccel,
  });
}

export function stepTo(state, targetTime) {
  const goal = clamp(targetTime, 0, state.duration);
  if (goal + 1e-12 < state.time) return state;
  while (state.time + 1e-12 < goal) {
    state.time += Math.min(DT, goal - state.time);
    recordSample(state);
  }
  return state;
}

export function sampleHistory(state, t) {
  const history = state.history;
  if (!history.length) return sampleFrom({ ...state, time: t });
  if (t <= history[0].time) return history[0];
  const last = history[history.length - 1];
  if (t >= last.time) return last;
  for (let i = 1; i < history.length; i += 1) {
    if (history[i].time >= t) {
      const a = history[i - 1];
      const b = history[i];
      const u = (t - a.time) / Math.max(b.time - a.time, 1e-12);
      const out = { time: t };
      for (const key of Object.keys(a)) {
        if (key === "time") continue;
        if (typeof a[key] === "number" && typeof b[key] === "number") out[key] = a[key] + (b[key] - a[key]) * u;
      }
      return out;
    }
  }
  return last;
}

export function motionDiagramSamples(state, interval = DIAGRAM_DT) {
  const dt = interval > 0 ? interval : DIAGRAM_DT;
  const dots = [];
  for (let t = 0; t <= state.time + 1e-9; t += dt) dots.push(sampleHistory(state, t));
  return dots;
}

export function historySeries(state) {
  return state.history.map((sample) => ({ ...sample }));
}

export function setMass(state, mass) {
  state.mass = clampMass(mass);
  syncVertical(state);
  return state;
}

export function setForce(state, id, patch) {
  if (state.schedule) state.schedule = null;
  setForceOn(state, id, patch);
  syncVertical(state);
  return state;
}

export function addForce(state, opts) {
  if (state.schedule) state.schedule = null;
  addForceOn(state, opts);
  syncVertical(state);
  return state;
}

export function removeForce(state, id) {
  if (state.schedule) state.schedule = null;
  removeForceOn(state, id);
  return state;
}

export function disableHorizontalForces(state) {
  if (state.schedule) state.schedule = null;
  state.forces = state.forces.map((force) => {
    if (force.type === "gravity" || force.type === "normal") return force;
    return makeForce({ ...force, enabled: false });
  });
  return state;
}

export function enableFriction(state, on = true, magnitude = 10) {
  if (state.schedule) state.schedule = null;
  const friction = state.forces.find((f) => f.type === "friction");
  if (!friction) {
    state.forces.push(createFrictionForce(magnitude, 180, { enabled: on, autoDirection: false }));
    return state;
  }
  friction.enabled = on;
  friction.magnitude = magnitude;
  state.forces = state.forces.map((f) => makeForce(f));
  return state;
}

export function setNetX(state, Fnetx) {
  if (state.schedule) state.schedule = null;
  const target = Number(Fnetx) || 0;
  state.forces = state.forces.filter((f) => f.type === "gravity" || f.type === "normal");
  if (Math.abs(target) >= FORCE_EPSILON) state.forces.push(...appliedNet(target));
  syncVertical(state);
  return state;
}

export function applyForceLockMass(F, mass = 5) {
  const mag = Number(F) || 0;
  return createState({
    scenario: "custom",
    mass,
    x0: -8,
    vx0: 0,
    forces: [...verticalPair(mass), ...appliedNet(mag)],
  });
}

export function applyMassLockForce(mass, F = 20) {
  return createState({
    scenario: "custom",
    mass,
    x0: -8,
    vx0: 0,
    forces: [...verticalPair(mass), ...appliedNet(F)],
  });
}

export function predictedAccel({ Fnet, mass }) {
  return (Number(Fnet) || 0) / Math.max(clampMass(mass), 1e-9);
}

function randInt(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function generateChallenge(rng = Math.random) {
  const roll = rng();
  if (roll < 0.3) {
    const m = randInt(2, 8, rng);
    const F = randInt(8, 24, rng);
    const a = F / m;
    return {
      type: "find-a",
      prompt: "A known net force acts on a known mass. Find the acceleration.",
      givens: [
        { label: "Mass", value: formatUnsigned(m, "kg") },
        { label: "F_net", value: formatSigned(F, "N") },
      ],
      params: { scenario: "custom", mass: m, x0: -8, vx0: 0, forces: [...verticalPair(m), ...appliedNet(F)] },
      targets: { Fnetx: F, ax: a, mass: m },
      unknownLabel: "a_x",
      goalLabel: formatSigned(a, "m/s²"),
      solutionHint: `a = F_net / m = ${F} / ${m} = ${formatSigned(a, "m/s²")}. Acceleration follows the net force, not any one arrow.`,
    };
  }
  if (roll < 0.55) {
    const m = randInt(2, 8, rng);
    const a = randInt(2, 6, rng);
    const F = m * a;
    return {
      type: "find-F",
      prompt: "Mass and acceleration are given. Find the net force.",
      givens: [
        { label: "Mass", value: formatUnsigned(m, "kg") },
        { label: "a", value: formatSigned(a, "m/s²") },
      ],
      params: { scenario: "custom", mass: m, x0: -8, vx0: 0, forces: [...verticalPair(m), ...appliedNet(F)] },
      targets: { Fnetx: F, ax: a, mass: m },
      unknownLabel: "F_net",
      goalLabel: formatSigned(F, "N"),
      solutionHint: `F_net = ma = ${m} × ${a} = ${formatSigned(F, "N")}. Use the net force, not an individual force.`,
    };
  }
  if (roll < 0.75) {
    const F = 30;
    const a = randInt(3, 6, rng);
    const m = F / a;
    return {
      type: "find-m",
      prompt: "Net force and acceleration are given. Find the mass.",
      givens: [
        { label: "F_net", value: formatSigned(F, "N") },
        { label: "a", value: formatSigned(a, "m/s²") },
      ],
      params: { scenario: "custom", mass: m, x0: -8, vx0: 0, forces: [...verticalPair(m), ...appliedNet(F)] },
      targets: { Fnetx: F, ax: a, mass: m },
      unknownLabel: "m",
      goalLabel: formatUnsigned(m, "kg"),
      solutionHint: `m = F_net / a = ${F} / ${a} = ${formatUnsigned(m, "kg")}.`,
    };
  }
  return {
    type: "opp-signs",
    prompt: "The object moves right at +8 m/s while F_net = −10 N and m = 5 kg. Is it speeding up or slowing down, and what is a?",
    givens: [
      { label: "v", value: formatSigned(8, "m/s") },
      { label: "F_net", value: formatSigned(-10, "N") },
      { label: "m", value: formatUnsigned(5, "kg") },
    ],
    params: { scenario: "opp-signs" },
    targets: { Fnetx: -10, ax: -2, mass: 5 },
    unknownLabel: "a and whether |v| is increasing",
    goalLabel: "−2 m/s², slowing down",
    solutionHint: "a = −10 / 5 = −2 m/s². Velocity is positive and acceleration is negative, so the object is slowing down while still moving right.",
  };
}

export function challengeTolerance(value) {
  return Math.max(0.15, 0.04 * Math.abs(value));
}

export function evaluateChallenge(measured, spec) {
  const fnet = measured.net?.x ?? measured.Fnetx ?? 0;
  const ax = measured.ax ?? measured.a?.x ?? 0;
  const mass = measured.mass ?? 0;
  const fOk = Math.abs(fnet - (spec.targets.Fnetx ?? 0)) <= challengeTolerance(spec.targets.Fnetx ?? 0);
  const aOk = Math.abs(ax - (spec.targets.ax ?? 0)) <= challengeTolerance(spec.targets.ax ?? 0);
  const mOk = spec.targets.mass == null || Math.abs(mass - spec.targets.mass) <= challengeTolerance(spec.targets.mass);
  return { ok: fOk && aOk && mOk, fnet, ax, mass };
}

export function teacherReport(state) {
  const snap = snapshot(state);
  return (
    `${snap.forceState} · F_net,x = ${formatSigned(snap.net.x, "N")} · ` +
    `m = ${formatUnsigned(snap.mass, "kg")} · a_x = ${formatSigned(snap.ax, "m/s²")} · ` +
    `v = ${formatSigned(snap.vx, "m/s")} · ${snap.motion}. ` +
    `a = F_net / m. Direction of a matches F_net, not necessarily v.`
  );
}

export function cameraObjectCount() {
  return 1;
}
