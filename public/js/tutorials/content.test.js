import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { getTutorials, listedSimulationIds } from "./registry.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PAGES = readFileSync(join(ROOT, "public", "js", "platform", "pages.js"), "utf8");
const LAB_KIT = readFileSync(join(ROOT, "public", "js", "platform", "lab-kit.js"), "utf8");
const APP = readFileSync(join(ROOT, "public", "js", "platform", "app.js"), "utf8");

const IDS = ["1-1", "1-2", "1-3", "1-4", "2-1", "2-2", "2-3", "2-4", "2-5", "2-6", "2-7", "2-8"];
const PAGE_FNS = {
  "1-1": "sim11Page",
  "1-2": "sim12Page",
  "1-3": "sim13Page",
  "1-4": "sim14Page",
  "2-1": "sim21Page",
  "2-2": "sim22Page",
  "2-3": "sim23Page",
  "2-4": "sim24Page",
  "2-5": "sim25Page",
  "2-6": "sim26Page",
  "2-7": "sim27Page",
  "2-8": "sim28Page",
};
const TARGET_ALIASES = {
  scene: "axis-canvas",
  playback: "transport",
  controls: "track-controls",
  values: "values-panel",
  graphs: "graphs",
  play: "btn-play",
  pause: "btn-pause",
  reset: "btn-reset",
  camera: "camera-controls",
  xt: "graph-xt",
  vt: "graph-vt",
  at: "graph-at",
  fbd: "fbd-canvas",
  fbda: "fbd-a",
  fbdb: "fbd-b",
  diagram: "diagram-canvas",
  "force-controls": "force-controls",
  "net-force-panel": "net-force-panel",
  "motion-state-panel": "motion-state-panel",
  "inertia-panel": "inertia-panel",
  "scenario-selector": "scenario-selector",
  "acceleration-panel": "acceleration-panel",
  "velocity-panel": "velocity-panel",
  "mass-control": "mass-control",
  "relationship-investigation": "relationship-investigation",
  "data-table": "data-table",
  "graph-panel": "graph-panel",
  "mass-controls": "mass-controls",
  "distance-control": "distance-control",
  "force-display": "force-display",
  "gravity-force-vectors": "gravity-force-vectors",
  "force-pair-panel": "force-pair-panel",
  "earth-mode": "earth-mode",
  "field-mode": "field-mode",
  "motion-mode": "motion-mode",
  "equation-display": "equation-display",
  "distance-marker": "distance-marker",
  "height-control": "height-control",
  "friction-animation": "simulation-canvas",
  "applied-force-control": "applied-force-control",
  "static-coefficient-control": "static-coefficient-control",
  "kinetic-coefficient-control": "kinetic-coefficient-control",
  "surface-preset-control": "surface-preset-control",
  "force-vector-toggle": "force-vector-toggle",
  "force-readout": "force-readout",
  "net-force-readout": "net-force-panel",
  "acceleration-readout": "acceleration-panel",
  "playback-controls": "playback-controls",
  "spring-animation": "simulation-canvas",
  "equilibrium-marker": "equilibrium-marker",
  "displacement-control": "displacement-control",
  "spring-constant-control": "spring-constant-control",
  "motion-mode-control": "motion-mode-control",
  "spring-force-readout": "force-readout",
  "data-record-control": "data-table",
  "simulation-reset-control": "playback-controls",
};
const BLOCK_TYPES = new Set([
  "heading",
  "text",
  "action",
  "explanation",
  "hint",
  "prediction",
  "observation",
  "choice",
  "formula",
  "derivation",
  "compare",
]);

function pageSource(fnName) {
  const start = PAGES.indexOf(`export function ${fnName}`);
  assert.ok(start >= 0, `missing ${fnName}`);
  const next = PAGES.indexOf("export function", start + 1);
  return PAGES.slice(start, next === -1 ? undefined : next) + LAB_KIT;
}

function highlightExists(html, highlight) {
  if (!highlight) return true;
  if (/^\[/.test(highlight)) {
    return html.includes(highlight.slice(1, -1).replaceAll('\\"', '"'));
  }
  const id = TARGET_ALIASES[highlight] || highlight;
  return html.includes(`id="${id}"`) || html.includes(id);
}

test("registry lists every shipped lab", () => {
  assert.deepEqual(listedSimulationIds(), IDS);
});

test("Help / About is routed and includes an FAQ", () => {
  assert.match(APP, /route\.name === "about"/);
  assert.match(PAGES, /export function aboutPage/);
  assert.match(PAGES, /class="faq-item"/);
  assert.match(PAGES, /<summary>/);
});

for (const id of IDS) {
  test(`tutorials for ${id} have How to Use and Guided Lab`, () => {
    const pack = getTutorials(id);
    assert.ok(pack);
    const html = pageSource(PAGE_FNS[id]);
    for (const key of ["howToUseLab", "guidedLab"]) {
      const tutorial = pack[key];
      assert.equal(tutorial.title.length > 0, true, `${id} ${key} title`);
      assert.ok(tutorial.sections.length >= 3, `${id} ${key} sections`);
      const ids = tutorial.sections.map((section) => section.id);
      assert.equal(new Set(ids).size, ids.length, `${id} ${key} unique section ids`);
      for (const section of tutorial.sections) {
        assert.ok(section.title);
        assert.ok(Array.isArray(section.content));
        assert.ok(section.content.length > 0, `${id} ${section.id} has content`);
        assert.ok(
          highlightExists(html, section.highlight),
          `${id} ${key} ${section.id} missing highlight ${section.highlight}`,
        );
        for (const block of section.content) {
          assert.ok(BLOCK_TYPES.has(block.type), `${id} unknown block ${block.type}`);
        }
      }
    }
    assert.ok(Array.isArray(pack.guidedLab.jumps));
    for (const jump of pack.guidedLab.jumps) {
      assert.ok(
        pack.guidedLab.sections.some((section) => section.id === jump.sectionId),
        `${id} jump ${jump.sectionId} missing`,
      );
    }
    const predIds = [];
    for (const section of pack.guidedLab.sections) {
      for (const block of section.content) {
        if (block.id && (block.type === "prediction" || block.type === "observation" || block.type === "choice" || block.type === "derivation")) {
          predIds.push(block.id);
        }
      }
    }
    assert.equal(new Set(predIds).size, predIds.length, `${id} duplicate prompt ids: ${predIds}`);
  });
}
