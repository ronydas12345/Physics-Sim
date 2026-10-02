/**
 * Newton's first law for Simulation 2.4.
 * Horizontal motion on a surface: F_net = 0 means constant velocity, including rest.
 * Inertia comparison is the same force on two masses — inertia is not a force.
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

function verticalPair(mass, g = DEFAULT_G) {
  return [createGravityForce({ mass, g }), createNormalForce(mass * g)];
}

export const SCENARIOS = [
  {
    id: "rest",
    label: "At rest",
    mode: "object",
    mass: 5,
    x0: 0,
    vx0: 0,
    forces: ({ mass, g }) => verticalPair(mass, g),
  },
  {
    id: "moving-eq",
    label: "Moving, F_net = 0",
    mode: "object",
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
    id: "unbalanced",
    label: "Unbalanced push",
    mode: "object",
    mass: 5,
    x0: -8,
    vx0: 5,
    forces: ({ mass, g }) => [
      ...verticalPair(mass, g),
      createAppliedForce(30, 0, { id: "applied", name: "Applied right" }),
      createAppliedForce(20, 180, { id: "applied-b", name: "Applied left", source: "Opposer" }),
    ],
  },
  {
    id: "left-eq",
    label: "Moving left, F_net = 0",
    mode: "object",
    mass: 5,
    x0: 8,
    vx0: -5,
    forces: ({ mass, g }) => [
      ...verticalPair(mass, g),
      createAppliedForce(20, 0, { id: "applied", name: "Applied right" }),
      createAppliedForce(20, 180, { id: "applied-b", name: "Applied left", source: "Opposer" }),
    ],
  },
  {
    id: "remove-forces",
    label: "Remove the forces",
    mode: "object",
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
    id: "friction",
    label: "Coast, then friction",
    mode: "object",
    mass: 5,
    x0: -8,
    vx0: 5,
    forces: ({ mass, g }) => [
      ...verticalPair(mass, g),
      createFrictionForce(10, 180, { enabled: false, autoDirection: false }),
    ],
  },
  {
    id: "inertia",
    label: "Inertia comparison",
    mode: "inertia",
    massA: 2,
    massB: 8,
    xA0: -6,
    xB0: 2,
    vxA0: 0,
    vxB0: 0,
    force: 16,
  },
  {
    id: "custom",
    label: "Custom",
    mode: "object",
    mass: 5,
    x0: 0,
    vx0: 0,
    forces: ({ mass, g }) => verticalPair(mass, g),
  },
];

export function scenarioById(id) {
  return SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
}

export function isInertia(state) {
  return state?.mode === "inertia";
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

function objectForces(raw, scenario, mass, g) {
  if (raw.forces?.length) return raw.forces.map((f) => makeForce(f));
  return scenario.forces({ mass, g }).map((f) => makeForce(f));
}

export function createState(raw = {}) {
  const scenario = scenarioById(raw.scenario || raw.id);
  const T = clamp(Number(raw.duration) || 10, DURATION_MIN, DURATION_MAX);
  const g = Number.isFinite(Number(raw.g)) ? Number(raw.g) : DEFAULT_G;
  if (scenario.mode === "inertia" || raw.mode === "inertia") {
    const massA = clampMass(raw.massA ?? scenario.massA ?? 2);
    const massB = clampMass(raw.massB ?? scenario.massB ?? 8);
    const force = clampForce(raw.force ?? scenario.force ?? 16);
    const state = {
      scenario: "inertia",
      mode: "inertia",
      massA,
      massB,
      force,
      xA0: Number.isFinite(Number(raw.xA0)) ? Number(raw.xA0) : scenario.xA0,
      xB0: Number.isFinite(Number(raw.xB0)) ? Number(raw.xB0) : scenario.xB0,
      vxA0: Number.isFinite(Number(raw.vxA0)) ? Number(raw.vxA0) : scenario.vxA0,
      vxB0: Number.isFinite(Number(raw.vxB0)) ? Number(raw.vxB0) : scenario.vxB0,
      g,
      duration: T,
      time: 0,
      showNetForce: raw.showNetForce !== false,
      showVelocity: raw.showVelocity !== false,
      history: [],
    };
    recordSample(state);
    return state;
  }
  const mass = clampMass(raw.mass ?? scenario.mass);
  const state = {
    scenario: scenario.id,
    mode: "object",
    mass,
    g,
    x0: Number.isFinite(Number(raw.x0)) ? Number(raw.x0) : scenario.x0,
    vx0: Number.isFinite(Number(raw.vx0)) ? Number(raw.vx0) : scenario.vx0,
    duration: T,
    time: 0,
    forces: objectForces(raw, scenario, mass, g),
    showNetForce: raw.showNetForce !== false,
    showVelocity: raw.showVelocity !== false,
    history: [],
  };
  syncVertical(state);
  recordSample(state);
  return state;
}

function syncVertical(state) {
  if (isInertia(state)) return state;
  const grav = state.mass * state.g;
  state.forces = state.forces.map((force) => {
    if (force.type === "gravity") return makeForce({ ...force, magnitude: grav, direction: 270 });
    if (force.type === "normal") return makeForce({ ...force, magnitude: grav, direction: 90 });
    return makeForce(force);
  });
  return state;
}

export function netX(state) {
  if (isInertia(state)) return state.force;
  return calculateNetForce(state.forces).x;
}

export function liveState(state, t = state.time) {
  if (isInertia(state)) {
    const aA = state.force / Math.max(state.massA, 1e-9);
    const aB = state.force / Math.max(state.massB, 1e-9);
    return {
      xA: state.xA0 + state.vxA0 * t + 0.5 * aA * t * t,
      xB: state.xB0 + state.vxB0 * t + 0.5 * aB * t * t,
      vxA: state.vxA0 + aA * t,
      vxB: state.vxB0 + aB * t,
      aA,
      aB,
      Fnet: state.force,
      balanced: Math.abs(state.force) < FORCE_EPSILON,
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
  };
}

function sampleFrom(state) {
  const live = liveState(state);
  if (isInertia(state)) {
    return {
      time: state.time,
      xA: live.xA,
      xB: live.xB,
      vxA: live.vxA,
      vxB: live.vxB,
      aA: live.aA,
      aB: live.aB,
      Fnet: live.Fnet,
      x: live.xA,
      vx: live.vxA,
      ax: live.aA,
      Fnetx: live.Fnet,
    };
  }
  return {
    time: state.time,
    x: live.x,
    vx: live.vx,
    ax: live.ax,
    Fnetx: live.net.x,
    Fnety: live.net.y,
    Fnet: live.net.magnitude,
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
  if (isInertia(state)) {
    return {
      time: state.time,
      scenario: state.scenario,
      mode: "inertia",
      massA: state.massA,
      massB: state.massB,
      force: state.force,
      xA: live.xA,
      xB: live.xB,
      vxA: live.vxA,
      vxB: live.vxB,
      aA: live.aA,
      aB: live.aB,
      Fnet: live.Fnet,
      balanced: live.balanced,
      motionA: motionLabel(live.vxA, live.aA),
      motionB: motionLabel(live.vxB, live.aB),
    };
  }
  const dir = netDirection(live.net);
  const horiz = enabledForces(state.forces).filter((f) => Math.abs(f.y) < FORCE_EPSILON || f.type === "applied" || f.type === "friction");
  return {
    time: state.time,
    scenario: state.scenario,
    mode: "object",
    mass: state.mass,
    g: state.g,
    forces: state.forces.map((f) => ({ ...f })),
    enabled: enabledForces(state.forces),
    horizontal: horiz,
    net: live.net,
    balanced: live.balanced,
    forceState: live.balanced ? "EQUILIBRIUM" : "NON-EQUILIBRIUM",
    motion: live.motion,
    netDir: dir,
    a: live.a,
    x: live.x,
    vx: live.vx,
    ax: live.ax,
  };
}

export function reset(state) {
  if (isInertia(state)) {
    return createState({
      scenario: "inertia",
      mode: "inertia",
      massA: state.massA,
      massB: state.massB,
      force: state.force,
      xA0: state.xA0,
      xB0: state.xB0,
      vxA0: state.vxA0,
      vxB0: state.vxB0,
      duration: state.duration,
      showNetForce: state.showNetForce,
      showVelocity: state.showVelocity,
    });
  }
  return createState({
    scenario: state.scenario,
    mass: state.mass,
    g: state.g,
    x0: state.x0,
    vx0: state.vx0,
    duration: state.duration,
    forces: state.forces,
    showNetForce: state.showNetForce,
    showVelocity: state.showVelocity,
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
      const lerp = (pa, pb) => pa + (pb - pa) * u;
      const out = { time: t };
      for (const key of Object.keys(a)) {
        if (key === "time") continue;
        if (typeof a[key] === "number" && typeof b[key] === "number") out[key] = lerp(a[key], b[key]);
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
  if (isInertia(state)) return state;
  state.mass = clampMass(mass);
  syncVertical(state);
  return state;
}

export function setMassA(state, mass) {
  if (!isInertia(state)) return state;
  state.massA = clampMass(mass);
  return state;
}

export function setMassB(state, mass) {
  if (!isInertia(state)) return state;
  state.massB = clampMass(mass);
  return state;
}

export function setInertiaForce(state, force) {
  if (!isInertia(state)) return state;
  state.force = clampForce(force);
  return state;
}

export function setForce(state, id, patch) {
  if (isInertia(state)) return state;
  setForceOn(state, id, patch);
  syncVertical(state);
  return state;
}

export function addForce(state, opts) {
  if (isInertia(state)) return state;
  addForceOn(state, opts);
  syncVertical(state);
  return state;
}

export function removeForce(state, id) {
  if (isInertia(state)) return state;
  removeForceOn(state, id);
  return state;
}

export function disableHorizontalForces(state) {
  if (isInertia(state)) return state;
  state.forces = state.forces.map((force) => {
    if (force.type === "gravity" || force.type === "normal") return force;
    return makeForce({ ...force, enabled: false });
  });
  return state;
}

export function enableFriction(state, on = true) {
  if (isInertia(state)) return state;
  const friction = state.forces.find((f) => f.type === "friction");
  if (!friction) {
    state.forces.push(createFrictionForce(10, 180, { enabled: on, autoDirection: false }));
    return state;
  }
  friction.enabled = on;
  state.forces = state.forces.map((f) => makeForce(f));
  return state;
}

function randInt(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function generateChallenge(rng = Math.random) {
  const roll = rng();
  if (roll < 0.35) {
    const v = -randInt(2, 6, rng);
    const F = randInt(8, 16, rng);
    return {
      type: "moving-eq",
      prompt: "Mass, velocity, and equal opposite forces are given. Find net force, acceleration, and velocity after 3 s.",
      givens: [
        { label: "Mass", value: formatUnsigned(4, "kg") },
        { label: "Velocity", value: formatSigned(v, "m/s") },
        { label: "Force right", value: formatUnsigned(F, "N") },
        { label: "Force left", value: formatUnsigned(F, "N") },
      ],
      params: {
        scenario: "moving-eq",
        mass: 4,
        vx0: v,
        x0: 0,
        forces: [
          ...verticalPair(4, DEFAULT_G),
          createAppliedForce(F, 0, { id: "applied", name: "Applied right" }),
          createAppliedForce(F, 180, { id: "applied-b", name: "Applied left" }),
        ],
      },
      targets: { Fnetx: 0, ax: 0, vx: v },
      unknownLabel: "F_net, a, and v(3 s)",
      goalLabel: "0 N, 0 m/s², unchanged velocity",
      solutionHint: `F_net = 0 so a = 0. Velocity stays ${formatSigned(v, "m/s")}. Equally spaced dots continue in the current direction.`,
    };
  }
  if (roll < 0.7) {
    return {
      type: "rest-eq",
      prompt: "The object is at rest with zero net force. What are F_net, a, and v after several seconds?",
      givens: [
        { label: "Mass", value: formatUnsigned(5, "kg") },
        { label: "v₀", value: formatSigned(0, "m/s") },
      ],
      params: { scenario: "rest" },
      targets: { Fnetx: 0, ax: 0, vx: 0 },
      unknownLabel: "F_net, a, and v",
      goalLabel: "0 N, 0 m/s², remains at rest",
      solutionHint: "Rest is constant velocity of zero. F_net = 0 keeps it there.",
    };
  }
  return {
    type: "unbalanced",
    prompt: "An object already moving at +5 m/s has F_net = +10 N and m = 5 kg. What is a_x?",
    givens: [
      { label: "m", value: formatUnsigned(5, "kg") },
      { label: "v", value: formatSigned(5, "m/s") },
      { label: "F_net", value: formatSigned(10, "N") },
    ],
    params: { scenario: "unbalanced" },
    targets: { Fnetx: 10, ax: 2, vx: null },
    unknownLabel: "a_x",
    goalLabel: "+2 m/s²",
    solutionHint: "a = F_net / m = 10 / 5 = +2 m/s². Velocity will increase; it does not stay +5 m/s.",
  };
}

export function challengeTolerance(value) {
  return Math.max(0.15, 0.04 * Math.abs(value));
}

export function evaluateChallenge(measured, spec) {
  const fnet = measured.net?.x ?? measured.Fnetx ?? measured.Fnet ?? 0;
  const ax = measured.ax ?? measured.a?.x ?? 0;
  const vx = measured.vx ?? 0;
  const fOk = Math.abs(fnet - (spec.targets.Fnetx ?? 0)) <= challengeTolerance(spec.targets.Fnetx ?? 0);
  const aOk = Math.abs(ax - (spec.targets.ax ?? 0)) <= challengeTolerance(spec.targets.ax ?? 0);
  const vOk = spec.targets.vx == null || Math.abs(vx - spec.targets.vx) <= challengeTolerance(spec.targets.vx);
  return { ok: fOk && aOk && vOk, fnet, ax, vx };
}

export function teacherReport(state) {
  const snap = snapshot(state);
  if (isInertia(state)) {
    return (
      `Same F = ${formatUnsigned(snap.force, "N")} on both. ` +
      `a_A = F/m_A = ${formatSigned(snap.aA, "m/s²")} · a_B = F/m_B = ${formatSigned(snap.aB, "m/s²")}. ` +
      `Inertia is not a force; larger mass resists the same F more.`
    );
  }
  return (
    `${snap.forceState} · F_net,x = ${formatSigned(snap.net.x, "N")} · ` +
    `a_x = ${formatSigned(snap.ax, "m/s²")} · v = ${formatSigned(snap.vx, "m/s")} · ` +
    `${snap.motion}. F_net = 0 ⇒ a = 0 ⇒ velocity stays the same, including rest.`
  );
}

export function cameraObjectCount(state) {
  return isInertia(state) ? 2 : 1;
}
