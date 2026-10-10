/**
 * Circular motion for Simulation 2.9.
 * Uniform circular path: ac = v²/r, Fc = m v²/r. Velocity is tangent; acceleration is inward.
 * Physics: +x right, +y up. θ measured counterclockwise from +x. CCW is positive.
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
export const MASS_MIN = 0.5;
export const MASS_MAX = 50;
export const RADIUS_MIN = 0.5;
export const RADIUS_MAX = 20;
export const SPEED_MIN = 0;
export const SPEED_MAX = 20;
export const ANGLE_MIN = 0;
export const ANGLE_MAX = 359;
export const MU_MIN = 0;
export const MU_MAX = 1.5;
export const VEL_EPSILON = 0.02;
export const ACCEL_EPSILON = 0.05;
export const FORCE_EPSILON = 0.001;

export const SPEED_TRIALS = Object.freeze([1, 2, 4, 8]);
export const RADIUS_TRIALS = Object.freeze([1, 2, 4, 8]);
export const MASS_TRIALS = Object.freeze([0.5, 1, 2, 4]);

export const FORCE_SOURCES = [
  { id: "string", label: "String (tension)", inward: "T", caption: "Tension supplies the inward net force on a horizontal table." },
  { id: "friction", label: "Friction (flat road)", inward: "fs", caption: "Static friction can supply the inward net force if it does not exceed μs N." },
  { id: "orbit", label: "Orbit (gravity)", inward: "Fg", caption: "Gravity supplies the inward net force in an ideal circular orbit." },
];

export const SCENARIOS = [
  { id: "baseline", label: "Baseline", mass: 1, r: 2, speed: 4, direction: 1, theta0Deg: 0, forceSource: "string", mu: 0.5 },
  { id: "double-v", label: "Double speed", mass: 1, r: 2, speed: 8, direction: 1, theta0Deg: 0, forceSource: "string", mu: 0.5 },
  { id: "double-r", label: "Double radius", mass: 1, r: 4, speed: 4, direction: 1, theta0Deg: 0, forceSource: "string", mu: 0.5 },
  { id: "double-m", label: "Double mass", mass: 2, r: 2, speed: 4, direction: 1, theta0Deg: 0, forceSource: "string", mu: 0.5 },
  { id: "double-both", label: "Double v and r", mass: 1, r: 4, speed: 8, direction: 1, theta0Deg: 0, forceSource: "string", mu: 0.5 },
  { id: "slow", label: "Slow motion", mass: 1, r: 2, speed: 1, direction: 1, theta0Deg: 0, forceSource: "string", mu: 0.5 },
  { id: "clockwise", label: "Clockwise", mass: 1, r: 2, speed: 4, direction: -1, theta0Deg: 0, forceSource: "string", mu: 0.5 },
  { id: "rest", label: "Zero speed", mass: 1, r: 2, speed: 0, direction: 1, theta0Deg: 0, forceSource: "string", mu: 0.5 },
  { id: "friction-limit", label: "Friction limit", mass: 2, r: 4, speed: 4, direction: 1, theta0Deg: 0, forceSource: "friction", mu: 0.5 },
  { id: "custom", label: "Custom", mass: 1, r: 2, speed: 4, direction: 1, theta0Deg: 0, forceSource: "string", mu: 0.5 },
];

export function scenarioById(id) {
  return SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
}

export function sourceById(id) {
  return FORCE_SOURCES.find((s) => s.id === id) || FORCE_SOURCES[0];
}

export function clampMass(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return clamp(n, MASS_MIN, MASS_MAX);
}

export function clampRadius(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 2;
  return clamp(n, RADIUS_MIN, RADIUS_MAX);
}

export function clampSpeed(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return clamp(n, SPEED_MIN, SPEED_MAX);
}

export function clampAngleDeg(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const wrapped = ((n % 360) + 360) % 360;
  return wrapped >= 359.5 ? 0 : clamp(wrapped, ANGLE_MIN, ANGLE_MAX);
}

export function clampMu(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.5;
  return clamp(n, MU_MIN, MU_MAX);
}

export function clampDirection(value) {
  return Number(value) < 0 ? -1 : 1;
}

export function degToRad(deg) {
  return (clampAngleDeg(deg) * Math.PI) / 180;
}

export function radToDeg(rad) {
  const n = Number(rad);
  if (!Number.isFinite(n)) return 0;
  return ((n * 180) / Math.PI + 360) % 360;
}

export function wrapAngle(theta) {
  const n = Number(theta);
  if (!Number.isFinite(n)) return 0;
  const twoPi = Math.PI * 2;
  let a = n % twoPi;
  if (a < 0) a += twoPi;
  return a;
}

export function centripetalAccel(speed, r) {
  const v = clampSpeed(speed);
  const radius = clampRadius(r);
  return (v * v) / radius;
}

export function centripetalForce(mass, speed, r) {
  return clampMass(mass) * centripetalAccel(speed, r);
}

export function omegaOf(speed, r) {
  return clampSpeed(speed) / clampRadius(r);
}

export function periodOf(speed, r) {
  const v = clampSpeed(speed);
  if (v < 1e-12) return null;
  return (2 * Math.PI * clampRadius(r)) / v;
}

export function frequencyOf(speed, r) {
  const T = periodOf(speed, r);
  return T == null ? null : 1 / T;
}

export function maxFrictionSpeed(mu, g, r) {
  return Math.sqrt(Math.max(clampMu(mu), 0) * Math.max(Number(g) || G, 0) * clampRadius(r));
}

export function evaluateCircular({ mass, r, speed, theta, direction, forceSource, mu, g }) {
  const m = Math.max(clampMass(mass), 1e-9);
  const radius = clampRadius(r);
  const v = clampSpeed(speed);
  const dir = clampDirection(direction);
  const th = wrapAngle(theta);
  const ac = (v * v) / radius;
  const Fc = m * ac;
  const omegaMag = v / radius;
  const omega = dir * omegaMag;
  const x = radius * Math.cos(th);
  const y = radius * Math.sin(th);
  const vx = -dir * v * Math.sin(th);
  const vy = dir * v * Math.cos(th);
  const ax = -ac * Math.cos(th);
  const ay = -ac * Math.sin(th);
  const source = sourceById(forceSource);
  const gUse = Number.isFinite(Number(g)) ? Number(g) : G;
  const muUse = clampMu(mu);
  const W = m * gUse;
  const N = source.id === "orbit" ? 0 : W;
  const fsMax = muUse * N;
  const vMax = source.id === "friction" ? maxFrictionSpeed(muUse, gUse, radius) : null;
  const supported = source.id !== "friction" || Fc <= fsMax + 1e-9;
  const inwardForce = source.id === "friction" ? (supported ? Fc : fsMax) : Fc;
  return {
    mass: m,
    r: radius,
    speed: v,
    theta: th,
    direction: dir,
    forceSource: source.id,
    mu: muUse,
    g: gUse,
    ac,
    Fc,
    omega,
    omegaMag,
    T: periodOf(v, radius),
    f: frequencyOf(v, radius),
    x,
    y,
    vx,
    vy,
    ax,
    ay,
    W,
    N,
    fsMax,
    vMax,
    supported,
    inwardForce,
    inwardLabel: source.inward,
    sourceCaption: source.caption,
  };
}

export function motionLabel({ speed, supported, forceSource }) {
  if (!supported) return "Not supported";
  if (Math.abs(speed) < VEL_EPSILON) return "At rest";
  if (forceSource === "friction") return "Friction circle";
  if (forceSource === "orbit") return "Orbiting";
  return "Uniform circular";
}

export function cardinalName(theta) {
  const deg = ((radToDeg(theta) % 360) + 360) % 360;
  if (deg < 8 || deg > 352) return "right";
  if (Math.abs(deg - 90) < 8) return "top";
  if (Math.abs(deg - 180) < 8) return "left";
  if (Math.abs(deg - 270) < 8) return "bottom";
  return "on path";
}

function recordSample(state) {
  const live = evaluateCircular(state);
  const sample = {
    time: state.time,
    x: live.x,
    y: live.y,
    vx: live.vx,
    vy: live.vy,
    ax: live.ax,
    ay: live.ay,
    ac: live.ac,
    Fc: live.Fc,
    speed: live.speed,
    theta: live.theta,
    omega: live.omega,
    r: live.r,
    mass: live.mass,
    T: live.T,
    v2: live.speed * live.speed,
    invR: 1 / live.r,
  };
  const last = state.history[state.history.length - 1];
  if (last && Math.abs(last.time - sample.time) < DT * 0.5) Object.assign(last, sample);
  else state.history.push(sample);
  state.trail.push({ x: live.x, y: live.y });
  if (state.trail.length > 240) state.trail.shift();
}

export function createState(raw = {}) {
  const scenario = scenarioById(raw.scenario || raw.id);
  const mass = clampMass(raw.mass ?? scenario.mass);
  const r = clampRadius(raw.r ?? scenario.r);
  const speed = clampSpeed(raw.speed ?? scenario.speed);
  const direction = clampDirection(raw.direction ?? scenario.direction);
  const theta0Deg = clampAngleDeg(raw.theta0Deg ?? scenario.theta0Deg);
  const theta0 = degToRad(theta0Deg);
  const theta = Number.isFinite(Number(raw.theta)) ? wrapAngle(Number(raw.theta)) : theta0;
  const state = {
    scenario: scenario.id,
    mass,
    r,
    speed,
    direction,
    theta0Deg,
    theta0,
    theta,
    forceSource: sourceById(raw.forceSource ?? scenario.forceSource).id,
    mu: clampMu(raw.mu ?? scenario.mu),
    g: Number.isFinite(Number(raw.g)) ? Number(raw.g) : G,
    duration: clamp(Number(raw.duration) || 10, DURATION_MIN, DURATION_MAX),
    time: 0,
    showVectors: raw.showVectors !== false,
    showVelocity: raw.showVelocity !== false,
    showAccel: raw.showAccel !== false,
    showNet: raw.showNet !== false,
    showAxes: raw.showAxes !== false,
    showTrail: raw.showTrail !== false,
    history: [],
    trail: [],
  };
  recordSample(state);
  return state;
}

export function liveState(state) {
  const live = evaluateCircular(state);
  return {
    ...live,
    time: state.time,
    scenario: state.scenario,
    motion: motionLabel(live),
    place: cardinalName(live.theta),
  };
}

export function snapshot(state) {
  const live = liveState(state);
  return {
    time: state.time,
    scenario: state.scenario,
    mass: live.mass,
    r: live.r,
    speed: live.speed,
    direction: live.direction,
    theta: live.theta,
    thetaDeg: radToDeg(live.theta),
    theta0Deg: state.theta0Deg,
    x: live.x,
    y: live.y,
    vx: live.vx,
    vy: live.vy,
    ax: live.ax,
    ay: live.ay,
    ac: live.ac,
    Fc: live.Fc,
    omega: live.omega,
    omegaMag: live.omegaMag,
    T: live.T,
    f: live.f,
    forceSource: live.forceSource,
    mu: live.mu,
    fsMax: live.fsMax,
    vMax: live.vMax,
    supported: live.supported,
    inwardForce: live.inwardForce,
    inwardLabel: live.inwardLabel,
    motion: live.motion,
    place: live.place,
    W: live.W,
    N: live.N,
  };
}

export function reset(state) {
  return createState({
    scenario: state.scenario,
    mass: state.mass,
    r: state.r,
    speed: state.speed,
    direction: state.direction,
    theta0Deg: state.theta0Deg,
    forceSource: state.forceSource,
    mu: state.mu,
    g: state.g,
    duration: state.duration,
    showVectors: state.showVectors,
    showVelocity: state.showVelocity,
    showAccel: state.showAccel,
    showNet: state.showNet,
    showAxes: state.showAxes,
    showTrail: state.showTrail,
  });
}

export function stepTo(state, targetTime) {
  const goal = clamp(targetTime, 0, state.duration);
  if (goal + 1e-12 < state.time) return state;
  while (state.time + 1e-12 < goal) {
    const dt = Math.min(DT, goal - state.time);
    const live = evaluateCircular(state);
    state.theta = wrapAngle(state.theta + live.omega * dt);
    state.time += dt;
    recordSample(state);
  }
  return state;
}

export function setMass(state, mass) {
  state.mass = clampMass(mass);
  return state;
}

export function setRadius(state, r) {
  state.r = clampRadius(r);
  return state;
}

export function setSpeed(state, speed) {
  state.speed = clampSpeed(speed);
  return state;
}

export function setDirection(state, direction) {
  state.direction = clampDirection(direction);
  return state;
}

export function setTheta0(state, deg) {
  state.theta0Deg = clampAngleDeg(deg);
  state.theta0 = degToRad(state.theta0Deg);
  if (state.time < 1e-12) state.theta = state.theta0;
  return state;
}

export function setTheta(state, rad) {
  const next = Number(rad);
  if (!Number.isFinite(next)) return state;
  state.theta = wrapAngle(next);
  if (state.time < 1e-12) {
    state.theta0 = state.theta;
    state.theta0Deg = clampAngleDeg(radToDeg(state.theta));
  }
  return state;
}

export function setForceSource(state, id) {
  state.forceSource = sourceById(id).id;
  return state;
}

export function setMu(state, mu) {
  state.mu = clampMu(mu);
  return state;
}

export function historySeries(state) {
  return state.history.map((sample) => ({ ...sample }));
}

export function sampleHistory(state, t) {
  const history = state.history;
  if (!history.length) return { time: t, x: state.r, y: 0 };
  if (t <= history[0].time) return history[0];
  const last = history[history.length - 1];
  if (t >= last.time) return last;
  for (let i = 1; i < history.length; i += 1) {
    if (history[i].time >= t) return history[i - 1];
  }
  return last;
}

export function predictedAc({ speed, r }) {
  return centripetalAccel(speed, r);
}

export function predictedFc({ mass, speed, r }) {
  return centripetalForce(mass, speed, r);
}

export function generateChallenge(rng = Math.random) {
  const roll = rng();
  if (roll < 0.25) {
    return {
      type: "find-ac",
      prompt: "An object moves in a circle of radius 2.0 m at 4.0 m/s. Find the centripetal acceleration.",
      givens: [
        { label: "v", value: "4.0 m/s" },
        { label: "r", value: "2.0 m" },
      ],
      params: { scenario: "baseline", mass: 1, r: 2, speed: 4, direction: 1, theta0Deg: 0 },
      targets: { ac: 8 },
      unknownLabel: "ac",
      goalLabel: formatUnsigned(8, "m/s²"),
      solutionHint: "ac = v²/r = 16/2 = 8.0 m/s², toward the center. Speed is constant; velocity is not.",
    };
  }
  if (roll < 0.5) {
    return {
      type: "find-fc",
      prompt: "A 1.0 kg object moves in a 2.0 m circle at 4.0 m/s. Find the required inward net force.",
      givens: [
        { label: "m", value: "1.0 kg" },
        { label: "v", value: "4.0 m/s" },
        { label: "r", value: "2.0 m" },
      ],
      params: { scenario: "baseline", mass: 1, r: 2, speed: 4, direction: 1, theta0Deg: 0 },
      targets: { Fc: 8 },
      unknownLabel: "F_net,inward",
      goalLabel: formatUnsigned(8, "N"),
      solutionHint: "Fc = m v²/r = (1)(16)/2 = 8.0 N. That is the net inward force, not an extra interaction.",
    };
  }
  if (roll < 0.75) {
    return {
      type: "double-v",
      prompt: "Baseline: m = 1 kg, r = 2 m, v = 4 m/s. Double the speed. What is ac?",
      givens: [
        { label: "v", value: "8.0 m/s" },
        { label: "r", value: "2.0 m" },
      ],
      params: { scenario: "double-v", mass: 1, r: 2, speed: 8, direction: 1, theta0Deg: 0 },
      targets: { ac: 32, Fc: 32 },
      unknownLabel: "ac",
      goalLabel: formatUnsigned(32, "m/s²"),
      solutionHint: "ac ∝ v², so doubling speed multiplies ac by 4: 8 → 32 m/s². Fc also becomes 32 N.",
    };
  }
  return {
    type: "combined",
    prompt: "m = 3.0 kg, r = 6.0 m, v = 6.0 m/s. Find the required inward net force.",
    givens: [
      { label: "m", value: "3.0 kg" },
      { label: "r", value: "6.0 m" },
      { label: "v", value: "6.0 m/s" },
    ],
    params: { scenario: "custom", mass: 3, r: 6, speed: 6, direction: 1, theta0Deg: 0 },
    targets: { ac: 6, Fc: 18, omegaMag: 1 },
    unknownLabel: "F_net,inward",
    goalLabel: formatUnsigned(18, "N"),
    solutionHint: "ac = 36/6 = 6.0 m/s². Fc = 3 × 6 = 18 N. ω = v/r = 1 rad/s. T = 2π s.",
  };
}

export function challengeTolerance(value) {
  return Math.max(0.08, 0.04 * Math.abs(value || 1));
}

export function evaluateChallenge(measured, spec) {
  if (spec.type === "find-ac" || spec.type === "double-v") {
    return { ok: Math.abs((measured.ac ?? 0) - spec.targets.ac) <= challengeTolerance(spec.targets.ac), ac: measured.ac };
  }
  if (spec.type === "find-fc" || spec.type === "combined") {
    return { ok: Math.abs((measured.Fc ?? 0) - spec.targets.Fc) <= challengeTolerance(spec.targets.Fc), Fc: measured.Fc };
  }
  return { ok: Math.abs((measured.ac ?? 0) - (spec.targets.ac ?? 0)) <= challengeTolerance(spec.targets.ac), ac: measured.ac };
}

export function teacherReport(state) {
  const snap = snapshot(state);
  const T = snap.T == null ? "T undefined at v = 0" : `T = ${formatUnsigned(snap.T, "s")}`;
  const limit = snap.forceSource === "friction"
    ? snap.supported
      ? ` · fs,max = ${formatUnsigned(snap.fsMax, "N")} · v_max = ${formatUnsigned(snap.vMax, "m/s")}`
      : ` · required Fc exceeds fs,max = ${formatUnsigned(snap.fsMax, "N")}`
    : "";
  return (
    `${snap.motion} · ${snap.place} · ac = ${formatUnsigned(snap.ac, "m/s²")} · ` +
    `Fc = ${formatUnsigned(snap.Fc, "N")} · ω = ${formatSigned(snap.omega, "rad/s")} · ${T}. ` +
    `v is tangent; a points inward. ${snap.inwardLabel} supplies F_net,inward.${limit}`
  );
}

export function cameraObjectCount() {
  return 1;
}
