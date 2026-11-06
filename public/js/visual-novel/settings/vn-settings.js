/**
 * VN presentation settings. Stored separately from story save slots.
 */

export const TEXT_SPEEDS = Object.freeze({
  "very-slow": 70,
  slow: 42,
  normal: 22,
  fast: 12,
  "very-fast": 6,
  instant: 0,
});

export const AUTO_DELAYS = Object.freeze({
  short: 700,
  normal: 1400,
  long: 2400,
});

export const CHECKPOINT_LABELS = Object.freeze({
  arrival: "Arrival",
  decision: "Investigation choice",
  reconvene: "Testing area",
  "chapter-end": "Chapter end",
});

const STORAGE_KEY = "ap1-vn-settings";

export function defaultVnSettings() {
  return {
    textSpeed: "normal",
    autoMode: false,
    autoDelay: "normal",
    textScale: 1,
    boxOpacity: 0.94,
    animateSprites: true,
  };
}

export function normalizeVnSettings(raw) {
  const base = defaultVnSettings();
  if (!raw || typeof raw !== "object") return base;
  if (Object.prototype.hasOwnProperty.call(TEXT_SPEEDS, raw.textSpeed)) base.textSpeed = raw.textSpeed;
  if (Object.prototype.hasOwnProperty.call(AUTO_DELAYS, raw.autoDelay)) base.autoDelay = raw.autoDelay;
  base.autoMode = Boolean(raw.autoMode);
  const scale = Number(raw.textScale);
  if (Number.isFinite(scale)) base.textScale = Math.min(1.35, Math.max(0.85, scale));
  const opacity = Number(raw.boxOpacity);
  if (Number.isFinite(opacity)) base.boxOpacity = Math.min(1, Math.max(0.7, opacity));
  if (raw.animateSprites === false) base.animateSprites = false;
  return base;
}

export function textSpeedMs(settings) {
  return TEXT_SPEEDS[settings?.textSpeed] ?? TEXT_SPEEDS.normal;
}

export function autoDelayMs(settings) {
  return AUTO_DELAYS[settings?.autoDelay] ?? AUTO_DELAYS.normal;
}

export function loadVnSettings(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(STORAGE_KEY);
    return normalizeVnSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultVnSettings();
  }
}

export function saveVnSettings(settings, storage = globalThis.localStorage) {
  const next = normalizeVnSettings(settings);
  try {
    storage?.setItem?.(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return next;
}
