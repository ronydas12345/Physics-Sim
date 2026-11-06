import assert from "node:assert/strict";
import test from "node:test";
import { LAB_EVENTS, createLabBus } from "../../shared/lab-events.js";
import { projectileRangeTutorial } from "../tutorials/projectile-motion.js";
import { getLearningTutorial } from "../registry.js";
import { createLinearTutorial, linearPath, walkLinear } from "./linear-engine.js";

test("registry loads the projectile tutorial by simulation id", () => {
  const def = getLearningTutorial("1-5");
  assert.equal(def.id, "1-5-range-intro");
  assert.deepEqual(linearPath(def), [
    "intro",
    "interface",
    "launch",
    "observe",
    "concept-check",
    "summary",
  ]);
});

test("correct first answers take the extension path", () => {
  const frames = walkLinear(projectileRangeTutorial);
  const ids = frames.filter((frame) => !frame.complete).map((frame) => frame.stageId);
  assert.deepEqual(ids, [
    "intro",
    "interface",
    "launch",
    "observe",
    "concept-check",
    "extension",
    "summary",
  ]);
  assert.equal(frames.at(-1).complete, true);
  assert.equal(frames.find((frame) => frame.stageId === "extension")?.guidanceLevel, "extension");
});

test("each spine stage exposes instruction copy", () => {
  const session = createLinearTutorial(projectileRangeTutorial);
  for (const id of linearPath(projectileRangeTutorial)) {
    if (id === "summary") continue;
    session.go(id);
    assert.ok(session.view().instruction.length > 0, id);
    assert.ok(session.view().kindLabel.length > 0, id);
  }
});

test("advance, back, go, and restart keep a history", () => {
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
  assert.equal(session.view().guidanceLevel, "standard");
});

test("saved learning state restores an off-spine supported stage", () => {
  const session = createLinearTutorial(projectileRangeTutorial, {
    state: {
      currentStage: "angle-why",
      completedStages: ["intro", "interface", "launch", "observe"],
      guidanceLevel: "supported",
    },
  });
  assert.equal(session.view().stageId, "angle-why");
  assert.equal(session.view().guidanceLevel, "supported");
  session.advance();
  assert.equal(session.view().stageId, "concept-retry");
});

test("wrong concept answers take the supported path, then return to standard", () => {
  const bus = createLabBus();
  const branches = [];
  bus.on(LAB_EVENTS.TUTORIAL_BRANCH_CHANGED, (detail) => branches.push(detail.condition));
  const session = createLinearTutorial(projectileRangeTutorial, { bus });
  while (session.view().stageId !== "concept-check") session.advance();
  session.answer("high");
  assert.equal(session.view().question.correct, false);
  session.advance();
  assert.equal(session.view().stageId, "angle-why");
  assert.equal(session.view().guidanceLevel, "supported");
  assert.equal(session.view().guidanceLabel, "Supported path");
  session.advance();
  assert.equal(session.view().stageId, "concept-retry");
  session.answer("equal");
  session.advance();
  assert.equal(session.view().stageId, "summary");
  assert.equal(session.view().guidanceLevel, "standard");
  assert.ok(branches.includes("CONCEPT_MISUNDERSTANDING"));
});

test("hints block the extension path and record usage", () => {
  const bus = createLabBus();
  const seen = [];
  bus.on(LAB_EVENTS.TUTORIAL_HINT_REQUESTED, (detail) => seen.push(detail.stageId));
  const session = createLinearTutorial(projectileRangeTutorial, { bus });
  while (session.view().stageId !== "concept-check") session.advance();
  session.requestHint();
  assert.equal(session.view().hints.length, 1);
  session.answer("comp");
  session.advance();
  assert.equal(session.view().stageId, "summary");
  assert.equal(session.view().guidanceLevel, "standard");
  assert.deepEqual(seen, ["concept-check"]);
});

test("a hint on launch takes the supported launch explanation", () => {
  const session = createLinearTutorial(projectileRangeTutorial);
  session.advance();
  session.advance();
  assert.equal(session.view().stageId, "launch");
  session.requestHint();
  session.advance();
  assert.equal(session.view().stageId, "launch-support");
  assert.equal(session.view().guidanceLevel, "supported");
  session.advance();
  assert.equal(session.view().stageId, "launch");
});

test("finishing the last stage emits checkpoint and completion events", () => {
  const bus = createLabBus();
  const seen = [];
  bus.on(LAB_EVENTS.LAB_STEP_COMPLETED, (detail) => seen.push(`step:${detail.stageId}`));
  bus.on(LAB_EVENTS.LAB_CHECKPOINT_REACHED, (detail) => seen.push(`check:${detail.stageId}`));
  bus.on(LAB_EVENTS.LAB_COMPLETED, (detail) => seen.push(`done:${detail.tutorialId}`));
  const session = createLinearTutorial(projectileRangeTutorial, { bus });
  while (!session.view().complete) {
    const now = session.view();
    if (now.needsAnswer) session.answer(now.question.options.find((option) => option.correct).id);
    session.advance();
  }
  assert.ok(seen.includes("step:summary"));
  assert.ok(seen.includes("check:summary"));
  assert.ok(seen.includes("done:1-5-range-intro"));
});
