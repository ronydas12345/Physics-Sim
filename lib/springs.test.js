import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createState,
  equilibriumX,
  evaluateSpring,
  kineticEnergy,
  liveState,
  periodOf,
  predictedFs,
  reset,
  setHeld,
  setK,
  setMass,
  setX,
  snapshot,
  springEnergy,
  springForce,
  stepTo,
} from "./springs.js";

function almost(actual, expected, eps = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= eps, `${actual} ≉ ${expected}`);
}

describe("2.8 spring forces", () => {
  it("gives Fs = 0 at equilibrium", () => {
    almost(springForce(20, 0), 0);
  });

  it("gives Fs = −2.0 N at x = +0.10 m for k = 20 N/m", () => {
    almost(springForce(20, 0.1), -2);
    almost(predictedFs({ k: 20, x: 0.1 }), -2);
  });

  it("gives Fs = +2.0 N at x = −0.10 m for k = 20 N/m", () => {
    almost(springForce(20, -0.1), 2);
  });

  it("doubles force magnitude when displacement doubles", () => {
    almost(Math.abs(springForce(20, 0.2)), 2 * Math.abs(springForce(20, 0.1)));
  });

  it("doubles force magnitude when k doubles at fixed x", () => {
    almost(Math.abs(springForce(40, 0.1)), 2 * Math.abs(springForce(20, 0.1)));
  });

  it("does not change Fs when mass changes at fixed k and x", () => {
    const a = evaluateSpring({ mass: 1, k: 20, x: 0.1, vx: 0, Fapp: 0, held: true });
    const b = evaluateSpring({ mass: 4, k: 20, x: 0.1, vx: 0, Fapp: 0, held: true });
    almost(a.Fs, b.Fs);
    almost(a.Fs, -2);
    almost(b.aFree, -0.5);
  });

  it("gives a = −2.0 m/s² when released from x = +0.10 m on 1 kg", () => {
    const live = evaluateSpring({ mass: 1, k: 20, x: 0.1, vx: 0, Fapp: 0, held: false });
    almost(live.ax, -2);
    almost(live.Fs, -2);
  });

  it("balances Fs and F_app at the shifted equilibrium", () => {
    const live = evaluateSpring({ mass: 1, k: 20, x: 0.2, vx: 0, Fapp: 4, held: false });
    almost(live.Fs, -4);
    almost(live.Fnet, 0);
    almost(live.ax, 0);
    almost(equilibriumX(4, 20), 0.2);
  });

  it("gives a = +3.25 m/s² for the combined-force example", () => {
    const live = evaluateSpring({ mass: 2, k: 30, x: -0.15, vx: 0, Fapp: 2, held: false });
    almost(live.Fs, 4.5);
    almost(live.Fnet, 6.5);
    almost(live.ax, 3.25);
  });

  it("gives T ≈ 1.405 s for m = 1 kg and k = 20 N/m", () => {
    almost(periodOf(1, 20), 2 * Math.PI * Math.sqrt(1 / 20), 1e-9);
    almost(periodOf(1, 20), 1.405, 0.002);
  });

  it("gives Us = 0.10 J at x = +0.10 m for k = 20 N/m", () => {
    almost(springEnergy(20, 0.1), 0.1);
  });

  it("always follows Fs = −kx for signed pairs", () => {
    for (const x of [-0.2, -0.1, 0, 0.1, 0.2]) {
      almost(springForce(20, x), -20 * x);
    }
  });

  it("gives a = 0 when F_net = 0 even if velocity is nonzero", () => {
    const live = evaluateSpring({ mass: 1, k: 20, x: 0, vx: 1.2, Fapp: 0, held: false });
    almost(live.ax, 0);
    almost(live.vx, 1.2);
  });

  it("keeps a held block from integrating", () => {
    const state = createState({ scenario: "stretch" });
    assert.equal(state.held, true);
    stepTo(state, 1);
    almost(state.x, 0.1, 1e-9);
    almost(state.vx, 0, 1e-9);
    almost(liveState(state).holding, 2);
  });

  it("preserves displacement when switching from hold to motion", () => {
    const state = createState({ scenario: "stretch" });
    setHeld(state, false);
    almost(state.x, 0.1);
    assert.equal(state.held, false);
  });

  it("passes through equilibrium with nonzero velocity", () => {
    const state = createState({ scenario: "oscillate", duration: 4 });
    const T = periodOf(1, 20);
    stepTo(state, T / 4);
    const live = liveState(state);
    almost(live.x, 0, 0.02);
    assert.ok(live.vx < -0.2, `vx should be leftward, got ${live.vx}`);
  });

  it("returns near the start after one period", () => {
    const state = createState({ scenario: "oscillate", duration: 8 });
    const T = periodOf(1, 20);
    stepTo(state, T);
    almost(state.x, 0.1, 0.01);
    almost(state.vx, 0, 0.05);
  });

  it("keeps mechanical energy nearly constant while oscillating", () => {
    const state = createState({ scenario: "oscillate", duration: 4 });
    const E0 = liveState(state).E;
    almost(E0, 0.1, 1e-9);
    stepTo(state, periodOf(1, 20) / 2);
    const live = liveState(state);
    almost(live.E, E0, 0.004);
    almost(live.Us, 0.1, 0.01);
    assert.ok(kineticEnergy(state.mass, live.vx) < 0.01);
  });

  it("matches the stretch snapshot", () => {
    const snap = snapshot(createState({ scenario: "stretch" }));
    almost(snap.Fs, -2);
    almost(snap.aFree, -2);
    assert.equal(snap.held, true);
  });

  it("updates Fs when k or x changes while held", () => {
    const state = createState({ scenario: "stretch" });
    setX(state, 0.2);
    almost(liveState(state).Fs, -4);
    setK(state, 40);
    setX(state, 0.1);
    almost(liveState(state).Fs, -4);
    setMass(state, 4);
    almost(liveState(state).Fs, -4);
    almost(liveState(state).aFree, -1);
  });

  it("rejects nonnumeric k and mass by clamping to defaults", () => {
    almost(springForce(Number.NaN, 0.1), -20 * 0.1);
    const state = createState({ mass: Number.POSITIVE_INFINITY, k: -4, x0: 0.1 });
    assert.ok(state.mass <= 20);
    assert.ok(state.k >= 1);
  });

  it("clears time on reset without changing k", () => {
    const state = createState({ scenario: "oscillate", duration: 4 });
    stepTo(state, 0.4);
    const next = reset(state);
    almost(next.time, 0);
    almost(next.x, 0.1);
    almost(next.k, 20);
  });
});
