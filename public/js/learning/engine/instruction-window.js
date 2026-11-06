/**
 * Instruction window for the Learning Branch Manager.
 * Reuses .tutorial-spot / .tutorial-panel. Does not replace How to Use or Guided Lab.
 */

import { decorateActionButtons } from "../../platform/lab-kit.js";
import { placeTutorialHighlight, resolveTutorialTarget } from "../../platform/highlight-target.js";
import { LAB_EVENTS, SIM_EVENT_ACTIONS, actionFromEvent, createLabBus } from "../../shared/lab-events.js";
import { getLearningTutorial } from "../registry.js";
import { readLearningSave, writeLearningSave } from "../saves.js";
import { createLinearTutorial } from "./linear-engine.js";

function loadState(tutorialId) {
  return readLearningSave(tutorialId);
}

function saveState(snapshot) {
  writeLearningSave(snapshot);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function bindLearningTutorial(root, { simulationId, bus } = {}) {
  const def = getLearningTutorial(simulationId);
  if (!def || !root?.querySelector) return () => {};

  const events = bus || createLabBus();
  const toolbar = root.querySelector(".sim-toolbar");
  let launch = toolbar?.querySelector(".tutorial-launch");
  let createdLaunch = false;
  if (toolbar && !launch) {
    launch = document.createElement("div");
    launch.className = "tutorial-launch";
    toolbar.prepend(launch);
    createdLaunch = true;
  }
  let btn = launch?.querySelector("#btn-learning");
  if (launch && !btn) {
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn ghost-paper";
    btn.id = "btn-learning";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Learning path");
    btn.textContent = "Learning path";
    launch.append(btn);
  }

  const host = document.createElement("div");
  host.className = "tutorial-root learning-root";
  host.hidden = true;
  host.innerHTML = `
    <div class="tutorial-spot" hidden></div>
    <aside class="tutorial-panel" role="dialog" aria-modal="false" aria-labelledby="learning-title">
      <header class="tutorial-panel-head">
        <div>
          <p class="kicker" id="learning-kind">Learning path</p>
          <h2 id="learning-title">Learning path</h2>
        </div>
        <button type="button" class="tutorial-close" id="learning-close" aria-label="Close learning path">×</button>
      </header>
      <p class="tutorial-progress" id="learning-progress"></p>
      <details class="tutorial-toc">
        <summary>Stages</summary>
        <ol id="learning-toc-list"></ol>
      </details>
      <div class="tutorial-body" id="learning-body"></div>
      <footer class="tutorial-nav">
        <button type="button" class="btn ghost-paper" id="learning-prev">Previous</button>
        <button type="button" class="btn primary" id="learning-next">Next</button>
      </footer>
      <div class="tutorial-tools">
        <button type="button" class="text-link" id="learning-hint" hidden>Hint</button>
        <button type="button" class="text-link" id="learning-restart">Restart this tutorial</button>
      </div>
    </aside>
  `;
  root.append(host);

  const spot = host.querySelector(".tutorial-spot");
  const panel = host.querySelector(".tutorial-panel");
  const body = host.querySelector("#learning-body");
  const toc = host.querySelector("#learning-toc-list");
  let session = null;

  function persist() {
    if (session) saveState(session.snapshot());
  }

  function place() {
    const view = session?.view();
    const target = resolveTutorialTarget(root, view?.highlight);
    placeTutorialHighlight(spot, panel, target);
  }

  function render() {
    const view = session?.view();
    if (!view) return;
    host.querySelector("#learning-kind").textContent = `${view.title} · ${view.kindLabel}`;
    host.querySelector("#learning-title").textContent = view.stage.title;
    const onSpine = view.path.includes(view.stageId);
    host.querySelector("#learning-progress").textContent = onSpine
      ? `Stage ${view.index + 1} of ${view.total} · ${view.guidanceLabel}`
      : view.guidanceLabel;
    host.querySelector("#learning-prev").disabled = !view.canPrev;
    const nextBtn = host.querySelector("#learning-next");
    nextBtn.disabled = view.complete || view.needsAnswer || view.needsAction;
    const nextText = view.isLast || view.complete ? "Finish" : "Next";
    const nextLabel = nextBtn.querySelector(".btn-label");
    if (nextLabel) nextLabel.textContent = nextText;
    else nextBtn.textContent = nextText;
    const hintBtn = host.querySelector("#learning-hint");
    if (hintBtn) {
      hintBtn.hidden = view.hintTotal === 0;
      hintBtn.disabled = !view.canHint;
    }
    const explanation = view.explanation
      ? `<p class="tutorial-explanation">${escapeHtml(view.explanation)}</p>`
      : "";
    const hints = view.hints
      .map((text, i) => `<p class="tutorial-hint-line">Hint ${i + 1}: ${escapeHtml(text)}</p>`)
      .join("");
    const question = view.question
      ? `<div class="tutorial-prompt"><div class="presets tutorial-choices">${view.question.options
          .map(
            (option) =>
              `<button type="button" class="chip${view.question.selected === option.id ? " active" : ""}" data-learning-choice="${escapeHtml(option.id)}">${escapeHtml(option.label)}</button>`,
          )
          .join("")}</div>${
          view.question.feedback
            ? `<p class="${view.question.correct ? "tutorial-done" : "tutorial-explanation"}">${escapeHtml(view.question.feedback)}</p>`
            : ""
        }</div>`
      : "";
    const waiting = view.needsAction
      ? `<p class="tutorial-explanation">The lab stays in your hands. ${
          view.requiredAction === "launch"
            ? "Press Launch to continue."
            : "Complete the highlighted action to continue."
        } Next stays off until that happens.</p>`
      : "";
    const done = view.complete
      ? `<p class="tutorial-done">You can reopen this path any time. Closing it does not reset the lab.</p>`
      : "";
    body.innerHTML = `<p class="tutorial-action">${escapeHtml(view.instruction)}</p>${explanation}${question}${hints}${waiting}${done}`;
    toc.innerHTML = view.path
      .map((id) => {
        const title = def.stages[id].title;
        const doneClass = view.completedStages.includes(id) ? " is-done" : "";
        const here = id === view.stageId ? " is-current" : "";
        return `<li><button type="button" class="text-link${doneClass}${here}" data-jump="${id}">${escapeHtml(title)}</button></li>`;
      })
      .join("");
    btn?.setAttribute("aria-expanded", host.hidden ? "false" : "true");
    decorateActionButtons(host);
    requestAnimationFrame(place);
    persist();
  }

  function open(startOver = false) {
    const saved = startOver ? null : loadState(def.id);
    session = createLinearTutorial(def, { state: saved, bus: events });
    if (startOver) session.restart();
    host.hidden = false;
    events.emit(LAB_EVENTS.LAB_STARTED, { tutorialId: def.id, simulationId: def.simulationId });
    render();
  }

  function close() {
    persist();
    host.hidden = true;
    spot.hidden = true;
    btn?.setAttribute("aria-expanded", "false");
  }

  btn?.addEventListener("click", () => {
    if (!host.hidden) close();
    else open(false);
  });
  host.querySelector("#learning-close").addEventListener("click", close);
  host.querySelector("#learning-prev").addEventListener("click", () => {
    session?.back();
    render();
  });
  host.querySelector("#learning-next").addEventListener("click", () => {
    session?.advance();
    if (host.hidden) return;
    render();
  });
  host.querySelector("#learning-restart").addEventListener("click", () => open(true));
  host.querySelector("#learning-hint").addEventListener("click", () => {
    session?.requestHint();
    render();
  });
  body.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-learning-choice]");
    if (!choice) return;
    session?.answer(choice.dataset.learningChoice);
    render();
  });
  toc.addEventListener("click", (event) => {
    const jump = event.target.closest("[data-jump]");
    if (!jump) return;
    session?.go(jump.dataset.jump);
    render();
  });

  const onKey = (event) => {
    if (host.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };
  const onMove = () => {
    if (!host.hidden) place();
  };
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", onMove);
  window.addEventListener("scroll", onMove, true);

  function onSim(type) {
    if (!session || host.hidden) return;
    const action = actionFromEvent(type);
    if (!action) return;
    session.observe(action);
    render();
  }

  const unsubs = [
    ...Object.keys(SIM_EVENT_ACTIONS).map((type) => events.on(type, () => onSim(type))),
    events.on(LAB_EVENTS.STORY_AWAITS_LAB, () => {
      if (loadState(def.id)?.complete) {
        events.emit(LAB_EVENTS.LAB_COMPLETED, { tutorialId: def.id, simulationId: def.simulationId });
        return;
      }
      if (host.hidden) open(false);
      document.getElementById("tab-btn-lab")?.click();
    }),
    events.on(LAB_EVENTS.STORY_RESUMES, () => close()),
  ];

  return () => {
    close();
    host.remove();
    btn?.remove();
    if (createdLaunch && launch && !launch.querySelector("button")) launch.remove();
    unsubs.forEach((off) => off());
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onMove);
    window.removeEventListener("scroll", onMove, true);
  };
}
