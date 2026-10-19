/**
 * Simulation 3.2 — Work by variable forces. Signed area under Fx vs x, W_net = ΔK.
 */

import {
  N_TRIALS,
  SCENARIOS,
  XF_TRIALS,
  areaRegions,
  cameraObjectCount,
  createState,
  editorParams,
  evaluateChallenge,
  forceAt,
  formatSigned,
  formatUnsigned,
  generateChallenge,
  historySeries,
  liveState,
  motionDiagramSamples,
  reset as resetState,
  sampleForceCurve,
  setInterval,
  setMass,
  setMethod,
  setN,
  setSpec,
  setSpeed,
  snapshot,
  specFromEditor,
  stepTo,
  teacherReport,
} from "/lib/variableforce.js";
import { DT, scaleForceMagnitude } from "/lib/forces.js";
import { renderXYScatter, timeAtPointer } from "../graphs.js";
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
  applied: "#7a3e08",
  net: "#1b2430",
  velocity: "#0f6c8a",
  accel: "#c9a227",
  work: "#c45c26",
  energy: "#1c6b73",
  pos: "rgba(28, 107, 115, 0.28)",
  neg: "rgba(196, 92, 38, 0.28)",
  posStroke: "#1c6b73",
  negStroke: "#c45c26",
};

const CAMERA_EXTRA = { pad: 1.8, minSpan: 10, followSpan: 12, followEdge: 1.6 };

function drawArrow(ctx, x1, y1, x2, y2, color, width = 3) {
  const ang = Math.atan2(y2 - y1, y2 === y1 && x2 === x1 ? 0 : x2 - x1);
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
  const pad = { l: 48, r: 36, t: 40, b: 34 };
  const plotW = Math.max(1, cssW - pad.l - pad.r);
  const xs = [...positions, 0];
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
  const { cssW, cssH, originX, groundY, lo, hi } = view;
  ctx.fillStyle = scene.ground;
  ctx.fillRect(0, groundY, cssW, cssH - groundY);
  ctx.fillStyle = scene.groundDark;
  ctx.fillRect(0, groundY, cssW, 6);
  ctx.strokeStyle = scene.ink;
  ctx.lineWidth = 1.4;
  ctx.font = "12px IBM Plex Mono, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = scene.ink;
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
}

function drawBox(ctx, x, y) {
  ctx.fillStyle = "#c45c26";
  ctx.strokeStyle = "#7a3e08";
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x - 22, y - 22, 44, 44, 8);
  else ctx.rect(x - 22, y - 22, 44, 44);
  ctx.fill();
  ctx.stroke();
}

