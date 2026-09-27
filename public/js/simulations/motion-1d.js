import {
  AXIS_MAX,
  AXIS_MIN,
  DT,
  PLAYBACK_SPEEDS,
  PRESETS,
  createState,
  evaluateChallenge,
  formatSigned,
  formatUnsigned,
  generateChallenge,
  positionAt,
  reset as resetState,
  stepTo,
  teacherReport,
} from "/lib/kinematics1d.js";
import { renderTimeSeries, renderXYScatter } from "../graphs.js";
import {
  bindChallenge,
  bindDownload,
  bindFullscreen,
  bindLabTabs,
  bindTeacher,
  createTrialBook,
} from "../platform/lab-kit.js";

function worldToX(world, view) {
  return view.originX + world * view.scale;
}

function xToWorld(px, view) {
  return (px - view.originX) / view.scale;
}

function axisBounds(state) {
  const xs = state.history.map((s) => s.position);
  xs.push(state.position, state.initialPosition);
  const lo = Math.min(AXIS_MIN, ...xs);
  const hi = Math.max(AXIS_MAX, ...xs);
  return {
    min: Math.floor((lo - 1) / 5) * 5,
    max: Math.ceil((hi + 1) / 5) * 5,
  };
}

function createView(canvas, state) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = Math.max(1, canvas.clientWidth);
  const cssH = Math.max(1, canvas.clientHeight);
  const w = Math.round(cssW * dpr);
  const h = Math.round(cssH * dpr);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const pad = { l: 36, r: 36, t: 44, b: 46 };
  const { min, max } = axisBounds(state);
  const plotW = cssW - pad.l - pad.r;
  const scale = plotW / Math.max(max - min, 1);
  const originX = pad.l + (0 - min) * scale;
  const axisY = cssH * 0.58;
  return { cssW, cssH, dpr, pad, scale, originX, axisY, min, max };
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

