/**
 * Newton's third-law interactions for Simulation 2.3.
 * One interaction state derives both forces. Students never edit the pair independently.
 * Positions follow x = x0 + v0 t + ½ a t² when Motion mode is on; a = F_net / m per object.
 */

import { clamp, formatSigned, formatUnsigned } from "./kinematics1d.js";
import {
  CARDINALS,
  calculateForceComponents,
  clampForce,
  directionInfo,
  netDirection,
  normalizeAngle,
} from "./forces.js";

export { CARDINALS, clamp, clampForce, directionInfo, formatSigned, formatUnsigned, netDirection, normalizeAngle };

export const DT = 0.01;
export const DIAGRAM_DT = 0.5;
export const DURATION_MIN = 1;
export const DURATION_MAX = 20;
export const MASS_MIN = 0.1;
export const MASS_MAX = 100;
export const DIST_MIN = 0.5;
export const DIST_MAX = 20;
export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 2, 4];
export const PAIR_EPS = 0.001;
/** Educational G so F = G m_A m_B / r² is readable. Not the SI constant. */
export const G_TEACH = 10;

export function clampMass(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return clamp(n, MASS_MIN, MASS_MAX);
}

export function oppositeDirection(deg) {
  return normalizeAngle(Number(deg) + 180);
}

export function areOppositeDirections(a, b, tol = 2) {
  const want = oppositeDirection(a);
  const got = normalizeAngle(b);
  const delta = Math.abs(((got - want + 180) % 360) - 180);
  return delta <= tol;
}

export function createInteractionPair({
  interactionId = "interaction-1",
  source = "A",
  target = "B",
  magnitude = 20,
  direction = 0,
} = {}) {
  const mag = clampForce(magnitude);
  const dir = normalizeAngle(direction);
  const aOnB = calculateForceComponents(mag, dir);
  const bOnA = calculateForceComponents(mag, oppositeDirection(dir));
  return {
    forceAonB: {
      id: `${interactionId}-AonB`,
      interactionId,
      source,
      target,
      magnitude: mag,
      direction: dir,
      x: aOnB.x,
      y: aOnB.y,
      label: `${source} on ${target}`,
    },
    forceBonA: {
      id: `${interactionId}-BonA`,
      interactionId,
      source: target,
      target: source,
      magnitude: mag,
      direction: oppositeDirection(dir),
      x: bOnA.x,
      y: bOnA.y,
      label: `${target} on ${source}`,
    },
  };
}

export function isThirdLawPair(forceA, forceB) {
  if (!forceA || !forceB) return false;
  return (
    forceA.source === forceB.target &&
    forceA.target === forceB.source &&
    forceA.target !== forceB.target &&
    Math.abs(forceA.magnitude - forceB.magnitude) <= PAIR_EPS &&
    areOppositeDirections(forceA.direction, forceB.direction) &&
    forceA.interactionId === forceB.interactionId
  );
}

function normalizeObject(raw, fallbackId, fallbackName) {
  return {
    id: raw?.id || fallbackId,
    name: raw?.name || fallbackName || fallbackId,
    mass: clampMass(raw?.mass ?? 1),
    x0: Number.isFinite(Number(raw?.x ?? raw?.x0)) ? Number(raw.x ?? raw.x0) : 0,
    y0: Number.isFinite(Number(raw?.y ?? raw?.y0)) ? Number(raw.y ?? raw.y0) : 0,
    vx0: Number.isFinite(Number(raw?.vx ?? raw?.vx0)) ? Number(raw.vx ?? raw.vx0) : 0,
    vy0: Number.isFinite(Number(raw?.vy ?? raw?.vy0)) ? Number(raw.vy ?? raw.vy0) : 0,
  };
}

function objectDistance(A, B) {
  return Math.hypot((B.x0 ?? B.x) - (A.x0 ?? A.x), (B.y0 ?? B.y) - (A.y0 ?? A.y));
}

export function gravityMagnitude(mA, mB, r) {
  const dist = clamp(Number(r) || DIST_MIN, DIST_MIN, DIST_MAX);
  return clampForce((G_TEACH * clampMass(mA) * clampMass(mB)) / (dist * dist));
}

