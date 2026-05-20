import { A as _, M as y, a as E, R as b } from "./types-CC2fG3FP.js";
import { a as R, b as M, h as P, m as w } from "./decorators-CKneHgoF.js";
import { S as q } from "./SchemaService-BOy3SIWh.js";
import { A as N, a as g, E as D, M as K, b as H, S as I, c as j } from "./relationships-DcHr9Q3b.js";
import { a as F, A as J, I as Y, M as z, b as k, c as V, d as v, O as C, R as U, S as $ } from "./Store-BC3Tsy-Z.js";
import { A as G, R as W } from "./RestAdapter-D6bGIHZT.js";
import { M as Z } from "./MemoryAdapter-Bp-BGHH3.js";
import { S as te } from "./Serializer-Ca6w_QNQ.js";
import { E as se, J as re, R as oe } from "./EmbeddedRecordsMixin-DlfjZ0nK.js";
import { B as ce, a as ie, D as de, N as le, S as ue } from "./date-Bj4O2W1F.js";
import { C as me, F as he, R as Ae } from "./CacheHandler-BhfbVHed.js";
import { J as fe, a as Se } from "./JsonApiSerializer-BuaiBqGM.js";
import { O as ye } from "./ODataAdapter-RQUjVTcf.js";
import { R as be, a as xe, e as Re, p as Me } from "./cache-utils-B2wFhisx.js";
const o = "cache-entries", m = 1, h = 36e5;
class l {
  constructor(e = {}) {
    this._database = null, this._openPromise = null, this._databaseName = e.databaseName ?? "mobx-data-cache", this._defaultTTL = e.defaultTTL ?? h;
  }
  get defaultTTL() {
    return this._defaultTTL;
  }
  async open() {
    return this._database ? this._database : this._openPromise ? this._openPromise : (this._openPromise = new Promise((e, a) => {
      const t = indexedDB.open(this._databaseName, m);
      t.onupgradeneeded = () => {
        const s = t.result;
        if (!s.objectStoreNames.contains(o)) {
          const n = s.createObjectStore(o, {
            keyPath: "key"
          });
          n.createIndex("modelName", "modelName", { unique: !1 }), n.createIndex("expiresAt", "expiresAt", { unique: !1 });
        }
      }, t.onsuccess = () => {
        this._database = t.result, e(this._database);
      }, t.onerror = () => {
        this._openPromise = null, a(t.error);
      };
    }), this._openPromise);
  }
  static cacheKey(e, a) {
    return `${e}:${a}`;
  }
  async get(e, a) {
    const t = await this.open();
    return new Promise((s, n) => {
      const r = t.transaction(o, "readonly").objectStore(o).get(l.cacheKey(e, a));
      r.onsuccess = () => {
        const c = r.result;
        if (!c) {
          s(null);
          return;
        }
        if (Date.now() > c.expiresAt) {
          this.invalidate(e, a), s(null);
          return;
        }
        s(c);
      }, r.onerror = () => n(r.error);
    });
  }
  async set(e, a, t, s = {}) {
    const n = await this.open(), d = Date.now(), i = s.ttl ?? this._defaultTTL, r = {
      key: l.cacheKey(e, a),
      modelName: e,
      id: a,
      attributes: t,
      relationships: s.relationships,
      cachedAt: d,
      expiresAt: d + i
    };
    return new Promise((c, p) => {
      const u = n.transaction(o, "readwrite").objectStore(o).put(r);
      u.onsuccess = () => c(), u.onerror = () => p(u.error);
    });
  }
  async has(e, a) {
    return await this.get(e, a) !== null;
  }
  async invalidate(e, a) {
    const t = await this.open();
    return new Promise((s, n) => {
      const r = t.transaction(o, "readwrite").objectStore(o).delete(l.cacheKey(e, a));
      r.onsuccess = () => s(), r.onerror = () => n(r.error);
    });
  }
  async invalidateAll(e) {
    const a = await this.open();
    return e ? new Promise((t, s) => {
      const r = a.transaction(o, "readwrite").objectStore(o).index("modelName").openCursor(IDBKeyRange.only(e));
      r.onsuccess = () => {
        const c = r.result;
        c ? (c.delete(), c.continue()) : t();
      }, r.onerror = () => s(r.error);
    }) : new Promise((t, s) => {
      const i = a.transaction(o, "readwrite").objectStore(o).clear();
      i.onsuccess = () => t(), i.onerror = () => s(i.error);
    });
  }
  async close() {
    this._database && (this._database.close(), this._database = null, this._openPromise = null);
  }
}
export {
  F as ALL_OPERATORS,
  _ as ATTRIBUTES_META_KEY,
  G as Adapter,
  J as AdapterPopulatedRecordArray,
  N as AsyncBelongsTo,
  g as AsyncHasMany,
  ce as BaseTransform,
  ie as BooleanTransform,
  me as CacheHandler,
  de as DateTransform,
  se as EmbeddedRecordsMixin,
  D as Errors,
  he as FetchHandler,
  Y as IdentityMap,
  l as IndexedDBCache,
  fe as JsonApiAdapter,
  Se as JsonApiSerializer,
  re as JsonSerializer,
  y as MODEL_NAME_META_KEY,
  E as MODEL_OPTIONS_META_KEY,
  K as ManyArray,
  z as MdqlMemoryExecutor,
  k as MdqlQueryBuilder,
  V as MdqlValidationException,
  v as MdqlValidator,
  Z as MemoryAdapter,
  H as Model,
  le as NumberTransform,
  ye as ODataAdapter,
  C as OPERATORS_FOR_TYPE,
  b as RELATIONSHIPS_META_KEY,
  be as RESPONSE_HEADERS,
  U as RecordArray,
  Ae as RequestManager,
  W as RestAdapter,
  oe as RestSerializer,
  q as SchemaService,
  te as Serializer,
  I as Snapshot,
  j as StateMachine,
  $ as Store,
  ue as StringTransform,
  xe as attachResponseHeaders,
  R as attr,
  M as belongsTo,
  Re as extractResponseHeaders,
  P as hasMany,
  w as model,
  Me as parseCacheTTLFromHeaders
};
//# sourceMappingURL=index.js.map
