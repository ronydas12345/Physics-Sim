/**
 * One-dimensional kinematics helpers for Simulation 1.1.
 * World coordinates always increase to the right on screen.
 * Displayed signs follow the student-chosen positive direction.
 */

export const AXIS_MIN = -12;
export const AXIS_MAX = 12;

export function clampPosition(x) {
  return Math.min(AXIS_MAX, Math.max(AXIS_MIN, x));
}

export function createState({
  initialPosition = 0,
  positiveRight = true,
} = {}) {
  const start = clampPosition(initialPosition);
  return {
    initialPosition: start,
    currentPosition: start,
    distanceTraveled: 0,
    positiveRight,
    history: [start],
  };
}

export function displayedPosition(state) {
  return state.positiveRight ? state.currentPosition : -state.currentPosition;
}

export function displacement(state) {
  const delta = state.currentPosition - state.initialPosition;
  return state.positiveRight ? delta : -delta;
}

export function setWorldPosition(state, worldX) {
  const next = clampPosition(worldX);
  const prev = state.currentPosition;
  if (next === prev) return state;
  state.distanceTraveled += Math.abs(next - prev);
  state.currentPosition = next;
  state.history.push(next);
  return state;
}

export function setDisplayedPosition(state, displayedX) {
  const worldX = state.positiveRight ? displayedX : -displayedX;
  return setWorldPosition(state, worldX);
}

export function nudgeDisplayed(state, displayedDelta) {
  return setDisplayedPosition(state, displayedPosition(state) + displayedDelta);
}

export function setPositiveRight(state, positiveRight) {
  state.positiveRight = Boolean(positiveRight);
  return state;
}

export function reset(state) {
  return createState({
    initialPosition: state.initialPosition,
    positiveRight: state.positiveRight,
  });
}

export function formatSignedMeters(value) {
  const rounded = Math.round(value * 10) / 10;
  const abs = Math.abs(rounded);
  const body = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
  if (rounded > 0) return `+${body} m`;
  if (rounded < 0) return `−${body} m`;
  return `0 m`;
}

export function formatDistance(value) {
  const rounded = Math.round(Math.abs(value) * 10) / 10;
  const body = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${body} m`;
}

function randInt(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Build a 1.1 challenge that is always physically reachable from the origin.
 * Distance is path length, not |x_final|.
 */
export function generateChallenge(rng = Math.random) {
  if (rng() < 0.45) {
    const half = randInt(2, 6, rng);
    const distance = 2 * half;
    return {
      type: "round-trip",
      prompt: "Leave the origin and return so displacement is zero but distance is not.",
      givens: [{ label: "Start", value: "x = 0 m" }],
      targets: { position: 0, displacement: 0, distance },
      unknownLabel: "a path whose length is the target distance",
      goalLabel: "distance with Δx = 0",
      goalUnit: "m",
      solutionHint: `Move ${half} m one way, then back to 0.`,
    };
  }

  const sign = rng() < 0.5 ? -1 : 1;
  const position = sign * randInt(2, 8, rng);
  const extra = randInt(1, 4, rng);
  const distance = Math.abs(position) + 2 * extra;
  const overshoot = position + sign * extra;
  return {
    type: "position-distance",
    prompt: "Move the object from the origin so both the final position and the path length match.",
    givens: [{ label: "Start", value: "x = 0 m" }],
    targets: { position, displacement: position, distance },
    unknownLabel: "a path, not a single jump",
    goalLabel: "position and distance",
    goalUnit: "m",
    solutionHint: `One path: go to ${overshoot} m, then to ${position} m.`,
  };
}

export function challengeTolerance(value) {
  return Math.max(0.15, 0.04 * Math.abs(value));
}

export function evaluateChallenge(state, spec) {
  const position = displayedPosition(state);
  const dx = displacement(state);
  const distance = state.distanceTraveled;
  const posErr = Math.abs(position - spec.targets.position);
  const distErr = Math.abs(distance - spec.targets.distance);
  const posOk = posErr <= challengeTolerance(spec.targets.position);
  const distOk = distErr <= challengeTolerance(spec.targets.distance);
  return {
    position,
    displacement: dx,
    distance,
    posErr,
    distErr,
    posOk,
    distOk,
    ok: posOk && distOk,
  };
}

export function teacherReport(state) {
  const shown = displayedPosition(state);
  const dx = displacement(state);
  const path = state.history.map((x) => (state.positiveRight ? x : -x));
  const pathText = path.map((x) => (Math.round(x * 10) / 10).toString()).join(" → ");
  const identity = Math.abs(state.distanceTraveled - Math.abs(dx)) < 1e-9 ? "D = |Δx| (no reversal)" : "D > |Δx| (path reversed)";
  return (
    `World x=${formatSignedMeters(state.currentPosition)} (screen-right) · ` +
    `Displayed x=${formatSignedMeters(shown)} · ` +
    `Δx=${formatSignedMeters(dx)} · ` +
    `D=Σ|Δx|=${formatDistance(state.distanceTraveled)} · ` +
    `${identity} · history ${pathText}`
  );
}
