import { availableCount, getModule, modules, projectileSim, statusLabel } from "./curriculum.js";
import { moduleCards, statusBadge } from "./chrome.js";

export function homePage() {
  const first = modules[0].simulations[0];
  return `
    <section class="hero">
      <div>
        <p class="kicker">Interactive AP Physics 1 simulations</p>
        <h1>Explore physics through models, experiments, and visualizations.</h1>
        <p class="lede">A curriculum-organized lab for kinematics through fluids. Start with one dimension, then build toward two-dimensional motion.</p>
        <div class="hero-actions">
          <a class="btn primary" href="/simulations" data-link>Explore Simulations</a>
          <a class="btn ghost-paper" href="/simulations/module-1" data-link>Start with Module 1</a>
        </div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <svg viewBox="0 0 320 180">
          <line x1="24" y1="150" x2="296" y2="150" stroke="#5a4634" stroke-width="6"/>
          <path d="M40 150 Q 140 18 260 150" fill="none" stroke="#c45c26" stroke-width="3"/>
          <circle cx="40" cy="150" r="8" fill="#f0a202"/>
          <circle cx="168" cy="72" r="8" fill="#f0a202"/>
        </svg>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Curriculum modules</h2>
        <p>All eight AP Physics 1 units are listed. Available labs can be opened; the rest stay visible as the map of what is coming.</p>
      </div>
      <div class="module-grid">${moduleCards()}</div>
    </section>

    <section class="featured-row">
      <article class="featured-card">
        <p class="kicker">Featured · ${first.number}</p>
        <h2>${first.title}</h2>
        <p>${first.description}</p>
        <a class="btn primary" href="${first.path}" data-link>Open Simulation</a>
      </article>
      <article class="featured-card legacy">
        <p class="kicker">${projectileSim.badge}</p>
        <h2>${projectileSim.title}</h2>
        <p>${projectileSim.description} Kept available while two-dimensional kinematics is built out.</p>
        <p class="muted">Migration pending · not labeled as 1.1</p>
        <a class="btn ghost-paper" href="${projectileSim.path}">Open →</a>
      </article>
    </section>
  `;
}

export function libraryPage() {
  return `
    <header class="page-head">
      <p class="kicker">Simulation library</p>
      <h1>Simulations</h1>
      <p>Organized by AP Physics 1 module. Open an available lab, or browse planned topics to see the full sequence.</p>
    </header>
    ${modules
      .map((mod) => {
        const extra =
          mod.id === 1
            ? `<li class="topic-row">
                <div>
                  <strong>${projectileSim.title}</strong>
                  <span class="muted">Existing simulation · migration pending</span>
                </div>
                ${statusBadge("available", "Existing Simulation")}
                <a class="text-link" href="${projectileSim.path}">Open →</a>
              </li>`
            : "";
        return `
        <section class="library-module">
          <div class="library-mod-head">
            <div>
              <p class="kicker">Module ${mod.id}</p>
              <h2>${mod.title}</h2>
            </div>
            <p class="muted">${availableCount(mod)} of ${mod.simulations.length} available</p>
          </div>
          <ul class="topic-list">
            ${mod.simulations
              .map((sim) => {
                const open = sim.status === "available";
                return `<li class="topic-row ${open ? "" : "is-planned"}">
                  <div>
                    <strong>${sim.number} ${sim.title}</strong>
                  </div>
                  ${statusBadge(sim.status)}
                  ${open ? `<a class="text-link" href="${sim.path}" data-link>Open →</a>` : `<span class="muted">—</span>`}
                </li>`;
              })
              .join("")}
            ${extra}
          </ul>
        </section>`;
      })
      .join("")}
  `;
}

export function modulePage(id) {
  const mod = getModule(id);
  if (!mod) {
    return `<header class="page-head"><h1>Module not found</h1><p><a href="/simulations" data-link>Back to simulations</a></p></header>`;
  }
  const coming = mod.simulations.every((s) => s.status !== "available");
  return `
    <header class="page-head">
      <p class="kicker">Module ${mod.id}</p>
      <h1>${mod.title}</h1>
      <p>${mod.description}</p>
      ${coming ? `<p class="badge badge-coming-soon">Coming Soon</p>` : ""}
    </header>
    <ul class="topic-list">
      ${mod.simulations
        .map((sim) => {
          const open = sim.status === "available";
          return `<li class="topic-row ${open ? "" : "is-planned"}">
            <div>
              <strong>${sim.number} ${sim.title}</strong>
              <p class="muted">${sim.description || "This lab is planned for a later release."}</p>
            </div>
            ${statusBadge(sim.status)}
            ${open ? `<a class="btn primary" href="${sim.path}" data-link>Open</a>` : `<span class="muted">Not yet available</span>`}
          </li>`;
        })
        .join("")}
    </ul>
    ${
      mod.id === 1
        ? `<aside class="legacy-note card">
            <p class="kicker">Existing simulation</p>
            <h2>${projectileSim.title}</h2>
            <p>Migration pending. This is the original two-dimensional projectile lab, kept accessible until topic 1.5 is built.</p>
            <a class="btn ghost-paper" href="${projectileSim.path}">Open projectile lab →</a>
          </aside>`
        : ""
    }
  `;
}

