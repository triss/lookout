# Lookout

Lookout is a browser-first place-observation system. It uses a fixed camera view to turn changes in a place into privacy-preserving observations and findings.

## Language

**Observation**:
A durable, user-facing record about something noticed at a place. Observations are the raw material for findings.
_Avoid_: Event, detection, hit

**Detection Event**:
An internal pipeline moment where the camera notices a relevant visual difference. Detection events may feed observations, but are not the user-facing record.
_Avoid_: Observation

**Measurement**:
A value derived from one or more detection events, such as count, direction, dwell time, size, position, or speed.
_Avoid_: Metric

**Finding**:
A shareable result made from observations, usually privacy-preserving. Findings are what residents can safely send or discuss, such as counts, percentiles, visits, or change over time.
_Avoid_: Aggregate, summary

**Footage**:
Raw or clipped camera imagery from a view. Footage may exist locally, but should leave the device only through explicit user action; the default sharing unit is a finding.
_Avoid_: Data, evidence

**Place**:
The real-world location people care about, such as a school crossing, garden, shopfront, path, or road segment.
_Avoid_: View, camera, scene

**View**:
One fixed camera framing of a place, including camera pose and what is visible in the frame. A place can have many views.
_Avoid_: Place, scene

**Calibration**:
The mapping information that makes real-world measurements meaningful for one view. Calibration belongs to a view, becomes invalid if the camera framing changes, and is required for measurements with real-world units.
_Avoid_: Place calibration

**Use**:
A user-facing purpose for Lookout, such as vehicle speed, counts and footfall, dwell and occupancy, wildlife logging, or environmental change. The same term is used in code for the configuration that declares how that purpose uses the pipeline.
_Avoid_: Preset, mode
