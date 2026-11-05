/** Demonstration-only Scene 1. Replace later with THE QUIET VECTOR canon. */
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
      expressions: ["neutral", "focused", "concerned", "amused"],
    },
  },
  scenes: {
    "facility-exterior": {
      background: "facility-exterior",
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
          text: "You must be the new analyst. I'm Mara. We are trying to reproduce an old projectile test.",
        },
        {
          speaker: "elias",
          expression: "focused",
          position: "right",
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
          text: "Come inside. We will start with how launch angle changes horizontal range on flat ground.",
        },
      ],
    },
    "control-room": {
      background: "control-room",
      next: null,
      lines: [
        {
          speaker: "elias",
          expression: "amused",
          position: "right",
          text: "No mystery until we have a measurement. If the numbers disagree with the archive, then we have a question worth asking.",
        },
        {
          speaker: "mara",
          expression: "thinking",
          position: "left",
          text: "When you are ready, continue to the lab. This chapter only had to get you through the door.",
        },
      ],
    },
  },
};
