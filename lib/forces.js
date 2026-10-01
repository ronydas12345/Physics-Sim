/**
 * Forces and free-body diagrams for Simulation 2.2.
 * Physics coordinates: +x right, +y up. Angles: 0° right, 90° up, 180° left, 270° down.
 * The free-body diagram is derived from the same force list as the physical scene.
 */

import { clamp, formatSigned, formatUnsigned } from "./kinematics1d.js";

export { clamp, formatSigned, formatUnsigned };

export const DT = 0.01;
export const DIAGRAM_DT = 0.5;
export const DURATION_MIN = 1;
export const DURATION_MAX = 20;
export const MASS_MIN = 0.1;
export const MASS_MAX = 20;
export const G_MIN = 0.1;
export const G_MAX = 30;
export const FORCE_MIN = 0;
export const FORCE_MAX = 200;
export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 2, 4];
export const FORCE_EPSILON = 0.001;
export const DEFAULT_G = 9.8;
export const DEFAULT_MASS = 5;

export const CARDINALS = [
  { deg: 0, id: "right", name: "right", arrow: "→" },
  { deg: 90, id: "up", name: "up", arrow: "↑" },
  { deg: 180, id: "left", name: "left", arrow: "←" },
  { deg: 270, id: "down", name: "down", arrow: "↓" },
];

export const FORCE_TYPES = [
  { id: "gravity", name: "Gravity", symbol: "Fg", source: "Earth", defaultDirection: 270 },
  { id: "normal", name: "Normal", symbol: "FN", source: "Surface", defaultDirection: 90 },
  { id: "applied", name: "Applied", symbol: "Fapp", source: "Pusher", defaultDirection: 0 },
  { id: "friction", name: "Friction", symbol: "Ff", source: "Surface", defaultDirection: 180 },
  { id: "tension", name: "Tension", symbol: "FT", source: "Rope", defaultDirection: 90 },
];

export function clampMass(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_MASS;
  return clamp(n, MASS_MIN, MASS_MAX);
}

export function clampG(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_G;
  return clamp(n, G_MIN, G_MAX);
}

export function clampForce(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return clamp(n, FORCE_MIN, FORCE_MAX);
}

export function normalizeAngle(deg) {
  const n = Number(deg);
  if (!Number.isFinite(n)) return 0;
  let a = n % 360;
  if (a < 0) a += 360;
  return a;
}

export function calculateForceComponents(magnitude, directionDeg) {
  const mag = clampForce(magnitude);
  const rad = (normalizeAngle(directionDeg) * Math.PI) / 180;
  return { x: mag * Math.cos(rad), y: mag * Math.sin(rad) };
}

export function calculateGravity(mass, g = DEFAULT_G) {
  const mag = clampMass(mass) * clampG(g);
  return { x: 0, y: -mag, magnitude: mag, direction: 270 };
}

export function directionInfo(directionDeg) {
  const deg = normalizeAngle(directionDeg);
  const hit = CARDINALS.find((c) => Math.abs(((deg - c.deg + 180) % 360) - 180) < 2);
  if (hit) return { ...hit, deg };
  return { deg, id: "angle", name: `${deg.toFixed(0)}°`, arrow: "↗" };
}

export function netDirection(net) {
  if (!net || net.magnitude < FORCE_EPSILON) return { deg: 0, id: "none", name: "none", arrow: "" };
  return directionInfo((Math.atan2(net.y, net.x) * 180) / Math.PI);
}

export function scaleForceMagnitude(magnitude, maxPx = 72) {
  const mag = Math.max(0, Number(magnitude) || 0);
  const lo = 16;
  return lo + (maxPx - lo) * (1 - Math.exp(-mag / 36));
}

function typeMeta(type) {
  return FORCE_TYPES.find((t) => t.id === type) || FORCE_TYPES[2];
}