function renderTrack(canvas, state, { showVectors, showTrail }) {
  const view = createView(canvas, state);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, view.cssW, view.cssH);

  const sky = ctx.createLinearGradient(0, 0, 0, view.cssH);
  sky.addColorStop(0, "#d7ebf7");
  sky.addColorStop(1, "#f4efe6");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, view.cssW, view.cssH);

  ctx.fillStyle = "#1b2430";
  ctx.font = "700 18px IBM Plex Mono, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(`Time: ${state.time.toFixed(2)} s`, view.cssW / 2, 10);

  const y = view.axisY;
  ctx.strokeStyle = "#1b2430";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(view.pad.l, y);
  ctx.lineTo(view.cssW - view.pad.r, y);
  ctx.stroke();

  drawArrow(ctx, view.originX, y, view.cssW - view.pad.r, y, "#1c6b73");
  ctx.fillStyle = "#4d5a68";
  ctx.font = "600 12px Figtree, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("positive →", view.cssW - 18, y - 18);
  ctx.textAlign = "left";
  ctx.fillText("← negative", 18, y - 18);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "12px IBM Plex Mono, monospace";
  const step = view.max - view.min > 50 ? 10 : 5;
  for (let world = view.min; world <= view.max; world += 1) {
    const x = worldToX(world, view);
    const major = world % step === 0;
    ctx.strokeStyle = "rgba(27,36,48,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - (major ? 10 : 5));
    ctx.lineTo(x, y + (major ? 10 : 5));
    ctx.stroke();
    if (major) {
      ctx.fillStyle = "#1b2430";
      ctx.fillText(String(world), x, y + 14);
    }
  }

  ctx.fillStyle = "#1b2430";
  ctx.font = "600 11px Figtree, sans-serif";
  ctx.fillText("origin", worldToX(0, view), y + 32);

  if (showTrail) {
    const marks = state.history.filter((s, i) => i === 0 || s.time % 0.4 < DT || i === state.history.length - 1);
    marks.forEach((s, i) => {
      const x = worldToX(s.position, view);
      ctx.beginPath();
      ctx.fillStyle = `rgba(28,107,115,${0.18 + 0.55 * (i / Math.max(marks.length - 1, 1))})`;
      ctx.arc(x, y, 4.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const tRev = state.reversalAt;
  if (tRev != null && state.time + 1e-9 >= tRev) {
    const xRev = worldToX(positionAt(state, tRev), view);
    ctx.fillStyle = "#7a3e08";
    ctx.beginPath();
    ctx.moveTo(xRev, y - 28);
    ctx.lineTo(xRev + 7, y - 16);
    ctx.lineTo(xRev - 7, y - 16);
    ctx.closePath();
    ctx.fill();
    ctx.font = "600 11px Figtree, sans-serif";
    ctx.fillText("v = 0", xRev, y - 42);
  }

  const xNow = worldToX(state.position, view);
  if (showVectors) {
    const vPx = Math.max(-72, Math.min(72, state.velocity * 8));
    if (Math.abs(vPx) > 6) {
      drawArrow(ctx, xNow, y - 36, xNow + vPx, y - 36, "#1c6b73");
      ctx.fillStyle = "#1c6b73";
      ctx.font = "600 11px Figtree, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("velocity", xNow + vPx / 2, y - 52);
    }
    const aPx = Math.max(-56, Math.min(56, state.acceleration * 16));
    if (Math.abs(aPx) > 6) {
      drawArrow(ctx, xNow, y + 28, xNow + aPx, y + 28, "#c45c26");
      ctx.fillStyle = "#c45c26";
      ctx.font = "600 11px Figtree, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("acceleration", xNow + aPx / 2, y + 42);
    }
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

export function mountMotion1D(root) {
  const canvas = root.querySelector("#axis-canvas");
  const graphXt = root.querySelector("#graph-xt");
  const graphVt = root.querySelector("#graph-vt");
  const graphAt = root.querySelector("#graph-at");
  const graphRange = root.querySelector("#graph-range");
  const graphHeight = root.querySelector("#graph-height");
  const trialBody = root.querySelector("#trial-body");
  const x0Input = root.querySelector("#x0-input");
  const v0Input = root.querySelector("#v0-input");
  const aInput = root.querySelector("#a-input");
  const tInput = root.querySelector("#duration-input");

  let state = createState();
  let running = false;
  let raf = 0;
  let lastStamp = 0;
  let carry = 0;
  let playback = 1;
  let showVectors = true;
  let showTrail = true;
  let pauseAtReverse = false;
  let autoRecord = false;
  let activeTab = "lab";
  let view = null;
  let dragging = false;
  let graphs = { x: true, v: true, a: true };

  const trials = createTrialBook({
    columns: 8,
    renderRow: (t) => `<tr>
      <td>${t.id}</td>
      <td>${formatUnsigned(t.time, "s")}</td>
      <td>${formatSigned(t.position, "m")}</td>
      <td>${formatSigned(t.displacement, "m")}</td>
      <td>${formatUnsigned(t.distance, "m")}</td>
      <td>${formatSigned(t.velocity, "m/s")}</td>
      <td>${formatSigned(t.acceleration, "m/s²")}</td>
      <td>${t.averageVelocity == null ? "—" : formatSigned(t.averageVelocity, "m/s")}</td>
    </tr>`,
    onChange() {
      trials.render(trialBody);
      drawCharts();
      download.sync();
    },
  });

  function trialSnapshot() {
    return {
      time: state.time,
      position: state.position,
      displacement: state.position - state.initialPosition,
      distance: state.distance,
      velocity: state.velocity,
      acceleration: state.acceleration,
      averageVelocity: state.time > 1e-12 ? (state.position - state.initialPosition) / state.time : null,
    };
  }

  function drawLiveGraphs() {
    if (activeTab !== "lab") return;
    const history = state.history;
    if (graphs.x) {
      renderTimeSeries(graphXt, history, {
        yKey: "position",
        color: "#c45c26",
        xLabel: "Time (s)",
        yLabel: "Position (m)",
        duration: state.duration,
        now: state.time,
      });
    }
    if (graphs.v) {
      renderTimeSeries(graphVt, history, {
        yKey: "velocity",
        color: "#1c6b73",
        xLabel: "Time (s)",
        yLabel: "Velocity (m/s)",
        duration: state.duration,
        now: state.time,
      });
    }
    if (graphs.a) {
      renderTimeSeries(graphAt, history, {
        yKey: "acceleration",
        color: "#7a3e08",
        xLabel: "Time (s)",
        yLabel: "Acceleration (m/s²)",
        duration: state.duration,
        now: state.time,
      });
    }
  }

  function drawCharts() {
    if (activeTab !== "lab") return;
    const list = trials.list();
    renderXYScatter(graphRange, list, {
      xKey: "displacement",
      yKey: "distance",
      xLabel: "Displacement (m)",
      yLabel: "Distance (m)",
      color: "#c45c26",
    });
    renderXYScatter(graphHeight, list, {
      xKey: "time",
      yKey: "averageVelocity",
      xLabel: "Time (s)",
      yLabel: "Average velocity (m/s)",
      color: "#1c6b73",
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

  function describeCard(host, spec) {
    host.querySelector("#challenge-q").textContent = spec.prompt;
    host.querySelector("#challenge-givens").innerHTML = spec.givens
      .map((row) => `<div><dt>${row.label}</dt><dd>${row.value}</dd></div>`)
      .join("");
    if (spec.type === "stop-time") {
      host.querySelector("#challenge-goal").textContent = "Target: time when v = 0";
    } else if (spec.type === "position-at-t") {
      host.querySelector("#challenge-goal").textContent = `Target: x at t = ${formatUnsigned(spec.targets.time, "s")}`;
    } else {
      host.querySelector("#challenge-goal").textContent = `Target: v at t = ${formatUnsigned(spec.targets.time, "s")}`;
    }
    host.querySelector("#challenge-unknown").textContent = `Find ${spec.unknownLabel}.`;
  }

  function describeFeedback(host, challengeState) {
    const feedback = host.querySelector("#challenge-feedback");
    const reveal = host.querySelector("#btn-reveal");
    if (!challengeState.spec || !challengeState.attempted) {
      feedback.className = "feedback";
      feedback.textContent = "Run the motion, then check. The solution stays hidden until then.";
      reveal.disabled = true;
      return;
    }
    const result = challengeState.last;
    feedback.className = `feedback ${result.ok ? "hit" : "miss"}`;
    let text = `Yours: t = ${formatUnsigned(result.time, "s")}, x = ${formatSigned(result.position, "m")}, v = ${formatSigned(result.velocity, "m/s")}. `;
    text += result.ok
      ? "Close enough."
      : "Compare instantaneous values at the requested time. Negative a does not mean the object is already moving left.";
    if (challengeState.revealed) text += ` Hint: ${challengeState.spec.solutionHint}`;
    feedback.textContent = text;
    reveal.disabled = false;
  }

  function applyMotion(params) {
    stopLoop();
    state = createState({
      initialPosition: params.initialPosition,
      initialVelocity: params.initialVelocity,
      acceleration: params.acceleration,
      duration: params.duration,
    });
    paint();
  }

  const challenge = bindChallenge(root, {
    generate: generateChallenge,
    apply(spec) {
      if (!spec) return;
      applyMotion(spec.params);
    },
    describeCard,
    describeFeedback,
  });

  function syncInputs() {
    if (document.activeElement !== x0Input) x0Input.value = String(state.initialPosition);
    if (document.activeElement !== v0Input) v0Input.value = String(state.initialVelocity);
    if (document.activeElement !== aInput) aInput.value = String(state.acceleration);
    if (document.activeElement !== tInput) tInput.value = String(state.duration);
    root.querySelector("#read-x0").textContent = formatSigned(state.initialPosition, "m");
    root.querySelector("#read-v0").textContent = formatSigned(state.initialVelocity, "m/s");
    root.querySelector("#read-a0").textContent = formatSigned(state.acceleration, "m/s²");
    root.querySelector("#read-T").textContent = formatUnsigned(state.duration, "s");
    PRESETS.forEach((preset) => {
      const btn = root.querySelector(`[data-preset="${preset.id}"]`);
      const active =
        preset.initialPosition === state.initialPosition &&
        preset.initialVelocity === state.initialVelocity &&
        preset.acceleration === state.acceleration;
      btn?.classList.toggle("active", active);
    });
    PLAYBACK_SPEEDS.forEach((speed) => {
      root.querySelector(`[data-speed="${speed}"]`)?.classList.toggle("active", speed === playback);
    });
    const busy = running;
    [x0Input, v0Input, aInput, tInput].forEach((el) => {
      el.disabled = busy;
    });
    root.querySelector("#btn-play").disabled = busy;
    root.querySelector("#btn-pause").disabled = !busy;
    root.querySelector("#btn-step").disabled = busy;
    root.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.disabled = busy;
    });
    canvas.style.cursor = !busy && state.time === 0 ? "grab" : "default";
  }

  function paint() {
    view = renderTrack(canvas, state, { showVectors, showTrail });
    const snap = {
      time: state.time,
      position: state.position,
      displacement: state.position - state.initialPosition,
      distance: state.distance,
      velocity: state.velocity,
      acceleration: state.acceleration,
      averageVelocity: state.time > 1e-12 ? (state.position - state.initialPosition) / state.time : null,
      averageAcceleration: state.time > 1e-12 ? (state.velocity - state.initialVelocity) / state.time : null,
    };
    root.querySelector("#read-t").textContent = formatUnsigned(snap.time, "s");
    root.querySelector("#read-x").textContent = formatSigned(snap.position, "m");
    const dxNode = root.querySelector("#read-dx");
    dxNode.childNodes[0].textContent = `${formatSigned(snap.displacement, "m")} `;
    root.querySelector("#dx-arrow").textContent =
      Math.abs(snap.displacement) < 0.05 ? "" : snap.displacement > 0 ? "→" : "←";
    root.querySelector("#read-d").textContent = formatUnsigned(snap.distance, "m");
    root.querySelector("#read-v").textContent = formatSigned(snap.velocity, "m/s");
    root.querySelector("#read-a").textContent = formatSigned(snap.acceleration, "m/s²");
    root.querySelector("#read-vavg").textContent =
      snap.averageVelocity == null ? "—" : formatSigned(snap.averageVelocity, "m/s");
    root.querySelector("#read-aavg").textContent =
      snap.averageAcceleration == null ? "—" : formatSigned(snap.averageAcceleration, "m/s²");
    syncInputs();
    teacher.refresh();
    drawLiveGraphs();
  }

  function stopLoop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastStamp = 0;
    carry = 0;
  }

  function finishRun() {
    if (autoRecord) trials.record(trialSnapshot());
    stopLoop();
    paint();
  }

  function tick(stamp) {
    if (!running) return;
    if (!lastStamp) lastStamp = stamp;
    const realDt = Math.min(0.05, (stamp - lastStamp) / 1000);
    lastStamp = stamp;
    carry += realDt * playback;
    const tRev = state.reversalAt;
    while (carry + 1e-12 >= DT) {
      const next = Math.min(state.time + DT, state.duration);
      if (pauseAtReverse && tRev != null && state.time < tRev && next + 1e-12 >= tRev) {
        stepTo(state, tRev);
        carry = 0;
        stopLoop();
        paint();
        return;
      }
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
    if (!running) return;
    stopLoop();
    paint();
  }

  function onReset() {
    if (autoRecord && state.time > 1e-9) trials.record(trialSnapshot());
    stopLoop();
    state = resetState(state);
    paint();
  }

  function readNumber(input, fallback) {
    const n = Number(input.value);
    return Number.isFinite(n) ? n : fallback;
  }

  function commitParams() {
    applyMotion({
      initialPosition: readNumber(x0Input, state.initialPosition),
      initialVelocity: readNumber(v0Input, state.initialVelocity),
      acceleration: readNumber(aInput, state.acceleration),
      duration: readNumber(tInput, state.duration),
    });
  }

  const onPointerDown = (event) => {
    if (running || state.time > 1e-9 || !view) return;
    event.preventDefault();
    dragging = true;
    canvas.style.cursor = "grabbing";
    canvas.setPointerCapture(event.pointerId);
    const rect = canvas.getBoundingClientRect();
    applyMotion({
      initialPosition: xToWorld(event.clientX - rect.left, view),
      initialVelocity: state.initialVelocity,
      acceleration: state.acceleration,
      duration: state.duration,
    });
  };
  const onPointerMove = (event) => {
    if (!dragging || !view) return;
    const rect = canvas.getBoundingClientRect();
    applyMotion({
      initialPosition: xToWorld(event.clientX - rect.left, view),
      initialVelocity: state.initialVelocity,
      acceleration: state.acceleration,
      duration: state.duration,
    });
  };
  const onPointerUp = () => {
    dragging = false;
    canvas.style.cursor = state.time === 0 ? "grab" : "default";
  };

  const download = bindDownload(root, {
    filename: "ap-physics-1-1-2-trials",
    getTable() {
      return {
        title: "AP Physics 1 — 1.2 Displacement, Velocity, and Acceleration",
        columns: [
          "Trial",
          "Time (s)",
          "Position (m)",
          "Displacement (m)",
          "Distance (m)",
          "Velocity (m/s)",
          "Acceleration (m/s^2)",
          "Average velocity (m/s)",
        ],
        rows: trials.list().map((t) => [
          t.id,
          t.time,
          t.position,
          t.displacement,
          t.distance,
          t.velocity,
          t.acceleration,
          t.averageVelocity,
        ]),
      };
    },
  });
  bindFullscreen(root.querySelector("#btn-fullscreen"), root.querySelector(".sim-shell"));

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
    const next = Math.min(state.time + 0.1, state.duration);
    stepTo(state, next);
    if (state.time >= state.duration - 1e-12 && autoRecord) trials.record(trialSnapshot());
    paint();
  });
  root.querySelector("#btn-check-12").addEventListener("click", () => {
    if (challenge.state.active && challenge.state.spec) {
      challenge.markAttempt(evaluateChallenge(trialSnapshot(), challenge.state.spec));
    }
    if (autoRecord && state.time > 1e-9) trials.record(trialSnapshot());
  });
  root.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = PRESETS.find((p) => p.id === btn.dataset.preset);
      if (!preset) return;
      applyMotion({ ...preset, duration: state.duration });
    });
  });
  root.querySelectorAll("[data-speed]").forEach((btn) => {
    btn.addEventListener("click", () => {
      playback = Number(btn.dataset.speed);
      syncInputs();
    });
  });
  [x0Input, v0Input, aInput, tInput].forEach((input) => {
    input.addEventListener("change", commitParams);
  });
  root.querySelector("#toggle-vectors").addEventListener("change", (event) => {
    showVectors = event.target.checked;
    paint();
  });
  root.querySelector("#toggle-trail").addEventListener("change", (event) => {
    showTrail = event.target.checked;
    paint();
  });
  root.querySelector("#pause-reverse").addEventListener("change", (event) => {
    pauseAtReverse = event.target.checked;
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

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("keydown", onKey);

  const resize = new ResizeObserver(() => {
    paint();
    drawCharts();
  });
  resize.observe(canvas);
  [graphXt, graphVt, graphAt, graphRange, graphHeight].forEach((el) => resize.observe(el));

  trials.render(trialBody);
  download.sync();
  paint();
  drawCharts();

  return () => {
    stopLoop();
    download.destroy();
    resize.disconnect();
    window.removeEventListener("keydown", onKey);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
  };
}
