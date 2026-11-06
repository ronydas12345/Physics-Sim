/**
 * Learning progress only. Story slots live under ap1-vn-saves: and must not share this key.
 */

export const LEARNING_SAVE_PREFIX = "ap1-learning:";
export const LEARNING_SAVE_VERSION = 1;

export function learningSaveKey(tutorialId) {
  return `${LEARNING_SAVE_PREFIX}${tutorialId}`;
}

export function readLearningSave(tutorialId, storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(learningSaveKey(tutorialId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.tutorialId !== tutorialId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLearningSave(snapshot, storage = globalThis.localStorage) {
  if (!snapshot?.tutorialId) return false;
  try {
    storage?.setItem?.(
      learningSaveKey(snapshot.tutorialId),
      JSON.stringify({ ...snapshot, version: snapshot.version || LEARNING_SAVE_VERSION }),
    );
    return true;
  } catch {
    return false;
  }
}
