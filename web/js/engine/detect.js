// STAGE 1 — detect. Frame differencing → motion energy + the bounding box of
// the changed region (a crude "mover"). Stateful: holds the previous frame.
// Real version would be MOG2 background subtraction + connected components.

const DEFAULTS = { diffThresh: 25, minPixels: 8 };

export function createMotionDetector(opts = {}) {
  const { diffThresh, minPixels } = { ...DEFAULTS, ...opts };
  let prev = null;

  return {
    reset() { prev = null; },

    // detect(gray, width) → { energy: 0..1, bbox: {x,y,w,h,pixels} | null }
    detect(gray, width) {
      if (!prev || prev.length !== gray.length) { prev = gray; return { energy: 0, bbox: null }; }
      let acc = 0, minX = 1e9, minY = 1e9, maxX = -1, maxY = -1, n = 0;
      for (let j = 0; j < gray.length; j++) {
        const d = Math.abs(gray[j] - prev[j]);
        acc += d;
        if (d > diffThresh) {
          const x = j % width, y = (j / width) | 0;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
          n++;
        }
      }
      prev = gray;
      const energy = acc / gray.length / 255;
      const bbox = (n >= minPixels && maxX >= minX)
        ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, pixels: n }
        : null;
      return { energy, bbox };
    },
  };
}
