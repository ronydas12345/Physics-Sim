import {
  AXIS_MAX,
  AXIS_MIN,
  createState,
  displayedPosition,
  displacement,
  formatDistance,
  formatSignedMeters,
  nudgeDisplayed,
  reset as resetState,
  setDisplayedPosition,
  setPositiveRight,
  setWorldPosition,
} from "/lib/vectors1d.js";

const MIN_X = AXIS_MIN;
const MAX_X = AXIS_MAX;

function worldToX(world, view) {
  return view.originX + world * view.scale;
}

function xToWorld(px, view) {
  return (px - view.originX) / view.scale;
}

function createView(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = Math.max(1, canvas.clientWidth);
  const cssH = Math.max(1, canvas.clientHeight);
  const w = Math.round(cssW * dpr);
  const h = Math.round(cssH * dpr);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const pad = { l: 36, r: 36, t: 28, b: 42 };
  const plotW = cssW - pad.l - pad.r;
  const scale = plotW / (MAX_X - MIN_X);
  const originX = pad.l + (0 - MIN_X) * scale;
  const axisY = cssH * 0.55;
  return { cssW, cssH, dpr, pad, scale, originX, axisY };
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

function renderAxis(canvas, state, showVectors) {
  const view = createView(canvas);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, view.cssW, view.cssH);

  const sky = ctx.createLinearGradient(0, 0, 0, view.cssH);
  sky.addColorStop(0, "#d7ebf7");
  sky.addColorStop(1, "#f4efe6");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, view.cssW, view.cssH);

  const y = view.axisY;
  ctx.strokeStyle = "#1b2430";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(view.pad.l, y);
  ctx.lineTo(view.cssW - view.pad.r, y);
  ctx.stroke();

  const posEnd = state.positiveRight ? view.cssW - view.pad.r : view.pad.l;
  drawArrow(ctx, view.originX, y, posEnd, y, "#1c6b73");
  ctx.fillStyle = "#4d5a68";
  ctx.font = "600 12px Figtree, sans-serif";
  if (state.positiveRight) {
    ctx.textAlign = "right";
    ctx.fillText("positive →", view.cssW - 18, y - 18);
    ctx.textAlign = "left";
    ctx.fillText("← negative", 18, y - 18);
  } else {
    ctx.textAlign = "left";
    ctx.fillText("← positive", 18, y - 18);
    ctx.textAlign = "right";
    ctx.fillText("negative →", view.cssW - 18, y - 18);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "12px IBM Plex Mono, monospace";
  for (let world = MIN_X; world <= MAX_X; world += 1) {
    const x = worldToX(world, view);
    const major = world % 5 === 0;
    ctx.strokeStyle = "rgba(27,36,48,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - (major ? 10 : 5));
    ctx.lineTo(x, y + (major ? 10 : 5));
    ctx.stroke();
    if (major) {
      const label = state.positiveRight ? world : -world;
      ctx.fillStyle = "#1b2430";
      ctx.fillText(String(label), x, y + 14);
    }
  }

  const x0 = worldToX(0, view);
  ctx.fillStyle = "#1b2430";
  ctx.font = "600 11px Figtree, sans-serif";
  ctx.fillText("origin", x0, y + 32);

  const xInit = worldToX(state.initialPosition, view);
  const xNow = worldToX(state.currentPosition, view);
  if (showVectors && Math.abs(state.currentPosition - state.initialPosition) > 0.05) {
    drawArrow(ctx, xInit, y - 36, xNow, y - 36, "#c45c26");
    ctx.fillStyle = "#c45c26";
    ctx.font = "600 12px Figtree, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("displacement", (xInit + xNow) / 2, y - 54);
  } else if (showVectors) {
    ctx.fillStyle = "#4d5a68";
    ctx.font = "600 12px Figtree, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Δx = 0", xNow, y - 48);
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

export function mountVectors1D(root) {
  const canvas = root.querySelector("#axis-canvas");
  const readX = root.querySelector("#read-x");
  const readDx = root.querySelector("#read-dx");
  const dxArrow = root.querySelector("#dx-arrow");
  const readD = root.querySelector("#read-d");
  const input = root.querySelector("#pos-input");
  const valuesPanel = root.querySelector("#values-panel");
  const explainPanel = root.querySelector("#explain-panel");
  let state = createState();
  let showVectors = true;
  let view = null;
  let dragging = false;

  function paint() {
    view = renderAxis(canvas, state, showVectors);
    const x = displayedPosition(state);
    const dx = displacement(state);
    readX.textContent = formatSignedMeters(x);
    readD.textContent = formatDistance(state.distanceTraveled);
    const dxText = formatSignedMeters(dx);
    readDx.childNodes[0].textContent = `${dxText} `;
    dxArrow.textContent = Math.abs(dx) < 0.05 ? "" : dx > 0 ? "→" : "←";
    if (document.activeElement !== input) input.value = String(Math.round(x * 10) / 10);
    root.querySelector("#dir-right").classList.toggle("active", state.positiveRight);
    root.querySelector("#dir-left").classList.toggle("active", !state.positiveRight);
  }

  function moveDisplayed(next) {
    setDisplayedPosition(state, next);
    paint();
  }

  const onPointerDown = (event) => {
    if (!view) return;
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const world = xToWorld(event.clientX - rect.left, view);
    dragging = true;
    canvas.style.cursor = "grabbing";
    canvas.setPointerCapture(event.pointerId);
    setWorldPosition(state, world);
    paint();
  };
  const onPointerMove = (event) => {
    if (!dragging || !view) return;
    const rect = canvas.getBoundingClientRect();
    setWorldPosition(state, xToWorld(event.clientX - rect.left, view));
    paint();
  };
  const onPointerUp = () => {
    dragging = false;
    canvas.style.cursor = "grab";
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  const buttons = {
    reset: root.querySelector("#btn-reset-1d"),
    full: root.querySelector("#btn-full-1d"),
    neg: root.querySelector("#nudge-neg"),
    pos: root.querySelector("#nudge-pos"),
    dirR: root.querySelector("#dir-right"),
    dirL: root.querySelector("#dir-left"),
    togV: root.querySelector("#toggle-values"),
    togVec: root.querySelector("#toggle-vectors"),
    togE: root.querySelector("#toggle-explain"),
  };

  const onReset = () => {
    state = resetState(state);
    paint();
  };
  const onFull = () => {
    const node = root.querySelector(".sim-shell") || root;
    if (!document.fullscreenElement) node.requestFullscreen?.();
    else document.exitFullscreen?.();
  };
  const onNeg = () => {
    nudgeDisplayed(state, -1);
    paint();
  };
  const onPos = () => {
    nudgeDisplayed(state, 1);
    paint();
  };
  const onDirR = () => {
    setPositiveRight(state, true);
    paint();
  };
  const onDirL = () => {
    setPositiveRight(state, false);
    paint();
  };
  const onInput = () => {
    const n = Number(input.value);
    if (Number.isFinite(n)) moveDisplayed(n);
  };
  const onKey = (event) => {
    if (event.target.matches("input")) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onPos();
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onNeg();
    }
  };

  buttons.reset.addEventListener("click", onReset);
  buttons.full.addEventListener("click", onFull);
  buttons.neg.addEventListener("click", onNeg);
  buttons.pos.addEventListener("click", onPos);
  buttons.dirR.addEventListener("click", onDirR);
  buttons.dirL.addEventListener("click", onDirL);
  input.addEventListener("change", onInput);
  buttons.togV.addEventListener("change", () => {
    valuesPanel.hidden = !buttons.togV.checked;
  });
  buttons.togVec.addEventListener("change", () => {
    showVectors = buttons.togVec.checked;
    paint();
  });
  buttons.togE.addEventListener("change", () => {
    explainPanel.hidden = !buttons.togE.checked;
  });
  window.addEventListener("keydown", onKey);
  const resize = new ResizeObserver(() => paint());
  resize.observe(canvas);
  paint();

  return () => {
    resize.disconnect();
    window.removeEventListener("keydown", onKey);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
  };
}
