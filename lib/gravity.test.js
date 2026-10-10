import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EARTH_MASS,
  EARTH_RADIUS,
  G,
  calculateGravitationalForce,
  createState,
  earthSurfaceG,
  gravitationalField,
  gravitationalForceMagnitude,
  liveState,
  predictedForce,
  scaleDistance,
  scaleMass,
  setMasses,
  snapshot,
  stepTo,
} from "./gravity.js";

function almost(actual, expected, eps = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= eps, `${actual} ≉ ${expected}`);
}

describe("2.6 gravitational force", () => {
  it("gives G for 1 kg, 1 kg, 1 m", () => {
    almost(gravitationalForceMagnitude(1, 1, 1), G, 1e-20);
  });

  it("doubles force when m1 doubles", () => {
    const a = gravitationalForceMagnitude(1000, 1000, 10);
    const b = gravitationalForceMagnitude(2000, 1000, 10);
    almost(b, 2 * a, 1e-20);
  });

  it("doubles force when m2 doubles", () => {
    const a = gravitationalForceMagnitude(1000, 1000, 10);
    const b = gravitationalForceMagnitude(1000, 2000, 10);
    almost(b, 2 * a, 1e-20);
  });

  it("divides force by four when r doubles", () => {
    const a = gravitationalForceMagnitude(1000, 1000, 10);
    const b = gravitationalForceMagnitude(1000, 1000, 20);
    almost(b, a / 4, 1e-20);
  });

  it("divides force by nine when r triples", () => {
    const a = gravitationalForceMagnitude(1000, 1000, 10);
    const b = gravitationalForceMagnitude(1000, 1000, 30);
    almost(b, a / 9, 1e-20);
  });

  it("quadruples force when both masses double", () => {
    const a = gravitationalForceMagnitude(1000, 1000, 10);
    const b = gravitationalForceMagnitude(2000, 2000, 10);
    almost(b, 4 * a, 1e-20);
  });

  it("does not change magnitude when masses swap", () => {
    almost(gravitationalForceMagnitude(1000, 5000, 10), gravitationalForceMagnitude(5000, 1000, 10), 1e-20);
  });

  it("returns equal and opposite forces", () => {
    const pair = calculateGravitationalForce(1000, 5000, 10, -5, 5);
    almost(pair.onA, -pair.onB, 1e-20);
    almost(Math.abs(pair.onA), pair.magnitude, 1e-20);
    assert.ok(pair.onA > 0);
    assert.ok(pair.onB < 0);
  });

  it("gives accelerations consistent with a = F/m", () => {
    const pair = calculateGravitationalForce(1000, 5000, 10, -5, 5);
    almost(pair.aA, pair.onA / 1000, 1e-20);
    almost(pair.aB, pair.onB / 5000, 1e-20);
    assert.ok(Math.abs(pair.aA) > Math.abs(pair.aB));
  });

  it("gives about 9.8 m/s² at Earth's mean radius", () => {
    const g = earthSurfaceG();
    assert.ok(Math.abs(g - 9.8) < 0.05, `g = ${g}`);
  });

  it("keeps field strength independent of test mass at a fixed location", () => {
    const r = EARTH_RADIUS;
    const g1 = gravitationalField(EARTH_MASS, r);
    const f1 = gravitationalForceMagnitude(EARTH_MASS, 1, r);
    const f2 = gravitationalForceMagnitude(EARTH_MASS, 2, r);
    almost(f2, 2 * f1, 1e-8);
    almost(f1 / 1, g1, 1e-8);
    almost(f2 / 2, g1, 1e-8);
  });

  it("makes Fg vs 1/r² linear at fixed masses", () => {
    const m1 = 1000;
    const m2 = 1000;
    const rs = [1, 2, 4, 8];
    const slopes = rs.map((r) => gravitationalForceMagnitude(m1, m2, r) / (1 / (r * r)));
    for (const slope of slopes) almost(slope, G * m1 * m2, 1e-18);
  });

  it("does not produce infinite force at zero separation", () => {
    const F = gravitationalForceMagnitude(1000, 1000, 0);
    assert.ok(Number.isFinite(F) && F > 0);
  });

  it("matches the basic lab snapshot", () => {
    const state = createState({ scenario: "basic" });
    const live = liveState(state);
    almost(live.r, 10, 1e-9);
    almost(live.magnitude, predictedForce({ m1: 1000, m2: 1000, r: 10 }), 1e-20);
    almost(Math.abs(live.onA.x), Math.abs(live.onB.x), 1e-20);
  });

  it("applies scaling buttons", () => {
    const state = createState({ scenario: "basic" });
    const F0 = liveState(state).magnitude;
    scaleMass(state, "m1", 2);
    almost(liveState(state).magnitude, 2 * F0, 1e-20);
    scaleMass(state, "both", 2);
    almost(liveState(state).magnitude, 8 * F0, 1e-20);
    scaleDistance(state, 2);
    almost(liveState(state).magnitude, 2 * F0, 1e-20);
  });

  it("keeps Earth mass as the source in Earth surface mode", () => {
    const state = createState({ scenario: "earth-surface" });
    const snap = snapshot(state);
    almost(snap.m1, EARTH_MASS, 1);
    almost(snap.r, EARTH_RADIUS, 1);
    almost(snap.g, earthSurfaceG(), 1e-6);
  });

  it("integrates motion without NaN", () => {
    const state = createState({ scenario: "basic", motion: true, duration: 2 });
    stepTo(state, 1);
    const live = liveState(state);
    assert.ok(Number.isFinite(live.r) && Number.isFinite(state.A.x));
    setMasses(state, 1e12, 1e12);
  });
});
