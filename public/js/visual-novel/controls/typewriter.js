/**
 * Character-by-character reveal. Instant speed shows the full line immediately.
 */

export function createTypewriter() {
  let full = "";
  let startedAt = 0;
  let msPerChar = 22;
  let shown = 0;
  let snapped = false;

  function view() {
    return {
      full,
      text: full.slice(0, shown),
      complete: shown >= full.length,
      remaining: Math.max(0, full.length - shown),
    };
  }

  function start(text, speedMs, at = 0) {
    full = String(text || "");
    msPerChar = Number(speedMs) || 0;
    startedAt = at;
    snapped = msPerChar <= 0;
    shown = snapped ? full.length : 0;
    return view();
  }

  function tick(at) {
    if (snapped || msPerChar <= 0) {
      shown = full.length;
      return view();
    }
    shown = Math.min(full.length, Math.floor(Math.max(0, at - startedAt) / msPerChar));
    return view();
  }

  function complete() {
    snapped = true;
    shown = full.length;
    return view();
  }

  return { start, tick, complete, view };
}
