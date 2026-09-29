/**
 * Shared How to Use / Guided Lab overlay. Reads simulation DOM; never duplicates physics.
 */

import { getTutorials } from "../tutorials/registry.js";

const TARGET_ALIASES = {
  scene: "#axis-canvas",
  playback: ".transport",
  controls: ".track-controls",
  values: "#values-panel",
  graphs: ".graphs",
  play: "#btn-play",
  pause: "#btn-pause",
  reset: "#btn-reset",
  xt: "#graph-xt",
  vt: "#graph-vt",
  at: "#graph-at",
  fbd: "#fbd-canvas",
  fbda: "#fbd-a",
  fbdb: "#fbd-b",
  diagram: "#diagram-canvas",
};

function storageKey(simId, type) {
  return `ap1-tutorial:${simId}:${type}`;
}

function loadProgress(simId, type) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(simId, type)) || "null");
  } catch {
    return null;
  }
}

function saveProgress(simId, type, data) {
  try {
    localStorage.setItem(storageKey(simId, type), JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

function resolveTarget(root, highlight) {
  if (!highlight) return null;
  const id = typeof highlight === "string" ? highlight : highlight.target;
  if (!id) return null;
  if (/^[.#\[]/.test(id)) return root.querySelector(id);
  return (
    root.querySelector(`[data-tutorial="${id}"]`) ||
    root.querySelector(`#${CSS.escape(id)}`) ||
    (TARGET_ALIASES[id] ? root.querySelector(TARGET_ALIASES[id]) : null)
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function bindTutorial(root, { simulationId }) {
  const pack = getTutorials(simulationId);
  if (!pack) return () => {};

  const toolbar = root.querySelector(".sim-toolbar");
  let launch = toolbar?.querySelector(".tutorial-launch");
  let createdLaunch = false;
  if (toolbar && !launch) {
    launch = document.createElement("div");
    launch.className = "tutorial-launch";
    launch.setAttribute("role", "group");
    launch.setAttribute("aria-label", "Lab tutorials");
    launch.innerHTML = `
      <button type="button" class="btn ghost" id="btn-howto" aria-expanded="false">How to Use This Lab</button>
      <button type="button" class="btn ghost" id="btn-guided" aria-expanded="false">Guided Lab</button>
    `;
    toolbar.prepend(launch);
    createdLaunch = true;
  }

  const host = document.createElement("div");
  host.className = "tutorial-root";
  host.hidden = true;
  host.innerHTML = `
    <div class="tutorial-spot" hidden></div>
    <aside class="tutorial-panel" role="dialog" aria-modal="false" aria-labelledby="tutorial-title">
      <header class="tutorial-panel-head">
        <div>
          <p class="kicker" id="tutorial-kind">Tutorial</p>
          <h2 id="tutorial-title">Tutorial</h2>
        </div>
        <button type="button" class="tutorial-close" id="tutorial-close" aria-label="Close tutorial">×</button>
      </header>
      <p class="tutorial-progress" id="tutorial-progress"></p>
      <nav class="tutorial-jumps" id="tutorial-jumps" hidden></nav>
      <details class="tutorial-toc">
        <summary>Jump to section</summary>
        <ol id="tutorial-toc-list"></ol>
      </details>
      <div class="tutorial-body" id="tutorial-body"></div>
      <footer class="tutorial-nav">
        <button type="button" class="btn ghost" id="tutorial-prev">← Previous</button>
        <button type="button" class="btn primary" id="tutorial-next">Next →</button>
      </footer>
      <div class="tutorial-tools">
        <button type="button" class="text-link" id="tutorial-restart">Restart this tutorial</button>
      </div>
    </aside>
  `;
  root.append(host);

  const spot = host.querySelector(".tutorial-spot");
  const panel = host.querySelector(".tutorial-panel");
  const body = host.querySelector("#tutorial-body");
  const toc = host.querySelector("#tutorial-toc-list");
  const jumps = host.querySelector("#tutorial-jumps");

  let type = null;
  let tutorial = null;
  let index = 0;
  let completed = [];
  let predictions = {};
  let responses = {};
  let hintsOpen = {};
  let deriveOpen = {};

  function sections() {
    return tutorial?.sections || [];
  }

  function persist() {
    if (!type) return;
    saveProgress(simulationId, type, {
      index,
      completed,
      predictions,
      responses,
      hintsOpen,
      deriveOpen,
    });
  }

  function restore(nextType) {
    const saved = loadProgress(simulationId, nextType);
    index = saved?.index || 0;
    completed = Array.isArray(saved?.completed) ? saved.completed : [];
    predictions = saved?.predictions || {};
    responses = saved?.responses || {};
    hintsOpen = saved?.hintsOpen || {};
    deriveOpen = saved?.deriveOpen || {};
  }

  function place() {
    const section = sections()[index];
    const target = resolveTarget(root, section?.highlight);
    if (target) {
      if (typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
      const r = target.getBoundingClientRect();
      spot.hidden = false;
      spot.style.left = `${Math.max(8, r.left - 6)}px`;
      spot.style.top = `${Math.max(8, r.top - 6)}px`;
      spot.style.width = `${r.width + 12}px`;
      spot.style.height = `${r.height + 12}px`;
    } else {
      spot.hidden = true;
    }
    const tr = target?.getBoundingClientRect();
    const pw = Math.min(380, window.innerWidth - 24);
    const ph = panel.offsetHeight || 360;
    let left = tr ? tr.right + 16 : window.innerWidth - pw - 24;
    let top = tr ? Math.min(tr.top, window.innerHeight - ph - 16) : 88;
    if (left + pw > window.innerWidth - 12) left = Math.max(12, (tr?.left || 24) - pw - 16);
    if (left < 12) left = 12;
    if (top < 12) top = 12;
    if (top + ph > window.innerHeight - 12) top = Math.max(12, window.innerHeight - ph - 12);
    panel.style.width = `${pw}px`;
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  function renderBlock(block, i) {
    const key = `${sections()[index]?.id || "s"}-${i}`;
    if (block.type === "heading") return `<h3>${escapeHtml(block.text)}</h3>`;
    if (block.type === "text" || block.type === "action" || block.type === "explanation") {
      return `<p class="tutorial-${block.type}">${escapeHtml(block.text)}</p>`;
    }
    if (block.type === "formula") {
      return `<p class="eq-block tutorial-formula">${block.html || escapeHtml(block.text || "")}</p>`;
    }
    if (block.type === "hint") {
      const open = hintsOpen[key] ? " open" : "";
      return `<details class="tutorial-hint"${open} data-hint="${key}"><summary>Hint</summary><p>${escapeHtml(block.text)}</p></details>`;
    }
    if (block.type === "prediction" || block.type === "observation" || block.type === "question") {
      const stored = predictions[block.id] || "";
      const kind = block.kind || "short";
      const field =
        kind === "numeric"
          ? `<input class="tutorial-field" data-pred="${block.id}" type="number" step="any" value="${escapeHtml(stored)}" aria-label="${escapeHtml(block.prompt)}" />`
          : `<textarea class="tutorial-field" data-pred="${block.id}" rows="2" aria-label="${escapeHtml(block.prompt)}">${escapeHtml(stored)}</textarea>`;
      return `<div class="tutorial-prompt"><p>${escapeHtml(block.prompt)}</p>${field}</div>`;
    }
    if (block.type === "choice") {
      const picked = responses[block.id];
      const opts = (block.options || [])
        .map(
          (opt) =>
            `<button type="button" class="chip${picked === opt.id ? " active" : ""}" data-choice-q="${block.id}" data-choice="${opt.id}">${escapeHtml(opt.label)}</button>`,
        )
        .join("");
      return `<div class="tutorial-prompt"><p>${escapeHtml(block.prompt)}</p><div class="presets tutorial-choices">${opts}</div></div>`;
    }
    if (block.type === "derivation") {
      const shown = deriveOpen[block.id] || 1;
      const steps = (block.steps || [])
        .map((step, n) =>
          n < shown ? `<li>${escapeHtml(step)}</li>` : "",
        )
        .join("");
      const more =
        shown < (block.steps || []).length
          ? `<button type="button" class="btn ghost" data-derive="${block.id}">Reveal next step</button>`
          : "";
      return `<div class="tutorial-derive"><p>Build the relationship from what you measured.</p><ol>${steps}</ol>${more}</div>`;
    }
    if (block.type === "compare") {
      const pred = predictions[block.predictionId] || "—";
      return `<p class="tutorial-compare">Your prediction: <strong>${escapeHtml(pred)}</strong><br />Observed: <strong>${escapeHtml(block.observed)}</strong></p>`;
    }
    return "";
  }

  function render() {
    const list = sections();
    if (!list.length) return;
    if (index < 0) index = 0;
    if (index >= list.length) index = list.length - 1;
    const section = list[index];
    host.querySelector("#tutorial-kind").textContent = tutorial.title;
    host.querySelector("#tutorial-title").textContent = section.title;
    host.querySelector("#tutorial-progress").textContent = `Section ${index + 1} of ${list.length}`;
    host.querySelector("#tutorial-prev").disabled = index === 0;
    host.querySelector("#tutorial-next").textContent = index === list.length - 1 ? "Finish" : "Next →";
    body.innerHTML = (section.content || []).map(renderBlock).join("");
    toc.innerHTML = list
      .map((sec, i) => {
        const done = completed.includes(sec.id) ? " is-done" : "";
        const here = i === index ? " is-current" : "";
        return `<li><button type="button" class="text-link${done}${here}" data-jump="${i}">${escapeHtml(sec.title)}</button></li>`;
      })
      .join("");
    const jumpList = tutorial.jumps || [];
    jumps.hidden = jumpList.length === 0;
    jumps.innerHTML = jumpList
      .map((jump) => `<button type="button" class="chip" data-jump-id="${jump.sectionId}">${escapeHtml(jump.label)}</button>`)
      .join("");
    root.querySelector("#btn-howto")?.setAttribute("aria-expanded", String(type === "howToUseLab"));
    root.querySelector("#btn-guided")?.setAttribute("aria-expanded", String(type === "guidedLab"));
    requestAnimationFrame(place);
    persist();
  }

  function open(nextType, startOver = false) {
    type = nextType;
    tutorial = pack[nextType];
    if (!tutorial) return;
    if (startOver) {
      index = 0;
      completed = [];
      predictions = {};
      responses = {};
      hintsOpen = {};
      deriveOpen = {};
      persist();
    } else restore(nextType);
    host.hidden = false;
    render();
  }

  function close() {
    host.hidden = true;
    spot.hidden = true;
    root.querySelector("#btn-howto")?.setAttribute("aria-expanded", "false");
    root.querySelector("#btn-guided")?.setAttribute("aria-expanded", "false");
    persist();
  }

  function go(next) {
    const list = sections();
    const current = list[index];
    if (current && !completed.includes(current.id)) completed.push(current.id);
    if (next >= list.length) {
      persist();
      body.insertAdjacentHTML(
        "beforeend",
        `<p class="tutorial-done">You can reopen this tutorial any time. Closing it does not reset the lab.</p>`,
      );
      index = list.length - 1;
      close();
      return;
    }
    index = next;
    render();
  }

  root.querySelector("#btn-howto")?.addEventListener("click", () => {
    if (type === "howToUseLab" && !host.hidden) close();
    else open("howToUseLab");
  });
  root.querySelector("#btn-guided")?.addEventListener("click", () => {
    if (type === "guidedLab" && !host.hidden) close();
    else open("guidedLab");
  });
  host.querySelector("#tutorial-close").addEventListener("click", close);
  host.querySelector("#tutorial-prev").addEventListener("click", () => go(index - 1));
  host.querySelector("#tutorial-next").addEventListener("click", () => go(index + 1));
  host.querySelector("#tutorial-restart").addEventListener("click", () => {
    if (type) open(type, true);
  });
  toc.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-jump]");
    if (!btn) return;
    go(Number(btn.dataset.jump));
  });
  jumps.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-jump-id]");
    if (!btn) return;
    const next = sections().findIndex((sec) => sec.id === btn.dataset.jumpId);
    if (next >= 0) go(next);
  });
  body.addEventListener("input", (event) => {
    const field = event.target.closest("[data-pred]");
    if (!field) return;
    predictions[field.dataset.pred] = field.value;
    persist();
  });
  body.addEventListener("click", (event) => {
    const hint = event.target.closest("details[data-hint]");
    if (hint && event.target.tagName === "SUMMARY") {
      requestAnimationFrame(() => {
        hintsOpen[hint.dataset.hint] = hint.open;
        persist();
      });
    }
    const choice = event.target.closest("[data-choice-q]");
    if (choice) {
      responses[choice.dataset.choiceQ] = choice.dataset.choice;
      render();
    }
    const derive = event.target.closest("[data-derive]");
    if (derive) {
      deriveOpen[derive.dataset.derive] = (deriveOpen[derive.dataset.derive] || 1) + 1;
      render();
    }
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
    if (createdLaunch) launch?.remove();
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onMove);
    window.removeEventListener("scroll", onMove, true);
  };
}
