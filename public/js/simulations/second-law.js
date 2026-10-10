/**
 * Simulation 2.5 — Newton's second law. Reuses the lab shell, camera, graphs, and 2.2 force arrows.
 */

import {
  CARDINALS,
  DIAGRAM_DT,
  DT,
  FORCE_SWEEP,
  MASS_SWEEP,
  PLAYBACK_SPEEDS,
  SCENARIOS,
  addForce,
  createState,
  directionInfo,
  disableHorizontalForces,
  displayForces,
  enableFriction,
  enabledForces,
  evaluateChallenge,
  formatSigned,
  formatUnsigned,
  generateChallenge,
  historySeries,
  liveState,
  motionDiagramSamples,
  netDirection,
  removeForce,
  reset as resetState,
  sampleHistory,
  setForce,
  setIncludeVertical,
  setMass,
  setNetX,
  snapshot,
  stepTo,
  teacherReport,
} from "/lib/secondlaw.js";
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

const FORCE_COLOR = {
  gravity: "#c45c26",
  normal: "#1c6b73",
  applied: "#7a3e08",
  friction: "#5c4634",
  tension: "#2c6e49",
  net: "#1b2430",
  velocity: "#0f6c8a",
  accel: "#c9a227",
};

const CAMERA_EXTRA = { pad: 3.5, minSpan: 22, followSpan: 22, followEdge: 3.5 };

