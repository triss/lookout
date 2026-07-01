import { defineUse } from "../engine/use.js";
import { byHour } from "../engine/derive.js";

// Drone / overflight tracking: log when a drone passes over a place, roughly
// where it is in the sky, and how often. Built from components: SkyBearing
// locate (azimuth + elevation, no range — stubbed until sky-angle setup lands)
// + byHour aggregation, which is implemented over logged overflights.
export default defineUse({
  id: "drones",
  name: "Drone tracking",
  description: "Log drone overflights over a place: when one appears, roughly where it is in the sky, and how often — useful for noise, privacy, or wildlife-disturbance records.",
  mode: "motion",
  locate: "SkyBearing",
  measurements: ["azimuth_deg", "elevation_deg", "dwell_s"],
  setup: [
    "Aim the camera at open sky over the area you care about.",
    "Expect small, fast movers; keep the lens clean and the phone steady.",
    "Log overflights on-device; share counts, not footage.",
  ],
  outputs: [
    "Overflight timestamps",
    "Rough sky position (azimuth / elevation)",
    "Passes per hour",
  ],

  measureStatus: "Needs the SkyBearing backend (azimuth + elevation, no range) before it can place a drone in the sky.",
  config: {
    "Sensing mode": "motion (frame-to-frame difference)",
    "Locate backend": "SkyBearing — azimuth + elevation, no range",
    "Sky position": "not yet provided (backend is a stub)",
    "Sensitivity": "tuned for small, fast movers against sky",
    "Logged": "overflights by hour, rough sky position",
    "Leaves device": "overflight findings only — never footage",
  },

  // Azimuth + elevation from the SkyBearing backend; it throws until sky-angle
  // setup exists. Once it returns angles, this records one overflight sample.
  measure(track, ctx, { locate }) {
    const pos = locate.locate(track, ctx); // SkyBearing: throws (stub)
    return { azimuth_deg: pos.azimuthDeg, elevation_deg: pos.elevationDeg };
  },

  deriveFindings(observations) {
    return {
      passes: observations.length,
      byHour: byHour(observations),
    };
  },
});
