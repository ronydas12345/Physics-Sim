/**
 * Constant-acceleration 1D kinematics for Simulation 1.2.
 * Closed-form x(t), v(t), a(t); distance is path length, not |Δx|.
 */

export const DT = 0.01;
export const AXIS_MIN = -20;
export const AXIS_MAX = 20;
export const DURATION_MIN = 1;
export const DURATION_MAX = 20;
export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 2, 4];
export const DIAGRAM_DT = 0.5;

export const PRESETS = [
  { id: "const-v", label: "Constant velocity", initialPosition: 0, initialVelocity: 4, acceleration: 0 },
  { id: "speed-up", label: "Speeding up", initialPosition: 0, initialVelocity: 0, acceleration: 2 },
  { id: "slow-down", label: "Slowing down", initialPosition: 0, initialVelocity: 10, acceleration: -2 },
  { id: "negative", label: "Negative motion", initialPosition: 10, initialVelocity: -4, acceleration: 0 },
];

export const REPRESENT_PRESETS = [
  { id: "still", label: "Stationary", initialPosition: 5, initialVelocity: 0, acceleration: 0 },
  { id: "const-v", label: "Constant +v", initialPosition: 0, initialVelocity: 4, acceleration: 0 },
  { id: "const-neg", label: "Constant −v", initialPosition: 10, initialVelocity: -4, acceleration: 0 },
  { id: "speed-up", label: "Speeding up", initialPosition: 0, initialVelocity: 0, acceleration: 2 },
  { id: "slow-down", label: "Slowing down", initialPosition: 0, initialVelocity: 8, acceleration: -2 },
  { id: "reverse", label: "Direction change", initialPosition: 0, initialVelocity: 6, acceleration: -2 },
  { id: "neg-speed", label: "Speeding up left", initialPosition: 0, initialVelocity: -2, acceleration: -2 },
  { id: "neg-slow", label: "Slowing down left", initialPosition: 0, initialVelocity: -8, acceleration: 2 },
];

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function positionAt({ initialPosition, initialVelocity, acceleration }, t) {
  return initialPosition + initialVelocity * t + 0.5 * acceleration * t * t;
}

export function velocityAt({ initialVelocity, acceleration }, t) {
  return initialVelocity + acceleration * t;
}

/**
 * Time when velocity first reaches zero, if that happens while accelerating
 * opposite the initial velocity. Null if the object never reverses.
 */
export function reversalTime({ initialVelocity, acceleration }) {
  if (acceleration === 0 || initialVelocity === 0) return null;
  if (initialVelocity * acceleration > 0) return null;
  const t = -initialVelocity / acceleration;
  return t > 1e-12 ? t : null;
}

export function distanceAt(params, t) {
  const time = Math.max(0, t);
  const tRev = reversalTime(params);
  if (tRev == null || tRev >= time) {
    return Math.abs(positionAt(params, time) - params.initialPosition);
  }
  const x0 = params.initialPosition;
  const xRev = positionAt(params, tRev);
  const xT = positionAt(params, time);
  return Math.abs(xRev - x0) + Math.abs(xT - xRev);
}

export function accumulatePath(positions) {
  let distance = 0;
  for (let i = 1; i < positions.length; i += 1) {
    distance += Math.abs(positions[i] - positions[i - 1]);
  }
  const position = positions.length ? positions[positions.length - 1] : 0;
  const start = positions.length ? positions[0] : 0;
  return {
    position,
    displacement: position - start,
    distance,
  };
}

export function evaluateAt(params, t) {
  const time = Math.max(0, t);
  const position = positionAt(params, time);
  const velocity = velocityAt(params, time);
  const acceleration = params.acceleration;
  const displacement = position - params.initialPosition;
  const distance = distanceAt(params, time);
  return {
    time,
    position,
    velocity,
    acceleration,
    displacement,
    distance,
    averageVelocity: time > 1e-12 ? displacement / time : null,
    averageAcceleration: time > 1e-12 ? (velocity - params.initialVelocity) / time : null,
  };
}

