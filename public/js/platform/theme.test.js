import assert from "node:assert/strict";
import test from "node:test";
import { THEMES, normalizeTheme } from "./theme.js";

test("appearance settings include beige, light, dark, and high contrast", () => {
  assert.deepEqual(
    THEMES.map((theme) => theme.id),
    ["beige", "light", "dark", "contrast"],
  );
});

test("unknown appearance falls back to beige", () => {
  assert.equal(normalizeTheme("dark"), "dark");
  assert.equal(normalizeTheme("contrast"), "contrast");
  assert.equal(normalizeTheme("neon"), "beige");
  assert.equal(normalizeTheme(""), "beige");
});
