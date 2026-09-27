import {
  analyzeLaunch,
  generateChallenge,
  goalTolerance,
  measuredGoal,
  createLaunchState,
  launch as startLaunch,
  pause as pauseSim,
  predictedTrajectory,
  rangeError,
  resume as resumeSim,
  step,
  sweepAngles,
} from "/lib/projectile.js";
import { renderTheoryGraphs, renderTrialGraphs } from "./graphs.js";
import { renderSimulation } from "./render.js";
import { bindDownload, bindFullscreen, labIconToolbar } from "./platform/lab-kit.js";

const toolbarSlot = document.getElementById("lab-icon-toolbar");
if (toolbarSlot && !toolbarSlot.querySelector("#btn-reset")) {
  toolbarSlot.innerHTML = labIconToolbar();
}

const $ = (id) => document.getElementById(id);
const THEORY_EXAMPLE = { v0: 20, g: 9.8 };

const ui = {
  v0: 20,
  angleDeg: 45,
  g: 9.8,
};

let sim = createLaunchState(ui);
let trials = [];
let predicted = predictedTrajectory(ui);
let ghost = [];
let debugMode = false;
let autoRecord = false;
let activeTab = "lab";
let challenge = {
  active: false,
  attempted: false,
  revealed: false,
  lastMeasured: null,
  spec: null,
};

const els = {
  canvas: $("sim-canvas"),
  graphRange: $("graph-range"),
  graphHeight: $("graph-height"),
  graphTheoryRange: $("graph-theory-range"),
  graphTheoryHeight: $("graph-theory-height"),
  panelLab: $("panel-lab"),
  panelTheory: $("panel-theory"),
  tabLab: $("tab-btn-lab"),
  tabTheory: $("tab-btn-theory"),
  openTheory: $("open-theory"),
  angle: $("angle"),
  velocity: $("velocity"),
  gravity: $("gravity"),
  angleRead: $("angle-readout"),
  velRead: $("velocity-readout"),
  gRead: $("gravity-readout"),
  launch: $("btn-launch"),
  pause: $("btn-pause"),
  reset: $("btn-reset"),
  record: $("btn-record"),
  clear: $("btn-clear"),
  autoRecord: $("auto-record"),
  trialBody: $("trial-body"),
  challengeToggle: $("challenge-toggle"),
  challengeBody: $("challenge-body"),
  challengeQ: $("challenge-q"),
  challengeGivens: $("challenge-givens"),
  challengeGoal: $("challenge-goal"),
  challengeUnknown: $("challenge-unknown"),
  challengeFeedback: $("challenge-feedback"),
  reveal: $("btn-reveal"),
  newTarget: $("btn-new-target"),
  debugToggle: $("debug-toggle"),
  debugLine: $("debug-line"),
};

const download = bindDownload(document, {
  filename: "ap-physics-1-1-5-trials",
  getTable() {
    return {
      title: "AP Physics 1 — 1.5 Vectors and Motion in Two Dimensions",
      columns: [
        "Trial",
        "Angle (deg)",
        "Velocity (m/s)",
        "Gravity (m/s²)",
        "Time (s)",
        "Max height (m)",
        "Range (m)",
      ],
      rows: trials.map((t) => [t.id, t.angleDeg, t.v0, t.g, t.time, t.maxHeight, t.range]),
    };
  },
});
bindFullscreen($("btn-fullscreen"));

function fmt(n, digits) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

function paramsMatch(a, b) {
  return a.v0 === b.v0 && a.angleDeg === b.angleDeg && a.g === b.g;
}

function flightLocked() {
  return sim.isRunning || (sim.landed && sim.trajectory.length > 1);
}

function syncReadouts() {
  els.angleRead.textContent = `${ui.angleDeg}°`;
  els.velRead.textContent = `${ui.v0} m/s`;
  els.gRead.textContent = `${ui.g.toFixed(1)} m/s²`;
  for (const chip of document.querySelectorAll(".chip[data-angle]")) {
    chip.classList.toggle("active", Number(chip.dataset.angle) === ui.angleDeg);
  }
}

function setControlsEnabled() {
  const spec = challenge.active ? challenge.spec : null;
  const unknown = spec?.unknown;
  els.angle.disabled = Boolean(spec && unknown !== "angleDeg");
  els.velocity.disabled = Boolean(spec && unknown !== "v0");
  els.gravity.disabled = Boolean(spec && unknown !== "g");
  for (const chip of document.querySelectorAll(".chip[data-angle]")) {
    chip.disabled = els.angle.disabled;
  }
}

