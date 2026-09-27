import { LAB_FEATURES, availableCount, getModule, modules, projectileSim } from "./curriculum.js";
import { moduleCards, statusBadge } from "./chrome.js";
import {
  challengeCard,
  labIconToolbar,
  labTablist,
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
          Every available simulation, including 1.1–1.5, uses the same shell so later units do not invent a new interface.
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
      <p>Use <strong>Simulations</strong> to browse by unit. Unit 1 currently includes 1.1 Scalars and Vectors, 1.2 Displacement, Velocity, and Acceleration, 1.3 Representing Motion, 1.4 Reference Frames and Relative Motion, and 1.5 Vectors and Motion in Two Dimensions (the projectile lab).</p>
      <h2>Lab, Theory, Challenge, Teacher view</h2>
      <p>Every available lab uses the same shell. Theory holds equations and examples. Challenge randomizes a target and hides the answer until you check or launch. Teacher view compares live values with the identities the course uses. Record and auto-record fill a trial table and graphs.</p>
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
              <div class="nudge-row">
                <label class="pos-input">
                  Position
                  <input id="pos-input" type="number" step="0.5" min="-12" max="12" value="0" />
                  <span>m</span>
                </label>
                <label class="switch light"><input id="toggle-vectors" type="checkbox" checked /> Vector arrows</label>
              </div>
              <p class="track-help">Drag the object. Arrow keys move it by 1 m. Distance adds every segment of the path.</p>
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
          rangeCaption: "The dashed curve is a least-squares fit. Distance should never fall below |displacement|.",
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
              <p class="track-help">Drag the object at t = 0 to set x₀. Space plays or pauses. Negative acceleration is not the same as moving left.</p>
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
          rangeCaption: "The dashed curve is a least-squares fit. If the object reverses, distance keeps growing while displacement can shrink.",
          heightCaption: "Average velocity is Δx / Δt for that run. For constant acceleration the points should lie near a straight line.",
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
              <p class="track-help">Dot spacing is speed at equal time steps. Click a graph while paused to jump to that time. Allow collisions to bounce elastically at ±20 m.</p>
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
          rangeCaption: "The dashed curve is a least-squares fit. If the object reverses or bounces, distance keeps growing while displacement can shrink.",
          heightCaption: "Average velocity is Δx / Δt for that run. Compare the fitted slope to (v₀ + v) / 2 when acceleration is constant.",
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
              <p class="track-help">Switch frames while the motion runs. A and B pass through each other. Drag either object at t = 0 to set its starting position.</p>
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
          heightCaption: "The dashed curve is a least-squares fit. Separation is |x_A/B|, so a straight line only holds until they meet.",
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
