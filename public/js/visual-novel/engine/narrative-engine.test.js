import assert from "node:assert/strict";
import test from "node:test";
import { createNarrativeSession, walkStory } from "./narrative-engine.js";
import { nextCheckpointId } from "./skip.js";
import { projectileArrivalStory } from "../stories/projectile-motion/arrival.js";
import { LAB_EVENTS, createLabBus } from "../../shared/lab-events.js";
import { BACKGROUNDS } from "../renderer/backgrounds.js";
import { SPRITE_EXPRESSIONS, spriteSvg } from "../renderer/sprites.js";
import { createLinearTutorial } from "../../learning/engine/linear-engine.js";
import { projectileRangeTutorial } from "../../learning/tutorials/projectile-motion.js";

test("arrival story visits every demonstration background and both characters", () => {
  const frames = walkStory(projectileArrivalStory);
  assert.equal(frames[0].complete, false);
  assert.equal(frames[frames.length - 1].complete, true);
  const scenes = [...new Set(frames.filter((frame) => !frame.complete).map((frame) => frame.sceneId))];
  assert.deepEqual(scenes, [
    "facility-exterior",
    "facility-interior",
    "control-room",
    "testing-area",
    "simulation-focus",
    "investigation",
    "revelation",
    "closing",
  ]);
  const bgs = new Set(frames.map((frame) => frame.background));
  for (const id of BACKGROUNDS) assert.equal(bgs.has(id), true, id);
  assert.ok(frames.some((frame) => frame.speaker === "Mara"));
  assert.ok(frames.some((frame) => frame.speaker === "Elias"));
});

test("investigation choices reconverge on the testing area", () => {
  for (const id of ["report", "launcher", "ask-elias"]) {
    const frames = walkStory(projectileArrivalStory, (choices) => (
      choices.some((choice) => choice.id === id) ? id : choices[0]?.id
    ));
    const choice = frames.find((frame) => frame.awaitingChoice);
    assert.ok(choice, id);
    assert.equal(choice.choices.length, 3);
    assert.ok(frames.some((frame) => frame.lastChoiceId === id && frame.text.includes(" ") && !frame.awaitingChoice));
    const after = frames.find((frame) => frame.sceneId === "testing-area");
    assert.ok(after, id);
  }
});

test("sprites cover Mara and Elias expressions without embedding art in dialogue", () => {
  assert.deepEqual(SPRITE_EXPRESSIONS.mara, projectileArrivalStory.characters.mara.expressions);
  assert.ok(SPRITE_EXPRESSIONS.elias.includes("confused"));
  assert.match(spriteSvg("mara", "surprised"), /vn-sprite/);
  assert.match(spriteSvg("elias", "confused"), /vn-sprite/);
  const raw = JSON.stringify(projectileArrivalStory);
  assert.equal(raw.includes("<svg"), false);
  assert.equal(raw.includes("http"), false);
});

test("entered characters stay on stage until a later scene recasts them", () => {
  const session = createNarrativeSession(projectileArrivalStory);
  while (session.view().speaker !== "Elias" && !session.view().complete) session.advance();
  session.advance();
  const elias = session.view().cast.find((entry) => entry.id === "elias");
  assert.equal(elias?.visible, true);
});

test("advance waits on choices, and reset returns to the start", () => {
  const session = createNarrativeSession(projectileArrivalStory);
  const first = session.view();
  session.advance();
  assert.equal(session.view().lineIndex, first.lineIndex + 1);
  while (!session.view().awaitingChoice && !session.view().complete) session.advance();
  const blocked = session.view();
  session.advance();
  assert.equal(session.view().sceneId, blocked.sceneId);
  session.choose("launcher");
  assert.equal(session.view().lastChoiceId, "launcher");
  assert.match(session.view().text, /Angle, speed, and g/);
  session.reset();
  assert.equal(session.view().sceneId, first.sceneId);
  assert.equal(session.view().awaitingChoice, false);
});

test("skip to checkpoint stops at a choice; skip all takes a default path to the end", () => {
  assert.equal(nextCheckpointId(projectileArrivalStory, "facility-exterior"), "control-room");
  assert.equal(nextCheckpointId(projectileArrivalStory, "testing-area"), "simulation-focus");
  assert.equal(nextCheckpointId(projectileArrivalStory, "simulation-focus"), "investigation");
  const session = createNarrativeSession(projectileArrivalStory);
  session.skipToCheckpoint();
  assert.equal(session.view().sceneId, "control-room");
  assert.equal(session.view().awaitingChoice, true);
  assert.equal(session.view().checkpoint, "decision");
  session.skipAll();
  assert.equal(session.view().complete, true);
  assert.equal(session.view().awaitingChoice, false);
  assert.ok(session.view().history.some((entry) => entry.choiceLabel));
  assert.ok(session.view().history.some((entry) => entry.speaker === "Mara"));
  const fromStart = createNarrativeSession(projectileArrivalStory);
  fromStart.skipAll();
  assert.equal(fromStart.view().complete, true);
  session.reset();
  assert.equal(session.view().history.length, 1);
});