export function aboutPage() {
  return `
    <header class="page-head">
      <p class="kicker">Help / About</p>
      <h1>How to use the platform</h1>
    </header>
    <article class="prose card">
      <h2>Navigation</h2>
      <p>Use <strong>Simulations</strong> to browse the curriculum. Module 1 currently includes Scalars and Vectors in One Dimension, plus the existing projectile-motion lab.</p>
      <h2>Reset and controls</h2>
      <p>Each available simulation has a Reset control in its toolbar. Optional panels can be shown or hidden without changing the physics.</p>
      <h2>Accuracy</h2>
      <p>Displayed values come from the same state that drives the visualization. Distance is the sum of path lengths, not the shortcut from start to finish.</p>
    </article>
  `;
}

export function notFoundPage() {
  return `<header class="page-head"><h1>Page not found</h1><p><a href="/" data-link>Return home</a></p></header>`;
}

export function sim11Page() {
  return `
    <section class="sim-shell">
      <header class="sim-header">
        <div>
          <p class="kicker">Module 1 · Simulation 1.1</p>
          <h1>Scalars and Vectors in One Dimension</h1>
          <p class="objective">Learning objective: Distinguish scalar quantities from vector quantities using position, distance, and displacement.</p>
        </div>
        <div class="sim-toolbar">
          <button type="button" class="btn ghost-paper" id="btn-reset-1d">Reset</button>
          <button type="button" class="btn ghost-paper" id="btn-full-1d">Fullscreen</button>
        </div>
      </header>

      <div class="sim-1d-layout">
        <section class="track-card">
          <canvas id="axis-canvas" width="960" height="220" aria-label="One-dimensional position axis"></canvas>
          <div class="track-help">Drag the object. Arrow keys also move it by 1 m.</div>
          <div class="track-controls">
            <div class="control">
              <div class="control-head"><span>Positive direction</span></div>
              <div class="presets" role="group" aria-label="Positive direction">
                <button type="button" class="chip active" id="dir-right">+ right</button>
                <button type="button" class="chip" id="dir-left">+ left</button>
              </div>
            </div>
            <div class="nudge-row">
              <button type="button" class="btn ghost-paper" id="nudge-neg">−1 m</button>
              <label class="pos-input">
                Position
                <input id="pos-input" type="number" step="0.5" min="-12" max="12" value="0" />
                <span>m</span>
              </label>
              <button type="button" class="btn ghost-paper" id="nudge-pos">+1 m</button>
            </div>
            <div class="panel-toggles">
              <label class="switch"><input id="toggle-values" type="checkbox" checked /> Values</label>
              <label class="switch"><input id="toggle-vectors" type="checkbox" checked /> Vector arrows</label>
              <label class="switch"><input id="toggle-explain" type="checkbox" checked /> Explanations</label>
            </div>
          </div>
        </section>

        <aside class="rail">
          <section class="card values-card" id="values-panel">
            <h2>Quantities</h2>
            <dl class="metrics">
              <div>
                <dt>Position <span class="tag">vector</span></dt>
                <dd id="read-x">0 m</dd>
              </div>
              <div>
                <dt>Displacement <span class="tag">vector</span></dt>
                <dd id="read-dx">0 m <span id="dx-arrow" class="dir-glyph"></span></dd>
              </div>
              <div>
                <dt>Distance traveled <span class="tag tag-scalar">scalar</span></dt>
                <dd id="read-d">0 m</dd>
              </div>
            </dl>
            <p class="caption">Distance never carries a sign. Displacement does.</p>
          </section>

          <section class="card notes-card" id="explain-panel">
            <h2>Scalars and vectors</h2>
            <h3>Scalars</h3>
            <p>A scalar has magnitude only. Distance, speed, and time are scalars.</p>
            <h3>Vectors</h3>
            <p>A vector has magnitude and direction. Displacement, velocity, and acceleration are vectors.</p>
            <h3>One-dimensional sign convention</h3>
            <p>In one dimension, direction can be written as a sign. Right is usually chosen as positive:</p>
            <p class="eq-block">+ = right<br />− = left</p>
            <p>That choice is a convention. Reversing it changes the signs you read, not the object’s actual motion on the track.</p>
            <h3>Try this</h3>
            <p>Start at 0, move to +5 m, then to +2 m. Distance should be 8 m while displacement is only +2 m.</p>
          </section>
        </aside>
      </div>
    </section>
  `;
}
