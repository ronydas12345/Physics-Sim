import { mountChrome } from "./chrome.js";
import { aboutPage, homePage, libraryPage, modulePage, notFoundPage, sim11Page, sim12Page } from "./pages.js";
import { fullPagePaths } from "./curriculum.js";
import { mountVectors1D } from "../simulations/vectors-1d.js";
import { mountMotion1D } from "../simulations/motion-1d.js";

const outlet = document.getElementById("outlet");
const header = document.getElementById("site-header");
const footer = document.getElementById("site-footer");

let unmount = null;

function pathOf() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function resolve(pathname) {
  if (pathname === "/") return { name: "home" };
  if (pathname === "/simulations") return { name: "library" };
  if (pathname === "/about") return { name: "about" };
  const mod = pathname.match(/^\/simulations\/module-(\d+)$/);
  if (mod) return { name: "module", id: mod[1] };
  if (pathname === "/simulations/module-1/1-1") return { name: "sim-1-1" };
  if (pathname === "/simulations/module-1/1-2") return { name: "sim-1-2" };
  return { name: "notfound" };
}

function render() {
  if (unmount) {
    unmount();
    unmount = null;
  }
  const pathname = pathOf();
  mountChrome(header, footer, pathname);
  const route = resolve(pathname);
  const titles = {
    home: "AP Physics 1 Simulation Platform",
    library: "Simulations · AP Physics 1",
    about: "Help / About · AP Physics 1",
    "sim-1-1": "1.1 Scalars and Vectors · AP Physics 1",
    "sim-1-2": "1.2 Displacement, Velocity, and Acceleration · AP Physics 1",
    notfound: "Not found · AP Physics 1",
  };
  if (route.name === "home") outlet.innerHTML = homePage();
  else if (route.name === "library") outlet.innerHTML = libraryPage();
  else if (route.name === "module") {
    outlet.innerHTML = modulePage(route.id);
    const mod = document.querySelector(".page-head h1");
    document.title = mod ? `${mod.textContent} · AP Physics 1` : titles.library;
  } else if (route.name === "sim-1-1") {
    outlet.innerHTML = sim11Page();
    unmount = mountVectors1D(outlet);
  } else if (route.name === "sim-1-2") {
    outlet.innerHTML = sim12Page();
    unmount = mountMotion1D(outlet);
  } else outlet.innerHTML = notFoundPage();

  if (route.name !== "module") document.title = titles[route.name] || titles.home;
  window.scrollTo(0, 0);
}

const fullPages = new Set(fullPagePaths());

function shouldIntercept(anchor) {
  if (!anchor || !anchor.href) return false;
  const url = new URL(anchor.href, window.location.origin);
  if (url.origin !== window.location.origin) return false;
  if (fullPages.has(url.pathname)) return false;
  if (/\.[a-z0-9]+$/i.test(url.pathname)) return false;
  return true;
}

document.addEventListener("click", (event) => {
  const anchor = event.target.closest("a");
  if (!anchor || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (anchor.target === "_blank") return;
  if (!shouldIntercept(anchor)) return;
  const url = new URL(anchor.href, window.location.origin);
  event.preventDefault();
  if (url.pathname !== pathOf() || url.search !== window.location.search) {
    window.history.pushState({}, "", url.pathname + url.search);
    render();
  }
});

window.addEventListener("popstate", render);
render();
