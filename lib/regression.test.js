import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canFit,
  formatFitEquation,
  polynomialFit,
  sampleFit,
} from "./regression.js";

describe("polynomial regression", () => {
  it("returns null until there are two distinct x values", () => {
    assert.equal(polynomialFit([]), null);
    assert.equal(polynomialFit([{ x: 10, y: 1 }]), null);
    assert.equal(
      polynomialFit([
        { x: 45, y: 10 },
        { x: 45, y: 12 },
      ]),
      null,
    );
    assert.equal(canFit([{ x: 45, y: 10 }]), false);
  });

  it("recovers a perfect line", () => {
    const fit = polynomialFit(
      [
        { x: 0, y: 2 },
        { x: 10, y: 12 },
        { x: 20, y: 22 },
      ],
      { maxDegree: 1, xScale: 20 },
    );
    assert.ok(fit);
    assert.equal(fit.degree, 1);
    assert.ok(Math.abs(fit.evaluate(15) - 17) < 1e-8);
    assert.ok(fit.r2 > 0.999);
  });

  it("recovers a perfect parabola", () => {
    const points = [0, 30, 45, 60, 90].map((x) => ({ x, y: 0.02 * x * x + 3 }));
    const fit = polynomialFit(points, { maxDegree: 2, xScale: 90 });
    assert.ok(fit);
    assert.equal(fit.degree, 2);
    assert.ok(Math.abs(fit.evaluate(45) - (0.02 * 45 * 45 + 3)) < 1e-6);
    assert.ok(fit.r2 > 0.999);
  });

  it("falls back to linear when only two unique angles are present", () => {
    const fit = polynomialFit(
      [
        { x: 30, y: 10 },
        { x: 60, y: 20 },
        { x: 30, y: 10 },
      ],
      { maxDegree: 2 },
    );
    assert.equal(fit.degree, 1);
  });

  it("formats a readable equation and samples the curve", () => {
    const fit = polynomialFit(
      [
        { x: 0, y: 1 },
        { x: 10, y: 3 },
      ],
      { maxDegree: 1, xScale: 10 },
    );
    const eq = formatFitEquation(fit, "R", "θ");
    assert.match(eq, /^R = /);
    assert.match(eq, /θ/);
    const samples = sampleFit(fit, { start: 0, end: 10, steps: 10 });
    assert.equal(samples.length, 11);
    assert.ok(Math.abs(samples[10].y - 3) < 1e-8);
  });
});
