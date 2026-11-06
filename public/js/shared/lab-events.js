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
  STORY_AWAITS_LAB: "story:awaits-lab",
  STORY_RESUMES: "story:resumes",
  PROJECTILE_LAUNCHED: "sim:launched",
  PROJECTILE_LANDED: "sim:landed",
  TRIAL_RECORDED: "sim:trial-recorded",
  LAUNCH_ANGLE_CHANGED: "sim:angle-changed",
  LAUNCH_SPEED_CHANGED: "sim:speed-changed",
  GRAVITY_CHANGED: "sim:gravity-changed",
  EXPERIMENT_RESET: "sim:reset",
  PLAYBACK_STARTED: "sim:play",
  PLAYBACK_PAUSED: "sim:pause",
  PLAYBACK_STEPPED: "sim:step",
  VARIABLE_CHANGED: "sim:variable-changed",
  NUDGED: "sim:nudged",
});

export const SIM_EVENT_ACTIONS = Object.freeze({
  [LAB_EVENTS.PROJECTILE_LAUNCHED]: "launch",
  [LAB_EVENTS.PROJECTILE_LANDED]: "land",
  [LAB_EVENTS.TRIAL_RECORDED]: "record-trial",
  [LAB_EVENTS.LAUNCH_ANGLE_CHANGED]: "angle",
  [LAB_EVENTS.LAUNCH_SPEED_CHANGED]: "speed",
  [LAB_EVENTS.GRAVITY_CHANGED]: "gravity",
  [LAB_EVENTS.EXPERIMENT_RESET]: "reset",
  [LAB_EVENTS.PLAYBACK_STARTED]: "play",
  [LAB_EVENTS.PLAYBACK_PAUSED]: "pause",
  [LAB_EVENTS.PLAYBACK_STEPPED]: "step",
  [LAB_EVENTS.VARIABLE_CHANGED]: "variable",
  [LAB_EVENTS.NUDGED]: "nudge",
});

const CLICK_EVENTS = Object.freeze({
  "btn-play": LAB_EVENTS.PLAYBACK_STARTED,
  "btn-pause": LAB_EVENTS.PLAYBACK_PAUSED,
  "btn-step": LAB_EVENTS.PLAYBACK_STEPPED,
  "btn-reset": LAB_EVENTS.EXPERIMENT_RESET,
  "btn-reset-run": LAB_EVENTS.EXPERIMENT_RESET,
  "btn-launch": LAB_EVENTS.PROJECTILE_LAUNCHED,
  "btn-record": LAB_EVENTS.TRIAL_RECORDED,
  "nudge-pos": LAB_EVENTS.NUDGED,
  "nudge-neg": LAB_EVENTS.NUDGED,
});

export function actionFromEvent(type) {
  return SIM_EVENT_ACTIONS[type] || null;
}

export function labActionKey(value) {
  if (!value) return "";
  return SIM_EVENT_ACTIONS[value] || String(value);
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

/**
 * DOM adapter: report playback and control activity without reading physics internals.
 */
export function bindSimEvents(root, bus) {
  if (!root?.addEventListener || !bus) return () => {};

  function onClick(event) {
    const button = event.target.closest?.("button[id]");
    const type = button ? CLICK_EVENTS[button.id] : null;
    if (type) bus.emit(type, { controlId: button.id });
  }

  function onChange(event) {
    const field = event.target.closest?.("input, select, textarea");
    if (!field?.id) return;
    bus.emit(LAB_EVENTS.VARIABLE_CHANGED, { controlId: field.id });
    if (field.id === "angle" || field.id === "angle-input") {
      bus.emit(LAB_EVENTS.LAUNCH_ANGLE_CHANGED, { controlId: field.id });
    }
  }

  root.addEventListener("click", onClick);
  root.addEventListener("input", onChange);
  root.addEventListener("change", onChange);
  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("input", onChange);
    root.removeEventListener("change", onChange);
  };
}
