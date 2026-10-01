import {
  DIAGRAM_DT,
  DT,
  PLAYBACK_SPEEDS,
  SCENARIOS,
  addExtra,
  createState,
  directionInfo,
  evaluateChallenge,
  formatSigned,
  formatUnsigned,
  generateChallenge,
  historySeries,
  liveState,
  motionDiagramSamples,
  netDirection,
  pairCriteria,
  removeExtra,
  reset as resetState,
  setInteraction,
  setMass,
  setSeparation,
  snapshot,
  stepTo,
  teacherReport,
} from "/lib/thirdlaw.js";
import { scaleForceMagnitude } from "/lib/forces.js";
import { renderTimeSeries, renderXYScatter, timeAtPointer } from "../graphs.js";
import {
  bindChallenge,
  bindDownload,
  bindFullscreen,
  bindIdentityToggle,
  bindLabTabs,
  bindTeacher,
  createTrialBook,
} from "../platform/lab-kit.js";
import { bindTutorial } from "../platform/tutorial.js";
import { themeCanvas } from "../platform/theme.js";

const COLOR_A = "#c45c26";
const COLOR_B = "#1c6b73";
const VIEW_SPAN_M = 16;

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

function panRange(positions, span, edge, preferredLo) {
  const xs = positions.filter((x) => Number.isFinite(x));
  const minP = xs.length ? Math.min(...xs) : 0;
  const maxP = xs.length ? Math.max(...xs) : 0;
  let lo = preferredLo;
  if (minP < lo + edge) lo = minP - edge;
  if (maxP > lo + span - edge) lo = Math.max(lo, maxP + edge - span);
  if (maxP - minP + 2 * edge > span) lo = (minP + maxP) / 2 - span / 2;
  return { lo, hi: lo + span };
}

function worldView(canvas, live) {
  const { cssW, cssH, dpr } = sizeCanvas(canvas);
  const vertical = Math.abs(live.A.y - live.B.y) > Math.abs(live.A.x - live.B.x);
  const pad = { l: 48, r: 28, t: 40, b: 34 };
  const plotW = Math.max(1, cssW - pad.l - pad.r);
  const plotH = Math.max(1, cssH - pad.t - pad.b);
  if (vertical) {
    const span = 12;
    const { lo, hi } = panRange([live.A.y, live.B.y], span, 3, -6);
    const scale = plotH / span;
    const originX = cssW / 2;
    const originY = pad.t + hi * scale;
    return { cssW, cssH, dpr, pad, scale, originX, originY, lo, hi, vertical, groundY: cssH - pad.b };
  }
  const { lo, hi } = panRange([live.A.x, live.B.x], VIEW_SPAN_M, 3.5, -6);
  const scale = plotW / VIEW_SPAN_M;
  const originX = pad.l + (0 - lo) * scale;
  const groundY = cssH - pad.b;
  return {
    cssW,
    cssH,
    dpr,
    pad,
    scale,
    originX,
    originY: groundY,
    lo,
    hi,
    vertical: false,
    groundY,
  };
}

function xOf(x, view) {
  return view.originX + x * view.scale;
}

function yOf(y, view) {
  return view.vertical ? view.originY - y * view.scale : view.groundY - 32;
}

function drawBody(ctx, x, y, color, label, mass) {
  const r = Math.max(18, Math.min(36, 14 + 6 * Math.sqrt(Math.max(mass, 0.1))));
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.strokeStyle = "#1b2430";
  ctx.lineWidth = 2;
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff7ef";
  ctx.font = "700 12px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y);
  return r;
}

