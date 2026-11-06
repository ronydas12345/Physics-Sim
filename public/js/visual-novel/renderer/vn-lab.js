/**
 * Split-mode VN dock on a live lab. The simulation keeps its controls.
 * Immersive prototype stays on /vn/projectile.
 */

import { decorateActionButtons } from "../../platform/lab-kit.js";
import { mountVnScreen, vnScreenMarkup } from "./vn-screen.js";
import { projectileArrivalStory } from "../stories/projectile-motion/arrival.js";

export function bindVnLab(root, { bus, story = projectileArrivalStory } = {}) {
  if (!root?.querySelector) return () => {};

  const toolbar = root.querySelector(".sim-toolbar");
  let launch = toolbar?.querySelector(".tutorial-launch");
  if (toolbar && !launch) {
    launch = document.createElement("div");
    launch.className = "tutorial-launch";
    toolbar.prepend(launch);
  }
  let btn = launch?.querySelector("#btn-story");
  if (launch && !btn) {
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn ghost-paper";
    btn.id = "btn-story";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Story");
    btn.textContent = "Story";
    launch.append(btn);
  }

  const host = document.createElement("section");
  host.className = "vn-lab-dock";
  host.hidden = true;
  host.setAttribute("aria-label", "Visual novel chapter");
  host.innerHTML = vnScreenMarkup(story);
  const workspace = root.querySelector(".workspace") || root;
  workspace.append(host);

  let unmount = null;

  function open() {
    host.hidden = false;
    host.classList.add("is-open");
    btn?.setAttribute("aria-expanded", "true");
    if (!unmount) unmount = mountVnScreen(host, { story, bus, mode: "split" });
    decorateActionButtons(host);
  }

  function close() {
    host.hidden = true;
    host.classList.remove("is-open");
    btn?.setAttribute("aria-expanded", "false");
  }

  btn?.addEventListener("click", () => {
    if (!host.hidden) close();
    else open();
  });

  decorateActionButtons(launch || root);
  return () => {
    close();
    unmount?.();
    unmount = null;
    host.remove();
    btn?.remove();
  };
}