function renderScene(canvas, state, scene, cameraOpts = {}) {
  const live = liveState(state);
  const view = worldView(canvas, [state.xi, live.x, state.xf], cameraOpts);
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

  const startX = xOf(state.xi, view);
  const endX = xOf(state.xf, view);
  ctx.strokeStyle = scene.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, groundY - 18);
  ctx.lineTo(endX, groundY - 18);
  ctx.stroke();
  drawArrow(ctx, startX, groundY - 18, endX, groundY - 18, "#2c6e49", 2.2);
  ctx.fillStyle = scene.ink;
  ctx.font = "700 11px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("xᵢ", startX, groundY - 26);
  ctx.fillText("x_f", endX, groundY - 26);

  if (state.showTrail) {
    ctx.fillStyle = scene.ink;
    motionDiagramSamples(state).forEach((sample) => {
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.arc(xOf(sample.x, view), boxY, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  const boxX = xOf(live.x, view);
  drawBox(ctx, boxX, boxY);
  if (state.showVectors && Math.abs(live.F) > 0.001) {
    const len = scaleForceMagnitude(Math.abs(live.F));
    drawArrow(ctx, boxX, boxY, boxX + Math.sign(live.F) * len, boxY, COLOR.applied, 3);
    ctx.fillStyle = COLOR.applied;
    ctx.font = "700 11px Figtree, sans-serif";
    ctx.textAlign = live.F >= 0 ? "left" : "right";
    ctx.fillText(`Fₓ ${formatSigned(live.F, "N")}`, boxX + Math.sign(live.F) * (len + 6), boxY - 8);
  }
  if (state.showVelocity && Math.abs(live.vx) > 0.05) {
    const len = 18 + Math.min(48, Math.abs(live.vx) * 6);
    drawArrow(ctx, boxX, boxY - 38, boxX + Math.sign(live.vx) * len, boxY - 38, COLOR.velocity, 3);
    ctx.fillStyle = COLOR.velocity;
    ctx.font = "700 11px Figtree, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`v ${formatUnsigned(live.v, "m/s")}`, boxX, boxY - 48);
  }
  if (state.showAccel && Math.abs(live.a) > 0.05) {
    const len = 18 + Math.min(40, Math.abs(live.a) * 5);
    drawArrow(ctx, boxX, boxY + 28, boxX + Math.sign(live.a) * len, boxY + 28, COLOR.accel, 3);
    ctx.fillStyle = COLOR.accel;
    ctx.font = "700 11px Figtree, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`a ${formatSigned(live.a, "m/s²")}`, boxX, boxY + 34);
  }

  ctx.fillStyle = scene.ink;
  ctx.font = "700 15px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const scen = SCENARIOS.find((s) => s.id === state.scenario);
  ctx.fillText(`${scen?.label || "Variable force"} · t = ${state.time.toFixed(2)} s`, cssW / 2, 8);
  return view;
}

function renderFxGraph(canvas, state) {
  if (!canvas) return;
  const { cssW, cssH, dpr } = sizeCanvas(canvas);
  const ctx = canvas.getContext("2d");
  const theme = themeCanvas();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = theme.fill;
  ctx.fillRect(0, 0, cssW, cssH);
  const pad = { l: 52, r: 18, t: 18, b: 36 };
  const left = pad.l;
  const right = cssW - pad.r;
  const top = pad.t;
  const bottom = cssH - pad.b;
  const xMin = Math.min(0, state.xi, state.xf) - 0.4;
  const xMax = Math.max(4, state.xi, state.xf, state.x) + 0.6;
  const curve = sampleForceCurve(state.spec, xMin, xMax, 200);
  const Fs = curve.map((p) => p.F);
  let yMin = Math.min(0, ...Fs);
  let yMax = Math.max(0, ...Fs);
  if (yMin === yMax) {
    yMin -= 4;
    yMax += 4;
  } else {
    const extra = 0.12 * (yMax - yMin);
    yMin -= extra;
    yMax += extra;
  }
  if (yMin >= -0.2) yMin = Math.min(yMin, -1);
  if (yMax <= 0.2) yMax = Math.max(yMax, 1);
  const xMap = (x) => left + ((x - xMin) / (xMax - xMin)) * (right - left);
  const yMap = (F) => bottom - ((F - yMin) / (yMax - yMin)) * (bottom - top);

  ctx.strokeStyle = theme.line;
  ctx.fillStyle = theme.muted;
  ctx.font = "11px IBM Plex Mono, monospace";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const F = yMin + (i / 4) * (yMax - yMin);
    const y = yMap(F);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(F.toFixed(0), left - 8, y);
  }
  const xStart = Math.ceil(xMin);
  const xEnd = Math.floor(xMax);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let x = xStart; x <= xEnd; x += 1) {
    const px = xMap(x);
    ctx.beginPath();
    ctx.moveTo(px, top);
    ctx.lineTo(px, bottom);
    ctx.stroke();
    ctx.fillText(`${x}`, px, bottom + 6);
  }

  ctx.strokeStyle = theme.ink;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(left, yMap(0));
  ctx.lineTo(right, yMap(0));
  ctx.stroke();
  ctx.globalAlpha = 1;

  const lo = Math.min(state.xi, state.xf);
  const hi = Math.max(state.xi, state.xf);
  if (state.showAreas && hi > lo) {
    const regions = areaRegions(state.spec, state.xi, state.xf);
    for (const region of regions) {
      const a = Math.min(region.x0, region.x1);
      const b = Math.max(region.x0, region.x1);
      const samples = sampleForceCurve(state.spec, a, b, 40);
      ctx.beginPath();
      ctx.moveTo(xMap(a), yMap(0));
      samples.forEach((p) => ctx.lineTo(xMap(p.x), yMap(p.F)));
      ctx.lineTo(xMap(b), yMap(0));
      ctx.closePath();
      ctx.fillStyle = region.W >= 0 ? COLOR.pos : COLOR.neg;
      ctx.fill();
      ctx.setLineDash(region.W >= 0 ? [] : [4, 3]);
      ctx.strokeStyle = region.W >= 0 ? COLOR.posStroke : COLOR.negStroke;
      ctx.stroke();
      ctx.setLineDash([]);
      const mid = 0.5 * (a + b);
      ctx.fillStyle = theme.ink;
      ctx.font = "700 11px IBM Plex Mono, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(`${region.W >= 0 ? "+" : ""}${region.W.toFixed(1)} J`, xMap(mid), yMap(0) - 6);
    }
  }

  if (state.showApprox && hi > lo) {
    const n = Math.max(1, state.n);
    const dx = (state.xf - state.xi) / n;
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < n; i += 1) {
      const x0 = state.xi + i * dx;
      const x1 = x0 + dx;
      const sampleX = state.method === "left" ? x0 : state.method === "trapezoid" ? x0 : x0 + 0.5 * dx;
      const F = forceAt(state.spec, sampleX);
      ctx.fillStyle = F >= 0 ? "rgba(28, 107, 115, 0.18)" : "rgba(196, 92, 38, 0.18)";
      ctx.strokeStyle = theme.ink;
      const y0 = yMap(0);
      const y1 = yMap(F);
      ctx.fillRect(xMap(Math.min(x0, x1)), Math.min(y0, y1), Math.abs(xMap(x1) - xMap(x0)), Math.abs(y1 - y0));
      ctx.strokeRect(xMap(Math.min(x0, x1)), Math.min(y0, y1), Math.abs(xMap(x1) - xMap(x0)), Math.abs(y1 - y0));
    }
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = COLOR.applied;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  curve.forEach((p, i) => {
    const px = xMap(p.x);
    const py = yMap(p.F);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = "#2c6e49";
  ctx.beginPath();
  ctx.moveTo(xMap(state.xi), top);
  ctx.lineTo(xMap(state.xi), bottom);
  ctx.stroke();
  ctx.strokeStyle = "#7a3e08";
  ctx.beginPath();
  ctx.moveTo(xMap(state.xf), top);
  ctx.lineTo(xMap(state.xf), bottom);
  ctx.stroke();
  ctx.setLineDash([]);

  const live = liveState(state);
  ctx.fillStyle = "#2c6e49";
  ctx.beginPath();
  ctx.arc(xMap(live.x), yMap(live.F), 5.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = theme.ink;
  ctx.font = "700 12px Figtree, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Fₓ (N)", left, 2);
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("x (m)", right, cssH - 2);
}

export function mountVariableForce(root) {
  const canvas = root.querySelector("#axis-canvas");
  const fxCanvas = root.querySelector("#graph-fx-canvas");
  const graphWd = root.querySelector("#graph-xt");
  const graphKd = root.querySelector("#graph-vt");
  const graphRange = root.querySelector("#graph-range");
  const graphHeight = root.querySelector("#graph-height");
  const trialBody = root.querySelector("#trial-body");
  const massInput = root.querySelector("#mass-input");
  const vInput = root.querySelector("#v-input");
  const xiInput = root.querySelector("#xi-input");
  const xfInput = root.querySelector("#xf-input");
  const investValues = root.querySelector("#invest-values");
  const investHelp = root.querySelector("#invest-help");

  let state = createState({ scenario: "constant" });
  let running = false;
  let raf = 0;
  let lastStamp = 0;
  let carry = 0;
  let playback = 1;
  let autoRecord = false;
  let activeTab = "lab";
  let invest = "off";
  let identityOn = () => false;
  let lastCameraRange = { lo: -1, hi: 12 };
  const cameraHost = root.querySelector("#camera-host");
  if (cameraHost && !cameraHost.querySelector("[data-camera]")) cameraHost.innerHTML = cameraModeControls(cameraObjectCount());
  const camera = bindCameraMode(root, {
    objectCount: cameraObjectCount(),
    rangeForLock: () => lastCameraRange,
    onChange: () => paint(),
  });

  const trials = createTrialBook({
    columns: 12,
    renderRow(t) {
      return `<tr>
        <td>${t.id}</td>
        <td>${t.type}</td>
        <td>${t.xi}</td>
        <td>${t.xf}</td>
        <td>${t.n}</td>
        <td>${t.Wpos.toFixed(2)}</td>
        <td>${t.Wneg.toFixed(2)}</td>
        <td>${t.Wnet.toFixed(2)}</td>
        <td>${t.Wapprox.toFixed(2)}</td>
        <td>${t.Ki.toFixed(2)}</td>
        <td>${t.K.toFixed(2)}</td>
        <td>${t.reached ? "yes" : "no"}</td>
      </tr>`;
    },
    onChange() {
      trials.render(trialBody);
      download.sync();
      drawCharts();
    },
  });

  function trialSnapshot() {
    const snap = snapshot(state);
    return {
      type: snap.type,
      xi: snap.xi,
      xf: snap.xf,
      n: snap.n,
      Wpos: snap.Wpos,
      Wneg: snap.Wneg,
      Wnet: snap.Wnet,
      Wapprox: snap.Wapprox,
      Wexact: snap.Wexact,
      Wfull: snap.Wfull,
      Ki: snap.Ki,
      K: snap.K,
      Kf: snap.Kf,
      dK: snap.dK,
      vf: snap.vf,
      v: snap.v,
      reached: snap.reached,
      dx: snap.xf - snap.xi,
    };
  }

  function graphKeys() {
    if (invest === "areas") return { xKey: "Wpos", yKey: "Wnet", xLabel: "W₊ (J)", yLabel: "W_net (J)", color: COLOR.work };
    if (invest === "approx") return { xKey: "n", yKey: "Wapprox", xLabel: "n rectangles", yLabel: "W approx (J)", color: COLOR.work };
    if (invest === "wdk") return { xKey: "Wnet", yKey: "dK", xLabel: "W_net (J)", yLabel: "ΔK (J)", color: COLOR.energy };
    return { xKey: "xf", yKey: "Wfull", xLabel: "x_f (m)", yLabel: "W interval (J)", color: COLOR.work };
  }

  function identityFor() {
    if (!identityOn()) return null;
    if (invest === "approx") return { yOfX: () => snapshot(state).Wfull, label: "exact W" };
    if (invest === "wdk") return { yOfX: (w) => w, label: "ΔK = W_net" };
    return null;
  }

  function drawLiveGraphs() {
    if (activeTab !== "lab") return;
    const history = historySeries(state);
    renderXYScatter(graphWd, history, {
      xKey: "x",
      yKey: "Wnet",
      xLabel: "x (m)",
      yLabel: "W_net (J)",
      color: COLOR.work,
      showFit: false,
      xMin: Math.min(state.xi, state.xf),
      xMax: Math.max(state.xi, state.xf, state.xi + 1),
    });
    renderXYScatter(graphKd, history, {
      xKey: "x",
      yKey: "K",
      xLabel: "x (m)",
      yLabel: "K (J)",
      color: COLOR.energy,
      showFit: false,
      xMin: Math.min(state.xi, state.xf),
      xMax: Math.max(state.xi, state.xf, state.xi + 1),
    });
  }

  function drawCharts() {
    if (activeTab !== "lab") return;
    const list = trials.list();
    const left = graphKeys();
    renderXYScatter(graphRange, list, { ...left, fitYName: left.yKey, fitXName: left.xKey, identity: identityFor() });
    renderXYScatter(graphHeight, list, {
      xKey: "Wnet",
      yKey: "dK",
      xLabel: "W_net (J)",
      yLabel: "ΔK (J)",
      color: COLOR.energy,
      fitYName: "ΔK",
      fitXName: "W_net",
      identity: identityOn() ? { yOfX: (w) => w, label: "ΔK = W_net" } : null,
    });
    const titles = root.querySelectorAll("#graph-panel h2");
    if (titles[0]) titles[0].textContent = `Your Trials · ${left.yLabel.split(" ")[0]} vs. ${left.xKey}`;
    drawLiveGraphs();
    renderFxGraph(fxCanvas, state);
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
      feedback.textContent = "Use signed area under Fₓ vs x. The solution stays hidden until you check.";
      return;
    }
    if (challengeState.revealed) {
      feedback.textContent = challengeState.spec.solutionHint;
      return;
    }
    feedback.textContent = challengeState.last.ok
      ? "That matches the signed area and W_net = ΔK."
      : "Not yet. Work is signed area, not the final force times the whole displacement.";
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

  function applyScenario(params) {
    stopLoop();
    state = createState({
      ...params,
      showVectors: params.showVectors ?? state.showVectors,
      showVelocity: params.showVelocity ?? state.showVelocity,
      showAccel: params.showAccel ?? state.showAccel,
      showTrail: params.showTrail ?? state.showTrail,
      showAreas: params.showAreas ?? state.showAreas,
      showApprox: params.showApprox ?? state.showApprox,
    });
    paint();
  }

  function currentEditorFields() {
    return {
      F: readNumber(root.querySelector("#f-input"), 6),
      F1seg: readNumber(root.querySelector("#f1-input"), 6),
      F2seg: readNumber(root.querySelector("#f2-input"), -3),
      split: readNumber(root.querySelector("#split-input"), 2),
      xi: state.xi,
      xf: state.xf,
      x0: readNumber(root.querySelector("#p0x-input"), 0),
      F0: readNumber(root.querySelector("#p0f-input"), 0),
      x1: readNumber(root.querySelector("#p1x-input"), 2),
      F1: readNumber(root.querySelector("#p1f-input"), 6),
      x2: readNumber(root.querySelector("#p2x-input"), 4),
      F2pt: readNumber(root.querySelector("#p2f-input"), 2),
      c: readNumber(root.querySelector("#c-input"), 2),
      a: readNumber(root.querySelector("#a-input"), 0.75),
      k: readNumber(root.querySelector("#k-input"), 4),
      Famp: readNumber(root.querySelector("#f0-input"), 6),
      q: readNumber(root.querySelector("#q-input"), Math.PI / 4),
    };
  }

  function applyEditor() {
    setSpec(state, specFromEditor(state.spec.type, currentEditorFields()));
    state.scenario = "custom";
    paint();
  }

  function syncInvest() {
    root.querySelectorAll("[data-invest]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.invest === invest);
    });
    if (!investValues) return;
    const chips = {
      xinterval: XF_TRIALS.map((v) => `<button type="button" class="chip" data-invest-xf="${v}">x_f = ${v} m</button>`).join(""),
      areas: `<p class="track-help">Record +/− graphs. W_net = W₊ + W₋.</p>`,
      approx: N_TRIALS.map((v) => `<button type="button" class="chip" data-invest-n="${v}">n = ${v}</button>`).join(""),
      wdk: `<p class="track-help">Record finished runs. ΔK should match W_net along the path.</p>`,
    };
    if (invest === "off") {
      investValues.hidden = true;
      if (investHelp) investHelp.textContent = "Change one setting, then record trials. Work is signed area, not peak force times Δx.";
      return;
    }
    investValues.hidden = false;
    investValues.innerHTML = chips[invest] || "";
    if (investHelp) {
      const tips = {
        xinterval: "Keep the same force graph. Different intervals have different signed areas.",
        areas: "W₊ and W₋ add. Cancellation can make W_net = 0 with nonzero pieces.",
        approx: "Left rectangles on F = 2x underestimate 16 J. Finer n moves closer.",
        wdk: "Net work along the actual path equals ΔK.",
      };
      investHelp.textContent = tips[invest] || "";
    }
  }

  function syncFnPanels() {
    const type = state.spec.type;
    root.querySelectorAll("[data-fn-panel]").forEach((el) => {
      el.hidden = el.dataset.fnPanel !== type;
    });
    root.querySelectorAll("[data-fn]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.fn === type);
      btn.disabled = running;
    });
    const params = editorParams(state.spec);
    const setIfIdle = (id, value) => {
      const el = root.querySelector(id);
      if (!el || document.activeElement === el) return;
      el.value = String(value);
    };
    setIfIdle("#f-input", params.F ?? 6);
    setIfIdle("#f1-input", params.F ?? 6);
    setIfIdle("#f2-input", params.F2 ?? -3);
    setIfIdle("#split-input", params.split ?? 2);
    if (params.points) {
      setIfIdle("#p0x-input", params.points[0]?.x ?? 0);
      setIfIdle("#p0f-input", params.points[0]?.F ?? 0);
      setIfIdle("#p1x-input", params.points[1]?.x ?? 2);
      setIfIdle("#p1f-input", params.points[1]?.F ?? 6);
      setIfIdle("#p2x-input", params.points[2]?.x ?? 4);
      setIfIdle("#p2f-input", params.points[2]?.F ?? 2);
    }
    setIfIdle("#c-input", params.c ?? 2);
    setIfIdle("#a-input", params.a ?? 0.75);
    setIfIdle("#k-input", params.k ?? 4);
    setIfIdle("#f0-input", params.F0 ?? 6);
    setIfIdle("#q-input", params.q ?? Math.PI / 4);
  }

  function syncInputs() {
    const busy = running;
    if (document.activeElement !== massInput) massInput.value = String(state.mass);
    if (document.activeElement !== vInput) vInput.value = String(state.v0);
    if (document.activeElement !== xiInput) xiInput.value = String(state.xi);
    if (document.activeElement !== xfInput) xfInput.value = String(state.xf);
    [massInput, vInput, xiInput, xfInput].forEach((el) => {
      el.disabled = busy;
    });
    root.querySelector("#force-params").querySelectorAll("input").forEach((el) => {
      el.disabled = busy;
    });
    root.querySelector("#btn-play").disabled = busy;
    root.querySelector("#btn-pause").disabled = !busy;
    root.querySelector("#btn-step").disabled = busy;
    root.querySelectorAll("[data-scenario]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.scenario === state.scenario);
      btn.disabled = busy;
    });
    root.querySelectorAll("[data-speed]").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.speed) === playback);
    });
    root.querySelectorAll("[data-n]").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.n) === state.n);
      btn.disabled = busy;
    });
    root.querySelectorAll("[data-method]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.method === state.method);
      btn.disabled = busy;
    });
    const vecToggle = root.querySelector("#toggle-vectors");
    const velToggle = root.querySelector("#toggle-velocity");
    const accToggle = root.querySelector("#toggle-accel");
    const trailToggle = root.querySelector("#toggle-trail");
    const areaToggle = root.querySelector("#toggle-areas");
    const approxToggle = root.querySelector("#toggle-approx");
    if (document.activeElement !== vecToggle) vecToggle.checked = state.showVectors;
    if (document.activeElement !== velToggle) velToggle.checked = state.showVelocity;
    if (document.activeElement !== accToggle) accToggle.checked = state.showAccel;
    if (document.activeElement !== trailToggle) trailToggle.checked = state.showTrail;
    if (document.activeElement !== areaToggle) areaToggle.checked = state.showAreas;
    if (document.activeElement !== approxToggle) approxToggle.checked = state.showApprox;
    syncFnPanels();
    syncInvest();
  }

  function statusText(snap) {
    if (Math.abs(snap.xf - snap.xi) < 1e-9) return "The selected interval has zero displacement.";
    if (snap.stoppedEarly) {
      return `The object stops before reaching the requested position, at ${formatUnsigned(snap.x, "m")}.`;
    }
    if (!snap.done) return "Run the experiment to calculate the final state.";
    if (snap.agrees) return "Work and kinetic-energy change agree within numerical tolerance.";
    return "Work is estimated numerically." ;
  }

  function syncReadouts() {
    const snap = snapshot(state);
    const eq = root.querySelector("#eq-status");
    eq.classList.toggle("is-eq", snap.agrees && snap.done && !snap.stoppedEarly);
    eq.classList.toggle("is-uneq", snap.stoppedEarly || (snap.done && !snap.agrees));
    root.querySelector("#eq-label").textContent = snap.motion.toUpperCase();
    root.querySelector("#eq-net").textContent = `W_net = ${formatSigned(snap.Wnet, "J")}`;
    root.querySelector("#eq-detail").textContent = statusText(snap);
    root.querySelector("#read-wpos").textContent = formatSigned(snap.Wpos, "J");
    root.querySelector("#read-wneg").textContent = formatSigned(snap.Wneg, "J");
    root.querySelector("#read-wnet").textContent = formatSigned(snap.Wnet, "J");
    root.querySelector("#read-wfull").textContent = formatSigned(snap.Wfull, "J");
    root.querySelector("#read-wapprox").textContent = formatSigned(snap.Wapprox, "J");
    root.querySelector("#read-method").textContent = `${snap.method} n = ${snap.n}`;
    root.querySelector("#read-ki").textContent = formatUnsigned(snap.Ki, "J");
    root.querySelector("#read-k").textContent = formatUnsigned(snap.K, "J");
    root.querySelector("#read-kf").textContent = snap.done ? formatUnsigned(snap.K, "J") : "—";
    root.querySelector("#read-dk").textContent = formatSigned(snap.dK, "J");
    root.querySelector("#read-m").textContent = formatUnsigned(snap.mass, "kg");
    root.querySelector("#read-v").textContent = formatUnsigned(snap.v, "m/s");
    root.querySelector("#read-vf").textContent = snap.done ? formatUnsigned(snap.v, "m/s") : "—";
    root.querySelector("#read-x").textContent = `${formatUnsigned(snap.x, "m")} / ${formatUnsigned(snap.xf, "m")}`;
    root.querySelector("#read-fx").textContent = formatSigned(snap.F, "N");
    root.querySelector("#read-a").textContent = formatSigned(snap.a, "m/s²");
    root.querySelector("#equation-display").textContent = snap.formula;
    const regions = areaRegions(state.spec, state.xi, state.xf);
    const parts = regions.map((r, i) => `Region ${String.fromCharCode(65 + i)}: ${formatSigned(r.W, "J")}`).join(" · ");
    const caption = root.querySelector("#area-breakdown");
    caption.textContent = parts
      ? `${parts} · Net interval work: ${formatSigned(snap.Wfull, "J")}. Approx (${snap.method}, n=${snap.n}): ${formatSigned(snap.Wapprox, "J")}.`
      : "Shaded area is only the selected interval.";
    teacher.refresh();
  }

  function paint() {
    const scene = sceneForGravity({ planetId: "earth", backgroundsOn: true });
    const view = renderScene(canvas, state, scene, camera?.options(CAMERA_EXTRA) || { mode: CAMERA.ORIGIN });
    lastCameraRange = { lo: view.lo, hi: view.hi };
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
      if (state.done || state.time >= state.duration - 1e-12) {
        finishRun();
        return;
      }
    }
    paint();
    raf = requestAnimationFrame(tick);
  }

  function play() {
    if (running) return;
    if (state.done || state.time >= state.duration - 1e-9) state = resetState(state);
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

  const download = bindDownload(root, {
    filename: "ap-physics-1-3-2-trials",
    getTable() {
      return {
        title: "AP Physics 1 — 3.2 Work by Variable Forces",
        columns: ["Trial", "type", "xᵢ (m)", "x_f (m)", "n", "W₊ (J)", "W₋ (J)", "W_net (J)", "W approx (J)", "Kᵢ (J)", "K (J)", "reached"],
        rows: trials.list().map((t) => [t.id, t.type, t.xi, t.xf, t.n, t.Wpos, t.Wneg, t.Wnet, t.Wapprox, t.Ki, t.K, t.reached ? "yes" : "no"]),
      };
    },
  });
  const unbindFullscreen = bindFullscreen(root.querySelector("#btn-fullscreen"));
  const unbindTutorial = bindTutorial(root, { simulationId: "3-2" });

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
    requestAnimationFrame(() => paint());
  });
  bindResetButtons(root, onReset);
  root.querySelector("#btn-play").addEventListener("click", play);
  root.querySelector("#btn-pause").addEventListener("click", pause);
  root.querySelector("#btn-step").addEventListener("click", () => {
    if (running) return;
    stepTo(state, Math.min(state.time + 0.1, state.duration));
    if (state.done && autoRecord) trials.record(trialSnapshot());
    paint();
  });
  root.querySelector("#btn-check-32").addEventListener("click", () => {
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
  root.querySelectorAll("[data-fn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.fn;
      const fields = currentEditorFields();
      setSpec(state, specFromEditor(type, fields));
      state.scenario = "custom";
      paint();
    });
  });
  root.querySelectorAll("[data-invest]").forEach((btn) => {
    btn.addEventListener("click", () => {
      invest = btn.dataset.invest;
      if (invest === "approx") applyScenario({ scenario: "curved" });
      else if (invest === "areas") applyScenario({ scenario: "signed" });
      else if (invest === "xinterval") applyScenario({ scenario: "signed" });
      else paint();
    });
  });
  investValues?.addEventListener("click", (event) => {
    const xfBtn = event.target.closest("[data-invest-xf]");
    const nBtn = event.target.closest("[data-invest-n]");
    if (xfBtn) {
      setInterval(state, state.xi, Number(xfBtn.dataset.investXf));
      state.scenario = "custom";
      paint();
    }
    if (nBtn) {
      setN(state, Number(nBtn.dataset.investN));
      paint();
    }
  });
  root.querySelectorAll("[data-speed]").forEach((btn) => {
    btn.addEventListener("click", () => {
      playback = Number(btn.dataset.speed);
      syncInputs();
    });
  });
  root.querySelectorAll("[data-n]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setN(state, Number(btn.dataset.n));
      paint();
    });
  });
  root.querySelectorAll("[data-method]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setMethod(state, btn.dataset.method);
      paint();
    });
  });
  massInput.addEventListener("change", () => {
    setMass(state, readNumber(massInput, state.mass));
    state.scenario = "custom";
    paint();
  });
  vInput.addEventListener("change", () => {
    setSpeed(state, readNumber(vInput, state.v0));
    state.scenario = "custom";
    paint();
  });
  xiInput.addEventListener("change", () => {
    setInterval(state, readNumber(xiInput, state.xi), state.xf);
    state.scenario = "custom";
    paint();
  });
  xfInput.addEventListener("change", () => {
    setInterval(state, state.xi, readNumber(xfInput, state.xf));
    state.scenario = "custom";
    paint();
  });
  root.querySelector("#force-params").addEventListener("change", applyEditor);
  root.querySelector("#toggle-vectors").addEventListener("change", (event) => {
    state.showVectors = event.target.checked;
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
  root.querySelector("#toggle-trail").addEventListener("change", (event) => {
    state.showTrail = event.target.checked;
    paint();
  });
  root.querySelector("#toggle-areas").addEventListener("change", (event) => {
    state.showAreas = event.target.checked;
    paint();
  });
  root.querySelector("#toggle-approx").addEventListener("change", (event) => {
    state.showApprox = event.target.checked;
    paint();
  });
  root.querySelector("#auto-record").addEventListener("change", (event) => {
    autoRecord = event.target.checked;
  });
  root.querySelector("#btn-record").addEventListener("click", () => trials.record(trialSnapshot()));
  root.querySelector("#btn-clear").addEventListener("click", () => trials.clear());

  [graphWd, graphKd].forEach((el) => {
    if (!el) return;
    el.addEventListener("click", (event) => {
      if (running) return;
      const t = timeAtPointer(event.currentTarget, event, state.duration);
      state = resetState(state);
      stepTo(state, t);
      paint();
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
