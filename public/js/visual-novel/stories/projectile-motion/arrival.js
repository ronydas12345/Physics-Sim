/** Demonstration-only Scenes 1–2. Replace later with THE QUIET VECTOR canon. */
export const projectileArrivalStory = {
  id: "projectile-arrival",
  title: "The Incomplete Report",
  start: "facility-exterior",
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
              reply: "Range and hang time are listed. Launch speed is implied, not measured on our rails. Gravity is assumed Earth-normal.",
            },
            {
              id: "launcher",
              label: "Examine the projectile launcher.",
              speaker: "elias",
              expression: "focused",
              reply: "Angle, speed, and g are the three knobs that matter here. If the archive omitted one, the curve will not match.",
            },
            {
              id: "ask-elias",
              label: "Ask Elias about the recorded trajectory.",
              speaker: "elias",
              expression: "confused",
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
      next: "closing",
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
      ],
    },
  },
};