export function makeForce(raw = {}) {
  const meta = typeMeta(raw.type);
  const magnitude = clampForce(raw.magnitude);
  const direction = normalizeAngle(raw.direction ?? meta.defaultDirection);
  const parts = calculateForceComponents(magnitude, direction);
  return {
    id: raw.id || meta.id,
    type: meta.id,
    name: raw.name || meta.name,
    symbol: raw.symbol || meta.symbol,
    source: raw.source || meta.source,
    magnitude,
    direction,
    x: parts.x,
    y: parts.y,
    enabled: raw.enabled !== false,
    autoDirection: Boolean(raw.autoDirection),
  };
}

export function createGravityForce({ mass = DEFAULT_MASS, g = DEFAULT_G, enabled = true, source } = {}) {
  const grav = calculateGravity(mass, g);
  return makeForce({
    id: "gravity",
    type: "gravity",
    magnitude: grav.magnitude,
    direction: 270,
    enabled,
    source: source || (Math.abs(g - 9.8) < 0.05 ? "Earth" : "Planet"),
  });
}

export function createNormalForce(magnitude, extras = {}) {
  return makeForce({ id: "normal", type: "normal", magnitude, direction: extras.direction ?? 90, ...extras });
}

export function createAppliedForce(magnitude, direction = 0, extras = {}) {
  return makeForce({ id: extras.id || "applied", type: "applied", magnitude, direction, ...extras });
}

export function createFrictionForce(magnitude, direction = 180, extras = {}) {
  return makeForce({
    id: "friction",
    type: "friction",
    magnitude,
    direction,
    autoDirection: extras.autoDirection !== false,
    ...extras,
  });
}

export function createTensionForce(magnitude, direction = 90, extras = {}) {
  return makeForce({ id: "tension", type: "tension", magnitude, direction, ...extras });
}

export function enabledForces(forces) {
  return (forces || []).filter((f) => f.enabled);
}

export function calculateNetForce(forces) {
  let x = 0;
  let y = 0;
  for (const force of enabledForces(forces)) {
    x += force.x;
    y += force.y;
  }
  const magnitude = Math.hypot(x, y);
  return {
    x,
    y,
    magnitude,
    direction: magnitude < FORCE_EPSILON ? 0 : normalizeAngle((Math.atan2(y, x) * 180) / Math.PI),
  };
}

export function isBalanced(net, epsilon = FORCE_EPSILON) {
  return Math.hypot(net?.x || 0, net?.y || 0) < epsilon;
}

export function calculateAcceleration(netForce, mass) {
  const m = clampMass(mass);
  if (!(m > 0)) return { x: 0, y: 0, magnitude: 0 };
  const x = (netForce?.x || 0) / m;
  const y = (netForce?.y || 0) / m;
  return { x, y, magnitude: Math.hypot(x, y) };
}

function frictionDirectionFrom(state) {
  const applied = enabledForces(state.forces).find((f) => f.type === "applied");
  const ax = applied ? applied.x : 0;
  if (Math.abs(state.vx0) > FORCE_EPSILON) return state.vx0 > 0 ? 180 : 0;
  if (Math.abs(ax) > FORCE_EPSILON) return ax > 0 ? 180 : 0;
  return 180;
}

function syncDerivedForces(state) {
  const grav = calculateGravity(state.mass, state.g);
  state.forces = state.forces.map((force) => {
    if (force.type === "gravity") {
      return makeForce({ ...force, magnitude: grav.magnitude, direction: 270, source: force.source });
    }
    if (force.type === "normal" && state.autoNormal) {
      return makeForce({ ...force, magnitude: grav.magnitude, direction: force.direction || 90 });
    }
    if (force.type === "friction" && force.autoDirection) {
      return makeForce({ ...force, direction: frictionDirectionFrom({ ...state, forces: state.forces }) });
    }
    return makeForce(force);
  });
  return state;
}