function colorOf(type) {
  return FORCE_COLOR[type] || "#4d5a68";
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

function drawForceArrows(ctx, originX, originY, forces, { showNet, net }) {
  for (const force of enabledForces(forces)) {
    const len = scaleForceMagnitude(force.magnitude);
    const rad = (force.direction * Math.PI) / 180;
    const x2 = originX + len * Math.cos(rad);
    const y2 = originY - len * Math.sin(rad);
    drawArrow(ctx, originX, originY, x2, y2, colorOf(force.type), 3);
    ctx.fillStyle = colorOf(force.type);
    ctx.font = "700 11px Figtree, sans-serif";
    ctx.textAlign = x2 >= originX ? "left" : "right";
    ctx.textBaseline = y2 <= originY ? "bottom" : "top";
    const info = directionInfo(force.direction);
    ctx.fillText(`${force.symbol} ${formatUnsigned(force.magnitude, "N")} ${info.arrow}`, x2 + (x2 >= originX ? 6 : -6), y2);
  }
  if (showNet && net && net.magnitude > 0.001) {
    const len = scaleForceMagnitude(net.magnitude);
    const rad = (net.direction * Math.PI) / 180;
    const x2 = originX + len * Math.cos(rad);
    const y2 = originY - len * Math.sin(rad);
    ctx.save();
    ctx.setLineDash([6, 4]);
    drawArrow(ctx, originX, originY, x2, y2, FORCE_COLOR.net, 2.4);
    ctx.restore();
    ctx.fillStyle = FORCE_COLOR.net;
    ctx.font = "700 11px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const info = netDirection(net);
    ctx.fillText(`Fnet ${formatUnsigned(net.magnitude, "N")} ${info.arrow}`, (originX + x2) / 2, Math.max(y2, originY) + 8);
  }
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

function renderScene(canvas, state, scene, cameraOpts = {}) {
  const live = liveState(state);
  const view = worldView(canvas, [live.x], cameraOpts);
  const { cssW, cssH, dpr, originX, groundY, boxY } = view;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, scene.skyTop);
  sky.addColorStop(1, scene.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, cssW, cssH);
  renderGround(ctx, view, scene);

  const trail = motionDiagramSamples(state);
  ctx.fillStyle = scene.ink;
  for (const sample of trail) {
    if (sample.time >= state.time - 1e-9) continue;
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(xOf(sample.x, view), boxY, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

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
  drawBox(ctx, boxX, boxY, 74, 48, "Box");
  if (state.showVectors) {
    drawForceArrows(ctx, boxX, boxY, live.forces, { showNet: state.showNetForce, net: live.net });
  }
  if (state.showVelocity) drawSideArrow(ctx, boxX, boxY, live.vx, FORCE_COLOR.velocity, "v", "m/s", -38);
  if (state.showAccel) drawSideArrow(ctx, boxX, boxY, live.ax, FORCE_COLOR.accel, "a", "m/s²", 36);

  ctx.fillStyle = scene.ink;
  ctx.font = "700 15px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const scen = SCENARIOS.find((s) => s.id === state.scenario);
  ctx.fillText(`${scen?.label || "Second law"} · ground frame · t = ${state.time.toFixed(2)} s`, cssW / 2, 8);
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
  drawForceArrows(ctx, cx, cy, live.forces, { showNet: state.showNetForce, net: live.net });
}

function renderDiagram(canvas, state) {
  const { cssW, cssH, dpr } = sizeCanvas(canvas);
  const ctx = canvas.getContext("2d");
  const theme = themeCanvas();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = theme.fill;
  ctx.fillRect(0, 0, cssW, cssH);
  const live = liveState(state);
  const dots = motionDiagramSamples(state);
  const xs = dots.map((d) => d.x).concat([live.x, 0]);
  const min = Math.min(-8, ...xs) - 2;
  const max = Math.max(8, ...xs) + 2;
  const pad = 36;
  const scale = (cssW - pad * 2) / Math.max(max - min, 1);
  const px = (x) => pad + (x - min) * scale;
  const y = cssH * 0.55;
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(cssW - pad, y);
  ctx.stroke();
  dots.forEach((dot, i) => {
    const last = i === dots.length - 1;
    ctx.fillStyle = last ? "#c45c26" : "#1c6b73";
    ctx.beginPath();
    ctx.arc(px(dot.x), y, last ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = theme.muted;
  ctx.font = "600 12px Figtree, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Motion diagram  ·  Δt = ${DIAGRAM_DT.toFixed(2)} s`, pad, 16);
}

function forceRow(force) {
  const dirs = CARDINALS.filter((c) => c.deg === 0 || c.deg === 90 || c.deg === 180 || c.deg === 270)
    .map((c) => `<option value="${c.deg}"${Number(force.direction) === c.deg ? " selected" : ""}>${c.arrow} ${c.name}</option>`)
    .join("");
  const lockedDir = force.type === "gravity";
  return `<tr data-force-id="${force.id}">
    <td><label class="force-enable"><input type="checkbox" data-enabled ${force.enabled ? "checked" : ""} /> ${force.name} <span class="muted">${force.symbol}</span></label></td>
    <td><input class="force-mag" data-mag type="number" min="0" max="200" step="0.5" value="${force.magnitude}" aria-label="${force.name} magnitude in newtons" /></td>
    <td><select data-dir ${lockedDir ? "disabled" : ""} aria-label="${force.name} direction">${dirs}</select></td>
    <td class="muted">${force.source}</td>
    <td>${force.type === "gravity" ? "" : `<button type="button" class="text-link" data-remove>Remove</button>`}</td>
  </tr>`;
}

export function mountSecondLaw(root) {
  const canvas = root.querySelector("#axis-canvas");
  const fbd = root.querySelector("#fbd-canvas");
  const diagram = root.querySelector("#diagram-canvas");
  const graphXt = root.querySelector("#graph-xt");
  const graphVt = root.querySelector("#graph-vt");
  const graphAt = root.querySelector("#graph-at");
  const graphFt = root.querySelector("#graph-ft");
  const graphRange = root.querySelector("#graph-range");
  const graphHeight = root.querySelector("#graph-height");
  const trialBody = root.querySelector("#trial-body");
  const forceBody = root.querySelector("#force-body");
  const massInput = root.querySelector("#mass-input");
  const xInput = root.querySelector("#x-input");
  const vInput = root.querySelector("#v-input");
  const tInput = root.querySelector("#duration-input");
  const hover = root.querySelector("#graph-hover");
  const investValues = root.querySelector("#invest-values");
  const investHelp = root.querySelector("#invest-help");

  let state = createState({ scenario: "basic" });
  let running = false;
  let raf = 0;
  let lastStamp = 0;
  let carry = 0;
  let playback = 1;
  let autoRecord = false;
  let camera;
  let lastCameraRange = { lo: -11, hi: 11 };
  let activeTab = "lab";
  let graphs = { x: true, v: true, a: true, f: false };
  let invest = "off";
  let invertMass = false;
  let identityOn = () => false;

  const trials = createTrialBook({
    columns: 8,
    renderRow: (t) => `<tr>
      <td>${t.id}</td>
      <td>${t.scenario}</td>
      <td>${formatUnsigned(t.time, "s")}</td>
      <td>${formatUnsigned(t.mass, "kg")}</td>
      <td>${formatSigned(t.Fnetx, "N")}</td>
      <td>${formatSigned(t.ax, "m/s²")}</td>
      <td>${formatSigned(t.vx, "m/s")}</td>
      <td>${t.motion}</td>
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
      scenario: snap.scenario,
      time: snap.time,
      mass: snap.mass,
      invMass: 1 / Math.max(snap.mass, 1e-9),
      vx: snap.vx,
      Fnetx: snap.net.x,
      ax: snap.ax,
      motion: snap.motion,
    };
  }

  function bindCamera() {
    const host = root.querySelector("#camera-host");
    host.innerHTML = cameraModeControls(1);
    camera = bindCameraMode(root, {
      objectCount: 1,
      rangeForLock: () => lastCameraRange,
      onChange: () => paint(),
    });
  }

  function drawLiveGraphs() {
    if (activeTab !== "lab") return;
    const history = historySeries(state);
    if (graphs.x) {
      renderTimeSeries(graphXt, history, {
        series: [{ yKey: "x", color: "#c45c26", label: "x" }],
        xLabel: "Time (s)",
        yLabel: "Position (m)",
        duration: state.duration,
        now: state.time,
      });
    }
    if (graphs.v) {
      renderTimeSeries(graphVt, history, {
        series: [{ yKey: "vx", color: "#0f6c8a", label: "v" }],
        xLabel: "Time (s)",
        yLabel: "Velocity (m/s)",
        duration: state.duration,
        now: state.time,
      });
    }
    if (graphs.a) {
      renderTimeSeries(graphAt, history, {
        series: [{ yKey: "ax", color: "#c9a227", label: "a" }],
        xLabel: "Time (s)",
        yLabel: "Acceleration (m/s²)",
        duration: state.duration,
        now: state.time,
      });
    }
    if (graphs.f && graphFt) {
      renderTimeSeries(graphFt, history, {
        series: [{ yKey: "Fnetx", color: "#7a3e08", label: "F_net,x" }],
        xLabel: "Time (s)",
        yLabel: "Net force (N)",
        duration: state.duration,
        now: state.time,
      });
    }
  }

  function drawCharts() {
    if (activeTab !== "lab") return;
    const list = trials.list();
    renderXYScatter(graphRange, list, {
      xKey: "Fnetx",
      yKey: "ax",
      xLabel: "F_net,x (N)",
      yLabel: "a_x (m/s²)",
      color: "#c45c26",
      fitYName: "a_x",
      fitXName: "F_net,x",
      identity: identityOn()
        ? { yOfX: (F) => F / Math.max(state.mass, 1e-9), label: "a = F_net / m", xMin: -40, xMax: 40 }
        : null,
    });
    if (invertMass) {
      renderXYScatter(graphHeight, list, {
        xKey: "invMass",
        yKey: "ax",
        xLabel: "1/m (1/kg)",
        yLabel: "a_x (m/s²)",
        color: "#0f6c8a",
        fitYName: "a_x",
        fitXName: "1/m",
        identity: identityOn()
          ? { yOfX: (inv) => (list[0]?.Fnetx ?? 20) * inv, label: "a = F_net (1/m)" }
          : null,
      });
    } else {
      renderXYScatter(graphHeight, list, {
        xKey: "mass",
        yKey: "ax",
        xLabel: "Mass (kg)",
        yLabel: "a_x (m/s²)",
        color: "#0f6c8a",
        fitYName: "a_x",
        fitXName: "m",
      });
    }
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
      feedback.textContent = "Predict a = F_net / m before you read the live numbers.";
      return;
    }
    if (challengeState.revealed) {
      feedback.textContent = challengeState.spec.solutionHint;
      return;
    }
    feedback.textContent = challengeState.last.ok
      ? "Correct. Acceleration follows net force and mass."
      : "Not yet. Use the net force, then divide by mass.";
  }

  function applyScenario(params) {
    stopLoop();
    state = createState({
      ...params,
      showVectors: params.showVectors ?? state.showVectors,
      showNetForce: params.showNetForce ?? state.showNetForce,
      showVelocity: params.showVelocity ?? state.showVelocity,
      showAccel: params.showAccel ?? state.showAccel,
      includeVertical: params.includeVertical ?? state.includeVertical,
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

  function syncForceTable() {
    if (!forceBody) return;
    const shown = displayForces(state);
    const fingerprint = (forces) => forces.map((f) => `${f.id}:${f.magnitude}:${f.direction}:${f.enabled}`).join(",");
    const current = fingerprint([...forceBody.querySelectorAll("tr")].map((row) => ({
      id: row.dataset.forceId,
      magnitude: row.querySelector("[data-mag]")?.value,
      direction: row.querySelector("[data-dir]")?.value,
      enabled: row.querySelector("[data-enabled]")?.checked,
    })));
    if (current !== fingerprint(shown)) forceBody.innerHTML = shown.map(forceRow).join("");
  }

  function syncInvest() {
    root.querySelectorAll("[data-invest]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.invest === invest);
    });
    if (!investValues) return;
    if (invest === "off") {
      investValues.hidden = true;
      if (investHelp) investHelp.textContent = "Vary one quantity while holding the other constant, then record trials.";
      return;
    }
    investValues.hidden = false;
    if (investHelp) {
      investHelp.textContent = invest === "force"
        ? "Mass held at 5 kg. Change net force and measure acceleration."
        : "Net force held at 20 N. Change mass and measure acceleration.";
    }
    if (investValues.dataset.mode !== invest) {
      investValues.dataset.mode = invest;
      investValues.innerHTML = invest === "force"
        ? FORCE_SWEEP.map((F) => `<button type="button" class="chip" data-invest-f="${F}">${F} N</button>`).join("")
        : MASS_SWEEP.map((m) => `<button type="button" class="chip" data-invest-m="${m}">${m} kg</button>`).join("");
    }
    const live = liveState(state);
    investValues.querySelectorAll("[data-invest-f]").forEach((btn) => {
      btn.classList.toggle("active", Math.abs(Number(btn.dataset.investF) - live.net.x) < 0.05);
    });
    investValues.querySelectorAll("[data-invest-m]").forEach((btn) => {
      btn.classList.toggle("active", Math.abs(Number(btn.dataset.investM) - state.mass) < 0.05);
    });
  }

  function applyInvestForce(F) {
    applyScenario({ scenario: "custom", mass: 5, vx0: 0, x0: -8, duration: 8 });
    setNetX(state, F);
    paint();
  }

  function applyInvestMass(m) {
    applyScenario({ scenario: "custom", mass: m, vx0: 0, x0: -8, duration: 8 });
    setNetX(state, 20);
    paint();
  }

  function syncInputs() {
    const busy = running;
    SCENARIOS.forEach((scen) => {
      root.querySelector(`[data-scenario="${scen.id}"]`)?.classList.toggle("active", state.scenario === scen.id);
    });
    PLAYBACK_SPEEDS.forEach((speed) => {
      root.querySelector(`[data-speed="${speed}"]`)?.classList.toggle("active", speed === playback);
    });
    if (document.activeElement !== massInput) massInput.value = String(state.mass);
    if (document.activeElement !== xInput) xInput.value = String(state.x0);
    if (document.activeElement !== vInput) vInput.value = String(state.vx0);
    if (document.activeElement !== tInput) tInput.value = String(state.duration);
    [massInput, xInput, vInput, tInput].forEach((el) => {
      el.disabled = busy;
    });
    forceBody?.querySelectorAll("input, select, button").forEach((el) => {
      el.disabled = busy;
    });
    root.querySelector("#btn-add-force").disabled = busy;
    const clearHoriz = root.querySelector("#btn-clear-horiz");
    if (clearHoriz) clearHoriz.disabled = busy;
    root.querySelector("#btn-enable-friction").disabled = busy;
    root.querySelector("#btn-play").disabled = busy;
    root.querySelector("#btn-pause").disabled = !busy;
    root.querySelector("#btn-step").disabled = busy;
    root.querySelectorAll("[data-scenario]").forEach((btn) => {
      btn.disabled = busy;
    });
    const vecToggle = root.querySelector("#toggle-vectors");
    const netToggle = root.querySelector("#toggle-net");
    const velToggle = root.querySelector("#toggle-velocity");
    const accToggle = root.querySelector("#toggle-accel");
    const vertToggle = root.querySelector("#toggle-vertical");
    if (document.activeElement !== vecToggle) vecToggle.checked = state.showVectors;
    if (document.activeElement !== netToggle) netToggle.checked = state.showNetForce;
    if (document.activeElement !== velToggle) velToggle.checked = state.showVelocity;
    if (document.activeElement !== accToggle) accToggle.checked = state.showAccel;
    if (document.activeElement !== vertToggle) vertToggle.checked = state.includeVertical;
    syncForceTable();
    syncInvest();
  }

  function paint() {
    const scene = sceneForGravity({ planetId: "earth", backgroundsOn: true });
    const view = renderScene(canvas, state, scene, camera?.options(CAMERA_EXTRA) || { mode: CAMERA.ORIGIN, ...CAMERA_EXTRA });
    lastCameraRange = { lo: view.lo, hi: view.hi };
    renderFbd(fbd, state);
    renderDiagram(diagram, state);
    const snap = snapshot(state);
    const dir = snap.netDir;
    const eq = root.querySelector("#eq-status");
    eq.classList.toggle("is-eq", snap.balanced);
    eq.classList.toggle("is-uneq", !snap.balanced);
    root.querySelector("#eq-label").textContent = snap.forceState;
    root.querySelector("#eq-net").textContent = snap.balanced
      ? "Net force: 0 N"
      : `Net force: ${formatUnsigned(snap.net.magnitude, "N")} ${dir.arrow}`;
    root.querySelector("#eq-detail").textContent = snap.balanced
      ? "F_net = 0 so a = 0. Velocity stays whatever it already is."
      : `Right ${formatSigned(snap.right, "N")} · Left ${formatSigned(snap.left, "N")} · Net ${formatSigned(snap.net.x, "N")}`;
    const rows = snap.enabled
      .map((f) => {
        const info = directionInfo(f.direction);
        return `<div><dt>${f.name}</dt><dd>${formatUnsigned(f.magnitude, "N")} ${info.arrow}</dd></div>`;
      })
      .join("");
    root.querySelector("#force-sum").innerHTML =
      rows + `<div><dt>Net</dt><dd>${formatSigned(snap.net.x, "N")}</dd></div>`;
    root.querySelector("#read-fnet").textContent = formatSigned(snap.net.x, "N");
    root.querySelector("#read-m").textContent = formatUnsigned(snap.mass, "kg");
    root.querySelector("#read-a").textContent = formatSigned(snap.ax, "m/s²");
    root.querySelector("#read-adir").textContent = Math.abs(snap.ax) < 0.05 ? "none (a = 0)" : `${dir.arrow} ${dir.name}`;
    root.querySelector("#read-t").textContent = formatUnsigned(snap.time, "s");
    root.querySelector("#read-motion").textContent = snap.motion;
    root.querySelector("#read-x").textContent = formatSigned(snap.x, "m");
    root.querySelector("#read-v").textContent = formatSigned(snap.vx, "m/s");
    teacher.refresh();
    syncInputs();
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
    state = createState({
      scenario: state.scenario,
      mass: state.mass,
      g: state.g,
      x0: state.x0,
      vx0: state.vx0,
      duration: state.duration,
      forces: state.schedule ? undefined : state.forces,
      schedule: state.schedule,
      includeVertical: state.includeVertical,
      showVectors: state.showVectors,
      showNetForce: state.showNetForce,
      showVelocity: state.showVelocity,
      showAccel: state.showAccel,
    });
    stepTo(state, t);
    paint();
  }

  const download = bindDownload(root, {
    filename: "ap-physics-1-2-5-trials",
    getTable() {
      return {
        title: "AP Physics 1 — 2.5 Newton's Second Law",
        columns: ["Trial", "Scenario", "Time (s)", "Mass (kg)", "Fnet,x (N)", "a_x (m/s²)", "v (m/s)", "State"],
        rows: trials.list().map((t) => [t.id, t.scenario, t.time, t.mass, t.Fnetx, t.ax, t.vx, t.motion]),
      };
    },
  });
  const unbindFullscreen = bindFullscreen(root.querySelector("#btn-fullscreen"));
  const unbindTutorial = bindTutorial(root, { simulationId: "2-5" });

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
  root.querySelector("#btn-check-25").addEventListener("click", () => {
    if (challenge.state.active && challenge.state.spec) {
      challenge.markAttempt(evaluateChallenge(snapshot(state), challenge.state.spec));
    }
    if (autoRecord && state.time > 1e-9) trials.record(trialSnapshot());
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
      if (invest === "force") applyInvestForce(10);
      else if (invest === "mass") applyInvestMass(5);
      else paint();
    });
  });
  investValues?.addEventListener("click", (event) => {
    const fBtn = event.target.closest("[data-invest-f]");
    const mBtn = event.target.closest("[data-invest-m]");
    if (fBtn) applyInvestForce(Number(fBtn.dataset.investF));
    if (mBtn) applyInvestMass(Number(mBtn.dataset.investM));
  });
  root.querySelectorAll("[data-speed]").forEach((btn) => {
    btn.addEventListener("click", () => {
      playback = Number(btn.dataset.speed);
      syncInputs();
    });
  });
  massInput.addEventListener("change", () => {
    setMass(state, readNumber(massInput, state.mass));
    paint();
  });
  xInput.addEventListener("change", () => {
    state.x0 = readNumber(xInput, state.x0);
    state = resetState(state);
    paint();
  });
  vInput.addEventListener("change", () => {
    state.vx0 = readNumber(vInput, state.vx0);
    state = resetState(state);
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
    state.showNetForce = event.target.checked;
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
  root.querySelector("#toggle-vertical").addEventListener("change", (event) => {
    setIncludeVertical(state, event.target.checked);
    paint();
  });
  root.querySelector("#toggle-inv-mass").addEventListener("change", (event) => {
    invertMass = event.target.checked;
    const title = graphHeight?.closest(".graph-wrap")?.querySelector("h2");
    if (title) title.textContent = invertMass ? "Your Trials · a vs. 1/m" : "Your Trials · a vs. m";
    drawCharts();
  });
  root.querySelector("#btn-add-force").addEventListener("click", () => {
    addForce(state, {
      type: root.querySelector("#add-type").value,
      magnitude: readNumber(root.querySelector("#add-mag"), 10),
      direction: Number(root.querySelector("#add-dir").value),
    });
    paint();
  });
  root.querySelector("#btn-clear-horiz")?.addEventListener("click", () => {
    disableHorizontalForces(state);
    paint();
  });
  root.querySelector("#btn-enable-friction").addEventListener("click", () => {
    enableFriction(state, true, 10);
    paint();
  });
  forceBody.addEventListener("change", (event) => {
    const row = event.target.closest("tr");
    if (!row) return;
    const id = row.dataset.forceId;
    if (event.target.matches("[data-enabled]")) setForce(state, id, { enabled: event.target.checked });
    if (event.target.matches("[data-mag]")) setForce(state, id, { magnitude: readNumber(event.target, 0) });
    if (event.target.matches("[data-dir]")) setForce(state, id, { direction: Number(event.target.value) });
    paint();
  });
  forceBody.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-remove]");
    if (!btn) return;
    const id = btn.closest("tr")?.dataset.forceId;
    if (id) removeForce(state, id);
    paint();
  });
  root.querySelector("#auto-record").addEventListener("change", (event) => {
    autoRecord = event.target.checked;
  });
  root.querySelector("#btn-record").addEventListener("click", () => {
    trials.record(trialSnapshot());
  });
  root.querySelector("#btn-clear").addEventListener("click", () => trials.clear());
  root.querySelectorAll("[data-graph]").forEach((box) => {
    box.addEventListener("change", () => {
      graphs[box.dataset.graph] = box.checked;
      const wrap = root.querySelector(`#wrap-${box.dataset.graph}`);
      if (wrap) wrap.hidden = !box.checked;
      drawLiveGraphs();
    });
  });

  function showHover(event, canvasEl) {
    if (running) return;
    const t = timeAtPointer(canvasEl, event, state.duration);
    if (t == null) return;
    const sample = sampleHistory(state, t);
    hover.textContent = `t = ${formatUnsigned(sample.time, "s")} · v = ${formatSigned(sample.vx, "m/s")} · a = ${formatSigned(sample.ax, "m/s²")} · F_net = ${formatSigned(sample.Fnetx, "N")}`;
  }

  [graphXt, graphVt, graphAt, graphFt].forEach((el) => {
    if (!el) return;
    el.addEventListener("click", (event) => {
      if (running) return;
      seek(timeAtPointer(event.currentTarget, event, state.duration));
    });
    el.addEventListener("mousemove", (event) => showHover(event, event.currentTarget));
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
