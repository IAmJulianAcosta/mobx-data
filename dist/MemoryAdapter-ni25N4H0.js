import { injectable as d } from "tsyringe";
import { A as f } from "./RestAdapter-CGWqOR_G.js";
var p = Object.getOwnPropertyDescriptor, y = (s, t, e, r) => {
  for (var n = r > 1 ? void 0 : r ? p(t, e) : t, o = s.length - 1, i; o >= 0; o--)
    (i = s[o]) && (n = i(n) || n);
  return n;
};
let c = class extends f {
  constructor() {
    super(...arguments), this.storage = /* @__PURE__ */ new Map(), this.nextId = /* @__PURE__ */ new Map();
  }
  getCollection(s) {
    let t = this.storage.get(s);
    return t || (t = /* @__PURE__ */ new Map(), this.storage.set(s, t)), t;
  }
  generateId(s) {
    const t = this.nextId.get(s) ?? 1;
    return this.nextId.set(s, t + 1), String(t);
  }
  /**
   * Pre-populates the adapter with records for a given model type.
   * Auto-increments the internal ID counter to avoid collisions with
   * subsequently created records.
   *
   * @param modelName - The model type to seed.
   * @param records - Array of plain objects; each must have an `id` key.
   */
  seed(s, t) {
    const e = this.getCollection(s);
    for (const r of t) {
      const { id: n, ...o } = r;
      e.set(n, { id: n, type: s, attributes: o });
      const i = Number(n);
      if (!Number.isNaN(i)) {
        const a = this.nextId.get(s) ?? 1;
        i >= a && this.nextId.set(s, i + 1);
      }
    }
  }
  /** Clears all stored records and resets ID counters. */
  reset() {
    this.storage.clear(), this.nextId.clear();
  }
  async findRecord(s, t, e) {
    const n = this.getCollection(t).get(e);
    if (!n)
      throw Object.assign(
        new Error(`Record not found: ${t}:${e}`),
        { status: 404 }
      );
    return { data: { id: n.id, type: n.type, attributes: { ...n.attributes } } };
  }
  async findAll(s, t) {
    const e = this.getCollection(t);
    return { data: Array.from(e.values()).map((n) => ({
      id: n.id,
      type: n.type,
      attributes: { ...n.attributes }
    })) };
  }
  async findMany(s, t, e) {
    const r = this.getCollection(t);
    return { data: e.map((o) => r.get(o)).filter((o) => o !== void 0).map((o) => ({
      id: o.id,
      type: o.type,
      attributes: { ...o.attributes }
    })) };
  }
  /** Filters records by exact attribute match on all query keys. */
  async query(s, t, e) {
    const r = this.getCollection(t);
    return { data: Array.from(r.values()).filter((a) => {
      for (const [u, l] of Object.entries(e))
        if (a.attributes[u] !== l)
          return !1;
      return !0;
    }).map((a) => ({
      id: a.id,
      type: a.type,
      attributes: { ...a.attributes }
    })) };
  }
  /** Returns the first record matching the query, or `null`. */
  async queryRecord(s, t, e) {
    return { data: (await this.query(s, t, e)).data[0] ?? null };
  }
  static safeAssign(s, t) {
    for (const [e, r] of Object.entries(t))
      e === "__proto__" || e === "constructor" || e === "prototype" || (s[e] = r);
  }
  async createRecord(s, t, e) {
    const r = this.generateId(t), n = {}, o = e.record;
    o._data && c.safeAssign(n, o._data);
    const i = { id: r, type: t, attributes: n };
    return this.getCollection(t).set(r, i), { data: { id: r, type: t, attributes: { ...n } } };
  }
  async updateRecord(s, t, e) {
    const { id: r } = e;
    if (!r)
      throw new Error("Cannot update a record without an id");
    const o = this.getCollection(t).get(r);
    if (!o)
      throw Object.assign(
        new Error(`Record not found: ${t}:${r}`),
        { status: 404 }
      );
    const i = e.record;
    return i._data && c.safeAssign(o.attributes, i._data), { data: { id: r, type: t, attributes: { ...o.attributes } } };
  }
  async deleteRecord(s, t, e) {
    const { id: r } = e;
    if (!r)
      throw new Error("Cannot delete a record without an id");
    return this.getCollection(t).delete(r), null;
  }
};
c = y([
  d()
], c);
export {
  c as M
};
//# sourceMappingURL=MemoryAdapter-ni25N4H0.js.map
