import assert from "node:assert/strict";
import test from "node:test";
import { BRANCH_CONDITIONS, emptyLearningState, validateTutorialDefinition } from "./schema.js";
import { projectileRangeTutorial } from "./tutorials/projectile-motion.js";
import { LAB_EVENTS, actionFromEvent, createLabBus } from "../shared/lab-events.js";

test("projectile tutorial definition matches the Stage 1 schema", () => {
  assert.deepEqual(validateTutorialDefinition(projectileRangeTutorial), []);
  assert.equal(projectileRangeTutorial.simulationId, "1-5");
  assert.equal(projectileRangeTutorial.start, "intro");
  assert.equal(projectileRangeTutorial.stages.intro.type, "introduction");
  assert.equal(projectileRangeTutorial.stages.interface.highlight, "angle");
  assert.ok(projectileRangeTutorial.adapter.controls.includes("btn-launch"));
});

test("learning state starts empty and separate from story progress", () => {
  const state = emptyLearningState("1-5-range-intro");
  assert.equal(state.guidanceLevel, "standard");
  assert.deepEqual(state.completedStages, []);
  assert.equal(state.currentStage, null);
  assert.ok(BRANCH_CONDITIONS.includes("REPEATED_ERROR"));
});

test("lab event bus delivers story and tutorial events without coupling", () => {
  const bus = createLabBus();
  const seen = [];
  bus.on(LAB_EVENTS.STORY_SCENE_UNLOCKED, (detail) => seen.push(detail.sceneId));
  bus.emit(LAB_EVENTS.STORY_SCENE_UNLOCKED, { sceneId: "facility-exterior" });
  assert.deepEqual(seen, ["facility-exterior"]);
});

test("simulation events stay on the shared bus and map to tutorial actions", () => {
  assert.equal(actionFromEvent(LAB_EVENTS.PROJECTILE_LAUNCHED), "launch");
  assert.equal(actionFromEvent(LAB_EVENTS.TRIAL_RECORDED), "record-trial");
  const bus = createLabBus();
  const seen = [];
  bus.on(LAB_EVENTS.PROJECTILE_LAUNCHED, (detail) => seen.push(detail.angleDeg));
  bus.emit(LAB_EVENTS.PROJECTILE_LAUNCHED, { angleDeg: 45 });
  assert.deepEqual(seen, [45]);
});
