import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CAMERA,
  cameraModesFor,
  cameraRange,
  cameraScale,
  defaultCameraMode,
  normalizeCameraMode,
} from "./camera.js";

function contains(range, x, eps = 1e-9) {
  assert.ok(x >= range.lo - eps && x <= range.hi + eps, `${x} not in [${range.lo}, ${range.hi}]`);
}

describe("lab cameras", () => {
  it("defaults two-object labs to fit-all and one-object labs to origin", () => {
    assert.equal(defaultCameraMode(1), CAMERA.ORIGIN);
    assert.equal(defaultCameraMode(2), CAMERA.FIT);
    assert.deepEqual(cameraModesFor(1), [CAMERA.ORIGIN, CAMERA.FOLLOW, CAMERA.STATIONARY]);
    assert.deepEqual(cameraModesFor(2), [CAMERA.FIT, CAMERA.ORIGIN, CAMERA.STATIONARY]);
    assert.deepEqual(cameraModesFor(3), [CAMERA.ORIGIN, CAMERA.STATIONARY]);
    assert.equal(normalizeCameraMode(CAMERA.FOLLOW, 3), CAMERA.ORIGIN);
  });

  it("zooms out so two distant objects both stay in frame", () => {
    const range = cameraRange([-8, 40], { mode: CAMERA.FIT, pad: 3, minSpan: 16 });
    contains(range, -8);
    contains(range, 40);
    assert.ok(range.span >= 40 - -8 + 6);
    assert.ok(range.lo <= -8 - 3 + 1e-9);
    assert.ok(range.hi >= 40 + 3 - 1e-9);
  });

  it("keeps a comfortable zoom when two objects are close", () => {
    const range = cameraRange([-2.5, 2.5], { mode: CAMERA.FIT, pad: 2.5, minSpan: 16 });
    contains(range, -2.5);
    contains(range, 2.5);
    assert.equal(range.span, 16);
  });

  it("keeps the origin in view and zooms out after one object recedes", () => {
    const range = cameraRange([50], { mode: CAMERA.ORIGIN, pad: 3.5, minSpan: 22 });
    contains(range, 0);
    contains(range, 50);
    assert.ok(range.span > 22);
  });

  it("follows one object at a fixed span without requiring the origin", () => {
    const range = cameraRange([50], { mode: CAMERA.FOLLOW, followSpan: 22, followEdge: 3.5, minSpan: 22 });
    contains(range, 50);
    assert.equal(range.span, 22);
    assert.ok(range.hi < 0 || range.lo > 0);
  });

  it("locks a frozen window in stationary mode", () => {
    const range = cameraRange([80], { mode: CAMERA.STATIONARY, lockLo: -4, lockHi: 12 });
    assert.equal(range.lo, -4);
    assert.equal(range.hi, 12);
    assert.ok(80 > range.hi);
  });

  it("maps world span onto the plot width", () => {
    assert.equal(cameraScale(20, 400), 20);
  });

  it("adds screen padding so markers are not clipped at the edges", () => {
    const range = cameraRange([-8, 40], { mode: CAMERA.FIT, pad: 3, minSpan: 16, plotPx: 800, screenPadPx: 40 });
    contains(range, -8);
    contains(range, 40);
    assert.ok(range.lo < -8 - 3);
    assert.ok(range.hi > 40 + 3);
  });
});
