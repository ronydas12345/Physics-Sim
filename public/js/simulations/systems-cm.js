import {
  AXIS_PAD,
  DIAGRAM_DT,
  DT,
  PLAYBACK_SPEEDS,
  PRESETS,
  SYSTEMS,
  createState,
  evaluateChallenge,
  formatSigned,
  formatUnsigned,
  generateChallenge,
  historySeries,
  liveObjects,
  motionDiagramSamples,
  pairForceClass,
  reset as resetState,
  snapshot,
  stepTo,
  teacherReport,
} from "/lib/systems1d.js";
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

const COLOR_A = "#c45c26";
const COLOR_B = "#1c6b73";
const COLOR_CM = "#7a3e08";

function worldToX(world, view) {
  return view.originX + world * view.scale;
}

function xToWorld(px, view) {
  return (px - view.originX) / view.scale;
}

function axisBounds(live, xCM) {
  const xs = [...live.map((o) => o.x), xCM, 0];
  const lo = Math.min(-20, ...xs) - AXIS_PAD;
  const hi = Math.max(20, ...xs) + AXIS_PAD;
  return {
    min: Math.floor(lo / 5) * 5,
    max: Math.ceil(hi / 5) * 5,
  };
}

function createView(canvas, live, xCM) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = Math.max(1, canvas.clientWidth);
  const cssH = Math.max(1, canvas.clientHeight);
  const w = Math.round(cssW * dpr);
  const h = Math.round(cssH * dpr);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const pad = { l: 36, r: 36, t: 44, b: 36 };
  const { min, max } = axisBounds(live, xCM);
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
    ctx.strokeStyle = "rgba(27,36,48,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - (major ? 10 : 5));
    ctx.lineTo(x, y + (major ? 10 : 5));
    ctx.stroke();
    if (major) {
      ctx.fillStyle = "#1b2430";
      ctx.fillText(String(world), x, y + 12);
    }
  }
}

function massRadius(mass) {
  return Math.max(8, Math.min(22, 7 + 4 * Math.sqrt(Math.max(mass, 0.1))));
}

function drawBody(ctx, x, y, color, label, mass) {
  const r = massRadius(mass);
  ctx.beginPath();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.arc(x, y, r + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.strokeStyle = "#1b2430";
  ctx.lineWidth = 2;
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "700 12px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y);
}

function drawDiamond(ctx, x, y, size, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
}

function objectById(list, id) {
  return list.find((obj) => obj.id === id);
}

function renderTrack(canvas, state) {
  const live = liveObjects(state);
  const snap = snapshot(state);
  const view = createView(canvas, live, snap.xCM);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, view.cssW, view.cssH);
  fillSky(ctx, view.cssW, view.cssH);

  const sysLabel = SYSTEMS.find((s) => s.id === state.system)?.label ?? "A + B";
  ctx.fillStyle = "#1b2430";
  ctx.font = "700 16px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(`System ${sysLabel} · t = ${state.time.toFixed(2)} s`, view.cssW / 2, 8);

  const yA = view.cssH * 0.4;
  const yB = view.cssH * 0.68;
  const yAxis = (yA + yB) / 2;
  drawAxis(ctx, view, yAxis);

  const A = objectById(live, "A");
  const B = objectById(live, "B");
  const xA = worldToX(A.x, view);
  const xB = worldToX(B.x, view);
  const xCM = worldToX(snap.xCM, view);
  const members = new Set((SYSTEMS.find((s) => s.id === state.system) || SYSTEMS[0]).members);

  const xs = [];
  if (members.has("A")) xs.push(xA);
  if (members.has("B")) xs.push(xB);
  xs.push(xCM);
  const yTop = Math.min(members.has("A") ? yA - 38 : Infinity, members.has("B") ? yB - 38 : Infinity, yAxis - 28);
  const yBot = Math.max(members.has("A") ? yA + 38 : -Infinity, members.has("B") ? yB + 38 : -Infinity, yAxis + 28);
  const boxL = Math.min(...xs) - 28;
  const boxR = Math.max(...xs) + 28;
  ctx.strokeStyle = "rgba(27, 36, 48, 0.35)";
  ctx.lineWidth = 1.6;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(boxL, yTop, Math.max(48, boxR - boxL), yBot - yTop, 12);
  else ctx.rect(boxL, yTop, Math.max(48, boxR - boxL), yBot - yTop);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(27, 36, 48, 0.55)";
  ctx.font = "700 11px Figtree, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("SYSTEM", boxL + 8, yTop - 4);

  if (Math.abs(A.v) > 0.05) drawArrow(ctx, xA, yA - 30, xA + Math.max(-70, Math.min(70, A.v * 8)), yA - 30, COLOR_A);
  if (Math.abs(B.v) > 0.05) drawArrow(ctx, xB, yB + 30, xB + Math.max(-70, Math.min(70, B.v * 8)), yB + 30, COLOR_B);
  if (Math.abs(snap.vCM) > 0.05) {
    drawArrow(ctx, xCM, yAxis - 4, xCM + Math.max(-70, Math.min(70, snap.vCM * 8)), yAxis - 4, COLOR_CM);
  }

  if (Math.abs(state.internalForce) > 0.05) {
    const mid = (xA + xB) / 2;
    const dir = state.internalForce > 0 ? 1 : -1;
    drawArrow(ctx, mid - 18 * dir, yAxis + 18, mid + 22 * dir, yAxis + 18, "#5c6b7a");
    ctx.fillStyle = "#5c6b7a";
    ctx.font = "700 11px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`${pairForceClass(state.system)} A↔B`, mid, yAxis + 22);
  }
  if (Math.abs(state.externalForce) > 0.05) {
    drawArrow(ctx, xCM, yAxis + 28, xCM + Math.max(-80, Math.min(80, state.externalForce * 4)), yAxis + 28, "#2c6e49");
    ctx.fillStyle = "#2c6e49";
    ctx.font = "700 11px IBM Plex Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("F_ext", xCM, yAxis + 32);
  }

  drawBody(ctx, xA, yA, COLOR_A, "A", A.mass);
  drawBody(ctx, xB, yB, COLOR_B, "B", B.mass);
  drawDiamond(ctx, xCM, yAxis, 10, "#f0a202", "#1b2430");
  ctx.fillStyle = "#1b2430";
  ctx.font = "700 12px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("CM", xCM, yAxis - 14);

  return view;
}

