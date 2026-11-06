/**
 * Linear tutorial session. Follows stage.next only. Branch conditions wait for Stage 4.
 */

import { emptyLearningState, validateTutorialDefinition } from "../schema.js";
import { LAB_EVENTS } from "../../shared/lab-events.js";

const TYPE_LABELS = {
  introduction: "Introduction",
  concept: "Concept",
  interface: "Interface",
  "guided-action": "Instruction",
  observation: "Observation",
  "conceptual-question": "Check",
  application: "Application",
  reflection: "Reflection",
  checkpoint: "Checkpoint",
  summary: "Summary",
};

export function linearPath(def) {
  const path = [];
  const seen = new Set();
  let id = def?.start;
  while (id && def.stages?.[id] && !seen.has(id)) {
    seen.add(id);
    path.push(id);
    id = def.stages[id].next || null;
  }
  return path;
}

export function stageTexts(stage) {
  return {
    instruction: stage?.instruction || stage?.body || "",
    explanation: stage?.explanation || "",
    kindLabel: TYPE_LABELS[stage?.type] || stage?.type || "",
  };
}

export function createLinearTutorial(def, { state, bus, now } = {}) {
  const errors = validateTutorialDefinition(def);
  if (errors.length) throw new Error(`Invalid tutorial: ${errors.join("; ")}`);

  const path = linearPath(def);
  const clock = now || (() => Date.now());
  let currentId = def.start;
  let completed = [];
  let finished = false;

  function restore(saved) {
    if (!saved) return;
    if (saved.currentStage && def.stages[saved.currentStage] && path.includes(saved.currentStage)) {
      currentId = saved.currentStage;
    }
    if (Array.isArray(saved.completedStages)) {
      completed = saved.completedStages.filter((id) => def.stages[id]);
    }
    finished = Boolean(saved.complete) && path[path.length - 1] === currentId;
  }

  restore(state);

  function markDone(id) {
    if (id && !completed.includes(id)) completed = [...completed, id];
  }

  function indexOf(id) {
    const index = path.indexOf(id);
    return index < 0 ? 0 : index;
  }

  function view() {
    const stage = def.stages[currentId];
    const copy = stageTexts(stage);
    const index = indexOf(currentId);
    return {
      tutorialId: def.id,
      simulationId: def.simulationId,
      title: def.title,
      stageId: currentId,
      stage,
      type: stage.type,
      kindLabel: copy.kindLabel,
      instruction: copy.instruction,
      explanation: copy.explanation,
      highlight: stage.highlight || null,
      index,
      total: path.length,
      path,
      completedStages: [...completed],
      isFirst: index === 0,
      isLast: index === path.length - 1,
      complete: finished,
      canPrev: index > 0,
      canNext: !finished,
    };
  }

  function snapshot() {
    return {
      ...emptyLearningState(def.id),
      currentStage: currentId,
      completedStages: [...completed],
      lastSessionAt: clock(),
      complete: finished,
    };
  }

  function advance() {
    if (finished) return view();
    const stage = def.stages[currentId];
    markDone(currentId);
    bus?.emit(LAB_EVENTS.LAB_STEP_COMPLETED, { tutorialId: def.id, stageId: currentId });
    if (stage.type === "checkpoint" || stage.type === "summary") {
      bus?.emit(LAB_EVENTS.LAB_CHECKPOINT_REACHED, { tutorialId: def.id, stageId: currentId });
    }
    if (!stage.next || !def.stages[stage.next]) {
      finished = true;
      bus?.emit(LAB_EVENTS.LAB_COMPLETED, { tutorialId: def.id });
      return view();
    }
    currentId = stage.next;
    return view();
  }

  function back() {
    const index = indexOf(currentId);
    if (index <= 0) return view();
    finished = false;
    currentId = path[index - 1];
    return view();
  }

  function go(id) {
    if (!id || !def.stages[id] || !path.includes(id)) return view();
    finished = false;
    currentId = id;
    return view();
  }

  function restart() {
    currentId = def.start;
    completed = [];
    finished = false;
    return view();
  }

  return { view, snapshot, advance, back, go, restart, path };
}

export function walkLinear(def) {
  const session = createLinearTutorial(def);
  const frames = [session.view()];
  while (!session.view().complete) {
    frames.push(session.advance());
  }
  return frames;
}
