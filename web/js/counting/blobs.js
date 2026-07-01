// Connected-component blob extraction from a binary motion mask.
// Pure, no DOM. 4-connected flood fill on a downscaled mask (kept small so it
// stays cheap on old phones). Returns blobs with centroid, area, and bbox.

export function extractBlobs(mask, w, h, minArea = 1) {
  const seen = new Uint8Array(w * h);
  const stack = [];
  const blobs = [];

  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;

    let area = 0, sumX = 0, sumY = 0;
    let minX = w, minY = h, maxX = 0, maxY = 0;
    stack.push(start);
    seen[start] = 1;

    while (stack.length) {
      const idx = stack.pop();
      const x = idx % w, y = (idx / w) | 0;
      area++; sumX += x; sumY += y;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;

      if (x > 0)     { const n = idx - 1; if (mask[n] && !seen[n]) { seen[n] = 1; stack.push(n); } }
      if (x < w - 1) { const n = idx + 1; if (mask[n] && !seen[n]) { seen[n] = 1; stack.push(n); } }
      if (y > 0)     { const n = idx - w; if (mask[n] && !seen[n]) { seen[n] = 1; stack.push(n); } }
      if (y < h - 1) { const n = idx + w; if (mask[n] && !seen[n]) { seen[n] = 1; stack.push(n); } }
    }

    if (area >= minArea) {
      blobs.push({
        cx: sumX / area, cy: sumY / area, area,
        minX, minY, maxX, maxY,
        w: maxX - minX + 1, h: maxY - minY + 1,
      });
    }
  }
  return blobs;
}
