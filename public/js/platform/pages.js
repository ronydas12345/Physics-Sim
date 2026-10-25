import { LAB_FEATURES, availableCount, getModule, modules, projectileSim } from "./curriculum.js";
import { moduleCards, statusBadge } from "./chrome.js";
import {
  challengeCard,
  cameraModeControls,
  labIconToolbar,
  labTablist,
  planetPresetControls,
  teacherSwitch,
  theoryLink,
  trialSection,
} from "./lab-kit.js";
import { eqLines, eqVar, S, theoryPage } from "./theory-visuals.js";

export function homePage() {
  const first = modules[0].simulations[0];
  const motion = modules[0].simulations[1];
  const twoD = projectileSim;
  return `
    <section class="hero">
      <div>
        <p class="kicker">Interactive AP Physics 1 simulations</p>
        <h1>A lab for every unit, built around one shared model of how students should investigate.</h1>
        <p class="lede">
          This platform is not a collection of disconnected demos. Each simulation is a classroom investigation:
          a controllable physical model, live measurements, a Theory tab for the identities behind the motion,
          optional Challenge mode, and a Teacher view that compares the animation to the equations.
        </p>
        <div class="hero-actions">
          <a class="btn primary" href="/simulations" data-link>Explore Simulations</a>
          <a class="btn ghost-paper" href="/simulations/module-1" data-link>Start with Kinematics</a>
        </div>
      </div>
      <div class="hero-visual">
        <canvas id="hero-reel" width="640" height="360" aria-hidden="true"></canvas>
        <a class="hero-reel-copy" id="hero-reel-link" href="${modules[0].path}" data-link>
          <p class="kicker" id="hero-reel-kicker">Unit ${modules[0].id}</p>
          <p class="hero-reel-title" id="hero-reel-title">Kinematics</p>
        </a>
        <div class="hero-reel-dots" role="tablist" aria-label="AP Physics 1 units">
          ${modules
            .map(
              (mod, i) =>
                `<button type="button" class="hero-reel-dot${i === 0 ? " is-active" : ""}" data-hero-unit="${i}" role="tab" aria-selected="${i === 0 ? "true" : "false"}" aria-label="Unit ${mod.id}: ${mod.title}"></button>`,
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="featured-row">
      <article class="featured-card">
        <p class="kicker">Start here · ${first.number}</p>
        <h2>${first.title}</h2>
        <p>${first.description} Distance is path length; displacement is the shortcut with a sign. Use Challenge mode to hit both at once.</p>
        <a class="btn primary" href="${first.path}" data-link>Open 1.1</a>
      </article>
      <article class="featured-card">
        <p class="kicker">Next · ${motion.number}</p>
        <h2>${motion.title}</h2>
        <p>${motion.description} Play constant velocity, speeding up, and slowing down until the object reverses. Graphs update while it moves.</p>
        <a class="btn ghost-paper" href="${motion.path}" data-link>Open 1.2</a>
      </article>
      <article class="featured-card">
        <p class="kicker">Unit 1 · ${twoD.number}</p>
        <h2>${twoD.title}</h2>
        <p>${twoD.description} This is the launch-angle lab: equal heights, no air resistance, 45° for maximum range.</p>
        <a class="btn ghost-paper" href="${twoD.path}">Open 1.5</a>
      </article>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>What this application is for</h2>
        <p>
          AP Physics 1 asks students to describe motion, then explain it with forces, energy, momentum, rotation, and fluids.
          The labs follow that sequence. You change a variable, watch a physically consistent model respond, record trials,
          and only then open Theory to see why the pattern appeared. Displayed numbers come from the same state that draws
          the animation — never from a hard-coded caption.
        </p>
      </div>
      <div class="how-grid">
        ${LAB_FEATURES.map(
          (item) => `
          <article class="how-card">
            <p class="kicker">${item.title}</p>
            <p>${item.blurb}</p>
          </article>`,
        ).join("")}
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>How a lab is structured</h2>
        <p>
          Every available simulation, including 1.1–1.4 and 2.1–2.9, uses the same shell so later units do not invent a new interface.
          Future labs inherit Theory, Challenge, Teacher view, trial tables, graphs, Reset, and auto-record from this pattern.
        </p>
      </div>
      <ol class="lab-steps">
        <li><strong>Investigate in the Lab tab.</strong> Drag, launch, or nudge the system. Live measurements update from the physics engine, not from a separate calculator.</li>
        <li><strong>Record trials.</strong> Build a data table and graphs from your own runs. Auto-record can capture a trial when an experiment finishes.</li>
        <li><strong>Turn on Challenge mode</strong> when you want a target with the answer hidden until you check or launch.</li>
        <li><strong>Open Theory</strong> for sign conventions, component splits, worked examples, and predicted curves.</li>
        <li><strong>Enable Teacher view</strong> to line simulated values up next to closed-form identities without changing what students see by default.</li>
      </ol>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Curriculum modules</h2>
        <p>All eight AP Physics 1 units stay visible. Open a module when at least one lab is available; the rest remain as the map of what is coming.</p>
      </div>
      <div class="module-grid">${moduleCards()}</div>
    </section>
  `;
}

export function libraryPage() {
  return `
    <header class="page-head">
      <p class="kicker">Simulation library</p>
      <h1>Simulations</h1>
      <p>Organized by AP Physics 1 unit. Open an available lab, or browse planned topics to see the full sequence.</p>
    </header>
    ${modules
      .map(
        (mod) => `
        <section class="library-module">
          <div class="library-mod-head">
            <div>
              <p class="kicker">Unit ${mod.id}</p>
              <h2>${mod.title}</h2>
            </div>
            <p class="muted">${availableCount(mod)} of ${mod.simulations.length} available</p>
          </div>
          <ul class="topic-list">
            ${mod.simulations
              .map((sim) => {
                const open = sim.status === "available";
                const intercept = sim.fullPage ? "" : " data-link";
                return `<li class="topic-row ${open ? "" : "is-planned"}">
                  <div>
                    <strong>${sim.number} ${sim.title}</strong>
                    ${sim.description ? `<p class="muted">${sim.description}</p>` : ""}
                  </div>
                  ${statusBadge(sim.status)}
                  ${open ? `<a class="text-link" href="${sim.path}"${intercept}>Open →</a>` : `<span class="muted">—</span>`}
                </li>`;
              })
              .join("")}
          </ul>
        </section>`,
      )
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
      <p class="kicker">Unit ${mod.id}</p>
      <h1>${mod.title}</h1>
      <p>${mod.description}</p>
      ${coming ? `<p class="badge badge-coming-soon">Coming Soon</p>` : ""}
    </header>
    <ul class="topic-list">
      ${mod.simulations
        .map((sim) => {
          const open = sim.status === "available";
          const intercept = sim.fullPage ? "" : " data-link";
          return `<li class="topic-row ${open ? "" : "is-planned"}">
            <div>
              <strong>${sim.number} ${sim.title}</strong>
              <p class="muted">${sim.description || "This lab is planned for a later release."}</p>
            </div>
            ${statusBadge(sim.status)}
            ${open ? `<a class="btn primary" href="${sim.path}"${intercept}>Open</a>` : `<span class="muted">Not yet available</span>`}
          </li>`;
        })
        .join("")}
    </ul>
  `;
}

function faqItem(question, answer) {
  return `
        <details class="faq-item">
          <summary>${question}</summary>
          <p>${answer}</p>
        </details>`;
}

export function aboutPage() {
  return `
    <header class="page-head">
      <p class="kicker">Help / About</p>
      <h1>How to use the platform</h1>
      <p>
        This is a classroom lab for AP Physics 1, not a collection of disconnected demos. You change a variable,
        watch a physically consistent model respond, record your own trials, and only then open Theory to see why
        the pattern appeared.
      </p>
      <div class="hero-actions">
        <a class="btn primary" href="/simulations" data-link>Browse simulations</a>
        <a class="btn ghost-paper" href="/simulations/module-1/1-1" data-link>Start with 1.1</a>
      </div>
    </header>

    <section class="section">
      <div class="section-head">
        <h2>What lives in every lab</h2>
        <p>Available labs share one shell so Unit 2 feels like Unit 1. Displayed numbers come from the same state that draws the animation.</p>
      </div>
      <div class="how-grid">
        ${LAB_FEATURES.map(
          (item) => `
          <article class="how-card">
            <p class="kicker">${item.title}</p>
            <p>${item.blurb}</p>
          </article>`,
        ).join("")}
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>How a lab is structured</h2>
      </div>
      <ol class="lab-steps">
        <li><strong>Investigate in the Lab tab.</strong> Drag, launch, or nudge the system. Live measurements update from the physics engine.</li>
        <li><strong>Record trials.</strong> Build a data table and graphs from your own runs. Auto-record can capture a trial when a run finishes.</li>
        <li><strong>Turn on Challenge mode</strong> when you want a target with the answer hidden until you check or launch.</li>
        <li><strong>Open Theory</strong> for sign conventions, worked examples, and predicted curves.</li>
        <li><strong>Enable Teacher view</strong> to line simulated values up next to closed-form identities without changing the student model.</li>
      </ol>
    </section>

    <section class="section about-tools">
      <article class="prose card">
        <h2>Navigation</h2>
        <p>
          Use <strong>Simulations</strong> to browse by AP Physics 1 unit. Unit 1 currently includes 1.1–1.4.
          Unit 2 currently includes 2.1–2.9. Later units stay visible as the map of what is coming.
        </p>
        <h2>Shared tools</h2>
        <p>
          <strong>Appearance</strong> in the header switches beige paper, a cooler light theme, dark mode, or high contrast.
          The choice is saved in this browser and applies on every page, including tutorials.
        </p>
        <p>
          Header <strong>Reset</strong> and the playback-bar Reset both return the system to its initial condition.
          Recorded trials stay until you press Clear Trials. <strong>Fullscreen</strong> expands the page.
          <strong>Download</strong> exports the trial table as text, CSV, or Excel once you have recorded runs.
        </p>
        <h2>Camera</h2>
        <p>
          One-object labs can zoom from the origin, follow the object, or freeze the window. Labs with two or more objects
          can fit everything on screen, keep the origin in view, or stay stationary. Follow is off for those labs for now.
        </p>
        <h2>Tutorials</h2>
        <p>
          <strong>How to Use This Lab</strong> walks the interface. <strong>Guided Lab</strong> is the investigation:
          predict, run, and explain. Closing a tutorial does not reset the lab. Escape closes the overlay.
        </p>
        <h2>Accuracy</h2>
        <p>
          Displayed values come from the same state that drives the visualization. Distance is the sum of path lengths,
          not the shortcut from start to finish. Projectile range, height, and flight time come from the numerical stepper
          that also draws the trajectory.
        </p>
      </article>
    </section>

    <section class="section faq-section">
      <div class="section-head">
        <h2>FAQ</h2>
        <p>Open a question to see the short answer. These are the issues students and teachers hit first.</p>
      </div>
      <div class="faq-list">
        ${faqItem(
          "What is the difference between Lab and Theory?",
          "Lab is the experiment: you change a control and the model responds. Theory is the identities, sign conventions, and worked examples behind that motion. Use Lab first so the equations explain a pattern you already saw.",
        )}
        ${faqItem(
          "Why is the Challenge answer hidden?",
          "Challenge gives you a target and hides the solution until you run the experiment and press Check (or Launch in projectile). Reveal is for after you have a measurement, not a substitute for one.",
        )}
        ${faqItem(
          "What does Reset do, and why are there two?",
          "Both Reset buttons restore the initial conditions and clear running totals such as distance. The header Reset stays put; the second Reset sits after Auto-record and before Record Trial so you can restart a run without leaving the playback bar. Neither button deletes recorded trials.",
        )}
        ${faqItem(
          "How do I keep my data?",
          "Press Record Trial after a run, or turn on Auto-record so a finished run is captured for you. Clear Trials wipes the table and graphs. Download exports what you recorded as .txt, .csv, or Excel.",
        )}
        ${faqItem(
          "What do the camera options mean?",
          "Origin keeps x = 0 in view and zooms out if the object recedes. Follow tracks one object as it moves. Stationary freezes the window you are looking at. With two or more objects, Follow is not offered; Fit objects keeps everyone on screen instead.",
        )}
        ${faqItem(
          "What are How to Use This Lab and Guided Lab?",
          "How to Use is a short tour of buttons, graphs, and camera. Guided Lab is the physics investigation for that simulation. You can reopen either any time. Closing the panel does not reset the lab; Restart this tutorial does start that walkthrough over.",
        )}
        ${faqItem(
          "Why don’t the live numbers match the textbook formula exactly?",
          "The animation and the readouts share one numerical state. Identities on the Theory tab are the closed-form curves. Small differences are from the time stepper, rounding, or a trial that did not use the same conditions as the example. Teacher view places both side by side.",
        )}
        ${faqItem(
          "What keyboard shortcuts work?",
          "In most playback labs, Space plays or pauses. In 1.1, arrow keys nudge the object by 1 m. In the projectile lab, Space launches or pauses and R resets. Escape closes an open tutorial. Shortcuts are ignored while you are typing in a field.",
        )}
        ${faqItem(
          "Can I change how the site looks?",
          "Use Appearance in the header. Beige is the paper classroom look. Light is cooler gray. Dark is for dim rooms. High contrast uses thick borders and no decorative texture. The setting is stored in this browser only.",
        )}
        ${faqItem(
          "Why are later units listed if I cannot open them?",
          "The library is the full AP Physics 1 map. Units 1 and 2 have available labs through 2.5. Later topics stay visible as Coming Soon or Planned so the sequence is honest about what is still being built.",
        )}
      </div>
    </section>
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
          <p class="kicker">Unit 1 · Simulation 1.1</p>
          <h1>Scalars and Vectors in One Dimension</h1>
          <p class="objective">Learning objective: Distinguish scalar quantities from vector quantities using position, distance, and displacement.</p>
          <p class="sim-nav"><a href="/simulations/module-1" data-link>Module 1</a> · <a href="/simulations/module-1/1-2" data-link>1.2 →</a></p>
        </div>
        <div class="sim-toolbar">
          ${labIconToolbar()}
        </div>
      </header>

      ${labTablist()}

      <div id="panel-lab" role="tabpanel" aria-labelledby="tab-btn-lab">
        <div class="workspace">
          <section class="stage track-stage" aria-label="One-dimensional motion">
            <canvas id="axis-canvas" width="960" height="220" aria-label="One-dimensional position axis"></canvas>
            <div class="transport">
              <button type="button" class="btn" id="nudge-neg">−1 m</button>
              <button type="button" class="btn" id="nudge-pos">+1 m</button>
              <button type="button" class="btn primary" id="btn-check-1d">Check</button>
              <span class="transport-gap"></span>
              <label class="switch light">
                <input id="auto-record" type="checkbox" />
                Auto-record
              </label>
              <button type="button" class="btn" id="btn-reset-run">Reset</button>
              <button type="button" class="btn" id="btn-record">Record Trial</button>
              <button type="button" class="btn" id="btn-clear">Clear Trials</button>
            </div>
            <div class="track-controls">
              <div class="control">
                <div class="control-head"><span>Positive direction</span></div>
                <div class="presets" role="group" aria-label="Positive direction">
                  <button type="button" class="chip active" id="dir-right">+ right</button>
                  <button type="button" class="chip" id="dir-left">+ left</button>
                </div>
              </div>
              ${cameraModeControls(1)}
              <div class="nudge-row">
                <label class="pos-input">
                  Position
                  <input id="pos-input" type="number" step="0.5" min="-12" max="12" value="0" />
                  <span>m</span>
                </label>
                <label class="switch light"><input id="toggle-vectors" type="checkbox" checked /> Vector arrows</label>
              </div>
              <p class="track-help">Drag the object. Arrow keys move it by 1 m. Distance adds every segment of the path. Camera: Origin keeps x = 0 in view, Follow tracks the object, Stationary freezes the window.</p>
            </div>
          </section>

          <aside class="rail">
            <section class="card values-card" id="values-panel">
              <div class="card-head">
                <h2>Live Measurements</h2>
                ${teacherSwitch()}
              </div>
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
              <p id="debug-line" class="debug" hidden></p>
            </section>

            ${challengeCard()}
            ${theoryLink()}
          </aside>
        </div>

        ${trialSection({
          rangeTitle: "Your Trials · Distance vs. Displacement",
          heightTitle: "Your Trials · Position vs. Distance",
          rangeCaption: "Dashed is a least-squares fit. Turn on Show exact identity to overlay D = |Δx| as a solid V.",
          heightCaption: "Each point is a snapshot you recorded. Compare the fitted line to several paths from the same origin.",
          columns: ["Trial", "Position", "Displacement", "Distance", "+ direction"],
          emptyCols: 5,
        })}
      </div>

      ${theoryPage({
        title: "Scalars and vectors on a line",
        lead: "Distance adds every meter of the path. Displacement is only the shortcut, with a sign.",
        cards: [
          {
            title: "Distance vs. displacement",
            anim: "distance-displacement",
            caption: `${S.d("Teal D")} is the whole path and keeps growing on the way back. ${S.dx("Orange Δx")} is only the signed shortcut from start to now.`,
            eq: eqLines(
              `${S.d()} = Σ |${S.dx()}<sub>i</sub>|`,
              `${S.dx()} = ${S.x()}<sub>f</sub> − ${S.x()}<sub>i</sub>`,
            ),
            vars: [
              eqVar("d", "D", "distance — total path length", "m"),
              eqVar("dx", "Δx", "displacement — signed shortcut", "m"),
              eqVar("x", "x", "position on the axis", "m"),
            ],
          },
          {
            title: "Sign is a direction choice",
            anim: "signed-vector",
            caption: `${S.w("Green +")} and ${S.a("orange −")} are the two directions. Flip the convention and the numbers flip; the motion does not.`,
            eq: eqLines(`${S.w("+")} = right`, `${S.a("−")} = left`),
            vars: [
              eqVar("w", "+", "the chosen positive direction"),
              eqVar("a", "−", "the opposite direction"),
              eqVar("dx", "Δx", "signed displacement in that convention", "m"),
            ],
          },
          {
            title: "Why D ≥ |Δx|",
            anim: "d-ge-dx",
            caption: `The ${S.d("teal path")} cannot shrink. ${S.dx("Orange signed steps")} can cancel, so the point sits on or above the V.`,
            eq: eqLines(`|${S.dx()}| = |Σ ${S.dx()}<sub>i</sub>| ≤ Σ |${S.dx()}<sub>i</sub>| = ${S.d()}`),
            vars: [
              eqVar("dx", "Δx", "signed step, can cancel", "m"),
              eqVar("d", "D", "absolute steps, cannot cancel", "m"),
            ],
          },
        ],
        graphs: [
          {
            id: "d-vs-dx",
            title: "D vs. Δx",
            caption: "The identity is the V: D = |Δx|. One-way runs sit on it; reversals sit above it.",
          },
        ],
        fit: `<p>One-way runs hug D ≈ |Δx|. After a reversal the points rise above that V.</p>`,
      })}
    </section>
  `;
}

export function sim12Page() {
  return `
    <section class="sim-shell">
      <header class="sim-header">
        <div>
          <p class="kicker">Unit 1 · Simulation 1.2</p>
          <h1>Displacement, Velocity, and Acceleration</h1>
          <p class="objective">Learning objective: Connect one-dimensional motion over time to average and instantaneous velocity and acceleration, including graphs and direction change.</p>
          <p class="sim-nav"><a href="/simulations/module-1/1-1" data-link>← 1.1</a> · <a href="/simulations/module-1" data-link>Module 1</a> · <a href="/simulations/module-1/1-3" data-link>1.3 →</a></p>
        </div>
        <div class="sim-toolbar">
          ${labIconToolbar()}
        </div>
      </header>

      ${labTablist()}

      <div id="panel-lab" role="tabpanel" aria-labelledby="tab-btn-lab">
        <div class="workspace">
          <section class="stage track-stage motion-stage" aria-label="One-dimensional motion over time">
            <canvas id="axis-canvas" width="960" height="280" aria-label="Object moving on a one-dimensional position axis"></canvas>
            <div class="transport">
              <button type="button" class="btn primary" id="btn-play">Play</button>
              <button type="button" class="btn" id="btn-pause" disabled>Pause</button>
              <button type="button" class="btn" id="btn-step">Step +0.1 s</button>
              <button type="button" class="btn" id="btn-check-12">Check</button>
              <span class="transport-gap"></span>
              <label class="switch light">
                <input id="auto-record" type="checkbox" />
                Auto-record
              </label>
              <button type="button" class="btn" id="btn-reset-run">Reset</button>
              <button type="button" class="btn" id="btn-record">Record Trial</button>
              <button type="button" class="btn" id="btn-clear">Clear Trials</button>
            </div>
            <div class="track-controls">
              <div class="control">
                <div class="control-head"><span>Presets</span></div>
                <div class="presets" role="group" aria-label="Motion presets">
                  <button type="button" class="chip" data-preset="const-v">Constant velocity</button>
                  <button type="button" class="chip" data-preset="speed-up">Speeding up</button>
                  <button type="button" class="chip" data-preset="slow-down">Slowing down</button>
                  <button type="button" class="chip" data-preset="negative">Negative motion</button>
                </div>
              </div>
              <div class="control">
                <div class="control-head"><span>Playback speed</span></div>
                <div class="presets" role="group" aria-label="Playback speed">
                  <button type="button" class="chip" data-speed="0.25">0.25×</button>
                  <button type="button" class="chip" data-speed="0.5">0.5×</button>
                  <button type="button" class="chip active" data-speed="1">1×</button>
                  <button type="button" class="chip" data-speed="2">2×</button>
                  <button type="button" class="chip" data-speed="4">4×</button>
                </div>
              </div>
              ${cameraModeControls(1)}
              <div class="nudge-row motion-inputs">
                <label class="pos-input">
                  Initial position
                  <input id="x0-input" type="number" step="0.5" min="-20" max="20" value="0" aria-label="Initial position in meters" />
                  <span>m</span>
                </label>
                <label class="pos-input">
                  Initial velocity
                  <input id="v0-input" type="number" step="0.5" min="-15" max="15" value="4" aria-label="Initial velocity in meters per second" />
                  <span>m/s</span>
                </label>
                <label class="pos-input">
                  Acceleration
                  <input id="a-input" type="number" step="0.5" min="-8" max="8" value="0" aria-label="Acceleration in meters per second squared" />
                  <span>m/s²</span>
                </label>
                <label class="pos-input">
                  Duration
                  <input id="duration-input" type="number" step="1" min="1" max="20" value="10" aria-label="Simulation duration in seconds" />
                  <span>s</span>
                </label>
              </div>
              <p class="sr-only">
                <span id="read-x0"></span>
                <span id="read-v0"></span>
                <span id="read-a0"></span>
                <span id="read-T"></span>
              </p>
              <div class="nudge-row">
                <label class="switch light"><input id="toggle-vectors" type="checkbox" checked /> Velocity and acceleration arrows</label>
                <label class="switch light"><input id="toggle-trail" type="checkbox" checked /> Motion trail</label>
                <label class="switch light"><input id="pause-reverse" type="checkbox" /> Pause at v = 0</label>
              </div>
              <p class="track-help">Drag the object at t = 0 to set x₀. Space plays or pauses. Negative acceleration is not the same as moving left. Camera: Origin keeps x = 0 in view, Follow tracks the object, Stationary freezes the window.</p>
            </div>
          </section>

          <aside class="rail">
            <section class="card values-card" id="values-panel">
              <div class="card-head">
                <h2>Live Measurements</h2>
                ${teacherSwitch()}
              </div>
              <dl class="metrics metrics-wide">
                <div>
                  <dt>Time</dt>
                  <dd id="read-t">0.00 s</dd>
                </div>
                <div>
                  <dt>Position <span class="tag">vector</span></dt>
                  <dd id="read-x">0.00 m</dd>
                </div>
                <div>
                  <dt>Displacement <span class="tag">vector</span></dt>
                  <dd id="read-dx">0.00 m <span id="dx-arrow" class="dir-glyph"></span></dd>
                </div>
                <div>
                  <dt>Distance traveled <span class="tag tag-scalar">scalar</span></dt>
                  <dd id="read-d">0.00 m</dd>
                </div>
                <div>
                  <dt>Velocity <span class="tag">instantaneous</span></dt>
                  <dd id="read-v">+4.00 m/s</dd>
                </div>
                <div>
                  <dt>Acceleration <span class="tag">instantaneous</span></dt>
                  <dd id="read-a">0.00 m/s²</dd>
                </div>
                <div>
                  <dt>Average velocity</dt>
                  <dd id="read-vavg">—</dd>
                </div>
                <div>
                  <dt>Average acceleration</dt>
                  <dd id="read-aavg">—</dd>
                </div>
              </dl>
              <p class="caption">v<sub>avg</sub> = Δx / Δt. Instantaneous velocity is v = v₀ + at, not the average.</p>
              <p id="debug-line" class="debug" hidden></p>
            </section>

            ${challengeCard()}
            ${theoryLink()}
          </aside>
        </div>

        <section class="lab-bottom motion-graphs">
          <div class="graph-toggles" role="group" aria-label="Graph visibility">
            <label><input type="checkbox" data-graph="x" checked /> Position vs. time</label>
            <label><input type="checkbox" data-graph="v" checked /> Velocity vs. time</label>
            <label><input type="checkbox" data-graph="a" checked /> Acceleration vs. time</label>
          </div>
          <div class="graphs graphs-three">
            <div class="graph-wrap" id="wrap-x">
              <h2>Position vs. time</h2>
              <canvas id="graph-xt" width="640" height="240" aria-label="Position versus time"></canvas>
              <p class="caption">Constant velocity is a straight line. Constant acceleration curves the graph.</p>
            </div>
            <div class="graph-wrap" id="wrap-v">
              <h2>Velocity vs. time</h2>
              <canvas id="graph-vt" width="640" height="240" aria-label="Velocity versus time"></canvas>
              <p class="caption">The slope of v vs. t is acceleration. A horizontal line means a = 0.</p>
            </div>
            <div class="graph-wrap" id="wrap-a">
              <h2>Acceleration vs. time</h2>
              <canvas id="graph-at" width="640" height="240" aria-label="Acceleration versus time"></canvas>
              <p class="caption">In this lab acceleration is constant, so the graph is a horizontal line.</p>
            </div>
          </div>
        </section>

        ${trialSection({
          rangeTitle: "Your Trials · Distance vs. Displacement",
          heightTitle: "Your Trials · Average Velocity vs. Time",
          rangeCaption: "Dashed is a least-squares fit. Turn on Show exact identity to overlay D = |Δx|. If the object reverses, distance keeps growing while displacement can shrink.",
          heightCaption: "Average velocity is Δx / Δt. The solid identity is v_avg = v₀ + ½ a t for the current settings (constant a, no bounce).",
          columns: ["Trial", "t", "Position", "Displacement", "Distance", "v", "a", "v_avg"],
          emptyCols: 8,
        })}
      </div>

      ${theoryPage({
        title: "Motion over an interval",
        lead: "Velocity is how position changes with time. Acceleration is how velocity changes with time.",
        cards: [
          {
            title: "v = v₀ + at",
            anim: "v-equals-v0-at",
            caption: `${S.v("Teal v")} follows ${S.a("orange a")}. Negative a is not automatically “moving left” — watch v fall through zero, then reverse.`,
            eq: eqLines(`${S.v()}(${S.t()}) = ${S.v("v₀")} + ${S.a()} ${S.t()}`),
            vars: [
              eqVar("v", "v", "velocity at that instant", "m/s"),
              eqVar("v", "v₀", "velocity at t = 0", "m/s"),
              eqVar("a", "a", "constant acceleration", "m/s²"),
              eqVar("t", "t", "elapsed time", "s"),
            ],
          },
          {
            title: "Speeding up vs. slowing down",
            anim: "speeding-slowing",
            caption: `Speed grows when ${S.v("teal v")} and ${S.a("orange a")} share a sign. Speed shrinks when they oppose.`,
            eq: eqLines("same signs → speeding up", "opposite signs → slowing down"),
            vars: [
              eqVar("v", "v", "signed velocity", "m/s"),
              eqVar("a", "a", "signed acceleration", "m/s²"),
            ],
          },
          {
            title: "Position is the area under v vs. t",
            anim: "x-from-vt-area",
            caption: `The ${S.v("teal shaded area")} under v vs. t is ${S.dx("orange Δx")}. A linear v(t) makes a rectangle plus a triangle.`,
            eq: eqLines(`${S.x()}(${S.t()}) = ${S.x("x₀")} + ${S.v("v₀")} ${S.t()} + ½ ${S.a()} ${S.t()}²`),
            vars: [
              eqVar("x", "x", "position", "m"),
              eqVar("x", "x₀", "position at t = 0", "m"),
              eqVar("v", "v₀", "initial velocity", "m/s"),
              eqVar("a", "a", "constant acceleration", "m/s²"),
              eqVar("t", "t", "elapsed time", "s"),
            ],
          },
        ],
        graphs: [
          {
            id: "v-vs-t",
            title: "v vs. t",
            caption: "For constant a, v(t) is a straight line. This example is v = 8 − 2t.",
          },
          {
            id: "x-vs-t",
            title: "x vs. t",
            caption: "The same motion: x is the accumulated area under v vs. t, a parabola.",
          },
        ],
        fit: `<p>Hold a constant and record at several times: v<sub>avg</sub> vs. t should fit a line with slope a/2.</p>`,
      })}
    </section>
  `;
}

