/**
 * Learning Branch Manager — Stage 1 schema.
 *
 * Existing How to Use / Guided Lab overlays stay as they are. This schema is the
 * reusable graph those tutorials can later compile into. The engine loads
 * definitions and selects branches from evidence; it does not scrape simulation internals.
 *
 * Stage copy: instruction (or body) plus optional explanation.
 * Highlight targets reuse the shared aliases in highlight-target.js and .tutorial-spot.
 */

export const STAGE_TYPES = Object.freeze([
  "introduction",
  "concept",
  "interface",
  "guided-action",
  "observation",
  "conceptual-question",
  "application",
  "reflection",
  "checkpoint",
  "summary",
]);

export const BRANCH_CONDITIONS = Object.freeze([
  "CORRECT_FIRST_ATTEMPT",
  "REPEATED_ERROR",
  "CONCEPT_MISUNDERSTANDING",
  "HINT_REQUESTED",
  "INDEPENDENT_SUCCESS",
  "INCOMPLETE_ACTION",
  "CONCEPT_MASTERY",
  "PERSISTENT_DIFFICULTY",
]);

export const GUIDANCE_LEVELS = Object.freeze(["standard", "supported", "extension"]);

export function emptyLearningState(tutorialId) {
  return {
    tutorialId,
    version: 1,
    currentStage: null,
    completedStages: [],
    completedObjectives: [],
    guidanceLevel: "standard",
    attempts: {},
    errors: {},
    hintsUsed: {},
    flags: {},
    lastSessionAt: null,
  };
}

export function validateTutorialDefinition(def) {
  const errors = [];
  if (!def?.id) errors.push("missing id");
  if (!def?.simulationId) errors.push("missing simulationId");
  if (!def?.title) errors.push("missing title");
  if (!Array.isArray(def.objectives) || !def.objectives.length) errors.push("missing objectives");
  if (!def.start) errors.push("missing start");
  const stages = def.stages || {};
  if (!stages[def.start]) errors.push(`start stage "${def.start}" is not defined`);
  for (const [id, stage] of Object.entries(stages)) {
    if (!STAGE_TYPES.includes(stage.type)) errors.push(`${id}: unknown type ${stage.type}`);
    if (!stage.title) errors.push(`${id}: missing title`);
    if (stage.next && !stages[stage.next]) errors.push(`${id}: next "${stage.next}" is missing`);
    if (stage.guidance && !GUIDANCE_LEVELS.includes(stage.guidance)) {
      errors.push(`${id}: unknown guidance ${stage.guidance}`);
    }
    if (stage.type === "conceptual-question") {
      if (!stage.question?.prompt) errors.push(`${id}: missing question prompt`);
      if (!Array.isArray(stage.question?.options) || stage.question.options.length < 2) {
        errors.push(`${id}: question needs options`);
      } else if (!stage.question.options.some((option) => option.correct)) {
        errors.push(`${id}: question needs a correct option`);
      }
    }
    if (stage.branches) {
      for (const [condition, target] of Object.entries(stage.branches)) {
        if (!BRANCH_CONDITIONS.includes(condition)) errors.push(`${id}: unknown condition ${condition}`);
        if (target && !stages[target]) errors.push(`${id}: branch ${condition} -> missing ${target}`);
      }
    }
  }
  if (def.adapter) {
    if (def.adapter.simulationId && def.adapter.simulationId !== def.simulationId) {
      errors.push("adapter simulationId mismatch");
    }
    if (def.adapter.events && !Array.isArray(def.adapter.events)) errors.push("adapter events must be an array");
    if (def.adapter.controls && !Array.isArray(def.adapter.controls)) errors.push("adapter controls must be an array");
  }
  return errors;
}