function updateLive() {
  $("m-t").textContent = `${fmt(sim.t, 2)} s`;
  $("m-x").textContent = `${fmt(sim.x, 1)} m`;
  $("m-y").textContent = `${fmt(Math.max(0, sim.y), 1)} m`;
  $("m-vx").textContent = `${fmt(sim.vx, 1)} m/s`;
  $("m-vy").textContent = `${fmt(sim.vy, 1)} m/s`;
  $("m-speed").textContent = `${fmt(sim.speed, 1)} m/s`;

  if (sim.landed) {
    $("m-tof").textContent = `${fmt(sim.measuredTimeOfFlight, 2)} s`;
    $("m-hmax").textContent = `${fmt(sim.measuredMaxHeight, 1)} m`;
    $("m-range").textContent = `${fmt(sim.measuredRange, 1)} m`;
  } else {
    $("m-tof").textContent = "—";
    $("m-hmax").textContent = "—";
    $("m-range").textContent = "—";
  }

  if (debugMode) {
    const report = analyzeLaunch({ v0: sim.v0, angleDeg: sim.angleDeg, g: sim.g });
    const a = report.analytical;
    const s = report.simulated;
    els.debugLine.hidden = false;
    els.debugLine.textContent =
      `Equations  T=${fmt(a.timeOfFlight, 2)} s  H=${fmt(a.maxHeight, 2)} m  R=${fmt(a.range, 2)} m   ·   ` +
      `Simulated  T=${fmt(s.timeOfFlight, 2)} s  H=${fmt(s.maxHeight, 2)} m  R=${fmt(s.range, 2)} m`;
  } else {
    els.debugLine.hidden = true;
  }
}

function refreshPredicted() {
  predicted = predictedTrajectory(ui);
  if (flightLocked() && !paramsMatch(sim, ui)) {
    ghost = predictedTrajectory(ui);
  } else {
    ghost = [];
  }
}

function drawSim() {
  if (activeTab !== "lab") return;
  renderSimulation(els.canvas, {
    sim,
    pending: ui,
    predicted,
    ghost,
    challenge: challenge.active ? { ...challenge.spec, active: true } : { active: false },
  });
}

function drawCharts() {
  if (activeTab === "lab") {
    renderTrialGraphs({
      rangeCanvas: els.graphRange,
      heightCanvas: els.graphHeight,
      trials,
    });
    return;
  }
  const curve = sweepAngles({ v0: THEORY_EXAMPLE.v0, g: THEORY_EXAMPLE.g, stepDeg: 1 }).points;
  renderTheoryGraphs({
    rangeCanvas: els.graphTheoryRange,
    heightCanvas: els.graphTheoryHeight,
    curve,
  });
}

function drawAll() {
  drawSim();
  drawCharts();
}

function renderTrials() {
  if (!trials.length) {
    els.trialBody.innerHTML =
      '<tr class="empty-row"><td colspan="7">No trials yet. Launch, then record a trial to start a data table.</td></tr>';
    download.sync();
    return;
  }
  const maxRange = Math.max(...trials.map((t) => t.range));
  els.trialBody.innerHTML = trials
    .map((t) => {
      const best = t.range === maxRange && maxRange > 0 ? "best" : "";
      return `<tr class="${best}">
        <td>${t.id}</td>
        <td>${t.angleDeg}°</td>
        <td>${t.v0} m/s</td>
        <td>${t.g.toFixed(1)}</td>
        <td>${fmt(t.time, 2)} s</td>
        <td>${fmt(t.maxHeight, 1)} m</td>
        <td>${fmt(t.range, 1)} m</td>
      </tr>`;
    })
    .join("");
  download.sync();
}

function applyUiFromSliders() {
  ui.angleDeg = Number(els.angle.value);
  ui.v0 = Number(els.velocity.value);
  ui.g = Number(els.gravity.value);
  if (!sim.isRunning && !sim.landed && sim.t === 0) {
    sim = createLaunchState(ui);
  }
  syncReadouts();
  refreshPredicted();
  updateLive();
  drawAll();
}

function doLaunch() {
  sim = startLaunch(createLaunchState(ui));
  acc = 0;
  els.pause.textContent = "Pause";
  refreshPredicted();
  updateLive();
  drawAll();
}

function doPause() {
  if (!sim.isRunning || sim.landed) return;
  if (sim.isPaused) {
    resumeSim(sim);
    els.pause.textContent = "Pause";
  } else {
    pauseSim(sim);
    els.pause.textContent = "Resume";
  }
}

