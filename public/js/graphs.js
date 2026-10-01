import { formatFitEquation, formatR2, polynomialFit, sampleFit } from "/lib/regression.js";
import { themeCanvas } from "./platform/theme.js";

const CURVE = "#c45c26";
const HEIGHT = "#1c6b73";
const NOW = "#2c6e49";

function axisColor() {
  return themeCanvas().muted;
}

function gridColor() {
  return themeCanvas().line;
}

function pointColor() {
  return themeCanvas().ink;
}

function setup(canvas) {
  if (!canvas) return null;
  const dpr = window.devicePixelRatio || 1;
  const cssW = Math.max(1, canvas.clientWidth);
  const cssH = Math.max(1, canvas.clientHeight);
  if (cssW < 40 || cssH < 40) return null;
  const w = Math.round(cssW * dpr);
  const h = Math.round(cssH * dpr);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = themeCanvas().fill;
  ctx.fillRect(0, 0, cssW, cssH);
  return { ctx, cssW, cssH, pad: { l: 44, r: 16, t: 16, b: 32 } };
}

function drawFrame(ctx, pad, w, h, xLabel, yLabel, yMax) {
  const left = pad.l;
  const right = w - pad.r;
  const top = pad.t;
  const bottom = h - pad.b;

  ctx.strokeStyle = gridColor();
  ctx.fillStyle = axisColor();
  ctx.font = "11px IBM Plex Mono, monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i += 1) {
    const t = i / yTicks;
    const y = bottom - t * (bottom - top);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    const value = t * yMax;
    const text = yMax === 0 ? "0" : yMax < 10 ? value.toFixed(1) : value.toFixed(0);
    ctx.fillText(text, left - 6, y);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const ang of [0, 30, 45, 60, 90]) {
    const x = left + (ang / 90) * (right - left);
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
    ctx.fillText(`${ang}°`, x, bottom + 6);
  }

  ctx.strokeStyle = axisColor();
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();

  ctx.font = "600 11px Figtree, sans-serif";
  ctx.fillStyle = axisColor();
  ctx.textAlign = "center";
  ctx.fillText(xLabel, (left + right) / 2, h - 14);
  ctx.save();
  ctx.translate(12, (top + bottom) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  return { left, right, top, bottom };
}

function xOf(angle, box) {
  return box.left + (angle / 90) * (box.right - box.left);
}

function yOf(value, yMax, box) {
  const span = Math.max(yMax, 1e-6);
  return box.bottom - (value / span) * (box.bottom - box.top);
}

function emptyMessage(ctx, cssW, cssH, text) {
  ctx.fillStyle = axisColor();
  ctx.font = "500 13px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cssW / 2, cssH / 2);
}

export function renderTheoryGraphs({ rangeCanvas, heightCanvas, curve }) {
  const yMaxR = Math.max(1, ...curve.map((p) => p.range));
  const yMaxH = Math.max(1, ...curve.map((p) => p.maxHeight));
  drawCurve(rangeCanvas, curve, "range", yMaxR, "Launch angle", "Range (m)", CURVE);
  drawCurve(heightCanvas, curve, "maxHeight", yMaxH, "Launch angle", "Max height (m)", HEIGHT);
}

export function renderTrialGraphs({ rangeCanvas, heightCanvas, trials, rangeIdentity = null, heightIdentity = null }) {
  drawTrialScatter(rangeCanvas, trials, "range", "Launch angle", "Range (m)", CURVE, {
    yName: "R",
    xName: "θ",
    identity: rangeIdentity,
  });
  drawTrialScatter(heightCanvas, trials, "maxHeight", "Launch angle", "Max height (m)", HEIGHT, {
    yName: "H",
    xName: "θ",
    identity: heightIdentity,
  });
}

