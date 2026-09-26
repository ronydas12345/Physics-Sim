import { fitTrials, sampleFit } from "/lib/regression.js";

const AXIS = "rgba(27, 36, 48, 0.7)";
const GRID = "rgba(27, 36, 48, 0.1)";
const CURVE = "#c45c26";
const HEIGHT = "#1c6b73";
const NOW = "#2c6e49";

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
  ctx.fillStyle = "#fbf7ef";
  ctx.fillRect(0, 0, cssW, cssH);
  return { ctx, cssW, cssH, pad: { l: 44, r: 16, t: 16, b: 32 } };
}

function drawFrame(ctx, pad, w, h, xLabel, yLabel, yMax) {
  const left = pad.l;
  const right = w - pad.r;
  const top = pad.t;
  const bottom = h - pad.b;

  ctx.strokeStyle = GRID;
  ctx.fillStyle = AXIS;
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

  ctx.strokeStyle = AXIS;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();

  ctx.font = "600 11px Figtree, sans-serif";
  ctx.fillStyle = AXIS;
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
  ctx.fillStyle = AXIS;
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

export function renderTrialGraphs({ rangeCanvas, heightCanvas, trials, showRegression = false }) {
  return {
    rangeFit: drawTrialScatter(
      rangeCanvas,
      trials,
      "range",
      "Launch angle",
      "Range (m)",
      CURVE,
      showRegression,
    ),
    heightFit: drawTrialScatter(
      heightCanvas,
      trials,
      "maxHeight",
      "Launch angle",
      "Max height (m)",
      HEIGHT,
      showRegression,
    ),
  };
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

function drawTrialScatter(canvas, trials, key, xLabel, yLabel, color, showRegression) {
  const surface = setup(canvas);
  if (!surface) return null;
  const { ctx, cssW, cssH, pad } = surface;
  if (!trials.length) {
    emptyMessage(ctx, cssW, cssH, "Record a trial to plot your data.");
    return null;
  }

  const fit = showRegression ? fitTrials(trials, key) : null;
  const samples = fit ? sampleFit(fit, { start: 0, end: 90, steps: 90 }) : [];
  const dataMax = Math.max(1, ...trials.map((t) => t[key]));
  const fitMax = samples.reduce((max, p) => (Number.isFinite(p.y) ? Math.max(max, p.y) : max), 0);
  const yMax = Math.max(dataMax, Math.min(fitMax, dataMax * 2));
  const box = drawFrame(ctx, pad, cssW, cssH, xLabel, yLabel, yMax);
  const last = trials[trials.length - 1];

  if (fit && samples.length) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    let started = false;
    for (const point of samples) {
      if (!Number.isFinite(point.y)) continue;
      const x = xOf(point.x, box);
      const y = yOf(Math.max(0, point.y), yMax, box);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.font = "600 11px Figtree, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(fit.degree === 1 ? "linear fit" : "quadratic fit", box.right, box.top + 4);
  }

  ctx.font = "600 10px Figtree, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  for (const trial of trials) {
    const x = xOf(trial.angleDeg, box);
    const y = yOf(trial[key], yMax, box);
    const latest = trial === last;
    ctx.fillStyle = latest ? NOW : color;
    ctx.beginPath();
    ctx.arc(x, y, latest ? 5.6 : 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`#${trial.id}`, x + 6, y - 4);
  }

  return fit;
}
