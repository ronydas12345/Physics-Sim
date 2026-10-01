import {
  action,
  compare,
  explain,
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
    "This lab shows one motion in four representations at once: the object, a motion diagram, and x–t, v–t, and a–t graphs.",
    [
      section("diagram", "Motion diagram", "diagram", [
        text("Dots mark equal time steps. Spacing is about speed, not a separate physics quantity."),
      ]),
      section("xt", "Position–time graph", "xt", [
        text("x–t plots the same clock as Play. Slope is velocity."),
      ]),
      section("vt", "Velocity–time graph", "vt", [
        text("v–t is the slope of x–t. Its slope is acceleration. Optional shading is displacement."),
      ]),
      section("at", "Acceleration–time graph", "at", [
        text("a–t is usually a horizontal line in this lab because a is constant."),
      ]),
      section("connect", "Connecting representations", "scene", [
        text("Toggles let you hide the object, the diagram, or the arrows so you can force yourself to read a graph first."),
      ]),
      section("camera", "Camera", "camera", [
        text("Origin keeps x = 0 in view and zooms out as the object recedes. Follow tracks the object. Stationary freezes the current window."),
      ]),
      section("play", "Playback and reset", "play", [
        text("Play, Pause, Step, and Reset share the simulation clock with every graph."),
      ]),
    ],
  ),
  guidedLab: {
    title: "Guided Lab",
    jumps: [
      { sectionId: "diagram", label: "Motion diagram" },
      { sectionId: "signs", label: "Acceleration sign" },
      { sectionId: "translate", label: "Translate representations" },
    ],
    sections: [
      section("same", "Same motion, different representations", "scene", [
        action("Set v = 4 m/s and a = 0, then Play."),
        predict("pred-dots", "What should the motion diagram look like before you run?"),
        compare("pred-dots", "Evenly spaced dots"),
        explain("Equal time intervals produce equal displacements when velocity is constant."),
      ]),
      section("diagram", "Motion diagram", "diagram", [
        predict("pred-far", "If the dots become farther apart, what does that tell you about speed?"),
        predict("pred-close", "If the spacing shrinks, what might be happening?"),
        hint("Spacing is |displacement| per equal Δt. Larger spacing means larger |v|."),
        explain("Spreading dots: speeding up. Crowding dots: slowing down. Even spacing: constant speed."),
      ]),
      section("xt", "Position–time graph", "xt", [
        action("Run constant velocity again."),
        predict("pred-shape", "What shape do you expect for x–t?"),
        compare("pred-shape", "A straight line"),
        predict("pred-steep", "What does the steepness represent?"),
        explain("Steepness of x–t is velocity."),
      ]),
      section("changing-v", "Changing velocity", "a-input", [
        action("Set a = 2 m/s² and Play."),
        predict("pred-space", "What should happen to the spacing between motion-diagram dots?"),
        compare("pred-space", "Spacing increases"),
        explain("Increasing spacing → increasing speed → acceleration in the direction of velocity."),
      ]),
      section("neg-v", "Negative velocity", "v0-input", [
        action("Set v = −4 m/s and a = 0."),
        predict("pred-neg", "How should the motion diagram change? How should x–t change?"),
        explain("Negative velocity means motion in the negative reference direction. It is not “negative speed.” Speed is |v|."),
      ]),
      section("signs", "Acceleration sign", "a-input", [
        action("Compare v = +4 m/s with a = −2 m/s²."),
        predict("pred-sign", "Is the object moving right or left? Is it speeding up or slowing down?"),
        hint("Velocity’s sign is which way it is going. Acceleration’s sign is which way velocity is changing."),
        explain("Here it moves in the positive direction while slowing down, because a points opposite v."),
      ]),
      section("translate", "Representation translation", "graphs", [
        heading("Graph → diagram"),
        predict("pred-g2d", "If v–t is a horizontal line above zero, what should the motion diagram look like?"),
        heading("Diagram → graph"),
        predict("pred-d2g", "If dots get closer together while the object still moves right, what should v–t look like?"),
        explain("Do not memorize isolated shapes. Translate: even dots ↔ constant v; spreading dots ↔ |v| increasing."),
      ]),
      section("transfer", "Transfer", "xt", [
        predict("pred-steeper", "A position–time graph becomes steeper over time. What does that imply about velocity?"),
        explain("Steeper x–t means a larger |slope|, so |velocity| is increasing."),
      ]),
    ],
  },
};
