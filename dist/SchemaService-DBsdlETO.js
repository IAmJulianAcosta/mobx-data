import "reflect-metadata";
import { singleton as u } from "tsyringe";
import { a as h, R as d, A as y } from "./types-CC2fG3FP.js";
var m = Object.getOwnPropertyDescriptor, w = (t, e, o, r) => {
  for (var i = r > 1 ? void 0 : r ? m(e, o) : e, n = t.length - 1, s; n >= 0; n--)
    (s = t[n]) && (i = s(i) || i);
  return i;
};
function f(t, e) {
  const o = [];
  let r = t;
  for (; r && r !== Object.prototype; )
    o.push(r), r = Object.getPrototypeOf(r);
  const i = /* @__PURE__ */ new Map();
  for (const n of o.reverse()) {
    const s = Reflect.getOwnMetadata(e, n);
    if (s)
      for (const [a, c] of s)
        i.set(a, c);
  }
  return i;
}
let l = class {
  constructor() {
    this.entries = /* @__PURE__ */ new Map(), this.metaViews = /* @__PURE__ */ new Map();
  }
  /**
   * Registers a model class under `modelName`.
   *
   * Walks the prototype chain at registration time so lookups are O(1).
   * Calling this a second time for the same `modelName` replaces the entry.
   */
  registerModel(t, e) {
    const o = f(
      e.prototype,
      y
    ), r = f(
      e.prototype,
      d
    ), i = { modelClass: e, attributes: o, relationships: r }, n = Reflect.getOwnMetadata(h, e);
    n != null && n.abstract && (i.abstract = !0), n != null && n.discriminator && (i.discriminator = {
      key: n.discriminator.key ?? "type",
      map: n.discriminator.map
    }), n != null && n.clientGeneratedIds && (i.clientGeneratedIds = !0), this.entries.set(t, i), this.metaViews.delete(t), this.linkPolymorphicChild(t, e);
  }
  /**
   * After registering a model, checks whether any already-registered
   * polymorphic parent lists this model in its discriminator map and, if so,
   * stores the `polymorphicRoot` back-link.
   */
  linkPolymorphicChild(t, e) {
    for (const [o, r] of this.entries)
      if (!(!r.discriminator || o === t)) {
        for (const i of Object.values(r.discriminator.map))
          if (i() === e) {
            const n = this.entries.get(t);
            n && (n.polymorphicRoot = o);
            return;
          }
      }
  }
  /**
   * Returns the constructor for the given `modelName`.
   * @throws if the model has not been registered.
   */
  modelFor(t) {
    const e = this.entries.get(t);
    if (!e)
      throw new Error(`No model registered for type "${t}"`);
    return e.modelClass;
  }
  /**
   * Returns the serializer-facing schema view for `modelName`.
   *
   * Serializers are handed a `ModelMeta`, never the constructor: they iterate
   * `attributes` / `relationships`, which exist only on this view.  The result
   * is memoized per model name and reused across calls.
   *
   * `@model` options are mirrored onto the view via reflect-metadata so
   * serializers that read them (e.g. `JsonSerializer` checking for a
   * polymorphic discriminator) behave the same as when given the constructor.
   *
   * @throws if the model has not been registered.
   */
  metaFor(t) {
    const e = this.metaViews.get(t);
    if (e)
      return e;
    const o = this.entries.get(t);
    if (!o)
      throw new Error(`No model registered for type "${t}"`);
    const r = {
      modelName: t,
      attributes: o.attributes,
      relationships: o.relationships
    }, i = Reflect.getOwnMetadata(h, o.modelClass);
    return i && Reflect.defineMetadata(h, i, r), this.metaViews.set(t, r), r;
  }
  /** Returns all registered model names. */
  registeredNames() {
    return Array.from(this.entries.keys());
  }
  /** Returns `true` when a model class has been registered for `modelName`. */
  doesTypeExist(t) {
    return this.entries.has(t);
  }
  /**
   * Returns the merged attribute definitions for `modelName`.
   * @throws if the model has not been registered.
   */
  attributesDefinitionFor(t) {
    const e = this.entries.get(t);
    if (!e)
      throw new Error(`No model registered for type "${t}"`);
    return e.attributes;
  }
  /**
   * Returns the merged relationship definitions for `modelName`.
   * @throws if the model has not been registered.
   */
  relationshipsDefinitionFor(t) {
    const e = this.entries.get(t);
    if (!e)
      throw new Error(`No model registered for type "${t}"`);
    return e.relationships;
  }
  /**
   * Iterates over every attribute definition for `modelName`, invoking
   * `callback` with the attribute name and its `AttributeDef`.
   */
  eachAttribute(t, e) {
    const o = this.attributesDefinitionFor(t);
    for (const [r, i] of o)
      e(r, i);
  }
  /**
   * Iterates over every relationship definition for `modelName`, invoking
   * `callback` with the relationship name and its `RelationshipDef`.
   */
  eachRelationship(t, e) {
    const o = this.relationshipsDefinitionFor(t);
    for (const [r, i] of o)
      e(r, i);
  }
  /**
   * Returns the discriminator definition for `modelName`, or `undefined`
   * when the model is not polymorphic.
   */
  discriminatorFor(t) {
    var e;
    return (e = this.entries.get(t)) == null ? void 0 : e.discriminator;
  }
  /**
   * Returns the polymorphic root model name for a concrete child, or `null`
   * when `modelName` is not part of a polymorphic hierarchy.
   */
  polymorphicRootFor(t) {
    var e;
    return ((e = this.entries.get(t)) == null ? void 0 : e.polymorphicRoot) ?? null;
  }
  /**
   * Returns `true` when `modelName` is declared abstract.
   */
  isAbstract(t) {
    var e;
    return ((e = this.entries.get(t)) == null ? void 0 : e.abstract) === !0;
  }
  /** Returns `true` when the model uses client-generated ids. */
  hasClientGeneratedIds(t) {
    var e;
    return ((e = this.entries.get(t)) == null ? void 0 : e.clientGeneratedIds) === !0;
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
  resolveConcreteModel(t, e) {
    const o = this.entries.get(t);
    if (!(o != null && o.discriminator))
      return null;
    const { key: r, map: i } = o.discriminator, n = e[r];
    if (n == null)
      throw new Error(
        `Missing discriminator key "${r}" in payload for polymorphic model "${t}".`
      );
    const s = String(n), a = i[s];
    if (!a) {
      const p = Object.keys(i).join(", ");
      throw new Error(
        `Unknown discriminator value "${s}" for model "${t}" (key: "${r}"). Known values: ${p}.`
      );
    }
    const c = a();
    return { modelName: c.modelName ?? s, modelClass: c };
  }
};
l = w([
  u()
], l);
export {
  l as S
};
//# sourceMappingURL=SchemaService-DBsdlETO.js.map
