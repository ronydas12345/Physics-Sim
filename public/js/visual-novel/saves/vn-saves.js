/**
 * Narrative save slots and autosave. Settings and learning progress use other keys.
 */

export const VN_SAVE_VERSION = 1;
export const VN_SAVE_KIND = "ap1-vn-save";
export const VN_SLOT_COUNT = 3;
export const VN_SETTINGS_KEY = "ap1-vn-settings";
export const VN_SAVES_PREFIX = "ap1-vn-saves:";
export const LEARNING_SAVE_PREFIX = "ap1-learning:";

export function vnSavesKey(storyId) {
  return `${VN_SAVES_PREFIX}${storyId}`;
}

export function emptySaveBag() {
  return { version: VN_SAVE_VERSION, autosave: null, slots: Array.from({ length: VN_SLOT_COUNT }, () => null) };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function validateNarrativeSave(story, raw) {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Save is empty." };
  if (Number(raw.version) !== VN_SAVE_VERSION) return { ok: false, error: "Save version is not supported." };
  if (raw.storyId !== story.id) return { ok: false, error: "Save belongs to a different story." };
  const scene = story.scenes?.[raw.sceneId];
  if (!scene) return { ok: false, error: "Save points at a missing scene." };
  const lineCount = scene.lines?.length || 0;
  const lineIndex = Number(raw.lineIndex);
  if (!Number.isInteger(lineIndex) || lineIndex < 0 || (lineCount && lineIndex >= lineCount)) {
    return { ok: false, error: "Save dialogue index is invalid." };
  }
  if (raw.log && !Array.isArray(raw.log)) return { ok: false, error: "Save history is invalid." };
  return { ok: true, snapshot: clone(raw) };
}

export function stampSave(snapshot, now = Date.now()) {
  return { ...clone(snapshot), version: VN_SAVE_VERSION, savedAt: now };
}

function readBag(storyId, storage) {
  try {
    const raw = storage?.getItem?.(vnSavesKey(storyId));
    if (!raw) return emptySaveBag();
    const parsed = JSON.parse(raw);
    const bag = emptySaveBag();
    if (parsed?.autosave) bag.autosave = parsed.autosave;
    if (Array.isArray(parsed?.slots)) {
      for (let i = 0; i < VN_SLOT_COUNT; i += 1) bag.slots[i] = parsed.slots[i] || null;
    }
    return bag;
  } catch {
    return emptySaveBag();
  }
}

function writeBag(storyId, bag, storage) {
  try {
    storage?.setItem?.(vnSavesKey(storyId), JSON.stringify(bag));
    return true;
  } catch {
    return false;
  }
}

export function loadSaveBag(storyId, storage = globalThis.localStorage) {
  return readBag(storyId, storage);
}

export function writeAutosave(storyId, snapshot, storage = globalThis.localStorage, now = Date.now()) {
  const bag = readBag(storyId, storage);
  bag.autosave = stampSave(snapshot, now);
  writeBag(storyId, bag, storage);
  return bag.autosave;
}

export function writeSlot(storyId, index, snapshot, storage = globalThis.localStorage, now = Date.now()) {
  if (index < 0 || index >= VN_SLOT_COUNT) return null;
  const bag = readBag(storyId, storage);
  bag.slots[index] = stampSave(snapshot, now);
  writeBag(storyId, bag, storage);
  return bag.slots[index];
}

export function exportSaveJson(snapshot, label = "manual") {
  return JSON.stringify(
    {
      kind: VN_SAVE_KIND,
      version: VN_SAVE_VERSION,
      label,
      payload: stampSave(snapshot),
    },
    null,
    2,
  );
}

export function parseImportedSave(text, story) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "File is not valid JSON." };
  }
  const raw = parsed?.kind === VN_SAVE_KIND ? parsed.payload : parsed;
  return validateNarrativeSave(story, raw);
}

export function slotLabel(entry, fallback = "Empty") {
  if (!entry) return fallback;
  const when = entry.savedAt ? new Date(entry.savedAt).toLocaleString() : "saved";
  const scene = entry.sceneId || "scene";
  const done = entry.complete ? " · complete" : "";
  return `${scene}${done} · ${when}`;
}