export const SCENARIOS = [
  {
    id: "two-boxes",
    label: "Two boxes push",
    type: "contact",
    A: { name: "Object A", mass: 5, x: -2.5, y: 0 },
    B: { name: "Object B", mass: 5, x: 2.5, y: 0 },
    magnitude: 20,
    direction: 0,
    visual: { floor: true, connector: "contact" },
  },
  {
    id: "unequal-mass",
    label: "Unequal masses",
    type: "contact",
    A: { name: "Object A", mass: 2, x: -2.5, y: 0 },
    B: { name: "Object B", mass: 10, x: 2.5, y: 0 },
    magnitude: 30,
    direction: 0,
    visual: { floor: true, connector: "contact" },
  },
  {
    id: "hand-box",
    label: "Hand and box",
    type: "contact",
    A: { name: "Hand", mass: 4, x: -2.5, y: 0 },
    B: { name: "Box", mass: 8, x: 2.5, y: 0 },
    magnitude: 25,
    direction: 0,
    visual: { floor: true, connector: "contact" },
  },
  {
    id: "tug-of-war",
    label: "Tug of war",
    type: "tension",
    A: { name: "Person A", mass: 5, x: -4, y: 0 },
    B: { name: "Person B", mass: 5, x: 4, y: 0 },
    magnitude: 40,
    direction: 180,
    visual: { floor: true, connector: "rope" },
  },
  {
    id: "hanging-earth",
    label: "Object and Earth",
    type: "gravity",
    A: { name: "Earth", mass: 50, x: 0, y: 5 },
    B: { name: "Object", mass: 2, x: 0, y: 0 },
    magnitude: 0,
    direction: 270,
    visual: { floor: false, connector: "gravity" },
  },
  {
    id: "gravity-pair",
    label: "Gravitational pair",
    type: "gravity",
    A: { name: "Mass A", mass: 4, x: -3, y: 0 },
    B: { name: "Mass B", mass: 6, x: 3, y: 0 },
    magnitude: 0,
    direction: 180,
    visual: { floor: false, connector: "gravity" },
  },
  {
    id: "rope-tension",
    label: "Rope tension",
    type: "tension",
    A: { name: "Object A", mass: 3, x: -4, y: 0 },
    B: { name: "Object B", mass: 3, x: 4, y: 0 },
    magnitude: 18,
    direction: 180,
    visual: { floor: true, connector: "rope" },
  },
  {
    id: "magnet-attract",
    label: "Magnet attraction",
    type: "magnet",
    A: { name: "Magnet A", mass: 3, x: -3, y: 0 },
    B: { name: "Magnet B", mass: 3, x: 3, y: 0 },
    magnitude: 16,
    direction: 180,
    visual: { floor: true, connector: "magnet" },
  },
  {
    id: "magnet-repel",
    label: "Magnet repulsion",
    type: "magnet",
    A: { name: "Magnet A", mass: 3, x: -3, y: 0 },
    B: { name: "Magnet B", mass: 3, x: 3, y: 0 },
    magnitude: 16,
    direction: 0,
    visual: { floor: true, connector: "magnet" },
  },
  {
    id: "custom",
    label: "Custom interaction",
    type: "contact",
    A: { name: "Object A", mass: 5, x: -2.5, y: 0 },
    B: { name: "Object B", mass: 5, x: 2.5, y: 0 },
    magnitude: 20,
    direction: 0,
    visual: { floor: true, connector: "contact" },
  },
];

export function scenarioById(id) {
  return SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
}

function extraForce(raw, index) {
  const mag = clampForce(raw?.magnitude);
  const dir = normalizeAngle(raw?.direction ?? 0);
  const parts = calculateForceComponents(mag, dir);
  return {
    id: raw?.id || `extra-${index}`,
    target: raw?.target === "B" ? "B" : "A",
    name: raw?.name || "Applied",
    magnitude: mag,
    direction: dir,
    x: parts.x,
    y: parts.y,
    enabled: raw?.enabled !== false,
  };
}

export function pairMagnitude(state) {
  if (state.interaction.type === "gravity") {
    return gravityMagnitude(state.A.mass, state.B.mass, objectDistance(state.A, state.B));
  }
  return clampForce(state.interaction.magnitude);
}

export function forcePair(state) {
  return createInteractionPair({
    interactionId: state.interaction.id,
    source: state.A.id,
    target: state.B.id,
    magnitude: pairMagnitude(state),
    direction: state.interaction.direction,
  });
}

