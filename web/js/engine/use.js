// A Use configures the lookout engine for one kind of observation.
//
// Engine pipeline:  detect difference → track → (classify) → locate → derive
//
// A use declares which sensing mode and locate backend it needs, what
// measurements it derives, and how to turn observations into findings.
// These are STUBS: measure() and deriveFindings() throw until implemented.

/**
 * @typedef {Object} UseSpec
 * @property {string}   id
 * @property {string}   name
 * @property {string}   description
 * @property {"motion"|"change"} mode  fast motion events, or slow change detection
 * @property {string}   locate         locate-backend id (see README "How it works")
 * @property {string[]} measurements   fields this use derives per event
 * @property {(track:any, ctx:any)=>object} [measure]    track → measurement   [stub]
 * @property {(observations:any[])=>object} [deriveFindings] observations → shareable findings [stub]
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
