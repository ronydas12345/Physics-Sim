import assert from "node:assert/strict";
import test from "node:test";
import { createTypewriter } from "./typewriter.js";

test("instant speed shows the full line immediately", () => {
  const tw = createTypewriter();
  const view = tw.start("Range peaks at 45 degrees.", 0, 0);
  assert.equal(view.complete, true);
  assert.equal(view.text, "Range peaks at 45 degrees.");
});

test("timed speed reveals characters, then a complete snap finishes the line", () => {
  const tw = createTypewriter();
  tw.start("abcd", 10, 0);
  assert.equal(tw.tick(10).text, "a");
  assert.equal(tw.tick(25).text, "ab");
  assert.equal(tw.tick(25).complete, false);
  assert.equal(tw.complete().text, "abcd");
  assert.equal(tw.tick(999).complete, true);
});