function renderDiagram(canvas, state) {
  const live = liveObjects(state);
  const snap = snapshot(state);
  const view = createView(canvas, live, snap.xCM);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, view.cssW, view.cssH);
  ctx.fillStyle = "#fbf7ef";
  ctx.fillRect(0, 0, view.cssW, view.cssH);
  const yA = view.cssH * 0.28;
  const yCM = view.cssH * 0.52;
  const yB = view.cssH * 0.76;
  drawAxis(ctx, view, yCM);
  const dots = motionDiagramSamples(state, DIAGRAM_DT);
  function paintRow(getX, y, color) {
    dots.forEach((dot, i) => {
      const x = worldToX(getX(dot), view);
      const last = i === dots.length - 1;
      if (y === yCM) {
        drawDiamond(ctx, x, y, last ? 7 : 5, last ? "#c45c26" : color, "#1b2430");
      } else {
        ctx.fillStyle = last ? "#c45c26" : color;
        ctx.beginPath();
        ctx.arc(x, y, last ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
  paintRow((d) => objectById(d.objects, "A")?.x ?? 0, yA, COLOR_A);
  paintRow((d) => d.xCM, yCM, "#f0a202");
  paintRow((d) => objectById(d.objects, "B")?.x ?? 0, yB, COLOR_B);
  ctx.fillStyle = "#4d5a68";
  ctx.font = "600 12px Figtree, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`A  ·  Δt = ${DIAGRAM_DT.toFixed(2)} s`, view.pad.l, 14);
  ctx.fillText("CM", view.pad.l, yCM - 16);
  ctx.fillText("B", view.pad.l, view.cssH - 10);
}

export function mountSystemsCM(root) {
  const canvas = root.querySelector("#axis-canvas");
  const diagram = root.querySelector("#diagram-canvas");
  const graphXt = root.querySelector("#graph-xt");
  const graphVt = root.querySelector("#graph-vt");
  const graphRange = root.querySelector("#graph-range");
  const graphHeight = root.querySelector("#graph-height");
  const trialBody = root.querySelector("#trial-body");
  const mAInput = root.querySelector("#ma-input");
  const xAInput = root.querySelector("#xa-input");
  const vAInput = root.querySelector("#va-input");
  const mBInput = root.querySelector("#mb-input");
  const xBInput = root.querySelector("#xb-input");
  const vBInput = root.querySelector("#vb-input");
  const fExtInput = root.querySelector("#fext-input");
  const fIntInput = root.querySelector("#fint-input");
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
  let graphs = { x: true, v: true };
  let identityOn = () => false;

  const trials = createTrialBook({
    columns: 10,
    renderRow: (t) => `<tr>
      <td>${t.id}</td>
      <td>${t.system}</td>
      <td>${formatUnsigned(t.time, "s")}</td>
      <td>${formatUnsigned(t.mA, "kg")}</td>
      <td>${formatUnsigned(t.mB, "kg")}</td>
      <td>${formatSigned(t.xCM, "m")}</td>
      <td>${formatSigned(t.vCM, "m/s")}</td>
      <td>${formatUnsigned(t.M, "kg")}</td>
      <td>${formatSigned(t.p, "kg·m/s")}</td>
      <td>${formatSigned(t.Fext, "N")}</td>
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
      system: snap.system,
      time: snap.time,
      mA: snap.A.mass,
      xA: snap.A.x,
      vA: snap.A.v,
      mB: snap.B.mass,
      xB: snap.B.x,
      vB: snap.B.v,
      xCM: snap.xCM,
      vCM: snap.vCM,
      aCM: snap.aCM,
      M: snap.M,
      p: snap.p,
      Fext: snap.externalForce,
      massB: snap.B.mass,
    };
  }

  function drawLiveGraphs() {
    if (activeTab !== "lab") return;
    const history = historySeries(state);
    if (graphs.x) {
      renderTimeSeries(graphXt, history, {
        series: [
          { yKey: "xA", color: COLOR_A, label: "A" },
          { yKey: "xB", color: COLOR_B, label: "B" },
          { yKey: "xCM", color: COLOR_CM, label: "CM" },
        ],
        xLabel: "Time (s)",
        yLabel: "Position (m)",
        duration: state.duration,
        now: state.time,
      });
    }
    if (graphs.v) {
      renderTimeSeries(graphVt, history, {
        series: [
          { yKey: "vA", color: COLOR_A, label: "A" },
          { yKey: "vB", color: COLOR_B, label: "B" },
          { yKey: "vCM", color: COLOR_CM, label: "CM" },
        ],
        xLabel: "Time (s)",
        yLabel: "Velocity (m/s)",
        duration: state.duration,
        now: state.time,
      });
    }
  }

  function drawCharts() {
    if (activeTab !== "lab") return;
    const list = trials.list();
    const live = liveObjects(state);
    const A = objectById(live, "A");
    const B = objectById(live, "B");
    const snap0 = snapshot({ ...state, time: 0 });
    renderXYScatter(graphRange, list, {
      xKey: "massB",
      yKey: "xCM",
      xLabel: "Mass of B (kg)",
      yLabel: "x_CM (m)",
      color: COLOR_A,
      fitYName: "x_CM",
      fitXName: "m_B",
      identity: identityOn()
        ? {
            yOfX: (mB) => {
              if (state.system === "A") return A.x;
              if (state.system === "B") return B.x;
              return (A.mass * A.x + mB * B.x) / (A.mass + mB);
            },
            label:
              state.system === "AB"
                ? "x_CM = (m_A x_A + m_B x_B) / M"
                : "x_CM of the selected system",
            xMin: 0.1,
            xMax: 20,
          }
        : null,
    });
    renderXYScatter(graphHeight, list, {
      xKey: "time",
      yKey: "xCM",
      xLabel: "Time (s)",
      yLabel: "x_CM (m)",
      color: COLOR_CM,
      fitYName: "x_CM",
      fitXName: "t",
      identity: identityOn()
        ? {
            yOfX: (t) => snap0.xCM + snap0.vCM * t + 0.5 * snap0.aCM * t * t,
            label: "x_CM = x_CM0 + v_CM t + ½ a_CM t²",
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
    const reveal = host.querySelector("#btn-reveal");
    const feedback = host.querySelector("#challenge-feedback");
    reveal.disabled = !challengeState.attempted;
    if (!challengeState.last) {
      feedback.textContent = "The solution stays hidden until you check.";
      return;
    }
    if (challengeState.revealed) {
      feedback.textContent = challengeState.spec.solutionHint;
      return;
    }
    feedback.textContent = challengeState.last.ok
      ? "That matches the identity. Record a trial if you want it in the table."
      : "Not yet. Adjust the system and check again.";
  }

  function applyMotion(params) {
    state = createState({ ...params, system: params.system ?? state.system });
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

  function readNumber(input, fallback) {
    const n = Number(input.value);
    return Number.isFinite(n) ? n : fallback;
  }

  function paramsFromUi() {
    const A = objectById(state.objects, "A");
    const B = objectById(state.objects, "B");
    return {
      objects: [
        { id: "A", name: "A", mass: readNumber(mAInput, A.mass), x: readNumber(xAInput, A.x0), v: readNumber(vAInput, A.v0) },
        { id: "B", name: "B", mass: readNumber(mBInput, B.mass), x: readNumber(xBInput, B.x0), v: readNumber(vBInput, B.v0) },
      ],
      system: state.system,
      externalForce: readNumber(fExtInput, state.externalForce),
      internalForce: readNumber(fIntInput, state.internalForce),
      duration: readNumber(tInput, state.duration),
    };
  }

  function syncInputs() {
    const A = objectById(state.objects, "A");
    const B = objectById(state.objects, "B");
    if (document.activeElement !== mAInput) mAInput.value = String(A.mass);
    if (document.activeElement !== xAInput) xAInput.value = String(A.x0);
    if (document.activeElement !== vAInput) vAInput.value = String(A.v0);
    if (document.activeElement !== mBInput) mBInput.value = String(B.mass);
    if (document.activeElement !== xBInput) xBInput.value = String(B.x0);
    if (document.activeElement !== vBInput) vBInput.value = String(B.v0);
    if (document.activeElement !== fExtInput) fExtInput.value = String(state.externalForce);
    if (document.activeElement !== fIntInput) fIntInput.value = String(state.internalForce);
    if (document.activeElement !== tInput) tInput.value = String(state.duration);
    PRESETS.forEach((preset) => {
      const btn = root.querySelector(`[data-preset="${preset.id}"]`);
      const sameObjs =
        preset.objects[0].mass === A.mass &&
        preset.objects[0].x === A.x0 &&
        preset.objects[0].v === A.v0 &&
        preset.objects[1].mass === B.mass &&
        preset.objects[1].x === B.x0 &&
        preset.objects[1].v === B.v0 &&
        preset.externalForce === state.externalForce &&
        preset.internalForce === state.internalForce;
      btn?.classList.toggle("active", sameObjs);
    });
    PLAYBACK_SPEEDS.forEach((speed) => {
      root.querySelector(`[data-speed="${speed}"]`)?.classList.toggle("active", speed === playback);
    });
    SYSTEMS.forEach((sys) => {
      root.querySelector(`[data-system="${sys.id}"]`)?.classList.toggle("active", state.system === sys.id);
    });
    const busy = running;
    [mAInput, xAInput, vAInput, mBInput, xBInput, vBInput, fExtInput, fIntInput, tInput].forEach((el) => {
      el.disabled = busy;
    });
    root.querySelector("#btn-play").disabled = busy;
    root.querySelector("#btn-pause").disabled = !busy;
    root.querySelector("#btn-step").disabled = busy;
    root.querySelectorAll("[data-preset], [data-system]").forEach((btn) => {
      btn.disabled = busy;
    });
    canvas.style.cursor = !busy && state.time === 0 ? "grab" : "default";
  }

  function paint() {
    view = renderTrack(canvas, state);
    renderDiagram(diagram, state);
    const snap = snapshot(state);
    const sysLabel = SYSTEMS.find((s) => s.id === state.system)?.label ?? "A + B";
    root.querySelector("#read-system").textContent = sysLabel;
    root.querySelector("#read-t").textContent = formatUnsigned(snap.time, "s");
    root.querySelector("#read-m").textContent = formatUnsigned(snap.M, "kg");
    root.querySelector("#read-xcm").textContent = formatSigned(snap.xCM, "m");
    root.querySelector("#read-vcm").textContent = formatSigned(snap.vCM, "m/s");
    root.querySelector("#read-acm").textContent = formatSigned(snap.aCM, "m/s²");
    root.querySelector("#read-p").textContent = formatSigned(snap.p, "kg·m/s");
    root.querySelector("#read-fext").textContent = formatSigned(snap.externalForce, "N");
    root.querySelector("#read-ma").textContent = formatUnsigned(snap.A.mass, "kg");
    root.querySelector("#read-xa").textContent = formatSigned(snap.A.x, "m");
    root.querySelector("#read-va").textContent = formatSigned(snap.A.v, "m/s");
    root.querySelector("#read-mb").textContent = formatUnsigned(snap.B.mass, "kg");
    root.querySelector("#read-xb").textContent = formatSigned(snap.B.x, "m");
    root.querySelector("#read-vb").textContent = formatSigned(snap.B.v, "m/s");
    const pair = pairForceClass(state.system);
    root.querySelector("#force-note").textContent =
      state.system === "AB"
        ? `A↔B is ${pair} to A + B, so it cannot change a_CM. F_ext is external and a_CM = F_ext / M.`
        : `A↔B is ${pair} to this system. The same pair force that cancelled inside A + B now changes this system's motion.`;
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
    if (state.time >= state.duration - 1e-9) {
      const system = state.system;
      state = resetState(state);
      state.system = system;
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

  function seek(t) {
    stopLoop();
    const system = state.system;
    state = createState(paramsFromUi());
    state.system = system;
    stepTo(state, t);
    paint();
  }

  const onPointerDown = (event) => {
    if (running || state.time > 1e-9 || !view) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const world = xToWorld(event.clientX - rect.left, view);
    const live = liveObjects(state);
    const A = objectById(live, "A");
    const B = objectById(live, "B");
    dragging = Math.abs(world - A.x) <= Math.abs(world - B.x) ? "A" : "B";
    canvas.style.cursor = "grabbing";
    canvas.setPointerCapture(event.pointerId);
    const params = paramsFromUi();
    const target = params.objects.find((o) => o.id === dragging);
    if (target) target.x = world;
    applyMotion(params);
  };
  const onPointerMove = (event) => {
    if (!dragging || !view) return;
    const rect = canvas.getBoundingClientRect();
    const world = xToWorld(event.clientX - rect.left, view);
    const params = paramsFromUi();
    const target = params.objects.find((o) => o.id === dragging);
    if (target) target.x = world;
    applyMotion(params);
  };
  const onPointerUp = () => {
    dragging = null;
    canvas.style.cursor = state.time === 0 ? "grab" : "default";
  };

  const download = bindDownload(root, {
    filename: "ap-physics-1-2-1-trials",
    getTable() {
      return {
        title: "AP Physics 1 — 2.1 Systems and Center of Mass",
        columns: [
          "Trial",
          "System",
          "Time (s)",
          "m_A (kg)",
          "m_B (kg)",
          "x_CM (m)",
          "v_CM (m/s)",
          "M (kg)",
          "p (kg m/s)",
          "F_ext (N)",
        ],
        rows: trials.list().map((t) => [t.id, t.system, t.time, t.mA, t.mB, t.xCM, t.vCM, t.M, t.p, t.Fext]),
      };
    },
  });
  const unbindFullscreen = bindFullscreen(root.querySelector("#btn-fullscreen"));

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
  root.querySelector("#btn-check-21").addEventListener("click", () => {
    if (challenge.state.active && challenge.state.spec) {
      challenge.markAttempt(evaluateChallenge(trialSnapshot(), challenge.state.spec));
    }
    if (autoRecord && state.time > 1e-9) trials.record(trialSnapshot());
  });
  root.querySelectorAll("[data-system]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = state.time;
      state = createState({ ...paramsFromUi(), system: btn.dataset.system });
      if (t > 1e-12) stepTo(state, Math.min(t, state.duration));
      paint();
    });
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
  [mAInput, xAInput, vAInput, mBInput, xBInput, vBInput, fExtInput, fIntInput, tInput].forEach((input) => {
    input.addEventListener("change", () => applyMotion(paramsFromUi()));
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
    resize.disconnect();
    window.removeEventListener("keydown", onKey);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
  };
}
