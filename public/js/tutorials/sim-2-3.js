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
    "Two objects interact. One interaction writes both arrows: equal magnitude, opposite direction, different targets.",
    [
      section("two", "Two objects", "scene", [
        text("A and B are separate systems. Each arrow starts on the object that experiences that force."),
      ]),
      section("interact", "Interaction controls", "force-input", [
        text("The interaction F slider updates A on B and B on A together. You cannot type 20 N and 30 N as a pair."),
      ]),
      section("pair", "Force pair display", "values", [
        text("The inspector lists source, target, and pair difference. Difference should stay 0.00 N."),
      ]),
      section("fbds", "Separate free-body diagrams", "fbda", [
        text("A’s FBD only shows forces on A. B’s FBD only shows forces on B. The pair is split across the two diagrams."),
      ]),
      section("mass", "Mass controls", "mass-a", [
        text("Changing mass does not change the interaction force unless the scenario is gravitational."),
      ]),
      section("motion", "Dynamic mode", "toggle-dynamic", [
        text("Motion mode lets each object accelerate as a = F_net / m. Equal force does not mean equal acceleration."),
      ]),
      section("camera", "Camera", "camera-controls", [
        text("Fit objects zooms so both stay on screen. Origin also keeps x = 0 in view. Stationary freezes the current window."),
      ]),
      section("graphs", "Graphs", "graphs", [
        text("Signed pair forces overlap in magnitude and oppose in sign. Extra forces change net force, not the pair."),
      ]),
    ],
  ),
  guidedLab: {
    title: "Guided Lab",
    jumps: [
      { sectionId: "cancel", label: "Why they don’t cancel" },
      { sectionId: "masses", label: "Unequal masses" },
      { sectionId: "false", label: "False pair" },
    ],
    sections: [
      section("first", "First interaction", "force-input", [
        action("Use Two boxes push: 5 kg, 5 kg, 20 N."),
        predict("pred-back", "If A pushes B with 20 N, what should B push back with?", "numeric"),
        compare("pred-back", "20 N — read B on A"),
        explain("The pair is one interaction, not two independent sliders."),
      ]),
      section("dir", "Direction", "dir-input", [
        predict("pred-dir", "If A pushes B to the right, which way does B push A?"),
        formula("A on B = 20 N → &nbsp; B on A = 20 N ←"),
        explain("Opposite direction is required. The minus in F(A on B) = −F(B on A) is that reversal."),
      ]),
      section("cancel", "Why don’t they cancel?", "fbda", [
        predict("pred-net", "Both forces are equal and opposite. Why isn’t the net force automatically zero?"),
        hint("Look at which object each arrow is attached to. Then look at the two FBDs."),
        explain("They act on different objects. Only forces on the same object add to that object’s F_net."),
        formula("A: 20 N ← &nbsp;&nbsp; B: 20 N →"),
      ]),
      section("masses", "Unequal masses", "mass-a", [
        action("You already know the mass boxes. Set m_A = 2 kg, m_B = 8 kg, F = 20 N."),
        predict("pred-eq", "Are the forces still equal?"),
        compare("pred-eq", "Yes — still 20 N and 20 N"),
        predict("pred-who", "Which object should accelerate more?"),
        compare("pred-who", "A, the lighter one"),
      ]),
      section("derive-a", "Deriving different accelerations", "values", [
        derive("d-a", [
          "The interaction force on each object has the same magnitude F.",
          "Newton’s second law is per object: a = F_net / m.",
          "|a_A| = F / m_A = 20 / 2 = 10 m/s².",
          "|a_B| = F / m_B = 20 / 8 = 2.5 m/s².",
        ]),
        explain("Equal force does not mean equal acceleration."),
      ]),
      section("net", "Force pair vs net force", "btn-add-extra", [
        action("Keep the 20 N pair. Add an extra 30 N right on A."),
        observe("obs-net", "What are F_net on A and F_net on B? Did the pair magnitudes change?"),
        explain("Pair stays 20 N / 20 N. Net A can be 10 N right while net B is 20 N right. Extra forces do not break the third-law pair."),
      ]),
      section("gravity", "Gravity pair", "[data-scenario=\"hanging-earth\"]", [
        action("Open Object and Earth. The masses are scaled so you can see both accelerations."),
        predict("pred-g", "Are the gravitational forces equal? Why is Earth’s acceleration tiny?"),
        formula("F = G m<sub>A</sub> m<sub>B</sub> / r² updates both arrows together"),
        explain("The partner of “Earth on object” is “object on Earth,” not the normal force."),
      ]),
      section("false", "False pair challenge", "fbda", [
        predict("pred-false", "A box at rest has gravity down and a normal force up. Are those a Newton’s third-law pair? Why or why not?"),
        hint("Do they act on the same object? Are they the same interaction?"),
        explain("No. Both act on the box. Equal-and-opposite on one object is a balanced F_net, not a third-law pair. The pair of gravity is the object pulling Earth up."),
      ]),
      section("transfer", "Transfer", "mass-a", [
        predict("pred-xfer-a", "If two objects exert equal forces on one another, why can one accelerate much more than the other?"),
        explain("The pair magnitudes are equal. Acceleration is F_net / m for each object, so the smaller mass changes velocity faster."),
      ]),
    ],
  },
};
