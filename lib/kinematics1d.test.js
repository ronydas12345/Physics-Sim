import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  accumulatePath,
  createState,
  distanceAt,
  evaluateAt,
  evaluateChallenge,
  generateChallenge,
  positionAt,
  reset,
  reversalTime,
  diagramSpacings,
  motionDiagramSamples,
  stepTo,
  velocityAt,
} from "./kinematics1d.js";

describe("1.2 displacement, velocity, and acceleration", () => {
  it("keeps constant velocity: x₀=0, v₀=5, a=0, t=4", () => {
    const params = { initialPosition: 0, initialVelocity: 5, acceleration: 0 };
    const snap = evaluateAt(params, 4);
    assert.equal(snap.position, 20);
    assert.equal(snap.velocity, 5);
    assert.equal(snap.acceleration, 0);
    assert.equal(snap.displacement, 20);
    assert.equal(snap.averageVelocity, 5);
    assert.equal(snap.averageAcceleration, 0);
  });

  it("applies constant positive acceleration: x₀=0, v₀=0, a=2, t=4", () => {
    const params = { initialPosition: 0, initialVelocity: 0, acceleration: 2 };
    const snap = evaluateAt(params, 4);
    assert.equal(snap.position, 16);
    assert.equal(snap.velocity, 8);
    assert.equal(snap.acceleration, 2);
    assert.equal(snap.averageVelocity, 4);
    assert.equal(snap.averageAcceleration, 2);
  });

  it("moves in the negative direction at constant velocity", () => {
    const params = { initialPosition: 10, initialVelocity: -3, acceleration: 0 };
    const snap = evaluateAt(params, 2);
    assert.equal(snap.position, 4);
    assert.equal(snap.displacement, -6);
    assert.equal(snap.velocity, -3);
    assert.equal(snap.distance, 6);
  });

  it("reaches rest under negative acceleration: x₀=0, v₀=8, a=-2, t=4", () => {
    const params = { initialPosition: 0, initialVelocity: 8, acceleration: -2 };
    const snap = evaluateAt(params, 4);
    assert.equal(snap.position, 16);
    assert.equal(snap.velocity, 0);
    assert.equal(snap.acceleration, -2);
    assert.equal(reversalTime(params), 4);
  });

  it("reverses after stopping: x₀=0, v₀=8, a=-2, t=6", () => {
    const params = { initialPosition: 0, initialVelocity: 8, acceleration: -2 };
    const snap = evaluateAt(params, 6);
    assert.equal(snap.position, 12);
    assert.equal(snap.velocity, -4);
    assert.equal(snap.displacement, 12);
    assert.equal(snap.distance, 20);
    assert.equal(snap.averageVelocity, 2);
    assert.equal(snap.averageAcceleration, -2);
  });

  it("does not treat negative acceleration as automatically moving left", () => {
    const params = { initialPosition: 0, initialVelocity: 8, acceleration: -2 };
    const early = evaluateAt(params, 2);
    assert.ok(early.velocity > 0);
    assert.equal(early.acceleration, -2);
    assert.equal(positionAt(params, 2), 12);
    assert.equal(velocityAt(params, 2), 4);
  });

  it("accumulates sampled path 0 → +5 → +2 as D = 8 m, Δx = +2 m", () => {
    const path = accumulatePath([0, 5, 2]);
    assert.equal(path.position, 2);
    assert.equal(path.displacement, 2);
    assert.equal(path.distance, 8);
  });

  it("accumulates 0 → +5 → 0 → −3 as D = 13 m, Δx = −3 m", () => {
    const path = accumulatePath([0, 5, 0, -3]);
    assert.equal(path.position, -3);
    assert.equal(path.displacement, -3);
    assert.equal(path.distance, 13);
  });

  it("keeps distance non-negative", () => {
    const params = { initialPosition: 0, initialVelocity: -5, acceleration: 1 };
    assert.ok(distanceAt(params, 8) >= 0);
  });

  it("matches closed-form values when stepping at DT", () => {
    const state = createState({
      initialPosition: 0,
      initialVelocity: 8,
      acceleration: -2,
      duration: 8,
    });
    stepTo(state, 6);
    const snap = evaluateAt(state, 6);
    assert.ok(Math.abs(state.position - 12) < 1e-9);
    assert.ok(Math.abs(state.velocity + 4) < 1e-9);
    assert.ok(Math.abs(state.distance - snap.distance) < 0.05);
    assert.equal(state.reversed, true);
  });

  it("clears time, path, and history on reset", () => {
    const state = createState({
      initialPosition: 2,
      initialVelocity: 5,
      acceleration: -1,
      duration: 8,
    });
    stepTo(state, 3);
    const next = reset(state);
    assert.equal(next.time, 0);
    assert.equal(next.position, 2);
    assert.equal(next.velocity, 5);
    assert.equal(next.distance, 0);
    assert.equal(next.reversed, false);
    assert.equal(next.history.length, 1);
    assert.equal(next.history[0].time, 0);
  });

  it("does not rewind when pausing conceptually — stepTo ignores earlier targets", () => {
    const state = createState({ initialVelocity: 4, acceleration: 0, duration: 10 });
    stepTo(state, 2);
    const t = state.time;
    const x = state.position;
    stepTo(state, 1);
    assert.equal(state.time, t);
    assert.equal(state.position, x);
  });

  it("accepts a stop-time challenge at v = 0", () => {
    const spec = generateChallenge(() => 0.1);
    assert.equal(spec.type, "stop-time");
    const snap = evaluateAt(spec.params, spec.targets.time);
    const result = evaluateChallenge(snap, spec);
    assert.equal(result.ok, true);
  });

  it("accepts a position-at-t challenge at the given time", () => {
    const spec = generateChallenge(() => 0.5);
    assert.equal(spec.type, "position-at-t");
    const snap = evaluateAt(spec.params, spec.targets.time);
    const result = evaluateChallenge(snap, spec);
    assert.equal(result.ok, true);
  });
});