export function forcesOn(state, objectId) {
  const pair = forcePair(state);
  const out = [];
  if (state.interaction.enabled !== false) {
    if (pair.forceAonB.target === objectId) out.push(pair.forceAonB);
    if (pair.forceBonA.target === objectId) out.push(pair.forceBonA);
  }
  for (const extra of state.extras || []) {
    if (extra.enabled !== false && extra.target === objectId) out.push(extra);
  }
  return out;
}

export function netOn(state, objectId) {
  let x = 0;
  let y = 0;
  for (const force of forcesOn(state, objectId)) {
    x += force.x;
    y += force.y;
  }
  const magnitude = Math.hypot(x, y);
  return { x, y, magnitude, direction: magnitude > PAIR_EPS ? (Math.atan2(y, x) * 180) / Math.PI : 0 };
}

export function pairCriteria(state) {
  const pair = forcePair(state);
  const sameInteraction = pair.forceAonB.interactionId === pair.forceBonA.interactionId;
  const equalMagnitude = Math.abs(pair.forceAonB.magnitude - pair.forceBonA.magnitude) <= PAIR_EPS;
  const opposite = areOppositeDirections(pair.forceAonB.direction, pair.forceBonA.direction);
  const differentObjects = pair.forceAonB.target !== pair.forceBonA.target;
  return {
    sameInteraction,
    equalMagnitude,
    oppositeDirection: opposite,
    differentObjects,
    valid: sameInteraction && equalMagnitude && opposite && differentObjects && isThirdLawPair(pair.forceAonB, pair.forceBonA),
    difference: Math.abs(pair.forceAonB.magnitude - pair.forceBonA.magnitude),
  };
}

export function liveState(state, t = state.time) {
  const netA = netOn(state, "A");
  const netB = netOn(state, "B");
  const aA = {
    x: state.A.mass > 0 ? netA.x / state.A.mass : 0,
    y: state.A.mass > 0 ? netA.y / state.A.mass : 0,
  };
  const aB = {
    x: state.B.mass > 0 ? netB.x / state.B.mass : 0,
    y: state.B.mass > 0 ? netB.y / state.B.mass : 0,
  };
  const moving = Boolean(state.dynamicMode);
  const axA = moving ? aA.x : 0;
  const ayA = moving ? aA.y : 0;
  const axB = moving ? aB.x : 0;
  const ayB = moving ? aB.y : 0;
  return {
    A: {
      ...state.A,
      x: state.A.x0 + state.A.vx0 * t + 0.5 * axA * t * t,
      y: state.A.y0 + state.A.vy0 * t + 0.5 * ayA * t * t,
      vx: state.A.vx0 + axA * t,
      vy: state.A.vy0 + ayA * t,
      ax: aA.x,
      ay: aA.y,
      amx: axA,
      amy: ayA,
      net: netA,
    },
    B: {
      ...state.B,
      x: state.B.x0 + state.B.vx0 * t + 0.5 * axB * t * t,
      y: state.B.y0 + state.B.vy0 * t + 0.5 * ayB * t * t,
      vx: state.B.vx0 + axB * t,
      vy: state.B.vy0 + ayB * t,
      ax: aB.x,
      ay: aB.y,
      amx: axB,
      amy: ayB,
      net: netB,
    },
    pair: forcePair(state),
    criteria: pairCriteria(state),
  };
}

export function createState(raw = {}) {
  const scenario = scenarioById(raw.scenario || raw.id);
  const A = normalizeObject(raw.A || scenario.A, "A", scenario.A.name);
  const B = normalizeObject(raw.B || scenario.B, "B", scenario.B.name);
  A.id = "A";
  B.id = "B";
  const type = raw.type || raw.interaction?.type || scenario.type;
  const direction = normalizeAngle(raw.direction ?? raw.interaction?.direction ?? scenario.direction);
  const userMag = raw.magnitude ?? raw.interaction?.magnitude ?? scenario.magnitude;
  const interaction = {
    id: raw.interaction?.id || "interaction-1",
    type,
    source: "A",
    target: "B",
    magnitude: type === "gravity" ? gravityMagnitude(A.mass, B.mass, objectDistance(A, B)) : clampForce(userMag),
    direction,
    enabled: raw.interaction?.enabled !== false,
  };
  const T = clamp(Number(raw.duration) || 10, DURATION_MIN, DURATION_MAX);
  const state = {
    scenario: scenario.id,
    A,
    B,
    interaction,
    extras: (raw.extras || []).map(extraForce),
    visual: raw.visual || scenario.visual,
    dynamicMode: Boolean(raw.dynamicMode),
    showNetForce: raw.showNetForce !== false,
    duration: T,
    time: 0,
    history: [],
  };
  recordSample(state);
  return state;
}

