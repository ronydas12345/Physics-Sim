/**
 * Placeholder sprite catalog. Dialogue never embeds image URLs;
 * the renderer asks this module for a character + expression.
 */

export const SPRITE_EXPRESSIONS = Object.freeze({
  mara: ["neutral", "thinking", "concerned", "serious", "surprised"],
  elias: ["neutral", "focused", "confused", "concerned", "amused"],
});

const FACE = {
  mara: {
    hair: "#1b2430",
    skin: "#e8c4a8",
    cloth: "#3d5a80",
    accent: "#12c4d4",
  },
  elias: {
    hair: "#4a3424",
    skin: "#d9b08c",
    cloth: "#9a3f12",
    accent: "#ff6b12",
  },
};

function faceParts(who, expression) {
  const looks = {
    mara: {
      neutral: { brows: "M18 46 H46 M54 46 H82", eyes: "M28 56 a6 6 0 1 1 0.1 0 M68 56 a6 6 0 1 1 0.1 0", mouth: "M40 78 Q50 84 60 78" },
      thinking: { brows: "M18 44 H46 M58 42 H86", eyes: "M26 56 a6 6 0 1 1 0.1 0 M70 54 a6 6 0 1 1 0.1 0", mouth: "M42 80 Q50 78 58 80" },
      concerned: { brows: "M20 42 L46 48 M54 48 L80 42", eyes: "M28 58 a5 6 0 1 1 0.1 0 M68 58 a5 6 0 1 1 0.1 0", mouth: "M42 82 Q50 76 58 82" },
      serious: { brows: "M18 48 H46 M54 48 H82", eyes: "M28 56 a5 5 0 1 1 0.1 0 M68 56 a5 5 0 1 1 0.1 0", mouth: "M40 80 H60" },
      surprised: { brows: "M18 40 H46 M54 40 H82", eyes: "M28 56 a8 8 0 1 1 0.1 0 M68 56 a8 8 0 1 1 0.1 0", mouth: "M50 82 a6 6 0 1 1 0.1 0" },
    },
    elias: {
      neutral: { brows: "M18 48 H44 M56 48 H82", eyes: "M28 58 a6 5 0 1 1 0.1 0 M68 58 a6 5 0 1 1 0.1 0", mouth: "M40 80 Q50 86 60 80" },
      focused: { brows: "M20 46 H46 M54 46 H80", eyes: "M30 58 a4 5 0 1 1 0.1 0 M70 58 a4 5 0 1 1 0.1 0", mouth: "M42 82 H58" },
      confused: { brows: "M18 50 H44 M58 42 H84", eyes: "M28 58 a6 5 0 1 1 0.1 0 M70 56 a6 6 0 1 1 0.1 0", mouth: "M44 82 Q50 78 62 84" },
      concerned: { brows: "M20 44 L46 50 M54 50 L80 44", eyes: "M28 60 a5 5 0 1 1 0.1 0 M68 60 a5 5 0 1 1 0.1 0", mouth: "M42 84 Q50 78 58 84" },
      amused: { brows: "M18 46 H44 M56 46 H82", eyes: "M28 58 a6 4 0 1 1 0.1 0 M68 58 a6 4 0 1 1 0.1 0", mouth: "M38 78 Q50 90 62 78" },
    },
  };
  const pack = looks[who]?.[expression] || looks[who].neutral;
  return `
    <path class="vn-sprite-brow" d="${pack.brows}" />
    <path class="vn-sprite-eye" d="${pack.eyes}" />
    <path class="vn-sprite-mouth" d="${pack.mouth}" />`;
}

export function spriteSvg(characterId, expression = "neutral") {
  const who = SPRITE_EXPRESSIONS[characterId] ? characterId : "mara";
  const face = FACE[who];
  const allowed = SPRITE_EXPRESSIONS[who];
  const look = allowed.includes(expression) ? expression : "neutral";
  const hair =
    who === "mara"
      ? `<path d="M18 28 C22 8 78 8 82 30 V58 C74 48 26 48 18 58 Z" fill="${face.hair}" />`
      : `<path d="M24 30 C28 12 72 12 76 32 V50 H24 Z" fill="${face.hair}" />`;
  return `
    <svg class="vn-sprite" viewBox="0 0 100 220" aria-hidden="true">
      <rect x="28" y="108" width="44" height="96" rx="12" fill="${face.cloth}" />
      <rect x="22" y="108" width="16" height="64" rx="8" fill="${face.accent}" />
      <rect x="62" y="108" width="16" height="64" rx="8" fill="${face.accent}" />
      <circle cx="50" cy="62" r="32" fill="${face.skin}" />
      ${hair}
      <g fill="none" stroke="#141414" stroke-width="3" stroke-linecap="round">${faceParts(who, look)}</g>
    </svg>`;
}

export function spriteMarkup(characterId, { expression = "neutral", position = "left", name = "" } = {}) {
  return `
    <div class="vn-actor" data-actor="${characterId}" data-slot="${position}" data-expression="${expression}" hidden>
      ${spriteSvg(characterId, expression)}
      <p class="vn-actor-name">${name}</p>
    </div>`;
}
