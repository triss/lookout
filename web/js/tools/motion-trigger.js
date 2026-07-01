// Shared, pure decision logic for the motion-triggered tools (security camera,
// security clips). No DOM, no state — unit-tested in web/tests/tools.test.mjs.

// Pick the track that should fire a motion event, or null if none should.
// A qualifying track has existed for at least minDurationMs; among those, the
// longest-observed (most framesSeen) wins. Returns null while still inside the
// cooldown window since the last event. The caller advances lastEventT itself.
//
// opts: { minDurationMs, cooldownMs, lastEventT, now }
export function pickMotionEvent(tracks, opts) {
  const { minDurationMs, cooldownMs, lastEventT, now } = opts;
  if (now - lastEventT < cooldownMs) return null;
  let trigger = null;
  for (const tr of tracks) {
    if (tr.lastT - tr.firstT < minDurationMs) continue;
    if (!trigger || tr.framesSeen > trigger.framesSeen) trigger = tr;
  }
  return trigger;
}
