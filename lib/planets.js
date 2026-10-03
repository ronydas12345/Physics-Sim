/**
 * Surface gravity presets and scene palettes for labs that expose g.
 * Planet identity is chosen by the student (chips), not inferred from g,
 * because Mercury and Mars round to the same slider step.
 */

export const CUSTOM_SCENE = Object.freeze({
  id: "custom",
  name: null,
  skyTop: "#c5ccd4",
  skyBottom: "#eef0f3",
  ground: "#9aa3ad",
  groundDark: "#7a838d",
  soil: "#5c636c",
  ink: "#1b2430",
  axis: "rgba(27, 36, 48, 0.72)",
  grid: "rgba(27, 36, 48, 0.14)",
});

export const GRAVITY_PRESETS = Object.freeze([
  {
    id: "moon",
    name: "Moon",
    g: 1.6,
    skyTop: "#0c0e14",
    skyBottom: "#2a303c",
    ground: "#9aa1ab",
    groundDark: "#6d737c",
    soil: "#4a5058",
    ink: "#e8eaed",
    axis: "rgba(232, 234, 237, 0.72)",
    grid: "rgba(232, 234, 237, 0.14)",
  },
  {
    id: "mercury",
    name: "Mercury",
    g: 3.7,
    skyTop: "#14110e",
    skyBottom: "#3a342c",
    ground: "#b08968",
    groundDark: "#7c5c45",
    soil: "#4a3728",
    ink: "#f3ebe3",
    axis: "rgba(243, 235, 227, 0.72)",
    grid: "rgba(243, 235, 227, 0.14)",
  },
  {
    id: "mars",
    name: "Mars",
    g: 3.7,
    skyTop: "#c47a5a",
    skyBottom: "#edd0b8",
    ground: "#b85c38",
    groundDark: "#8a3d22",
    soil: "#5c2e1c",
    ink: "#2a140c",
    axis: "rgba(42, 20, 12, 0.7)",
    grid: "rgba(42, 20, 12, 0.14)",
  },
  {
    id: "venus",
    name: "Venus",
    g: 8.9,
    skyTop: "#c9b36a",
    skyBottom: "#f3e6c0",
    ground: "#c4a574",
    groundDark: "#8a6b48",
    soil: "#5c4630",
    ink: "#2a2416",
    axis: "rgba(42, 36, 22, 0.7)",
    grid: "rgba(42, 36, 22, 0.14)",
  },
  {
    id: "uranus",
    name: "Uranus",
    g: 8.7,
    skyTop: "#6eb8b8",
    skyBottom: "#d7f1f1",
    ground: "#5a9e9e",
    groundDark: "#3d7373",
    soil: "#2a4a4a",
    ink: "#143030",
    axis: "rgba(20, 48, 48, 0.7)",
    grid: "rgba(20, 48, 48, 0.14)",
  },
  {
    id: "earth",
    name: "Earth",
    g: 9.8,
    skyTop: "#7fb7dc",
    skyBottom: "#eaf4fb",
    ground: "#6f8f63",
    groundDark: "#4f6a46",
    soil: "#5c4634",
    ink: "#1b2430",
    axis: "rgba(20, 32, 44, 0.72)",
    grid: "rgba(20, 32, 44, 0.12)",
  },
  {
    id: "saturn",
    name: "Saturn",
    g: 10.4,
    skyTop: "#c9b896",
    skyBottom: "#efe6d0",
    ground: "#d4c4a0",
    groundDark: "#a09070",
    soil: "#6e6248",
    ink: "#2a2618",
    axis: "rgba(42, 38, 24, 0.7)",
    grid: "rgba(42, 38, 24, 0.14)",
  },
  {
    id: "neptune",
    name: "Neptune",
    g: 11.2,
    skyTop: "#1e3a7a",
    skyBottom: "#7aa0d4",
    ground: "#3d5a8a",
    groundDark: "#243a62",
    soil: "#1a2744",
    ink: "#e8eef8",
    axis: "rgba(232, 238, 248, 0.72)",
    grid: "rgba(232, 238, 248, 0.14)",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    g: 24.8,
    skyTop: "#d4a574",
    skyBottom: "#f0d4b0",
    ground: "#c08a4a",
    groundDark: "#8a5c28",
    soil: "#5c3c18",
    ink: "#2a1c0c",
    axis: "rgba(42, 28, 12, 0.7)",
    grid: "rgba(42, 28, 12, 0.14)",
  },
]);

export function planetById(id) {
  return GRAVITY_PRESETS.find((planet) => planet.id === id) ?? null;
}

