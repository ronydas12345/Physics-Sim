/**
 * Shared lab chrome used by 1.1, 1.2, and later simulations:
 * Lab/Theory tabs, teacher view, challenge card, trial table, icon toolbar.
 */

import { fileForFormat, triggerDownload } from "/lib/export-trials.js";

function iconReset() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6M5.5 9A7 7 0 0 1 19 8M18.5 15A7 7 0 0 1 5 16"/></svg>`;
}

function iconFullscreen() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5"/></svg>`;
}

function iconDownload() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0 4-4m-4 4-4-4M5 19h14"/></svg>`;
}

export function labIconToolbar() {
  return `
    <div class="icon-toolbar" role="group" aria-label="Lab tools">
      <button type="button" class="icon-btn" id="btn-reset" title="Reset" aria-label="Reset">${iconReset()}</button>
      <button type="button" class="icon-btn" id="btn-fullscreen" title="Fullscreen" aria-label="Fullscreen">${iconFullscreen()}</button>
      <div class="download-menu">
        <button type="button" class="icon-btn" id="btn-download" title="Download trials" aria-label="Download trials" aria-haspopup="menu" aria-expanded="false" disabled>${iconDownload()}</button>
        <div class="download-pop" id="download-pop" hidden role="menu" aria-label="Download format">
          <button type="button" role="menuitem" data-format="txt">Text (.txt)</button>
          <button type="button" role="menuitem" data-format="csv">CSV (.csv)</button>
          <button type="button" role="menuitem" data-format="xlsx">Excel (.xlsx)</button>
        </div>
      </div>
    </div>
  `;
}

export function labTablist() {
  return `
    <nav class="tabs" role="tablist" aria-label="Lab sections">
      <button type="button" class="tab active" id="tab-btn-lab" role="tab" aria-selected="true" aria-controls="panel-lab">
        Lab
      </button>
      <button type="button" class="tab" id="tab-btn-theory" role="tab" aria-selected="false" aria-controls="panel-theory">
        Theory
      </button>
    </nav>
  `;
}

export function teacherSwitch() {
  return `
    <label class="switch">
      <input id="debug-toggle" type="checkbox" />
      <span>Teacher view</span>
    </label>
  `;
}

export function challengeCard() {
  return `
    <section class="card challenge-card">
      <div class="card-head">
        <h2>Challenge Mode</h2>
        <label class="switch">
          <input id="challenge-toggle" type="checkbox" />
          <span>On</span>
        </label>
      </div>
      <div id="challenge-body" class="challenge-body" hidden>
        <p class="challenge-q" id="challenge-q">Solve for the missing quantities, then check.</p>
        <dl class="givens" id="challenge-givens"></dl>
        <p class="challenge-target" id="challenge-goal">Target: —</p>
        <p class="muted" id="challenge-unknown">Unknown: —</p>
        <p id="challenge-feedback" class="feedback">The solution stays hidden until you check.</p>
        <div class="challenge-actions">
          <button type="button" id="btn-reveal" class="btn ghost" disabled>Reveal answer</button>
          <button type="button" id="btn-new-target" class="btn ghost">New challenge</button>
        </div>
      </div>
    </section>
  `;
}

export function theoryLink() {
  return `<p class="theory-link">Need the equations? Open the <button type="button" id="open-theory" class="text-link">Theory</button> tab.</p>`;
}

