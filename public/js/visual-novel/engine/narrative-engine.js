/**
 * Linear narrative engine for Stage 1.
 * Stories are plain objects so Ink or another script format can replace the data later
 * without changing the renderer or save layer.
 */

export function createNarrativeSession(story) {
  if (!story?.start || !story.scenes?.[story.start]) {
    throw new Error("Story needs a start scene.");
  }
  let sceneId = story.start;
  let lineIndex = 0;
  let complete = false;

  function scene() {
    return story.scenes[sceneId];
  }

  function line() {
    const current = scene();
    return current?.lines?.[lineIndex] || null;
  }

  function view() {
    const current = scene();
    const spoken = line();
    const character = spoken?.speaker ? story.characters?.[spoken.speaker] : null;
    return {
      storyId: story.id,
      title: story.title,
      sceneId,
      background: current?.background || sceneId,
      speakerId: spoken?.speaker || null,
      speaker: character?.name || spoken?.speaker || "",
      expression: spoken?.expression || "neutral",
      text: spoken?.text || "",
      position: spoken?.position || character?.position || "center",
      lineIndex,
      lineCount: current?.lines?.length || 0,
      complete,
      nextScene: current?.next || null,
    };
  }

  function advance() {
    if (complete) return view();
    const current = scene();
    const last = (current?.lines?.length || 1) - 1;
    if (lineIndex < last) {
      lineIndex += 1;
      return view();
    }
    const nextId = current?.next;
    if (nextId && story.scenes[nextId]) {
      sceneId = nextId;
      lineIndex = 0;
      return view();
    }
    complete = true;
    return view();
  }

  function reset() {
    sceneId = story.start;
    lineIndex = 0;
    complete = false;
    return view();
  }

  return { view, advance, reset };
}

export function walkStory(story) {
  const session = createNarrativeSession(story);
  const frames = [session.view()];
  let guard = 0;
  while (!frames[frames.length - 1].complete && guard < 200) {
    frames.push(session.advance());
    guard += 1;
  }
  return frames;
}
