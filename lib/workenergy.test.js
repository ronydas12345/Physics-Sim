import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createState,
  kineticEnergy,
  liveState,
  normalizeAngleDeg,
  predictedOutcome,
  reset,
  snapshot,
  speedFromKe,
  stepTo,
  workByForce,
} from "./workenergy.js";

function almost(actual, expected, eps = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= eps, `${actual} ≉ ${expected}`);
}

describe("3.1 work", () => {
  it("gives 50 J for F = 10 N, d = 5 m, θ = 0°", () => {
    almost(workByForce(10, 5, 0), 50);
  });

  it("gives 0 J for F = 12 N, d = 6 m, θ = 90°", () => {
    almost(workByForce(12, 6, 90), 0, 1e-9);
  });

  it("gives −24 J for F = 8 N, d = 3 m, θ = 180°", () => {
    almost(workByForce(8, 3, 180), -24);
  });

  it("gives zero work for zero force or zero displacement", () => {
    almost(workByForce(0, 5, 0), 0);
    almost(workByForce(10, 0, 0), 0);
  });

  it("normalizes angles outside 0–360°", () => {
    assert.equal(normalizeAngleDeg(360), 0);
    assert.equal(normalizeAngleDeg(-90), 270);
    almost(workByForce(12, 6, 450), 0, 1e-9);
    almost(workByForce(10, 5, 720), 50);
  });
});

describe("3.1 kinetic energy", () => {
  it("gives 4 J for m = 2 kg, v = 2 m/s", () => {
    almost(kineticEnergy(2, 2), 4);
  });

  it("gives 36 J for m = 2 kg, v = 6 m/s", () => {
    almost(kineticEnergy(2, 6), 36);
  });

  it("doubles K when mass doubles at constant speed", () => {
    almost(kineticEnergy(4, 2), 8);
  });

  it("quadruples K when speed doubles at constant mass", () => {
    almost(kineticEnergy(2, 4), 16);
  });

  it("keeps kinetic energy nonnegative", () => {
    almost(kineticEnergy(2, 0), 0);
    assert.ok(kineticEnergy(2, 5) >= 0);
    almost(speedFromKe(2, 12), Math.sqrt(12));
  });
});

describe("3.1 work-energy theorem presets", () => {
  it("Preset A: W_net = 50 J, K_f = 54 J, v_f ≈ 7.35 m/s", () => {
    const p = predictedOutcome({ mass: 2, v0: 2, force: 10, thetaDeg: 0, d: 5 });
    almost(p.Wnet, 50);
    almost(p.Ki, 4);
    almost(p.Kf, 54);
    almost(p.vf, Math.sqrt(54), 0.01);
    assert.equal(p.reached, true);
    assert.equal(p.agrees, true);
  });

  it("Preset B: perpendicular force does zero work and speed is unchanged", () => {
    const p = predictedOutcome({ mass: 2, v0: 4, force: 12, thetaDeg: 90, d: 6 });
    almost(p.Wapp, 0);
    almost(p.Wnet, 0);
    almost(p.vf, 4, 1e-9);
    almost(p.Kf, p.Ki);
    assert.equal(p.reached, true);
  });

  it("Preset C: negative work, K_f = 12 J, v_f ≈ 3.46 m/s", () => {
    const p = predictedOutcome({ mass: 2, v0: 6, force: 8, thetaDeg: 180, d: 3 });
    almost(p.Wnet, -24);
    almost(p.Ki, 36);
    almost(p.Kf, 12);
    almost(p.vf, Math.sqrt(12), 0.01);
    assert.equal(p.reached, true);
  });

  it("Preset D: equal opposite forces give zero net work and constant K", () => {
    const p = predictedOutcome({ mass: 2, v0: 3, force: 10, thetaDeg: 0, d: 4, oppose: 10 });
    almost(p.Wapp, 40);
    almost(p.Wopp, -40);
    almost(p.Wnet, 0);
    almost(p.dK, 0);
    almost(p.vf, 3);
  });

  it("Preset E: 60° gives 40 J of work and v_f ≈ 5.54 m/s", () => {
    const p = predictedOutcome({ mass: 3, v0: 2, force: 20, thetaDeg: 60, d: 4 });
    almost(p.Wapp, 40);
    almost(p.Ki, 6);
    almost(p.Kf, 46);
    almost(p.vf, Math.sqrt(92 / 3), 0.01);
  });

  it("Preset F: friction gives W_net = 24.32 J and v_f ≈ 5.77 m/s", () => {
    const p = predictedOutcome({ mass: 2, v0: 3, force: 10, thetaDeg: 0, d: 4, frictionOn: true, mu: 0.2 });
    almost(p.N, 19.6, 1e-9);
    almost(p.fkMag, 3.92, 1e-9);
    almost(p.Wapp, 40);
    almost(p.Wfric, -15.68, 1e-9);
    almost(p.Wnet, 24.32, 1e-9);
    almost(p.Ki, 9);
    almost(p.Kf, 33.32, 1e-9);
    almost(p.vf, Math.sqrt(33.32), 0.01);
  });
});

describe("3.1 stopping before the endpoint", () => {
  it("stops at 0.4 m when K would otherwise go negative", () => {
    const p = predictedOutcome({ mass: 2, v0: 2, force: 10, thetaDeg: 180, d: 5 });
    almost(p.s, 0.4, 1e-9);
    almost(p.Kf, 0, 1e-9);
    almost(p.vf, 0, 1e-9);
    assert.equal(p.reached, false);
    assert.equal(p.stoppedEarly, true);
    assert.ok(p.Kf >= 0);
  });

  it("integrated motion stops short and keeps K nonnegative", () => {
    const state = createState({ scenario: "stop" });
    stepTo(state, state.duration);
    const live = liveState(state);
    almost(live.s, 0.4, 0.03);
    assert.ok(live.K >= -1e-9);
    assert.equal(live.reached, false);
    assert.equal(live.stoppedEarly, true);
    assert.ok(Math.abs(live.d - 5) < 1e-9);
    assert.ok(live.s < live.d - 0.5);
  });
});

describe("3.1 net work", () => {
  it("sums individual works to net work", () => {
    const p = predictedOutcome({ mass: 2, v0: 3, force: 10, thetaDeg: 0, d: 4, frictionOn: true, mu: 0.2 });
    almost(p.Wnet, p.Wapp + p.Wfric);
  });

  it("gives zero work from N and g on a horizontal displacement", () => {
    const p = predictedOutcome({ mass: 2, v0: 2, force: 10, thetaDeg: 0, d: 5 });
    almost(p.WN, 0);
    almost(p.Wg, 0);
  });

  it("agrees with ΔK within tolerance after a run", () => {
    const state = createState({ scenario: "along" });
    stepTo(state, state.duration);
    const snap = snapshot(state);
    almost(snap.Wnet, snap.dK, 0.2);
    almost(snap.predWnet, 50, 0.2);
    almost(snap.predKf, 54, 0.2);
  });

  it("clears time on reset without changing the force settings", () => {
    const state = createState({ scenario: "along" });
    stepTo(state, 0.4);
    const next = reset(state);
    almost(next.time, 0);
    almost(next.x, 0);
    almost(next.force, 10);
    almost(next.d, 5);
  });
});
