import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createState,
  displayedPosition,
  displacement,
  reset,
  setDisplayedPosition,
  setPositiveRight,
} from "./vectors1d.js";

function move(state, ...positions) {
  for (const x of positions) setDisplayedPosition(state, x);
  return state;
}

describe("1.1 scalars and vectors in one dimension", () => {
  it("treats a move from 0 to +5 as equal distance and displacement", () => {
    const state = move(createState(), 5);
    assert.equal(displayedPosition(state), 5);
    assert.equal(displacement(state), 5);
    assert.equal(state.distanceTraveled, 5);
  });

  it("gives a negative displacement when moving left of the origin", () => {
    const state = move(createState(), -5);
    assert.equal(displayedPosition(state), -5);
    assert.equal(displacement(state), -5);
    assert.equal(state.distanceTraveled, 5);
  });

  it("accumulates distance for 0 → +5 → +2, not |final - initial|", () => {
    const state = move(createState(), 5, 2);
    assert.equal(displayedPosition(state), 2);
    assert.equal(displacement(state), 2);
    assert.equal(state.distanceTraveled, 8);
  });

  it("returns to zero displacement after 0 → +5 → 0 while keeping distance", () => {
    const state = move(createState(), 5, 0);
    assert.equal(displayedPosition(state), 0);
    assert.equal(displacement(state), 0);
    assert.equal(state.distanceTraveled, 10);
  });

  it("adds every segment when moving both directions repeatedly", () => {
    const state = move(createState(), 4, -3, 1);
    assert.equal(displayedPosition(state), 1);
    assert.equal(displacement(state), 1);
    assert.equal(state.distanceTraveled, 4 + 7 + 4);
  });

  it("clears distance, displacement, and history on reset", () => {
    const state = move(createState(), 5, 2);
    const next = reset(state);
    assert.equal(next.currentPosition, 0);
    assert.equal(next.distanceTraveled, 0);
    assert.equal(displacement(next), 0);
    assert.deepEqual(next.history, [0]);
  });

  it("flips displayed signs when the positive direction is reversed, not the motion", () => {
    const state = move(createState(), 5);
    setPositiveRight(state, false);
    assert.equal(displayedPosition(state), -5);
    assert.equal(displacement(state), -5);
    assert.equal(state.distanceTraveled, 5);
    assert.equal(state.currentPosition, 5);
  });
});
