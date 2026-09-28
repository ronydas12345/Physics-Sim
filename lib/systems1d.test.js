import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  accelerations,
  cmAcceleration,
  createState,
  evaluateChallenge,
  generateChallenge,
  liveObjects,
  pairForceClass,
  snapshot,
  stepTo,
  systemOf,
  totalMass,
  totalMomentum,
  weightedMean,
} from "./systems1d.js";

function almost(actual, expected, eps = 1e-9) {
  assert.ok(Math.abs(actual - expected) < eps, `${actual} ≉ ${expected}`);
}

describe("2.1 systems and center of mass", () => {
  it("places equal masses halfway between them", () => {
    const state = createState({
      objects: [
        { id: "A", mass: 2, x: -10, v: 0 },
        { id: "B", mass: 2, x: 10, v: 0 },
      ],
    });
    almost(snapshot(state).xCM, 0);
  });

  it("pulls the center of mass toward the heavier object", () => {
    const state = createState({
      objects: [
        { id: "A", mass: 1, x: 0, v: 0 },
        { id: "B", mass: 3, x: 10, v: 0 },
      ],
    });
    almost(snapshot(state).xCM, 7.5);
  });

  it("gives a mass-weighted CM velocity when one object is at rest", () => {
    const state = createState({
      objects: [
        { id: "A", mass: 1, x: 0, v: 10 },
        { id: "B", mass: 3, x: 10, v: 0 },
      ],
    });
    almost(snapshot(state).vCM, 2.5);
  });

  it("keeps v_CM = 0 when momenta cancel", () => {
    const state = createState({
      objects: [
        { id: "A", mass: 2, x: -6, v: 3 },
        { id: "B", mass: 3, x: 9, v: -2 },
      ],
    });
    almost(snapshot(state).vCM, 0);
    stepTo(state, 2);
    const snap = snapshot(state);
    almost(snap.vCM, 0);
    assert.ok(Math.abs(snap.A.x + 6) > 0.5);
    assert.ok(Math.abs(snap.B.x - 9) > 0.5);
  });

  it("matches p_total = M v_CM", () => {
    const state = createState({
      objects: [
        { id: "A", mass: 2, x: 0, v: 4 },
        { id: "B", mass: 3, x: 10, v: 2 },
      ],
    });
    const snap = snapshot(state);
    almost(snap.p, 14);
    almost(snap.M, 5);
    almost(snap.vCM, 2.8);
    almost(snap.p, snap.M * snap.vCM);
  });

  it("moves the marker toward B as soon as m_B increases", () => {
    const light = createState({
      objects: [
        { id: "A", mass: 1, x: 0, v: 0 },
        { id: "B", mass: 1, x: 10, v: 0 },
      ],
    });
    almost(snapshot(light).xCM, 5);
    const heavy = createState({
      objects: [
        { id: "A", mass: 1, x: 0, v: 0 },
        { id: "B", mass: 3, x: 10, v: 0 },
      ],
    });
    almost(snapshot(heavy).xCM, 7.5);
  });

  it("updates x_CM immediately when a position changes", () => {
    const start = createState({
      objects: [
        { id: "A", mass: 2, x: -10, v: 0 },
        { id: "B", mass: 2, x: 10, v: 0 },
      ],
    });
    almost(snapshot(start).xCM, 0);
    const moved = createState({
      objects: [
        { id: "A", mass: 2, x: 0, v: 0 },
        { id: "B", mass: 2, x: 10, v: 0 },
      ],
    });
    almost(snapshot(moved).xCM, 5);
  });

  it("gives v_CM = v when both objects share a velocity", () => {
    const state = createState({
      objects: [
        { id: "A", mass: 2, x: -10, v: 5 },
        { id: "B", mass: 4, x: 10, v: 5 },
      ],
    });
    almost(snapshot(state).vCM, 5);
  });

  it("keeps opposite equal-mass velocities while the CM stays put", () => {
    const state = createState({
      objects: [
        { id: "A", mass: 1, x: -5, v: 5 },
        { id: "B", mass: 1, x: 5, v: -5 },
      ],
    });
    almost(snapshot(state).vCM, 0);
    stepTo(state, 1);
    const snap = snapshot(state);
    almost(snap.A.v, 5);
    almost(snap.B.v, -5);
    almost(snap.vCM, 0);
    almost(snap.xCM, 0);
  });

  it("gives a_CM = F_ext / M and ignores how mass is arranged", () => {
    const stacked = createState({
      objects: [
        { id: "A", mass: 2, x: -8, v: 0 },
        { id: "B", mass: 3, x: 8, v: 0 },
      ],
      externalForce: 10,
    });
    const bunched = createState({
      objects: [
        { id: "A", mass: 2, x: 0, v: 0 },
        { id: "B", mass: 3, x: 1, v: 0 },
      ],
      externalForce: 10,
    });
    almost(snapshot(stacked).aCM, 2);
    almost(snapshot(bunched).aCM, 2);
    almost(cmAcceleration(10, 5), 2);
  });

  it("does not let an internal push change a_CM of A + B", () => {
    const state = createState({
      objects: [
        { id: "A", mass: 2, x: -2, v: 0 },
        { id: "B", mass: 4, x: 2, v: 0 },
      ],
      internalForce: 10,
    });
    const snap = snapshot(state);
    almost(snap.aCM, 0);
    almost(snap.A.a, -5);
    almost(snap.B.a, 2.5);
    stepTo(state, 1);
    const later = snapshot(state);
    almost(later.xCM, snap.xCM);
    almost(later.vCM, 0);
    assert.ok(later.A.x < snap.A.x);
    assert.ok(later.B.x > snap.B.x);
  });

  it("reclassifies the A–B force when the system is A only", () => {
    assert.equal(pairForceClass("AB"), "internal");
    assert.equal(pairForceClass("A"), "external");
    const both = createState({
      objects: [
        { id: "A", mass: 2, x: 0, v: 0 },
        { id: "B", mass: 2, x: 10, v: 0 },
      ],
      internalForce: 8,
      system: "AB",
    });
    const onlyA = createState({
      objects: [
        { id: "A", mass: 2, x: 0, v: 0 },
        { id: "B", mass: 2, x: 10, v: 0 },
      ],
      internalForce: 8,
      system: "A",
    });
    almost(snapshot(both).aCM, 0);
    almost(snapshot(onlyA).aCM, -4);
    almost(snapshot(onlyA).M, 2);
    almost(snapshot(onlyA).xCM, 0);
  });

  it("uses closed-form x_CM(t) = x_CM0 + v_CM t when a_CM = 0", () => {
    const state = createState({
      objects: [
        { id: "A", mass: 2, x: 0, v: 4 },
        { id: "B", mass: 4, x: 12, v: 1 },
      ],
    });
    almost(snapshot(state).xCM, 8);
    almost(snapshot(state).vCM, 2);
    stepTo(state, 3);
    almost(snapshot(state).xCM, 14);
  });

  it("matches the handoff diagram x_CM = 5 m", () => {
    const state = createState({
      objects: [
        { id: "A", mass: 2, x: -5, v: 0 },
        { id: "B", mass: 4, x: 10, v: 0 },
      ],
    });
    almost(snapshot(state).xCM, 5);
    almost(snapshot(state).M, 6);
  });

  it("matches the handoff example x_CM = 8 m and v_CM = 2 m/s", () => {
    const state = createState({
      objects: [
        { id: "A", mass: 2, x: 0, v: 4 },
        { id: "B", mass: 4, x: 12, v: 1 },
      ],
    });
    almost(snapshot(state).xCM, 8);
    almost(snapshot(state).vCM, 2);
  });

  it("derives whole-system quantities from an object array", () => {
    const objects = liveObjects(
      createState({
        objects: [
          { id: "A", mass: 1, x: 0, v: 0 },
          { id: "B", mass: 1, x: 10, v: 0 },
          { id: "C", mass: 2, x: 10, v: 0 },
        ],
      }),
    );
    almost(totalMass(objects), 4);
    almost(weightedMean(objects, "x"), 7.5);
    almost(totalMomentum(objects), 0);
    almost(systemOf(objects, "AB").M, 2);
  });

  it("clears time and history on a fresh state", () => {
    const state = createState();
    stepTo(state, 2);
    assert.ok(state.history.length > 2);
    const again = createState({
      objects: state.objects.map((o) => ({ id: o.id, mass: o.mass, x: o.x0, v: o.v0 })),
    });
    assert.equal(again.time, 0);
    assert.equal(again.history.length, 1);
  });

  it("accepts a center-of-mass challenge", () => {
    const spec = generateChallenge(() => 0.1);
    assert.equal(spec.type, "xcm");
    const measured = snapshot(createState(spec.params));
    const result = evaluateChallenge(measured, spec);
    assert.equal(result.ok, true);
  });

  it("shares F_ext by mass so both objects get the same a_CM", () => {
    const acc = accelerations(
      createState({
        objects: [
          { id: "A", mass: 2, x: 0, v: 0 },
          { id: "B", mass: 3, x: 4, v: 0 },
        ],
        externalForce: 10,
      }),
    );
    almost(acc.A, 2);
    almost(acc.B, 2);
  });
});
