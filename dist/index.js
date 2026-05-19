import { A as T, M as b, R as _ } from "./types-C9NB2gRj.js";
import { a as E, b as R, h as w } from "./decorators-Zr35qr6A.js";
import { S as P } from "./SchemaService-DZwkFgZu.js";
import { A as g, a as L, E as q, M as D, b as H, S as K, c as O } from "./relationships-BEXANmWg.js";
import { A as I, I as B, R as J, S as z } from "./Store-mvrDLQEZ.js";
import { A as k, R as Y } from "./RestAdapter-CGWqOR_G.js";
import { M as C } from "./MemoryAdapter-ni25N4H0.js";
import { S as $ } from "./Serializer-FxJbsZ50.js";
import { E as G, J as Q, R as W } from "./EmbeddedRecordsMixin-VoHluHCT.js";
import { B as Z, a as ee, D as te, N as se, S as ae } from "./date-Bj4O2W1F.js";
import { C as oe, F as ne, R as ce } from "./CacheHandler-BTU_rYkv.js";
import { J as de, a as ue } from "./JsonApiSerializer-wndq5a1n.js";
import { O as pe } from "./ODataAdapter-DAja_jKM.js";
import { R as me, a as Ae, e as fe, p as ye } from "./cache-utils-38Dqu4Qf.js";
const o = "cache-entries", h = 1, m = 36e5;
class u {
  constructor(e = {}) {
    this._database = null, this._openPromise = null, this._databaseName = e.databaseName ?? "mobx-data-cache", this._defaultTTL = e.defaultTTL ?? m;
  }
  get defaultTTL() {
    return this._defaultTTL;
  }
  async open() {
    return this._database ? this._database : this._openPromise ? this._openPromise : (this._openPromise = new Promise((e, s) => {
      const t = indexedDB.open(this._databaseName, h);
      t.onupgradeneeded = () => {
        const a = t.result;
        if (!a.objectStoreNames.contains(o)) {
          const n = a.createObjectStore(o, {
            keyPath: "key"
          });
          n.createIndex("modelName", "modelName", { unique: !1 }), n.createIndex("expiresAt", "expiresAt", { unique: !1 });
        }
      }, t.onsuccess = () => {
        this._database = t.result, e(this._database);
      }, t.onerror = () => {
        this._openPromise = null, s(t.error);
      };
    }), this._openPromise);
  }
  static cacheKey(e, s) {
    return `${e}:${s}`;
  }
  async get(e, s) {
    const t = await this.open();
    return new Promise((a, n) => {
      const r = t.transaction(o, "readonly").objectStore(o).get(u.cacheKey(e, s));
      r.onsuccess = () => {
        const c = r.result;
        if (!c) {
          a(null);
          return;
        }
        if (Date.now() > c.expiresAt) {
          this.invalidate(e, s), a(null);
          return;
        }
        a(c);
      }, r.onerror = () => n(r.error);
    });
  }
  async set(e, s, t, a = {}) {
    const n = await this.open(), d = Date.now(), i = a.ttl ?? this._defaultTTL, r = {
      key: u.cacheKey(e, s),
      modelName: e,
      id: s,
      attributes: t,
      relationships: a.relationships,
      cachedAt: d,
      expiresAt: d + i
    };
    return new Promise((c, p) => {
      const l = n.transaction(o, "readwrite").objectStore(o).put(r);
      l.onsuccess = () => c(), l.onerror = () => p(l.error);
    });
  }
  async has(e, s) {
    return await this.get(e, s) !== null;
  }
  async invalidate(e, s) {
    const t = await this.open();
    return new Promise((a, n) => {
      const r = t.transaction(o, "readwrite").objectStore(o).delete(u.cacheKey(e, s));
      r.onsuccess = () => a(), r.onerror = () => n(r.error);
    });
  }
  async invalidateAll(e) {
    const s = await this.open();
    return e ? new Promise((t, a) => {
      const r = s.transaction(o, "readwrite").objectStore(o).index("modelName").openCursor(IDBKeyRange.only(e));
      r.onsuccess = () => {
        const c = r.result;
        c ? (c.delete(), c.continue()) : t();
      }, r.onerror = () => a(r.error);
    }) : new Promise((t, a) => {
      const i = s.transaction(o, "readwrite").objectStore(o).clear();
      i.onsuccess = () => t(), i.onerror = () => a(i.error);
    });
  }
  async close() {
    this._database && (this._database.close(), this._database = null, this._openPromise = null);
  }
}
export {
  T as ATTRIBUTES_META_KEY,
  k as Adapter,
  I as AdapterPopulatedRecordArray,
  g as AsyncBelongsTo,
  L as AsyncHasMany,
  Z as BaseTransform,
  ee as BooleanTransform,
  oe as CacheHandler,
  te as DateTransform,
  G as EmbeddedRecordsMixin,
  q as Errors,
  ne as FetchHandler,
  B as IdentityMap,
  u as IndexedDBCache,
  de as JsonApiAdapter,
  ue as JsonApiSerializer,
  Q as JsonSerializer,
  b as MODEL_NAME_META_KEY,
  D as ManyArray,
  C as MemoryAdapter,
  H as Model,
  se as NumberTransform,
  pe as ODataAdapter,
  _ as RELATIONSHIPS_META_KEY,
  me as RESPONSE_HEADERS,
  J as RecordArray,
  ce as RequestManager,
  Y as RestAdapter,
  W as RestSerializer,
  P as SchemaService,
  $ as Serializer,
  K as Snapshot,
  O as StateMachine,
  z as Store,
  ae as StringTransform,
  Ae as attachResponseHeaders,
  E as attr,
  R as belongsTo,
  fe as extractResponseHeaders,
  w as hasMany,
  ye as parseCacheTTLFromHeaders
};
//# sourceMappingURL=index.js.map
