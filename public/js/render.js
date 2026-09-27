export const COLORS = {
  skyTop: "#7fb7dc",
  skyBottom: "#eaf4fb",
  ground: "#6f8f63",
  groundDark: "#4f6a46",
  soil: "#5c4634",
  axis: "rgba(20, 32, 44, 0.72)",
  grid: "rgba(20, 32, 44, 0.12)",
  predicted: "rgba(196, 92, 38, 0.55)",
  trail: "#c45c26",
  ghost: "rgba(28, 107, 115, 0.45)",
  projectile: "#f0a202",
  projectileStroke: "#7a3e08",
  vx: "#1c6b73",
  vy: "#3d5a80",
  v0: "#c9a227",
  g: "#b42318",
  apex: "#2c6e49",
  target: "#9b2226",
  text: "#1b2430",
};

function niceStep(span, ticks = 6) {
  const raw = Math.max(span, 1e-6) / ticks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  if (n < 1.5) return pow;
  if (n < 3.5) return 2 * pow;
  if (n < 7.5) return 5 * pow;
  return 10 * pow;
}

export function createView(canvas, v0, g, extras = {}) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = Math.max(1, canvas.clientWidth);
  const cssH = Math.max(1, canvas.clientHeight);
  const nextW = Math.round(cssW * dpr);
  const nextH = Math.round(cssH * dpr);
  if (canvas.width !== nextW) canvas.width = nextW;
  if (canvas.height !== nextH) canvas.height = nextH;

  const pad = { l: 58, r: 28, t: 52, b: 62 };
  const plotW = cssW - pad.l - pad.r;
  const plotH = cssH - pad.t - pad.b;
  const maxR = Math.max((v0 * v0) / Math.max(g, 0.01), extras.targetRange || 0, 8);
  const maxH = Math.max((v0 * v0) / (2 * Math.max(g, 0.01)), extras.targetHeight || 0, 4);
  const worldW = maxR * 1.12;
  const worldH = maxH * 1.2;
  const scale = Math.min(plotW / worldW, plotH / worldH);

  const originX = pad.l;
  const originY = cssH - pad.b;

  return {
    cssW,
    cssH,
    dpr,
    pad,
    scale,
    originX,
    originY,
    worldW,
    worldH,
    maxR,
    maxH,
    toScreen(x, y) {
      return {
        x: originX + x * scale,
        y: originY - y * scale,
      };
    },
    m(meters) {
      return meters * scale;
    },
  };
}

function arrowHead(ctx, x1, y1, x2, y2, size = 8) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(ang - 0.4), y2 - size * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - size * Math.cos(ang + 0.4), y2 - size * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
}

export function drawArrow(ctx, x1, y1, x2, y2, color, width = 2.4) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  arrowHead(ctx, x1, y1, x2, y2, 9);
}

function label(ctx, text, x, y, color = COLORS.text, align = "left") {
  ctx.fillStyle = color;
  ctx.font = "600 12px Figtree, sans-serif";
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
}

