import { injectable as s } from "tsyringe";
class c {
}
var v = Object.getOwnPropertyDescriptor, g = (r, n, u, l) => {
  for (var t = l > 1 ? void 0 : l ? v(n, u) : n, e = r.length - 1, o; e >= 0; e--)
    (o = r[e]) && (t = o(t) || t);
  return t;
};
let a = class extends c {
  deserialize(r) {
    return r == null ? null : typeof r == "string" ? r : String(r);
  }
  serialize(r) {
    return r == null ? null : String(r);
  }
};
a = g([
  s()
], a);
var b = Object.getOwnPropertyDescriptor, N = (r, n, u, l) => {
  for (var t = l > 1 ? void 0 : l ? b(n, u) : n, e = r.length - 1, o; e >= 0; e--)
    (o = r[e]) && (t = o(t) || t);
  return t;
};
let f = class extends c {
  static coerce(r) {
    if (r == null || r === "")
      return null;
    if (typeof r == "number")
      return Number.isFinite(r) ? r : null;
    if (typeof r == "string") {
      const n = r.trim();
      if (n === "")
        return null;
      const u = Number(n);
      return Number.isFinite(u) ? u : null;
    }
    return null;
  }
  deserialize(r) {
    return f.coerce(r);
  }
  serialize(r) {
    return f.coerce(r);
  }
};
f = N([
  s()
], f);
var _ = Object.getOwnPropertyDescriptor, D = (r, n, u, l) => {
  for (var t = l > 1 ? void 0 : l ? _(n, u) : n, e = r.length - 1, o; e >= 0; e--)
    (o = r[e]) && (t = o(t) || t);
  return t;
};
let m = class extends c {
  deserialize(r, n = {}) {
    if (r == null)
      return n.allowNull ? null : !1;
    if (typeof r == "boolean")
      return r;
    if (typeof r == "number")
      return r === 1;
    if (typeof r == "string") {
      const u = r.toLowerCase();
      return u === "true" || u === "t" || u === "1";
    }
    return !!r;
  }
  serialize(r, n = {}) {
    return r == null ? n.allowNull ? null : !1 : !!r;
  }
};
m = D([
  s()
], m);
var O = Object.getOwnPropertyDescriptor, i = (r, n, u, l) => {
  for (var t = l > 1 ? void 0 : l ? O(n, u) : n, e = r.length - 1, o; e >= 0; e--)
    (o = r[e]) && (t = o(t) || t);
  return t;
};
let p = class extends c {
  deserialize(r) {
    if (r == null || r === "")
      return null;
    if (r instanceof Date)
      return Number.isNaN(r.getTime()) ? null : r;
    if (typeof r == "number" || typeof r == "string") {
      const n = new Date(r);
      return Number.isNaN(n.getTime()) ? null : n;
    }
    return null;
  }
  serialize(r) {
    return r == null ? null : r instanceof Date ? Number.isNaN(r.getTime()) ? null : r.toISOString() : null;
  }
};
p = i([
  s()
], p);
export {
  c as B,
  p as D,
  f as N,
  a as S,
  m as a
};
//# sourceMappingURL=date-Bj4O2W1F.js.map