export function sim13Page() {
  return `
    <section class="sim-shell">
      <header class="sim-header">
        <div>
          <p class="kicker">Unit 1 · Simulation 1.3</p>
          <h1>Representing Motion</h1>
          <p class="objective">Learning objective: Connect the same one-dimensional motion to a motion diagram, position-time, velocity-time, and acceleration-time graphs, and to the live numbers.</p>
          <p class="sim-nav"><a href="/simulations/module-1/1-2" data-link>← 1.2</a> · <a href="/simulations/module-1" data-link>Module 1</a> · <a href="/simulations/module-1/1-4" data-link>1.4 →</a></p>
        </div>
        <div class="sim-toolbar">
          ${labIconToolbar()}
        </div>
      </header>

      ${labTablist()}

      <div id="panel-lab" role="tabpanel" aria-labelledby="tab-btn-lab">
        <div class="workspace">
          <section class="stage track-stage motion-stage" aria-label="One-dimensional motion representations">
            <canvas id="axis-canvas" width="960" height="280" aria-label="Object moving on a one-dimensional position axis"></canvas>
            <div class="transport">
              <button type="button" class="btn primary" id="btn-play">Play</button>
              <button type="button" class="btn" id="btn-pause" disabled>Pause</button>
              <button type="button" class="btn" id="btn-step">Step +0.1 s</button>
              <button type="button" class="btn" id="btn-check-13">Check</button>
              <button type="button" class="chip" id="btn-collide" aria-pressed="false">Allow collisions</button>
              <span class="transport-gap"></span>
              <label class="switch light">
                <input id="auto-record" type="checkbox" />
                Auto-record
              </label>
              <button type="button" class="btn" id="btn-reset-run">Reset</button>
              <button type="button" class="btn" id="btn-record">Record Trial</button>
              <button type="button" class="btn" id="btn-clear">Clear Trials</button>
            </div>
            <div class="track-controls">
              <div class="control">
                <div class="control-head"><span>Presets</span></div>
                <div class="presets" role="group" aria-label="Motion presets">
                  <button type="button" class="chip" data-preset="still">Stationary</button>
                  <button type="button" class="chip" data-preset="const-v">Constant +v</button>
                  <button type="button" class="chip" data-preset="const-neg">Constant −v</button>
                  <button type="button" class="chip" data-preset="speed-up">Speeding up</button>
                  <button type="button" class="chip" data-preset="slow-down">Slowing down</button>
                  <button type="button" class="chip" data-preset="reverse">Direction change</button>
                  <button type="button" class="chip" data-preset="neg-speed">Speeding up left</button>
                  <button type="button" class="chip" data-preset="neg-slow">Slowing down left</button>
                </div>
              </div>
              <div class="control">
                <div class="control-head"><span>Playback speed</span></div>
                <div class="presets" role="group" aria-label="Playback speed">
                  <button type="button" class="chip" data-speed="0.25">0.25×</button>
                  <button type="button" class="chip" data-speed="0.5">0.5×</button>
                  <button type="button" class="chip active" data-speed="1">1×</button>
                  <button type="button" class="chip" data-speed="2">2×</button>
                  <button type="button" class="chip" data-speed="4">4×</button>
                </div>
              </div>
              ${cameraModeControls(1)}
              <div class="nudge-row motion-inputs">
                <label class="pos-input">
                  Initial position
                  <input id="x0-input" type="number" step="0.5" min="-20" max="20" value="0" aria-label="Initial position in meters" />
                  <span>m</span>
                </label>
                <label class="pos-input">
                  Initial velocity
                  <input id="v0-input" type="number" step="0.5" min="-15" max="15" value="4" aria-label="Initial velocity in meters per second" />
                  <span>m/s</span>
                </label>
                <label class="pos-input">
                  Acceleration
                  <input id="a-input" type="number" step="0.5" min="-8" max="8" value="0" aria-label="Acceleration in meters per second squared" />
                  <span>m/s²</span>
                </label>
                <label class="pos-input">
                  Duration
                  <input id="duration-input" type="number" step="1" min="1" max="20" value="10" aria-label="Simulation duration in seconds" />
                  <span>s</span>
                </label>
              </div>
              <p class="sr-only">
                <span id="read-x0"></span>
                <span id="read-v0"></span>
                <span id="read-a0"></span>
                <span id="read-T"></span>
              </p>
              <div class="nudge-row">
                <label class="switch light"><input id="toggle-object" type="checkbox" checked /> Object</label>
                <label class="switch light"><input id="toggle-diagram" type="checkbox" checked /> Motion diagram</label>
                <label class="switch light"><input id="toggle-vectors" type="checkbox" checked /> Velocity and acceleration arrows</label>
                <label class="switch light"><input id="toggle-area" type="checkbox" /> Shade v–t area (Δx)</label>
                <label class="switch light"><input id="pause-reverse" type="checkbox" /> Pause at v = 0</label>
              </div>
              <p class="track-help">Dot spacing is speed at equal time steps. Click a graph while paused to jump to that time. Allow collisions to bounce elastically at ±20 m. Camera: Origin, Follow, or Stationary.</p>
            </div>
          </section>

          <aside class="rail">
            <section class="card values-card" id="values-panel">
              <div class="card-head">
                <h2>Live Measurements</h2>
                ${teacherSwitch()}
              </div>
              <dl class="metrics metrics-wide">
                <div>
                  <dt>Time</dt>
                  <dd id="read-t">0.00 s</dd>
                </div>
                <div>
                  <dt>Position <span class="tag">vector</span></dt>
                  <dd id="read-x">0.00 m</dd>
                </div>
                <div>
                  <dt>Displacement <span class="tag">vector</span></dt>
                  <dd id="read-dx">0.00 m <span id="dx-arrow" class="dir-glyph"></span></dd>
                </div>
                <div>
                  <dt>Distance traveled <span class="tag tag-scalar">scalar</span></dt>
                  <dd id="read-d">0.00 m</dd>
                </div>
                <div>
                  <dt>Velocity <span class="tag">instantaneous</span></dt>
                  <dd id="read-v">+4.00 m/s</dd>
                </div>
                <div>
                  <dt>Acceleration <span class="tag">instantaneous</span></dt>
                  <dd id="read-a">0.00 m/s²</dd>
                </div>
                <div>
                  <dt>Slope of x vs. t</dt>
                  <dd id="read-slope-x">+4.00 m/s</dd>
                </div>
                <div>
                  <dt>Slope of v vs. t</dt>
                  <dd id="read-slope-v">0.00 m/s²</dd>
                </div>
                <div>
                  <dt>Area under v vs. t</dt>
                  <dd id="read-area-v">0.00 m</dd>
                </div>
              </dl>
              <p class="caption">Slope of x–t is velocity. Slope of v–t is acceleration. Signed area under v–t is displacement.</p>
              <p id="debug-line" class="debug" hidden></p>
            </section>

            ${challengeCard()}
            ${theoryLink()}
          </aside>
        </div>

        <section class="lab-bottom" id="wrap-diagram">
          <div class="graph-wrap diagram-wrap">
            <h2>Motion diagram</h2>
            <canvas id="diagram-canvas" width="960" height="160" aria-label="Motion diagram with equal time intervals"></canvas>
            <p class="caption">Each dot is the position 0.50 s after the previous dot. Equal spacing means constant speed; growing gaps mean speeding up. The diamond is now.</p>
          </div>
        </section>

        <section class="lab-bottom motion-graphs">
          <div class="graph-toggles" role="group" aria-label="Graph visibility">
            <label><input type="checkbox" data-graph="x" checked /> Position vs. time</label>
            <label><input type="checkbox" data-graph="v" checked /> Velocity vs. time</label>
            <label><input type="checkbox" data-graph="a" checked /> Acceleration vs. time</label>
          </div>
          <div class="graphs graphs-three">
            <div class="graph-wrap" id="wrap-x">
              <h2>Position vs. time</h2>
              <canvas id="graph-xt" width="640" height="240" aria-label="Position versus time"></canvas>
              <p class="caption">Slope = velocity. A curve means velocity is changing.</p>
            </div>
            <div class="graph-wrap" id="wrap-v">
              <h2>Velocity vs. time</h2>
              <canvas id="graph-vt" width="640" height="240" aria-label="Velocity versus time"></canvas>
              <p class="caption">Slope = acceleration. Signed area under the curve = displacement.</p>
            </div>
            <div class="graph-wrap" id="wrap-a">
              <h2>Acceleration vs. time</h2>
              <canvas id="graph-at" width="640" height="240" aria-label="Acceleration versus time"></canvas>
              <p class="caption">Constant acceleration is a horizontal line. Zero acceleration sits on the time axis.</p>
            </div>
          </div>
        </section>

        ${trialSection({
          rangeTitle: "Your Trials · Distance vs. Displacement",
          heightTitle: "Your Trials · Average Velocity vs. Time",
          rangeCaption: "Dashed is a least-squares fit. Turn on Show exact identity to overlay D = |Δx|. If the object reverses or bounces, distance keeps growing while displacement can shrink.",
          heightCaption: "Average velocity is Δx / Δt. The solid identity is v_avg = v₀ + ½ a t for the current settings; a bounce takes the points off that line.",
          columns: ["Trial", "t", "Position", "Displacement", "Distance", "v", "a", "v_avg"],
          emptyCols: 8,
        })}
      </div>

      ${theoryPage({
        title: "One motion, several pictures",
        lead: "The object, the dots, and the graphs are the same x(t), v(t), and a(t) drawn three ways.",
        cards: [
          {
            title: "Equal time, not equal distance",
            anim: "motion-diagram",
            caption: `Each ${S.t("dot")} is 0.50 s later. Wider gaps mean larger ${S.v("speed")} in that interval.`,
            eq: eqLines(`spacing ∝ ${S.v("speed")} &nbsp;&nbsp;(equal ${S.t("Δt")})`),
            vars: [
              eqVar("t", "Δt", "equal time between dots", "s"),
              eqVar("v", "speed", "how far the next gap stretches", "m/s"),
            ],
          },
          {
            title: "Slopes and area",
            anim: "xt-vt-at",
            caption: `${S.w("Green x(t)")} slope is ${S.v("teal v")}. ${S.v("v(t)")} slope is ${S.a("orange a")}. Area under v(t) is ${S.dx("Δx")}.`,
            eq: eqLines(
              `${S.v()} = ${S.dx()} / ${S.t("Δt")}`,
              `${S.a()} = ${S.v("Δv")} / ${S.t("Δt")}`,
              `${S.dx()} = area under ${S.v()}(${S.t()})`,
            ),
            vars: [
              eqVar("x", "x", "position", "m"),
              eqVar("v", "v", "velocity — slope of x vs. t", "m/s"),
              eqVar("a", "a", "acceleration — slope of v vs. t", "m/s²"),
              eqVar("t", "t", "time", "s"),
            ],
          },
          {
            title: "Speeding up vs. slowing down",
            anim: "speeding-slowing",
            caption: `Speed is |${S.v("v")}|. Same-sign ${S.v("v")} and ${S.a("a")} increase speed; opposite signs decrease it.`,
            eq: eqLines(`speed ↑ when ${S.v()} and ${S.a()} share a sign`),
            vars: [
              eqVar("v", "v", "signed velocity", "m/s"),
              eqVar("a", "a", "signed acceleration", "m/s²"),
            ],
          },
        ],
        graphs: [
          {
            id: "v-vs-t",
            title: "v vs. t",
            caption: "Slope of this line is a. Area between the line and the t-axis is Δx.",
          },
          {
            id: "d-vs-dx",
            title: "D vs. Δx",
            caption: "The same path, recorded as distance vs. displacement, still respects D ≥ |Δx|.",
          },
        ],
        fit: `<p>Live graphs are the motion itself. Recorded D vs. Δx should still respect D ≥ |Δx|.</p>`,
      })}
    </section>
  `;
}

export function sim14Page() {
  return `
    <section class="sim-shell">
      <header class="sim-header">
        <div>
          <p class="kicker">Unit 1 · Simulation 1.4</p>
          <h1>Reference Frames and Relative Motion</h1>
          <p class="objective">Learning objective: Describe the same one-dimensional motion from the ground and from moving observers using relative position and velocity.</p>
          <p class="sim-nav"><a href="/simulations/module-1/1-3" data-link>← 1.3</a> · <a href="/simulations/module-1" data-link>Module 1</a> · <a href="/simulations/module-1/1-5">1.5 →</a></p>
        </div>
        <div class="sim-toolbar">
          ${labIconToolbar()}
        </div>
      </header>

      ${labTablist()}

      <div id="panel-lab" role="tabpanel" aria-labelledby="tab-btn-lab">
        <div class="workspace">
          <section class="stage track-stage motion-stage relative-stage" aria-label="Two objects in a chosen reference frame">
            <canvas id="axis-canvas" width="960" height="320" aria-label="Objects A and B on a one-dimensional axis"></canvas>
            <div class="transport">
              <button type="button" class="btn primary" id="btn-play">Play</button>
              <button type="button" class="btn" id="btn-pause" disabled>Pause</button>
              <button type="button" class="btn" id="btn-step">Step +0.1 s</button>
              <button type="button" class="btn" id="btn-check-14">Check</button>
              <span class="transport-gap"></span>
              <label class="switch light">
                <input id="auto-record" type="checkbox" />
                Auto-record
              </label>
              <button type="button" class="btn" id="btn-reset-run">Reset</button>
              <button type="button" class="btn" id="btn-record">Record Trial</button>
              <button type="button" class="btn" id="btn-clear">Clear Trials</button>
            </div>
            <div class="track-controls">
              <div class="control">
                <div class="control-head"><span>Reference frame</span></div>
                <div class="presets" role="radiogroup" aria-label="Reference frame">
                  <button type="button" class="chip active" data-frame="ground">Ground</button>
                  <button type="button" class="chip" data-frame="A">Object A</button>
                  <button type="button" class="chip" data-frame="B">Object B</button>
                </div>
              </div>
              <div class="control">
                <div class="control-head"><span>Presets</span></div>
                <div class="presets" role="group" aria-label="Relative motion presets">
                  <button type="button" class="chip" data-preset="same-v">Same velocity</button>
                  <button type="button" class="chip" data-preset="a-faster">A faster</button>
                  <button type="button" class="chip" data-preset="b-faster">B faster</button>
                  <button type="button" class="chip" data-preset="opposite">Opposite directions</button>
                  <button type="button" class="chip" data-preset="b-still">B stationary</button>
                  <button type="button" class="chip" data-preset="a-observer">A as observer</button>
                </div>
              </div>
              <div class="control">
                <div class="control-head"><span>Playback speed</span></div>
                <div class="presets" role="group" aria-label="Playback speed">
                  <button type="button" class="chip" data-speed="0.25">0.25×</button>
                  <button type="button" class="chip" data-speed="0.5">0.5×</button>
                  <button type="button" class="chip active" data-speed="1">1×</button>
                  <button type="button" class="chip" data-speed="2">2×</button>
                  <button type="button" class="chip" data-speed="4">4×</button>
                </div>
              </div>
              ${cameraModeControls(2)}
              <div class="nudge-row motion-inputs">
                <label class="pos-input">
                  x₀ of A
                  <input id="xa-input" type="number" step="0.5" value="0" aria-label="Initial position of A in meters" />
                  <span>m</span>
                </label>
                <label class="pos-input">
                  v of A
                  <input id="va-input" type="number" step="0.5" value="5" aria-label="Velocity of A in meters per second" />
                  <span>m/s</span>
                </label>
                <label class="pos-input">
                  x₀ of B
                  <input id="xb-input" type="number" step="0.5" value="10" aria-label="Initial position of B in meters" />
                  <span>m</span>
                </label>
                <label class="pos-input">
                  v of B
                  <input id="vb-input" type="number" step="0.5" value="5" aria-label="Velocity of B in meters per second" />
                  <span>m/s</span>
                </label>
                <label class="pos-input">
                  Duration
                  <input id="duration-input" type="number" step="1" min="1" max="20" value="10" aria-label="Simulation duration in seconds" />
                  <span>s</span>
                </label>
              </div>
              <p class="track-help">Switch frames while the motion runs. A and B pass through each other. Drag either object at t = 0 to set its starting position. Camera: Fit objects keeps both on screen; Origin also holds x = 0; Stationary freezes the window.</p>
            </div>
          </section>

          <aside class="rail">
            <section class="card values-card" id="values-panel">
              <div class="card-head">
                <h2>This frame</h2>
                ${teacherSwitch()}
              </div>
              <p class="caption" id="frame-note">Positions and velocities below are relative to the ground.</p>
              <dl class="metrics metrics-wide">
                <div>
                  <dt>Current frame</dt>
                  <dd id="read-frame">Ground</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd id="read-t">0.00 s</dd>
                </div>
                <div>
                  <dt>A position</dt>
                  <dd id="read-xa">0.00 m</dd>
                </div>
                <div>
                  <dt>A velocity</dt>
                  <dd id="read-va">+5.00 m/s</dd>
                </div>
                <div>
                  <dt>B position</dt>
                  <dd id="read-xb">+10.00 m</dd>
                </div>
                <div>
                  <dt>B velocity</dt>
                  <dd id="read-vb">+5.00 m/s</dd>
                </div>
                <div>
                  <dt>x<sub>A/B</sub></dt>
                  <dd id="read-xab">−10.00 m</dd>
                </div>
                <div>
                  <dt>v<sub>A/B</sub></dt>
                  <dd id="read-vab">0.00 m/s</dd>
                </div>
                <div>
                  <dt>x<sub>B/A</sub></dt>
                  <dd id="read-xba">+10.00 m</dd>
                </div>
                <div>
                  <dt>v<sub>B/A</sub></dt>
                  <dd id="read-vba">0.00 m/s</dd>
                </div>
                <div>
                  <dt>Time to meeting</dt>
                  <dd id="read-meet">No future meeting within the current conditions.</dd>
                </div>
              </dl>
              <p class="caption">v<sub>A/B</sub> = v<sub>A</sub> − v<sub>B</sub>. The physical event does not change when you switch frames.</p>
              <p id="debug-line" class="debug" hidden></p>
            </section>

            ${challengeCard()}
            ${theoryLink()}
          </aside>
        </div>

        <section class="lab-bottom">
          <div class="graph-wrap diagram-wrap">
            <h2>Motion diagram in this frame</h2>
            <canvas id="diagram-canvas" width="960" height="160" aria-label="Motion diagrams for A and B in the selected frame"></canvas>
            <p class="caption">Equal time steps. In a moving object's frame that object stays at x = 0 and the other object's spacing is relative speed.</p>
          </div>
        </section>

        <section class="lab-bottom motion-graphs">
          <div class="graphs graphs-three">
            <div class="graph-wrap">
              <h2>Relative position vs. time</h2>
              <canvas id="graph-xt" width="640" height="240" aria-label="Position of A relative to B versus time"></canvas>
              <p class="caption">x<sub>A/B</sub> vs. t. Slope = v<sub>A/B</sub>. Click while paused to jump to that time.</p>
            </div>
            <div class="graph-wrap">
              <h2>Relative velocity vs. time</h2>
              <canvas id="graph-vt" width="640" height="240" aria-label="Velocity of A relative to B versus time"></canvas>
              <p class="caption">For constant ground velocities this graph is a horizontal line at v<sub>A</sub> − v<sub>B</sub>.</p>
            </div>
            <div class="graph-wrap">
              <h2>Position in this frame vs. time</h2>
              <canvas id="graph-frame" width="640" height="240" aria-label="Positions of A and B in the selected reference frame versus time"></canvas>
              <p class="caption">Switch to Object A: A stays at x = 0 and B’s graph is x<sub>B</sub> − x<sub>A</sub>.</p>
            </div>
          </div>
        </section>

        ${trialSection({
          rangeTitle: "Your Trials · Relative Position vs. Relative Velocity",
          heightTitle: "Your Trials · Separation vs. Time",
          rangeCaption: "A snapshot of x_A/B is not determined by v_A/B alone. When v_A/B = 0 the gap stays constant even if both still move relative to the ground.",
          heightCaption: "Turn on Show exact identity to overlay s = |x_A/B(0) + v_A/B t| as a solid V. A straight fit only holds until they meet.",
          columns: ["Trial", "Frame", "t", "x_A", "v_A", "x_B", "v_B", "v_A/B"],
          emptyCols: 8,
        })}
      </div>

      ${theoryPage({
        title: "Motion is measured from a frame",
        lead: "Changing frames changes the numbers, not the event.",
        cards: [
          {
            title: "Relative velocity",
            anim: "relative-velocity",
            caption: `${S.v("Teal ground velocities")} minus each other give ${S.a("orange v_A/B")} — how fast A looks from B.`,
            eq: eqLines(`${S.v("v")}<sub>A/B</sub> = ${S.v("v")}<sub>A</sub> − ${S.v("v")}<sub>B</sub>`),
            vars: [
              eqVar("v", "v_A", "velocity of A relative to the ground", "m/s"),
              eqVar("v", "v_B", "velocity of B relative to the ground", "m/s"),
              eqVar("a", "v_A/B", "velocity of A as seen from B", "m/s"),
            ],
          },
          {
            title: "Same velocity, two stories",
            anim: "same-v-two-frames",
            caption: `On the ground both move. In A’s frame, ${S.k("v_A/B = 0")} so B sits still. Both are correct.`,
            eq: eqLines(`${S.v("v")}<sub>A</sub> = ${S.v("v")}<sub>B</sub> ⇒ ${S.v("v")}<sub>A/B</sub> = 0`),
            vars: [
              eqVar("v", "v_A", "A relative to the ground", "m/s"),
              eqVar("v", "v_B", "B relative to the ground", "m/s"),
              eqVar("k", "v_A/B", "relative velocity in A’s frame", "m/s"),
            ],
          },
        ],
        graphs: [
          {
            id: "xab-vs-t",
            title: "x_A/B vs. t",
            caption: "Relative position changes at constant v_A/B. This example is x_A/B = 12 − 5t.",
          },
        ],
        fit: `<p>Separation vs. time is a V that touches zero at the meeting. After they pass, a single straight fit looks worse.</p>`,
      })}
    </section>
  `;
}