function drawSkyAndGround(ctx, view, scene) {
  const { cssW, cssH, originY, pad } = view;
  const sky = ctx.createLinearGradient(0, 0, 0, originY);
  sky.addColorStop(0, scene.skyTop);
  sky.addColorStop(1, scene.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.fillStyle = scene.ground;
  ctx.fillRect(0, originY, cssW, cssH - originY);
  ctx.fillStyle = scene.groundDark;
  ctx.fillRect(0, originY, cssW, 6);
  ctx.fillStyle = scene.soil;
  ctx.fillRect(0, cssH - 18, cssW, 18);

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  for (let x = pad.l; x < cssW; x += 18) {
    ctx.fillRect(x, originY + 6, 8, 3);
  }

  if (scene.name) {
    ctx.fillStyle = scene.ink;
    ctx.font = "700 13px Figtree, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(scene.name, pad.l, 12);
  }
}

function drawAxes(ctx, view, scene) {
  const { originX, originY, scale, worldW, worldH, cssW, pad } = view;
  const xEnd = originX + worldW * scale;
  const yEnd = originY - worldH * scale;

  ctx.strokeStyle = scene.grid;
  ctx.lineWidth = 1;
  const xStep = niceStep(worldW);
  const yStep = niceStep(worldH, 5);

  ctx.font = "11px IBM Plex Mono, monospace";
  ctx.fillStyle = scene.axis;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let x = 0; x <= worldW + 1e-6; x += xStep) {
    const p = view.toScreen(x, 0);
    ctx.beginPath();
    ctx.moveTo(p.x, yEnd);
    ctx.lineTo(p.x, originY + 4);
    ctx.stroke();
    ctx.fillText(`${Math.round(x)}`, p.x, originY + 10);
  }

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let y = yStep; y <= worldH + 1e-6; y += yStep) {
    const p = view.toScreen(0, y);
    ctx.beginPath();
    ctx.moveTo(originX - 4, p.y);
    ctx.lineTo(cssW - pad.r, p.y);
    ctx.stroke();
    ctx.fillText(`${Math.round(y)}`, originX - 8, p.y);
  }

  ctx.strokeStyle = scene.axis;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(xEnd + 8, originY);
  ctx.moveTo(originX, originY);
  ctx.lineTo(originX, yEnd - 8);
  ctx.stroke();
  label(ctx, "x (m)", xEnd + 4, originY - 14, scene.ink, "right");
  label(ctx, "y (m)", originX + 28, yEnd - 6, scene.ink, "left");
}

