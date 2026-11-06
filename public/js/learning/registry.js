import { projectileRangeTutorial } from "./tutorials/projectile-motion.js";

const BY_ID = {
  [projectileRangeTutorial.id]: projectileRangeTutorial,
};

const BY_SIM = {
  [projectileRangeTutorial.simulationId]: projectileRangeTutorial,
};

export function getLearningTutorial(simulationId) {
  return BY_SIM[simulationId] || null;
}

export function getLearningTutorialById(id) {
  return BY_ID[id] || null;
}

export function listLearningTutorials() {
  return Object.values(BY_ID);
}