export function createState({
  initialPosition = 0,
  initialVelocity = 4,
  acceleration = 0,
  duration = 10,
  collide = false,
} = {}) {
  const walls = Boolean(collide);
  const x0 = walls ? clamp(Number(initialPosition), AXIS_MIN, AXIS_MAX) : Number(initialPosition);
  const v0 = Number(initialVelocity);
  const a = Number(acceleration);
  const T = clamp(Number(duration) || 10, DURATION_MIN, DURATION_MAX);
  return {
    initialPosition: x0,
    initialVelocity: v0,
    acceleration: a,
    duration: T,
    collide: walls,
    time: 0,
    position: x0,
    velocity: v0,
    distance: 0,
    reversed: false,
    bounces: 0,
    reversalAt: reversalTime({ initialVelocity: v0, acceleration: a }),
    history: [{ time: 0, position: x0, velocity: v0, acceleration: a }],
  };
}

export function snapshot(state) {
  const displacement = state.position - state.initialPosition;
  const time = state.time;
  return {
    time,
    position: state.position,
    velocity: state.velocity,
    acceleration: state.acceleration,
    displacement,
    distance: state.distance,
    averageVelocity: time > 1e-12 ? displacement / time : null,
    averageAcceleration: time > 1e-12 ? (state.velocity - state.initialVelocity) / time : null,
  };
}

export function reset(state) {
  return createState({
    initialPosition: state.initialPosition,
    initialVelocity: state.initialVelocity,
    acceleration: state.acceleration,
    duration: state.duration,
    collide: state.collide,
  });
}

function recordSample(state) {
  const last = state.history[state.history.length - 1];
  if (last && Math.abs(state.time - last.time) < DT * 0.5) {
    last.time = state.time;
    last.position = state.position;
    last.velocity = state.velocity;
    last.acceleration = state.acceleration;
    return;
  }
  state.history.push({
    time: state.time,
    position: state.position,
    velocity: state.velocity,
    acceleration: state.acceleration,
  });
}

function bounceWalls(x, v) {
  let pos = x;
  let vel = v;
  let hits = 0;
  for (let i = 0; i < 8; i += 1) {
    if (pos > AXIS_MAX) {
      pos = AXIS_MAX - (pos - AXIS_MAX);
      vel = -vel;
      hits += 1;
    } else if (pos < AXIS_MIN) {
      pos = AXIS_MIN - (pos - AXIS_MIN);
      vel = -vel;
      hits += 1;
    } else break;
  }
  return { position: clamp(pos, AXIS_MIN, AXIS_MAX), velocity: vel, hits };
}

/**
 * Advance in DT-sized slices so distance follows the actual path
 * (including reversals and optional wall bounces) independent of frame rate.
 */
export function stepTo(state, targetTime, options = {}) {
  const collide = options.collide ?? state.collide;
  const goal = clamp(targetTime, 0, state.duration);
  if (goal + 1e-12 < state.time) return state;
  while (state.time + 1e-12 < goal) {
    const prevX = state.position;
    const prevV = state.velocity;
    const dt = Math.min(DT, goal - state.time);
    state.time += dt;
    if (collide) {
      const nextX = state.position + state.velocity * dt + 0.5 * state.acceleration * dt * dt;
      const nextV = state.velocity + state.acceleration * dt;
      const bounced = bounceWalls(nextX, nextV);
      state.position = bounced.position;
      state.velocity = bounced.velocity;
      state.bounces += bounced.hits;
      if (bounced.hits) state.reversed = true;
    } else {
      state.position = positionAt(state, state.time);
      state.velocity = velocityAt(state, state.time);
    }
    state.distance += Math.abs(state.position - prevX);
    if (prevV !== 0 && state.velocity * prevV < 0) state.reversed = true;
    if (Math.abs(state.velocity) < 1e-9 && Math.abs(prevV) > 1e-9) state.reversed = true;
    recordSample(state);
  }
  return state;
}

