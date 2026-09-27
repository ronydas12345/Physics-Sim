/**
 * Home-page microanimation: one looping vignette per AP Physics 1 unit,
 * with a slide-and-crossfade between scenes.
 */

import { modules } from "./curriculum.js";

const GOLD = "#c45c26";
const AMBER = "#f0a202";
const TEAL = "#1c6b73";
const INK = "#1b2430";
const SOIL = "#5a4634";
const GRASS = "#6f8f63";
const HOLD_MS = 3800;
const FADE_MS = 900;
const SCENE_MS = HOLD_MS + FADE_MS;

const SHORT = [
  "Kinematics",
  "Dynamics",
  "Energy",
  "Momentum",
  "Rotation",
  "Orbits",
  "Oscillation",
  "Fluids",
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function ease(t) {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
}

function wrap01(t) {
  return t - Math.floor(t);
}

function fillSky(ctx, w, h, top, bottom) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, top);
  sky.addColorStop(1, bottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
}

function ground(ctx, w, h, y) {
  ctx.fillStyle = SOIL;
  ctx.fillRect(0, y, w, h - y);
  ctx.fillStyle = GRASS;
  ctx.fillRect(0, y, w, 5);
}

function ball(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.arc(x, y, r + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

function arrow(ctx, x1, y1, x2, y2, color) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7 * Math.cos(ang - 0.4), y2 - 7 * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - 7 * Math.cos(ang + 0.4), y2 - 7 * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
}

function crate(ctx, x, y, s) {
  ctx.fillStyle = "#e4c48a";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.rect(x - s / 2, y - s, s, s);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - s / 2, y - s);
  ctx.lineTo(x + s / 2, y);
  ctx.moveTo(x + s / 2, y - s);
  ctx.lineTo(x - s / 2, y);
  ctx.stroke();
}

function kinematics(ctx, w, h, u) {
  fillSky(ctx, w, h, "#d7ebf7", "#f4efe6");
  const gy = h * 0.82;
  ground(ctx, w, h, gy);
  const x0 = w * 0.12;
  const x1 = w * 0.88;
  const x = lerp(x0, x1, u);
  const y = gy - 4 * u * (1 - u) * h * 0.62;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 24; i += 1) {
    const t = i / 24;
    const px = lerp(x0, x1, t);
    const py = gy - 4 * t * (1 - t) * h * 0.62;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  const base = ctx.globalAlpha;
  for (let i = 5; i >= 1; i -= 1) {
    const t = Math.max(0, u - i * 0.05);
    ctx.globalAlpha = base * (1 - i * 0.14);
    ball(ctx, lerp(x0, x1, t), gy - 4 * t * (1 - t) * h * 0.62, 4, AMBER);
  }
  ctx.globalAlpha = base;
  ball(ctx, x, y, 8, AMBER);
  const dx = x1 - x0;
  const dy = -4 * (1 - 2 * u) * h * 0.62;
  const mag = Math.hypot(dx, dy) || 1;
  arrow(ctx, x, y, x + (dx / mag) * 30, y + (dy / mag) * 30, TEAL);
}

function dynamics(ctx, w, h, u) {
  fillSky(ctx, w, h, "#d9e4ee", "#f4efe6");
  const gy = h * 0.78;
  ground(ctx, w, h, gy);
  const p = u * u;
  const x = lerp(w * 0.2, w * 0.72, p);
  crate(ctx, x, gy, 28);
  arrow(ctx, x, gy - 42, x + 42, gy - 42, GOLD);
  arrow(ctx, x, gy - 14, x - 22, gy - 14, TEAL);
  arrow(ctx, x, gy - 28, x, gy - 58, "#3d5a80");
  arrow(ctx, x, gy, x, gy + 22, INK);
  ctx.fillStyle = INK;
  ctx.font = "600 10px Figtree, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("F", x + 46, gy - 44);
  ctx.fillText("f", x - 34, gy - 16);
}

function energy(ctx, w, h, u) {
  fillSky(ctx, w, h, "#e8ddc8", "#f4efe6");
  const gy = h * 0.84;
  ground(ctx, w, h, gy);
  const px = w * 0.42;
  const py = h * 0.22;
  const L = h * 0.48;
  const th = 0.85 * Math.cos(2 * Math.PI * u);
  const bx = px + L * Math.sin(th);
  const by = py + L * Math.cos(th);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(px, py, 4, 0, Math.PI * 2);
  ctx.fillStyle = INK;
  ctx.fill();
  ball(ctx, bx, by, 9, GOLD);
  const U = (1 - Math.cos(th)) / (1 - Math.cos(0.85));
  const K = 1 - U;
  const barX = w * 0.78;
  ctx.fillStyle = "rgba(27,36,48,0.08)";
  ctx.fillRect(barX, h * 0.28, 16, h * 0.4);
  ctx.fillStyle = TEAL;
  ctx.fillRect(barX, h * 0.68 - K * h * 0.4, 16, K * h * 0.4);
  ctx.fillStyle = GOLD;
  ctx.fillRect(barX + 22, h * 0.68 - U * h * 0.4, 16, U * h * 0.4);
  ctx.fillStyle = INK;
  ctx.font = "600 10px Figtree, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("K", barX + 8, h * 0.74);
  ctx.fillText("U", barX + 30, h * 0.74);
}

