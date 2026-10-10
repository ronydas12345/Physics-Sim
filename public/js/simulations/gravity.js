/**
 * Simulation 2.6 — Gravitational force. Two masses, center-to-center r, equal-and-opposite Fg.
 */

import {
  DIST_TRIALS,
  DT,
  EARTH_RADIUS,
  G,
  INVSQ_TRIALS,
  MASS1_TRIALS,
  SCENARIOS,
  cameraObjectCount,
  createState,
  evaluateChallenge,
  formatCompact,
  generateChallenge,
  gravitationalField,
  liveState,
  predictedForce,
  reset as resetState,
  scaleDistance,
  scaleMass,
  setHeight,
  setMasses,
  setSeparation,
  snapshot,
  stepTo,
  teacherReport,
} from "/lib/gravity.js";
import { renderXYScatter } from "../graphs.js";
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

const COLOR_A = "#c45c26";
const COLOR_B = "#1c6b73";
const COLOR_F = "#7a3e08";
const COLOR_V = "#0f6c8a";
const COLOR_AVEC = "#c9a227";
const COLOR_FIELD = "#3d5a80";

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

function forcePx(mag, maxPx = 64) {
  if (!Number.isFinite(mag) || mag <= 0) return 0;
  const t = (Math.log10(mag) + 12) / 14;
  return Math.max(18, Math.min(maxPx, 18 + t * (maxPx - 18)));
}

function visRadius(state, which, live) {
  if (state.layout === "earth" || state.layout === "orbit") {
    return which === "A" ? EARTH_RADIUS * 0.92 : Math.max(live.r * 0.025, EARTH_RADIUS * 0.04);
  }
  return Math.min(live.r * 0.12, 0.7);
}

