import { LAB_EVENTS } from "../../shared/lab-events.js";
import { createTypewriter } from "../controls/typewriter.js";
import { createNarrativeSession } from "../engine/narrative-engine.js";
import { projectileArrivalStory } from "../stories/projectile-motion/arrival.js";
import {
  AUTO_DELAYS,
  CHECKPOINT_LABELS,
  TEXT_SPEEDS,
  autoDelayMs,
  loadVnSettings,
  saveVnSettings,
  textSpeedMs,
} from "../settings/vn-settings.js";
import {
  VN_SLOT_COUNT,
  exportSaveJson,
  loadSaveBag,
  parseImportedSave,
  slotLabel,
  writeAutosave,
  writeSlot,
} from "../saves/vn-saves.js";
import { backgroundMarkup } from "./backgrounds.js";
import { spriteMarkup, spriteSvg } from "./sprites.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function reducedMotion() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function lineKey(view) {
  return `${view.sceneId}:${view.lineIndex}:${view.lastChoiceId || ""}:${view.complete ? "end" : "line"}`;
}

const HUD_PATHS = {
  menu: `<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M5 7h14M5 12h14M5 17h14"/>`,
  auto: `<path fill="currentColor" d="M7 6.5v11l9-5.5z"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M19 7v10"/>`,
  skip: `<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6 6l6 6-6 6M13 6l6 6-6 6"/>`,
  "skip-all": `<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 6l6 6-6 6M12 6l6 6-6 6"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M20 6v12"/>`,
  history: `<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M5 6h14v10H8l-3 3V6z"/><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M9 10h6M9 13h4"/>`,
  settings: `<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="none" stroke="currentColor" stroke-width="1.8" d="M12 4.5v2.2M12 17.3V20M4.5 12h2.2M17.3 12H20M6.4 6.4l1.6 1.6M16 16l1.6 1.6M17.6 6.4 16 8M8 16l-1.6 1.6"/>`,
  continue: `<path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M9 6l7 6-7 6"/>`,
  reveal: `<path fill="none" stroke="currentColor" stroke-width="1.8" d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.3" fill="currentColor"/>`,
  replay: `<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 5v5h5M19 19v-5h-5M6.5 10A7 7 0 0 1 19 9M17.5 14A7 7 0 0 1 5 15"/>`,
  close: `<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M7 7l10 10M17 7 7 17"/>`,
};

function hudButton(attrs, label, icon) {
  return `<button type="button" class="vn-hud-btn" ${attrs} title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"><svg class="vn-hud-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">${HUD_PATHS[icon]}</svg><span class="vn-hud-tip" aria-hidden="true">${escapeHtml(label)}</span></button>`;
}

function setHudLabel(button, label, icon) {
  if (!button) return;
  button.setAttribute("aria-label", label);
  button.title = label;
  const tip = button.querySelector(".vn-hud-tip");
  if (tip) tip.textContent = label;
  const svg = button.querySelector("svg");
  if (icon && svg && HUD_PATHS[icon]) svg.innerHTML = HUD_PATHS[icon];
}

