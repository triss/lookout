# Lookout

Lookout is a browser-first place-observation system. It uses a fixed camera view to turn changes in a place into privacy-preserving observations and aggregates.

## Language

**Observation**:
A durable, user-facing record or aggregate about something noticed at a place. Observations are what the project should present, store, and share.
_Avoid_: Event, detection, hit

**Detection Event**:
An internal pipeline moment where the camera notices a relevant visual difference. Detection events may feed observations, but are not the user-facing record.
_Avoid_: Observation

**Measurement**:
A value derived from one or more detection events, such as count, direction, dwell time, size, position, or speed.
_Avoid_: Metric
