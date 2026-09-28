/**
 * One-dimensional systems and center of mass for Simulation 2.1.
 * Objects are an array so later labs can add members without rewriting the CM identities.
 * Positions follow x = x0 + v0 t + ½ a t² with accelerations from F_ext on the selected
 * system plus equal-and-opposite internal forces between A and B.
 */

import { clamp, formatSigned, formatUnsigned } from "./kinematics1d.js";

export { clamp, formatSigned, formatUnsigned };
export const DT = 0.01;
export const DIAGRAM_DT = 0.5;
export const DURATION_MIN = 1;
export const DURATION_MAX = 20;
export const MASS_MIN = 0.1;
export const MASS_MAX = 20;
export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 2, 4];
export const AXIS_PAD = 8;

export const SYSTEMS = [
  { id: "AB", label: "A + B", members: ["A", "B"] },
  { id: "A", label: "A only", members: ["A"] },
  { id: "B", label: "B only", members: ["B"] },
];

export const PRESETS = [
  {
    id: "equal-mass",
    label: "Equal masses",
    objects: [
      { id: "A", name: "A", mass: 2, x: -10, v: 2 },
      { id: "B", name: "B", mass: 2, x: 10, v: 2 },
    ],
    system: "AB",
    externalForce: 0,
    internalForce: 0,
  },
  {
    id: "unequal-mass",
    label: "Unequal masses",
    objects: [
      { id: "A", name: "A", mass: 1, x: 0, v: 4 },
      { id: "B", name: "B", mass: 4, x: 10, v: 0 },
    ],
    system: "AB",
    externalForce: 0,
    internalForce: 0,
  },
  {
    id: "opposite",
    label: "Opposite velocities",
    objects: [
      { id: "A", name: "A", mass: 1, x: -5, v: 4 },
      { id: "B", name: "B", mass: 1, x: 5, v: -4 },
    ],
    system: "AB",
    externalForce: 0,
    internalForce: 0,
  },
  {
    id: "zero-cm-v",
    label: "Zero CM velocity",
    objects: [
      { id: "A", name: "A", mass: 2, x: -6, v: 3 },
      { id: "B", name: "B", mass: 3, x: 9, v: -2 },
    ],
    system: "AB",
    externalForce: 0,
    internalForce: 0,
  },
  {
    id: "moving-system",
    label: "Moving system",
    objects: [
      { id: "A", name: "A", mass: 2, x: -8, v: 5 },
      { id: "B", name: "B", mass: 3, x: 4, v: 1 },
    ],
    system: "AB",
    externalForce: 0,
    internalForce: 0,
  },
  {
    id: "external-force",
    label: "External force",
    objects: [
      { id: "A", name: "A", mass: 2, x: -8, v: 0 },
      { id: "B", name: "B", mass: 3, x: 8, v: 0 },
    ],
    system: "AB",
    externalForce: 10,
    internalForce: 0,
  },
  {
    id: "push-apart",
    label: "Internal push-apart",
    objects: [
      { id: "A", name: "A", mass: 2, x: -2, v: 0 },
      { id: "B", name: "B", mass: 4, x: 2, v: 0 },
    ],
    system: "AB",
    externalForce: 0,
    internalForce: 10,
  },
];

export function memberIds(systemId) {
  const found = SYSTEMS.find((s) => s.id === systemId);
  return found ? [...found.members] : ["A", "B"];
}

export function clampMass(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return clamp(n, MASS_MIN, MASS_MAX);
}

function normalizeObject(raw, fallbackId, fallbackName) {
  const id = raw?.id || fallbackId;
  return {
    id,
    name: raw?.name || fallbackName || id,
    mass: clampMass(raw?.mass ?? 1),
    x0: Number.isFinite(Number(raw?.x ?? raw?.x0)) ? Number(raw.x ?? raw.x0) : 0,
    v0: Number.isFinite(Number(raw?.v ?? raw?.v0)) ? Number(raw.v ?? raw.v0) : 0,
  };
}

export function defaultObjects() {
  return PRESETS[0].objects.map((o) => normalizeObject(o, o.id, o.name));
}

export function totalMass(objects) {
  return objects.reduce((sum, obj) => sum + obj.mass, 0);
}

export function weightedMean(objects, key) {
  const M = totalMass(objects);
  if (M <= 0) return 0;
  return objects.reduce((sum, obj) => sum + obj.mass * obj[key], 0) / M;
}

export function totalMomentum(objects) {
  return objects.reduce((sum, obj) => sum + obj.mass * obj.v, 0);
}

export function cmAcceleration(externalForce, mass) {
  if (!(mass > 0)) return 0;
  return externalForce / mass;
}

export function selectedObjects(objects, systemId) {
  const ids = new Set(memberIds(systemId));
  return objects.filter((obj) => ids.has(obj.id));
}

export function pairForceClass(systemId) {
  return systemId === "AB" ? "internal" : "external";
}

/**
 * External force is applied to the selected system and shared in proportion to mass,
 * so every member gets a_CM = F_ext / M_system. Internal force is +F on B and −F on A.
 */
