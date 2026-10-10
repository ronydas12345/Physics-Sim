/**
 * Simulation 2.8 — Spring forces. Horizontal ideal spring, hold vs release, Fs = −kx.
 */

import {
  DT,
  K_TRIALS,
  MASS_TRIALS,
  SCENARIOS,
  X_TRIALS,
  cameraObjectCount,
  createState,
  evaluateChallenge,
  formatSigned,
  formatUnsigned,
  generateChallenge,
  historySeries,
  liveState,
  predictedFs,
  predictedUs,
  reset as resetState,
  sampleHistory,
  setFapp,
  setHeld,
  setInitial,
  setK,
  setMass,
  setX,
  snapshot,
  stepTo,
  teacherReport,
} from "/lib/springs.js";
import { scaleForceMagnitude } from "/lib/forces.js";
import { renderTimeSeries, renderXYScatter, timeAtPointer } from "../graphs.js";
import { sceneForGravity } from "/lib/planets.js";
import {
  bindCameraMode,
  bindChallenge,
  bindDownload,
  bindFullscreen,
  bindIdentityToggle,
  bindLabTabs,
  bindResetButtons,
  bindTeacher,
  cameraModeControls,
  createTrialBook,
} from "../platform/lab-kit.js";
import { bindTutorial } from "../platform/tutorial.js";
import { themeCanvas } from "../platform/theme.js";
import { CAMERA, cameraRange, cameraScale } from "/lib/camera.js";

const COLOR = {
  gravity: "#c45c26",
  normal: "#1c6b73",
  spring: "#7a3e08",
  applied: "#2c6e49",
  hold: "#5c4634",
  net: "#1b2430",
  velocity: "#0f6c8a",
  accel: "#c9a227",
  coil: "#8a5a32",
  marker: "#2c6e49",
};

const CAMERA_EXTRA = { pad: 0.28, minSpan: 2.2, followSpan: 2.2, followEdge: 0.28 };
const WALL_X = -0.8;
const VIS_MIN = 0.14;
const VIS_MAX = 1.7;

function drawArrow(ctx, x1, y1, x2, y2, color, width = 3) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 4) return;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 10 * Math.cos(ang - 0.4), y2 - 10 * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - 10 * Math.cos(ang + 0.4), y2 - 10 * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
}

function sizeCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = Math.max(1, canvas.clientWidth);
  const cssH = Math.max(1, canvas.clientHeight);
  const w = Math.round(cssW * dpr);
  const h = Math.round(cssH * dpr);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  return { cssW, cssH, dpr };
}

function worldView(canvas, positions, cameraOpts = {}) {
  const { cssW, cssH, dpr } = sizeCanvas(canvas);
  const pad = { l: 48, r: 28, t: 36, b: 34 };
  const plotW = Math.max(1, cssW - pad.l - pad.r);
  const xs = [...positions, WALL_X, 0];
  const { lo, hi, span } = cameraRange(xs, {
    mode: CAMERA.ORIGIN,
    ...CAMERA_EXTRA,
    plotPx: plotW,
    ...cameraOpts,
  });
  const scale = cameraScale(span, plotW);
  const originX = pad.l + (0 - lo) * scale;
  const groundY = cssH - pad.b;
  return { cssW, cssH, dpr, pad, lo, hi, scale, originX, groundY, boxY: groundY - 28 };
}

function xOf(world, view) {
  return view.originX + world * view.scale;
}

