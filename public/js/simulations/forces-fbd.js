import {
  CARDINALS,
  DIAGRAM_DT,
  DT,
  PLAYBACK_SPEEDS,
  SCENARIOS,
  addForce,
  createState,
  directionInfo,
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
  scaleForceMagnitude,
  setForce,
  setGravity,
  setMass,
  snapshot,
  stepTo,
  teacherReport,
} from "/lib/forces.js";
import { renderTimeSeries, renderXYScatter, timeAtPointer } from "../graphs.js";
import { planetById, sceneForGravity } from "/lib/planets.js";
import {
  bindCameraMode,
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
import { CAMERA, cameraRange, cameraScale } from "/lib/camera.js";

const FORCE_COLOR = {
  gravity: "#c45c26",
  normal: "#1c6b73",
  applied: "#7a3e08",
  friction: "#5c4634",
  tension: "#2c6e49",
  net: "#1b2430",
};

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

function drawForceArrows(ctx, originX, originY, forces, { showNet, net, showLabels = true, dashedNet = true }) {
  for (const force of enabledForces(forces)) {
    const len = scaleForceMagnitude(force.magnitude);
    const rad = (force.direction * Math.PI) / 180;
    const x2 = originX + len * Math.cos(rad);
    const y2 = originY - len * Math.sin(rad);
    drawArrow(ctx, originX, originY, x2, y2, colorOf(force.type), 3);
    if (showLabels) {
      ctx.fillStyle = colorOf(force.type);
      ctx.font = "700 11px Figtree, sans-serif";
      ctx.textAlign = x2 >= originX ? "left" : "right";
      ctx.textBaseline = y2 <= originY ? "bottom" : "top";
      const info = directionInfo(force.direction);
      ctx.fillText(`${force.symbol} ${formatUnsigned(force.magnitude, "N")} ${info.arrow}`, x2 + (x2 >= originX ? 6 : -6), y2);
    }
  }
  if (showNet && net && net.magnitude > 0.001) {
    const len = scaleForceMagnitude(net.magnitude);
    const rad = (net.direction * Math.PI) / 180;
    const x2 = originX + len * Math.cos(rad);
    const y2 = originY - len * Math.sin(rad);
    ctx.save();
    if (dashedNet) ctx.setLineDash([6, 4]);
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

function drawBox(ctx, x, y, w, h) {
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
  ctx.fillText("Box", x, y);
}

function drawAxes(ctx, x, y, ink = "rgba(27,36,48,0.7)") {
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x - 28, y);
  ctx.lineTo(x + 36, y);
  ctx.moveTo(x, y + 28);
  ctx.lineTo(x, y - 36);
  ctx.stroke();
  ctx.font = "600 10px IBM Plex Mono, monospace";
  ctx.textAlign = "left";
  ctx.fillText("+x", x + 38, y + 4);
  ctx.textAlign = "center";
  ctx.fillText("+y", x, y - 40);
  ctx.restore();
}

const VIEW_SPAN_M = 22;
const HANG_SPAN_M = 12;
const VIEW_EDGE_M = 3.5;
const GROUND_POST_X = 10;
const CEILING_Y = 5;
const CAMERA_EXTRA = {
  pad: VIEW_EDGE_M,
  minSpan: VIEW_SPAN_M,
  followSpan: VIEW_SPAN_M,
  followEdge: VIEW_EDGE_M,
};
const HANG_CAMERA_EXTRA = {
  pad: VIEW_EDGE_M,
  minSpan: HANG_SPAN_M,
  followSpan: HANG_SPAN_M,
  followEdge: VIEW_EDGE_M,
};

function worldView(canvas, state, live, cameraOpts = {}) {
  const { cssW, cssH, dpr } = sizeCanvas(canvas);
  const hanging = state.environment === "hanging";
  const pad = { l: 48, r: 28, t: 36, b: hanging ? 24 : 34 };
  const plotW = Math.max(1, cssW - pad.l - pad.r);
  const plotH = Math.max(1, cssH - pad.t - pad.b);
  if (hanging) {
    const { lo, hi, span } = cameraRange([live.y], {
      mode: CAMERA.ORIGIN,
      ...HANG_CAMERA_EXTRA,
      plotPx: plotH,
      ...cameraOpts,
    });
    const scale = cameraScale(span, plotH);
    const originX = cssW / 2;
    const originY = pad.t + hi * scale;
    return {
      cssW,
      cssH,
      dpr,
      hanging,
      pad,
      lo,
      hi,
      scale,
      originX,
      originY,
      groundY: cssH,
      boxX: originX,
      boxY: originY - live.y * scale,
    };
  }
  const { lo, hi, span } = cameraRange([live.x], {
    mode: CAMERA.ORIGIN,
    ...CAMERA_EXTRA,
    plotPx: plotW,
    ...cameraOpts,
  });
  const scale = cameraScale(span, plotW);
  const originX = pad.l + (0 - lo) * scale;
  const groundY = cssH - pad.b;
  return {
    cssW,
    cssH,
    dpr,
    hanging,
    pad,
    lo,
    hi,
    scale,
    originX,
    originY: groundY,
    groundY,
    boxX: originX + live.x * scale,
    boxY: groundY - 28,
  };
}

function xOf(world, view) {
  return view.originX + world * view.scale;
}

function yOf(world, view) {
  return view.originY - world * view.scale;
}

function renderScene(canvas, state, scene, cameraOpts = {}) {
  const live = liveState(state);
  const view = worldView(canvas, state, live, cameraOpts);
  const { cssW, cssH, dpr, hanging, lo, hi, scale, originX, originY, groundY, boxX, boxY } = view;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  const sky = ctx.createLinearGradient(0, 0, 0, hanging ? cssH : groundY);
  sky.addColorStop(0, scene.skyTop);
  sky.addColorStop(1, scene.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, cssW, cssH);

  if (state.visual?.floor) {
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
    ctx.strokeStyle = scene.grid;
    ctx.lineWidth = 1;
    for (let wx = Math.ceil(lo / 5) * 5; wx <= hi; wx += 5) {
      if (wx === 0) continue;
      const x = xOf(wx, view);
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, groundY - 26);
      ctx.stroke();
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
      if (wx % 5 === 0 || wx === 0) ctx.fillText(`${wx} m`, x, groundY + 14);
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
  } else {
    ctx.strokeStyle = scene.axis;
    ctx.fillStyle = scene.ink;
    ctx.lineWidth = 1.4;
    ctx.font = "12px IBM Plex Mono, monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let wy = Math.ceil(lo); wy <= Math.floor(hi); wy += 1) {
      const y = yOf(wy, view);
      if (y < 28 || y > cssH - 16) continue;
      ctx.beginPath();
      ctx.moveTo(originX - (wy === 0 ? 12 : 6), y);
      ctx.lineTo(originX + (wy === 0 ? 12 : 6), y);
      ctx.stroke();
      if (wy % 2 === 0 || wy === 0) ctx.fillText(`${wy} m`, originX - 16, y);
    }
  }

  const trail = motionDiagramSamples(state, DIAGRAM_DT);
  ctx.fillStyle = scene.ink;
  for (const sample of trail) {
    if (sample.time >= state.time - 1e-9) continue;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    if (hanging) ctx.arc(originX, yOf(sample.y, view), 5, 0, Math.PI * 2);
    else ctx.arc(xOf(sample.x, view), boxY, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (state.visual?.rope === "up") {
    const ceilY = yOf(CEILING_Y, view);
    ctx.fillStyle = scene.groundDark;
    if (ceilY > -12) ctx.fillRect(0, ceilY - 8, cssW, 10);
    ctx.strokeStyle = scene.soil;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(originX, ceilY);
    ctx.lineTo(boxX, boxY - 28);
    ctx.stroke();
  }
  if (state.visual?.rope === "right") {
    const postX = xOf(GROUND_POST_X, view);
    ctx.strokeStyle = scene.soil;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(boxX + 28, boxY);
    ctx.lineTo(postX, boxY);
    ctx.stroke();
    ctx.fillStyle = scene.groundDark;
    ctx.fillRect(postX - 4, boxY - 18, 8, groundY - (boxY - 18));
  }

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

  if (hanging) drawAxes(ctx, originX, originY, scene.axis);
  else if (originX > 8 && originX < cssW - 8) drawAxes(ctx, originX, groundY, scene.axis);
  drawBox(ctx, boxX, boxY, 74, 48);
  drawForceArrows(ctx, boxX, boxY, state.forces, {
    showNet: state.showNetForce,
    net: live.net,
  });

  ctx.fillStyle = scene.ink;
  ctx.font = "700 15px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const scen = SCENARIOS.find((s) => s.id === state.scenario);
  const planet = scene.name ? ` · ${scene.name}` : "";
  ctx.fillText(`${scen?.label || "Forces"} · ground frame · t = ${state.time.toFixed(2)} s${planet}`, cssW / 2, 8);
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
  drawAxes(ctx, 44, cssH - 28, theme.muted);
  ctx.fillStyle = theme.ink;
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "700 12px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("FBD", cx, cy - 14);
  const live = liveState(state);
  drawForceArrows(ctx, cx, cy, state.forces, {
    showNet: state.showNetForce,
    net: live.net,
  });
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
  const xs = dots.map((d) => d.x);
  xs.push(live.x, 0);
  const min = Math.min(-8, ...xs) - 2;
  const max = Math.max(8, ...xs) + 2;
  const pad = 36;
  const scale = (cssW - pad * 2) / Math.max(max - min, 1);
  const xOf = (x) => pad + (x - min) * scale;
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
    ctx.arc(xOf(dot.x), y, last ? 7 : 5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = theme.muted;
  ctx.font = "600 12px Figtree, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Motion diagram  ·  Δt = ${DIAGRAM_DT.toFixed(2)} s`, pad, 16);
}

function forceRow(force) {
  const dirs = CARDINALS.map(
    (c) => `<option value="${c.deg}"${Number(force.direction) === c.deg ? " selected" : ""}>${c.arrow} ${c.name}</option>`,
  ).join("");
  const extra =
    CARDINALS.some((c) => c.deg === Number(force.direction))
      ? ""
      : `<option value="${force.direction}" selected>${force.direction}°</option>`;
  const lockedDir = force.type === "gravity";
  return `<tr data-force-id="${force.id}">
    <td><label class="force-enable"><input type="checkbox" data-enabled ${force.enabled ? "checked" : ""} /> ${force.name} <span class="muted">${force.symbol}</span></label></td>
    <td><input class="force-mag" data-mag type="number" min="0" max="200" step="0.5" value="${force.magnitude}" aria-label="${force.name} magnitude in newtons" /></td>
    <td><select data-dir ${lockedDir ? "disabled" : ""} aria-label="${force.name} direction">${dirs}${extra}</select></td>
    <td class="muted">${force.source}</td>
    <td>${force.type === "gravity" ? "" : `<button type="button" class="text-link" data-remove>Remove</button>`}</td>
  </tr>`;
}

export function mountForcesFbd(root) {
  const canvas = root.querySelector("#axis-canvas");
  const fbd = root.querySelector("#fbd-canvas");
  const diagram = root.querySelector("#diagram-canvas");
  const graphXt = root.querySelector("#graph-xt");
  const graphVt = root.querySelector("#graph-vt");
  const graphRange = root.querySelector("#graph-range");
  const graphHeight = root.querySelector("#graph-height");
  const trialBody = root.querySelector("#trial-body");
  const forceBody = root.querySelector("#force-body");
  const massInput = root.querySelector("#mass-input");
  const gInput = root.querySelector("#g-input");
  const vInput = root.querySelector("#v-input");
  const tInput = root.querySelector("#duration-input");
  const addType = root.querySelector("#add-type");
  const addMag = root.querySelector("#add-mag");
  const addDir = root.querySelector("#add-dir");

  let state = createState();
  let planetId = "earth";
  let planetBackgrounds = true;
  let running = false;
  let raf = 0;
  let lastStamp = 0;
  let carry = 0;
  let playback = 1;
  let autoRecord = false;
  let camera;
  let activeTab = "lab";
  let graphs = { x: true, v: true };
  let identityOn = () => false;

  const trials = createTrialBook({
    columns: 8,
    renderRow: (t) => `<tr>
      <td>${t.id}</td>
      <td>${t.scenario}</td>
      <td>${formatUnsigned(t.time, "s")}</td>
      <td>${formatUnsigned(t.mass, "kg")}</td>
      <td>${formatUnsigned(t.Fg, "N")}</td>
      <td>${formatUnsigned(t.Fnet, "N")}</td>
      <td>${formatSigned(t.ax, "m/s²")}</td>
      <td>${t.forceState}</td>
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
      g: snap.g,
      Fg: snap.Fg,
      Fnet: snap.net.magnitude,
      Fnetx: snap.net.x,
      ax: snap.a.x,
      forceState: snap.forceState,
    };
  }

  function drawLiveGraphs() {
    if (activeTab !== "lab") return;
    const history = historySeries(state);
    if (graphs.x) {
      renderTimeSeries(graphXt, history, {
        series: [
          { yKey: "Fnetx", color: "#c45c26", label: "F_net,x" },
          { yKey: "Fnety", color: "#1c6b73", label: "F_net,y" },
        ],
        xLabel: "Time (s)",
        yLabel: "Net force (N)",
        duration: state.duration,
        now: state.time,
      });
    }
    if (graphs.v) {
      renderTimeSeries(graphVt, history, {
        series: [
          { yKey: "ax", color: "#c45c26", label: "a_x" },
          { yKey: "ay", color: "#1c6b73", label: "a_y" },
        ],
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
      xKey: "mass",
      yKey: "Fg",
      xLabel: "Mass (kg)",
      yLabel: "F_g (N)",
      color: "#c45c26",
      fitYName: "F_g",
      fitXName: "m",
      identity: identityOn()
        ? { yOfX: (m) => m * state.g, label: "F_g = m g", xMin: 0.1, xMax: 20 }
        : null,
    });
    renderXYScatter(graphHeight, list, {
      xKey: "Fnet",
      yKey: "ax",
      xLabel: "|F_net| (N)",
      yLabel: "a_x (m/s²)",
      color: "#1c6b73",
      fitYName: "a_x",
      fitXName: "|F_net|",
      identity: identityOn()
        ? { yOfX: (F) => F / Math.max(state.mass, 1e-9), label: "a = F_net / m", xMin: 0, xMax: 80 }
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
      feedback.textContent = "A free-body diagram includes forces acting ON the object, not velocity or the forces it exerts.";
      return;
    }
    if (challengeState.revealed) {
      feedback.textContent = challengeState.spec.solutionHint;
      return;
    }
    feedback.textContent = challengeState.last.ok
      ? "Correct. You identified the forces acting on the selected object."
      : "Not yet. Check the forces acting directly on the selected object.";
  }

  function applyPlanetGravity() {
    const planet = planetById(planetId);
    if (planet) setGravity(state, planet.g, planet.name);
    else setGravity(state, state.g, "Custom");
  }

  function applyScenario(params) {
    state = createState({
      ...params,
      g: params.g ?? state.g,
      dynamicMode: params.dynamicMode ?? state.dynamicMode,
      showNetForce: params.showNetForce ?? state.showNetForce,
      showComponents: params.showComponents ?? state.showComponents,
      showSources: params.showSources ?? state.showSources,
      duration: params.duration ?? state.duration,
    });
    applyPlanetGravity();
    paint();
  }

  const challenge = bindChallenge(root, {
    generate: generateChallenge,
    apply(spec) {
      if (!spec) return;
      planetId = "earth";
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
    const ids = state.forces.map((f) => f.id).join(",");
    if (forceBody.dataset.ids !== ids) {
      forceBody.dataset.ids = ids;
      forceBody.innerHTML = state.forces.map(forceRow).join("");
    }
    state.forces.forEach((force) => {
      const row = forceBody.querySelector(`[data-force-id="${force.id}"]`);
      if (!row) return;
      const en = row.querySelector("[data-enabled]");
      const mag = row.querySelector("[data-mag]");
      const dir = row.querySelector("[data-dir]");
      if (en && document.activeElement !== en) en.checked = force.enabled;
      if (mag && document.activeElement !== mag) mag.value = String(force.magnitude);
      if (dir && document.activeElement !== dir) dir.value = String(force.direction);
    });
  }

  function syncInputs() {
    const busy = running;
    if (document.activeElement !== massInput) massInput.value = String(state.mass);
    if (document.activeElement !== gInput) gInput.value = String(state.g);
    if (document.activeElement !== vInput) vInput.value = String(state.vx0);
    if (document.activeElement !== tInput) tInput.value = String(state.duration);
    root.querySelector("#toggle-dynamic").checked = state.dynamicMode;
    root.querySelector("#toggle-net").checked = state.showNetForce;
    root.querySelector("#toggle-components").checked = state.showComponents;
    root.querySelector("#toggle-sources").checked = state.showSources;
    SCENARIOS.forEach((scen) => {
      root.querySelector(`[data-scenario="${scen.id}"]`)?.classList.toggle("active", state.scenario === scen.id);
    });
    PLAYBACK_SPEEDS.forEach((speed) => {
      root.querySelector(`[data-speed="${speed}"]`)?.classList.toggle("active", speed === playback);
    });
    root.querySelectorAll("[data-planet]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.planet === planetId);
      btn.disabled = busy;
    });
    const bg = root.querySelector("#planet-backgrounds");
    if (bg && document.activeElement !== bg) bg.checked = planetBackgrounds;
    [massInput, gInput, vInput, tInput].forEach((el) => {
      el.disabled = busy;
    });
    root.querySelector("#btn-play").disabled = busy;
    root.querySelector("#btn-pause").disabled = !busy;
    root.querySelector("#btn-step").disabled = busy;
    root.querySelectorAll("[data-scenario]").forEach((btn) => {
      btn.disabled = busy;
    });
    forceBody.querySelectorAll("input, select, button").forEach((el) => {
      if (el.matches("[data-dir]")) {
        const id = el.closest("tr")?.dataset.forceId;
        const force = state.forces.find((f) => f.id === id);
        el.disabled = busy || force?.type === "gravity";
        return;
      }
      el.disabled = busy;
    });
    root.querySelector("#btn-add-force").disabled = busy;
    [addType, addMag, addDir].forEach((el) => {
      el.disabled = busy;
    });
    syncForceTable();
  }

  function paint() {
    const scene = sceneForGravity({ planetId, backgroundsOn: planetBackgrounds });
    const extra = state.environment === "hanging" ? HANG_CAMERA_EXTRA : CAMERA_EXTRA;
    renderScene(canvas, state, scene, camera?.options(extra) || { mode: CAMERA.ORIGIN, ...extra });
    renderFbd(fbd, state);
    renderDiagram(diagram, state);
    const snap = snapshot(state);
    const dir = snap.netDir;
    const planet = planetById(planetId);
    root.querySelector("#read-t").textContent = formatUnsigned(snap.time, "s");
    root.querySelector("#read-m").textContent = formatUnsigned(snap.mass, "kg");
    root.querySelector("#read-g").textContent = planet
      ? `${formatUnsigned(snap.g, "m/s²")} · ${planet.name}`
      : formatUnsigned(snap.g, "m/s²");
    root.querySelector("#read-v").textContent = formatSigned(snap.vx, "m/s");
    root.querySelector("#read-a").textContent = formatSigned(snap.a.x, "m/s²");
    root.querySelector("#read-fg").textContent = `${formatUnsigned(snap.Fg, "N")} ↓`;
    root.querySelector("#read-fnet").textContent =
      snap.balanced ? "0.00 N" : `${formatUnsigned(snap.net.magnitude, "N")} ${dir.arrow}`;
    root.querySelector("#read-fnetx").textContent = formatSigned(snap.net.x, "N");
    root.querySelector("#read-fnety").textContent = formatSigned(snap.net.y, "N");
    root.querySelector("#read-state").textContent = snap.forceState;
    const list = root.querySelector("#force-readout");
    list.innerHTML = snap.enabled
      .map((f) => {
        const info = directionInfo(f.direction);
        const src = state.showSources ? ` <span class="muted">${f.source} → Box</span>` : "";
        const comp = state.showComponents
          ? ` <span class="muted">Fx ${formatSigned(f.x, "N")}, Fy ${formatSigned(f.y, "N")}</span>`
          : "";
        return `<div><dt>${f.name} (${f.symbol})</dt><dd>${formatUnsigned(f.magnitude, "N")} ${info.arrow}${src}${comp}</dd></div>`;
      })
      .join("");
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
    state = createState({ scenario: "box-on-surface", dynamicMode: state.dynamicMode, showNetForce: state.showNetForce });
    planetId = "earth";
    planetBackgrounds = true;
    applyPlanetGravity();
    paint();
  }

  function seek(t) {
    stopLoop();
    const keep = {
      scenario: state.scenario,
      mass: state.mass,
      g: state.g,
      x0: state.x0,
      y0: state.y0,
      vx0: state.vx0,
      vy0: state.vy0,
      environment: state.environment,
      autoNormal: state.autoNormal,
      visual: state.visual,
      dynamicMode: state.dynamicMode,
      showNetForce: state.showNetForce,
      showComponents: state.showComponents,
      showSources: state.showSources,
      duration: state.duration,
      forces: state.forces,
    };
    state = createState(keep);
    stepTo(state, t);
    paint();
  }

  const download = bindDownload(root, {
    filename: "ap-physics-1-2-2-trials",
    getTable() {
      return {
        title: "AP Physics 1 — 2.2 Forces and Free-Body Diagrams",
        columns: ["Trial", "Scenario", "Time (s)", "Mass (kg)", "Fg (N)", "Fnet (N)", "a_x (m/s²)", "State"],
        rows: trials.list().map((t) => [t.id, t.scenario, t.time, t.mass, t.Fg, t.Fnet, t.ax, t.forceState]),
      };
    },
  });
  const unbindFullscreen = bindFullscreen(root.querySelector("#btn-fullscreen"));
  const unbindTutorial = bindTutorial(root, { simulationId: "2-2" });

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
  root.querySelector("#btn-check-22").addEventListener("click", () => {
    if (challenge.state.active && challenge.state.spec) {
      challenge.markAttempt(evaluateChallenge(snapshot(state), challenge.state.spec));
    }
    if (autoRecord && state.time > 1e-9) trials.record(trialSnapshot());
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
  root.querySelectorAll("[data-planet]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const planet = planetById(btn.dataset.planet);
      if (!planet) return;
      planetId = planet.id;
      setGravity(state, planet.g, planet.name);
      paint();
    });
  });
  root.querySelector("#planet-backgrounds")?.addEventListener("change", (event) => {
    planetBackgrounds = event.target.checked;
    paint();
  });
  massInput.addEventListener("change", () => {
    setMass(state, readNumber(massInput, state.mass));
    paint();
  });
  gInput.addEventListener("change", () => {
    const g = readNumber(gInput, state.g);
    const selected = planetById(planetId);
    if (selected && Math.abs(g - selected.g) > 0.05) planetId = null;
    setGravity(state, g, planetById(planetId)?.name || "Custom");
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
  root.querySelector("#toggle-dynamic").addEventListener("change", (event) => {
    state.dynamicMode = event.target.checked;
    state = resetState(state);
    paint();
  });
  camera = bindCameraMode(root, {
    objectCount: 1,
    rangeForLock: () => {
      const live = liveState(state);
      const hanging = state.environment === "hanging";
      const extra = hanging ? HANG_CAMERA_EXTRA : CAMERA_EXTRA;
      const mode = camera.mode === CAMERA.STATIONARY ? CAMERA.ORIGIN : camera.mode;
      return cameraRange(hanging ? [live.y] : [live.x], { ...extra, mode });
    },
    onChange: () => paint(),
  });
  root.querySelector("#toggle-net").addEventListener("change", (event) => {
    state.showNetForce = event.target.checked;
    paint();
  });
  root.querySelector("#toggle-components").addEventListener("change", (event) => {
    state.showComponents = event.target.checked;
    paint();
  });
  root.querySelector("#toggle-sources").addEventListener("change", (event) => {
    state.showSources = event.target.checked;
    paint();
  });
  root.querySelector("#btn-add-force").addEventListener("click", () => {
    addForce(state, {
      type: addType.value,
      magnitude: readNumber(addMag, 10),
      direction: Number(addDir.value),
    });
    paint();
  });
  forceBody.addEventListener("change", (event) => {
    const row = event.target.closest("tr");
    const id = row?.dataset.forceId;
    if (!id) return;
    if (event.target.matches("[data-enabled]")) setForce(state, id, { enabled: event.target.checked });
    if (event.target.matches("[data-mag]")) setForce(state, id, { magnitude: Number(event.target.value) });
    if (event.target.matches("[data-dir]")) setForce(state, id, { direction: Number(event.target.value) });
    paint();
  });
  forceBody.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-remove]");
    if (!btn) return;
    const id = event.target.closest("tr")?.dataset.forceId;
    if (id) removeForce(state, id);
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
  graphXt.addEventListener("click", (event) => {
    if (running) return;
    seek(timeAtPointer(event.currentTarget, event, state.duration));
  });
  graphVt.addEventListener("click", (event) => {
    if (running) return;
    seek(timeAtPointer(event.currentTarget, event, state.duration));
  });

  window.addEventListener("keydown", onKey);
  const resize = new ResizeObserver(() => {
    paint();
    drawCharts();
  });
  resize.observe(canvas);
  resize.observe(fbd);
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