export function accelerations(state) {
  const members = new Set(memberIds(state.system));
  const selected = state.objects.filter((obj) => members.has(obj.id));
  const M = totalMass(selected);
  const out = {};
  for (const obj of state.objects) {
    let force = 0;
    if (members.has(obj.id) && M > 0) force += (obj.mass / M) * state.externalForce;
    if (obj.id === "A") force -= state.internalForce;
    if (obj.id === "B") force += state.internalForce;
    out[obj.id] = obj.mass > 0 ? force / obj.mass : 0;
  }
  return out;
}

export function liveObjects(state, t = state.time) {
  const acc = accelerations(state);
  return state.objects.map((obj) => {
    const a = acc[obj.id] || 0;
    return {
      ...obj,
      a,
      x: obj.x0 + obj.v0 * t + 0.5 * a * t * t,
      v: obj.v0 + a * t,
    };
  });
}

export function systemOf(objects, systemId, externalForce = 0) {
  const selected = selectedObjects(objects, systemId);
  const M = totalMass(selected);
  const xCM = weightedMean(selected, "x");
  const vCM = weightedMean(selected, "v");
  const p = totalMomentum(selected);
  const aCM = selected.length
    ? selected.reduce((sum, obj) => sum + obj.mass * (obj.a || 0), 0) / Math.max(M, 1e-12)
    : 0;
  return {
    M,
    xCM,
    vCM,
    p,
    aCM,
    aFromForce: cmAcceleration(externalForce, M),
  };
}

export function createState({
  objects,
  system = "AB",
  externalForce = 0,
  internalForce = 0,
  duration = 10,
} = {}) {
  const list = (objects?.length ? objects : defaultObjects()).map((obj, i) =>
    normalizeObject(obj, i === 0 ? "A" : "B", i === 0 ? "A" : "B"),
  );
  const T = clamp(Number(duration) || 10, DURATION_MIN, DURATION_MAX);
  const state = {
    objects: list,
    system: SYSTEMS.some((s) => s.id === system) ? system : "AB",
    externalForce: Number.isFinite(Number(externalForce)) ? Number(externalForce) : 0,
    internalForce: Number.isFinite(Number(internalForce)) ? Number(internalForce) : 0,
    duration: T,
    time: 0,
    history: [],
  };
  recordSample(state);
  return state;
}

