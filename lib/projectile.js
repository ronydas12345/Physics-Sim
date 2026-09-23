/**
 * AP Physics 1 projectile-motion engine.
 *
 * One shared state model drives animation, live readouts, vectors,
 * range/height markers, and validation against closed-form results.
 * No air resistance. Constant g downward. Flat ground. Point mass.
 * Launch and landing heights are equal (y = 0).
 */

export const DT = 0.01;
export const GROUND_Y = 0;
export const DEFAULTS = Object.freeze({
  v0: 20,
  angleDeg: 45,
  g: 9.8,
});

const EPS = 1e-12;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad) {
  return (rad * 180) / Math.PI;
}

export function initialComponents(v0, angleDeg) {
  const theta = degToRad(angleDeg);
  return {
    vx: v0 * Math.cos(theta),
    vy: v0 * Math.sin(theta),
  };
}

export function speedFromComponents(vx, vy) {
  return Math.hypot(vx, vy);
}

/**
 * Closed-form results for equal launch and landing height.
 * R = v0² sin(2θ) / g
 * H = v0² sin²(θ) / (2g)
 * T = 2 v0 sin(θ) / g
 */
export function analytical(v0, angleDeg, g) {
  if (g <= 0) {
    throw new Error("Gravity must be positive.");
  }
  const theta = degToRad(angleDeg);
  const s = Math.sin(theta);
  const timeOfFlight = (2 * v0 * s) / g;
  const maxHeight = (v0 * v0 * s * s) / (2 * g);
  const range = (v0 * v0 * Math.sin(2 * theta)) / g;
  return {
    timeOfFlight,
    maxHeight,
    range,
  };
}

export function positionAtTime(v0, angleDeg, g, t) {
  const { vx, vy } = initialComponents(v0, angleDeg);
  return {
    x: vx * t,
    y: vy * t - 0.5 * g * t * t,
    vx,
    vy: vy - g * t,
  };
}

export function createLaunchState({
  v0 = DEFAULTS.v0,
  angleDeg = DEFAULTS.angleDeg,
  g = DEFAULTS.g,
  dt = DT,
} = {}) {
  const { vx, vy } = initialComponents(v0, angleDeg);
  return {
    v0,
    angleDeg,
    g,
    dt,
    t: 0,
    x: 0,
    y: GROUND_Y,
    vx,
    vy,
    speed: speedFromComponents(vx, vy),
    isRunning: false,
    isPaused: false,
    landed: false,
    trajectory: [{ x: 0, y: GROUND_Y, t: 0, vx, vy }],
    maxHeight: 0,
    maxHeightX: 0,
    apexReached: vy <= EPS,
    range: 0,
    measuredRange: 0,
    measuredTimeOfFlight: 0,
    measuredMaxHeight: 0,
  };
}

function recordApex(state, prev) {
  if (state.apexReached) return;
  if (prev.vy > 0 && state.vy <= 0) {
    const dv = prev.vy - state.vy;
    const alpha = dv === 0 ? 1 : prev.vy / dv;
    const apexY = prev.y + (state.y - prev.y) * alpha;
    const apexX = prev.x + (state.x - prev.x) * alpha;
    state.apexReached = true;
    if (apexY > state.maxHeight) {
      state.maxHeight = apexY;
      state.maxHeightX = apexX;
    }
  }
}

function land(state, prev) {
  const dy = prev.y - state.y;
  const alpha = Math.abs(dy) < EPS ? 1 : clamp(prev.y / dy, 0, 1);
  state.x = prev.x + (state.x - prev.x) * alpha;
  state.t = prev.t + (state.t - prev.t) * alpha;
  state.vy = prev.vy + (state.vy - prev.vy) * alpha;
  state.y = GROUND_Y;
  state.speed = speedFromComponents(state.vx, state.vy);
  state.landed = true;
  state.isRunning = false;
  state.isPaused = false;
  state.range = state.x;
  state.measuredRange = state.x;
  state.measuredTimeOfFlight = state.t;
  state.measuredMaxHeight = state.maxHeight;
  state.trajectory.push({
    x: state.x,
    y: state.y,
    t: state.t,
    vx: state.vx,
    vy: state.vy,
  });
}

/**
 * One numerical step. Semi-implicit Euler as specified:
 *   x  += vx * dt
 *   vy += -g * dt
 *   y  += vy * dt
 * Stops on ground contact and never reports y < 0.
 */