export function mountGravity(root) {
  const canvas = root.querySelector("#axis-canvas");
  const graphRange = root.querySelector("#graph-range");
  const graphHeight = root.querySelector("#graph-height");
  const trialBody = root.querySelector("#trial-body");
  const m1Input = root.querySelector("#m1-input");
  const m2Input = root.querySelector("#m2-input");
  const rInput = root.querySelector("#r-input");
  const hInput = root.querySelector("#h-input");
  const extraInput = root.querySelector("#extra-a");
  const investValues = root.querySelector("#invest-values");
  const investHelp = root.querySelector("#invest-help");
  const scaleRatio = root.querySelector("#scale-ratio");

  let state = createState({ scenario: "basic" });
  let running = false;
  let raf = 0;
  let lastStamp = 0;
  let carry = 0;
  let playback = 1;
  let autoRecord = false;
  let camera;
  let lastCameraRange = { lo: -8, hi: 8 };
  let activeTab = "lab";
  let invest = "off";
  let lastFg = liveState(state).magnitude;
  let identityOn = () => false;

  const trials = createTrialBook({
    columns: 6,
    renderRow: (t) => `<tr>
      <td>${t.id}</td>
      <td>${formatCompact(t.m1, "", state.sci)}</td>
      <td>${formatCompact(t.m2, "", state.sci)}</td>
      <td>${formatCompact(t.r, "", state.sci)}</td>
      <td>${formatCompact(t.Fg, "", state.sci)}</td>
      <td>${formatCompact(t.invsq, "", true)}</td>
    </tr>`,
    onChange() {
      trials.render(trialBody);
      drawCharts();
      download.sync();
    },
  });

  function trialSnapshot() {
    const snap = snapshot(state);
    return { m1: snap.m1, m2: snap.m2, r: snap.r, Fg: snap.Fg, invsq: snap.invsq, g: snap.g };
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
    if (invest === "m1") return { xKey: "m1", yKey: "Fg", xLabel: "m1 (kg)", yLabel: "Fg (N)", color: COLOR_A };
    if (invest === "m2" || invest === "earthm") return { xKey: "m2", yKey: "Fg", xLabel: "m2 (kg)", yLabel: "Fg (N)", color: COLOR_B };
    if (invest === "field") return { xKey: "r", yKey: "g", xLabel: "r (m)", yLabel: "g (m/s²)", color: COLOR_FIELD };
    if (invest === "invsq") return { xKey: "invsq", yKey: "Fg", xLabel: "1/r² (1/m²)", yLabel: "Fg (N)", color: COLOR_F };
    return { xKey: "r", yKey: "Fg", xLabel: "r (m)", yLabel: "Fg (N)", color: COLOR_F };
  }

  function drawCharts() {
    if (activeTab !== "lab") return;
    const list = trials.list();
    const left = graphKeys();
    const identity = identityOn() && (invest === "invsq" || invest === "off")
      ? { yOfX: (inv) => G * state.m1 * state.m2 * inv, label: "Fg = G m1 m2 (1/r²)" }
      : identityOn() && (invest === "m1")
        ? { yOfX: (m) => predictedForce({ m1: m, m2: state.m2, r: liveState(state).r }), label: "Fg ∝ m1" }
        : identityOn() && invest === "field"
          ? { yOfX: (r) => gravitationalField(state.m1, r), label: "g = GM/r²" }
          : null;
    renderXYScatter(graphRange, list, {
      ...left,
      fitYName: left.yKey,
      fitXName: left.xKey,
      identity,
    });
    renderXYScatter(graphHeight, list, {
      xKey: "invsq",
      yKey: "Fg",
      xLabel: "1/r² (1/m²)",
      yLabel: "Fg (N)",
      color: COLOR_B,
      fitYName: "Fg",
      fitXName: "1/r²",
      identity: identityOn()
        ? { yOfX: (inv) => G * (list[0]?.m1 ?? state.m1) * (list[0]?.m2 ?? state.m2) * inv, label: "slope = G m1 m2" }
        : null,
    });
    const titles = root.querySelectorAll("#graph-panel h2");
    if (titles[0]) titles[0].textContent = `Your Trials · ${left.yLabel.split(" ")[0]} vs. ${left.xKey}`;
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
      feedback.textContent = "Predict using masses and center-to-center r. The solution stays hidden until you check.";
      return;
    }
    if (challengeState.revealed) {
      feedback.textContent = challengeState.spec.solutionHint;
      return;
    }
    feedback.textContent = challengeState.last.ok
      ? "That matches the gravitational interaction."
      : "Not yet. Use Fg = G m1 m2 / r², with r between centers.";
  }

  function applyScenario(params) {
    state = createState({
      ...params,
      showVelocity: params.showVelocity ?? state.showVelocity,
      showAccel: params.showAccel ?? state.showAccel,
      showField: params.showField ?? state.showField,
      sci: state.sci,
      extraA: params.extraA ?? 0,
      duration: params.duration ?? state.duration,
      motion: params.motion ?? state.motion,
    });
    lastFg = liveState(state).magnitude;
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
      m1: MASS1_TRIALS.map((v) => `<button type="button" class="chip" data-invest-m1="${v}">m1 = ${v} kg</button>`).join(""),
      m2: MASS1_TRIALS.map((v) => `<button type="button" class="chip" data-invest-m2="${v}">m2 = ${v} kg</button>`).join(""),
      r: DIST_TRIALS.map((v) => `<button type="button" class="chip" data-invest-r="${v}">r = ${v} m</button>`).join(""),
      invsq: INVSQ_TRIALS.map((v) => `<button type="button" class="chip" data-invest-r="${v}">r = ${v} m</button>`).join(""),
      field: [EARTH_RADIUS, EARTH_RADIUS + 1e5, EARTH_RADIUS + 1e6, 2 * EARTH_RADIUS].map(
        (v) => `<button type="button" class="chip" data-invest-r="${v}">r = ${formatCompact(v, "m", true)}</button>`,
      ).join(""),
      earthm: [1, 2, 5, 10].map((v) => `<button type="button" class="chip" data-invest-m2="${v}">m = ${v} kg</button>`).join(""),
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
        m1: "Hold m2 = 1000 kg and r = 10 m. Change m1.",
        m2: "Hold m1 = 1000 kg and r = 10 m. Change m2.",
        r: "Hold both masses at 1000 kg. Change r. The Fg vs r graph should curve.",
        invsq: "Hold both masses at 1000 kg. Use r = 1, 2, 4, 8 m and compare Fg vs 1/r².",
        field: "Earth is the source. Change r and watch g, not just Fg.",
        earthm: "Stay at Earth’s surface. Change the test mass. Fg should change; g should not.",
      };
      investHelp.textContent = tips[invest] || "";
    }
  }

  function applyInvestPreset() {
    if (invest === "m1") applyScenario({ scenario: "basic", m1: 1000, m2: 1000, r: 10, layout: "line" });
    if (invest === "m2") applyScenario({ scenario: "basic", m1: 1000, m2: 1000, r: 10, layout: "line" });
    if (invest === "r" || invest === "invsq") applyScenario({ scenario: "basic", m1: 1000, m2: 1000, r: 1, layout: "line" });
    if (invest === "field") applyScenario({ scenario: "earth-surface" });
    if (invest === "earthm") applyScenario({ scenario: "earth-surface", m2: 1 });
  }

  function worldView(live) {
    const { cssW, cssH, dpr } = sizeCanvas(canvas);
    const pad = { l: 48, r: 36, t: 44, b: 36 };
    const plotW = Math.max(1, cssW - pad.l - pad.r);
    const plotH = Math.max(1, cssH - pad.t - pad.b);
    const xs = [state.A.x, state.B.x];
    const ys = [state.A.y, state.B.y];
    const extras = { pad: Math.max(live.r * 0.2, state.layout === "line" ? 3 : live.r * 0.15), minSpan: state.layout === "line" ? 16 : live.r * 0.5, plotPx: plotW, screenPadPx: 28 };
    const xr = cameraRange(xs, { ...extras, ...camera.options() });
    lastCameraRange = xr;
    const yr = cameraRange(ys, { mode: state.layout === "orbit" ? CAMERA.FIT : CAMERA.ORIGIN, pad: extras.pad, minSpan: xr.span * 0.35 });
    const xScale = cameraScale(xr.span, plotW);
    const yScale = cameraScale(Math.max(yr.span, xr.span * 0.4), plotH);
    const scale = state.layout === "orbit" ? Math.min(xScale, yScale) : xScale;
    const xOf = (x) => pad.l + (x - xr.lo) * (state.layout === "orbit" ? scale : xScale);
    const midY = pad.t + plotH * (state.layout === "orbit" ? 0.5 : 0.58);
    const yOf = (y) => (state.layout === "orbit" ? pad.t + plotH / 2 - (y - (yr.lo + yr.hi) / 2) * scale : midY - y * scale);
    return { cssW, cssH, dpr, xOf, yOf, midY, xr };
  }

  function renderScene() {
    const live = liveState(state);
    const { cssW, cssH, dpr, xOf, yOf, xr } = worldView(live);
    const ctx = canvas.getContext("2d");
    const theme = themeCanvas();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = theme.fill;
    ctx.fillRect(0, 0, cssW, cssH);

    if (state.layout === "orbit" && state.trail.length > 1) {
      ctx.strokeStyle = COLOR_B;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.4;
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

    if (state.layout !== "orbit") {
      ctx.strokeStyle = theme.ink;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xOf(xr.lo), yOf(0));
      ctx.lineTo(xOf(xr.hi), yOf(0));
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const rA = visRadius(state, "A", live);
    const rB = visRadius(state, "B", live);
    const ax = xOf(state.A.x);
    const ay = yOf(state.A.y);
    const bx = xOf(state.B.x);
    const by = yOf(state.B.y);
    const pxA = Math.max(8, Math.abs(xOf(state.A.x + rA) - ax));
    const pxB = Math.max(7, Math.abs(xOf(state.B.x + rB) - bx));

    if (state.showField) {
      const source = state.m1 >= state.m2 ? state.A : state.B;
      const other = state.m1 >= state.m2 ? state.B : state.A;
      const M = state.m1 >= state.m2 ? state.m1 : state.m2;
      for (let i = 1; i <= 6; i += 1) {
        const t = i / 7;
        const x = source.x + (other.x - source.x) * t;
        const y = source.y + (other.y - source.y) * t;
        const px = xOf(x);
        const py = yOf(y);
        const towardX = xOf(source.x) - px;
        const towardY = yOf(source.y) - py;
        const len = Math.hypot(towardX, towardY) || 1;
        const gHere = gravitationalField(M, Math.hypot(x - source.x, y - source.y));
        const L = 10 + forcePx(gHere, 28);
        ctx.globalAlpha = 0.35 + 0.5 * (1 - t);
        drawArrow(ctx, px, py, px + (towardX / len) * L, py + (towardY / len) * L, COLOR_FIELD, 2);
      }
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = COLOR_A;
    ctx.beginPath();
    ctx.arc(ax, ay, pxA, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLOR_B;
    ctx.beginPath();
    ctx.arc(bx, by, pxB, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = theme.fill;
    ctx.beginPath();
    ctx.arc(ax, ay, 2.4, 0, Math.PI * 2);
    ctx.arc(bx, by, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = theme.ink;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = theme.ink;
    ctx.font = "600 12px Figtree, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`r = ${formatCompact(live.r, "m", state.sci)}`, (ax + bx) / 2, Math.min(ay, by) - 14);

    const fLen = forcePx(live.magnitude);
    const ux = (bx - ax) / (Math.hypot(bx - ax, by - ay) || 1);
    const uy = (by - ay) / (Math.hypot(bx - ax, by - ay) || 1);
    drawArrow(ctx, ax, ay, ax + ux * fLen, ay + uy * fLen, COLOR_F, 3);
    drawArrow(ctx, bx, by, bx - ux * fLen, by - uy * fLen, COLOR_F, 3);
    ctx.fillStyle = COLOR_F;
    ctx.font = "700 11px Figtree, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Fg ${formatCompact(live.magnitude, "N", state.sci)}`, ax + ux * fLen + 6, ay + uy * fLen - 6);

    function velArrow(body, px, py, fallback) {
      const vx = body.vx || fallback.x;
      const vy = body.vy || fallback.y;
      const tipX = xOf(body.x + vx) - px;
      const tipY = yOf(body.y + vy) - py;
      const s = Math.hypot(tipX, tipY);
      if (s < 1e-6) return;
      const L = 32;
      drawArrow(ctx, px, py, px + (tipX / s) * L, py + (tipY / s) * L, COLOR_V, 2);
    }
    if (state.showVelocity) {
      velArrow(state.A, ax, ay, live.aA);
      velArrow(state.B, bx, by, live.aB);
    }
    if (state.showAccel) {
      drawArrow(ctx, ax, ay + pxA + 10, ax + ux * 26, ay + uy * 26 + pxA + 10, COLOR_AVEC, 2);
      drawArrow(ctx, bx, by + pxB + 10, bx - ux * 26, by - uy * 26 + pxB + 10, COLOR_AVEC, 2);
    }

    ctx.fillStyle = theme.ink;
    ctx.font = "700 13px Figtree, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("A", ax, ay + pxA + 28);
    ctx.fillText("B", bx, by + pxB + 28);
    ctx.font = "600 11px Figtree, sans-serif";
    ctx.fillText(formatCompact(state.m1, "kg", state.sci), ax, ay - pxA - 8);
    ctx.fillText(formatCompact(state.m2, "kg", state.sci), bx, by - pxB - 8);

    const scen = SCENARIOS.find((s) => s.id === state.scenario);
    ctx.font = "700 15px Figtree, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`${scen?.label || "Gravity"} · t = ${state.time.toFixed(2)} s`, cssW / 2, 8);
  }

  function syncInputs() {
    const live = liveState(state);
    if (document.activeElement !== m1Input) m1Input.value = String(state.m1);
    if (document.activeElement !== m2Input) m2Input.value = String(state.m2);
    if (document.activeElement !== rInput) rInput.value = String(live.r);
    if (document.activeElement !== hInput) hInput.value = String(state.h);
    if (document.activeElement !== extraInput) extraInput.value = String(state.extraA);
    root.querySelector("#toggle-motion").checked = state.motion;
    root.querySelector("#toggle-velocity").checked = state.showVelocity;
    root.querySelector("#toggle-accel").checked = state.showAccel;
    root.querySelector("#toggle-field").checked = state.showField;
    root.querySelector("#toggle-sci").checked = state.sci;
    root.querySelectorAll("[data-scenario]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.scenario === state.scenario);
    });
    root.querySelectorAll("[data-speed]").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.speed) === playback);
    });
    root.querySelector("#btn-pause").disabled = !running;
    syncInvest();
  }

  function syncReadouts() {
    const live = liveState(state);
    const sci = state.sci;
    root.querySelector("#eq-net").textContent = `Fg = ${formatCompact(live.magnitude, "N", sci)}`;
    root.querySelector("#eq-sub").innerHTML =
      `F<sub>g</sub> = (${G}) (${formatCompact(state.m1, "", sci)}) (${formatCompact(state.m2, "", sci)}) / (${formatCompact(live.r, "", sci)})²`;
    root.querySelector("#read-fa").textContent = `${formatCompact(live.onA.x, "N", sci)} ${live.dirA}`;
    root.querySelector("#read-fb").textContent = `${formatCompact(live.onB.x, "N", sci)} ${live.dirB}`;
    root.querySelector("#read-equal").textContent = Math.abs(Math.abs(live.onA.x) - Math.abs(live.onB.x)) < 1e-18 * Math.max(1, live.magnitude) ? "yes" : "check";
    root.querySelector("#read-dirs").textContent = "toward each other";
    root.querySelector("#read-aa").textContent = formatCompact(live.aA.x, "m/s²", sci);
    root.querySelector("#read-ab").textContent = formatCompact(live.aB.x, "m/s²", sci);
    root.querySelector("#read-g").textContent = formatCompact(live.g, "m/s²", sci);
    root.querySelector("#read-fgm").textContent = formatCompact(live.gTest, "m/s²", sci);
    teacher.refresh();
  }

  function paint() {
    renderScene();
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
    state.motion = true;
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
    lastFg = liveState(state).magnitude;
    paint();
  }

  const download = bindDownload(root, {
    filename: "ap-physics-1-2-6-trials",
    getTable() {
      return {
        title: "AP Physics 1 — 2.6 Gravitational Force",
        columns: ["Trial", "m1 (kg)", "m2 (kg)", "r (m)", "Fg (N)", "1/r² (1/m²)"],
        rows: trials.list().map((t) => [t.id, t.m1, t.m2, t.r, t.Fg, t.invsq]),
      };
    },
  });
  const unbindFullscreen = bindFullscreen(root.querySelector("#btn-fullscreen"));
  const unbindTutorial = bindTutorial(root, { simulationId: "2-6" });

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
    paint();
  });
  root.querySelector("#btn-check-26").addEventListener("click", () => {
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
      if (invest !== "off") applyInvestPreset();
      else paint();
    });
  });
  investValues?.addEventListener("click", (event) => {
    const m1b = event.target.closest("[data-invest-m1]");
    const m2b = event.target.closest("[data-invest-m2]");
    const rb = event.target.closest("[data-invest-r]");
    if (m1b) {
      setMasses(state, Number(m1b.dataset.investM1), state.m2);
      paint();
    }
    if (m2b) {
      setMasses(state, state.m1, Number(m2b.dataset.investM2));
      paint();
    }
    if (rb) {
      setSeparation(state, Number(rb.dataset.investR));
      paint();
    }
  });
  root.querySelectorAll("[data-speed]").forEach((btn) => {
    btn.addEventListener("click", () => {
      playback = Number(btn.dataset.speed);
      syncInputs();
    });
  });
  root.querySelectorAll("[data-scale]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const before = liveState(state).magnitude;
      const key = btn.dataset.scale;
      if (key === "m1-2") scaleMass(state, "m1", 2);
      if (key === "m2-2") scaleMass(state, "m2", 2);
      if (key === "both-2") scaleMass(state, "both", 2);
      if (key === "r-2") scaleDistance(state, 2);
      if (key === "r-3") scaleDistance(state, 3);
      if (key === "r-0.5") scaleDistance(state, 0.5);
      if (key === "r-4") scaleDistance(state, 4);
      const after = liveState(state).magnitude;
      if (scaleRatio) scaleRatio.textContent = `Force ratio after last scale: ${formatCompact(after / before, "", true)}  (${formatCompact(before, "N", state.sci)} → ${formatCompact(after, "N", state.sci)})`;
      lastFg = after;
      paint();
    });
  });
  root.querySelectorAll("[data-height]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setHeight(state, Number(btn.dataset.height));
      state.scenario = Number(btn.dataset.height) > 0 ? "earth-altitude" : "earth-surface";
      paint();
    });
  });
  m1Input.addEventListener("change", () => {
    setMasses(state, readNumber(m1Input, state.m1), state.m2);
    paint();
  });
  m2Input.addEventListener("change", () => {
    setMasses(state, state.m1, readNumber(m2Input, state.m2));
    paint();
  });
  rInput.addEventListener("change", () => {
    setSeparation(state, readNumber(rInput, liveState(state).r));
    paint();
  });
  hInput.addEventListener("change", () => {
    setHeight(state, readNumber(hInput, state.h));
    paint();
  });
  extraInput.addEventListener("change", () => {
    state.extraA = readNumber(extraInput, 0);
    paint();
  });
  root.querySelector("#toggle-motion").addEventListener("change", (event) => {
    state.motion = event.target.checked;
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
  root.querySelector("#toggle-field").addEventListener("change", (event) => {
    state.showField = event.target.checked;
    paint();
  });
  root.querySelector("#toggle-sci").addEventListener("change", (event) => {
    state.sci = event.target.checked;
    paint();
  });
  root.querySelector("#auto-record").addEventListener("change", (event) => {
    autoRecord = event.target.checked;
  });
  root.querySelector("#btn-record").addEventListener("click", () => trials.record(trialSnapshot()));
  root.querySelector("#btn-clear").addEventListener("click", () => trials.clear());

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
