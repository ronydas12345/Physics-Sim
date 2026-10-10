/**
 * Simulation 2.9 — Circular motion. Uniform circular path, tangent v, inward ac, Fc = m v²/r.
 */

import {
  DT,
  FORCE_SOURCES,
  MASS_TRIALS,
  RADIUS_TRIALS,
  SCENARIOS,
  SPEED_TRIALS,
  cameraObjectCount,
  createState,
  evaluateChallenge,
  formatSigned,
  formatUnsigned,
  generateChallenge,
  historySeries,
  liveState,
  predictedAc,
  predictedFc,
  radToDeg,
  reset as resetState,
  setDirection,
  setForceSource,
  setMass,
  setMu,
  setRadius,
  setSpeed,
  setTheta,
  setTheta0,
  snapshot,
  stepTo,
  teacherReport,
} from "/lib/circular.js";
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
  path: "#5c6b73",
  radius: "#7a3e08",
  object: "#c45c26",
  tension: "#7a3e08",
  friction: "#5c4634",
  gravity: "#c45c26",
  normal: "#1c6b73",
  net: "#1b2430",
  velocity: "#0f6c8a",
  accel: "#c9a227",
  center: "#2c6e49",
};

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

function arrowLen(mag, minPx, maxPx, scale) {
  if (!Number.isFinite(mag) || mag <= 0) return 0;
  return Math.max(minPx, Math.min(maxPx, mag * scale));
}

function worldView(canvas, live, cameraOpts = {}) {
  const { cssW, cssH, dpr } = sizeCanvas(canvas);
  const pad = { l: 52, r: 36, t: 40, b: 36 };
  const plotW = Math.max(1, cssW - pad.l - pad.r);
  const plotH = Math.max(1, cssH - pad.t - pad.b);
  const r = Math.max(live.r, 0.5);
  const mode = cameraOpts.mode || CAMERA.ORIGIN;
  const extras = { pad: r * 0.4, minSpan: r * 2.5, followSpan: r * 2.4, followEdge: r * 0.35, plotPx: plotW };
  const xs = mode === CAMERA.FOLLOW ? [live.x] : [0, live.x, -r, r];
  const ys = mode === CAMERA.FOLLOW ? [live.y] : [0, live.y, -r, r];
  const xr = cameraRange(xs, { mode, ...extras, ...cameraOpts });
  const yr = cameraRange(ys, { mode, ...extras, minSpan: xr.span * 0.7 });
  const scale = Math.min(cameraScale(xr.span, plotW), cameraScale(Math.max(yr.span, xr.span * 0.55), plotH));
  const midX = (xr.lo + xr.hi) / 2;
  const midY = (yr.lo + yr.hi) / 2;
  const xOf = (x) => pad.l + plotW / 2 + (x - midX) * scale;
  const yOf = (y) => pad.t + plotH / 2 - (y - midY) * scale;
  return { cssW, cssH, dpr, pad, xOf, yOf, lo: xr.lo, hi: xr.hi, scale };
}

