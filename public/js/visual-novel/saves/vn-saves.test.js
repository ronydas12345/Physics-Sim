import assert from "node:assert/strict";
import test from "node:test";
import { projectileArrivalStory } from "../stories/projectile-motion/arrival.js";
import { createNarrativeSession } from "../engine/narrative-engine.js";
import {
  LEARNING_SAVE_PREFIX,
  VN_SAVES_PREFIX,
  VN_SETTINGS_KEY,
  VN_SLOT_COUNT,
  exportSaveJson,
  loadSaveBag,
  parseImportedSave,
  validateNarrativeSave,
  vnSavesKey,
  writeAutosave,
  writeSlot,
} from "./vn-saves.js";
import { learningSaveKey, readLearningSave, writeLearningSave } from "../../learning/saves.js";

function memoryStorage(seed = {}) {
  const data = { ...seed };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
  };
}

test("story saves, settings, and learning progress use different keys", () => {
  assert.equal(vnSavesKey("projectile-arrival"), `${VN_SAVES_PREFIX}projectile-arrival`);
  assert.equal(learningSaveKey("1-5-range-intro"), `${LEARNING_SAVE_PREFIX}1-5-range-intro`);
  assert.notEqual(vnSavesKey("projectile-arrival"), VN_SETTINGS_KEY);
  assert.notEqual(vnSavesKey("projectile-arrival"), learningSaveKey("projectile-arrival"));
});

test("three manual slots and autosave restore a session without touching settings", () => {
  const storage = memoryStorage();
  const session = createNarrativeSession(projectileArrivalStory);
  session.skipToCheckpoint();
  const snap = session.snapshot();
  writeAutosave(snap.storyId, snap, storage, 1);
  writeSlot(snap.storyId, 0, snap, storage, 2);
  assert.equal(writeSlot(snap.storyId, 9, snap, storage), null);
  const bag = loadSaveBag(snap.storyId, storage);
  assert.equal(bag.slots.length, VN_SLOT_COUNT);
  assert.equal(bag.autosave.sceneId, "control-room");
  assert.equal(bag.slots[0].sceneId, "control-room");
  assert.equal(storage.getItem(VN_SETTINGS_KEY), null);

  const loaded = createNarrativeSession(projectileArrivalStory);
  assert.ok(loaded.restore(bag.slots[0]));
  assert.equal(loaded.view().sceneId, "control-room");
  assert.equal(loaded.view().awaitingChoice, true);
  assert.equal(loaded.restore({ storyId: "other", version: 1, sceneId: "control-room", lineIndex: 0 }), null);
});

test("export and import reject the wrong story and accept a valid file", () => {
  const session = createNarrativeSession(projectileArrivalStory);
  session.advance();
  const json = exportSaveJson(session.snapshot(), "slot-1");
  const ok = parseImportedSave(json, projectileArrivalStory);
  assert.equal(ok.ok, true);
  assert.equal(ok.snapshot.sceneId, session.view().sceneId);
  const bad = parseImportedSave(json, { ...projectileArrivalStory, id: "other-story", scenes: projectileArrivalStory.scenes, start: projectileArrivalStory.start });
  assert.equal(bad.ok, false);
  assert.equal(parseImportedSave("{", projectileArrivalStory).ok, false);
  assert.equal(validateNarrativeSave(projectileArrivalStory, { version: 1, storyId: projectileArrivalStory.id, sceneId: "missing", lineIndex: 0 }).ok, false);
});

test("resetting a chapter does not clear manual slots", () => {
  const storage = memoryStorage();
  const session = createNarrativeSession(projectileArrivalStory);
  session.skipAll();
  writeSlot(session.view().storyId, 1, session.snapshot(), storage);
  session.reset();
  assert.equal(session.view().sceneId, "facility-exterior");
  assert.equal(session.view().complete, false);
  const saved = loadSaveBag(session.view().storyId, storage).slots[1];
  assert.equal(saved.complete, true);
  assert.equal(saved.sceneId, "closing");
});

test("learning progress writes a separate store", () => {
  const storage = memoryStorage();
  writeLearningSave({ tutorialId: "1-5-range-intro", currentStage: "launch", version: 1 }, storage);
  assert.equal(readLearningSave("1-5-range-intro", storage).currentStage, "launch");
  assert.equal(storage.getItem(vnSavesKey("1-5-range-intro")), null);
});
