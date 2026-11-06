/**
 * Learning Branch Manager — Stage 1 schema.
 *
 * Existing How to Use / Guided Lab overlays stay as they are. This schema is the
 * reusable graph those tutorials can later compile into. The linear engine loads
 * definitions; it does not scrape simulation internals.
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
    if (stage.branches) {
      for (const [condition, target] of Object.entries(stage.branches)) {
        if (!BRANCH_CONDITIONS.includes(condition)) errors.push(`${id}: unknown condition ${condition}`);
        if (target && !stages[target]) errors.push(`${id}: branch ${condition} -> missing ${target}`);
      }
    }
  }
  return errors;
}
