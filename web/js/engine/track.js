// STAGE 2 — track. Minimal single-identity tracker. Produces a track whose
// reference point is the GROUND-CONTACT point (bottom-centre of the bbox), not
// the centre — the same fix that removed the ~7% under-read in the Python
// speed estimator (the centre floats above the calibrated road plane).
// Real version would be multi-object (Hungarian/IoU assignment + Kalman).

export function createTracker() {
  let last = null; // previous centroid, for velocity

  return {
    reset() { last = null; },

    // update(bbox) → track { id, bbox, centroid, ground, velocity }
    update(bbox) {
      const cx = bbox.x + bbox.w / 2;
      const cy = bbox.y + bbox.h / 2;
      const velocity = last ? { x: cx - last.x, y: cy - last.y } : { x: 0, y: 0 };
      last = { x: cx, y: cy };
      return {
        id: 1,
        bbox,
        centroid: { x: cx, y: cy },
        ground: { x: cx, y: bbox.y + bbox.h }, // on the road plane
        velocity,
      };
    },
  };
}
