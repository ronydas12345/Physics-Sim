/**
 * Work and the work-energy theorem for Simulation 3.1.
 * Horizontal track, +x right. Applied force at angle θ from +x.
 * W = F d cos θ. K = ½ m v². W_net = ΔK. Kinetic energy is never negative.
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
export const MASS_MIN = 0.5;
export const MASS_MAX = 20;
export const SPEED_MIN = 0;
export const SPEED_MAX = 15;
export const FORCE_MIN = 0;
export const FORCE_MAX = 100;
export const DISP_MIN = 0;
export const DISP_MAX = 20;
export const MU_MIN = 0;
export const MU_MAX = 1.5;
export const VEL_EPSILON = 0.02;
export const FORCE_EPSILON = 0.001;
export const ENERGY_EPSILON = 0.05;

export const F_TRIALS = Object.freeze([5, 10, 15, 20]);
export const D_TRIALS = Object.freeze([2, 4, 6, 8]);
export const THETA_TRIALS = Object.freeze([0, 60, 90, 120, 180]);
export const MASS_TRIALS = Object.freeze([1, 2, 4, 8]);
export const SPEED_TRIALS = Object.freeze([1, 2, 4, 6]);

export const SCENARIOS = [
  { id: "along", label: "Force along displacement", mass: 2, v0: 2, force: 10, thetaDeg: 0, d: 5, frictionOn: false, mu: 0.2, oppose: 0 },
  { id: "perp", label: "Perpendicular force", mass: 2, v0: 4, force: 12, thetaDeg: 90, d: 6, frictionOn: false, mu: 0.2, oppose: 0 },
  { id: "negative", label: "Force opposing motion", mass: 2, v0: 6, force: 8, thetaDeg: 180, d: 3, frictionOn: false, mu: 0.2, oppose: 0 },
  { id: "zero-net", label: "Zero net work", mass: 2, v0: 3, force: 10, thetaDeg: 0, d: 4, frictionOn: false, mu: 0.2, oppose: 10 },
  { id: "angled", label: "Force at 60°", mass: 3, v0: 2, force: 20, thetaDeg: 60, d: 4, frictionOn: false, mu: 0.2, oppose: 0 },
  { id: "friction", label: "Friction reduces net work", mass: 2, v0: 3, force: 10, thetaDeg: 0, d: 4, frictionOn: true, mu: 0.2, oppose: 0 },
  { id: "stop", label: "Stops before the end", mass: 2, v0: 2, force: 10, thetaDeg: 180, d: 5, frictionOn: false, mu: 0.2, oppose: 0 },
  { id: "custom", label: "Custom", mass: 2, v0: 2, force: 10, thetaDeg: 0, d: 5, frictionOn: false, mu: 0.2, oppose: 0 },
];

export function scenarioById(id) {
  return SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
}

export function clampMass(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 2;
  return clamp(n, MASS_MIN, MASS_MAX);
}

export function clampSpeed(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return clamp(n, SPEED_MIN, SPEED_MAX);
}

export function clampForce(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return clamp(n, FORCE_MIN, FORCE_MAX);
}

export function clampDisp(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return clamp(n, DISP_MIN, DISP_MAX);
}

export function clampMu(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0.2;
  return clamp(n, MU_MIN, MU_MAX);
}

export function normalizeAngleDeg(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const wrapped = ((n % 360) + 360) % 360;
  return wrapped >= 359.5 ? 0 : wrapped;
}

export function degToRad(deg) {
  return (normalizeAngleDeg(deg) * Math.PI) / 180;
}

export function cosDeg(deg) {
  const a = normalizeAngleDeg(deg);
  if (Math.abs(a - 90) < 1e-9 || Math.abs(a - 270) < 1e-9) return 0;
  if (Math.abs(a - 180) < 1e-9) return -1;
  if (a < 1e-9) return 1;
  return Math.cos((a * Math.PI) / 180);
}

export function sinDeg(deg) {
  const a = normalizeAngleDeg(deg);
  if (a < 1e-9 || Math.abs(a - 180) < 1e-9) return 0;
  if (Math.abs(a - 90) < 1e-9) return 1;
  if (Math.abs(a - 270) < 1e-9) return -1;
  return Math.sin((a * Math.PI) / 180);
}

export function kineticEnergy(mass, speed) {
  const m = Math.max(clampMass(mass), 0);
  const v = clampSpeed(speed);
  return 0.5 * m * v * v;
}

export function workByForce(force, distance, thetaDeg) {
  const F = clampForce(force);
  const s = Math.max(0, Number(distance) || 0);
  return F * s * cosDeg(thetaDeg);
}

export function speedFromKe(mass, K) {
  const m = Math.max(clampMass(mass), 1e-9);
  const energy = Math.max(0, Number(K) || 0);
  return Math.sqrt((2 * energy) / m);
}

export function evaluateForces(raw = {}) {
  const mass = clampMass(raw.mass);
  const force = clampForce(raw.force);
  const thetaDeg = normalizeAngleDeg(raw.thetaDeg);
  const oppose = clampForce(raw.oppose);
  const frictionOn = Boolean(raw.frictionOn);
  const mu = frictionOn ? clampMu(raw.mu) : 0;
  const vx = Number(raw.vx);
  const speed = Number.isFinite(vx) ? vx : clampSpeed(raw.v0);
  const Fx = force * cosDeg(thetaDeg);
  const Fy = force * sinDeg(thetaDeg);
  const N = Math.max(0, mass * G - Fy);
  const fkMag = mu * N;
  let fk = 0;
  if (frictionOn && Math.abs(speed) > VEL_EPSILON) {
    fk = -Math.sign(speed) * fkMag;
  }
  const Fnetx = Fx + fk - oppose;
  return { mass, force, thetaDeg, oppose, frictionOn, mu, Fx, Fy, N, fkMag, fk, Fnetx, g: G };
}

export function predictedOutcome(raw = {}) {
  const mass = clampMass(raw.mass);
  const v0 = clampSpeed(raw.v0);
  const d = clampDisp(raw.d);
  const forces = evaluateForces({ ...raw, vx: v0 });
  const Ki = kineticEnergy(mass, v0);
  const a = forces.Fnetx / Math.max(mass, 1e-9);

  if (v0 <= VEL_EPSILON && forces.Fnetx <= FORCE_EPSILON) {
    const works = worksAt(0, raw, forces);
    return {
      ...forces,
      v0,
      d,
      a,
      Ki,
      s: 0,
      vf: 0,
      Kf: 0,
      dK: -Ki,
      reached: d <= 1e-9,
      stoppedEarly: d > 1e-9,
      ...works,
      agrees: Math.abs(works.Wnet - (0 - Ki)) <= ENERGY_EPSILON,
      status: d <= 1e-9 ? "at-start" : "no-start",
    };
  }

  let s = d;
  let stoppedEarly = false;
  if (a < -1e-12) {
    const sStop = (v0 * v0) / (-2 * a);
    if (sStop < d - 1e-9) {
      s = Math.max(0, sStop);
      stoppedEarly = true;
    }
  }

  const vf2 = Math.max(0, v0 * v0 + 2 * a * s);
  const vf = Math.sqrt(vf2);
  const Kf = kineticEnergy(mass, vf);
  const works = worksAt(s, raw, forces);
  const dK = Kf - Ki;
  return {
    ...forces,
    v0,
    d,
    a,
    Ki,
    s,
    vf,
    Kf,
    dK,
    reached: !stoppedEarly,
    stoppedEarly,
    ...works,
    agrees: Math.abs(works.Wnet - dK) <= Math.max(ENERGY_EPSILON, 0.01 * Math.abs(dK || 1)),
    status: stoppedEarly ? "stopped-early" : "reached",
  };
}

function worksAt(s, raw, forces = evaluateForces(raw)) {
  const distance = Math.max(0, s);
  const Wapp = workByForce(forces.force, distance, forces.thetaDeg);
  const Wfric = forces.frictionOn ? -forces.fkMag * distance : null;
  const Wopp = forces.oppose > FORCE_EPSILON ? -forces.oppose * distance : null;
  const WN = 0;
  const Wg = 0;
  const Wnet = Wapp + (Wfric ?? 0) + (Wopp ?? 0);
  return { Wapp, Wfric, Wopp, WN, Wg, Wnet };
}

export function cameraObjectCount() {
  return 1;
}

function durationFor(pred) {
  const { v0, a, s, status } = pred;
  let t = 2;
  if (status === "no-start" || status === "at-start") t = 1.5;
  else if (Math.abs(a) < 1e-12) t = v0 > VEL_EPSILON ? s / v0 : 1.5;
  else if (pred.stoppedEarly) t = v0 / Math.abs(a);
  else {
    const disc = v0 * v0 + 2 * a * s;
    const root = Math.sqrt(Math.max(0, disc));
    t = a > 0 ? (-v0 + root) / a : (v0 - root) / Math.abs(a);
  }
  return clamp((Number.isFinite(t) ? t : 2) + 0.4, DURATION_MIN, DURATION_MAX);
}

function recordSample(state) {
  const live = liveState(state);
  state.history.push({
    time: state.time,
    x: live.x,
    s: live.s,
    v: live.v,
    a: live.a,
    K: live.K,
    Wapp: live.Wapp,
    Wfric: live.Wfric ?? 0,
    Wopp: live.Wopp ?? 0,
    Wnet: live.Wnet,
    Fnetx: live.Fnetx,
  });
  if (state.showTrail !== false) {
    state.trail.push({ x: live.x, time: state.time });
    if (state.trail.length > 240) state.trail.shift();
  }
}

export function createState(raw = {}) {
  const scenario = scenarioById(raw.scenario || raw.id);
  const mass = clampMass(raw.mass ?? scenario.mass);
  const v0 = clampSpeed(raw.v0 ?? scenario.v0);
  const force = clampForce(raw.force ?? scenario.force);
  const thetaDeg = normalizeAngleDeg(raw.thetaDeg ?? scenario.thetaDeg);
  const d = clampDisp(raw.d ?? scenario.d);
  const frictionOn = raw.frictionOn ?? scenario.frictionOn;
  const mu = clampMu(raw.mu ?? scenario.mu);
  const oppose = clampForce(raw.oppose ?? scenario.oppose);
  const pred = predictedOutcome({ mass, v0, force, thetaDeg, d, frictionOn, mu, oppose });
  const duration = clamp(Number(raw.duration) || durationFor(pred), DURATION_MIN, DURATION_MAX);
  const state = {
    scenario: scenario.id,
    mass,
    v0,
    force,
    thetaDeg,
    d,
    frictionOn: Boolean(frictionOn),
    mu,
    oppose,
    g: G,
    duration,
    time: 0,
    x: 0,
    vx: v0,
    done: false,
    reached: false,
    stoppedEarly: false,
    showVectors: raw.showVectors !== false,
    showVelocity: raw.showVelocity !== false,
    showAccel: raw.showAccel !== false,
    showNet: raw.showNet !== false,
    showTrail: raw.showTrail !== false,
    history: [],
    trail: [],
  };
  recordSample(state);
  return state;
}

export function liveState(state) {
  const forces = evaluateForces({ ...state, vx: state.vx });
  const s = clamp(state.x, 0, Math.max(state.d, state.x));
  const works = worksAt(Math.max(0, state.x), state, forces);
  const v = Math.max(0, state.vx);
  const K = kineticEnergy(state.mass, v);
  const Ki = kineticEnergy(state.mass, state.v0);
  const a = forces.Fnetx / Math.max(state.mass, 1e-9);
  const pred = predictedOutcome(state);
  return {
    ...forces,
    time: state.time,
    x: state.x,
    s: Math.max(0, state.x),
    v,
    vx: state.vx,
    a,
    K,
    Ki,
    dK: K - Ki,
    d: state.d,
    v0: state.v0,
    done: state.done,
    reached: state.reached,
    stoppedEarly: state.stoppedEarly,
    ...works,
    agrees: Math.abs(works.Wnet - (K - Ki)) <= Math.max(ENERGY_EPSILON, 0.02 * Math.abs(K - Ki || 1)),
    pred,
    motion: motionLabel(state, forces, a),
  };
}

function motionLabel(state, forces, a) {
  if (state.stoppedEarly || (state.done && !state.reached)) return "Stopped early";
  if (state.reached) return "Reached endpoint";
  if (Math.abs(state.vx) <= VEL_EPSILON && forces.Fnetx <= FORCE_EPSILON) return "At rest";
  if (Math.abs(a) < 0.05) return "Constant speed";
  if (a > 0) return "Speeding up";
  return "Slowing down";
}

export function snapshot(state) {
  const live = liveState(state);
  const pred = live.pred;
  return {
    time: state.time,
    scenario: state.scenario,
    mass: live.mass,
    v0: live.v0,
    v: live.v,
    vf: pred.vf,
    force: live.force,
    thetaDeg: live.thetaDeg,
    d: live.d,
    s: live.s,
    x: live.x,
    a: live.a,
    Fx: live.Fx,
    Fy: live.Fy,
    N: live.N,
    fkMag: live.fkMag,
    Fnetx: live.Fnetx,
    oppose: live.oppose,
    frictionOn: live.frictionOn,
    mu: live.mu,
    Ki: live.Ki,
    K: live.K,
    Kf: pred.Kf,
    dK: live.dK,
    Wapp: live.Wapp,
    Wfric: live.Wfric,
    Wopp: live.Wopp,
    WN: live.WN,
    Wg: live.Wg,
    Wnet: live.Wnet,
    reached: live.reached,
    stoppedEarly: live.stoppedEarly,
    done: live.done,
    agrees: live.agrees,
    motion: live.motion,
    predWnet: pred.Wnet,
    predKf: pred.Kf,
    predS: pred.s,
  };
}

export function reset(state) {
  return createState({
    scenario: state.scenario,
    mass: state.mass,
    v0: state.v0,
    force: state.force,
    thetaDeg: state.thetaDeg,
    d: state.d,
    frictionOn: state.frictionOn,
    mu: state.mu,
    oppose: state.oppose,
    duration: state.duration,
    showVectors: state.showVectors,
    showVelocity: state.showVelocity,
    showAccel: state.showAccel,
    showNet: state.showNet,
    showTrail: state.showTrail,
  });
}

export function stepTo(state, targetTime) {
  const goal = clamp(targetTime, 0, state.duration);
  if (goal + 1e-12 < state.time) return state;
  while (state.time + 1e-12 < goal) {
    if (state.done) {
      state.time = goal;
      break;
    }
    const dt = Math.min(DT, goal - state.time);
    const forces = evaluateForces({ ...state, vx: state.vx });
    const a = forces.Fnetx / Math.max(state.mass, 1e-9);

    if (state.x >= state.d - 1e-9) {
      state.x = state.d;
      state.done = true;
      state.reached = true;
      state.stoppedEarly = false;
      const pred = predictedOutcome(state);
      state.vx = pred.vf;
      state.time = goal;
      recordSample(state);
      break;
    }

    if (state.vx <= VEL_EPSILON && forces.Fnetx <= FORCE_EPSILON) {
      state.vx = 0;
      state.done = true;
      state.reached = state.x >= state.d - 1e-6;
      state.stoppedEarly = !state.reached && state.d > 1e-9;
      state.time = goal;
      recordSample(state);
      break;
    }

    let vx = state.vx + a * dt;
    if (state.vx > VEL_EPSILON && vx < 0 && a < 0) {
      const tStop = state.vx / Math.max(-a, 1e-12);
      const used = Math.min(dt, tStop);
      state.x += state.vx * used + 0.5 * a * used * used;
      state.vx = 0;
      state.time += used;
      state.done = true;
      state.reached = state.x >= state.d - 1e-6;
      state.stoppedEarly = !state.reached;
      if (state.x > state.d) state.x = state.d;
      recordSample(state);
      break;
    }

    state.x += state.vx * dt + 0.5 * a * dt * dt;
    state.vx = vx;
    state.time += dt;
    if (state.x >= state.d) {
      state.x = state.d;
      state.vx = Math.max(0, state.vx);
      state.done = true;
      state.reached = true;
      state.stoppedEarly = false;
    }
    recordSample(state);
  }
  return state;
}

export function setMass(state, mass) {
  state.mass = clampMass(mass);
  return dirty(state);
}

export function setSpeed(state, v0) {
  state.v0 = clampSpeed(v0);
  if (state.time < 1e-12) state.vx = state.v0;
  return dirty(state);
}

export function setForce(state, force) {
  state.force = clampForce(force);
  return dirty(state);
}

export function setTheta(state, deg) {
  state.thetaDeg = normalizeAngleDeg(deg);
  return dirty(state);
}

export function setDisp(state, d) {
  state.d = clampDisp(d);
  return dirty(state);
}

export function setFriction(state, on) {
  state.frictionOn = Boolean(on);
  return dirty(state);
}

export function setMu(state, mu) {
  state.mu = clampMu(mu);
  return dirty(state);
}

export function setOppose(state, oppose) {
  state.oppose = clampForce(oppose);
  return dirty(state);
}

function dirty(state) {
  if (state.time > 1e-12 || state.done) return reset(state);
  state.history = [];
  state.trail = [];
  recordSample(state);
  return state;
}

export function historySeries(state) {
  return state.history.map((sample) => ({ ...sample }));
}

export function sampleHistory(state, t) {
  const history = state.history;
  if (!history.length) return { time: t, x: 0, s: 0 };
  if (t <= history[0].time) return history[0];
  const last = history[history.length - 1];
  if (t >= last.time) return last;
  for (let i = 1; i < history.length; i += 1) {
    if (history[i].time >= t) return history[i - 1];
  }
  return last;
}

export function motionDiagramSamples(state) {
  const out = [];
  for (let t = 0; t <= state.time + 1e-9; t += DIAGRAM_DT) {
    out.push(sampleHistory(state, t));
  }
  return out;
}

export function generateChallenge(rng = Math.random) {
  const roll = rng();
  if (roll < 0.2) {
    return {
      type: "find-w",
      prompt: "A 10 N force acts for 5.0 m at 0° to the displacement. Find the work.",
      givens: [
        { label: "F", value: "10 N" },
        { label: "d", value: "5.0 m" },
        { label: "θ", value: "0°" },
      ],
      params: { scenario: "along" },
      targets: { Wapp: 50, Wnet: 50 },
      unknownLabel: "W",
      goalLabel: formatUnsigned(50, "J"),
      solutionHint: "W = F d cosθ = 10 × 5 × 1 = 50 J. Positive work increases kinetic energy.",
    };
  }
  if (roll < 0.4) {
    return {
      type: "find-kf",
      prompt: "Preset A: m = 2 kg, vᵢ = 2 m/s, W_net = 50 J. Find the final kinetic energy.",
      givens: [
        { label: "m", value: "2.0 kg" },
        { label: "vᵢ", value: "2.0 m/s" },
        { label: "W_net", value: "50 J" },
      ],
      params: { scenario: "along" },
      targets: { Kf: 54 },
      unknownLabel: "K_f",
      goalLabel: formatUnsigned(54, "J"),
      solutionHint: "Kᵢ = ½(2)(4) = 4 J. K_f = Kᵢ + W_net = 54 J. Then v_f = √(2K_f/m) ≈ 7.35 m/s.",
    };
  }
  if (roll < 0.6) {
    return {
      type: "perp-w",
      prompt: "A 12 N force is perpendicular to a 6.0 m displacement. Find the work done by that force.",
      givens: [
        { label: "F", value: "12 N" },
        { label: "d", value: "6.0 m" },
        { label: "θ", value: "90°" },
      ],
      params: { scenario: "perp" },
      targets: { Wapp: 0, Wnet: 0 },
      unknownLabel: "W",
      goalLabel: formatUnsigned(0, "J"),
      solutionHint: "cos 90° = 0, so W = 0. The object can keep moving; zero work is not zero force or zero speed.",
    };
  }
  if (roll < 0.8) {
    return {
      type: "find-vf",
      prompt: "m = 2 kg, vᵢ = 6 m/s, F = 8 N opposite the 3.0 m displacement. Find v_f.",
      givens: [
        { label: "m", value: "2.0 kg" },
        { label: "vᵢ", value: "6.0 m/s" },
        { label: "W_net", value: "−24 J" },
      ],
      params: { scenario: "negative" },
      targets: { vf: Math.sqrt(12), Kf: 12 },
      unknownLabel: "v_f",
      goalLabel: `${Math.sqrt(12).toFixed(2)} m/s`,
      solutionHint: "W_net = −24 J, Kᵢ = 36 J, K_f = 12 J. v_f = √(2K_f/m) = √12 ≈ 3.46 m/s. K cannot go negative.",
    };
  }
  return {
    type: "friction-net",
    prompt: "Sliding: m = 2 kg, F = 10 N, μ_k = 0.20, d = 4.0 m, g = 9.8 m/s². Find W_net.",
    givens: [
      { label: "F", value: "10 N" },
      { label: "μ_k", value: "0.20" },
      { label: "d", value: "4.0 m" },
    ],
    params: { scenario: "friction" },
    targets: { Wnet: 24.32, Wapp: 40 },
    unknownLabel: "W_net",
    goalLabel: formatUnsigned(24.32, "J"),
    solutionHint: "N = mg = 19.6 N. f_k = 3.92 N. W_app = 40 J, W_fric = −15.68 J, W_net = 24.32 J = ΔK.",
  };
}

export function challengeTolerance(value) {
  return Math.max(0.08, 0.04 * Math.abs(value || 1));
}

export function evaluateChallenge(measured, spec) {
  if (spec.type === "find-w" || spec.type === "perp-w") {
    return { ok: Math.abs((measured.Wapp ?? 0) - spec.targets.Wapp) <= challengeTolerance(spec.targets.Wapp), Wapp: measured.Wapp };
  }
  if (spec.type === "find-kf") {
    return { ok: Math.abs((measured.Kf ?? measured.K ?? 0) - spec.targets.Kf) <= challengeTolerance(spec.targets.Kf), Kf: measured.Kf };
  }
  if (spec.type === "find-vf") {
    return { ok: Math.abs((measured.vf ?? measured.v ?? 0) - spec.targets.vf) <= challengeTolerance(spec.targets.vf), vf: measured.vf };
  }
  if (spec.type === "friction-net") {
    return { ok: Math.abs((measured.Wnet ?? 0) - spec.targets.Wnet) <= challengeTolerance(spec.targets.Wnet), Wnet: measured.Wnet };
  }
  return { ok: Math.abs((measured.Wnet ?? 0) - (spec.targets.Wnet ?? 0)) <= challengeTolerance(spec.targets.Wnet) };
}

export function teacherReport(state) {
  const snap = snapshot(state);
  const stop = snap.stoppedEarly
    ? ` · stops at ${formatUnsigned(snap.predS, "m")} of requested ${formatUnsigned(snap.d, "m")}`
    : snap.reached
      ? " · endpoint reached"
      : "";
  return (
    `${snap.motion} · W_net = ${formatSigned(snap.Wnet, "J")} · ΔK = ${formatSigned(snap.dK, "J")}` +
    ` · closed form W_net = ${formatSigned(snap.predWnet, "J")}, K_f = ${formatUnsigned(snap.predKf, "J")}${stop}`
  );
}
