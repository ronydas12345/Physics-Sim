import { projectileRangeTutorial } from "./tutorials/projectile-motion.js";
import { platformLearningTutorials } from "./tutorials/catalog.js";

const ALL = [projectileRangeTutorial, ...platformLearningTutorials];

const BY_ID = Object.fromEntries(ALL.map((def) => [def.id, def]));
const BY_SIM = Object.fromEntries(ALL.map((def) => [def.simulationId, def]));

export function getLearningTutorial(simulationId) {
  return BY_SIM[simulationId] || null;
}

export function getLearningTutorialById(id) {
  return BY_ID[id] || null;
}

export function listLearningTutorials() {
  return ALL.slice();
}
