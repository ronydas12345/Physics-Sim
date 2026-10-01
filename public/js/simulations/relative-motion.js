import {
  AXIS_PAD,
  DIAGRAM_DT,
  DT,
  FRAMES,
  PLAYBACK_SPEEDS,
  PRESETS,
  createState,
  evaluateChallenge,
  formatSigned,
  formatUnsigned,
  generateChallenge,
  historyInFrame,
  meetingForecast,
  motionDiagramSamples,
  reset as resetState,
  snapshot,
  stepTo,
  teacherReport,
  viewInFrame,
} from "/lib/relative1d.js";
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

function worldToX(world, view) {
  return view.originX + world * view.scale;
}

function xToWorld(px, view) {
  return (px - view.originX) / view.scale;
}

function axisBounds(viewState) {
  const xs = [viewState.xA, viewState.xB, 0];
  const lo = Math.min(-20, ...xs) - AXIS_PAD;
  const hi = Math.max(20, ...xs) + AXIS_PAD;
  return {
    min: Math.floor(lo / 5) * 5,
    max: Math.ceil(hi / 5) * 5,
  };
}

function createView(canvas, viewState) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = Math.max(1, canvas.clientWidth);
  const cssH = Math.max(1, canvas.clientHeight);
  const w = Math.round(cssW * dpr);
  const h = Math.round(cssH * dpr);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const pad = { l: 36, r: 36, t: 40, b: 36 };
  const { min, max } = axisBounds(viewState);
  const plotW = cssW - pad.l - pad.r;
  const scale = plotW / Math.max(max - min, 1);
  const originX = pad.l + (0 - min) * scale;
  return { cssW, cssH, dpr, pad, scale, originX, min, max };
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

function fillSky(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#d7ebf7");
  sky.addColorStop(1, "#f4efe6");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
}

function drawAxis(ctx, view, y) {
  const theme = themeCanvas();
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(view.pad.l, y);
  ctx.lineTo(view.cssW - view.pad.r, y);
  ctx.stroke();
  drawArrow(ctx, view.originX, y, view.cssW - view.pad.r, y, "#1c6b73");
  ctx.fillStyle = theme.muted;
  ctx.font = "600 12px Figtree, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("positive →", view.cssW - 18, y - 16);
  ctx.textAlign = "left";
  ctx.fillText("← negative", 18, y - 16);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "12px IBM Plex Mono, monospace";
  const step = view.max - view.min > 60 ? 10 : 5;
  for (let world = view.min; world <= view.max; world += 1) {
    const x = worldToX(world, view);
    const major = world % step === 0;
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - (major ? 10 : 5));
    ctx.lineTo(x, y + (major ? 10 : 5));
    ctx.stroke();
    if (major) {
      ctx.fillStyle = theme.ink;
      ctx.fillText(String(world), x, y + 12);
    }
  }
}

function drawBody(ctx, x, y, color, label) {
  ctx.beginPath();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.strokeStyle = "#1b2430";
  ctx.lineWidth = 2;
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "700 12px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y);
}

