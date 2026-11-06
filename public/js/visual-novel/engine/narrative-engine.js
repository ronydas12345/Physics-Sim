/**
 * Narrative session. Choices reconverge immediately.
 * Checkpoints exist so skip can stop. Snapshot/restore keep story saves separate from settings.
 */

import { labActionKey } from "../../shared/lab-events.js";
import { VN_SAVE_VERSION, validateNarrativeSave } from "../saves/vn-saves.js";
import { nextCheckpointId } from "./skip.js";

function emptyStage(story) {
  const stage = {};
  for (const id of Object.keys(story.characters || {})) {
    stage[id] = { visible: false, position: story.characters[id].position || "center", expression: "neutral" };
  }
  return stage;
}

function applySceneCast(stage, scene) {
  if (!scene || !Array.isArray(scene.cast)) return;
  for (const id of Object.keys(stage)) {
    stage[id] = { ...stage[id], visible: scene.cast.includes(id) };
  }
}

function applyLinePresence(stage, story, spoken) {
  if (!spoken) return;
  for (const id of [].concat(spoken.exit || [])) {
    if (stage[id]) stage[id] = { ...stage[id], visible: false };
  }
  for (const id of [].concat(spoken.enter || [])) {
    const ch = story.characters?.[id];
    if (!ch) continue;
    stage[id] = {
      visible: true,
      position: spoken.position || ch.position || "center",
      expression: "neutral",
    };
  }
  if (spoken.speaker && story.characters?.[spoken.speaker]) {
    const ch = story.characters[spoken.speaker];
    const prior = stage[spoken.speaker];
    stage[spoken.speaker] = {
      visible: spoken.visible !== false,
      position: spoken.position || prior?.position || ch.position || "left",
      expression: spoken.expression || prior?.expression || "neutral",
    };
  }
}

