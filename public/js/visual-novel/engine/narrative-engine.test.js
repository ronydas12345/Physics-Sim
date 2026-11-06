import assert from "node:assert/strict";
import test from "node:test";
import { createNarrativeSession, walkStory } from "./narrative-engine.js";
import { nextCheckpointId } from "./skip.js";
import { projectileArrivalStory } from "../stories/projectile-motion/arrival.js";
import { BACKGROUNDS } from "../renderer/backgrounds.js";
import { SPRITE_EXPRESSIONS, spriteSvg } from "../renderer/sprites.js";

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
    "closing",
  ]);
  const bgs = new Set(frames.map((frame) => frame.background));
  for (const id of BACKGROUNDS) assert.equal(bgs.has(id), true, id);
  assert.ok(frames.some((frame) => frame.speaker === "Mara"));
  assert.ok(frames.some((frame) => frame.speaker === "Elias"));
});

test("investigation choices reconverge on the testing area", () => {
  for (const id of ["report", "launcher", "ask-elias"]) {
    const frames = walkStory(projectileArrivalStory, () => id);
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