function renderGround(ctx, view, scene) {
  const { cssW, cssH, lo, hi, scale, originX, groundY } = view;
  ctx.fillStyle = scene.soil;
  ctx.fillRect(0, groundY, cssW, cssH - groundY);
  ctx.fillStyle = scene.ground;
  ctx.fillRect(0, groundY, cssW, 12);
  for (let wx = Math.floor(lo * 10) / 10; wx <= hi; wx += 0.1) {
    const major = Math.abs(wx * 10 - Math.round(wx * 10)) < 1e-6 && Math.round(wx * 10) % 5 === 0;
    if (!major) continue;
    ctx.fillStyle = scene.groundDark;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(xOf(wx, view), groundY, Math.max(2, scale * 0.05), 12);
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = scene.axis;
  ctx.fillStyle = scene.ink;
  ctx.lineWidth = 1.4;
  ctx.font = "12px IBM Plex Mono, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let wx = Math.ceil(lo * 2) / 2; wx <= Math.floor(hi * 2) / 2; wx += 0.5) {
    const x = xOf(wx, view);
    const major = Math.abs(wx) < 1e-9 || Math.abs(wx % 1) < 1e-9;
    ctx.beginPath();
    ctx.moveTo(x, groundY - (major ? 14 : 7));
    ctx.lineTo(x, groundY + (major ? 10 : 5));
    ctx.stroke();
    if (major) ctx.fillText(`${wx.toFixed(1)} m`, x, groundY + 14);
  }
  ctx.save();
  ctx.strokeStyle = COLOR.marker;
  ctx.globalAlpha = 0.85;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(originX, 22);
  ctx.lineTo(originX, groundY);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = COLOR.marker;
  ctx.beginPath();
  ctx.moveTo(originX, groundY - 6);
  ctx.lineTo(originX - 7, groundY + 8);
  ctx.lineTo(originX + 7, groundY + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = scene.ink;
  ctx.font = "700 11px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("x = 0", originX, 20);
}

function drawBox(ctx, x, y, w, h, label) {
  ctx.fillStyle = "#c45c26";
  ctx.strokeStyle = "#1b2430";
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, 8);
  else ctx.rect(x - w / 2, y - h / 2, w, h);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff7ef";
  ctx.font = "700 12px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y);
}

function labelForce(ctx, x2, y2, originX, originY, text, color) {
  ctx.fillStyle = color;
  ctx.font = "700 11px Figtree, sans-serif";
  ctx.textAlign = x2 >= originX ? "left" : "right";
  ctx.textBaseline = y2 <= originY ? "bottom" : "top";
  ctx.fillText(text, x2 + (x2 >= originX ? 6 : -6), y2);
}

function drawSignedForce(ctx, ox, oy, value, axis, color, label, unit) {
  if (Math.abs(value) < 0.001) return;
  const len = scaleForceMagnitude(Math.abs(value));
  const x2 = axis === "x" ? ox + Math.sign(value) * len : ox;
  const y2 = axis === "y" ? oy - Math.sign(value) * len : oy;
  drawArrow(ctx, ox, oy, x2, y2, color, 3);
  labelForce(ctx, x2, y2, ox, oy, `${label} ${formatUnsigned(Math.abs(value), unit)}`, color);
}

function drawSideArrow(ctx, x, y, value, color, label, unit, lift) {
  if (Math.abs(value) < 0.02) return;
  const len = 18 + Math.min(48, Math.abs(value) * 20);
  const x2 = x + Math.sign(value) * len;
  drawArrow(ctx, x, y + lift, x2, y + lift, color, 3);
  ctx.fillStyle = color;
  ctx.font = "700 11px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = lift < 0 ? "bottom" : "top";
  ctx.fillText(`${label} ${formatSigned(value, unit)}`, (x + x2) / 2, y + lift + (lift < 0 ? -4 : 6));
}

function drawForces(ctx, ox, oy, live, { showVectors, showNet }) {
  if (!showVectors) return;
  drawSignedForce(ctx, ox, oy, -live.W, "y", COLOR.gravity, "W", "N");
  drawSignedForce(ctx, ox, oy, live.N, "y", COLOR.normal, "N", "N");
  drawSignedForce(ctx, ox, oy, live.Fs, "x", COLOR.spring, "Fs", "N");
  drawSignedForce(ctx, ox, oy, live.Fapp, "x", COLOR.applied, "Fapp", "N");
  if (live.held) drawSignedForce(ctx, ox, oy, live.holding, "x", COLOR.hold, "hold", "N");
  const net = live.held ? live.Ffree : live.Fnet;
  if (showNet && Math.abs(net) > 0.001 && !live.held) {
    const len = scaleForceMagnitude(Math.abs(net));
    const x2 = ox + Math.sign(net) * len;
    const y2 = oy + 18;
    ctx.save();
    ctx.setLineDash([6, 4]);
    drawArrow(ctx, ox, y2, x2, y2, COLOR.net, 2.4);
    ctx.restore();
    ctx.fillStyle = COLOR.net;
    ctx.font = "700 11px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`Fnet ${formatSigned(net, "N")}`, (ox + x2) / 2, y2 + 6);
  }
}

