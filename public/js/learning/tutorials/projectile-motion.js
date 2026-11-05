/**
 * Stage 1 projectile tutorial definition.
 * Linear only. Adaptive branches are listed as reserved next-ids for Stage 4.
 */
export const projectileRangeTutorial = {
  id: "1-5-range-intro",
  simulationId: "1-5",
  version: 1,
  title: "Range and launch angle",
  objectives: [
    "Identify launch angle, launch speed, and gravity as the controlled conditions.",
    "Launch a trial and read horizontal range from the recorded result.",
    "State that complementary angles can land equally far on flat ground.",
  ],
  start: "intro",
  adapter: {
    simulationId: "1-5",
    controls: ["angle", "velocity", "gravity", "btn-launch"],
    measurements: ["range", "timeOfFlight", "maxHeight"],
    events: ["launch", "land", "record-trial"],
  },
  stages: {
    intro: {
      type: "introduction",
      title: "What this lab investigates",
      body: "On flat ground with no air resistance, launch angle changes hang time and horizontal range. Speed and gravity stay in your control.",
      highlight: "simulation-canvas",
      next: "interface",
    },
    interface: {
      type: "interface",
      title: "Find the launch controls",
      body: "Angle, speed, and gravity sit under the launcher. The existing highlight box can point at the angle field.",
      highlight: "angle",
      next: "launch",
    },
    launch: {
      type: "guided-action",
      title: "Run a baseline at 45°",
      body: "Set the angle near 45°, launch, and wait for landing. Record the trial if auto-record is off.",
      highlight: "playback-controls",
      requiredAction: "launch",
      next: "observe",
      branches: {
        INCOMPLETE_ACTION: "launch",
        CORRECT_FIRST_ATTEMPT: "observe",
      },
    },
    observe: {
      type: "observation",
      title: "Read range and hang time",
      body: "Compare the live landing position with Time of Flight and Maximum Height. Do not assume the archive listed every condition yet.",
      highlight: "final-metrics",
      next: "summary",
    },
    summary: {
      type: "summary",
      title: "Baseline recorded",
      body: "You have a known launch on this apparatus. Later stages will branch if angle never changes, if launches are repeated without recording, or if complementary angles are compared.",
      next: null,
    },
  },
};