export function createNarrativeSession(story, { bus } = {}) {
  if (!story?.start || !story.scenes?.[story.start]) {
    throw new Error("Story needs a start scene.");
  }
  let sceneId = story.start;
  let lineIndex = 0;
  let complete = false;
  let pendingReply = null;
  let lastChoiceId = null;
  let stage = emptyStage(story);
  let stagedScene = null;
  let log = [];
  const labDone = new Set();

  function awaitingChoice() {
    return Boolean(line()?.choices?.length) && !pendingReply && !lastChoiceId;
  }

  function waitingForLab() {
    if (!bus) return false;
    const need = spokenNow()?.waitFor || scene()?.waitFor;
    if (!need) return false;
    return !labDone.has(labActionKey(need));
  }

  function lastChosen() {
    if (lastChoiceId) return lastChoiceId;
    for (let i = log.length - 1; i >= 0; i -= 1) {
      if (log[i].choiceId) return log[i].choiceId;
    }
    return null;
  }

  function spokenNow() {
    return pendingReply || line();
  }

  function spokenText(spoken) {
    if (!spoken) return "";
    const variants = spoken.ifChoiceText;
    const id = lastChosen();
    if (variants && id && variants[id]) return variants[id];
    return spoken.text || "";
  }

  function record(spoken, extra = {}) {
    const text = spokenText(spoken);
    if (!text) return;
    const key = pendingReply ? `${sceneId}:reply:${lastChoiceId}` : `${sceneId}:${lineIndex}`;
    if (log.at(-1)?.key === key) return;
    const character = spoken.speaker ? story.characters?.[spoken.speaker] : null;
    log.push({
      key,
      sceneId,
      speakerId: spoken.speaker || null,
      speaker: character?.name || spoken.speaker || "",
      text,
      choiceId: extra.choiceId || lastChoiceId || null,
      choiceLabel: extra.choiceLabel || null,
    });
  }

  function scene() {
    return story.scenes[sceneId];
  }

  function line() {
    return scene()?.lines?.[lineIndex] || null;
  }

  function land() {
    if (stagedScene !== sceneId) {
      applySceneCast(stage, scene());
      stagedScene = sceneId;
    }
    applyLinePresence(stage, story, spokenNow());
    record(spokenNow());
  }

  function view() {
    const current = scene();
    const spoken = pendingReply || line();
    const character = spoken?.speaker ? story.characters?.[spoken.speaker] : null;
    const waiting = awaitingChoice();
    const checkpoint = current?.checkpoint || null;
    return {
      storyId: story.id,
      title: story.title,
      sceneId,
      background: current?.background || sceneId,
      speakerId: spoken?.speaker || null,
      speaker: character?.name || spoken?.speaker || "",
      expression: spoken?.expression || "neutral",
      text: spokenText(spoken),
      position: spoken?.position || character?.position || "center",
      lineIndex,
      lineCount: current?.lines?.length || 0,
      complete,
      nextScene: current?.next || null,
      awaitingChoice: waiting,
      choices: waiting ? line().choices : [],
      lastChoiceId,
      waitingForLab: waitingForLab(),
      waitFor: spoken?.waitFor || current?.waitFor || null,
      transition: current?.transition || "fade",
      checkpoint,
      nextCheckpoint: nextCheckpointId(story, sceneId),
      history: log.slice(),
      cast: Object.entries(stage).map(([id, state]) => ({
        id,
        name: story.characters[id]?.name || id,
        ...state,
      })),
    };
  }

  function notify(action) {
    const key = labActionKey(action);
    if (key) labDone.add(key);
    return view();
  }

  function advance() {
    if (complete) return view();
    if (waitingForLab()) return view();
    const spoken = line();
    if (spoken?.choices?.length && !pendingReply && !lastChoiceId) return view();
    if (pendingReply) {
      pendingReply = null;
      lastChoiceId = null;
    }
    const current = scene();
    const last = (current?.lines?.length || 1) - 1;
    if (lineIndex < last) {
      lineIndex += 1;
      land();
      return view();
    }
    const nextId = current?.next;
    if (nextId && story.scenes[nextId]) {
      sceneId = nextId;
      lineIndex = 0;
      land();
      return view();
    }
    complete = true;
    return view();
  }

  function choose(id) {
    const spoken = line();
    const option = spoken?.choices?.find((choice) => choice.id === id);
    if (!option || pendingReply) return view();
    lastChoiceId = id;
    pendingReply = {
      speaker: option.speaker || spoken.speaker,
      expression: option.expression || spoken.expression,
      position: option.position || spoken.position,
      text: option.reply || option.label,
    };
    land();
    if (log.at(-1)) log.at(-1).choiceLabel = option.label;
    return view();
  }

  function skipToCheckpoint() {
    if (complete || awaitingChoice() || waitingForLab()) return view();
    const target = nextCheckpointId(story, sceneId);
    if (!target) return skipAll();
    let guard = 0;
    while (!complete && !awaitingChoice() && !waitingForLab() && sceneId !== target && guard < 400) {
      advance();
      guard += 1;
    }
    return view();
  }

  function skipChoiceId() {
    const options = line()?.choices || [];
    return options.find((choice) => choice.skipDefault)?.id || options[0]?.id || null;
  }

  function skipAll() {
    if (complete) return view();
    let guard = 0;
    while (!complete && guard < 400) {
      if (waitingForLab()) break;
      if (awaitingChoice()) {
        const id = skipChoiceId();
        if (!id) break;
        choose(id);
      } else {
        advance();
      }
      guard += 1;
    }
    return view();
  }

  function snapshot() {
    return {
      version: VN_SAVE_VERSION,
      storyId: story.id,
      sceneId,
      lineIndex,
      complete,
      pendingReply,
      lastChoiceId,
      log: log.map((entry) => ({ ...entry })),
      labDone: [...labDone],
      stage: JSON.parse(JSON.stringify(stage)),
      stagedScene,
    };
  }

  function restore(raw) {
    const checked = validateNarrativeSave(story, raw);
    if (!checked.ok) return null;
    const data = checked.snapshot;
    sceneId = data.sceneId;
    lineIndex = data.lineIndex;
    complete = Boolean(data.complete);
    pendingReply = data.pendingReply || null;
    lastChoiceId = data.lastChoiceId || null;
    log = Array.isArray(data.log) ? data.log.map((entry) => ({ ...entry })) : [];
    labDone.clear();
    for (const action of data.labDone || []) labDone.add(action);
    const nextStage = emptyStage(story);
    if (data.stage && typeof data.stage === "object") {
      for (const id of Object.keys(nextStage)) {
        if (data.stage[id] && typeof data.stage[id] === "object") {
          nextStage[id] = {
            visible: Boolean(data.stage[id].visible),
            position: data.stage[id].position || nextStage[id].position,
            expression: data.stage[id].expression || "neutral",
          };
        }
      }
    }
    stage = nextStage;
    stagedScene = data.stagedScene || sceneId;
    return view();
  }

  function reset() {
    sceneId = story.start;
    lineIndex = 0;
    complete = false;
    pendingReply = null;
    lastChoiceId = null;
    stage = emptyStage(story);
    stagedScene = null;
    log = [];
    labDone.clear();
    land();
    return view();
  }

  land();
  return { view, advance, choose, reset, skipToCheckpoint, skipAll, notify, snapshot, restore };
}

export function walkStory(story, pick = (choices) => choices[0]?.id) {
  const session = createNarrativeSession(story);
  const frames = [session.view()];
  let guard = 0;
  while (!frames[frames.length - 1].complete && guard < 240) {
    const now = frames[frames.length - 1];
    if (now.awaitingChoice) session.choose(pick(now.choices));
    else session.advance();
    frames.push(session.view());
    guard += 1;
  }
  return frames;
}
