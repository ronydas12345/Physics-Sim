export function section(id, title, highlight, content) {
  return { id, title, highlight, content };
}

export function heading(text) {
  return { type: "heading", text };
}

export function text(value) {
  return { type: "text", text: value };
}

export function action(value) {
  return { type: "action", text: value };
}

export function explain(value) {
  return { type: "explanation", text: value };
}

export function hint(value) {
  return { type: "hint", text: value };
}

export function predict(id, prompt, kind = "short") {
  return { type: "prediction", id, prompt, kind };
}

export function observe(id, prompt) {
  return { type: "observation", id, prompt };
}

export function choice(id, prompt, options) {
  return { type: "choice", id, prompt, options };
}

export function formula(html) {
  return { type: "formula", html };
}

export function derive(id, steps) {
  return { type: "derivation", id, steps };
}

export function compare(predictionId, observed) {
  return { type: "compare", predictionId, observed };
}

export function howToUse(overview, steps) {
  return {
    title: "How to Use This Lab",
    sections: [
      section("overview", "Simulation Overview", "scene", [
        text(overview),
        explain("This walkthrough is about the interface, not the full physics story. Use Guided Lab when you want to investigate."),
      ]),
      ...steps,
      section("finish", "Finish", "reset", [
        text("You can reopen How to Use This Lab or Guided Lab any time from the header. Closing a tutorial does not reset the experiment."),
        explain("Reset clears the motion, not your recorded trials. Challenge mode hides a target until you check."),
      ]),
    ],
  };
}
