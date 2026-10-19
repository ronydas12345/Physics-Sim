import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  areaRegions,
  createState,
  forceAt,
  kineticEnergy,
  liveState,
  predictedOutcome,
  reset,
  snapshot,
  speedFromKe,
  stepTo,
  workApprox,
  workExact,
} from "./variableforce.js";

function almost(actual, expected, eps = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= eps, `${actual} ≉ ${expected}`);
}

describe("3.2 constant-force work", () => {
  it("gives 24 J for F = 6 N over 4 m", () => {
    almost(workExact({ type: "constant", F: 6 }, 0, 4), 24);
  });

  it("gives −12 J for F = −4 N over 3 m", () => {
    almost(workExact({ type: "constant", F: -4 }, 0, 3), -12);
  });

  it("gives zero work for zero force or zero displacement", () => {
    almost(workExact({ type: "constant", F: 0 }, 0, 5), 0);
    almost(workExact({ type: "constant", F: 6 }, 2, 2), 0);
  });

  it("reverses the work sign when the integration limits reverse", () => {
    almost(workExact({ type: "constant", F: 6 }, 4, 0), -24);
    almost(workExact({ type: "proportional", c: 2 }, 4, 0), -16);
  });
});

describe("3.2 area calculations", () => {
  it("gives 16 J for a triangle of base 4 m and height 8 N", () => {
    const spec = { type: "piecewise-linear", points: [{ x: 0, F: 0 }, { x: 4, F: 8 }] };
    almost(workExact(spec, 0, 4), 16);
  });

  it("gives −16 J for the same triangle below the axis", () => {
    const spec = { type: "piecewise-linear", points: [{ x: 0, F: 0 }, { x: 4, F: -8 }] };
    almost(workExact(spec, 0, 4), -16);
  });

  it("gives 24 J for a linear segment from 2 N to 10 N over 4 m", () => {
    const spec = { type: "piecewise-linear", points: [{ x: 0, F: 2 }, { x: 4, F: 10 }] };
    almost(workExact(spec, 0, 4), 24);
  });

  it("sums piecewise-constant signed segments", () => {
    const spec = { type: "piecewise-constant", segments: [{ x0: 0, x1: 2, F: 6 }, { x0: 2, x1: 4, F: -3 }] };
    almost(workExact(spec, 0, 4), 6);
    almost(workExact(spec, 0, 2), 12);
    almost(workExact(spec, 2, 4), -6);
  });

  it("cancels equal positive and negative areas in Preset F", () => {
    const spec = { type: "piecewise-constant", segments: [{ x0: 0, x1: 2, F: 4 }, { x0: 2, x1: 4, F: -4 }] };
    almost(workExact(spec, 0, 4), 0);
  });

  it("splits a linear segment that crosses the axis", () => {
    const spec = { type: "piecewise-linear", points: [{ x: 0, F: 4 }, { x: 4, F: -4 }] };
    almost(workExact(spec, 0, 4), 0);
    almost(workExact(spec, 0, 2), 4);
    almost(workExact(spec, 2, 4), -4);
    const regions = areaRegions(spec, 0, 4);
    assert.ok(regions.length >= 2);
    assert.ok(regions.some((r) => r.W > 0));
    assert.ok(regions.some((r) => r.W < 0));
  });
});

