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
