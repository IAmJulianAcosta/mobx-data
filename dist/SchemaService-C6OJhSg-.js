import "reflect-metadata";
import { singleton as p } from "tsyringe";
import { a as u, R as d, A as m } from "./types-CC2fG3FP.js";
var y = Object.getOwnPropertyDescriptor, g = (e, t, n, i) => {
  for (var o = i > 1 ? void 0 : i ? y(t, n) : t, r = e.length - 1, s; r >= 0; r--)
    (s = e[r]) && (o = s(o) || o);
  return o;
};
function l(e, t) {
  const n = [];
  let i = e;
  for (; i && i !== Object.prototype; )
    n.push(i), i = Object.getPrototypeOf(i);
  const o = /* @__PURE__ */ new Map();
  for (const r of n.reverse()) {
    const s = Reflect.getOwnMetadata(t, r);
    if (s)
      for (const [c, a] of s)
        o.set(c, a);
  }
  return o;
}
let h = class {
  constructor() {
    this.entries = /* @__PURE__ */ new Map();
  }
  /**
   * Registers a model class under `modelName`.
   *
   * Walks the prototype chain at registration time so lookups are O(1).
   * Calling this a second time for the same `modelName` replaces the entry.
   */
  registerModel(e, t) {
    const n = l(
      t.prototype,
      m
    ), i = l(
      t.prototype,
      d
    ), o = { modelClass: t, attributes: n, relationships: i }, r = Reflect.getOwnMetadata(u, t);
    r != null && r.abstract && (o.abstract = !0), r != null && r.discriminator && (o.discriminator = {
      key: r.discriminator.key ?? "type",
      map: r.discriminator.map
    }), r != null && r.clientGeneratedIds && (o.clientGeneratedIds = !0), this.entries.set(e, o), this.linkPolymorphicChild(e, t);
  }
  /**
   * After registering a model, checks whether any already-registered
   * polymorphic parent lists this model in its discriminator map and, if so,
   * stores the `polymorphicRoot` back-link.
   */
  linkPolymorphicChild(e, t) {
    for (const [n, i] of this.entries)
      if (!(!i.discriminator || n === e)) {
        for (const o of Object.values(i.discriminator.map))
          if (o() === t) {
            const r = this.entries.get(e);
            r && (r.polymorphicRoot = n);
            return;
          }
      }
  }
  /**
   * Returns the constructor for the given `modelName`.
   * @throws if the model has not been registered.
   */
  modelFor(e) {
    const t = this.entries.get(e);
    if (!t)
      throw new Error(`No model registered for type "${e}"`);
    return t.modelClass;
  }
  /** Returns all registered model names. */
  registeredNames() {
    return Array.from(this.entries.keys());
  }
  /** Returns `true` when a model class has been registered for `modelName`. */
  doesTypeExist(e) {
    return this.entries.has(e);
  }
  /**
   * Returns the merged attribute definitions for `modelName`.
   * @throws if the model has not been registered.
   */
  attributesDefinitionFor(e) {
    const t = this.entries.get(e);
    if (!t)
      throw new Error(`No model registered for type "${e}"`);
    return t.attributes;
  }
  /**
   * Returns the merged relationship definitions for `modelName`.
   * @throws if the model has not been registered.
   */
  relationshipsDefinitionFor(e) {
    const t = this.entries.get(e);
    if (!t)
      throw new Error(`No model registered for type "${e}"`);
    return t.relationships;
  }
  /**
   * Iterates over every attribute definition for `modelName`, invoking
   * `callback` with the attribute name and its `AttributeDef`.
   */
  eachAttribute(e, t) {
    const n = this.attributesDefinitionFor(e);
    for (const [i, o] of n)
      t(i, o);
  }
  /**
   * Iterates over every relationship definition for `modelName`, invoking
   * `callback` with the relationship name and its `RelationshipDef`.
   */
  eachRelationship(e, t) {
    const n = this.relationshipsDefinitionFor(e);
    for (const [i, o] of n)
      t(i, o);
  }
  /**
   * Returns the discriminator definition for `modelName`, or `undefined`
   * when the model is not polymorphic.
   */
  discriminatorFor(e) {
    var t;
    return (t = this.entries.get(e)) == null ? void 0 : t.discriminator;
  }
  /**
   * Returns the polymorphic root model name for a concrete child, or `null`
   * when `modelName` is not part of a polymorphic hierarchy.
   */
  polymorphicRootFor(e) {
    var t;
    return ((t = this.entries.get(e)) == null ? void 0 : t.polymorphicRoot) ?? null;
  }
  /**
   * Returns `true` when `modelName` is declared abstract.
   */
  isAbstract(e) {
    var t;
    return ((t = this.entries.get(e)) == null ? void 0 : t.abstract) === !0;
  }
  /** Returns `true` when the model uses client-generated ids. */
  hasClientGeneratedIds(e) {
    var t;
    return ((t = this.entries.get(e)) == null ? void 0 : t.clientGeneratedIds) === !0;
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
  resolveConcreteModel(e, t) {
    const n = this.entries.get(e);
    if (!(n != null && n.discriminator))
      return null;
    const { key: i, map: o } = n.discriminator, r = t[i];
    if (r == null)
      throw new Error(
        `Missing discriminator key "${i}" in payload for polymorphic model "${e}".`
      );
    const s = String(r), c = o[s];
    if (!c) {
      const f = Object.keys(o).join(", ");
      throw new Error(
        `Unknown discriminator value "${s}" for model "${e}" (key: "${i}"). Known values: ${f}.`
      );
    }
    const a = c();
    return { modelName: a.modelName ?? s, modelClass: a };
  }
};
h = g([
  p()
], h);
export {
  h as S
};
//# sourceMappingURL=SchemaService-C6OJhSg-.js.map
