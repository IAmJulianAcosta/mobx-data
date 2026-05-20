import "reflect-metadata";
import { A as s, R as f } from "./types-C9NB2gRj.js";
function c(e) {
  let n = Reflect.getOwnMetadata(s, e);
  return n || (n = /* @__PURE__ */ new Map(), Reflect.defineMetadata(s, n, e)), n;
}
function o(e) {
  let n = Reflect.getOwnMetadata(f, e);
  return n || (n = /* @__PURE__ */ new Map(), Reflect.defineMetadata(f, n, e)), n;
}
function d(e, n) {
  let a = null, t = {};
  return typeof e == "string" ? (a = e, t = n ?? {}) : e === null ? (a = null, t = n ?? {}) : typeof e == "object" && e !== null && (t = e), (i, l) => {
    c(i).set(l, {
      name: l,
      type: a,
      options: t,
      isAttribute: !0
    });
  };
}
function u(e, n, a = {}) {
  const t = {
    async: a.async ?? !1,
    inverse: a.inverse === void 0 ? null : a.inverse,
    polymorphic: a.polymorphic ?? !1,
    ...a
  };
  return (i, l) => {
    o(i).set(l, {
      name: l,
      kind: e,
      type: n,
      options: t,
      isRelationship: !0
    });
  };
}
function R(e, n = {}) {
  return u("belongsTo", e, n);
}
function T(e, n = {}) {
  return u("hasMany", e, n);
}
export {
  d as a,
  R as b,
  T as h
};
//# sourceMappingURL=decorators-Zr35qr6A.js.map
