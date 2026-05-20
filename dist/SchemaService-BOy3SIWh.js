import "reflect-metadata";
import { singleton as p } from "tsyringe";
import { a as u, R as m, A as y } from "./types-CC2fG3FP.js";
var d = Object.getOwnPropertyDescriptor, g = (r, t, n, e) => {
  for (var i = e > 1 ? void 0 : e ? d(t, n) : t, o = r.length - 1, s; o >= 0; o--)
    (s = r[o]) && (i = s(i) || i);
  return i;
};
function l(r, t) {
  const n = [];
  let e = r;
  for (; e && e !== Object.prototype; )
    n.push(e), e = Object.getPrototypeOf(e);
  const i = /* @__PURE__ */ new Map();
  for (const o of n.reverse()) {
    const s = Reflect.getOwnMetadata(t, o);
    if (s)
      for (const [c, a] of s)
        i.set(c, a);
  }
  return i;
}
let f = class {
  constructor() {
    this.entries = /* @__PURE__ */ new Map();
  }
  /**
   * Registers a model class under `modelName`.
   *
   * Walks the prototype chain at registration time so lookups are O(1).
   * Calling this a second time for the same `modelName` replaces the entry.
   */
  registerModel(r, t) {
    const n = l(
      t.prototype,
      y
    ), e = l(
      t.prototype,
      m
    ), i = { modelClass: t, attributes: n, relationships: e }, o = Reflect.getOwnMetadata(u, t);
    o != null && o.abstract && (i.abstract = !0), o != null && o.discriminator && (i.discriminator = {
      key: o.discriminator.key ?? "type",
      map: o.discriminator.map
    }), this.entries.set(r, i), this.linkPolymorphicChild(r, t);
  }
  /**
   * After registering a model, checks whether any already-registered
   * polymorphic parent lists this model in its discriminator map and, if so,
   * stores the `polymorphicRoot` back-link.
   */
  linkPolymorphicChild(r, t) {
    for (const [n, e] of this.entries)
      if (!(!e.discriminator || n === r)) {
        for (const i of Object.values(e.discriminator.map))
          if (i() === t) {
            const o = this.entries.get(r);
            o && (o.polymorphicRoot = n);
            return;
          }
      }
  }
  /**
   * Returns the constructor for the given `modelName`.
   * @throws if the model has not been registered.
   */
  modelFor(r) {
    const t = this.entries.get(r);
    if (!t)
      throw new Error(`No model registered for type "${r}"`);
    return t.modelClass;
  }
  /** Returns all registered model names. */
  registeredNames() {
    return Array.from(this.entries.keys());
  }
  /** Returns `true` when a model class has been registered for `modelName`. */
  doesTypeExist(r) {
    return this.entries.has(r);
  }
  /**
   * Returns the merged attribute definitions for `modelName`.
   * @throws if the model has not been registered.
   */
  attributesDefinitionFor(r) {
    const t = this.entries.get(r);
    if (!t)
      throw new Error(`No model registered for type "${r}"`);
    return t.attributes;
  }
  /**
   * Returns the merged relationship definitions for `modelName`.
   * @throws if the model has not been registered.
   */
  relationshipsDefinitionFor(r) {
    const t = this.entries.get(r);
    if (!t)
      throw new Error(`No model registered for type "${r}"`);
    return t.relationships;
  }
  /**
   * Iterates over every attribute definition for `modelName`, invoking
   * `callback` with the attribute name and its `AttributeDef`.
   */
  eachAttribute(r, t) {
    const n = this.attributesDefinitionFor(r);
    for (const [e, i] of n)
      t(e, i);
  }
  /**
   * Iterates over every relationship definition for `modelName`, invoking
   * `callback` with the relationship name and its `RelationshipDef`.
   */
  eachRelationship(r, t) {
    const n = this.relationshipsDefinitionFor(r);
    for (const [e, i] of n)
      t(e, i);
  }
  /**
   * Returns the discriminator definition for `modelName`, or `undefined`
   * when the model is not polymorphic.
   */
  discriminatorFor(r) {
    var t;
    return (t = this.entries.get(r)) == null ? void 0 : t.discriminator;
  }
  /**
   * Returns the polymorphic root model name for a concrete child, or `null`
   * when `modelName` is not part of a polymorphic hierarchy.
   */
  polymorphicRootFor(r) {
    var t;
    return ((t = this.entries.get(r)) == null ? void 0 : t.polymorphicRoot) ?? null;
  }
  /**
   * Returns `true` when `modelName` is declared abstract.
   */
  isAbstract(r) {
    var t;
    return ((t = this.entries.get(r)) == null ? void 0 : t.abstract) === !0;
  }
  /**
   * Resolves the concrete model class for a polymorphic parent given a raw
   * payload.  Reads the discriminator key from the payload and returns the
   * resolved model name and class.
   *
   * @throws when the discriminator key is missing from the payload.
   * @throws when the discriminator value is not in the map.
   * @returns `null` when `modelName` has no discriminator (not polymorphic).
   */
  resolveConcreteModel(r, t) {
    const n = this.entries.get(r);
    if (!(n != null && n.discriminator)) return null;
    const { key: e, map: i } = n.discriminator, o = t[e];
    if (o == null)
      throw new Error(
        `Missing discriminator key "${e}" in payload for polymorphic model "${r}".`
      );
    const s = String(o), c = i[s];
    if (!c) {
      const h = Object.keys(i).join(", ");
      throw new Error(
        `Unknown discriminator value "${s}" for model "${r}" (key: "${e}"). Known values: ${h}.`
      );
    }
    const a = c();
    return { modelName: a.modelName ?? s, modelClass: a };
  }
};
f = g([
  p()
], f);
export {
  f as S
};
//# sourceMappingURL=SchemaService-BOy3SIWh.js.map