export function step(state) {
  if (!state.isRunning || state.isPaused || state.landed) {
    return state;
  }

  if (state.t === 0 && state.vy <= EPS && state.y <= GROUND_Y + EPS) {
    state.landed = true;
    state.isRunning = false;
    state.range = 0;
    state.measuredRange = 0;
    state.measuredTimeOfFlight = 0;
    state.measuredMaxHeight = 0;
    state.maxHeight = 0;
    state.maxHeightX = 0;
    state.apexReached = true;
    return state;
  }

  const prev = {
    x: state.x,
    y: state.y,
    t: state.t,
    vy: state.vy,
  };

  state.x += state.vx * state.dt;
  state.vy += -state.g * state.dt;
  state.y += state.vy * state.dt;
  state.t += state.dt;
  state.speed = speedFromComponents(state.vx, state.vy);

  if (state.y > state.maxHeight) {
    state.maxHeight = state.y;
    state.maxHeightX = state.x;
  }

  recordApex(state, prev);

  if (state.y <= GROUND_Y && state.t > 0) {
    land(state, prev);
    return state;
  }

  state.trajectory.push({
    x: state.x,
    y: state.y,
    t: state.t,
    vx: state.vx,
    vy: state.vy,
  });
  return state;
}

export function cloneState(state) {
  return {
    ...state,
    trajectory: state.trajectory.map((p) => ({ ...p })),
  };
}

export function launch(state) {
  const next = createLaunchState({
    v0: state.v0,
    angleDeg: state.angleDeg,
    g: state.g,
    dt: state.dt,
  });
  next.isRunning = true;
  next.isPaused = false;
  return next;
}

export function pause(state) {
  if (!state.isRunning || state.landed) return state;
  state.isPaused = true;
  return state;
}

export function resume(state) {
  if (!state.isRunning || state.landed) return state;
  state.isPaused = false;
  return state;
}

export function reset(state) {
  return createLaunchState({
    v0: state.v0,
    angleDeg: state.angleDeg,
    g: state.g,
    dt: state.dt,
  });
}

export function applyPendingParams(state, { v0, angleDeg, g }) {
  if (state.isRunning || (state.trajectory.length > 1 && !state.landed)) {
    return state;
  }
  if (!state.landed && state.t === 0 && !state.isRunning) {
    return createLaunchState({ v0, angleDeg, g, dt: state.dt });
  }
  return state;
}

export function simulateUntilLanding(params, maxSteps = 100000) {
  let state = launch(createLaunchState(params));
  let steps = 0;
  while (state.isRunning && !state.landed && steps < maxSteps) {
    step(state);
    steps += 1;
  }
  return state;
}

export function predictedTrajectory(params) {
  return simulateUntilLanding(params).trajectory;
}

export function analyzeLaunch({ v0, angleDeg, g, dt = DT }) {
  const closed = analytical(v0, angleDeg, g);
  const simulated = simulateUntilLanding({ v0, angleDeg, g, dt });
  const { vx, vy } = initialComponents(v0, angleDeg);
  return {
    params: { v0, angleDeg, g, dt },
    components: { vx, vy },
    analytical: closed,
    simulated: {
      timeOfFlight: simulated.measuredTimeOfFlight,
      maxHeight: simulated.measuredMaxHeight,
      range: simulated.measuredRange,
      vxConstant: simulated.vx,
      landedY: simulated.y,
    },
    residual: {
      range: simulated.measuredRange - closed.range,
      maxHeight: simulated.measuredMaxHeight - closed.maxHeight,
      timeOfFlight: simulated.measuredTimeOfFlight - closed.timeOfFlight,
    },
  };
}

export function sweepAngles({ v0, g, stepDeg = 1, dt = DT } = {}) {
  const points = [];
  for (let angleDeg = 0; angleDeg <= 90; angleDeg += stepDeg) {
    const closed = analytical(v0, angleDeg, g);
    points.push({
      angleDeg,
      range: closed.range,
      maxHeight: closed.maxHeight,
      timeOfFlight: closed.timeOfFlight,
    });
  }
  return { v0, g, dt, points };
}

export function complementaryAngle(angleDeg) {
  return 90 - angleDeg;
}

/**
 * Solve R = v0² sin(2θ) / g for launch angles in [0, 90].
 * Two solutions when the target is below the 45° maximum.
 */
export function anglesForRange(targetRange, v0, g) {
  const maxRange = analytical(v0, 45, g).range;
  if (targetRange <= 0) return { possible: false, reason: "nonpositive", maxRange, angles: [] };
  if (targetRange > maxRange + 1e-9) {
    return { possible: false, reason: "beyond-max", maxRange, angles: [] };
  }
  const sin2t = (targetRange * g) / (v0 * v0);
  const clamped = clamp(sin2t, 0, 1);
  const twoTheta = Math.asin(clamped);
  const a = radToDeg(twoTheta) / 2;
  const b = radToDeg(Math.PI - twoTheta) / 2;
  const angles = [a];
  if (Math.abs(b - a) > 0.05) angles.push(b);
  return { possible: true, reason: "ok", maxRange, angles };
}

export function rangeError(measured, target) {
  const delta = measured - target;
  return {
    delta,
    abs: Math.abs(delta),
    pctOfTarget: target === 0 ? null : (100 * Math.abs(delta)) / target,
  };
}

export function withinTolerance(simulated, expected, absTol = 0.08, relTol = 0.01) {
  const scale = Math.max(Math.abs(expected), 1);
  return Math.abs(simulated - expected) <= Math.max(absTol, relTol * scale);
}