export function vnScreenMarkup(story = projectileArrivalStory) {
  const actors = Object.entries(story.characters || {})
    .map(([id, character]) =>
      spriteMarkup(id, { expression: "neutral", position: character.position || "left", name: character.name }),
    )
    .join("");
  const speedOpts = Object.keys(TEXT_SPEEDS)
    .map((id) => `<option value="${id}">${id.replace("-", " ")}</option>`)
    .join("");
  const delayOpts = Object.keys(AUTO_DELAYS)
    .map((id) => `<option value="${id}">${id}</option>`)
    .join("");
  return `
    <section class="vn-screen" data-vn-root>
      <div class="vn-scene">
        ${backgroundMarkup(story.scenes[story.start]?.background)}
        <div class="vn-veil" data-vn-veil></div>
        <div class="vn-stage" data-vn-stage>${actors}</div>
        <div class="vn-hud" data-vn-ui>
          <p class="vn-checkpoint" data-vn-checkpoint hidden></p>
          <div class="vn-hud-actions">
            ${hudButton('data-vn-pause', "Menu", "menu")}
            ${hudButton('data-vn-auto aria-pressed="false"', "Auto", "auto")}
            ${hudButton("data-vn-skip", "Skip", "skip")}
            ${hudButton('data-vn-skip-all', "Skip all", "skip-all")}
            ${hudButton("data-vn-history", "History", "history")}
            ${hudButton("data-vn-settings", "Settings", "settings")}
          </div>
        </div>
      </div>
      <div class="vn-dialogue">
        <div class="vn-portrait" data-vn-portrait hidden></div>
        <div class="vn-dialogue-copy">
          <p class="vn-kicker">${escapeHtml(story.title)}</p>
          <p class="vn-speaker" data-vn-speaker></p>
          <p class="vn-line" data-vn-line></p>
          <div class="vn-choices" data-vn-choices hidden></div>
          <div class="vn-dialogue-bar">
            <p class="vn-hint" data-vn-hint>Click, tap, or press Space to continue.</p>
            ${hudButton("data-vn-next", "Continue", "continue")}
          </div>
        </div>
      </div>
      <aside class="vn-panel" data-vn-pause-panel hidden>
        <h2>Paused</h2>
        <p>Autosave keeps this chapter. Settings and the learning path use separate storage.</p>
        <button type="button" class="btn primary" data-vn-resume>Resume</button>
        <button type="button" class="btn ghost-paper" data-vn-open-saves>Save / Load</button>
        <button type="button" class="btn ghost-paper" data-vn-open-history>Dialogue history</button>
        <button type="button" class="btn ghost-paper" data-vn-open-settings>Settings</button>
        <a class="btn ghost-paper" href="/simulations/module-1/1-5" data-vn-back-lab>Return to 1.5</a>
        <a class="btn ghost-paper" href="/" data-link>Return to title</a>
      </aside>
      <aside class="vn-panel vn-saves-panel" data-vn-saves-panel hidden>
        <header class="vn-panel-head">
          <h2>Save / Load</h2>
          ${hudButton("data-vn-close-saves", "Close", "close")}
        </header>
        <p class="vn-save-note">Three manual slots plus autosave. Export a JSON file if you need to recover after clearing the browser.</p>
        <div class="vn-save-autosave" data-vn-autosave></div>
        <ol class="vn-save-slots" data-vn-slots></ol>
        <div class="vn-save-tools">
          <button type="button" class="btn ghost-paper" data-vn-import-btn>Import save</button>
          <input type="file" accept="application/json,.json" data-vn-import hidden />
        </div>
        <p class="vn-save-status" data-vn-save-status></p>
      </aside>
      <aside class="vn-panel vn-history-panel" data-vn-history-panel hidden>
        <header class="vn-panel-head">
          <h2>Dialogue history</h2>
          ${hudButton("data-vn-close-history", "Close", "close")}
        </header>
        <ol class="vn-history-list" data-vn-history-list></ol>
      </aside>
      <aside class="vn-panel vn-settings-panel" data-vn-settings-panel hidden>
        <header class="vn-panel-head">
          <h2>Settings</h2>
          ${hudButton("data-vn-close-settings", "Close", "close")}
        </header>
        <label>Text speed
          <select data-vn-text-speed>${speedOpts}</select>
        </label>
        <label>Auto delay
          <select data-vn-auto-delay>${delayOpts}</select>
        </label>
        <label>Dialogue size
          <input type="range" min="0.85" max="1.35" step="0.05" data-vn-text-scale />
        </label>
        <label>Dialogue box opacity
          <input type="range" min="0.7" max="1" step="0.02" data-vn-box-opacity />
        </label>
        <label class="vn-check">
          <input type="checkbox" data-vn-animate /> Character animation
        </label>
      </aside>
    </section>`;
}

