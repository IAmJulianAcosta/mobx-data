import { A, M as m, a as T, R as w } from "./types-CC2fG3FP.js";
import { a as y, b as E, h as P, m as M } from "./decorators-CKneHgoF.js";
import { S as O } from "./SchemaService-C6OJhSg-.js";
import { A as q, a as g, E as L, M as D, b as B, S as H, c as Q } from "./relationships-DvSi8fVN.js";
import { a as v, A as F, I as J, M as Y, b as z, d as C, O as K, R as N, S as V, c as U } from "./createStore-CxuLvBVN.js";
import { A as k, a as G, R as X, b as Z, e as $, p as ee } from "./RestAdapter-CYInlScn.js";
import { M as se } from "./MemoryAdapter-Ci8LcJdS.js";
import { S as ae } from "./Serializer-Ca6w_QNQ.js";
import { E as ne, R as ie } from "./EmbeddedRecordsMixin-6mSCXsJ3.js";
import { J as ue } from "./JsonSerializer-CFqo6GjC.js";
import { B as he, a as le, D as pe, N as _e, S as be } from "./date-Bj4O2W1F.js";
import { C as Se, F as Ae, R as me } from "./CacheHandler-BhfbVHed.js";
import { J as we, a as xe } from "./JsonApiSerializer-DyFMN1xT.js";
import { O as Ee } from "./ODataAdapter-24gQCO7e.js";
import { M as Me } from "./MdqlMemoryExecutor-ClRyEFJj.js";
const h = 36e5;
class b {
  constructor(e = {}) {
    this._database = null, this._openPromise = null, this._writeQueue = Promise.resolve(), this._databaseName = e.databaseName ?? "mobx-data-cache", this._defaultTTL = e.defaultTTL ?? h;
  }
  get defaultTTL() {
    return this._defaultTTL;
  }
  async open() {
    return this._database ? this._database : this._openPromise ? this._openPromise : (this._openPromise = new Promise((e, t) => {
      const s = indexedDB.open(this._databaseName);
      s.onsuccess = () => {
        this._database = s.result, e(this._database);
      }, s.onerror = () => {
        this._openPromise = null, t(s.error);
      };
    }), this._openPromise);
  }
  async ensureObjectStore(e) {
    const t = await this.open();
    if (t.objectStoreNames.contains(e))
      return t;
    const s = t.version + 1;
    return t.close(), this._database = null, this._openPromise = null, this._openPromise = new Promise((a, i) => {
      const o = indexedDB.open(this._databaseName, s);
      o.onupgradeneeded = () => {
        const c = o.result;
        c.objectStoreNames.contains(e) || c.createObjectStore(e, { keyPath: "id" });
      }, o.onsuccess = () => {
        this._database = o.result, a(this._database);
      }, o.onerror = () => {
        this._openPromise = null, i(o.error);
      };
    }), this._openPromise;
  }
  enqueueWrite(e) {
    const t = this._writeQueue.then(e);
    return this._writeQueue = t.then(() => {
    }, () => {
    }), t;
  }
  async get(e, t) {
    await this._writeQueue;
    const s = await this.open();
    return s.objectStoreNames.contains(e) ? new Promise((a, i) => {
      const r = s.transaction(e, "readonly").objectStore(e).get(t);
      r.onsuccess = () => {
        const n = r.result;
        if (!n) {
          a(null);
          return;
        }
        if (Date.now() > n.expiresAt) {
          this.invalidate(e, t), a(null);
          return;
        }
        a({
          modelName: e,
          id: n.id,
          attributes: n.attributes,
          relationships: n.relationships,
          cachedAt: n.cachedAt,
          expiresAt: n.expiresAt
        });
      }, r.onerror = () => i(r.error);
    }) : null;
  }
  async set(e, t, s, a = {}) {
    return this.enqueueWrite(async () => {
      const i = await this.ensureObjectStore(e), o = Date.now(), c = a.ttl ?? this._defaultTTL, r = {
        id: t,
        attributes: s,
        relationships: a.relationships,
        cachedAt: o,
        expiresAt: o + c
      };
      return new Promise((n, d) => {
        const u = i.transaction(e, "readwrite").objectStore(e).put(r);
        u.onsuccess = () => n(), u.onerror = () => d(u.error);
      });
    });
  }
  async has(e, t) {
    return await this.get(e, t) !== null;
  }
  async invalidate(e, t) {
    await this._writeQueue;
    const s = await this.open();
    if (s.objectStoreNames.contains(e))
      return new Promise((a, i) => {
        const r = s.transaction(e, "readwrite").objectStore(e).delete(t);
        r.onsuccess = () => a(), r.onerror = () => i(r.error);
      });
  }
  async invalidateAll(e) {
    await this._writeQueue;
    const t = await this.open();
    if (e)
      return t.objectStoreNames.contains(e) ? new Promise((a, i) => {
        const r = t.transaction(e, "readwrite").objectStore(e).clear();
        r.onsuccess = () => a(), r.onerror = () => i(r.error);
      }) : void 0;
    const s = Array.from(t.objectStoreNames);
    if (s.length !== 0)
      return new Promise((a, i) => {
        const o = t.transaction(s, "readwrite");
        let c = s.length;
        for (const r of s) {
          const n = o.objectStore(r).clear();
          n.onsuccess = () => {
            c -= 1, c === 0 && a();
          }, n.onerror = () => i(n.error);
        }
      });
  }
  async close() {
    await this._writeQueue, this._database && (this._database.close(), this._database = null, this._openPromise = null);
  }
}
export {
  v as ALL_OPERATORS,
  A as ATTRIBUTES_META_KEY,
  k as Adapter,
  F as AdapterPopulatedRecordArray,
  q as AsyncBelongsTo,
  g as AsyncHasMany,
  he as BaseTransform,
  le as BooleanTransform,
  Se as CacheHandler,
  pe as DateTransform,
  ne as EmbeddedRecordsMixin,
  L as Errors,
  Ae as FetchHandler,
  J as IdentityMap,
  b as IndexedDBCache,
  we as JsonApiAdapter,
  xe as JsonApiSerializer,
  ue as JsonSerializer,
  m as MODEL_NAME_META_KEY,
  T as MODEL_OPTIONS_META_KEY,
  D as ManyArray,
  Me as MdqlMemoryExecutor,
  Y as MdqlQueryBuilder,
  z as MdqlValidationException,
  C as MdqlValidator,
  se as MemoryAdapter,
  B as Model,
  _e as NumberTransform,
  Ee as ODataAdapter,
  K as OPERATORS_FOR_TYPE,
  w as RELATIONSHIPS_META_KEY,
  G as RESPONSE_HEADERS,
  N as RecordArray,
  me as RequestManager,
  X as RestAdapter,
  ie as RestSerializer,
  O as SchemaService,
  ae as Serializer,
  H as Snapshot,
  Q as StateMachine,
  V as Store,
  be as StringTransform,
  Z as attachResponseHeaders,
  y as attr,
  E as belongsTo,
  U as createStore,
  $ as extractResponseHeaders,
  P as hasMany,
  M as model,
  ee as parseCacheTTLFromHeaders
};
//# sourceMappingURL=index.js.map
