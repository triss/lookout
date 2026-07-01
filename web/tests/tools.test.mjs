// Headless tests for the shared tool decision logic (security camera + clips).
// Run:  node web/tests/tools.test.mjs
import { pickMotionEvent } from "../js/tools/motion-trigger.js";
import { clipEventAction, shouldFinalizeClip } from "../js/tools/clip-series.js";

let pass = 0, fail = 0;
const ok = (name, cond, info) => { console.log((cond ? "PASS " : "FAIL ") + name + (info ? "  " + info : "")); cond ? pass++ : fail++; };

// track helper: existed [firstT..lastT], seen `frames` times
const trk = (id, firstT, lastT, frames) => ({ id, firstT, lastT, framesSeen: frames });
const OPTS = { minDurationMs: 1000, cooldownMs: 5000, lastEventT: 0, now: 10000 };

// pickMotionEvent
ok("pick: none when no tracks", pickMotionEvent([], OPTS) === null);
ok("pick: skips too-short tracks",
  pickMotionEvent([trk(1, 9500, 10000, 5)], OPTS) === null, "dur 500 < 1000");
ok("pick: qualifies at exact min duration",
  pickMotionEvent([trk(1, 9000, 10000, 5)], OPTS)?.id === 1, "dur 1000 == min");
ok("pick: chooses most frames among qualifying",
  pickMotionEvent([trk(1, 8000, 10000, 4), trk(2, 8000, 10000, 9)], OPTS)?.id === 2);
ok("pick: null inside cooldown",
  pickMotionEvent([trk(1, 0, 10000, 20)], { ...OPTS, lastEventT: 6000 }) === null, "now-last=4000<5000");
ok("pick: fires at exact cooldown boundary",
  pickMotionEvent([trk(1, 0, 10000, 20)], { ...OPTS, lastEventT: 5000 })?.id === 1, "now-last=5000");

// clipEventAction
ok("clip: start when no active clip", clipEventAction(null, 1000, { seriesGapMs: 8000 }) === "start");
ok("clip: append within gap",
  clipEventAction({ lastEventT: 1000 }, 5000, { seriesGapMs: 8000 }) === "append");
ok("clip: append at exact gap boundary",
  clipEventAction({ lastEventT: 1000 }, 9000, { seriesGapMs: 8000 }) === "append", "diff 8000 == gap");
ok("clip: rotate beyond gap",
  clipEventAction({ lastEventT: 1000 }, 9001, { seriesGapMs: 8000 }) === "rotate");

// shouldFinalizeClip
ok("finalize: false when no clip", shouldFinalizeClip(null, 9999, { postRollMs: 3000, seriesGapMs: 8000 }) === false);
ok("finalize: true once quiet >= max(post, gap)",
  shouldFinalizeClip({ lastEventT: 1000 }, 9000, { postRollMs: 3000, seriesGapMs: 8000 }) === true, "quiet 8000 == max");
ok("finalize: false while still within window",
  shouldFinalizeClip({ lastEventT: 1000 }, 8999, { postRollMs: 3000, seriesGapMs: 8000 }) === false);
ok("finalize: uses postRoll when it is larger",
  shouldFinalizeClip({ lastEventT: 0 }, 10000, { postRollMs: 10000, seriesGapMs: 3000 }) === true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
