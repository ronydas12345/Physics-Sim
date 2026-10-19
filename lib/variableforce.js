/**
 * Work by variable forces for Simulation 3.2.
 * 1-D track, +x right. W = ∫ Fx(x) dx as signed area under Fx vs x. W_net = ΔK.
 * Kinetic energy is never negative. If K would go below zero, stop before xf.
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

export const MASS_MIN = 0.5;
export const MASS_MAX = 20;
export const SPEED_MIN = 0;
export const SPEED_MAX = 15;
export const FORCE_MIN = -80;
export const FORCE_MAX = 80;
export const POS_MIN = -4;
export const POS_MAX = 16;
export const SLOPE_MIN = -20;
export const SLOPE_MAX = 20;
export const K_SPRING_MIN = 0;
export const K_SPRING_MAX = 20;
export const WAVE_MIN = 0.1;
export const WAVE_MAX = 4;
export const N_MIN = 1;
export const N_MAX = 64;
export const VEL_EPSILON = 0.02;
export const FORCE_EPSILON = 0.001;
export const ENERGY_EPSILON = 0.05;
export const AREA_EPSILON = 1e-6;

export const N_TRIALS = Object.freeze([2, 4, 8, 16, 32]);
export const XF_TRIALS = Object.freeze([1, 2, 3, 4]);
export const APPROX_METHODS = Object.freeze(["midpoint", "left", "trapezoid"]);

export const FUNCTION_TYPES = [
  { id: "constant", label: "Constant" },
  { id: "piecewise-constant", label: "Piecewise constant" },
  { id: "piecewise-linear", label: "Piecewise linear" },
  { id: "proportional", label: "F = c x" },
  { id: "quadratic", label: "Quadratic" },
  { id: "spring", label: "Spring F = −k x" },
  { id: "sine", label: "Sinusoidal" },
];

export const SCENARIOS = [
  { id: "constant", label: "Constant force", mass: 2, v0: 2, xi: 0, xf: 4, n: 8, method: "midpoint", spec: { type: "constant", F: 6 } },
  { id: "triangle", label: "Triangular area", mass: 2, v0: 1, xi: 0, xf: 4, n: 8, method: "midpoint", spec: { type: "piecewise-linear", points: [{ x: 0, F: 0 }, { x: 4, F: 8 }] } },
  { id: "trapezoid", label: "Trapezoidal area", mass: 2, v0: 2, xi: 0, xf: 4, n: 8, method: "midpoint", spec: { type: "piecewise-linear", points: [{ x: 0, F: 2 }, { x: 4, F: 10 }] } },
  { id: "negative", label: "Negative work", mass: 2, v0: 5, xi: 0, xf: 3, n: 8, method: "midpoint", spec: { type: "constant", F: -4 } },
  { id: "signed", label: "Positive and negative areas", mass: 2, v0: 2, xi: 0, xf: 4, n: 8, method: "midpoint", spec: { type: "piecewise-constant", segments: [{ x0: 0, x1: 2, F: 6 }, { x0: 2, x1: 4, F: -3 }] } },
  { id: "cancel", label: "Zero net work", mass: 2, v0: 3, xi: 0, xf: 4, n: 8, method: "midpoint", spec: { type: "piecewise-constant", segments: [{ x0: 0, x1: 2, F: 4 }, { x0: 2, x1: 4, F: -4 }] } },
  { id: "curved", label: "Curved force", mass: 2, v0: 2, xi: 0, xf: 4, n: 4, method: "left", spec: { type: "proportional", c: 2 } },
  { id: "stop", label: "Stops before the end", mass: 2, v0: 2, xi: 0, xf: 5, n: 8, method: "midpoint", spec: { type: "constant", F: -8 } },
  { id: "crossing", label: "Force crosses zero", mass: 2, v0: 4, xi: 0, xf: 4, n: 8, method: "midpoint", spec: { type: "piecewise-linear", points: [{ x: 0, F: 6 }, { x: 4, F: -6 }] } },
  { id: "custom", label: "Custom", mass: 2, v0: 2, xi: 0, xf: 4, n: 8, method: "midpoint", spec: { type: "constant", F: 6 } },
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

export function clampPos(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return clamp(n, POS_MIN, POS_MAX);
}

export function clampSlope(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return clamp(n, SLOPE_MIN, SLOPE_MAX);
}

export function clampSpringK(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 4;
  return clamp(n, K_SPRING_MIN, K_SPRING_MAX);
}

export function clampWave(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return Math.PI / 4;
  return clamp(n, WAVE_MIN, WAVE_MAX);
}

export function clampN(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 8;
  return clamp(n, N_MIN, N_MAX);
}

export function normalizeMethod(value) {
  return APPROX_METHODS.includes(value) ? value : "midpoint";
}

export function kineticEnergy(mass, speed) {
  const m = Math.max(clampMass(mass), 0);
  const v = clampSpeed(speed);
  return 0.5 * m * v * v;
}

export function speedFromKe(mass, K) {
  const m = Math.max(clampMass(mass), 1e-9);
  const energy = Math.max(0, Number(K) || 0);
  return Math.sqrt((2 * energy) / m);
}

function finiteOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function sortPoints(points) {
  const list = (Array.isArray(points) ? points : [])
    .map((p) => ({ x: clampPos(p.x), F: clampForce(p.F) }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.F));
  list.sort((a, b) => a.x - b.x);
  const out = [];
  for (const point of list) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.x - point.x) < 1e-9) last.F = point.F;
    else out.push({ ...point });
  }
  if (out.length < 2) {
    return [
      { x: 0, F: out[0]?.F ?? 0 },
      { x: 4, F: out[0]?.F ?? 6 },
    ];
  }
  return out;
}

function sortSegments(segments) {
  const list = (Array.isArray(segments) ? segments : [])
    .map((s) => {
      const a = clampPos(s.x0);
      const b = clampPos(s.x1);
      return { x0: Math.min(a, b), x1: Math.max(a, b), F: clampForce(s.F) };
    })
    .filter((s) => s.x1 - s.x0 > 1e-9);
  list.sort((a, b) => a.x0 - b.x0);
  if (!list.length) return [{ x0: 0, x1: 4, F: 6 }];
  return list;
}

export function sanitizeSpec(raw = {}) {
  const type = FUNCTION_TYPES.some((t) => t.id === raw.type) ? raw.type : "constant";
  if (type === "piecewise-constant") {
    return { type, segments: sortSegments(raw.segments) };
  }
  if (type === "piecewise-linear") {
    return { type, points: sortPoints(raw.points) };
  }
  if (type === "proportional") {
    return { type, c: clampSlope(raw.c) };
  }
  if (type === "quadratic") {
    return { type, a: clampSlope(raw.a) };
  }
  if (type === "spring") {
    return { type, k: clampSpringK(raw.k) };
  }
  if (type === "sine") {
    return { type, F0: clampForce(raw.F0), q: clampWave(raw.q) };
  }
  return { type: "constant", F: clampForce(raw.F) };
}

export function specValid(spec) {
  const clean = sanitizeSpec(spec);
  if (clean.type === "piecewise-linear") {
    const xs = clean.points.map((p) => p.x);
    return xs.length >= 2 && xs.every((x, i) => i === 0 || x > xs[i - 1] + 1e-12);
  }
  if (clean.type === "piecewise-constant") {
    return clean.segments.length >= 1 && clean.segments.every((s) => s.x1 > s.x0);
  }
  return Number.isFinite(forceAt(clean, 0));
}

export function forceAt(spec, x) {
  const clean = sanitizeSpec(spec);
  const pos = finiteOr(x, 0);
  if (!Number.isFinite(pos)) return 0;
  if (clean.type === "constant") return clean.F;
  if (clean.type === "proportional") return clean.c * pos;
  if (clean.type === "quadratic") return clean.a * pos * pos;
  if (clean.type === "spring") return -clean.k * pos;
  if (clean.type === "sine") return clean.F0 * Math.sin(clean.q * pos);
  if (clean.type === "piecewise-constant") {
    const segs = clean.segments;
    if (pos < segs[0].x0) return segs[0].F;
    for (let i = 0; i < segs.length; i += 1) {
      const seg = segs[i];
      const last = i === segs.length - 1;
      if (pos < seg.x1 || (last && pos <= seg.x1 + 1e-12)) return seg.F;
    }
    return segs[segs.length - 1].F;
  }
  const pts = clean.points;
  if (pos <= pts[0].x) return pts[0].F;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i];
    const b = pts[i + 1];
    if (pos <= b.x + 1e-12) {
      const dx = b.x - a.x;
      if (Math.abs(dx) < 1e-12) return b.F;
      const t = (pos - a.x) / dx;
      return a.F + t * (b.F - a.F);
    }
  }
  return pts[pts.length - 1].F;
}

function overlapWorkConstant(F, a, b, xi, xf) {
  const lo = Math.max(Math.min(xi, xf), Math.min(a, b));
  const hi = Math.min(Math.max(xi, xf), Math.max(a, b));
  if (hi <= lo + 1e-15) return 0;
  const signed = xf >= xi ? hi - lo : lo - hi;
  return F * signed;
}

function linearIntegral(x1, F1, x2, F2, xi, xf) {
  const a = Math.min(x1, x2);
  const b = Math.max(x1, x2);
  const lo = Math.max(Math.min(xi, xf), a);
  const hi = Math.min(Math.max(xi, xf), b);
  if (hi <= lo + 1e-15) return 0;
  const Fa = forceLerp(x1, F1, x2, F2, lo);
  const Fb = forceLerp(x1, F1, x2, F2, hi);
  const mag = 0.5 * (Fa + Fb) * (hi - lo);
  return xf >= xi ? mag : -mag;
}

function forceLerp(x1, F1, x2, F2, x) {
  const dx = x2 - x1;
  if (Math.abs(dx) < 1e-12) return F2;
  return F1 + ((x - x1) / dx) * (F2 - F1);
}

export function workExact(spec, xi, xf) {
  const clean = sanitizeSpec(spec);
  const a = clampPos(xi);
  const b = clampPos(xf);
  if (Math.abs(b - a) < 1e-15) return 0;
  if (clean.type === "constant") return clean.F * (b - a);
  if (clean.type === "proportional") return 0.5 * clean.c * (b * b - a * a);
  if (clean.type === "quadratic") return (clean.a / 3) * (b * b * b - a * a * a);
  if (clean.type === "spring") return -0.5 * clean.k * (b * b - a * a);
  if (clean.type === "sine") {
    if (Math.abs(clean.q) < 1e-12) return clean.F0 * (b - a);
    return (-clean.F0 / clean.q) * (Math.cos(clean.q * b) - Math.cos(clean.q * a));
  }
  if (clean.type === "piecewise-constant") {
    return clean.segments.reduce((sum, seg) => sum + overlapWorkConstant(seg.F, seg.x0, seg.x1, a, b), 0);
  }
  let sum = 0;
  for (let i = 0; i < clean.points.length - 1; i += 1) {
    const p = clean.points[i];
    const q = clean.points[i + 1];
    sum += linearIntegral(p.x, p.F, q.x, q.F, a, b);
  }
  return sum;
}

export function workApprox(spec, xi, xf, n, method = "midpoint") {
  const a = clampPos(xi);
  const b = clampPos(xf);
  const steps = clampN(n);
  if (Math.abs(b - a) < 1e-15 || steps < 1) return 0;
  const dx = (b - a) / steps;
  const kind = normalizeMethod(method);
  if (kind === "left") {
    let sum = 0;
    for (let i = 0; i < steps; i += 1) sum += forceAt(spec, a + i * dx);
    return sum * dx;
  }
  if (kind === "trapezoid") {
    let sum = 0.5 * (forceAt(spec, a) + forceAt(spec, b));
    for (let i = 1; i < steps; i += 1) sum += forceAt(spec, a + i * dx);
    return sum * dx;
  }
  let sum = 0;
  for (let i = 0; i < steps; i += 1) sum += forceAt(spec, a + (i + 0.5) * dx);
  return sum * dx;
}

export function signedWork(spec, xi, xf, samples = 400) {
  const a = clampPos(xi);
  const b = clampPos(xf);
  if (Math.abs(b - a) < 1e-15) return { Wpos: 0, Wneg: 0, Wnet: 0 };
  const n = Math.max(8, samples);
  const dx = (b - a) / n;
  let Wpos = 0;
  let Wneg = 0;
  for (let i = 0; i < n; i += 1) {
    const x0 = a + i * dx;
    const x1 = a + (i + 1) * dx;
    const dW = workExact(spec, x0, x1);
    if (dW >= 0) Wpos += dW;
    else Wneg += dW;
  }
  const Wnet = workExact(spec, a, b);
  return { Wpos, Wneg, Wnet };
}

export function areaRegions(spec, xi, xf) {
  const clean = sanitizeSpec(spec);
  const a = clampPos(xi);
  const b = clampPos(xf);
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const regions = [];
  const pushRegion = (x0, x1, shape) => {
    if (Math.abs(x1 - x0) < 1e-12) return;
    const W = workExact(clean, a < b ? x0 : x1, a < b ? x1 : x0);
    const Fmid = forceAt(clean, 0.5 * (x0 + x1));
    regions.push({
      x0,
      x1,
      W: a < b ? workExact(clean, x0, x1) : workExact(clean, x1, x0),
      sign: Math.abs(W) < AREA_EPSILON ? 0 : Math.sign(Fmid) * (a <= b ? 1 : -1),
      shape,
    });
  };

  if (Math.abs(hi - lo) < 1e-15) return regions;

  if (clean.type === "constant" || clean.type === "piecewise-constant") {
    const segs = clean.type === "constant" ? [{ x0: lo, x1: hi, F: clean.F }] : clean.segments;
    for (const seg of segs) {
      const x0 = Math.max(lo, seg.x0);
      const x1 = Math.min(hi, seg.x1);
      if (x1 > x0) pushRegion(x0, x1, "rectangle");
    }
    return regions;
  }

  if (clean.type === "piecewise-linear") {
    for (let i = 0; i < clean.points.length - 1; i += 1) {
      const p = clean.points[i];
      const q = clean.points[i + 1];
      const x0 = Math.max(lo, p.x);
      const x1 = Math.min(hi, q.x);
      if (x1 <= x0) continue;
      const F0 = forceAt(clean, x0);
      const F1 = forceAt(clean, x1);
      if (F0 * F1 < -AREA_EPSILON) {
        const z = x0 - F0 * ((x1 - x0) / (F1 - F0));
        pushRegion(x0, z, "triangle");
        pushRegion(z, x1, "triangle");
      } else if (Math.abs(F0) < AREA_EPSILON || Math.abs(F1) < AREA_EPSILON || Math.abs(F0 - F1) < AREA_EPSILON) {
        pushRegion(x0, x1, Math.abs(F0) < AREA_EPSILON || Math.abs(F1) < AREA_EPSILON ? "triangle" : "rectangle");
      } else {
        pushRegion(x0, x1, "trapezoid");
      }
    }
    return regions;
  }

  const steps = 24;
  let start = lo;
  let sign = Math.sign(forceAt(clean, lo + 1e-6)) || Math.sign(forceAt(clean, lo));
  for (let i = 1; i <= steps; i += 1) {
    const x = lo + (i / steps) * (hi - lo);
    const s = Math.sign(forceAt(clean, x - 1e-9)) || sign;
    if (s !== sign && s !== 0) {
      pushRegion(start, x, "curve");
      start = x;
      sign = s;
    }
  }
  pushRegion(start, hi, "curve");
  return regions;
}

export function sampleForceCurve(spec, xMin, xMax, steps = 160) {
  const a = clampPos(xMin);
  const b = clampPos(xMax);
  const n = Math.max(2, steps);
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const x = a + (i / n) * (b - a);
    pts.push({ x, F: forceAt(spec, x) });
  }
  return pts;
}

export function formulaFor(spec) {
  const clean = sanitizeSpec(spec);
  if (clean.type === "constant") return "W = Fₓ Δx";
  if (clean.type === "piecewise-constant") return "W = Σ Fᵢ Δxᵢ";
  if (clean.type === "piecewise-linear") return "W = Σ ½(Fᵢ + Fᵢ₊₁) Δxᵢ";
  if (clean.type === "proportional") return "W = ∫ c x dx = ½ c (x_f² − x_i²)";
  if (clean.type === "quadratic") return "W = ∫ a x² dx";
  if (clean.type === "spring") return "W = ∫ −k x dx";
  return "W = ∫ Fₓ(x) dx";
}

export function predictedOutcome(raw = {}) {
  const mass = clampMass(raw.mass);
  const v0 = clampSpeed(raw.v0);
  const xi = clampPos(raw.xi);
  const xf = clampPos(raw.xf);
  const spec = sanitizeSpec(raw.spec);
  const n = clampN(raw.n);
  const method = normalizeMethod(raw.method);
  const Ki = kineticEnergy(mass, v0);
  const dx = xf - xi;
  const direction = dx >= 0 ? 1 : -1;
  const Wfull = workExact(spec, xi, xf);
  const Wapprox = workApprox(spec, xi, xf, n, method);
  const areas = signedWork(spec, xi, xf);
  const F0 = forceAt(spec, xi);

  if (Math.abs(dx) <= 1e-9) {
    return packOutcome({
      mass, v0, xi, xf, spec, n, method, Ki, areas: { Wpos: 0, Wneg: 0, Wnet: 0 }, Wfull, Wapprox, F0,
      s: 0, xStop: xi, vf: v0, Kf: Ki, reached: true, stoppedEarly: false, status: "at-start",
      Wnet: 0,
    });
  }

  if (v0 <= VEL_EPSILON && F0 * direction <= FORCE_EPSILON) {
    return packOutcome({
      mass, v0, xi, xf, spec, n, method, Ki, areas: { Wpos: 0, Wneg: 0, Wnet: 0 }, Wfull, Wapprox, F0,
      s: 0, xStop: xi, vf: 0, Kf: 0, reached: false, stoppedEarly: true, status: "no-start",
      Wnet: 0,
    });
  }

  const xStop = firstStop(spec, xi, xf, Ki);
  const stoppedEarly = direction > 0 ? xStop < xf - 1e-8 : xStop > xf + 1e-8;
  const xEnd = stoppedEarly ? xStop : xf;
  const Wnet = workExact(spec, xi, xEnd);
  const Kf = Math.max(0, Ki + Wnet);
  const vf = speedFromKe(mass, Kf);
  const liveAreas = signedWork(spec, xi, xEnd);
  return packOutcome({
    mass, v0, xi, xf, spec, n, method, Ki, areas: liveAreas, Wfull, Wapprox, F0,
    s: Math.abs(xEnd - xi), xStop: xEnd, vf, Kf, reached: !stoppedEarly, stoppedEarly,
    status: stoppedEarly ? "stopped-early" : "reached",
    Wnet,
  });
}

function packOutcome(p) {
  const Wnet = p.Wnet ?? p.areas.Wnet;
  const dK = p.Kf - p.Ki;
  const a0 = forceAt(p.spec, p.xi) / Math.max(p.mass, 1e-9);
  return {
    mass: p.mass,
    v0: p.v0,
    xi: p.xi,
    xf: p.xf,
    spec: p.spec,
    n: p.n,
    method: p.method,
    F0: p.F0,
    a0,
    Ki: p.Ki,
    Kf: p.Kf,
    dK,
    vf: p.vf,
    s: p.s,
    xStop: p.xStop,
    Wpos: p.areas.Wpos,
    Wneg: p.areas.Wneg,
    Wnet,
    Wfull: p.Wfull,
    Wapprox: p.Wapprox,
    Wexact: workExact(p.spec, p.xi, p.xStop),
    reached: p.reached,
    stoppedEarly: p.stoppedEarly,
    status: p.status,
    agrees: Math.abs(Wnet - dK) <= Math.max(ENERGY_EPSILON, 0.01 * Math.abs(dK || 1)),
    formula: formulaFor(p.spec),
    approxError: Math.abs(p.Wapprox - p.Wfull),
  };
}

function firstStop(spec, xi, xf, Ki) {
  const samples = 480;
  const dx = (xf - xi) / samples;
  let prevX = xi;
  let prevK = Ki;
  for (let i = 1; i <= samples; i += 1) {
    const x = xi + i * dx;
    const K = Ki + workExact(spec, xi, x);
    if (K <= 1e-9) {
      if (prevK <= 1e-9) return prevX;
      const frac = prevK / Math.max(prevK - K, 1e-12);
      return prevX + frac * (x - prevX);
    }
    prevX = x;
    prevK = K;
  }
  return xf;
}

export function cameraObjectCount() {
  return 1;
}

function durationFor(pred) {
  const dx = Math.abs(pred.xf - pred.xi);
  let t = 2;
  if (pred.status === "no-start" || pred.status === "at-start") t = 1.5;
  else {
    const vAvg = 0.5 * (pred.v0 + pred.vf);
    t = vAvg > VEL_EPSILON ? pred.s / vAvg : dx / Math.max(pred.v0, 0.4);
    if (pred.stoppedEarly && pred.a0 < 0) t = Math.min(t, pred.v0 / Math.max(-pred.a0, 1e-6));
  }
  return clamp((Number.isFinite(t) ? t : 2) + 0.5, DURATION_MIN, DURATION_MAX);
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
    Wnet: live.Wnet,
    Wpos: live.Wpos,
    Wneg: live.Wneg,
    F: live.F,
  });
  if (state.showTrail !== false) {
    state.trail.push({ x: live.x, time: state.time });
    if (state.trail.length > 240) state.trail.shift();
  }
}

export function createState(raw = {}) {
  const scenario = scenarioById(raw.scenario || raw.id);
  const spec = sanitizeSpec(raw.spec ?? scenario.spec);
  const mass = clampMass(raw.mass ?? scenario.mass);
  const v0 = clampSpeed(raw.v0 ?? scenario.v0);
  const xi = clampPos(raw.xi ?? scenario.xi);
  const xf = clampPos(raw.xf ?? scenario.xf);
  const n = clampN(raw.n ?? scenario.n);
  const method = normalizeMethod(raw.method ?? scenario.method);
  const pred = predictedOutcome({ mass, v0, xi, xf, spec, n, method });
  const duration = clamp(Number(raw.duration) || durationFor(pred), DURATION_MIN, DURATION_MAX);
  const dir = xf >= xi ? 1 : -1;
  const state = {
    scenario: scenario.id,
    spec,
    mass,
    v0,
    xi,
    xf,
    n,
    method,
    duration,
    time: 0,
    x: xi,
    vx: v0 * dir,
    done: false,
    reached: false,
    stoppedEarly: false,
    showVectors: raw.showVectors !== false,
    showVelocity: raw.showVelocity !== false,
    showAccel: raw.showAccel !== false,
    showNet: raw.showNet !== false,
    showTrail: raw.showTrail !== false,
    showAreas: raw.showAreas !== false,
    showApprox: raw.showApprox !== false,
    history: [],
    trail: [],
  };
  recordSample(state);
  return state;
}

export function liveState(state) {
  const spec = sanitizeSpec(state.spec);
  const F = forceAt(spec, state.x);
  const a = F / Math.max(state.mass, 1e-9);
  const s = Math.abs(state.x - state.xi);
  const v = Math.abs(state.vx);
  const K = kineticEnergy(state.mass, v);
  const Ki = kineticEnergy(state.mass, state.v0);
  const areas = signedWork(spec, state.xi, state.x);
  const pred = predictedOutcome(state);
  return {
    spec,
    time: state.time,
    x: state.x,
    s,
    v,
    vx: state.vx,
    a,
    F,
    K,
    Ki,
    dK: K - Ki,
    xi: state.xi,
    xf: state.xf,
    n: state.n,
    method: state.method,
    mass: state.mass,
    v0: state.v0,
    done: state.done,
    reached: state.reached,
    stoppedEarly: state.stoppedEarly,
    Wpos: areas.Wpos,
    Wneg: areas.Wneg,
    Wnet: areas.Wnet,
    Wexact: pred.Wexact,
    Wapprox: pred.Wapprox,
    Wfull: pred.Wfull,
    agrees: Math.abs(areas.Wnet - (K - Ki)) <= Math.max(ENERGY_EPSILON, 0.02 * Math.abs(K - Ki || 1)),
    pred,
    motion: motionLabel(state, F, a),
    formula: formulaFor(spec),
  };
}

function motionLabel(state, F, a) {
  if (state.stoppedEarly || (state.done && !state.reached)) return "Stopped early";
  if (state.reached) return "Reached endpoint";
  if (Math.abs(state.xf - state.xi) < 1e-9) return "Zero displacement";
  if (Math.abs(state.vx) <= VEL_EPSILON && Math.abs(F) <= FORCE_EPSILON) return "At rest";
  if (Math.abs(a) < 0.05) return "Constant speed";
  const dir = state.xf >= state.xi ? 1 : -1;
  if (a * dir > 0) return "Speeding up";
  return "Slowing down";
}

export function snapshot(state) {
  const live = liveState(state);
  const pred = live.pred;
  return {
    time: state.time,
    scenario: state.scenario,
    spec: live.spec,
    type: live.spec.type,
    mass: live.mass,
    v0: live.v0,
    v: live.v,
    vf: pred.vf,
    xi: live.xi,
    xf: live.xf,
    x: live.x,
    s: live.s,
    n: live.n,
    method: live.method,
    F: live.F,
    a: live.a,
    Ki: live.Ki,
    K: live.K,
    Kf: pred.Kf,
    dK: live.dK,
    Wpos: live.Wpos,
    Wneg: live.Wneg,
    Wnet: live.Wnet,
    Wexact: pred.Wexact,
    Wapprox: pred.Wapprox,
    Wfull: pred.Wfull,
    reached: live.reached,
    stoppedEarly: live.stoppedEarly,
    done: live.done,
    agrees: live.agrees,
    motion: live.motion,
    formula: live.formula,
    predS: pred.s,
    predKf: pred.Kf,
    predWnet: pred.Wnet,
    predVf: pred.vf,
  };
}

export function reset(state) {
  return createState({
    scenario: state.scenario,
    spec: state.spec,
    mass: state.mass,
    v0: state.v0,
    xi: state.xi,
    xf: state.xf,
    n: state.n,
    method: state.method,
    duration: state.duration,
    showVectors: state.showVectors,
    showVelocity: state.showVelocity,
    showAccel: state.showAccel,
    showNet: state.showNet,
    showTrail: state.showTrail,
    showAreas: state.showAreas,
    showApprox: state.showApprox,
  });
}

export function stepTo(state, targetTime) {
  const goal = clamp(targetTime, 0, state.duration);
  if (goal + 1e-12 < state.time) return state;
  const dir = state.xf >= state.xi ? 1 : -1;
  while (state.time + 1e-12 < goal) {
    if (state.done) {
      state.time = goal;
      break;
    }
    const dt = Math.min(DT, goal - state.time);
    const F = forceAt(state.spec, state.x);
    const a = F / Math.max(state.mass, 1e-9);
    const atEnd = dir > 0 ? state.x >= state.xf - 1e-9 : state.x <= state.xf + 1e-9;

    if (atEnd) {
      state.x = state.xf;
      state.done = true;
      state.reached = true;
      state.stoppedEarly = false;
      state.vx = dir * predictedOutcome(state).vf;
      state.time = goal;
      recordSample(state);
      break;
    }

    if (state.vx * dir <= VEL_EPSILON && F * dir <= FORCE_EPSILON) {
      state.vx = 0;
      state.done = true;
      state.reached = Math.abs(state.x - state.xf) <= 1e-6;
      state.stoppedEarly = !state.reached;
      state.time = goal;
      recordSample(state);
      break;
    }

    let vx = state.vx + a * dt;
    if (state.vx * dir > VEL_EPSILON && vx * dir < 0 && a * dir < 0) {
      const tStop = Math.abs(state.vx) / Math.max(Math.abs(a), 1e-12);
      const used = Math.min(dt, tStop);
      state.x += state.vx * used + 0.5 * a * used * used;
      state.vx = 0;
      state.time += used;
      state.done = true;
      state.reached = Math.abs(state.x - state.xf) <= 1e-6;
      state.stoppedEarly = !state.reached;
      if (dir > 0 && state.x > state.xf) state.x = state.xf;
      if (dir < 0 && state.x < state.xf) state.x = state.xf;
      recordSample(state);
      break;
    }

    state.x += state.vx * dt + 0.5 * a * dt * dt;
    state.vx = vx;
    state.time += dt;
    if (dir > 0 && state.x >= state.xf) {
      state.x = state.xf;
      state.vx = Math.max(0, state.vx);
      state.done = true;
      state.reached = true;
      state.stoppedEarly = false;
    } else if (dir < 0 && state.x <= state.xf) {
      state.x = state.xf;
      state.vx = Math.min(0, state.vx);
      state.done = true;
      state.reached = true;
      state.stoppedEarly = false;
    }
    recordSample(state);
  }
  return state;
}

function dirty(state) {
  if (state.time > 1e-12 || state.done) return reset(state);
  state.history = [];
  state.trail = [];
  if (state.time < 1e-12) {
    state.x = state.xi;
    state.vx = clampSpeed(state.v0) * (state.xf >= state.xi ? 1 : -1);
  }
  recordSample(state);
  return state;
}

export function setMass(state, mass) {
  state.mass = clampMass(mass);
  return dirty(state);
}

export function setSpeed(state, v0) {
  state.v0 = clampSpeed(v0);
  if (state.time < 1e-12) state.vx = state.v0 * (state.xf >= state.xi ? 1 : -1);
  return dirty(state);
}

export function setInterval(state, xi, xf) {
  state.xi = clampPos(xi);
  state.xf = clampPos(xf);
  return dirty(state);
}

export function setSpec(state, spec) {
  state.spec = sanitizeSpec(spec);
  return dirty(state);
}

export function setN(state, n) {
  state.n = clampN(n);
  return dirty(state);
}

export function setMethod(state, method) {
  state.method = normalizeMethod(method);
  return dirty(state);
}

export function historySeries(state) {
  return state.history.map((sample) => ({ ...sample }));
}

export function sampleHistory(state, t) {
  const history = state.history;
  if (!history.length) return { time: t, x: state.xi, s: 0 };
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
  if (roll < 0.16) {
    return {
      type: "rect-w",
      prompt: "A constant 6 N force acts from x = 0 to x = 4 m. Find the work.",
      givens: [
        { label: "Fₓ", value: "6 N" },
        { label: "Δx", value: "4.0 m" },
      ],
      params: { scenario: "constant" },
      targets: { Wnet: 24 },
      unknownLabel: "W",
      goalLabel: formatUnsigned(24, "J"),
      solutionHint: "The graph is a 6 N by 4 m rectangle. W = F Δx = 24 J.",
    };
  }
  if (roll < 0.32) {
    return {
      type: "tri-w",
      prompt: "Force rises linearly from 0 N at 0 m to 8 N at 4 m. Find the work.",
      givens: [
        { label: "base", value: "4.0 m" },
        { label: "height", value: "8 N" },
      ],
      params: { scenario: "triangle" },
      targets: { Wnet: 16 },
      unknownLabel: "W",
      goalLabel: formatUnsigned(16, "J"),
      solutionHint: "Triangle area is ½bh = ½(4)(8) = 16 J. Using the peak force times Δx would overestimate.",
    };
  }
  if (roll < 0.48) {
    return {
      type: "trap-w",
      prompt: "Force rises linearly from 2 N at 0 m to 10 N at 4 m. Find the work.",
      givens: [
        { label: "Fᵢ", value: "2 N" },
        { label: "F_f", value: "10 N" },
        { label: "Δx", value: "4.0 m" },
      ],
      params: { scenario: "trapezoid" },
      targets: { Wnet: 24 },
      unknownLabel: "W",
      goalLabel: formatUnsigned(24, "J"),
      solutionHint: "F_avg = (2+10)/2 = 6 N. W = 6 × 4 = 24 J, the trapezoid area.",
    };
  }
  if (roll < 0.64) {
    return {
      type: "signed-w",
      prompt: "+6 N from 0–2 m, then −3 N from 2–4 m. Find the net work.",
      givens: [
        { label: "W₊", value: "12 J" },
        { label: "W₋", value: "−6 J" },
      ],
      params: { scenario: "signed" },
      targets: { Wnet: 6 },
      unknownLabel: "W_net",
      goalLabel: formatUnsigned(6, "J"),
      solutionHint: "W₊ = 6×2 = 12 J. W₋ = (−3)×2 = −6 J. W_net = 12 − 6 = 6 J.",
    };
  }
  if (roll < 0.8) {
    return {
      type: "zero-w",
      prompt: "+4 N from 0–2 m and −4 N from 2–4 m. Find W_net and K_f if Kᵢ = 9 J.",
      givens: [
        { label: "Kᵢ", value: "9 J" },
        { label: "areas", value: "+8 J and −8 J" },
      ],
      params: { scenario: "cancel" },
      targets: { Wnet: 0, Kf: 9 },
      unknownLabel: "W_net",
      goalLabel: formatUnsigned(0, "J"),
      solutionHint: "The signed areas cancel, so W_net = 0 and K_f = Kᵢ = 9 J. Zero net work is not rest.",
    };
  }
  return {
    type: "curve-w",
    prompt: "Fₓ(x) = 2x (x in meters, F in newtons) from 0 m to 4 m. Find the exact work.",
    givens: [
      { label: "Fₓ(x)", value: "2x N" },
      { label: "interval", value: "0 to 4 m" },
    ],
    params: { scenario: "curved" },
    targets: { Wnet: 16, Wfull: 16 },
    unknownLabel: "W",
    goalLabel: formatUnsigned(16, "J"),
    solutionHint: "∫₀⁴ 2x dx = x² from 0 to 4 = 16 J. Left rectangles underestimate this increasing graph.",
  };
}

export function challengeTolerance(value) {
  return Math.max(0.08, 0.04 * Math.abs(value || 1));
}

export function evaluateChallenge(measured, spec) {
  const W = measured.Wexact ?? measured.Wnet ?? 0;
  if (spec.type === "zero-w") {
    const wOk = Math.abs(W - spec.targets.Wnet) <= challengeTolerance(spec.targets.Wnet);
    const kOk = Math.abs((measured.Kf ?? measured.K ?? 0) - spec.targets.Kf) <= challengeTolerance(spec.targets.Kf);
    return { ok: wOk && kOk, Wnet: W };
  }
  return { ok: Math.abs(W - spec.targets.Wnet) <= challengeTolerance(spec.targets.Wnet), Wnet: W };
}

export function teacherReport(state) {
  const snap = snapshot(state);
  const stop = snap.stoppedEarly
    ? ` · stops at ${formatUnsigned(snap.x, "m")} of requested ${formatUnsigned(snap.xf, "m")}`
    : snap.reached
      ? " · endpoint reached"
      : "";
  return (
    `${snap.motion} · W_exact = ${formatSigned(snap.Wexact, "J")} · ${snap.method} n=${snap.n} gives ${formatSigned(snap.Wapprox, "J")}` +
    ` · ΔK = ${formatSigned(snap.dK, "J")}${stop}`
  );
}

export function editorParams(spec) {
  const clean = sanitizeSpec(spec);
  if (clean.type === "piecewise-constant") {
    const a = clean.segments[0] || { x0: 0, x1: 2, F: 6 };
    const b = clean.segments[1] || { x0: 2, x1: 4, F: -3 };
    return { type: clean.type, F: a.F, F2: b.F, split: a.x1, points: clean.segments };
  }
  if (clean.type === "piecewise-linear") {
    const pts = [...clean.points];
    while (pts.length < 3) pts.push({ x: pts[pts.length - 1].x + 2, F: pts[pts.length - 1].F });
    return { type: clean.type, points: pts.slice(0, 3) };
  }
  if (clean.type === "proportional") return { type: clean.type, c: clean.c };
  if (clean.type === "quadratic") return { type: clean.type, a: clean.a };
  if (clean.type === "spring") return { type: clean.type, k: clean.k };
  if (clean.type === "sine") return { type: clean.type, F0: clean.F0, q: clean.q };
  return { type: "constant", F: clean.F };
}

export function specFromEditor(type, fields) {
  if (type === "piecewise-constant") {
    const split = clampPos(fields.split ?? 2);
    const xi = clampPos(fields.xi ?? 0);
    const xf = clampPos(fields.xf ?? 4);
    const lo = Math.min(xi, xf, split);
    const hi = Math.max(xi, xf, split);
    return sanitizeSpec({
      type,
      segments: [
        { x0: lo, x1: split, F: fields.F1seg ?? fields.F ?? 6 },
        { x0: split, x1: hi, F: fields.F2seg ?? fields.F2 ?? -3 },
      ],
    });
  }
  if (type === "piecewise-linear") {
    return sanitizeSpec({
      type,
      points: [
        { x: fields.x0 ?? 0, F: fields.F0 ?? 0 },
        { x: fields.x1 ?? 2, F: fields.F1 ?? 6 },
        { x: fields.x2 ?? 4, F: fields.F2pt ?? fields.F2 ?? 2 },
      ],
    });
  }
  if (type === "proportional") return sanitizeSpec({ type, c: fields.c ?? 2 });
  if (type === "quadratic") return sanitizeSpec({ type, a: fields.a ?? 0.75 });
  if (type === "spring") return sanitizeSpec({ type, k: fields.k ?? 4 });
  if (type === "sine") return sanitizeSpec({ type, F0: fields.Famp ?? fields.F0 ?? 6, q: fields.q ?? Math.PI / 4 });
  return sanitizeSpec({ type: "constant", F: fields.F ?? 6 });
}
