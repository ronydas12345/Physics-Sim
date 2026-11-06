/**
 * Shared highlight targeting used by How to Use / Guided Lab and the Learning Branch Manager.
 * Overlay geometry uses the existing .tutorial-spot / .tutorial-panel CSS.
 */

export const TARGET_ALIASES = {
  scene: "#axis-canvas",
  playback: ".transport",
  controls: ".track-controls",
  values: "#values-panel",
  graphs: ".graphs",
  play: "#btn-play",
  pause: "#btn-pause",
  reset: "#btn-reset",
  camera: "#camera-controls",
  xt: "#graph-xt",
  vt: "#graph-vt",
  at: "#graph-at",
  fbd: "#fbd-canvas",
  fbda: "#fbd-a",
  fbdb: "#fbd-b",
  diagram: "#diagram-canvas",
  "force-controls": "#force-controls",
  "net-force-panel": "#net-force-panel",
  "motion-state-panel": "#motion-state-panel",
  "inertia-panel": "#inertia-panel",
  "scenario-selector": "#scenario-selector",
  "playback-controls": "#playback-controls",
  "btn-launch": "#btn-launch",
  launch: "#btn-launch",
  "acceleration-panel": "#acceleration-panel",
  "velocity-panel": "#velocity-panel",
  "mass-control": "#mass-control",
  "relationship-investigation": "#relationship-investigation",
  "data-table": "#data-table",
  "graph-panel": "#graph-panel",
  "simulation-canvas": "#simulation-canvas",
  "mass-controls": "#mass-controls",
  "distance-control": "#distance-control",
  "force-display": "#force-display",
  "gravity-force-vectors": "#gravity-force-vectors",
  "force-pair-panel": "#force-pair-panel",
  "earth-mode": "#earth-mode",
  "field-mode": "#field-mode",
  "motion-mode": "#motion-mode",
  "equation-display": "#equation-display",
  "distance-marker": "#distance-marker",
  "height-control": "#height-control",
  "orbit-mode": "#orbit-mode",
  "object-a": "#object-a",
  "object-b": "#object-b",
  "field-visualization": "#field-visualization",
  "friction-animation": "#simulation-canvas",
  "applied-force-control": "#applied-force-control",
  "static-coefficient-control": "#static-coefficient-control",
  "kinetic-coefficient-control": "#kinetic-coefficient-control",
  "surface-preset-control": "#surface-preset-control",
  "force-vector-toggle": "#force-vector-toggle",
  "force-readout": "#force-readout",
  "net-force-readout": "#net-force-panel",
  "acceleration-readout": "#acceleration-panel",
  "spring-animation": "#simulation-canvas",
  "equilibrium-marker": "#equilibrium-marker",
  "displacement-control": "#displacement-control",
  "spring-constant-control": "#spring-constant-control",
  "motion-mode-control": "#motion-mode-control",
  "spring-force-readout": "#force-readout",
  "data-record-control": "#data-table",
  "simulation-reset-control": "#playback-controls",
  "circular-motion-animation": "#simulation-canvas",
  "circle-center": "#circle-center",
  "radius-control": "#radius-control",
  "speed-control": "#speed-control",
  "velocity-vector": "#velocity-vector",
  "acceleration-vector": "#acceleration-vector",
  "physics-readouts": "#physics-readouts",
  "angle-control": "#angle-control",
};

function escapeCssId(id) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(id);
  return String(id).replace(/([^\w-])/g, "\\$1");
}

export function resolveTutorialTarget(root, highlight) {
  if (!highlight || !root?.querySelector) return null;
  const id = typeof highlight === "string" ? highlight : highlight.target;
  if (!id) return null;
  if (/^[.#\[]/.test(id)) return root.querySelector(id);
  return (
    root.querySelector(`[data-tutorial="${id}"]`) ||
    root.querySelector(`#${escapeCssId(id)}`) ||
    (TARGET_ALIASES[id] ? root.querySelector(TARGET_ALIASES[id]) : null)
  );
}

export function placeTutorialHighlight(spot, panel, target) {
  if (!spot || !panel || typeof window === "undefined") return;
  if (target) {
    if (typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    const r = target.getBoundingClientRect();
    spot.hidden = false;
    spot.style.left = `${Math.max(8, r.left - 6)}px`;
    spot.style.top = `${Math.max(8, r.top - 6)}px`;
    spot.style.width = `${r.width + 12}px`;
    spot.style.height = `${r.height + 12}px`;
  } else {
    spot.hidden = true;
  }
  const tr = target?.getBoundingClientRect();
  const pw = Math.min(380, window.innerWidth - 24);
  const ph = panel.offsetHeight || 360;
  let left = tr ? tr.right + 16 : window.innerWidth - pw - 24;
  let top = tr ? Math.min(tr.top, window.innerHeight - ph - 16) : 88;
  if (left + pw > window.innerWidth - 12) left = Math.max(12, (tr?.left || 24) - pw - 16);
  if (left < 12) left = 12;
  if (top < 12) top = 12;
  if (top + ph > window.innerHeight - 12) top = Math.max(12, window.innerHeight - ph - 12);
  if (tr && left < tr.right && left + pw > tr.left && top < tr.bottom && top + ph > tr.top) {
    top = Math.min(window.innerHeight - ph - 12, tr.bottom + 12);
  }
  panel.style.width = `${pw}px`;
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
}
