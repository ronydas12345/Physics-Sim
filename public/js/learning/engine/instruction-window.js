/**
 * Instruction window for the Learning Branch Manager.
 * Reuses .tutorial-spot / .tutorial-panel. Does not replace How to Use or Guided Lab.
 */

import { decorateActionButtons } from "../../platform/lab-kit.js";
import { placeTutorialHighlight, resolveTutorialTarget } from "../../platform/highlight-target.js";
import { LAB_EVENTS, createLabBus } from "../../shared/lab-events.js";
import { getLearningTutorial } from "../registry.js";
import { createLinearTutorial } from "./linear-engine.js";

function storageKey(tutorialId) {
  return `ap1-learning:${tutorialId}`;
}

function loadState(tutorialId) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(tutorialId)) || "null");
  } catch {
    return null;
  }
}

function saveState(snapshot) {
  try {
    localStorage.setItem(storageKey(snapshot.tutorialId), JSON.stringify(snapshot));
  } catch {
    /* ignore quota */
  }
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
    host.querySelector("#learning-progress").textContent = `Stage ${view.index + 1} of ${view.total}`;
    host.querySelector("#learning-prev").disabled = !view.canPrev;
    const nextBtn = host.querySelector("#learning-next");
    nextBtn.disabled = view.complete;
    const nextText = view.isLast || view.complete ? "Finish" : "Next";
    const nextLabel = nextBtn.querySelector(".btn-label");
    if (nextLabel) nextLabel.textContent = nextText;
    else nextBtn.textContent = nextText;
    const explanation = view.explanation
      ? `<p class="tutorial-explanation">${escapeHtml(view.explanation)}</p>`
      : "";
    const done = view.complete
      ? `<p class="tutorial-done">You can reopen this path any time. Closing it does not reset the lab.</p>`
      : "";
    body.innerHTML = `<p class="tutorial-action">${escapeHtml(view.instruction)}</p>${explanation}${done}`;
    toc.innerHTML = view.path
      .map((id) => {
        const title = def.stages[id].title;
        const doneClass = view.completedStages.includes(id) ? " is-done" : "";
        const here = id === view.stageId ? " is-current" : "";
        return `<li><button type="button" class="text-link${doneClass}${here}" data-jump="${id}">${escapeHtml(title)}</button></li>`;
      })
      .join("");
    btn?.setAttribute("aria-expanded", "true");
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
    render();
  });
  host.querySelector("#learning-restart").addEventListener("click", () => open(true));
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

  return () => {
    close();
    host.remove();
    btn?.remove();
    if (createdLaunch && launch && !launch.querySelector("button")) launch.remove();
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onMove);
    window.removeEventListener("scroll", onMove, true);
  };
}
