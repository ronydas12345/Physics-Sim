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
    "One selected object: the scene shows the situation, the force list is the model, and the free-body diagram is the same list with the environment erased.",
    [
      section("object", "Selecting the object", "scene", [
        text("The dashed SYSTEM outline is the box you chose to analyze. Forces drawn here act on that box."),
      ]),
      section("forces", "Force controls", "force-body", [
        text("Enable, set magnitude, and choose a direction for each force. Gravity stays downward. Add force appends another interaction on this object."),
      ]),
      section("fbd", "Free-body diagram", "fbd", [
        text("The FBD is not a second physics engine. It shows only forces on the selected object — no floor, no rope, no velocity arrows."),
      ]),
      section("net", "Net force", "read-fnet", [
        text("F_net is the vector sum. Balanced means |F_net| ≈ 0, not “the object must be at rest.”"),
      ]),
      section("motion", "Motion mode", "toggle-dynamic", [
        text("ΣF = ma is shown either way. The box only accelerates across the ground when Motion mode is on."),
      ]),
      section("camera", "Camera", "camera-controls", [
        text("Origin keeps the origin in view and zooms out as the box recedes. Follow tracks the box. Stationary freezes the current window."),
      ]),
      section("graphs", "Graphs", "graphs", [
        text("Net force and acceleration share the lab clock. Planet chips change g and the sky."),
      ]),
      section("reset", "Reset", "reset", [
        text("Reset returns the box-on-surface preset. Recorded trials stay."),
      ]),
    ],
  ),
  guidedLab: {
    title: "Guided Lab",
    jumps: [
      { sectionId: "applied", label: "Applied force" },
      { sectionId: "fbd", label: "Build an FBD" },
      { sectionId: "n2", label: "a = F_net / m" },
    ],
    sections: [
      section("surface", "Box on a surface", "scene", [
        action("Start from Box on surface. Default m = 5 kg, g = 9.8 m/s²."),
        predict("pred-forces", "What forces should act on the box?"),
        hint("The Earth pulls down. The table pushes up. Is anything pulling sideways?"),
        formula("F<sub>g</sub> = mg = 49 N down, F<sub>N</sub> = 49 N up, F<sub>net</sub> = 0"),
        explain("Forces can exist while the box sits still."),
      ]),
      section("why", "Why does the box not fall?", "fbd", [
        predict("pred-fall", "Gravity pulls downward. Why doesn’t the box accelerate downward?"),
        explain("The surface exerts an upward normal force. “Normal force” is that push, not a memorized extra arrow."),
      ]),
      section("applied", "Add an applied force", "[data-scenario=\"pushed-box\"]", [
        action("Open Pushed box, or add 20 N right. No friction yet."),
        predict("pred-bal", "Which force balances it horizontally?"),
        compare("pred-bal", "None — so F_net = 20 N right"),
        explain("If nothing opposes the push, the horizontal net force is the push."),
      ]),
      section("friction", "Add friction", "[data-scenario=\"box-with-friction\"]", [
        action("Use Box with friction: 30 N right and 10 N left."),
        predict("pred-fh", "What is the net horizontal force?", "numeric"),
        compare("pred-fh", "20 N right"),
        predict("pred-ff", "Why doesn’t friction always make the net force zero?"),
        explain("Friction opposes sliding; it does not automatically cancel whatever you apply."),
      ]),
      section("fbd", "FBD construction", "fbd", [
        action("Imagine a box pushed right across a rough table."),
        predict("pred-four", "Name the four forces on the box, with directions, before you look at the FBD."),
        explain("Gravity ↓, normal ↑, applied →, friction ←. Velocity is not a force. The force the box exerts on the table is not on this FBD."),
      ]),
      section("motion", "Force vs motion", "[data-scenario=\"coasting\"]", [
        action("Open Moving, F_net = 0 (coasting) and turn Motion mode on."),
        predict("pred-coast", "Is the object moving? Is F_net zero? Are those compatible?"),
        compare("pred-coast", "Yes — balanced forces can have constant velocity"),
        explain("This is the seed of Newton’s first law. Force is about changing motion, not about being in motion."),
      ]),
      section("n2", "Net force and acceleration", "mass-input", [
        action("Use a 5 kg box with F_net = 20 N (pushed box is enough)."),
        predict("pred-a", "What acceleration should you expect?", "numeric"),
        derive("d-a", [
          "Acceleration is how fast velocity changes.",
          "A larger net force changes velocity faster; a larger mass resists that change.",
          "a = F_net / m = 20 / 5 = 4 m/s².",
        ]),
        explain("Simulation 2.5 will make ΣF = ma the main lesson. Here it only connects the FBD to motion mode."),
      ]),
      section("transfer", "Transfer", "read-fnet", [
        predict("pred-many", "Why can an object have several forces acting on it while still having zero net force?"),
        explain("Net force is the vector sum. Opposite pieces can cancel, so several interactions can still add to zero."),
      ]),
    ],
  },
};
