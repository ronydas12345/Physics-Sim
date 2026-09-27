/**
 * One-dimensional relative motion for Simulation 1.4.
 * World positions evolve as x = x₀ + vt. Frames only change how that motion is described.
 */

import { clamp, formatSigned, formatUnsigned } from "./kinematics1d.js";

export { clamp, formatSigned, formatUnsigned };
export const DT = 0.01;
export const DIAGRAM_DT = 0.5;
export const DURATION_MIN = 1;
export const DURATION_MAX = 20;
export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 2, 4];
export const AXIS_PAD = 8;

export const FRAMES = [
  { id: "ground", label: "Ground" },
  { id: "A", label: "Object A" },
  { id: "B", label: "Object B" },
];

export const PRESETS = [
  { id: "same-v", label: "Same velocity", xA: 0, vA: 5, xB: 10, vB: 5 },
  { id: "a-faster", label: "A faster than B", xA: 0, vA: 8, xB: 20, vB: 3 },
  { id: "b-faster", label: "B faster than A", xA: 0, vA: 3, xB: 20, vB: 8 },
  { id: "opposite", label: "Opposite directions", xA: -10, vA: 5, xB: 10, vB: -5 },
  { id: "b-still", label: "B stationary", xA: 0, vA: 5, xB: 20, vB: 0 },
  { id: "a-observer", label: "A as observer", xA: 0, vA: 10, xB: 8, vB: 6 },
];

export function positionAt(x0, v, t) {
  return x0 + v * t;
}

export function relativePosition(xObject, xReference) {
  return xObject - xReference;
}

export function relativeVelocity(vObject, vReference) {
  return vObject - vReference;
}

/** Time when xA(t) = xB(t). Null if they never meet (same velocity, different start). */
export function meetingTime({ xA, vA, xB, vB }) {
  const dv = vA - vB;
  if (Math.abs(dv) < 1e-12) {
    return Math.abs(xA - xB) < 1e-9 ? 0 : null;
  }
  return (xB - xA) / dv;
}

export function meetingForecast(params, duration) {
  const t = meetingTime(params);
  if (t == null) return { kind: "none", time: null };
  if (t < -1e-9) return { kind: "past", time: t };
  if (t > duration + 1e-9) return { kind: "beyond", time: t };
  return { kind: t < 1e-9 ? "now" : "future", time: t };
}

export function viewInFrame(world, frame) {
  if (frame === "A") {
    return {
      xA: 0,
      vA: 0,
      xB: world.xB - world.xA,
      vB: world.vB - world.vA,
    };
  }
  if (frame === "B") {
    return {
      xA: world.xA - world.xB,
      vA: world.vA - world.vB,
      xB: 0,
      vB: 0,
    };
  }
  return {
    xA: world.xA,
    vA: world.vA,
    xB: world.xB,
    vB: world.vB,
  };
}

export function createState({
  xA = 0,
  vA = 5,
  xB = 10,
  vB = 5,
  duration = 10,
  frame = "ground",
} = {}) {
  const T = clamp(Number(duration) || 10, DURATION_MIN, DURATION_MAX);
  const a0 = Number(xA);
  const b0 = Number(xB);
  const va = Number(vA);
  const vb = Number(vB);
  return {
    xA0: a0,
    vA: va,
    xB0: b0,
    vB: vb,
    duration: T,
    frame,
    time: 0,
    xA: a0,
    xB: b0,
    met: Math.abs(a0 - b0) < 1e-9,
    history: [{ time: 0, xA: a0, xB: b0, vA: va, vB: vb }],
  };
}

export function snapshot(state) {
  return {
    time: state.time,
    xA: state.xA,
    xB: state.xB,
    vA: state.vA,
    vB: state.vB,
    xAB: state.xA - state.xB,
    xBA: state.xB - state.xA,
    vAB: state.vA - state.vB,
    vBA: state.vB - state.vA,
    separation: Math.abs(state.xA - state.xB),
    frame: state.frame,
    met: Boolean(state.met),
  };
}

export function reset(state) {
  return createState({
    xA: state.xA0,
    vA: state.vA,
    xB: state.xB0,
    vB: state.vB,
    duration: state.duration,
    frame: "ground",
  });
}

function recordSample(state) {
  const last = state.history[state.history.length - 1];
  if (last && Math.abs(state.time - last.time) < DT * 0.5) {
    last.time = state.time;
    last.xA = state.xA;
    last.xB = state.xB;
    last.vA = state.vA;
    last.vB = state.vB;
    return;
  }
  state.history.push({
    time: state.time,
    xA: state.xA,
    xB: state.xB,
    vA: state.vA,
    vB: state.vB,
  });
}

const MEET_GAP = 0.05;

export function stepTo(state, targetTime) {
  const goal = clamp(targetTime, 0, state.duration);
  if (goal + 1e-12 < state.time) return state;
  const tMeet = meetingTime({ xA: state.xA0, vA: state.vA, xB: state.xB0, vB: state.vB });
  while (state.time + 1e-12 < goal) {
    const prevGap = state.xA - state.xB;
    const dt = Math.min(DT, goal - state.time);
    state.time += dt;
    state.xA = positionAt(state.xA0, state.vA, state.time);
    state.xB = positionAt(state.xB0, state.vB, state.time);
    const gap = state.xA - state.xB;
    const crossed = prevGap === 0 || gap === 0 || prevGap * gap < 0;
    const close = Math.abs(gap) <= MEET_GAP;
    const reached = tMeet != null && tMeet >= -1e-9 && state.time + 1e-9 >= tMeet;
    if (crossed || close || reached) state.met = true;
    recordSample(state);
  }
  return state;
}

