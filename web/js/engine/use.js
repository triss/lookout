// A Use configures the lookout engine for one kind of observation.
//
// Engine pipeline:  detect difference → track → (classify) → locate → derive
//
// A use is COMPOSED from engine components: it names a locate backend (resolved
// by the pipeline and handed to measure() as deps.locate) and supplies the
// glue — measure() turns a track into a measurement, deriveFindings() turns the
// observation buffer into findings (built from engine/derive.js helpers).
// measure() may return null (a detection that yields no measurement) or throw
// (a stub / "needs calibration"); both are handled by the pipeline.

/**
 * @typedef {Object} UseSpec
 * @property {string}   id
 * @property {string}   name
 * @property {string}   description
 * @property {"motion"|"change"} mode  fast motion events, or slow change detection
 * @property {string}   locate         locate-backend id (see README "How it works")
 * @property {string[]} measurements   fields this use derives per event
 * @property {(track:any, ctx:any, deps:{locate:any})=>(object|null)} [measure]  track → measurement (null = none, throw = stub)
 * @property {(observations:any[])=>object} [deriveFindings] observations → shareable findings
 */

const registry = new Map();

function stub(label) {
  return function () { throw new Error(label + " not implemented yet (stub)"); };
}

/** Register a use (filling in stub measure/deriveFindings if absent). */
export function defineUse(spec) {
  const use = Object.assign({
    measure: stub(spec.id + ".measure()"),
    deriveFindings: stub(spec.id + ".deriveFindings()"),
  }, spec);
  registry.set(use.id, use);
  return use;
}

export function listUses() { return Array.from(registry.values()); }
export function getUse(id) { return registry.get(id); }