function drawForceOn(ctx, ox, oy, force, color) {
  const len = scaleForceMagnitude(force.magnitude);
  const rad = (force.direction * Math.PI) / 180;
  const x2 = ox + len * Math.cos(rad);
  const y2 = oy - len * Math.sin(rad);
  drawArrow(ctx, ox, oy, x2, y2, color, 3);
  ctx.fillStyle = color;
  ctx.font = "700 11px Figtree, sans-serif";
  ctx.textAlign = x2 >= ox ? "left" : "right";
  ctx.textBaseline = y2 <= oy ? "bottom" : "top";
  const info = directionInfo(force.direction);
  ctx.fillText(`${force.label} ${formatUnsigned(force.magnitude, "N")} ${info.arrow}`, x2 + (x2 >= ox ? 6 : -6), y2);
}

function renderScene(canvas, state) {
  const live = liveState(state);
  const view = worldView(canvas, live);
  const { cssW, cssH, dpr, originX, groundY, lo, hi, scale, vertical } = view;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  const sky = ctx.createLinearGradient(0, 0, 0, cssH);
  sky.addColorStop(0, "#d7ebf7");
  sky.addColorStop(1, "#f4efe6");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, cssW, cssH);

  if (state.visual?.floor && !vertical) {
    ctx.fillStyle = "#5c4634";
    ctx.fillRect(0, groundY, cssW, cssH - groundY);
    ctx.fillStyle = "#6f8f63";
    ctx.fillRect(0, groundY, cssW, 10);
    ctx.strokeStyle = "rgba(27,36,48,0.7)";
    ctx.fillStyle = "#1b2430";
    ctx.lineWidth = 1.3;
    ctx.font = "12px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let wx = Math.ceil(lo); wx <= Math.floor(hi); wx += 1) {
      const x = xOf(wx, view);
      const major = wx % 5 === 0 || wx === 0;
      ctx.beginPath();
      ctx.moveTo(x, groundY - (major ? 12 : 6));
      ctx.lineTo(x, groundY + (major ? 8 : 4));
      ctx.stroke();
      if (wx % 5 === 0 || wx === 0) ctx.fillText(`${wx} m`, x, groundY + 12);
    }
  }

  const ax = xOf(live.A.x, view);
  const ay = vertical ? yOf(live.A.y, view) : yOf(0, view);
  const bx = xOf(live.B.x, view);
  const by = vertical ? yOf(live.B.y, view) : yOf(0, view);

  ctx.save();
  ctx.strokeStyle = "rgba(27,36,48,0.35)";
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.restore();
  if (state.visual?.connector === "rope") {
    ctx.strokeStyle = "#5c4634";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }

  drawBody(ctx, ax, ay, COLOR_A, live.A.name, live.A.mass);
  drawBody(ctx, bx, by, COLOR_B, live.B.name, live.B.mass);
  drawForceOn(ctx, ax, ay, live.pair.forceBonA, COLOR_A);
  drawForceOn(ctx, bx, by, live.pair.forceAonB, COLOR_B);
  if (state.showNetForce) {
    if (live.A.net.magnitude > 0.05) {
      const len = scaleForceMagnitude(live.A.net.magnitude, 56);
      const rad = (live.A.net.direction * Math.PI) / 180;
      ctx.save();
      ctx.setLineDash([5, 4]);
      drawArrow(ctx, ax, ay, ax + len * Math.cos(rad), ay - len * Math.sin(rad), "#1b2430", 2);
      ctx.restore();
    }
    if (live.B.net.magnitude > 0.05) {
      const len = scaleForceMagnitude(live.B.net.magnitude, 56);
      const rad = (live.B.net.direction * Math.PI) / 180;
      ctx.save();
      ctx.setLineDash([5, 4]);
      drawArrow(ctx, bx, by, bx + len * Math.cos(rad), by - len * Math.sin(rad), "#1b2430", 2);
      ctx.restore();
    }
  }

  ctx.fillStyle = "#1b2430";
  ctx.font = "700 15px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const scen = SCENARIOS.find((s) => s.id === state.scenario);
  ctx.fillText(`${scen?.label || "Interaction"} · ground frame · t = ${state.time.toFixed(2)} s`, cssW / 2, 8);
  ctx.font = "600 11px Figtree, sans-serif";
  ctx.fillStyle = "#4d5a68";
  ctx.fillText("Arrows start on the object that experiences the force.", cssW / 2, 26);
}

