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
      ${backgroundMarkup(story.scenes[story.start]?.background)}
      <div class="vn-veil" data-vn-veil></div>
      <div class="vn-stage" data-vn-stage>${actors}</div>
      <div class="vn-hud" data-vn-ui>
        <p class="vn-checkpoint" data-vn-checkpoint hidden></p>
        <div class="vn-hud-actions">
          <button type="button" class="vn-hud-btn" data-vn-pause>Menu</button>
          <button type="button" class="vn-hud-btn" data-vn-auto aria-pressed="false">Auto</button>
          <button type="button" class="vn-hud-btn" data-vn-skip>Skip</button>
          <button type="button" class="vn-hud-btn" data-vn-skip-all>Skip all</button>
          <button type="button" class="vn-hud-btn" data-vn-history>History</button>
          <button type="button" class="vn-hud-btn" data-vn-settings>Settings</button>
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
            <button type="button" class="btn primary" data-vn-next>Continue</button>
          </div>
        </div>
      </div>
      <aside class="vn-panel" data-vn-pause-panel hidden>
        <h2>Paused</h2>
        <p>Story progress is not saved yet. Settings still persist.</p>
        <button type="button" class="btn primary" data-vn-resume>Resume</button>
        <button type="button" class="btn ghost-paper" data-vn-open-history>Dialogue history</button>
        <button type="button" class="btn ghost-paper" data-vn-open-settings>Settings</button>
        <a class="btn ghost-paper" href="/simulations/module-1/1-5">Return to 1.5</a>
        <a class="btn ghost-paper" href="/" data-link>Return to title</a>
      </aside>
      <aside class="vn-panel vn-history-panel" data-vn-history-panel hidden>
        <header class="vn-panel-head">
          <h2>Dialogue history</h2>
          <button type="button" class="vn-hud-btn" data-vn-close-history aria-label="Close history">Close</button>
        </header>
        <ol class="vn-history-list" data-vn-history-list></ol>
      </aside>
      <aside class="vn-panel vn-settings-panel" data-vn-settings-panel hidden>
        <header class="vn-panel-head">
          <h2>Settings</h2>
          <button type="button" class="vn-hud-btn" data-vn-close-settings aria-label="Close settings">Close</button>
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

export function mountVnScreen(root, { story = projectileArrivalStory, bus = null } = {}) {
  const session = createNarrativeSession(story);
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
  };
  const tw = createTypewriter();
  let settings = loadVnSettings();
  let lastScene = "";
  let lastLine = "";
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
    const here = view.checkpoint ? CHECKPOINT_LABELS[view.checkpoint] || view.checkpoint : "";
    const next = view.nextCheckpoint
      ? CHECKPOINT_LABELS[story.scenes[view.nextCheckpoint]?.checkpoint] || view.nextCheckpoint
      : "Chapter end";
    if (view.complete) {
      checkpointEl.hidden = false;
      checkpointEl.textContent = "Chapter complete";
      return;
    }
    checkpointEl.hidden = false;
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
      if (hintEl) hintEl.textContent = "Chapter prototype complete. The lab stays available.";
      if (nextBtn) nextBtn.textContent = "Replay";
      bus?.emit(LAB_EVENTS.STORY_CHAPTER_COMPLETED, { storyId: view.storyId });
    } else if (view.awaitingChoice) {
      if (hintEl) hintEl.textContent = "Choose how to begin. Paths reconvene at the rails.";
    } else if (!typed.complete) {
      if (nextBtn) nextBtn.textContent = "Reveal";
      if (hintEl) hintEl.textContent = "Click to reveal the rest. Space also works.";
    } else if (nextBtn) {
      nextBtn.textContent = "Continue";
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
    if (view.complete) session.reset();
    else session.advance();
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
      !view.complete
    ) {
      if (!autoArmedAt) autoArmedAt = at;
      if (at - autoArmedAt >= autoDelayMs(settings)) {
        autoArmedAt = 0;
        session.advance();
        paint(at);
      }
    } else if (!settings.autoMode || view.awaitingChoice || menuOpen()) {
      autoArmedAt = 0;
    }
    raf = requestAnimationFrame(loop);
  }

  function onKey(event) {
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
    paint();
  });
  screen.querySelector("[data-vn-skip-all]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (menuOpen()) return;
    session.skipAll();
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

  nextBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    step();
  });
  choicesEl?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-vn-choice]");
    if (!button) return;
    event.stopPropagation();
    session.choose(button.dataset.vnChoice);
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
  applyChrome();
  syncSettingsForm();
  paint();
  raf = requestAnimationFrame(loop);
  return () => {
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
