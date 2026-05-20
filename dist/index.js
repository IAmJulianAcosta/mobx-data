import { A as S, M as _, R as b } from "./types-C9NB2gRj.js";
import { a as E, b as R, h as M } from "./decorators-Zr35qr6A.js";
import { S as w } from "./SchemaService-DZwkFgZu.js";
import { A as q, a as L, E as N, M as g, b as D, S as H, c as K } from "./relationships-BEXANmWg.js";
import { a as B, A as I, I as F, M as J, b as z, c as Y, d as k, O as V, R as v, S as C } from "./Store-BAN_4IWi.js";
import { A as $, R as Q } from "./RestAdapter-D6bGIHZT.js";
import { M as W } from "./MemoryAdapter-Bp-BGHH3.js";
import { S as Z } from "./Serializer-FxJbsZ50.js";
import { E as te, J as se, R as ae } from "./EmbeddedRecordsMixin-VoHluHCT.js";
import { B as oe, a as ne, D as ce, N as ie, S as de } from "./date-Bj4O2W1F.js";
import { C as ue, F as pe, R as he } from "./CacheHandler-BhfbVHed.js";
import { J as Ae, a as fe } from "./JsonApiSerializer-BLoE046A.js";
import { O as ye } from "./ODataAdapter-RQUjVTcf.js";
import { R as _e, a as be, e as xe, p as Ee } from "./cache-utils-B2wFhisx.js";
const o = "cache-entries", h = 1, m = 36e5;
class l {
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
      const r = t.transaction(o, "readonly").objectStore(o).get(l.cacheKey(e, s));
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
      key: l.cacheKey(e, s),
      modelName: e,
      id: s,
      attributes: t,
      relationships: a.relationships,
      cachedAt: d,
      expiresAt: d + i
    };
    return new Promise((c, p) => {
      const u = n.transaction(o, "readwrite").objectStore(o).put(r);
      u.onsuccess = () => c(), u.onerror = () => p(u.error);
    });
  }
  async has(e, s) {
    return await this.get(e, s) !== null;
  }
  async invalidate(e, s) {
    const t = await this.open();
    return new Promise((a, n) => {
      const r = t.transaction(o, "readwrite").objectStore(o).delete(l.cacheKey(e, s));
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
  B as ALL_OPERATORS,
  S as ATTRIBUTES_META_KEY,
  $ as Adapter,
  I as AdapterPopulatedRecordArray,
  q as AsyncBelongsTo,
  L as AsyncHasMany,
  oe as BaseTransform,
  ne as BooleanTransform,
  ue as CacheHandler,
  ce as DateTransform,
  te as EmbeddedRecordsMixin,
  N as Errors,
  pe as FetchHandler,
  F as IdentityMap,
  l as IndexedDBCache,
  Ae as JsonApiAdapter,
  fe as JsonApiSerializer,
  se as JsonSerializer,
  _ as MODEL_NAME_META_KEY,
  g as ManyArray,
  J as MdqlMemoryExecutor,
  z as MdqlQueryBuilder,
  Y as MdqlValidationException,
  k as MdqlValidator,
  W as MemoryAdapter,
  D as Model,
  ie as NumberTransform,
  ye as ODataAdapter,
  V as OPERATORS_FOR_TYPE,
  b as RELATIONSHIPS_META_KEY,
  _e as RESPONSE_HEADERS,
  v as RecordArray,
  he as RequestManager,
  Q as RestAdapter,
  ae as RestSerializer,
  w as SchemaService,
  Z as Serializer,
  H as Snapshot,
  K as StateMachine,
  C as Store,
  de as StringTransform,
  be as attachResponseHeaders,
  E as attr,
  R as belongsTo,
  xe as extractResponseHeaders,
  M as hasMany,
  Ee as parseCacheTTLFromHeaders
};
//# sourceMappingURL=index.js.map
