import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CUSTOM_SCENE, GRAVITY_PRESETS, PLANET_CHIP_ORDER, planetById, planetIcon, sceneForGravity } from "./planets.js";

describe("planetary gravity presets", () => {
  it("gives Earth 9.8 m/s² and the Moon a weaker field", () => {
    const earth = planetById("earth");
    const moon = planetById("moon");
    assert.equal(earth.g, 9.8);
    assert.ok(moon.g < earth.g);
  });

  it("keeps Mercury and Mars at the same slider gravity with different skies", () => {
    const mercury = planetById("mercury");
    const mars = planetById("mars");
    assert.equal(mercury.g, mars.g);
    assert.notEqual(mercury.skyTop, mars.skyTop);
  });

  it("uses planet colors only when backgrounds are on and a world is selected", () => {
    const earth = sceneForGravity({ planetId: "earth", backgroundsOn: true });
    assert.equal(earth.name, "Earth");
    assert.equal(earth.skyTop, planetById("earth").skyTop);
    assert.equal(sceneForGravity({ planetId: "earth", backgroundsOn: false }).skyTop, CUSTOM_SCENE.skyTop);
    assert.equal(sceneForGravity({ planetId: null, backgroundsOn: true }).skyTop, CUSTOM_SCENE.skyTop);
  });

  it("covers the solar-system teaching set", () => {
    const ids = GRAVITY_PRESETS.map((p) => p.id);
    for (const id of ["moon", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"]) {
      assert.ok(ids.includes(id));
    }
  });

  it("keeps a shared chip order for every gravity lab", () => {
    assert.deepEqual(
      [...PLANET_CHIP_ORDER],
      ["moon", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"],
    );
    for (const id of PLANET_CHIP_ORDER) assert.ok(planetById(id));
  });

  it("draws a distinct globe icon for each gravity chip", () => {
    const icons = PLANET_CHIP_ORDER.map((id) => planetIcon(id));
    for (const svg of icons) {
      assert.match(svg, /<svg class="chip-icon planet-icon"/);
      assert.match(svg, /aria-hidden="true"/);
    }
    assert.equal(new Set(icons).size, PLANET_CHIP_ORDER.length);
    assert.match(planetIcon("not-a-planet"), /<svg class="chip-icon planet-icon"/);
  });
});
