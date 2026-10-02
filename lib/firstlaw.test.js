import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateNetForce,
  createAppliedForce,
  createState,
  disableHorizontalForces,
  enableFriction,
  isBalanced,
  isInertia,
  liveState,
  motionLabel,
  reset,
  snapshot,
  stepTo,
} from "./firstlaw.js";

function almost(actual, expected, eps = 1e-6) {
  assert.ok(Math.abs(actual - expected) < eps, `${actual} ≉ ${expected}`);
}

describe("2.4 Newton's first law", () => {
  it("keeps v = 0 when F_net = 0", () => {
    const state = createState({ scenario: "rest" });
    stepTo(state, 4);
    const live = liveState(state);
    almost(live.vx, 0);
    almost(live.ax, 0);
    assert.equal(live.balanced, true);
    assert.equal(live.motion, "At Rest");
  });

  it("keeps v = +5 when F_net = 0", () => {
    const state = createState({ scenario: "moving-eq" });
    const before = liveState(state).vx;
    almost(before, 5);
    stepTo(state, 4);
    const live = liveState(state);
    almost(live.vx, 5);
    almost(live.ax, 0);
    almost(live.net.x, 0, 1e-6);
    assert.equal(live.motion, "Constant Velocity");
  });

  it("keeps v = −5 when F_net = 0", () => {
    const state = createState({ scenario: "left-eq" });
    stepTo(state, 3);
    const live = liveState(state);
    almost(live.vx, -5);
    almost(live.ax, 0);
    assert.equal(live.balanced, true);
  });

  it("gives a = +2 m/s² for v = +5, F_net = +10 N, m = 5 kg", () => {
    const state = createState({ scenario: "unbalanced" });
    const live = liveState(state);
    almost(live.net.x, 10);
    almost(live.ax, 2);
    stepTo(state, 2);
    almost(liveState(state).vx, 5 + 2 * 2, 1e-4);
  });

  it("gives a = −2 m/s² when a 10 N friction opposes +5 m/s", () => {
    const state = createState({ scenario: "friction" });
    almost(liveState(state).ax, 0);
    almost(liveState(state).vx, 5);
    enableFriction(state, true);
    const live = liveState(state);
    almost(live.net.x, -10);
    almost(live.ax, -2);
  });

  it("keeps both 20 N arrows while F_net = 0", () => {
    const state = createState({ scenario: "moving-eq" });
    const horiz = state.forces.filter((f) => f.type === "applied");
    assert.equal(horiz.length, 2);
    assert.equal(horiz.every((f) => f.enabled && Math.abs(f.magnitude - 20) < 1e-9), true);
    const net = calculateNetForce(state.forces);
    almost(net.x, 0);
    assert.equal(isBalanced(net), true);
  });

  it("gives F_net = +10 N from 30 N right and 20 N left", () => {
    const net = calculateNetForce([createAppliedForce(30, 0), createAppliedForce(20, 180)]);
    almost(net.x, 10);
    almost(net.magnitude, 10);
  });

  it("gives the smaller mass the larger acceleration under the same force", () => {
    const state = createState({ scenario: "inertia" });
    assert.equal(isInertia(state), true);
    const live = liveState(state);
    almost(live.Fnet, 16);
    almost(live.aA, 8);
    almost(live.aB, 2);
    assert.ok(Math.abs(live.aA) > Math.abs(live.aB));
  });

  it("continues at +5 m/s after both horizontal forces are removed", () => {
    const state = createState({ scenario: "remove-forces" });
    disableHorizontalForces(state);
    const coast = reset(state);
    stepTo(coast, 3);
    almost(liveState(coast).vx, 5);
    almost(liveState(coast).ax, 0);
  });

  it("treats rest as a special case of constant velocity", () => {
    assert.equal(motionLabel(0, 0), "At Rest");
    assert.equal(motionLabel(5, 0), "Constant Velocity");
    assert.equal(motionLabel(-5, 0), "Constant Velocity");
    assert.equal(motionLabel(5, 2), "Speeding Up");
    assert.equal(motionLabel(5, -2), "Slowing Down");
  });

  it("does not invent stopping on reset while F_net is still zero", () => {
    const state = createState({ scenario: "moving-eq" });
    stepTo(state, 2);
    const next = reset(state);
    almost(next.vx0, 5);
    almost(liveState(next).ax, 0);
    assert.equal(snapshot(next).forceState, "EQUILIBRIUM");
  });
});
