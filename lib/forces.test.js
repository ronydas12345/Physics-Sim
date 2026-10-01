import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FORCE_EPSILON,
  calculateAcceleration,
  calculateForceComponents,
  calculateGravity,
  calculateNetForce,
  createAppliedForce,
  createFrictionForce,
  createGravityForce,
  createNormalForce,
  createState,
  createTensionForce,
  evaluateChallenge,
  generateChallenge,
  isBalanced,
  liveState,
  makeForce,
  normalizeAngle,
  reset,
  setForce,
  setGravity,
  setMass,
  snapshot,
  stepTo,
} from "./forces.js";

function almost(actual, expected, eps = 1e-9) {
  assert.ok(Math.abs(actual - expected) < eps, `${actual} ≉ ${expected}`);
}

describe("2.2 forces and free-body diagrams", () => {
  it("gives Fg = 49 N down for m = 5 kg and g = 9.8 m/s²", () => {
    const grav = calculateGravity(5, 9.8);
    almost(grav.magnitude, 49);
    almost(grav.y, -49);
    almost(grav.x, 0);
    assert.equal(grav.direction, 270);
  });

  it("cancels gravity and a matching normal force", () => {
    const net = calculateNetForce([createGravityForce({ mass: 5, g: 9.8 }), createNormalForce(49)]);
    almost(net.x, 0);
    almost(net.y, 0);
    almost(net.magnitude, 0);
    assert.equal(isBalanced(net), true);
  });

  it("splits a 20 N rightward applied force into Fx = +20 N, Fy = 0", () => {
    const parts = calculateForceComponents(20, 0);
    almost(parts.x, 20);
    almost(parts.y, 0);
  });

  it("gives 20 N right from 30 N right and 10 N left", () => {
    const net = calculateNetForce([createAppliedForce(30, 0), createAppliedForce(10, 180)]);
    almost(net.x, 20);
    almost(net.y, 0);
    almost(net.magnitude, 20);
    almost(net.direction, 0);
  });

  it("gives zero net force for equal-and-opposite 25 N forces", () => {
    const net = calculateNetForce([createAppliedForce(25, 0), createAppliedForce(25, 180)]);
    assert.equal(isBalanced(net), true);
  });

  it("cancels vertical 49 N up and down", () => {
    const net = calculateNetForce([createNormalForce(49), makeForce({ type: "gravity", magnitude: 49, direction: 270 })]);
    almost(net.y, 0);
  });

  it("gives |F_net| = 5 N from Fx = 3 N and Fy = 4 N", () => {
    const net = calculateNetForce([createAppliedForce(3, 0), createTensionForce(4, 90)]);
    almost(net.x, 3);
    almost(net.y, 4);
    almost(net.magnitude, 5);
  });

  it("maps 0°/90°/180°/270° onto the cardinal axes", () => {
    almost(calculateForceComponents(10, 0).x, 10);
    almost(calculateForceComponents(10, 90).y, 10);
    almost(calculateForceComponents(10, 180).x, -10);
    almost(calculateForceComponents(10, 270).y, -10);
    almost(normalizeAngle(-90), 270);
  });

  it("updates Fg to 98 N when mass becomes 10 kg", () => {
    const state = createState({ scenario: "box-on-surface" });
    setMass(state, 10);
    almost(snapshot(state).Fg, 98);
  });

  it("gives Fg = 8.1 N for m = 5 kg and g = 1.62 m/s²", () => {
    almost(calculateGravity(5, 1.62).magnitude, 8.1);
    const state = createState({ scenario: "box-on-surface" });
    setGravity(state, 1.62, "Moon");
    almost(snapshot(state).Fg, 8.1);
  });

  it("gives a = 4 m/s² when F_net = 20 N and m = 5 kg", () => {
    const a = calculateAcceleration({ x: 20, y: 0, magnitude: 20 }, 5);
    almost(a.x, 4);
    almost(a.y, 0);
    const state = createState({ scenario: "pushed-box", dynamicMode: true });
    almost(snapshot(state).a.x, 4);
    stepTo(state, 2);
    const live = liveState(state);
    almost(live.vx, 8);
    almost(live.x, 8);
  });

  it("drops gravity from the net force when that force is disabled", () => {
    const state = createState({ scenario: "box-on-surface" });
    setForce(state, "gravity", { enabled: false });
    const snap = snapshot(state);
    assert.equal(snap.enabled.some((f) => f.type === "gravity"), false);
    almost(snap.net.y, 49);
    assert.equal(snap.balanced, false);
  });

  it("keeps the box-on-surface preset balanced at 0 N", () => {
    const snap = snapshot(createState({ scenario: "box-on-surface" }));
    assert.equal(snap.forceState, "Balanced");
    almost(snap.net.magnitude, 0);
    almost(snap.Fg, 49);
  });

  it("gives 20 N right for the pushed-box preset", () => {
    const snap = snapshot(createState({ scenario: "pushed-box" }));
    almost(snap.net.x, 20);
    almost(snap.net.y, 0);
    assert.equal(snap.forceState, "Unbalanced");
  });

  it("gives 20 N right for the friction preset 30 N − 10 N", () => {
    const snap = snapshot(createState({ scenario: "box-with-friction" }));
    almost(snap.net.x, 20);
  });

  it("balances a hanging 2 kg object with matching tension", () => {
    const snap = snapshot(createState({ scenario: "hanging" }));
    almost(snap.mass, 2);
    almost(snap.Fg, 19.6);
    assert.equal(snap.balanced, true);
    assert.equal(snap.enabled.some((f) => f.type === "tension"), true);
    assert.equal(snap.enabled.some((f) => f.type === "normal"), false);
  });

  it("does not let static mode move the object", () => {
    const state = createState({ scenario: "pushed-box", dynamicMode: false });
    stepTo(state, 3);
    const live = liveState(state);
    almost(live.x, 0);
    almost(live.vx, 0);
    almost(live.ax, 4);
  });

  it("moves a pushed box when time advances with default motion mode", () => {
    const state = createState({ scenario: "pushed-box" });
    assert.equal(state.dynamicMode, true);
    stepTo(state, 2);
    const live = liveState(state);
    almost(live.x, 8);
    almost(live.vx, 8);
  });

  it("coasts at constant velocity when F_net = 0 in dynamic mode", () => {
    const state = createState({ scenario: "coasting", dynamicMode: true });
    almost(snapshot(state).net.magnitude, 0);
    stepTo(state, 2);
    const live = liveState(state);
    almost(live.vx, 5);
    almost(live.x, -8 + 10);
  });

  it("clears time and history on reset", () => {
    const state = createState({ scenario: "pushed-box", dynamicMode: true });
    stepTo(state, 2);
    assert.ok(state.history.length > 2);
    const again = reset(state);
    assert.equal(again.time, 0);
    assert.equal(again.history.length, 1);
  });

  it("replaces forces completely when switching scenarios", () => {
    const state = createState({ scenario: "pushed-box" });
    const hanging = createState({ scenario: "hanging" });
    assert.equal(hanging.forces.some((f) => f.type === "applied"), false);
    assert.equal(hanging.forces.some((f) => f.type === "tension"), true);
    assert.equal(state.forces.some((f) => f.type === "applied"), true);
  });

  it("points automatic friction opposite a rightward push", () => {
    const snap = snapshot(createState({ scenario: "box-with-friction" }));
    const ff = snap.enabled.find((f) => f.type === "friction");
    almost(ff.direction, 180);
  });

  it("accepts a net-force challenge from the live snapshot", () => {
    const spec = generateChallenge(() => 0.3);
    assert.equal(spec.type, "net");
    const measured = snapshot(createState(spec.params));
    assert.equal(evaluateChallenge(measured, spec).ok, true);
  });

  it("accepts an identify-forces challenge for a box on a table", () => {
    const spec = generateChallenge(() => 0.05);
    assert.equal(spec.type, "identify");
    const measured = snapshot(createState(spec.params));
    assert.equal(evaluateChallenge(measured, spec).ok, true);
  });

  it("rejects an identify challenge if tension is left on", () => {
    const spec = generateChallenge(() => 0.05);
    const state = createState(spec.params);
    state.forces.push(createTensionForce(10, 90));
    const measured = snapshot(state);
    assert.equal(evaluateChallenge(measured, spec).ok, false);
  });

  it("treats net force below FORCE_EPSILON as balanced", () => {
    const net = calculateNetForce([createAppliedForce(FORCE_EPSILON / 4, 0)]);
    assert.equal(isBalanced(net), true);
  });
});