describe("1.3 representations and wall collisions", () => {
  it("keeps equal motion-diagram spacing at constant velocity", () => {
    const state = createState({ initialPosition: 0, initialVelocity: 4, acceleration: 0, duration: 6 });
    stepTo(state, 2);
    const dots = motionDiagramSamples(state, 0.5);
    const gaps = diagramSpacings(dots);
    assert.ok(gaps.length >= 3);
    for (const gap of gaps) assert.ok(Math.abs(gap - 2) < 0.05);
  });

  it("increases motion-diagram spacing while speeding up from rest", () => {
    const state = createState({ initialPosition: 0, initialVelocity: 0, acceleration: 2, duration: 6 });
    stepTo(state, 2);
    const gaps = diagramSpacings(motionDiagramSamples(state, 0.5));
    for (let i = 1; i < gaps.length; i += 1) assert.ok(gaps[i] > gaps[i - 1]);
  });

  it("leaves the axis when collisions are off", () => {
    const state = createState({ initialPosition: 0, initialVelocity: 15, acceleration: 0, duration: 4, collide: false });
    stepTo(state, 2);
    assert.ok(state.position > 20);
    assert.equal(state.bounces, 0);
  });

  it("elastically reverses velocity at the walls when collisions are on", () => {
    const state = createState({
      initialPosition: 0,
      initialVelocity: 10,
      acceleration: 0,
      duration: 8,
      collide: true,
    });
    stepTo(state, 3);
    assert.ok(Math.abs(state.position - 10) < 0.15);
    assert.ok(Math.abs(state.velocity + 10) < 0.15);
    assert.ok(state.bounces >= 1);
    assert.ok(state.position <= 20 + 1e-9);
    assert.ok(state.distance > 20);
  });

  it("keeps motion-diagram samples on the same history as the object", () => {
    const state = createState({ initialPosition: 0, initialVelocity: 6, acceleration: -2, duration: 8 });
    stepTo(state, 3);
    const dots = motionDiagramSamples(state, 0.5);
    const at3 = dots[dots.length - 1];
    assert.ok(Math.abs(at3.position - state.position) < 0.05);
    assert.ok(Math.abs(state.velocity) < 0.05);
  });
});
