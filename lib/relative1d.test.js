import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createState,
  evaluateChallenge,
  generateChallenge,
  historyInFrame,
  meetingForecast,
  meetingTime,
  relativePosition,
  relativeVelocity,
  reset,
  stepTo,
  viewInFrame,
} from "./relative1d.js";

describe("1.4 reference frames and relative motion", () => {
  it("gives v_A/B = 0 when both objects have the same velocity", () => {
    const state = createState({ xA: 0, vA: 5, xB: 10, vB: 5, duration: 6 });
    stepTo(state, 4);
    assert.equal(relativeVelocity(state.vA, state.vB), 0);
    assert.equal(relativeVelocity(state.vB, state.vA), 0);
    assert.equal(Math.abs(state.xA - state.xB), 10);
  });

  it("gives opposite relative velocities when A is faster in the same direction", () => {
    const vAB = relativeVelocity(8, 3);
    const vBA = relativeVelocity(3, 8);
    assert.equal(vAB, 5);
    assert.equal(vBA, -5);
  });

  it("adds speeds when the objects move in opposite directions", () => {
    assert.equal(relativeVelocity(5, -5), 10);
    assert.equal(relativeVelocity(-5, 5), -10);
  });

  it("treats a stationary object as v = 0 in the ground frame", () => {
    assert.equal(relativeVelocity(5, 0), 5);
    assert.equal(relativeVelocity(0, 5), -5);
  });

  it("places A at the origin in A's frame without changing world coordinates", () => {
    const world = { xA: 20, vA: 5, xB: 30, vB: 2 };
    const view = viewInFrame(world, "A");
    assert.equal(view.xA, 0);
    assert.equal(view.vA, 0);
    assert.equal(view.xB, 10);
    assert.equal(view.vB, -3);
    assert.equal(world.xA, 20);
    assert.equal(world.vB, 2);
  });

  it("makes both objects appear at rest in A's frame when they share a velocity", () => {
    const view = viewInFrame({ xA: 4, vA: 7, xB: 12, vB: 7 }, "A");
    assert.equal(view.vA, 0);
    assert.equal(view.vB, 0);
    const ground = viewInFrame({ xA: 4, vA: 7, xB: 12, vB: 7 }, "ground");
    assert.equal(ground.vA, 7);
    assert.equal(ground.vB, 7);
  });

  it("keeps x_A/B = −x_B/A", () => {
    const xAB = relativePosition(20, 30);
    const xBA = relativePosition(30, 20);
    assert.equal(xAB, -10);
    assert.equal(xBA, 10);
    assert.equal(xAB, -xBA);
  });

  it("predicts the meeting time for a closing pair", () => {
    const t = meetingTime({ xA: 0, vA: 8, xB: 20, vB: 3 });
    assert.equal(t, 4);
    const state = createState({ xA: 0, vA: 8, xB: 20, vB: 3, duration: 8 });
    stepTo(state, 4);
    assert.ok(Math.abs(state.xA - state.xB) < 0.05);
    assert.equal(state.met, true);
    stepTo(state, 5);
    assert.equal(state.met, true);
  });

  it("does not invent a meeting when relative velocity is zero and they start apart", () => {
    assert.equal(meetingTime({ xA: 0, vA: 5, xB: 10, vB: 5 }), null);
    assert.equal(meetingForecast({ xA: 0, vA: 5, xB: 10, vB: 5 }, 10).kind, "none");
  });

  it("withholds a meeting time when they are moving apart or the meeting is past the duration", () => {
    assert.equal(meetingForecast({ xA: 0, vA: 3, xB: 20, vB: 8 }, 10).kind, "past");
    assert.equal(meetingForecast({ xA: 0, vA: 8, xB: 20, vB: 3 }, 2).kind, "beyond");
    assert.equal(meetingForecast({ xA: 0, vA: 8, xB: 20, vB: 3 }, 8).kind, "future");
  });

  it("puts B at rest in B's frame and reverses A's relative velocity for opposite motion", () => {
    const world = { xA: -10, vA: 5, xB: 10, vB: -5 };
    const fromB = viewInFrame(world, "B");
    assert.equal(fromB.xB, 0);
    assert.equal(fromB.vB, 0);
    assert.equal(fromB.xA, -20);
    assert.equal(fromB.vA, 10);
    const fromA = viewInFrame(world, "A");
    assert.equal(fromA.vA, 0);
    assert.equal(fromA.vB, -10);
    assert.equal(world.vA, 5);
    assert.equal(world.vB, -5);
  });

  it("keeps A at the origin in A's frame history while world motion continues", () => {
    const state = createState({ xA: 0, vA: 8, xB: 20, vB: 3, duration: 4 });
    stepTo(state, 4);
    const hist = historyInFrame(state, "A");
    assert.ok(hist.length > 1);
    for (const sample of hist) {
      assert.ok(Math.abs(sample.xA) < 1e-9);
      assert.ok(Math.abs(sample.vA) < 1e-9);
    }
    assert.ok(state.xA > 0);
  });

  it("clears time and meeting state on reset", () => {
    const state = createState({ xA: 0, vA: 8, xB: 20, vB: 3, duration: 8, frame: "A" });
    stepTo(state, 4);
    const next = reset(state);
    assert.equal(next.time, 0);
    assert.equal(next.xA, 0);
    assert.equal(next.xB, 20);
    assert.equal(next.frame, "ground");
    assert.equal(next.met, false);
    assert.equal(next.history.length, 1);
  });

  it("accepts a relative-velocity challenge", () => {
    const spec = generateChallenge(() => 0.1);
    assert.equal(spec.type, "rel-v");
    const measured = {
      vAB: spec.targets.vAB,
      time: 0,
      xAB: spec.params.xA - spec.params.xB,
      separation: Math.abs(spec.params.xA - spec.params.xB),
      met: false,
    };
    assert.equal(evaluateChallenge(measured, spec).ok, true);
  });
});
