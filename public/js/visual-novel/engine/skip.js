export function nextCheckpointId(story, fromSceneId) {
  let id = story?.scenes?.[fromSceneId]?.next || null;
  const seen = new Set();
  while (id && story.scenes[id] && !seen.has(id)) {
    seen.add(id);
    if (story.scenes[id].checkpoint) return id;
    id = story.scenes[id].next || null;
  }
  return null;
}
