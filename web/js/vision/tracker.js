// Multi-object tracker: greedy nearest-neighbour assignment of blobs to tracks
// across frames. Pure, no DOM. Each track keeps its previous centroid (so a
// motion segment prev→cur can be tested by a Use), how many frames it has
// been seen, and whether a Use has already recorded it.
//
// Deliberately simple: no Kalman, no Hungarian. Good enough for tracking a
// handful of movers on an old phone.

export function createMultiTracker(opts = {}) {
  const maxDist = opts.maxDist ?? 48;   // px in processing space
  const maxLost = opts.maxLost ?? 5;    // frames a track may go unmatched
  const maxDist2 = maxDist * maxDist;
  let nextId = 1;
  let tracks = [];

  return {
    tracks: () => tracks,
    reset() { tracks = []; nextId = 1; },

    // Assign blobs to tracks for time t (ms). Returns the live tracks.
    update(blobs, t) {
      const used = new Set();

      for (const tr of tracks) {
        let best = -1, bestD = maxDist2;
        for (let i = 0; i < blobs.length; i++) {
          if (used.has(i)) continue;
          const dx = blobs[i].cx - tr.cx, dy = blobs[i].cy - tr.cy;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = i; }
        }
        if (best >= 0) {
          used.add(best);
          tr.prevCx = tr.cx; tr.prevCy = tr.cy;
          tr.cx = blobs[best].cx; tr.cy = blobs[best].cy;
          tr.area = blobs[best].area;
          tr.lastT = t; tr.framesSeen++; tr.lostFrames = 0; tr.moved = true;
        } else {
          tr.lostFrames++; tr.moved = false;
        }
      }

      tracks = tracks.filter((tr) => tr.lostFrames <= maxLost);

      for (let i = 0; i < blobs.length; i++) {
        if (used.has(i)) continue;
        tracks.push({
          id: nextId++,
          cx: blobs[i].cx, cy: blobs[i].cy,
          prevCx: blobs[i].cx, prevCy: blobs[i].cy,
          area: blobs[i].area,
          firstT: t, lastT: t,
          framesSeen: 1, lostFrames: 0,
          counted: false, lastCountT: 0, moved: false,
        });
      }
      return tracks;
    },
  };
}
