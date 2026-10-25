/**
 * Visual Theory kit used by every lab.
 *
 * Future simulations should build the Theory tab with theoryPage({ title, lead, cards, graphs }).
 * Each card: short title, anim id, color-coded eq via S/eqLines, vars list, caption that
 * names the matching colors in the animation. graphs: [{ id, title, caption }] from THEORY_GRAPHS.
 */

import { themeVar } from "./theme.js";

export const ANIMATIONS = {};

export const S = {
  d: (t = "D") => `<span class="eq-sym eq-sym-d">${t}</span>`,
  dx: (t = "Δx") => `<span class="eq-sym eq-sym-dx">${t}</span>`,
  x: (t = "x") => `<span class="eq-sym eq-sym-x">${t}</span>`,
  v: (t = "v") => `<span class="eq-sym eq-sym-v">${t}</span>`,
  a: (t = "a") => `<span class="eq-sym eq-sym-a">${t}</span>`,
  t: (t = "t") => `<span class="eq-sym eq-sym-t">${t}</span>`,
  f: (t = "F") => `<span class="eq-sym eq-sym-f">${t}</span>`,
  m: (t = "m") => `<span class="eq-sym eq-sym-m">${t}</span>`,
  w: (t = "W") => `<span class="eq-sym eq-sym-w">${t}</span>`,
  k: (t = "K") => `<span class="eq-sym eq-sym-k">${t}</span>`,
  th: (t = "θ") => `<span class="eq-sym eq-sym-th">${t}</span>`,
  g: (t = "g") => `<span class="eq-sym eq-sym-g">${t}</span>`,
  r: (t = "r") => `<span class="eq-sym eq-sym-r">${t}</span>`,
  n: (t = "N") => `<span class="eq-sym eq-sym-n">${t}</span>`,
  mu: (t = "μ") => `<span class="eq-sym eq-sym-mu">${t}</span>`,
};

export function eqLines(...lines) {
  return lines.map((line) => `<p>${line}</p>`).join("");
}

export function eqVar(kind, sym, name, unit) {
  return { kind, sym, name, unit };
}

function eqVars(items) {
  if (!items?.length) return "";
  return `<dl class="eq-vars">${items
    .map(
      (item) =>
        `<div><dt class="eq-sym eq-sym-${item.kind}">${item.sym}</dt><dd>${item.name}${
          item.unit ? ` <span class="eq-unit">${item.unit}</span>` : ""
        }</dd></div>`,
    )
    .join("")}</dl>`;
}

export function theoryVisual(id, caption) {
  return `
    <figure class="theory-visual" data-theory-anim="${id}">
      <canvas width="720" height="240" aria-label="${caption || id}"></canvas>
      ${caption ? `<figcaption>${caption}</figcaption>` : ""}
    </figure>`;
}

export function theoryCard({ title, eq, caption, anim, vars = [], extra = "" }) {
  const formula = eq ? `<div class="eq-display">${eq}</div>` : "";
  const side = formula || vars.length ? `<div class="theory-eq-side">${formula}${eqVars(vars)}</div>` : "";
  return `
          <section class="theory-block theory-visual-card">
            <h3>${title}</h3>
            <div class="theory-eq-row">
              ${anim ? theoryVisual(anim, caption) : caption ? `<p>${caption}</p>` : "<div></div>"}
              ${side}
            </div>
            ${extra}
          </section>`;
}

export function theoryPage({ title, lead, cards, graphs = [], fit }) {
  return `
      <div id="panel-theory" role="tabpanel" aria-labelledby="tab-btn-theory" hidden>
        <article class="theory theory-visual-page">
          <header class="theory-hero">
            <p class="kicker">Watch the idea, then return to the lab</p>
            <h2>${title}</h2>
            ${lead ? `<p>${lead}</p>` : ""}
          </header>
          ${cards.map((card) => theoryCard(card)).join("")}
          ${graphs.length ? theoryGraphSection(graphs) : ""}
          ${fit ? theoryFit(fit) : ""}
        </article>
      </div>`;
}

function theoryGraphSection(graphs) {
  return `
          <section class="theory-block theory-graphs-block">
            <h3>Identities on a graph</h3>
            <p class="muted">Closed-form curves for this lab — the same relationships the animations are showing.</p>
            <div class="graphs theory-graphs">
              ${graphs
                .map(
                  (graph) => `
                <div class="graph-wrap">
                  <h4>${graph.title}</h4>
                  <canvas data-theory-graph="${graph.id}" width="640" height="280" aria-label="${graph.title}"></canvas>
                  <p class="caption">${graph.caption || ""}</p>
                </div>`,
                )
                .join("")}
            </div>
          </section>`;
}