export const SCENARIOS = [
  {
    id: "box-on-surface",
    label: "Box on surface",
    mass: 5,
    g: DEFAULT_G,
    x0: 0,
    y0: 0,
    vx0: 0,
    vy0: 0,
    environment: "surface",
    autoNormal: true,
    visual: { floor: true, rope: null },
    forces: ({ mass, g }) => [createGravityForce({ mass, g }), createNormalForce(mass * g)],
  },
  {
    id: "pushed-box",
    label: "Pushed box",
    mass: 5,
    g: DEFAULT_G,
    x0: 0,
    y0: 0,
    vx0: 0,
    vy0: 0,
    environment: "surface",
    autoNormal: true,
    visual: { floor: true, rope: null },
    forces: ({ mass, g }) => [
      createGravityForce({ mass, g }),
      createNormalForce(mass * g),
      createAppliedForce(20, 0),
    ],
  },
  {
    id: "box-with-friction",
    label: "Box with friction",
    mass: 5,
    g: DEFAULT_G,
    x0: 0,
    y0: 0,
    vx0: 0,
    vy0: 0,
    environment: "surface",
    autoNormal: true,
    visual: { floor: true, rope: null },
    forces: ({ mass, g }) => [
      createGravityForce({ mass, g }),
      createNormalForce(mass * g),
      createAppliedForce(30, 0),
      createFrictionForce(10, 180),
    ],
  },
  {
    id: "pulled-box",
    label: "Pulled box",
    mass: 5,
    g: DEFAULT_G,
    x0: 0,
    y0: 0,
    vx0: 0,
    vy0: 0,
    environment: "surface",
    autoNormal: true,
    visual: { floor: true, rope: "right" },
    forces: ({ mass, g }) => [
      createGravityForce({ mass, g }),
      createNormalForce(mass * g),
      createTensionForce(20, 0, { source: "Rope" }),
    ],
  },
  {
    id: "hanging",
    label: "Hanging object",
    mass: 2,
    g: DEFAULT_G,
    x0: 0,
    y0: 0,
    vx0: 0,
    vy0: 0,
    environment: "hanging",
    autoNormal: false,
    visual: { floor: false, rope: "up" },
    forces: ({ mass, g }) => [createGravityForce({ mass, g }), createTensionForce(mass * g, 90)],
  },
  {
    id: "balanced-horizontal",
    label: "Balanced horizontal",
    mass: 5,
    g: DEFAULT_G,
    x0: 0,
    y0: 0,
    vx0: 0,
    vy0: 0,
    environment: "surface",
    autoNormal: true,
    visual: { floor: true, rope: null },
    forces: ({ mass, g }) => [
      createGravityForce({ mass, g }),
      createNormalForce(mass * g),
      createAppliedForce(25, 0, { id: "applied", name: "Applied A" }),
      createAppliedForce(25, 180, { id: "applied-b", name: "Applied B", source: "Pusher" }),
    ],
  },
  {
    id: "unbalanced-horizontal",
    label: "Unbalanced horizontal",
    mass: 5,
    g: DEFAULT_G,
    x0: 0,
    y0: 0,
    vx0: 0,
    vy0: 0,
    environment: "surface",
    autoNormal: true,
    visual: { floor: true, rope: null },
    forces: ({ mass, g }) => [
      createGravityForce({ mass, g }),
      createNormalForce(mass * g),
      createAppliedForce(40, 0, { id: "applied", name: "Applied A" }),
      createAppliedForce(15, 180, { id: "applied-b", name: "Applied B", source: "Pusher" }),
    ],
  },
  {
    id: "coasting",
    label: "Moving, net force 0",
    mass: 5,
    g: DEFAULT_G,
    x0: -8,
    y0: 0,
    vx0: 5,
    vy0: 0,
    environment: "surface",
    autoNormal: true,
    visual: { floor: true, rope: null },
    forces: ({ mass, g }) => [createGravityForce({ mass, g }), createNormalForce(mass * g)],
  },
  {
    id: "custom",
    label: "Custom",
    mass: 5,
    g: DEFAULT_G,
    x0: 0,
    y0: 0,
    vx0: 0,
    vy0: 0,
    environment: "surface",
    autoNormal: false,
    visual: { floor: true, rope: null },
    forces: ({ mass, g }) => [createGravityForce({ mass, g }), createNormalForce(mass * g)],
  },
];

export function scenarioById(id) {
  return SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
}