function pathFromPoints(ctx, view, points) {
  if (!points.length) return;
  ctx.beginPath();
  points.forEach((pt, i) => {
    const p = view.toScreen(pt.x, pt.y);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
}

function drawAngleArc(ctx, view, angleDeg) {
  const origin = view.toScreen(0, 0);
  const r = 42;
  ctx.strokeStyle = "rgba(27,36,48,0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, r, 0, -((angleDeg * Math.PI) / 180), true);
  ctx.stroke();
  const mid = ((angleDeg * Math.PI) / 180) / 2;
  label(
    ctx,
    `θ = ${Math.round(angleDeg)}°`,
    origin.x + (r + 16) * Math.cos(mid),
    origin.y - (r + 16) * Math.sin(mid),
    COLORS.text,
    "left"
  );
}

function drawGravityLegend(ctx, view, g) {
  const x = view.cssW - view.pad.r - 18;
  const y = view.pad.t + 12;
  drawArrow(ctx, x, y, x, y + 36, COLORS.g, 2.4);
  label(ctx, `g = ${g.toFixed(1)} m/s²`, x - 10, y + 18, COLORS.g, "right");
}

function drawVectors(ctx, view, sim, pending) {
  const origin = view.toScreen(0, 0);
  const proj = view.toScreen(sim.x, Math.max(0, sim.y));
  const vScale = Math.min(0.38, (view.worldH * 0.42) / Math.max(pending.v0, 1));

  const theta = (pending.angleDeg * Math.PI) / 180;
  const v0x = pending.v0 * Math.cos(theta) * vScale;
  const v0y = pending.v0 * Math.sin(theta) * vScale;
  const idle = !sim.isRunning && sim.t === 0 && !sim.landed;

  if (idle) {
    const tip = view.toScreen(v0x, v0y);
    const hx = view.toScreen(v0x, 0);
    const hy = view.toScreen(0, v0y);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = COLORS.vx;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(hx.x, hx.y);
    ctx.stroke();
    ctx.strokeStyle = COLORS.vy;
    ctx.beginPath();
    ctx.moveTo(hx.x, hx.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
    ctx.setLineDash([]);
    drawArrow(ctx, origin.x, origin.y, hx.x, hx.y, COLORS.vx, 2);
    drawArrow(ctx, origin.x, origin.y, hy.x, hy.y, COLORS.vy, 2);
    drawArrow(ctx, origin.x, origin.y, tip.x, tip.y, COLORS.v0, 2.8);
    label(ctx, "v₀", tip.x + 8, tip.y - 8, COLORS.v0);
    label(ctx, "vₓ", hx.x, hx.y + 14, COLORS.vx, "center");
    label(ctx, "vᵧ", hy.x - 10, hy.y, COLORS.vy, "right");
    drawAngleArc(ctx, view, pending.angleDeg);
  } else if (sim.isRunning) {
    const cvx = sim.vx * vScale;
    const cvy = sim.vy * vScale;
    const tip = view.toScreen(sim.x + cvx, sim.y + cvy);
    const hx = view.toScreen(sim.x + cvx, sim.y);
    const hy = view.toScreen(sim.x, sim.y + cvy);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = COLORS.vx;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(proj.x, proj.y);
    ctx.lineTo(hx.x, hx.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = COLORS.vy;
    ctx.moveTo(proj.x, proj.y);
    ctx.lineTo(hy.x, hy.y);
    ctx.stroke();
    ctx.setLineDash([]);
    drawArrow(ctx, proj.x, proj.y, hx.x, hx.y, COLORS.vx, 2);
    drawArrow(ctx, proj.x, proj.y, hy.x, hy.y, COLORS.vy, 2);
    drawArrow(ctx, proj.x, proj.y, tip.x, tip.y, COLORS.v0, 2.6);
    label(ctx, "v", tip.x + 6, tip.y - 6, COLORS.v0);
    label(ctx, "vₓ", hx.x, hx.y + 12, COLORS.vx, "center");
    label(ctx, "vᵧ", hy.x - 8, hy.y, COLORS.vy, "right");

    const gTip = { x: proj.x, y: proj.y + 34 };
    drawArrow(ctx, proj.x, proj.y, gTip.x, gTip.y, COLORS.g, 2.2);
  }

  drawGravityLegend(ctx, view, pending.g);
}

function drawApex(ctx, view, sim) {
  if (sim.maxHeight <= 0.05) return;
  if (!sim.apexReached && !sim.landed && sim.isRunning === false && sim.t === 0) {
    return;
  }
  const show = sim.apexReached || sim.landed || sim.maxHeight > 0.05;
  if (!show) return;
  if (!sim.apexReached && sim.isRunning && sim.vy > 0) return;

  const apex = view.toScreen(sim.maxHeightX, sim.maxHeight);
  const left = view.toScreen(0, sim.maxHeight);
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = COLORS.apex;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(left.x, left.y);
  ctx.lineTo(apex.x, apex.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = COLORS.apex;
  ctx.beginPath();
  ctx.moveTo(apex.x, apex.y - 7);
  ctx.lineTo(apex.x + 7, apex.y);
  ctx.lineTo(apex.x, apex.y + 7);
  ctx.lineTo(apex.x - 7, apex.y);
  ctx.closePath();
  ctx.fill();
  label(ctx, "Maximum Height", apex.x + 10, apex.y - 12, COLORS.apex);
  label(ctx, `${sim.maxHeight.toFixed(1)} m`, apex.x + 10, apex.y + 4, COLORS.apex);
}

function drawRange(ctx, view, sim) {
  if (!sim.landed || Math.abs(sim.measuredRange) < 0.15) return;
  const y = view.originY + 36;
  const a = view.toScreen(0, 0);
  const b = view.toScreen(sim.measuredRange, 0);
  ctx.strokeStyle = "#f4efe6";
  ctx.fillStyle = "#f4efe6";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(a.x, y);
  ctx.lineTo(b.x, y);
  ctx.moveTo(a.x, y - 6);
  ctx.lineTo(a.x, y + 6);
  ctx.moveTo(b.x, y - 6);
  ctx.lineTo(b.x, y + 6);
  ctx.stroke();
  const mid = (a.x + b.x) / 2;
  ctx.fillStyle = COLORS.soil;
  ctx.fillRect(mid - 40, y - 10, 80, 16);
  label(ctx, `${sim.measuredRange.toFixed(1)} m`, mid, y, "#f4efe6", "center");
  label(ctx, "Launch", a.x + 4, y + 16, "#f4efe6", "left");
  label(ctx, "Landing", b.x - 4, y + 16, "#f4efe6", "right");
}

function drawTarget(ctx, view, challenge) {
  if (!challenge?.active) return;
  if (challenge.goalKey === "range" && Number.isFinite(challenge.goalValue)) {
    const base = view.toScreen(challenge.goalValue, 0);
    ctx.strokeStyle = COLORS.target;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(base.x, view.originY);
    ctx.lineTo(base.x, view.pad.t + 8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COLORS.target;
    ctx.beginPath();
    ctx.moveTo(base.x, view.pad.t + 8);
    ctx.lineTo(base.x + 22, view.pad.t + 16);
    ctx.lineTo(base.x, view.pad.t + 24);
    ctx.closePath();
    ctx.fill();
    label(ctx, "Target", base.x + 10, view.pad.t + 36, COLORS.target);
  }
  if (challenge.goalKey === "maxHeight" && Number.isFinite(challenge.goalValue)) {
    const left = view.toScreen(0, challenge.goalValue);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = COLORS.target;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(view.cssW - view.pad.r, left.y);
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, `Target height ${challenge.goalValue.toFixed(1)} m`, left.x + 10, left.y - 10, COLORS.target);
  }
}

function drawLaunchPad(ctx, view) {
  const p = view.toScreen(0, 0);
  ctx.fillStyle = "#3d4d3c";
  ctx.fillRect(p.x - 10, p.y - 6, 20, 6);
}

function drawProjectile(ctx, view, sim) {
  const p = view.toScreen(sim.x, Math.max(0, sim.y));
  ctx.beginPath();
  ctx.fillStyle = "rgba(240, 162, 2, 0.18)";
  ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = COLORS.projectile;
  ctx.strokeStyle = COLORS.projectileStroke;
  ctx.lineWidth = 2;
  ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

export function renderSimulation(canvas, { sim, pending, predicted, ghost, challenge, scene }) {
  const view = createView(canvas, pending.v0, pending.g, {
    targetRange: challenge?.active && challenge.goalKey === "range" ? challenge.goalValue : 0,
    targetHeight: challenge?.active && challenge.goalKey === "maxHeight" ? challenge.goalValue : 0,
  });
  const ctx = canvas.getContext("2d");
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, view.cssW, view.cssH);

  const palette = scene ?? {
    skyTop: COLORS.skyTop,
    skyBottom: COLORS.skyBottom,
    ground: COLORS.ground,
    groundDark: COLORS.groundDark,
    soil: COLORS.soil,
    ink: COLORS.text,
    axis: COLORS.axis,
    grid: COLORS.grid,
  };

  drawSkyAndGround(ctx, view, palette);
  drawAxes(ctx, view, palette);
  drawTarget(ctx, view, challenge);

  if (ghost && ghost.length > 1) {
    ctx.strokeStyle = COLORS.ghost;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    pathFromPoints(ctx, view, ghost);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (predicted && predicted.length > 1 && sim.trajectory.length <= 1) {
    ctx.strokeStyle = COLORS.predicted;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([7, 5]);
    pathFromPoints(ctx, view, predicted);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (sim.trajectory.length > 1) {
    ctx.strokeStyle = COLORS.trail;
    ctx.lineWidth = 2.8;
    ctx.lineJoin = "round";
    pathFromPoints(ctx, view, sim.trajectory);
    ctx.stroke();
  }

  drawLaunchPad(ctx, view);
  drawApex(ctx, view, sim);
  drawRange(ctx, view, sim);
  drawVectors(ctx, view, sim, pending);
  drawProjectile(ctx, view, sim);
}
