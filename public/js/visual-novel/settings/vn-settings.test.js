import assert from "node:assert/strict";
import test from "node:test";
import { defaultVnSettings, loadVnSettings, normalizeVnSettings, saveVnSettings, textSpeedMs } from "./vn-settings.js";

function memoryStorage(seed = {}) {
  const data = { ...seed };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
  };
}

test("settings ignore unknown speeds and keep story saves separate", () => {
  const next = normalizeVnSettings({ textSpeed: "warp", autoDelay: "normal", autoMode: 1, extra: true });
  assert.equal(next.textSpeed, "normal");
  assert.equal(next.autoMode, true);
  assert.equal(textSpeedMs({ textSpeed: "instant" }), 0);
  assert.equal(textSpeedMs({ textSpeed: "very-slow" }) > textSpeedMs({ textSpeed: "fast" }), true);
});

test("settings persist without writing a narrative save", () => {
  const storage = memoryStorage();
  const saved = saveVnSettings({ textSpeed: "fast", autoDelay: "long", autoMode: true, textScale: 1.2 }, storage);
  assert.equal(saved.textSpeed, "fast");
  assert.equal(storage.getItem("ap1-vn-settings").includes("fast"), true);
  assert.equal(storage.getItem("ap1-vn-save"), null);
  const loaded = loadVnSettings(storage);
  assert.equal(loaded.autoDelay, "long");
  assert.equal(loaded.autoMode, true);
  assert.equal(loaded.textScale, 1.2);
  assert.deepEqual(loadVnSettings(memoryStorage()), defaultVnSettings());
});
