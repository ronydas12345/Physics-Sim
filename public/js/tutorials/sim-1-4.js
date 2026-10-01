import {
  action,
  compare,
  derive,
  explain,
  formula,
  hint,
  howToUse,
  observe,
  predict,
  section,
  text,
} from "./helpers.js";

export const tutorials = {
  howToUseLab: howToUse(
    "The same two objects move on the ground. Changing the observer only changes how that motion is described.",
    [
      section("frame", "Reference frame selector", "[aria-label=\"Reference frame\"]", [
        text("Ground, Object A, and Object B are three ways to report the same world motion. The objects do not jump when you switch frames."),
      ]),
      section("objects", "Observer and object controls", "controls", [
        text("Each object has its own initial position and velocity relative to the ground. You set those; the lab computes the rest."),
      ]),
      section("rel-x", "Relative position", "values", [
        text("x_B/A is B’s position as seen by A. It is a difference of world positions, not a new animation."),
      ]),
      section("rel-v", "Relative velocity", "values", [
        text("v_B/A is how fast B’s position changes according to A."),
      ]),
      section("camera", "Camera", "camera", [
        text("Fit objects zooms so both stay on screen. Origin also keeps x = 0 in view. Stationary freezes the current window."),
      ]),
      section("play", "Playback", "play", [
        text("Play runs the shared clock. Switch frames while paused to compare descriptions of the same instant."),
      ]),
    ],
  ),
  guidedLab: {
    title: "Guided Lab",
    jumps: [
      { sectionId: "derive", label: "Deriving v_B/A" },
      { sectionId: "same-v", label: "Same velocity" },
      { sectionId: "transfer", label: "Transfer" },
    ],
    sections: [
      section("same-event", "Same event, different observer", "play", [
        action("Set A to +2 m/s and B to +5 m/s on the ground."),
        predict("pred-rel", "From the ground, how fast is B moving? How fast does B appear to move relative to A?"),
        action("Play, then switch the observer to A and read v_B."),
        hint("Subtract the observer’s ground velocity from the object’s ground velocity."),
      ]),
      section("derive", "Deriving relative velocity", "values", [
        observe("obs-3", "With v_A = 2 m/s and v_B = 5 m/s, what relative speed of B as seen by A did you measure?"),
        predict("pred-how", "How did 3 m/s arise from 2 m/s and 5 m/s?"),
        derive("d-rel", [
          "Both velocities were measured from the ground.",
          "A already moves 2 m/s, so B’s extra 3 m/s is what A notices.",
          "v_B/A = v_B − v_A.",
        ]),
        formula("v<sub>B/A</sub> = v<sub>B</sub> − v<sub>A</sub>"),
      ]),
      section("same-v", "Same velocity", "controls", [
        action("Set v_A = v_B = 5 m/s."),
        predict("pred-still", "What should A observe about B?"),
        compare("pred-still", "B has zero velocity relative to A"),
        explain("An object can be moving relative to the ground and stationary relative to another observer."),
      ]),
      section("opposite", "Opposite directions", "controls", [
        action("Set v_A = +3 m/s and v_B = −2 m/s."),
        predict("pred-sep", "How quickly are they separating, and which way does B move according to A?"),
        formula("v<sub>B/A</sub> = −2 − (+3) = −5 m/s, so they separate at 5 m/s"),
      ]),
      section("switch", "Reference frame change", "[aria-label=\"Reference frame\"]", [
        action("Pause at some t > 0. Click Ground, then A, then B without changing the sliders."),
        observe("obs-frame", "Did the objects teleport, or did only the reported numbers change?"),
        explain("The event is the same. The frame only changes the description."),
      ]),
      section("transfer", "Transfer", "values", [
        predict("pred-xfer", "Train A moves +20 m/s and train B moves +15 m/s, both from the ground. What does a passenger on A measure for B? Then reverse the observer."),
        hint("Use v_B/A = v_B − v_A, then swap the labels."),
        explain("Passenger on A: v_B/A = 15 − 20 = −5 m/s. Passenger on B: v_A/B = +5 m/s. Same event, opposite descriptions."),
        predict("pred-agree", "Two observers disagree about an object’s velocity. Can both be correct? Explain."),
        explain("Yes, if they use different reference frames. The event does not change; the description does."),
      ]),
    ],
  },
};
