import { defineUse } from "../engine/use.js";

// Counting / footfall: things crossing a line or entering a zone.
export default defineUse({
  id: "count",
  name: "Counts & footfall",
  description: "Count people, cyclists or vehicles crossing a line or entering a zone, with direction and flow rate.",
  mode: "motion",
  locate: "BearingOnly",
  measurements: ["crossings", "direction", "flow_per_hour"],
  setup: [
    "Choose a crossing line or entry zone in the scene.",
    "Keep the camera fixed while counting.",
    "Optionally split totals by direction.",
  ],
  outputs: [
    "Crossing totals",
    "Direction split",
    "Estimated flow per hour",
  ],
  // TODO measure(track, ctx):  detect line/zone crossing + direction
  // TODO deriveFindings(observations): totals per direction, hourly flow
});