describe("3.2 presets", () => {
  it("Preset A: W = 24 J, K_f = 28 J, v_f ≈ 5.29 m/s", () => {
    const p = predictedOutcome({ mass: 2, v0: 2, xi: 0, xf: 4, spec: { type: "constant", F: 6 } });
    almost(p.Wnet, 24);
    almost(p.Ki, 4);
    almost(p.Kf, 28);
    almost(p.vf, Math.sqrt(28), 0.01);
    assert.equal(p.reached, true);
    assert.equal(p.agrees, true);
  });

  it("Preset B: W = 16 J, K_f = 17 J", () => {
    const p = predictedOutcome({
      mass: 2,
      v0: 1,
      xi: 0,
      xf: 4,
      spec: { type: "piecewise-linear", points: [{ x: 0, F: 0 }, { x: 4, F: 8 }] },
    });
    almost(p.Wnet, 16);
    almost(p.Ki, 1);
    almost(p.Kf, 17);
    almost(p.vf, Math.sqrt(17), 0.01);
    assert.equal(p.reached, true);
  });

  it("Preset C: W = 24 J, K_f = 28 J", () => {
    const p = predictedOutcome({
      mass: 2,
      v0: 2,
      xi: 0,
      xf: 4,
      spec: { type: "piecewise-linear", points: [{ x: 0, F: 2 }, { x: 4, F: 10 }] },
    });
    almost(p.Wnet, 24);
    almost(p.Kf, 28);
  });

  it("Preset D: W = −12 J, K_f = 13 J, still reaches the end", () => {
    const p = predictedOutcome({ mass: 2, v0: 5, xi: 0, xf: 3, spec: { type: "constant", F: -4 } });
    almost(p.Wnet, -12);
    almost(p.Ki, 25);
    almost(p.Kf, 13);
    almost(p.vf, Math.sqrt(13), 0.01);
    assert.equal(p.reached, true);
  });

  it("Preset E: W_net = 6 J, K_f = 10 J", () => {
    const p = predictedOutcome({
      mass: 2,
      v0: 2,
      xi: 0,
      xf: 4,
      spec: { type: "piecewise-constant", segments: [{ x0: 0, x1: 2, F: 6 }, { x0: 2, x1: 4, F: -3 }] },
    });
    almost(p.Wpos, 12, 0.05);
    almost(p.Wneg, -6, 0.05);
    almost(p.Wnet, 6);
    almost(p.Kf, 10);
  });

  it("Preset F: W_net = 0, K_f = K_i = 9 J", () => {
    const p = predictedOutcome({
      mass: 2,
      v0: 3,
      xi: 0,
      xf: 4,
      spec: { type: "piecewise-constant", segments: [{ x0: 0, x1: 2, F: 4 }, { x0: 2, x1: 4, F: -4 }] },
    });
    almost(p.Wnet, 0);
    almost(p.Ki, 9);
    almost(p.Kf, 9);
    assert.equal(p.reached, true);
  });

  it("Preset G: analytical work is 16 J for F = 2x from 0 to 4 m", () => {
    const spec = { type: "proportional", c: 2 };
    almost(workExact(spec, 0, 4), 16);
    const p = predictedOutcome({ mass: 2, v0: 2, xi: 0, xf: 4, spec });
    almost(p.Wfull, 16);
    almost(p.Wnet, 16);
    assert.equal(p.reached, true);
  });
});

describe("3.2 numerical integration", () => {
  it("does not label a coarse left-Riemann estimate as exact for F = 2x", () => {
    const spec = { type: "proportional", c: 2 };
    const left2 = workApprox(spec, 0, 4, 2, "left");
    const left8 = workApprox(spec, 0, 4, 8, "left");
    almost(workExact(spec, 0, 4), 16);
    almost(left2, 8, 1e-9);
    assert.ok(left8 > left2);
    assert.ok(Math.abs(left8 - 16) < Math.abs(left2 - 16));
    assert.notEqual(left2, 16);
  });

  it("matches the analytical integral with midpoint or trapezoid for F = 2x", () => {
    const spec = { type: "proportional", c: 2 };
    almost(workApprox(spec, 0, 4, 2, "midpoint"), 16, 1e-9);
    almost(workApprox(spec, 0, 4, 1, "trapezoid"), 16, 1e-9);
  });

  it("approaches ∫ x² dx from 0 to 2 as resolution increases", () => {
    const spec = { type: "quadratic", a: 1 };
    const exact = 8 / 3;
    almost(workExact(spec, 0, 2), exact);
    const err4 = Math.abs(workApprox(spec, 0, 2, 4, "midpoint") - exact);
    const err16 = Math.abs(workApprox(spec, 0, 2, 16, "midpoint") - exact);
    assert.ok(err16 < err4);
  });

  it("handles a force that crosses zero", () => {
    const spec = { type: "piecewise-linear", points: [{ x: 0, F: 6 }, { x: 4, F: -6 }] };
    almost(workExact(spec, 0, 4), 0);
    almost(workApprox(spec, 0, 4, 16, "trapezoid"), 0, 0.05);
  });
});

describe("3.2 motion and work-energy", () => {
  it("stops before the endpoint when K would go negative", () => {
    const p = predictedOutcome({ mass: 2, v0: 2, xi: 0, xf: 5, spec: { type: "constant", F: -8 } });
    almost(p.s, 0.5, 0.02);
    assert.equal(p.reached, false);
    assert.equal(p.stoppedEarly, true);
    almost(p.Kf, 0, 0.05);
    almost(p.Wnet, -4, 0.08);
  });

  it("keeps kinetic energy nonnegative", () => {
    almost(kineticEnergy(2, 0), 0);
    assert.ok(kineticEnergy(2, 5) >= 0);
    almost(speedFromKe(2, 12), Math.sqrt(12));
  });

  it("agrees with ΔK after integrating Preset A", () => {
    const state = createState({ scenario: "constant" });
    stepTo(state, state.duration);
    const live = liveState(state);
    almost(live.Wnet, 24, 0.15);
    almost(live.K - live.Ki, live.Wnet, 0.2);
    assert.equal(state.reached, true);
    assert.ok(snapshot(state).agrees);
  });

  it("clears time on reset without changing the force settings", () => {
    const state = createState({ scenario: "signed" });
    stepTo(state, 1);
    const again = reset(state);
    almost(again.time, 0);
    almost(again.x, 0);
    assert.equal(again.spec.type, "piecewise-constant");
    almost(forceAt(again.spec, 1), 6);
    almost(forceAt(again.spec, 3), -3);
  });
});