function sampleFrom(state) {
  const live = liveObjects(state);
  const sys = systemOf(live, state.system, state.externalForce);
  return {
    time: state.time,
    objects: live.map((obj) => ({ id: obj.id, x: obj.x, v: obj.v, a: obj.a, mass: obj.mass })),
    xCM: sys.xCM,
    vCM: sys.vCM,
    aCM: sys.aCM,
    p: sys.p,
    M: sys.M,
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
  const live = liveObjects(state);
  const sys = systemOf(live, state.system, state.externalForce);
  const byId = Object.fromEntries(live.map((obj) => [obj.id, obj]));
  return {
    time: state.time,
    system: state.system,
    A: byId.A,
    B: byId.B,
    M: sys.M,
    xCM: sys.xCM,
    vCM: sys.vCM,
    aCM: sys.aCM,
    p: sys.p,
    externalForce: state.externalForce,
    internalForce: state.internalForce,
    pairForceClass: pairForceClass(state.system),
  };
}

export function reset(state) {
  return createState({
    objects: state.objects.map((obj) => ({
      id: obj.id,
      name: obj.name,
      mass: obj.mass,
      x: obj.x0,
      v: obj.v0,
    })),
    system: state.system,
    externalForce: state.externalForce,
    internalForce: state.internalForce,
    duration: state.duration,
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
      return {
        time: t,
        objects: a.objects.map((obj, idx) => ({
          ...obj,
          x: lerp(obj.x, b.objects[idx].x),
          v: lerp(obj.v, b.objects[idx].v),
        })),
        xCM: lerp(a.xCM, b.xCM),
        vCM: lerp(a.vCM, b.vCM),
        aCM: a.aCM,
        p: lerp(a.p, b.p),
        M: a.M,
      };
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
  return state.history.map((sample) => {
    const byId = Object.fromEntries(sample.objects.map((obj) => [obj.id, obj]));
    return {
      time: sample.time,
      xA: byId.A?.x ?? 0,
      xB: byId.B?.x ?? 0,
      xCM: sample.xCM,
      vA: byId.A?.v ?? 0,
      vB: byId.B?.v ?? 0,
      vCM: sample.vCM,
      aCM: sample.aCM,
    };
  });
}

function randInt(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function generateChallenge(rng = Math.random) {
  const roll = rng();
  if (roll < 0.34) {
    const mA = randInt(1, 4, rng);
    const mB = randInt(1, 5, rng);
    const xA = -randInt(2, 10, rng);
    const xB = randInt(2, 12, rng);
    const xCM = (mA * xA + mB * xB) / (mA + mB);
    return {
      type: "xcm",
      prompt: "Find the center of mass of A + B. You can set the masses and positions, then read x_CM.",
      givens: [
        { label: "m_A", value: formatUnsigned(mA, "kg") },
        { label: "x_A", value: formatSigned(xA, "m") },
        { label: "m_B", value: formatUnsigned(mB, "kg") },
        { label: "x_B", value: formatSigned(xB, "m") },
      ],
      params: {
        objects: [
          { id: "A", name: "A", mass: mA, x: xA, v: 0 },
          { id: "B", name: "B", mass: mB, x: xB, v: 0 },
        ],
        system: "AB",
        externalForce: 0,
        internalForce: 0,
        duration: 6,
      },
      targets: { xCM },
      unknownLabel: "x_CM = (m_A x_A + m_B x_B) / (m_A + m_B)",
      goalLabel: "center-of-mass position",
      solutionHint: `x_CM = (${mA}·${xA} + ${mB}·${xB}) / ${mA + mB} = ${xCM.toFixed(2)} m`,
    };
  }

  if (roll < 0.67) {
    const mA = randInt(1, 3, rng);
    const mB = randInt(2, 5, rng);
    const vA = randInt(2, 8, rng);
    const vB = -randInt(1, 4, rng);
    const vCM = (mA * vA + mB * vB) / (mA + mB);
    return {
      type: "vcm",
      prompt: "Find the center-of-mass velocity of A + B.",
      givens: [
        { label: "m_A", value: formatUnsigned(mA, "kg") },
        { label: "v_A", value: formatSigned(vA, "m/s") },
        { label: "m_B", value: formatUnsigned(mB, "kg") },
        { label: "v_B", value: formatSigned(vB, "m/s") },
      ],
      params: {
        objects: [
          { id: "A", name: "A", mass: mA, x: -6, v: vA },
          { id: "B", name: "B", mass: mB, x: 8, v: vB },
        ],
        system: "AB",
        externalForce: 0,
        internalForce: 0,
        duration: 8,
      },
      targets: { vCM },
      unknownLabel: "v_CM = (m_A v_A + m_B v_B) / (m_A + m_B)",
      goalLabel: "center-of-mass velocity",
      solutionHint: `v_CM = (${mA}·${vA} + ${mB}·${vB}) / ${mA + mB} = ${vCM.toFixed(2)} m/s`,
    };
  }

  const mA = 2;
  const mB = 3;
  const F = 10;
  const aCM = F / (mA + mB);
  return {
    type: "acm",
    prompt: "An external force acts on A + B. Find the acceleration of the center of mass.",
    givens: [
      { label: "m_A", value: formatUnsigned(mA, "kg") },
      { label: "m_B", value: formatUnsigned(mB, "kg") },
      { label: "F_ext", value: formatSigned(F, "N") },
    ],
    params: {
      objects: [
        { id: "A", name: "A", mass: mA, x: -8, v: 0 },
        { id: "B", name: "B", mass: mB, x: 8, v: 0 },
      ],
      system: "AB",
      externalForce: F,
      internalForce: 0,
      duration: 6,
    },
    targets: { aCM },
    unknownLabel: "a_CM = F_ext / M",
    goalLabel: "center-of-mass acceleration",
    solutionHint: `a_CM = ${F} / ${mA + mB} = ${aCM.toFixed(2)} m/s². Rearranging the objects does not change a_CM.`,
  };
}

export function challengeTolerance(value) {
  return Math.max(0.12, 0.04 * Math.abs(value));
}

export function evaluateChallenge(measured, spec) {
  if (spec.type === "xcm") {
    const err = Math.abs(measured.xCM - spec.targets.xCM);
    return { ok: err <= challengeTolerance(spec.targets.xCM), xCM: measured.xCM };
  }
  if (spec.type === "vcm") {
    const err = Math.abs(measured.vCM - spec.targets.vCM);
    return { ok: err <= challengeTolerance(spec.targets.vCM), vCM: measured.vCM };
  }
  const err = Math.abs(measured.aCM - spec.targets.aCM);
  return { ok: err <= challengeTolerance(spec.targets.aCM), aCM: measured.aCM };
}

export function teacherReport(state) {
  const snap = snapshot(state);
  const live = liveObjects(state);
  const all = systemOf(live, "AB", state.externalForce);
  const aLabel =
    snap.pairForceClass === "internal"
      ? `a_CM = F_ext / M = ${formatSigned(snap.aCM, "m/s²")}`
      : `a_CM = (F_ext ± pair) / M = ${formatSigned(snap.aCM, "m/s²")}`;
  return (
    `x_CM = Σ m x / M = ${formatSigned(snap.xCM, "m")} · ` +
    `v_CM = Σ m v / M = ${formatSigned(snap.vCM, "m/s")} · ` +
    `M = ${formatUnsigned(snap.M, "kg")} · ` +
    `p = M v_CM = ${formatSigned(snap.p, "kg·m/s")} · ` +
    `${aLabel} · ` +
    `A↔B force is ${snap.pairForceClass} for system ${state.system} · ` +
    `whole-track A+B: x_CM=${formatSigned(all.xCM, "m")} v_CM=${formatSigned(all.vCM, "m/s")}`
  );
}