export function sim21Page() {
  return `
    <section class="sim-shell">
      <header class="sim-header">
        <div>
          <p class="kicker">Unit 2 · Simulation 2.1</p>
          <h1>Systems and Center of Mass</h1>
          <p class="objective">Learning objective: Define a system, locate its center of mass, and contrast the motion of individual objects with the motion of the system as a whole.</p>
          <p class="sim-nav"><a href="/simulations/module-1" data-link>← Module 1</a> · <a href="/simulations/module-2" data-link>Module 2</a> · <a href="/simulations/module-2/2-2" data-link>2.2 →</a></p>
        </div>
        <div class="sim-toolbar">
          ${labIconToolbar()}
        </div>
      </header>

      ${labTablist()}

      <div id="panel-lab" role="tabpanel" aria-labelledby="tab-btn-lab">
        <div class="workspace">
          <section class="stage track-stage motion-stage system-stage" aria-label="Two objects and their center of mass">
            <canvas id="axis-canvas" width="960" height="360" aria-label="Objects A and B with a center-of-mass marker on a one-dimensional axis"></canvas>
            <div class="transport">
              <button type="button" class="btn primary" id="btn-play">Play</button>
              <button type="button" class="btn" id="btn-pause" disabled>Pause</button>
              <button type="button" class="btn" id="btn-step">Step +0.1 s</button>
              <button type="button" class="btn" id="btn-check-21">Check</button>
              <span class="transport-gap"></span>
              <label class="switch light">
                <input id="auto-record" type="checkbox" />
                Auto-record
              </label>
              <button type="button" class="btn" id="btn-reset-run">Reset</button>
              <button type="button" class="btn" id="btn-record">Record Trial</button>
              <button type="button" class="btn" id="btn-clear">Clear Trials</button>
            </div>
            <div class="track-controls">
              <div class="control">
                <div class="control-head"><span>System</span></div>
                <div class="presets" role="radiogroup" aria-label="Selected system">
                  <button type="button" class="chip" data-system="A">A only</button>
                  <button type="button" class="chip active" data-system="AB">A + B</button>
                  <button type="button" class="chip" data-system="B">B only</button>
                </div>
              </div>
              <div class="control">
                <div class="control-head"><span>Presets</span></div>
                <div class="presets" role="group" aria-label="Center of mass presets">
                  <button type="button" class="chip" data-preset="equal-mass">Equal masses</button>
                  <button type="button" class="chip" data-preset="unequal-mass">Unequal masses</button>
                  <button type="button" class="chip" data-preset="opposite">Opposite velocities</button>
                  <button type="button" class="chip" data-preset="zero-cm-v">Zero CM velocity</button>
                  <button type="button" class="chip" data-preset="moving-system">Moving system</button>
                  <button type="button" class="chip" data-preset="external-force">External force</button>
                  <button type="button" class="chip" data-preset="push-apart">Internal push-apart</button>
                </div>
              </div>
              <div class="control">
                <div class="control-head"><span>Playback speed</span></div>
                <div class="presets" role="group" aria-label="Playback speed">
                  <button type="button" class="chip" data-speed="0.25">0.25×</button>
                  <button type="button" class="chip" data-speed="0.5">0.5×</button>
                  <button type="button" class="chip active" data-speed="1">1×</button>
                  <button type="button" class="chip" data-speed="2">2×</button>
                  <button type="button" class="chip" data-speed="4">4×</button>
                </div>
              </div>
              ${cameraModeControls(2)}
              <div class="nudge-row motion-inputs">
                <label class="pos-input">m of A<input id="ma-input" type="number" min="0.1" max="20" step="0.1" value="2" aria-label="Mass of A in kilograms" /><span>kg</span></label>
                <label class="pos-input">x₀ of A<input id="xa-input" type="number" step="0.5" value="-10" aria-label="Initial position of A in meters" /><span>m</span></label>
                <label class="pos-input">v of A<input id="va-input" type="number" step="0.5" value="2" aria-label="Initial velocity of A in meters per second" /><span>m/s</span></label>
                <label class="pos-input">m of B<input id="mb-input" type="number" min="0.1" max="20" step="0.1" value="2" aria-label="Mass of B in kilograms" /><span>kg</span></label>
                <label class="pos-input">x₀ of B<input id="xb-input" type="number" step="0.5" value="10" aria-label="Initial position of B in meters" /><span>m</span></label>
                <label class="pos-input">v of B<input id="vb-input" type="number" step="0.5" value="2" aria-label="Initial velocity of B in meters per second" /><span>m/s</span></label>
              </div>
              <div class="nudge-row motion-inputs">
                <label class="pos-input">F_ext<input id="fext-input" type="number" step="0.5" value="0" aria-label="External force on the selected system in newtons" /><span>N</span></label>
                <label class="pos-input">A↔B force<input id="fint-input" type="number" step="0.5" value="0" aria-label="Internal force of A on B in newtons" /><span>N</span></label>
                <label class="pos-input">Duration<input id="duration-input" type="number" step="1" min="1" max="20" value="10" aria-label="Simulation duration in seconds" /><span>s</span></label>
              </div>
              <p class="track-help">The diamond is the center of mass, not a third object. Drag A or B at t = 0. Increase B’s mass and watch the diamond slide toward B. A↔B is internal for A + B and external if the system is only A or only B. Camera: Fit objects keeps A, B, and the diamond on screen; Origin also holds x = 0; Stationary freezes the window.</p>
            </div>
          </section>

          <aside class="rail">
            <section class="card values-card" id="values-panel">
              <div class="card-head">
                <h2>System</h2>
                ${teacherSwitch()}
              </div>
              <p class="caption" id="force-note">A↔B is internal to A + B, so it cannot change a_CM. F_ext is external and a_CM = F_ext / M.</p>
              <dl class="metrics metrics-wide">
                <div><dt>Selected system</dt><dd id="read-system">A + B</dd></div>
                <div><dt>Time</dt><dd id="read-t">0.00 s</dd></div>
                <div><dt>Total mass</dt><dd id="read-m">4.00 kg</dd></div>
                <div><dt>Center of mass</dt><dd id="read-xcm">0.00 m</dd></div>
                <div><dt>CM velocity</dt><dd id="read-vcm">+2.00 m/s</dd></div>
                <div><dt>CM acceleration</dt><dd id="read-acm">0.00 m/s²</dd></div>
                <div><dt>Total momentum</dt><dd id="read-p">+8.00 kg·m/s</dd></div>
                <div><dt>External force</dt><dd id="read-fext">0.00 N</dd></div>
                <div><dt>A mass</dt><dd id="read-ma">2.00 kg</dd></div>
                <div><dt>B mass</dt><dd id="read-mb">2.00 kg</dd></div>
                <div><dt>A position</dt><dd id="read-xa">−10.00 m</dd></div>
                <div><dt>B position</dt><dd id="read-xb">+10.00 m</dd></div>
                <div><dt>A velocity</dt><dd id="read-va">+2.00 m/s</dd></div>
                <div><dt>B velocity</dt><dd id="read-vb">+2.00 m/s</dd></div>
              </dl>
              <p class="eq-block">x<sub>CM</sub> = Σ m<sub>i</sub> x<sub>i</sub> / M<br />v<sub>CM</sub> = Σ m<sub>i</sub> v<sub>i</sub> / M<br />F<sub>ext</sub> = M a<sub>CM</sub></p>
              <p id="debug-line" class="debug" hidden></p>
            </section>

            ${challengeCard()}
            ${theoryLink()}
          </aside>
        </div>

        <section class="lab-bottom">
          <div class="graph-wrap diagram-wrap system-diagram">
            <h2>Motion diagram</h2>
            <canvas id="diagram-canvas" width="960" height="200" aria-label="Motion diagrams for A, the center of mass, and B"></canvas>
            <p class="caption">Equal time steps. The CM row is computed from the same object histories, not drawn independently.</p>
          </div>
        </section>

        <section class="lab-bottom motion-graphs">
          <div class="graph-toggles" role="group" aria-label="Graph visibility">
            <label><input type="checkbox" data-graph="x" checked /> Position vs. time</label>
            <label><input type="checkbox" data-graph="v" checked /> Velocity vs. time</label>
          </div>
          <div class="graphs">
            <div class="graph-wrap" id="wrap-x">
              <h2>Position vs. time</h2>
              <canvas id="graph-xt" width="640" height="240" aria-label="Positions of A, B, and the center of mass versus time"></canvas>
              <p class="caption">A, B, and CM share the same clock. Click while paused to jump to that time.</p>
            </div>
            <div class="graph-wrap" id="wrap-v">
              <h2>Velocity vs. time</h2>
              <canvas id="graph-vt" width="640" height="240" aria-label="Velocities of A, B, and the center of mass versus time"></canvas>
              <p class="caption">If F_ext = 0, v_CM is a horizontal line even when A and B move differently.</p>
            </div>
          </div>
        </section>

        ${trialSection({
          rangeTitle: "Your Trials · Center of Mass vs. Mass of B",
          heightTitle: "Your Trials · Center of Mass vs. Time",
          rangeCaption: "Increase m_B with A fixed and watch x_CM move toward B. The solid identity uses the current positions.",
          heightCaption: "For constant a_CM the solid line is x_CM0 + v_CM t + ½ a_CM t² for the current settings.",
          columns: ["Trial", "Sys", "t", "m_A", "m_B", "x_CM", "v_CM", "M", "p", "F_ext"],
          emptyCols: 10,
        })}
      </div>

      ${theoryPage({
        title: "Many objects, one system",
        lead: "The center of mass tracks the system. Internal pairs rearrange the pieces; they do not move the diamond.",
        cards: [
          {
            title: "Mass-weighted average",
            anim: "center-of-mass",
            caption: `${S.m("Green masses")} pull the ${S.k("purple CM diamond")}. Increase ${S.a("orange m_B")} and the diamond slides toward B.`,
            eq: eqLines(`${S.x("x")}<sub>CM</sub> = Σ ${S.m()}<sub>i</sub> ${S.x()}<sub>i</sub> / Σ ${S.m()}<sub>i</sub>`),
            vars: [
              eqVar("x", "x_CM", "center of mass of the system", "m"),
              eqVar("m", "m_i", "mass of each piece", "kg"),
              eqVar("x", "x_i", "position of each piece", "m"),
            ],
          },
          {
            title: "Internal vs. external",
            anim: "internal-vs-external",
            caption: `A push-apart ${S.f("internal pair")} accelerates A and B oppositely. The ${S.k("CM")} stays put unless ${S.f("F_ext")} is unbalanced.`,
            eq: eqLines(`${S.f("F")}<sub>ext</sub> = ${S.m("M")} ${S.a("a")}<sub>CM</sub>`),
            vars: [
              eqVar("f", "F_ext", "net external force on the system", "N"),
              eqVar("m", "M", "total mass Σ m_i", "kg"),
              eqVar("a", "a_CM", "acceleration of the center of mass", "m/s²"),
            ],
          },
        ],
        graphs: [
          {
            id: "xcm-vs-mb",
            title: "x_CM vs. m_B",
            caption: "Hold A at −10 m (2 kg) and B at +10 m. Heavier B pulls x_CM toward +10 m.",
          },
        ],
        fit: `<p>CM vs. mass of B follows the two-body identity if you keep x_A, x_B, and m_A fixed.</p>`,
      })}
    </section>
  `;
}

export function sim22Page() {
  return `
    <section class="sim-shell">
      <header class="sim-header">
        <div>
          <p class="kicker">Unit 2 · Simulation 2.2</p>
          <h1>Forces and Free-Body Diagrams</h1>
          <p class="objective">Learning objective: Identify the external forces on a selected object, represent them as vectors on a free-body diagram, and determine the net force.</p>
          <p class="sim-nav"><a href="/simulations/module-2/2-1" data-link>← 2.1</a> · <a href="/simulations/module-2" data-link>Module 2</a> · <a href="/simulations/module-2/2-3" data-link>2.3 →</a></p>
        </div>
        <div class="sim-toolbar">
          ${labIconToolbar()}
        </div>
      </header>

      ${labTablist()}

      <div id="panel-lab" role="tabpanel" aria-labelledby="tab-btn-lab">
        <div class="workspace">
          <section class="stage track-stage motion-stage fbd-stage" aria-label="Physical scene with force vectors">
            <canvas id="axis-canvas" width="960" height="340" aria-label="Box in a physical scene with force arrows drawn from its center"></canvas>
            <div class="transport">
              <button type="button" class="btn primary" id="btn-play">Play</button>
              <button type="button" class="btn" id="btn-pause" disabled>Pause</button>
              <button type="button" class="btn" id="btn-step">Step +0.1 s</button>
              <button type="button" class="btn" id="btn-check-22">Check</button>
              <span class="transport-gap"></span>
              <label class="switch light">
                <input id="auto-record" type="checkbox" />
                Auto-record
              </label>
              <button type="button" class="btn" id="btn-reset-run">Reset</button>
              <button type="button" class="btn" id="btn-record">Record Trial</button>
              <button type="button" class="btn" id="btn-clear">Clear Trials</button>
            </div>
            <div class="track-controls">
              <div class="control">
                <div class="control-head"><span>Scenario</span></div>
                <div class="presets" role="group" aria-label="Force scenarios">
                  <button type="button" class="chip" data-scenario="box-on-surface">Box on surface</button>
                  <button type="button" class="chip" data-scenario="pushed-box">Pushed box</button>
                  <button type="button" class="chip" data-scenario="box-with-friction">Box with friction</button>
                  <button type="button" class="chip" data-scenario="pulled-box">Pulled box</button>
                  <button type="button" class="chip" data-scenario="hanging">Hanging object</button>
                  <button type="button" class="chip" data-scenario="balanced-horizontal">Balanced horizontal</button>
                  <button type="button" class="chip" data-scenario="unbalanced-horizontal">Unbalanced horizontal</button>
                  <button type="button" class="chip" data-scenario="coasting">Moving, F_net = 0</button>
                  <button type="button" class="chip" data-scenario="custom">Custom</button>
                </div>
              </div>
              <div class="control">
                <div class="control-head"><span>Gravity field</span></div>
                ${planetPresetControls()}
              </div>
              <div class="control">
                <div class="control-head"><span>Playback speed</span></div>
                <div class="presets" role="group" aria-label="Playback speed">
                  <button type="button" class="chip" data-speed="0.25">0.25×</button>
                  <button type="button" class="chip" data-speed="0.5">0.5×</button>
                  <button type="button" class="chip active" data-speed="1">1×</button>
                  <button type="button" class="chip" data-speed="2">2×</button>
                  <button type="button" class="chip" data-speed="4">4×</button>
                </div>
              </div>
              ${cameraModeControls(1)}
              <div class="nudge-row motion-inputs">
                <label class="pos-input">Mass<input id="mass-input" type="number" min="0.1" max="20" step="0.1" value="5" aria-label="Mass in kilograms" /><span>kg</span></label>
                <label class="pos-input">g<input id="g-input" type="number" min="0.1" max="30" step="0.1" value="9.8" aria-label="Gravitational field strength in meters per second squared" /><span>m/s²</span></label>
                <label class="pos-input">v₀<input id="v-input" type="number" step="0.5" value="0" aria-label="Initial velocity in meters per second" /><span>m/s</span></label>
                <label class="pos-input">Duration<input id="duration-input" type="number" step="1" min="1" max="20" value="10" aria-label="Simulation duration in seconds" /><span>s</span></label>
              </div>
              <div class="nudge-row motion-inputs fbd-toggles">
                <label class="switch light"><input id="toggle-dynamic" type="checkbox" /> Motion mode</label>
                <label class="switch light"><input id="toggle-net" type="checkbox" checked /> Show net force</label>
                <label class="switch light"><input id="toggle-components" type="checkbox" /> Show components</label>
                <label class="switch light"><input id="toggle-sources" type="checkbox" /> Show force sources</label>
              </div>
              <div class="force-table-wrap">
                <table class="force-table">
                  <thead>
                    <tr><th>Force</th><th>Magnitude</th><th>Direction</th><th>Source</th><th></th></tr>
                  </thead>
                  <tbody id="force-body"></tbody>
                </table>
                <div class="nudge-row motion-inputs add-force-row">
                  <label class="pos-input">Add
                    <select id="add-type" aria-label="Force type to add">
                      <option value="applied">Applied</option>
                      <option value="friction">Friction</option>
                      <option value="tension">Tension</option>
                      <option value="normal">Normal</option>
                    </select>
                  </label>
                  <label class="pos-input">Magnitude<input id="add-mag" type="number" min="0" max="200" step="0.5" value="10" aria-label="New force magnitude in newtons" /><span>N</span></label>
                  <label class="pos-input">Direction
                    <select id="add-dir" aria-label="New force direction">
                      <option value="0">→ right</option>
                      <option value="90">↑ up</option>
                      <option value="180">← left</option>
                      <option value="270">↓ down</option>
                    </select>
                  </label>
                  <button type="button" class="btn" id="btn-add-force">Add force</button>
                </div>
              </div>
              <p class="track-help">Arrows are forces on the box, not velocity. Camera: Origin keeps x = 0 in view and zooms out as the box recedes; Follow tracks the box; Stationary freezes the window. The dashed SYSTEM outline travels with the object; the free-body diagram does too. Motion mode is optional: ΣF = ma is shown either way, but the box only accelerates when Motion mode is on.</p>
            </div>
          </section>

          <aside class="rail">
            <section class="card values-card" id="values-panel">
              <div class="card-head">
                <h2>Object</h2>
                ${teacherSwitch()}
              </div>
              <dl class="metrics metrics-wide">
                <div><dt>Time</dt><dd id="read-t">0.00 s</dd></div>
                <div><dt>Force state</dt><dd id="read-state">Balanced</dd></div>
                <div><dt>Mass</dt><dd id="read-m">5.00 kg</dd></div>
                <div><dt>g</dt><dd id="read-g">9.80 m/s²</dd></div>
                <div><dt>Velocity</dt><dd id="read-v">0.00 m/s</dd></div>
                <div><dt>Acceleration a_x</dt><dd id="read-a">0.00 m/s²</dd></div>
                <div><dt>Gravity F_g</dt><dd id="read-fg">49.00 N ↓</dd></div>
                <div><dt>Net force</dt><dd id="read-fnet">0.00 N</dd></div>
                <div><dt>F_net,x</dt><dd id="read-fnetx">0.00 N</dd></div>
                <div><dt>F_net,y</dt><dd id="read-fnety">0.00 N</dd></div>
              </dl>
              <h3 class="force-list-head">Forces on the box</h3>
              <dl class="metrics" id="force-readout"></dl>
              <p class="eq-block">F<sub>g</sub> = mg<br />F<sub>net</sub> = ΣF<br />ΣF = ma</p>
              <p id="debug-line" class="debug" hidden></p>
            </section>

            ${challengeCard()}
            ${theoryLink()}
          </aside>
        </div>

        <section class="lab-bottom">
          <div class="graph-wrap diagram-wrap fbd-diagram">
            <h2>Free-body diagram</h2>
            <canvas id="fbd-canvas" width="960" height="240" aria-label="Free-body diagram of the same forces acting on the box"></canvas>
            <p class="caption">Only forces acting on the selected object. The surface and rope are not drawn here. F_net is dashed when shown.</p>
          </div>
        </section>

        <section class="lab-bottom">
          <div class="graph-wrap diagram-wrap">
            <h2>Motion diagram</h2>
            <canvas id="diagram-canvas" width="960" height="160" aria-label="Motion diagram of the box"></canvas>
            <p class="caption">Equal time steps of the box’s position when Motion mode is on. Balanced forces can still have constant velocity.</p>
          </div>
        </section>

        <section class="lab-bottom motion-graphs">
          <div class="graph-toggles" role="group" aria-label="Graph visibility">
            <label><input type="checkbox" data-graph="x" checked /> Net force vs. time</label>
            <label><input type="checkbox" data-graph="v" checked /> Acceleration vs. time</label>
          </div>
          <div class="graphs">
            <div class="graph-wrap" id="wrap-x">
              <h2>Net force vs. time</h2>
              <canvas id="graph-xt" width="640" height="240" aria-label="Net force components versus time"></canvas>
              <p class="caption">F_net,x and F_net,y share the simulation clock. Click while paused to jump to that time.</p>
            </div>
            <div class="graph-wrap" id="wrap-v">
              <h2>Acceleration vs. time</h2>
              <canvas id="graph-vt" width="640" height="240" aria-label="Acceleration components versus time"></canvas>
              <p class="caption">a = F_net / m even in static mode. The box moves only if Motion mode is on.</p>
            </div>
          </div>
        </section>

        ${trialSection({
          rangeTitle: "Your Trials · Weight vs. Mass",
          heightTitle: "Your Trials · a_x vs. |F_net|",
          rangeCaption: "Change mass or g and record. The solid identity is F_g = m g for the current g.",
          heightCaption: "The solid identity is a = F_net / m for the current mass. Record both static and motion-mode runs.",
          columns: ["Trial", "Scenario", "t", "m", "F_g", "F_net", "a_x", "State"],
          emptyCols: 8,
        })}
      </div>

      ${theoryPage({
        title: "Forces on one selected object",
        lead: "The scene, the FBD, and the force list are the same external forces.",
        cards: [
          {
            title: "Free-body diagram",
            anim: "fbd",
            caption: `Draw only forces on the object you chose: ${S.a("orange Fg")} down, ${S.v("teal N")} up, ${S.k("purple F_app")} to the side.`,
            eq: eqLines(`FBD = external ${S.f("forces")} on one object`),
            vars: [
              eqVar("a", "F_g", "gravitational force on the object", "N"),
              eqVar("v", "N", "normal force from the surface", "N"),
              eqVar("k", "F_app", "applied force you chose", "N"),
            ],
          },
          {
            title: "Net force",
            anim: "net-force",
            caption: `Add the vectors. The leftover ${S.f("orange F_net")} is what changes motion — not any single arrow.`,
            eq: eqLines(`${S.f("F")}<sub>net</sub> = Σ ${S.f("F")}<sub>i</sub>`),
            vars: [
              eqVar("f", "F_i", "each external force on this object", "N"),
              eqVar("f", "F_net", "vector sum — leftover force", "N"),
            ],
          },
        ],
        graphs: [
          {
            id: "fnet-vs-unbalanced",
            title: "|F_net| vs. unbalanced size",
            caption: "A balanced diagram sits at the origin. Unbalanced leftovers sit on the identity |F_net| = leftover size.",
          },
        ],
        fit: `<p>Record several force lists. |F_net| vs. unbalanced size should rise; a balanced diagram sits at 0.</p>`,
      })}
    </section>
  `;
}

