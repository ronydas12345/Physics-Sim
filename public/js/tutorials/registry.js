import { tutorials as t11 } from "./sim-1-1.js";
import { tutorials as t12 } from "./sim-1-2.js";
import { tutorials as t13 } from "./sim-1-3.js";
import { tutorials as t14 } from "./sim-1-4.js";
import { tutorials as t21 } from "./sim-2-1.js";
import { tutorials as t22 } from "./sim-2-2.js";
import { tutorials as t23 } from "./sim-2-3.js";
import { tutorials as t24 } from "./sim-2-4.js";

const REGISTRY = {
  "1-1": t11,
  "1-2": t12,
  "1-3": t13,
  "1-4": t14,
  "2-1": t21,
  "2-2": t22,
  "2-3": t23,
  "2-4": t24,
};

export function getTutorials(simulationId) {
  return REGISTRY[simulationId] || null;
}

export function listedSimulationIds() {
  return Object.keys(REGISTRY);
}
