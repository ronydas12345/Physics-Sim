/**
 * Shared lab chrome used by 1.1, 1.2, and later simulations:
 * Lab/Theory tabs, teacher view, challenge card, trial table, icon toolbar.
 */

import {
  CAMERA,
  CAMERA_LABELS,
  cameraModesFor,
  defaultCameraMode,
  normalizeCameraMode,
} from "/lib/camera.js";
import { fileForFormat, triggerDownload } from "/lib/export-trials.js";
import { PLANET_CHIP_ORDER, planetById, planetIcon } from "/lib/planets.js";

function iconSvg(name, inner) {
  return `<svg class="btn-icon btn-icon-${name}" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">${inner}</svg>`;
}

function iconReset() {
  return iconSvg(
    "reset",
    `<g class="icon-spin"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 4v6h6M20 20v-6h-6M5.5 9A7 7 0 0 1 19 8M18.5 15A7 7 0 0 1 5 16"/></g>`,
  );
}

function iconFullscreen() {
  return iconSvg(
    "fullscreen",
    `<g class="icon-expand"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5"/></g>`,
  );
}

function iconDownload() {
  return iconSvg(
    "download",
    `<g class="icon-drop"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 4v12m0 0 4-4m-4 4-4-4M5 19h14"/></g>`,
  );
}

const ACTION_ICONS = {
  play: iconSvg("play", `<path class="icon-playhead" fill="currentColor" d="M8 5.5v13l11-6.5z"/>`),
  pause: iconSvg(
    "pause",
    `<rect class="icon-bar-l" x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect class="icon-bar-r" x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>`,
  ),
  step: iconSvg(
    "step",
    `<path class="icon-playhead" fill="currentColor" d="M5 6v12l8-6z"/><rect class="icon-tick" x="16" y="6" width="2.2" height="12" rx="1" fill="currentColor"/>`,
  ),
  launch: iconSvg(
    "launch",
    `<path class="icon-trail" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" pathLength="24" d="M4 18c4-1 7-6 9-11"/><circle class="icon-ball" cx="5.5" cy="17" r="2" fill="currentColor"/>`,
  ),
  check: iconSvg(
    "check",
    `<path class="icon-check" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" pathLength="24" d="M5 12.5 9.5 17 19 7"/>`,
  ),
  reset: iconReset(),
  record: iconSvg(
    "record",
    `<rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle class="icon-dot" cx="12" cy="12" r="2.4" fill="currentColor"/>`,
  ),
  clear: iconSvg(
    "clear",
    `<path class="icon-wipe" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M7 7l10 10M17 7 7 17"/>`,
  ),
  "nudge-left": iconSvg(
    "nudge-left",
    `<path class="icon-chevron" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M14 5 7 12l7 7"/>`,
  ),
  "nudge-right": iconSvg(
    "nudge-right",
    `<path class="icon-chevron" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M10 5l7 7-7 7"/>`,
  ),
  add: iconSvg(
    "add",
    `<path class="icon-plus" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M12 5v14M5 12h14"/>`,
  ),
  friction: iconSvg(
    "friction",
    `<path class="icon-scrape" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M4 16h16M6 12l3 4M11 10l3 6M16 9l3 7"/>`,
  ),
  reveal: iconSvg(
    "reveal",
    `<path fill="none" stroke="currentColor" stroke-width="1.8" d="M2.8 12S6.5 6 12 6s9.2 6 9.2 6-3.7 6-9.2 6S2.8 12 2.8 12z"/><circle class="icon-pupil" cx="12" cy="12" r="2.4" fill="currentColor"/>`,
  ),
  shuffle: iconSvg(
    "shuffle",
    `<g class="icon-swap"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 8h7l9-4M4 16h7l9 4M17 5l3-1-1 3M17 19l3 1-1-3"/></g>`,
  ),
  howto: iconSvg(
    "howto",
    `<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M5 5h10a2 2 0 0 1 2 2v12H7a2 2 0 0 0-2 2V5z"/><path class="icon-page" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M9 9h6M9 13h6"/>`,
  ),
  guided: iconSvg(
    "guided",
    `<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path class="icon-needle" fill="currentColor" d="M12 5.5 14.2 12 12 18.5 9.8 12z"/>`,
  ),
  prev: iconSvg(
    "prev",
    `<path class="icon-chevron" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M14 5 7 12l7 7"/>`,
  ),
  next: iconSvg(
    "next",
    `<path class="icon-chevron" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M10 5l7 7-7 7"/>`,
  ),
  fullscreen: iconFullscreen(),
  download: iconDownload(),
  open: iconSvg(
    "open",
    `<path class="icon-arrow" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h12m0 0-4-4m4 4-4 4"/>`,
  ),
  go: iconSvg(
    "go",
    `<path class="icon-arrow" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h12m0 0-4-4m4 4-4 4"/>`,
  ),
  close: iconSvg(
    "close",
    `<path class="icon-x" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M7 7l10 10M17 7 7 17"/>`,
  ),
};