/** Chip order used by every lab that exposes g. Matches the projectile lab. */
export const PLANET_CHIP_ORDER = Object.freeze([
  "moon",
  "mercury",
  "venus",
  "earth",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
]);

function planetSvg(body) {
  return `<svg class="chip-icon planet-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">${body}</svg>`;
}

const PLANET_ICONS = Object.freeze({
  moon: planetSvg(
    `<circle cx="8" cy="8" r="6.2" fill="#c5c8ce"/><circle cx="6" cy="6.4" r="1.55" fill="#9aa0a8"/><circle cx="10.2" cy="9.3" r="1.05" fill="#a8adb4"/><circle cx="8.8" cy="5.1" r="0.7" fill="#9aa0a8"/>`,
  ),
  mercury: planetSvg(
    `<circle cx="8" cy="8" r="6.2" fill="#b08968"/><circle cx="6.1" cy="7" r="1.2" fill="#8a6a4e"/><circle cx="10.1" cy="9.6" r="0.9" fill="#8a6a4e"/><circle cx="9.2" cy="5.6" r="0.55" fill="#9a7a58"/>`,
  ),
  venus: planetSvg(
    `<circle cx="8" cy="8" r="6.2" fill="#d4c27a"/><ellipse cx="8" cy="7.2" rx="5.2" ry="1.7" fill="#e6d9a4" opacity=".7"/><ellipse cx="8" cy="9.6" rx="4.6" ry="1.2" fill="#c4b06a" opacity=".55"/>`,
  ),
  earth: planetSvg(
    `<circle cx="8" cy="8" r="6.2" fill="#3d7ab5"/><path fill="#5b8f4a" d="M4.1 6.1c1.6-.7 3.1.5 4.6.1 1.1-.3 2.1-1.2 3.2-.7-.2 1.4-1.1 2.1-2.3 2.7-1.2.5-2.9 0-3.8 1.2-1.3.1-2.2-2-1.7-3.3z"/><path fill="#6fa36a" d="M5.2 11c1 .5 2.1.2 2.8-.4.2 1-.5 2.1-1.8 2.2-.9 0-1.3-.8-1-1.8z"/>`,
  ),
  mars: planetSvg(
    `<circle cx="8" cy="8" r="6.2" fill="#c45c26"/><circle cx="6.3" cy="6.8" r="1.35" fill="#a4481c"/><circle cx="10.1" cy="10" r="0.85" fill="#a4481c"/><circle cx="9.4" cy="5.5" r="0.55" fill="#d47840"/>`,
  ),
  jupiter: planetSvg(
    `<defs><clipPath id="picon-jupiter"><circle cx="8" cy="8" r="6.2"/></clipPath></defs><circle cx="8" cy="8" r="6.2" fill="#c08a4a"/><g clip-path="url(#picon-jupiter)"><rect x="1" y="5.3" width="14" height="1.45" fill="#a87038"/><rect x="1" y="8.3" width="14" height="1.15" fill="#d4a86a"/><rect x="1" y="10.3" width="14" height="1" fill="#a87038"/><circle cx="6.2" cy="8" r="1.15" fill="#b06040"/></g>`,
  ),
  saturn: planetSvg(
    `<ellipse cx="8" cy="8.15" rx="7.6" ry="2.35" fill="none" stroke="#c4b48a" stroke-width="1.15"/><circle cx="8" cy="8" r="4.45" fill="#d4c4a0"/><ellipse cx="8" cy="7.4" rx="3.4" ry="1.05" fill="#e6d8b4" opacity=".45"/>`,
  ),
  uranus: planetSvg(
    `<ellipse cx="8" cy="8" rx="7.2" ry="2" fill="none" stroke="#9ed4d4" stroke-width="1"/><circle cx="8" cy="8" r="5.1" fill="#6eb8b8"/>`,
  ),
  neptune: planetSvg(
    `<circle cx="8" cy="8" r="6.2" fill="#3d5a8a"/><path fill="#5a7ab0" d="M2.6 7.3h10.8v1.35H2.6z"/><circle cx="6.6" cy="6.2" r="1" fill="#4a6a9a"/>`,
  ),
});

const FALLBACK_PLANET_ICON = planetSvg(`<circle cx="8" cy="8" r="6.2" fill="#9aa3ad"/>`);

/** Small globe mark for gravity chips. Unknown ids get a gray disc. */
export function planetIcon(id) {
  return PLANET_ICONS[id] ?? FALLBACK_PLANET_ICON;
}

export function sceneForGravity({ planetId, backgroundsOn = true } = {}) {
  if (!backgroundsOn) return CUSTOM_SCENE;
  const planet = planetById(planetId);
  if (!planet) return CUSTOM_SCENE;
  return planet;
}
