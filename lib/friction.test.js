import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  G,
  createState,
  evaluateFriction,
  kineticFrictionOf,
  liveState,
  maxStaticFriction,
  normalForceOf,
  predictedFk,
  predictedFsMax,
  setFapp,
  setMass,
  setMu,
  snapshot,
  stepTo,
  weightOf,
} from "./friction.js";

function almost(actual, expected, eps = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= eps, `${actual} ≉ ${expected}`);
}

describe("2.7 kinetic and static friction", () => {
  it("gives weight 49.05 N for 5 kg at g = 9.81", () => {
    almost(weightOf(5, G), 49.05, 1e-9);
  });

  it("sets N = mg on a horizontal surface", () => {
    almost(normalForceOf(5, G), 49.05, 1e-9);
  });

  it("gives fs,max = 24.525 N for μs = 0.50", () => {
    almost(maxStaticFriction(0.5, 49.05), 24.525, 1e-9);
  });

  it("sets actual static friction equal to a 10 N applied force below threshold", () => {
    const live = evaluateFriction({ mass: 5, g: G, muS: 0.5, muK: 0.3, Fapp: 10, vx: 0, sliding: false });
    almost(live.frictionMag, 10, 1e-9);
    almost(live.friction, -10, 1e-9);
    assert.equal(live.kind, "static");
    assert.equal(live.sliding, false);
  });

  it("keeps F_net = 0 and a = 0 below the static threshold", () => {
    const live = evaluateFriction({ mass: 5, g: G, muS: 0.5, muK: 0.3, Fapp: 10, vx: 0, sliding: false });
    almost(live.Fnet, 0, 1e-9);
    almost(live.ax, 0, 1e-9);
  });

  it("gives kinetic friction 14.715 N for μk = 0.30", () => {
    almost(kineticFrictionOf(0.3, 49.05), 14.715, 1e-9);
  });

  it("gives a = 3.057 m/s² while sliding under 30 N", () => {
    const live = evaluateFriction({ mass: 5, g: G, muS: 0.5, muK: 0.3, Fapp: 30, vx: 0, sliding: false });
    assert.equal(live.sliding, true);
    almost(live.frictionMag, 14.715, 1e-9);
    almost(live.ax, 3.057, 1e-6);
  });

  it("speeds up from rest when F_app exceeds fs,max", () => {
    const state = createState({ scenario: "sliding", duration: 2 });
    stepTo(state, 1);
    const live = liveState(state);
    almost(live.ax, 3.057, 1e-3);
    almost(live.vx, 3.057, 0.08);
    assert.ok(live.x > state.x0);
    assert.equal(live.sliding, true);
  });

  it("gives a = 0 while sliding at constant speed when F_app = fk", () => {
    const fk = kineticFrictionOf(0.3, 49.05);
    const live = evaluateFriction({ mass: 5, g: G, muS: 0.5, muK: 0.3, Fapp: fk, vx: 2, sliding: true });
    almost(live.ax, 0, 1e-9);
    assert.equal(live.sliding, true);
  });

  it("points friction and acceleration left when a rightward block has F_app = 0", () => {
    const live = evaluateFriction({ mass: 5, g: G, muS: 0.5, muK: 0.3, Fapp: 0, vx: 2, sliding: true });
    assert.ok(live.friction < 0);
    assert.ok(live.ax < 0);
  });

  it("points kinetic friction right when the block slides left", () => {
    const live = evaluateFriction({ mass: 5, g: G, muS: 0.5, muK: 0.3, Fapp: 0, vx: -2, sliding: true });
    assert.ok(live.friction > 0);
  });

  it("stops without reversing when kinetic friction kills the velocity", () => {
    const state = createState({ scenario: "decel", duration: 10 });
    stepTo(state, 10);
    const live = liveState(state);
    almost(live.vx, 0, VEL_EPS);
    assert.equal(live.sliding, false);
    assert.ok(live.x > state.x0);
  });

  it("gives zero friction when both coefficients are zero", () => {
    const live = evaluateFriction({ mass: 5, g: G, muS: 0, muK: 0, Fapp: 10, vx: 0, sliding: false });
    almost(live.fsMax, 0, 1e-12);
    almost(live.fk, 0, 1e-12);
    assert.equal(live.sliding, true);
  });

  it("doubles N and friction magnitudes when mass doubles", () => {
    const a = predictedFsMax({ mass: 5, muS: 0.5 });
    const b = predictedFsMax({ mass: 10, muS: 0.5 });
    almost(b, 2 * a, 1e-9);
    almost(predictedFk({ mass: 10, muK: 0.3 }), 2 * predictedFk({ mass: 5, muK: 0.3 }), 1e-9);
  });

  it("doubles fs,max when μs doubles at fixed N", () => {
    almost(maxStaticFriction(1, 49.05), 2 * maxStaticFriction(0.5, 49.05), 1e-9);
  });

  it("is symmetric under left-right reversal", () => {
    const right = evaluateFriction({ mass: 5, g: G, muS: 0.5, muK: 0.3, Fapp: 30, vx: 1, sliding: true });
    const left = evaluateFriction({ mass: 5, g: G, muS: 0.5, muK: 0.3, Fapp: -30, vx: -1, sliding: true });
    almost(left.friction, -right.friction, 1e-9);
    almost(left.ax, -right.ax, 1e-9);
  });

  it("stays static at F_app = fs,max", () => {
    const live = evaluateFriction({ mass: 5, g: G, muS: 0.5, muK: 0.3, Fapp: 24.525, vx: 0, sliding: false });
    assert.equal(live.sliding, false);
    almost(live.frictionMag, 24.525, 1e-9);
  });

  it("does not rewrite μk > μs", () => {
    const live = evaluateFriction({ mass: 5, g: G, muS: 0.2, muK: 0.4, Fapp: 0, vx: 0, sliding: false });
    assert.equal(live.unusual, true);
    almost(live.fk, 0.4 * 49.05, 1e-9);
  });

  it("matches the below-threshold snapshot", () => {
    const snap = snapshot(createState({ scenario: "below" }));
    almost(snap.frictionMag, 10, 1e-9);
    almost(snap.Fnet, 0, 1e-9);
    assert.equal(snap.sliding, false);
  });

  it("updates friction when F_app or mass changes at rest", () => {
    const state = createState({ scenario: "rest" });
    setFapp(state, 8);
    almost(liveState(state).frictionMag, 8, 1e-9);
    setMass(state, 10);
    setMu(state, 0.5, 0.3);
    almost(liveState(state).N, 98.1, 1e-9);
  });
});

const VEL_EPS = 0.06;