export function sim23Page() {
  return `
    <section class="sim-shell">
      <header class="sim-header">
        <div>
          <p class="kicker">Unit 2 · Simulation 2.3</p>
          <h1>Newton's Third Law</h1>
          <p class="objective">Learning objective: Show that an interaction produces a pair of forces that are equal in magnitude, opposite in direction, and exerted on two different objects.</p>
          <p class="sim-nav"><a href="/simulations/module-2/2-2" data-link>← 2.2</a> · <a href="/simulations/module-2" data-link>Module 2</a> · <a href="/simulations/module-2/2-4" data-link>2.4 →</a></p>
        </div>
        <div class="sim-toolbar">
          ${labIconToolbar()}
        </div>
      </header>

      ${labTablist()}

      <div id="panel-lab" role="tabpanel" aria-labelledby="tab-btn-lab">
        <div class="workspace">
          <section class="stage track-stage motion-stage thirdlaw-stage" aria-label="Two-object interaction scene">
            <canvas id="axis-canvas" width="960" height="340" aria-label="Two objects with Newton's third-law force arrows drawn on the object that experiences each force"></canvas>
            <div class="transport">
              <button type="button" class="btn primary" id="btn-play">Play</button>
              <button type="button" class="btn" id="btn-pause" disabled>Pause</button>
              <button type="button" class="btn" id="btn-step">Step +0.1 s</button>
              <button type="button" class="btn" id="btn-check-23">Check</button>
              <span class="transport-gap"></span>
              <label class="switch light">
                <input id="auto-record" type="checkbox" />
                Auto-record
              </label>
              <button type="button" class="btn" id="btn-reset-run">Reset</button>
              <button type="button" class="btn" id="btn-record">Record Trial</button>
              <button type="button" class="btn" id="btn-clear">Clear Trials</button>
            </div>
            <div class="track-controls">
              <div class="control">
                <div class="control-head"><span>Scenario</span></div>
                <div class="presets" role="group" aria-label="Third-law scenarios">
                  <button type="button" class="chip" data-scenario="two-boxes">Two boxes push</button>
                  <button type="button" class="chip" data-scenario="unequal-mass">Unequal masses</button>
                  <button type="button" class="chip" data-scenario="hand-box">Hand and box</button>
                  <button type="button" class="chip" data-scenario="tug-of-war">Tug of war</button>
                  <button type="button" class="chip" data-scenario="hanging-earth">Object and Earth</button>
                  <button type="button" class="chip" data-scenario="gravity-pair">Gravitational pair</button>
                  <button type="button" class="chip" data-scenario="rope-tension">Rope tension</button>
                  <button type="button" class="chip" data-scenario="magnet-attract">Magnet attract</button>
                  <button type="button" class="chip" data-scenario="magnet-repel">Magnet repel</button>
                  <button type="button" class="chip" data-scenario="custom">Custom</button>
                </div>
              </div>
              <div class="control">
                <div class="control-head"><span>Playback speed</span></div>
                <div class="presets" role="group" aria-label="Playback speed">
                  <button type="button" class="chip" data-speed="0.25">0.25×</button>
                  <button type="button" class="chip" data-speed="0.5">0.5×</button>
                  <button type="button" class="chip active" data-speed="1">1×</button>
                  <button type="button" class="chip" data-speed="2">2×</button>
                  <button type="button" class="chip" data-speed="4">4×</button>
                </div>
              </div>
              ${cameraModeControls(2)}
              <div class="nudge-row motion-inputs">
                <label class="pos-input">m<sub>A</sub><input id="mass-a" type="number" min="0.1" max="100" step="0.1" value="5" aria-label="Mass of object A in kilograms" /><span>kg</span></label>
                <label class="pos-input">m<sub>B</sub><input id="mass-b" type="number" min="0.1" max="100" step="0.1" value="5" aria-label="Mass of object B in kilograms" /><span>kg</span></label>
                <label class="pos-input">Interaction F<input id="force-input" type="number" min="0" max="200" step="0.5" value="20" aria-label="Interaction force magnitude in newtons" /><span>N</span></label>
                <label class="pos-input">A on B
                  <select id="dir-input" aria-label="Direction of A on B">
                    <option value="0">→ right</option>
                    <option value="90">↑ up</option>
                    <option value="180">← left</option>
                    <option value="270">↓ down</option>
                  </select>
                </label>
                <label class="pos-input">Distance<input id="dist-input" type="number" min="0.5" max="20" step="0.1" value="6" aria-label="Separation used for gravitational pairs" /><span>m</span></label>
                <label class="pos-input">Duration<input id="duration-input" type="number" step="1" min="1" max="20" value="10" aria-label="Simulation duration in seconds" /><span>s</span></label>
              </div>
              <div class="nudge-row motion-inputs fbd-toggles">
                <label class="switch light"><input id="toggle-dynamic" type="checkbox" /> Motion mode</label>
                <label class="switch light"><input id="toggle-net" type="checkbox" checked /> Show net force</label>
              </div>
              <div class="nudge-row motion-inputs add-force-row">
                <label class="pos-input">Extra on
                  <select id="extra-target" aria-label="Object that receives an extra applied force">
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </label>
                <label class="pos-input">Magnitude<input id="extra-mag" type="number" min="0" max="200" step="0.5" value="30" aria-label="Extra force magnitude in newtons" /><span>N</span></label>
                <label class="pos-input">Direction
                  <select id="extra-dir" aria-label="Extra force direction">
                    <option value="0">→ right</option>
                    <option value="90">↑ up</option>
                    <option value="180">← left</option>
                    <option value="270">↓ down</option>
                  </select>
                </label>
                <button type="button" class="btn" id="btn-add-extra">Add extra force</button>
                <button type="button" class="btn" id="btn-clear-extra">Clear extras</button>
              </div>
              <p class="track-help">One interaction writes both arrows. Changing F updates A on B and B on A together. They never cancel on one object: each arrow lives on a different free-body diagram. Camera: Fit objects keeps both on screen; Origin also holds x = 0; Stationary freezes the window. Motion mode is optional; equal force does not mean equal acceleration.</p>
            </div>
          </section>

          <aside class="rail">
            <section class="card values-card" id="values-panel">
              <div class="card-head">
                <h2>Interaction pair</h2>
                ${teacherSwitch()}
              </div>
              <p class="eq-block">F(A on B) = −F(B on A)</p>
              <dl class="metrics metrics-wide">
                <div><dt>Time</dt><dd id="read-t">0.00 s</dd></div>
                <div><dt>Pair difference</dt><dd id="read-diff">0.00 N</dd></div>
                <div><dt>A on B</dt><dd id="read-faonb">20.00 N →</dd></div>
                <div><dt>Target of A on B</dt><dd id="read-target-aonb">Object B</dd></div>
                <div><dt>B on A</dt><dd id="read-fbona">20.00 N ←</dd></div>
                <div><dt>Target of B on A</dt><dd id="read-target-bona">Object A</dd></div>
                <div><dt>F_net on A</dt><dd id="read-neta">20.00 N ←</dd></div>
                <div><dt>F_net on B</dt><dd id="read-netb">20.00 N →</dd></div>
                <div><dt>|a_A|</dt><dd id="read-aa">4.00 m/s²</dd></div>
                <div><dt>|a_B|</dt><dd id="read-ab">4.00 m/s²</dd></div>
              </dl>
              <h3 class="force-list-head">Third-law checklist</h3>
              <dl class="metrics">
                <div><dt>Same interaction</dt><dd id="crit-same">yes</dd></div>
                <div><dt>Equal magnitude</dt><dd id="crit-equal">yes</dd></div>
                <div><dt>Opposite direction</dt><dd id="crit-opp">yes</dd></div>
                <div><dt>Different objects</dt><dd id="crit-diff">yes</dd></div>
              </dl>
              <details class="why-cancel">
                <summary>Why don’t the forces cancel?</summary>
                <p>They are equal and opposite, but they act on different objects. Only forces acting on the same object add to that object’s net force.</p>
              </details>
              <p id="debug-line" class="debug" hidden></p>
            </section>

            ${challengeCard()}
            ${theoryLink()}
          </aside>
        </div>

        <section class="lab-bottom">
          <div class="fbd-pair">
            <div class="graph-wrap diagram-wrap fbd-diagram">
              <h2>Free-body diagram · A</h2>
              <canvas id="fbd-a" width="480" height="240" aria-label="Free-body diagram of forces acting on object A"></canvas>
              <p class="caption">Only forces on A. B on A belongs here. A on B does not.</p>
            </div>
            <div class="graph-wrap diagram-wrap fbd-diagram">
              <h2>Free-body diagram · B</h2>
              <canvas id="fbd-b" width="480" height="240" aria-label="Free-body diagram of forces acting on object B"></canvas>
              <p class="caption">Only forces on B. A on B belongs here. B on A does not.</p>
            </div>
          </div>
        </section>

        <section class="lab-bottom">
          <div class="graph-wrap diagram-wrap">
            <h2>Motion diagram</h2>
            <canvas id="diagram-canvas" width="960" height="160" aria-label="Motion diagram of both objects"></canvas>
            <p class="caption">Equal time steps when Motion mode is on. The lighter object covers more ground for the same interaction force.</p>
          </div>
        </section>

        <section class="lab-bottom motion-graphs">
          <div class="graph-toggles" role="group" aria-label="Graph visibility">
            <label><input type="checkbox" data-graph="x" checked /> Pair force vs. time</label>
            <label><input type="checkbox" data-graph="v" checked /> Acceleration vs. time</label>
          </div>
          <div class="graphs">
            <div class="graph-wrap" id="wrap-x">
              <h2>Pair force vs. time</h2>
              <canvas id="graph-xt" width="640" height="240" aria-label="Signed interaction forces versus time"></canvas>
              <p class="caption">A on B and B on A are opposite in sign and equal in magnitude. Click while paused to jump to that time.</p>
            </div>
            <div class="graph-wrap" id="wrap-v">
              <h2>Acceleration vs. time</h2>
              <canvas id="graph-vt" width="640" height="240" aria-label="Acceleration of A and B versus time"></canvas>
              <p class="caption">a = F_net / m for each object. Equal forces can produce different accelerations.</p>
            </div>
          </div>
        </section>

        ${trialSection({
          rangeTitle: "Your Trials · |a_A| vs. 1/m_A",
          heightTitle: "Your Trials · B on A vs. A on B",
          rangeCaption: "Keep F fixed and change m_A. The solid identity is |a_A| = F / m_A.",
          heightCaption: "Every recorded pair should sit on F_BonA = F_AonB. That line is Newton’s third law.",
          columns: ["Trial", "Scenario", "A on B", "B on A", "m_A", "m_B", "|a_A|", "|a_B|"],
          emptyCols: 8,
        })}
      </div>

      ${theoryPage({
        title: "Forces come in interaction pairs",
        lead: "Equal magnitude, opposite direction, two objects — never two arrows on the same FBD.",
        cards: [
          {
            title: "The pair identity",
            anim: "third-law",
            caption: `${S.f("Orange F_A on B")} and ${S.v("teal F_B on A")} are one interaction: equal size, opposite direction, two objects.`,
            eq: eqLines(`${S.f("F")}<sub>A on B</sub> = − ${S.v("F")}<sub>B on A</sub>`),
            vars: [
              eqVar("f", "F_A on B", "force on B from A", "N"),
              eqVar("v", "F_B on A", "force on A from B", "N"),
            ],
          },
          {
            title: "Equal force is not equal acceleration",
            anim: "f-ma",
            caption: `The pair is equal. ${S.a("Orange a")} is not, if the ${S.m("green masses")} differ.`,
            eq: eqLines(`${S.a()} = ${S.f()} / ${S.m()}`),
            vars: [
              eqVar("a", "a", "acceleration of that object", "m/s²"),
              eqVar("f", "F", "net force on that object", "N"),
              eqVar("m", "m", "that object’s mass", "kg"),
            ],
          },
        ],
        graphs: [
          {
            id: "pair-opposite",
            title: "F_B on A vs. F_A on B",
            caption: "Every third-law pair sits on the line y = −x. Same size, opposite sign.",
          },
        ],
        fit: `<p>The pair magnitude vs. the interaction strength should be a line through the origin with slope 1.</p>`,
      })}
    </section>
  `;
}

export function sim24Page() {
  return `
    <section class="sim-shell">
      <header class="sim-header">
        <div>
          <p class="kicker">Unit 2 · Simulation 2.4</p>
          <h1>Newton's First Law</h1>
          <p class="objective">Learning objective: If the net external force on an object is zero, its velocity remains constant. Rest is the special case v = 0. Inertia is not a force.</p>
          <p class="sim-nav"><a href="/simulations/module-2/2-3" data-link>← 2.3</a> · <a href="/simulations/module-2" data-link>Module 2</a> · <a href="/simulations/module-2/2-5" data-link>2.5 →</a></p>
        </div>
        <div class="sim-toolbar">
          ${labIconToolbar()}
        </div>
      </header>

      ${labTablist()}

      <div id="panel-lab" role="tabpanel" aria-labelledby="tab-btn-lab">
        <div class="workspace">
          <section class="stage track-stage motion-stage firstlaw-stage" aria-label="Horizontal first-law scene">
            <canvas id="axis-canvas" width="960" height="340" aria-label="Object on a horizontal surface with force arrows and a velocity arrow"></canvas>
            <div class="transport" id="playback-controls">
              <button type="button" class="btn primary" id="btn-play">Play</button>
              <button type="button" class="btn" id="btn-pause" disabled>Pause</button>
              <button type="button" class="btn" id="btn-step">Step +0.1 s</button>
              <button type="button" class="btn" id="btn-check-24">Check</button>
              <span class="transport-gap"></span>
              <label class="switch light">
                <input id="auto-record" type="checkbox" />
                Auto-record
              </label>
              <button type="button" class="btn" id="btn-reset-run">Reset</button>
              <button type="button" class="btn" id="btn-record">Record Trial</button>
              <button type="button" class="btn" id="btn-clear">Clear Trials</button>
            </div>
            <div class="track-controls">
              <div class="control" id="scenario-selector">
                <div class="control-head"><span>Scenario</span></div>
                <div class="presets" role="group" aria-label="First-law scenarios">
                  <button type="button" class="chip" data-scenario="rest">At rest</button>
                  <button type="button" class="chip" data-scenario="moving-eq">Moving, F_net = 0</button>
                  <button type="button" class="chip" data-scenario="unbalanced">Unbalanced push</button>
                  <button type="button" class="chip" data-scenario="left-eq">Moving left, F_net = 0</button>
                  <button type="button" class="chip" data-scenario="remove-forces">Remove the forces</button>
                  <button type="button" class="chip" data-scenario="friction">Coast, then friction</button>
                  <button type="button" class="chip" data-scenario="inertia">Inertia comparison</button>
                  <button type="button" class="chip" data-scenario="custom">Custom</button>
                </div>
              </div>
              <div class="control">
                <div class="control-head"><span>Playback speed</span></div>
                <div class="presets" role="group" aria-label="Playback speed">
                  <button type="button" class="chip" data-speed="0.25">0.25×</button>
                  <button type="button" class="chip" data-speed="0.5">0.5×</button>
                  <button type="button" class="chip active" data-speed="1">1×</button>
                  <button type="button" class="chip" data-speed="2">2×</button>
                  <button type="button" class="chip" data-speed="4">4×</button>
                </div>
              </div>
              <div id="camera-host">${cameraModeControls(1)}</div>
              <div class="nudge-row motion-inputs object-only">
                <label class="pos-input">Mass<input id="mass-input" type="number" min="0.1" max="20" step="0.1" value="5" aria-label="Mass in kilograms" /><span>kg</span></label>
                <label class="pos-input">x₀<input id="x-input" type="number" step="0.5" value="0" aria-label="Initial position in meters" /><span>m</span></label>
                <label class="pos-input">v₀<input id="v-input" type="number" step="0.5" value="0" aria-label="Initial velocity in meters per second" /><span>m/s</span></label>
                <label class="pos-input">Duration<input id="duration-input" type="number" step="1" min="1" max="20" value="10" aria-label="Simulation duration in seconds" /><span>s</span></label>
              </div>
              <div class="nudge-row motion-inputs inertia-only" hidden>
                <label class="pos-input">m<sub>A</sub><input id="mass-a" type="number" min="0.1" max="20" step="0.1" value="2" aria-label="Mass of object A in kilograms" /><span>kg</span></label>
                <label class="pos-input">m<sub>B</sub><input id="mass-b" type="number" min="0.1" max="20" step="0.1" value="8" aria-label="Mass of object B in kilograms" /><span>kg</span></label>
                <label class="pos-input">Same F<input id="inertia-force" type="number" min="0" max="200" step="0.5" value="16" aria-label="Temporary net force applied to both objects in newtons" /><span>N</span></label>
                <label class="pos-input">Duration<input id="duration-inertia" type="number" step="1" min="1" max="20" value="10" aria-label="Inertia run duration in seconds" /><span>s</span></label>
              </div>
              <div class="nudge-row motion-inputs fbd-toggles">
                <label class="switch light"><input id="toggle-net" type="checkbox" checked /> Show net force</label>
                <label class="switch light"><input id="toggle-velocity" type="checkbox" checked /> Show velocity</label>
              </div>
              <div class="force-table-wrap object-only" id="force-controls">
                <table class="force-table">
                  <thead>
                    <tr><th>Force</th><th>Magnitude</th><th>Direction</th><th>Source</th><th></th></tr>
                  </thead>
                  <tbody id="force-body"></tbody>
                </table>
                <div class="nudge-row motion-inputs add-force-row">
                  <label class="pos-input">Add
                    <select id="add-type" aria-label="Force type to add">
                      <option value="applied">Applied</option>
                      <option value="friction">Friction</option>
                    </select>
                  </label>
                  <label class="pos-input">Magnitude<input id="add-mag" type="number" min="0" max="200" step="0.5" value="10" aria-label="New force magnitude in newtons" /><span>N</span></label>
                  <label class="pos-input">Direction
                    <select id="add-dir" aria-label="New force direction">
                      <option value="0">→ right</option>
                      <option value="180">← left</option>
                    </select>
                  </label>
                  <button type="button" class="btn" id="btn-add-force">Add force</button>
                  <button type="button" class="btn" id="btn-clear-horiz">Remove horizontal forces</button>
                  <button type="button" class="btn" id="btn-enable-friction">Enable friction</button>
                </div>
              </div>
              <p class="track-help">Force arrows are interactions on the object. The teal arrow is velocity, not a force. Zero net force does not mean zero velocity: it means acceleration is zero, so velocity stays whatever it already is. Camera: one object uses Origin, Follow, or Stationary; inertia comparison uses Fit objects, Origin, or Stationary.</p>
            </div>
          </section>

          <aside class="rail">
            <section class="card values-card" id="net-force-panel">
              <div class="card-head">
                <h2>Net force</h2>
                ${teacherSwitch()}
              </div>
              <div class="eq-status" id="eq-status" role="status">
                <strong id="eq-label">EQUILIBRIUM</strong>
                <span id="eq-net">Net force: 0 N</span>
                <span id="eq-detail">Acceleration = 0 m/s². Velocity remains constant.</span>
              </div>
              <dl class="metrics" id="force-sum"></dl>
              <p class="eq-block">F<sub>net</sub> = ΣF<br />a = F<sub>net</sub> / m<br />F<sub>net</sub> = 0 ⇒ a = 0 ⇒ v stays the same</p>
              <p id="debug-line" class="debug" hidden></p>
            </section>

            <section class="card values-card" id="motion-state-panel">
              <div class="card-head">
                <h2>Motion state</h2>
              </div>
              <dl class="metrics metrics-wide">
                <div><dt>Time</dt><dd id="read-t">0.00 s</dd></div>
                <div><dt>State</dt><dd id="read-motion">At Rest</dd></div>
                <div><dt>Position</dt><dd id="read-x">0.00 m</dd></div>
                <div><dt>Velocity</dt><dd id="read-v">0.00 m/s</dd></div>
                <div><dt>Acceleration</dt><dd id="read-a">0.00 m/s²</dd></div>
                <div><dt>Mass</dt><dd id="read-m">5.00 kg</dd></div>
              </dl>
              <p class="muted">At rest is constant velocity with v = 0. It is not a separate law.</p>
            </section>

            <section class="card values-card inertia-only" id="inertia-panel" hidden>
              <div class="card-head">
                <h2>Inertia comparison</h2>
              </div>
              <p class="muted">Same force on both. Inertia is the tendency of velocity to stay unchanged — not a force you draw on the FBD.</p>
              <dl class="metrics metrics-wide">
                <div><dt>F on A and B</dt><dd id="read-if">16.00 N</dd></div>
                <div><dt>m_A</dt><dd id="read-ma">2.00 kg</dd></div>
                <div><dt>a_A</dt><dd id="read-aa">8.00 m/s²</dd></div>
                <div><dt>m_B</dt><dd id="read-mb">8.00 kg</dd></div>
                <div><dt>a_B</dt><dd id="read-ab">2.00 m/s²</dd></div>
                <div><dt>Which Δv is larger?</dt><dd id="read-which">A (smaller mass)</dd></div>
              </dl>
            </section>

            ${challengeCard()}
            ${theoryLink()}

            <details class="why-cancel" id="law-panel">
              <summary>Newton's First Law</summary>
              <p>An object maintains constant velocity when the net external force on it is zero. That includes v = 0. Individual forces can still be present. A net force is what changes velocity.</p>
            </details>

            <div class="conn-cards">
              <p class="conn-card">Previously: <a href="/simulations/module-2/2-2" data-link>Review 2.2</a> — identify individual forces. Here you ask whether their sum changes velocity.</p>
              <p class="conn-card">Previously: <a href="/simulations/module-2/2-3" data-link>Review 2.3</a> — third-law pairs act on different objects. First law asks what happens to one object’s velocity when <em>its</em> net force is zero.</p>
              <p class="conn-card">Next: <a href="/simulations/module-2/2-5" data-link>Open 2.5</a> — when F<sub>net</sub> ≠ 0, acceleration is F<sub>net</sub> / m.</p>
            </div>
          </aside>
        </div>

        <section class="lab-bottom">
          <div class="graph-wrap diagram-wrap fbd-diagram object-only">
            <h2>Free-body diagram</h2>
            <canvas id="fbd-canvas" width="960" height="240" aria-label="Free-body diagram of forces on the object"></canvas>
            <p class="caption">Every enabled force still appears, even when they add to zero. Velocity is not drawn here.</p>
          </div>
        </section>

        <section class="lab-bottom">
          <div class="graph-wrap diagram-wrap">
            <h2>Motion diagram</h2>
            <canvas id="diagram-canvas" width="960" height="160" aria-label="Motion diagram of equal time steps"></canvas>
            <p class="caption">Equal spacing means constant velocity. Spreading dots mean speeding up.</p>
          </div>
        </section>

        <section class="lab-bottom motion-graphs">
          <p class="graph-hover" id="graph-hover" role="status">Hover a graph while paused to read t, v, a, and F_net together.</p>
          <div class="graph-toggles" role="group" aria-label="Graph visibility">
            <label><input type="checkbox" data-graph="x" checked /> Position vs. time</label>
            <label><input type="checkbox" data-graph="v" checked /> Velocity vs. time</label>
            <label><input type="checkbox" data-graph="a" checked /> Acceleration vs. time</label>
          </div>
          <div class="graphs graphs-three">
            <div class="graph-wrap" id="wrap-x">
              <h2>Position vs. time</h2>
              <canvas id="graph-xt" width="640" height="240" aria-label="Position versus time"></canvas>
              <p class="caption">Constant velocity is a straight line. Rest is a horizontal line.</p>
            </div>
            <div class="graph-wrap" id="wrap-v">
              <h2>Velocity vs. time</h2>
              <canvas id="graph-vt" width="640" height="240" aria-label="Velocity versus time"></canvas>
              <p class="caption">Zero net force makes this graph horizontal, even if that height is not zero.</p>
            </div>
            <div class="graph-wrap" id="wrap-a">
              <h2>Acceleration vs. time</h2>
              <canvas id="graph-at" width="640" height="240" aria-label="Acceleration versus time"></canvas>
              <p class="caption">Equilibrium is a = 0. Click while paused to jump the clock.</p>
            </div>
          </div>
        </section>

        ${trialSection({
          rangeTitle: "Your Trials · a vs. F_net",
          heightTitle: "Your Trials · v vs. t (recorded)",
          rangeCaption: "Keep mass fixed and change the horizontal net force. The solid identity is a = F_net / m.",
          heightCaption: "Record coasting and unbalanced runs. Constant velocity should sit on a horizontal line in v–t.",
          columns: ["Trial", "Scenario", "t", "m", "v", "F_net,x", "a_x", "State"],
          emptyCols: 8,
        })}
      </div>

      ${theoryPage({
        title: "Constant velocity when the net force is zero",
        lead: "If ΣF = 0, acceleration is zero, so velocity does not change. Rest is just v = 0.",
        cards: [
          {
            title: "Coast when F_net = 0",
            anim: "first-law-coast",
            caption: `No leftover ${S.f("F_net")}, so ${S.v("teal v")} stays — including sitting still.`,
            eq: eqLines(`Σ${S.f("F")} = 0 ⇒ ${S.a()} = 0 ⇒ ${S.v()} constant`),
            vars: [
              eqVar("f", "ΣF", "net force on the object", "N"),
              eqVar("a", "a", "acceleration", "m/s²"),
              eqVar("v", "v", "velocity — stays if a = 0", "m/s"),
            ],
          },
          {
            title: "Balanced forces are still forces",
            anim: "net-force",
            caption: `Two large opposite arrows can cancel. ${S.f("F_net")} can be zero without the forces themselves being zero.`,
            eq: eqLines(`balanced ≠ zero ${S.f("forces")}`),
            vars: [
              eqVar("f", "F_i", "real forces that may cancel", "N"),
              eqVar("f", "F_net", "leftover after adding them", "N"),
            ],
          },
        ],
        graphs: [
          {
            id: "a-vs-fnet-zero",
            title: "a vs. F_net when balanced",
            caption: "First law is the origin: F_net = 0 keeps a = 0, so v does not change.",
          },
        ],
        fit: `<p>Runs with F_net = 0 should keep v. A fitted a vs. F_net line should pass near the origin.</p>`,
      })}
    </section>
  `;
}

