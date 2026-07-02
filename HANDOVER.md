# Lookout handover

## Current slice

We finished a grill-with-docs pass for the four working browser Uses:

- `web/js/line-counting/app.js`
- `web/js/line-capture/app.js`
- `web/js/security-stills/app.js`
- `web/js/security-clips/app.js`

The current implementation slice is an intentionally breaking naming cleanup before extracting a shared runtime.

## Settled decisions

- Move toward a shared Use runtime, but extract small concrete helpers first.
- The runtime should own camera control, frame-loop plumbing, common state, settings binding, storage/export, and shared media viewer/share mechanics.
- Each Use should own what counts as a Detection Event, when it becomes an Observation, what Measurements are recorded, whether Footage is attached, and Use-specific overlay/copy.
- Camera-on and observing are separate states. The runtime should prevent Observation writes unless observing is active and a session id exists.
- `counting` and `capture` remain separate Uses because Footage policy is part of the privacy promise.
- `security-stills` and `security-clips` remain separate Uses for the same reason.
- `security-clips` records one Observation per completed clip series, not one Observation per internal motion Detection Event.
- Settings should be grouped as Use-specific, Camera, Storage, then General app settings.
- Common setting controls can have per-Use saved values and defaults. `processingWidth` is common UI/control machinery but should be per-Use data.
- The app should stay plain DOM/canvas/video with small ES modules, not a frontend framework.

## Naming cleanup applied

Canonical IDs and pages are hyphenated:

- `line-counting.html`, Use id `line-counting`
- `line-capture.html`, Use id `line-capture`
- `security-stills.html`, Use id `security-stills`
- `security-clips.html`, Use id `security-clips`

Public display names:

- Line crossings, observations only
- Line crossings with stills
- Security Camera with stills
- Security Camera with clips

Old working pages were deleted, not redirected:

- `counting.html`
- `capture.html`
- `security.html`

No IndexedDB migration is needed for old local observations. Old observations may remain locally but new exports use the new Use IDs.

## Module naming cleanup

App paths now match Use IDs:

- `web/js/counting/app.js` -> `web/js/line-counting/app.js`
- `web/js/capture/app.js` -> `web/js/line-capture/app.js`
- `web/js/security/app.js` -> `web/js/security-stills/app.js`
- `web/js/security-clips/app.js` stays

Shared primitives moved out of the old counting folder:

- `web/js/counting/blobs.js` -> `web/js/vision/blobs.js`
- `web/js/counting/tracker.js` -> `web/js/vision/tracker.js`
- `web/js/counting/crossing.js` -> `web/js/line-crossing/crossing.js`

Test rename:

- `web/tests/counting.test.mjs` -> `web/tests/vision.test.mjs` and `web/tests/line-crossing.test.mjs`

## Docs already added

- `docs/adr/0001-shared-use-runtime-boundary.md`
- `docs/adr/0002-security-clips-observation-granularity.md`
- `docs/adr/0003-planned-use-identifier-renames.md`

## Current local note

There were also local edits from the prior theme-picker cleanup in the four working Use apps and the shared camera Use CSS. Do not revert them.