test("skip all waits for the guided lab to finish before the closing scene", () => {
  const bus = createLabBus();
  const session = createNarrativeSession(projectileArrivalStory, { bus });
  session.skipAll();
  assert.equal(session.view().complete, false);
  assert.equal(session.view().waitingForLab, true);
  assert.equal(session.view().waitFor, "lab-complete");
  assert.equal(session.view().sceneId, "simulation-focus");
  session.notify("launch");
  session.skipAll();
  assert.equal(session.view().complete, false);
  session.notify("lab-complete");
  session.skipAll();
  assert.equal(session.view().complete, true);
});

test("snapshot restore resumes a lab wait without duplicating history", () => {
  const bus = createLabBus();
  const session = createNarrativeSession(projectileArrivalStory, { bus });
  session.skipAll();
  const snap = session.snapshot();
  assert.equal(session.view().waitingForLab, true);
  const history = session.view().history.length;
  const loaded = createNarrativeSession(projectileArrivalStory, { bus });
  assert.ok(loaded.restore(snap));
  assert.equal(loaded.view().sceneId, "simulation-focus");
  assert.equal(loaded.view().waitFor, "lab-complete");
  assert.equal(loaded.view().waitingForLab, true);
  assert.equal(loaded.view().history.length, history);
  loaded.notify("lab-complete");
  loaded.skipAll();
  assert.equal(loaded.view().complete, true);
});

test("a prototype session without a lab bus still completes the chapter", () => {
  const frames = walkStory(projectileArrivalStory);
  assert.equal(frames.at(-1).complete, true);
  assert.ok(frames.some((frame) => frame.waitFor === "lab-complete" && !frame.waitingForLab));
});

test("advance stays on the lab wait until the guided run finishes", () => {
  const bus = createLabBus();
  const session = createNarrativeSession(projectileArrivalStory, { bus });
  session.skipAll();
  const blocked = session.view();
  session.advance();
  assert.equal(session.view().sceneId, blocked.sceneId);
  assert.equal(session.view().waitingForLab, true);
  assert.equal(session.view().complete, false);
});

test("choice history stays after reconverge and changes the closing line", () => {
  const lines = {};
  for (const id of ["report", "launcher", "ask-elias"]) {
    const session = createNarrativeSession(projectileArrivalStory);
    session.skipToCheckpoint();
    session.choose(id);
    session.skipAll();
    assert.ok(session.snapshot().log.some((entry) => entry.choiceId === id), id);
    const closing = session.view().history.find((entry) => entry.sceneId === "closing");
    assert.ok(closing, id);
    lines[id] = closing.text;
  }
  assert.notEqual(lines.report, lines.launcher);
  assert.notEqual(lines.launcher, lines["ask-elias"]);
  assert.match(lines.report, /missing launch speed/);
  assert.match(lines.launcher, /Angle, speed, and g/);
  assert.match(lines["ask-elias"], /archive was clean/);
});

test("choices write narrative variables and later lines can depend on them", () => {
  const session = createNarrativeSession(projectileArrivalStory);
  session.skipToCheckpoint();
  session.choose("launcher");
  assert.equal(session.view().variables.inspectedLauncher, true);
  assert.equal(session.view().variables.inspectedReport, false);
  session.skipAll();
  assert.equal(session.view().complete, true);
  assert.ok(session.view().history.some((entry) => /Angle, speed, and g/.test(entry.text) && entry.sceneId === "revelation"));
  assert.equal(session.view().history.some((entry) => /Launch speed was implied/.test(entry.text)), false);
});

test("lab events can comment during a wait without skipping the required lab", () => {
  const bus = createLabBus();
  const session = createNarrativeSession(projectileArrivalStory, { bus });
  session.skipAll();
  assert.equal(session.view().waitingForLab, true);
  session.notify("launch");
  assert.equal(session.view().pendingEvent, true);
  assert.equal(session.view().waitingForLab, true);
  assert.equal(session.view().variables.launches, 1);
  assert.equal(session.view().variables.sawLaunch, true);
  assert.match(session.view().text, /That shot is on the rails/);
  session.advance();
  assert.equal(session.view().pendingEvent, false);
  assert.equal(session.view().waitingForLab, true);
  session.notify("launch");
  assert.equal(session.view().pendingEvent, false);
  assert.equal(session.view().variables.launches, 2);
  session.notify("angle", { angleDeg: 30 });
  assert.equal(session.view().pendingEvent, true);
  assert.equal(session.view().variables.changedAngle, true);
  assert.equal(session.view().variables.lastAngle, 30);
  session.skipAll();
  assert.equal(session.view().complete, false);
  assert.equal(session.view().waitFor, "lab-complete");
});

