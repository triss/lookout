// Line-crossing geometry. Pure functions, no DOM — unit-tested headlessly.
//
// A line-crossing segment is A→B. The two sides are labelled A and B: the
// "A side" is the left of the directed segment A→B (positive orientation).
// A crossing is recorded only when a track's motion segment actually
// intersects the line segment (not merely changes side of the infinite line),
// so movement that passes beside the line's ends is not recorded as a crossing.

export function orient(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

// Which side of directed line a→b the point p is on: 1 = A side, -1 = B side.
export function sideOf(a, b, p) {
  const o = orient(a, b, p);
  return o > 0 ? 1 : o < 0 ? -1 : 0;
}

// Do segments p1p2 and p3p4 properly intersect?
export function segmentsIntersect(p1, p2, p3, p4) {
  const d1 = orient(p3, p4, p1);
  const d2 = orient(p3, p4, p2);
  const d3 = orient(p1, p2, p3);
  const d4 = orient(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
         ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// Direction of a track stepping prev→cur across line a→b, or null if it did
// not cross the segment. "A_to_B" | "B_to_A" | "unknown".
export function crossingDirection(prev, cur, a, b) {
  if (!segmentsIntersect(prev, cur, a, b)) return null;
  const s1 = sideOf(a, b, prev);
  const s2 = sideOf(a, b, cur);
  if (s1 > 0 && s2 < 0) return "A_to_B";
  if (s1 < 0 && s2 > 0) return "B_to_A";
  return "unknown";
}

// Should this crossing be recorded, given the user's direction mode?
// mode: "both" | "a_to_b" | "b_to_a" | "separate" (separate keeps everything,
// keeping the recorded direction).
export function countsForMode(direction, mode) {
  if (mode === "a_to_b") return direction === "A_to_B";
  if (mode === "b_to_a") return direction === "B_to_A";
  return true; // both / separate
}