function momentum(ctx, w, h, u) {
  fillSky(ctx, w, h, "#d7ebf7", "#f4efe6");
  const gy = h * 0.72;
  ground(ctx, w, h, gy);
  const y = gy - 11;
  const hit = 0.46;
  let xA;
  let xB;
  if (u < hit) {
    const s = u / hit;
    xA = lerp(w * 0.14, w * 0.46, s);
    xB = w * 0.62;
  } else {
    const s = (u - hit) / (1 - hit);
    xA = w * 0.46;
    xB = lerp(w * 0.62, w * 0.86, s);
  }
  ball(ctx, xA, y, 11, GOLD);
  ball(ctx, xB, y, 11, TEAL);
  if (u < hit) arrow(ctx, xA + 14, y - 22, xA + 36, y - 22, GOLD);
  else arrow(ctx, xB + 14, y - 22, xB + 36, y - 22, TEAL);
}

function rotation(ctx, w, h, u) {
  fillSky(ctx, w, h, "#dce8f2", "#f4efe6");
  const gy = h * 0.82;
  ground(ctx, w, h, gy);
  const cx = w * 0.5;
  const cy = h * 0.48;
  const r = Math.min(w, h) * 0.28;
  const ang = u * Math.PI * 2.4;
  ctx.strokeStyle = "rgba(27,36,48,0.18)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 4; i += 1) {
    const a = ang + (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    ctx.stroke();
  }
  ball(ctx, cx, cy, 7, AMBER);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 14, -0.4, 1.1);
  ctx.stroke();
  const tx = cx + (r + 14) * Math.cos(1.1);
  const ty = cy + (r + 14) * Math.sin(1.1);
  arrow(ctx, tx - 1, ty - 1, tx + 8, ty + 6, GOLD);
}

function orbits(ctx, w, h, u) {
  fillSky(ctx, w, h, "#c5d9ea", "#eef3f0");
  const cx = w * 0.48;
  const cy = h * 0.5;
  const rx = w * 0.28;
  const ry = h * 0.22;
  ctx.strokeStyle = "rgba(28,107,115,0.35)";
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ball(ctx, cx, cy, 16, GOLD);
  const a = u * Math.PI * 2;
  const mx = cx + rx * Math.cos(a);
  const my = cy + ry * Math.sin(a);
  ball(ctx, mx, my, 6, TEAL);
}

function oscillation(ctx, w, h, u) {
  fillSky(ctx, w, h, "#d7ebf7", "#f4efe6");
  const gy = h * 0.7;
  ground(ctx, w, h, gy);
  const wall = w * 0.1;
  const eq = w * 0.52;
  const amp = w * 0.22;
  const x = eq + amp * Math.cos(2 * Math.PI * u);
  ctx.fillStyle = "#8a7a62";
  ctx.fillRect(wall - 8, h * 0.28, 10, gy - h * 0.28);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const coils = 8;
  const left = wall + 4;
  for (let i = 0; i <= coils; i += 1) {
    const t = i / coils;
    const px = lerp(left, x - 16, t);
    const py = gy - 16 + (i % 2 === 0 ? -8 : 8);
    if (i === 0) ctx.moveTo(px, gy - 16);
    else ctx.lineTo(px, py);
  }
  ctx.lineTo(x - 16, gy - 16);
  ctx.stroke();
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = "rgba(27,36,48,0.35)";
  ctx.beginPath();
  ctx.moveTo(eq, h * 0.3);
  ctx.lineTo(eq, gy);
  ctx.stroke();
  ctx.setLineDash([]);
  crate(ctx, x, gy, 26);
}

