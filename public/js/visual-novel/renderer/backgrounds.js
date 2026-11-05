/** Named demonstration backgrounds. CSS paints the layers from data-bg. */
export const BACKGROUNDS = Object.freeze([
  "facility-exterior",
  "facility-interior",
  "control-room",
  "testing-area",
  "simulation-focus",
  "closing",
]);

export function backgroundMarkup(id = BACKGROUNDS[0]) {
  const bg = BACKGROUNDS.includes(id) ? id : BACKGROUNDS[0];
  return `
    <div class="vn-background" data-vn-bg data-bg="${bg}">
      <div class="vn-bg-sky" aria-hidden="true"></div>
      <div class="vn-bg-mid" aria-hidden="true"></div>
      <div class="vn-bg-fore" aria-hidden="true"></div>
    </div>`;
}
