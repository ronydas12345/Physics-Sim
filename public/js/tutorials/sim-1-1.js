import {
  action,
  choice,
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
    "This lab is a number line. Position is a signed location. Distance adds every meter of the path; displacement is the shortcut from start to now.",
    [
      section("axis", "Position and reference direction", "scene", [
        text("The axis defines which way is positive. Read the arrow, not the screen’s left and right, if you flip the convention."),
        action("Use + right, then + left, and watch the live signs change."),
      ]),
      section("magnitude", "Changing magnitude", "pos-input", [
        text("The position box sets how far the object is from the origin. Magnitude is the size of that number, without the sign."),
        action("Type 5 and press Enter, or drag the object on the line."),
      ]),
      section("direction", "Changing direction", "dir-right", [
        text("Direction on a line is a sign: plus or minus relative to the chosen positive way."),
        action("Move to −5 m. The distance from the origin matches +5 m; the signed position does not."),
      ]),
      section("readout", "Reading the number line", "values", [
        text("Live Measurements split vector quantities (position, displacement) from the scalar distance traveled."),
        explain("Distance never carries a sign. Displacement does."),
      ]),
      section("camera", "Camera", "camera", [
        text("Origin keeps x = 0 in view and zooms out as the object recedes. Follow tracks the object. Stationary freezes the current window."),
      ]),
      section("reset", "Reset and recording", "reset", [
        text("Reset returns the object to the origin and clears running distance. Record Trial stores a snapshot for the graphs below."),
      ]),
    ],
  ),
  guidedLab: {
    title: "Guided Lab",
    jumps: [
      { sectionId: "add", label: "Adding on a line" },
      { sectionId: "transfer", label: "Transfer" },
    ],
    sections: [
      section("reference", "Establish a reference direction", "scene", [
        action("Before changing anything, identify which direction this lab calls positive. Use the axis, not the screen."),
        action("Move the object to +5 m, then to −5 m."),
        observe("obs-ref", "What changed, and what stayed the same?"),
        hint("Compare distance from the origin with the signed position."),
        explain("The object’s distance from the origin is the same at ±5 m. Position relative to the chosen positive direction is different."),
      ]),
      section("mag-dir", "Magnitude vs direction", "pos-input", [
        action("Set a displacement of magnitude 5 m to the right, then 5 m to the left."),
        predict("pred-mag", "Did the magnitude change? Did the direction change?"),
        explain("Magnitude tells how much. Direction tells which way. Both are required for a vector."),
      ]),
      section("scalar-vector", "Scalar vs vector", "values", [
        predict("pred-sv", "Consider 5 m versus 5 m to the right. What information does the second contain that the first does not?"),
        hint("One is fully described by a number and a unit. The other also needs a way."),
        explain("5 m is a scalar magnitude. 5 m to the right is a vector: magnitude plus direction."),
      ]),
      section("add", "Addition along one dimension", "pos-input", [
        heading("Same direction"),
        action("Add +3 m then +4 m along the positive axis."),
        predict("pred-same", "What net displacement do you expect if both pieces point the same way?", "numeric"),
        compare("pred-same", "+7 m"),
        heading("Opposite direction"),
        action("Now try +3 m followed by −4 m."),
        predict("pred-opp", "Predict the net displacement before you move.", "numeric"),
        compare("pred-opp", "−1 m"),
        explain("Direction matters when adding vectors. Same-way pieces stack; opposite-way pieces cancel."),
      ]),
      section("transfer", "Conceptual transfer", "values", [
        choice("q-walk", "A student walks 8 m east and 8 m west. Which statement is true?", [
          { id: "d16", label: "Distance 16 m, displacement 0" },
          { id: "both0", label: "Distance and displacement are both 0" },
          { id: "both16", label: "Distance and displacement are both 16 m" },
        ]),
        explain("Distance adds every meter of the path (16 m). Displacement is the shortcut from start to finish (0)."),
        predict("pred-sign", "A displacement changes from +8 m to −3 m. What does the sign tell you, and what does the magnitude tell you?"),
        explain("The sign is the direction relative to the chosen positive axis. The magnitude is how far, 8 m then 3 m, without that direction."),
      ]),
    ],
  },
};