function renderScene(canvas, state, scene, cameraOpts = {}) {
  const live = liveState(state);
  const view = worldView(canvas, live, cameraOpts);
  const { cssW, cssH, dpr, xOf, yOf } = view;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  const sky = ctx.createLinearGradient(0, 0, 0, cssH);
  sky.addColorStop(0, scene.skyTop);
  sky.addColorStop(1, scene.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, cssW, cssH);

  const ox = xOf(0);
  const oy = yOf(0);
  const px = xOf(live.x);
  const py = yOf(live.y);

  if (state.showAxes) {
    ctx.strokeStyle = scene.axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(24, oy);
    ctx.lineTo(cssW - 16, oy);
    ctx.moveTo(ox, cssH - 16);
    ctx.lineTo(ox, 16);
    ctx.stroke();
    ctx.fillStyle = scene.ink;
    ctx.font = "700 11px Figtree, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("+x", cssW - 18, oy + 6);
    ctx.textAlign = "left";
    ctx.fillText("+y", ox + 6, 18);
  }

  ctx.strokeStyle = COLOR.path;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ox, oy, Math.abs(xOf(live.r) - ox), 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (state.showTrail && state.trail.length > 1) {
    ctx.strokeStyle = COLOR.object;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2;
    ctx.beginPath();
    state.trail.forEach((p, i) => {
      const x = xOf(p.x);
      const y = yOf(p.y);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = COLOR.radius;
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(px, py);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = COLOR.center;
  ctx.beginPath();
  ctx.arc(ox, oy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = scene.ink;
  ctx.font = "700 11px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("center", ox, oy - 8);

  ctx.fillStyle = COLOR.object;
  ctx.strokeStyle = "#1b2430";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, py, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff7ef";
  ctx.font = "700 10px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(formatUnsigned(live.mass, "kg"), px, py);

  const vLen = arrowLen(live.speed, 28, 72, 10);
  if (state.showVelocity && vLen > 0) {
    const s = Math.hypot(live.vx, live.vy) || 1;
    const vxPx = (live.vx / s) * vLen;
    const vyPx = -(live.vy / s) * vLen;
    drawArrow(ctx, px, py, px + vxPx, py + vyPx, COLOR.velocity, 3);
    ctx.fillStyle = COLOR.velocity;
    ctx.font = "700 11px Figtree, sans-serif";
    ctx.textAlign = vxPx >= 0 ? "left" : "right";
    ctx.fillText(`v ${formatUnsigned(live.speed, "m/s")}`, px + vxPx + (vxPx >= 0 ? 6 : -6), py + vyPx);
  }

  const aLen = arrowLen(live.ac, 24, 64, 4);
  if (state.showAccel && aLen > 0) {
    const s = Math.hypot(live.ax, live.ay) || 1;
    const axPx = (live.ax / s) * aLen;
    const ayPx = -(live.ay / s) * aLen;
    drawArrow(ctx, px, py, px + axPx, py + ayPx, COLOR.accel, 3);
    ctx.fillStyle = COLOR.accel;
    ctx.font = "700 11px Figtree, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`ac ${formatUnsigned(live.ac, "m/s²")}`, px + axPx, py + ayPx - 8);
  }

  if (state.showVectors && live.Fc > 0.001) {
    const color = live.forceSource === "friction" ? COLOR.friction : live.forceSource === "orbit" ? COLOR.gravity : COLOR.tension;
    const inward = live.supported ? live.Fc : live.inwardForce;
    const fLen = arrowLen(inward, 22, 58, 3);
    if (fLen > 0) {
      const ux = (ox - px) / (Math.hypot(ox - px, oy - py) || 1);
      const uy = (oy - py) / (Math.hypot(ox - px, oy - py) || 1);
      drawArrow(ctx, px, py, px + ux * fLen, py + uy * fLen, color, 3);
      ctx.fillStyle = color;
      ctx.font = "700 11px Figtree, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${live.inwardLabel} ${formatUnsigned(inward, "N")}`, px + ux * fLen, py + uy * fLen + 14);
    }
  }

  ctx.fillStyle = scene.ink;
  ctx.font = "600 12px Figtree, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(`r = ${formatUnsigned(live.r, "m")}  ·  v = ${formatUnsigned(live.speed, "m/s")}`, 16, cssH - 10);
  ctx.textAlign = "right";
  ctx.fillText(live.direction > 0 ? "CCW" : "CW", cssW - 16, cssH - 10);
  if (!live.supported) {
    ctx.fillStyle = COLOR.object;
    ctx.textAlign = "center";
    ctx.fillText("Required Fc exceeds fs,max — this friction model cannot hold the circle", cssW / 2, cssH - 10);
  }

  ctx.fillStyle = scene.ink;
  ctx.font = "700 15px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const scen = SCENARIOS.find((s) => s.id === state.scenario);
  ctx.fillText(`${scen?.label || "Circle"} · θ = ${radToDeg(live.theta).toFixed(0)}° · t = ${state.time.toFixed(2)} s`, cssW / 2, 8);
  return view;
}

function fbdForces(live) {
  if (live.forceSource === "orbit") {
    return [{ label: "Fg", value: live.Fc, color: COLOR.gravity, ang: Math.PI }];
  }
  const inward = live.forceSource === "friction" ? (live.supported ? live.Fc : live.fsMax) : live.Fc;
  const inwardColor = live.forceSource === "friction" ? COLOR.friction : COLOR.tension;
  return [
    { label: "W", value: live.W, color: COLOR.gravity, ang: Math.PI / 2 },
    { label: "N", value: live.N, color: COLOR.normal, ang: -Math.PI / 2 },
    { label: live.inwardLabel, value: inward, color: inwardColor, ang: Math.PI },
  ];
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
  const cy = cssH / 2 + 4;
  ctx.fillStyle = theme.ink;
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "700 12px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("FBD — real forces only", cx, cy - 16);
  const live = liveState(state);
  fbdForces(live).forEach((force) => {
    if (force.value < 0.02) return;
    const len = arrowLen(force.value, 28, 70, 3);
    const x2 = cx + Math.cos(force.ang) * len;
    const y2 = cy + Math.sin(force.ang) * len;
    drawArrow(ctx, cx, cy, x2, y2, force.color, 3);
    ctx.fillStyle = force.color;
    ctx.font = "700 11px Figtree, sans-serif";
    ctx.fillText(`${force.label} ${formatUnsigned(force.value, "N")}`, x2, y2 + (y2 >= cy ? 12 : -8));
  });
}

export function mountCircular(root) {
  const canvas = root.querySelector("#axis-canvas");
  const fbd = root.querySelector("#fbd-canvas");
  const graphXt = root.querySelector("#graph-xt");
  const graphVt = root.querySelector("#graph-vt");
  const graphAt = root.querySelector("#graph-at");
  const graphRange = root.querySelector("#graph-range");
  const graphHeight = root.querySelector("#graph-height");
  const trialBody = root.querySelector("#trial-body");
  const massInput = root.querySelector("#mass-input");
  const rInput = root.querySelector("#r-input");
  const vInput = root.querySelector("#v-input");
  const angInput = root.querySelector("#ang-input");
  const muInput = root.querySelector("#mu-input");
  const tInput = root.querySelector("#duration-input");
  const investValues = root.querySelector("#invest-values");
  const investHelp = root.querySelector("#invest-help");

  let state = createState({ scenario: "baseline" });
  let running = false;
  let raf = 0;
  let lastStamp = 0;
  let carry = 0;
  let playback = 1;
  let autoRecord = false;
  let camera;
  let lastCameraRange = { lo: -6, hi: 6 };
  let activeTab = "lab";
  let invest = "off";
  let identityOn = () => false;

  const trials = createTrialBook({
    columns: 11,
    renderRow: (t) => `<tr>
      <td>${t.id}</td>
      <td>${formatUnsigned(t.mass, "kg")}</td>
      <td>${formatUnsigned(t.r, "m")}</td>
      <td>${formatUnsigned(t.speed, "m/s")}</td>
      <td>${formatUnsigned(t.ac, "m/s²")}</td>
      <td>${formatUnsigned(t.Fc, "N")}</td>
      <td>${formatUnsigned(t.omegaMag, "rad/s")}</td>
      <td>${t.T == null ? "—" : formatUnsigned(t.T, "s")}</td>
      <td>${t.f == null ? "—" : formatUnsigned(t.f, "Hz")}</td>
      <td>${t.forceSource}</td>
      <td>${t.supported ? "ok" : "limit"}</td>
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
      r: snap.r,
      speed: snap.speed,
      v2: snap.speed * snap.speed,
      invR: 1 / snap.r,
      ac: snap.ac,
      Fc: snap.Fc,
      omegaMag: snap.omegaMag,
      T: snap.T,
      f: snap.f,
      forceSource: snap.forceSource,
      supported: snap.supported,
      thetaDeg: snap.thetaDeg,
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
    if (invest === "acv2") return { xKey: "v2", yKey: "ac", xLabel: "v² (m²/s²)", yLabel: "ac (m/s²)", color: COLOR.accel };
    if (invest === "acr") return { xKey: "invR", yKey: "ac", xLabel: "1/r (1/m)", yLabel: "ac (m/s²)", color: COLOR.accel };
    if (invest === "fcm") return { xKey: "mass", yKey: "Fc", xLabel: "m (kg)", yLabel: "Fc (N)", color: COLOR.tension };
    if (invest === "fcv2") return { xKey: "v2", yKey: "Fc", xLabel: "v² (m²/s²)", yLabel: "Fc (N)", color: COLOR.tension };
    if (invest === "fcr") return { xKey: "invR", yKey: "Fc", xLabel: "1/r (1/m)", yLabel: "Fc (N)", color: COLOR.tension };
    if (invest === "tv") return { xKey: "speed", yKey: "T", xLabel: "v (m/s)", yLabel: "T (s)", color: COLOR.center };
    if (invest === "tr") return { xKey: "r", yKey: "T", xLabel: "r (m)", yLabel: "T (s)", color: COLOR.center };
    return { xKey: "speed", yKey: "ac", xLabel: "v (m/s)", yLabel: "ac (m/s²)", color: COLOR.accel };
  }

  function identityFor(investId) {
    if (!identityOn()) return null;
    if (investId === "acv2") return { yOfX: (v2) => v2 / state.r, label: "ac = (1/r) v²" };
    if (investId === "acr") return { yOfX: (inv) => state.speed ** 2 * inv, label: "ac = v² (1/r)" };
    if (investId === "fcm") return { yOfX: (m) => predictedFc({ mass: m, speed: state.speed, r: state.r }), label: "Fc = (v²/r) m" };
    if (investId === "fcv2") return { yOfX: (v2) => (state.mass / state.r) * v2, label: "Fc = (m/r) v²" };
    if (investId === "fcr") return { yOfX: (inv) => state.mass * state.speed ** 2 * inv, label: "Fc = m v² (1/r)" };
    if (investId === "off" || investId === "acv") return { yOfX: (v) => predictedAc({ speed: v, r: state.r }), label: "ac = v²/r" };
    return null;
  }

  function drawLiveGraphs() {
    if (activeTab !== "lab") return;
    const history = historySeries(state);
    renderTimeSeries(graphXt, history, {
      series: [{ yKey: "x", color: COLOR.object, label: "x" }],
      xLabel: "Time (s)",
      yLabel: "x (m)",
      duration: state.duration,
      now: state.time,
    });
    renderTimeSeries(graphVt, history, {
      series: [
        { yKey: "vx", color: COLOR.velocity, label: "vx" },
        { yKey: "vy", color: COLOR.center, label: "vy" },
      ],
      xLabel: "Time (s)",
      yLabel: "Velocity (m/s)",
      duration: state.duration,
      now: state.time,
    });
    renderTimeSeries(graphAt, history, {
      series: [
        { yKey: "ax", color: COLOR.accel, label: "ax" },
        { yKey: "ay", color: COLOR.object, label: "ay" },
      ],
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
    renderXYScatter(graphRange, list, {
      ...left,
      fitYName: left.yKey,
      fitXName: left.xKey,
      identity: identityFor(invest),
    });
    renderXYScatter(graphHeight, list, {
      xKey: "v2",
      yKey: "ac",
      xLabel: "v² (m²/s²)",
      yLabel: "ac (m/s²)",
      color: COLOR.center,
      fitYName: "ac",
      fitXName: "v²",
      identity: identityOn() ? { yOfX: (v2) => v2 / (list[0]?.r ?? state.r), label: "slope = 1/r" } : null,
    });
    const titles = root.querySelectorAll("#graph-panel h2");
    if (titles[0]) titles[0].textContent = `Your Trials · ${left.yLabel.split(" ")[0]} vs. ${left.xKey}`;
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
      feedback.textContent = "Predict using ac = v²/r and Fc = m ac. The solution stays hidden until you check.";
      return;
    }
    if (challengeState.revealed) {
      feedback.textContent = challengeState.spec.solutionHint;
      return;
    }
    feedback.textContent = challengeState.last.ok
      ? "That matches uniform circular motion."
      : "Not yet. ac = v²/r toward the center. Fc is the net inward force, not an extra interaction.";
  }

  function applyScenario(params) {
    stopLoop();
    state = createState({
      ...params,
      showVectors: params.showVectors ?? state.showVectors,
      showVelocity: params.showVelocity ?? state.showVelocity,
      showAccel: params.showAccel ?? state.showAccel,
      showNet: params.showNet ?? state.showNet,
      showAxes: params.showAxes ?? state.showAxes,
      showTrail: params.showTrail ?? state.showTrail,
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
      acv: SPEED_TRIALS.map((v) => `<button type="button" class="chip" data-invest-v="${v}">v = ${v} m/s</button>`).join(""),
      acv2: SPEED_TRIALS.map((v) => `<button type="button" class="chip" data-invest-v="${v}">v = ${v} m/s</button>`).join(""),
      acr: RADIUS_TRIALS.map((v) => `<button type="button" class="chip" data-invest-r="${v}">r = ${v} m</button>`).join(""),
      fcm: MASS_TRIALS.map((v) => `<button type="button" class="chip" data-invest-m="${v}">m = ${v} kg</button>`).join(""),
      fcv2: SPEED_TRIALS.map((v) => `<button type="button" class="chip" data-invest-v="${v}">v = ${v} m/s</button>`).join(""),
      fcr: RADIUS_TRIALS.map((v) => `<button type="button" class="chip" data-invest-r="${v}">r = ${v} m</button>`).join(""),
      tv: SPEED_TRIALS.map((v) => `<button type="button" class="chip" data-invest-v="${v}">v = ${v} m/s</button>`).join(""),
      tr: RADIUS_TRIALS.map((v) => `<button type="button" class="chip" data-invest-r="${v}">r = ${v} m</button>`).join(""),
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
        acv: "Hold r = 2 m. ac vs v is not a line.",
        acv2: "Hold r = 2 m. ac vs v² should be a line with slope 1/r = 0.50 s²/m.",
        acr: "Hold v = 4 m/s. ac vs 1/r should have slope v² = 16 m²/s².",
        fcm: "Hold v and r. Fc vs m should have slope v²/r.",
        fcv2: "Hold m and r. Fc vs v² should be linear.",
        fcr: "Hold m and v. Fc vs 1/r should be linear.",
        tv: "Hold r = 2 m. Period should fall as 2πr/v.",
        tr: "Hold v = 4 m/s. Period should rise with r.",
      };
      investHelp.textContent = tips[invest] || "";
    }
  }

  function applyInvestPreset() {
    applyScenario({ scenario: "baseline", mass: 1, r: 2, speed: 4, direction: 1, theta0Deg: 0, forceSource: "string" });
  }

  function syncInputs() {
    const busy = running;
    if (document.activeElement !== massInput) massInput.value = String(state.mass);
    if (document.activeElement !== rInput) rInput.value = String(state.r);
    if (document.activeElement !== vInput) vInput.value = String(state.speed);
    if (document.activeElement !== angInput) angInput.value = String(Math.round(state.time < 1e-12 ? state.theta0Deg : radToDeg(state.theta)));
    if (document.activeElement !== muInput) muInput.value = String(state.mu);
    if (document.activeElement !== tInput) tInput.value = String(state.duration);
    [massInput, rInput, vInput, angInput, muInput, tInput].forEach((el) => {
      el.disabled = busy;
    });
    root.querySelector("#btn-play").disabled = busy;
    root.querySelector("#btn-pause").disabled = !busy;
    root.querySelector("#btn-step").disabled = busy;
    root.querySelectorAll("[data-scenario]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.scenario === state.scenario);
      btn.disabled = busy;
    });
    root.querySelectorAll("[data-dir]").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.dir) === state.direction);
      btn.disabled = busy;
    });
    root.querySelectorAll("[data-source]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.source === state.forceSource);
      btn.disabled = busy;
    });
    root.querySelectorAll("[data-angle]").forEach((btn) => {
      const deg = Number(btn.dataset.angle);
      btn.classList.toggle("active", Math.abs(radToDeg(state.theta) - deg) < 4 || (deg === 0 && radToDeg(state.theta) > 356));
      btn.disabled = busy;
    });
    root.querySelectorAll("[data-speed]").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.speed) === playback);
    });
    const vecToggle = root.querySelector("#toggle-vectors");
    const velToggle = root.querySelector("#toggle-velocity");
    const accToggle = root.querySelector("#toggle-accel");
    const axesToggle = root.querySelector("#toggle-axes");
    const trailToggle = root.querySelector("#toggle-trail");
    if (document.activeElement !== vecToggle) vecToggle.checked = state.showVectors;
    if (document.activeElement !== velToggle) velToggle.checked = state.showVelocity;
    if (document.activeElement !== accToggle) accToggle.checked = state.showAccel;
    if (document.activeElement !== axesToggle) axesToggle.checked = state.showAxes;
    if (document.activeElement !== trailToggle) trailToggle.checked = state.showTrail;
    syncInvest();
  }

  function syncReadouts() {
    const snap = snapshot(state);
    const eq = root.querySelector("#eq-status");
    eq.classList.toggle("is-eq", snap.supported && snap.speed > 0.02);
    eq.classList.toggle("is-uneq", !snap.supported || snap.speed < 0.02);
    root.querySelector("#eq-label").textContent = snap.motion.toUpperCase();
    root.querySelector("#eq-net").textContent = `ac = ${formatUnsigned(snap.ac, "m/s²")}`;
    root.querySelector("#eq-detail").textContent = snap.speed < 0.02
      ? "Speed is zero, so ac and the required inward net force are zero. Period is undefined."
      : snap.supported
        ? `Velocity is tangent at the ${snap.place}. Acceleration points toward the center.`
        : `Required Fc = ${formatUnsigned(snap.Fc, "N")} exceeds fs,max = ${formatUnsigned(snap.fsMax, "N")}.`;
    root.querySelector("#read-ac").textContent = formatUnsigned(snap.ac, "m/s²");
    root.querySelector("#read-fc").textContent = formatUnsigned(snap.Fc, "N");
    root.querySelector("#read-omega").textContent = formatSigned(snap.omega, "rad/s");
    root.querySelector("#read-t").textContent = snap.T == null ? "—" : formatUnsigned(snap.T, "s");
    root.querySelector("#read-f").textContent = snap.f == null ? "—" : formatUnsigned(snap.f, "Hz");
    root.querySelector("#read-m").textContent = formatUnsigned(snap.mass, "kg");
    root.querySelector("#read-r").textContent = formatUnsigned(snap.r, "m");
    root.querySelector("#read-v").textContent = formatUnsigned(snap.speed, "m/s");
    root.querySelector("#read-theta").textContent = `${snap.thetaDeg.toFixed(0)}°`;
    root.querySelector("#read-vx").textContent = formatSigned(snap.vx, "m/s");
    root.querySelector("#read-vy").textContent = formatSigned(snap.vy, "m/s");
    root.querySelector("#read-ax").textContent = formatSigned(snap.ax, "m/s²");
    root.querySelector("#read-ay").textContent = formatSigned(snap.ay, "m/s²");
    root.querySelector("#read-source").textContent = snap.inwardLabel;
    root.querySelector("#read-inward").textContent = formatUnsigned(snap.inwardForce, "N");
    root.querySelector("#read-vmax").textContent = snap.vMax == null ? "—" : formatUnsigned(snap.vMax, "m/s");
    root.querySelector("#source-caption").textContent = FORCE_SOURCES.find((s) => s.id === snap.forceSource)?.caption || "";
    teacher.refresh();
  }

  function paint() {
    const scene = sceneForGravity({ planetId: "earth", backgroundsOn: true });
    const view = renderScene(canvas, state, scene, camera?.options({ pad: state.r * 0.4, minSpan: state.r * 2.5, followSpan: state.r * 2.4, followEdge: state.r * 0.35 }) || { mode: CAMERA.ORIGIN });
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
    filename: "ap-physics-1-2-9-trials",
    getTable() {
      return {
        title: "AP Physics 1 — 2.9 Circular Motion",
        columns: ["Trial", "m (kg)", "r (m)", "v (m/s)", "ac (m/s²)", "Fc (N)", "ω (rad/s)", "T (s)", "f (Hz)", "source", "limit"],
        rows: trials.list().map((t) => [t.id, t.mass, t.r, t.speed, t.ac, t.Fc, t.omegaMag, t.T, t.f, t.forceSource, t.supported ? "ok" : "limit"]),
      };
    },
  });
  const unbindFullscreen = bindFullscreen(root.querySelector("#btn-fullscreen"));
  const unbindTutorial = bindTutorial(root, { simulationId: "2-9" });

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
  root.querySelector("#btn-check-29").addEventListener("click", () => {
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
  root.querySelectorAll("[data-dir]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setDirection(state, Number(btn.dataset.dir));
      state.scenario = "custom";
      paint();
    });
  });
  root.querySelectorAll("[data-source]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setForceSource(state, btn.dataset.source);
      state.scenario = "custom";
      paint();
    });
  });
  root.querySelectorAll("[data-angle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      stopLoop();
      const deg = Number(btn.dataset.angle);
      state = resetState(state);
      setTheta0(state, deg);
      setTheta(state, (deg * Math.PI) / 180);
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
    const vBtn = event.target.closest("[data-invest-v]");
    const rBtn = event.target.closest("[data-invest-r]");
    const mBtn = event.target.closest("[data-invest-m]");
    if (vBtn) {
      setSpeed(state, Number(vBtn.dataset.investV));
      state.scenario = "custom";
      paint();
    }
    if (rBtn) {
      setRadius(state, Number(rBtn.dataset.investR));
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
  rInput.addEventListener("change", () => {
    setRadius(state, readNumber(rInput, state.r));
    state.scenario = "custom";
    paint();
  });
  vInput.addEventListener("change", () => {
    setSpeed(state, readNumber(vInput, state.speed));
    state.scenario = "custom";
    paint();
  });
  angInput.addEventListener("change", () => {
    setTheta0(state, readNumber(angInput, state.theta0Deg));
    if (state.time < 1e-12) setTheta(state, (state.theta0Deg * Math.PI) / 180);
    state.scenario = "custom";
    paint();
  });
  muInput.addEventListener("change", () => {
    setMu(state, readNumber(muInput, state.mu));
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
  root.querySelector("#toggle-velocity").addEventListener("change", (event) => {
    state.showVelocity = event.target.checked;
    paint();
  });
  root.querySelector("#toggle-accel").addEventListener("change", (event) => {
    state.showAccel = event.target.checked;
    paint();
  });
  root.querySelector("#toggle-axes").addEventListener("change", (event) => {
    state.showAxes = event.target.checked;
    paint();
  });
  root.querySelector("#toggle-trail").addEventListener("change", (event) => {
    state.showTrail = event.target.checked;
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
