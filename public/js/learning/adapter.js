/**
 * Simulation adapter contract for the Learning Branch Manager.
 * Each tutorial names the controls, measurements, and events that lab can report.
 * The engine never reads simulation internals; it only observes these events.
 */

export { LAB_EVENTS, SIM_EVENT_ACTIONS, actionFromEvent, bindSimEvents, createLabBus } from "../shared/lab-events.js";

export function simulationAdapter({ simulationId, controls = [], measurements = [], events = [] } = {}) {
  if (!simulationId) throw new Error("Adapter needs a simulationId.");
  return {
    simulationId,
    controls: [...controls],
    measurements: [...measurements],
    events: [...events],
  };
}