function drawSpring(ctx, x1, y, x2, coils = 10) {
  const span = x2 - x1;
  ctx.strokeStyle = COLOR.coil;
  ctx.lineWidth = 2.4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y);
  const amp = 11;
  const n = Math.max(6, coils);
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const x = x1 + span * t;
    const yOff = i === 0 || i === n ? 0 : i % 2 === 0 ? amp : -amp;
    ctx.lineTo(x, y + yOff);
  }
  ctx.stroke();
}

function renderScene(canvas, state, scene, cameraOpts = {}) {
  const live = liveState(state);
  const visX = Math.max(WALL_X + VIS_MIN, Math.min(WALL_X + VIS_MAX, live.x));
  const clamped = Math.abs(visX - live.x) > 1e-6;
  const view = worldView(canvas, [visX, live.xEq], cameraOpts);
  const { cssW, cssH, dpr, groundY, boxY } = view;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, scene.skyTop);
  sky.addColorStop(1, scene.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, cssW, cssH);
  renderGround(ctx, view, scene);

  const wallPx = xOf(WALL_X, view);
  ctx.fillStyle = "#4a5560";
  ctx.fillRect(wallPx - 18, 36, 18, groundY - 36);
  ctx.fillStyle = scene.ink;
  ctx.globalAlpha = 0.18;
  for (let y = 44; y < groundY - 8; y += 10) {
    ctx.fillRect(wallPx - 16, y, 14, 3);
  }
  ctx.globalAlpha = 1;

  const boxX = xOf(visX, view);
  drawSpring(ctx, wallPx, boxY, boxX - 38, live.x >= 0 ? 12 : 8);
  drawBox(ctx, boxX, boxY, 74, 48, formatUnsigned(state.mass, "kg"));
  drawForces(ctx, boxX, boxY, live, { showVectors: state.showVectors, showNet: state.showNet });
  if (state.showVelocity) drawSideArrow(ctx, boxX, boxY, live.vx, COLOR.velocity, "v", "m/s", -38);
  if (state.showAccel) drawSideArrow(ctx, boxX, boxY, live.held ? live.aFree : live.ax, COLOR.accel, "a", "m/s²", 36);

  ctx.fillStyle = scene.ink;
  ctx.font = "600 12px Figtree, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(`k = ${formatUnsigned(state.k, "N/m")}  ·  x = ${formatSigned(live.x, "m")}`, 16, groundY - 8);
  ctx.textAlign = "right";
  ctx.fillText(live.held ? "HELD" : live.motion.toUpperCase(), cssW - 16, groundY - 8);
  if (clamped) {
    ctx.textAlign = "center";
    ctx.fillStyle = COLOR.spring;
    ctx.fillText("Display length clamped — numbers still use the real x", cssW / 2, groundY - 8);
  }

  ctx.fillStyle = scene.ink;
  ctx.font = "700 15px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const scen = SCENARIOS.find((s) => s.id === state.scenario);
  ctx.fillText(`${scen?.label || "Spring"} · t = ${state.time.toFixed(2)} s`, cssW / 2, 8);
  return view;
}

function renderFbd(canvas, state) {
  const { cssW, cssH, dpr } = sizeCanvas(canvas);
  const ctx = canvas.getContext("2d");
  const theme = themeCanvas();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = theme.fill;
  ctx.fillRect(0, 0, cssW, cssH);
  const cx = cssW / 2;
  const cy = cssH / 2 + 6;
  ctx.fillStyle = theme.ink;
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "700 12px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("FBD", cx, cy - 14);
  const live = liveState(state);
  drawForces(ctx, cx, cy, live, { showVectors: true, showNet: state.showNet });
}

