import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyForceLockMass,
  applyMassLockForce,
  calculateNetForce,
  createAppliedForce,
  createState,
  enableFriction,
  liveFromSchedule,
  liveState,
  motionLabel,
  predictedAccel,
  reset,
  setNetX,
  snapshot,
  stepTo,
  THREE_STAGE,
} from "./secondlaw.js";

function almost(actual, expected, eps = 1e-6) {
  assert.ok(Math.abs(actual - expected) < eps, `${actual} ≉ ${expected}`);
}

describe("2.5 Newton's second law", () => {
  it("gives a = +2 m/s² for m = 5 kg and F_net = 10 N", () => {
    const state = createState({ scenario: "basic" });
    const live = liveState(state);
    almost(live.net.x, 10);
    almost(live.ax, 2);
    stepTo(state, 2);
    almost(liveState(state).vx, 4, 1e-4);
  });

  it("doubles acceleration when net force doubles at fixed mass", () => {
    const ten = liveState(createState({ scenario: "basic" }));
    const twenty = liveState(createState({ scenario: "double-force" }));
    almost(ten.ax, 2);
    almost(twenty.ax, 4);
    almost(twenty.ax, 2 * ten.ax);
  });

  it("halves acceleration when mass doubles at fixed net force", () => {
    const five = liveState(createState({ scenario: "basic" }));
    const ten = liveState(createState({ scenario: "double-mass" }));
    almost(five.ax, 2);
    almost(ten.ax, 1);
    almost(ten.net.x, five.net.x);
  });

  it("gives a = 0 when F_net = 0 and keeps a nonzero velocity", () => {
    const state = createState({ scenario: "zero-net" });
    stepTo(state, 3);
    const live = liveState(state);
    almost(live.net.x, 0);
    almost(live.ax, 0);
    almost(live.vx, 5);
    assert.equal(live.motion, "Constant Velocity");
  });

  it("gives a = −4 m/s² for 10 N right and 30 N left on 5 kg", () => {
    const state = createState({ scenario: "negative-net" });
    const live = liveState(state);
    almost(live.net.x, -20);
    almost(live.ax, -4);
  });

  it("allows positive velocity with negative acceleration", () => {
    const state = createState({ scenario: "opp-signs" });
    const live = liveState(state);
    almost(live.vx, 8);
    almost(live.ax, -2);
    assert.equal(live.motion, "Slowing Down");
    stepTo(state, 4);
    const later = liveState(state);
    almost(later.vx, 0, 1e-3);
    almost(later.ax, -2);
    stepTo(state, 5);
    assert.ok(liveState(state).vx < 0);
    almost(liveState(state).ax, -2);
  });

  it("uses net force, not the largest individual force", () => {
    const state = createState({ scenario: "friction" });
    const live = liveState(state);
    almost(live.net.x, 20);
    almost(live.ax, 4);
    enableFriction(state, false);
    almost(liveState(state).ax, 6);
  });

  it("keeps both 20 N arrows while F_net = 0", () => {
    const state = createState({ scenario: "zero-net" });
    const horiz = state.forces.filter((f) => f.type === "applied");
    assert.equal(horiz.length, 2);
    almost(calculateNetForce(state.forces).x, 0);
  });

  it("gives F_net = +10 N from 30 N right and 20 N left", () => {
    const net = calculateNetForce([createAppliedForce(30, 0), createAppliedForce(20, 180)]);
    almost(net.x, 10);
  });

  it("integrates three-stage force: speed up, coast, then slow", () => {
    const piece = liveFromSchedule(5, -8, 0, THREE_STAGE, 2);
    almost(piece.vx, 4, 1e-9);
    almost(piece.ax, 2);
    const mid = liveFromSchedule(5, -8, 0, THREE_STAGE, 3);
    almost(mid.vx, 4, 1e-9);
    almost(mid.ax, 0);
    const end = liveFromSchedule(5, -8, 0, THREE_STAGE, 6);
    almost(end.vx, 0, 1e-9);
    almost(end.ax, -2);
    const state = createState({ scenario: "three-stage" });
    stepTo(state, 3);
    almost(liveState(state).vx, 4, 1e-3);
    almost(liveState(state).ax, 0, 1e-3);
  });

  it("sets a single horizontal net force for investigation chips", () => {
    const state = createState({ scenario: "zero-net" });
    setNetX(state, 15);
    almost(liveState(state).net.x, 15);
    almost(liveState(state).ax, 3);
  });

  it("builds the force-lock and mass-lock investigation series", () => {
    const series = [0, 5, 10, 15, 20, 25].map((F) => liveState(applyForceLockMass(F, 5)).ax);
    assert.deepEqual(series.map((a) => Number(a.toFixed(6))), [0, 1, 2, 3, 4, 5]);
    const masses = [1, 2, 4, 5, 10].map((m) => liveState(applyMassLockForce(m, 20)).ax);
    assert.deepEqual(masses.map((a) => Number(a.toFixed(6))), [20, 10, 5, 4, 2]);
    almost(predictedAccel({ Fnet: 20, mass: 5 }), 4);
  });

  it("does not reset velocity on reset while F_net is still zero", () => {
    const state = createState({ scenario: "zero-net" });
    stepTo(state, 2);
    const next = reset(state);
    almost(next.vx0, 5);
    almost(liveState(next).ax, 0);
  });

  it("labels opposite signs as slowing down and matching signs as speeding up", () => {
    assert.equal(motionLabel(8, -2), "Slowing Down");
    assert.equal(motionLabel(-8, 2), "Slowing Down");
    assert.equal(motionLabel(5, 2), "Speeding Up");
    assert.equal(motionLabel(0, 0), "At Rest");
    assert.equal(snapshot(createState({ scenario: "basic" })).forceState, "NON-EQUILIBRIUM");
  });
});
