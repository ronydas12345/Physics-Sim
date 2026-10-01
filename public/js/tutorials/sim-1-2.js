import {
  action,
  compare,
  derive,
  explain,
  formula,
  heading,
  hint,
  howToUse,
  observe,
  predict,
  section,
  text,
} from "./helpers.js";

export const tutorials = {
  howToUseLab: howToUse(
    "This lab lets an object move in time with chosen x₀, v₀, and a. Play, pause, and step share one clock with the graphs.",
    [
      section("position", "Position controls", "x0-input", [
        text("Initial position is where the object starts on the axis, not how far it will travel."),
      ]),
      section("velocity", "Velocity controls", "v0-input", [
        text("Initial velocity is the signed rate of change of position at t = 0. Positive means the positive axis direction."),
      ]),
      section("accel", "Acceleration controls", "a-input", [
        text("Acceleration is the signed rate of change of velocity. It can be zero while the object still moves."),
      ]),
      section("time", "Time and playback", "play", [
        text("Play advances the shared clock. Pause and Step +0.1 s let you inspect a single instant."),
        action("Try Play, then Pause, then Reset from the header."),
      ]),
      section("camera", "Camera", "camera", [
        text("Origin keeps x = 0 in view and zooms out as the object recedes. Follow tracks the object. Stationary freezes the current window."),
      ]),
      section("graphs", "Graphs", "graphs", [
        text("x–t, v–t, and a–t are three views of the same motion. Click a paused graph to jump the clock."),
      ]),
      section("reset", "Reset", "reset", [
        text("Reset returns t = 0 with the current sliders. Recorded trials stay until you clear them."),
      ]),
    ],
  ),
  guidedLab: {
    title: "Guided Lab",
    jumps: [
      { sectionId: "const-v", label: "Constant velocity" },
      { sectionId: "accel", label: "Acceleration" },
      { sectionId: "area", label: "Area under v–t" },
    ],
    sections: [
      section("position", "Position", "x0-input", [
        action("Set x₀ = 0 m, v = 0 m/s, a = 0 m/s², then Play."),
        observe("obs-still", "What happened to position? Why?"),
        action("Change the initial position by hand and Play again."),
        explain("Position tells where the object is relative to the origin. With v = 0 and a = 0 it stays there."),
      ]),
      section("const-v", "Constant velocity", "v0-input", [
        action("Set x₀ = 0, v = 5 m/s, a = 0."),
        predict("pred-vt", "Before Play: where should the object be after 1 s, 2 s, and 4 s?"),
        hint("If velocity stays 5 m/s, how many meters does it gain each second?"),
        action("Play through at least 4 s and read the position."),
        compare("pred-vt", "5 m, 10 m, 20 m"),
        observe("obs-const", "What quantity stayed constant?"),
        derive("d-v", [
          "Equal time intervals gave equal extra displacement.",
          "That constant rate is velocity.",
          "Δx = v t when v is constant and x₀ = 0.",
          "Rearranged, v = Δx / Δt.",
        ]),
      ]),
      section("slope-x", "Velocity as slope", "xt", [
        predict("pred-slope-x", "On the position–time graph you just made, what does the slope represent?"),
        action("Use Δx = 20 m and Δt = 4 s if you ran that trial."),
        formula("slope = Δx / Δt = 20 / 4 = 5 m/s"),
        explain("Position–time slope is velocity."),
      ]),
      section("accel", "Acceleration", "a-input", [
        action("Set x₀ = 0, v₀ = 0, a = 2 m/s²."),
        predict("pred-a", "What velocity do you expect after 1 s, 2 s, and 3 s?"),
        action("Play and read v."),
        compare("pred-a", "2 m/s, 4 m/s, 6 m/s"),
        observe("obs-a", "What pattern do you see in Δv each second?"),
        derive("d-a", [
          "Velocity increased by the same amount in each equal time interval.",
          "That constant rate of change of velocity is acceleration.",
          "a = Δv / Δt, so Δv = a Δt.",
        ]),
      ]),
      section("slope-v", "Velocity–time graph", "vt", [
        predict("pred-slope-v", "What does the slope of this v–t graph represent?"),
        formula("slope = Δv / Δt = 6 / 3 = 2 m/s²"),
        explain("Velocity–time slope is acceleration."),
      ]),
      section("area", "Area under the velocity graph", "vt", [
        action("Return to v = 5 m/s, a = 0, and run t = 4 s."),
        predict("pred-area", "The v–t graph is a rectangle 5 m/s tall and 4 s wide. What is its area, including units?"),
        compare("pred-area", "20 m — the same as the displacement"),
        explain("Units of (m/s)×s are meters. The area under a velocity–time graph is displacement."),
      ]),
      section("curve", "Acceleration and a curved x–t graph", "xt", [
        action("Use a nonzero acceleration and watch x–t."),
        observe("obs-curve", "Is the position graph a straight line? What does a changing slope mean?"),
        explain("If velocity changes, the x–t slope changes, so the position graph curves. Straight x–t means constant velocity."),
      ]),
      section("transfer", "Transfer", "values", [
        predict("pred-zero-a", "An object has zero acceleration but a nonzero velocity. What does its motion look like?"),
        explain("Constant velocity: equal displacements in equal times. The object keeps moving; acceleration is about changing velocity, not about being in motion."),
      ]),
    ],
  },
};
