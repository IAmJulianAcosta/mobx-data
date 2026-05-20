import "reflect-metadata";
import { a as c, A as i, R as s } from "./types-CC2fG3FP.js";
function r(e) {
  let a = Reflect.getOwnMetadata(i, e);
  return a || (a = /* @__PURE__ */ new Map(), Reflect.defineMetadata(i, a, e)), a;
}
function o(e) {
  let a = Reflect.getOwnMetadata(s, e);
  return a || (a = /* @__PURE__ */ new Map(), Reflect.defineMetadata(s, a, e)), a;
}
function R(e, a) {
  let n = null, t = {};
  return typeof e == "string" ? (n = e, t = a ?? {}) : e === null ? (n = null, t = a ?? {}) : typeof e == "object" && e !== null && (t = e), (f, l) => {
    r(f).set(l, {
      name: l,
      type: n,
      options: t,
      isAttribute: !0
    });
  };
}
function u(e, a, n = {}) {
  const t = {
    async: n.async ?? !1,
    inverse: n.inverse === void 0 ? null : n.inverse,
    polymorphic: n.polymorphic ?? !1,
    ...n
  };
  return (f, l) => {
    o(f).set(l, {
      name: l,
      kind: e,
      type: a,
      options: t,
      isRelationship: !0
    });
  };
}
function T(e, a = {}) {
  return u("belongsTo", e, a);
}
function E(e, a = {}) {
  return u("hasMany", e, a);
}
function A(e = {}) {
  return (a) => {
    e.name && (a.modelName = e.name), Reflect.defineMetadata(c, e, a);
  };
}
export {
  R as a,
  T as b,
  E as h,
  A as m
};
//# sourceMappingURL=decorators-CKneHgoF.js.map
