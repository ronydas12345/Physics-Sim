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
    "Two objects make a system. The diamond is the center of mass, computed from the objects — you never drag the diamond itself.",
    [
      section("system", "Objects and system", "[aria-label=\"Selected system\"]", [
        text("A only, B only, or A + B changes which objects count as the system. That reclassifies the A↔B force as internal or external."),
      ]),
      section("mass", "Mass controls", "ma-input", [
        text("Change m_A or m_B. The diamond slides toward the heavier object if positions stay fixed."),
      ]),
      section("pos", "Position controls", "xa-input", [
        text("x₀ of A and B set the starting locations. Drag an object at t = 0 if you prefer."),
      ]),
      section("vel", "Velocity controls", "va-input", [
        text("Each object has its own velocity. v_CM is the mass-weighted average, not a third independent slider."),
      ]),
      section("cm", "Center-of-mass marker", "scene", [
        text("The diamond is x_CM. It is recalculated from the current object states every frame."),
      ]),
      section("graphs", "Graphs", "graphs", [
        text("Live graphs follow the clock. Recorded trials let you test x_CM vs m_B or vs time."),
      ]),
      section("camera", "Camera", "camera", [
        text("Fit objects keeps A, B, and the center-of-mass diamond on screen. Origin also holds x = 0. Stationary freezes the current window."),
      ]),
      section("play", "Playback and reset", "play", [
        text("Play moves both objects with constant accelerations from F_ext and A↔B. Reset keeps the current sliders."),
      ]),
    ],
  ),
  guidedLab: {
    title: "Guided Lab",
    jumps: [
      { sectionId: "derive", label: "Deriving x_CM" },
      { sectionId: "internal", label: "Internal push" },
      { sectionId: "external", label: "External force" },
    ],
    sections: [
      section("equal", "Equal masses", "ma-input", [
        action("Use Equal masses, or set m_A = m_B = 2 kg, x_A = −10 m, x_B = +10 m."),
        predict("pred-half", "Where do you expect the center of mass to be?", "numeric"),
        compare("pred-half", "0 m — halfway"),
        observe("obs-eq", "Why is it exactly halfway?"),
        explain("Equal masses weight both positions the same, so x_CM is the midpoint."),
      ]),
      section("unequal", "Unequal masses", "mb-input", [
        action("Set m_A = 1 kg, m_B = 4 kg, x_A = 0 m, x_B = 10 m. You already know how to change mass."),
        predict("pred-u", "Predict x_CM before you look.", "numeric"),
        compare("pred-u", "8 m"),
        observe("obs-u", "Why is the center of mass much closer to the 4 kg object?"),
        hint("Imagine four 1 kg pieces stacked at 10 m and one at 0 m."),
      ]),
      section("derive", "Deriving the center-of-mass formula", "values", [
        predict("pred-w", "If equal masses sit halfway between x_A and x_B, what changes when one mass becomes larger?"),
        derive("d-cm", [
          "Each object contributes mass times position.",
          "Divide by total mass so the result is still a position.",
          "x_CM = (m_A x_A + m_B x_B) / (m_A + m_B).",
          "The heavier object pulls the average toward itself.",
        ]),
        formula("x<sub>CM</sub> = (m<sub>A</sub> x<sub>A</sub> + m<sub>B</sub> x<sub>B</sub>) / (m<sub>A</sub> + m<sub>B</sub>)"),
      ]),
      section("vcm", "Center-of-mass velocity", "va-input", [
        action("Set m_A = 2 kg, m_B = 3 kg, v_A = 5 m/s, v_B = 1 m/s."),
        predict("pred-who", "Which object contributes more to the system’s motion?"),
        formula("v<sub>CM</sub> = (2×5 + 3×1) / 5 = 2.6 m/s"),
        explain("The same weighted-average idea applies to velocity."),
      ]),
      section("opposite", "Opposite velocities", "vb-input", [
        action("Equal masses with v_A = +4 m/s and v_B = −4 m/s."),
        predict("pred-z1", "What should v_CM be?", "numeric"),
        compare("pred-z1", "0 m/s"),
        action("Now try m_A = 2 kg, m_B = 3 kg, v_A = +3 m/s, v_B = −2 m/s."),
        predict("pred-z2", "Predict v_CM again.", "numeric"),
        compare("pred-z2", "0 m/s — momenta cancel"),
        explain("Unequal masses can still give v_CM = 0 when m_A v_A + m_B v_B = 0."),
      ]),
      section("p", "Momentum connection", "read-p", [
        formula("p<sub>total</sub> = m<sub>A</sub> v<sub>A</sub> + m<sub>B</sub> v<sub>B</sub> = M v<sub>CM</sub>"),
        explain("v_CM describes the motion of the mass distribution as a whole. Full momentum conservation waits for Module 4."),
      ]),
      section("internal", "Internal motion", "[data-preset=\"push-apart\"]", [
        action("Open Internal push-apart and Play."),
        predict("pred-int", "What happens to the objects? What happens to the diamond?"),
        compare("pred-int", "Objects move apart; the CM stays put if F_ext = 0"),
        explain("Internal A↔B forces cancel in the system sum, so they cannot accelerate the center of mass of A + B."),
      ]),
      section("external", "External force", "fext-input", [
        action("Use External force, or set M = 5 kg and F_ext = 10 N on A + B."),
        predict("pred-acm", "What acceleration should the center of mass have?", "numeric"),
        derive("d-f", [
          "Only forces from outside the system change a_CM.",
          "Treat the total mass as if it sat at the diamond.",
          "a_CM = F_ext / M = 10 / 5 = 2 m/s².",
        ]),
        explain("Internal forces still do not change a_CM of an isolated system."),
      ]),
      section("transfer", "Transfer", "mb-input", [
        predict("pred-xfer-cm", "Why does moving a large mass affect the center of mass more than moving a small mass by the same distance?"),
        hint("Which variable should stay fixed if you want to isolate the effect of mass?"),
        explain("x_CM is a mass-weighted average. A larger mass has more weight in that average, so the same Δx moves the diamond farther."),
      ]),
    ],
  },
};