function actionOf(el) {
  const id = el.id || "";
  if (id === "btn-play") return "play";
  if (id === "btn-pause") return "pause";
  if (id === "btn-step") return "step";
  if (id === "btn-launch") return "launch";
  if (id === "btn-reset" || id === "btn-reset-run") return "reset";
  if (id === "btn-record") return "record";
  if (id === "btn-clear" || id === "btn-clear-horiz" || id === "btn-clear-extra") return "clear";
  if (id.startsWith("btn-check")) return "check";
  if (id === "nudge-neg") return "nudge-left";
  if (id === "nudge-pos") return "nudge-right";
  if (id === "btn-add-force" || id === "btn-add-extra") return "add";
  if (id === "btn-enable-friction") return "friction";
  if (id === "btn-reveal") return "reveal";
  if (id === "btn-new-target") return "shuffle";
  if (id === "btn-howto") return "howto";
  if (id === "btn-guided") return "guided";
  if (id === "tutorial-prev") return "prev";
  if (id === "tutorial-next") return "next";
  if (id === "tutorial-close") return "close";
  if (id === "tutorial-restart") return "reset";
  if (id === "btn-fullscreen") return "fullscreen";
  if (id === "btn-download") return "download";
  if (el.matches?.("a.btn.primary")) return "open";
  if (el.matches?.("a.btn.ghost-paper")) return "go";
  if (el.hasAttribute("data-derive")) return "reveal";
  return "";
}

export function decorateActionButtons(root = document) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll("button.btn, a.btn, button.icon-btn, #tutorial-close, #tutorial-restart").forEach((el) => {
    if (el.dataset.iconified === "1") return;
    const action = actionOf(el);
    if (!action) return;
    el.dataset.iconified = "1";
    el.dataset.action = action;
    el.classList.add("has-icon", `action-${action}`);
    const icon = ACTION_ICONS[action];
    if (!icon) return;
    if (el.querySelector("svg")) {
      el.querySelector("svg")?.classList.add("btn-icon", `btn-icon-${action}`);
      return;
    }
    const label = el.innerHTML.trim();
    el.innerHTML = el.id === "tutorial-close" ? icon : `${icon}<span class="btn-label">${label}</span>`;
  });
}

export function setButtonLabel(el, text) {
  if (!el) return;
  const label = el.querySelector(".btn-label");
  if (label) label.textContent = text;
  else el.textContent = text;
}

