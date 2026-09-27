const AXIS = "rgba(27, 36, 48, 0.7)";
const GRID = "rgba(27, 36, 48, 0.1)";
const CURVE = "#c45c26";
const HEIGHT = "#1c6b73";
const POINT = "#1b2430";
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

export function renderTrialGraphs({ rangeCanvas, heightCanvas, trials }) {
  drawTrialScatter(rangeCanvas, trials, "range", "Launch angle", "Range (m)", CURVE);
  drawTrialScatter(heightCanvas, trials, "maxHeight", "Launch angle", "Max height (m)", HEIGHT);
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

export function renderXYScatter(canvas, points, { xKey, yKey, xLabel, yLabel, color, xMin, xMax, yMin, yMax }) {
  const surface = setup(canvas);
  if (!surface) return;
  const { ctx, cssW, cssH, pad } = surface;
  if (!points.length) {
    emptyMessage(ctx, cssW, cssH, "Record a trial to plot your data.");
    return;
  }

  const xs = points.map((p) => p[xKey]);
  const ys = points.map((p) => p[yKey]);
  const lo = xMin ?? Math.min(0, ...xs);
  const hi = xMax ?? Math.max(1, ...xs);
  const yLo = yMin ?? Math.min(0, ...ys);
  const yHi = yMax ?? Math.max(1, ...ys);
  const box = drawLinearFrame(ctx, pad, cssW, cssH, xLabel, yLabel, lo, hi, yLo, yHi);
  const last = points[points.length - 1];

  ctx.font = "600 10px Figtree, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  for (const point of points) {
    const x = box.left + ((point[xKey] - lo) / Math.max(hi - lo, 1e-6)) * (box.right - box.left);
    const y = box.bottom - ((point[yKey] - yLo) / Math.max(yHi - yLo, 1e-6)) * (box.bottom - box.top);
    const latest = point === last;
    ctx.fillStyle = latest ? NOW : color;
    ctx.beginPath();
    ctx.arc(x, y, latest ? 5.6 : 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = POINT;
    ctx.fillText(`#${point.id}`, x + 6, y - 4);
  }
}

export function renderTimeSeries(canvas, history, { yKey, color, xLabel, yLabel, duration, now }) {
  const surface = setup(canvas);
  if (!surface) return;
  const { ctx, cssW, cssH, pad } = surface;
  const points = history?.length ? history : [{ time: 0, [yKey]: 0 }];
  const tMax = Math.max(duration || 1, ...points.map((p) => p.time), now || 0, 1e-6);
  const ys = points.map((p) => p[yKey]);
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

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = xOfT(p.time);
    const y = yOfV(p[yKey]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

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
  ctx.fillStyle = NOW;
  ctx.beginPath();
  ctx.arc(xNow, yOfV(current[yKey]), 4.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawLinearFrame(ctx, pad, w, h, xLabel, yLabel, xMin, xMax, yMin, yMax) {
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

function drawTrialScatter(canvas, trials, key, xLabel, yLabel, color) {
  const surface = setup(canvas);
  if (!surface) return;
  const { ctx, cssW, cssH, pad } = surface;
  if (!trials.length) {
    emptyMessage(ctx, cssW, cssH, "Record a trial to plot your data.");
    return;
  }

  const yMax = Math.max(1, ...trials.map((t) => t[key]));
  const box = drawFrame(ctx, pad, cssW, cssH, xLabel, yLabel, yMax);
  const last = trials[trials.length - 1];

  ctx.fillStyle = POINT;
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
}
