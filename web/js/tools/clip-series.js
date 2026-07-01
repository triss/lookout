// Shared, pure decision logic for grouping motion events into video clips
// (security clips tool). No DOM, no state — unit-tested in tools.test.mjs.
//
// A "clip" is a series of nearby motion events. A new event either starts a
// clip, extends the current one (if it arrives within seriesGapMs of the last
// event), or rotates (finalise the current clip, then start a fresh one).

// What should happen to `activeClip` when an event arrives at eventT?
// Returns "start" | "append" | "rotate".
export function clipEventAction(activeClip, eventT, opts) {
  if (!activeClip) return "start";
  if (eventT - activeClip.lastEventT <= opts.seriesGapMs) return "append";
  return "rotate";
}

// Has the current clip been quiet long enough to finalise? A clip closes once
// no event has arrived for max(postRollMs, seriesGapMs).
export function shouldFinalizeClip(activeClip, now, opts) {
  if (!activeClip) return false;
  return now - activeClip.lastEventT >= Math.max(opts.postRollMs, opts.seriesGapMs);
}