export function mountVnScreen(root, { story = projectileArrivalStory, bus = null, mode = "immersive" } = {}) {
  const session = createNarrativeSession(story, { bus });
  const screen = root.querySelector("[data-vn-root]") || root;
  const bg = screen.querySelector("[data-vn-bg]");
  const veil = screen.querySelector("[data-vn-veil]");
  const speakerEl = screen.querySelector("[data-vn-speaker]");
  const lineEl = screen.querySelector("[data-vn-line]");
  const hintEl = screen.querySelector("[data-vn-hint]");
  const nextBtn = screen.querySelector("[data-vn-next]");
  const choicesEl = screen.querySelector("[data-vn-choices]");
  const portraitEl = screen.querySelector("[data-vn-portrait]");
  const checkpointEl = screen.querySelector("[data-vn-checkpoint]");
  const autoBtn = screen.querySelector("[data-vn-auto]");
  const historyList = screen.querySelector("[data-vn-history-list]");
  const panels = {
    pause: screen.querySelector("[data-vn-pause-panel]"),
    history: screen.querySelector("[data-vn-history-panel]"),
    settings: screen.querySelector("[data-vn-settings-panel]"),
    saves: screen.querySelector("[data-vn-saves-panel]"),
  };
  const saveStatus = screen.querySelector("[data-vn-save-status]");
  const importInput = screen.querySelector("[data-vn-import]");
  const tw = createTypewriter();
  let settings = loadVnSettings();
  let lastScene = "";
  let lastLine = "";
  let chapterCompleteSent = false;
  let veilTimer = 0;
  let autoArmedAt = 0;
  let raf = 0;
  let openPanel = null;

  function menuOpen() {
    return Boolean(openPanel);
  }

  function showPanel(name) {
    openPanel = name;
    for (const [id, el] of Object.entries(panels)) {
      if (el) el.hidden = id !== name;
    }
    autoArmedAt = 0;
    if (name === "history") paintHistory();
    if (name === "settings") syncSettingsForm();
    if (name === "saves") paintSaves();
  }

  function closePanels() {
    openPanel = null;
    for (const el of Object.values(panels)) {
      if (el) el.hidden = true;
    }
  }

  function applyChrome() {
    screen.style.setProperty("--vn-line-size", `${settings.textScale}`);
    screen.style.setProperty("--vn-box-opacity", String(settings.boxOpacity));
    autoBtn?.setAttribute("aria-pressed", String(settings.autoMode));
    autoBtn?.classList.toggle("is-on", settings.autoMode);
  }

  function syncSettingsForm() {
    const speed = screen.querySelector("[data-vn-text-speed]");
    const delay = screen.querySelector("[data-vn-auto-delay]");
    const scale = screen.querySelector("[data-vn-text-scale]");
    const opacity = screen.querySelector("[data-vn-box-opacity]");
    const animate = screen.querySelector("[data-vn-animate]");
    if (speed) speed.value = settings.textSpeed;
    if (delay) delay.value = settings.autoDelay;
    if (scale) scale.value = String(settings.textScale);
    if (opacity) opacity.value = String(settings.boxOpacity);
    if (animate) animate.checked = settings.animateSprites;
  }

  function persistSettings(patch) {
    settings = saveVnSettings({ ...settings, ...patch });
    applyChrome();
    if (patch.textSpeed == null) return;
    const view = session.view();
    const speed = reducedMotion() ? 0 : textSpeedMs(settings);
    const wasComplete = tw.view().complete;
    tw.start(view.text, speed, performance.now());
    if (wasComplete || speed === 0) tw.complete();
  }

  function paintActors(view) {
    screen.querySelectorAll("[data-actor]").forEach((el) => {
      const member = view.cast.find((entry) => entry.id === el.dataset.actor);
      const show = Boolean(member?.visible);
      const wasHidden = el.hidden;
      el.hidden = !show;
      if (!member) return;
      el.dataset.slot = member.position || "left";
      el.dataset.expression = member.expression || "neutral";
      el.classList.toggle("is-speaking", view.speakerId === member.id);
      el.classList.toggle("is-dim", show && view.speakerId && view.speakerId !== member.id);
      if (show && wasHidden && settings.animateSprites && !reducedMotion()) {
        el.classList.remove("is-exiting");
        el.classList.add("is-entering");
      }
      const key = `${member.id}:${member.expression}`;
      if (el.dataset.drawn !== key) {
        const name = el.querySelector(".vn-actor-name")?.outerHTML || `<p class="vn-actor-name">${escapeHtml(member.name)}</p>`;
        el.innerHTML = `${spriteSvg(member.id, member.expression)}${name}`;
        el.dataset.drawn = key;
      }
    });
  }

  function paintChoices(view) {
    if (!choicesEl || !nextBtn) return;
    const waiting = view.awaitingChoice;
    choicesEl.hidden = !waiting;
    nextBtn.hidden = waiting || false;
    if (!waiting) {
      choicesEl.innerHTML = "";
      return;
    }
    choicesEl.innerHTML = view.choices
      .map(
        (choice) =>
          `<button type="button" class="vn-choice" data-vn-choice="${escapeHtml(choice.id)}">${escapeHtml(choice.label)}</button>`,
      )
      .join("");
  }

  function paintPortrait(view) {
    if (!portraitEl) return;
    if (!view.speakerId) {
      portraitEl.hidden = true;
      portraitEl.innerHTML = "";
      return;
    }
    portraitEl.hidden = false;
    portraitEl.innerHTML = spriteSvg(view.speakerId, view.expression);
  }

  function swapBackground(view) {
    if (!bg || view.background === bg.dataset.bg) return;
    const apply = () => {
      bg.dataset.bg = view.background;
      veil?.classList.remove("is-on");
    };
    if (reducedMotion() || !settings.animateSprites || view.transition !== "fade") {
      apply();
      return;
    }
    veil?.classList.add("is-on");
    clearTimeout(veilTimer);
    veilTimer = window.setTimeout(apply, 180);
  }

  function persistAutosave() {
    writeAutosave(story.id, session.snapshot());
  }

  function applySave(raw, message) {
    if (!session.restore(raw)) {
      if (saveStatus) saveStatus.textContent = "That save could not be loaded.";
      return false;
    }
    lastLine = "";
    lastScene = "";
    chapterCompleteSent = Boolean(session.view().complete);
    persistAutosave();
    closePanels();
    paint();
    if (saveStatus) saveStatus.textContent = message || "";
    return true;
  }

  function confirmReplace() {
    return window.confirm("Replace the current story position? Manual slots stay. Learning progress is not changed.");
  }

  function paintSaves() {
    const bag = loadSaveBag(story.id);
    const autoHost = screen.querySelector("[data-vn-autosave]");
    const slotHost = screen.querySelector("[data-vn-slots]");
    if (autoHost) {
      autoHost.innerHTML = bag.autosave
        ? `<p>Autosave · ${escapeHtml(slotLabel(bag.autosave))}</p><button type="button" class="btn ghost-paper" data-vn-load-auto>Load autosave</button>`
        : `<p>No autosave yet.</p>`;
    }
    if (slotHost) {
      slotHost.innerHTML = Array.from({ length: VN_SLOT_COUNT }, (_, index) => {
        const entry = bag.slots[index];
        const load = entry ? `<button type="button" class="btn ghost-paper" data-vn-load-slot="${index}">Load</button>` : "";
        const exp = entry ? `<button type="button" class="btn ghost-paper" data-vn-export-slot="${index}">Export</button>` : "";
        return `<li><span>Slot ${index + 1} · ${escapeHtml(slotLabel(entry))}</span><span class="vn-save-actions"><button type="button" class="btn ghost-paper" data-vn-write-slot="${index}">Save</button>${load}${exp}</span></li>`;
      }).join("");
    }
  }

  function paintHistory() {
    if (!historyList) return;
    historyList.innerHTML = session.view().history
      .map((entry) => {
        const who = entry.speaker || "Narration";
        const choice = entry.choiceLabel
          ? `<p class="vn-history-choice">Chose: ${escapeHtml(entry.choiceLabel)}</p>`
          : "";
        return `<li><p class="vn-history-speaker">${escapeHtml(who)}</p><p>${escapeHtml(entry.text)}</p>${choice}</li>`;
      })
      .join("");
    historyList.scrollTop = historyList.scrollHeight;
  }

  function paintCheckpoint(view) {
    if (!checkpointEl) return;
    checkpointEl.hidden = false;
    if (view.complete) {
      checkpointEl.textContent = "Chapter complete";
      return;
    }
    const here = view.checkpoint ? CHECKPOINT_LABELS[view.checkpoint] || view.checkpoint : "";
    const next = view.nextCheckpoint
      ? CHECKPOINT_LABELS[story.scenes[view.nextCheckpoint]?.checkpoint] || view.nextCheckpoint
      : "";
    if (!next || next === here) {
      checkpointEl.textContent = here || "Chapter end";
      return;
    }
    checkpointEl.textContent = here ? `${here} · Next: ${next}` : `Next: ${next}`;
  }

  function beginLine(view, at = performance.now()) {
    const speed = reducedMotion() ? 0 : textSpeedMs(settings);
    tw.start(view.text, speed, at);
    if (speed === 0 || view.awaitingChoice || view.complete) tw.complete();
    autoArmedAt = 0;
    lastLine = lineKey(view);
  }

  function paint(at = performance.now()) {
    const view = session.view();
    if (lineKey(view) !== lastLine) beginLine(view, at);
    const typed = tw.tick(at);
    swapBackground(view);
    if (speakerEl) speakerEl.textContent = view.speaker || "—";
    if (lineEl) {
      lineEl.textContent = typed.text;
      lineEl.classList.toggle("is-typing", !typed.complete && !view.awaitingChoice);
    }
    paintPortrait(view);
    paintActors(view);
    paintChoices(view);
    paintCheckpoint(view);
    if (view.sceneId !== lastScene) {
      lastScene = view.sceneId;
      bus?.emit(LAB_EVENTS.STORY_SCENE_UNLOCKED, { storyId: view.storyId, sceneId: view.sceneId });
    }
    if (view.complete) {
      if (hintEl) hintEl.textContent = "Chapter complete. The lab stays available.";
      setHudLabel(nextBtn, "Replay", "replay");
      if (!chapterCompleteSent) {
        chapterCompleteSent = true;
        bus?.emit(LAB_EVENTS.STORY_CHAPTER_COMPLETED, { storyId: view.storyId });
      }
    } else if (view.waitingForLab) {
      if (view.waitFor === "lab-complete") {
        setHudLabel(nextBtn, "Go to Lab", "continue");
        if (hintEl) hintEl.textContent = "Finish the guided path on the Lab tab. This chapter continues after that run.";
      } else {
        setHudLabel(nextBtn, "Continue", "continue");
        if (hintEl) hintEl.textContent = "Launch on the lab to continue. Skip will not bypass this.";
      }
    } else if (view.awaitingChoice) {
      if (hintEl) hintEl.textContent = "Choose how to begin. Paths reconvene at the rails.";
    } else if (!typed.complete) {
      setHudLabel(nextBtn, "Reveal", "reveal");
      if (hintEl) hintEl.textContent = "Click to reveal the rest. Space also works.";
    } else {
      setHudLabel(nextBtn, "Continue", "continue");
      if (hintEl) hintEl.textContent = "Click, tap, or press Space to continue. A toggles auto.";
    }
  }

  function step() {
    if (menuOpen()) return;
    const view = session.view();
    if (!tw.view().complete && !view.awaitingChoice) {
      tw.complete();
      paint();
      return;
    }
    if (view.awaitingChoice) return;
    if (view.waitingForLab) {
      if (view.waitFor === "lab-complete") {
        bus?.emit(LAB_EVENTS.STORY_AWAITS_LAB, { storyId: view.storyId, sceneId: view.sceneId });
      }
      return;
    }
    if (view.complete) {
      if (!window.confirm("Replay from the start? Manual save slots are kept.")) return;
      chapterCompleteSent = false;
      session.reset();
      paint();
      return;
    }
    session.advance();
    persistAutosave();
    paint();
  }

  function loop(at) {
    const view = session.view();
    const typed = tw.tick(at);
    if (lineEl && lineKey(view) === lastLine) {
      lineEl.textContent = typed.text;
      lineEl.classList.toggle("is-typing", !typed.complete && !view.awaitingChoice);
    }
    if (
      settings.autoMode &&
      !menuOpen() &&
      typed.complete &&
      !view.awaitingChoice &&
      !view.waitingForLab &&
      !view.complete
    ) {
      if (!autoArmedAt) autoArmedAt = at;
      if (at - autoArmedAt >= autoDelayMs(settings)) {
        autoArmedAt = 0;
        session.advance();
        persistAutosave();
        paint(at);
      }
    } else if (!settings.autoMode || view.awaitingChoice || view.waitingForLab || menuOpen()) {
      autoArmedAt = 0;
    }
    raf = requestAnimationFrame(loop);
  }

  function screenLive() {
    if (mode === "immersive") return true;
    return !screen.closest("[hidden]");
  }

  function onKey(event) {
    if (!screenLive()) return;
    if (event.target.closest("input, textarea, select")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      if (menuOpen()) closePanels();
      else showPanel("pause");
      return;
    }
    if (menuOpen()) return;
    if (event.key === "a" || event.key === "A") {
      event.preventDefault();
      persistSettings({ autoMode: !settings.autoMode });
      return;
    }
    if (event.key === "h" || event.key === "H") {
      event.preventDefault();
      showPanel("history");
      return;
    }
    if (event.code !== "Space" && event.code !== "Enter") return;
    if (event.target.closest("button, a")) return;
    event.preventDefault();
    step();
  }

  screen.querySelector("[data-vn-pause]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (openPanel === "pause") closePanels();
    else showPanel("pause");
  });
  screen.querySelector("[data-vn-resume]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    closePanels();
  });
  autoBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    persistSettings({ autoMode: !settings.autoMode });
  });
  screen.querySelector("[data-vn-skip]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (menuOpen()) return;
    session.skipToCheckpoint();
    persistAutosave();
    paint();
  });
  screen.querySelector("[data-vn-skip-all]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (menuOpen()) return;
    session.skipAll();
    persistAutosave();
    paint();
  });
  screen.querySelector("[data-vn-history]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (openPanel === "history") closePanels();
    else showPanel("history");
  });
  screen.querySelector("[data-vn-open-history]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    showPanel("history");
  });
  screen.querySelector("[data-vn-settings]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (openPanel === "settings") closePanels();
    else showPanel("settings");
  });
  screen.querySelector("[data-vn-open-settings]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    showPanel("settings");
  });
  screen.querySelector("[data-vn-open-saves]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    showPanel("saves");
  });
  screen.querySelector("[data-vn-close-saves]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    closePanels();
  });
  screen.querySelector("[data-vn-import-btn]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    importInput?.click();
  });
  importInput?.addEventListener("click", (event) => event.stopPropagation());
  importInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const parsed = parseImportedSave(await file.text(), story);
    if (!parsed.ok) {
      if (saveStatus) saveStatus.textContent = parsed.error;
      showPanel("saves");
      return;
    }
    if (!confirmReplace()) return;
    applySave(parsed.snapshot, "Imported save loaded.");
  });
  panels.saves?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (event.target.closest("[data-vn-load-auto]")) {
      const auto = loadSaveBag(story.id).autosave;
      if (auto && confirmReplace()) applySave(auto, "Autosave loaded.");
      return;
    }
    const loadBtn = event.target.closest("[data-vn-load-slot]");
    if (loadBtn) {
      const entry = loadSaveBag(story.id).slots[Number(loadBtn.dataset.vnLoadSlot)];
      if (entry && confirmReplace()) applySave(entry, "Slot loaded.");
      return;
    }
    const writeBtn = event.target.closest("[data-vn-write-slot]");
    if (writeBtn) {
      const index = Number(writeBtn.dataset.vnWriteSlot);
      const existing = loadSaveBag(story.id).slots[index];
      if (existing && !window.confirm("Overwrite this slot?")) return;
      writeSlot(story.id, index, session.snapshot());
      if (saveStatus) saveStatus.textContent = `Saved to slot ${index + 1}.`;
      paintSaves();
      return;
    }
    const exportBtn = event.target.closest("[data-vn-export-slot]");
    if (exportBtn) {
      const index = Number(exportBtn.dataset.vnExportSlot);
      const entry = loadSaveBag(story.id).slots[index];
      if (!entry) return;
      const blob = new Blob([exportSaveJson(entry, `slot-${index + 1}`)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${story.id}-slot-${index + 1}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  });
  screen.querySelector("[data-vn-close-history]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    closePanels();
  });
  screen.querySelector("[data-vn-close-settings]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    closePanels();
  });
  screen.querySelector("[data-vn-text-speed]")?.addEventListener("change", (event) => {
    persistSettings({ textSpeed: event.target.value });
  });
  screen.querySelector("[data-vn-auto-delay]")?.addEventListener("change", (event) => {
    persistSettings({ autoDelay: event.target.value });
  });
  screen.querySelector("[data-vn-text-scale]")?.addEventListener("input", (event) => {
    persistSettings({ textScale: Number(event.target.value) });
  });
  screen.querySelector("[data-vn-box-opacity]")?.addEventListener("input", (event) => {
    persistSettings({ boxOpacity: Number(event.target.value) });
  });
  screen.querySelector("[data-vn-animate]")?.addEventListener("change", (event) => {
    persistSettings({ animateSprites: event.target.checked });
  });
  const backLab = screen.querySelector("[data-vn-back-lab]");
  if (mode === "tab" && backLab) {
    backLab.textContent = "Return to Lab";
    backLab.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closePanels();
      document.getElementById("tab-btn-lab")?.click();
    });
  }

  nextBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    step();
  });
  choicesEl?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-vn-choice]");
    if (!button) return;
    event.stopPropagation();
    session.choose(button.dataset.vnChoice);
    persistAutosave();
    paint();
  });
  screen.addEventListener("click", (event) => {
    if (event.target.closest("[data-vn-ui], .vn-panel, [data-vn-next], [data-vn-choice]")) return;
    if (menuOpen()) {
      closePanels();
      return;
    }
    step();
  });
  window.addEventListener("keydown", onKey);
  const stopBus = [];
  if (bus) {
    stopBus.push(
      bus.on(LAB_EVENTS.PROJECTILE_LAUNCHED, () => {
        session.notify("launch");
        persistAutosave();
        paint();
      }),
      bus.on(LAB_EVENTS.PROJECTILE_LANDED, () => {
        session.notify("land");
        persistAutosave();
        paint();
      }),
      bus.on(LAB_EVENTS.TRIAL_RECORDED, () => {
        session.notify("record-trial");
        persistAutosave();
        paint();
      }),
      bus.on(LAB_EVENTS.LAB_COMPLETED, () => {
        const waiting = session.view().waitingForLab && session.view().waitFor === "lab-complete";
        session.notify("lab-complete");
        if (!waiting) {
          persistAutosave();
          return;
        }
        session.advance();
        persistAutosave();
        paint();
        bus.emit(LAB_EVENTS.STORY_RESUMES, { storyId: story.id, sceneId: session.view().sceneId });
      }),
    );
  }

  applyChrome();
  syncSettingsForm();
  const auto = loadSaveBag(story.id).autosave;
  if (auto) session.restore(auto);
  paint();
  raf = requestAnimationFrame(loop);
  return () => {
    stopBus.forEach((off) => off());
    window.removeEventListener("keydown", onKey);
    clearTimeout(veilTimer);
    cancelAnimationFrame(raf);
  };
}

export function vnPrototypePage() {
  return `
    <article class="vn-page">
      <header class="vn-page-head">
        <p class="kicker">Visual novel prototype · Controls</p>
        <h1>The Incomplete Report</h1>
        <p>Text speed, auto, skip, history, and settings. This is not THE QUIET VECTOR.</p>
        <p class="sim-nav"><a href="/simulations/module-1/1-5">Open 1.5 Projectile Motion</a> · <a href="/about" data-link>Help / About</a></p>
      </header>
      ${vnScreenMarkup()}
    </article>`;
}