export function createState(raw = {}) {
  const scenario = scenarioById(raw.scenario || raw.id);
  const mass = clampMass(raw.mass ?? scenario.mass);
  const g = clampG(raw.g ?? scenario.g);
  const ctx = { mass, g };
  const forces = (raw.forces?.length ? raw.forces : scenario.forces(ctx)).map((f) => makeForce(f));
  const T = clamp(Number(raw.duration) || 10, DURATION_MIN, DURATION_MAX);
  const state = {
    scenario: scenario.id,
    mass,
    g,
    x0: Number.isFinite(Number(raw.x0)) ? Number(raw.x0) : scenario.x0,
    y0: Number.isFinite(Number(raw.y0)) ? Number(raw.y0) : scenario.y0,
    vx0: Number.isFinite(Number(raw.vx0)) ? Number(raw.vx0) : scenario.vx0,
    vy0: Number.isFinite(Number(raw.vy0)) ? Number(raw.vy0) : scenario.vy0,
    environment: raw.environment || scenario.environment,
    autoNormal: raw.autoNormal ?? scenario.autoNormal,
    visual: raw.visual || scenario.visual,
    dynamicMode: raw.dynamicMode !== false,
    showNetForce: raw.showNetForce !== false,
    showComponents: Boolean(raw.showComponents),
    showSources: Boolean(raw.showSources),
    duration: T,
    time: 0,
    forces,
    history: [],
  };
  syncDerivedForces(state);
  recordSample(state);
  return state;
}

function motionAccel(state, net, a) {
  if (!state.dynamicMode) return { x: 0, y: 0 };
  if (state.environment === "surface") return { x: a.x, y: 0 };
  if (state.environment === "hanging") return { x: 0, y: a.y };
  return { x: a.x, y: a.y };
}

export function liveState(state, t = state.time) {
  const net = calculateNetForce(state.forces);
  const a = calculateAcceleration(net, state.mass);
  const am = motionAccel(state, net, a);
  return {
    x: state.x0 + state.vx0 * t + 0.5 * am.x * t * t,
    y: state.y0 + state.vy0 * t + 0.5 * am.y * t * t,
    vx: state.vx0 + am.x * t,
    vy: state.vy0 + am.y * t,
    ax: a.x,
    ay: a.y,
    amx: am.x,
    amy: am.y,
    net,
    a,
    balanced: isBalanced(net),
  };
}