export const THEORY_GRAPHS = {
  "d-vs-dx": {
    xLabel: "Δx (m)",
    yLabel: "D (m)",
    xMin: -8,
    xMax: 8,
    yMin: 0,
    yMax: 9,
    yOfX: (x) => Math.abs(x),
    label: "D = |Δx|",
  },
  "v-vs-t": {
    xLabel: "t (s)",
    yLabel: "v (m/s)",
    xMin: 0,
    xMax: 6,
    yMin: -6,
    yMax: 10,
    yOfX: (t) => 8 - 2 * t,
    label: "v = 8 − 2t",
  },
  "x-vs-t": {
    xLabel: "t (s)",
    yLabel: "x (m)",
    xMin: 0,
    xMax: 6,
    yMin: -4,
    yMax: 18,
    yOfX: (t) => 8 * t - t * t,
    label: "x = 8t − t²",
  },
  "xab-vs-t": {
    xLabel: "t (s)",
    yLabel: "x_A/B (m)",
    xMin: 0,
    xMax: 8,
    yMin: -10,
    yMax: 20,
    yOfX: (t) => 12 - 5 * t,
    label: "x_A/B = 12 − 5t",
  },
  "xcm-vs-mb": {
    xLabel: "m_B (kg)",
    yLabel: "x_CM (m)",
    xMin: 0.5,
    xMax: 10,
    yMin: -10,
    yMax: 10,
    yOfX: (mb) => (2 * -10 + mb * 10) / (2 + mb),
    label: "x_CM = (m_A x_A + m_B x_B)/M",
  },
  "fnet-vs-unbalanced": {
    xLabel: "unbalanced F (N)",
    yLabel: "|F_net| (N)",
    xMin: 0,
    xMax: 20,
    yMin: 0,
    yMax: 22,
    yOfX: (f) => f,
    label: "|F_net| = unbalanced size",
  },
  "pair-opposite": {
    xLabel: "F_A on B (N)",
    yLabel: "F_B on A (N)",
    xMin: -20,
    xMax: 20,
    yMin: -22,
    yMax: 22,
    yOfX: (f) => -f,
    label: "F_B on A = −F_A on B",
  },
  "a-vs-fnet": {
    xLabel: "F_net (N)",
    yLabel: "a (m/s²)",
    xMin: -10,
    xMax: 20,
    yMin: -6,
    yMax: 12,
    yOfX: (f) => f / 2,
    label: "a = F_net / 2 kg",
  },
  "a-vs-fnet-zero": {
    xLabel: "F_net (N)",
    yLabel: "a (m/s²)",
    xMin: -5,
    xMax: 5,
    yMin: -2,
    yMax: 2,
    yOfX: () => 0,
    label: "a = 0 when F_net = 0",
  },
  "fg-vs-r": {
    xLabel: "r (m)",
    yLabel: "F_g (N)",
    xMin: 1,
    xMax: 8,
    yMin: 0,
    yMax: 1.2,
    yOfX: (r) => 1 / (r * r),
    label: "F_g ∝ 1/r²",
  },
  "fs-vs-fapp": {
    xLabel: "F_app (N)",
    yLabel: "friction (N)",
    xMin: 0,
    xMax: 16,
    yMin: 0,
    yMax: 12,
    yOfX: (f) => Math.min(f, 8),
    label: "f_s = F_app until μ_s N",
  },
  "fs-vs-x": {
    xLabel: "x (m)",
    yLabel: "F_s (N)",
    xMin: -0.2,
    xMax: 0.2,
    yMin: -5,
    yMax: 5,
    yOfX: (x) => -20 * x,
    label: "F_s = −kx",
  },
  "ac-vs-v2": {
    xLabel: "v² (m²/s²)",
    yLabel: "a_c (m/s²)",
    xMin: 0,
    xMax: 40,
    yMin: 0,
    yMax: 12,
    yOfX: (v2) => v2 / 4,
    label: "a_c = v² / 4 m",
  },
  "w-vs-theta": {
    xLabel: "θ (°)",
    yLabel: "W (J)",
    xMin: 0,
    xMax: 180,
    yMin: -12,
    yMax: 12,
    yOfX: (deg) => 10 * Math.cos((deg * Math.PI) / 180),
    label: "W = Fd cosθ",
  },
  "dk-vs-w": {
    xLabel: "W_net (J)",
    yLabel: "ΔK (J)",
    xMin: -20,
    xMax: 50,
    yMin: -22,
    yMax: 52,
    yOfX: (w) => w,
    label: "ΔK = W_net",
  },
  "w-vs-x-quad": {
    xLabel: "x (m)",
    yLabel: "W (J)",
    xMin: 0,
    xMax: 4,
    yMin: 0,
    yMax: 18,
    yOfX: (x) => x * x,
    label: "W = ∫ 2x dx = x²",
  },
  "range-vs-theta": {
    xLabel: "θ (°)",
    yLabel: "R (m)",
    xMin: 0,
    xMax: 90,
    yMin: 0,
    yMax: 45,
    yOfX: (deg) => (400 / 9.8) * Math.sin((2 * deg * Math.PI) / 180),
    label: "R = v₀² sin(2θ)/g",
  },
  "height-vs-theta": {
    xLabel: "θ (°)",
    yLabel: "H (m)",
    xMin: 0,
    xMax: 90,
    yMin: 0,
    yMax: 22,
    yOfX: (deg) => ((400 / (2 * 9.8)) * Math.sin((deg * Math.PI) / 180) ** 2),
    label: "H = v₀² sin²θ/(2g)",
  },
};