function renderObjectFbd(canvas, state, objectId, color) {
  const { cssW, cssH, dpr } = sizeCanvas(canvas);
  const ctx = canvas.getContext("2d");
  const theme = themeCanvas();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = theme.fill;
  ctx.fillRect(0, 0, cssW, cssH);
  const live = liveState(state);
  const obj = live[objectId];
  const cx = cssW / 2;
  const cy = cssH / 2 + 8;
  ctx.strokeStyle = theme.line;
  ctx.beginPath();
  ctx.moveTo(24, cy);
  ctx.lineTo(cssW - 24, cy);
  ctx.moveTo(cx, cssH - 18);
  ctx.lineTo(cx, 22);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = theme.ink;
  ctx.font = "700 12px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(`${obj.name} FBD`, cx, cy - 14);
  const forces = objectId === "A" ? [live.pair.forceBonA, ...state.extras.filter((f) => f.target === "A")] : [live.pair.forceAonB, ...state.extras.filter((f) => f.target === "B")];
  for (const force of forces) {
    drawForceOn(ctx, cx, cy, force, objectId === "A" ? COLOR_A : COLOR_B);
  }
  if (state.showNetForce && obj.net.magnitude > 0.05) {
    const len = scaleForceMagnitude(obj.net.magnitude, 56);
    const rad = (obj.net.direction * Math.PI) / 180;
    ctx.save();
    ctx.setLineDash([5, 4]);
    drawArrow(ctx, cx, cy, cx + len * Math.cos(rad), cy - len * Math.sin(rad), theme.ink, 2);
    ctx.restore();
    ctx.fillStyle = theme.ink;
    ctx.font = "600 10px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const info = netDirection(obj.net);
    ctx.fillText(`Fnet ${formatUnsigned(obj.net.magnitude, "N")} ${info.arrow}`, cx, cy + 18);
  }
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
  const dots = motionDiagramSamples(state, DIAGRAM_DT);
  const xs = dots.flatMap((d) => [d.xA, d.xB]);
  xs.push(live.A.x, live.B.x, 0);
  const min = Math.min(-8, ...xs) - 2;
  const max = Math.max(8, ...xs) + 2;
  const pad = 36;
  const scale = (cssW - pad * 2) / Math.max(max - min, 1);
  const xAt = (x) => pad + (x - min) * scale;
  const yA = cssH * 0.38;
  const yB = cssH * 0.68;
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, yA);
  ctx.lineTo(cssW - pad, yA);
  ctx.moveTo(pad, yB);
  ctx.lineTo(cssW - pad, yB);
  ctx.stroke();
  dots.forEach((dot, i) => {
    const last = i === dots.length - 1;
    ctx.fillStyle = last ? COLOR_A : "rgba(196,92,38,0.45)";
    ctx.beginPath();
    ctx.arc(xAt(dot.xA), yA, last ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = last ? COLOR_B : "rgba(28,107,115,0.45)";
    ctx.beginPath();
    ctx.arc(xAt(dot.xB), yB, last ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = theme.muted;
  ctx.font = "600 12px Figtree, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Motion diagram  ·  Δt = ${DIAGRAM_DT.toFixed(2)} s`, pad, 16);
}

export function mountThirdLaw(root) {
  const canvas = root.querySelector("#axis-canvas");
  const fbdA = root.querySelector("#fbd-a");
  const fbdB = root.querySelector("#fbd-b");
  const diagram = root.querySelector("#diagram-canvas");
  const graphXt = root.querySelector("#graph-xt");
  const graphVt = root.querySelector("#graph-vt");
  const graphRange = root.querySelector("#graph-range");
  const graphHeight = root.querySelector("#graph-height");
  const trialBody = root.querySelector("#trial-body");
  const massA = root.querySelector("#mass-a");
  const massB = root.querySelector("#mass-b");
  const forceInput = root.querySelector("#force-input");
  const dirInput = root.querySelector("#dir-input");
  const distInput = root.querySelector("#dist-input");
  const tInput = root.querySelector("#duration-input");
  const extraMag = root.querySelector("#extra-mag");
  const extraDir = root.querySelector("#extra-dir");
  const extraTarget = root.querySelector("#extra-target");

  let state = createState();
  let running = false;
  let raf = 0;
  let lastStamp = 0;
  let carry = 0;
  let playback = 1;
  let autoRecord = false;
  let activeTab = "lab";
  let graphs = { x: true, v: true };
  let identityOn = () => false;
  let selectedChoice = null;

  const trials = createTrialBook({
    columns: 8,
    renderRow: (t) => `<tr>
      <td>${t.id}</td>
      <td>${t.scenario}</td>
      <td>${formatUnsigned(t.FAonB, "N")}</td>
      <td>${formatUnsigned(t.FBonA, "N")}</td>
      <td>${formatUnsigned(t.mA, "kg")}</td>
      <td>${formatUnsigned(t.mB, "kg")}</td>
      <td>${formatUnsigned(t.aA, "m/s²")}</td>
      <td>${formatUnsigned(t.aB, "m/s²")}</td>
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
      FAonB: snap.forceAonB.magnitude,
      FBonA: snap.forceBonA.magnitude,
      mA: snap.A.mass,
      mB: snap.B.mass,
      aA: Math.hypot(snap.A.ax, snap.A.ay),
      aB: Math.hypot(snap.B.ax, snap.B.ay),
      invMA: 1 / Math.max(snap.A.mass, 1e-9),
    };
  }

  function drawLiveGraphs() {
    if (activeTab !== "lab") return;
    const series = historySeries(state);
    if (graphs.x) {
      renderTimeSeries(graphXt, series, {
        duration: state.duration,
        now: state.time,
        xLabel: "t (s)",
        yLabel: "F_x (N)",
        series: [
          { yKey: "FAonBx", color: COLOR_B, label: "A on B" },
          { yKey: "FBonAx", color: COLOR_A, label: "B on A" },
        ],
      });
    }
    if (graphs.v) {
      renderTimeSeries(graphVt, series, {
        duration: state.duration,
        now: state.time,
        xLabel: "t (s)",
        yLabel: "a (m/s²)",
        series: [
          { yKey: "axA", color: COLOR_A, label: "a_A" },
          { yKey: "axB", color: COLOR_B, label: "a_B" },
        ],
      });
    }
  }

  function drawCharts() {
    const pts = trials.list();
    renderXYScatter(graphRange, pts.map((t) => ({ id: t.id, x: t.invMA, y: t.aA })), {
      xLabel: "1 / m_A (1/kg)",
      yLabel: "|a_A| (m/s²)",
      color: COLOR_A,
      fitYName: "|a_A|",
      fitXName: "1/m_A",
      identity: identityOn()
        ? { yOfX: (inv) => snapshot(state).forceAonB.magnitude * inv, label: "|a_A| = F / m_A", xMin: 0, xMax: 2 }
        : null,
    });
    renderXYScatter(graphHeight, pts.map((t) => ({ id: t.id, x: t.FAonB, y: t.FBonA })), {
      xLabel: "A on B (N)",
      yLabel: "B on A (N)",
      color: COLOR_B,
      fitYName: "B on A",
      fitXName: "A on B",
      identity: identityOn() ? { yOfX: (F) => F, label: "F_BonA = F_AonB", xMin: 0, xMax: 80 } : null,
    });
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
    let choices = host.querySelector("#challenge-choices");
    if (!choices) {
      choices = document.createElement("div");
      choices.id = "challenge-choices";
      choices.className = "presets challenge-choices";
      host.querySelector("#challenge-q").after(choices);
    }
    selectedChoice = null;
    if (spec.options) {
      choices.hidden = false;
      choices.innerHTML = spec.options
        .map((opt) => `<button type="button" class="chip" data-choice="${opt.id}">${opt.label}</button>`)
        .join("");
    } else {
      choices.hidden = true;
      choices.innerHTML = "";
    }
  }

  function describeFeedback(host, challengeState) {
    const reveal = host.querySelector("#btn-reveal");
    const feedback = host.querySelector("#challenge-feedback");
    reveal.disabled = !challengeState.attempted;
    if (!challengeState.last) {
      feedback.textContent = "A third-law pair is equal, opposite, and on two different objects.";
      return;
    }
    if (challengeState.revealed) {
      feedback.textContent = challengeState.spec.solutionHint;
      return;
    }
    feedback.textContent = challengeState.last.ok
      ? "Correct. The pair is one interaction, not two forces on the same free-body diagram."
      : "Not yet. Check source, target, and whether both forces belong on the same object.";
  }

  function applyScenario(params) {
    state = createState({
      ...params,
      dynamicMode: params.dynamicMode ?? state.dynamicMode,
      showNetForce: params.showNetForce ?? state.showNetForce,
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

  function syncInputs() {
    const busy = running;
    const snap = snapshot(state);
    if (document.activeElement !== massA) massA.value = String(state.A.mass);
    if (document.activeElement !== massB) massB.value = String(state.B.mass);
    if (document.activeElement !== forceInput) forceInput.value = String(snap.forceAonB.magnitude);
    if (document.activeElement !== distInput) distInput.value = String(Number(snap.r.toFixed(2)));
    if (document.activeElement !== tInput) tInput.value = String(state.duration);
    dirInput.value = String(state.interaction.direction);
    root.querySelector("#toggle-dynamic").checked = state.dynamicMode;
    root.querySelector("#toggle-net").checked = state.showNetForce;
    const gravity = state.interaction.type === "gravity";
    forceInput.disabled = busy || gravity;
    distInput.disabled = busy || !gravity;
    SCENARIOS.forEach((scen) => {
      root.querySelector(`[data-scenario="${scen.id}"]`)?.classList.toggle("active", state.scenario === scen.id);
    });
    PLAYBACK_SPEEDS.forEach((speed) => {
      root.querySelector(`[data-speed="${speed}"]`)?.classList.toggle("active", speed === playback);
    });
    [massA, massB, dirInput, tInput, extraMag, extraDir, extraTarget].forEach((el) => {
      if (el) el.disabled = busy;
    });
    root.querySelector("#btn-play").disabled = busy;
    root.querySelector("#btn-pause").disabled = !busy;
    root.querySelector("#btn-step").disabled = busy;
    root.querySelectorAll("[data-scenario]").forEach((btn) => {
      btn.disabled = busy;
    });
    root.querySelector("#btn-add-extra").disabled = busy;
    root.querySelector("#btn-clear-extra").disabled = busy || !state.extras.length;
  }

  function paint() {
    renderScene(canvas, state);
    renderObjectFbd(fbdA, state, "A", COLOR_A);
    renderObjectFbd(fbdB, state, "B", COLOR_B);
    renderDiagram(diagram, state);
    const snap = snapshot(state);
    const dirA = directionInfo(snap.forceAonB.direction);
    const dirB = directionInfo(snap.forceBonA.direction);
    const crit = pairCriteria(state);
    root.querySelector("#read-t").textContent = formatUnsigned(snap.time, "s");
    root.querySelector("#read-faonb").textContent = `${formatUnsigned(snap.forceAonB.magnitude, "N")} ${dirA.arrow}`;
    root.querySelector("#read-fbona").textContent = `${formatUnsigned(snap.forceBonA.magnitude, "N")} ${dirB.arrow}`;
    root.querySelector("#read-diff").textContent = formatUnsigned(crit.difference, "N");
    root.querySelector("#read-target-aonb").textContent = snap.B.name;
    root.querySelector("#read-target-bona").textContent = snap.A.name;
    root.querySelector("#read-neta").textContent = `${formatUnsigned(snap.netA.magnitude, "N")} ${netDirection(snap.netA).arrow}`;
    root.querySelector("#read-netb").textContent = `${formatUnsigned(snap.netB.magnitude, "N")} ${netDirection(snap.netB).arrow}`;
    root.querySelector("#read-aa").textContent = formatUnsigned(Math.hypot(snap.A.ax, snap.A.ay), "m/s²");
    root.querySelector("#read-ab").textContent = formatUnsigned(Math.hypot(snap.B.ax, snap.B.ay), "m/s²");
    root.querySelector("#crit-same").textContent = crit.sameInteraction ? "yes" : "no";
    root.querySelector("#crit-equal").textContent = crit.equalMagnitude ? "yes" : "no";
    root.querySelector("#crit-opp").textContent = crit.oppositeDirection ? "yes" : "no";
    root.querySelector("#crit-diff").textContent = crit.differentObjects ? "yes" : "no";
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
    if (!state.dynamicMode) {
      state.dynamicMode = true;
      if (state.time > 1e-9) state = resetState(state);
    }
    if (state.time >= state.duration - 1e-9) state = resetState(state);
    running = true;
    lastStamp = 0;
    carry = 0;
    raf = requestAnimationFrame(tick);
    syncInputs();
  }

  function pause() {
    if (!running) return;
    stopLoop();
    paint();
  }

  function onReset() {
    if (autoRecord && state.time > 1e-9) trials.record(trialSnapshot());
    stopLoop();
    state = createState({ scenario: "two-boxes", dynamicMode: state.dynamicMode, showNetForce: state.showNetForce });
    paint();
  }

  function seek(t) {
    stopLoop();
    const keep = {
      scenario: state.scenario,
      A: state.A,
      B: state.B,
      interaction: state.interaction,
      extras: state.extras,
      visual: state.visual,
      dynamicMode: state.dynamicMode,
      showNetForce: state.showNetForce,
      duration: state.duration,
      type: state.interaction.type,
      magnitude: state.interaction.magnitude,
      direction: state.interaction.direction,
    };
    state = createState(keep);
    stepTo(state, t);
    paint();
  }

  const download = bindDownload(root, {
    filename: "ap-physics-1-2-3-trials",
    getTable() {
      return {
        title: "AP Physics 1 — 2.3 Newton's Third Law",
        columns: ["Trial", "Scenario", "A on B (N)", "B on A (N)", "m_A (kg)", "m_B (kg)", "|a_A| (m/s²)", "|a_B| (m/s²)"],
        rows: trials.list().map((t) => [t.id, t.scenario, t.FAonB, t.FBonA, t.mA, t.mB, t.aA, t.aB]),
      };
    },
  });
  const unbindFullscreen = bindFullscreen(root.querySelector("#btn-fullscreen"));
  const unbindTutorial = bindTutorial(root, { simulationId: "2-3" });

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

  root.querySelector("#btn-reset").addEventListener("click", onReset);
  root.querySelector("#btn-play").addEventListener("click", play);
  root.querySelector("#btn-pause").addEventListener("click", pause);
  root.querySelector("#btn-step").addEventListener("click", () => {
    if (running) return;
    stepTo(state, Math.min(state.time + 0.1, state.duration));
    if (state.time >= state.duration - 1e-12 && autoRecord) trials.record(trialSnapshot());
    paint();
  });
  root.querySelector("#btn-check-23").addEventListener("click", () => {
    if (challenge.state.active && challenge.state.spec) {
      challenge.markAttempt(evaluateChallenge({ ...snapshot(state), choice: selectedChoice }, challenge.state.spec));
    }
    if (autoRecord && state.time > 1e-9) trials.record(trialSnapshot());
  });
  root.addEventListener("click", (event) => {
    const chip = event.target.closest("#challenge-choices [data-choice]");
    if (!chip) return;
    selectedChoice = chip.dataset.choice;
    root.querySelectorAll("#challenge-choices [data-choice]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.choice === selectedChoice);
    });
  });
  root.querySelectorAll("[data-scenario]").forEach((btn) => {
    btn.addEventListener("click", () => applyScenario({ scenario: btn.dataset.scenario }));
  });
  root.querySelectorAll("[data-speed]").forEach((btn) => {
    btn.addEventListener("click", () => {
      playback = Number(btn.dataset.speed);
      syncInputs();
    });
  });
  massA.addEventListener("change", () => {
    setMass(state, "A", readNumber(massA, state.A.mass));
    paint();
  });
  massB.addEventListener("change", () => {
    setMass(state, "B", readNumber(massB, state.B.mass));
    paint();
  });
  forceInput.addEventListener("change", () => {
    setInteraction(state, { magnitude: readNumber(forceInput, state.interaction.magnitude) });
    paint();
  });
  dirInput.addEventListener("change", () => {
    setInteraction(state, { direction: Number(dirInput.value) });
    paint();
  });
  distInput.addEventListener("change", () => {
    setSeparation(state, readNumber(distInput, snapshot(state).r));
    state = resetState(state);
    paint();
  });
  tInput.addEventListener("change", () => {
    state.duration = readNumber(tInput, state.duration);
    state = resetState(state);
    paint();
  });
  root.querySelector("#toggle-dynamic").addEventListener("change", (event) => {
    state.dynamicMode = event.target.checked;
    state = resetState(state);
    paint();
  });
  root.querySelector("#toggle-net").addEventListener("change", (event) => {
    state.showNetForce = event.target.checked;
    paint();
  });
  root.querySelector("#btn-add-extra").addEventListener("click", () => {
    addExtra(state, {
      target: extraTarget.value,
      magnitude: readNumber(extraMag, 10),
      direction: Number(extraDir.value),
      name: "Applied",
    });
    paint();
  });
  root.querySelector("#btn-clear-extra").addEventListener("click", () => {
    [...state.extras].forEach((f) => removeExtra(state, f.id));
    paint();
  });
  root.querySelector("#auto-record").addEventListener("change", (event) => {
    autoRecord = event.target.checked;
  });
  root.querySelector("#btn-record").addEventListener("click", () => trials.record(trialSnapshot()));
  root.querySelector("#btn-clear").addEventListener("click", () => trials.clear());
  root.querySelectorAll("[data-graph]").forEach((box) => {
    box.addEventListener("change", () => {
      graphs[box.dataset.graph] = box.checked;
      root.querySelector(`#wrap-${box.dataset.graph}`).hidden = !box.checked;
      drawLiveGraphs();
    });
  });
  const onGraphClick = (event) => {
    if (running) return;
    seek(timeAtPointer(event.currentTarget, event, state.duration));
  };
  graphXt.addEventListener("click", onGraphClick);
  graphVt.addEventListener("click", onGraphClick);

  window.addEventListener("keydown", onKey);
  const resize = new ResizeObserver(() => {
    paint();
    drawCharts();
  });
  resize.observe(canvas);
  resize.observe(fbdA);
  resize.observe(fbdB);
  resize.observe(diagram);
  resize.observe(graphXt);
  resize.observe(graphVt);
  resize.observe(graphRange);
  resize.observe(graphHeight);
  trials.render(trialBody);
  download.sync();
  paint();

  return () => {
    stopLoop();
    download.destroy();
    unbindFullscreen?.();
    unbindTutorial?.();
    resize.disconnect();
    window.removeEventListener("keydown", onKey);
  };
}
