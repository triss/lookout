# Security clips observation granularity

The security clips Use should create one durable observation for each completed clip series, not one observation for every internal motion detection event. Detection events can extend or shape a clip while it is active, but the user-facing record is the reviewable clip series with its start time, end time, measurements, and attached footage. This keeps exported observations aligned with what people can inspect and share instead of exposing noisy internal trigger moments.
