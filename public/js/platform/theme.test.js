import assert from "node:assert/strict";
import test from "node:test";
import { THEMES, normalizeTheme, themeCanvas, themeVar } from "./theme.js";

test("appearance settings include arcade comic, arcade dark, beige, light, dark, and high contrast", () => {
  assert.deepEqual(
    THEMES.map((theme) => theme.id),
    ["arcade", "arcade-dark", "beige", "light", "dark", "contrast"],
  );
});

test("unknown appearance falls back to arcade", () => {
  assert.equal(normalizeTheme("arcade"), "arcade");
  assert.equal(normalizeTheme("arcade-dark"), "arcade-dark");
  assert.equal(normalizeTheme("beige"), "beige");
  assert.equal(normalizeTheme("dark"), "dark");
  assert.equal(normalizeTheme("contrast"), "contrast");
  assert.equal(normalizeTheme("neon"), "arcade");
  assert.equal(normalizeTheme(""), "arcade");
});

test("theme canvas colors fall back without a document", () => {
  assert.equal(themeVar("--field-bg", "#ffffff"), "#ffffff");
  assert.equal(themeCanvas().fill, "#ffffff");
  assert.equal(themeCanvas().ink, "#1b2430");
});
