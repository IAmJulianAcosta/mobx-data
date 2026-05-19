const a = Symbol("response-headers"), c = 36e5;
function o(e) {
  const t = e["cache-control"];
  if (t) {
    if (/no-store/i.test(t) || /no-cache/i.test(t))
      return 0;
    const n = /s-maxage=(\d+)/i.exec(t);
    if (n)
      return parseInt(n[1], 10) * 1e3;
    const r = /max-age=(\d+)/i.exec(t);
    if (r)
      return parseInt(r[1], 10) * 1e3;
  }
  const s = e.expires;
  if (s) {
    const n = new Date(s).getTime();
    if (!Number.isNaN(n))
      return Math.max(0, n - Date.now());
  }
  return c;
}
function i(e) {
  return e !== null && typeof e == "object" ? e[a] ?? null : null;
}
function f(e, t) {
  e !== null && typeof e == "object" && Object.defineProperty(e, a, {
    value: t,
    enumerable: !1,
    writable: !1,
    configurable: !1
  });
}
export {
  a as R,
  f as a,
  i as e,
  o as p
};
//# sourceMappingURL=cache-utils-38Dqu4Qf.js.map