export function sim25Page() {
  return `
    <section class="sim-shell">
      <header class="sim-header">
        <div>
          <p class="kicker">Unit 2 · Simulation 2.5</p>
          <h1>Newton's Second Law</h1>
          <p class="objective">Learning objective: The acceleration of an object equals the net external force on it divided by its mass. Acceleration follows net force, not velocity.</p>
          <p class="sim-nav"><a href="/simulations/module-2/2-4" data-link>← 2.4</a> · <a href="/simulations/module-2" data-link>Module 2</a> · <a href="/simulations/module-2/2-6" data-link>2.6 →</a></p>
        </div>
        <div class="sim-toolbar">
          ${labIconToolbar()}
        </div>
      </header>

      ${labTablist()}

      <div id="panel-lab" role="tabpanel" aria-labelledby="tab-btn-lab">
        <div class="workspace">
          <section class="stage track-stage motion-stage firstlaw-stage secondlaw-stage" aria-label="Horizontal second-law scene" id="simulation-canvas">
            <canvas id="axis-canvas" width="960" height="340" aria-label="Object on a horizontal surface with force, velocity, and acceleration arrows"></canvas>
            <div class="transport" id="playback-controls">
              <button type="button" class="btn primary" id="btn-play">Play</button>
              <button type="button" class="btn" id="btn-pause" disabled>Pause</button>
              <button type="button" class="btn" id="btn-step">Step +0.1 s</button>
              <button type="button" class="btn" id="btn-check-25">Check</button>
              <span class="transport-gap"></span>
              <label class="switch light">
                <input id="auto-record" type="checkbox" />
                Auto-record
              </label>
              <button type="button" class="btn" id="btn-reset-run">Reset</button>
              <button type="button" class="btn" id="btn-record">Record Trial</button>
              <button type="button" class="btn" id="btn-clear">Clear Trials</button>
            </div>
            <div class="track-controls">
              <div class="control" id="scenario-selector">
                <div class="control-head"><span>Scenario</span></div>
                <div class="presets" role="group" aria-label="Second-law scenarios">
                  <button type="button" class="chip" data-scenario="basic">Basic: F = 10 N</button>
                  <button type="button" class="chip" data-scenario="double-force">Double force</button>
                  <button type="button" class="chip" data-scenario="double-mass">Double mass</button>
                  <button type="button" class="chip" data-scenario="zero-net">Zero net force</button>
                  <button type="button" class="chip" data-scenario="negative-net">Negative net force</button>
                  <button type="button" class="chip" data-scenario="opp-signs">v right, a left</button>
                  <button type="button" class="chip" data-scenario="three-stage">Three-stage motion</button>
                  <button type="button" class="chip" data-scenario="friction">Friction and net force</button>
                  <button type="button" class="chip" data-scenario="custom">Custom</button>
                </div>
              </div>
              <div class="control" id="relationship-investigation">
                <div class="control-head"><span>Investigation</span></div>
                <div class="presets" role="group" aria-label="Investigation mode">
                  <button type="button" class="chip" data-invest="off">Free explore</button>
                  <button type="button" class="chip" data-invest="force">Force → acceleration</button>
                  <button type="button" class="chip" data-invest="mass">Mass → acceleration</button>
                </div>
                <p class="track-help" id="invest-help">Vary one quantity while holding the other constant, then record trials.</p>
                <div class="presets" id="invest-values" role="group" aria-label="Investigation values" hidden></div>
              </div>
              <div class="control">
                <div class="control-head"><span>Playback speed</span></div>
                <div class="presets" role="group" aria-label="Playback speed">
                  <button type="button" class="chip" data-speed="0.25">0.25×</button>
                  <button type="button" class="chip" data-speed="0.5">0.5×</button>
                  <button type="button" class="chip active" data-speed="1">1×</button>
                  <button type="button" class="chip" data-speed="2">2×</button>
                  <button type="button" class="chip" data-speed="4">4×</button>
                </div>
              </div>
              <div id="camera-host">${cameraModeControls(1)}</div>
              <div class="nudge-row motion-inputs" id="mass-control">
                <label class="pos-input">Mass<input id="mass-input" type="number" min="0.5" max="20" step="0.1" value="5" aria-label="Mass in kilograms" /><span>kg</span></label>
                <label class="pos-input">x₀<input id="x-input" type="number" step="0.5" value="-8" aria-label="Initial position in meters" /><span>m</span></label>
                <label class="pos-input">v₀<input id="v-input" type="number" step="0.5" value="0" aria-label="Initial velocity in meters per second" /><span>m/s</span></label>
                <label class="pos-input">Duration<input id="duration-input" type="number" step="1" min="1" max="20" value="10" aria-label="Simulation duration in seconds" /><span>s</span></label>
              </div>
              <div class="nudge-row motion-inputs fbd-toggles">
                <label class="switch light" id="force-vector-toggle"><input id="toggle-vectors" type="checkbox" checked /> Force vectors</label>
                <label class="switch light"><input id="toggle-net" type="checkbox" checked /> Show net force</label>
                <label class="switch light"><input id="toggle-velocity" type="checkbox" checked /> Show velocity</label>
                <label class="switch light"><input id="toggle-accel" type="checkbox" checked /> Show acceleration</label>
                <label class="switch light"><input id="toggle-vertical" type="checkbox" checked /> Include vertical forces</label>
              </div>
              <div class="force-table-wrap" id="force-controls">
                <table class="force-table">
                  <thead>
                    <tr><th>Force</th><th>Magnitude</th><th>Direction</th><th>Source</th><th></th></tr>
                  </thead>
                  <tbody id="force-body"></tbody>
                </table>
                <div class="nudge-row motion-inputs add-force-row">
                  <label class="pos-input">Add
                    <select id="add-type" aria-label="Force type to add">
                      <option value="applied">Applied</option>
                      <option value="friction">Friction</option>
                    </select>
                  </label>
                  <label class="pos-input">Magnitude<input id="add-mag" type="number" min="0" max="200" step="0.5" value="10" aria-label="New force magnitude in newtons" /><span>N</span></label>
                  <label class="pos-input">Direction
                    <select id="add-dir" aria-label="New force direction">
                      <option value="0">→ right</option>
                      <option value="180">← left</option>
                    </select>
                  </label>
                  <button type="button" class="btn" id="btn-add-force">Add force</button>
                  <button type="button" class="btn" id="btn-clear-horiz">Remove horizontal forces</button>
                  <button type="button" class="btn" id="btn-enable-friction">Add 10 N friction</button>
                </div>
              </div>
              <p class="track-help">Brown arrows are forces. Teal is velocity. Gold is acceleration. Newton’s second law uses the net force, not one individual force. Camera: Origin, Follow object, or Stationary.</p>
            </div>
          </section>

          <aside class="rail">
            <section class="card values-card" id="net-force-panel">
              <div class="card-head">
                <h2>Net force</h2>
                ${teacherSwitch()}
              </div>
              <div class="eq-status" id="eq-status" role="status">
                <strong id="eq-label">NON-EQUILIBRIUM</strong>
                <span id="eq-net">Net force: +10 N</span>
                <span id="eq-detail">Right contributions minus left contributions.</span>
              </div>
              <dl class="metrics" id="force-sum"></dl>
              <p class="eq-block">F<sub>net</sub> = ΣF<br />a = F<sub>net</sub> / m</p>
              <p id="debug-line" class="debug" hidden></p>
            </section>

            <section class="card values-card" id="acceleration-panel">
              <div class="card-head">
                <h2>Acceleration</h2>
              </div>
              <dl class="metrics metrics-wide">
                <div><dt>Net force</dt><dd id="read-fnet">+10.00 N</dd></div>
                <div><dt>Mass</dt><dd id="read-m">5.00 kg</dd></div>
                <div><dt>Acceleration</dt><dd id="read-a">+2.00 m/s²</dd></div>
                <div><dt>Direction</dt><dd id="read-adir">→ right</dd></div>
              </dl>
              <p class="muted">a points with F<sub>net</sub>. It does not have to point with velocity.</p>
            </section>

            <section class="card values-card" id="velocity-panel">
              <div class="card-head">
                <h2>Velocity</h2>
              </div>
              <dl class="metrics metrics-wide">
                <div><dt>Time</dt><dd id="read-t">0.00 s</dd></div>
                <div><dt>State</dt><dd id="read-motion">Speeding Up</dd></div>
                <div><dt>Position</dt><dd id="read-x">−8.00 m</dd></div>
                <div><dt>Velocity</dt><dd id="read-v">0.00 m/s</dd></div>
              </dl>
              <p class="muted">Velocity is the current motion. Acceleration is how that motion is changing.</p>
            </section>

            ${challengeCard()}
            ${theoryLink()}

            <details class="why-cancel" id="law-panel">
              <summary>Newton's Second Law</summary>
              <p>Acceleration is caused by the net external force and is inversely proportional to mass. A force does not set velocity; it changes velocity through acceleration.</p>
            </details>

            <div class="conn-cards">
              <p class="conn-card">Previously: <a href="/simulations/module-2/2-4" data-link>Review 2.4</a> — when F<sub>net</sub> = 0, acceleration is zero and velocity stays constant. This lab asks what happens when F<sub>net</sub> ≠ 0.</p>
              <p class="conn-card">Previously: <a href="/simulations/module-2/2-2" data-link>Review 2.2</a> — you already know how to add forces. Here those forces determine acceleration.</p>
              <p class="conn-card">Next: <a href="/simulations/module-2/2-6" data-link>Open 2.6</a> — gravitational force is an interaction pair; a = F/m still decides each object’s acceleration.</p>
            </div>
          </aside>
        </div>

        <section class="lab-bottom">
          <div class="graph-wrap diagram-wrap fbd-diagram" id="fbd">
            <h2>Free-body diagram</h2>
            <canvas id="fbd-canvas" width="960" height="240" aria-label="Free-body diagram of forces on the object"></canvas>
            <p class="caption">Individual forces build the net force. Acceleration is not a force and is not drawn here.</p>
          </div>
        </section>

        <section class="lab-bottom">
          <div class="graph-wrap diagram-wrap" id="motion-diagram">
            <h2>Motion diagram</h2>
            <canvas id="diagram-canvas" width="960" height="160" aria-label="Motion diagram of equal time steps"></canvas>
            <p class="caption">Spreading dots mean speeding up. Closing dots mean slowing down. Equal spacing means constant velocity.</p>
          </div>
        </section>

        <section class="lab-bottom motion-graphs" id="graph-panel">
          <p class="graph-hover" id="graph-hover" role="status">Hover a graph while paused to read t, v, a, and F_net together.</p>
          <div class="graph-toggles" role="group" aria-label="Graph visibility">
            <label><input type="checkbox" data-graph="x" checked /> Position vs. time</label>
            <label><input type="checkbox" data-graph="v" checked /> Velocity vs. time</label>
            <label><input type="checkbox" data-graph="a" checked /> Acceleration vs. time</label>
            <label><input type="checkbox" data-graph="f" /> Net force vs. time</label>
          </div>
          <div class="graphs graphs-four">
            <div class="graph-wrap" id="wrap-x">
              <h2>Position vs. time</h2>
              <canvas id="graph-xt" width="640" height="240" aria-label="Position versus time"></canvas>
              <p class="caption">Constant acceleration curves this graph. Constant velocity is a straight line.</p>
            </div>
            <div class="graph-wrap" id="wrap-v">
              <h2>Velocity vs. time</h2>
              <canvas id="graph-vt" width="640" height="240" aria-label="Velocity versus time"></canvas>
              <p class="caption">Slope is acceleration. A horizontal line means a = 0.</p>
            </div>
            <div class="graph-wrap" id="wrap-a">
              <h2>Acceleration vs. time</h2>
              <canvas id="graph-at" width="640" height="240" aria-label="Acceleration versus time"></canvas>
              <p class="caption">Constant net force is a horizontal line. Click while paused to jump the clock.</p>
            </div>
            <div class="graph-wrap" id="wrap-f" hidden>
              <h2>Net force vs. time</h2>
              <canvas id="graph-ft" width="640" height="240" aria-label="Net force versus time"></canvas>
              <p class="caption">a(t) should match this graph divided by the current mass.</p>
            </div>
          </div>
        </section>

        <div id="data-table">
        ${trialSection({
          rangeTitle: "Your Trials · a vs. F_net",
          heightTitle: "Your Trials · a vs. m",
          rangeCaption: "Keep mass fixed and change F_net. The solid identity is a = F_net / m. Slope is 1/m.",
          heightCaption: "Keep F_net fixed and change mass. This should look inverse, not linear. Optional: plot a vs 1/m.",
          columns: ["Trial", "Scenario", "t", "m", "F_net,x", "a_x", "v", "State"],
          emptyCols: 8,
        })}
        </div>
        <p class="caption invest-linearize"><label><input type="checkbox" id="toggle-inv-mass" /> Linearize mass: plot a vs 1/m</label></p>
      </div>

      ${theoryPage({
        title: "Acceleration from net force and mass",
        lead: "Acceleration is proportional to net force and inversely proportional to mass.",
        cards: [
          {
            title: "a = F_net / m",
            anim: "f-ma",
            caption: `${S.a("Orange a")} grows with ${S.f("F_net")} and shrinks as ${S.m("green m")} grows. The ratio is the acceleration.`,
            eq: eqLines(`${S.a()} = ${S.f("F")}<sub>net</sub> / ${S.m()}`),
            vars: [
              eqVar("a", "a", "acceleration of the object", "m/s²"),
              eqVar("f", "F_net", "vector sum of external forces", "N"),
              eqVar("m", "m", "mass of that object", "kg"),
            ],
          },
          {
            title: "Force does not set velocity",
            anim: "speeding-slowing",
            caption: `${S.f("F_net")} sets ${S.a("a")}, which changes ${S.v("v")}. A force to the right can still be slowing an object that is moving left.`,
            eq: eqLines(`${S.f("F")}<sub>net</sub> ↔ ${S.a()}, not ${S.v()}`),
            vars: [
              eqVar("f", "F_net", "sets acceleration, not speed", "N"),
              eqVar("a", "a", "how fast velocity is changing", "m/s²"),
              eqVar("v", "v", "velocity — history plus a Δt", "m/s"),
            ],
          },
        ],
        graphs: [
          {
            id: "a-vs-fnet",
            title: "a vs. F_net",
            caption: "At fixed m = 2 kg the identity is a line through the origin with slope 1/m = 0.5 kg⁻¹.",
          },
        ],
        fit: `<p>a vs. F_net at fixed m is a line through the origin with slope 1/m. a vs. 1/m at fixed F_net has slope F_net.</p>`,
      })}
    </section>
  `;
}

export function sim26Page() {
  return `
    <section class="sim-shell">
      <header class="sim-header">
        <div>
          <p class="kicker">Unit 2 · Simulation 2.6</p>
          <h1>Gravitational Force</h1>
          <p class="objective">Learning objective: Gravitational force is an attractive interaction between masses. Fg = G m1 m2 / r², with r measured center to center. Near Earth, Fg = mg is the same law.</p>
          <p class="sim-nav"><a href="/simulations/module-2/2-5" data-link>← 2.5</a> · <a href="/simulations/module-2" data-link>Module 2</a> · <a href="/simulations/module-2/2-7" data-link>2.7 →</a></p>
        </div>
        <div class="sim-toolbar">
          ${labIconToolbar()}
        </div>
      </header>

      ${labTablist()}

      <div id="panel-lab" role="tabpanel" aria-labelledby="tab-btn-lab">
        <div class="workspace">
          <section class="stage track-stage motion-stage gravity-stage" aria-label="Two-mass gravitational interaction" id="simulation-canvas">
            <canvas id="axis-canvas" width="960" height="360" aria-label="Two objects with center-to-center separation and gravitational force arrows"></canvas>
            <div class="transport" id="playback-controls">
              <button type="button" class="btn primary" id="btn-play">Play</button>
              <button type="button" class="btn" id="btn-pause" disabled>Pause</button>
              <button type="button" class="btn" id="btn-step">Step +0.1 s</button>
              <button type="button" class="btn" id="btn-check-26">Check</button>
              <span class="transport-gap"></span>
              <label class="switch light">
                <input id="auto-record" type="checkbox" />
                Auto-record
              </label>
              <button type="button" class="btn" id="btn-reset-run">Reset</button>
              <button type="button" class="btn" id="btn-record">Record Trial</button>
              <button type="button" class="btn" id="btn-clear">Clear Trials</button>
            </div>
            <div class="track-controls">
              <div class="control" id="scenario-selector">
                <div class="control-head"><span>Scenario</span></div>
                <div class="presets" role="group" aria-label="Gravity scenarios">
                  <button type="button" class="chip" data-scenario="basic">Basic attraction</button>
                  <button type="button" class="chip" data-scenario="double-one">Double one mass</button>
                  <button type="button" class="chip" data-scenario="double-both">Double both masses</button>
                  <button type="button" class="chip" data-scenario="double-distance">Double distance</button>
                  <button type="button" class="chip" data-scenario="unequal">Unequal masses</button>
                  <button type="button" class="chip" data-scenario="earth-surface" id="earth-mode">Earth surface</button>
                  <button type="button" class="chip" data-scenario="earth-altitude">Earth at altitude</button>
                  <button type="button" class="chip" data-scenario="orbit" id="orbit-mode">Orbit extension</button>
                </div>
              </div>
              <div class="control" id="relationship-investigation">
                <div class="control-head"><span>Investigation</span></div>
                <div class="presets" role="group" aria-label="Investigation mode" id="relationship-selector">
                  <button type="button" class="chip" data-invest="off">Free explore</button>
                  <button type="button" class="chip" data-invest="m1">Force vs. m1</button>
                  <button type="button" class="chip" data-invest="m2">Force vs. m2</button>
                  <button type="button" class="chip" data-invest="r">Force vs. r</button>
                  <button type="button" class="chip" data-invest="invsq">Force vs. 1/r²</button>
                  <button type="button" class="chip" data-invest="field">g vs. r</button>
                  <button type="button" class="chip" data-invest="earthm">Force vs. test mass</button>
                </div>
                <p class="track-help" id="invest-help">Vary one quantity while holding the others constant, then record trials.</p>
                <div class="presets" id="invest-values" role="group" aria-label="Investigation values" hidden></div>
              </div>
              <div class="control">
                <div class="control-head"><span>Quick scale</span></div>
                <div class="presets" role="group" aria-label="Scale masses and distance">
                  <button type="button" class="chip" data-scale="m1-2">Double m1</button>
                  <button type="button" class="chip" data-scale="m2-2">Double m2</button>
                  <button type="button" class="chip" data-scale="both-2">Double both</button>
                  <button type="button" class="chip" data-scale="r-2">Double r</button>
                  <button type="button" class="chip" data-scale="r-3">Triple r</button>
                  <button type="button" class="chip" data-scale="r-0.5">Half r</button>
                  <button type="button" class="chip" data-scale="r-4">Quadruple r</button>
                </div>
                <p class="track-help" id="scale-ratio">Force ratio after last scale: —</p>
              </div>
              <div class="control">
                <div class="control-head"><span>Playback speed</span></div>
                <div class="presets" role="group" aria-label="Playback speed">
                  <button type="button" class="chip" data-speed="0.25">0.25×</button>
                  <button type="button" class="chip" data-speed="0.5">0.5×</button>
                  <button type="button" class="chip active" data-speed="1">1×</button>
                  <button type="button" class="chip" data-speed="2">2×</button>
                  <button type="button" class="chip" data-speed="4">4×</button>
                </div>
              </div>
              <div id="camera-host">${cameraModeControls(2)}</div>
              <div class="nudge-row motion-inputs" id="mass-controls">
                <label class="pos-input" id="object-a">m1<input id="m1-input" type="number" min="1" step="any" value="1000" aria-label="Mass of object A in kilograms" /><span>kg</span></label>
                <label class="pos-input" id="object-b">m2<input id="m2-input" type="number" min="1" step="any" value="1000" aria-label="Mass of object B in kilograms" /><span>kg</span></label>
                <label class="pos-input" id="distance-control">r<input id="r-input" type="number" min="0.01" step="any" value="10" aria-label="Center-to-center separation in meters" /><span>m</span></label>
                <label class="pos-input" id="height-control">h<input id="h-input" type="number" min="0" step="any" value="0" aria-label="Height above Earth's surface in meters" /><span>m</span></label>
              </div>
              <div class="presets" id="height-presets" role="group" aria-label="Height above Earth">
                <button type="button" class="chip" data-height="0">h = 0</button>
                <button type="button" class="chip" data-height="1000">1 km</button>
                <button type="button" class="chip" data-height="10000">10 km</button>
                <button type="button" class="chip" data-height="100000">100 km</button>
                <button type="button" class="chip" data-height="1000000">1000 km</button>
                <button type="button" class="chip" data-height="${6.371e6}">h = R_E</button>
              </div>
              <div class="nudge-row motion-inputs fbd-toggles">
                <label class="switch light" id="motion-mode"><input id="toggle-motion" type="checkbox" checked /> Motion mode</label>
                <label class="switch light"><input id="toggle-velocity" type="checkbox" checked /> Show velocity</label>
                <label class="switch light"><input id="toggle-accel" type="checkbox" checked /> Show acceleration</label>
                <label class="switch light" id="field-mode"><input id="toggle-field" type="checkbox" /> Field visualization</label>
                <label class="switch light"><input id="toggle-sci" type="checkbox" checked /> Scientific notation</label>
              </div>
              <div class="nudge-row motion-inputs" id="net-force-panel">
                <label class="pos-input">Extra force on A<input id="extra-a" type="number" step="any" value="0" aria-label="Optional extra force on object A in newtons" /><span>N</span></label>
                <p class="track-help">Optional. Gravity is not automatically the net force. A normal force or applied force can balance weight.</p>
              </div>
              <p class="track-help" id="gravity-force-vectors">Play moves the pair toward each other. Motion is sped up so you can see the attraction; the force readout still uses real G. Turn Motion mode off to freeze and measure Fg. Brown arrows are gravitational forces. Teal is velocity. Gold is acceleration. r is center-to-center. Camera: Fit objects, Origin, or Stationary.</p>
            </div>
          </section>

          <aside class="rail">
            <section class="card values-card" id="force-display">
              <div class="card-head">
                <h2>Gravitational force</h2>
                ${teacherSwitch()}
              </div>
              <div class="eq-status" id="eq-status" role="status">
                <strong id="eq-label">ATTRACTIVE PAIR</strong>
                <span id="eq-net">Fg = —</span>
                <span id="eq-detail">r is <span id="distance-marker">center-to-center</span>.</span>
              </div>
              <p class="eq-block" id="equation-display">F<sub>g</sub> = G m<sub>1</sub> m<sub>2</sub> / r²</p>
              <p class="eq-block" id="eq-sub">—</p>
              <p id="debug-line" class="debug" hidden></p>
            </section>

            <section class="card values-card" id="force-pair-panel">
              <div class="card-head">
                <h2>Force pair</h2>
              </div>
              <dl class="metrics metrics-wide">
                <div><dt>F on A by B</dt><dd id="read-fa">—</dd></div>
                <div><dt>F on B by A</dt><dd id="read-fb">—</dd></div>
                <div><dt>|FA| = |FB|?</dt><dd id="read-equal">yes</dd></div>
                <div><dt>Directions</dt><dd id="read-dirs">toward each other</dd></div>
              </dl>
              <p class="muted">Same interaction, two objects. That is Simulation 2.3 applied to gravity.</p>
            </section>

            <section class="card values-card" id="acceleration-panel">
              <div class="card-head">
                <h2>Acceleration and field</h2>
              </div>
              <dl class="metrics metrics-wide">
                <div><dt>a_A</dt><dd id="read-aa">—</dd></div>
                <div><dt>a_B</dt><dd id="read-ab">—</dd></div>
                <div><dt>g at B</dt><dd id="read-g">—</dd></div>
                <div><dt>Fg / m2</dt><dd id="read-fgm">—</dd></div>
              </dl>
              <p class="muted">g is the field of the source at a location. Fg is the force on a test mass there.</p>
            </section>

            ${challengeCard()}
            ${theoryLink()}

            <details class="why-cancel" id="law-panel">
              <summary>Universal gravitation</summary>
              <p>Every pair of masses attracts. The force grows with each mass and falls as 1/r². Near Earth’s surface the same law looks like Fg = mg because g = G M_E / R_E² is nearly constant.</p>
            </details>

            <div class="conn-cards">
              <p class="conn-card">Previously: <a href="/simulations/module-2/2-3" data-link>Review 2.3</a> — a gravitational pair is equal, opposite, and on two objects.</p>
              <p class="conn-card">Previously: <a href="/simulations/module-2/2-5" data-link>Review 2.5</a> — equal forces do not mean equal accelerations. a = F/m.</p>
              <p class="conn-card">Next: <a href="/simulations/module-2/2-7" data-link>Open 2.7</a> — friction is a different contact interaction. Gravity is not automatically the net force.</p>
            </div>
          </aside>
        </div>

        <div id="graph-panel">
        <div id="data-table">
        ${trialSection({
          rangeTitle: "Your Trials · Fg vs. r",
          heightTitle: "Your Trials · Fg vs. 1/r²",
          rangeCaption: "Hold the masses fixed and change r. This should curve, not form a line through the origin.",
          heightCaption: "For fixed masses this is linear. The slope is G m1 m2.",
          columns: ["Trial", "m1 (kg)", "m2 (kg)", "r (m)", "Fg (N)", "1/r² (m⁻²)"],
          emptyCols: 6,
        })}
        </div>
        </div>
        <p class="track-help" id="field-visualization" hidden>Field arrows on the canvas show g of the source. They are not forces drawn by the test mass.</p>
      </div>

      ${theoryPage({
        title: "Gravity as an interaction, not a slogan",
        lead: "Two masses pull equally on each other. The force grows with each mass and falls as 1/r².",
        cards: [
          {
            title: "Inverse-square pull",
            anim: "gravity-inverse-square",
            caption: `Spread the ${S.m("masses")} and ${S.f("orange F_g")} shrinks as 1/${S.r("r")}². The pair stays equal and opposite.`,
            eq: eqLines(`${S.f("F")}<sub>g</sub> = G ${S.m()}<sub>1</sub> ${S.m()}<sub>2</sub> / ${S.r()}²`),
            vars: [
              eqVar("f", "F_g", "gravitational force on each mass", "N"),
              eqVar("m", "m₁, m₂", "the two interacting masses", "kg"),
              eqVar("r", "r", "center-to-center separation", "m"),
              eqVar("k", "G", "universal constant", "N·m²/kg²"),
            ],
          },
          {
            title: "Equal force, different acceleration",
            anim: "f-ma",
            caption: `Earth and the apple share ${S.f("F_g")}. The apple’s ${S.a("a")} is huge; Earth’s is tiny because ${S.m("m")} differs.`,
            eq: eqLines(`${S.a()} = ${S.f("F")}<sub>g</sub> / ${S.m()}`),
            vars: [
              eqVar("a", "a", "acceleration of that mass", "m/s²"),
              eqVar("f", "F_g", "same size on both objects", "N"),
              eqVar("m", "m", "that object’s mass", "kg"),
            ],
          },
        ],
        graphs: [
          {
            id: "fg-vs-r",
            title: "F_g vs. r",
            caption: "At fixed masses, F_g falls as 1/r². Doubling r cuts the force by four.",
          },
        ],
        fit: `<p>Fg vs. 1/r² at fixed masses should be a line. Doubling one mass doubles Fg.</p>`,
      })}
    </section>
  `;
}

