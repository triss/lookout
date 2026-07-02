// Headless tests for line-crossing geometry and integration.
// Run: node web/tests/line-crossing.test.mjs
import { sideOf, crossingDirection, countsForMode } from "../js/line-crossing/crossing.js";
import { extractBlobs } from "../js/vision/blobs.js";
import { createMultiTracker } from "../js/vision/tracker.js";

let pass = 0, fail = 0;
const ok = (name, cond, info) => {
  console.log((cond ? "PASS " : "FAIL ") + name + (info ? "  " + info : ""));
  cond ? pass++ : fail++;
};
const eq = (name, got, want) => ok(name, JSON.stringify(got) === JSON.stringify(want), `got=${JSON.stringify(got)}`);

const A = { x: 0, y: 0 }, B = { x: 10, y: 0 };

eq("sideOf A-side (+)", sideOf(A, B, { x: 5, y: 5 }), 1);
eq("sideOf B-side (-)", sideOf(A, B, { x: 5, y: -5 }), -1);
eq("A to B crossing", crossingDirection({ x: 5, y: 5 }, { x: 5, y: -5 }, A, B), "A_to_B");
eq("B to A crossing", crossingDirection({ x: 5, y: -5 }, { x: 5, y: 5 }, A, B), "B_to_A");
eq("no crossing past the end", crossingDirection({ x: 15, y: 5 }, { x: 15, y: -5 }, A, B), null);
eq("no crossing on same side", crossingDirection({ x: 5, y: 5 }, { x: 6, y: 4 }, A, B), null);
ok("mode a_to_b keeps A_to_B", countsForMode("A_to_B", "a_to_b") === true);
ok("mode a_to_b drops B_to_A", countsForMode("B_to_A", "a_to_b") === false);
ok("mode both keeps all", countsForMode("B_to_A", "both") === true);

{
  const line = { a: { x: 0.5, y: 0 }, b: { x: 0.5, y: 1 } };
  const tk = createMultiTracker({ maxDist: 9999, maxLost: 5 });
  const IW = 40, IH = 20;
  const frame = (cx) => {
    const m = new Uint8Array(IW * IH);
    for (let y = 7; y < 13; y++) {
      for (let x = cx - 3; x < cx + 3; x++) {
        if (x >= 0 && x < IW) m[y * IW + x] = 1;
      }
    }
    return m;
  };
  const counts = [];
  let tt = 0;
  for (const cx of [8, 14, 26, 32]) {
    const tracks = tk.update(extractBlobs(frame(cx), IW, IH, 3), (tt += 100));
    for (const tr of tracks) {
      if (!tr.moved) continue;
      const prev = { x: tr.prevCx / IW, y: tr.prevCy / IH };
      const cur = { x: tr.cx / IW, y: tr.cy / IH };
      const dir = crossingDirection(prev, cur, line.a, line.b);
      if (dir && tt - tr.lastCountT >= 0) {
        tr.lastCountT = tt;
        counts.push(dir);
      }
    }
  }
  ok("integration: exactly one A_to_B crossing", counts.length === 1 && counts[0] === "A_to_B", JSON.stringify(counts));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