test("saved variables restore with the rest of the chapter", () => {
  const bus = createLabBus();
  const session = createNarrativeSession(projectileArrivalStory, { bus });
  session.skipToCheckpoint();
  session.choose("report");
  session.skipAll();
  session.notify("launch");
  const snap = session.snapshot();
  const loaded = createNarrativeSession(projectileArrivalStory, { bus });
  assert.ok(loaded.restore(snap));
  assert.equal(loaded.view().variables.inspectedReport, true);
  assert.equal(loaded.view().variables.launches, 1);
  assert.equal(loaded.view().waitingForLab, true);
});

function bindLearning(session, bus) {
  bus.on(LAB_EVENTS.TUTORIAL_BRANCH_CHANGED, (detail) => session.notify("tutorial-branch", detail));
  bus.on(LAB_EVENTS.TUTORIAL_HINT_REQUESTED, (detail) => session.notify("tutorial-hint", detail));
}

function stepLab(lab, def) {
  const now = lab.view();
  if (now.needsAnswer) {
    lab.answer(def.stages[now.stageId].question.options.find((option) => option.correct).id);
    lab.advance();
    return;
  }
  if (now.needsAction) {
    lab.observe(now.requiredAction);
    return;
  }
  lab.advance();
}

test("a concept mistake during the guided lab comments live and reteaches later", () => {
  const bus = createLabBus();
  const session = createNarrativeSession(projectileArrivalStory, { bus });
  bindLearning(session, bus);
  session.skipAll();
  session.notify("tutorial-branch", {
    from: "hv-check",
    to: "hv-why",
    condition: "CONCEPT_MISUNDERSTANDING",
    guidanceLevel: "supported",
  });
  assert.equal(session.view().variables.missedComponents, true);
  assert.equal(session.view().variables.neededSupport, true);
  assert.equal(session.view().waitingForLab, true);
  assert.equal(session.view().pendingEvent, true);
  assert.match(session.view().text, /vx does not change/);
  session.advance();
  session.notify("lab-complete");
  session.skipAll();
  assert.equal(session.view().complete, true);
  assert.match(
    session.view().history.find((entry) => entry.sceneId === "investigation").text,
    /vx did not change in flight/,
  );
  assert.ok(session.view().history.some((entry) => /vx stayed constant/.test(entry.text)));
  assert.ok(session.view().history.some((entry) => /Looking twice is not a penalty/.test(entry.text)));
});

test("a clean guided run does not add reteach lines", () => {
  const bus = createLabBus();
  const session = createNarrativeSession(projectileArrivalStory, { bus });
  session.skipAll();
  session.notify("lab-complete");
  session.skipAll();
  assert.equal(session.view().variables.neededSupport, false);
  assert.equal(session.view().history.some((entry) => /vx stayed constant/.test(entry.text)), false);
  assert.equal(session.view().history.some((entry) => /Looking twice is not a penalty/.test(entry.text)), false);
  assert.match(
    session.view().history.find((entry) => entry.sceneId === "investigation").text,
    /You have a measured baseline/,
  );
});

test("learning flags survive a snapshot in the middle of the lab wait", () => {
  const bus = createLabBus();
  const session = createNarrativeSession(projectileArrivalStory, { bus });
  session.skipAll();
  session.notify("tutorial-hint", { stageId: "launch" });
  session.notify("tutorial-branch", {
    from: "concept-check",
    to: "angle-why",
    condition: "CONCEPT_MISUNDERSTANDING",
    guidanceLevel: "supported",
  });
  const loaded = createNarrativeSession(projectileArrivalStory, { bus });
  assert.ok(loaded.restore(session.snapshot()));
  assert.equal(loaded.view().variables.askedHint, true);
  assert.equal(loaded.view().variables.missedComplement, true);
  assert.equal(loaded.view().variables.neededSupport, true);
  loaded.notify("lab-complete");
  loaded.skipAll();
  assert.ok(loaded.view().history.some((entry) => /complementary angles/.test(entry.text)));
});

test("the learning path bus can change the chapter without importing LBM internals", () => {
  const bus = createLabBus();
  const story = createNarrativeSession(projectileArrivalStory, { bus });
  const lab = createLinearTutorial(projectileRangeTutorial, { bus });
  bindLearning(story, bus);
  story.skipAll();
  while (lab.view().stageId !== "hv-check") stepLab(lab, projectileRangeTutorial);
  lab.answer("vx");
  lab.advance();
  assert.equal(lab.view().stageId, "hv-why");
  assert.equal(story.view().variables.missedComponents, true);
  assert.equal(story.view().variables.neededSupport, true);
  assert.match(story.view().text, /vx does not change/);
  let guard = 0;
  while (!lab.view().complete && guard < 80) {
    stepLab(lab, projectileRangeTutorial);
    guard += 1;
  }
  assert.equal(lab.view().complete, true);
});