export function historyInFrame(state, frame = state.frame) {
  return state.history.map((sample) => {
    const view = viewInFrame(sample, frame);
    return {
      time: sample.time,
      xA: view.xA,
      xB: view.xB,
      vA: view.vA,
      vB: view.vB,
      xAB: sample.xA - sample.xB,
      vAB: sample.vA - sample.vB,
    };
  });
}

export function sampleHistory(state, t) {
  const history = state.history;
  if (!history.length) return { time: t, xA: state.xA, xB: state.xB, vA: state.vA, vB: state.vB };
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
        xA: a.xA + (b.xA - a.xA) * u,
        xB: a.xB + (b.xB - a.xB) * u,
        vA: a.vA,
        vB: a.vB,
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

function randInt(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function generateChallenge(rng = Math.random) {
  const roll = rng();
  if (roll < 0.34) {
    const vA = (rng() < 0.5 ? -1 : 1) * randInt(3, 10, rng);
    const vB = (rng() < 0.5 ? -1 : 1) * randInt(0, 8, rng);
    const vAB = vA - vB;
    return {
      type: "rel-v",
      prompt: "Find the velocity of A relative to B. You can read it from the relative-motion panel or run the lab.",
      givens: [
        { label: "v_A", value: formatSigned(vA, "m/s") },
        { label: "v_B", value: formatSigned(vB, "m/s") },
      ],
      params: { xA: 0, vA, xB: 12, vB, duration: 8 },
      targets: { vAB },
      unknownLabel: "v_A/B = v_A − v_B",
      goalLabel: "velocity of A relative to B",
      solutionHint: `v_A/B = (${vA}) − (${vB}) = ${vAB} m/s`,
    };
  }

  if (roll < 0.67) {
    const v = randInt(3, 8, rng);
    const gap = randInt(6, 16, rng);
    return {
      type: "same-v",
      prompt: "A and B have the same ground velocity. Check that neither moves relative to the other.",
      givens: [
        { label: "v_A", value: formatSigned(v, "m/s") },
        { label: "v_B", value: formatSigned(v, "m/s") },
        { label: "x_B − x_A", value: formatUnsigned(gap, "m") },
      ],
      params: { xA: 0, vA: v, xB: gap, vB: v, duration: 6 },
      targets: { vAB: 0, separation: gap },
      unknownLabel: "v_A/B when the ground velocities match",
      goalLabel: "relative velocity of zero",
      solutionHint: "v_A/B = v_A − v_B = 0. They still both move relative to the ground.",
    };
  }

  const vA = randInt(4, 10, rng);
  const vB = randInt(0, vA - 1, rng);
  const xA = 0;
  const xB = randInt(8, 20, rng);
  const tMeet = meetingTime({ xA, vA, xB, vB });
  return {
    type: "meeting",
    prompt: "A is catching B. Check when they meet (they pass through each other).",
    givens: [
      { label: "x_A", value: formatSigned(xA, "m") },
      { label: "v_A", value: formatSigned(vA, "m/s") },
      { label: "x_B", value: formatSigned(xB, "m") },
      { label: "v_B", value: formatSigned(vB, "m/s") },
    ],
    params: { xA, vA, xB, vB, duration: clamp(tMeet + 2, DURATION_MIN, DURATION_MAX) },
    targets: { time: tMeet },
    unknownLabel: "t = (x_B − x_A) / (v_A − v_B)",
    goalLabel: "time when the objects meet",
    solutionHint: `t = (${xB} − ${xA}) / (${vA} − ${vB}) = ${tMeet.toFixed(2)} s`,
  };
}

export function challengeTolerance(value) {
  return Math.max(0.15, 0.04 * Math.abs(value));
}

export function evaluateChallenge(measured, spec) {
  if (spec.type === "rel-v") {
    const err = Math.abs(measured.vAB - spec.targets.vAB);
    const ok = err <= challengeTolerance(spec.targets.vAB);
    return { ok, vAB: measured.vAB, time: measured.time, xAB: measured.xAB };
  }
  if (spec.type === "same-v") {
    const vOk = Math.abs(measured.vAB) <= 0.2;
    const sepOk = Math.abs(measured.separation - spec.targets.separation) <= challengeTolerance(spec.targets.separation);
    return { ok: vOk && sepOk, vAB: measured.vAB, separation: measured.separation, time: measured.time };
  }
  const timeOk = Math.abs(measured.time - spec.targets.time) <= Math.max(0.12, challengeTolerance(spec.targets.time));
  const meetOk = measured.separation <= 0.6 || measured.met;
  return { ok: timeOk && meetOk, time: measured.time, separation: measured.separation, vAB: measured.vAB };
}

export function teacherReport(state) {
  const snap = snapshot(state);
  const view = viewInFrame(state, state.frame);
  const meet = meetingForecast({ xA: state.xA0, vA: state.vA, xB: state.xB0, vB: state.vB }, state.duration);
  const meetText =
    meet.kind === "future" || meet.kind === "now"
      ? `meet at t=${meet.time.toFixed(2)} s`
      : "no future meeting in this run";
  return (
    `World x_A=${formatSigned(state.xA, "m")} v_A=${formatSigned(state.vA, "m/s")} · ` +
    `x_B=${formatSigned(state.xB, "m")} v_B=${formatSigned(state.vB, "m/s")} · ` +
    `v_A/B = v_A − v_B = ${formatSigned(snap.vAB, "m/s")} · ` +
    `x_A/B = x_A − x_B = ${formatSigned(snap.xAB, "m")} · ` +
    `frame ${state.frame}: A at ${formatSigned(view.xA, "m")} (${formatSigned(view.vA, "m/s")}), ` +
    `B at ${formatSigned(view.xB, "m")} (${formatSigned(view.vB, "m/s")}) · ${meetText}`
  );
}
