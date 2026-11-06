import assert from "node:assert/strict";
import test from "node:test";
import { TARGET_ALIASES, resolveTutorialTarget } from "./highlight-target.js";

function fakeRoot(ids) {
  return {
    querySelector(sel) {
      if (sel.startsWith("#")) return ids[sel.slice(1)] || null;
      return null;
    },
  };
}

test("projectile highlights resolve through the shared tutorial aliases", () => {
  const angle = { id: "angle" };
  const canvas = { id: "simulation-canvas" };
  const playback = { id: "playback-controls" };
  const metrics = { id: "final-metrics" };
  const root = fakeRoot({
    angle,
    "simulation-canvas": canvas,
    "playback-controls": playback,
    "final-metrics": metrics,
  });
  assert.equal(resolveTutorialTarget(root, "angle"), angle);
  assert.equal(resolveTutorialTarget(root, "simulation-canvas"), canvas);
  assert.equal(resolveTutorialTarget(root, "playback-controls"), playback);
  assert.equal(resolveTutorialTarget(root, "final-metrics"), metrics);
  assert.equal(TARGET_ALIASES["simulation-canvas"], "#simulation-canvas");
  assert.equal(TARGET_ALIASES["playback-controls"], "#playback-controls");
});
