/**
 * Ground-frame cameras for motion labs.
 *
 * Use this whenever a future sim draws objects on a track or axis:
 * - one object → Origin (keep x/y = 0 in view and zoom out), Follow, or Stationary
 * - two objects → Fit (zoom so every object stays on screen), Origin, or Stationary
 * - three or more → Origin or Stationary (no follow-one-object yet)
 */

export const CAMERA = {
  FIT: "fit",
  ORIGIN: "origin",
  FOLLOW: "follow",
  STATIONARY: "stationary",
};

export const CAMERA_LABELS = {
  [CAMERA.FIT]: "Fit objects",
  [CAMERA.ORIGIN]: "Origin",
  [CAMERA.FOLLOW]: "Follow object",
  [CAMERA.STATIONARY]: "Stationary",
};

export function cameraModesFor(objectCount) {
  const n = Math.max(1, Number(objectCount) || 1);
  if (n <= 1) return [CAMERA.ORIGIN, CAMERA.FOLLOW, CAMERA.STATIONARY];
  if (n === 2) return [CAMERA.FIT, CAMERA.ORIGIN, CAMERA.STATIONARY];
  return [CAMERA.ORIGIN, CAMERA.STATIONARY];
}

export function defaultCameraMode(objectCount) {
  return cameraModesFor(objectCount)[0];
}

export function normalizeCameraMode(mode, objectCount) {
  const allowed = cameraModesFor(objectCount);
  return allowed.includes(mode) ? mode : allowed[0];
}

function finitePositions(positions) {
  return (positions || []).map(Number).filter(Number.isFinite);
}

export function cameraRange(positions, options = {}) {
  const {
    mode = CAMERA.FIT,
    pad = 2.5,
    minSpan = 12,
    followSpan = 16,
    followEdge = 3.5,
    lockLo,
    lockHi,
    plotPx = 0,
    screenPadPx = 56,
  } = options;
  const xs = finitePositions(positions);
  const minP = xs.length ? Math.min(...xs) : 0;
  const maxP = xs.length ? Math.max(...xs) : 0;

  if (mode === CAMERA.STATIONARY) {
    const lo = Number(lockLo);
    const hi = Number(lockHi);
    if (Number.isFinite(lo) && Number.isFinite(hi) && hi > lo) {
      return { lo, hi, span: hi - lo };
    }
    const span = Math.max(minSpan, 2 * pad);
    return { lo: -span / 2, hi: span / 2, span };
  }

  let lo;
  let hi;
  if (mode === CAMERA.FOLLOW) {
    const needed = maxP - minP + 2 * followEdge;
    const span = Math.max(followSpan, needed, minSpan);
    const mid = (minP + maxP) / 2;
    lo = mid - span / 2;
    if (minP < lo + followEdge) lo = minP - followEdge;
    if (maxP > lo + span - followEdge) lo = maxP + followEdge - span;
    hi = lo + span;
  } else {
    const includeOrigin = mode === CAMERA.ORIGIN;
    lo = (includeOrigin ? Math.min(0, minP) : minP) - pad;
    hi = (includeOrigin ? Math.max(0, maxP) : maxP) + pad;
    if (hi - lo < minSpan) {
      const mid = (lo + hi) / 2;
      lo = mid - minSpan / 2;
      hi = mid + minSpan / 2;
    }
  }

  if (plotPx > 0 && screenPadPx > 0) {
    const extra = (screenPadPx / plotPx) * (hi - lo);
    lo -= extra;
    hi += extra;
  }
  return { lo, hi, span: hi - lo };
}

export function cameraScale(span, plotPx) {
  return Math.max(1, Number(plotPx) || 1) / Math.max(Number(span) || 1, 1e-6);
}
