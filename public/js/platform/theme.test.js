import assert from "node:assert/strict";
import test from "node:test";
import { THEMES, normalizeTheme, plotColor, themeCanvas, themeVar } from "./theme.js";

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
  assert.equal(themeCanvas().teal, "#12c4d4");
  assert.equal(themeCanvas().accent, "#ff6b12");
});

test("plot colors follow the equation-variable palette", () => {
  const pal = themeCanvas();
  assert.equal(plotColor("velocity"), pal.teal);
  assert.equal(plotColor("acceleration"), pal.accent);
  assert.equal(plotColor("distance"), pal.teal);
  assert.equal(plotColor("W_net"), pal.ok);
  assert.equal(plotColor("ΔK"), pal.check);
  assert.equal(plotColor("position"), pal.x);
  assert.equal(plotColor("xA", "x_A"), pal.accent);
  assert.equal(plotColor("xB", "x_B"), pal.teal);
  assert.equal(plotColor("Fnety"), pal.teal);
});
