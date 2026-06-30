// Pixel → luma. Cheap integer approximation, no allocation beyond the result.
// Shared by every motion-mode use; the rest of the pipeline works on grayscale.
export function toGray(imageData) {
  const { data } = imageData;
  const g = new Uint8ClampedArray(data.length >> 2);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    g[j] = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
  }
  return g;
}
