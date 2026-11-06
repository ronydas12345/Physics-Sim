import assert from "node:assert/strict";
import test from "node:test";
import { NEXT, destinationFor, resolveBranch } from "./branch-resolver.js";

const check = {
  type: "conceptual-question",
  next: "summary",
  branches: {
    CORRECT_FIRST_ATTEMPT: "extension",
    INDEPENDENT_SUCCESS: "extension",
    CONCEPT_MASTERY: "summary",
    CONCEPT_MISUNDERSTANDING: "angle-why",
    REPEATED_ERROR: "angle-why",
  },
};

test("unanswered concept checks do not choose a branch", () => {
  assert.equal(resolveBranch(check, { answered: false }), null);
});

test("first-try unhinted success takes the extension branch", () => {
  assert.equal(
    resolveBranch(check, { answered: true, correct: true, attempts: 1, hinted: false }),
    "CORRECT_FIRST_ATTEMPT",
  );
  assert.equal(destinationFor(check, "CORRECT_FIRST_ATTEMPT"), "extension");
});

test("success after a hint returns to standard instead of extension", () => {
  assert.equal(
    resolveBranch(check, {
      answered: true,
      correct: true,
      attempts: 1,
      hinted: true,
      pending: "HINT_REQUESTED",
    }),
    "CONCEPT_MASTERY",
  );
  assert.equal(destinationFor(check, "CONCEPT_MASTERY"), "summary");
});

test("wrong answers and repeats take the supported explanation", () => {
  assert.equal(
    resolveBranch(check, { answered: true, correct: false, errors: 1, misconception: true }),
    "CONCEPT_MISUNDERSTANDING",
  );
  assert.equal(
    resolveBranch(check, { answered: true, correct: false, errors: 2, misconception: true }),
    "REPEATED_ERROR",
  );
});

test("hinted launch follows HINT_REQUESTED, otherwise next", () => {
  const launch = {
    type: "guided-action",
    next: "observe",
    branches: { HINT_REQUESTED: "launch-support", INCOMPLETE_ACTION: "launch" },
  };
  assert.equal(resolveBranch(launch, { hinted: true }), "HINT_REQUESTED");
  assert.equal(destinationFor(launch, "HINT_REQUESTED"), "launch-support");
  assert.equal(resolveBranch(launch, {}), NEXT);
  assert.equal(destinationFor(launch, NEXT), "observe");
});