export function sim27Page() {
  return `
    <section class="sim-shell">
      <header class="sim-header">
        <div>
          <p class="kicker">Unit 2 · Simulation 2.7</p>
          <h1>Kinetic and Static Friction</h1>
          <p class="objective">Learning objective: Static friction balances up to μ<sub>s</sub> N. Kinetic friction is μ<sub>k</sub> N opposite sliding. The two are different models, not two names for μN.</p>
          <p class="sim-nav"><a href="/simulations/module-2/2-6" data-link>← 2.6</a> · <a href="/simulations/module-2" data-link>Module 2</a> · <a href="/simulations/module-2/2-8" data-link>2.8 →</a></p>
        </div>
        <div class="sim-toolbar">
          ${labIconToolbar()}
        </div>
      </header>

      ${labTablist()}

      <div id="panel-lab" role="tabpanel" aria-labelledby="tab-btn-lab">
        <div class="workspace">
          <section class="stage track-stage motion-stage firstlaw-stage friction-stage" aria-label="Block on a horizontal surface" id="simulation-canvas">
            <canvas id="axis-canvas" width="960" height="340" aria-label="Block on a surface with weight, normal, applied, and friction arrows"></canvas>
            <div class="transport" id="playback-controls">
              <button type="button" class="btn primary" id="btn-play">Play</button>
              <button type="button" class="btn" id="btn-pause" disabled>Pause</button>
              <button type="button" class="btn" id="btn-step">Step +0.1 s</button>
              <button type="button" class="btn" id="btn-check-27">Check</button>
              <span class="transport-gap"></span>
              <label class="switch light">
                <input id="auto-record" type="checkbox" />
                Auto-record
              </label>
              <button type="button" class="btn" id="btn-reset-run">Reset</button>
              <button type="button" class="btn" id="btn-record">Record Trial</button>
              <button type="button" class="btn" id="btn-clear">Clear Trials</button>
            </div>
            <div class="track-controls">
              <div class="control" id="scenario-selector">
                <div class="control-head"><span>Scenario</span></div>
                <div class="presets" role="group" aria-label="Friction scenarios">
                  <button type="button" class="chip" data-scenario="rest">No applied force</button>
                  <button type="button" class="chip" data-scenario="below">Below threshold</button>
                  <button type="button" class="chip" data-scenario="near">Near threshold</button>
                  <button type="button" class="chip" data-scenario="sliding">Sliding</button>
                  <button type="button" class="chip" data-scenario="coast">Constant-speed sliding</button>
                  <button type="button" class="chip" data-scenario="decel">Decelerating</button>
                  <button type="button" class="chip" data-scenario="leftward">Leftward</button>
                  <button type="button" class="chip" data-scenario="custom">Custom</button>
                </div>
              </div>
              <div class="control" id="surface-preset-control">
                <div class="control-head"><span>Surface pair</span></div>
                <div class="presets" role="group" aria-label="Illustrative surface pairs">
                  <button type="button" class="chip" data-surface="ice">Low-friction</button>
                  <button type="button" class="chip" data-surface="wood">Wood-like</button>
                  <button type="button" class="chip" data-surface="rubber">Rubber-like</button>
                  <button type="button" class="chip" data-surface="rough">Rough</button>
                  <button type="button" class="chip" data-surface="custom">Custom</button>
                </div>
                <p class="track-help">Coefficients are illustrative models, not universal measurements of those materials.</p>
              </div>
              <div class="control" id="relationship-investigation">
                <div class="control-head"><span>Investigation</span></div>
                <div class="presets" role="group" aria-label="Investigation mode">
                  <button type="button" class="chip" data-invest="off">Free explore</button>
                  <button type="button" class="chip" data-invest="fapp">Friction vs. F_app</button>
                  <button type="button" class="chip" data-invest="fsmax">f<sub>s,max</sub> vs. N</button>
                  <button type="button" class="chip" data-invest="fk">f<sub>k</sub> vs. N</button>
                  <button type="button" class="chip" data-invest="anet">a vs. F_net</button>
                </div>
                <p class="track-help" id="invest-help">Vary one quantity while holding the others constant, then record trials.</p>
                <div class="presets" id="invest-values" role="group" aria-label="Investigation values" hidden></div>
              </div>
              <div class="control">
                <div class="control-head"><span>Playback speed</span></div>
                <div class="presets" role="group" aria-label="Playback speed">
                  <button type="button" class="chip" data-speed="0.25">0.25×</button>
                  <button type="button" class="chip" data-speed="0.5">0.5×</button>
                  <button type="button" class="chip active" data-speed="1">1×</button>
                  <button type="button" class="chip" data-speed="2">2×</button>
                  <button type="button" class="chip" data-speed="4">4×</button>
                </div>
              </div>
              <div id="camera-host">${cameraModeControls(1)}</div>
              <div class="nudge-row motion-inputs" id="mass-control">
                <label class="pos-input">Mass<input id="mass-input" type="number" min="0.5" max="50" step="0.1" value="5" aria-label="Mass in kilograms" /><span>kg</span></label>
                <label class="pos-input" id="applied-force-control">F<sub>app</sub><input id="fapp-input" type="number" min="-100" max="100" step="0.5" value="0" aria-label="Applied horizontal force in newtons" /><span>N</span></label>
                <label class="pos-input">v₀<input id="v-input" type="number" step="0.1" value="0" aria-label="Initial velocity in meters per second" /><span>m/s</span></label>
                <label class="pos-input">g<input id="g-input" type="number" min="1" max="20" step="0.01" value="9.81" aria-label="Gravitational field strength in meters per second squared" /><span>m/s²</span></label>
              </div>
              <div class="nudge-row motion-inputs">
                <label class="pos-input" id="static-coefficient-control">μ<sub>s</sub><input id="mus-input" type="number" min="0" max="1.5" step="0.01" value="0.50" aria-label="Coefficient of static friction" /></label>
                <label class="pos-input" id="kinetic-coefficient-control">μ<sub>k</sub><input id="muk-input" type="number" min="0" max="1.5" step="0.01" value="0.30" aria-label="Coefficient of kinetic friction" /></label>
                <label class="pos-input">Duration<input id="duration-input" type="number" step="1" min="1" max="20" value="10" aria-label="Simulation duration in seconds" /><span>s</span></label>
              </div>
              <p class="track-help" id="mu-note" hidden>μ<sub>k</sub> is larger than μ<sub>s</sub>. That is unusual for the introductory model; the math still runs with your values.</p>
              <div class="nudge-row motion-inputs fbd-toggles">
                <label class="switch light" id="force-vector-toggle"><input id="toggle-vectors" type="checkbox" checked /> Force vectors</label>
                <label class="switch light"><input id="toggle-net" type="checkbox" checked /> Show net force</label>
                <label class="switch light"><input id="toggle-velocity" type="checkbox" checked /> Show velocity</label>
                <label class="switch light"><input id="toggle-accel" type="checkbox" checked /> Show acceleration</label>
              </div>
              <p class="track-help" id="friction-animation">Brown arrows are forces. The friction arrow is the actual friction, not fs,max unless the block is at the limit. Teal is velocity. Gold is acceleration. Camera: Origin, Follow object, or Stationary.</p>
            </div>
          </section>

          <aside class="rail">
            <section class="card values-card" id="force-readout">
              <div class="card-head">
                <h2>Friction</h2>
                ${teacherSwitch()}
              </div>
              <div class="eq-status" id="eq-status" role="status">
                <strong id="eq-label">STATIONARY</strong>
                <span id="eq-net">Actual f = 0 N</span>
                <span id="eq-detail">fs,max is a limit, not the force at every rest.</span>
              </div>
              <dl class="metrics metrics-wide">
                <div><dt>Actual friction</dt><dd id="read-f">0.00 N</dd></div>
                <div><dt>fs,max = μs N</dt><dd id="read-fsmax">24.53 N</dd></div>
                <div><dt>fk = μk N</dt><dd id="read-fk">14.72 N</dd></div>
                <div><dt>Kind</dt><dd id="read-kind">static</dd></div>
              </dl>
              <p class="eq-block">f<sub>s</sub> ≤ μ<sub>s</sub> N<br />f<sub>k</sub> = μ<sub>k</sub> N</p>
              <p id="debug-line" class="debug" hidden></p>
            </section>

            <section class="card values-card" id="net-force-panel">
              <div class="card-head">
                <h2>Forces and net force</h2>
              </div>
              <dl class="metrics metrics-wide">
                <div><dt>F_app</dt><dd id="read-fapp">0.00 N</dd></div>
                <div><dt>N = mg</dt><dd id="read-n">49.05 N</dd></div>
                <div><dt>Weight</dt><dd id="read-w">49.05 N</dd></div>
                <div><dt>F_net,x</dt><dd id="read-fnet">0.00 N</dd></div>
              </dl>
              <p class="muted">Weight and N cancel vertically here. Friction is not the net force.</p>
            </section>

            <section class="card values-card" id="acceleration-panel">
              <div class="card-head">
                <h2>Motion</h2>
              </div>
              <dl class="metrics metrics-wide" id="velocity-panel">
                <div><dt>Mass</dt><dd id="read-m">5.00 kg</dd></div>
                <div><dt>a_x</dt><dd id="read-a">0.00 m/s²</dd></div>
                <div><dt>v</dt><dd id="read-v">0.00 m/s</dd></div>
                <div><dt>Δx</dt><dd id="read-dx">0.00 m</dd></div>
              </dl>
              <p class="muted">a follows F_net. v can point the other way while the block slows.</p>
            </section>

            ${challengeCard()}
            ${theoryLink()}

            <details class="why-cancel" id="law-panel">
              <summary>Static vs kinetic</summary>
              <p>Static friction changes as needed, up to μs N. Once sliding, kinetic friction is μk N opposite the velocity. Do not put fs,max into F = ma after the block is moving.</p>
            </details>

            <div class="conn-cards">
              <p class="conn-card">Previously: <a href="/simulations/module-2/2-4" data-link>Review 2.4</a> — F_net = 0 means constant velocity, including rest.</p>
              <p class="conn-card">Previously: <a href="/simulations/module-2/2-5" data-link>Review 2.5</a> — a = F_net / m. Friction is one of the forces in that sum.</p>
              <p class="conn-card">Next: <a href="/simulations/module-2/2-8" data-link>Open 2.8</a> — a spring is another interaction. Fs = −kx is not automatically the net force.</p>
            </div>
          </aside>
        </div>

        <section class="lab-bottom">
          <div class="graph-wrap diagram-wrap fbd-diagram" id="fbd">
            <h2>Free-body diagram</h2>
            <canvas id="fbd-canvas" width="960" height="240" aria-label="Free-body diagram of the block"></canvas>
            <p class="caption">The friction arrow is the actual friction on the block. fs,max is a threshold, not an extra force.</p>
          </div>
        </section>

        <section class="lab-bottom motion-graphs">
          <div class="graphs">
            <div class="graph-wrap" id="wrap-x">
              <h2>Position vs. time</h2>
              <canvas id="graph-xt" width="640" height="220" aria-label="Position versus time"></canvas>
            </div>
            <div class="graph-wrap" id="wrap-v">
              <h2>Velocity vs. time</h2>
              <canvas id="graph-vt" width="640" height="220" aria-label="Velocity versus time"></canvas>
            </div>
            <div class="graph-wrap" id="wrap-a">
              <h2>Acceleration vs. time</h2>
              <canvas id="graph-at" width="640" height="220" aria-label="Acceleration versus time"></canvas>
            </div>
          </div>
        </section>

        <div id="graph-panel">
        <div id="data-table">
        ${trialSection({
          rangeTitle: "Your Trials · friction vs. F_app",
          heightTitle: "Your Trials · fs,max vs. N",
          rangeCaption: "In the static region, actual friction should rise with F_app. After sliding it should sit near μk N.",
          heightCaption: "Hold coefficients fixed and change mass. fs,max vs. N should be a line through the origin with slope μs.",
          columns: ["Trial", "m", "N", "μs", "μk", "F_app", "fs,max", "f", "State", "F_net", "a"],
          emptyCols: 11,
        })}
        </div>
        </div>
      </div>

      ${theoryPage({
        title: "Two friction models, one contact",
        lead: "Static friction matches the push, up to a maximum. After sliding starts, kinetic friction has a size set by μk N.",
        cards: [
          {
            title: "Stuck, then sliding",
            anim: "static-kinetic",
            caption: `${S.f("Orange F_app")} rises. ${S.v("Teal f_s")} matches it until ${S.k("μ_s N")}. Then the block slides and ${S.a("f_k")} takes over.`,
            eq: eqLines(
              `${S.v("f")}<sub>s</sub> ≤ ${S.mu("μ")}<sub>s</sub> ${S.n()}`,
              `${S.a("f")}<sub>k</sub> = ${S.mu("μ")}<sub>k</sub> ${S.n()}`,
            ),
            vars: [
              eqVar("v", "f_s", "static friction — matches F_app up to a max", "N"),
              eqVar("a", "f_k", "kinetic friction once sliding", "N"),
              eqVar("mu", "μ_s, μ_k", "static and kinetic coefficients"),
              eqVar("n", "N", "normal force", "N"),
            ],
          },
          {
            title: "Net force is still ma",
            anim: "f-ma",
            caption: `While stuck, ${S.f("F_net")} = 0. While sliding, ${S.a("a")} = (${S.f("F_app")} − ${S.a("f_k")})/${S.m("m")}.`,
            eq: eqLines(`${S.f("F")}<sub>net</sub> = ${S.f("F")}<sub>app</sub> − ${S.a("f")}`),
            vars: [
              eqVar("f", "F_app", "applied push", "N"),
              eqVar("a", "f", "friction opposing that push", "N"),
              eqVar("f", "F_net", "leftover horizontal force", "N"),
              eqVar("m", "m", "mass of the block", "kg"),
            ],
          },
        ],
        graphs: [
          {
            id: "fs-vs-fapp",
            title: "friction vs. F_app",
            caption: "Static friction rises with the push until μ_s N, then kinetic friction is a lower plateau.",
          },
        ],
        fit: `<p>Below threshold, a stays 0. Above it, a vs. F_app should have slope 1/m.</p>`,
      })}
    </section>
  `;
}

export function sim28Page() {
  return `
    <section class="sim-shell">
      <header class="sim-header">
        <div>
          <p class="kicker">Unit 2 · Simulation 2.8</p>
          <h1>Spring Forces</h1>
          <p class="objective">Learning objective: An ideal spring exerts a restoring force F<sub>s</sub> = −kx. Stiffness k is not the force. Spring force is not automatically the net force.</p>
          <p class="sim-nav"><a href="/simulations/module-2/2-7" data-link>← 2.7</a> · <a href="/simulations/module-2" data-link>Module 2</a> · <a href="/simulations/module-2/2-9" data-link>2.9 →</a></p>
        </div>
        <div class="sim-toolbar">
          ${labIconToolbar()}
        </div>
      </header>

      ${labTablist()}

      <div id="panel-lab" role="tabpanel" aria-labelledby="tab-btn-lab">
        <div class="workspace">
          <section class="stage track-stage motion-stage firstlaw-stage spring-stage" aria-label="Block on a horizontal spring" id="simulation-canvas">
            <canvas id="axis-canvas" width="960" height="340" aria-label="Wall, spring, and block with restoring-force arrows"></canvas>
            <div class="transport" id="playback-controls">
              <button type="button" class="btn primary" id="btn-play">Play</button>
              <button type="button" class="btn" id="btn-pause" disabled>Pause</button>
              <button type="button" class="btn" id="btn-step">Step +0.1 s</button>
              <button type="button" class="btn" id="btn-check-28">Check</button>
              <span class="transport-gap"></span>
              <label class="switch light">
                <input id="auto-record" type="checkbox" />
                Auto-record
              </label>
              <button type="button" class="btn" id="btn-reset-run">Reset</button>
              <button type="button" class="btn" id="btn-record">Record Trial</button>
              <button type="button" class="btn" id="btn-clear">Clear Trials</button>
            </div>
            <div class="track-controls">
              <div class="control" id="scenario-selector">
                <div class="control-head"><span>Scenario</span></div>
                <div class="presets" role="group" aria-label="Spring scenarios">
                  <button type="button" class="chip" data-scenario="equilibrium">Equilibrium</button>
                  <button type="button" class="chip" data-scenario="stretch">Stretch +0.10 m</button>
                  <button type="button" class="chip" data-scenario="compress">Compress −0.10 m</button>
                  <button type="button" class="chip" data-scenario="double-x">Double x</button>
                  <button type="button" class="chip" data-scenario="double-k">Double k</button>
                  <button type="button" class="chip" data-scenario="double-both">Double both</button>
                  <button type="button" class="chip" data-scenario="heavy">Larger mass</button>
                  <button type="button" class="chip" data-scenario="shifted">Shifted equilibrium</button>
                  <button type="button" class="chip" data-scenario="oscillate">Oscillation</button>
                  <button type="button" class="chip" data-scenario="custom">Custom</button>
                </div>
              </div>
              <div class="control" id="motion-mode-control">
                <div class="control-head"><span>Mode</span></div>
                <div class="presets" role="group" aria-label="Hold or release the block">
                  <button type="button" class="chip" data-held="true">Hold position</button>
                  <button type="button" class="chip" data-held="false">Motion (release)</button>
                </div>
                <p class="track-help">Hold position sets x and computes Fs. Motion releases the block. A held stretch needs a holding force.</p>
              </div>
              <div class="control" id="relationship-investigation">
                <div class="control-head"><span>Investigation</span></div>
                <div class="presets" role="group" aria-label="Investigation mode">
                  <button type="button" class="chip" data-invest="off">Free explore</button>
                  <button type="button" class="chip" data-invest="fx">Fs vs. x</button>
                  <button type="button" class="chip" data-invest="mag">|Fs| vs. |x|</button>
                  <button type="button" class="chip" data-invest="k">Fs vs. k</button>
                  <button type="button" class="chip" data-invest="mass">a vs. m</button>
                  <button type="button" class="chip" data-invest="energy">Us vs. x</button>
                </div>
                <p class="track-help" id="invest-help">Vary one quantity while holding the others constant, then record trials.</p>
                <div class="presets" id="invest-values" role="group" aria-label="Investigation values" hidden></div>
              </div>
              <div class="control">
                <div class="control-head"><span>Playback speed</span></div>
                <div class="presets" role="group" aria-label="Playback speed">
                  <button type="button" class="chip" data-speed="0.25">0.25×</button>
                  <button type="button" class="chip" data-speed="0.5">0.5×</button>
                  <button type="button" class="chip" data-speed="1">1×</button>
                  <button type="button" class="chip" data-speed="2">2×</button>
                  <button type="button" class="chip" data-speed="4">4×</button>
                </div>
              </div>
              <div id="camera-host">${cameraModeControls(1)}</div>
              <div class="nudge-row motion-inputs" id="mass-control">
                <label class="pos-input">Mass<input id="mass-input" type="number" min="0.5" max="20" step="0.1" value="1" aria-label="Mass in kilograms" /><span>kg</span></label>
                <label class="pos-input" id="spring-constant-control">k<input id="k-input" type="number" min="1" max="200" step="1" value="20" aria-label="Spring constant in newtons per meter" /><span>N/m</span></label>
                <label class="pos-input" id="displacement-control">x<input id="x-input" type="number" min="-0.5" max="0.5" step="0.01" value="0.10" aria-label="Displacement from equilibrium in meters" /><span>m</span></label>
                <label class="pos-input">v₀<input id="v-input" type="number" min="-5" max="5" step="0.1" value="0" aria-label="Initial velocity in meters per second" /><span>m/s</span></label>
              </div>
              <div class="nudge-row motion-inputs">
                <label class="pos-input" id="applied-force-control">F<sub>app</sub><input id="fapp-input" type="number" min="-50" max="50" step="0.5" value="0" aria-label="Applied horizontal force in newtons" /><span>N</span></label>
                <label class="pos-input">Duration<input id="duration-input" type="number" step="1" min="1" max="20" value="10" aria-label="Simulation duration in seconds" /><span>s</span></label>
              </div>
              <div class="nudge-row motion-inputs fbd-toggles">
                <label class="switch light" id="force-vector-toggle"><input id="toggle-vectors" type="checkbox" checked /> Force vectors</label>
                <label class="switch light"><input id="toggle-net" type="checkbox" checked /> Show net force</label>
                <label class="switch light"><input id="toggle-velocity" type="checkbox" checked /> Show velocity</label>
                <label class="switch light"><input id="toggle-accel" type="checkbox" checked /> Show acceleration</label>
              </div>
              <p class="track-help" id="spring-animation">The wall is the anchor. The dashed marker is x = 0, the spring’s unstretched position. Brown arrows are forces. Teal is velocity. Gold is acceleration.</p>
            </div>
          </section>

          <aside class="rail">
            <section class="card values-card" id="force-readout">
              <div class="card-head">
                <h2>Spring force</h2>
                ${teacherSwitch()}
              </div>
              <div class="eq-status" id="eq-status" role="status">
                <strong id="eq-label">HELD</strong>
                <span id="eq-net">Fs = −2.00 N</span>
                <span id="eq-detail">A holding force keeps this stretch from moving.</span>
              </div>
              <dl class="metrics metrics-wide">
                <div><dt>Fs = −kx</dt><dd id="read-fs">−2.00 N</dd></div>
                <div><dt>|Fs|</dt><dd id="read-fsmag">2.00 N</dd></div>
                <div><dt>Holding force</dt><dd id="read-hold">+2.00 N</dd></div>
                <div><dt>x_eq = F_app/k</dt><dd id="read-xeq">0.00 m</dd></div>
              </dl>
              <p class="eq-block">F<sub>s</sub> = −kx</p>
              <p id="debug-line" class="debug" hidden></p>
            </section>

            <section class="card values-card" id="net-force-panel">
              <div class="card-head">
                <h2>Forces and net force</h2>
              </div>
              <dl class="metrics metrics-wide">
                <div><dt>x</dt><dd id="read-x">+0.10 m</dd></div>
                <div><dt>k</dt><dd id="read-k">20 N/m</dd></div>
                <div><dt>F_app</dt><dd id="read-fapp">0.00 N</dd></div>
                <div><dt>F_net (if released)</dt><dd id="read-fnet">−2.00 N</dd></div>
              </dl>
              <p class="muted">Weight and N cancel vertically. Spring force is not the net force when F_app is present.</p>
            </section>

            <section class="card values-card" id="acceleration-panel">
              <div class="card-head">
                <h2>Motion and energy</h2>
              </div>
              <dl class="metrics metrics-wide" id="velocity-panel">
                <div><dt>Mass</dt><dd id="read-m">1.00 kg</dd></div>
                <div><dt>a (if released)</dt><dd id="read-a">−2.00 m/s²</dd></div>
                <div><dt>v</dt><dd id="read-v">0.00 m/s</dd></div>
                <div><dt>T = 2π√(m/k)</dt><dd id="read-t">1.41 s</dd></div>
                <div><dt>Us = ½kx²</dt><dd id="read-us">0.10 J</dd></div>
                <div><dt>K + Us</dt><dd id="read-e">0.10 J</dd></div>
              </dl>
              <p class="muted">At x = 0, Fs = 0. Velocity can still be nonzero. The block does not have to stop there.</p>
            </section>

            ${challengeCard()}
            ${theoryLink()}

            <details class="why-cancel" id="law-panel">
              <summary>Restoring force</summary>
              <p>Fs points opposite x. A larger k is a stiffer spring, not a larger force at every position. At x = 0 the ideal spring force is zero no matter how large k is.</p>
            </details>

            <div class="conn-cards">
              <p class="conn-card">Previously: <a href="/simulations/module-2/2-5" data-link>Review 2.5</a> — a = F_net / m. Spring force is one term in that sum.</p>
              <p class="conn-card">Previously: <a href="/simulations/module-2/2-7" data-link>Review 2.7</a> — friction was a contact force. A spring is a different interaction.</p>
              <p class="conn-card">Next: <a href="/simulations/module-2/2-9" data-link>Open 2.9</a> — circular motion needs a center-seeking net force. Do not treat every restoring force as friction.</p>
            </div>
          </aside>
        </div>

        <section class="lab-bottom">
          <div class="graph-wrap diagram-wrap fbd-diagram" id="fbd">
            <h2>Free-body diagram</h2>
            <canvas id="fbd-canvas" width="960" height="240" aria-label="Free-body diagram of the block on the spring"></canvas>
            <p class="caption" id="equilibrium-marker">The dashed marker on the scene is the spring’s x = 0. A holding force is drawn only while the block is held.</p>
          </div>
        </section>

        <section class="lab-bottom motion-graphs">
          <div class="graphs">
            <div class="graph-wrap" id="wrap-x">
              <h2>Position vs. time</h2>
              <canvas id="graph-xt" width="640" height="220" aria-label="Displacement versus time"></canvas>
            </div>
            <div class="graph-wrap" id="wrap-v">
              <h2>Velocity vs. time</h2>
              <canvas id="graph-vt" width="640" height="220" aria-label="Velocity versus time"></canvas>
            </div>
            <div class="graph-wrap" id="wrap-a">
              <h2>Acceleration vs. time</h2>
              <canvas id="graph-at" width="640" height="220" aria-label="Acceleration versus time"></canvas>
            </div>
          </div>
        </section>

        <div id="graph-panel">
        <div id="data-table">
        ${trialSection({
          rangeTitle: "Your Trials · Fs vs. x",
          heightTitle: "Your Trials · |Fs| vs. |x|",
          rangeCaption: "Signed spring force vs. signed displacement should be a line through the origin with slope −k.",
          heightCaption: "Force magnitude vs. displacement magnitude should be a line through the origin with slope +k.",
          columns: ["Trial", "m", "k", "x", "Fs", "F_app", "F_net", "a", "v", "Us", "Mode"],
          emptyCols: 11,
        })}
        </div>
        </div>
      </div>

      ${theoryPage({
        title: "A restoring force proportional to stretch",
        lead: "An ideal spring pulls or pushes toward x = 0 with size k|x|.",
        cards: [
          {
            title: "Hooke’s law",
            anim: "hooke",
            caption: `${S.x("Displacement")} right, ${S.f("orange F_s")} left. Larger |x| means a larger restoring force.`,
            eq: eqLines(`${S.f("F")}<sub>s</sub> = −${S.k("k")} ${S.x()}`),
            vars: [
              eqVar("f", "F_s", "spring force — toward equilibrium", "N"),
              eqVar("k", "k", "stiffness, not the force", "N/m"),
              eqVar("x", "x", "signed displacement from equilibrium", "m"),
            ],
          },
          {
            title: "Release and oscillate",
            anim: "hooke",
            caption: `Hold, then let go. The block passes ${S.x("x = 0")} with speed and comes back. Period grows with ${S.m("m")} and shrinks with ${S.k("k")}.`,
            eq: eqLines(`${S.t("T")} = 2π √(${S.m()} / ${S.k("k")})`),
            vars: [
              eqVar("t", "T", "period of one cycle", "s"),
              eqVar("m", "m", "mass on the spring", "kg"),
              eqVar("k", "k", "spring stiffness", "N/m"),
            ],
          },
        ],
        graphs: [
          {
            id: "fs-vs-x",
            title: "F_s vs. x",
            caption: "An ideal spring is a line through the origin with slope −k. This example uses k = 20 N/m.",
          },
        ],
        fit: `<p>Fs vs. x should be a line through the origin with slope −k.</p>`,
      })}
    </section>
  `;
}

