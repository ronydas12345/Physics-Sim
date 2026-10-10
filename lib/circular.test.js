import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  centripetalAccel,
  centripetalForce,
  clampRadius,
  createState,
  evaluateCircular,
  frequencyOf,
  liveState,
  maxFrictionSpeed,
  omegaOf,
  periodOf,
  predictedAc,
  predictedFc,
  reset,
  setDirection,
  setMass,
  setRadius,
  setSpeed,
  setTheta,
  snapshot,
  stepTo,
} from "./circular.js";

function almost(actual, expected, eps = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= eps, `${actual} ≉ ${expected}`);
}

describe("2.9 circular motion", () => {
  it("gives ac = 8 m/s² for v = 4 m/s and r = 2 m", () => {
    almost(centripetalAccel(4, 2), 8);
    almost(predictedAc({ speed: 4, r: 2 }), 8);
  });

  it("gives Fc = 8 N for m = 1 kg, v = 4 m/s, r = 2 m", () => {
    almost(centripetalForce(1, 4, 2), 8);
    almost(predictedFc({ mass: 1, speed: 4, r: 2 }), 8);
  });

  it("gives ω = 2 rad/s for v = 4 m/s and r = 2 m", () => {
    almost(omegaOf(4, 2), 2);
  });

  it("gives T = π s for r = 2 m and v = 4 m/s", () => {
    almost(periodOf(4, 2), Math.PI, 1e-9);
    almost(periodOf(4, 2), 3.142, 0.001);
  });

  it("gives f = 1/π Hz", () => {
    almost(frequencyOf(4, 2), 1 / Math.PI, 1e-9);
    almost(frequencyOf(4, 2), 0.318, 0.001);
  });

  it("quadruples ac and Fc when speed doubles at fixed r and m", () => {
    almost(centripetalAccel(8, 2), 32);
    almost(centripetalForce(1, 8, 2), 32);
  });

  it("halves ac and Fc when radius doubles at fixed v and m", () => {
    almost(centripetalAccel(4, 4), 4);
    almost(centripetalForce(1, 4, 4), 4);
  });

  it("keeps ac unchanged and doubles Fc when mass doubles", () => {
    const a = evaluateCircular({ mass: 1, r: 2, speed: 4, theta: 0, direction: 1 });
    const b = evaluateCircular({ mass: 2, r: 2, speed: 4, theta: 0, direction: 1 });
    almost(a.ac, b.ac);
    almost(a.ac, 8);
    almost(b.Fc, 16);
  });

  it("gives ac = 0 and undefined T at zero speed", () => {
    const live = evaluateCircular({ mass: 1, r: 2, speed: 0, theta: 0, direction: 1 });
    almost(live.ac, 0);
    almost(live.Fc, 0);
    assert.equal(live.T, null);
    assert.equal(live.f, null);
    almost(live.vx, 0);
    almost(live.vy, 0);
  });

  it("points velocity up and acceleration left at the rightmost point for CCW motion", () => {
    const live = evaluateCircular({ mass: 1, r: 2, speed: 4, theta: 0, direction: 1 });
    almost(live.x, 2);
    almost(live.y, 0);
    almost(live.vx, 0);
    almost(live.vy, 4);
    almost(live.ax, -8);
    almost(live.ay, 0);
  });

  it("reverses velocity at the rightmost point for clockwise motion while a stays inward", () => {
    const live = evaluateCircular({ mass: 1, r: 2, speed: 4, theta: 0, direction: -1 });
    almost(live.vx, 0);
    almost(live.vy, -4);
    almost(live.ax, -8);
    almost(live.ay, 0);
  });

  it("matches cardinal CCW directions at 90°, 180°, and 270°", () => {
    const top = evaluateCircular({ mass: 1, r: 2, speed: 4, theta: Math.PI / 2, direction: 1 });
    almost(top.vx, -4, 1e-9);
    almost(top.vy, 0, 1e-9);
    almost(top.ax, 0, 1e-9);
    almost(top.ay, -8, 1e-9);

    const left = evaluateCircular({ mass: 1, r: 2, speed: 4, theta: Math.PI, direction: 1 });
    almost(left.vx, 0, 1e-9);
    almost(left.vy, -4, 1e-9);
    almost(left.ax, 8, 1e-9);
    almost(left.ay, 0, 1e-9);

    const bottom = evaluateCircular({ mass: 1, r: 2, speed: 4, theta: (3 * Math.PI) / 2, direction: 1 });
    almost(bottom.vx, 4, 1e-9);
    almost(bottom.vy, 0, 1e-9);
    almost(bottom.ax, 0, 1e-9);
    almost(bottom.ay, 8, 1e-9);
  });

  it("keeps |v| = v and |a| = v²/r around the circle", () => {
    for (const deg of [0, 40, 90, 135, 180, 225, 270, 315]) {
      const live = evaluateCircular({
        mass: 1,
        r: 2,
        speed: 4,
        theta: (deg * Math.PI) / 180,
        direction: 1,
      });
      almost(Math.hypot(live.vx, live.vy), 4, 1e-9);
      almost(Math.hypot(live.ax, live.ay), 8, 1e-9);
      almost(live.vx * live.ax + live.vy * live.ay, 0, 1e-8);
    }
  });

  it("gives v_max ≈ 4.43 m/s for μs = 0.50, g = 9.81, r = 4 m", () => {
    almost(maxFrictionSpeed(0.5, 9.81, 4), Math.sqrt(0.5 * 9.81 * 4), 1e-9);
    almost(maxFrictionSpeed(0.5, 9.81, 4), 4.43, 0.01);
    const ok = evaluateCircular({ mass: 2, r: 4, speed: 4, theta: 0, direction: 1, forceSource: "friction", mu: 0.5, g: 9.81 });
    assert.equal(ok.supported, true);
    const over = evaluateCircular({ mass: 2, r: 4, speed: 8, theta: 0, direction: 1, forceSource: "friction", mu: 0.5, g: 9.81 });
    assert.equal(over.supported, false);
    almost(ok.fsMax, 9.81, 1e-9);
  });

  it("rejects a zero radius by clamping to the minimum", () => {
    almost(clampRadius(0), 0.5);
    almost(clampRadius("nope"), 2);
    const live = evaluateCircular({ mass: 1, r: 0, speed: 4, theta: 0, direction: 1 });
    assert.ok(live.r >= 0.5);
    assert.ok(Number.isFinite(live.ac));
  });

  it("stays on the circular path while time advances", () => {
    const state = createState({ scenario: "baseline" });
    stepTo(state, Math.PI / 2);
    const live = liveState(state);
    almost(Math.hypot(live.x, live.y), 2, 1e-6);
    almost(Math.hypot(live.vx, live.vy), 4, 1e-6);
    almost(live.ac, 8, 1e-6);
  });

  it("passes the top after a quarter period from θ = 0", () => {
    const state = createState({ scenario: "baseline" });
    stepTo(state, periodOf(4, 2) / 4);
    const live = liveState(state);
    almost(live.x, 0, 2e-3);
    almost(live.y, 2, 2e-3);
    almost(live.vx, -4, 2e-2);
    almost(live.vy, 0, 2e-2);
  });

  it("returns near the start after one period", () => {
    const state = createState({ scenario: "baseline" });
    stepTo(state, periodOf(4, 2));
    const live = liveState(state);
    almost(live.x, 2, 0.02);
    almost(live.y, 0, 0.02);
  });

  it("does not move when speed is zero", () => {
    const state = createState({ scenario: "rest" });
    stepTo(state, 2);
    const live = liveState(state);
    almost(live.x, 2);
    almost(live.y, 0);
    almost(live.speed, 0);
    almost(state.time, 2);
  });

  it("matches the double-v-and-r combined result", () => {
    const live = evaluateCircular({ mass: 1, r: 4, speed: 8, theta: 0, direction: 1 });
    almost(live.ac, 16);
    almost(live.Fc, 16);
    almost(live.omegaMag, 2);
  });

  it("matches the combined guided-lab numbers", () => {
    const live = evaluateCircular({ mass: 3, r: 6, speed: 6, theta: 0, direction: 1 });
    almost(live.ac, 6);
    almost(live.Fc, 18);
    almost(live.omegaMag, 1);
    almost(live.T, 2 * Math.PI, 1e-9);
  });

  it("updates Fc when mass changes at fixed v and r", () => {
    const state = createState({ scenario: "baseline" });
    almost(snapshot(state).Fc, 8);
    setMass(state, 2);
    almost(snapshot(state).ac, 8);
    almost(snapshot(state).Fc, 16);
  });

  it("clears time on reset without changing radius", () => {
    const state = createState({ scenario: "baseline" });
    setSpeed(state, 8);
    stepTo(state, 1);
    const next = reset(state);
    almost(next.time, 0);
    almost(next.r, 2);
    almost(next.speed, 8);
    almost(next.theta, 0);
  });

  it("keeps θ when switching direction at rest at the rightmost point", () => {
    const state = createState({ scenario: "baseline" });
    setDirection(state, -1);
    const live = liveState(state);
    almost(live.theta, 0);
    almost(live.vy, -4);
  });

  it("places the object at a chosen angle without integrating", () => {
    const state = createState({ scenario: "baseline" });
    setTheta(state, Math.PI / 2);
    const live = liveState(state);
    almost(live.x, 0, 1e-9);
    almost(live.y, 2, 1e-9);
    almost(state.time, 0);
  });

  it("does not change radius when speed changes", () => {
    const state = createState({ scenario: "baseline" });
    setRadius(state, 4);
    setSpeed(state, 8);
    almost(liveState(state).r, 4);
    almost(liveState(state).ac, 16);
  });
});
