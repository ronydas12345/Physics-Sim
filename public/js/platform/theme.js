const STORAGE_KEY = "ap1-theme";

export const THEMES = [
  { id: "arcade", label: "Arcade Comic" },
  { id: "arcade-dark", label: "Arcade Dark" },
  { id: "beige", label: "Beige" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "contrast", label: "High contrast" },
];

const IDS = new Set(THEMES.map((theme) => theme.id));

export function normalizeTheme(id) {
  return IDS.has(id) ? id : "arcade";
}

export function currentTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return "arcade";
    return normalizeTheme(stored);
  } catch {
    return "arcade";
  }
}

export function applyTheme(id) {
  const theme = normalizeTheme(id);
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore quota */
  }
  return theme;
}

export function themeVar(name, fallback = "") {
  if (typeof document === "undefined" || !document.documentElement) {
    return fallback;
  }
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  } catch {
    return fallback;
  }
}

export function themeCanvas() {
  return {
    fill: themeVar("--field-bg", "#ffffff"),
    ink: themeVar("--ink", "#1b2430"),
    muted: themeVar("--ink-soft", "#4d5a68"),
    line: themeVar("--line", "#d7ccb8"),
    teal: themeVar("--teal", "#12c4d4"),
    accent: themeVar("--accent", "#ff6b12"),
    ok: themeVar("--ok", "#2fbe5a"),
    check: themeVar("--check", "#9b6bff"),
    x: themeVar("--vy", "#3d5a80"),
  };
}

/** Line colors that match Theory equation chips: teal D/v, orange Δx/a/F, green W, purple K/t. */
export function plotPalette() {
  const c = themeCanvas();
  return {
    x: c.x,
    v: c.teal,
    a: c.accent,
    d: c.teal,
    dx: c.accent,
    f: c.accent,
    w: c.ok,
    k: c.check,
    t: c.check,
    m: c.ok,
    r: c.teal,
    g: c.accent,
    th: c.accent,
    identity: c.ok,
    now: c.ok,
    A: c.accent,
    B: c.teal,
    CM: c.check,
  };
}

export function plotColor(...hints) {
  const pal = plotPalette();
  const text = hints.filter(Boolean).join(" ");
  if (!text) return pal.a;
  if (/\bCM\b|center of mass|x_CM|v_CM/i.test(text)) return pal.CM;
  if (/\bA on B\b/i.test(text)) return pal.B;
  if (/\bB on A\b/i.test(text)) return pal.A;
  if (/x_B|v_B|a_B|m_B|F_B|_B\b|xB\b|vB\b|aB\b/.test(text)) return pal.B;
  if (/x_A|v_A|a_A|m_A|F_A|_A\b|xA\b|vA\b|aA\b/.test(text)) return pal.A;
  if (/fnety|f_net,y|\ba_y\b|\bay\b/i.test(text)) return pal.B;
  if (/fnetx|f_net,x/i.test(text)) return pal.A;
  const s = text.toLowerCase();
  if (/v_avg|averagevelocity|velocity|\bv[xy]\b|\bspeed\b|(^|\s)v(\s|$)/.test(s)) return pal.v;
  if (/accel|(^|\s)a([cxy])?(\s|$)|ac\b/.test(s)) return pal.a;
  if (/displacement|δx|Δx|(^|\s)dx(\s|$)/.test(s)) return pal.dx;
  if (/w_?net|w_?app|\bwork\b|(^|\s)w(\s|$)/.test(s)) return pal.w;
  if (/δk|Δk|dK|kinetic|\benergy\b|\bus\b|(^|\s)k([if])?(\s|$)/.test(s)) return pal.k;
  if (/fnet|force|\bfg\b|\bfs\b|\bfk\b|friction|f_?app|(^|\s)f(\s|$)/.test(s)) return pal.f;
  if (/distance|(^|\s)d(\s|$)|range|(^|\s)r(\s|$)/.test(s)) return pal.d;
  if (/height|(^|\s)h(\s|$)/.test(s)) return pal.k;
  if (/position|(^|\s)x(\s|$)/.test(s)) return pal.x;
  if (/theta|θ/.test(s)) return pal.th;
  if (/mass|(^|\s)m(\s|$)/.test(s)) return pal.m;
  if (/time|(^|\s)t(\s|$)/.test(s)) return pal.t;
  return pal.a;
}

export function withAlpha(color, alpha) {
  const hex = /^#?([0-9a-f]{6})$/i.exec(String(color || ""));
  if (!hex) return color;
  const n = parseInt(hex[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function bindThemePicker(root) {
  const theme = applyTheme(currentTheme());
  const select = root?.querySelector("#theme-select");
  if (!select) return;
  select.value = theme;
  select.addEventListener("change", () => {
    applyTheme(select.value);
  });
}
