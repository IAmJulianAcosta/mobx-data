import "reflect-metadata";
import { injectable as f } from "tsyringe";
import { a as m } from "./types-CC2fG3FP.js";
import { S as d } from "./Serializer-Ca6w_QNQ.js";
var h = Object.getOwnPropertyDescriptor, R = (t, e, r, c) => {
  for (var i = c > 1 ? void 0 : c ? h(e, r) : e, a = t.length - 1, n; a >= 0; a--)
    (n = t[a]) && (i = n(i) || i);
  return i;
};
let u = class extends d {
  static dispatchMethodName(t) {
    switch (t) {
      case "findRecord":
        return "normalizeFindRecordResponse";
      case "findAll":
        return "normalizeFindAllResponse";
      case "query":
        return "normalizeQueryResponse";
      case "queryRecord":
        return "normalizeQueryRecordResponse";
      case "createRecord":
        return "normalizeCreateRecordResponse";
      case "updateRecord":
        return "normalizeUpdateRecordResponse";
      case "deleteRecord":
        return "normalizeDeleteRecordResponse";
      default:
        return null;
    }
  }
  /**
   * Normalizes a single flat JSON object into a `NormalizedResource`.
   * Returns `null` for absent or non-object payloads.
   */
  normalize(t, e, r, c) {
    if (r == null || typeof r != "object")
      return null;
    const i = r, a = this.extractId(e, i), n = Reflect.getOwnMetadata(
      m,
      e
    ), s = n != null && n.discriminator ? this.extractAllAttributes(e, i) : this.extractAttributes(e, i), l = this.extractRelationships(e, i), o = {
      type: e.modelName,
      id: a,
      attributes: s
    };
    return l && Object.keys(l).length > 0 && (o.relationships = l), o;
  }
  /**
   * Entry point for normalization.
   *
   * Checks whether a subclass has overridden the relevant per-operation hook
   * (e.g. `normalizeFindRecordResponse`).  If so, calls it; otherwise falls
   * through to `_buildDocument`.
   */
  normalizeResponse(t, e, r, c, i) {
    const a = u.dispatchMethodName(i);
    if (a) {
      const n = this[a], s = d.prototype[a];
      if (typeof n == "function" && n !== s)
        return n.call(
          this,
          t,
          e,
          r,
          c,
          i
        );
    }
    return this._buildDocument(t, e, r, c, i);
  }
  /**
   * Builds a `NormalizedDocument` from a raw payload.
   * Arrays are normalized item by item; plain objects are normalized as a
   * single resource.
   */
  _buildDocument(t, e, r, c, i) {
    return r == null ? { data: null } : Array.isArray(r) ? { data: r.map((s) => this.normalize(t, e, s)).filter((s) => s !== null) } : { data: this.normalize(t, e, r) };
  }
  /**
   * Serializes a snapshot to a flat JSON object.
   * Includes `id` when `options.includeId` is `true`.
   */
  serialize(t, e) {
    const r = {};
    return e != null && e.includeId && t.id !== null ? r[this.primaryKey] = t.id : e != null && e.clientGeneratedIds && t.id === null && (r[this.primaryKey] = t.clientId), t.eachAttribute((c, i) => {
      this.serializeAttribute(t, r, c, i);
    }), t.eachRelationship((c, i) => {
      i.kind === "belongsTo" ? this.serializeBelongsTo(t, r, i) : this.serializeHasMany(t, r, i);
    }), r;
  }
};
u = R([
  f()
], u);
export {
  u as J
};
//# sourceMappingURL=JsonSerializer-CFqo6GjC.js.map
