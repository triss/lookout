import { defineUse } from "../engine/use.js";
import { mean, percentile, round1 } from "../engine/derive.js";

// Vehicle-speed use for the browser pipeline.
// Built from components: GroundPlaneHomography locate (needs calibration, so
// measure surfaces a "needs calibration" stub until the solver lands) + mean /
// 85th-percentile aggregation, which is fully implemented over observations.
export default defineUse({
  id: "speed",
  name: "Vehicle speed",
  description: "Estimate how fast vehicles cross a calibrated road plane.",
  mode: "motion",
  locate: "GroundPlaneHomography",
  measurements: ["speed_mph", "direction"],
  setup: [
    "Mount the camera so the road plane stays fixed.",
    "Calibrate four or more known ground points.",
    "Record findings instead of footage by default.",
  ],
  outputs: [
    "Vehicle count by direction",
    "Mean and 85th-percentile speed",
    "Speed event timestamps",
  ],

  // Ground-plane displacement ÷ Δt → mph. The locate backend throws until the
  // view is calibrated; once it returns a metric position this becomes real.
  measure(track, ctx, { locate }) {
    const pos = locate.locate(track, ctx); // GroundPlaneHomography: throws (stub)
    return {
      speed_mph: pos.speed_mph,
      direction: track.velocity.x >= 0 ? "right" : "left",
    };
  },

  deriveFindings(observations) {
    const speeds = observations.map((o) => o.speed_mph).filter((n) => typeof n === "number");
    return {
      count: speeds.length,
      mean_mph: round1(mean(speeds)),
      p85_mph: round1(percentile(speeds, 85)),
    };
  },
});