function sampleFrom(state) {
  const live = liveState(state);
  return {
    time: state.time,
    x: live.x,
    y: live.y,
    vx: live.vx,
    vy: live.vy,
    ax: live.ax,
    ay: live.ay,
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
  const dir = netDirection(live.net);
  return {
    time: state.time,
    scenario: state.scenario,
    mass: state.mass,
    g: state.g,
    forces: state.forces.map((f) => ({ ...f })),
    enabled: enabledForces(state.forces),
    net: live.net,
    balanced: live.balanced,
    forceState: live.balanced ? "Balanced" : "Unbalanced",
    netDir: dir,
    a: live.a,
    x: live.x,
    y: live.y,
    vx: live.vx,
    vy: live.vy,
    Fg: enabledForces(state.forces).find((f) => f.type === "gravity")?.magnitude ?? 0,
    environment: state.environment,
    dynamicMode: state.dynamicMode,
  };
}

export function reset(state) {
  return createState({
    scenario: state.scenario,
    mass: state.mass,
    g: state.g,
    x0: state.x0,
    y0: state.y0,
    vx0: state.vx0,
    vy0: state.vy0,
    environment: state.environment,
    autoNormal: state.autoNormal,
    visual: state.visual,
    dynamicMode: state.dynamicMode,
    showNetForce: state.showNetForce,
    showComponents: state.showComponents,
    showSources: state.showSources,
    duration: state.duration,
    forces: state.forces,
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
        x: lerp(a.x, b.x),
        y: lerp(a.y, b.y),
        vx: lerp(a.vx, b.vx),
        vy: lerp(a.vy, b.vy),
        ax: a.ax,
        ay: a.ay,
        Fnetx: lerp(a.Fnetx, b.Fnetx),
        Fnety: lerp(a.Fnety, b.Fnety),
        Fnet: lerp(a.Fnet, b.Fnet),
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
  return state.history.map((sample) => ({ ...sample }));
}

export function setMass(state, mass) {
  state.mass = clampMass(mass);
  syncDerivedForces(state);
  return state;
}

export function setGravity(state, g, source) {
  state.g = clampG(g);
  const grav = state.forces.find((f) => f.type === "gravity");
  if (grav && source) grav.source = source;
  syncDerivedForces(state);
  return state;
}

export function setForce(state, id, patch) {
  const idx = state.forces.findIndex((f) => f.id === id);
  if (idx < 0) return state;
  const next = { ...state.forces[idx], ...patch };
  if (next.type === "normal" && ("magnitude" in patch || "enabled" in patch)) state.autoNormal = false;
  if (next.type === "friction" && "direction" in patch) next.autoDirection = false;
  state.forces[idx] = makeForce(next);
  syncDerivedForces(state);
  return state;
}

export function addForce(state, { type = "applied", magnitude = 10, direction = 0 } = {}) {
  const meta = typeMeta(type);
  const used = new Set(state.forces.map((f) => f.id));
  let id = meta.id;
  let n = 2;
  while (used.has(id)) {
    id = `${meta.id}-${n}`;
    n += 1;
  }
  state.forces.push(
    makeForce({
      id,
      type: meta.id,
      name: n === 2 ? meta.name : `${meta.name} ${n - 1}`,
      magnitude,
      direction: direction ?? meta.defaultDirection,
      autoDirection: false,
    }),
  );
  syncDerivedForces(state);
  return state;
}

export function removeForce(state, id) {
  const target = state.forces.find((f) => f.id === id);
  if (!target || target.type === "gravity") return state;
  state.forces = state.forces.filter((f) => f.id !== id);
  return state;
}

function randInt(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function generateChallenge(rng = Math.random) {
  const roll = rng();
  if (roll < 0.2) {
    const params = { scenario: "box-on-surface" };
    return {
      type: "identify",
      prompt: "A box rests on a horizontal table. Which forces act on the box? Enable only those forces, then check.",
      givens: [
        { label: "Situation", value: "Box at rest on a table" },
        { label: "Hint", value: "A free-body diagram includes forces ON the box, not velocity." },
      ],
      params,
      targets: { types: ["gravity", "normal"] },
      unknownLabel: "the forces acting on the box",
      goalLabel: "gravity and the normal force only",
      solutionHint: "Gravity down and the normal force up. Tension and friction are not acting. Velocity is not a force.",
    };
  }
  if (roll < 0.4) {
    const right = randInt(20, 40, rng);
    const left = randInt(5, 15, rng);
    const net = right - left;
    return {
      type: "net",
      prompt: "Two horizontal forces act on the box. Find the net force.",
      givens: [
        { label: "Right", value: formatUnsigned(right, "N") },
        { label: "Left", value: formatUnsigned(left, "N") },
      ],
      params: {
        scenario: "unbalanced-horizontal",
        forces: [
          createGravityForce({ mass: 5, g: DEFAULT_G }),
          createNormalForce(49),
          createAppliedForce(right, 0, { id: "applied", name: "Applied A" }),
          createAppliedForce(left, 180, { id: "applied-b", name: "Applied B" }),
        ],
        autoNormal: true,
      },
      targets: { Fnetx: net, Fnety: 0, Fnet: net },
      unknownLabel: "F_net = ΣF",
      goalLabel: "net force",
      solutionHint: `F_net,x = ${right} − ${left} = ${net} N to the right.`,
    };
  }
  if (roll < 0.55) {
    return {
      type: "balanced",
      prompt: "Equal-and-opposite horizontal forces act on the box. What is the net force?",
      givens: [
        { label: "Right", value: formatUnsigned(25, "N") },
        { label: "Left", value: formatUnsigned(25, "N") },
      ],
      params: { scenario: "balanced-horizontal" },
      targets: { Fnetx: 0, Fnety: 0, Fnet: 0 },
      unknownLabel: "F_net",
      goalLabel: "net force (balanced)",
      solutionHint: "The horizontal forces cancel, and gravity cancels the normal force, so F_net = 0 N.",
    };
  }
  if (roll < 0.7) {
    return {
      type: "direction",
      prompt: "A box is pushed to the right. Which direction does the applied force point?",
      givens: [{ label: "Situation", value: "Pushed box on a table" }],
      params: { scenario: "pushed-box" },
      targets: { type: "applied", direction: 0 },
      unknownLabel: "applied-force direction",
      goalLabel: "right",
      solutionHint: "The applied force points in the direction of the push: 0° (right).",
    };
  }
  if (roll < 0.85) {
    return {
      type: "friction-dir",
      prompt: "A box is sliding to the right. Which direction does kinetic friction act?",
      givens: [{ label: "Motion", value: "Rightward" }],
      params: { scenario: "box-with-friction", vx0: 4 },
      targets: { type: "friction", direction: 180 },
      unknownLabel: "friction direction",
      goalLabel: "left",
      solutionHint: "Kinetic friction opposes the sliding, so it points left (180°).",
    };
  }
  return {
    type: "fbd",
    prompt: "A box is pushed right across a rough table. Enable the forces that belong on its free-body diagram, with the correct directions.",
    givens: [{ label: "Situation", value: "Pushed on a rough horizontal surface" }],
    params: { scenario: "box-with-friction" },
    targets: {
      types: ["gravity", "normal", "applied", "friction"],
      directions: { gravity: 270, normal: 90, applied: 0, friction: 180 },
    },
    unknownLabel: "the free-body diagram",
    goalLabel: "Fg ↓, FN ↑, Fapp →, Ff ←",
    solutionHint: "Gravity down, normal up, applied right, friction left. Do not add velocity or the force the box exerts on the table.",
  };
}

export function challengeTolerance(value) {
  return Math.max(0.15, 0.04 * Math.abs(value));
}

function sameTypes(actual, expected) {
  const a = [...actual].sort().join(",");
  const b = [...expected].sort().join(",");
  return a === b;
}

export function evaluateChallenge(measured, spec) {
  if (spec.type === "identify" || spec.type === "fbd") {
    const types = [...new Set((measured.enabled || []).map((f) => f.type))];
    const typesOk = sameTypes(types, spec.targets.types);
    let dirOk = true;
    if (spec.targets.directions) {
      for (const [type, deg] of Object.entries(spec.targets.directions)) {
        const force = (measured.enabled || []).find((f) => f.type === type);
        if (!force || Math.abs(normalizeAngle(force.direction) - normalizeAngle(deg)) > 2) dirOk = false;
      }
    }
    return { ok: typesOk && dirOk, types };
  }
  if (spec.type === "direction" || spec.type === "friction-dir") {
    const force = (measured.enabled || []).find((f) => f.type === spec.targets.type);
    const deg = force ? normalizeAngle(force.direction) : null;
    const ok = deg != null && Math.abs(deg - normalizeAngle(spec.targets.direction)) <= 2;
    return { ok, direction: deg };
  }
  const err = Math.hypot(
    (measured.net?.x ?? 0) - (spec.targets.Fnetx ?? 0),
    (measured.net?.y ?? 0) - (spec.targets.Fnety ?? 0),
  );
  return { ok: err <= challengeTolerance(spec.targets.Fnet ?? 0), Fnet: measured.net?.magnitude ?? 0, Fnetx: measured.net?.x ?? 0 };
}

export function teacherReport(state) {
  const snap = snapshot(state);
  const net = snap.net;
  const dir = snap.netDir;
  const list = snap.enabled
    .map((f) => `${f.symbol} ${formatUnsigned(f.magnitude, "N")} ${directionInfo(f.direction).arrow}`)
    .join(" · ");
  return (
    `F_g = mg = ${formatUnsigned(snap.Fg, "N")} · ` +
    `F_net = (${formatSigned(net.x, "N")}, ${formatSigned(net.y, "N")}) ` +
    `|F_net| = ${formatUnsigned(net.magnitude, "N")} ${dir.arrow} · ` +
    `${snap.forceState} · a = F_net / m = (${formatSigned(snap.a.x, "m/s²")}, ${formatSigned(snap.a.y, "m/s²")}) · ` +
    list
  );
}
