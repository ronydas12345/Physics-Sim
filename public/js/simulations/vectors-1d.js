import {
  AXIS_MAX,
  AXIS_MIN,
  createState,
  displayedPosition,
  displacement,
  evaluateChallenge,
  formatDistance,
  formatSignedMeters,
  generateChallenge,
  nudgeDisplayed,
  reset as resetState,
  setDisplayedPosition,
  setPositiveRight,
  setWorldPosition,
  teacherReport,
} from "/lib/vectors1d.js";
import { renderXYScatter } from "../graphs.js";
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

const MIN_X = AXIS_MIN;
const MAX_X = AXIS_MAX;

function worldToX(world, view) {
  return view.originX + world * view.scale;
}

function xToWorld(px, view) {
  return (px - view.originX) / view.scale;
}

function createView(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = Math.max(1, canvas.clientWidth);
  const cssH = Math.max(1, canvas.clientHeight);
  const w = Math.round(cssW * dpr);
  const h = Math.round(cssH * dpr);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const pad = { l: 36, r: 36, t: 28, b: 42 };
  const plotW = cssW - pad.l - pad.r;
  const scale = plotW / (MAX_X - MIN_X);
  const originX = pad.l + (0 - MIN_X) * scale;
  const axisY = cssH * 0.55;
  return { cssW, cssH, dpr, pad, scale, originX, axisY };
}

function drawArrow(ctx, x1, y1, x2, y2, color) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
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

