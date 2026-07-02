// Headless tests for generic vision primitives (no DOM, no camera).
// Run: node web/tests/vision.test.mjs
import { extractBlobs } from "../js/vision/blobs.js";
import { createMultiTracker } from "../js/vision/tracker.js";

let pass = 0, fail = 0;
const ok = (name, cond, info) => {
  console.log((cond ? "PASS " : "FAIL ") + name + (info ? "  " + info : ""));
  cond ? pass++ : fail++;
};

// Blob extraction: a 2x2 block (top-left) and a lone cell (bottom-right).
const W = 5, H = 5;
const mask = new Uint8Array(W * H);
mask[0] = mask[1] = mask[W] = mask[W + 1] = 1;
mask[W * H - 1] = 1;
const blobs = extractBlobs(mask, W, H, 1);
ok("blobs: 2 components", blobs.length === 2, JSON.stringify(blobs.map((b) => b.area)));
ok("blobs: 2x2 centroid", blobs.some((b) => b.area === 4 && b.cx === 0.5 && b.cy === 0.5));
ok("blobs: minArea filters lone cell", extractBlobs(mask, W, H, 2).length === 1);

// Tracker: continuity, new track, expiry.
const tk = createMultiTracker({ maxDist: 48, maxLost: 5 });
tk.update([{ cx: 10, cy: 10, area: 5 }], 0);
let t = tk.update([{ cx: 12, cy: 10, area: 5 }], 33);
ok("tracker: same track continues", t.length === 1 && t[0].framesSeen === 2 && t[0].prevCx === 10);
t = tk.update([{ cx: 12, cy: 10, area: 5 }, { cx: 200, cy: 200, area: 5 }], 66);
ok("tracker: far blob creates new track", t.length === 2);
for (let i = 0; i < 6; i++) t = tk.update([], 100 + i * 33);
ok("tracker: lost tracks expire", t.length === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
