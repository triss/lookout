import { defineUse } from "../engine/use.js";

// Vehicle-speed use for the browser pipeline.
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
  // TODO measure(track, ctx):  ground-plane displacement ÷ time → mph
  // TODO deriveFindings(observations): count, mean, 85th-percentile speed
});
