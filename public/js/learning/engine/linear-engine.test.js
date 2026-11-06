import assert from "node:assert/strict";
import test from "node:test";
import { LAB_EVENTS, createLabBus } from "../../shared/lab-events.js";
import { projectileRangeTutorial } from "../tutorials/projectile-motion.js";
import { getLearningTutorial } from "../registry.js";
import { createLinearTutorial, linearPath, walkLinear } from "./linear-engine.js";

test("registry loads the projectile tutorial by simulation id", () => {
  const def = getLearningTutorial("1-5");
  assert.equal(def.id, "1-5-range-intro");
  assert.deepEqual(linearPath(def), ["intro", "interface", "launch", "observe", "summary"]);
});

test("linear engine walks next pointers and ignores reserved branches", () => {
  assert.equal(projectileRangeTutorial.stages.launch.branches.INCOMPLETE_ACTION, "launch");
  const frames = walkLinear(projectileRangeTutorial);
  const ids = frames.filter((frame) => !frame.complete).map((frame) => frame.stageId);
  assert.deepEqual(ids, ["intro", "interface", "launch", "observe", "summary"]);
  assert.equal(frames.at(-1).complete, true);
  assert.equal(frames.at(-1).stageId, "summary");
  assert.deepEqual(frames.at(-1).completedStages, ids);
});

test("each stage exposes instruction and explanation copy", () => {
  const session = createLinearTutorial(projectileRangeTutorial);
  const seen = [];
  let view = session.view();
  while (!view.complete) {
    seen.push(view.stageId);
    assert.ok(view.instruction.length > 0, view.stageId);
    assert.ok(view.explanation.length > 0, view.stageId);
    assert.ok(view.kindLabel.length > 0, view.stageId);
    view = session.advance();
  }
  assert.deepEqual(seen, ["intro", "interface", "launch", "observe", "summary"]);
});

test("advance, back, go, and restart keep a linear history", () => {
  const session = createLinearTutorial(projectileRangeTutorial);
  session.advance();
  session.advance();
  assert.equal(session.view().stageId, "launch");
  session.back();
  assert.equal(session.view().stageId, "interface");
  session.go("observe");
  assert.equal(session.view().stageId, "observe");
  assert.equal(session.view().complete, false);
  session.restart();
  assert.equal(session.view().stageId, "intro");
  assert.deepEqual(session.view().completedStages, []);
  assert.equal(session.view().complete, false);
});

test("saved learning state restores the current stage without following branches", () => {
  const session = createLinearTutorial(projectileRangeTutorial, {
    state: {
      currentStage: "launch",
      completedStages: ["intro", "interface"],
    },
  });
  assert.equal(session.view().stageId, "launch");
  assert.deepEqual(session.view().completedStages, ["intro", "interface"]);
  session.advance();
  assert.equal(session.view().stageId, "observe");
  const snap = session.snapshot();
  assert.equal(snap.tutorialId, "1-5-range-intro");
  assert.equal(snap.currentStage, "observe");
  assert.ok(snap.completedStages.includes("launch"));
});

test("finishing the last stage emits checkpoint and completion events", () => {
  const bus = createLabBus();
  const seen = [];
  bus.on(LAB_EVENTS.LAB_STEP_COMPLETED, (detail) => seen.push(`step:${detail.stageId}`));
  bus.on(LAB_EVENTS.LAB_CHECKPOINT_REACHED, (detail) => seen.push(`check:${detail.stageId}`));
  bus.on(LAB_EVENTS.LAB_COMPLETED, (detail) => seen.push(`done:${detail.tutorialId}`));
  const session = createLinearTutorial(projectileRangeTutorial, { bus });
  while (!session.view().complete) session.advance();
  assert.ok(seen.includes("step:summary"));
  assert.ok(seen.includes("check:summary"));
  assert.ok(seen.includes("done:1-5-range-intro"));
  session.advance();
  assert.equal(seen.filter((item) => item.startsWith("done:")).length, 1);
});
