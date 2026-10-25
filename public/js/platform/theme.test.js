import assert from "node:assert/strict";
import test from "node:test";
import { THEMES, normalizeTheme, themeCanvas, themeVar } from "./theme.js";

test("appearance settings include beige, light, dark, and high contrast", () => {
  assert.deepEqual(
    THEMES.map((theme) => theme.id),
    ["beige", "light", "dark", "contrast"],
  );
});

test("unknown appearance falls back to dark", () => {
  assert.equal(normalizeTheme("beige"), "beige");
  assert.equal(normalizeTheme("dark"), "dark");
  assert.equal(normalizeTheme("contrast"), "contrast");
  assert.equal(normalizeTheme("neon"), "dark");
  assert.equal(normalizeTheme(""), "dark");
});

test("theme canvas colors fall back without a document", () => {
  assert.equal(themeVar("--field-bg", "#ffffff"), "#ffffff");
  assert.equal(themeCanvas().fill, "#ffffff");
  assert.equal(themeCanvas().ink, "#1b2430");
});
