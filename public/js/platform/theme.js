const STORAGE_KEY = "ap1-theme";

export const THEMES = [
  { id: "beige", label: "Beige" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "contrast", label: "High contrast" },
];

const IDS = new Set(THEMES.map((theme) => theme.id));

export function normalizeTheme(id) {
  return IDS.has(id) ? id : "beige";
}

export function currentTheme() {
  try {
    return normalizeTheme(localStorage.getItem(STORAGE_KEY));
  } catch {
    return "beige";
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
  };
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