function sampleFrom(state) {
  const live = liveState(state);
  return {
    time: state.time,
    xA: live.A.x,
    yA: live.A.y,
    xB: live.B.x,
    yB: live.B.y,
    vxA: live.A.vx,
    vxB: live.B.vx,
    axA: live.A.ax,
    ayA: live.A.ay,
    axB: live.B.ax,
    ayB: live.B.ay,
    FAonB: live.pair.forceAonB.magnitude,
    FBonA: live.pair.forceBonA.magnitude,
    FAonBx: live.pair.forceAonB.x,
    FBonAx: live.pair.forceBonA.x,
    FnetAx: live.A.net.x,
    FnetBx: live.B.net.x,
    FnetA: live.A.net.magnitude,
    FnetB: live.B.net.magnitude,
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
  const pair = live.pair;
  return {
    time: state.time,
    scenario: state.scenario,
    A: live.A,
    B: live.B,
    interaction: { ...state.interaction, magnitude: pair.forceAonB.magnitude },
    pair,
    forceAonB: pair.forceAonB,
    forceBonA: pair.forceBonA,
    criteria: live.criteria,
    netA: live.A.net,
    netB: live.B.net,
    extras: state.extras.map((f) => ({ ...f })),
    dynamicMode: state.dynamicMode,
    r: objectDistance(state.A, state.B),
  };
}

export function reset(state) {
  return createState({
    scenario: state.scenario,
    A: { ...state.A, x: state.A.x0, y: state.A.y0, vx: state.A.vx0, vy: state.A.vy0 },
    B: { ...state.B, x: state.B.x0, y: state.B.y0, vx: state.B.vx0, vy: state.B.vy0 },
    interaction: state.interaction,
    extras: state.extras,
    visual: state.visual,
    dynamicMode: state.dynamicMode,
    showNetForce: state.showNetForce,
    duration: state.duration,
    type: state.interaction.type,
    magnitude: state.interaction.magnitude,
    direction: state.interaction.direction,
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
        out[key] = typeof a[key] === "number" ? lerp(a[key], b[key]) : a[key];
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

export function setMass(state, objectId, mass) {
  const target = objectId === "B" ? state.B : state.A;
  target.mass = clampMass(mass);
  if (state.interaction.type === "gravity") {
    state.interaction.magnitude = gravityMagnitude(state.A.mass, state.B.mass, objectDistance(state.A, state.B));
  }
  return state;
}

export function setInteraction(state, { magnitude, direction, type, enabled } = {}) {
  if (type) state.interaction.type = type;
  if (direction != null) state.interaction.direction = normalizeAngle(direction);
  if (enabled != null) state.interaction.enabled = Boolean(enabled);
  if (state.interaction.type === "gravity") {
    state.interaction.magnitude = gravityMagnitude(state.A.mass, state.B.mass, objectDistance(state.A, state.B));
  } else if (magnitude != null) {
    state.interaction.magnitude = clampForce(magnitude);
  }
  return state;
}

export function setSeparation(state, r) {
  const dist = clamp(Number(r) || DIST_MIN, DIST_MIN, DIST_MAX);
  const dx = state.B.x0 - state.A.x0;
  const dy = state.B.y0 - state.A.y0;
  const current = Math.hypot(dx, dy) || 1;
  const scale = dist / current;
  const mx = (state.A.x0 + state.B.x0) / 2;
  const my = (state.A.y0 + state.B.y0) / 2;
  state.A.x0 = mx - (dx * scale) / 2;
  state.B.x0 = mx + (dx * scale) / 2;
  state.A.y0 = my - (dy * scale) / 2;
  state.B.y0 = my + (dy * scale) / 2;
  if (state.interaction.type === "gravity") {
    state.interaction.magnitude = gravityMagnitude(state.A.mass, state.B.mass, dist);
  }
  return state;
}

export function addExtra(state, raw) {
  state.extras.push(extraForce(raw, state.extras.length));
  return state;
}

export function removeExtra(state, id) {
  state.extras = state.extras.filter((f) => f.id !== id);
  return state;
}

function randInt(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function generateChallenge(rng = Math.random) {
  const roll = rng();
  if (roll < 0.12) {
    return {
      type: "identify-pair",
      prompt: "A person pushes a box. Which two forces form a Newton’s third-law pair?",
      givens: [{ label: "Situation", value: "Person pushes box" }],
      params: { scenario: "hand-box" },
      options: [
        { id: "pair", label: "Person on box / box on person" },
        { id: "gn", label: "Gravity / normal" },
        { id: "ff", label: "Applied force / friction" },
        { id: "va", label: "Velocity / acceleration" },
      ],
      targets: { choice: "pair" },
      unknownLabel: "the third-law pair",
      goalLabel: "person on box and box on person",
      solutionHint: "The pair is the interaction: person on box and box on person. Gravity and the normal force both act on the box, so they are not a third-law pair.",
    };
  }
  if (roll < 0.24) {
    const F = randInt(20, 50, rng);
    return {
      type: "magnitude",
      prompt: "A exerts this force on B. How much force does B exert on A?",
      givens: [{ label: "A on B", value: formatUnsigned(F, "N") }],
      params: { scenario: "two-boxes", magnitude: F },
      targets: { F },
      unknownLabel: "B on A",
      goalLabel: "the paired force",
      solutionHint: `B on A is also ${F} N, opposite in direction. Mass does not appear in F_AonB = −F_BonA.`,
    };
  }
  if (roll < 0.36) {
    return {
      type: "masses",
      prompt: "A is much lighter than B. A pushes B with 24 N. What force does B exert on A?",
      givens: [
        { label: "m_A", value: "2.00 kg" },
        { label: "m_B", value: "8.00 kg" },
        { label: "A on B", value: "24.00 N" },
      ],
      params: {
        scenario: "unequal-mass",
        A: { name: "Object A", mass: 2, x: -2.5, y: 0 },
        B: { name: "Object B", mass: 8, x: 2.5, y: 0 },
        magnitude: 24,
      },
      targets: { F: 24 },
      unknownLabel: "B on A",
      goalLabel: "24 N",
      solutionHint: "Still 24 N. Unequal masses change accelerations, not the third-law force magnitudes.",
    };
  }
  if (roll < 0.48) {
    return {
      type: "accel",
      prompt: "The interaction force is 24 N. Which object has the larger acceleration, and what are a_A and a_B?",
      givens: [
        { label: "m_A", value: "2.00 kg" },
        { label: "m_B", value: "8.00 kg" },
        { label: "F", value: "24.00 N" },
      ],
      params: {
        scenario: "unequal-mass",
        A: { name: "Object A", mass: 2, x: -2.5, y: 0 },
        B: { name: "Object B", mass: 8, x: 2.5, y: 0 },
        magnitude: 24,
        dynamicMode: true,
      },
      targets: { aA: 12, aB: 3, larger: "A" },
      unknownLabel: "a = F / m for each object",
      goalLabel: "A has the larger acceleration",
      solutionHint: "The forces are equal. a_A = 24/2 = 12 m/s² and a_B = 24/8 = 3 m/s², opposite directions.",
    };
  }
  if (roll < 0.6) {
    return {
      type: "cancel",
      prompt: "A on B points right and B on A points left, with equal magnitude. Do these forces cancel?",
      givens: [{ label: "Pair", value: "A → B and B ← A" }],
      params: { scenario: "two-boxes" },
      options: [
        { id: "yes", label: "Yes — they are equal and opposite, so F_net = 0" },
        { id: "no", label: "No — they act on different objects" },
      ],
      targets: { choice: "no" },
      unknownLabel: "whether the pair cancels",
      goalLabel: "they do not cancel",
      solutionHint: "Only forces on the same object add to that object’s net force. The pair lives on two free-body diagrams.",
    };
  }
  if (roll < 0.72) {
    return {
      type: "target",
      prompt: "A pushes B to the right. Which object experiences the force “A on B”?",
      givens: [{ label: "Action", value: "A pushes B right" }],
      params: { scenario: "two-boxes" },
      options: [
        { id: "A", label: "Object A" },
        { id: "B", label: "Object B" },
        { id: "both", label: "Both equally" },
      ],
      targets: { choice: "B" },
      unknownLabel: "the target of A on B",
      goalLabel: "B",
      solutionHint: "“A on B” is the force A exerts on B, so B is the target. It belongs on B’s free-body diagram.",
    };
  }
  if (roll < 0.84) {
    return {
      type: "source",
      prompt: "Who is exerting the force in “B on A”?",
      givens: [{ label: "Force", value: "B on A" }],
      params: { scenario: "two-boxes" },
      options: [
        { id: "A", label: "Object A" },
        { id: "B", label: "Object B" },
        { id: "both", label: "The interaction itself, not an object" },
      ],
      targets: { choice: "B" },
      unknownLabel: "the source of B on A",
      goalLabel: "B",
      solutionHint: "The source is B: B exerts that force on A.",
    };
  }
  if (roll < 0.92) {
    return {
      type: "fbd-pair",
      prompt: "Object A’s FBD shows 20 N left. Object B’s FBD shows 20 N right. Are these a Newton’s third-law pair?",
      givens: [
        { label: "A", value: "20 N ←" },
        { label: "B", value: "20 N →" },
      ],
      params: { scenario: "two-boxes", magnitude: 20 },
      options: [
        { id: "yes", label: "Yes — same interaction, equal, opposite, different objects" },
        { id: "no", label: "No — they would cancel if they were a pair" },
      ],
      targets: { choice: "yes" },
      unknownLabel: "whether the FBDs show a pair",
      goalLabel: "yes",
      solutionHint: "They come from the same push, have equal magnitude, opposite direction, and different targets.",
    };
  }
  return {
    type: "false-pair",
    prompt: "A box at rest has gravity down and a normal force up. Are gravity and the normal force a third-law pair?",
    givens: [{ label: "Object", value: "Box: Fg ↓ and FN ↑" }],
    params: { scenario: "two-boxes" },
    options: [
      { id: "yes", label: "Yes — they are equal and opposite" },
      { id: "no", label: "No — both act on the same object" },
    ],
    targets: { choice: "no" },
    unknownLabel: "whether Fg and FN are a pair",
    goalLabel: "no",
    solutionHint: "Equal and opposite on one object is Newton’s second law (balanced forces), not the third-law pair. The pair of gravity is the object pulling Earth up.",
  };
}

export function challengeTolerance(value) {
  return Math.max(0.12, 0.04 * Math.abs(value));
}

export function evaluateChallenge(measured, spec) {
  if (spec.targets?.choice) {
    return { ok: measured.choice === spec.targets.choice, choice: measured.choice };
  }
  if (spec.type === "accel") {
    const aA = Math.hypot(measured.A?.ax ?? 0, measured.A?.ay ?? 0);
    const aB = Math.hypot(measured.B?.ax ?? 0, measured.B?.ay ?? 0);
    const ok =
      Math.abs(aA - spec.targets.aA) <= challengeTolerance(spec.targets.aA) &&
      Math.abs(aB - spec.targets.aB) <= challengeTolerance(spec.targets.aB);
    return { ok, aA, aB };
  }
  const F = spec.targets?.F;
  const FAonB = measured.forceAonB?.magnitude ?? measured.FAonB;
  const FBonA = measured.forceBonA?.magnitude ?? measured.FBonA;
  const ok =
    Math.abs(FAonB - F) <= challengeTolerance(F) && Math.abs(FBonA - F) <= challengeTolerance(F);
  return { ok, FAonB, FBonA };
}

export function teacherReport(state) {
  const snap = snapshot(state);
  const pair = snap.pair;
  const dirA = directionInfo(pair.forceAonB.direction);
  const dirB = directionInfo(pair.forceBonA.direction);
  return (
    `F(${snap.A.name} on ${snap.B.name}) = ${formatUnsigned(pair.forceAonB.magnitude, "N")} ${dirA.arrow} · ` +
    `F(${snap.B.name} on ${snap.A.name}) = ${formatUnsigned(pair.forceBonA.magnitude, "N")} ${dirB.arrow} · ` +
    `difference ${formatUnsigned(snap.criteria.difference, "N")} · ` +
    `|a_A| = F_net,A / m_A = ${formatUnsigned(Math.hypot(snap.A.ax, snap.A.ay), "m/s²")} · ` +
    `|a_B| = F_net,B / m_B = ${formatUnsigned(Math.hypot(snap.B.ax, snap.B.ay), "m/s²")}`
  );
}
