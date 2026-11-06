/**
 * Learning session. Follows stage.next on the standard spine and stage.branches
 * when a condition matches. Guided actions wait for simulation events.
 */

import { emptyLearningState, validateTutorialDefinition } from "../schema.js";
import { LAB_EVENTS } from "../../shared/lab-events.js";
import { destinationFor, guidanceLabel, resolveBranch } from "./branch-resolver.js";

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
    instruction: stage?.instruction || stage?.question?.prompt || stage?.body || "",
    explanation: stage?.explanation || "",
    kindLabel: TYPE_LABELS[stage?.type] || stage?.type || "",
  };
}

function bump(map, id) {
  return { ...map, [id]: (map[id] || 0) + 1 };
}

export function createLinearTutorial(def, { state, bus, now } = {}) {
  const errorsList = validateTutorialDefinition(def);
  if (errorsList.length) throw new Error(`Invalid tutorial: ${errorsList.join("; ")}`);

  const path = linearPath(def);
  const clock = now || (() => Date.now());
  let currentId = def.start;
  let completed = [];
  let finished = false;
  let guidanceLevel = "standard";
  let attempts = {};
  let errorCounts = {};
  let hintsUsed = {};
  let flags = {};
  let visit = [def.start];
  let pending = null;
  let lastAnswer = null;
  let actions = {};

  function restore(saved) {
    if (!saved) return;
    if (saved.currentStage && def.stages[saved.currentStage]) currentId = saved.currentStage;
    if (Array.isArray(saved.completedStages)) {
      completed = saved.completedStages.filter((id) => def.stages[id]);
    }
    if (saved.guidanceLevel) guidanceLevel = saved.guidanceLevel;
    if (saved.attempts) attempts = { ...saved.attempts };
    if (saved.errors) errorCounts = { ...saved.errors };
    if (saved.hintsUsed) hintsUsed = { ...saved.hintsUsed };
    if (saved.flags) flags = { ...saved.flags };
    if (saved.actions) actions = { ...saved.actions };
    finished = Boolean(saved.complete) && !def.stages[currentId]?.next;
    visit = path.includes(currentId) ? path.slice(0, path.indexOf(currentId) + 1) : [def.start, currentId];
  }

  restore(state);

  function markDone(id) {
    if (id && !completed.includes(id)) completed = [...completed, id];
  }

  function indexOf(id) {
    const index = path.indexOf(id);
    if (index >= 0) return index;
    for (let i = visit.length - 1; i >= 0; i -= 1) {
      const spine = path.indexOf(visit[i]);
      if (spine >= 0) return spine;
    }
    return 0;
  }

  function context() {
    const stage = def.stages[currentId];
    const answered = lastAnswer?.stageId === currentId;
    return {
      pending,
      answered,
      correct: Boolean(answered && lastAnswer.correct),
      misconception: Boolean(answered && lastAnswer.misconception),
      attempts: attempts[currentId] || 0,
      errors: errorCounts[currentId] || 0,
      hinted: (hintsUsed[currentId] || 0) > 0,
      incomplete: Boolean(stage?.requiredAction && !actions[currentId]),
    };
  }

  function questionView(stage) {
    if (stage.type !== "conceptual-question" || !stage.question) return null;
    const selected = lastAnswer?.stageId === currentId ? lastAnswer.choiceId : null;
    const option = stage.question.options?.find((entry) => entry.id === selected);
    let feedback = "";
    if (option?.correct) feedback = stage.question.feedbackCorrect || "That matches the identity.";
    else if (option) feedback = stage.question.feedbackWrong || "Not that option. Try the relationship, not a single trial.";
    return {
      prompt: stage.question.prompt,
      options: stage.question.options || [],
      selected,
      correct: Boolean(option?.correct),
      feedback,
    };
  }

  function view() {
    const stage = def.stages[currentId];
    const copy = stageTexts(stage);
    const index = indexOf(currentId);
    const question = questionView(stage);
    const hintTotal = (stage.hints || []).length;
    const hintCount = Math.min(hintsUsed[currentId] || 0, hintTotal);
    const level = stage.guidance || guidanceLevel;
    const needsAnswer = stage.type === "conceptual-question" && !question?.selected;
    const needsAction = Boolean(stage.requiredAction) && !actions[currentId];
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
      isFirst: visit.length <= 1,
      isLast: !stage.next && !stage.branches,
      complete: finished,
      canPrev: visit.length > 1,
      canNext: !finished && !needsAnswer && !needsAction,
      needsAnswer,
      needsAction,
      requiredAction: stage.requiredAction || null,
      guidanceLevel: level,
      guidanceLabel: guidanceLabel(level),
      question,
      hints: (stage.hints || []).slice(0, hintCount),
      hintCount,
      hintTotal,
      canHint: hintCount < hintTotal,
      flags: { ...flags },
    };
  }

  function snapshot() {
    return {
      ...emptyLearningState(def.id),
      currentStage: currentId,
      completedStages: [...completed],
      guidanceLevel,
      attempts: { ...attempts },
      errors: { ...errorCounts },
      hintsUsed: { ...hintsUsed },
      flags: { ...flags },
      actions: { ...actions },
      lastSessionAt: clock(),
      complete: finished,
    };
  }

  function enter(dest, condition) {
    if (!dest || !def.stages[dest]) {
      finished = true;
      bus?.emit(LAB_EVENTS.LAB_COMPLETED, { tutorialId: def.id });
      return view();
    }
    if (dest === currentId) return view();
    markDone(currentId);
    const from = currentId;
    currentId = dest;
    pending = null;
    lastAnswer = lastAnswer?.stageId === currentId ? lastAnswer : null;
    if (def.stages[dest].guidance) guidanceLevel = def.stages[dest].guidance;
    else if (path.includes(dest)) guidanceLevel = "standard";
    visit = [...visit, dest];
    bus?.emit(LAB_EVENTS.LAB_STEP_COMPLETED, { tutorialId: def.id, stageId: from });
    if (condition && dest !== def.stages[from].next) {
      flags = { ...flags, lastBranch: condition };
      bus?.emit(LAB_EVENTS.TUTORIAL_BRANCH_CHANGED, {
        tutorialId: def.id,
        from,
        to: dest,
        condition,
        guidanceLevel,
      });
    }
    const arrived = def.stages[dest];
    if (arrived.type === "checkpoint" || arrived.type === "summary") {
      bus?.emit(LAB_EVENTS.LAB_CHECKPOINT_REACHED, { tutorialId: def.id, stageId: dest });
    }
    return view();
  }

  function observe(action) {
    const stage = def.stages[currentId];
    if (!stage?.requiredAction || action !== stage.requiredAction) return view();
    actions = { ...actions, [currentId]: action };
    flags = { ...flags, lastSimAction: action };
    if (stage.type === "guided-action") return advance();
    return view();
  }

  function advance() {
    if (finished) return view();
    const stage = def.stages[currentId];
    const ctx = context();
    if (ctx.incomplete && !ctx.hinted && !ctx.pending) return view();
    const condition = resolveBranch(stage, ctx);
    if (condition === null) return view();
    const dest = destinationFor(stage, condition);
    if (!dest) {
      markDone(currentId);
      finished = true;
      bus?.emit(LAB_EVENTS.LAB_STEP_COMPLETED, { tutorialId: def.id, stageId: currentId });
      bus?.emit(LAB_EVENTS.LAB_CHECKPOINT_REACHED, { tutorialId: def.id, stageId: currentId });
      bus?.emit(LAB_EVENTS.LAB_COMPLETED, { tutorialId: def.id });
      return view();
    }
    return enter(dest, condition);
  }

  function answer(choiceId) {
    const stage = def.stages[currentId];
    const option = stage?.question?.options?.find((entry) => entry.id === choiceId);
    if (!option) return view();
    attempts = bump(attempts, currentId);
    const correct = Boolean(option.correct);
    if (!correct) errorCounts = bump(errorCounts, currentId);
    lastAnswer = {
      stageId: currentId,
      choiceId,
      correct,
      misconception: !correct,
    };
    return view();
  }

  function requestHint() {
    const stage = def.stages[currentId];
    const total = (stage.hints || []).length;
    if (!total) return view();
    const used = hintsUsed[currentId] || 0;
    if (used < total) hintsUsed = bump(hintsUsed, currentId);
    pending = "HINT_REQUESTED";
    bus?.emit(LAB_EVENTS.TUTORIAL_HINT_REQUESTED, { tutorialId: def.id, stageId: currentId });
    return view();
  }

  function back() {
    if (visit.length <= 1) return view();
    visit = visit.slice(0, -1);
    currentId = visit[visit.length - 1];
    finished = false;
    pending = null;
    lastAnswer = lastAnswer?.stageId === currentId ? lastAnswer : null;
    if (def.stages[currentId].guidance) guidanceLevel = def.stages[currentId].guidance;
    else if (path.includes(currentId)) guidanceLevel = "standard";
    return view();
  }

  function go(id) {
    if (!id || !def.stages[id]) return view();
    finished = false;
    pending = null;
    currentId = id;
    visit = [...visit, id];
    lastAnswer = lastAnswer?.stageId === currentId ? lastAnswer : null;
    return view();
  }

  function restart() {
    currentId = def.start;
    completed = [];
    finished = false;
    guidanceLevel = "standard";
    attempts = {};
    errorCounts = {};
    hintsUsed = {};
    flags = {};
    visit = [def.start];
    pending = null;
    lastAnswer = null;
    actions = {};
    return view();
  }

  return { view, snapshot, advance, back, go, restart, answer, requestHint, observe, path };
}

export function walkLinear(def) {
  const session = createLinearTutorial(def);
  const frames = [session.view()];
  let guard = 0;
  while (!session.view().complete && guard < 40) {
    const now = session.view();
    if (now.needsAnswer) {
      const choice = now.question?.options?.find((option) => option.correct);
      if (choice) session.answer(choice.id);
    }
    if (now.needsAction) frames.push(session.observe(now.requiredAction));
    else frames.push(session.advance());
    guard += 1;
  }
  return frames;
}
