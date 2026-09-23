import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DT,
  analytical,
  analyzeLaunch,
  anglesForRange,
  complementaryAngle,
  initialComponents,
  simulateUntilLanding,
  sweepAngles,
  withinTolerance,
} from "./projectile.js";

const V0 = 20;
const G = 9.8;

describe("analytical projectile formulas", () => {
  it("splits v0 into vx = v0 cos θ and vy = v0 sin θ", () => {
    const { vx, vy } = initialComponents(V0, 30);
    assert.ok(Math.abs(vx - V0 * Math.cos(Math.PI / 6)) < 1e-12);
    assert.ok(Math.abs(vy - V0 * Math.sin(Math.PI / 6)) < 1e-12);
  });

  it("gives maximum range at 45° for equal launch and landing height", () => {
    const r30 = analytical(V0, 30, G).range;
    const r45 = analytical(V0, 45, G).range;
    const r60 = analytical(V0, 60, G).range;
    const r90 = analytical(V0, 90, G).range;
    assert.ok(r45 > r30);
    assert.ok(r45 > r60);
    assert.ok(r45 > r90);
    assert.ok(Math.abs(r45 - (V0 * V0) / G) < 1e-10);
  });

  it("gives the same range for complementary angles 30° and 60°", () => {
    const a = analytical(V0, 30, G);
    const b = analytical(V0, 60, G);
    assert.ok(Math.abs(a.range - b.range) < 1e-10);
    assert.ok(b.maxHeight > a.maxHeight);
    assert.ok(b.timeOfFlight > a.timeOfFlight);
    assert.equal(complementaryAngle(30), 60);
  });

  it("has zero range at 0° and 90°", () => {
    assert.equal(analytical(V0, 0, G).range, 0);
    assert.ok(Math.abs(analytical(V0, 90, G).range) < 1e-10);
    assert.equal(analytical(V0, 0, G).timeOfFlight, 0);
    assert.ok(analytical(V0, 90, G).maxHeight > analytical(V0, 45, G).maxHeight);
  });
});

describe("numerical simulation vs closed form", () => {
  it("keeps horizontal velocity constant", () => {
    const state = simulateUntilLanding({ v0: V0, angleDeg: 40, g: G, dt: DT });
    const vx0 = initialComponents(V0, 40).vx;
    assert.ok(Math.abs(state.vx - vx0) < 1e-12);
    for (const p of state.trajectory) {
      assert.ok(Math.abs(p.vx - vx0) < 1e-12);
    }
  });

  it("never reports the projectile below y = 0", () => {
    const state = simulateUntilLanding({ v0: V0, angleDeg: 50, g: G });
    for (const p of state.trajectory) {
      assert.ok(p.y >= -1e-9, `y=${p.y} at t=${p.t}`);
    }
    assert.equal(state.y, 0);
    assert.equal(state.landed, true);
  });

  it("matches range, height, and flight time within tolerance at 45°", () => {
    const report = analyzeLaunch({ v0: V0, angleDeg: 45, g: G, dt: DT });
    assert.ok(withinTolerance(report.simulated.range, report.analytical.range));
    assert.ok(withinTolerance(report.simulated.maxHeight, report.analytical.maxHeight));
    assert.ok(withinTolerance(report.simulated.timeOfFlight, report.analytical.timeOfFlight));
  });

  it("matches 30° and 60° numerically as well as analytically", () => {
    const a = analyzeLaunch({ v0: V0, angleDeg: 30, g: G });
    const b = analyzeLaunch({ v0: V0, angleDeg: 60, g: G });
    assert.ok(withinTolerance(a.simulated.range, b.simulated.range, 0.15, 0.02));
    assert.ok(a.simulated.maxHeight < b.simulated.maxHeight);
    assert.ok(a.simulated.timeOfFlight < b.simulated.timeOfFlight);
  });

  it("produces approximately zero range at 90°", () => {
    const report = analyzeLaunch({ v0: V0, angleDeg: 90, g: G });
    assert.ok(Math.abs(report.simulated.range) < 0.05);
  });

  it("stays on the ground at 0°", () => {
    const report = analyzeLaunch({ v0: V0, angleDeg: 0, g: G });
    assert.equal(report.simulated.range, 0);
    assert.equal(report.simulated.timeOfFlight, 0);
    assert.equal(report.simulated.maxHeight, 0);
  });

  it("shortens flight time and range when gravity increases", () => {
    const low = analyzeLaunch({ v0: V0, angleDeg: 45, g: 5 });
    const high = analyzeLaunch({ v0: V0, angleDeg: 45, g: 20 });
    assert.ok(high.simulated.timeOfFlight < low.simulated.timeOfFlight);
    assert.ok(high.simulated.range < low.simulated.range);
  });

  it("still runs at very low launch speed", () => {
    const report = analyzeLaunch({ v0: 1, angleDeg: 45, g: G });
    assert.ok(report.simulated.range > 0);
    assert.ok(withinTolerance(report.simulated.range, report.analytical.range, 0.05, 0.05));
  });
});

describe("angle sweep and challenge solver", () => {
  it("peaks near 45° on the range curve", () => {
    const { points } = sweepAngles({ v0: V0, g: G, stepDeg: 1 });
    let best = points[0];
    for (const p of points) {
      if (p.range > best.range) best = p;
    }
    assert.equal(best.angleDeg, 45);
  });

  it("solves two complementary angles for a reachable target range", () => {
    const target = 35;
    const solved = anglesForRange(target, V0, G);
    assert.equal(solved.possible, true);
    assert.equal(solved.angles.length, 2);
    const r0 = analytical(V0, solved.angles[0], G).range;
    const r1 = analytical(V0, solved.angles[1], G).range;
    assert.ok(Math.abs(r0 - target) < 0.05);
    assert.ok(Math.abs(r1 - target) < 0.05);
    assert.ok(Math.abs(solved.angles[0] + solved.angles[1] - 90) < 0.05);
  });

  it("rejects a target beyond the 45° maximum range", () => {
    const max = analytical(V0, 45, G).range;
    const solved = anglesForRange(max + 5, V0, G);
    assert.equal(solved.possible, false);
    assert.equal(solved.reason, "beyond-max");
  });
});