export function sim29Page() {
  return `
    <section class="sim-shell">
      <header class="sim-header">
        <div>
          <p class="kicker">Unit 2 · Simulation 2.9</p>
          <h1>Circular Motion</h1>
          <p class="objective">Learning objective: Uniform circular motion has tangent velocity and inward acceleration a<sub>c</sub> = v²/r. The required net inward force is m v²/r, supplied by real forces, not by an extra “centripetal” interaction.</p>
          <p class="sim-nav"><a href="/simulations/module-2/2-8" data-link>← 2.8</a> · <a href="/simulations/module-2" data-link>Module 2</a> · <a href="/simulations/module-3/3-1" data-link>3.1 →</a></p>
        </div>
        <div class="sim-toolbar">
          ${labIconToolbar()}
        </div>
      </header>

      ${labTablist()}

      <div id="panel-lab" role="tabpanel" aria-labelledby="tab-btn-lab">
        <div class="workspace">
          <section class="stage track-stage motion-stage firstlaw-stage circle-stage" aria-label="Object on a circular path" id="simulation-canvas">
            <canvas id="axis-canvas" width="960" height="420" aria-label="Circular path with tangent velocity and inward acceleration"></canvas>
            <div class="transport" id="playback-controls">
              <button type="button" class="btn primary" id="btn-play">Play</button>
              <button type="button" class="btn" id="btn-pause" disabled>Pause</button>
              <button type="button" class="btn" id="btn-step">Step +0.1 s</button>
              <button type="button" class="btn" id="btn-check-29">Check</button>
              <span class="transport-gap"></span>
              <label class="switch light">
                <input id="auto-record" type="checkbox" />
                Auto-record
              </label>
              <button type="button" class="btn" id="btn-reset-run">Reset</button>
              <button type="button" class="btn" id="btn-record">Record Trial</button>
              <button type="button" class="btn" id="btn-clear">Clear Trials</button>
            </div>
            <div class="track-controls">
              <div class="control" id="preset-selector">
                <div class="control-head"><span>Preset</span></div>
                <div class="presets" role="group" aria-label="Circular-motion presets">
                  <button type="button" class="chip" data-scenario="baseline">Baseline</button>
                  <button type="button" class="chip" data-scenario="double-v">Double speed</button>
                  <button type="button" class="chip" data-scenario="double-r">Double radius</button>
                  <button type="button" class="chip" data-scenario="double-m">Double mass</button>
                  <button type="button" class="chip" data-scenario="double-both">Double v and r</button>
                  <button type="button" class="chip" data-scenario="slow">Slow motion</button>
                  <button type="button" class="chip" data-scenario="clockwise">Clockwise</button>
                  <button type="button" class="chip" data-scenario="rest">Zero speed</button>
                  <button type="button" class="chip" data-scenario="friction-limit">Friction limit</button>
                  <button type="button" class="chip" data-scenario="custom">Custom</button>
                </div>
              </div>
              <div class="control" id="scenario-selector">
                <div class="control-head"><span>Force source</span></div>
                <div class="presets" role="group" aria-label="Which real force supplies the inward net force">
                  <button type="button" class="chip" data-source="string">String (tension)</button>
                  <button type="button" class="chip" data-source="friction">Friction (flat road)</button>
                  <button type="button" class="chip" data-source="orbit">Orbit (gravity)</button>
                </div>
                <p class="track-help">Centripetal force is the net inward force. These chips choose which real force supplies it.</p>
              </div>
              <div class="control" id="direction-control">
                <div class="control-head"><span>Rotation</span></div>
                <div class="presets" role="group" aria-label="Rotation direction">
                  <button type="button" class="chip" data-dir="1">Counterclockwise</button>
                  <button type="button" class="chip" data-dir="-1">Clockwise</button>
                </div>
              </div>
              <div class="control" id="angle-control">
                <div class="control-head"><span>Pause at a cardinal angle</span></div>
                <div class="presets" role="group" aria-label="Angular position">
                  <button type="button" class="chip" data-angle="0">Right 0°</button>
                  <button type="button" class="chip" data-angle="90">Top 90°</button>
                  <button type="button" class="chip" data-angle="180">Left 180°</button>
                  <button type="button" class="chip" data-angle="270">Bottom 270°</button>
                </div>
              </div>
              <div class="control" id="relationship-investigation">
                <div class="control-head"><span>Investigation</span></div>
                <div class="presets" role="group" aria-label="Investigation mode">
                  <button type="button" class="chip" data-invest="off">Free explore</button>
                  <button type="button" class="chip" data-invest="acv">ac vs. v</button>
                  <button type="button" class="chip" data-invest="acv2">ac vs. v²</button>
                  <button type="button" class="chip" data-invest="acr">ac vs. 1/r</button>
                  <button type="button" class="chip" data-invest="fcm">Fc vs. m</button>
                  <button type="button" class="chip" data-invest="fcv2">Fc vs. v²</button>
                  <button type="button" class="chip" data-invest="fcr">Fc vs. 1/r</button>
                  <button type="button" class="chip" data-invest="tv">T vs. v</button>
                  <button type="button" class="chip" data-invest="tr">T vs. r</button>
                </div>
                <p class="track-help" id="invest-help">Vary one quantity while holding the others constant, then record trials.</p>
                <div class="presets" id="invest-values" role="group" aria-label="Investigation values" hidden></div>
              </div>
              <div class="control">
                <div class="control-head"><span>Playback speed</span></div>
                <div class="presets" role="group" aria-label="Playback speed">
                  <button type="button" class="chip" data-speed="0.25">0.25×</button>
                  <button type="button" class="chip" data-speed="0.5">0.5×</button>
                  <button type="button" class="chip" data-speed="1">1×</button>
                  <button type="button" class="chip" data-speed="2">2×</button>
                  <button type="button" class="chip" data-speed="4">4×</button>
                </div>
              </div>
              <div id="camera-host">${cameraModeControls(1)}</div>
              <div class="nudge-row motion-inputs" id="mass-control">
                <label class="pos-input">Mass<input id="mass-input" type="number" min="0.5" max="50" step="0.1" value="1" aria-label="Mass in kilograms" /><span>kg</span></label>
                <label class="pos-input" id="radius-control">r<input id="r-input" type="number" min="0.5" max="20" step="0.1" value="2" aria-label="Radius of the circular path in meters" /><span>m</span></label>
                <label class="pos-input" id="speed-control">v<input id="v-input" type="number" min="0" max="20" step="0.1" value="4" aria-label="Speed in meters per second" /><span>m/s</span></label>
                <label class="pos-input">θ<input id="ang-input" type="number" min="0" max="359" step="1" value="0" aria-label="Initial angular position in degrees" /><span>°</span></label>
              </div>
              <div class="nudge-row motion-inputs">
                <label class="pos-input" id="mu-control">μ<sub>s</sub><input id="mu-input" type="number" min="0" max="1.5" step="0.05" value="0.5" aria-label="Coefficient of static friction" /></label>
                <label class="pos-input">Duration<input id="duration-input" type="number" step="1" min="1" max="20" value="10" aria-label="Simulation duration in seconds" /><span>s</span></label>
              </div>
              <div class="nudge-row motion-inputs fbd-toggles">
                <label class="switch light" id="force-vector-toggle"><input id="toggle-vectors" type="checkbox" checked /> Force vectors</label>
                <label class="switch light" id="velocity-vector"><input id="toggle-velocity" type="checkbox" checked /> Show velocity</label>
                <label class="switch light" id="acceleration-vector"><input id="toggle-accel" type="checkbox" checked /> Show acceleration</label>
                <label class="switch light"><input id="toggle-axes" type="checkbox" checked /> Axes</label>
                <label class="switch light"><input id="toggle-trail" type="checkbox" checked /> Trail</label>
              </div>
              <p class="track-help" id="circular-motion-animation">Teal is tangent velocity. Gold is inward acceleration. The brown or rust arrow is the real inward force for the selected scenario, not an extra centripetal interaction.</p>
            </div>
          </section>

          <aside class="rail">
            <section class="card values-card" id="force-readout">
              <div class="card-head">
                <h2>Centripetal motion</h2>
                ${teacherSwitch()}
              </div>
              <div class="eq-status" id="eq-status" role="status">
                <strong id="eq-label">UNIFORM CIRCULAR</strong>
                <span id="eq-net">ac = 8.00 m/s²</span>
                <span id="eq-detail">Velocity is tangent. Acceleration points toward the center.</span>
              </div>
              <dl class="metrics metrics-wide" id="physics-readouts">
                <div><dt>ac = v²/r</dt><dd id="read-ac">8.00 m/s²</dd></div>
                <div><dt>Fc = m ac</dt><dd id="read-fc">8.00 N</dd></div>
                <div><dt>ω = v/r</dt><dd id="read-omega">+2.00 rad/s</dd></div>
                <div><dt>T = 2πr/v</dt><dd id="read-t">3.14 s</dd></div>
                <div><dt>frequency</dt><dd id="read-f">0.32 Hz</dd></div>
              </dl>
              <p class="eq-block">a<sub>c</sub> = v²/r</p>
              <p id="debug-line" class="debug" hidden></p>
            </section>

            <section class="card values-card" id="net-force-panel">
              <div class="card-head">
                <h2>State</h2>
              </div>
              <dl class="metrics metrics-wide">
                <div><dt>Mass</dt><dd id="read-m">1.00 kg</dd></div>
                <div><dt>r</dt><dd id="read-r">2.00 m</dd></div>
                <div><dt>v</dt><dd id="read-v">4.00 m/s</dd></div>
                <div><dt>θ</dt><dd id="read-theta">0°</dd></div>
                <div><dt>v<sub>x</sub></dt><dd id="read-vx">0.00 m/s</dd></div>
                <div><dt>v<sub>y</sub></dt><dd id="read-vy">+4.00 m/s</dd></div>
                <div><dt>a<sub>x</sub></dt><dd id="read-ax">−8.00 m/s²</dd></div>
                <div><dt>a<sub>y</sub></dt><dd id="read-ay">0.00 m/s²</dd></div>
              </dl>
              <p class="muted" id="circle-center">The center is the origin. At the rightmost point, counterclockwise velocity points up and acceleration points left.</p>
            </section>

            <section class="card values-card" id="acceleration-panel">
              <div class="card-head">
                <h2>Force source</h2>
              </div>
              <dl class="metrics metrics-wide">
                <div><dt>Inward force</dt><dd id="read-source">T</dd></div>
                <div><dt>Magnitude</dt><dd id="read-inward">8.00 N</dd></div>
                <div><dt>v<sub>max</sub> (friction)</dt><dd id="read-vmax">—</dd></div>
              </dl>
              <p class="muted" id="source-caption">Tension supplies the inward net force on a horizontal table.</p>
            </section>

            ${challengeCard()}
            ${theoryLink()}

            <details class="why-cancel" id="law-panel">
              <summary>Inward net force</summary>
              <p>Do not add a separate centripetal-force arrow on top of tension, friction, or gravity. Those real forces are the inward net force in these simplified models.</p>
            </details>

            <div class="conn-cards">
              <p class="conn-card">Previously: <a href="/simulations/module-2/2-5" data-link>Review 2.5</a> — a = F_net / m still holds. Here F_net points toward the center.</p>
              <p class="conn-card">Previously: <a href="/simulations/module-2/2-8" data-link>Review 2.8</a> — a restoring force is not automatically the net force, and it is not automatically centripetal.</p>
              <p class="conn-card">Next: <a href="/simulations/module-3/3-1" data-link>Open 3.1</a> — work transfers energy. Circular motion here is still a Newton’s-law story.</p>
            </div>
          </aside>
        </div>

        <section class="lab-bottom">
          <div class="graph-wrap diagram-wrap fbd-diagram" id="fbd">
            <h2>Free-body diagram</h2>
            <canvas id="fbd-canvas" width="960" height="240" aria-label="Free-body diagram showing only real forces"></canvas>
            <p class="caption" id="equilibrium-marker">The diagram shows the real forces for the selected scenario. It does not add a fictitious extra centripetal force.</p>
          </div>
        </section>

        <section class="lab-bottom motion-graphs">
          <div class="graphs">
            <div class="graph-wrap" id="wrap-x">
              <h2>x vs. time</h2>
              <canvas id="graph-xt" width="640" height="220" aria-label="Horizontal position versus time"></canvas>
            </div>
            <div class="graph-wrap" id="wrap-v">
              <h2>Velocity components vs. time</h2>
              <canvas id="graph-vt" width="640" height="220" aria-label="Velocity components versus time"></canvas>
            </div>
            <div class="graph-wrap" id="wrap-a">
              <h2>Acceleration components vs. time</h2>
              <canvas id="graph-at" width="640" height="220" aria-label="Acceleration components versus time"></canvas>
            </div>
          </div>
        </section>

        <div id="graph-panel">
        <div id="data-table">
        ${trialSection({
          rangeTitle: "Your Trials · ac vs. v",
          heightTitle: "Your Trials · ac vs. v²",
          rangeCaption: "ac vs. v is not linear. Use ac vs. v² when you want a line whose slope is 1/r.",
          heightCaption: "For fixed radius, ac vs. v² should be a line through the origin with slope 1/r.",
          columns: ["Trial", "m", "r", "v", "ac", "Fc", "ω", "T", "f", "source", "limit"],
          emptyCols: 11,
        })}
        </div>
        </div>
      </div>

      ${theoryPage({
        title: "Changing direction at constant speed",
        lead: "Speed can stay constant while velocity changes direction. That change is an acceleration toward the center.",
        cards: [
          {
            title: "Tangent v, inward a",
            anim: "circular",
            caption: `${S.v("Teal v")} is along the circle. ${S.a("Orange a_c")} points at the center. Speed can stay the same the whole way around.`,
            eq: eqLines(`${S.a("a")}<sub>c</sub> = ${S.v()}² / ${S.r()}`),
            vars: [
              eqVar("a", "a_c", "centripetal acceleration, toward the center", "m/s²"),
              eqVar("v", "v", "tangential speed", "m/s"),
              eqVar("r", "r", "radius of the circle", "m"),
            ],
          },
          {
            title: "Double v, quadruple ac",
            anim: "ac-scales-v2",
            caption: `At fixed ${S.r("r")}, ${S.a("a_c")} grows with ${S.v("v")}². ${S.m("Mass")} does not change a_c; it changes the ${S.f("force")} required.`,
            eq: eqLines(`${S.f("F")}<sub>net,inward</sub> = ${S.m()} ${S.v()}² / ${S.r()}`),
            vars: [
              eqVar("f", "F_net,inward", "real net force toward the center", "N"),
              eqVar("m", "m", "mass of the object", "kg"),
              eqVar("v", "v", "tangential speed", "m/s"),
              eqVar("r", "r", "radius", "m"),
            ],
          },
        ],
        graphs: [
          {
            id: "ac-vs-v2",
            title: "a_c vs. v²",
            caption: "At fixed r = 4 m the identity is a line through the origin with slope 1/r.",
          },
        ],
        fit: `<p>ac vs. v² at fixed r is a line through the origin with slope 1/r.</p>`,
      })}
    </section>
  `;
}

