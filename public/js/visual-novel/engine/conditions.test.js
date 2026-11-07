import assert from "node:assert/strict";
import test from "node:test";
import { applyLearningPatch, applyPatch, conditionOk, emptyVars, learningComment } from "./conditions.js";

test("variable conditions compare equality and numeric bounds", () => {
  const vars = { inspectedReport: true, launches: 2, interpretation: "range" };
  assert.equal(conditionOk(null, vars), true);
  assert.equal(conditionOk({ inspectedReport: true }, vars), true);
  assert.equal(conditionOk({ inspectedReport: false }, vars), false);
  assert.equal(conditionOk({ launches: { gte: 2 } }, vars), true);
  assert.equal(conditionOk({ launches: { gt: 2 } }, vars), false);
  assert.equal(conditionOk({ interpretation: { neq: "missing" } }, vars), true);
});

test("patches set and increment narrative variables", () => {
  const start = emptyVars({ variables: { launches: 0, inspectedReport: false } });
  const next = applyPatch(start, { set: { inspectedReport: true }, add: { launches: 1 } });
  assert.equal(next.inspectedReport, true);
  assert.equal(next.launches, 1);
  assert.equal(start.launches, 0);
});

test("learning patches map guided-lab mistakes onto story variables", () => {
  const story = {
    variables: { missedComponents: false, neededSupport: false, askedHint: false, labErrors: 0, labHints: 0 },
    learning: {
      hint: { set: { askedHint: true }, add: { labHints: 1 } },
      stages: {
        "hv-check": {
          CONCEPT_MISUNDERSTANDING: { set: { missedComponents: true }, add: { labErrors: 1 } },
        },
      },
    },
  };
  const vars = emptyVars(story);
  const missed = applyLearningPatch(vars, story, {
    from: "hv-check",
    condition: "CONCEPT_MISUNDERSTANDING",
    guidanceLevel: "supported",
  });
  assert.equal(missed.missedComponents, true);
  assert.equal(missed.neededSupport, true);
  assert.equal(missed.labErrors, 1);
  const hinted = applyLearningPatch(vars, story, { source: "hint", stageId: "launch" });
  assert.equal(hinted.askedHint, true);
  assert.equal(hinted.labHints, 1);
  assert.equal(hinted.neededSupport, false);
  const firstTry = applyLearningPatch(vars, story, {
    from: "hv-check",
    condition: "CORRECT_FIRST_ATTEMPT",
    guidanceLevel: "standard",
  });
  assert.equal(firstTry.missedComponents, false);
  assert.equal(learningComment({ on: { learning: { hint: { text: "hint" }, "hv-check": { text: "vx" } } } }, "tutorial-hint").text, "hint");
  assert.equal(
    learningComment({ on: { learning: { "hv-check": { text: "vx" } } } }, "tutorial-branch", { from: "hv-check" }).text,
    "vx",
  );
});
