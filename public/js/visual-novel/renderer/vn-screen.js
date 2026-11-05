import { LAB_EVENTS } from "../../shared/lab-events.js";
import { createNarrativeSession } from "../engine/narrative-engine.js";
import { projectileArrivalStory } from "../stories/projectile-motion/arrival.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function actorMarkup(id, character) {
  const side = character.position === "right" ? "right" : "left";
  return `
    <div class="vn-actor vn-actor-${side}" data-actor="${id}" data-expression="neutral" hidden>
      <div class="vn-actor-figure" aria-hidden="true"></div>
      <p class="vn-actor-name">${escapeHtml(character.name)}</p>
    </div>`;
}

export function vnScreenMarkup(story = projectileArrivalStory) {
  const actors = Object.entries(story.characters || {})
    .map(([id, character]) => actorMarkup(id, character))
    .join("");
  return `
    <section class="vn-screen" data-vn-root>
      <div class="vn-background" data-vn-bg data-bg="facility-exterior"></div>
      <div class="vn-stage" data-vn-stage>${actors}</div>
      <div class="vn-dialogue">
        <p class="vn-kicker">${escapeHtml(story.title)}</p>
        <p class="vn-speaker" data-vn-speaker></p>
        <p class="vn-line" data-vn-line></p>
        <div class="vn-dialogue-bar">
          <p class="vn-hint" data-vn-hint>Click, tap, or press Space to continue.</p>
          <button type="button" class="btn primary" data-vn-next>Continue</button>
        </div>
      </div>
    </section>`;
}

export function mountVnScreen(root, { story = projectileArrivalStory, bus = null } = {}) {
  const session = createNarrativeSession(story);
  const screen = root.querySelector("[data-vn-root]") || root;
  const bg = screen.querySelector("[data-vn-bg]");
  const speakerEl = screen.querySelector("[data-vn-speaker]");
  const lineEl = screen.querySelector("[data-vn-line]");
  const hintEl = screen.querySelector("[data-vn-hint]");
  const nextBtn = screen.querySelector("[data-vn-next]");
  let lastScene = "";

  function paint() {
    const view = session.view();
    if (bg && view.background !== bg.dataset.bg) {
      bg.classList.remove("is-enter");
      bg.dataset.bg = view.background;
      void bg.offsetWidth;
      bg.classList.add("is-enter");
    }
    if (speakerEl) speakerEl.textContent = view.speaker || "—";
    if (lineEl) lineEl.textContent = view.text;
    screen.querySelectorAll("[data-actor]").forEach((el) => {
      const active = Boolean(view.speakerId) && el.dataset.actor === view.speakerId;
      el.hidden = false;
      el.classList.toggle("is-speaking", active || !view.speakerId);
      if (active) el.dataset.expression = view.expression;
    });
    if (view.sceneId !== lastScene) {
      lastScene = view.sceneId;
      bus?.emit(LAB_EVENTS.STORY_SCENE_UNLOCKED, { storyId: view.storyId, sceneId: view.sceneId });
    }
    if (view.complete) {
      if (hintEl) hintEl.textContent = "Chapter prototype complete. The lab stays available.";
      if (nextBtn) nextBtn.textContent = "Replay";
      bus?.emit(LAB_EVENTS.STORY_CHAPTER_COMPLETED, { storyId: view.storyId });
    } else if (nextBtn) {
      nextBtn.textContent = "Continue";
      if (hintEl) hintEl.textContent = "Click, tap, or press Space to continue.";
    }
  }

  function step() {
    if (session.view().complete) session.reset();
    else session.advance();
    paint();
  }

  function onKey(event) {
    if (event.code !== "Space" && event.code !== "Enter") return;
    if (event.target.closest("input, textarea, select, button")) return;
    event.preventDefault();
    step();
  }

  nextBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    step();
  });
  screen.addEventListener("click", (event) => {
    if (event.target.closest("[data-vn-next]")) return;
    step();
  });
  window.addEventListener("keydown", onKey);
  paint();
  return () => window.removeEventListener("keydown", onKey);
}

export function vnPrototypePage() {
  return `
    <article class="vn-page">
      <header class="vn-page-head">
        <p class="kicker">Visual novel prototype · Stage 1</p>
        <h1>The Incomplete Report</h1>
        <p>A linear arrival scene for the projectile lab. Placeholder art only. This is not THE QUIET VECTOR.</p>
        <p class="sim-nav"><a href="/simulations/module-1/1-5">Open 1.5 Projectile Motion</a> · <a href="/about" data-link>Help / About</a></p>
      </header>
      ${vnScreenMarkup()}
    </article>`;
}
