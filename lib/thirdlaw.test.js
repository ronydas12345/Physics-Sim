import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  G_TEACH,
  addExtra,
  areOppositeDirections,
  createInteractionPair,
  createState,
  evaluateChallenge,
  forcePair,
  forcesOn,
  generateChallenge,
  gravityMagnitude,
  isThirdLawPair,
  liveState,
  oppositeDirection,
  pairCriteria,
  reset,
  setInteraction,
  setMass,
  setSeparation,
  snapshot,
  stepTo,
} from "./thirdlaw.js";

function almost(actual, expected, eps = 1e-9) {
  assert.ok(Math.abs(actual - expected) < eps, `${actual} ≉ ${expected}`);
}

describe("2.3 Newton's third law", () => {
  it("gives equal magnitudes from a single interaction", () => {
    const pair = createInteractionPair({ magnitude: 25, direction: 0 });
    almost(pair.forceAonB.magnitude, 25);
    almost(pair.forceBonA.magnitude, 25);
  });

  it("points B on A opposite A on B for right and up", () => {
    const right = createInteractionPair({ magnitude: 20, direction: 0 });
    almost(right.forceBonA.direction, 180);
    const up = createInteractionPair({ magnitude: 20, direction: 90 });
    almost(up.forceBonA.direction, 270);
  });

  it("normalizes opposite directions through 360° and 540°", () => {
    almost(oppositeDirection(0), 180);
    almost(oppositeDirection(180), 0);
    almost(oppositeDirection(360), 180);
    almost(oppositeDirection(540), 0);
    assert.equal(areOppositeDirections(0, 180), true);
    assert.equal(areOppositeDirections(90, 270), true);
  });

  it("keeps the pair equal for unequal masses and different accelerations", () => {
    const state = createState({
      scenario: "custom",
      A: { name: "A", mass: 2, x: -2, y: 0 },
      B: { name: "B", mass: 8, x: 2, y: 0 },
      magnitude: 20,
      direction: 0,
      dynamicMode: true,
    });
    const snap = snapshot(state);
    almost(snap.forceAonB.magnitude, 20);
    almost(snap.forceBonA.magnitude, 20);
    almost(Math.hypot(snap.A.ax, snap.A.ay), 10);
    almost(Math.hypot(snap.B.ax, snap.B.ay), 2.5);
    assert.ok(snap.A.ax * snap.B.ax < 0 || snap.A.ay * snap.B.ay < 0 || snap.A.ax !== snap.B.ax);
  });

  it("gives equal-and-opposite 4 m/s² for 5 kg and 20 N", () => {
    const state = createState({
      scenario: "two-boxes",
      A: { name: "A", mass: 5, x: -2, y: 0 },
      B: { name: "B", mass: 5, x: 2, y: 0 },
      magnitude: 20,
      direction: 0,
    });
    const snap = snapshot(state);
    almost(Math.abs(snap.A.ax), 4);
    almost(Math.abs(snap.B.ax), 4);
    almost(snap.A.ax + snap.B.ax, 0);
  });

  it("updates both forces when the interaction changes from 20 N to 50 N", () => {
    const state = createState({ scenario: "two-boxes", magnitude: 20 });
    setInteraction(state, { magnitude: 50 });
    const pair = forcePair(state);
    almost(pair.forceAonB.magnitude, 50);
    almost(pair.forceBonA.magnitude, 50);
  });

  it("keeps the pair at 20 N when an extra 30 N acts on A", () => {
    const state = createState({ scenario: "two-boxes", magnitude: 20, direction: 0 });
    addExtra(state, { target: "A", magnitude: 30, direction: 0, name: "Applied" });
    const snap = snapshot(state);
    almost(snap.forceAonB.magnitude, 20);
    almost(snap.forceBonA.magnitude, 20);
    almost(snap.netA.x, 10);
    almost(snap.netB.x, 20);
  });

  it("puts A on B only on B's force list", () => {
    const state = createState({ scenario: "two-boxes" });
    const onA = forcesOn(state, "A").map((f) => f.label);
    const onB = forcesOn(state, "B").map((f) => f.label);
    assert.equal(onA.some((s) => s.includes("B on A") || s.includes("Object B on Object A")), true);
    assert.equal(onB.some((s) => s.includes("A on B") || s.includes("Object A on Object B")), true);
    assert.equal(onA.some((s) => s.includes("A on B") || s.includes("Object A on Object B")), false);
  });

  it("identifies the interaction pair and rejects gravity/normal on one object", () => {
    const pair = createInteractionPair({ magnitude: 20, direction: 0 });
    assert.equal(isThirdLawPair(pair.forceAonB, pair.forceBonA), true);
    assert.equal(
      isThirdLawPair(
        { source: "Earth", target: "B", magnitude: 49, direction: 270, interactionId: "g" },
        { source: "Table", target: "B", magnitude: 49, direction: 90, interactionId: "n" },
      ),
      false,
    );
  });

  it("does not let static mode move the objects", () => {
    const state = createState({ scenario: "two-boxes", magnitude: 20, dynamicMode: false });
    stepTo(state, 2);
    const live = liveState(state);
    almost(live.A.x, state.A.x0);
    almost(live.B.x, state.B.x0);
  });

  it("moves both objects when time advances with default motion mode", () => {
    const state = createState({ scenario: "two-boxes", magnitude: 20 });
    assert.equal(state.dynamicMode, true);
    const xA0 = liveState(state).A.x;
    const xB0 = liveState(state).B.x;
    stepTo(state, 1);
    const live = liveState(state);
    assert.ok(live.A.x < xA0);
    assert.ok(live.B.x > xB0);
  });

  it("moves both objects in dynamic mode with opposite accelerations", () => {
    const state = createState({ scenario: "two-boxes", magnitude: 20, dynamicMode: true });
    const xA0 = snapshot(state).A.x;
    stepTo(state, 1);
    const snap = snapshot(state);
    assert.ok(snap.A.x < xA0);
    assert.ok(snap.B.x > 2);
    almost(snap.criteria.difference, 0);
  });

  it("clears time on reset", () => {
    const state = createState({ scenario: "two-boxes", dynamicMode: true });
    stepTo(state, 1.5);
    const next = reset(state);
    almost(next.time, 0);
    almost(next.A.x0, state.A.x0);
  });

  it("replaces names and masses when switching to hand-and-box", () => {
    let state = createState({ scenario: "two-boxes" });
    state = createState({ scenario: "hand-box" });
    assert.equal(state.A.name, "Hand");
    assert.equal(state.B.name, "Box");
    almost(state.interaction.magnitude, 25);
  });

  it("uses F = G m_A m_B / r² for a gravitational pair", () => {
    const state = createState({ scenario: "gravity-pair" });
    const r = 6;
    const expected = gravityMagnitude(4, 6, r);
    almost(expected, (G_TEACH * 4 * 6) / (r * r));
    almost(snapshot(state).forceAonB.magnitude, expected);
    almost(snapshot(state).forceBonA.magnitude, expected);
  });

  it("changes both gravitational forces when a mass or distance changes", () => {
    const state = createState({ scenario: "gravity-pair" });
    const before = snapshot(state).forceAonB.magnitude;
    setMass(state, "A", 8);
    const afterMass = snapshot(state).forceAonB.magnitude;
    assert.ok(afterMass > before);
    almost(snapshot(state).forceBonA.magnitude, afterMass);
    setSeparation(state, 8);
    const afterR = snapshot(state).forceAonB.magnitude;
    assert.ok(afterR < afterMass);
    almost(snapshot(state).forceBonA.magnitude, afterR);
  });

  it("gives a much smaller |a| to the heavier Earth than to the hanging object", () => {
    const state = createState({ scenario: "hanging-earth" });
    const snap = snapshot(state);
    const aEarth = Math.hypot(snap.A.ax, snap.A.ay);
    const aObj = Math.hypot(snap.B.ax, snap.B.ay);
    assert.ok(aObj > aEarth);
    almost(snap.forceAonB.magnitude, snap.forceBonA.magnitude);
    almost(snap.forceAonB.direction, 270);
    almost(snap.forceBonA.direction, 90);
  });

  it("marks a valid pair on the criteria checklist", () => {
    const crit = pairCriteria(createState({ scenario: "two-boxes" }));
    assert.equal(crit.valid, true);
    assert.equal(crit.equalMagnitude, true);
    assert.equal(crit.differentObjects, true);
  });

  it("accepts a magnitude challenge from the live snapshot", () => {
    const spec = generateChallenge(() => 0.2);
    assert.equal(spec.type, "magnitude");
    const state = createState(spec.params);
    const result = evaluateChallenge(snapshot(state), spec);
    assert.equal(result.ok, true);
  });

  it("accepts the correct conceptual choice and rejects the misconception", () => {
    const spec = generateChallenge(() => 0.55);
    assert.equal(spec.type, "cancel");
    assert.equal(evaluateChallenge({ choice: "no" }, spec).ok, true);
    assert.equal(evaluateChallenge({ choice: "yes" }, spec).ok, false);
  });

  it("accepts an acceleration challenge for 2 kg and 8 kg at 24 N", () => {
    const spec = generateChallenge(() => 0.4);
    assert.equal(spec.type, "accel");
    const state = createState(spec.params);
    assert.equal(evaluateChallenge(snapshot(state), spec).ok, true);
  });
});
