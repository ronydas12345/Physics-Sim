/**
 * Simulation 3.1 — Work and the work-energy theorem. Horizontal track, W = Fd cosθ, W_net = ΔK.
 */

import {
  D_TRIALS,
  DT,
  F_TRIALS,
  MASS_TRIALS,
  SCENARIOS,
  SPEED_TRIALS,
  THETA_TRIALS,
  cameraObjectCount,
  createState,
  evaluateChallenge,
  formatSigned,
  formatUnsigned,
  generateChallenge,
  historySeries,
  liveState,
  motionDiagramSamples,
  reset as resetState,
  setDisp,
  setForce,
  setFriction,
  setMass,
  setMu,
  setOppose,
  setSpeed,
  setTheta,
  snapshot,
  stepTo,
  teacherReport,
} from "/lib/workenergy.js";
import { scaleForceMagnitude } from "/lib/forces.js";
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
  gravity: "#c45c26",
  normal: "#1c6b73",
  applied: "#7a3e08",
  friction: "#5c4634",
  oppose: "#2c6e49",
  net: "#1b2430",
  velocity: "#0f6c8a",
  accel: "#c9a227",
  work: "#c45c26",
  energy: "#1c6b73",
};

const CAMERA_EXTRA = { pad: 1.8, minSpan: 10, followSpan: 12, followEdge: 1.6 };

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

function forceList(live) {
  const list = [
    { type: "gravity", symbol: "Fg", magnitude: live.mass * live.g, direction: 270 },
    { type: "normal", symbol: "N", magnitude: live.N, direction: 90 },
    { type: "applied", symbol: "Fapp", magnitude: live.force, direction: live.thetaDeg },
  ];
  if (live.frictionOn) list.push({ type: "friction", symbol: "fk", magnitude: live.fkMag, direction: 180 });
  if (live.oppose > 0.001) list.push({ type: "oppose", symbol: "Fopp", magnitude: live.oppose, direction: 180 });
  return list;
}

function drawForceArrows(ctx, originX, originY, live, showNet) {
  for (const force of forceList(live)) {
    if (force.magnitude < 0.001) continue;
    const len = scaleForceMagnitude(force.magnitude);
    const rad = (force.direction * Math.PI) / 180;
    const x2 = originX + len * Math.cos(rad);
    const y2 = originY - len * Math.sin(rad);
    drawArrow(ctx, originX, originY, x2, y2, COLOR[force.type] || COLOR.applied, 3);
    ctx.fillStyle = COLOR[force.type] || COLOR.applied;
    ctx.font = "700 11px Figtree, sans-serif";
    ctx.textAlign = x2 >= originX ? "left" : "right";
    ctx.textBaseline = y2 <= originY ? "bottom" : "top";
    ctx.fillText(`${force.symbol} ${formatUnsigned(force.magnitude, "N")}`, x2 + (x2 >= originX ? 6 : -6), y2);
  }
  if (showNet && Math.abs(live.Fnetx) > 0.001) {
    const len = scaleForceMagnitude(Math.abs(live.Fnetx));
    const x2 = originX + Math.sign(live.Fnetx) * len;
    ctx.save();
    ctx.setLineDash([6, 4]);
    drawArrow(ctx, originX, originY, x2, originY, COLOR.net, 2.4);
    ctx.restore();
    ctx.fillStyle = COLOR.net;
    ctx.font = "700 11px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`Fnet ${formatSigned(live.Fnetx, "N")}`, (originX + x2) / 2, originY + 10);
  }
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
  const view = worldView(canvas, [0, live.x, state.d], cameraOpts);
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

  const startX = xOf(0, view);
  const endX = xOf(state.d, view);
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
  ctx.fillText("start", startX, groundY - 26);
  ctx.fillText("end", endX, groundY - 26);

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
  if (state.showVectors) drawForceArrows(ctx, boxX, boxY, live, state.showNet);
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
  ctx.fillText(`${scen?.label || "Work-energy"} · t = ${state.time.toFixed(2)} s`, cssW / 2, 8);
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
  drawForceArrows(ctx, cx, cy, live, state.showNet);
}

