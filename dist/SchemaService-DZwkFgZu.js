import "reflect-metadata";
import { singleton as h } from "tsyringe";
import { R as l, A as u } from "./types-C9NB2gRj.js";
var y = Object.getOwnPropertyDescriptor, g = (t, e, s, r) => {
  for (var o = r > 1 ? void 0 : r ? y(e, s) : e, i = t.length - 1, n; i >= 0; i--)
    (n = t[i]) && (o = n(o) || o);
  return o;
};
function a(t, e) {
  const s = [];
  let r = t;
  for (; r && r !== Object.prototype; )
    s.push(r), r = Object.getPrototypeOf(r);
  const o = /* @__PURE__ */ new Map();
  for (const i of s.reverse()) {
    const n = Reflect.getOwnMetadata(e, i);
    if (n)
      for (const [p, f] of n)
        o.set(p, f);
  }
  return o;
}
let c = class {
  constructor() {
    this.entries = /* @__PURE__ */ new Map();
  }
  /**
   * Registers a model class under `modelName`.
   *
   * Walks the prototype chain at registration time so lookups are O(1).
   * Calling this a second time for the same `modelName` replaces the entry.
   */
  registerModel(t, e) {
    const s = a(
      e.prototype,
      u
    ), r = a(
      e.prototype,
      l
    );
    this.entries.set(t, { modelClass: e, attributes: s, relationships: r });
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
    const s = this.attributesDefinitionFor(t);
    for (const [r, o] of s)
      e(r, o);
  }
  /**
   * Iterates over every relationship definition for `modelName`, invoking
   * `callback` with the relationship name and its `RelationshipDef`.
   */
  eachRelationship(t, e) {
    const s = this.relationshipsDefinitionFor(t);
    for (const [r, o] of s)
      e(r, o);
  }
};
c = g([
  h()
], c);
export {
  c as S
};
//# sourceMappingURL=SchemaService-DZwkFgZu.js.map