function doReset() {
  sim = createLaunchState(ui);
  acc = 0;
  els.pause.textContent = "Pause";
  refreshPredicted();
  updateLive();
  drawAll();
}

function pushTrial({ angleDeg, v0, g, time, maxHeight, range }) {
  trials.push({
    id: trials.length + 1,
    angleDeg,
    v0,
    g,
    time,
    maxHeight,
    range,
  });
  renderTrials();
  drawCharts();
}

function recordTrial() {
  const report = analyzeLaunch({ v0: ui.v0, angleDeg: ui.angleDeg, g: ui.g });
  const useFlight = sim.landed && paramsMatch(sim, ui);
  pushTrial({
    angleDeg: ui.angleDeg,
    v0: ui.v0,
    g: ui.g,
    time: useFlight ? sim.measuredTimeOfFlight : report.simulated.timeOfFlight,
    maxHeight: useFlight ? sim.measuredMaxHeight : report.simulated.maxHeight,
    range: useFlight ? sim.measuredRange : report.simulated.range,
  });
}

function recordLandedTrial(state) {
  pushTrial({
    angleDeg: state.angleDeg,
    v0: state.v0,
    g: state.g,
    time: state.measuredTimeOfFlight,
    maxHeight: state.measuredMaxHeight,
    range: state.measuredRange,
  });
}

function clearTrials() {
  trials = [];
  renderTrials();
  drawCharts();
}

function setAngle(value) {
  if (els.angle.disabled) return;
  els.angle.value = String(value);
  applyUiFromSliders();
}

function goalDigits(goalKey) {
  return goalKey === "timeOfFlight" ? 2 : 1;
}

function formatSolution(spec) {
  if (spec.unknown === "angleDeg") {
    return spec.solution.map((a) => `${a.toFixed(1)}°`).join(" or ");
  }
  if (spec.unknown === "v0") return `${fmt(spec.solution[0], 1)} m/s`;
  return `${fmt(spec.solution[0], 1)} m/s²`;
}

function renderChallengeCard() {
  const spec = challenge.spec;
  if (!spec) return;
  els.challengeQ.textContent = spec.prompt;
  const givenRows = [];
  if (spec.givens.v0 != null) givenRows.push(["Initial speed v₀", `${spec.givens.v0} m/s`]);
  if (spec.givens.angleDeg != null) givenRows.push(["Launch angle θ", `${spec.givens.angleDeg}°`]);
  if (spec.givens.g != null) givenRows.push(["Gravity g", `${spec.givens.g.toFixed(1)} m/s²`]);
  els.challengeGivens.innerHTML = givenRows
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
    .join("");
  els.challengeGoal.textContent = `Target ${spec.goalLabel}: ${fmt(spec.goalValue, goalDigits(spec.goalKey))} ${spec.goalUnit}`;
  els.challengeUnknown.textContent = `Solve for ${spec.unknownLabel}. Only that slider is unlocked.`;
}

function describeChallengeFeedback() {
  const spec = challenge.spec;
  if (!spec || !challenge.attempted) {
    els.challengeFeedback.className = "feedback";
    els.challengeFeedback.textContent = "The solution stays hidden until you launch.";
    els.reveal.disabled = true;
    return;
  }
  const err = rangeError(challenge.lastMeasured, spec.goalValue);
  const close = err.abs <= goalTolerance(spec.goalKey, spec.goalValue);
  els.challengeFeedback.className = `feedback ${close ? "hit" : "miss"}`;
  const digits = goalDigits(spec.goalKey);
  let text = `Yours: ${fmt(challenge.lastMeasured, digits)} ${spec.goalUnit}. Target: ${fmt(spec.goalValue, digits)} ${spec.goalUnit}. Difference: ${fmt(err.abs, digits)} ${spec.goalUnit}.`;
  if (close) text += " Close enough.";
  else if (spec.type === "angle-range") text += " Complementary angles can produce the same range.";
  if (challenge.revealed) text += ` Answer: ${formatSolution(spec)}.`;
  els.challengeFeedback.textContent = text;
  els.reveal.disabled = false;
}

function applyChallengeGivens(spec) {
  if (spec.givens.v0 != null) {
    ui.v0 = spec.givens.v0;
    els.velocity.value = String(ui.v0);
  }
  if (spec.givens.angleDeg != null) {
    ui.angleDeg = spec.givens.angleDeg;
    els.angle.value = String(ui.angleDeg);
  }
  if (spec.givens.g != null) {
    ui.g = spec.givens.g;
    els.gravity.value = String(ui.g);
  }
  if (spec.unknown === "angleDeg") {
    ui.angleDeg = spec.secrets.angleDeg >= 45 ? 25 : 65;
    els.angle.value = String(ui.angleDeg);
  } else if (spec.unknown === "v0") {
    ui.v0 = spec.secrets.v0 >= 25 ? 12 : 36;
    els.velocity.value = String(ui.v0);
  } else if (spec.unknown === "g") {
    ui.g = spec.secrets.g >= 10 ? 5.0 : 14.0;
    els.gravity.value = String(ui.g);
  }
}