export function sim31Page() {
  return `
    <section class="sim-shell">
      <header class="sim-header">
        <div>
          <p class="kicker">Unit 3 · Simulation 3.1</p>
          <h1>Work and the Work-Energy Theorem</h1>
          <p class="objective">Learning objective: Work by a constant force is W = Fd cosθ. Net work equals the change in kinetic energy, ΔK = K_f − K_i, with K = ½mv² never negative.</p>
          <p class="sim-nav"><a href="/simulations/module-2/2-9" data-link>← 2.9</a> · <a href="/simulations/module-3" data-link>Module 3</a> · <a href="/simulations/module-3/3-2" data-link>3.2 →</a></p>
        </div>
        <div class="sim-toolbar">
          ${labIconToolbar()}
        </div>
      </header>

      ${labTablist()}

      <div id="panel-lab" role="tabpanel" aria-labelledby="tab-btn-lab">
        <div class="workspace">
          <section class="stage track-stage motion-stage firstlaw-stage work-stage" aria-label="Object on a horizontal track with work and kinetic energy" id="simulation-canvas">
            <canvas id="axis-canvas" width="960" height="340" aria-label="Block moving along a displacement with force vectors"></canvas>
            <div class="transport" id="playback-controls">
              <button type="button" class="btn primary" id="btn-play">Play</button>
              <button type="button" class="btn" id="btn-pause" disabled>Pause</button>
              <button type="button" class="btn" id="btn-step">Step +0.1 s</button>
              <button type="button" class="btn" id="btn-check-31">Check</button>
              <span class="transport-gap"></span>
              <label class="switch light">
                <input id="auto-record" type="checkbox" />
                Auto-record
              </label>
              <button type="button" class="btn" id="btn-reset-run">Reset</button>
              <button type="button" class="btn" id="btn-record">Record Trial</button>
              <button type="button" class="btn" id="btn-clear">Clear Trials</button>
            </div>
            <div class="track-controls">
              <div class="control" id="scenario-selector">
                <div class="control-head"><span>Scenario</span></div>
                <div class="presets" role="group" aria-label="Work-energy scenarios">
                  <button type="button" class="chip" data-scenario="along">Force along d</button>
                  <button type="button" class="chip" data-scenario="perp">Perpendicular</button>
                  <button type="button" class="chip" data-scenario="negative">Opposing force</button>
                  <button type="button" class="chip" data-scenario="zero-net">Zero net work</button>
                  <button type="button" class="chip" data-scenario="angled">Force at 60°</button>
                  <button type="button" class="chip" data-scenario="friction">Sliding friction</button>
                  <button type="button" class="chip" data-scenario="stop">Stops early</button>
                  <button type="button" class="chip" data-scenario="custom">Custom</button>
                </div>
              </div>
              <div class="control" id="relationship-investigation">
                <div class="control-head"><span>Investigation</span></div>
                <div class="presets" role="group" aria-label="Investigation mode">
                  <button type="button" class="chip" data-invest="off">Free explore</button>
                  <button type="button" class="chip" data-invest="wf">W vs. F</button>
                  <button type="button" class="chip" data-invest="wd">W vs. d</button>
                  <button type="button" class="chip" data-invest="wtheta">W vs. θ</button>
                  <button type="button" class="chip" data-invest="km">K vs. m</button>
                  <button type="button" class="chip" data-invest="kv2">K vs. v²</button>
                  <button type="button" class="chip" data-invest="wdk">W_net vs. ΔK</button>
                </div>
                <p class="track-help" id="invest-help">Vary one quantity while holding the others constant, then record trials.</p>
                <div class="presets" id="invest-values" role="group" aria-label="Investigation values" hidden></div>
              </div>
              <div class="control">
                <div class="control-head"><span>Playback speed</span></div>
                <div class="presets" role="group" aria-label="Playback speed">
                  <button type="button" class="chip" data-speed="0.25">0.25×</button>
                  <button type="button" class="chip" data-speed="0.5">0.5×</button>
                  <button type="button" class="chip" data-speed="1">1×</button>
                  <button type="button" class="chip" data-speed="2">2×</button>
                  <button type="button" class="chip" data-speed="4">4×</button>
                </div>
              </div>
              <div id="camera-host">${cameraModeControls(1)}</div>
              <div class="nudge-row motion-inputs" id="mass-control">
                <label class="pos-input">Mass<input id="mass-input" type="number" min="0.5" max="20" step="0.1" value="2" aria-label="Mass in kilograms" /><span>kg</span></label>
                <label class="pos-input" id="speed-control">vᵢ<input id="v-input" type="number" min="0" max="15" step="0.1" value="2" aria-label="Initial speed in meters per second" /><span>m/s</span></label>
                <label class="pos-input" id="applied-force-control">F<input id="f-input" type="number" min="0" max="100" step="0.5" value="10" aria-label="Applied force in newtons" /><span>N</span></label>
                <label class="pos-input" id="angle-control">θ<input id="ang-input" type="number" min="0" max="360" step="1" value="0" aria-label="Force angle in degrees from the displacement" /><span>°</span></label>
                <label class="pos-input" id="displacement-control">d<input id="d-input" type="number" min="0" max="20" step="0.1" value="5" aria-label="Requested displacement in meters" /><span>m</span></label>
              </div>
              <div class="nudge-row motion-inputs">
                <label class="switch light" id="kinetic-coefficient-control"><input id="toggle-friction" type="checkbox" /> Kinetic friction (sliding)</label>
                <label class="pos-input">μ<sub>k</sub><input id="mu-input" type="number" min="0" max="1.5" step="0.05" value="0.2" aria-label="Coefficient of kinetic friction" /></label>
                <label class="pos-input">F<sub>opp</sub><input id="opp-input" type="number" min="0" max="100" step="0.5" value="0" aria-label="Opposing horizontal force in newtons" /><span>N</span></label>
              </div>
              <div class="nudge-row motion-inputs fbd-toggles">
                <label class="switch light" id="force-vector-toggle"><input id="toggle-vectors" type="checkbox" checked /> Force vectors</label>
                <label class="switch light"><input id="toggle-net" type="checkbox" checked /> Show net force</label>
                <label class="switch light" id="velocity-vector"><input id="toggle-velocity" type="checkbox" checked /> Show velocity</label>
                <label class="switch light" id="acceleration-vector"><input id="toggle-accel" type="checkbox" checked /> Show acceleration</label>
                <label class="switch light"><input id="toggle-trail" type="checkbox" checked /> Trail</label>
              </div>
              <p class="track-help">Displacement is to the right. θ is measured from that displacement to the applied force. Friction is kinetic and assumes the object is already sliding. Brown is F<sub>app</sub>. Teal is velocity. Gold is acceleration.</p>
            </div>
          </section>

          <aside class="rail">
            <section class="card values-card" id="force-readout">
              <div class="card-head">
                <h2>Work</h2>
                ${teacherSwitch()}
              </div>
              <div class="eq-status" id="eq-status" role="status">
                <strong id="eq-label">RUN TO COMPARE</strong>
                <span id="eq-net">W_net = 0.00 J</span>
                <span id="eq-detail">Run the experiment to calculate the final state.</span>
              </div>
              <dl class="metrics metrics-wide" id="physics-readouts">
                <div><dt>W<sub>app</sub> = Fd cosθ</dt><dd id="read-wapp">0.00 J</dd></div>
                <div><dt>W<sub>fric</sub></dt><dd id="read-wfric">not included</dd></div>
                <div><dt>W<sub>opp</sub></dt><dd id="read-wopp">not included</dd></div>
                <div><dt>W<sub>N</sub></dt><dd id="read-wn">0.00 J</dd></div>
                <div><dt>W<sub>g</sub></dt><dd id="read-wg">0.00 J</dd></div>
                <div><dt>W<sub>net</sub></dt><dd id="read-wnet">0.00 J</dd></div>
              </dl>
              <p class="eq-block" id="equation-display">W = Fd cosθ</p>
              <p id="debug-line" class="debug" hidden></p>
            </section>

            <section class="card values-card" id="net-force-panel">
              <div class="card-head">
                <h2>Kinetic energy</h2>
              </div>
              <dl class="metrics metrics-wide">
                <div><dt>Kᵢ = ½mvᵢ²</dt><dd id="read-ki">4.00 J</dd></div>
                <div><dt>K now</dt><dd id="read-k">4.00 J</dd></div>
                <div><dt>K<sub>f</sub></dt><dd id="read-kf">—</dd></div>
                <div><dt>ΔK</dt><dd id="read-dk">0.00 J</dd></div>
              </dl>
              <p class="muted">Kinetic energy uses speed squared. It cannot be negative.</p>
            </section>

            <section class="card values-card" id="acceleration-panel">
              <div class="card-head">
                <h2>State</h2>
              </div>
              <dl class="metrics metrics-wide">
                <div><dt>Mass</dt><dd id="read-m">2.00 kg</dd></div>
                <div><dt>Speed</dt><dd id="read-v">2.00 m/s</dd></div>
                <div><dt>v<sub>f</sub></dt><dd id="read-vf">—</dd></div>
                <div><dt>s / d</dt><dd id="read-s">0.00 m / 5.00 m</dd></div>
                <div><dt>θ</dt><dd id="read-theta">0°</dd></div>
                <div><dt>F<sub>∥</sub></dt><dd id="read-fx">10.00 N</dd></div>
              </dl>
              <p class="muted">Zero net work means ΔK = 0, not necessarily v = 0.</p>
            </section>

            ${challengeCard()}
            ${theoryLink()}

            <details class="why-cancel" id="law-panel">
              <summary>Work-energy theorem</summary>
              <p>W_net = ΔK. Individual forces can do nonzero work while the net work is zero. A force perpendicular to the displacement does zero work even if the object is moving.</p>
            </details>

            <div class="conn-cards">
              <p class="conn-card">Previously: <a href="/simulations/module-2/2-5" data-link>Review 2.5</a> — a = F_net / m. For constant F_net that same law implies W_net = ΔK.</p>
              <p class="conn-card">Previously: <a href="/simulations/module-2/2-9" data-link>Review 2.9</a> — a perpendicular force can change direction without changing speed. Here that force does zero work.</p>
              <p class="conn-card">Next: <a href="/simulations/module-3/3-2" data-link>Open 3.2</a> — when force changes with position, work is the signed area under Fₓ vs. x, not one force value times the whole displacement.</p>
            </div>
          </aside>
        </div>

        <section class="lab-bottom">
          <div class="graph-wrap diagram-wrap fbd-diagram" id="fbd">
            <h2>Free-body diagram</h2>
            <canvas id="fbd-canvas" width="960" height="240" aria-label="Free-body diagram of forces on the block"></canvas>
            <p class="caption">N and Fg are vertical, so they do no work on a horizontal displacement. Velocity is not a force.</p>
          </div>
        </section>

        <section class="lab-bottom motion-graphs">
          <div class="graphs">
            <div class="graph-wrap" id="wrap-x">
              <h2>Work vs. displacement</h2>
              <canvas id="graph-xt" width="640" height="220" aria-label="Net work versus displacement completed"></canvas>
            </div>
            <div class="graph-wrap" id="wrap-v">
              <h2>Kinetic energy vs. displacement</h2>
              <canvas id="graph-vt" width="640" height="220" aria-label="Kinetic energy versus displacement completed"></canvas>
            </div>
          </div>
        </section>

        <div id="graph-panel">
        <div id="data-table">
        ${trialSection({
          rangeTitle: "Your Trials · W vs. F",
          heightTitle: "Your Trials · ΔK vs. W_net",
          rangeCaption: "For fixed d and θ, W vs F is a line through the origin. A perpendicular force makes a flat line.",
          heightCaption: "At the end of a valid run, ΔK should match W_net. The identity is the line ΔK = W_net.",
          columns: ["Trial", "m", "vᵢ", "F", "θ", "d", "s", "W_net", "Kᵢ", "K", "ΔK", "end"],
          emptyCols: 12,
        })}
        </div>
        </div>
      </div>

      ${theoryPage({
        title: "Work transfers kinetic energy",
        lead: "Only the force component along the displacement does work. Net work is the change in kinetic energy.",
        cards: [
          {
            title: "W = Fd cosθ",
            anim: "work-cos-theta",
            caption: `Sweep ${S.th("orange θ")}. ${S.w("Green W")} is full at 0°, zero at 90°, negative at 180° — only the component along ${S.d("d")} counts.`,
            eq: eqLines(`${S.w()} = ${S.f()} ${S.d("d")} cos${S.th()}`),
            vars: [
              eqVar("w", "W", "work done by that force", "J"),
              eqVar("f", "F", "magnitude of the force", "N"),
              eqVar("d", "d", "displacement the force acts through", "m"),
              eqVar("th", "θ", "angle between F and the displacement", "°"),
            ],
          },
          {
            title: "W_net = ΔK",
            anim: "wnet-equals-dk",
            caption: `The leftover ${S.w("green W_net")} after adding every force is exactly how much ${S.k("purple K")} changes.`,
            eq: eqLines(
              `${S.w("W")}<sub>net</sub> = Δ${S.k()} = ${S.k()}<sub>f</sub> − ${S.k()}ᵢ`,
              `${S.k()} = ½ ${S.m()} ${S.v()}²`,
            ),
            vars: [
              eqVar("w", "W_net", "sum of work by every force", "J"),
              eqVar("k", "K", "kinetic energy", "J"),
              eqVar("m", "m", "mass", "kg"),
              eqVar("v", "v", "speed", "m/s"),
            ],
          },
        ],
        graphs: [
          {
            id: "w-vs-theta",
            title: "W vs. θ",
            caption: "For fixed F and d, work follows cosθ: full, then zero, then negative.",
          },
          {
            id: "dk-vs-w",
            title: "ΔK vs. W_net",
            caption: "The work–energy theorem is the identity ΔK = W_net.",
          },
        ],
        fit: `<p>W vs F at fixed d and θ is a line with slope d cosθ. ΔK vs W_net hugs the identity.</p>`,
      })}
    </section>
  `;
}

export function sim32Page() {
  return `
    <section class="sim-shell">
      <header class="sim-header">
        <div>
          <p class="kicker">Unit 3 · Simulation 3.2</p>
          <h1>Work by Variable Forces</h1>
          <p class="objective">Learning objective: When force changes with position, work is the signed area under an Fₓ-versus-x graph, W = ∫ Fₓ(x) dx. Net work still equals ΔK, and kinetic energy is never negative.</p>
          <p class="sim-nav"><a href="/simulations/module-3/3-1" data-link>← 3.1</a> · <a href="/simulations/module-3" data-link>Module 3</a> · <span class="muted">3.3 coming</span></p>
        </div>
        <div class="sim-toolbar">
          ${labIconToolbar()}
        </div>
      </header>

      ${labTablist()}

      <div id="panel-lab" role="tabpanel" aria-labelledby="tab-btn-lab">
        <div class="workspace">
          <section class="stage track-stage motion-stage firstlaw-stage work-stage variable-stage" aria-label="Object on a track with a position-dependent force" id="simulation-canvas">
            <canvas id="axis-canvas" width="960" height="340" aria-label="Block moving along a track with a force that can change with position"></canvas>
            <div class="transport" id="playback-controls">
              <button type="button" class="btn primary" id="btn-play">Play</button>
              <button type="button" class="btn" id="btn-pause" disabled>Pause</button>
              <button type="button" class="btn" id="btn-step">Step +0.1 s</button>
              <button type="button" class="btn" id="btn-check-32">Check</button>
              <span class="transport-gap"></span>
              <label class="switch light">
                <input id="auto-record" type="checkbox" />
                Auto-record
              </label>
              <button type="button" class="btn" id="btn-reset-run">Reset</button>
              <button type="button" class="btn" id="btn-record">Record Trial</button>
              <button type="button" class="btn" id="btn-clear">Clear Trials</button>
            </div>
            <div class="track-controls">
              <div class="control" id="scenario-selector">
                <div class="control-head"><span>Scenario</span></div>
                <div class="presets" role="group" aria-label="Variable-force scenarios">
                  <button type="button" class="chip" data-scenario="constant">Constant F</button>
                  <button type="button" class="chip" data-scenario="triangle">Triangle</button>
                  <button type="button" class="chip" data-scenario="trapezoid">Trapezoid</button>
                  <button type="button" class="chip" data-scenario="negative">Negative work</button>
                  <button type="button" class="chip" data-scenario="signed">+ and − areas</button>
                  <button type="button" class="chip" data-scenario="cancel">Zero net work</button>
                  <button type="button" class="chip" data-scenario="curved">Curved F = 2x</button>
                  <button type="button" class="chip" data-scenario="stop">Stops early</button>
                  <button type="button" class="chip" data-scenario="crossing">Zero crossing</button>
                  <button type="button" class="chip" data-scenario="custom">Custom</button>
                </div>
              </div>
              <div class="control" id="function-selector">
                <div class="control-head"><span>Force function</span></div>
                <div class="presets" role="group" aria-label="Force function type">
                  <button type="button" class="chip" data-fn="constant">Constant</button>
                  <button type="button" class="chip" data-fn="piecewise-constant">Piecewise const.</button>
                  <button type="button" class="chip" data-fn="piecewise-linear">Piecewise linear</button>
                  <button type="button" class="chip" data-fn="proportional">F = c x</button>
                  <button type="button" class="chip" data-fn="quadratic">Quadratic</button>
                  <button type="button" class="chip" data-fn="spring">Spring −kx</button>
                  <button type="button" class="chip" data-fn="sine">Sinusoidal</button>
                </div>
              </div>
              <div class="control" id="relationship-investigation">
                <div class="control-head"><span>Investigation</span></div>
                <div class="presets" role="group" aria-label="Investigation mode">
                  <button type="button" class="chip" data-invest="off">Free explore</button>
                  <button type="button" class="chip" data-invest="xinterval">W vs. interval</button>
                  <button type="button" class="chip" data-invest="areas">Signed areas</button>
                  <button type="button" class="chip" data-invest="approx">Approx. vs exact</button>
                  <button type="button" class="chip" data-invest="wdk">W_net vs. ΔK</button>
                </div>
                <p class="track-help" id="invest-help">Change one setting, then record trials. Work is signed area, not peak force times Δx.</p>
                <div class="presets" id="invest-values" role="group" aria-label="Investigation values" hidden></div>
              </div>
              <div class="control">
                <div class="control-head"><span>Playback speed</span></div>
                <div class="presets" role="group" aria-label="Playback speed">
                  <button type="button" class="chip" data-speed="0.25">0.25×</button>
                  <button type="button" class="chip" data-speed="0.5">0.5×</button>
                  <button type="button" class="chip" data-speed="1">1×</button>
                  <button type="button" class="chip" data-speed="2">2×</button>
                  <button type="button" class="chip" data-speed="4">4×</button>
                </div>
              </div>
              <div id="camera-host">${cameraModeControls(1)}</div>
              <div class="nudge-row motion-inputs" id="mass-control">
                <label class="pos-input">Mass<input id="mass-input" type="number" min="0.5" max="20" step="0.1" value="2" aria-label="Mass in kilograms" /><span>kg</span></label>
                <label class="pos-input" id="speed-control">vᵢ<input id="v-input" type="number" min="0" max="15" step="0.1" value="2" aria-label="Initial speed in meters per second" /><span>m/s</span></label>
                <span class="nudge-row motion-inputs" id="interval-control">
                  <label class="pos-input" id="displacement-control">xᵢ<input id="xi-input" type="number" min="-4" max="16" step="0.1" value="0" aria-label="Initial position in meters" /><span>m</span></label>
                  <label class="pos-input">x_f<input id="xf-input" type="number" min="-4" max="16" step="0.1" value="4" aria-label="Final position in meters" /><span>m</span></label>
                </span>
              </div>
              <div class="nudge-row motion-inputs" id="force-params">
                <span data-fn-panel="constant" id="applied-force-control">
                  <label class="pos-input">Fₓ<input id="f-input" type="number" min="-80" max="80" step="0.5" value="6" aria-label="Constant force in newtons" /><span>N</span></label>
                </span>
                <span data-fn-panel="piecewise-constant" hidden>
                  <label class="pos-input">F₁<input id="f1-input" type="number" min="-80" max="80" step="0.5" value="6" aria-label="Force on the first segment in newtons" /><span>N</span></label>
                  <label class="pos-input">x split<input id="split-input" type="number" min="-4" max="16" step="0.1" value="2" aria-label="Segment boundary in meters" /><span>m</span></label>
                  <label class="pos-input">F₂<input id="f2-input" type="number" min="-80" max="80" step="0.5" value="-3" aria-label="Force on the second segment in newtons" /><span>N</span></label>
                </span>
                <span data-fn-panel="piecewise-linear" hidden>
                  <label class="pos-input">x₀<input id="p0x-input" type="number" min="-4" max="16" step="0.1" value="0" aria-label="First graph point position" /><span>m</span></label>
                  <label class="pos-input">F₀<input id="p0f-input" type="number" min="-80" max="80" step="0.5" value="0" aria-label="First graph point force" /><span>N</span></label>
                  <label class="pos-input">x₁<input id="p1x-input" type="number" min="-4" max="16" step="0.1" value="2" aria-label="Second graph point position" /><span>m</span></label>
                  <label class="pos-input">F₁<input id="p1f-input" type="number" min="-80" max="80" step="0.5" value="6" aria-label="Second graph point force" /><span>N</span></label>
                  <label class="pos-input">x₂<input id="p2x-input" type="number" min="-4" max="16" step="0.1" value="4" aria-label="Third graph point position" /><span>m</span></label>
                  <label class="pos-input">F₂<input id="p2f-input" type="number" min="-80" max="80" step="0.5" value="2" aria-label="Third graph point force" /><span>N</span></label>
                </span>
                <span data-fn-panel="proportional" hidden>
                  <label class="pos-input">c<input id="c-input" type="number" min="-20" max="20" step="0.1" value="2" aria-label="Force per meter for F equals c x" /><span>N/m</span></label>
                </span>
                <span data-fn-panel="quadratic" hidden>
                  <label class="pos-input">a<input id="a-input" type="number" min="-20" max="20" step="0.05" value="0.75" aria-label="Quadratic force coefficient" /><span>N/m²</span></label>
                </span>
                <span data-fn-panel="spring" hidden>
                  <label class="pos-input">k<input id="k-input" type="number" min="0" max="20" step="0.1" value="4" aria-label="Spring constant" /><span>N/m</span></label>
                </span>
                <span data-fn-panel="sine" hidden>
                  <label class="pos-input">F₀<input id="f0-input" type="number" min="-80" max="80" step="0.5" value="6" aria-label="Sinusoidal force amplitude" /><span>N</span></label>
                  <label class="pos-input">q<input id="q-input" type="number" min="0.1" max="4" step="0.05" value="0.785" aria-label="Spatial wave number in inverse meters" /><span>1/m</span></label>
                </span>
              </div>
              <div class="nudge-row motion-inputs" id="approx-control">
                <span>Rectangles</span>
                <div class="presets" role="group" aria-label="Approximation resolution">
                  <button type="button" class="chip" data-n="2">n = 2</button>
                  <button type="button" class="chip" data-n="4">n = 4</button>
                  <button type="button" class="chip" data-n="8">n = 8</button>
                  <button type="button" class="chip" data-n="16">n = 16</button>
                  <button type="button" class="chip" data-n="32">n = 32</button>
                </div>
                <div class="presets" role="group" aria-label="Approximation method">
                  <button type="button" class="chip" data-method="left">Left</button>
                  <button type="button" class="chip" data-method="midpoint">Midpoint</button>
                  <button type="button" class="chip" data-method="trapezoid">Trapezoid</button>
                </div>
              </div>
              <div class="nudge-row motion-inputs fbd-toggles">
                <label class="switch light" id="force-vector-toggle"><input id="toggle-vectors" type="checkbox" checked /> Force vector</label>
                <label class="switch light" id="velocity-vector"><input id="toggle-velocity" type="checkbox" checked /> Show velocity</label>
                <label class="switch light" id="acceleration-vector"><input id="toggle-accel" type="checkbox" checked /> Show acceleration</label>
                <label class="switch light"><input id="toggle-trail" type="checkbox" checked /> Trail</label>
                <label class="switch light"><input id="toggle-areas" type="checkbox" checked /> Shade signed area</label>
                <label class="switch light"><input id="toggle-approx" type="checkbox" checked /> Show rectangles</label>
              </div>
              <p class="track-help">The graph below is Fₓ versus x. Area above the axis is positive work when the object moves toward larger x. Area below is negative work. Do not multiply the final force by the whole displacement unless Fₓ is actually constant.</p>
            </div>
          </section>

          <aside class="rail">
            <section class="card values-card" id="force-readout">
              <div class="card-head">
                <h2>Work</h2>
                ${teacherSwitch()}
              </div>
              <div class="eq-status" id="eq-status" role="status">
                <strong id="eq-label">RUN TO COMPARE</strong>
                <span id="eq-net">W_net = 0.00 J</span>
                <span id="eq-detail">Run the experiment to calculate the final state.</span>
              </div>
              <dl class="metrics metrics-wide" id="physics-readouts">
                <div><dt>W₊</dt><dd id="read-wpos">0.00 J</dd></div>
                <div><dt>W₋</dt><dd id="read-wneg">0.00 J</dd></div>
                <div><dt>W_net (path)</dt><dd id="read-wnet">0.00 J</dd></div>
                <div><dt>W exact (interval)</dt><dd id="read-wfull">0.00 J</dd></div>
                <div><dt>W approx</dt><dd id="read-wapprox">0.00 J</dd></div>
                <div><dt>Method</dt><dd id="read-method">midpoint n = 8</dd></div>
              </dl>
              <p class="eq-block" id="equation-display">W = Fₓ Δx</p>
              <p id="debug-line" class="debug" hidden></p>
            </section>

            <section class="card values-card" id="net-force-panel">
              <div class="card-head">
                <h2>Kinetic energy</h2>
              </div>
              <dl class="metrics metrics-wide">
                <div><dt>Kᵢ = ½mvᵢ²</dt><dd id="read-ki">4.00 J</dd></div>
                <div><dt>K now</dt><dd id="read-k">4.00 J</dd></div>
                <div><dt>K<sub>f</sub></dt><dd id="read-kf">—</dd></div>
                <div><dt>ΔK</dt><dd id="read-dk">0.00 J</dd></div>
              </dl>
              <p class="muted">W_net = ΔK even when Fₓ changes with x. K cannot be negative.</p>
            </section>

            <section class="card values-card" id="acceleration-panel">
              <div class="card-head">
                <h2>State</h2>
              </div>
              <dl class="metrics metrics-wide">
                <div><dt>Mass</dt><dd id="read-m">2.00 kg</dd></div>
                <div><dt>Speed</dt><dd id="read-v">2.00 m/s</dd></div>
                <div><dt>v<sub>f</sub></dt><dd id="read-vf">—</dd></div>
                <div><dt>x / x_f</dt><dd id="read-x">0.00 m / 4.00 m</dd></div>
                <div><dt>Fₓ now</dt><dd id="read-fx">6.00 N</dd></div>
                <div><dt>aₓ now</dt><dd id="read-a">3.00 m/s²</dd></div>
              </dl>
              <p class="muted">Zero net work means ΔK = 0, not necessarily v = 0.</p>
            </section>

            ${challengeCard()}
            ${theoryLink()}

            <details class="why-cancel" id="law-panel">
              <summary>Variable-force work</summary>
              <p>W = ∫ Fₓ dx is signed area. Rectangles, triangles, and trapezoids can be added. A force that changes with x is not F_final × Δx unless that force is constant.</p>
            </details>

            <div class="conn-cards">
              <p class="conn-card">Previously: <a href="/simulations/module-3/3-1" data-link>Review 3.1</a> — for a constant force, W = Fd cosθ and W_net = ΔK. This lab keeps the theorem and generalizes the work calculation.</p>
              <p class="conn-card">Previously: <a href="/simulations/module-2/2-8" data-link>Review 2.8</a> — a spring force F = −kx is the position-dependent case W = ∫ −kx dx.</p>
              <p class="conn-card">Next: potential energy (3.3, coming) stores work done against conservative forces such as gravity and ideal springs.</p>
            </div>
          </aside>
        </div>

        <section class="lab-bottom">
          <div class="graph-wrap graph-fx-wrap" id="graph-fx">
            <h2>Force vs. position</h2>
            <canvas id="graph-fx-canvas" width="960" height="280" aria-label="Force versus position with signed area for the selected interval"></canvas>
            <p class="caption" id="area-breakdown">Shaded area is only the selected interval. Labels show each region’s signed work. The current-position marker matches the block on the track.</p>
          </div>
        </section>

        <section class="lab-bottom motion-graphs">
          <div class="graphs">
            <div class="graph-wrap" id="wrap-x">
              <h2>Accumulated work vs. position</h2>
              <canvas id="graph-xt" width="640" height="220" aria-label="Net work versus position"></canvas>
            </div>
            <div class="graph-wrap" id="wrap-v">
              <h2>Kinetic energy vs. position</h2>
              <canvas id="graph-vt" width="640" height="220" aria-label="Kinetic energy versus position"></canvas>
            </div>
          </div>
        </section>

        <div id="graph-panel">
        <div id="data-table">
        ${trialSection({
          rangeTitle: "Your Trials · W vs. interval",
          heightTitle: "Your Trials · ΔK vs. W_net",
          rangeCaption: "Changing the interval on the same force graph changes the signed area. Peak force alone does not decide work.",
          heightCaption: "At the end of a valid run, ΔK should match W_net along the actual path. The identity is the line ΔK = W_net.",
          columns: ["Trial", "type", "xᵢ", "x_f", "n", "W₊", "W₋", "W_net", "W approx", "Kᵢ", "K", "end"],
          emptyCols: 12,
        })}
        </div>
        </div>
      </div>

      ${theoryPage({
        title: "Work is signed area under Fₓ vs. x",
        lead: "When force changes with position, do not grab one F and multiply by the whole displacement.",
        cards: [
          {
            title: "The integral is area",
            anim: "area-under-fx",
            caption: `The ${S.w("green shaded region")} under ${S.f("Fₓ")} vs. ${S.x("x")} is the ${S.w("work")} done so far.`,
            eq: eqLines(`${S.w()} = ∫ ${S.f("F")}<sub>x</sub>(${S.x()}) d${S.x()}`),
            vars: [
              eqVar("w", "W", "work — signed area under Fₓ vs. x", "J"),
              eqVar("f", "Fₓ", "force component along the path", "N"),
              eqVar("x", "x", "position along that path", "m"),
            ],
          },
          {
            title: "Signs can cancel",
            anim: "signed-area",
            caption: `${S.w("Area above")} the axis is +W. ${S.a("Area below")} is −W. Zero ${S.w("W_net")} is not rest — it is ΔK = 0.`,
            eq: eqLines(`${S.w("W")}<sub>net</sub> = ${S.w("W")}₊ + ${S.a("W")}₋ = Δ${S.k()}`),
            vars: [
              eqVar("w", "W₊", "positive area, speeding up", "J"),
              eqVar("a", "W₋", "negative area, slowing down", "J"),
              eqVar("k", "ΔK", "change in kinetic energy", "J"),
            ],
          },
        ],
        graphs: [
          {
            id: "w-vs-x-quad",
            title: "W vs. x for Fₓ = 2x",
            caption: "Variable force: the accumulated area is x², not one F times the whole Δx.",
          },
          {
            id: "dk-vs-w",
            title: "ΔK vs. W_net",
            caption: "Even with a changing force, the leftover signed area still equals ΔK.",
          },
        ],
        fit: `<p>Changing only the interval on one graph changes W. ΔK vs W_net still hugs the identity.</p>`,
      })}
    </section>
  `;
}
