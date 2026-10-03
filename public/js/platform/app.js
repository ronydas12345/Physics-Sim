import { mountChrome } from "./chrome.js";
import { aboutPage, homePage, libraryPage, modulePage, notFoundPage, sim11Page, sim12Page, sim13Page, sim14Page, sim21Page, sim22Page, sim23Page, sim24Page, sim25Page } from "./pages.js";
import { fullPagePaths } from "./curriculum.js";
import { mountVectors1D } from "../simulations/vectors-1d.js";
import { mountMotion1D } from "../simulations/motion-1d.js";
import { mountRepresentingMotion } from "../simulations/representing-motion.js";
import { mountRelativeMotion } from "../simulations/relative-motion.js";
import { mountSystemsCM } from "../simulations/systems-cm.js";
import { mountForcesFbd } from "../simulations/forces-fbd.js";
import { mountThirdLaw } from "../simulations/third-law.js";
import { mountFirstLaw } from "../simulations/first-law.js";
import { mountSecondLaw } from "../simulations/second-law.js";
import { mountHeroReel } from "./hero-reel.js";

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
  if (pathname === "/simulations/module-1/1-3") return { name: "sim-1-3" };
  if (pathname === "/simulations/module-1/1-4") return { name: "sim-1-4" };
  if (pathname === "/simulations/module-2/2-1") return { name: "sim-2-1" };
  if (pathname === "/simulations/module-2/2-2") return { name: "sim-2-2" };
  if (pathname === "/simulations/module-2/2-3") return { name: "sim-2-3" };
  if (pathname === "/simulations/module-2/2-4") return { name: "sim-2-4" };
  if (pathname === "/simulations/module-2/2-5") return { name: "sim-2-5" };
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
    "sim-1-3": "1.3 Representing Motion · AP Physics 1",
    "sim-1-4": "1.4 Reference Frames and Relative Motion · AP Physics 1",
    "sim-2-1": "2.1 Systems and Center of Mass · AP Physics 1",
    "sim-2-2": "2.2 Forces and Free-Body Diagrams · AP Physics 1",
    "sim-2-3": "2.3 Newton's Third Law · AP Physics 1",
    "sim-2-4": "2.4 Newton's First Law · AP Physics 1",
    "sim-2-5": "2.5 Newton's Second Law · AP Physics 1",
    notfound: "Not found · AP Physics 1",
  };
  if (route.name === "home") {
    outlet.innerHTML = homePage();
    unmount = mountHeroReel(outlet);
  }
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
  } else if (route.name === "sim-1-3") {
    outlet.innerHTML = sim13Page();
    unmount = mountRepresentingMotion(outlet);
  } else if (route.name === "sim-1-4") {
    outlet.innerHTML = sim14Page();
    unmount = mountRelativeMotion(outlet);
  } else if (route.name === "sim-2-1") {
    outlet.innerHTML = sim21Page();
    unmount = mountSystemsCM(outlet);
  } else if (route.name === "sim-2-2") {
    outlet.innerHTML = sim22Page();
    unmount = mountForcesFbd(outlet);
  } else if (route.name === "sim-2-3") {
    outlet.innerHTML = sim23Page();
    unmount = mountThirdLaw(outlet);
  } else if (route.name === "sim-2-4") {
    outlet.innerHTML = sim24Page();
    unmount = mountFirstLaw(outlet);
  } else if (route.name === "sim-2-5") {
    outlet.innerHTML = sim25Page();
    unmount = mountSecondLaw(outlet);
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
