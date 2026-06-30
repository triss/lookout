// STAGE 4 helpers — derive. Pure aggregation building blocks that uses compose
// in deriveFindings() to turn observations into shareable findings. No CV here,
// no I/O — just numbers in, numbers out, so they're trivially testable.

// Round to 1 decimal, passing null through (mean/percentile return null empty).
export function round1(x) {
  return x == null ? null : Math.round(x * 10) / 10;
}

export function mean(xs) {
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function median(xs) {
  return percentile(xs, 50);
}

// Linear-interpolated percentile (p in 0..100). null for empty input.
export function percentile(xs, p) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  if (s.length === 1) return s[0];
  const rank = (p / 100) * (s.length - 1);
  const lo = Math.floor(rank), hi = Math.ceil(rank);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (rank - lo);
}

// Count occurrences of each value of `key` across observations.
export function tally(observations, key) {
  const out = {};
  for (const o of observations) {
    const v = o[key];
    if (v == null) continue;
    out[v] = (out[v] || 0) + 1;
  }
  return out;
}

// Events per hour, from the timestamp span of the observations (ms epoch `t`).
export function flowPerHour(observations) {
  if (observations.length < 2) return 0;
  const ts = observations.map((o) => o.t).filter((t) => typeof t === "number");
  if (ts.length < 2) return 0;
  const spanMs = Math.max(...ts) - Math.min(...ts);
  if (spanMs <= 0) return 0;
  return (observations.length / spanMs) * 3600000;
}

// Histogram of observation counts by hour-of-day (0..23) from `t`.
export function byHour(observations) {
  const out = {};
  for (const o of observations) {
    if (typeof o.t !== "number") continue;
    const h = new Date(o.t).getHours();
    out[h] = (out[h] || 0) + 1;
  }
  return out;
}

// Cluster timestamps into visits: a new visit starts after a gap > gapMs.
// Returns [{ start, end, durationS, samples }]. Basis for dwell findings.
export function sessionize(observations, gapMs = 3000) {
  const ts = observations
    .map((o) => o.t)
    .filter((t) => typeof t === "number")
    .sort((a, b) => a - b);
  if (!ts.length) return [];
  const visits = [];
  let start = ts[0], prev = ts[0], samples = 1;
  for (let i = 1; i < ts.length; i++) {
    if (ts[i] - prev > gapMs) {
      visits.push({ start, end: prev, durationS: (prev - start) / 1000, samples });
      start = ts[i]; samples = 1;
    } else {
      samples++;
    }
    prev = ts[i];
  }
  visits.push({ start, end: prev, durationS: (prev - start) / 1000, samples });
  return visits;
}
