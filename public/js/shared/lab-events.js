/**
 * Named events the visual novel and Learning Branch Manager may share.
 * Neither system should call into the other's internals; they only emit/listen here.
 * Physics stays in each simulation. This bus never writes lab state.
 */
export const LAB_EVENTS = Object.freeze({
  LAB_STARTED: "lab:started",
  LAB_STEP_COMPLETED: "lab:step-completed",
  LAB_CHECKPOINT_REACHED: "lab:checkpoint-reached",
  LAB_COMPLETED: "lab:completed",
  TUTORIAL_BRANCH_CHANGED: "tutorial:branch-changed",
  TUTORIAL_HINT_REQUESTED: "tutorial:hint-requested",
  STORY_SCENE_UNLOCKED: "story:scene-unlocked",
  STORY_CHAPTER_COMPLETED: "story:chapter-completed",
});

export function createLabBus() {
  const target = new EventTarget();
  return {
    on(type, listener) {
      const wrapped = (event) => listener(event.detail, event);
      target.addEventListener(type, wrapped);
      return () => target.removeEventListener(type, wrapped);
    },
    emit(type, detail = {}) {
      target.dispatchEvent(new CustomEvent(type, { detail }));
    },
  };
}