function renderAxis(canvas, state, showVectors) {
  const view = createView(canvas);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, view.cssW, view.cssH);

  const sky = ctx.createLinearGradient(0, 0, 0, view.cssH);
  sky.addColorStop(0, "#d7ebf7");
  sky.addColorStop(1, "#f4efe6");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, view.cssW, view.cssH);

  const y = view.axisY;
  ctx.strokeStyle = "#1b2430";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(view.pad.l, y);
  ctx.lineTo(view.cssW - view.pad.r, y);
  ctx.stroke();

  const posEnd = state.positiveRight ? view.cssW - view.pad.r : view.pad.l;
  drawArrow(ctx, view.originX, y, posEnd, y, "#1c6b73");
  ctx.fillStyle = "#4d5a68";
  ctx.font = "600 12px Figtree, sans-serif";
  if (state.positiveRight) {
    ctx.textAlign = "right";
    ctx.fillText("positive →", view.cssW - 18, y - 18);
    ctx.textAlign = "left";
    ctx.fillText("← negative", 18, y - 18);
  } else {
    ctx.textAlign = "left";
    ctx.fillText("← positive", 18, y - 18);
    ctx.textAlign = "right";
    ctx.fillText("negative →", view.cssW - 18, y - 18);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "12px IBM Plex Mono, monospace";
  for (let world = MIN_X; world <= MAX_X; world += 1) {
    const x = worldToX(world, view);
    const major = world % 5 === 0;
    ctx.strokeStyle = "rgba(27,36,48,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - (major ? 10 : 5));
    ctx.lineTo(x, y + (major ? 10 : 5));
    ctx.stroke();
    if (major) {
      const label = state.positiveRight ? world : -world;
      ctx.fillStyle = "#1b2430";
      ctx.fillText(String(label), x, y + 14);
    }
  }

  const x0 = worldToX(0, view);
  ctx.fillStyle = "#1b2430";
  ctx.font = "600 11px Figtree, sans-serif";
  ctx.fillText("origin", x0, y + 32);

  const xInit = worldToX(state.initialPosition, view);
  const xNow = worldToX(state.currentPosition, view);
  if (showVectors && Math.abs(state.currentPosition - state.initialPosition) > 0.05) {
    drawArrow(ctx, xInit, y - 36, xNow, y - 36, "#c45c26");
    ctx.fillStyle = "#c45c26";
    ctx.font = "600 12px Figtree, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("displacement", (xInit + xNow) / 2, y - 54);
  } else if (showVectors) {
    ctx.fillStyle = "#4d5a68";
    ctx.font = "600 12px Figtree, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Δx = 0", xNow, y - 48);
  }

  ctx.beginPath();
  ctx.fillStyle = "rgba(240,162,2,0.2)";
  ctx.arc(xNow, y, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = "#f0a202";
  ctx.strokeStyle = "#7a3e08";
  ctx.lineWidth = 2;
  ctx.arc(xNow, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  return view;
}

export function mountVectors1D(root) {
  const canvas = root.querySelector("#axis-canvas");
  const readX = root.querySelector("#read-x");
  const readDx = root.querySelector("#read-dx");
  const dxArrow = root.querySelector("#dx-arrow");
  const readD = root.querySelector("#read-d");
  const input = root.querySelector("#pos-input");
  const graphRange = root.querySelector("#graph-range");
  const graphHeight = root.querySelector("#graph-height");
  const trialBody = root.querySelector("#trial-body");
  let state = createState();
  let showVectors = true;
  let view = null;
  let dragging = false;
  let autoRecord = false;
  let activeTab = "lab";

  const trials = createTrialBook({
    columns: 5,
    renderRow: (t) => `<tr>
      <td>${t.id}</td>
      <td>${formatSignedMeters(t.position)}</td>
      <td>${formatSignedMeters(t.displacement)}</td>
      <td>${formatDistance(t.distance)}</td>
      <td>${t.positiveRight ? "right" : "left"}</td>
    </tr>`,
    onChange() {
      trials.render(trialBody);
      drawCharts();
      download.sync();
    },
  });

  function snapshot() {
    return {
      position: displayedPosition(state),
      displacement: displacement(state),
      distance: state.distanceTraveled,
      positiveRight: state.positiveRight,
    };
  }

  let identityOn = () => false;

  function drawCharts() {
    if (activeTab !== "lab") return;
    const list = trials.list();
    renderXYScatter(graphRange, list, {
      xKey: "displacement",
      yKey: "distance",
      xLabel: "Displacement (m)",
      yLabel: "Distance (m)",
      color: "#c45c26",
      xMin: -12,
      xMax: 12,
      fitYName: "D",
      fitXName: "Δx",
      identity: identityOn()
        ? { yOfX: (dx) => Math.abs(dx), label: "D = |Δx|", xMin: -12, xMax: 12 }
        : null,
    });
    renderXYScatter(graphHeight, list, {
      xKey: "distance",
      yKey: "position",
      xLabel: "Distance (m)",
      yLabel: "Position (m)",
      color: "#1c6b73",
      xMin: 0,
      yMin: -12,
      yMax: 12,
      fitYName: "x",
      fitXName: "D",
    });
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
    const t = spec.targets;
    host.querySelector("#challenge-goal").textContent =
      spec.type === "round-trip"
        ? `Target: Δx = 0 m and distance = ${formatDistance(t.distance)}`
        : `Target: x = ${formatSignedMeters(t.position)} and distance = ${formatDistance(t.distance)}`;
    host.querySelector("#challenge-unknown").textContent = `Find ${spec.unknownLabel}.`;
  }

  function describeFeedback(host, challengeState) {
    const feedback = host.querySelector("#challenge-feedback");
    const reveal = host.querySelector("#btn-reveal");
    if (!challengeState.spec || !challengeState.attempted) {
      feedback.className = "feedback";
      feedback.textContent = "The solution stays hidden until you check.";
      reveal.disabled = true;
      return;
    }
    const result = challengeState.last;
    feedback.className = `feedback ${result.ok ? "hit" : "miss"}`;
    let text = `Yours: x = ${formatSignedMeters(result.position)}, D = ${formatDistance(result.distance)}. `;
    text += result.ok ? "Close enough." : "Distance is path length. Turning around adds meters without changing the final shortcut.";
    if (challengeState.revealed) text += ` Hint: ${challengeState.spec.solutionHint}`;
    feedback.textContent = text;
    reveal.disabled = false;
  }

  const challenge = bindChallenge(root, {
    generate: generateChallenge,
    apply(spec) {
      if (!spec) return;
      state = createState({ positiveRight: state.positiveRight });
      paint();
    },
    describeCard,
    describeFeedback,
  });

  function paint() {
    view = renderAxis(canvas, state, showVectors);
    const x = displayedPosition(state);
    const dx = displacement(state);
    readX.textContent = formatSignedMeters(x);
    readD.textContent = formatDistance(state.distanceTraveled);
    readDx.childNodes[0].textContent = `${formatSignedMeters(dx)} `;
    dxArrow.textContent = Math.abs(dx) < 0.05 ? "" : dx > 0 ? "→" : "←";
    if (document.activeElement !== input) input.value = String(Math.round(x * 10) / 10);
    root.querySelector("#dir-right").classList.toggle("active", state.positiveRight);
    root.querySelector("#dir-left").classList.toggle("active", !state.positiveRight);
    teacher.refresh();
  }

  function moveDisplayed(next) {
    setDisplayedPosition(state, next);
    paint();
  }

  const onPointerDown = (event) => {
    if (!view) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const world = xToWorld(event.clientX - rect.left, view);
    dragging = true;
    canvas.style.cursor = "grabbing";
    canvas.setPointerCapture(event.pointerId);
    setWorldPosition(state, world);
    paint();
  };
  const onPointerMove = (event) => {
    if (!dragging || !view) return;
    const rect = canvas.getBoundingClientRect();
    setWorldPosition(state, xToWorld(event.clientX - rect.left, view));
    paint();
  };
  const onPointerUp = () => {
    dragging = false;
    canvas.style.cursor = "grab";
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  const download = bindDownload(root, {
    filename: "ap-physics-1-1-1-trials",
    getTable() {
      return {
        title: "AP Physics 1 — 1.1 Scalars and Vectors in One Dimension",
        columns: [
          "Trial",
          "Position (m)",
          "Displacement (m)",
          "Distance (m)",
          "Positive direction",
        ],
        rows: trials.list().map((t) => [
          t.id,
          t.position,
          t.displacement,
          t.distance,
          t.positiveRight ? "right" : "left",
        ]),
      };
    },
  });
  const unbindFullscreen = bindFullscreen(root.querySelector("#btn-fullscreen"));
  const unbindTutorial = bindTutorial(root, { simulationId: "1-1" });
  const onReset = () => {
    if (autoRecord && state.distanceTraveled > 0) trials.record(snapshot());
    state = resetState(state);
    paint();
  };
  const onNeg = () => {
    nudgeDisplayed(state, -1);
    paint();
  };
  const onPos = () => {
    nudgeDisplayed(state, 1);
    paint();
  };
  const onCheck = () => {
    if (challenge.state.active && challenge.state.spec) {
      challenge.markAttempt(evaluateChallenge(state, challenge.state.spec));
    }
    if (autoRecord && state.distanceTraveled > 0) trials.record(snapshot());
  };
  const onKey = (event) => {
    if (event.target.matches("input, textarea, button")) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onPos();
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onNeg();
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
  root.querySelector("#nudge-neg").addEventListener("click", onNeg);
  root.querySelector("#nudge-pos").addEventListener("click", onPos);
  root.querySelector("#btn-check-1d").addEventListener("click", onCheck);
  root.querySelector("#dir-right").addEventListener("click", () => {
    setPositiveRight(state, true);
    paint();
  });
  root.querySelector("#dir-left").addEventListener("click", () => {
    setPositiveRight(state, false);
    paint();
  });
  input.addEventListener("change", () => {
    const n = Number(input.value);
    if (Number.isFinite(n)) moveDisplayed(n);
  });
  root.querySelector("#toggle-vectors").addEventListener("change", (event) => {
    showVectors = event.target.checked;
    paint();
  });
  root.querySelector("#auto-record").addEventListener("change", (event) => {
    autoRecord = event.target.checked;
  });
  root.querySelector("#btn-record").addEventListener("click", () => trials.record(snapshot()));
  root.querySelector("#btn-clear").addEventListener("click", () => trials.clear());
  window.addEventListener("keydown", onKey);
  const resize = new ResizeObserver(() => {
    paint();
    drawCharts();
  });
  resize.observe(canvas);
  resize.observe(graphRange);
  resize.observe(graphHeight);
  trials.render(trialBody);
  download.sync();
  paint();
  drawCharts();

  return () => {
    download.destroy();
    unbindFullscreen?.();
    unbindTutorial?.();
    resize.disconnect();
    window.removeEventListener("keydown", onKey);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
  };
}
