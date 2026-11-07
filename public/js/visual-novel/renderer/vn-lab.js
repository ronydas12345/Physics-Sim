/**
 * Story tab on 1.5. The lab and theory panels stay separate; /vn/projectile stays the fullscreen route.
 * Story and learning talk only through the lab bus.
 */

import { decorateActionButtons } from "../../platform/lab-kit.js";
import { LAB_EVENTS } from "../../shared/lab-events.js";
import { mountVnScreen, vnScreenMarkup } from "./vn-screen.js";
import { projectileArrivalStory } from "../stories/projectile-motion/arrival.js";

export function bindVnLab(root, { bus, story = projectileArrivalStory } = {}) {
  const panel = root?.querySelector?.("#panel-story");
  const tab = root?.querySelector?.("#tab-btn-story");
  if (!panel || !tab) return () => {};

  panel.innerHTML = vnScreenMarkup(story);
  let unmount = null;

  function ensure() {
    if (unmount) return;
    unmount = mountVnScreen(panel, { story, bus, mode: "tab" });
    decorateActionButtons(panel);
  }

  function returnToStory() {
    ensure();
    tab.click();
  }

  tab.addEventListener("click", ensure);
  ensure();
  const stop = bus ? [bus.on(LAB_EVENTS.STORY_RESUMES, returnToStory)] : [];

  return () => {
    stop.forEach((off) => off());
    unmount?.();
    unmount = null;
    panel.replaceChildren();
  };
}