function renderTrack(canvas, state) {
  const viewWorld = viewInFrame(state, state.frame);
  const view = createView(canvas, viewWorld);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, view.cssW, view.cssH);
  fillSky(ctx, view.cssW, view.cssH);
  const frameLabel = FRAMES.find((f) => f.id === state.frame)?.label ?? "Ground";
  ctx.fillStyle = "#1b2430";
  ctx.font = "700 16px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(`Viewing from ${frameLabel} · t = ${state.time.toFixed(2)} s`, view.cssW / 2, 8);

  const yA = view.cssH * 0.42;
  const yB = view.cssH * 0.68;
  drawAxis(ctx, view, (yA + yB) / 2);

  const xA = worldToX(viewWorld.xA, view);
  const xB = worldToX(viewWorld.xB, view);
  if (Math.abs(viewWorld.vA) > 0.05) {
    drawArrow(ctx, xA, yA - 28, xA + Math.max(-70, Math.min(70, viewWorld.vA * 8)), yA - 28, "#c45c26");
  }
  if (Math.abs(viewWorld.vB) > 0.05) {
    drawArrow(ctx, xB, yB + 28, xB + Math.max(-70, Math.min(70, viewWorld.vB * 8)), yB + 28, "#1c6b73");
  }
  drawBody(ctx, xA, yA, "#c45c26", "A");
  drawBody(ctx, xB, yB, "#1c6b73", "B");

  const vAB = state.vA - state.vB;
  const midY = (yA + yB) / 2;
  const midX = (xA + xB) / 2;
  ctx.fillStyle = "#7a3e08";
  ctx.font = "700 12px IBM Plex Mono, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  if (Math.abs(vAB) > 0.05) {
    const dir = vAB > 0 ? 1 : -1;
    const span = Math.max(48, Math.min(90, Math.abs(xB - xA) * 0.35));
    drawArrow(ctx, midX - dir * span, midY, midX + dir * span, midY, "#7a3e08");
    ctx.fillText(`v_A/B = ${formatSigned(vAB, "m/s")}`, midX, midY - 8);
  } else {
    ctx.fillText("v_A/B = 0  (neither moves relative to the other)", view.cssW / 2, midY - 8);
  }

  ctx.fillStyle = "#1b2430";
  ctx.font = "600 12px Figtree, sans-serif";
  ctx.textBaseline = "bottom";
  if (state.frame === "ground") {
    ctx.fillText("Observer: ground", view.originX, (yA + yB) / 2 - 18);
  } else if (state.frame === "A") {
    ctx.fillText("Observer A", xA, yA - 36);
  } else {
    ctx.textBaseline = "top";
    ctx.fillText("Observer B", xB, yB + 36);
  }

  if (state.met && Math.abs(state.xA - state.xB) < 0.8) {
    ctx.fillStyle = "#2c6e49";
    ctx.font = "700 13px Figtree, sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("Objects meet", view.cssW / 2, view.cssH - 18);
  }
  return view;
}

