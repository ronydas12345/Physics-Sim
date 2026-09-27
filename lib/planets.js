/**
 * Surface gravity presets and scene palettes for labs that expose g.
 * Planet identity is chosen by the student (chips), not inferred from g,
 * because Mercury and Mars round to the same slider step.
 */

export const CUSTOM_SCENE = Object.freeze({
  id: "custom",
  name: null,
  skyTop: "#5c6773",
  skyBottom: "#d5d9de",
  ground: "#7b8490",
  groundDark: "#585f69",
  soil: "#3f454d",
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

export function sceneForGravity({ planetId, backgroundsOn = true } = {}) {
  if (!backgroundsOn) return CUSTOM_SCENE;
  const planet = planetById(planetId);
  if (!planet) return CUSTOM_SCENE;
  return planet;
}
