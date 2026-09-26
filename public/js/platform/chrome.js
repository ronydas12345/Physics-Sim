import { modules } from "./curriculum.js";

export function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

export function navLink(href, label, pathname) {
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return `<a href="${href}" data-link class="${active ? "is-active" : ""}">${label}</a>`;
}

export function renderHeader(pathname = currentPath()) {
  return `
    <header class="site-header">
      <div class="site-header-inner">
        <a href="/" data-link class="site-mark">
          <span class="kicker">AP Physics 1</span>
          <strong>Simulation Platform</strong>
        </a>
        <nav class="site-nav" aria-label="Primary">
          ${navLink("/", "Home", pathname)}
          ${navLink("/simulations", "Simulations", pathname)}
          ${navLink("/simulations/module-1", "Module 1", pathname)}
          ${navLink("/about", "Help", pathname)}
        </nav>
      </div>
    </header>
  `;
}

export function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="site-footer-inner">
        <p>AP Physics 1 Simulation Platform</p>
        <nav aria-label="Footer">
          <a href="/simulations" data-link>Simulations</a>
          <a href="/simulations/module-1" data-link>Modules</a>
          <a href="/about" data-link>Help / About</a>
          <a href="https://github.com/ronydas12345/Physics-Sim" rel="noreferrer">GitHub</a>
        </nav>
      </div>
    </footer>
  `;
}

export function statusBadge(status, extra = "") {
  const map = {
    available: "Available",
    "in-development": "In Development",
    planned: "Planned",
    "coming-soon": "Coming Soon",
  };
  return `<span class="badge badge-${status}">${extra || map[status] || "Planned"}</span>`;
}

export function moduleCards(options = {}) {
  const { comingSoon = true } = options;
  return modules
    .map((mod) => {
      const ready = mod.simulations.filter((s) => s.status === "available").length;
      const open = ready > 0;
      const href = open ? mod.path : "#";
      return `
        <${open ? `a href="${href}" data-link` : "div"} class="module-card ${open ? "" : "is-disabled"}">
          <p class="kicker">Module ${mod.id}</p>
          <h3>${mod.title}</h3>
          <p>${mod.description}</p>
          <p class="module-meta">${mod.simulations.length} simulations${ready ? ` · ${ready} available` : ""}</p>
          <div class="progress-track" aria-hidden="true"><span style="width:${Math.round((ready / mod.simulations.length) * 100)}%"></span></div>
          <span class="card-cta">${open ? "Explore →" : comingSoon ? "Coming Soon" : "Planned"}</span>
        </${open ? "a" : "div"}>
      `;
    })
    .join("");
}

export function mountChrome(rootHeader, rootFooter, pathname = currentPath()) {
  if (rootHeader) rootHeader.innerHTML = renderHeader(pathname);
  if (rootFooter) rootFooter.innerHTML = renderFooter();
}
