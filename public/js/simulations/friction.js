/**
 * Simulation 2.7 — Kinetic and static friction. One block on a horizontal surface.
 */

import {
  DT,
  FAPP_TRIALS,
  MASS_TRIALS,
  SCENARIOS,
  SURFACES,
  cameraObjectCount,
  createState,
  evaluateChallenge,
  formatSigned,
  formatUnsigned,
  generateChallenge,
  historySeries,
  liveState,
  predictedFk,
  predictedFsMax,
  reset as resetState,
  sampleHistory,
  setFapp,
  setGravity,
  setInitial,
  setMass,
  setMu,
  snapshot,
  stepTo,
  surfaceById,
  teacherReport,
} from "/lib/friction.js";
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
  applied: "#7a3e08",
  friction: "#5c4634",
  net: "#1b2430",
  velocity: "#0f6c8a",
  accel: "#c9a227",
};

const CAMERA_EXTRA = { pad: 3.5, minSpan: 22, followSpan: 22, followEdge: 3.5 };

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
  const { lo, hi, span } = cameraRange(positions, {
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
  for (let wx = Math.floor(lo); wx <= hi; wx += 1) {
    if (wx % 2 !== 0) continue;
    ctx.fillStyle = scene.groundDark;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(xOf(wx, view), groundY, scale, 12);
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = scene.axis;
  ctx.fillStyle = scene.ink;
  ctx.lineWidth = 1.4;
  ctx.font = "12px IBM Plex Mono, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let wx = Math.ceil(lo); wx <= Math.floor(hi); wx += 1) {
    const x = xOf(wx, view);
    const major = wx % 5 === 0 || wx === 0;
    ctx.beginPath();
    ctx.moveTo(x, groundY - (major ? 14 : 7));
    ctx.lineTo(x, groundY + (major ? 10 : 5));
    ctx.stroke();
    if (major) ctx.fillText(`${wx} m`, x, groundY + 14);
  }
  ctx.save();
  ctx.strokeStyle = scene.ink;
  ctx.globalAlpha = 0.35;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(originX, 28);
  ctx.lineTo(originX, groundY);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = scene.groundDark;
  ctx.fillRect(originX - 5, groundY - 36, 10, 36);
  ctx.fillStyle = scene.ink;
  ctx.font = "700 11px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("x = 0", originX, groundY - 40);
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
  ctx.font = "700 13px Figtree, sans-serif";
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
  if (Math.abs(value) < 0.05) return;
  const len = 18 + Math.min(48, Math.abs(value) * 6);
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
  drawSignedForce(ctx, ox, oy, live.Fapp, "x", COLOR.applied, "Fapp", "N");
  drawSignedForce(ctx, ox, oy, live.friction, "x", COLOR.friction, "f", "N");
  if (showNet && Math.abs(live.Fnet) > 0.001) {
    const len = scaleForceMagnitude(Math.abs(live.Fnet));
    const x2 = ox + Math.sign(live.Fnet) * len;
    const y2 = oy + 18;
    ctx.save();
    ctx.setLineDash([6, 4]);
    drawArrow(ctx, ox, y2, x2, y2, COLOR.net, 2.4);
    ctx.restore();
    ctx.fillStyle = COLOR.net;
    ctx.font = "700 11px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`Fnet ${formatSigned(live.Fnet, "N")}`, (ox + x2) / 2, y2 + 6);
  }
}

function renderScene(canvas, state, scene, cameraOpts = {}) {
  const live = liveState(state);
  const view = worldView(canvas, [live.x], cameraOpts);
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

  const boxX = xOf(live.x, view);
  ctx.strokeStyle = scene.axis;
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(boxX - 58, boxY - 72, 116, 148, 12);
  else ctx.rect(boxX - 58, boxY - 72, 116, 148);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = scene.ink;
  ctx.globalAlpha = 0.7;
  ctx.font = "700 11px Figtree, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("SYSTEM", boxX - 50, boxY - 78);
  ctx.globalAlpha = 1;
  drawBox(ctx, boxX, boxY, 74, 48, `${formatUnsigned(state.mass, "kg")}`);
  drawForces(ctx, boxX, boxY, live, { showVectors: state.showVectors, showNet: state.showNet });
  if (state.showVelocity) drawSideArrow(ctx, boxX, boxY, live.vx, COLOR.velocity, "v", "m/s", -38);
  if (state.showAccel) drawSideArrow(ctx, boxX, boxY, live.ax, COLOR.accel, "a", "m/s²", 36);

  const surface = SURFACES.find((s) => s.id === live.surface);
  ctx.fillStyle = scene.ink;
  ctx.font = "600 12px Figtree, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(surface?.label || "Custom pair", 16, groundY - 8);
  ctx.textAlign = "right";
  ctx.fillText(live.sliding ? "SLIDING" : live.atLimit ? "AT LIMIT" : "STATIONARY", cssW - 16, groundY - 8);

  ctx.font = "700 15px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const scen = SCENARIOS.find((s) => s.id === state.scenario);
  ctx.fillText(`${scen?.label || "Friction"} · t = ${state.time.toFixed(2)} s`, cssW / 2, 8);
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

export function mountFriction(root) {
  const canvas = root.querySelector("#axis-canvas");
  const fbd = root.querySelector("#fbd-canvas");
  const graphXt = root.querySelector("#graph-xt");
  const graphVt = root.querySelector("#graph-vt");
  const graphAt = root.querySelector("#graph-at");
  const graphRange = root.querySelector("#graph-range");
  const graphHeight = root.querySelector("#graph-height");
  const trialBody = root.querySelector("#trial-body");
  const massInput = root.querySelector("#mass-input");
  const fappInput = root.querySelector("#fapp-input");
  const vInput = root.querySelector("#v-input");
  const gInput = root.querySelector("#g-input");
  const musInput = root.querySelector("#mus-input");
  const mukInput = root.querySelector("#muk-input");
  const tInput = root.querySelector("#duration-input");
  const investValues = root.querySelector("#invest-values");
  const investHelp = root.querySelector("#invest-help");
  const muNote = root.querySelector("#mu-note");

  let state = createState({ scenario: "rest" });
  let running = false;
  let raf = 0;
  let lastStamp = 0;
  let carry = 0;
  let playback = 1;
  let autoRecord = false;
  let camera;
  let lastCameraRange = { lo: -11, hi: 11 };
  let activeTab = "lab";
  let invest = "off";
  let identityOn = () => false;

  const trials = createTrialBook({
    columns: 11,
    renderRow: (t) => `<tr>
      <td>${t.id}</td>
      <td>${formatUnsigned(t.mass, "kg")}</td>
      <td>${formatUnsigned(t.N, "N")}</td>
      <td>${t.muS.toFixed(2)}</td>
      <td>${t.muK.toFixed(2)}</td>
      <td>${formatSigned(t.Fapp, "N")}</td>
      <td>${formatUnsigned(t.fsMax, "N")}</td>
      <td>${formatSigned(t.friction, "N")}</td>
      <td>${t.kind}</td>
      <td>${formatSigned(t.Fnet, "N")}</td>
      <td>${formatSigned(t.ax, "m/s²")}</td>
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
      N: snap.N,
      muS: snap.muS,
      muK: snap.muK,
      Fapp: snap.Fapp,
      FappAbs: Math.abs(snap.Fapp),
      fsMax: snap.fsMax,
      fk: snap.fk,
      friction: snap.friction,
      frictionMag: snap.frictionMag,
      kind: snap.kind,
      Fnet: snap.Fnet,
      ax: snap.ax,
      sliding: snap.sliding,
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
    if (invest === "fsmax") return { xKey: "N", yKey: "fsMax", xLabel: "N (N)", yLabel: "fs,max (N)", color: COLOR.friction };
    if (invest === "fk") return { xKey: "N", yKey: "fk", xLabel: "N (N)", yLabel: "fk (N)", color: COLOR.applied };
    if (invest === "anet") return { xKey: "Fnet", yKey: "ax", xLabel: "F_net (N)", yLabel: "a (m/s²)", color: COLOR.accel };
    return { xKey: "FappAbs", yKey: "frictionMag", xLabel: "|F_app| (N)", yLabel: "|f| (N)", color: COLOR.friction };
  }

  function drawLiveGraphs() {
    if (activeTab !== "lab") return;
    const history = historySeries(state);
    renderTimeSeries(graphXt, history, {
      series: [{ yKey: "x", color: COLOR.gravity, label: "x" }],
      xLabel: "Time (s)",
      yLabel: "Position (m)",
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
      ? invest === "fsmax"
        ? { yOfX: (N) => predictedFsMax({ mass: N / Math.max(state.g, 1e-9), g: state.g, muS: state.muS }), label: "fs,max = μs N" }
        : invest === "fk"
          ? { yOfX: (N) => predictedFk({ mass: N / Math.max(state.g, 1e-9), g: state.g, muK: state.muK }), label: "fk = μk N" }
          : invest === "anet"
            ? { yOfX: (F) => F / Math.max(state.mass, 1e-9), label: "a = F_net / m" }
            : {
              yOfX: (F) => (F <= liveState(state).fsMax + 1e-9 ? F : liveState(state).fk),
              label: "static f = |F_app|, then fk",
            }
      : null;
    renderXYScatter(graphRange, list, {
      ...left,
      fitYName: left.yKey,
      fitXName: left.xKey,
      identity,
    });
    renderXYScatter(graphHeight, list, {
      xKey: "N",
      yKey: "fsMax",
      xLabel: "N (N)",
      yLabel: "fs,max (N)",
      color: COLOR.normal,
      fitYName: "fs,max",
      fitXName: "N",
      identity: identityOn()
        ? { yOfX: (N) => state.muS * N, label: "slope = μs" }
        : null,
    });
    const titles = root.querySelectorAll("#graph-panel h2");
    if (titles[0]) titles[0].textContent = `Your Trials · ${left.yLabel.split(" ")[0]} vs. ${left.xKey === "FappAbs" ? "F_app" : left.xKey}`;
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
      feedback.textContent = "Predict using fs ≤ μs N and fk = μk N. The solution stays hidden until you check.";
      return;
    }
    if (challengeState.revealed) {
      feedback.textContent = challengeState.spec.solutionHint;
      return;
    }
    feedback.textContent = challengeState.last.ok
      ? "That matches the friction model."
      : "Not yet. Static friction is the actual balance, not always μs N.";
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
      fapp: FAPP_TRIALS.map((v) => `<button type="button" class="chip" data-invest-f="${v}">F_app = ${v} N</button>`).join(""),
      fsmax: MASS_TRIALS.map((v) => `<button type="button" class="chip" data-invest-m="${v}">m = ${v} kg</button>`).join(""),
      fk: MASS_TRIALS.map((v) => `<button type="button" class="chip" data-invest-m="${v}">m = ${v} kg</button>`).join(""),
      anet: [20, 25, 30, 40, 50].map((v) => `<button type="button" class="chip" data-invest-f="${v}">F_app = ${v} N</button>`).join(""),
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
        fapp: "Hold m = 5 kg, μs = 0.50, μk = 0.30. Change F_app across the static and sliding regions.",
        fsmax: "Hold both coefficients fixed. Change mass so N changes. Record fs,max vs N.",
        fk: "Hold μk fixed and change mass. Record fk vs N while sliding.",
        anet: "Stay in the sliding region. Record a vs F_net; the slope should be 1/m.",
      };
      investHelp.textContent = tips[invest] || "";
    }
  }

  function applyInvestPreset() {
    if (invest === "fapp") applyScenario({ scenario: "rest", mass: 5, Fapp: 0, vx0: 0, muS: 0.5, muK: 0.3 });
    if (invest === "fsmax") applyScenario({ scenario: "rest", mass: 5, Fapp: 0, vx0: 0, muS: 0.5, muK: 0.3 });
    if (invest === "fk") applyScenario({ scenario: "sliding", mass: 5, Fapp: 30, vx0: 0, muS: 0.5, muK: 0.3 });
    if (invest === "anet") applyScenario({ scenario: "sliding", mass: 5, Fapp: 30, vx0: 0, muS: 0.5, muK: 0.3 });
  }

  function syncInputs() {
    const busy = running;
    if (document.activeElement !== massInput) massInput.value = String(state.mass);
    if (document.activeElement !== fappInput) fappInput.value = String(state.Fapp);
    if (document.activeElement !== vInput) vInput.value = String(state.vx0);
    if (document.activeElement !== gInput) gInput.value = String(state.g);
    if (document.activeElement !== musInput) musInput.value = String(state.muS);
    if (document.activeElement !== mukInput) mukInput.value = String(state.muK);
    if (document.activeElement !== tInput) tInput.value = String(state.duration);
    [massInput, fappInput, vInput, gInput, musInput, mukInput, tInput].forEach((el) => {
      el.disabled = busy;
    });
    root.querySelector("#btn-play").disabled = busy;
    root.querySelector("#btn-pause").disabled = !busy;
    root.querySelector("#btn-step").disabled = busy;
    root.querySelectorAll("[data-scenario]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.scenario === state.scenario);
      btn.disabled = busy;
    });
    const live = liveState(state);
    root.querySelectorAll("[data-surface]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.surface === live.surface);
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
    if (muNote) muNote.hidden = !live.unusual;
    syncInvest();
  }

  function syncReadouts() {
    const snap = snapshot(state);
    const eq = root.querySelector("#eq-status");
    eq.classList.toggle("is-eq", !snap.sliding && Math.abs(snap.Fnet) < 0.05);
    eq.classList.toggle("is-uneq", snap.sliding || Math.abs(snap.Fnet) >= 0.05);
    root.querySelector("#eq-label").textContent = snap.motion.toUpperCase();
    root.querySelector("#eq-net").textContent = `Actual f = ${formatSigned(snap.friction, "N")}`;
    root.querySelector("#eq-detail").textContent = snap.sliding
      ? "Kinetic friction is μk N opposite the velocity."
      : snap.atLimit
        ? "At the static limit. A larger |F_app| starts sliding."
        : "fs,max is a limit, not the force at every rest.";
    root.querySelector("#read-f").textContent = formatSigned(snap.friction, "N");
    root.querySelector("#read-fsmax").textContent = formatUnsigned(snap.fsMax, "N");
    root.querySelector("#read-fk").textContent = formatUnsigned(snap.fk, "N");
    root.querySelector("#read-kind").textContent = snap.kind;
    root.querySelector("#read-fapp").textContent = formatSigned(snap.Fapp, "N");
    root.querySelector("#read-n").textContent = formatUnsigned(snap.N, "N");
    root.querySelector("#read-w").textContent = formatUnsigned(snap.W, "N");
    root.querySelector("#read-fnet").textContent = formatSigned(snap.Fnet, "N");
    root.querySelector("#read-m").textContent = formatUnsigned(snap.mass, "kg");
    root.querySelector("#read-a").textContent = formatSigned(snap.ax, "m/s²");
    root.querySelector("#read-v").textContent = formatSigned(snap.vx, "m/s");
    root.querySelector("#read-dx").textContent = formatSigned(snap.dx, "m");
    teacher.refresh();
  }

  function paint() {
    const scene = sceneForGravity({ planetId: state.planetId || "earth", backgroundsOn: true });
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
    state = resetState(state);
    stepTo(state, t);
    paint();
  }

  const download = bindDownload(root, {
    filename: "ap-physics-1-2-7-trials",
    getTable() {
      return {
        title: "AP Physics 1 — 2.7 Kinetic and Static Friction",
        columns: ["Trial", "m (kg)", "N (N)", "μs", "μk", "F_app (N)", "fs,max (N)", "f (N)", "Kind", "F_net (N)", "a (m/s²)"],
        rows: trials.list().map((t) => [t.id, t.mass, t.N, t.muS, t.muK, t.Fapp, t.fsMax, t.friction, t.kind, t.Fnet, t.ax]),
      };
    },
  });
  const unbindFullscreen = bindFullscreen(root.querySelector("#btn-fullscreen"));
  const unbindTutorial = bindTutorial(root, { simulationId: "2-7" });

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
    stepTo(state, Math.min(state.time + 0.1, state.duration));
    if (state.time >= state.duration - 1e-12 && autoRecord) trials.record(trialSnapshot());
    paint();
  });
  root.querySelector("#btn-check-27").addEventListener("click", () => {
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
  root.querySelectorAll("[data-surface]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const surface = surfaceById(btn.dataset.surface);
      setMu(state, surface.muS, surface.muK);
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
    const fBtn = event.target.closest("[data-invest-f]");
    const mBtn = event.target.closest("[data-invest-m]");
    if (fBtn) {
      setFapp(state, Number(fBtn.dataset.investF));
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
  fappInput.addEventListener("change", () => {
    setFapp(state, readNumber(fappInput, state.Fapp));
    state.scenario = "custom";
    paint();
  });
  vInput.addEventListener("change", () => {
    setInitial(state, { vx0: readNumber(vInput, state.vx0) });
    state = resetState(state);
    paint();
  });
  gInput.addEventListener("change", () => {
    setGravity(state, readNumber(gInput, state.g));
    state.scenario = "custom";
    paint();
  });
  musInput.addEventListener("change", () => {
    setMu(state, readNumber(musInput, state.muS), state.muK);
    state.scenario = "custom";
    paint();
  });
  mukInput.addEventListener("change", () => {
    setMu(state, state.muS, readNumber(mukInput, state.muK));
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
