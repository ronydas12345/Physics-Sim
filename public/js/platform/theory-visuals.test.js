import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  ANIMATION_IDS,
  eqLines,
  eqVar,
  S,
  THEORY_GRAPHS,
  theoryPage,
  theoryVisual,
} from "./theory-visuals.js";

test("visual theory kit exposes looping concept animations", () => {
  assert.ok(ANIMATION_IDS.includes("distance-displacement"));
  assert.ok(ANIMATION_IDS.includes("work-cos-theta"));
  assert.ok(ANIMATION_IDS.includes("area-under-fx"));
  assert.ok(ANIMATION_IDS.length >= 20);
});

test("theoryPage emits canvases future labs can reuse", () => {
  const html = theoryPage({
    title: "Example identity",
    lead: "Watch the variable change.",
    cards: [
      {
        title: "Net force",
        anim: "f-ma",
        caption: "a grows with F and shrinks with m.",
        eq: eqLines(`${S.a()} = ${S.f()} / ${S.m()}`),
        vars: [eqVar("a", "a", "acceleration", "m/s²"), eqVar("f", "F", "net force", "N"), eqVar("m", "m", "mass", "kg")],
      },
    ],
    graphs: [{ id: "a-vs-fnet", title: "a vs. F_net", caption: "Slope is 1/m." }],
  });
  assert.match(html, /data-theory-anim="f-ma"/);
  assert.match(html, /Watch the idea, then return to the lab/);
  assert.match(html, /eq-display/);
  assert.match(html, /eq-sym-a/);
  assert.match(html, /eq-vars/);
  assert.match(html, /data-theory-graph="a-vs-fnet"/);
  assert.equal(theoryVisual("hooke", "Fs = −kx").includes('data-theory-anim="hooke"'), true);
});

test("identity graph catalog covers kinematics, forces, and energy", () => {
  for (const id of ["d-vs-dx", "v-vs-t", "a-vs-fnet", "w-vs-theta", "dk-vs-w", "range-vs-theta"]) {
    assert.equal(typeof THEORY_GRAPHS[id]?.yOfX, "function");
  }
  assert.equal(THEORY_GRAPHS["d-vs-dx"].yOfX(-4), 4);
  assert.equal(THEORY_GRAPHS["dk-vs-w"].yOfX(12), 12);
});

test("every shipped lab theory tab uses a microanimation", () => {
  const pages = fs.readFileSync(new URL("./pages.js", import.meta.url), "utf8");
  const projectile = fs.readFileSync(new URL("../../projectile.html", import.meta.url), "utf8");
  assert.equal((pages.match(/theoryPage\(/g) || []).length, 15);
  assert.match(pages, /anim: "/);
  assert.equal((pages.match(/graphs:/g) || []).length, 15);
  assert.match(pages, /vars:/);
  assert.match(projectile, /data-theory-anim="projectile-split"/);
  assert.match(projectile, /data-theory-anim="range-vs-angle"/);
  assert.match(projectile, /eq-display/);
  assert.match(projectile, /eq-vars/);
  assert.match(projectile, /id="graph-theory-range"/);
});