export function sampleHistory(state, t) {
  const history = state.history;
  if (!history.length) {
    return { time: t, position: state.position, velocity: state.velocity, acceleration: state.acceleration };
  }
  if (t <= history[0].time) return history[0];
  const last = history[history.length - 1];
  if (t >= last.time) return last;
  for (let i = 1; i < history.length; i += 1) {
    if (history[i].time >= t) {
      const a = history[i - 1];
      const b = history[i];
      const u = (t - a.time) / Math.max(b.time - a.time, 1e-12);
      return {
        time: t,
        position: a.position + (b.position - a.position) * u,
        velocity: a.velocity + (b.velocity - a.velocity) * u,
        acceleration: a.acceleration,
      };
    }
  }
  return last;
}

export function motionDiagramSamples(state, interval = DIAGRAM_DT) {
  const dt = interval > 0 ? interval : DIAGRAM_DT;
  const dots = [];
  for (let t = 0; t <= state.time + 1e-9; t += dt) {
    dots.push(sampleHistory(state, t));
  }
  return dots;
}

export function diagramSpacings(dots) {
  const gaps = [];
  for (let i = 1; i < dots.length; i += 1) {
    gaps.push(Math.abs(dots[i].position - dots[i - 1].position));
  }
  return gaps;
}

export function formatSigned(value, unit, digits = 2) {
  if (value == null || !Number.isFinite(Number(value))) return `—${unit ? ` ${unit}` : ""}`.trim();
  const factor = 10 ** digits;
  const rounded = Math.round(Number(value) * factor) / factor;
  const abs = Math.abs(rounded);
  const body = abs.toFixed(digits);
  const suffix = unit ? ` ${unit}` : "";
  if (rounded > 0) return `+${body}${suffix}`;
  if (rounded < 0) return `−${body}${suffix}`;
  return `${(0).toFixed(digits)}${suffix}`;
}

