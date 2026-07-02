# Planned Use identifier renames before runtime extraction

The working browser Uses may make breaking identifier and page-name changes before the shared runtime extraction if the new names better describe the long-term domain shape. Vague or inconsistent identifiers such as `capture` and `security_clips` should not be preserved only for compatibility while the project is still early.

The canonical working Use names should be hyphenated and match their page names: `line-counting`, `line-capture`, `security-stills`, and `security-clips`. The old working Use pages should be deleted rather than kept as redirects because the project is still in solo testing. Existing local observations under old Use identifiers do not need migration; new exports should use the new identifiers.

JavaScript app paths should match the new Use names. Shared visual primitives currently under counting should move to `web/js/vision/`, while line-specific logic should move to `web/js/line-crossing/`. Naming changes should be isolated in their own commit with a clear migration note so architecture refactors do not hide data/export semantics changes.

Public display names can be friendlier than identifiers. The working Uses should be presented as "Line crossings, observations only", "Line crossings with stills", "Security Camera with stills", and "Security Camera with clips".
