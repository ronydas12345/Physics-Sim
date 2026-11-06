import assert from "node:assert/strict";
import test from "node:test";
import { listedSimulationIds } from "../tutorials/registry.js";
import { LAB_EVENTS, actionFromEvent, bindSimEvents, createLabBus } from "../shared/lab-events.js";
import { simulationAdapter } from "./adapter.js";
import { validateTutorialDefinition } from "./schema.js";
import { getLearningTutorial, listLearningTutorials } from "./registry.js";
import { createLinearTutorial, linearPath, walkLinear } from "./engine/linear-engine.js";

const PLATFORM_IDS = listedSimulationIds();

test("every simulation has a learning-path definition that validates", () => {
  const ids = ["1-5", ...PLATFORM_IDS];
  assert.deepEqual(
    listLearningTutorials().map((def) => def.simulationId).sort(),
    [...ids].sort(),
  );
  for (const id of ids) {
    const def = getLearningTutorial(id);
    assert.ok(def, id);
    assert.deepEqual(validateTutorialDefinition(def), [], id);
    assert.equal(def.adapter.simulationId, id, id);
    assert.ok(def.adapter.events.length, id);
    assert.ok(linearPath(def).includes("summary"), id);
  }
});

test("Newton's second law is the second-sim adapter check", () => {
  const def = getLearningTutorial("2-5");
  assert.equal(def.id, "2-5-second-law");
  assert.ok(def.adapter.controls.includes("mass-control"));
  assert.ok(def.adapter.measurements.includes("acceleration"));
  const frames = walkLinear(def);
  assert.equal(frames.at(-1).complete, true);
  assert.ok(frames.some((frame) => frame.stageId === "action" && frame.needsAction));
  assert.ok(frames.some((frame) => frame.stageId === "extension"));
  const supported = createLinearTutorial(def);
  while (supported.view().stageId !== "concept-check") {
    const now = supported.view();
    if (now.needsAction) supported.observe(now.requiredAction);
    else supported.advance();
  }
  supported.answer("v");
  supported.advance();
  assert.equal(supported.view().stageId, "concept-why");
  assert.equal(supported.view().guidanceLevel, "supported");
});

test("the simulation adapter reports play clicks without touching physics", () => {
  const adapter = simulationAdapter({
    simulationId: "2-5",
    controls: ["btn-play"],
    measurements: ["acceleration"],
    events: ["play"],
  });
  assert.equal(adapter.simulationId, "2-5");
  assert.equal(actionFromEvent(LAB_EVENTS.PLAYBACK_STARTED), "play");
  assert.equal(actionFromEvent(LAB_EVENTS.NUDGED), "nudge");

  const bus = createLabBus();
  const seen = [];
  bus.on(LAB_EVENTS.PLAYBACK_STARTED, (detail) => seen.push(detail.controlId));
  const listeners = {};
  const root = {
    addEventListener(type, fn) {
      listeners[type] = fn;
    },
    removeEventListener(type) {
      delete listeners[type];
    },
  };
  const stop = bindSimEvents(root, bus);
  listeners.click({ target: { closest: () => ({ id: "btn-play" }) } });
  assert.deepEqual(seen, ["btn-play"]);
  stop();
});

test("restarted learning progress does not keep completed stages", () => {
  const def = getLearningTutorial("1-1");
  const session = createLinearTutorial(def, {
    state: { currentStage: "summary", completedStages: ["intro", "interface"], complete: true },
  });
  session.restart();
  assert.equal(session.view().stageId, "intro");
  assert.deepEqual(session.view().completedStages, []);
  assert.equal(session.view().complete, false);
});
