const a = Symbol("response-headers");
function c(e) {
  const t = e["cache-control"];
  if (t) {
    if (/no-store/i.test(t) || /no-cache/i.test(t))
      return 0;
    const n = /s-maxage=(\d+)/i.exec(t);
    if (n)
      return parseInt(n[1], 10) * 1e3;
    const s = /max-age=(\d+)/i.exec(t);
    if (s)
      return parseInt(s[1], 10) * 1e3;
  }
  const r = e.expires;
  if (r) {
    const n = new Date(r).getTime();
    if (!Number.isNaN(n))
      return Math.max(0, n - Date.now());
  }
  return null;
}
function o(e) {
  return e !== null && typeof e == "object" ? e[a] ?? null : null;
}
function i(e, t) {
  e !== null && typeof e == "object" && Object.defineProperty(e, a, {
    value: t,
    enumerable: !1,
    writable: !1,
    configurable: !1
  });
}
export {
  a as R,
  i as a,
  o as e,
  c as p
};
//# sourceMappingURL=cache-utils-B2wFhisx.js.map
