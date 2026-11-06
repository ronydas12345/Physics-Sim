/**
 * Pick a branch condition from the current stage and learning evidence.
 * The destination is looked up on stage.branches; NEXT means stage.next.
 */

export const NEXT = "NEXT";

export function resolveBranch(stage, ctx = {}) {
  const branches = stage?.branches || {};
  const has = (condition) => Boolean(branches[condition]);

  if (ctx.pending && has(ctx.pending) && !ctx.answered) return ctx.pending;

  if (stage?.type === "conceptual-question") {
    if (!ctx.answered) return null;
    if (ctx.correct) {
      if (ctx.attempts === 1 && !ctx.hinted && has("CORRECT_FIRST_ATTEMPT")) return "CORRECT_FIRST_ATTEMPT";
      if (!ctx.hinted && has("INDEPENDENT_SUCCESS")) return "INDEPENDENT_SUCCESS";
      if (has("CONCEPT_MASTERY")) return "CONCEPT_MASTERY";
      return NEXT;
    }
    if (ctx.errors >= 3 && has("PERSISTENT_DIFFICULTY")) return "PERSISTENT_DIFFICULTY";
    if (ctx.errors >= 2 && has("REPEATED_ERROR")) return "REPEATED_ERROR";
    if (ctx.misconception && has("CONCEPT_MISUNDERSTANDING")) return "CONCEPT_MISUNDERSTANDING";
    if (has("CONCEPT_MISUNDERSTANDING")) return "CONCEPT_MISUNDERSTANDING";
    return NEXT;
  }

  if (ctx.hinted && has("HINT_REQUESTED")) return "HINT_REQUESTED";
  if (ctx.incomplete && has("INCOMPLETE_ACTION")) return "INCOMPLETE_ACTION";
  return NEXT;
}

export function destinationFor(stage, condition) {
  if (condition && condition !== NEXT && stage?.branches?.[condition]) return stage.branches[condition];
  return stage?.next || null;
}

export function guidanceLabel(level) {
  if (level === "supported") return "Supported path";
  if (level === "extension") return "Extension path";
  return "Standard path";
}
