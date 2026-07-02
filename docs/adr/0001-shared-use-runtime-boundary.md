# Shared Use runtime boundary

The four working browser Uses should move toward a shared runtime that owns camera control, frame-loop plumbing, settings binding, storage, export, common app state, and media viewing/sharing mechanics. Each Use should continue to own the meaning of its observations: which detection events matter, when they become observations, which measurements are recorded, whether footage is attached, and what Use-specific overlay or copy appears.

The runtime should be driven by small Use definitions with callbacks for detection, observation recording, and overlay drawing. Common state should live in the runtime, while each Use gets a Use-specific state pocket for concepts like line placement, crossing flashes, motion totals, or active clip series. This keeps common browser machinery in one place without hiding the community-facing purpose of each Use behind a generic abstraction.

Camera-on and observing should remain separate runtime states. A live camera means a view is visible and frames are available; observing means durable observations may be written. The runtime should enforce that no observation is stored unless observing is active and a session id exists.

Common setting controls can still have per-Use values and defaults. In particular, processing width should be presented as the same camera/processing control across these Uses, but each Use should keep its own default and saved value because the right trade-off between detail, battery, and processing cost differs by Use.