export function mountSprings(root) {
  const canvas = root.querySelector("#axis-canvas");
  const fbd = root.querySelector("#fbd-canvas");
  const graphXt = root.querySelector("#graph-xt");
  const graphVt = root.querySelector("#graph-vt");
  const graphAt = root.querySelector("#graph-at");
  const graphRange = root.querySelector("#graph-range");
  const graphHeight = root.querySelector("#graph-height");
  const trialBody = root.querySelector("#trial-body");
  const massInput = root.querySelector("#mass-input");
  const kInput = root.querySelector("#k-input");
  const xInput = root.querySelector("#x-input");
  const vInput = root.querySelector("#v-input");
  const fappInput = root.querySelector("#fapp-input");
  const tInput = root.querySelector("#duration-input");
  const investValues = root.querySelector("#invest-values");
  const investHelp = root.querySelector("#invest-help");

  let state = createState({ scenario: "stretch" });
  let running = false;
  let raf = 0;
  let lastStamp = 0;
  let carry = 0;
  let playback = 1;
  let autoRecord = false;
  let camera;
  let lastCameraRange = { lo: -1.1, hi: 1.1 };
  let activeTab = "lab";
  let invest = "off";
  let identityOn = () => false;

  const trials = createTrialBook({
    columns: 11,
    renderRow: (t) => `<tr>
      <td>${t.id}</td>
      <td>${formatUnsigned(t.mass, "kg")}</td>
      <td>${formatUnsigned(t.k, "N/m")}</td>
      <td>${formatSigned(t.x, "m")}</td>
      <td>${formatSigned(t.Fs, "N")}</td>
      <td>${formatSigned(t.Fapp, "N")}</td>
      <td>${formatSigned(t.Ffree, "N")}</td>
      <td>${formatSigned(t.aFree, "m/s²")}</td>
      <td>${formatSigned(t.vx, "m/s")}</td>
      <td>${formatUnsigned(t.Us, "J")}</td>
      <td>${t.held ? "held" : "motion"}</td>
    </tr>`,
    onChange() {
      trials.render(trialBody);
      drawCharts();
      download.sync();
    },
  });

  function trialSnapshot() {
    const snap = snapshot(state);
    return {
      mass: snap.mass,
      k: snap.k,
      x: snap.x,
      xAbs: Math.abs(snap.x),
      Fs: snap.Fs,
      FsMag: snap.FsMag,
      Fapp: snap.Fapp,
      Ffree: snap.Ffree,
      aFree: snap.aFree,
      vx: snap.vx,
      Us: snap.Us,
      held: snap.held,
    };
  }

  function bindCamera() {
    const host = root.querySelector("#camera-host");
    host.innerHTML = cameraModeControls(cameraObjectCount());
    camera = bindCameraMode(root, {
      objectCount: cameraObjectCount(),
      rangeForLock: () => lastCameraRange,
      onChange: () => paint(),
    });
  }

  function graphKeys() {
    if (invest === "mag") return { xKey: "xAbs", yKey: "FsMag", xLabel: "|x| (m)", yLabel: "|Fs| (N)", color: COLOR.spring };
    if (invest === "k") return { xKey: "k", yKey: "Fs", xLabel: "k (N/m)", yLabel: "Fs (N)", color: COLOR.coil };
    if (invest === "mass") return { xKey: "mass", yKey: "aFree", xLabel: "m (kg)", yLabel: "a (m/s²)", color: COLOR.accel };
    if (invest === "energy") return { xKey: "x", yKey: "Us", xLabel: "x (m)", yLabel: "Us (J)", color: COLOR.marker };
    return { xKey: "x", yKey: "Fs", xLabel: "x (m)", yLabel: "Fs (N)", color: COLOR.spring };
  }

  function drawLiveGraphs() {
    if (activeTab !== "lab") return;
    const history = historySeries(state);
    renderTimeSeries(graphXt, history, {
      series: [{ yKey: "x", color: COLOR.gravity, label: "x" }],
      xLabel: "Time (s)",
      yLabel: "Displacement (m)",
      duration: state.duration,
      now: state.time,
    });
    renderTimeSeries(graphVt, history, {
      series: [{ yKey: "vx", color: COLOR.velocity, label: "v" }],
      xLabel: "Time (s)",
      yLabel: "Velocity (m/s)",
      duration: state.duration,
      now: state.time,
    });
    renderTimeSeries(graphAt, history, {
      series: [{ yKey: "ax", color: COLOR.accel, label: "a" }],
      xLabel: "Time (s)",
      yLabel: "Acceleration (m/s²)",
      duration: state.duration,
      now: state.time,
    });
  }

  function drawCharts() {
    if (activeTab !== "lab") return;
    const list = trials.list();
    const left = graphKeys();
    const identity = identityOn()
      ? invest === "mag"
        ? { yOfX: (x) => state.k * x, label: "|Fs| = k|x|" }
        : invest === "k"
          ? { yOfX: (k) => predictedFs({ k, x: state.x }), label: "Fs = −k x" }
          : invest === "mass"
            ? { yOfX: (m) => predictedFs({ k: state.k, x: state.x }) / Math.max(m, 1e-9), label: "a = Fs / m" }
            : invest === "energy"
              ? { yOfX: (x) => predictedUs({ k: state.k, x }), label: "Us = ½kx²" }
              : { yOfX: (x) => predictedFs({ k: state.k, x }), label: "Fs = −kx" }
      : null;
    renderXYScatter(graphRange, list, {
      ...left,
      fitYName: left.yKey,
      fitXName: left.xKey,
      identity,
    });
    renderXYScatter(graphHeight, list, {
      xKey: "xAbs",
      yKey: "FsMag",
      xLabel: "|x| (m)",
      yLabel: "|Fs| (N)",
      color: COLOR.coil,
      fitYName: "|Fs|",
      fitXName: "|x|",
      identity: identityOn() ? { yOfX: (x) => state.k * x, label: "slope = k" } : null,
    });
    const titles = root.querySelectorAll("#graph-panel h2");
    if (titles[0]) titles[0].textContent = `Your Trials · ${left.yLabel.split(" ")[0]} vs. ${left.xKey === "xAbs" ? "|x|" : left.xKey}`;
    drawLiveGraphs();
  }

  const teacher = bindTeacher(root, (on, line) => {
    if (!on) {
      line.hidden = true;
      return;
    }
    line.hidden = false;
    line.textContent = teacherReport(state);
  });
  identityOn = bindIdentityToggle(root, () => drawCharts());

  function describeCard(host, spec) {
    host.querySelector("#challenge-q").textContent = spec.prompt;
    host.querySelector("#challenge-givens").innerHTML = spec.givens
      .map((row) => `<div><dt>${row.label}</dt><dd>${row.value}</dd></div>`)
      .join("");
    host.querySelector("#challenge-goal").textContent = `Target: ${spec.goalLabel}`;
    host.querySelector("#challenge-unknown").textContent = `Find ${spec.unknownLabel}.`;
  }

  function describeFeedback(host, challengeState) {
    const reveal = host.querySelector("#btn-reveal");
    const feedback = host.querySelector("#challenge-feedback");
    reveal.disabled = !challengeState.attempted;
    if (!challengeState.last) {
      feedback.textContent = "Predict using Fs = −kx. The solution stays hidden until you check.";
      return;
    }
    if (challengeState.revealed) {
      feedback.textContent = challengeState.spec.solutionHint;
      return;
    }
    feedback.textContent = challengeState.last.ok
      ? "That matches Hooke’s law."
      : "Not yet. Use Fs = −kx, then F_net = Fs + F_app.";
  }

  function applyScenario(params) {
    stopLoop();
    state = createState({
      ...params,
      showVectors: params.showVectors ?? state.showVectors,
      showVelocity: params.showVelocity ?? state.showVelocity,
      showAccel: params.showAccel ?? state.showAccel,
      showNet: params.showNet ?? state.showNet,
      duration: params.duration ?? state.duration,
    });
    paint();
  }

  const challenge = bindChallenge(root, {
    generate: generateChallenge,
    apply(spec) {
      if (!spec) return;
      applyScenario(spec.params);
    },
    describeCard,
    describeFeedback,
  });

  function readNumber(input, fallback) {
    const n = Number(input.value);
    return Number.isFinite(n) ? n : fallback;
  }

  function syncInvest() {
    root.querySelectorAll("[data-invest]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.invest === invest);
    });
    if (!investValues) return;
    const chips = {
      fx: X_TRIALS.map((v) => `<button type="button" class="chip" data-invest-x="${v}">x = ${v} m</button>`).join(""),
      mag: X_TRIALS.map((v) => `<button type="button" class="chip" data-invest-x="${v}">x = ${v} m</button>`).join(""),
      k: K_TRIALS.map((v) => `<button type="button" class="chip" data-invest-k="${v}">k = ${v} N/m</button>`).join(""),
      mass: MASS_TRIALS.map((v) => `<button type="button" class="chip" data-invest-m="${v}">m = ${v} kg</button>`).join(""),
      energy: X_TRIALS.map((v) => `<button type="button" class="chip" data-invest-x="${v}">x = ${v} m</button>`).join(""),
    };
    if (invest === "off") {
      investValues.hidden = true;
      if (investHelp) investHelp.textContent = "Vary one quantity while holding the others constant, then record trials.";
      return;
    }
    investValues.hidden = false;
    investValues.innerHTML = chips[invest] || "";
    if (investHelp) {
      const tips = {
        fx: "Hold k = 20 N/m. Record signed Fs at several signed x values. The slope should be −k.",
        mag: "Same trials, plotted as magnitudes. The slope should be +k.",
        k: "Hold x = +0.10 m. Change k and record Fs.",
        mass: "Hold k and x. Change mass. Fs stays the same; a does not.",
        energy: "Hold k = 20 N/m. Record Us vs x. The curve is ½kx².",
      };
      investHelp.textContent = tips[invest] || "";
    }
  }

  function applyInvestPreset() {
    if (invest === "fx" || invest === "mag" || invest === "energy") {
      applyScenario({ scenario: "stretch", mass: 1, k: 20, x0: 0.1, Fapp: 0, held: true });
    }
    if (invest === "k") applyScenario({ scenario: "stretch", mass: 1, k: 20, x0: 0.1, Fapp: 0, held: true });
    if (invest === "mass") applyScenario({ scenario: "stretch", mass: 1, k: 20, x0: 0.1, Fapp: 0, held: true });
  }

  function syncInputs() {
    const busy = running;
    if (document.activeElement !== massInput) massInput.value = String(state.mass);
    if (document.activeElement !== kInput) kInput.value = String(state.k);
    if (document.activeElement !== xInput) xInput.value = String(Number(state.x.toFixed(3)));
    if (document.activeElement !== vInput) vInput.value = String(state.vx0);
    if (document.activeElement !== fappInput) fappInput.value = String(state.Fapp);
    if (document.activeElement !== tInput) tInput.value = String(state.duration);
    [massInput, kInput, xInput, vInput, fappInput, tInput].forEach((el) => {
      el.disabled = busy;
    });
    root.querySelector("#btn-play").disabled = busy;
    root.querySelector("#btn-pause").disabled = !busy;
    root.querySelector("#btn-step").disabled = busy;
    root.querySelectorAll("[data-scenario]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.scenario === state.scenario);
      btn.disabled = busy;
    });
    root.querySelectorAll("[data-held]").forEach((btn) => {
      btn.classList.toggle("active", (btn.dataset.held === "true") === state.held);
      btn.disabled = busy;
    });
    root.querySelectorAll("[data-speed]").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.speed) === playback);
    });
    const vecToggle = root.querySelector("#toggle-vectors");
    const netToggle = root.querySelector("#toggle-net");
    const velToggle = root.querySelector("#toggle-velocity");
    const accToggle = root.querySelector("#toggle-accel");
    if (document.activeElement !== vecToggle) vecToggle.checked = state.showVectors;
    if (document.activeElement !== netToggle) netToggle.checked = state.showNet;
    if (document.activeElement !== velToggle) velToggle.checked = state.showVelocity;
    if (document.activeElement !== accToggle) accToggle.checked = state.showAccel;
    syncInvest();
  }

  function syncReadouts() {
    const snap = snapshot(state);
    const eq = root.querySelector("#eq-status");
    eq.classList.toggle("is-eq", Math.abs(snap.Ffree) < 0.05);
    eq.classList.toggle("is-uneq", Math.abs(snap.Ffree) >= 0.05);
    root.querySelector("#eq-label").textContent = snap.motion.toUpperCase();
    root.querySelector("#eq-net").textContent = `Fs = ${formatSigned(snap.Fs, "N")}`;
    root.querySelector("#eq-detail").textContent = snap.held
      ? Math.abs(snap.holding) < 0.05
        ? "No holding force is needed at this combined equilibrium."
        : `A holding force of ${formatSigned(snap.holding, "N")} keeps this x from changing.`
      : Math.abs(snap.x) < 0.01 && Math.abs(snap.vx) >= 0.05
        ? "Fs is ~0 here, but velocity is not. The block does not stop at x = 0."
        : "Fs = −kx. Acceleration follows F_net, not velocity.";
    root.querySelector("#read-fs").textContent = formatSigned(snap.Fs, "N");
    root.querySelector("#read-fsmag").textContent = formatUnsigned(snap.FsMag, "N");
    root.querySelector("#read-hold").textContent = snap.held ? formatSigned(snap.holding, "N") : "—";
    root.querySelector("#read-xeq").textContent = formatSigned(snap.xEq, "m");
    root.querySelector("#read-x").textContent = formatSigned(snap.x, "m");
    root.querySelector("#read-k").textContent = formatUnsigned(snap.k, "N/m");
    root.querySelector("#read-fapp").textContent = formatSigned(snap.Fapp, "N");
    root.querySelector("#read-fnet").textContent = formatSigned(snap.Ffree, "N");
    root.querySelector("#read-m").textContent = formatUnsigned(snap.mass, "kg");
    root.querySelector("#read-a").textContent = formatSigned(snap.aFree, "m/s²");
    root.querySelector("#read-v").textContent = formatSigned(snap.vx, "m/s");
    root.querySelector("#read-t").textContent = formatUnsigned(snap.T, "s");
    root.querySelector("#read-us").textContent = formatUnsigned(snap.Us, "J");
    root.querySelector("#read-e").textContent = formatUnsigned(snap.E, "J");
    teacher.refresh();
  }

  function paint() {
    const scene = sceneForGravity({ planetId: "earth", backgroundsOn: true });
    const view = renderScene(canvas, state, scene, camera?.options(CAMERA_EXTRA) || { mode: CAMERA.ORIGIN, ...CAMERA_EXTRA });
    lastCameraRange = { lo: view.lo, hi: view.hi };
    renderFbd(fbd, state);
    syncInputs();
    syncReadouts();
    drawCharts();
  }

  function stopLoop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastStamp = 0;
    carry = 0;
    syncInputs();
  }

  function finishRun() {
    stopLoop();
    if (autoRecord) trials.record(trialSnapshot());
    paint();
  }

  function tick(stamp) {
    if (!running) return;
    if (!lastStamp) lastStamp = stamp;
    const realDt = Math.min(0.05, (stamp - lastStamp) / 1000);
    lastStamp = stamp;
    carry += realDt * playback;
    while (carry + 1e-12 >= DT) {
      const next = Math.min(state.time + DT, state.duration);
      stepTo(state, next);
      carry -= DT;
      if (state.time >= state.duration - 1e-12) {
        finishRun();
        return;
      }
    }
    paint();
    raf = requestAnimationFrame(tick);
  }

  function play() {
    if (running) return;
    if (state.time >= state.duration - 1e-9) state = resetState(state);
    if (state.held) setHeld(state, false);
    running = true;
    lastStamp = 0;
    carry = 0;
    raf = requestAnimationFrame(tick);
    syncInputs();
  }

  function pause() {
    stopLoop();
    paint();
  }

  function onReset() {
    stopLoop();
    state = resetState(state);
    paint();
  }

  function seek(t) {
    if (running) return;
    const held = state.held;
    state = resetState(state);
    if (!held) {
      setHeld(state, false);
      stepTo(state, t);
    }
    paint();
  }

  const download = bindDownload(root, {
    filename: "ap-physics-1-2-8-trials",
    getTable() {
      return {
        title: "AP Physics 1 — 2.8 Spring Forces",
        columns: ["Trial", "m (kg)", "k (N/m)", "x (m)", "Fs (N)", "F_app (N)", "F_net (N)", "a (m/s²)", "v (m/s)", "Us (J)", "Mode"],
        rows: trials.list().map((t) => [t.id, t.mass, t.k, t.x, t.Fs, t.Fapp, t.Ffree, t.aFree, t.vx, t.Us, t.held ? "held" : "motion"]),
      };
    },
  });
  const unbindFullscreen = bindFullscreen(root.querySelector("#btn-fullscreen"));
  const unbindTutorial = bindTutorial(root, { simulationId: "2-8" });

  const onKey = (event) => {
    if (event.target.matches("input, textarea, select")) return;
    if (event.code === "Space") {
      event.preventDefault();
      if (running) pause();
      else play();
    }
  };

  bindLabTabs(root, (name) => {
    activeTab = name;
    requestAnimationFrame(() => {
      paint();
      drawCharts();
    });
  });
  bindCamera();
  bindResetButtons(root, onReset);
  root.querySelector("#btn-play").addEventListener("click", play);
  root.querySelector("#btn-pause").addEventListener("click", pause);
  root.querySelector("#btn-step").addEventListener("click", () => {
    if (running) return;
    if (state.held) setHeld(state, false);
    stepTo(state, Math.min(state.time + 0.1, state.duration));
    if (state.time >= state.duration - 1e-12 && autoRecord) trials.record(trialSnapshot());
    paint();
  });
  root.querySelector("#btn-check-28").addEventListener("click", () => {
    if (challenge.state.active && challenge.state.spec) {
      challenge.markAttempt(evaluateChallenge(snapshot(state), challenge.state.spec));
    }
    if (autoRecord) trials.record(trialSnapshot());
  });
  root.querySelectorAll("[data-scenario]").forEach((btn) => {
    btn.addEventListener("click", () => {
      invest = "off";
      applyScenario({ scenario: btn.dataset.scenario });
    });
  });
  root.querySelectorAll("[data-held]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setHeld(state, btn.dataset.held === "true");
      state.scenario = "custom";
      paint();
    });
  });
  root.querySelectorAll("[data-invest]").forEach((btn) => {
    btn.addEventListener("click", () => {
      invest = btn.dataset.invest;
      if (invest !== "off") applyInvestPreset();
      else paint();
    });
  });
  investValues?.addEventListener("click", (event) => {
    const xBtn = event.target.closest("[data-invest-x]");
    const kBtn = event.target.closest("[data-invest-k]");
    const mBtn = event.target.closest("[data-invest-m]");
    if (xBtn) {
      setX(state, Number(xBtn.dataset.investX));
      state.scenario = "custom";
      paint();
    }
    if (kBtn) {
      setK(state, Number(kBtn.dataset.investK));
      state.scenario = "custom";
      paint();
    }
    if (mBtn) {
      setMass(state, Number(mBtn.dataset.investM));
      state.scenario = "custom";
      paint();
    }
  });
  root.querySelectorAll("[data-speed]").forEach((btn) => {
    btn.addEventListener("click", () => {
      playback = Number(btn.dataset.speed);
      syncInputs();
    });
  });
  massInput.addEventListener("change", () => {
    setMass(state, readNumber(massInput, state.mass));
    state.scenario = "custom";
    paint();
  });
  kInput.addEventListener("change", () => {
    setK(state, readNumber(kInput, state.k));
    state.scenario = "custom";
    paint();
  });
  xInput.addEventListener("change", () => {
    setX(state, readNumber(xInput, state.x));
    state.scenario = "custom";
    paint();
  });
  vInput.addEventListener("change", () => {
    setInitial(state, { vx0: readNumber(vInput, state.vx0) });
    if (state.time < 1e-12 && !state.held) state.vx = state.vx0;
    state.scenario = "custom";
    paint();
  });
  fappInput.addEventListener("change", () => {
    setFapp(state, readNumber(fappInput, state.Fapp));
    state.scenario = "custom";
    paint();
  });
  tInput.addEventListener("change", () => {
    state.duration = readNumber(tInput, state.duration);
    state = resetState(state);
    paint();
  });
  root.querySelector("#toggle-vectors").addEventListener("change", (event) => {
    state.showVectors = event.target.checked;
    paint();
  });
  root.querySelector("#toggle-net").addEventListener("change", (event) => {
    state.showNet = event.target.checked;
    paint();
  });
  root.querySelector("#toggle-velocity").addEventListener("change", (event) => {
    state.showVelocity = event.target.checked;
    paint();
  });
  root.querySelector("#toggle-accel").addEventListener("change", (event) => {
    state.showAccel = event.target.checked;
    paint();
  });
  root.querySelector("#auto-record").addEventListener("change", (event) => {
    autoRecord = event.target.checked;
  });
  root.querySelector("#btn-record").addEventListener("click", () => trials.record(trialSnapshot()));
  root.querySelector("#btn-clear").addEventListener("click", () => trials.clear());

  [graphXt, graphVt, graphAt].forEach((el) => {
    if (!el) return;
    el.addEventListener("click", (event) => {
      if (running) return;
      seek(timeAtPointer(event.currentTarget, event, state.duration));
    });
  });

  window.addEventListener("keydown", onKey);
  const onResize = () => paint();
  window.addEventListener("resize", onResize);
  paint();

  return () => {
    stopLoop();
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onResize);
    unbindFullscreen();
    unbindTutorial();
  };
}