export function mountWorkEnergy(root) {
  const canvas = root.querySelector("#axis-canvas");
  const fbd = root.querySelector("#fbd-canvas");
  const graphWd = root.querySelector("#graph-xt");
  const graphKd = root.querySelector("#graph-vt");
  const graphRange = root.querySelector("#graph-range");
  const graphHeight = root.querySelector("#graph-height");
  const trialBody = root.querySelector("#trial-body");
  const massInput = root.querySelector("#mass-input");
  const vInput = root.querySelector("#v-input");
  const fInput = root.querySelector("#f-input");
  const angInput = root.querySelector("#ang-input");
  const dInput = root.querySelector("#d-input");
  const muInput = root.querySelector("#mu-input");
  const oppInput = root.querySelector("#opp-input");
  const investValues = root.querySelector("#invest-values");
  const investHelp = root.querySelector("#invest-help");

  let state = createState({ scenario: "along" });
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
        <td>${t.mass}</td>
        <td>${t.v0}</td>
        <td>${t.force}</td>
        <td>${t.thetaDeg}</td>
        <td>${t.d}</td>
        <td>${t.s}</td>
        <td>${t.Wnet.toFixed(2)}</td>
        <td>${t.Ki.toFixed(2)}</td>
        <td>${t.K.toFixed(2)}</td>
        <td>${t.dK.toFixed(2)}</td>
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
      mass: snap.mass,
      v0: snap.v0,
      force: snap.force,
      thetaDeg: snap.thetaDeg,
      d: snap.d,
      s: snap.s,
      Wapp: snap.Wapp,
      Wnet: snap.Wnet,
      Ki: snap.Ki,
      K: snap.K,
      Kf: snap.Kf,
      dK: snap.dK,
      vf: snap.vf,
      v: snap.v,
      reached: snap.reached,
      cos: Math.cos((snap.thetaDeg * Math.PI) / 180),
      v2: snap.v0 * snap.v0,
    };
  }

  function graphKeys() {
    if (invest === "wd") return { xKey: "d", yKey: "Wapp", xLabel: "d (m)", yLabel: "W_app (J)", color: COLOR.work };
    if (invest === "wtheta") return { xKey: "thetaDeg", yKey: "Wapp", xLabel: "θ (°)", yLabel: "W_app (J)", color: COLOR.work };
    if (invest === "km") return { xKey: "mass", yKey: "Ki", xLabel: "m (kg)", yLabel: "Kᵢ (J)", color: COLOR.energy };
    if (invest === "kv2") return { xKey: "v2", yKey: "Ki", xLabel: "v² (m²/s²)", yLabel: "Kᵢ (J)", color: COLOR.energy };
    if (invest === "wdk") return { xKey: "Wnet", yKey: "dK", xLabel: "W_net (J)", yLabel: "ΔK (J)", color: COLOR.energy };
    return { xKey: "force", yKey: "Wapp", xLabel: "F (N)", yLabel: "W_app (J)", color: COLOR.work };
  }

  function identityFor() {
    if (!identityOn()) return null;
    const d = state.d;
    const F = state.force;
    const c = Math.cos((state.thetaDeg * Math.PI) / 180);
    if (invest === "wd") return { yOfX: (s) => F * c * s, label: "W = F cosθ · d" };
    if (invest === "wtheta") return { yOfX: (th) => F * d * Math.cos((th * Math.PI) / 180), label: "W = Fd cosθ" };
    if (invest === "km") return { yOfX: (m) => 0.5 * m * state.v0 * state.v0, label: "K = ½ v² m" };
    if (invest === "kv2") return { yOfX: (v2) => 0.5 * state.mass * v2, label: "K = ½ m v²" };
    if (invest === "wdk") return { yOfX: (w) => w, label: "ΔK = W_net" };
    return { yOfX: (f) => f * d * c, label: "W = d cosθ · F" };
  }

  function drawLiveGraphs() {
    if (activeTab !== "lab") return;
    const history = historySeries(state);
    renderXYScatter(graphWd, history, {
      xKey: "s",
      yKey: "Wnet",
      xLabel: "Displacement (m)",
      yLabel: "W_net (J)",
      color: COLOR.work,
      showFit: false,
      xMin: 0,
      xMax: Math.max(state.d, 1),
    });
    renderXYScatter(graphKd, history, {
      xKey: "s",
      yKey: "K",
      xLabel: "Displacement (m)",
      yLabel: "K (J)",
      color: COLOR.energy,
      showFit: false,
      xMin: 0,
      xMax: Math.max(state.d, 1),
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
      feedback.textContent = "Use W = Fd cosθ and W_net = ΔK. The solution stays hidden until you check.";
      return;
    }
    if (challengeState.revealed) {
      feedback.textContent = challengeState.spec.solutionHint;
      return;
    }
    feedback.textContent = challengeState.last.ok
      ? "That matches the work-energy theorem."
      : "Not yet. Only the force component along the displacement does work. Net work equals ΔK.";
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
      showNet: params.showNet ?? state.showNet,
      showTrail: params.showTrail ?? state.showTrail,
    });
    paint();
  }

  function syncInvest() {
    root.querySelectorAll("[data-invest]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.invest === invest);
    });
    if (!investValues) return;
    const chips = {
      wf: F_TRIALS.map((v) => `<button type="button" class="chip" data-invest-f="${v}">F = ${v} N</button>`).join(""),
      wd: D_TRIALS.map((v) => `<button type="button" class="chip" data-invest-d="${v}">d = ${v} m</button>`).join(""),
      wtheta: THETA_TRIALS.map((v) => `<button type="button" class="chip" data-invest-th="${v}">θ = ${v}°</button>`).join(""),
      km: MASS_TRIALS.map((v) => `<button type="button" class="chip" data-invest-m="${v}">m = ${v} kg</button>`).join(""),
      kv2: SPEED_TRIALS.map((v) => `<button type="button" class="chip" data-invest-v="${v}">v = ${v} m/s</button>`).join(""),
      wdk: `<p class="track-help">Record finished runs. ΔK should match W_net.</p>`,
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
        wf: "Hold d and θ. W vs F should be a line through the origin.",
        wd: "Hold F and θ. Doubling d doubles work for a constant force.",
        wtheta: "Hold F and d. W follows Fd cosθ, including zero at 90°.",
        km: "Hold v. K vs m should have slope ½ v².",
        kv2: "Hold m. Doubling speed multiplies K by four.",
        wdk: "Net work determines ΔK, not one individual force.",
      };
      investHelp.textContent = tips[invest] || "";
    }
  }

  function syncInputs() {
    const busy = running;
    if (document.activeElement !== massInput) massInput.value = String(state.mass);
    if (document.activeElement !== vInput) vInput.value = String(state.v0);
    if (document.activeElement !== fInput) fInput.value = String(state.force);
    if (document.activeElement !== angInput) angInput.value = String(state.thetaDeg);
    if (document.activeElement !== dInput) dInput.value = String(state.d);
    if (document.activeElement !== muInput) muInput.value = String(state.mu);
    if (document.activeElement !== oppInput) oppInput.value = String(state.oppose);
    [massInput, vInput, fInput, angInput, dInput, muInput, oppInput].forEach((el) => {
      el.disabled = busy;
    });
    const fric = root.querySelector("#toggle-friction");
    if (fric && document.activeElement !== fric) fric.checked = state.frictionOn;
    if (fric) fric.disabled = busy;
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
    const vecToggle = root.querySelector("#toggle-vectors");
    const velToggle = root.querySelector("#toggle-velocity");
    const accToggle = root.querySelector("#toggle-accel");
    const netToggle = root.querySelector("#toggle-net");
    const trailToggle = root.querySelector("#toggle-trail");
    if (document.activeElement !== vecToggle) vecToggle.checked = state.showVectors;
    if (document.activeElement !== velToggle) velToggle.checked = state.showVelocity;
    if (document.activeElement !== accToggle) accToggle.checked = state.showAccel;
    if (document.activeElement !== netToggle) netToggle.checked = state.showNet;
    if (document.activeElement !== trailToggle) trailToggle.checked = state.showTrail;
    syncInvest();
  }

  function syncReadouts() {
    const snap = snapshot(state);
    const eq = root.querySelector("#eq-status");
    eq.classList.toggle("is-eq", snap.agrees && !snap.stoppedEarly);
    eq.classList.toggle("is-uneq", snap.stoppedEarly || !snap.agrees);
    root.querySelector("#eq-label").textContent = snap.motion.toUpperCase();
    root.querySelector("#eq-net").textContent = `W_net = ${formatSigned(snap.Wnet, "J")}`;
    root.querySelector("#eq-detail").textContent = snap.stoppedEarly
      ? `The object stops at ${formatUnsigned(snap.s, "m")} of the requested ${formatUnsigned(snap.d, "m")}. Kinetic energy does not go negative.`
      : snap.done
        ? snap.agrees
          ? "Work and kinetic-energy change agree within numerical tolerance."
          : "Rerun if you changed a setting after the last complete run."
        : "Run the experiment to calculate the final state.";
    root.querySelector("#read-wapp").textContent = formatSigned(snap.Wapp, "J");
    root.querySelector("#read-wfric").textContent = snap.Wfric == null ? "not included" : formatSigned(snap.Wfric, "J");
    root.querySelector("#read-wopp").textContent = snap.Wopp == null ? "not included" : formatSigned(snap.Wopp, "J");
    root.querySelector("#read-wn").textContent = formatSigned(snap.WN, "J");
    root.querySelector("#read-wg").textContent = formatSigned(snap.Wg, "J");
    root.querySelector("#read-wnet").textContent = formatSigned(snap.Wnet, "J");
    root.querySelector("#read-ki").textContent = formatUnsigned(snap.Ki, "J");
    root.querySelector("#read-k").textContent = formatUnsigned(snap.K, "J");
    root.querySelector("#read-kf").textContent = snap.done ? formatUnsigned(snap.K, "J") : "—";
    root.querySelector("#read-dk").textContent = formatSigned(snap.dK, "J");
    root.querySelector("#read-m").textContent = formatUnsigned(snap.mass, "kg");
    root.querySelector("#read-v").textContent = formatUnsigned(snap.v, "m/s");
    root.querySelector("#read-vf").textContent = snap.done ? formatUnsigned(snap.v, "m/s") : "—";
    root.querySelector("#read-s").textContent = `${formatUnsigned(snap.s, "m")} / ${formatUnsigned(snap.d, "m")}`;
    root.querySelector("#read-theta").textContent = `${snap.thetaDeg.toFixed(0)}°`;
    root.querySelector("#read-fx").textContent = formatSigned(snap.Fx, "N");
    teacher.refresh();
  }

  function paint() {
    const scene = sceneForGravity({ planetId: "earth", backgroundsOn: true });
    const view = renderScene(canvas, state, scene, camera?.options(CAMERA_EXTRA) || { mode: CAMERA.ORIGIN });
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
    filename: "ap-physics-1-3-1-trials",
    getTable() {
      return {
        title: "AP Physics 1 — 3.1 Work and the Work-Energy Theorem",
        columns: ["Trial", "m (kg)", "vᵢ (m/s)", "F (N)", "θ (°)", "d (m)", "s (m)", "W_net (J)", "Kᵢ (J)", "K (J)", "ΔK (J)", "reached"],
        rows: trials.list().map((t) => [t.id, t.mass, t.v0, t.force, t.thetaDeg, t.d, t.s, t.Wnet, t.Ki, t.K, t.dK, t.reached ? "yes" : "no"]),
      };
    },
  });
  const unbindFullscreen = bindFullscreen(root.querySelector("#btn-fullscreen"));
  const unbindTutorial = bindTutorial(root, { simulationId: "3-1" });

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
  root.querySelector("#btn-check-31").addEventListener("click", () => {
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
  root.querySelectorAll("[data-invest]").forEach((btn) => {
    btn.addEventListener("click", () => {
      invest = btn.dataset.invest;
      if (invest !== "off") applyScenario({ scenario: "along" });
      else paint();
    });
  });
  investValues?.addEventListener("click", (event) => {
    const fBtn = event.target.closest("[data-invest-f]");
    const dBtn = event.target.closest("[data-invest-d]");
    const thBtn = event.target.closest("[data-invest-th]");
    const mBtn = event.target.closest("[data-invest-m]");
    const vBtn = event.target.closest("[data-invest-v]");
    if (fBtn) {
      setForce(state, Number(fBtn.dataset.investF));
      state.scenario = "custom";
      paint();
    }
    if (dBtn) {
      setDisp(state, Number(dBtn.dataset.investD));
      state.scenario = "custom";
      paint();
    }
    if (thBtn) {
      setTheta(state, Number(thBtn.dataset.investTh));
      state.scenario = "custom";
      paint();
    }
    if (mBtn) {
      setMass(state, Number(mBtn.dataset.investM));
      state.scenario = "custom";
      paint();
    }
    if (vBtn) {
      setSpeed(state, Number(vBtn.dataset.investV));
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
  vInput.addEventListener("change", () => {
    setSpeed(state, readNumber(vInput, state.v0));
    state.scenario = "custom";
    paint();
  });
  fInput.addEventListener("change", () => {
    setForce(state, readNumber(fInput, state.force));
    state.scenario = "custom";
    paint();
  });
  angInput.addEventListener("change", () => {
    setTheta(state, readNumber(angInput, state.thetaDeg));
    state.scenario = "custom";
    paint();
  });
  dInput.addEventListener("change", () => {
    setDisp(state, readNumber(dInput, state.d));
    state.scenario = "custom";
    paint();
  });
  muInput.addEventListener("change", () => {
    setMu(state, readNumber(muInput, state.mu));
    state.scenario = "custom";
    paint();
  });
  oppInput.addEventListener("change", () => {
    setOppose(state, readNumber(oppInput, state.oppose));
    state.scenario = "custom";
    paint();
  });
  root.querySelector("#toggle-friction").addEventListener("change", (event) => {
    setFriction(state, event.target.checked);
    state.scenario = "custom";
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
  root.querySelector("#toggle-net").addEventListener("change", (event) => {
    state.showNet = event.target.checked;
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
