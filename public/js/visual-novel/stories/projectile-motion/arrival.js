/** Demonstration-only Scenes 1–7. Replace later with THE QUIET VECTOR canon. */
function miss(flag) {
  return {
    CONCEPT_MISUNDERSTANDING: { set: { [flag]: true }, add: { labErrors: 1 } },
    REPEATED_ERROR: { set: { [flag]: true }, add: { labErrors: 1 } },
  };
}

export const projectileArrivalStory = {
  id: "projectile-arrival",
  title: "The Incomplete Report",
  start: "facility-exterior",
  variables: {
    inspectedReport: false,
    inspectedLauncher: false,
    askedElias: false,
    launches: 0,
    trials: 0,
    changedAngle: false,
    sawLaunch: false,
    interpretation: "",
    lastAngle: null,
    neededSupport: false,
    missedComponents: false,
    missedControls: false,
    missedComplement: false,
    askedHint: false,
    labErrors: 0,
    labHints: 0,
  },
  learning: {
    hint: { set: { askedHint: true }, add: { labHints: 1 } },
    stages: {
      "hv-check": miss("missedComponents"),
      "hv-retry": miss("missedComponents"),
      "control-check": miss("missedControls"),
      "control-retry": miss("missedControls"),
      "concept-check": miss("missedComplement"),
      "concept-retry": miss("missedComplement"),
      investigate: {
        HINT_REQUESTED: { set: { missedControls: true } },
      },
    },
  },
  events: {
    launch: { add: { launches: 1 }, set: { sawLaunch: true } },
    angle: { set: { changedAngle: true } },
    "record-trial": { add: { trials: 1 } },
  },
  characters: {
    mara: {
      name: "Mara",
      role: "Research lead",
      position: "left",
      expressions: ["neutral", "thinking", "concerned", "serious", "surprised"],
    },
    elias: {
      name: "Elias",
      role: "Experimental engineer",
      position: "right",
      expressions: ["neutral", "focused", "confused", "concerned", "amused"],
    },
  },
  scenes: {
    "facility-exterior": {
      background: "facility-exterior",
      transition: "fade",
      checkpoint: "arrival",
      cast: [],
      next: "facility-interior",
      lines: [
        {
          speaker: null,
          text: "A remote experimental facility sits under a pale evening sky. The launch rails are quiet.",
        },
        {
          speaker: "mara",
          expression: "neutral",
          position: "left",
          enter: "mara",
          text: "You must be the new analyst. I'm Mara. We are trying to reproduce an old projectile test.",
        },
        {
          speaker: "elias",
          expression: "focused",
          position: "right",
          enter: "elias",
          text: "Elias. I keep the launcher honest. The archived trajectory is clean. The conditions are not.",
        },
        {
          speaker: "mara",
          expression: "thinking",
          position: "left",
          text: "The report lists range and hang time. It does not list every setting the original team used.",
        },
      ],
    },
    "facility-interior": {
      background: "facility-interior",
      transition: "fade",
      cast: ["mara", "elias"],
      next: "control-room",
      lines: [
        {
          speaker: "elias",
          expression: "concerned",
          position: "right",
          text: "If a condition is missing, we cannot treat the report as a complete recipe. We can still establish a baseline.",
        },
        {
          speaker: "mara",
          expression: "serious",
          position: "left",
          text: "That is the first job: run a known launch on our apparatus and record what we actually control.",
        },
        {
          speaker: "mara",
          expression: "neutral",
          position: "left",
          text: "Come inside. Before we launch, you pick how we start.",
        },
      ],
    },
    "control-room": {
      background: "control-room",
      transition: "fade",
      checkpoint: "decision",
      cast: ["mara", "elias"],
      next: "testing-area",
      lines: [
        {
          speaker: "mara",
          expression: "serious",
          position: "left",
          text: "How should we begin?",
          choices: [
            {
              id: "report",
              label: "Inspect the original experiment report.",
              speaker: "mara",
              expression: "thinking",
              set: { inspectedReport: true },
              reply: "Range and hang time are listed. Launch speed is implied, not measured on our rails. Gravity is assumed Earth-normal.",
            },
            {
              id: "launcher",
              label: "Examine the projectile launcher.",
              speaker: "elias",
              expression: "focused",
              set: { inspectedLauncher: true },
              reply: "Angle, speed, and g are the three knobs that matter here. If the archive omitted one, the curve will not match.",
            },
            {
              id: "ask-elias",
              label: "Ask Elias about the recorded trajectory.",
              speaker: "elias",
              expression: "confused",
              set: { askedElias: true },
              reply: "The curve is too clean. Complementary angles can share a range, but only if the missing condition is the same both times.",
            },
          ],
        },
      ],
    },
    "testing-area": {
      background: "testing-area",
      transition: "fade",
      checkpoint: "reconvene",
      cast: ["mara", "elias"],
      next: "simulation-focus",
      lines: [
        {
          speaker: "elias",
          expression: "amused",
          position: "right",
          text: "Good. Different doorway, same lab. We reconvene at the rails.",
        },
        {
          speaker: "mara",
          expression: "neutral",
          position: "left",
          text: "On flat ground, launch angle changes hang time and horizontal range. That is the first identity we will test.",
        },
      ],
    },
    "simulation-focus": {
      background: "simulation-focus",
      transition: "fade",
      checkpoint: "lab",
      cast: ["mara"],
      next: "investigation",
      on: {
        launch: {
          speaker: "elias",
          expression: "focused",
          position: "right",
          enter: "elias",
          text: "That shot is on the rails. Keep speed and gravity fixed if you want the angle to be the only change.",
        },
        angle: {
          speaker: "elias",
          expression: "amused",
          position: "right",
          enter: "elias",
          text: "New angle, same rails. Complementary pairs can share a range. 45° is the peak on flat ground, not a requirement.",
        },
        "record-trial": {
          speaker: "mara",
          expression: "thinking",
          position: "center",
          text: "A recorded row belongs to you. Compare it with the next launch before you trust the archive.",
        },
        learning: {
          "hv-check": {
            speaker: "elias",
            expression: "focused",
            position: "right",
            enter: "elias",
            text: "Hold the split: vx does not change in flight. Gravity only takes vy.",
          },
          "hv-retry": {
            speaker: "elias",
            expression: "focused",
            position: "right",
            enter: "elias",
            text: "Hold the split: vx does not change in flight. Gravity only takes vy.",
          },
          "control-check": {
            speaker: "mara",
            expression: "thinking",
            position: "center",
            text: "Two knobs at once hide the cause. Hold speed and gravity still if you want angle to be the only change.",
          },
          "control-retry": {
            speaker: "mara",
            expression: "thinking",
            position: "center",
            text: "Two knobs at once hide the cause. Hold speed and gravity still if you want angle to be the only change.",
          },
          "concept-check": {
            speaker: "elias",
            expression: "amused",
            position: "right",
            enter: "elias",
            text: "30° and 60° can share a range on flat ground. Height does not follow that pair.",
          },
          "concept-retry": {
            speaker: "elias",
            expression: "amused",
            position: "right",
            enter: "elias",
            text: "30° and 60° can share a range on flat ground. Height does not follow that pair.",
          },
          hint: {
            speaker: "mara",
            expression: "neutral",
            position: "center",
            text: "Use the hint, then run the rails. The apparatus will still show the same identity.",
          },
        },
      },
      lines: [
        {
          speaker: "mara",
          expression: "thinking",
          position: "center",
          exit: "elias",
          waitFor: "lab-complete",
          text: "The live lab stays in your hands. Open Learning path, take a baseline at a known angle, and record what you actually control. I will wait until that guided run is finished.",
        },
      ],
    },
    investigation: {
      background: "testing-area",
      transition: "fade",
      checkpoint: "interpretation",
      cast: ["mara", "elias"],
      next: "revelation",
      lines: [
        {
          speaker: "mara",
          expression: "serious",
          position: "left",
          text: "You have a measured baseline. What did the trials actually show?",
          ifVarText: {
            missedComplement:
              "You had to sit with complementary angles before they clicked. Look at the ranges you recorded. What did the trials actually show?",
            missedControls:
              "Isolating one knob is the whole method. With speed and gravity held still, what did the trials actually show?",
            missedComponents:
              "vx did not change in flight. Keep that in mind. What did the trials actually show?",
            askedHint:
              "A hint is not a shortcut if you still run the rails. What did the trials actually show?",
            neededSupport:
              "The lab asked you to look twice. That is useful. What did the trials actually show?",
          },
          choices: [
            {
              id: "range",
              label: "Range peaked near 45°, and complementary angles landed equally far.",
              speaker: "mara",
              expression: "neutral",
              set: { interpretation: "range" },
              reply: "That is the range identity on flat ground. Height does not follow the same curve.",
            },
            {
              id: "height",
              label: "Steeper launches went higher even when they did not go farther.",
              speaker: "elias",
              expression: "focused",
              set: { interpretation: "height" },
              reply: "Height keeps rising toward 90°. Range does not. The archive listed hang time; it still omitted a knob.",
            },
            {
              id: "missing",
              label: "The archive is still missing a condition we actually control.",
              speaker: "elias",
              expression: "concerned",
              skipDefault: true,
              set: { interpretation: "missing" },
              reply: "Exactly. The curve we measured is honest. The report is not a complete recipe.",
            },
          ],
        },
      ],
    },
    revelation: {
      background: "control-room",
      transition: "fade",
      checkpoint: "revelation",
      cast: ["mara", "elias"],
      next: "closing",
      lines: [
        {
          speaker: "mara",
          expression: "thinking",
          position: "left",
          when: { inspectedReport: true },
          text: "The report listed range and hang time. Launch speed was implied, never measured on these rails. That is the omitted condition.",
        },
        {
          speaker: "elias",
          expression: "focused",
          position: "right",
          when: { inspectedLauncher: true },
          text: "Angle, speed, and g. If the archive left speed as an assumption, no copied recipe would have matched our launcher.",
        },
        {
          speaker: "elias",
          expression: "confused",
          position: "right",
          when: { askedElias: true },
          text: "The archived curve was too clean because it hid a knob. Complementary angles only share a range when that knob stays fixed.",
        },
        {
          speaker: "elias",
          expression: "focused",
          position: "right",
          when: { missedComponents: true },
          text: "vx stayed constant on every shot we watched. That is why range is a horizontal story, even when the arc looks dramatic.",
        },
        {
          speaker: "mara",
          expression: "thinking",
          position: "left",
          when: { missedControls: true },
          text: "The identity only appears when speed and gravity stay put. Change two knobs and the archive looks contradictory for the wrong reason.",
        },
        {
          speaker: "elias",
          expression: "confused",
          position: "right",
          when: { missedComplement: true },
          text: "30° and 60° sharing a range is not a coincidence. Same speed, same g, complementary angles, equal distance. Height still belongs to the steeper shot.",
        },
        {
          speaker: "mara",
          expression: "serious",
          position: "left",
          text: "The report is not necessarily wrong. It is insufficient to reproduce the experiment independently.",
        },
        {
          speaker: "mara",
          expression: "concerned",
          position: "left",
          when: { sawLaunch: true },
          text: "Your launches on this apparatus are the first complete record we have. The mystery is what the original team left out, not whether the rails work.",
        },
        {
          speaker: "elias",
          expression: "concerned",
          position: "right",
          text: "Someone archived a trajectory without archiving the machine. That is a small mystery. It will not stay small.",
        },
      ],
    },
    closing: {
      background: "closing",
      transition: "fade",
      checkpoint: "chapter-end",
      cast: ["mara", "elias"],
      next: null,
      lines: [
        {
          speaker: "elias",
          expression: "focused",
          position: "right",
          enter: "elias",
          text: "The rails kept their word. You have a measured baseline on this apparatus, not a recipe copied from a missing report.",
          ifChoiceText: {
            report:
              "The rails kept their word. The missing launch speed in that report is why a copied recipe would have failed.",
            launcher:
              "The rails kept their word. Angle, speed, and g were the knobs; the archive had omitted one.",
            "ask-elias":
              "The rails kept their word. The archive was clean; the missing conditions were the experiment.",
          },
        },
        {
          speaker: "mara",
          expression: "surprised",
          position: "left",
          text: "If the archive still disagrees after that, the omitted condition is the real experiment.",
        },
        {
          speaker: "mara",
          expression: "thinking",
          position: "left",
          when: { neededSupport: true },
          text: "Looking twice is not a penalty. It is how a missing condition gets found.",
        },
        {
          speaker: "mara",
          expression: "neutral",
          position: "left",
          text: "Replay this chapter whenever you want. The lab stays open. Completing the story is not the same as finishing the experiment.",
          ifVarText: {
            neededSupport:
              "Replay if you want a cleaner first look. The lab stays open. Completing the story is not the same as finishing the experiment.",
          },
        },
      ],
    },
  },
};