export function formatUnsigned(value, unit, digits = 2) {
  if (value == null || !Number.isFinite(Number(value))) return `—${unit ? ` ${unit}` : ""}`.trim();
  return `${Math.abs(Number(value)).toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

function randInt(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function generateChallenge(rng = Math.random) {
  const roll = rng();
  if (roll < 0.34) {
    const v0 = randInt(4, 10, rng);
    const a = -randInt(1, 3, rng);
    const tStop = -v0 / a;
    const params = {
      initialPosition: 0,
      initialVelocity: v0,
      acceleration: a,
      duration: clamp(tStop, DURATION_MIN, DURATION_MAX),
    };
    return {
      type: "stop-time",
      prompt: "This object is slowing down. Let it run, then check when velocity first reaches zero.",
      givens: [
        { label: "x₀", value: formatSigned(0, "m") },
        { label: "v₀", value: formatSigned(v0, "m/s") },
        { label: "a", value: formatSigned(a, "m/s²") },
      ],
      params,
      targets: { time: tStop, velocity: 0 },
      unknownLabel: "the stop time from v = v₀ + at",
      goalLabel: "time when v = 0",
      solutionHint: `t = −v₀/a = ${tStop.toFixed(2)} s. Negative acceleration is not the same as moving left.`,
    };
  }

  const x0 = randInt(-6, 6, rng);
  const v0 = (rng() < 0.5 ? -1 : 1) * randInt(2, 8, rng);
  const a = randInt(-3, 3, rng);
  const t = randInt(2, 6, rng);
  const params = { initialPosition: x0, initialVelocity: v0, acceleration: a, duration: t };
  const predicted = evaluateAt(params, t);

  if (roll < 0.67) {
    return {
      type: "position-at-t",
      prompt: "Run to the given time and check the object's position.",
      givens: [
        { label: "x₀", value: formatSigned(x0, "m") },
        { label: "v₀", value: formatSigned(v0, "m/s") },
        { label: "a", value: formatSigned(a, "m/s²") },
        { label: "t", value: formatUnsigned(t, "s") },
      ],
      params,
      targets: { time: t, position: predicted.position },
      unknownLabel: "x(t) = x₀ + v₀t + ½at²",
      goalLabel: "position at the given time",
      solutionHint: `x = ${x0} + (${v0})(${t}) + ½(${a})(${t})² = ${predicted.position.toFixed(2)} m`,
    };
  }

  return {
    type: "velocity-at-t",
    prompt: "Run to the given time and check the instantaneous velocity.",
    givens: [
      { label: "v₀", value: formatSigned(v0, "m/s") },
      { label: "a", value: formatSigned(a, "m/s²") },
      { label: "t", value: formatUnsigned(t, "s") },
    ],
    params,
    targets: { time: t, velocity: predicted.velocity },
    unknownLabel: "v(t) = v₀ + at",
    goalLabel: "velocity at the given time",
    solutionHint: `v = ${v0} + (${a})(${t}) = ${predicted.velocity.toFixed(2)} m/s`,
  };
}

export function challengeTolerance(value) {
  return Math.max(0.15, 0.04 * Math.abs(value));
}

export function evaluateChallenge(measured, spec) {
  const timeErr = Math.abs(measured.time - spec.targets.time);
  const timeOk = timeErr <= Math.max(0.12, challengeTolerance(spec.targets.time));
  if (spec.type === "stop-time") {
    const velOk = Math.abs(measured.velocity) <= 0.25;
    return {
      ok: timeOk && velOk,
      timeOk,
      velOk,
      time: measured.time,
      velocity: measured.velocity,
      position: measured.position,
    };
  }
  if (spec.type === "position-at-t") {
    const posErr = Math.abs(measured.position - spec.targets.position);
    const posOk = posErr <= challengeTolerance(spec.targets.position);
    return {
      ok: timeOk && posOk,
      timeOk,
      posOk,
      time: measured.time,
      position: measured.position,
      velocity: measured.velocity,
    };
  }
  const velErr = Math.abs(measured.velocity - spec.targets.velocity);
  const velOk = velErr <= challengeTolerance(spec.targets.velocity);
  return {
    ok: timeOk && velOk,
    timeOk,
    velOk,
    time: measured.time,
    position: measured.position,
    velocity: measured.velocity,
  };
}

export function teacherReport(state) {
  const snap = snapshot(state);
  const t = state.time;
  const tRev = state.reversalAt;
  const avgV = snap.averageVelocity;
  const avgA = snap.averageAcceleration;
  const identity =
    Math.abs(snap.distance - Math.abs(snap.displacement)) < 1e-6
      ? "D = |Δx| (no reversal yet)"
      : "D > |Δx| (the path reversed)";
  const reverseText =
    tRev == null
      ? "no v = 0 crossing"
      : t + 1e-9 >= tRev
        ? `reversed at t=${tRev.toFixed(2)} s`
        : `will reverse at t=${tRev.toFixed(2)} s`;
  const bounceText = state.collide
    ? `walls at ${AXIS_MIN} m and ${AXIS_MAX} m · elastic bounce v → −v · hits=${state.bounces} · `
    : "";
  const closed =
    state.bounces > 0
      ? `live x=${formatSigned(state.position, "m")} · live v=${formatSigned(state.velocity, "m/s")} (closed form does not apply after a bounce)`
      : `x = x₀ + v₀t + ½at² = ${formatSigned(positionAt(state, t), "m")} · v = v₀ + at = ${formatSigned(velocityAt(state, t), "m/s")}`;
  return (
    `${bounceText}${closed} · ` +
    `slope(x-t)=v=${formatSigned(state.velocity, "m/s")} · slope(v-t)=a=${formatSigned(state.acceleration, "m/s²")} · area(v-t)=Δx=${formatSigned(snap.displacement, "m")} · ` +
    `v_avg = ${avgV == null ? "—" : formatSigned(avgV, "m/s")} · ` +
    `a_avg = ${avgA == null ? "—" : formatSigned(avgA, "m/s²")} · ` +
    `${identity} · ${reverseText}`
  );
}