export function theoryFit(html) {
  return `
          <section class="theory-block">
            <h3>Fit your recorded trials</h3>
            <p>
              After two trials with different x-values, each “Your Trials” graph draws a dashed least-squares
              curve and prints the fitted equation with R². Compare that shape to the identity on this tab.
              Turn on <strong>Show exact identity</strong> for the closed-form overlay.
            </p>
            ${html}
          </section>`;
}

export function bindTheoryVisuals(root) {
  if (typeof document === "undefined" || !root?.querySelectorAll) return () => {};
  const panel = root.querySelector("#panel-theory");
  const figures = [...root.querySelectorAll("[data-theory-anim]")];
  const graphCanvases = [...root.querySelectorAll("[data-theory-graph]")];
  if (!figures.length && !graphCanvases.length) return () => {};
  let raf = 0;
  let graphsReady = false;
  let graphsPainting = false;
  let graphLoad = null;
  const t0 = performance.now();
  const reduced =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function paintIdentityGraphs() {
    if (graphsReady || graphsPainting || !graphCanvases.length) return;
    if (!graphLoad) graphLoad = import("../graphs.js");
    graphsPainting = true;
    graphLoad
      .then(({ renderXYScatter }) => {
        graphsPainting = false;
        if (panel && panel.hidden) return;
        let painted = 0;
        for (const canvas of graphCanvases) {
          const spec = THEORY_GRAPHS[canvas.dataset.theoryGraph];
          if (!spec) continue;
          renderXYScatter(canvas, [], {
            xKey: "x",
            yKey: "y",
            xLabel: spec.xLabel,
            yLabel: spec.yLabel,
            xMin: spec.xMin,
            xMax: spec.xMax,
            yMin: spec.yMin,
            yMax: spec.yMax,
            identity: {
              yOfX: spec.yOfX,
              xMin: spec.xMin,
              xMax: spec.xMax,
              label: spec.label,
            },
            showFit: false,
            showPointLabels: false,
          });
          if (canvas.clientWidth >= 40) painted += 1;
        }
        if (painted === graphCanvases.length) graphsReady = true;
      })
      .catch(() => {
        graphsPainting = false;
        graphLoad = null;
      });
  }

  function tick(now) {
    if (!root.isConnected) return;
    const live = panel && !panel.hidden;
    if (!live) graphsReady = false;
    if (live) {
      const t = reduced ? 1.2 : (now - t0) / 1000;
      for (const figure of figures) {
        const canvas = figure.querySelector("canvas");
        const draw = ANIMATIONS[figure.dataset.theoryAnim];
        if (canvas && draw) draw(canvas, t);
      }
      paintIdentityGraphs();
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

function palette() {
  return {
    ink: themeVar("--ink", "#141414"),
    soft: themeVar("--ink-soft", "#5a554c"),
    accent: themeVar("--accent", "#ff6b12"),
    teal: themeVar("--teal", "#12c4d4"),
    ok: themeVar("--ok", "#2fbe5a"),
    check: themeVar("--check", "#9b6bff"),
    paper: themeVar("--raised", "#ffffff"),
    field: themeVar("--field-bg", "#ffffff"),
    line: themeVar("--line", "#171717"),
    well: themeVar("--well-bg", "#1b2230"),
    wellInk: themeVar("--well-ink", "#f7f3ea"),
  };
}

function prep(canvas) {
  const cssW = canvas.clientWidth || 720;
  const cssH = canvas.clientHeight || 240;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(cssW * dpr);
  const h = Math.round(cssH * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  return { ctx, w: cssW, h: cssH, c: palette() };
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function chip(ctx, x, y, text, bg, fg) {
  ctx.font = "700 12px Figtree, sans-serif";
  const tw = ctx.measureText(text).width;
  roundRect(ctx, x, y, tw + 16, 22, 11);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.fillText(text, x + 8, y + 15);
}

function arrow(ctx, x1, y1, x2, y2, color, width = 3) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
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

function ball(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function track(ctx, w, h, c, y = h * 0.62) {
  ctx.strokeStyle = c.line;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(36, y);
  ctx.lineTo(w - 36, y);
  ctx.stroke();
  ctx.globalAlpha = 1;
  return y;
}

function pingpong(t, period) {
  const u = (t / period) % 2;
  return u < 1 ? u : 2 - u;
}

function lerp(a, b, u) {
  return a + (b - a) * u;
}

function mapX(x, x0, x1, left, right) {
  return left + ((x - x0) / (x1 - x0)) * (right - left);
}

ANIMATIONS["distance-displacement"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const y = track(ctx, w, h, c);
  const left = 70;
  const right = w - 70;
  const xAt = (m) => mapX(m, -1, 6, left, right);
  const cycle = t % 6;
  let x = 0;
  if (cycle < 2.4) x = lerp(0, 5, cycle / 2.4);
  else x = lerp(5, 2, (cycle - 2.4) / 3.6);
  const d = cycle < 2.4 ? x : 5 + (5 - x);
  const dx = x;
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = c.teal;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(xAt(0), y - 28);
  ctx.lineTo(xAt(x), y - 28);
  ctx.stroke();
  ctx.setLineDash([]);
  arrow(ctx, xAt(0), y + 26, xAt(Math.max(0.15, dx)), y + 26, c.accent, 3);
  ball(ctx, xAt(x), y - 10, 11, c.ok);
  chip(ctx, 16, 12, `D = ${d.toFixed(1)} m`, c.teal, "#083344");
  chip(ctx, 140, 12, `Δx = ${dx.toFixed(1)} m`, c.accent, "#141414");
};

ANIMATIONS["signed-vector"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const y = h * 0.55;
  const mag = 90 + 50 * Math.sin(t * 1.4);
  const sign = Math.sin(t * 0.7) >= 0 ? 1 : -1;
  const x0 = w / 2;
  arrow(ctx, x0, y, x0 + sign * mag, y, sign > 0 ? c.ok : c.accent, 5);
  ctx.strokeStyle = c.line;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(w - 40, y);
  ctx.stroke();
  ctx.globalAlpha = 1;
  chip(ctx, 16, 12, sign > 0 ? "+ right" : "− left", sign > 0 ? c.ok : c.accent, "#141414");
  chip(ctx, 130, 12, `Δx = ${(sign * (mag / 30)).toFixed(1)} m`, c.teal, "#083344");
};

ANIMATIONS["d-ge-dx"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const u = pingpong(t, 3.2);
  const turn = 0.35 + 0.55 * u;
  const D = 8;
  const dx = D * (1 - 2 * Math.abs(turn - 0.5));
  const ox = 50;
  const oy = h - 36;
  const s = Math.min((w - 90) / 10, (h - 70) / 10);
  ctx.strokeStyle = c.line;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(ox, 20);
  ctx.lineTo(ox, oy);
  ctx.lineTo(w - 24, oy);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = c.ok;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + 8 * s, oy - 8 * s);
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox - 0, oy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + 8 * s, oy);
  ctx.strokeStyle = c.ok;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + 8 * s, oy - 8 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox + 8 * s, oy - 8 * s);
  ctx.lineTo(ox, oy);
  ctx.stroke();
  ctx.strokeStyle = c.teal;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + 8 * s, oy - 8 * s);
  ctx.stroke();
  const px = ox + Math.abs(dx) * s;
  const py = oy - D * s * 0.85;
  ball(ctx, ox + Math.abs(dx) * s, oy - D * s, 7, c.accent);
  chip(ctx, w - 170, 12, `D ≥ |Δx|`, c.ok, "#141414");
  chip(ctx, w - 170, 40, `|Δx| = ${Math.abs(dx).toFixed(1)}`, c.accent, "#141414");
};

ANIMATIONS["v-equals-v0-at"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const y = track(ctx, w, h, c);
  const v0 = 8;
  const a = -2;
  const tmax = 6;
  const clock = t % tmax;
  const v = v0 + a * clock;
  const x = v0 * clock + 0.5 * a * clock * clock;
  const left = 50;
  const right = w - 50;
  const px = mapX(x, -4, 18, left, right);
  ball(ctx, px, y - 10, 11, c.ok);
  arrow(ctx, px, y - 28, px + Math.max(-70, Math.min(70, v * 8)), y - 28, c.teal, 3);
  arrow(ctx, px, y + 24, px + a * 22, y + 24, c.accent, 3);
  chip(ctx, 16, 12, `v = v₀ + at = ${v.toFixed(1)} m/s`, c.teal, "#083344");
  chip(ctx, 16, 40, `t = ${clock.toFixed(1)} s`, c.accent, "#141414");
};

ANIMATIONS["speeding-slowing"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const mid = w / 2;
  ctx.strokeStyle = c.line;
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.moveTo(mid, 16);
  ctx.lineTo(mid, h - 16);
  ctx.stroke();
  ctx.globalAlpha = 1;
  const drawCase = (cx, label, sameSign) => {
    const y = h * 0.62;
    ctx.fillStyle = c.ink;
    ctx.font = "700 13px Figtree, sans-serif";
    ctx.fillText(label, cx - 70, 28);
    const u = pingpong(t, 2.4);
    const v = sameSign ? lerp(4, 12, u) : lerp(12, 2, u);
    const a = sameSign ? 6 : -6;
    ball(ctx, cx, y, 12, c.ok);
    arrow(ctx, cx, y - 32, cx + v * 5, y - 32, c.teal);
    arrow(ctx, cx, y + 32, cx + a * 5, y + 32, c.accent);
    ctx.font = "600 11px Figtree, sans-serif";
    ctx.fillStyle = c.teal;
    ctx.fillText("v", cx + v * 5 + 6, y - 28);
    ctx.fillStyle = c.accent;
    ctx.fillText("a", cx + a * 5 + 6, y + 36);
  };
  drawCase(w * 0.25, "same sign → speeding up", true);
  drawCase(w * 0.75, "opposite signs → slowing", false);
};

ANIMATIONS["x-from-vt-area"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const ox = 44;
  const oy = h - 28;
  const gw = w - 80;
  const gh = h - 70;
  const tmax = 4;
  const clock = t % tmax;
  const v0 = 2;
  const a = 1.2;
  const v = (tt) => v0 + a * tt;
  ctx.strokeStyle = c.line;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(ox, 18);
  ctx.lineTo(ox, oy);
  ctx.lineTo(ox + gw, oy);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(ox, oy - v(0) * 18);
  for (let i = 0; i <= 40; i++) {
    const tt = (i / 40) * tmax;
    ctx.lineTo(ox + (tt / tmax) * gw, oy - v(tt) * 18);
  }
  ctx.strokeStyle = c.teal;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox, oy - v(0) * 18);
  for (let i = 0; i <= 40; i++) {
    const tt = (i / 40) * clock;
    ctx.lineTo(ox + (tt / tmax) * gw, oy - v(tt) * 18);
  }
  ctx.lineTo(ox + (clock / tmax) * gw, oy);
  ctx.closePath();
  ctx.fillStyle = c.teal;
  ctx.globalAlpha = 0.28;
  ctx.fill();
  ctx.globalAlpha = 1;
  const dx = v0 * clock + 0.5 * a * clock * clock;
  chip(ctx, w - 190, 12, `Δx = area = ${dx.toFixed(1)} m`, c.accent, "#141414");
};

ANIMATIONS["motion-diagram"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const y1 = h * 0.38;
  const y2 = h * 0.72;
  const n = 7;
  const phase = (t % 3.5) / 3.5;
  const shown = Math.max(1, Math.floor(phase * (n + 1)));
  ctx.font = "700 12px Figtree, sans-serif";
  ctx.fillStyle = c.ink;
  ctx.fillText("constant v  ·  equal gaps", 16, 22);
  ctx.fillText("speeding up  ·  gaps grow", 16, h * 0.52);
  for (let i = 0; i < shown; i++) {
    ball(ctx, 50 + i * ((w - 90) / (n - 1)), y1, 8, c.teal);
    const x = 50 + ((i * (i + 1)) / 2) * ((w - 110) / 28);
    ball(ctx, x, y2, 8, c.accent);
  }
};

ANIMATIONS["xt-vt-at"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const clock = t % 4;
  const a = 2;
  const v = a * clock;
  const x = 0.5 * a * clock * clock;
  const cols = [
    { label: "x(t)", color: c.ok, y: (tt) => 0.5 * a * tt * tt, scale: 4 },
    { label: "v(t)", color: c.teal, y: (tt) => a * tt, scale: 10 },
    { label: "a(t)", color: c.accent, y: () => a, scale: 18 },
  ];
  cols.forEach((col, i) => {
    const x0 = 18 + i * (w / 3);
    const gw = w / 3 - 28;
    const oy = h - 24;
    ctx.fillStyle = c.ink;
    ctx.font = "700 12px Figtree, sans-serif";
    ctx.fillText(col.label, x0, 18);
    ctx.strokeStyle = c.line;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.moveTo(x0, 28);
    ctx.lineTo(x0, oy);
    ctx.lineTo(x0 + gw, oy);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    for (let k = 0; k <= 30; k++) {
      const tt = (k / 30) * clock;
      const px = x0 + (tt / 4) * gw;
      const py = oy - col.y(tt) * col.scale;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = col.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  });
  chip(ctx, w - 160, 8, `t = ${clock.toFixed(1)} s`, c.check, "#fff");
};

ANIMATIONS["relative-velocity"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const y = track(ctx, w, h, c);
  const vA = 8;
  const vB = 3;
  const clock = t % 5;
  const xA = 20 + vA * clock * 18;
  const xB = 80 + vB * clock * 18;
  ball(ctx, 40 + (xA % (w - 100)), y - 28, 11, c.ok);
  ball(ctx, 40 + (xB % (w - 100)), y - 10, 11, c.accent);
  chip(ctx, 16, 12, `v_A = ${vA}  v_B = ${vB}`, c.teal, "#083344");
  chip(ctx, 16, 40, `v_A/B = v_A − v_B = ${vA - vB} m/s`, c.accent, "#141414");
};

ANIMATIONS["same-v-two-frames"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const clock = t % 4;
  const v = 6;
  const y1 = h * 0.36;
  const y2 = h * 0.72;
  ctx.font = "700 12px Figtree, sans-serif";
  ctx.fillStyle = c.ink;
  ctx.fillText("ground frame", 16, 20);
  ctx.fillText("A’s frame", 16, h * 0.55);
  const xA = 50 + v * clock * 22;
  const xB = 110 + v * clock * 22;
  ball(ctx, xA, y1, 10, c.ok);
  ball(ctx, xB, y1, 10, c.accent);
  ball(ctx, w / 2 - 30, y2, 10, c.ok);
  ball(ctx, w / 2 + 30, y2, 10, c.accent);
  chip(ctx, w - 150, 12, "v_A/B = 0", c.check, "#fff");
};

ANIMATIONS["center-of-mass"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const y = track(ctx, w, h, c, h * 0.58);
  const mA = 2;
  const mB = 2 + 4 * pingpong(t, 3.4);
  const xA = w * 0.28;
  const xB = w * 0.72;
  const xcm = (mA * xA + mB * xB) / (mA + mB);
  ball(ctx, xA, y - 12, 8 + mA * 2, c.teal);
  ball(ctx, xB, y - 12, 8 + mB * 1.4, c.accent);
  ctx.save();
  ctx.translate(xcm, y + 8);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = c.check;
  ctx.fillRect(-7, -7, 14, 14);
  ctx.restore();
  chip(ctx, 16, 12, `m_B = ${mB.toFixed(1)} kg`, c.accent, "#141414");
  chip(ctx, 150, 12, "CM shifts toward heavier", c.check, "#fff");
};

ANIMATIONS["internal-vs-external"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const y = h * 0.6;
  const u = pingpong(t, 2.8);
  const sep = 30 + 50 * u;
  const xcm = w / 2;
  ball(ctx, xcm - sep, y, 12, c.teal);
  ball(ctx, xcm + sep, y, 12, c.accent);
  ctx.save();
  ctx.translate(xcm, y + 22);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = c.check;
  ctx.fillRect(-6, -6, 12, 12);
  ctx.restore();
  arrow(ctx, xcm - sep + 16, y - 28, xcm - sep - 20, y - 28, c.teal);
  arrow(ctx, xcm + sep - 16, y - 28, xcm + sep + 20, y - 28, c.accent);
  chip(ctx, 16, 12, "internal pair → CM stays", c.ok, "#141414");
};

ANIMATIONS["fbd"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const x = w * 0.32;
  const y = h * 0.58;
  roundRect(ctx, x - 22, y - 22, 44, 44, 8);
  ctx.fillStyle = c.ok;
  ctx.fill();
  arrow(ctx, x, y + 22, x, y + 70, c.accent);
  arrow(ctx, x, y - 22, x, y - 70, c.teal);
  const push = 20 + 50 * pingpong(t, 2.6);
  arrow(ctx, x + 22, y, x + 22 + push, y, c.check);
  ctx.font = "600 12px Figtree, sans-serif";
  ctx.fillStyle = c.accent;
  ctx.fillText("Fg", x + 8, y + 64);
  ctx.fillStyle = c.teal;
  ctx.fillText("N", x + 8, y - 58);
  ctx.fillStyle = c.check;
  ctx.fillText("F_app", x + 28 + push, y - 8);
  chip(ctx, w * 0.58, 16, "FBD: only external forces", c.ink, c.paper);
};

ANIMATIONS["net-force"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const y = h * 0.55;
  const x = w * 0.28;
  const f1 = 70;
  const f2 = 20 + 40 * pingpong(t, 2.8);
  arrow(ctx, x, y, x + f1, y, c.ok, 5);
  arrow(ctx, x, y, x - f2, y, c.accent, 5);
  arrow(ctx, x, y + 40, x + (f1 - f2), y + 40, c.check, 5);
  chip(ctx, 16, 12, `F_net = ${((f1 - f2) / 8).toFixed(1)} N`, c.check, "#fff");
};

ANIMATIONS["third-law"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const y = h * 0.58;
  const pulse = 18 + 10 * Math.sin(t * 3);
  const xA = w * 0.38;
  const xB = w * 0.62;
  roundRect(ctx, xA - 24, y - 20, 40, 40, 8);
  ctx.fillStyle = c.teal;
  ctx.fill();
  roundRect(ctx, xB - 16, y - 20, 40, 40, 8);
  ctx.fillStyle = c.accent;
  ctx.fill();
  arrow(ctx, xA + 18, y - 36, xA + 18 + pulse, y - 36, c.ok);
  arrow(ctx, xB - 18, y + 36, xB - 18 - pulse, y + 36, c.check);
  chip(ctx, 16, 12, "A on B  =  − B on A", c.ok, "#141414");
  chip(ctx, 16, 40, "never on the same FBD", c.accent, "#141414");
};

ANIMATIONS["first-law-coast"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const y = track(ctx, w, h, c);
  const x = 50 + ((t * 70) % (w - 100));
  ball(ctx, x, y - 10, 11, c.ok);
  arrow(ctx, x, y - 32, x + 54, y - 32, c.teal);
  ctx.font = "700 13px Figtree, sans-serif";
  ctx.fillStyle = c.ink;
  ctx.fillText("ΣF = 0  →  a = 0  →  v stays", 16, 24);
  chip(ctx, 16, 40, "rest is just v = 0", c.check, "#fff");
};

ANIMATIONS["f-ma"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const F = 4 + 8 * pingpong(t, 3);
  const m = 2 + 3 * pingpong(t + 1.1, 3.6);
  const a = F / m;
  const y = h * 0.62;
  const x = w * 0.3;
  roundRect(ctx, x - 18, y - 18, 28 + m * 8, 36, 8);
  ctx.fillStyle = c.ok;
  ctx.fill();
  arrow(ctx, x + 20 + m * 4, y, x + 20 + m * 4 + F * 10, y, c.accent, 4);
  chip(ctx, 16, 12, `F_net = ${F.toFixed(1)} N`, c.accent, "#141414");
  chip(ctx, 160, 12, `m = ${m.toFixed(1)} kg`, c.teal, "#083344");
  chip(ctx, 16, 40, `a = F/m = ${a.toFixed(2)} m/s²`, c.check, "#fff");
};

ANIMATIONS["gravity-inverse-square"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const r = 70 + 90 * pingpong(t, 3.5);
  const x1 = w * 0.32;
  const x2 = x1 + r;
  const y = h * 0.55;
  const fg = 1800 / (r * r);
  ball(ctx, x1, y, 16, c.ok);
  ball(ctx, x2, y, 10, c.accent);
  arrow(ctx, x1 + 18, y - 24, x1 + 18 + fg * 80, y - 24, c.check);
  arrow(ctx, x2 - 12, y + 24, x2 - 12 - fg * 80, y + 24, c.check);
  chip(ctx, 16, 12, `r = ${(r / 20).toFixed(1)} m`, c.teal, "#083344");
  chip(ctx, 130, 12, `Fg ∝ 1/r²`, c.accent, "#141414");
};

ANIMATIONS["static-kinetic"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const y = track(ctx, w, h, c);
  const cycle = t % 5;
  const fapp = Math.min(12, cycle * 3.2);
  const fsmax = 8;
  const sliding = fapp > fsmax;
  const x = sliding ? 80 + (cycle - fsmax / 3.2) * 90 : 80;
  roundRect(ctx, x - 18, y - 28, 36, 28, 6);
  ctx.fillStyle = sliding ? c.accent : c.ok;
  ctx.fill();
  arrow(ctx, x + 18, y - 14, x + 18 + fapp * 8, y - 14, c.check);
  chip(ctx, 16, 12, `F_app = ${fapp.toFixed(1)} N`, c.check, "#fff");
  chip(ctx, 160, 12, sliding ? "kinetic: sliding" : "static: stuck", sliding ? c.accent : c.ok, "#141414");
};

ANIMATIONS["hooke"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const y = h * 0.55;
  const x0 = w * 0.42;
  const amp = 70;
  const x = x0 + amp * Math.sin(t * 2);
  ctx.strokeStyle = c.line;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(36, y);
  const coils = 10;
  for (let i = 0; i <= coils; i++) {
    const px = lerp(50, x - 16, i / coils);
    ctx.lineTo(px, y + ((i % 2) * 2 - 1) * 14);
  }
  ctx.stroke();
  roundRect(ctx, x - 14, y - 18, 32, 36, 8);
  ctx.fillStyle = c.ok;
  ctx.fill();
  const Fs = -((x - x0) / amp) * 6;
  arrow(ctx, x, y - 36, x + Fs * 14, y - 36, c.accent);
  chip(ctx, 16, 12, `Fs = −kx`, c.accent, "#141414");
  chip(ctx, 120, 12, `x = ${((x - x0) / 40).toFixed(2)} m`, c.teal, "#083344");
};

ANIMATIONS["circular"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const cx = w * 0.42;
  const cy = h * 0.52;
  const r = Math.min(w, h) * 0.32;
  const ang = t * 1.3;
  const x = cx + r * Math.cos(ang);
  const y = cy + r * Math.sin(ang);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = c.line;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ball(ctx, x, y, 10, c.ok);
  const vx = -Math.sin(ang);
  const vy = Math.cos(ang);
  arrow(ctx, x, y, x + vx * 56, y + vy * 56, c.teal, 3);
  arrow(ctx, x, y, x - Math.cos(ang) * 48, y - Math.sin(ang) * 48, c.accent, 3);
  chip(ctx, 16, 12, "v tangent", c.teal, "#083344");
  chip(ctx, 120, 12, "a toward center", c.accent, "#141414");
};

ANIMATIONS["ac-scales-v2"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const v = 2 + 4 * pingpong(t, 3);
  const ac = (v * v) / 4;
  ctx.font = "700 48px Fraunces, serif";
  ctx.fillStyle = c.ink;
  ctx.fillText(`v → ${v.toFixed(1)}`, 24, h * 0.42);
  ctx.fillStyle = c.accent;
  ctx.fillText(`ac → ${ac.toFixed(1)}`, 24, h * 0.78);
  chip(ctx, w - 180, 16, "double v, quadruple ac", c.check, "#fff");
};

ANIMATIONS["work-cos-theta"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const y = h * 0.62;
  const x0 = 80;
  const d = 160;
  const theta = ((t * 40) % 180) * (Math.PI / 180);
  arrow(ctx, x0, y, x0 + d, y, c.teal, 4);
  arrow(ctx, x0, y, x0 + Math.cos(theta) * 120, y - Math.sin(theta) * 120, c.accent, 4);
  const W = Math.cos(theta);
  chip(ctx, 16, 12, `θ = ${((theta * 180) / Math.PI).toFixed(0)}°`, c.accent, "#141414");
  chip(ctx, 110, 12, `W = Fd cosθ = ${(W * 10).toFixed(1)} J`, W >= 0 ? c.ok : c.check, "#141414");
  ctx.font = "600 12px Figtree, sans-serif";
  ctx.fillStyle = c.teal;
  ctx.fillText("d", x0 + d + 8, y + 4);
  ctx.fillStyle = c.accent;
  ctx.fillText("F", x0 + Math.cos(theta) * 120 + 8, y - Math.sin(theta) * 120);
};

ANIMATIONS["wnet-equals-dk"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const u = pingpong(t, 3);
  const W = lerp(0, 50, u);
  const Ki = 4;
  const Kf = Ki + W;
  const bar = (x, val, color, label) => {
    const bh = val * 1.8;
    roundRect(ctx, x, h - 36 - bh, 64, bh, 8);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = c.ink;
    ctx.font = "700 12px Figtree, sans-serif";
    ctx.fillText(label, x, h - 16);
    ctx.fillText(`${val.toFixed(0)} J`, x, h - 44 - bh);
  };
  bar(60, W, c.accent, "W_net");
  bar(160, Kf - Ki, c.teal, "ΔK");
  bar(280, Ki, c.ok, "Kᵢ");
  bar(380, Kf, c.check, "K_f");
  chip(ctx, w - 190, 12, "W_net = ΔK", c.ok, "#141414");
};

ANIMATIONS["area-under-fx"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const ox = 44;
  const oy = h - 30;
  const gw = w - 90;
  const F = (x) => 0.35 * x;
  const xmax = 8;
  const xnow = (t % 4) * 2;
  ctx.strokeStyle = c.line;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(ox, 16);
  ctx.lineTo(ox, oy);
  ctx.lineTo(ox + gw, oy);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox, oy - F(0) * 80);
  for (let i = 0; i <= 40; i++) {
    const x = (i / 40) * xmax;
    ctx.lineTo(ox + (x / xmax) * gw, oy - F(x) * 80);
  }
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  for (let i = 0; i <= 40; i++) {
    const x = (i / 40) * xnow;
    ctx.lineTo(ox + (x / xmax) * gw, oy - F(x) * 80);
  }
  ctx.lineTo(ox + (xnow / xmax) * gw, oy);
  ctx.closePath();
  ctx.fillStyle = c.ok;
  ctx.globalAlpha = 0.3;
  ctx.fill();
  ctx.globalAlpha = 1;
  const W = 0.5 * 0.35 * xnow * xnow;
  chip(ctx, w - 170, 12, `W = area = ${W.toFixed(1)} J`, c.ok, "#141414");
};

ANIMATIONS["signed-area"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const ox = 40;
  const oy = h * 0.55;
  const gw = w - 80;
  ctx.strokeStyle = c.line;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.moveTo(ox, 16);
  ctx.lineTo(ox, h - 16);
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + gw, oy);
  ctx.stroke();
  ctx.globalAlpha = 1;
  const u = (t % 4) / 4;
  const drawRect = (x0, x1, F, color, limit) => {
    const xa = ox + x0 * gw;
    const xb = ox + Math.min(x1, limit) * gw;
    if (xb <= xa) return;
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = color;
    ctx.fillRect(xa, oy, xb - xa, -F);
    ctx.globalAlpha = 1;
  };
  drawRect(0, 0.5, 50, c.ok, u);
  drawRect(0.5, 1, -40, c.accent, u);
  chip(ctx, 16, 12, "above axis +W", c.ok, "#141414");
  chip(ctx, 160, 12, "below axis −W", c.accent, "#141414");
};

