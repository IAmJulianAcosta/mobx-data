import { A as _, M as y, a as b, R as E } from "./types-CC2fG3FP.js";
import { a as M, b as R, h as P, m as w } from "./decorators-CKneHgoF.js";
import { S as q } from "./SchemaService-C_pkh-vI.js";
import { A as N, a as g, E as D, M as K, b as H, S as I, c as j } from "./relationships-DvSi8fVN.js";
import { a as F, A as J, I as Y, M as z, b as k, d as V, e as v, O as C, R as U, S as $, c as Q } from "./createStore-C94UzI7i.js";
import { A as W, a as X, R as Z, b as ee, e as te, p as ae } from "./RestAdapter-DYUoyV5h.js";
import { M as re } from "./MemoryAdapter-BW1HKixm.js";
import { S as ne } from "./Serializer-Ca6w_QNQ.js";
import { E as ie, R as de } from "./EmbeddedRecordsMixin-6mSCXsJ3.js";
import { J as ue } from "./JsonSerializer-CFqo6GjC.js";
import { B as me, a as he, D as Ae, N as Te, S as Se } from "./date-Bj4O2W1F.js";
import { C as _e, F as ye, R as be } from "./CacheHandler-BhfbVHed.js";
import { J as xe, a as Me } from "./JsonApiSerializer-BV61cFAZ.js";
import { O as Pe } from "./ODataAdapter-BaI5cZn0.js";
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
  W as Adapter,
  J as AdapterPopulatedRecordArray,
  N as AsyncBelongsTo,
  g as AsyncHasMany,
  me as BaseTransform,
  he as BooleanTransform,
  _e as CacheHandler,
  Ae as DateTransform,
  ie as EmbeddedRecordsMixin,
  D as Errors,
  ye as FetchHandler,
  Y as IdentityMap,
  l as IndexedDBCache,
  xe as JsonApiAdapter,
  Me as JsonApiSerializer,
  ue as JsonSerializer,
  y as MODEL_NAME_META_KEY,
  b as MODEL_OPTIONS_META_KEY,
  K as ManyArray,
  z as MdqlMemoryExecutor,
  k as MdqlQueryBuilder,
  V as MdqlValidationException,
  v as MdqlValidator,
  re as MemoryAdapter,
  H as Model,
  Te as NumberTransform,
  Pe as ODataAdapter,
  C as OPERATORS_FOR_TYPE,
  E as RELATIONSHIPS_META_KEY,
  X as RESPONSE_HEADERS,
  U as RecordArray,
  be as RequestManager,
  Z as RestAdapter,
  de as RestSerializer,
  q as SchemaService,
  ne as Serializer,
  I as Snapshot,
  j as StateMachine,
  $ as Store,
  Se as StringTransform,
  ee as attachResponseHeaders,
  M as attr,
  R as belongsTo,
  Q as createStore,
  te as extractResponseHeaders,
  P as hasMany,
  w as model,
  ae as parseCacheTTLFromHeaders
};
//# sourceMappingURL=index.js.map