function renderDiagram(canvas, state) {
  const viewWorld = viewInFrame(state, state.frame);
  const view = createView(canvas, viewWorld);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, view.cssW, view.cssH);
  ctx.fillStyle = themeCanvas().fill;
  ctx.fillRect(0, 0, view.cssW, view.cssH);
  const yA = view.cssH * 0.38;
  const yB = view.cssH * 0.72;
  drawAxis(ctx, view, (yA + yB) / 2);
  const dots = motionDiagramSamples(state, DIAGRAM_DT).map((d) => ({
    ...d,
    ...viewInFrame(d, state.frame),
  }));
  function paintRow(keyX, y, color) {
    dots.forEach((dot, i) => {
      const x = worldToX(dot[keyX], view);
      const last = i === dots.length - 1;
      ctx.fillStyle = last ? "#c45c26" : color;
      ctx.beginPath();
      ctx.arc(x, y, last ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  paintRow("xA", yA, "#c45c26");
  paintRow("xB", yB, "#1c6b73");
  ctx.fillStyle = themeCanvas().muted;
  ctx.font = "600 12px Figtree, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`A  ·  Δt = ${DIAGRAM_DT.toFixed(2)} s`, view.pad.l, 14);
  ctx.fillText("B", view.pad.l, view.cssH - 14);
}

export function mountRelativeMotion(root) {
  const canvas = root.querySelector("#axis-canvas");
  const diagram = root.querySelector("#diagram-canvas");
  const graphXt = root.querySelector("#graph-xt");
  const graphVt = root.querySelector("#graph-vt");
  const graphFrame = root.querySelector("#graph-frame");
  const graphRange = root.querySelector("#graph-range");
  const graphHeight = root.querySelector("#graph-height");
  const trialBody = root.querySelector("#trial-body");
  const xAInput = root.querySelector("#xa-input");
  const vAInput = root.querySelector("#va-input");
  const xBInput = root.querySelector("#xb-input");
  const vBInput = root.querySelector("#vb-input");
  const tInput = root.querySelector("#duration-input");

  let state = createState();
  let running = false;
  let raf = 0;
  let lastStamp = 0;
  let carry = 0;
  let playback = 1;
  let autoRecord = false;
  let activeTab = "lab";
  let view = null;
  let dragging = null;

  const trials = createTrialBook({
    columns: 8,
    renderRow: (t) => `<tr>
      <td>${t.id}</td>
      <td>${t.frame}</td>
      <td>${formatUnsigned(t.time, "s")}</td>
      <td>${formatSigned(t.xA, "m")}</td>
      <td>${formatSigned(t.vA, "m/s")}</td>
      <td>${formatSigned(t.xB, "m")}</td>
      <td>${formatSigned(t.vB, "m/s")}</td>
      <td>${formatSigned(t.vAB, "m/s")}</td>
    </tr>`,
    onChange() {
      trials.render(trialBody);
      drawCharts();
      download.sync();
    },
  });

  function trialSnapshot() {
    return snapshot(state);
  }

  function drawLiveGraphs() {
    if (activeTab !== "lab") return;
    const history = historyInFrame(state, state.frame);
    renderTimeSeries(graphXt, history, {
      yKey: "xAB",
      color: "#c45c26",
      xLabel: "Time (s)",
      yLabel: "x_A/B (m)",
      duration: state.duration,
      now: state.time,
    });
    renderTimeSeries(graphVt, history, {
      yKey: "vAB",
      color: "#1c6b73",
      xLabel: "Time (s)",
      yLabel: "v_A/B (m/s)",
      duration: state.duration,
      now: state.time,
    });
    renderTimeSeries(graphFrame, history, {
      series: [
        { yKey: "xA", color: "#c45c26", label: "A" },
        { yKey: "xB", color: "#1c6b73", label: "B" },
      ],
      xLabel: "Time (s)",
      yLabel: "x in this frame (m)",
      duration: state.duration,
      now: state.time,
    });
  }

  let identityOn = () => false;

  function drawCharts() {
    if (activeTab !== "lab") return;
    const list = trials.list();
    renderXYScatter(graphRange, list, {
      xKey: "vAB",
      yKey: "xAB",
      xLabel: "v_A/B (m/s)",
      yLabel: "x_A/B (m)",
      color: "#c45c26",
      fitYName: "x_A/B",
      fitXName: "v_A/B",
    });
    renderXYScatter(graphHeight, list, {
      xKey: "time",
      yKey: "separation",
      xLabel: "Time (s)",
      yLabel: "Separation (m)",
      color: "#1c6b73",
      fitYName: "s",
      fitXName: "t",
      identity: identityOn()
        ? {
            yOfX: (t) => Math.abs(state.xA0 - state.xB0 + (state.vA - state.vB) * t),
            label: "s = |x_A/B(0) + v_A/B t|",
            xMin: 0,
            xMax: state.duration,
          }
        : null,
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
  }

  function describeFeedback(host, challengeState) {
    const feedback = host.querySelector("#challenge-feedback");
    const reveal = host.querySelector("#btn-reveal");
    if (!challengeState.spec || !challengeState.attempted) {
      feedback.className = "feedback";
      feedback.textContent = "Switch frames if it helps, then check. The world motion does not change.";
      reveal.disabled = true;
      return;
    }
    const result = challengeState.last;
    feedback.className = `feedback ${result.ok ? "hit" : "miss"}`;
    let text = `Yours: v_A/B = ${formatSigned(result.vAB, "m/s")}`;
    if (result.time != null) text += `, t = ${formatUnsigned(result.time, "s")}`;
    text += result.ok ? ". Close enough." : ". Remember v_A/B = v_A − v_B, not the other way around.";
    if (challengeState.revealed) text += ` Hint: ${challengeState.spec.solutionHint}`;
    feedback.textContent = text;
    reveal.disabled = false;
  }

  function applyMotion(params) {
    stopLoop();
    state = createState({ ...params, frame: params.frame ?? state.frame });
    paint();
  }

  const challenge = bindChallenge(root, {
    generate: generateChallenge,
    apply(spec) {
      if (!spec) return;
      applyMotion({ ...spec.params, frame: "ground" });
    },
    describeCard,
    describeFeedback,
  });

  function syncInputs() {
    if (document.activeElement !== xAInput) xAInput.value = String(state.xA0);
    if (document.activeElement !== vAInput) vAInput.value = String(state.vA);
    if (document.activeElement !== xBInput) xBInput.value = String(state.xB0);
    if (document.activeElement !== vBInput) vBInput.value = String(state.vB);
    if (document.activeElement !== tInput) tInput.value = String(state.duration);
    PRESETS.forEach((preset) => {
      const btn = root.querySelector(`[data-preset="${preset.id}"]`);
      const active =
        preset.xA === state.xA0 &&
        preset.vA === state.vA &&
        preset.xB === state.xB0 &&
        preset.vB === state.vB;
      btn?.classList.toggle("active", active);
    });
    PLAYBACK_SPEEDS.forEach((speed) => {
      root.querySelector(`[data-speed="${speed}"]`)?.classList.toggle("active", speed === playback);
    });
    FRAMES.forEach((frame) => {
      root.querySelector(`[data-frame="${frame.id}"]`)?.classList.toggle("active", state.frame === frame.id);
    });
    const busy = running;
    [xAInput, vAInput, xBInput, vBInput, tInput].forEach((el) => {
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
    view = renderTrack(canvas, state);
    renderDiagram(diagram, state);
    const snap = snapshot(state);
    const shown = viewInFrame(state, state.frame);
    const frameLabel = FRAMES.find((f) => f.id === state.frame)?.label ?? "Ground";
    root.querySelector("#read-frame").textContent = frameLabel;
    root.querySelector("#read-t").textContent = formatUnsigned(snap.time, "s");
    root.querySelector("#read-xa").textContent = formatSigned(shown.xA, "m");
    root.querySelector("#read-va").textContent = formatSigned(shown.vA, "m/s");
    root.querySelector("#read-xb").textContent = formatSigned(shown.xB, "m");
    root.querySelector("#read-vb").textContent = formatSigned(shown.vB, "m/s");
    root.querySelector("#read-xab").textContent = formatSigned(snap.xAB, "m");
    root.querySelector("#read-vab").textContent = formatSigned(snap.vAB, "m/s");
    root.querySelector("#read-xba").textContent = formatSigned(snap.xBA, "m");
    root.querySelector("#read-vba").textContent = formatSigned(snap.vBA, "m/s");
    const meet = meetingForecast({ xA: state.xA0, vA: state.vA, xB: state.xB0, vB: state.vB }, state.duration);
    const meetEl = root.querySelector("#read-meet");
    if (meet.kind === "future" || meet.kind === "now") {
      meetEl.textContent = formatUnsigned(meet.time, "s");
    } else {
      meetEl.textContent = "No future meeting within the current conditions.";
    }
    const note = root.querySelector("#frame-note");
    const sameV = Math.abs(state.vA - state.vB) < 1e-9;
    if (sameV && state.frame === "ground") {
      note.textContent = "Both objects are moving relative to the ground. Neither is moving relative to the other (v_A/B = 0).";
    } else if (sameV) {
      note.textContent = `In ${frameLabel}'s frame both objects are at rest. They still move relative to the ground.`;
    } else if (state.frame === "ground") {
      note.textContent = "Positions and velocities below are relative to the ground.";
    } else {
      note.textContent = `Object ${state.frame} sits at x = 0. The other object's numbers are relative to ${state.frame}.`;
    }
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
    if (state.time >= state.duration - 1e-9) {
      const frame = state.frame;
      state = resetState(state);
      state.frame = frame;
    }
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

  function paramsFromUi() {
    return {
      xA: readNumber(xAInput, state.xA0),
      vA: readNumber(vAInput, state.vA),
      xB: readNumber(xBInput, state.xB0),
      vB: readNumber(vBInput, state.vB),
      duration: readNumber(tInput, state.duration),
      frame: state.frame,
    };
  }

  function seek(t) {
    stopLoop();
    const frame = state.frame;
    state = createState(paramsFromUi());
    state.frame = frame;
    stepTo(state, t);
    paint();
  }

  function applyDrag(which, displayed) {
    const params = paramsFromUi();
    if (params.frame === "A") {
      if (which !== "B") return null;
      params.xB = params.xA + displayed;
      return params;
    }
    if (params.frame === "B") {
      if (which !== "A") return null;
      params.xA = params.xB + displayed;
      return params;
    }
    if (which === "A") params.xA = displayed;
    else params.xB = displayed;
    return params;
  }

  const onPointerDown = (event) => {
    if (running || state.time > 1e-9 || !view) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const displayed = xToWorld(event.clientX - rect.left, view);
    const shown = viewInFrame(state, state.frame);
    const which = Math.abs(displayed - shown.xA) <= Math.abs(displayed - shown.xB) ? "A" : "B";
    if (state.frame === "A" && which === "A") return;
    if (state.frame === "B" && which === "B") return;
    const params = applyDrag(which, displayed);
    if (!params) return;
    dragging = which;
    canvas.style.cursor = "grabbing";
    canvas.setPointerCapture(event.pointerId);
    applyMotion(params);
  };
  const onPointerMove = (event) => {
    if (!dragging || !view) return;
    const rect = canvas.getBoundingClientRect();
    const displayed = xToWorld(event.clientX - rect.left, view);
    const params = applyDrag(dragging, displayed);
    if (params) applyMotion(params);
  };
  const onPointerUp = () => {
    dragging = null;
    canvas.style.cursor = state.time === 0 ? "grab" : "default";
  };

  const download = bindDownload(root, {
    filename: "ap-physics-1-1-4-trials",
    getTable() {
      return {
        title: "AP Physics 1 — 1.4 Reference Frames and Relative Motion",
        columns: [
          "Trial",
          "Frame",
          "Time (s)",
          "x_A (m)",
          "v_A (m/s)",
          "x_B (m)",
          "v_B (m/s)",
          "v_A/B (m/s)",
        ],
        rows: trials.list().map((t) => [t.id, t.frame, t.time, t.xA, t.vA, t.xB, t.vB, t.vAB]),
      };
    },
  });
  const unbindFullscreen = bindFullscreen(root.querySelector("#btn-fullscreen"));
  const unbindTutorial = bindTutorial(root, { simulationId: "1-4" });

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
  root.querySelector("#btn-check-14").addEventListener("click", () => {
    if (challenge.state.active && challenge.state.spec) {
      challenge.markAttempt(evaluateChallenge(trialSnapshot(), challenge.state.spec));
    }
    if (autoRecord && state.time > 1e-9) trials.record(trialSnapshot());
  });
  root.querySelectorAll("[data-frame]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.frame = btn.dataset.frame;
      paint();
    });
  });
  root.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = PRESETS.find((p) => p.id === btn.dataset.preset);
      if (!preset) return;
      applyMotion({ ...preset, duration: state.duration, frame: state.frame });
    });
  });
  root.querySelectorAll("[data-speed]").forEach((btn) => {
    btn.addEventListener("click", () => {
      playback = Number(btn.dataset.speed);
      syncInputs();
    });
  });
  [xAInput, vAInput, xBInput, vBInput, tInput].forEach((input) => {
    input.addEventListener("change", () => applyMotion(paramsFromUi()));
  });
  root.querySelector("#auto-record").addEventListener("change", (event) => {
    autoRecord = event.target.checked;
  });
  root.querySelector("#btn-record").addEventListener("click", () => trials.record(trialSnapshot()));
  root.querySelector("#btn-clear").addEventListener("click", () => trials.clear());
  const onGraphClick = (event) => {
    if (running) return;
    seek(timeAtPointer(event.currentTarget, event, state.duration));
  };
  graphXt.addEventListener("click", onGraphClick);
  graphVt.addEventListener("click", onGraphClick);
  graphFrame?.addEventListener("click", onGraphClick);

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
  resize.observe(diagram);
  [graphXt, graphVt, graphFrame, graphRange, graphHeight].forEach((el) => {
    if (el) resize.observe(el);
  });

  trials.render(trialBody);
  download.sync();
  paint();
  drawCharts();

  return () => {
    stopLoop();
    download.destroy();
    unbindFullscreen?.();
    unbindTutorial?.();
    resize.disconnect();
    window.removeEventListener("keydown", onKey);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
    graphXt.removeEventListener("click", onGraphClick);
    graphVt.removeEventListener("click", onGraphClick);
    graphFrame?.removeEventListener("click", onGraphClick);
  };
}
