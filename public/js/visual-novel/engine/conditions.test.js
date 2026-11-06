import assert from "node:assert/strict";
import test from "node:test";
import { applyPatch, conditionOk, emptyVars } from "./conditions.js";

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
