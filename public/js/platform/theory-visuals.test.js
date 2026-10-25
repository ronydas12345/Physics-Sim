import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { ANIMATION_IDS, theoryPage, theoryVisual } from "./theory-visuals.js";

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
        eq: "a = F/m",
      },
    ],
  });
  assert.match(html, /data-theory-anim="f-ma"/);
  assert.match(html, /Watch the idea, then return to the lab/);
  assert.match(html, /a = F\/m/);
  assert.equal(theoryVisual("hooke", "Fs = −kx").includes('data-theory-anim="hooke"'), true);
});

test("every shipped lab theory tab uses a microanimation", () => {
  const pages = fs.readFileSync(new URL("./pages.js", import.meta.url), "utf8");
  const projectile = fs.readFileSync(new URL("../../projectile.html", import.meta.url), "utf8");
  assert.equal((pages.match(/theoryPage\(/g) || []).length, 15);
  assert.match(pages, /anim: "/);
  assert.match(projectile, /data-theory-anim="projectile-split"/);
  assert.match(projectile, /data-theory-anim="range-vs-angle"/);
});
