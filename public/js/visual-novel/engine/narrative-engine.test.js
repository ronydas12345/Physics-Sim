import assert from "node:assert/strict";
import test from "node:test";
import { createNarrativeSession, walkStory } from "./narrative-engine.js";
import { projectileArrivalStory } from "../stories/projectile-motion/arrival.js";

test("arrival story is a complete linear path with named characters", () => {
  assert.equal(projectileArrivalStory.start, "facility-exterior");
  assert.ok(projectileArrivalStory.characters.mara);
  assert.ok(projectileArrivalStory.characters.elias);
  assert.ok(projectileArrivalStory.characters.mara.expressions.includes("thinking"));
  const frames = walkStory(projectileArrivalStory);
  assert.equal(frames[0].complete, false);
  assert.equal(frames[0].sceneId, "facility-exterior");
  assert.equal(frames[frames.length - 1].complete, true);
  const scenes = [...new Set(frames.filter((frame) => !frame.complete).map((frame) => frame.sceneId))];
  assert.deepEqual(scenes, ["facility-exterior", "facility-interior", "control-room"]);
  assert.ok(frames.some((frame) => frame.speaker === "Mara"));
  assert.ok(frames.some((frame) => frame.speaker === "Elias"));
});

test("advance walks lines then scenes, and reset returns to the start", () => {
  const session = createNarrativeSession(projectileArrivalStory);
  const first = session.view();
  session.advance();
  assert.equal(session.view().lineIndex, first.lineIndex + 1);
  const walked = walkStory(projectileArrivalStory);
  assert.ok(walked.length > 6);
  session.reset();
  assert.deepEqual(session.view().sceneId, first.sceneId);
  assert.equal(session.view().lineIndex, 0);
  assert.equal(session.view().complete, false);
});
