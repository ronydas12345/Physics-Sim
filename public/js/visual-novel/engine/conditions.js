/**
 * Narrative variable tests and patches. Story data owns the keys; the engine only evaluates them.
 */

export function emptyVars(story) {
  return { ...(story?.variables || {}) };
}

export function conditionOk(when, vars = {}) {
  if (!when || typeof when !== "object") return true;
  return Object.entries(when).every(([key, expect]) => matches(vars[key], expect));
}

function matches(actual, expect) {
  if (expect && typeof expect === "object" && !Array.isArray(expect)) {
    if (Object.prototype.hasOwnProperty.call(expect, "eq")) return actual === expect.eq;
    if (Object.prototype.hasOwnProperty.call(expect, "neq")) return actual !== expect.neq;
    if (Object.prototype.hasOwnProperty.call(expect, "gte")) return Number(actual) >= Number(expect.gte);
    if (Object.prototype.hasOwnProperty.call(expect, "lte")) return Number(actual) <= Number(expect.lte);
    if (Object.prototype.hasOwnProperty.call(expect, "gt")) return Number(actual) > Number(expect.gt);
    if (Object.prototype.hasOwnProperty.call(expect, "lt")) return Number(actual) < Number(expect.lt);
    if (expect.truthy) return Boolean(actual);
    if (expect.falsy) return !actual;
  }
  return actual === expect;
}

export function applyPatch(vars = {}, patch = {}) {
  const next = { ...vars };
  if (patch.set && typeof patch.set === "object") {
    Object.assign(next, patch.set);
  }
  if (patch.add && typeof patch.add === "object") {
    for (const [key, amount] of Object.entries(patch.add)) {
      next[key] = Number(next[key] || 0) + Number(amount);
    }
  }
  return next;
}