export function trialSection({ rangeTitle, heightTitle, rangeCaption, heightCaption, columns, emptyCols }) {
  const heads = columns.map((c) => `<th>${c}</th>`).join("");
  return `
    <section class="lab-bottom">
      <div class="graphs">
        <div class="graph-wrap">
          <h2>${rangeTitle}</h2>
          <canvas id="graph-range" width="640" height="280" aria-label="${rangeTitle}"></canvas>
          <p class="caption">${rangeCaption}</p>
        </div>
        <div class="graph-wrap">
          <h2>${heightTitle}</h2>
          <canvas id="graph-height" width="640" height="280" aria-label="${heightTitle}"></canvas>
          <p class="caption">${heightCaption}</p>
        </div>
      </div>
      <div class="table-wrap">
        <div class="table-head">
          <h2>Trial Comparison</h2>
          <p class="muted">Record after an investigation so the table and graphs belong to you.</p>
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>${heads}</tr>
            </thead>
            <tbody id="trial-body">
              <tr class="empty-row">
                <td colspan="${emptyCols}">No trials yet. Investigate, then record a trial.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

export function bindLabTabs(root, onChange) {
  const tabLab = root.querySelector("#tab-btn-lab");
  const tabTheory = root.querySelector("#tab-btn-theory");
  const panelLab = root.querySelector("#panel-lab");
  const panelTheory = root.querySelector("#panel-theory");
  const openTheory = root.querySelector("#open-theory");

  function showTab(name) {
    const lab = name === "lab";
    panelLab.hidden = !lab;
    panelTheory.hidden = lab;
    tabLab.classList.toggle("active", lab);
    tabTheory.classList.toggle("active", !lab);
    tabLab.setAttribute("aria-selected", String(lab));
    tabTheory.setAttribute("aria-selected", String(!lab));
    onChange?.(name);
  }

  tabLab.addEventListener("click", () => showTab("lab"));
  tabTheory.addEventListener("click", () => showTab("theory"));
  openTheory?.addEventListener("click", () => showTab("theory"));
  return showTab;
}

export function bindChallenge(root, { generate, apply, describeCard, describeFeedback }) {
  const toggle = root.querySelector("#challenge-toggle");
  const body = root.querySelector("#challenge-body");
  const reveal = root.querySelector("#btn-reveal");
  const next = root.querySelector("#btn-new-target");
  const state = {
    active: false,
    attempted: false,
    revealed: false,
    spec: null,
    last: null,
  };

  function load(spec) {
    state.spec = spec;
    state.attempted = false;
    state.revealed = false;
    state.last = null;
    apply?.(spec);
    describeCard(root, spec);
    describeFeedback(root, state);
  }

  function setActive(on) {
    state.active = on;
    body.hidden = !on;
    if (on) load(generate());
    else {
      state.spec = null;
      apply?.(null);
    }
  }

  toggle.addEventListener("change", () => setActive(toggle.checked));
  reveal.addEventListener("click", () => {
    if (!state.attempted) return;
    state.revealed = true;
    describeFeedback(root, state);
  });
  next.addEventListener("click", () => {
    if (state.active) load(generate());
  });

  return {
    state,
    setActive,
    markAttempt(result) {
      if (!state.active || !state.spec) return;
      state.attempted = true;
      state.last = result;
      describeFeedback(root, state);
    },
  };
}

export function bindTeacher(root, renderDebug) {
  const toggle = root.querySelector("#debug-toggle");
  const line = root.querySelector("#debug-line");
  let on = false;
  toggle.addEventListener("change", () => {
    on = toggle.checked;
    renderDebug(on, line);
  });
  return {
    isOn: () => on,
    refresh() {
      renderDebug(on, line);
    },
  };
}

export function createTrialBook({ columns, renderRow, onChange }) {
  let trials = [];
  return {
    list: () => trials,
    record(entry) {
      trials.push({ id: trials.length + 1, ...entry });
      onChange?.(trials);
    },
    clear() {
      trials = [];
      onChange?.(trials);
    },
    render(tbody) {
      if (!trials.length) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="${columns}">No trials yet. Investigate, then record a trial.</td></tr>`;
        return;
      }
      tbody.innerHTML = trials.map(renderRow).join("");
    },
  };
}

export function bindFullscreen(button) {
  if (!button) return () => {};
  const target = document.documentElement;

  function active() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function isOn() {
    const el = active();
    return el === target || el === document.body || el === document.getElementById("page-root");
  }

  function enter() {
    try {
      if (target.requestFullscreen) return target.requestFullscreen().catch(() => {});
      return target.webkitRequestFullscreen?.call(target);
    } catch {
      return undefined;
    }
  }

  function exit() {
    const fn = document.exitFullscreen || document.webkitExitFullscreen;
    return fn?.call(document);
  }

  function sync() {
    const on = isOn();
    button.setAttribute("aria-pressed", String(on));
    button.title = on ? "Exit fullscreen" : "Fullscreen";
    button.setAttribute("aria-label", on ? "Exit fullscreen" : "Fullscreen");
    target.classList.toggle("is-fullscreen", on);
    document.body?.classList.toggle("is-fullscreen", on);
  }

  button.addEventListener("click", () => {
    if (active()) exit();
    else enter();
  });
  document.addEventListener("fullscreenchange", sync);
  document.addEventListener("webkitfullscreenchange", sync);
  sync();
  return () => {
    document.removeEventListener("fullscreenchange", sync);
    document.removeEventListener("webkitfullscreenchange", sync);
    if (!isOn()) {
      target.classList.remove("is-fullscreen");
      document.body?.classList.remove("is-fullscreen");
    }
  };
}

export function bindDownload(root, { getTable, filename }) {
  const button = root.querySelector("#btn-download");
  const pop = root.querySelector("#download-pop");
  const noop = { sync() {}, destroy() {} };
  if (!button || !pop) return noop;

  function close() {
    pop.hidden = true;
    button.setAttribute("aria-expanded", "false");
  }

  function sync() {
    const table = getTable();
    button.disabled = !table.rows.length;
    if (button.disabled) close();
  }

  const onToggle = (event) => {
    event.stopPropagation();
    if (button.disabled) return;
    const open = pop.hidden;
    pop.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
  };

  const onPick = (event) => {
    const item = event.target.closest("[data-format]");
    if (!item) return;
    const table = getTable();
    if (!table.rows.length) return;
    const file = fileForFormat(item.dataset.format, {
      title: table.title,
      sheetName: filename,
      columns: table.columns,
      rows: table.rows,
    });
    triggerDownload(file.filename, file.mime, file.body);
    close();
  };

  const onDoc = (event) => {
    if (!root.querySelector(".download-menu")?.contains(event.target)) close();
  };

  button.addEventListener("click", onToggle);
  pop.addEventListener("click", onPick);
  document.addEventListener("click", onDoc);
  sync();
  return { sync, destroy() {
    document.removeEventListener("click", onDoc);
  } };
}