function fluids(ctx, w, h, u) {
  fillSky(ctx, w, h, "#cfe4f2", "#eaf4fb");
  const tank = { x: w * 0.16, y: h * 0.22, w: w * 0.68, h: h * 0.58 };
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tank.x, tank.y);
  ctx.lineTo(tank.x, tank.y + tank.h);
  ctx.lineTo(tank.x + tank.w, tank.y + tank.h);
  ctx.lineTo(tank.x + tank.w, tank.y);
  ctx.stroke();
  const waterTop = tank.y + tank.h * 0.28 + Math.sin(u * Math.PI * 2) * 3;
  ctx.fillStyle = "rgba(28,107,115,0.28)";
  ctx.fillRect(tank.x + 2, waterTop, tank.w - 4, tank.y + tank.h - waterTop - 2);
  const bob = waterTop + 10 + Math.sin(u * Math.PI * 2) * 4;
  ctx.fillStyle = GOLD;
  ctx.fillRect(tank.x + tank.w * 0.42, bob, 28, 16);
  ctx.strokeStyle = INK;
  ctx.strokeRect(tank.x + tank.w * 0.42, bob, 28, 16);
  const bubbleY = lerp(tank.y + tank.h - 12, waterTop + 8, wrap01(u * 1.4));
  ctx.beginPath();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.arc(tank.x + tank.w * 0.22, bubbleY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = TEAL;
  ctx.stroke();
}

const DRAWS = [kinematics, dynamics, energy, momentum, rotation, orbits, oscillation, fluids];

function sceneAt(elapsed) {
  const n = DRAWS.length;
  const cycle = elapsed % (SCENE_MS * n);
  const index = Math.floor(cycle / SCENE_MS) % n;
  const local = cycle - index * SCENE_MS;
  const fading = local > HOLD_MS;
  const k = fading ? ease((local - HOLD_MS) / FADE_MS) : 0;
  return { index, next: (index + 1) % n, k };
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

export function mountHeroReel(root) {
  const canvas = root.querySelector("#hero-reel");
  const kicker = root.querySelector("#hero-reel-kicker");
  const title = root.querySelector("#hero-reel-title");
  const link = root.querySelector("#hero-reel-link");
  const dots = [...root.querySelectorAll("[data-hero-unit]")];
  if (!canvas) return () => {};

  let origin = performance.now();
  let raf = 0;
  let visible = true;
  let lastCaption = -1;

  function elapsed() {
    return Math.max(0, performance.now() - origin);
  }

  function seek(index) {
    origin = performance.now() - index * SCENE_MS;
    paint();
  }

  function syncCaption(index, k) {
    const shown = k > 0.5 ? (index + 1) % DRAWS.length : index;
    if (shown === lastCaption) return;
    lastCaption = shown;
    const mod = modules[shown];
    if (kicker) kicker.textContent = `Unit ${mod.id}`;
    if (title) title.textContent = SHORT[shown] || mod.title;
    if (link) link.href = mod.path;
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === shown);
      dot.setAttribute("aria-selected", String(i === shown));
    });
  }

  function drawScene(ctx, w, h, index, u, alpha, slide) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(slide, 0);
    DRAWS[index](ctx, w, h, u);
    ctx.restore();
  }

  function paint() {
    const { cssW, cssH, dpr } = sizeCanvas(canvas);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.save();
    ctx.beginPath();
    const r = 18;
    ctx.moveTo(r, 0);
    ctx.arcTo(cssW, 0, cssW, cssH, r);
    ctx.arcTo(cssW, cssH, 0, cssH, r);
    ctx.arcTo(0, cssH, 0, 0, r);
    ctx.arcTo(0, 0, cssW, 0, r);
    ctx.closePath();
    ctx.clip();

    const scene = sceneAt(elapsed());
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const u = still ? 0.34 : wrap01(elapsed() / 2600);
    if (scene.k <= 0) {
      drawScene(ctx, cssW, cssH, scene.index, u, 1, 0);
    } else {
      drawScene(ctx, cssW, cssH, scene.index, u, 1, -16 * scene.k);
      drawScene(ctx, cssW, cssH, scene.next, u, scene.k, 16 * (1 - scene.k));
    }
    ctx.restore();
    syncCaption(scene.index, scene.k);
  }

  function tick() {
    if (!visible) {
      raf = 0;
      return;
    }
    paint();
    raf = requestAnimationFrame(tick);
  }

  function play() {
    if (raf) return;
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  const onDot = (event) => {
    const btn = event.currentTarget;
    const index = Number(btn.dataset.heroUnit);
    if (!Number.isFinite(index)) return;
    seek(index);
  };
  dots.forEach((dot) => dot.addEventListener("click", onDot));

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) play();
    else stop();
  });
  io.observe(canvas);

  const onHide = () => {
    if (document.hidden) stop();
    else if (visible) play();
  };
  document.addEventListener("visibilitychange", onHide);

  const ro = new ResizeObserver(() => paint());
  ro.observe(canvas);
  play();

  return () => {
    stop();
    io.disconnect();
    ro.disconnect();
    document.removeEventListener("visibilitychange", onHide);
    dots.forEach((dot) => dot.removeEventListener("click", onDot));
  };
}
