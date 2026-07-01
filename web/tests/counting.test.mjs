// Headless tests for the counting MVP's pure logic (no DOM, no camera).
// Run:  node web/tests/counting.test.mjs
import { sideOf, crossingDirection, countsForMode } from "../js/counting/crossing.js";
import { extractBlobs } from "../js/counting/blobs.js";
import { createMultiTracker } from "../js/counting/tracker.js";

let pass = 0, fail = 0;
const ok = (name, cond, info) => { console.log((cond ? "PASS " : "FAIL ") + name + (info ? "  " + info : "")); cond ? pass++ : fail++; };
const eq = (name, got, want) => ok(name, JSON.stringify(got) === JSON.stringify(want), `got=${JSON.stringify(got)}`);

const A = { x: 0, y: 0 }, B = { x: 10, y: 0 };

// crossing geometry
eq("sideOf A-side (+)", sideOf(A, B, { x: 5, y: 5 }), 1);
eq("sideOf B-side (-)", sideOf(A, B, { x: 5, y: -5 }), -1);
eq("A→B crossing", crossingDirection({ x: 5, y: 5 }, { x: 5, y: -5 }, A, B), "A_to_B");
eq("B→A crossing", crossingDirection({ x: 5, y: -5 }, { x: 5, y: 5 }, A, B), "B_to_A");
eq("no crossing past the end", crossingDirection({ x: 15, y: 5 }, { x: 15, y: -5 }, A, B), null);
eq("no crossing (same side)", crossingDirection({ x: 5, y: 5 }, { x: 6, y: 4 }, A, B), null);
ok("mode a_to_b keeps A_to_B", countsForMode("A_to_B", "a_to_b") === true);
ok("mode a_to_b drops B_to_A", countsForMode("B_to_A", "a_to_b") === false);
ok("mode both keeps all", countsForMode("B_to_A", "both") === true);

// blob extraction: a 2x2 block (top-left) and a lone cell (bottom-right)
const W = 5, H = 5;
const mask = new Uint8Array(W * H);
mask[0] = mask[1] = mask[W] = mask[W + 1] = 1; // 2x2 at (0,0)
mask[W * H - 1] = 1;                            // lone cell at (4,4)
const blobs = extractBlobs(mask, W, H, 1);
ok("blobs: 2 components", blobs.length === 2, JSON.stringify(blobs.map((b) => b.area)));
ok("blobs: 2x2 centroid", blobs.some((b) => b.area === 4 && b.cx === 0.5 && b.cy === 0.5));
ok("blobs: minArea filters lone cell", extractBlobs(mask, W, H, 2).length === 1);

// tracker: continuity, new track, expiry
const tk = createMultiTracker({ maxDist: 48, maxLost: 5 });
tk.update([{ cx: 10, cy: 10, area: 5 }], 0);
let t = tk.update([{ cx: 12, cy: 10, area: 5 }], 33);
ok("tracker: same track continues", t.length === 1 && t[0].framesSeen === 2 && t[0].prevCx === 10);
t = tk.update([{ cx: 12, cy: 10, area: 5 }, { cx: 200, cy: 200, area: 5 }], 66);
ok("tracker: far blob → new track", t.length === 2);
for (let i = 0; i < 6; i++) t = tk.update([], 100 + i * 33); // no blobs → all expire
ok("tracker: lost tracks expire", t.length === 0);

// Integration: a blob crossing a vertical line, through the real chain
// (extractBlobs → tracker → crossingDirection) exactly as app.js wires it.
{
  const line = { a: { x: 0.5, y: 0 }, b: { x: 0.5, y: 1 } }; // A = left, B = right
  const tk = createMultiTracker({ maxDist: 9999, maxLost: 5 });
  const IW = 40, IH = 20;
  const frame = (cx) => {
    const m = new Uint8Array(IW * IH);
    for (let y = 7; y < 13; y++) for (let x = cx - 3; x < cx + 3; x++) if (x >= 0 && x < IW) m[y * IW + x] = 1;
    return m;
  };
  const counts = [];
  let tt = 0;
  for (const cx of [8, 14, 26, 32]) { // left → right across x=20 (0.5*40)
    const tracks = tk.update(extractBlobs(frame(cx), IW, IH, 3), (tt += 100));
    for (const tr of tracks) {
      if (!tr.moved) continue;
      const prev = { x: tr.prevCx / IW, y: tr.prevCy / IH };
      const cur = { x: tr.cx / IW, y: tr.cy / IH };
      const dir = crossingDirection(prev, cur, line.a, line.b);
      if (dir && tt - tr.lastCountT >= 0) { tr.lastCountT = tt; counts.push(dir); }
    }
  }
  ok("integration: exactly one A→B crossing", counts.length === 1 && counts[0] === "A_to_B", JSON.stringify(counts));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
