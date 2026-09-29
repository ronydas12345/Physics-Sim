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

export function bindThemePicker(root) {
  const theme = applyTheme(currentTheme());
  const select = root?.querySelector("#theme-select");
  if (!select) return;
  select.value = theme;
  select.addEventListener("change", () => {
    applyTheme(select.value);
  });
}
