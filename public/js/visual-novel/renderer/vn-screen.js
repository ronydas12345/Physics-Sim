import { LAB_EVENTS } from "../../shared/lab-events.js";
import { createNarrativeSession } from "../engine/narrative-engine.js";
import { projectileArrivalStory } from "../stories/projectile-motion/arrival.js";
import { backgroundMarkup } from "./backgrounds.js";
import { spriteMarkup, spriteSvg } from "./sprites.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function vnScreenMarkup(story = projectileArrivalStory) {
  const actors = Object.entries(story.characters || {})
    .map(([id, character]) =>
      spriteMarkup(id, { expression: "neutral", position: character.position || "left", name: character.name }),
    )
    .join("");
  return `
    <section class="vn-screen" data-vn-root>
      ${backgroundMarkup(story.scenes[story.start]?.background)}
      <div class="vn-veil" data-vn-veil></div>
      <div class="vn-stage" data-vn-stage>${actors}</div>
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
    </section>`;
}

function reducedMotion() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  let lastScene = "";
  let veilTimer = 0;

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
      if (show && wasHidden && !reducedMotion()) {
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
    if (reducedMotion() || view.transition !== "fade") {
      apply();
      return;
    }
    veil?.classList.add("is-on");
    clearTimeout(veilTimer);
    veilTimer = window.setTimeout(apply, 180);
  }

  function paint() {
    const view = session.view();
    swapBackground(view);
    if (speakerEl) speakerEl.textContent = view.speaker || "—";
    if (lineEl) lineEl.textContent = view.text;
    paintPortrait(view);
    paintActors(view);
    paintChoices(view);
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
    } else if (nextBtn) {
      nextBtn.textContent = "Continue";
      if (hintEl) hintEl.textContent = "Click, tap, or press Space to continue.";
    }
  }

  function step() {
    if (session.view().awaitingChoice) return;
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
  choicesEl?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-vn-choice]");
    if (!button) return;
    event.stopPropagation();
    session.choose(button.dataset.vnChoice);
    paint();
  });
  screen.addEventListener("click", (event) => {
    if (event.target.closest("[data-vn-next], [data-vn-choice]")) return;
    step();
  });
  window.addEventListener("keydown", onKey);
  paint();
  return () => {
    window.removeEventListener("keydown", onKey);
    clearTimeout(veilTimer);
  };
}

export function vnPrototypePage() {
  return `
    <article class="vn-page">
      <header class="vn-page-head">
        <p class="kicker">Visual novel prototype · Stage 2</p>
        <h1>The Incomplete Report</h1>
        <p>Placeholder sprites, six demonstration backgrounds, and a reconverging investigation choice. This is not THE QUIET VECTOR.</p>
        <p class="sim-nav"><a href="/simulations/module-1/1-5">Open 1.5 Projectile Motion</a> · <a href="/about" data-link>Help / About</a></p>
      </header>
      ${vnScreenMarkup()}
    </article>`;
}
