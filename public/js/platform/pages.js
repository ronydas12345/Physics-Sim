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

function trialFitTheory(compareHtml) {
  return `
          <section class="theory-block">
            <h3>Fit your recorded trials</h3>
            <p>
              After you record at least two trials with different x-values, each “Your Trials” graph draws a dashed
              least-squares curve and prints the fitted equation with R². Two points always give a perfect line
              (R² = 1). Record several different runs, then compare the fitted shape to the identities derived on this tab.
              Turn on <strong>Show exact identity</strong> to overlay the closed-form curve as a solid line.
            </p>
            ${compareHtml}
          </section>`;
}

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
          Every available simulation, including 1.1–1.5 and 2.1–2.3, uses the same shell so later units do not invent a new interface.
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

export function aboutPage() {
  return `
    <header class="page-head">
      <p class="kicker">Help / About</p>
      <h1>How to use the platform</h1>
    </header>
    <article class="prose card">
      <h2>Navigation</h2>
      <p>Use <strong>Simulations</strong> to browse by unit. Unit 1 currently includes 1.1–1.5. Unit 2 currently includes 2.1 Systems and Center of Mass, 2.2 Forces and Free-Body Diagrams, and 2.3 Newton’s Third Law.</p>
      <h2>Lab, Theory, Challenge, Teacher view</h2>
      <p>Every available lab uses the same shell. Theory holds equations and examples. Challenge randomizes a target and hides the answer until you check or launch. Teacher view compares live values with the identities the course uses. Record and auto-record fill a trial table and graphs.</p>
      <h2>Appearance</h2>
      <p>Use <strong>Appearance</strong> in the header to switch the current beige paper theme, a cooler light theme, dark mode, or high contrast. The choice is saved in this browser and applies on every page, including How to Use This Lab and Guided Lab.</p>
      <h2>Reset</h2>
      <p>Reset returns the system to its initial condition and clears running totals such as distance traveled. Recorded trials stay until you clear them.</p>
      <h2>Accuracy</h2>
      <p>Displayed values come from the same state that drives the visualization. Distance is the sum of path lengths, not the shortcut from start to finish. Projectile range, height, and flight time come from the numerical stepper that also draws the trajectory.</p>
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

      <div id="panel-theory" role="tabpanel" aria-labelledby="tab-btn-theory" hidden>
        <article class="theory">
          <header class="theory-hero">
            <p class="kicker">Read this, then return to the lab</p>
            <h2>Scalars and vectors on a line</h2>
            <p>
              One-dimensional motion is the place to lock down magnitude versus direction. Everything later — velocity,
              acceleration, and two-dimensional projectiles — reuses this sign convention.
            </p>
          </header>
          <section class="theory-block">
            <h3>1. Scalars have magnitude only</h3>
            <p>A scalar is fully described by a number and a unit. Distance, speed, and time are scalars. They never carry a plus or minus that means direction.</p>
            <p>Distance is the length of the actual path. Split the motion into segments that do not reverse, take the length of each segment, and add:</p>
            <p class="eq-block">D = Σ |Δx<sub>i</sub>| = |x<sub>1</sub> − x<sub>0</sub>| + |x<sub>2</sub> − x<sub>1</sub>| + ⋯</p>
            <p>The absolute values drop the signs, so a 3 m trip left and a 3 m trip right both add 3 m to D.</p>
          </section>
          <section class="theory-block">
            <h3>2. Vectors have magnitude and direction</h3>
            <p>On a line, direction is a sign. Displacement, velocity, and acceleration are vectors. Displacement is the change in position, not the length of the journey:</p>
            <p class="eq-block">Δx = x<sub>f</sub> − x<sub>i</sub></p>
            <p>That is the definition of a change: final minus initial. If the object returns to its start, x<sub>f</sub> = x<sub>i</sub>, so Δx = 0 even if it traveled a long path. The magnitude of the displacement is the straight-line gap |Δx|; the direction is the sign of Δx.</p>
          </section>
          <section class="theory-block">
            <h3>3. Why D ≥ |Δx|</h3>
            <p>Each segment contributes |Δx<sub>i</sub>| to distance, but those signed pieces can cancel when you add them as a net change:</p>
            <p class="eq-block">Δx = Σ Δx<sub>i</sub><br />|Δx| = |Σ Δx<sub>i</sub>| ≤ Σ |Δx<sub>i</sub>| = D</p>
            <p>Equality holds only when every segment has the same sign — the object never turned around. On the Distance vs. Displacement graph, every point must sit on or above the V-shaped floor D = |Δx|. A fitted line through mixed out-and-back trials will not be D = |Δx|; that mismatch is the result, not a bug.</p>
          </section>
          <section class="theory-block">
            <h3>4. Sign convention is a choice</h3>
            <p>This lab usually takes right as positive:</p>
            <p class="eq-block">+ = right<br />− = left</p>
            <p>Flip the convention and the displayed signs change. The object’s motion on the track does not. Teacher view shows both the screen-right world coordinate and the displayed coordinate.</p>
          </section>
          <section class="theory-block">
            <h3>5. Worked experiment</h3>
            <p>Start at 0, move to +5 m, then to +2 m.</p>
            <p class="eq-block">
              Δx<sub>1</sub> = +5 m, Δx<sub>2</sub> = −3 m<br />
              D = |+5| + |−3| = 8 m<br />
              Δx = (+5) + (−3) = +2 m
            </p>
            <p>Record that path as a trial, then try a round trip: out and back to 0. Displacement vanishes; distance does not.</p>
          </section>
          ${trialFitTheory(`
            <p>On Distance vs. Displacement, a one-way run should hug D ≈ |Δx| (slope about +1 or −1 depending on direction). After a reversal the points rise above that V. Position vs. Distance has no single required slope: the same D can end at many x values, so a weak R² is physically honest.</p>
          `)}
        </article>
      </div>
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

      <div id="panel-theory" role="tabpanel" aria-labelledby="tab-btn-theory" hidden>
        <article class="theory">
          <header class="theory-hero">
            <p class="kicker">Read this, then return to the lab</p>
            <h2>Motion over an interval</h2>
            <p>
              Simulation 1.1 asked where an object is. This lab asks how that location changes with time.
              Velocity is displacement per unit time. Acceleration is the change in velocity per unit time.
            </p>
          </header>
          <section class="theory-block">
            <h3>1. Position, displacement, and distance</h3>
            <p>Position is the location on the axis. Displacement is the signed shortcut from the start. Distance is every meter actually traveled, including the return trip after a reversal.</p>
            <p class="eq-block">Δx = x − x₀<br />D = Σ |Δx<sub>i</sub>|</p>
          </section>
          <section class="theory-block">
            <h3>2. Average and instantaneous velocity</h3>
            <p>Average velocity over an interval is displacement divided by elapsed time, by definition:</p>
            <p class="eq-block">v<sub>avg</sub> = Δx / Δt = (x − x₀) / t</p>
            <p>Instantaneous velocity is the value of v at one instant — the limit of that ratio as Δt shrinks, which is the slope of x vs. t at that moment. Do not label the average as the instantaneous value unless the velocity never changed. Signs still mean direction: +v is toward +x.</p>
          </section>
          <section class="theory-block">
            <h3>3. Constant acceleration gives v = v₀ + at</h3>
            <p>Average acceleration is the change in velocity per unit time. If a is constant, that average is the acceleration itself:</p>
            <p class="eq-block">a = Δv / Δt = (v − v₀) / t<br />v − v₀ = a t<br />v(t) = v₀ + a t</p>
            <p>An object with v₀ = +8 m/s and a = −2 m/s² is still moving in the positive direction until t = 4 s, when v = 0. After that it reverses. Negative acceleration is not automatically “moving left.”</p>
          </section>
          <section class="theory-block">
            <h3>4. Integrating velocity gives x(t)</h3>
            <p>Velocity is the rate of change of position, so position is the accumulation of velocity. With v(t) = v₀ + at, the area under that line from 0 to t is a rectangle plus a triangle:</p>
            <p class="eq-block">
              Δx = v₀ t + ½ a t²<br />
              x(t) = x₀ + v₀ t + ½ a t²
            </p>
            <p>The same algebra from Δx = v<sub>avg</sub> t, using the fact that a linear v(t) has average (v₀ + v)/2:</p>
            <p class="eq-block">
              v<sub>avg</sub> = (v₀ + v) / 2 = (v₀ + v₀ + a t) / 2 = v₀ + ½ a t<br />
              Δx = (v₀ + ½ a t) t = v₀ t + ½ a t²
            </p>
          </section>
          <section class="theory-block">
            <h3>5. Graph shapes</h3>
            <p>Constant velocity: x vs. t is linear, v vs. t is horizontal, a vs. t is zero. Constant acceleration: x vs. t is a parabola, v vs. t is a sloped line, a vs. t is horizontal.</p>
          </section>
          <section class="theory-block">
            <h3>6. Quantity comparison</h3>
            <table class="compare-table">
              <thead>
                <tr><th>Quantity</th><th>Meaning</th><th>Unit</th></tr>
              </thead>
              <tbody>
                <tr><td>Position</td><td>Location</td><td>m</td></tr>
                <tr><td>Displacement</td><td>Change in position</td><td>m</td></tr>
                <tr><td>Distance</td><td>Total path traveled</td><td>m</td></tr>
                <tr><td>Velocity</td><td>Change in position / time</td><td>m/s</td></tr>
                <tr><td>Acceleration</td><td>Change in velocity / time</td><td>m/s²</td></tr>
              </tbody>
            </table>
          </section>
          ${trialFitTheory(`
            <p>Hold a constant and record at several times: v<sub>avg</sub> vs. t should fit a line with slope a/2, because v<sub>avg</sub> = v₀ + ½ a t. A horizontal fit (slope ≈ 0) means a ≈ 0. Distance vs. displacement still follows D ≥ |Δx| from Simulation 1.1.</p>
          `)}
        </article>
      </div>
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

      <div id="panel-theory" role="tabpanel" aria-labelledby="tab-btn-theory" hidden>
        <article class="theory">
          <header class="theory-hero">
            <p class="kicker">Read this, then return to the lab</p>
            <h2>One motion, several pictures</h2>
            <p>
              The object, the motion diagram, and the three graphs are not separate problems.
              They are translations of the same x(t), v(t), and a(t).
            </p>
          </header>
          <section class="theory-block">
            <h3>1. Motion diagrams use equal time, not equal distance</h3>
            <p>Each dot is taken 0.50 s after the last. In a fixed interval Δt, the gap between dots is the distance covered in that interval:</p>
            <p class="eq-block">Δx<sub>dot</sub> ≈ v Δt<br />spacing ∝ speed &nbsp;&nbsp;(equal Δt)</p>
            <p>Wider gaps mean the object covered more distance in that same interval, so it was moving faster. Dots piling up means it is slowing or at rest.</p>
          </section>
          <section class="theory-block">
            <h3>2. Graph slopes from the definitions</h3>
            <p>A slope is a rise over a run. On a position–time graph the rise is displacement and the run is time, which is average velocity over that interval. Shrinking the interval gives instantaneous velocity:</p>
            <p class="eq-block">slope of x vs. t = Δx / Δt = v</p>
            <p>On a velocity–time graph the rise is the change in velocity:</p>
            <p class="eq-block">slope of v vs. t = Δv / Δt = a</p>
            <p>A horizontal x–t graph means the object is at rest. A horizontal v–t graph means acceleration is zero.</p>
          </section>
          <section class="theory-block">
            <h3>3. Area under v vs. t is displacement</h3>
            <p>For a short interval at nearly constant velocity, the rectangle under the graph has area (height)×(width) = v Δt, which is Δx. Adding those rectangles (or using a trapezoid when v changes linearly) reconstructs the net displacement. Area below the time axis is negative because v is negative:</p>
            <p class="eq-block">Δx = area under v(t)</p>
            <p>Distance is the total area counting both sides as positive: D = Σ |v| Δt. That is why a round trip can have Δx = 0 and D &gt; 0 on the same v–t graph.</p>
          </section>
          <section class="theory-block">
            <h3>4. Speeding up vs. slowing down</h3>
            <p>Speed is |v|. Speed increases when velocity and acceleration have the same sign (both positive, or both negative), because then |v| is growing. Speed decreases when v and a have opposite signs. Negative acceleration is not automatically “moving left.”</p>
          </section>
          <section class="theory-block">
            <h3>5. Collisions</h3>
            <p>Turn on <strong>Allow collisions</strong> to place elastic walls at ±20 m. On impact the wall does not move, so the object’s velocity reverses (v → −v) while the programmed acceleration keeps its value. Distance still counts every meter of the path, including the return from the wall.</p>
          </section>
          ${trialFitTheory(`
            <p>The live x–t, v–t, and a–t graphs are the motion itself. The recorded scatters test the same identities across several runs: D vs. Δx should respect D ≥ |Δx|, and v<sub>avg</sub> vs. t should be linear with slope a/2 when a is constant and you have not yet bounced.</p>
          `)}
        </article>
      </div>
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

      <div id="panel-theory" role="tabpanel" aria-labelledby="tab-btn-theory" hidden>
        <article class="theory">
          <header class="theory-hero">
            <p class="kicker">Read this, then return to the lab</p>
            <h2>Motion is measured from a frame</h2>
            <p>
              A reference frame is the coordinate system you use to report position and velocity.
              Changing frames changes the numbers, not the event.
            </p>
          </header>
          <section class="theory-block">
            <h3>1. Relative velocity from relative position</h3>
            <p>Define the position of A relative to B as the difference of their ground positions. Relative velocity is how that difference changes with time:</p>
            <p class="eq-block">
              x<sub>A/B</sub> = x<sub>A</sub> − x<sub>B</sub><br />
              v<sub>A/B</sub> = d x<sub>A/B</sub> / dt = v<sub>A</sub> − v<sub>B</sub>
            </p>
            <p>Swapping the labels flips the sign, so v<sub>B/A</sub> = −v<sub>A/B</sub>. If both trains move east, a passenger on the slower train still sees the faster train moving east, but more slowly.</p>
          </section>
          <section class="theory-block">
            <h3>2. Same velocity, different stories</h3>
            <p>If v<sub>A</sub> = v<sub>B</sub> = +5 m/s, then v<sub>A/B</sub> = 0. The ground observer sees both objects move. In A's frame, B is at rest. Both descriptions are correct.</p>
          </section>
          <section class="theory-block">
            <h3>3. Positions in a moving frame</h3>
            <p>Each object follows x = x₀ + v t on the ground (constant velocity). Subtract those two lines:</p>
            <p class="eq-block">
              x<sub>A/B</sub>(t) = (x<sub>A0</sub> + v<sub>A</sub> t) − (x<sub>B0</sub> + v<sub>B</sub> t)<br />
              x<sub>A/B</sub>(t) = x<sub>A0</sub> − x<sub>B0</sub> + (v<sub>A</sub> − v<sub>B</sub>) t
            </p>
            <p>When you choose Object A as the frame, A is drawn at x = 0. B's displayed position is how far B is from A. The slope of x<sub>A/B</sub> vs. t is exactly v<sub>A/B</sub>.</p>
          </section>
          <section class="theory-block">
            <h3>4. Meeting time</h3>
            <p>They meet when they occupy the same ground position, which is the same statement as x<sub>A/B</sub> = 0:</p>
            <p class="eq-block">
              0 = (x<sub>A0</sub> − x<sub>B0</sub>) + (v<sub>A</sub> − v<sub>B</sub>) t<br />
              t = (x<sub>B0</sub> − x<sub>A0</sub>) / (v<sub>A</sub> − v<sub>B</sub>)
            </p>
            <p>If relative velocity is zero and they start apart, the denominator is zero and they never meet. They pass through each other; this lab does not bounce them. Separation on the trial graph is the absolute value s = |x<sub>A/B</sub>|, so s vs. t is a V that touches zero at the meeting time.</p>
          </section>
          ${trialFitTheory(`
            <p>x<sub>A/B</sub> vs. v<sub>A/B</sub> at mixed times is not a required line: relative position also depends on the starting gap and on t. A near-zero slope is common if you change speed without changing the snapshot time much. Separation vs. time should fit a line while they close or recede without meeting; after they pass, s starts increasing and a single straight fit will look worse (lower R²).</p>
          `)}
        </article>
      </div>
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

      <div id="panel-theory" role="tabpanel" aria-labelledby="tab-btn-theory" hidden>
        <article class="theory">
          <header class="theory-hero">
            <p class="kicker">Read this, then return to the lab</p>
            <h2>Many objects, one system</h2>
            <p>
              Dynamics starts by choosing what counts as the system. Once that choice is made, the center of mass
              describes the system's overall translational motion, even when the pieces inside it move differently.
            </p>
          </header>
          <section class="theory-block">
            <h3>1. Defining the system</h3>
            <p>A system is the collection of objects you have decided to analyze together. Everything else is the environment. The dashed box in the lab is that choice made visible. Switching from A + B to A only does not change the objects; it changes which forces count as internal.</p>
          </section>
          <section class="theory-block">
            <h3>2. Center-of-mass position</h3>
            <p>The center of mass is the mass-weighted average position. For any number of particles:</p>
            <p class="eq-block">x<sub>CM</sub> = Σ m<sub>i</sub> x<sub>i</sub> / Σ m<sub>i</sub></p>
            <p>For two objects that is x<sub>CM</sub> = (m<sub>A</sub> x<sub>A</sub> + m<sub>B</sub> x<sub>B</sub>) / (m<sub>A</sub> + m<sub>B</sub>). If the masses are equal, x<sub>CM</sub> sits halfway between them. If m<sub>B</sub> &gt; m<sub>A</sub>, the center of mass lies closer to B. It is not a third physical object; it is a derived location.</p>
          </section>
          <section class="theory-block">
            <h3>3. Center-of-mass velocity</h3>
            <p>Differentiate the position identity, or average the velocities the same way:</p>
            <p class="eq-block">v<sub>CM</sub> = Σ m<sub>i</sub> v<sub>i</sub> / Σ m<sub>i</sub></p>
            <p>Total momentum of the selected system is p = Σ m<sub>i</sub> v<sub>i</sub>, so p = M v<sub>CM</sub>. Equal-and-opposite momenta give v<sub>CM</sub> = 0: the objects can rush apart while the diamond stays put.</p>
          </section>
          <section class="theory-block">
            <h3>4. Internal forces do not move the CM</h3>
            <p>Newton’s third law pairs inside the system cancel in the sum of forces. If A pushes B to the right, B pushes A to the left with the same magnitude. Those two forces change a<sub>A</sub> and a<sub>B</sub> but not a<sub>CM</sub> of A + B. The Internal push-apart preset starts both objects at rest; they accelerate oppositely and the diamond does not move.</p>
          </section>
          <section class="theory-block">
            <h3>5. External forces do move the CM</h3>
            <p>The net force from outside the boundary accelerates the center of mass as if the total mass sat there:</p>
            <p class="eq-block">F<sub>ext</sub> = M a<sub>CM</sub><br />a<sub>CM</sub> = F<sub>ext</sub> / M</p>
            <p>This lab applies F_ext to the selected system and shares it in proportion to mass, so every member gets that same a<sub>CM</sub>. Rearranging A and B without changing M or F_ext leaves a<sub>CM</sub> unchanged. Later Newton’s-law labs will draw the individual forces; the identity is the same.</p>
          </section>
          <section class="theory-block">
            <h3>6. The same force, two stories</h3>
            <p>The A↔B interaction is internal when the system is A + B and external when the system is A only (or B only). Select A only with a nonzero A↔B force: a<sub>CM</sub> of that smaller system is no longer zero, because the force from B now comes from outside the boundary.</p>
          </section>
          <section class="theory-block">
            <h3>7. Motion in time</h3>
            <p>With constant accelerations,</p>
            <p class="eq-block">
              x<sub>i</sub>(t) = x<sub>i0</sub> + v<sub>i0</sub> t + ½ a<sub>i</sub> t²<br />
              x<sub>CM</sub>(t) = x<sub>CM0</sub> + v<sub>CM0</sub> t + ½ a<sub>CM</sub> t²
            </p>
            <p>The marker is always recalculated from the current object states. It is never interpolated on its own.</p>
          </section>
          ${trialFitTheory(`
            <p>Center of mass vs. mass of B should follow the two-body identity if you keep x_A, x_B, and m_A fixed. Center of mass vs. time should match x_CM0 + v_CM t + ½ a_CM t² for the current F_ext. Two points always give R² = 1; record several runs before you trust the fit.</p>
          `)}
        </article>
      </div>
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

      <div id="panel-theory" role="tabpanel" aria-labelledby="tab-btn-theory" hidden>
        <article class="theory">
          <header class="theory-hero">
            <p class="kicker">Read this, then return to the lab</p>
            <h2>Forces on one selected object</h2>
            <p>
              A free-body diagram is a simplified picture of every external force acting on the object you chose to analyze.
              The scene, the FBD, and the force list are three views of the same list.
            </p>
          </header>
          <section class="theory-block">
            <h3>1. What a force is</h3>
            <p>A force is an interaction that can change an object’s motion. It has magnitude (newtons) and direction. Velocity and acceleration are not forces, so they never appear as arrows on the FBD.</p>
          </section>
          <section class="theory-block">
            <h3>2. The free-body diagram rule</h3>
            <p>Draw only forces acting <em>on</em> the selected object. Do not draw the floor, the rope, or the force the box exerts back on the table. Simulation 2.1’s dashed system box is the same idea: anything from outside the boundary is external.</p>
          </section>
          <section class="theory-block">
            <h3>3. Common forces</h3>
            <p class="eq-block">
              F<sub>g</sub> = mg, downward (Earth or other planet → box)<br />
              F<sub>N</sub> perpendicular to the surface (surface → box)<br />
              F<sub>f</sub> opposes sliding or attempted sliding (surface → box)<br />
              F<sub>T</sub> along the rope, away from the box (rope → box)<br />
              F<sub>app</sub> depends on the push or pull
            </p>
            <p>On a horizontal table at rest, F<sub>N</sub> often equals F<sub>g</sub>, but this lab lets you unbalance them so you can see they are not the same force.</p>
          </section>
          <section class="theory-block">
            <h3>4. Net force</h3>
            <p>Add the vectors:</p>
            <p class="eq-block">
              F<sub>net,x</sub> = Σ F<sub>x</sub><br />
              F<sub>net,y</sub> = Σ F<sub>y</sub><br />
              |F<sub>net</sub>| = √(F<sub>net,x</sub>² + F<sub>net,y</sub>²)
            </p>
            <p>0° is right, 90° is up, 180° is left, 270° is down. If |F<sub>net</sub>| is zero, the forces are balanced. That does not mean the object is at rest — it can coast at constant velocity.</p>
          </section>
          <section class="theory-block">
            <h3>5. Force is not motion</h3>
            <p>A box on a table has gravity and a normal force even when it is not moving. A box with F<sub>net</sub> = 0 and v = 5 m/s keeps moving. Force is related to <em>changes</em> in motion. Newton’s second law, ΣF = ma, is the compact statement; Simulation 2.5 will make it the main lesson. Motion mode here is optional practice.</p>
          </section>
          <section class="theory-block">
            <h3>6. Mistakes to avoid</h3>
            <p>Do not draw velocity or acceleration as forces. Do not put both sides of a Newton’s-third-law pair on the same FBD (that is Simulation 2.3). Do not treat the table itself as a force — the normal force is the force from the table.</p>
          </section>
          ${trialFitTheory(`
            <p>Weight vs. mass should follow F<sub>g</sub> = mg for the current g. a<sub>x</sub> vs. |F<sub>net</sub>| should follow a = F<sub>net</sub>/m if you keep mass fixed and change the horizontal forces. Two points always give R² = 1; record several runs before you trust the fit.</p>
          `)}
        </article>
      </div>
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

      <div id="panel-theory" role="tabpanel" aria-labelledby="tab-btn-theory" hidden>
        <article class="theory">
          <header class="theory-hero">
            <p class="kicker">Read this, then return to the lab</p>
            <h2>Forces come in interaction pairs</h2>
            <p>
              When two objects interact, they exert forces on each other that are equal in magnitude and opposite in direction.
              Those two forces never appear on the same free-body diagram.
            </p>
          </header>
          <section class="theory-block">
            <h3>1. The pair identity</h3>
            <p class="eq-block">F(A on B) = −F(B on A)</p>
            <p>The minus sign is opposite direction, not “they cancel.” A on B acts on B. B on A acts on A. Simulation 2.2 taught you to draw only forces on the selected object; this lab shows the missing partner on the other object.</p>
          </section>
          <section class="theory-block">
            <h3>2. Four checks</h3>
            <p>A Newton’s third-law pair must:</p>
            <p class="eq-block">same interaction · equal |F| · opposite direction · different objects</p>
            <p>Gravity on a box and the normal force on that box fail the last two checks that matter most: they are not the same interaction, and they both act on the box. The partner of “Earth on box” is “box on Earth.”</p>
          </section>
          <section class="theory-block">
            <h3>3. Equal force is not equal acceleration</h3>
            <p>If the pair is isolated,</p>
            <p class="eq-block">
              |a_A| = F / m_A<br />
              |a_B| = F / m_B
            </p>
            <p>For m_A = 2 kg, m_B = 8 kg, and F = 24 N, a_A = 12 m/s² and a_B = 3 m/s². The forces stay 24 N and 24 N. Simulation 2.5 will make ΣF = ma the main story; here it only explains why the lighter object moves more.</p>
          </section>
          <section class="theory-block">
            <h3>4. Extra forces change net force, not the pair</h3>
            <p>Add 30 N right on A while B on A is 20 N left. Then F_net,A = 10 N right and F_net,B is still 20 N right. The interaction pair remains 20 N / 20 N. Net force is a sum on one object; the third-law pair is an interaction between two objects.</p>
          </section>
          <section class="theory-block">
            <h3>5. Gravity as a pair</h3>
            <p>This lab uses an educational constant G = 10 N·m²/kg² so F = G m_A m_B / r² is readable. Changing either mass or the distance updates both forces together. Earth is drawn with a scaled mass so you can see a_Earth ≪ a_object without using 10<sup>24</sup> kg.</p>
          </section>
          <section class="theory-block">
            <h3>6. Mistakes to avoid</h3>
            <p>Do not put both members of the pair on one FBD. Do not say the forces cancel. Do not assume the heavier object exerts a larger force. Do not treat gravity and the normal force as a third-law pair.</p>
          </section>
          ${trialFitTheory(`
            <p>|a_A| vs. 1/m_A should follow |a_A| = F / m_A if you keep the interaction force fixed. B on A vs. A on B should be the identity y = x. Two points always give R² = 1; record several mass and force combinations before you trust the fit.</p>
          `)}
        </article>
      </div>
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

      <div id="panel-theory" role="tabpanel" aria-labelledby="tab-btn-theory" hidden>
        <article class="theory">
          <header class="theory-hero">
            <p class="kicker">Read this, then return to the lab</p>
            <h2>Constant velocity when the net force is zero</h2>
            <p>
              Newton’s first law is not “objects at rest stay at rest and objects in motion stay in motion” as a slogan.
              It is a statement about <em>net</em> force: if ΣF = 0, acceleration is zero, so velocity does not change.
            </p>
          </header>
          <section class="theory-block">
            <h3>1. The quantity that matters</h3>
            <p>Individual forces can exist while the object is in equilibrium. Equilibrium means the vector sum is zero, not that the force list is empty, and not that the object is sitting still.</p>
            <p class="eq-block">F<sub>net</sub> = ΣF</p>
          </section>
          <section class="theory-block">
            <h3>2. From net force to constant velocity</h3>
            <p>Use the second-law relation as a tool, not as this lab’s main story:</p>
            <p class="eq-block">
              F<sub>net</sub> = 0<br />
              a = F<sub>net</sub> / m = 0<br />
              a = Δv / Δt ⇒ Δv = 0<br />
              v<sub>f</sub> = v<sub>i</sub>
            </p>
            <p>If v<sub>i</sub> is already zero, the object remains at rest. If v<sub>i</sub> is +5 m/s, it stays +5 m/s. Those are the same law.</p>
          </section>
          <section class="theory-block">
            <h3>3. Balanced forces are still forces</h3>
            <p>20 N right and 20 N left still appear as two arrows. The net is 0 N. Do not erase the arrows because they add to zero. The free-body diagram is the list of interactions, not the leftover after canceling.</p>
          </section>
          <section class="theory-block">
            <h3>4. Why everyday objects seem to “need a push”</h3>
            <p>On a rough table, friction is a real external force. When you stop pushing, friction often becomes the unbalanced force that slows the object. The object does not stop because motion is unnatural. It stops because a net force changed its velocity.</p>
          </section>
          <section class="theory-block">
            <h3>5. Inertia is not a force</h3>
            <p>Inertia is the tendency of velocity to remain unchanged unless a net external force acts. Mass measures that resistance. The same 16 N on 2 kg and 8 kg gives 8 m/s² and 2 m/s². Nothing in that comparison is an “inertia arrow.”</p>
          </section>
          <section class="theory-block">
            <h3>6. Mistakes to avoid</h3>
            <p>Do not say objects naturally stop. Do not say no force means no motion. Do not say balanced forces mean the object is not moving. Do not draw inertia or velocity as forces. Do not treat gravity and the normal force as a reason the first law fails — they can sum to zero while the object coasts.</p>
          </section>
          ${trialFitTheory(`
            <p>a vs. F_net should follow a = F_net / m if you keep mass fixed. Record both F_net = 0 (a should be 0) and unbalanced runs. Two points always give R² = 1; record several before you trust the fit.</p>
          `)}
        </article>
      </div>
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
          <p class="sim-nav"><a href="/simulations/module-2/2-4" data-link>← 2.4</a> · <a href="/simulations/module-2" data-link>Module 2</a> · <span class="muted">2.6 coming</span></p>
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
              <p class="conn-card">Next: gravitational force (2.6, coming) uses F<sub>net</sub> = ma to explain how weight produces acceleration.</p>
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

      <div id="panel-theory" role="tabpanel" aria-labelledby="tab-btn-theory" hidden>
        <article class="theory">
          <header class="theory-hero">
            <p class="kicker">Read this, then return to the lab</p>
            <h2>Acceleration from net force and mass</h2>
            <p>
              Newton’s second law is not a slogan to memorize. It is the observed relationship: acceleration is
              proportional to net force and inversely proportional to mass.
            </p>
          </header>
          <section class="theory-block">
            <h3>1. The force that belongs in the equation</h3>
            <p>Individual forces can be large while the leftover after adding them is small. The equation uses the vector sum:</p>
            <p class="eq-block">F<sub>net</sub> = ΣF<br />a = F<sub>net</sub> / m<br />F<sub>net</sub> = ma</p>
          </section>
          <section class="theory-block">
            <h3>2. What the experiments show</h3>
            <p>Hold mass fixed and double F<sub>net</sub>: a doubles. Hold F<sub>net</sub> fixed and double mass: a halves. Those two statements together are a ∝ F<sub>net</sub>/m.</p>
          </section>
          <section class="theory-block">
            <h3>3. Direction</h3>
            <p>Acceleration always points with F<sub>net</sub>. Velocity can point the other way. An object moving right with a leftward net force is slowing down, then it can stop and reverse while a stays leftward.</p>
          </section>
          <section class="theory-block">
            <h3>4. Zero net force is first law</h3>
            <p>If F<sub>net</sub> = 0, a = 0, so velocity stays whatever it already is — including rest. Second law does not replace first law. First law is the F<sub>net</sub> = 0 case.</p>
          </section>
          <section class="theory-block">
            <h3>5. Force does not set velocity</h3>
            <p>A 20 N net force on 5 kg always gives 4 m/s², whether the object is at rest or already moving at 8 m/s. Force changes velocity; it does not equal velocity.</p>
          </section>
          <section class="theory-block">
            <h3>6. Mistakes to avoid</h3>
            <p>Do not use the largest individual force as F in F = ma. Do not say a large speed requires a large net force. Do not say doubling force doubles velocity. Do not say a larger mass gets a larger acceleration from the same force.</p>
          </section>
          ${trialFitTheory(`
            <p>a vs. F_net at fixed mass should be a line through the origin with slope 1/m. a vs. m at fixed F_net should be inverse. a vs. 1/m should be linear with slope F_net.</p>
          `)}
        </article>
      </div>
    </section>
  `;
}