export function labIconToolbar() {
  return `
    <div class="icon-toolbar" role="group" aria-label="Lab tools">
      <button type="button" class="icon-btn action-reset" id="btn-reset" title="Reset" aria-label="Reset">${iconReset()}</button>
      <button type="button" class="icon-btn action-fullscreen" id="btn-fullscreen" title="Fullscreen" aria-label="Fullscreen">${iconFullscreen()}</button>
      <div class="download-menu">
        <button type="button" class="icon-btn action-download" id="btn-download" title="Download trials" aria-label="Download trials" aria-haspopup="menu" aria-expanded="false" disabled>${iconDownload()}</button>
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
      <div class="graph-toggles" role="group" aria-label="Recorded graph overlays">
        <label><input type="checkbox" id="toggle-identity" /> Show exact identity (solid line)</label>
      </div>
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
          <p class="muted">Record after an investigation so the table and graphs belong to you. A fit appears once two trials have different x-values.</p>
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

export function bindIdentityToggle(root, onChange) {
  const toggle = root.querySelector("#toggle-identity");
  toggle?.addEventListener("change", () => onChange?.(toggle.checked));
  return () => Boolean(toggle?.checked);
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

export function bindResetButtons(root, onReset) {
  if (!root || typeof onReset !== "function") return () => {};
  const buttons = [...root.querySelectorAll("#btn-reset, #btn-reset-run")];
  buttons.forEach((btn) => btn.addEventListener("click", onReset));
  return () => buttons.forEach((btn) => btn.removeEventListener("click", onReset));
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

export function planetPresetControls({ switchClass = "switch light" } = {}) {
  const chips = PLANET_CHIP_ORDER.map((id) => {
    const planet = planetById(id);
    if (!planet) return "";
    return `<button type="button" class="chip${id === "earth" ? " active" : ""}" data-planet="${id}">${planetIcon(id)}${planet.name}</button>`;
  }).join("");
  return `
    <div class="presets planet-chips" role="group" aria-label="Planetary gravity">
      ${chips}
    </div>
    <label class="${switchClass} planet-bg-switch">
      <input id="planet-backgrounds" type="checkbox" checked />
      <span>Planet backgrounds</span>
    </label>
    <p class="track-help">A selected world paints its sky and ground. Custom g keeps the gray lab scene.</p>
  `;
}

function cameraIcon(mode) {
  const marks = {
    fit: `<path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M3 6V3h3M13 6V3h-3M3 10v3h3M13 10v3h-3"/>`,
    origin: `<path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M8 2v12M2 8h12"/><circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" stroke-width="1.4"/>`,
    follow: `<circle cx="6.1" cy="8" r="2.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M9.1 8h4.3m0 0-1.6-1.6M13.4 8l-1.6 1.6"/>`,
    stationary: `<rect x="4.2" y="7" width="7.6" height="6" rx="1.1" fill="none" stroke="currentColor" stroke-width="1.5"/><path fill="none" stroke="currentColor" stroke-width="1.5" d="M5.8 7V5.4a2.2 2.2 0 0 1 4.4 0V7"/>`,
  };
  const inner = marks[mode];
  if (!inner) return "";
  return `<svg class="chip-icon cam-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">${inner}</svg>`;
}

/** Chip row for current and future labs. Pass the number of objects, not markers. */
export function cameraModeControls(objectCount) {
  const modes = cameraModesFor(objectCount);
  const selected = defaultCameraMode(objectCount);
  const buttons = modes
    .map((mode) => {
      const active = mode === selected ? " active" : "";
      return `<button type="button" class="chip${active}" data-camera="${mode}">${cameraIcon(mode)}${CAMERA_LABELS[mode]}</button>`;
    })
    .join("");
  return `
    <div class="control" id="camera-controls">
      <div class="control-head"><span>Camera</span></div>
      <div class="presets" role="group" aria-label="Camera">
        ${buttons}
      </div>
    </div>
  `;
}

export function bindCameraMode(root, { objectCount, rangeForLock, onChange } = {}) {
  const count = Math.max(1, Number(objectCount) || 1);
  let mode = defaultCameraMode(count);
  let lock = null;

  function syncChips() {
    root.querySelectorAll("[data-camera]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.camera === mode);
    });
  }

  function setMode(next) {
    const allowed = normalizeCameraMode(next, count);
    if (allowed === CAMERA.STATIONARY && mode !== CAMERA.STATIONARY) {
      const range = rangeForLock?.();
      if (range && Number.isFinite(range.lo) && Number.isFinite(range.hi) && range.hi > range.lo) {
        lock = { lo: range.lo, hi: range.hi };
      } else {
        lock = null;
      }
    } else if (allowed !== CAMERA.STATIONARY) {
      lock = null;
    }
    mode = allowed;
    syncChips();
    onChange?.(mode);
    return mode;
  }

  root.querySelectorAll("[data-camera]").forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.camera));
  });
  syncChips();

  return {
    get mode() {
      return mode;
    },
    options(extra = {}) {
      return {
        mode,
        lockLo: lock?.lo,
        lockHi: lock?.hi,
        ...extra,
      };
    },
  };
}
