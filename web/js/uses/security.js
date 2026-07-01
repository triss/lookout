import { defineUse } from "../engine/use.js";
import { byHour } from "../engine/derive.js";

// Security camera: a lightweight, on-device motion log for a doorway, yard, or
// shed — not a cloud camera. Built from components: no positioning ("none"
// locate) + byHour aggregation. measure() is stubbed until a monitored-zone
// mask and arm/disarm schedule exist; the event findings are implemented.
export default defineUse({
  id: "security",
  name: "Security camera",
  description: "Watch a doorway, yard, or shed and log when something moves in a chosen zone — a lightweight, on-device motion log with optional stills, not a cloud camera.",
  mode: "motion",
  locate: "none",
  measurements: ["event", "zone", "time_of_day"],
  setup: [
    "Point the camera at the entrance or area to watch.",
    "Draw the zone that should trigger an alert.",
    "Arm it when you leave; review the on-device log later.",
  ],
  outputs: [
    "Motion-event timestamps",
    "Which zone triggered",
    "Optional still per event",
  ],

  measureStatus: "Needs a monitored-zone mask and arm/disarm schedule before it can log intrusions.",
  config: {
    "Sensing mode": "motion (frame-to-frame difference)",
    "Locate backend": "none (position not needed)",
    "Monitored zone": "not yet provided (whole frame for now)",
    "Arming": "manual only; no schedule yet",
    "Logged": "motion events by time, optional still per event",
    "Leaves device": "event log stays local; stills shared only on explicit action",
  },

  measure() {
    throw new Error("security: needs a monitored-zone mask + arm/disarm schedule — not wired yet");
  },

  deriveFindings(observations) {
    return {
      events: observations.length,
      byHour: byHour(observations),
    };
  },
});