function loadChallenge(spec) {
  challenge.spec = spec;
  challenge.attempted = false;
  challenge.revealed = false;
  challenge.lastMeasured = null;
  applyChallengeGivens(spec);
  renderChallengeCard();
  describeChallengeFeedback();
  setControlsEnabled();
  syncReadouts();
  doReset();
}

function newChallenge() {
  loadChallenge(generateChallenge());
}

function setChallenge(on) {
  challenge.active = on;
  els.challengeBody.hidden = !on;
  if (on) newChallenge();
  else {
    challenge.spec = null;
    setControlsEnabled();
    syncReadouts();
    refreshPredicted();
    drawAll();
  }
}

function onLanded() {
  if (autoRecord) recordLandedTrial(sim);
  if (challenge.active && challenge.spec) {
    challenge.attempted = true;
    challenge.lastMeasured = measuredGoal(sim, challenge.spec.goalKey);
    describeChallengeFeedback();
  }
}

function showTab(name) {
  activeTab = name;
  const lab = name === "lab";
  els.panelLab.hidden = !lab;
  els.panelTheory.hidden = lab;
  els.tabLab.classList.toggle("active", lab);
  els.tabTheory.classList.toggle("active", !lab);
  els.tabLab.setAttribute("aria-selected", String(lab));
  els.tabTheory.setAttribute("aria-selected", String(!lab));
  requestAnimationFrame(() => {
    drawAll();
  });
}

els.angle.addEventListener("input", applyUiFromSliders);
els.velocity.addEventListener("input", applyUiFromSliders);
els.gravity.addEventListener("input", applyUiFromSliders);
els.launch.addEventListener("click", doLaunch);
els.pause.addEventListener("click", doPause);
els.reset?.addEventListener("click", doReset);
els.record.addEventListener("click", recordTrial);
els.clear.addEventListener("click", clearTrials);
els.autoRecord.addEventListener("change", () => {
  autoRecord = els.autoRecord.checked;
});
els.challengeToggle.addEventListener("change", () => setChallenge(els.challengeToggle.checked));
els.reveal.addEventListener("click", () => {
  if (!challenge.attempted) return;
  challenge.revealed = true;
  describeChallengeFeedback();
});
els.newTarget.addEventListener("click", () => {
  if (challenge.active) newChallenge();
});
els.debugToggle.addEventListener("change", () => {
  debugMode = els.debugToggle.checked;
  updateLive();
});
els.tabLab.addEventListener("click", () => showTab("lab"));
els.tabTheory.addEventListener("click", () => showTab("theory"));
els.openTheory.addEventListener("click", () => showTab("theory"));

for (const chip of document.querySelectorAll(".chip[data-angle]")) {
  chip.addEventListener("click", () => setAngle(Number(chip.dataset.angle)));
}

window.addEventListener("keydown", (event) => {
  if (event.target.matches("input, textarea, button")) return;
  if (event.code === "Space") {
    event.preventDefault();
    if (sim.isRunning && !sim.landed) doPause();
    else doLaunch();
  }
  if (event.key === "r" || event.key === "R") doReset();
});

let acc = 0;
let last = performance.now();
let wasRunning = false;

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (sim.isRunning && !sim.isPaused) {
    acc += dt;
    while (acc >= sim.dt && sim.isRunning && !sim.isPaused) {
      step(sim);
      acc -= sim.dt;
    }
    wasRunning = true;
  }
  if (wasRunning && sim.landed) {
    wasRunning = false;
    acc = 0;
    onLanded();
  }
  updateLive();
  els.pause.textContent = sim.isPaused ? "Resume" : "Pause";
  drawSim();
  requestAnimationFrame(tick);
}

const resize = new ResizeObserver((entries) => {
  for (const entry of entries) {
    if (entry.target === els.canvas) drawSim();
    else drawCharts();
  }
});
resize.observe(els.canvas);
resize.observe(els.graphRange);
resize.observe(els.graphHeight);
resize.observe(els.graphTheoryRange);
resize.observe(els.graphTheoryHeight);

syncReadouts();
updateLive();
renderTrials();
requestAnimationFrame(tick);
