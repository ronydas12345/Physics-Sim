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
  PROJECTILE_LAUNCHED: "sim:launched",
  PROJECTILE_LANDED: "sim:landed",
  TRIAL_RECORDED: "sim:trial-recorded",
  LAUNCH_ANGLE_CHANGED: "sim:angle-changed",
  LAUNCH_SPEED_CHANGED: "sim:speed-changed",
  GRAVITY_CHANGED: "sim:gravity-changed",
  EXPERIMENT_RESET: "sim:reset",
});

const EVENT_ACTIONS = Object.freeze({
  [LAB_EVENTS.PROJECTILE_LAUNCHED]: "launch",
  [LAB_EVENTS.PROJECTILE_LANDED]: "land",
  [LAB_EVENTS.TRIAL_RECORDED]: "record-trial",
  [LAB_EVENTS.LAUNCH_ANGLE_CHANGED]: "angle",
  [LAB_EVENTS.LAUNCH_SPEED_CHANGED]: "speed",
  [LAB_EVENTS.GRAVITY_CHANGED]: "gravity",
  [LAB_EVENTS.EXPERIMENT_RESET]: "reset",
});

export function actionFromEvent(type) {
  return EVENT_ACTIONS[type] || null;
}

export function labActionKey(value) {
  if (!value) return "";
  return EVENT_ACTIONS[value] || String(value);
}

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