ANIMATIONS["projectile-split"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const x0 = 40;
  const y0 = h - 28;
  const v0 = 9.2;
  const ang = Math.PI / 4;
  const g = 9.8;
  const T = (2 * v0 * Math.sin(ang)) / g;
  const clock = t % T;
  const vx = v0 * Math.cos(ang);
  const vy0 = v0 * Math.sin(ang);
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) {
    const tt = (i / 40) * T;
    const px = x0 + vx * tt * 18;
    const py = y0 - (vy0 * tt - 0.5 * g * tt * tt) * 18;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = c.line;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;
  const x = x0 + vx * clock * 18;
  const y = y0 - (vy0 * clock - 0.5 * g * clock * clock) * 18;
  const vy = vy0 - g * clock;
  ball(ctx, x, y, 8, c.ok);
  arrow(ctx, x, y, x + vx * 6, y, c.teal);
  arrow(ctx, x, y, x, y - vy * 6, c.accent);
  chip(ctx, 16, 12, `v_x constant`, c.teal, "#083344");
  chip(ctx, 140, 12, `v_y = ${vy.toFixed(1)} m/s`, c.accent, "#141414");
};

ANIMATIONS["range-vs-angle"] = (canvas, t) => {
  const { ctx, w, h, c } = prep(canvas);
  const theta = 10 + 70 * pingpong(t, 4);
  const rad = (theta * Math.PI) / 180;
  const R = Math.sin(2 * rad);
  const H = Math.sin(rad) ** 2;
  const ox = 40;
  const oy = h - 28;
  ctx.strokeStyle = c.line;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.moveTo(ox, 16);
  ctx.lineTo(ox, oy);
  ctx.lineTo(w - 20, oy);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  for (let d = 0; d <= 90; d++) {
    const rr = Math.sin((2 * d * Math.PI) / 180);
    const px = ox + (d / 90) * (w - 70);
    const py = oy - rr * (h - 70);
    if (d === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = c.teal;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  const px = ox + (theta / 90) * (w - 70);
  const py = oy - R * (h - 70);
  ball(ctx, px, py, 7, c.accent);
  chip(ctx, 16, 12, `θ = ${theta.toFixed(0)}°`, c.accent, "#141414");
  chip(ctx, 110, 12, `R peaks at 45°`, c.ok, "#141414");
  chip(ctx, 230, 12, `H = ${(H * 10).toFixed(1)}`, c.check, "#fff");
};

export const ANIMATION_IDS = Object.keys(ANIMATIONS);