function drawCurve(canvas, curve, key, yMax, xLabel, yLabel, color) {
  const surface = setup(canvas);
  if (!surface) return;
  const { ctx, cssW, cssH, pad } = surface;
  const box = drawFrame(ctx, pad, cssW, cssH, xLabel, yLabel, yMax);

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  curve.forEach((p, i) => {
    const x = xOf(p.angleDeg, box);
    const y = yOf(p[key], yMax, box);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

export function renderXYScatter(canvas, points, options = {}) {
  const {
    xKey,
    yKey,
    xLabel,
    yLabel,
    color,
    xMin,
    xMax,
    yMin,
    yMax,
    fitDegree = 1,
    fitYName = "y",
    fitXName = "x",
    showFit = true,
    identity = null,
  } = options;
  const surface = setup(canvas);
  if (!surface) return;
  const { ctx, cssW, cssH, pad } = surface;
  const list = points || [];
  if (!list.length && !identity) {
    emptyMessage(ctx, cssW, cssH, "Record a trial to plot your data.");
    return;
  }

  const xs = list.map((p) => p[xKey]);
  const ys = list.map((p) => p[yKey]);
  const lo = xMin ?? (xs.length ? Math.min(0, ...xs) : (identity?.xMin ?? 0));
  const hi = xMax ?? (xs.length ? Math.max(1, ...xs) : (identity?.xMax ?? 1));
  let yLo = yMin ?? (ys.length ? Math.min(0, ...ys) : 0);
  let yHi = yMax ?? (ys.length ? Math.max(1, ...ys) : 1);
  const identitySamples = sampleIdentity(identity, lo, hi);
  const pairs = list.map((p) => ({ x: p[xKey], y: p[yKey] }));
  const xScale = Math.max(Math.abs(lo), Math.abs(hi), 1);
  const fit = showFit && list.length ? polynomialFit(pairs, { maxDegree: fitDegree, xScale }) : null;
  for (const sample of identitySamples) {
    yLo = Math.min(yLo, sample.y);
    yHi = Math.max(yHi, sample.y);
  }
  if (fit) {
    for (const sample of sampleFit(fit, { start: lo, end: hi, steps: 48 })) {
      yLo = Math.min(yLo, sample.y);
      yHi = Math.max(yHi, sample.y);
    }
  }
  if (yLo === yHi) {
    yLo -= 1;
    yHi += 1;
  }
  const box = drawLinearFrame(ctx, pad, cssW, cssH, xLabel, yLabel, lo, hi, yLo, yHi);
  strokeSampledCurve(ctx, box, identitySamples, lo, hi, yLo, yHi, { color: pointColor(), width: 2.4 });
  if (showFit && fit) {
    strokeSampledCurve(ctx, box, sampleFit(fit, { start: lo, end: hi, steps: 64 }), lo, hi, yLo, yHi, {
      color,
      dash: [5, 4],
      width: 2,
      alpha: 0.9,
    });
  }
  drawOverlayLabels(ctx, box, overlayLabelLines({ fit, showFit, hasPoints: list.length > 0, fitYName, fitXName, identity }));
  const last = list[list.length - 1];

  ctx.font = "600 10px Figtree, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  for (const point of list) {
    const x = mapPlotX(point[xKey], lo, hi, box);
    const y = mapPlotY(point[yKey], yLo, yHi, box);
    const latest = point === last;
    ctx.fillStyle = latest ? NOW : color;
    ctx.beginPath();
    ctx.arc(x, y, latest ? 5.6 : 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pointColor();
    ctx.fillText(`#${point.id}`, x + 6, y - 4);
  }
}

export function renderTimeSeries(canvas, history, { yKey, color, xLabel, yLabel, duration, now, fillToZero = false, series }) {
  const surface = setup(canvas);
  if (!surface) return null;
  const { ctx, cssW, cssH, pad } = surface;
  const lines = series?.length ? series : [{ yKey, color }];
  const fallbackKey = lines[0].yKey || yKey;
  const points = history?.length ? history : [{ time: 0, [fallbackKey]: 0 }];
  const tMax = Math.max(duration || 1, ...points.map((p) => p.time), now || 0, 1e-6);
  const ys = points.flatMap((p) => lines.map((line) => p[line.yKey]));
  let yLo = Math.min(0, ...ys);
  let yHi = Math.max(0, ...ys);
  if (yLo === yHi) {
    yLo -= 1;
    yHi += 1;
  } else {
    const padY = 0.08 * (yHi - yLo);
    yLo -= padY;
    yHi += padY;
  }
  const box = drawLinearFrame(ctx, pad, cssW, cssH, xLabel, yLabel, 0, tMax, yLo, yHi);
  const xOfT = (t) => box.left + (t / tMax) * (box.right - box.left);
  const yOfV = (v) => box.bottom - ((v - yLo) / (yHi - yLo)) * (box.bottom - box.top);

  if (yLo < 0 && yHi > 0) {
    ctx.strokeStyle = "rgba(27, 36, 48, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(box.left, yOfV(0));
    ctx.lineTo(box.right, yOfV(0));
    ctx.stroke();
  }

  if (fillToZero && points.length) {
    ctx.beginPath();
    ctx.moveTo(xOfT(points[0].time), yOfV(0));
    points.forEach((p) => ctx.lineTo(xOfT(p.time), yOfV(p[fallbackKey])));
    ctx.lineTo(xOfT(points[points.length - 1].time), yOfV(0));
    ctx.closePath();
    ctx.fillStyle = "rgba(28, 107, 115, 0.18)";
    ctx.fill();
  }

  for (const line of lines) {
    ctx.strokeStyle = line.color || color || CURVE;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = xOfT(p.time);
      const y = yOfV(p[line.yKey]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  if (lines.length > 1) {
    ctx.font = "600 11px Figtree, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    lines.forEach((line, i) => {
      ctx.fillStyle = line.color || color || CURVE;
      ctx.fillText(line.label || line.yKey, box.left + 8 + i * 72, box.top + 6);
    });
  }

  const tNow = now ?? points[points.length - 1].time;
  const xNow = xOfT(tNow);
  ctx.strokeStyle = NOW;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(xNow, box.top);
  ctx.lineTo(xNow, box.bottom);
  ctx.stroke();
  ctx.setLineDash([]);

  const current = points.reduce((best, p) => (Math.abs(p.time - tNow) < Math.abs(best.time - tNow) ? p : best), points[0]);
  for (const line of lines) {
    ctx.fillStyle = NOW;
    ctx.beginPath();
    ctx.arc(xNow, yOfV(current[line.yKey]), 4.4, 0, Math.PI * 2);
    ctx.fill();
  }
  return { tMax, box };
}

export function timeAtPointer(canvas, event, duration) {
  if (!canvas) return 0;
  const rect = canvas.getBoundingClientRect();
  const padL = 44;
  const padR = 16;
  const left = padL;
  const right = Math.max(left + 1, rect.width - padR);
  const u = (event.clientX - rect.left - left) / (right - left);
  const T = Math.max(duration || 1, 1e-6);
  return Math.min(T, Math.max(0, u * T));
}

function drawLinearFrame(ctx, pad, w, h, xLabel, yLabel, xMin, xMax, yMin, yMax) {
  const left = pad.l;
  const right = w - pad.r;
  const top = pad.t;
  const bottom = h - pad.b;

  ctx.strokeStyle = gridColor();
  ctx.fillStyle = axisColor();
  ctx.font = "11px IBM Plex Mono, monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i += 1) {
    const t = i / yTicks;
    const y = bottom - t * (bottom - top);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    const value = yMin + t * (yMax - yMin);
    const span = Math.abs(yMax - yMin);
    const text = span === 0 ? "0" : span < 10 ? value.toFixed(1) : value.toFixed(0);
    ctx.fillText(text, left - 6, y);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const xTicks = 4;
  for (let i = 0; i <= xTicks; i += 1) {
    const t = i / xTicks;
    const x = left + t * (right - left);
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
    const value = xMin + t * (xMax - xMin);
    ctx.fillText(Number.isInteger(value) ? String(value) : value.toFixed(1), x, bottom + 6);
  }

  ctx.strokeStyle = axisColor();
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();

  ctx.font = "600 11px Figtree, sans-serif";
  ctx.fillStyle = axisColor();
  ctx.textAlign = "center";
  ctx.fillText(xLabel, (left + right) / 2, h - 14);
  ctx.save();
  ctx.translate(12, (top + bottom) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  return { left, right, top, bottom };
}

function drawTrialScatter(canvas, trials, key, xLabel, yLabel, color, { yName = "y", xName = "θ", maxDegree = 2, identity = null } = {}) {
  const surface = setup(canvas);
  if (!surface) return;
  const { ctx, cssW, cssH, pad } = surface;
  const list = trials || [];
  if (!list.length && !identity) {
    emptyMessage(ctx, cssW, cssH, "Record a trial to plot your data.");
    return;
  }

  const fit = list.length
    ? polynomialFit(
        list.map((trial) => ({ x: trial.angleDeg, y: trial[key] })),
        { maxDegree, xScale: 90 },
      )
    : null;
  const identitySamples = sampleIdentity(identity, 0, 90);
  let yMax = Math.max(1, ...list.map((t) => t[key]), ...identitySamples.map((p) => p.y));
  if (fit) {
    yMax = Math.max(yMax, ...sampleFit(fit, { start: 0, end: 90, steps: 90 }).map((p) => p.y));
  }
  const box = drawFrame(ctx, pad, cssW, cssH, xLabel, yLabel, yMax);
  strokeSampledCurve(ctx, box, identitySamples, 0, 90, 0, yMax, { color: pointColor(), width: 2.4 });
  if (fit) {
    strokeSampledCurve(ctx, box, sampleFit(fit, { start: 0, end: 90, steps: 90 }), 0, 90, 0, yMax, {
      color,
      dash: [5, 4],
      width: 2,
      alpha: 0.9,
    });
  }
  drawOverlayLabels(ctx, box, overlayLabelLines({ fit, showFit: true, hasPoints: list.length > 0, fitYName: yName, fitXName: xName, identity }));
  const last = list[list.length - 1];

  ctx.fillStyle = pointColor();
  ctx.font = "600 10px Figtree, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  for (const trial of list) {
    const x = xOf(trial.angleDeg, box);
    const y = yOf(trial[key], yMax, box);
    const latest = trial === last;
    ctx.fillStyle = latest ? NOW : color;
    ctx.beginPath();
    ctx.arc(x, y, latest ? 5.6 : 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`#${trial.id}`, x + 6, y - 4);
  }
}

function mapPlotX(x, xMin, xMax, box) {
  return box.left + ((x - xMin) / Math.max(xMax - xMin, 1e-6)) * (box.right - box.left);
}

function mapPlotY(y, yMin, yMax, box) {
  return box.bottom - ((y - yMin) / Math.max(yMax - yMin, 1e-6)) * (box.bottom - box.top);
}

function sampleIdentity(identity, xMin, xMax) {
  if (!identity) return [];
  if (Array.isArray(identity.samples) && identity.samples.length) return identity.samples;
  if (typeof identity.yOfX !== "function") return [];
  const start = Number.isFinite(identity.xMin) ? identity.xMin : xMin;
  const end = Number.isFinite(identity.xMax) ? identity.xMax : xMax;
  const steps = identity.steps ?? 96;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start === end) return [];
  const out = [];
  for (let i = 0; i <= steps; i += 1) {
    const x = start + ((end - start) * i) / steps;
    const y = identity.yOfX(x);
    if (Number.isFinite(y)) out.push({ x, y });
  }
  return out;
}

function strokeSampledCurve(ctx, box, samples, xMin, xMax, yMin, yMax, { color, dash = [], width = 2, alpha = 1 } = {}) {
  if (!samples.length) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.left, box.top, box.right - box.left, box.bottom - box.top);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  samples.forEach((p, i) => {
    const x = mapPlotX(p.x, xMin, xMax, box);
    const y = mapPlotY(p.y, yMin, yMax, box);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}

function overlayLabelLines({ fit, showFit, hasPoints, fitYName, fitXName, identity }) {
  const lines = [];
  if (showFit) {
    if (fit) {
      lines.push({ text: `${formatFitEquation(fit, fitYName, fitXName)}   R² = ${formatR2(fit.r2)}`, color: axisColor() });
    } else if (hasPoints) {
      lines.push({ text: "Record two trials with different x-values to fit a curve.", color: axisColor() });
    }
  }
  if (identity?.label) {
    lines.push({ text: identity.label, color: pointColor() });
  }
  return lines;
}

function drawOverlayLabels(ctx, box, lines) {
  const usable = (lines || []).filter((line) => line?.text);
  if (!usable.length) return;
  ctx.save();
  ctx.font = "600 11px IBM Plex Mono, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const maxW = Math.max(40, box.right - box.left - 12);
  const paper = themeCanvas().fill;
  usable.forEach((line, i) => {
    const y = box.top + 13 + i * 18;
    const textW = Math.min(ctx.measureText(line.text).width + 10, maxW);
    ctx.fillStyle = paper;
    ctx.fillRect(box.left + 4, box.top + 4 + i * 18, textW, 18);
    ctx.fillStyle = line.color || axisColor();
    ctx.fillText(line.text, box.left + 8, y, maxW - 8);
  });
  ctx.restore();
}
