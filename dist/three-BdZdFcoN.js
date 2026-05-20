const ai = {
  one: {},
  two: {},
  three: {},
  four: {}
}, ii = {
  one: {},
  two: {},
  three: {}
}, si = {}, ui = [], wn = { methods: ai, model: ii, compute: si, hooks: ui }, ci = (e) => Object.prototype.toString.call(e) === "[object Array]", li = {
  /** add metadata to term objects */
  compute: function(e) {
    const { world: t } = this, n = t.compute;
    return typeof e == "string" && n.hasOwnProperty(e) ? n[e](this) : ci(e) ? e.forEach((r) => {
      t.compute.hasOwnProperty(r) ? n[r](this) : console.warn("no compute:", e);
    }) : typeof e == "function" ? e(this) : console.warn("no compute:", e), this;
  }
}, hi = function(e) {
  return this.fullPointer.forEach((n, r) => {
    const o = this.update([n]);
    e(o, r);
  }), this;
}, di = function(e, t) {
  const r = this.fullPointer.map((a, i) => {
    const s = this.update([a]), u = e(s, i);
    return u === void 0 ? this.none() : u;
  });
  if (r.length === 0)
    return t || this.update([]);
  if (r[0] !== void 0 && (typeof r[0] == "string" || typeof r[0] == "object" && (r[0] === null || !r[0].isView)))
    return r;
  let o = [];
  return r.forEach((a) => {
    o = o.concat(a.fullPointer);
  }), this.toView(o);
}, fi = function(e) {
  let t = this.fullPointer;
  return t = t.filter((r, o) => {
    const a = this.update([r]);
    return e(a, o);
  }), this.update(t);
}, pi = function(e) {
  const n = this.fullPointer.find((r, o) => {
    const a = this.update([r]);
    return e(a, o);
  });
  return this.update([n]);
}, gi = function(e) {
  return this.fullPointer.some((n, r) => {
    const o = this.update([n]);
    return e(o, r);
  });
}, mi = function(e = 1) {
  let t = this.fullPointer, n = Math.floor(Math.random() * t.length);
  return n + e > this.length && (n = this.length - e, n = n < 0 ? 0 : n), t = t.slice(n, n + e), this.update(t);
}, yi = { forEach: hi, map: di, filter: fi, find: pi, some: gi, random: mi }, he = {
  /** */
  termList: function() {
    return this.methods.one.termList(this.docs);
  },
  /** return individual terms*/
  terms: function(e) {
    const t = this.match(".");
    return typeof e == "number" ? t.eq(e) : t;
  },
  /** */
  groups: function(e) {
    if (e || e === 0)
      return this.update(this._groups[e] || []);
    const t = {};
    return Object.keys(this._groups).forEach((n) => {
      t[n] = this.update(this._groups[n]);
    }), t;
  },
  /** */
  eq: function(e) {
    let t = this.pointer;
    return t || (t = this.docs.map((n, r) => [r])), t[e] ? this.update([t[e]]) : this.none();
  },
  /** */
  first: function() {
    return this.eq(0);
  },
  /** */
  last: function() {
    const e = this.fullPointer.length - 1;
    return this.eq(e);
  },
  /** grab term[0] for every match */
  firstTerms: function() {
    return this.match("^.");
  },
  /** grab the last term for every match  */
  lastTerms: function() {
    return this.match(".$");
  },
  /** */
  slice: function(e, t) {
    let n = this.pointer || this.docs.map((r, o) => [o]);
    return n = n.slice(e, t), this.update(n);
  },
  /** return a view of the entire document */
  all: function() {
    return this.update().toView();
  },
  /**  */
  fullSentences: function() {
    const e = this.fullPointer.map((t) => [t[0]]);
    return this.update(e).toView();
  },
  /** return a view of no parts of the document */
  none: function() {
    return this.update([]);
  },
  /** are these two views looking at the same words? */
  isDoc: function(e) {
    if (!e || !e.isView)
      return !1;
    const t = this.fullPointer, n = e.fullPointer;
    return !t.length === n.length ? !1 : t.every((r, o) => n[o] ? r[0] === n[o][0] && r[1] === n[o][1] && r[2] === n[o][2] : !1);
  },
  /** how many seperate terms does the document have? */
  wordCount: function() {
    return this.docs.reduce((e, t) => (e += t.filter((n) => n.text !== "").length, e), 0);
  },
  // is the pointer the full sentence?
  isFull: function() {
    const e = this.pointer;
    if (!e)
      return !0;
    if (e.length === 0 || e[0][0] !== 0)
      return !1;
    let t = 0, n = 0;
    return this.document.forEach((r) => t += r.length), this.docs.forEach((r) => n += r.length), t === n;
  },
  // return the nth elem of a doc
  getNth: function(e) {
    return typeof e == "number" ? this.eq(e) : typeof e == "string" ? this.if(e) : this;
  }
};
he.group = he.groups;
he.fullSentence = he.fullSentences;
he.sentence = he.fullSentences;
he.lastTerm = he.lastTerms;
he.firstTerm = he.firstTerms;
const Pn = Object.assign({}, he, li, yi);
Pn.get = Pn.eq;
class Ee {
  constructor(t, n, r = {}) {
    [
      ["document", t],
      ["world", wn],
      ["_groups", r],
      ["_cache", null],
      ["viewType", "View"]
    ].forEach((a) => {
      Object.defineProperty(this, a[0], {
        value: a[1],
        writable: !0
      });
    }), this.ptrs = n;
  }
  /* getters:  */
  get docs() {
    let t = this.document;
    return this.ptrs && (t = wn.methods.one.getDoc(this.ptrs, this.document)), t;
  }
  get pointer() {
    return this.ptrs;
  }
  get methods() {
    return this.world.methods;
  }
  get model() {
    return this.world.model;
  }
  get hooks() {
    return this.world.hooks;
  }
  get isView() {
    return !0;
  }
  // is the view not-empty?
  get found() {
    return this.docs.length > 0;
  }
  // how many matches we have
  get length() {
    return this.docs.length;
  }
  // return a more-hackable pointer
  get fullPointer() {
    const { docs: t, ptrs: n, document: r } = this;
    return (n || t.map((a, i) => [i])).map((a) => {
      let [i, s, u, l, c] = a;
      return s = s || 0, u = u || (r[i] || []).length, r[i] && r[i][s] && (l = l || r[i][s].id, r[i][u - 1] && (c = c || r[i][u - 1].id)), [i, s, u, l, c];
    });
  }
  // create a new View, from this one
  update(t) {
    const n = new Ee(this.document, t);
    if (this._cache && t && t.length > 0) {
      const r = [];
      t.forEach((o, a) => {
        const [i, s, u] = o;
        o.length === 1 ? r[a] = this._cache[i] : s === 0 && this.document[i].length === u && (r[a] = this._cache[i]);
      }), r.length > 0 && (n._cache = r);
    }
    return n.world = this.world, n;
  }
  // create a new View, from this one
  toView(t) {
    return new Ee(this.document, t || this.pointer);
  }
  fromText(t) {
    const { methods: n } = this, r = n.one.tokenize.fromString(t, this.world), o = new Ee(r);
    return o.world = this.world, o.compute(["normal", "freeze", "lexicon"]), this.world.compute.preTagger && o.compute("preTagger"), o.compute("unfreeze"), o;
  }
  clone() {
    let t = this.document.slice(0);
    t = t.map((r) => r.map((o) => (o = Object.assign({}, o), o.tags = new Set(o.tags), o)));
    const n = this.update(this.pointer);
    return n.document = t, n._cache = this._cache, n;
  }
}
Object.assign(Ee.prototype, Pn);
const bi = "14.15.0", or = function(e) {
  return e && typeof e == "object" && !Array.isArray(e);
}, vi = function(e) {
  return Object.prototype.toString.call(e) === "[object Array]";
};
function ua(e, t) {
  if (or(t))
    for (const n in t)
      or(t[n]) ? (e[n] || Object.assign(e, { [n]: {} }), ua(e[n], t[n])) : Object.assign(e, { [n]: t[n] });
  return e;
}
function wi(e, t) {
  for (const n in t)
    e[n] = e[n] || {}, Object.assign(e[n], t[n]);
  return e;
}
const Pi = function(e, t) {
  const n = e.two.models || {};
  Object.keys(t).forEach((r) => {
    t[r].pastTense && (n.toPast && (n.toPast.ex[r] = t[r].pastTense), n.fromPast && (n.fromPast.ex[t[r].pastTense] = r)), t[r].presentTense && (n.toPresent && (n.toPresent.ex[r] = t[r].presentTense), n.fromPresent && (n.fromPresent.ex[t[r].presentTense] = r)), t[r].gerund && (n.toGerund && (n.toGerund.ex[r] = t[r].gerund), n.fromGerund && (n.fromGerund.ex[t[r].gerund] = r)), t[r].comparative && (n.toComparative && (n.toComparative.ex[r] = t[r].comparative), n.fromComparative && (n.fromComparative.ex[t[r].comparative] = r)), t[r].superlative && (n.toSuperlative && (n.toSuperlative.ex[r] = t[r].superlative), n.fromSuperlative && (n.fromSuperlative.ex[t[r].superlative] = r));
  });
}, ca = function(e, t, n, r) {
  if (vi(e)) {
    e.forEach((u) => ca(u, t, n, r));
    return;
  }
  const { methods: o, model: a, compute: i, hooks: s } = t;
  e.methods && wi(o, e.methods), e.model && ua(a, e.model), e.irregulars && Pi(a, e.irregulars), e.compute && Object.assign(i, e.compute), s && (t.hooks = s.concat(e.hooks || [])), e.api && e.api(n), e.lib && Object.keys(e.lib).forEach((u) => r[u] = e.lib[u]), e.tags && r.addTags(e.tags), e.words && r.addWords(e.words), e.frozen && r.addWords(e.frozen, !0), e.mutate && e.mutate(t, r);
}, ki = function(e) {
  const t = typeof process > "u" || !process.env ? self.env || {} : process.env;
  return t.DEBUG_TAGS = e === "tagger" || e === !0 ? !0 : "", t.DEBUG_MATCH = e === "match" || e === !0 ? !0 : "", t.DEBUG_CHUNKS = e === "chunker" || e === !0 ? !0 : "", this;
}, Ai = (e) => Object.prototype.toString.call(e) === "[object Object]", kn = function(e) {
  return Object.prototype.toString.call(e) === "[object Array]";
}, Ci = function(e) {
  return e.map((t) => t.terms.map((n) => (kn(n.tags) && (n.tags = new Set(n.tags)), n)));
}, Ni = function(e) {
  return e.map((t) => t.map((n) => ({
    text: n,
    normal: n,
    //cleanup
    pre: "",
    post: " ",
    tags: /* @__PURE__ */ new Set()
  })));
}, la = function(e, t, n) {
  const { methods: r } = n, o = new t([]);
  if (o.world = n, typeof e == "number" && (e = String(e)), !e)
    return o;
  if (typeof e == "string") {
    const a = r.one.tokenize.fromString(e, n);
    return new t(a);
  }
  if (Ai(e) && e.isView)
    return new t(e.document, e.ptrs);
  if (kn(e)) {
    if (kn(e[0])) {
      const i = Ni(e);
      return new t(i);
    }
    const a = Ci(e);
    return new t(a);
  }
  return o;
}, Ut = Object.assign({}, wn), b = function(e, t) {
  t && b.addWords(t);
  const n = la(e, Ee, Ut);
  return e && n.compute(Ut.hooks), n;
};
Object.defineProperty(b, "_world", {
  value: Ut,
  writable: !0
});
b.tokenize = function(e, t) {
  const { compute: n } = this._world;
  t && b.addWords(t);
  const r = la(e, Ee, Ut);
  return n.contractions && r.compute(["alias", "normal", "machine", "contractions"]), r;
};
b.plugin = function(e) {
  return ca(e, this._world, Ee, this), this;
};
b.extend = b.plugin;
b.world = function() {
  return this._world;
};
b.model = function() {
  return this._world.model;
};
b.methods = function() {
  return this._world.methods;
};
b.hooks = function() {
  return this._world.hooks;
};
b.verbose = ki;
b.version = bi;
const xi = function(e) {
  return e.map((n) => {
    const r = /* @__PURE__ */ new Set();
    return n.forEach((o) => {
      o.normal !== "" && r.add(o.normal), o.switch && r.add(`%${o.switch}%`), o.implicit && r.add(o.implicit), o.machine && r.add(o.machine), o.root && r.add(o.root), o.alias && o.alias.forEach((i) => r.add(i));
      const a = Array.from(o.tags);
      for (let i = 0; i < a.length; i += 1)
        r.add("#" + a[i]);
    }), r;
  });
}, ji = {
  one: {
    cacheDoc: xi
  }
}, Ti = {
  /** */
  cache: function() {
    return this._cache = this.methods.one.cacheDoc(this.document), this;
  },
  /** */
  uncache: function() {
    return this._cache = null, this;
  }
}, Ii = function(e) {
  Object.assign(e.prototype, Ti);
}, $i = {
  cache: function(e) {
    e._cache = e.methods.one.cacheDoc(e.document);
  }
}, Di = {
  api: Ii,
  compute: $i,
  methods: ji
}, Hi = {
  /** */
  toLowerCase: function() {
    return this.termList().forEach((e) => {
      e.text = e.text.toLowerCase();
    }), this;
  },
  /** */
  toUpperCase: function() {
    return this.termList().forEach((e) => {
      e.text = e.text.toUpperCase();
    }), this;
  },
  /** */
  toTitleCase: function() {
    return this.termList().forEach((e) => {
      e.text = e.text.replace(/^ *[a-z\u00C0-\u00FF]/, (t) => t.toUpperCase());
    }), this;
  },
  /** */
  toCamelCase: function() {
    return this.docs.forEach((e) => {
      e.forEach((t, n) => {
        n !== 0 && (t.text = t.text.replace(/^ *[a-z\u00C0-\u00FF]/, (r) => r.toUpperCase())), n !== e.length - 1 && (t.post = "");
      });
    }), this;
  }
}, ar = (e) => new RegExp("^\\p{Lu}[\\p{Ll}'’]", "u").test(e) || new RegExp("^\\p{Lu}$", "u").test(e), Ei = (e) => e.replace(new RegExp("^\\p{Ll}", "u"), (t) => t.toUpperCase()), Gi = (e) => e.replace(new RegExp("^\\p{Lu}", "u"), (t) => t.toLowerCase()), ha = (e, t, n) => {
  if (n.forEach((r) => r.dirty = !0), e) {
    const r = [t, 0].concat(n);
    Array.prototype.splice.apply(e, r);
  }
  return e;
}, nt = function(e) {
  const t = / $/, n = /[-–—]/, r = e[e.length - 1];
  r && !t.test(r.post) && !n.test(r.post) && (r.post += " ");
}, ir = (e, t, n) => {
  const r = /[-.?!,;:)–—'"]/g, o = e[t - 1];
  if (!o)
    return;
  const a = o.post;
  if (r.test(a)) {
    const i = a.match(r).join(""), s = n[n.length - 1];
    s.post = i + s.post, o.post = o.post.replace(r, "");
  }
}, Oi = function(e, t, n) {
  const r = e[t];
  if (t !== 0 || !ar(r.text))
    return;
  n[0].text = Ei(n[0].text);
  const o = e[t];
  o.tags.has("ProperNoun") || o.tags.has("Acronym") || ar(o.text) && o.text.length > 1 && (o.text = Gi(o.text));
}, Fi = function(e, t, n, r) {
  const [o, a, i] = t;
  a === 0 || i === r[o].length ? nt(n) : (nt(n), nt([e[t[1]]])), Oi(e, a, n), ha(e, a, n);
}, zi = function(e, t, n, r) {
  const [o, , a] = t, i = (r[o] || []).length;
  a < i ? (ir(e, a, n), nt(n)) : i === a && (nt(e), ir(e, a, n), r[o + 1] && (n[n.length - 1].post += " ")), ha(e, t[2], n), t[4] = n[n.length - 1].id;
};
let it = 0;
const sr = (e) => (e = e.length < 3 ? "0" + e : e, e.length < 3 ? "0" + e : e), da = function(e) {
  let [t, n] = e.index || [0, 0];
  it += 1, it = it > 46655 ? 0 : it, t = t > 46655 ? 0 : t, n = n > 1294 ? 0 : n;
  let r = sr(it.toString(36));
  r += sr(t.toString(36));
  let o = n.toString(36);
  o = o.length < 2 ? "0" + o : o, r += o;
  const a = parseInt(Math.random() * 36, 10);
  return r += a.toString(36), e.normal + "|" + r.toUpperCase();
}, ur = function(e) {
  e.has("@hasContraction") && typeof e.contractions == "function" && e.grow("@hasContraction").contractions().expand();
}, cr = (e) => Object.prototype.toString.call(e) === "[object Array]", Vi = function(e) {
  return e = e.map((t) => (t.id = da(t), t)), e;
}, Bi = function(e, t) {
  const { methods: n } = t;
  return typeof e == "string" ? n.one.tokenize.fromString(e, t)[0] : typeof e == "object" && e.isView ? e.clone().docs[0] || [] : cr(e) ? cr(e[0]) ? e[0] : e : [];
}, lr = function(e, t, n) {
  const { document: r, world: o } = t;
  t.uncache();
  const a = t.fullPointer, i = t.fullPointer;
  t.forEach((u, l) => {
    const c = u.fullPointer[0], [h] = c, f = r[h];
    let w = Bi(e, o);
    w.length !== 0 && (w = Vi(w), n ? (ur(t.update([c]).firstTerm()), Fi(f, c, w, r)) : (ur(t.update([c]).lastTerm()), zi(f, c, w, r)), r[h] && r[h][c[1]] && (c[3] = r[h][c[1]].id), i[l] = c, c[2] += w.length, a[l] = c);
  });
  const s = t.toView(a);
  return t.ptrs = i, s.compute(["id", "index", "freeze", "lexicon"]), s.world.compute.preTagger && s.compute("preTagger"), s.compute("unfreeze"), s;
}, Ke = {
  insertAfter: function(e) {
    return lr(e, this, !1);
  },
  insertBefore: function(e) {
    return lr(e, this, !0);
  }
};
Ke.append = Ke.insertAfter;
Ke.prepend = Ke.insertBefore;
Ke.insert = Ke.insertAfter;
const Si = /\$[0-9a-z]+/g, Kn = {}, Mi = (e) => new RegExp("^\\p{Lu}[\\p{Ll}'’]", "u").test(e) || new RegExp("^\\p{Lu}$", "u").test(e), Li = (e) => e.replace(new RegExp("^\\p{Ll}", "u"), (t) => t.toUpperCase()), Ki = (e) => e.replace(new RegExp("^\\p{Lu}", "u"), (t) => t.toLowerCase()), Wi = function(e, t, n) {
  return e.forEach((r) => {
    const o = t(r);
    r.replaceWith(o, n);
  }), e;
}, Ji = function(e, t) {
  if (typeof e != "string")
    return e;
  const n = t.groups();
  return e = e.replace(Si, (r) => {
    const o = r.replace(/\$/, "");
    return n.hasOwnProperty(o) ? n[o].text() : r;
  }), e;
};
Kn.replaceWith = function(e, t = {}) {
  let n = this.fullPointer;
  const r = this;
  if (this.uncache(), typeof e == "function")
    return Wi(r, e, t);
  const o = r.docs[0];
  if (!o) return r;
  const a = t.possessives && o[o.length - 1].tags.has("Possessive"), i = t.case && Mi(o[0].text);
  e = Ji(e, r);
  const s = this.update(n);
  n = n.map((f) => f.slice(0, 3));
  const u = (s.docs[0] || []).map((f) => Array.from(f.tags)), l = s.docs[0][0].pre, c = s.docs[0][s.docs[0].length - 1].post;
  if (typeof e == "string" && (e = this.fromText(e).compute("id")), r.insertAfter(e), s.has("@hasContraction") && r.contractions && r.grow("@hasContraction+").contractions().expand(), r.delete(s), a) {
    const f = r.docs[0], w = f[f.length - 1];
    w.tags.has("Possessive") || (w.text += "'s", w.normal += "'s", w.tags.add("Possessive"));
  }
  if (l && r.docs[0] && (r.docs[0][0].pre = l), c && r.docs[0]) {
    const f = r.docs[0][r.docs[0].length - 1];
    f.post.trim() || (f.post = c);
  }
  const h = r.toView(n).compute(["index", "freeze", "lexicon"]);
  if (h.world.compute.preTagger && h.compute("preTagger"), h.compute("unfreeze"), t.tags && h.terms().forEach((f, w) => {
    f.tagSafe(u[w]);
  }), !h.docs[0] || !h.docs[0][0]) return h;
  if (t.case) {
    const f = i ? Li : Ki;
    h.docs[0][0].text = f(h.docs[0][0].text);
  }
  return h;
};
Kn.replace = function(e, t, n) {
  if (e && !t)
    return this.replaceWith(e, n);
  const r = this.match(e);
  return r.found ? (this.soften(), r.replaceWith(t, n)) : this;
};
const Ui = function(e, t) {
  const n = e.length - 1, r = e[n], o = e[n - t];
  o && r && (o.post += r.post, o.post = o.post.replace(/ +([.?!,;:])/, "$1"), o.post = o.post.replace(/[,;:]+([.?!])/, "$1"));
}, qi = function(e, t) {
  t.forEach((n) => {
    const [r, o, a] = n, i = a - o;
    e[r] && (a === e[r].length && a > 1 && Ui(e[r], i), e[r].splice(o, i));
  });
  for (let n = e.length - 1; n >= 0; n -= 1)
    if (e[n].length === 0 && (e.splice(n, 1), n === e.length && e[n - 1])) {
      const r = e[n - 1], o = r[r.length - 1];
      o && (o.post = o.post.trimEnd());
    }
  return e;
}, Ri = function(e, t) {
  return e = e.map((n) => {
    const [r] = n;
    return t[r] && t[r].forEach((o) => {
      const a = o[2] - o[1];
      n[1] <= o[1] && n[2] >= o[2] && (n[2] -= a);
    }), n;
  }), e.forEach((n, r) => {
    if (n[1] === 0 && n[2] == 0)
      for (let o = r + 1; o < e.length; o += 1)
        e[o][0] -= 1, e[o][0] < 0 && (e[o][0] = 0);
  }), e = e.filter((n) => n[2] - n[1] > 0), e = e.map((n) => (n[3] = null, n[4] = null, n)), e;
}, An = {
  /** */
  remove: function(e) {
    const { indexN: t } = this.methods.one.pointer;
    this.uncache();
    let n = this.all(), r = this;
    e && (n = this, r = this.match(e));
    const o = !n.ptrs;
    r.has("@hasContraction") && r.contractions && r.grow("@hasContraction").contractions().expand();
    let a = n.fullPointer;
    const i = r.fullPointer.reverse(), s = qi(this.document, i), u = t(i);
    return a = Ri(a, u), n.ptrs = a, n.document = s, n.compute("index"), o && (n.ptrs = void 0), e ? n.toView(a) : (this.ptrs = [], n.none());
  }
};
An.delete = An.remove;
const dt = {
  /** add this punctuation or whitespace before each match: */
  pre: function(e, t) {
    return e === void 0 && this.found ? this.docs[0][0].pre : (this.docs.forEach((n) => {
      const r = n[0];
      t === !0 ? r.pre += e : r.pre = e;
    }), this);
  },
  /** add this punctuation or whitespace after each match: */
  post: function(e, t) {
    if (e === void 0) {
      const n = this.docs[this.docs.length - 1];
      return n[n.length - 1].post;
    }
    return this.docs.forEach((n) => {
      const r = n[n.length - 1];
      t === !0 ? r.post += e : r.post = e;
    }), this;
  },
  /** remove whitespace from start/end */
  trim: function() {
    if (!this.found)
      return this;
    const e = this.docs, t = e[0][0];
    t.pre = t.pre.trimStart();
    const n = e[e.length - 1], r = n[n.length - 1];
    return r.post = r.post.trimEnd(), this;
  },
  /** connect words with hyphen, and remove whitespace */
  hyphenate: function() {
    return this.docs.forEach((e) => {
      e.forEach((t, n) => {
        n !== 0 && (t.pre = ""), e[n + 1] && (t.post = "-");
      });
    }), this;
  },
  /** remove hyphens between words, and set whitespace */
  dehyphenate: function() {
    const e = /[-–—]/;
    return this.docs.forEach((t) => {
      t.forEach((n) => {
        e.test(n.post) && (n.post = " ");
      });
    }), this;
  },
  /** add quotations around these matches */
  toQuotations: function(e, t) {
    return e = e || '"', t = t || '"', this.docs.forEach((n) => {
      n[0].pre = e + n[0].pre;
      const r = n[n.length - 1];
      r.post = t + r.post;
    }), this;
  },
  /** add brackets around these matches */
  toParentheses: function(e, t) {
    return e = e || "(", t = t || ")", this.docs.forEach((n) => {
      n[0].pre = e + n[0].pre;
      const r = n[n.length - 1];
      r.post = t + r.post;
    }), this;
  }
};
dt.deHyphenate = dt.dehyphenate;
dt.toQuotation = dt.toQuotations;
const Qi = (e, t) => e.normal < t.normal ? -1 : e.normal > t.normal ? 1 : 0, _i = (e, t) => {
  const n = e.normal.trim().length, r = t.normal.trim().length;
  return n < r ? 1 : n > r ? -1 : 0;
}, Zi = (e, t) => e.words < t.words ? 1 : e.words > t.words ? -1 : 0, Xi = (e, t) => e[0] < t[0] ? 1 : e[0] > t[0] ? -1 : e[1] > t[1] ? 1 : -1, Yi = function(e) {
  const t = {};
  return e.forEach((n) => {
    t[n.normal] = t[n.normal] || 0, t[n.normal] += 1;
  }), e.sort((n, r) => {
    const o = t[n.normal], a = t[r.normal];
    return o < a ? 1 : o > a ? -1 : 0;
  }), e;
}, Xt = { alpha: Qi, length: _i, wordCount: Zi, sequential: Xi, byFreq: Yi }, es = /* @__PURE__ */ new Set(["index", "sequence", "seq", "sequential", "chron", "chronological"]), ts = /* @__PURE__ */ new Set(["freq", "frequency", "topk", "repeats"]), ns = /* @__PURE__ */ new Set(["alpha", "alphabetical"]), rs = function(e, t) {
  let n = e.fullPointer;
  return n = n.sort((r, o) => (r = e.update([r]), o = e.update([o]), t(r, o))), e.ptrs = n, e;
}, os = function(e) {
  const { docs: t, pointer: n } = this;
  if (this.uncache(), typeof e == "function")
    return rs(this, e);
  e = e || "alpha";
  const r = n || t.map((a, i) => [i]);
  let o = t.map((a, i) => ({
    index: i,
    words: a.length,
    normal: a.map((s) => s.machine || s.normal || "").join(" "),
    pointer: r[i]
  }));
  return es.has(e) && (e = "sequential"), ns.has(e) && (e = "alpha"), ts.has(e) ? (o = Xt.byFreq(o), this.update(o.map((a) => a.pointer))) : typeof Xt[e] == "function" ? (o = o.sort(Xt[e]), this.update(o.map((a) => a.pointer))) : this;
}, as = function() {
  let e = this.pointer || this.docs.map((t, n) => [n]);
  return e = [].concat(e), e = e.reverse(), this._cache && (this._cache = this._cache.reverse()), this.update(e);
}, is = function() {
  const e = /* @__PURE__ */ new Set();
  return this.filter((n) => {
    const r = n.text("machine");
    return e.has(r) ? !1 : (e.add(r), !0);
  });
}, ss = { unique: is, reverse: as, sort: os }, us = (e) => Object.prototype.toString.call(e) === "[object Array]", fa = function(e, t) {
  if (e.length > 0) {
    const n = e[e.length - 1], r = n[n.length - 1];
    / /.test(r.post) === !1 && (r.post += " ");
  }
  return e = e.concat(t), e;
}, cs = function(e, t) {
  if (e.document === t.document) {
    const r = e.fullPointer.concat(t.fullPointer);
    return e.toView(r).compute("index");
  }
  return t.fullPointer.forEach((r) => {
    r[0] += e.document.length;
  }), e.document = fa(e.document, t.docs), e.all();
}, ls = {
  // add string as new match/sentence
  concat: function(e) {
    if (typeof e == "string") {
      const t = this.fromText(e);
      if (!this.found || !this.ptrs)
        this.document = this.document.concat(t.document);
      else {
        const n = this.fullPointer, r = n[n.length - 1][0];
        this.document.splice(r, 0, ...t.document);
      }
      return this.all().compute("index");
    }
    if (typeof e == "object" && e.isView)
      return cs(this, e);
    if (us(e)) {
      const t = fa(this.document, e);
      return this.document = t, this.all();
    }
    return this;
  }
}, hs = function() {
  return this.ptrs = this.fullPointer, this;
}, ds = function() {
  let e = this.ptrs;
  return !e || e.length < 1 ? this : (e = e.map((t) => t.slice(0, 3)), this.ptrs = e, this);
}, fs = { harden: hs, soften: ds }, ps = Object.assign({}, Hi, Ke, Kn, An, dt, ss, ls, fs), gs = function(e) {
  Object.assign(e.prototype, ps);
}, ms = {
  id: function(e) {
    const t = e.docs;
    for (let n = 0; n < t.length; n += 1)
      for (let r = 0; r < t[n].length; r += 1) {
        const o = t[n][r];
        o.id = o.id || da(o);
      }
  }
}, ys = {
  api: gs,
  compute: ms
}, bs = [
  // simple mappings
  { word: "@", out: ["at"] },
  { word: "arent", out: ["are", "not"] },
  { word: "alot", out: ["a", "lot"] },
  { word: "brb", out: ["be", "right", "back"] },
  { word: "cannot", out: ["can", "not"] },
  { word: "dun", out: ["do", "not"] },
  { word: "can't", out: ["can", "not"] },
  { word: "shan't", out: ["should", "not"] },
  { word: "won't", out: ["will", "not"] },
  { word: "that's", out: ["that", "is"] },
  { word: "what's", out: ["what", "is"] },
  { word: "let's", out: ["let", "us"] },
  // { word: "there's", out: ['there', 'is'] },
  { word: "dunno", out: ["do", "not", "know"] },
  { word: "gonna", out: ["going", "to"] },
  { word: "gotta", out: ["have", "got", "to"] },
  //hmm
  { word: "gimme", out: ["give", "me"] },
  { word: "outta", out: ["out", "of"] },
  { word: "tryna", out: ["trying", "to"] },
  { word: "gtg", out: ["got", "to", "go"] },
  { word: "im", out: ["i", "am"] },
  { word: "imma", out: ["I", "will"] },
  { word: "imo", out: ["in", "my", "opinion"] },
  { word: "irl", out: ["in", "real", "life"] },
  { word: "ive", out: ["i", "have"] },
  { word: "rn", out: ["right", "now"] },
  { word: "tbh", out: ["to", "be", "honest"] },
  { word: "wanna", out: ["want", "to"] },
  { word: "c'mere", out: ["come", "here"] },
  { word: "c'mon", out: ["come", "on"] },
  // shoulda, coulda
  { word: "shoulda", out: ["should", "have"] },
  { word: "coulda", out: ["coulda", "have"] },
  { word: "woulda", out: ["woulda", "have"] },
  { word: "musta", out: ["must", "have"] },
  { word: "tis", out: ["it", "is"] },
  { word: "twas", out: ["it", "was"] },
  { word: "y'know", out: ["you", "know"] },
  { word: "ne'er", out: ["never"] },
  { word: "o'er", out: ["over"] },
  // contraction-part mappings
  { after: "ll", out: ["will"] },
  { after: "ve", out: ["have"] },
  { after: "re", out: ["are"] },
  { after: "m", out: ["am"] },
  // french contractions
  { before: "c", out: ["ce"] },
  { before: "m", out: ["me"] },
  { before: "n", out: ["ne"] },
  { before: "qu", out: ["que"] },
  { before: "s", out: ["se"] },
  { before: "t", out: ["tu"] },
  // t'aime
  // missing apostrophes
  { word: "shouldnt", out: ["should", "not"] },
  { word: "couldnt", out: ["could", "not"] },
  { word: "wouldnt", out: ["would", "not"] },
  { word: "hasnt", out: ["has", "not"] },
  { word: "wasnt", out: ["was", "not"] },
  { word: "isnt", out: ["is", "not"] },
  { word: "cant", out: ["can", "not"] },
  { word: "dont", out: ["do", "not"] },
  { word: "wont", out: ["will", "not"] },
  // apostrophe d
  { word: "howd", out: ["how", "did"] },
  { word: "whatd", out: ["what", "did"] },
  { word: "whend", out: ["when", "did"] },
  { word: "whered", out: ["where", "did"] }
], R = !0, vs = {
  st: R,
  nd: R,
  rd: R,
  th: R,
  am: R,
  pm: R,
  max: R,
  "°": R,
  s: R,
  // 1990s
  e: R,
  // 18e - french/spanish ordinal
  er: R,
  //french 1er
  ère: R,
  //''
  ème: R
  //french 2ème
}, ws = {
  one: {
    contractions: bs,
    numberSuffixes: vs
  }
}, Yt = function(e, t, n) {
  const [r, o] = t;
  !n || n.length === 0 || (n = n.map((a, i) => (a.implicit = a.text, a.machine = a.text, a.pre = "", a.post = "", a.text = "", a.normal = "", a.index = [r, o + i], a)), n[0] && (n[0].pre = e[r][o].pre, n[n.length - 1].post = e[r][o].post, n[0].text = e[r][o].text, n[0].normal = e[r][o].normal), e[r].splice(o, 1, ...n));
}, Ps = /'/, ks = /* @__PURE__ */ new Set([
  "what",
  "how",
  "when",
  "where",
  "why"
]), As = /* @__PURE__ */ new Set([
  "be",
  "go",
  "start",
  "think",
  "need"
]), Cs = /* @__PURE__ */ new Set([
  "been",
  "gone"
]), Ns = function(e, t) {
  const n = e[t].normal.split(Ps)[0];
  if (ks.has(n))
    return [n, "did"];
  if (e[t + 1]) {
    if (Cs.has(e[t + 1].normal))
      return [n, "had"];
    if (As.has(e[t + 1].normal))
      return [n, "would"];
  }
  return null;
}, xs = function(e, t) {
  return e[t].normal === "ain't" || e[t].normal === "aint" ? null : [e[t].normal.replace(/n't/, ""), "not"];
}, Wn = /'/, js = /(e|é|aison|sion|tion)$/, Ts = /(age|isme|acle|ege|oire)$/, Is = (e, t) => {
  const n = e[t].normal.split(Wn)[1];
  return n && n.endsWith("e") ? ["la", n] : ["le", n];
}, $s = (e, t) => {
  const n = e[t].normal.split(Wn)[1];
  return n && js.test(n) && !Ts.test(n) ? ["du", n] : n && n.endsWith("s") ? ["des", n] : ["de", n];
}, Ds = (e, t) => ["je", e[t].normal.split(Wn)[1]], en = {
  preJ: Ds,
  preL: Is,
  preD: $s
}, Hs = /^([0-9.]{1,4}[a-z]{0,2}) ?[-–—] ?([0-9]{1,4}[a-z]{0,2})$/i, Es = /^([0-9]{1,2}(:[0-9][0-9])?(am|pm)?) ?[-–—] ?([0-9]{1,2}(:[0-9][0-9])?(am|pm)?)$/i, Gs = /^[0-9]{3}-[0-9]{4}$/, Os = function(e, t) {
  const n = e[t];
  let r = n.text.match(Hs);
  return r !== null ? n.tags.has("PhoneNumber") === !0 || Gs.test(n.text) ? null : [r[1], "to", r[2]] : (r = n.text.match(Es), r !== null ? [r[1], "to", r[4]] : null);
}, Fs = /^([+-]?[0-9][.,0-9]*)([a-z°²³µ/]+)$/, zs = function(e, t, n) {
  const r = n.model.one.numberSuffixes || {}, a = e[t].text.match(Fs);
  if (a !== null) {
    const i = a[2].toLowerCase().trim();
    return r.hasOwnProperty(i) ? null : [a[1], i];
  }
  return null;
}, hr = /'/, Vs = /^[0-9][^-–—]*[-–—].*?[0-9]/, dr = function(e, t, n, r) {
  const o = t.update();
  o.document = [e];
  let a = n + r;
  n > 0 && (n -= 1), e[a] && (a += 1), o.ptrs = [[0, n, a]];
}, fr = {
  // ain't
  t: (e, t) => xs(e, t),
  // how'd
  d: (e, t) => Ns(e, t)
}, pr = {
  // j'aime
  j: (e, t) => en.preJ(e, t),
  // l'amour
  l: (e, t) => en.preL(e, t),
  // d'amerique
  d: (e, t) => en.preD(e, t)
}, Bs = function(e, t, n, r) {
  for (let o = 0; o < e.length; o += 1) {
    const a = e[o];
    if (a.word === t.normal)
      return a.out;
    if (r !== null && r === a.after)
      return [n].concat(a.out);
    if (n !== null && n === a.before && r && r.length > 2)
      return a.out.concat(r);
  }
  return null;
}, tn = function(e, t) {
  const n = t.fromText(e.join(" "));
  return n.compute(["id", "alias"]), n.docs[0];
}, Ss = function(e, t) {
  for (let n = t + 1; n < 5 && e[n]; n += 1)
    if (e[n].normal === "been")
      return ["there", "has"];
  return ["there", "is"];
}, Ms = (e) => {
  const { world: t, document: n } = e, { model: r, methods: o } = t, a = r.one.contractions || [];
  n.forEach((i, s) => {
    for (let u = i.length - 1; u >= 0; u -= 1) {
      let l = null, c = null;
      if (hr.test(i[u].normal) === !0) {
        const f = i[u].normal.split(hr);
        l = f[0], c = f[1];
      }
      let h = Bs(a, i[u], l, c);
      if (!h && fr.hasOwnProperty(c) && (h = fr[c](i, u, t)), !h && pr.hasOwnProperty(l) && (h = pr[l](i, u)), l === "there" && c === "s" && (h = Ss(i, u)), h) {
        h = tn(h, e), Yt(n, [s, u], h), dr(n[s], e, u, h.length);
        continue;
      }
      if (Vs.test(i[u].normal)) {
        h = Os(i, u), h && (h = tn(h, e), Yt(n, [s, u], h), o.one.setTag(h, "NumberRange", t), h[2] && h[2].tags.has("Time") && o.one.setTag([h[0]], "Time", t, null, "time-range"), dr(n[s], e, u, h.length));
        continue;
      }
      h = zs(i, u, t), h && (h = tn(h, e), Yt(n, [s, u], h), o.one.setTag([h[1]], "Unit", t, null, "contraction-unit"));
    }
  });
}, Ls = { contractions: Ms }, Ks = {
  model: ws,
  compute: Ls,
  hooks: ["contractions"]
}, gr = function(e) {
  const t = e.world, { model: n, methods: r } = e.world, o = r.one.setTag, { frozenLex: a } = n.one, i = n.one._multiCache || {};
  e.docs.forEach((s) => {
    for (let u = 0; u < s.length; u += 1) {
      const l = s[u], c = l.machine || l.normal;
      if (i[c] !== void 0 && s[u + 1]) {
        const h = u + i[c] - 1;
        for (let f = h; f > u; f -= 1) {
          const w = s.slice(u, f + 1), ae = w.map((Pt) => Pt.machine || Pt.normal).join(" ");
          if (a.hasOwnProperty(ae) === !0) {
            o(w, a[ae], t, !1, "1-frozen-multi-lexicon"), w.forEach((Pt) => Pt.frozen = !0);
            continue;
          }
        }
      }
      if (a[c] !== void 0 && a.hasOwnProperty(c)) {
        o([l], a[c], t, !1, "1-freeze-lexicon"), l.frozen = !0;
        continue;
      }
    }
  });
}, Ws = function(e) {
  return e.docs.forEach((t) => {
    t.forEach((n) => {
      delete n.frozen;
    });
  }), e;
}, Js = { frozen: gr, freeze: gr, unfreeze: Ws }, mr = (e) => "\x1B[34m" + e + "\x1B[0m", yr = (e) => "\x1B[3m\x1B[2m" + e + "\x1B[0m", br = function(e) {
  e.docs.forEach((t) => {
    console.log(mr(`
  ┌─────────`)), t.forEach((n) => {
      let r = `  ${yr("│")}  `;
      const o = n.implicit || n.text || "-";
      n.frozen === !0 ? r += `${mr(o)} ❄️` : r += yr(o), console.log(r);
    });
  });
}, Us = {
  // add .compute('freeze')
  compute: Js,
  mutate: (e) => {
    const t = e.methods.one;
    t.termMethods.isFrozen = (n) => n.frozen === !0, t.debug.freeze = br, t.debug.frozen = br;
  },
  api: function(e) {
    e.prototype.freeze = function() {
      return this.docs.forEach((t) => {
        t.forEach((n) => {
          n.frozen = !0;
        });
      }), this;
    }, e.prototype.unfreeze = function() {
      this.compute("unfreeze");
    }, e.prototype.isFrozen = function() {
      return this.match("@isFrozen+");
    };
  },
  // run it in init
  hooks: ["freeze"]
}, qs = function(e, t, n) {
  const { model: r, methods: o } = n, a = o.one.setTag, i = r.one._multiCache || {}, { lexicon: s } = r.one || {}, u = e[t], l = u.machine || u.normal;
  if (i[l] !== void 0 && e[t + 1]) {
    const c = t + i[l] - 1;
    for (let h = c; h > t; h -= 1) {
      const f = e.slice(t, h + 1);
      if (f.length <= 1)
        return !1;
      const w = f.map((ae) => ae.machine || ae.normal).join(" ");
      if (s.hasOwnProperty(w) === !0) {
        const ae = s[w];
        return a(f, ae, n, !1, "1-multi-lexicon"), ae && ae.length === 2 && (ae[0] === "PhrasalVerb" || ae[1] === "PhrasalVerb") && a([f[1]], "Particle", n, !1, "1-phrasal-particle"), !0;
      }
    }
    return !1;
  }
  return null;
}, vr = /^(under|over|mis|re|un|dis|semi|pre|post)-?/, Rs = /* @__PURE__ */ new Set(["Verb", "Infinitive", "PastTense", "Gerund", "PresentTense", "Adjective", "Participle"]), Qs = function(e, t, n) {
  const { model: r, methods: o } = n, a = o.one.setTag, { lexicon: i } = r.one, s = e[t], u = s.machine || s.normal;
  if (i[u] !== void 0 && i.hasOwnProperty(u))
    return a([s], i[u], n, !1, "1-lexicon"), !0;
  if (s.alias) {
    const l = s.alias.find((c) => i.hasOwnProperty(c));
    if (l)
      return a([s], i[l], n, !1, "1-lexicon-alias"), !0;
  }
  if (vr.test(u) === !0) {
    const l = u.replace(vr, "");
    if (i.hasOwnProperty(l) && l.length > 3 && Rs.has(i[l]))
      return a([s], i[l], n, !1, "1-lexicon-prefix"), !0;
  }
  return null;
}, _s = function(e) {
  const t = e.world;
  e.docs.forEach((n) => {
    for (let r = 0; r < n.length; r += 1)
      if (n[r].tags.size === 0) {
        let o = null;
        o = o || qs(n, r, t), o = o || Qs(n, r, t);
      }
  });
}, Zs = {
  lexicon: _s
}, Xs = function(e) {
  const t = {}, n = {};
  return Object.keys(e).forEach((r) => {
    const o = e[r];
    r = r.toLowerCase().trim(), r = r.replace(/'s\b/, "");
    const a = r.split(/ /);
    a.length > 1 && (n[a[0]] === void 0 || a.length > n[a[0]]) && (n[a[0]] = a.length), t[r] = t[r] || o;
  }), delete t[""], delete t[null], delete t[" "], { lex: t, _multi: n };
}, Ys = {
  one: {
    expandLexicon: Xs
  }
}, eu = function(e, t = !1) {
  const n = this.world(), { methods: r, model: o } = n;
  if (!e)
    return;
  if (Object.keys(e).forEach((s) => {
    typeof e[s] == "string" && e[s].startsWith("#") && (e[s] = e[s].replace(/^#/, ""));
  }), t === !0) {
    const { lex: s, _multi: u } = r.one.expandLexicon(e, n);
    Object.assign(o.one._multiCache, u), Object.assign(o.one.frozenLex, s);
    return;
  }
  if (r.two.expandLexicon) {
    const { lex: s, _multi: u } = r.two.expandLexicon(e, n);
    Object.assign(o.one.lexicon, s), Object.assign(o.one._multiCache, u);
  }
  const { lex: a, _multi: i } = r.one.expandLexicon(e, n);
  Object.assign(o.one.lexicon, a), Object.assign(o.one._multiCache, i);
}, tu = { addWords: eu }, nu = {
  one: {
    lexicon: {},
    //setup blank lexicon
    _multiCache: {},
    frozenLex: {}
    //2nd lexicon
  }
}, ru = {
  model: nu,
  methods: Ys,
  compute: Zs,
  lib: tu,
  hooks: ["lexicon"]
}, ou = function(e, t) {
  const { methods: n, model: r } = t;
  return n.one.tokenize.splitTerms(e, r).map((a) => n.one.tokenize.splitWhitespace(a, r)).map((a) => a.text.toLowerCase());
}, pa = function(e, t) {
  const n = [{}], r = [null], o = [0], a = [];
  let i = 0;
  e.forEach(function(s) {
    let u = 0;
    const l = ou(s, t);
    for (let c = 0; c < l.length; c++) {
      const h = l[c];
      n[u] && n[u].hasOwnProperty(h) ? u = n[u][h] : (i++, n[u][h] = i, n[i] = {}, u = i, r[i] = null);
    }
    r[u] = [l.length];
  });
  for (const s in n[0])
    i = n[0][s], o[i] = 0, a.push(i);
  for (; a.length; ) {
    const s = a.shift(), u = Object.keys(n[s]);
    for (let l = 0; l < u.length; l += 1) {
      const c = u[l], h = n[s][c];
      for (a.push(h), i = o[s]; i > 0 && !n[i].hasOwnProperty(c); )
        i = o[i];
      if (n.hasOwnProperty(i)) {
        const f = n[i][c];
        o[h] = f, r[f] && (r[h] = r[h] || [], r[h] = r[h].concat(r[f]));
      } else
        o[h] = 0;
    }
  }
  return { goNext: n, endAs: r, failTo: o };
}, au = function(e, t, n) {
  let r = 0;
  const o = [];
  for (let a = 0; a < e.length; a++) {
    const i = e[a][n.form] || e[a].normal;
    for (; r > 0 && (t.goNext[r] === void 0 || !t.goNext[r].hasOwnProperty(i)); )
      r = t.failTo[r] || 0;
    if (t.goNext[r].hasOwnProperty(i) && (r = t.goNext[r][i], t.endAs[r])) {
      const s = t.endAs[r];
      for (let u = 0; u < s.length; u++) {
        const l = s[u], c = e[a - l + 1], [h, f] = c.index;
        o.push([h, f, f + l, c.id]);
      }
    }
  }
  return o;
}, iu = function(e, t) {
  for (let n = 0; n < e.length; n += 1)
    if (t.has(e[n]) === !0)
      return !1;
  return !0;
}, su = function(e, t, n) {
  let r = [];
  n.form = n.form || "normal";
  const o = e.docs;
  if (!t.goNext || !t.goNext[0])
    return console.error("Compromise invalid lookup trie"), e.none();
  const a = Object.keys(t.goNext[0]);
  for (let i = 0; i < o.length; i++) {
    if (e._cache && e._cache[i] && iu(a, e._cache[i]) === !0)
      continue;
    const s = o[i], u = au(s, t, n);
    u.length > 0 && (r = r.concat(u));
  }
  return e.update(r);
}, uu = (e) => Object.prototype.toString.call(e) === "[object Object]";
function cu(e) {
  e.prototype.lookup = function(t, n = {}) {
    if (!t)
      return this.none();
    typeof t == "string" && (t = [t]);
    const r = uu(t) ? t : pa(t, this.world);
    let o = su(this, r, n);
    return o = o.settle(), o;
  };
}
const nn = (e, t) => {
  for (let n = e.length - 1; n >= 0; n -= 1)
    if (e[n] !== t)
      return e = e.slice(0, n + 1), e;
  return e;
}, lu = function(e) {
  return e.goNext = e.goNext.map((t) => {
    if (Object.keys(t).length !== 0)
      return t;
  }), e.goNext = nn(e.goNext, void 0), e.failTo = nn(e.failTo, 0), e.endAs = nn(e.endAs, null), e;
}, Cn = {
  /** turn an array or object into a compressed trie*/
  buildTrie: function(e) {
    const t = pa(e, this.world());
    return lu(t);
  }
};
Cn.compile = Cn.buildTrie;
const hu = {
  api: cu,
  lib: Cn
}, wr = function(e, t) {
  return t && e.forEach((n) => {
    const r = n[0];
    t[r] && (n[0] = t[r][0], n[1] += t[r][1], n[2] += t[r][1]);
  }), e;
}, ga = function(e, t) {
  let { ptrs: n } = e;
  const { byGroup: r } = e;
  return n = wr(n, t), Object.keys(r).forEach((o) => {
    r[o] = wr(r[o], t);
  }), { ptrs: n, byGroup: r };
}, mt = function(e, t, n) {
  const r = n.methods.one;
  return typeof e == "number" && (e = String(e)), typeof e == "string" && (e = r.killUnicode(e, n), e = r.parseMatch(e, t, n)), e;
}, ma = (e) => Object.prototype.toString.call(e) === "[object Object]", yt = (e) => e && ma(e) && e.isView === !0, bt = (e) => e && ma(e) && e.isNet === !0, du = function(e, t, n) {
  const r = this.methods.one;
  if (yt(e))
    return this.intersection(e);
  if (bt(e))
    return this.sweep(e, { tagger: !1 }).view.settle();
  e = mt(e, n, this.world);
  const o = { regs: e, group: t }, a = r.match(this.docs, o, this._cache), { ptrs: i, byGroup: s } = ga(a, this.fullPointer), u = this.toView(i);
  return u._groups = s, u;
}, fu = function(e, t, n) {
  const r = this.methods.one;
  if (yt(e))
    return this.intersection(e).eq(0);
  if (bt(e))
    return this.sweep(e, { tagger: !1, matchOne: !0 }).view;
  e = mt(e, n, this.world);
  const o = { regs: e, group: t, justOne: !0 }, a = r.match(this.docs, o, this._cache), { ptrs: i, byGroup: s } = ga(a, this.fullPointer), u = this.toView(i);
  return u._groups = s, u;
}, pu = function(e, t, n) {
  const r = this.methods.one;
  if (yt(e))
    return this.intersection(e).fullPointer.length > 0;
  if (bt(e))
    return this.sweep(e, { tagger: !1 }).view.found;
  e = mt(e, n, this.world);
  const o = { regs: e, group: t, justOne: !0 };
  return r.match(this.docs, o, this._cache).ptrs.length > 0;
}, gu = function(e, t, n) {
  const r = this.methods.one;
  if (yt(e))
    return this.filter((u) => u.intersection(e).found);
  if (bt(e)) {
    const u = this.sweep(e, { tagger: !1 }).view.settle();
    return this.if(u);
  }
  e = mt(e, n, this.world);
  const o = { regs: e, group: t, justOne: !0 };
  let a = this.fullPointer;
  const i = this._cache || [];
  a = a.filter((u, l) => {
    const c = this.update([u]);
    return r.match(c.docs, o, i[l]).ptrs.length > 0;
  });
  const s = this.update(a);
  return this._cache && (s._cache = a.map((u) => i[u[0]])), s;
}, mu = function(e, t, n) {
  const { methods: r } = this, o = r.one;
  if (yt(e))
    return this.filter((s) => !s.intersection(e).found);
  if (bt(e)) {
    const s = this.sweep(e, { tagger: !1 }).view.settle();
    return this.ifNo(s);
  }
  e = mt(e, n, this.world);
  const a = this._cache || [], i = this.filter((s, u) => {
    const l = { regs: e, group: t, justOne: !0 };
    return o.match(s.docs, l, a[u]).ptrs.length === 0;
  });
  return this._cache && (i._cache = i.ptrs.map((s) => a[s[0]])), i;
}, yu = { matchOne: fu, match: du, has: pu, if: gu, ifNo: mu }, bu = function(e, t, n) {
  const { indexN: r } = this.methods.one.pointer, o = [], a = r(this.fullPointer);
  Object.keys(a).forEach((s) => {
    const u = a[s].sort((l, c) => l[1] > c[1] ? 1 : -1)[0];
    u[1] > 0 && o.push([u[0], 0, u[1]]);
  });
  const i = this.toView(o);
  return e ? i.match(e, t, n) : i;
}, vu = function(e, t, n) {
  const { indexN: r } = this.methods.one.pointer, o = [], a = r(this.fullPointer), i = this.document;
  Object.keys(a).forEach((u) => {
    const l = a[u].sort((f, w) => f[1] > w[1] ? -1 : 1)[0], [c, , h] = l;
    h < i[c].length && o.push([c, h, i[c].length]);
  });
  const s = this.toView(o);
  return e ? s.match(e, t, n) : s;
}, wu = function(e, t, n) {
  typeof e == "string" && (e = this.world.methods.one.parseMatch(e, n, this.world)), e[e.length - 1].end = !0;
  const r = this.fullPointer;
  return this.forEach((o, a) => {
    const i = o.before(e, t);
    if (i.found) {
      const s = i.terms();
      r[a][1] -= s.length, r[a][3] = s.docs[0][0].id;
    }
  }), this.update(r);
}, Pu = function(e, t, n) {
  typeof e == "string" && (e = this.world.methods.one.parseMatch(e, n, this.world)), e[0].start = !0;
  const r = this.fullPointer;
  return this.forEach((o, a) => {
    const i = o.after(e, t);
    if (i.found) {
      const s = i.terms();
      r[a][2] += s.length, r[a][4] = null;
    }
  }), this.update(r);
}, ku = function(e, t, n) {
  return this.growRight(e, t, n).growLeft(e, t, n);
}, Au = { before: bu, after: vu, growLeft: wu, growRight: Pu, grow: ku }, ya = function(e, t) {
  return [e[0], e[1], t[2]];
}, Cu = function(e) {
  return Object.prototype.toString.call(e) === "[object Array]";
}, Jn = (e, t, n) => typeof e == "string" || Cu(e) ? t.match(e, n) : e || t.none(), Un = function(e, t) {
  const [n, r, o] = e;
  return t.document[n] && t.document[n][r] && (e[3] = e[3] || t.document[n][r].id, t.document[n][o - 1] && (e[4] = e[4] || t.document[n][o - 1].id)), e;
}, rt = {};
rt.splitOn = function(e, t) {
  const { splitAll: n } = this.methods.one.pointer, r = Jn(e, this, t).fullPointer, o = n(this.fullPointer, r);
  let a = [];
  return o.forEach((i) => {
    a.push(i.passthrough), a.push(i.before), a.push(i.match), a.push(i.after);
  }), a = a.filter((i) => i), a = a.map((i) => Un(i, this)), this.update(a);
};
rt.splitBefore = function(e, t) {
  const { splitAll: n } = this.methods.one.pointer, r = Jn(e, this, t).fullPointer, o = n(this.fullPointer, r);
  for (let i = 0; i < o.length; i += 1)
    !o[i].after && o[i + 1] && o[i + 1].before && o[i].match && o[i].match[0] === o[i + 1].before[0] && (o[i].after = o[i + 1].before, delete o[i + 1].before);
  let a = [];
  return o.forEach((i) => {
    a.push(i.passthrough), a.push(i.before), i.match && i.after ? a.push(ya(i.match, i.after)) : a.push(i.match);
  }), a = a.filter((i) => i), a = a.map((i) => Un(i, this)), this.update(a);
};
rt.splitAfter = function(e, t) {
  const { splitAll: n } = this.methods.one.pointer, r = Jn(e, this, t).fullPointer, o = n(this.fullPointer, r);
  let a = [];
  return o.forEach((i) => {
    a.push(i.passthrough), i.before && i.match ? a.push(ya(i.before, i.match)) : (a.push(i.before), a.push(i.match)), a.push(i.after);
  }), a = a.filter((i) => i), a = a.map((i) => Un(i, this)), this.update(a);
};
rt.split = rt.splitAfter;
const Nu = function(e, t) {
  return !e || !t || e[0] !== t[0] ? !1 : e[2] === t[1];
}, Pr = function(e, t, n) {
  const r = e.world, o = r.methods.one.parseMatch;
  t = t || ".$", n = n || "^.";
  const a = o(t, {}, r), i = o(n, {}, r);
  a[a.length - 1].end = !0, i[0].start = !0;
  const s = e.fullPointer, u = [s[0]];
  for (let l = 1; l < s.length; l += 1) {
    const c = u[u.length - 1], h = s[l], f = e.update([c]), w = e.update([h]);
    Nu(c, h) && f.has(a) && w.has(i) ? u[u.length - 1] = [c[0], c[1], h[2], c[3], h[4]] : u.push(h);
  }
  return e.update(u);
}, xu = {
  //  merge only if conditions are met
  joinIf: function(e, t) {
    return Pr(this, e, t);
  },
  // merge all neighbouring matches
  join: function() {
    return Pr(this);
  }
}, de = Object.assign({}, yu, Au, rt, xu);
de.lookBehind = de.before;
de.lookBefore = de.before;
de.lookAhead = de.after;
de.lookAfter = de.after;
de.notIf = de.ifNo;
const ju = function(e) {
  Object.assign(e.prototype, de);
}, Tu = /(?:^|\s)([![^]*(?:<[^<]*>)?\/.*?[^\\/]\/[?\]+*$~]*)(?:\s|$)/, Iu = /([!~[^]*(?:<[^<]*>)?\([^)]+[^\\)]\)[?\]+*$~]*)(?:\s|$)/, $u = / /g, Du = (e) => /^[![^]*(<[^<]*>)?\(/.test(e) && /\)[?\]+*$~]*$/.test(e), kr = (e) => /^[![^]*(<[^<]*>)?\//.test(e) && /\/[?\]+*$~]*$/.test(e), Ar = function(e) {
  return e = e.map((t) => t.trim()), e = e.filter((t) => t), e;
}, Hu = function(e) {
  const t = e.split(Tu);
  let n = [];
  t.forEach((o) => {
    if (kr(o)) {
      n.push(o);
      return;
    }
    n = n.concat(o.split(Iu));
  }), n = Ar(n);
  let r = [];
  return n.forEach((o) => {
    Du(o) || kr(o) ? r.push(o) : r = r.concat(o.split($u));
  }), r = Ar(r), r;
}, Cr = /\{([0-9]+)?(, *[0-9]*)?\}/, Nr = /&&/, Eu = new RegExp(/^<\s*(\S+)\s*>/), xr = (e) => e.charAt(0).toUpperCase() + e.substring(1), te = (e) => e.charAt(e.length - 1), Q = (e) => e.charAt(0), Ye = (e) => e.substring(1), et = (e) => e.substring(0, e.length - 1), st = function(e) {
  return e = Ye(e), e = et(e), e;
}, ba = function(e, t) {
  const n = {};
  for (let r = 0; r < 2; r += 1) {
    if (te(e) === "$" && (n.end = !0, e = et(e)), Q(e) === "^" && (n.start = !0, e = Ye(e)), te(e) === "?" && (n.optional = !0, e = et(e)), (Q(e) === "[" || te(e) === "]") && (n.group = null, Q(e) === "[" && (n.groupStart = !0), te(e) === "]" && (n.groupEnd = !0), e = e.replace(/^\[/, ""), e = e.replace(/\]$/, ""), Q(e) === "<")) {
      const o = Eu.exec(e);
      o.length >= 2 && (n.group = o[1], e = e.replace(o[0], ""));
    }
    if (te(e) === "+" && (n.greedy = !0, e = et(e)), e !== "*" && te(e) === "*" && e !== "\\*" && (n.greedy = !0, e = et(e)), Q(e) === "!" && (n.negative = !0, e = Ye(e)), Q(e) === "~" && te(e) === "~" && e.length > 2 && (e = st(e), n.fuzzy = !0, n.min = t.fuzzy || 0.85, /\(/.test(e) === !1))
      return n.word = e, n;
    if (Q(e) === "/" && te(e) === "/")
      return e = st(e), t.caseSensitive && (n.use = "text"), n.regex = new RegExp(e), n;
    if (Cr.test(e) === !0 && (e = e.replace(Cr, (o, a, i) => (i === void 0 ? (n.min = Number(a), n.max = Number(a)) : (i = i.replace(/, */, ""), a === void 0 ? (n.min = 0, n.max = Number(i)) : (n.min = Number(a), n.max = Number(i || 999))), n.greedy = !0, n.min || (n.optional = !0), ""))), Q(e) === "(" && te(e) === ")") {
      Nr.test(e) ? (n.choices = e.split(Nr), n.operator = "and") : (n.choices = e.split("|"), n.operator = "or"), n.choices[0] = Ye(n.choices[0]);
      const o = n.choices.length - 1;
      n.choices[o] = et(n.choices[o]), n.choices = n.choices.map((a) => a.trim()), n.choices = n.choices.filter((a) => a), n.choices = n.choices.map((a) => a.split(/ /g).map((i) => ba(i, t))), e = "";
    }
    if (Q(e) === "{" && te(e) === "}") {
      if (e = st(e), n.root = e, /\//.test(e)) {
        const o = n.root.split(/\//);
        n.root = o[0], n.pos = o[1], n.pos === "adj" && (n.pos = "Adjective"), n.pos = n.pos.charAt(0).toUpperCase() + n.pos.substr(1).toLowerCase(), o[2] !== void 0 && (n.sense = o[2]);
      }
      return n;
    }
    if (Q(e) === "<" && te(e) === ">")
      return e = st(e), n.chunk = xr(e), n.greedy = !0, n;
    if (Q(e) === "%" && te(e) === "%")
      return e = st(e), n.switch = e, n;
  }
  return Q(e) === "#" ? (n.tag = Ye(e), n.tag = xr(n.tag), n) : Q(e) === "@" ? (n.method = Ye(e), n) : e === "." ? (n.anything = !0, n) : e === "*" ? (n.anything = !0, n.greedy = !0, n.optional = !0, n) : (e && (e = e.replace("\\*", "*"), e = e.replace("\\.", "."), t.caseSensitive ? n.use = "text" : e = e.toLowerCase(), n.word = e), n);
}, Gu = /[a-z0-9][-–—][a-z]/i, Ou = function(e, t) {
  const n = t.model.one.prefixes;
  for (let r = e.length - 1; r >= 0; r -= 1) {
    const o = e[r];
    if (o.word && Gu.test(o.word)) {
      let a = o.word.split(/[-–—]/g);
      if (n.hasOwnProperty(a[0]))
        continue;
      a = a.filter((i) => i).reverse(), e.splice(r, 1), a.forEach((i) => {
        const s = Object.assign({}, o);
        s.word = i, e.splice(r, 0, s);
      });
    }
  }
  return e;
}, jr = function(e, t) {
  const { all: n } = t.methods.two.transform.verb || {}, r = e.root;
  return n ? n(r, t.model) : [];
}, Tr = function(e, t) {
  const { all: n } = t.methods.two.transform.noun || {};
  return n ? n(e.root, t.model) : [e.root];
}, Ir = function(e, t) {
  const { all: n } = t.methods.two.transform.adjective || {};
  return n ? n(e.root, t.model) : [e.root];
}, Fu = function(e, t) {
  return e = e.map((n) => {
    if (n.root)
      if (t.methods.two && t.methods.two.transform) {
        let r = [];
        n.pos ? n.pos === "Verb" ? r = r.concat(jr(n, t)) : n.pos === "Noun" ? r = r.concat(Tr(n, t)) : n.pos === "Adjective" && (r = r.concat(Ir(n, t))) : (r = r.concat(jr(n, t)), r = r.concat(Tr(n, t)), r = r.concat(Ir(n, t))), r = r.filter((o) => o), r.length > 0 && (n.operator = "or", n.fastOr = new Set(r));
      } else
        n.machine = n.root, delete n.id, delete n.root;
    return n;
  }), e;
}, zu = function(e) {
  let t = 0, n = null;
  for (let r = 0; r < e.length; r++) {
    const o = e[r];
    o.groupStart === !0 && (n = o.group, n === null && (n = String(t), t += 1)), n !== null && (o.group = n), o.groupEnd === !0 && (n = null);
  }
  return e;
}, Vu = function(e) {
  return e.map((t) => {
    if (t.choices !== void 0) {
      if (t.operator !== "or" || t.fuzzy === !0)
        return t;
      t.choices.every((r) => {
        if (r.length !== 1)
          return !1;
        const o = r[0];
        return o.fuzzy === !0 || o.start || o.end ? !1 : o.word !== void 0 && o.negative !== !0 && o.optional !== !0 && o.method !== !0;
      }) === !0 && (t.fastOr = /* @__PURE__ */ new Set(), t.choices.forEach((r) => {
        t.fastOr.add(r[0].word);
      }), delete t.choices);
    }
    return t;
  });
}, Bu = function(e) {
  return e.map((t) => (t.fuzzy && t.choices && t.choices.forEach((n) => {
    n.length === 1 && n[0].word && (n[0].fuzzy = !0, n[0].min = t.min);
  }), t));
}, Su = function(e) {
  return e = zu(e), e = Vu(e), e = Bu(e), e;
}, Mu = function(e, t, n) {
  if (e == null || e === "")
    return [];
  t = t || {}, typeof e == "number" && (e = String(e));
  let r = Hu(e);
  return r = r.map((o) => ba(o, t)), r = Ou(r, n), r = Fu(r, n), r = Su(r), r;
}, Lu = function(e, t) {
  for (const n of t)
    if (e.has(n))
      return !0;
  return !1;
}, Ku = function(e, t) {
  for (let n = 0; n < e.length; n += 1) {
    const r = e[n];
    if (!(r.optional === !0 || r.negative === !0 || r.fuzzy === !0)) {
      if (r.word !== void 0 && t.has(r.word) === !1 || r.tag !== void 0 && t.has("#" + r.tag) === !1)
        return !0;
      if (r.fastOr && Lu(r.fastOr, t) === !1)
        return !1;
    }
  }
  return !1;
}, Wu = function(e, t) {
  const n = e.length, r = t.length;
  if (n === 0)
    return r;
  if (r === 0)
    return n;
  const o = (r > n ? r : n) + 1;
  if (Math.abs(n - r) > (o || 100))
    return o || 100;
  const a = [];
  for (let f = 0; f < o; f++)
    a[f] = [f], a[f].length = o;
  for (let f = 0; f < o; f++)
    a[0][f] = f;
  let i, s, u, l, c, h;
  for (let f = 1; f <= n; ++f)
    for (s = e[f - 1], i = 1; i <= r; ++i) {
      if (f === i && a[f][i] > 4)
        return n;
      u = t[i - 1], l = s === u ? 0 : 1, c = a[f - 1][i] + 1, (h = a[f][i - 1] + 1) < c && (c = h), (h = a[f - 1][i - 1] + l) < c && (c = h), f > 1 && i > 1 && s === t[i - 2] && e[f - 2] === u && (h = a[f - 2][i - 2] + l) < c ? a[f][i] = h : a[f][i] = c;
    }
  return a[n][r];
}, Ju = function(e, t, n = 3) {
  if (e === t)
    return 1;
  if (e.length < n || t.length < n)
    return 0;
  const r = Wu(e, t), o = Math.max(e.length, t.length);
  return 1 - (o === 0 ? 0 : r / o);
}, Uu = /([\u0022\uFF02\u0027\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F])/, qu = /([\u0022\uFF02\u0027\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4])/, $r = /^[-–—]$/, Dr = / [-–—]{1,3} /, fe = (e, t) => e.post.indexOf(t) !== -1, ft = {
  /** does it have a quotation symbol?  */
  hasQuote: (e) => Uu.test(e.pre) || qu.test(e.post),
  /** does it have a comma?  */
  hasComma: (e) => fe(e, ","),
  /** does it end in a period? */
  hasPeriod: (e) => fe(e, ".") === !0 && fe(e, "...") === !1,
  /** does it end in an exclamation */
  hasExclamation: (e) => fe(e, "!"),
  /** does it end with a question mark? */
  hasQuestionMark: (e) => fe(e, "?") || fe(e, "¿"),
  /** is there a ... at the end? */
  hasEllipses: (e) => fe(e, "..") || fe(e, "…"),
  /** is there a semicolon after term word? */
  hasSemicolon: (e) => fe(e, ";"),
  /** is there a colon after term word? */
  hasColon: (e) => fe(e, ":"),
  /** is there a slash '/' in term word? */
  hasSlash: (e) => /\//.test(e.text),
  /** a hyphen connects two words like-term */
  hasHyphen: (e) => $r.test(e.post) || $r.test(e.pre),
  /** a dash separates words - like that */
  hasDash: (e) => Dr.test(e.post) || Dr.test(e.pre),
  /** is it multiple words combinded */
  hasContraction: (e) => !!e.implicit,
  /** is it an acronym */
  isAcronym: (e) => e.tags.has("Acronym"),
  /** does it have any tags */
  isKnown: (e) => e.tags.size > 0,
  /** uppercase first letter, then a lowercase */
  isTitleCase: (e) => new RegExp("^\\p{Lu}[a-z'\\u00C0-\\u00FF]", "u").test(e.text),
  /** uppercase all letters */
  isUpperCase: (e) => new RegExp("^\\p{Lu}+$", "u").test(e.text)
};
ft.hasQuotation = ft.hasQuote;
let S = function() {
};
const Ru = function(e, t, n, r) {
  if (t.anything === !0)
    return !0;
  if (t.start === !0 && n !== 0 || t.end === !0 && n !== r - 1)
    return !1;
  if (t.id !== void 0 && t.id === e.id)
    return !0;
  if (t.word !== void 0)
    return t.use ? t.word === e[t.use] : e.machine !== null && e.machine === t.word || e.alias !== void 0 && e.alias.hasOwnProperty(t.word) || t.fuzzy === !0 && (t.word === e.root || Ju(t.word, e.normal) >= t.min) || e.alias && e.alias.some((o) => o === t.word) ? !0 : t.word === e.text || t.word === e.normal;
  if (t.tag !== void 0)
    return e.tags.has(t.tag) === !0;
  if (t.method !== void 0)
    return typeof ft[t.method] == "function" && ft[t.method](e) === !0;
  if (t.pre !== void 0)
    return e.pre && e.pre.includes(t.pre);
  if (t.post !== void 0)
    return e.post && e.post.includes(t.post);
  if (t.regex !== void 0) {
    let o = e.normal;
    return t.use && (o = e[t.use]), t.regex.test(o);
  }
  if (t.chunk !== void 0)
    return e.chunk === t.chunk;
  if (t.switch !== void 0)
    return e.switch === t.switch;
  if (t.machine !== void 0)
    return e.normal === t.machine || e.machine === t.machine || e.root === t.machine;
  if (t.sense !== void 0)
    return e.sense === t.sense;
  if (t.fastOr !== void 0) {
    if (t.pos && !e.tags.has(t.pos))
      return null;
    const o = e.root || e.implicit || e.machine || e.normal;
    return t.fastOr.has(o) || t.fastOr.has(e.text);
  }
  return t.choices !== void 0 ? t.operator === "and" ? t.choices.every((o) => S(e, o, n, r)) : t.choices.some((o) => S(e, o, n, r)) : !1;
};
S = function(e, t, n, r) {
  const o = Ru(e, t, n, r);
  return t.negative === !0 ? !o : o;
};
const Qu = function(e, t) {
  const n = Object.assign({}, e.regs[e.r], { start: !1, end: !1 }), r = e.t;
  for (; e.t < e.terms.length; e.t += 1) {
    if (t && S(e.terms[e.t], t, e.start_i + e.t, e.phrase_length))
      return e.t;
    const o = e.t - r + 1;
    if (n.max !== void 0 && o === n.max)
      return e.t;
    if (S(e.terms[e.t], n, e.start_i + e.t, e.phrase_length) === !1)
      return n.min !== void 0 && o < n.min ? null : e.t;
  }
  return e.t;
}, _u = function(e, t) {
  let n = e.t;
  if (!t)
    return e.terms.length;
  for (; n < e.terms.length; n += 1)
    if (S(e.terms[n], t, e.start_i + n, e.phrase_length) === !0)
      return n;
  return null;
}, Zu = function(e, t) {
  if (e.end === !0 && e.greedy === !0 && t.start_i + t.t < t.phrase_length - 1) {
    const n = Object.assign({}, e, { end: !1 });
    if (S(t.terms[t.t], n, t.start_i + t.t, t.phrase_length) === !0)
      return !0;
  }
  return !1;
}, Qt = function(e, t) {
  return e.groups[e.inGroup] || (e.groups[e.inGroup] = {
    start: t,
    length: 0
  }), e.groups[e.inGroup];
}, Xu = function(e) {
  const { regs: t } = e, n = t[e.r], r = _u(e, t[e.r + 1]);
  if (r === null || r === 0 || n.min !== void 0 && r - e.t < n.min)
    return null;
  if (n.max !== void 0 && r - e.t > n.max)
    return e.t = e.t + n.max, !0;
  if (e.hasGroup === !0) {
    const o = Qt(e, e.t);
    o.length = r - e.t;
  }
  return e.t = r, !0;
}, Yu = function(e) {
  return Object.prototype.toString.call(e) === "[object Array]";
}, va = function(e, t = 0) {
  const n = e.regs[e.r];
  let r = !1;
  for (let o = 0; o < n.choices.length; o += 1) {
    const a = n.choices[o];
    if (!Yu(a))
      return !1;
    if (r = a.every((i, s) => {
      let u = 0;
      const l = e.t + s + t + u;
      if (e.terms[l] === void 0)
        return !1;
      const c = S(e.terms[l], i, l + e.start_i, e.phrase_length);
      if (c === !0 && i.greedy === !0)
        for (let h = 1; h < e.terms.length; h += 1) {
          const f = e.terms[l + h];
          if (f)
            if (S(f, i, e.start_i + h, e.phrase_length) === !0)
              u += 1;
            else
              break;
        }
      return t += u, c;
    }), r) {
      t += a.length;
      break;
    }
  }
  return r && n.greedy === !0 ? va(e, t) : t;
}, ec = function(e) {
  let t = 0;
  return e.regs[e.r].choices.every((o) => {
    const a = o.every((i, s) => {
      const u = e.t + s;
      return e.terms[u] === void 0 ? !1 : S(e.terms[u], i, u, e.phrase_length);
    });
    return a === !0 && o.length > t && (t = o.length), a;
  }) === !0 ? t : !1;
}, tc = function(e) {
  const { regs: t } = e, n = t[e.r], r = va(e);
  if (r) {
    if (n.negative === !0)
      return null;
    if (e.hasGroup === !0) {
      const o = Qt(e, e.t);
      o.length += r;
    }
    if (n.end === !0) {
      const o = e.phrase_length;
      if (e.t + e.start_i + r !== o)
        return null;
    }
    return e.t += r, !0;
  } else if (!n.optional)
    return null;
  return !0;
}, nc = function(e) {
  const { regs: t } = e, n = t[e.r], r = ec(e);
  if (r) {
    if (n.negative === !0)
      return null;
    if (e.hasGroup === !0) {
      const o = Qt(e, e.t);
      o.length += r;
    }
    if (n.end === !0) {
      const o = e.phrase_length - 1;
      if (e.t + e.start_i !== o)
        return null;
    }
    return e.t += r, !0;
  } else if (!n.optional)
    return null;
  return !0;
}, rc = function(e, t, n) {
  let r = 0;
  for (let o = e.t; o < e.terms.length; o += 1) {
    let a = S(e.terms[o], t, e.start_i + e.t, e.phrase_length);
    if (a || n && (a = S(e.terms[o], n, e.start_i + e.t, e.phrase_length), a) || (r += 1, t.max !== void 0 && r === t.max))
      break;
  }
  return r === 0 || t.min && t.min > r ? !1 : (e.t += r, !0);
}, oc = function(e) {
  const { regs: t } = e, n = t[e.r], r = Object.assign({}, n);
  if (r.negative = !1, S(e.terms[e.t], r, e.start_i + e.t, e.phrase_length))
    return !1;
  if (n.optional) {
    const a = t[e.r + 1];
    a && (S(e.terms[e.t], a, e.start_i + e.t, e.phrase_length) ? e.r += 1 : a.optional && t[e.r + 2] && S(e.terms[e.t], t[e.r + 2], e.start_i + e.t, e.phrase_length) && (e.r += 2));
  }
  return n.greedy ? rc(e, r, t[e.r + 1]) : (e.t += 1, !0);
}, ac = function(e) {
  const { regs: t } = e, n = t[e.r], r = e.terms[e.t], o = S(r, t[e.r + 1], e.start_i + e.t, e.phrase_length);
  if (n.negative || o) {
    const a = e.terms[e.t + 1];
    (!a || !S(a, t[e.r + 1], e.start_i + e.t, e.phrase_length)) && (e.r += 1);
  }
}, ic = function(e) {
  const { regs: t, phrase_length: n } = e, r = t[e.r];
  return e.t = Qu(e, t[e.r + 1]), e.t === null || r.min && r.min > e.t || r.end === !0 && e.start_i + e.t !== n ? null : !0;
}, sc = function(e) {
  const t = e.terms[e.t], n = e.regs[e.r];
  if (t.implicit && e.terms[e.t + 1]) {
    if (!e.terms[e.t + 1].implicit)
      return;
    n.word === t.normal && (e.t += 1), n.method === "hasContraction" && (e.t += 1);
  }
}, uc = function(e, t) {
  const n = e.regs[e.r], r = Qt(e, t);
  e.t > 1 && n.greedy ? r.length += e.t - t : r.length++;
}, rn = function(e) {
  const { regs: t } = e, n = t[e.r], r = e.terms[e.t], o = e.t;
  return n.optional && t[e.r + 1] && n.negative ? !0 : (n.optional && t[e.r + 1] && ac(e), r.implicit && e.terms[e.t + 1] && sc(e), e.t += 1, n.end === !0 && e.t !== e.terms.length && n.greedy !== !0 || n.greedy === !0 && !ic(e) ? null : (e.hasGroup === !0 && uc(e, o), !0));
}, qn = function(e, t, n, r) {
  if (e.length === 0 || t.length === 0)
    return null;
  const o = {
    t: 0,
    terms: e,
    r: 0,
    regs: t,
    groups: {},
    start_i: n,
    phrase_length: r,
    inGroup: null
  };
  for (; o.r < t.length; o.r += 1) {
    const s = t[o.r];
    if (o.hasGroup = !!s.group, o.hasGroup === !0 ? o.inGroup = s.group : o.inGroup = null, !o.terms[o.t]) {
      if (t.slice(o.r).some((c) => !c.optional) === !1)
        break;
      return null;
    }
    if (s.anything === !0 && s.greedy === !0) {
      if (!Xu(o))
        return null;
      continue;
    }
    if (s.choices !== void 0 && s.operator === "or") {
      if (!tc(o))
        return null;
      continue;
    }
    if (s.choices !== void 0 && s.operator === "and") {
      if (!nc(o))
        return null;
      continue;
    }
    if (s.anything === !0) {
      if (s.negative && s.anything || !rn(o))
        return null;
      continue;
    }
    if (Zu(s, o) === !0) {
      if (!rn(o))
        return null;
      continue;
    }
    if (s.negative) {
      if (!oc(o))
        return null;
      continue;
    }
    if (S(o.terms[o.t], s, o.start_i + o.t, o.phrase_length) === !0) {
      if (!rn(o))
        return null;
      continue;
    }
    if (s.optional !== !0)
      return null;
  }
  const a = [null, n, o.t + n];
  if (a[1] === a[2])
    return null;
  const i = {};
  return Object.keys(o.groups).forEach((s) => {
    const u = o.groups[s], l = n + u.start;
    i[s] = [null, l, l + u.length];
  }), { pointer: a, groups: i };
}, cc = function(e, t) {
  const n = [], r = {};
  return e.length === 0 ? { ptrs: n, byGroup: r } : (typeof t == "number" && (t = String(t)), t ? e.forEach((o) => {
    o.groups[t] && n.push(o.groups[t]);
  }) : e.forEach((o) => {
    n.push(o.pointer), Object.keys(o.groups).forEach((a) => {
      r[a] = r[a] || [], r[a].push(o.groups[a]);
    });
  }), { ptrs: n, byGroup: r });
}, lc = function(e, t, n) {
  return e = e.filter((r) => {
    const [o, a, i] = r.pointer, s = n[o].slice(a, i);
    for (let u = 0; u < s.length; u += 1) {
      const l = s.slice(u);
      if (qn(l, t, u, s.length) !== null)
        return !1;
    }
    return !0;
  }), e;
}, wa = function(e, t) {
  return e.pointer[0] = t, Object.keys(e.groups).forEach((n) => {
    e.groups[n][0] = t;
  }), e;
}, hc = function(e, t, n) {
  let r = qn(e, t, 0, e.length);
  return r ? (r = wa(r, n), r) : null;
}, dc = function(e, t, n) {
  n = n || [];
  const { regs: r, group: o, justOne: a } = t;
  let i = [];
  if (!r || r.length === 0)
    return { ptrs: [], byGroup: {} };
  const s = r.filter((u) => u.optional !== !0 && u.negative !== !0).length;
  e: for (let u = 0; u < e.length; u += 1) {
    const l = e[u];
    if (!(n[u] && Ku(r, n[u]))) {
      if (r[0].start === !0) {
        const c = hc(l, r, u);
        c && i.push(c);
        continue;
      }
      for (let c = 0; c < l.length; c += 1) {
        const h = l.slice(c);
        if (h.length < s)
          break;
        let f = qn(h, r, c, l.length);
        if (f) {
          if (f = wa(f, u), i.push(f), a === !0)
            break e;
          const w = f.pointer[2];
          Math.abs(w - 1) > c && (c = Math.abs(w - 1));
        }
      }
    }
  }
  return r[r.length - 1].end === !0 && (i = i.filter((u) => {
    const l = u.pointer[0];
    return e[l].length === u.pointer[2];
  })), t.notIf && (i = lc(i, t.notIf, e)), i = cc(i, o), i.ptrs.forEach((u) => {
    const [l, c, h] = u;
    u[3] = e[l][c].id, u[4] = e[l][h - 1].id;
  }), i;
}, fc = {
  one: {
    termMethods: ft,
    parseMatch: Mu,
    match: dc
  }
}, pc = {
  /** pre-parse any match statements */
  parseMatch: function(e, t) {
    const n = this.world(), r = n.methods.one.killUnicode;
    return r && (e = r(e, n)), n.methods.one.parseMatch(e, t, n);
  }
}, gc = {
  api: ju,
  methods: fc,
  lib: pc
}, mc = /^\../, yc = /^#./, bc = (e) => (e = e.replace(/&/g, "&amp;"), e = e.replace(/</g, "&lt;"), e = e.replace(/>/g, "&gt;"), e = e.replace(/"/g, "&quot;"), e = e.replace(/'/g, "&apos;"), e), vc = function(e) {
  let t = "", n = "</span>";
  return e = bc(e), mc.test(e) ? t = `<span class="${e.replace(/^\./, "")}"` : yc.test(e) ? t = `<span id="${e.replace(/^#/, "")}"` : (t = `<${e}`, n = `</${e}>`), t += ">", { start: t, end: n };
}, wc = function(e, t) {
  const n = {}, r = {};
  return Object.keys(t).forEach((o) => {
    let a = t[o];
    const i = vc(o);
    typeof a == "string" && (a = e.match(a)), a.docs.forEach((s) => {
      if (s.every((c) => c.implicit))
        return;
      const u = s[0].id;
      n[u] = n[u] || [], n[u].push(i.start);
      const l = s[s.length - 1].id;
      r[l] = r[l] || [], r[l].push(i.end);
    });
  }), { starts: n, ends: r };
}, Pc = function(e) {
  const { starts: t, ends: n } = wc(this, e);
  let r = "";
  return this.docs.forEach((o) => {
    for (let a = 0; a < o.length; a += 1) {
      const i = o[a];
      t.hasOwnProperty(i.id) && (r += t[i.id].join("")), r += i.pre || "", r += i.text || "", n.hasOwnProperty(i.id) && (r += n[i.id].join("")), r += i.post || "";
    }
  }), r;
}, kc = { html: Pc }, Pa = /[,:;)\]*.?~!\u0022\uFF02\u201D\u2019\u00BB\u203A\u2032\u2033\u2034\u301E\u00B4—-]+$/, Nn = /^[(['"*~\uFF02\u201C\u2018\u201F\u201B\u201E\u2E42\u201A\u00AB\u2039\u2035\u2036\u2037\u301D\u0060\u301F]+/, Ac = /[,:;)('"\u201D\]]/, Cc = /^[-–—]$/, Nc = / /, Be = function(e, t, n = !0) {
  let r = "";
  return e.forEach((o) => {
    let a = o.pre || "", i = o.post || "";
    t.punctuation === "some" && (a = a.replace(Nn, ""), Cc.test(i) && (i = " "), i = i.replace(Ac, ""), i = i.replace(/\?!+/, "?"), i = i.replace(/!+/, "!"), i = i.replace(/\?+/, "?"), i = i.replace(/\.{2,}/, ""), o.tags.has("Abbreviation") && (i = i.replace(/\./, ""))), t.whitespace === "some" && (a = a.replace(/\s/, ""), i = i.replace(/\s+/, " ")), t.keepPunct || (a = a.replace(Nn, ""), i === "-" ? i = " " : i = i.replace(Pa, ""));
    let s = o[t.form || "text"] || o.normal || "";
    t.form === "implicit" && (s = o.implicit || o.text), t.form === "root" && o.implicit && (s = o.root || o.implicit || o.normal), (t.form === "machine" || t.form === "implicit" || t.form === "root") && o.implicit && (!i || !Nc.test(i)) && (i += " "), r += a + s + i;
  }), n === !1 && (r = r.trim()), t.lowerCase === !0 && (r = r.toLowerCase()), r;
}, xc = function(e, t) {
  let n = "";
  if (!e || !e[0] || !e[0][0])
    return n;
  for (let r = 0; r < e.length; r += 1)
    n += Be(e[r], t, !0);
  if (t.keepSpace || (n = n.trim()), t.keepEndPunct === !1) {
    e[0][0].tags.has("Emoticon") || (n = n.replace(Nn, ""));
    const r = e[e.length - 1];
    r[r.length - 1].tags.has("Emoticon") || (n = n.replace(Pa, "")), n.endsWith("'") && !n.endsWith("s'") && (n = n.replace(/'/, ""));
  }
  return t.cleanWhitespace === !0 && (n = n.trim()), n;
}, Ge = {
  text: {
    form: "text"
  },
  normal: {
    whitespace: "some",
    punctuation: "some",
    case: "some",
    unicode: "some",
    form: "normal"
  },
  machine: {
    keepSpace: !1,
    whitespace: "some",
    punctuation: "some",
    case: "none",
    unicode: "some",
    form: "machine"
  },
  root: {
    keepSpace: !1,
    whitespace: "some",
    punctuation: "some",
    case: "some",
    unicode: "some",
    form: "root"
  },
  implicit: {
    form: "implicit"
  }
};
Ge.clean = Ge.normal;
Ge.reduced = Ge.root;
const ka = [];
let Se = 0;
for (; Se < 64; )
  ka[Se] = 0 | Math.sin(++Se % Math.PI) * 4294967296;
const Rn = function(e) {
  let t, n, r, o = decodeURI(encodeURI(e)) + "", a = o.length;
  const i = [t = 1732584193, n = 4023233417, ~t, ~n], s = [];
  for (e = --a / 4 + 2 | 15, s[--e] = a * 8; ~a; )
    s[a >> 2] |= o.charCodeAt(a) << 8 * a--;
  for (Se = o = 0; Se < e; Se += 16) {
    for (a = i; o < 64; a = [
      r = a[3],
      t + ((r = a[0] + [t & n | ~t & r, r & t | ~r & n, t ^ n ^ r, n ^ (t | ~r)][a = o >> 4] + ka[o] + ~~s[Se | [o, 5 * o + 1, 3 * o + 5, 7 * o][a] & 15]) << (a = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][4 * a + o++ % 4]) | r >>> -a),
      t,
      n
    ])
      t = a[1] | 0, n = a[2];
    for (o = 4; o; ) i[--o] += a[o];
  }
  for (e = ""; o < 32; )
    e += (i[o >> 3] >> (1 ^ o++) * 4 & 15).toString(16);
  return e;
}, jc = {
  text: !0,
  terms: !0
}, Hr = { case: "none", unicode: "some", form: "machine", punctuation: "some" }, on = function(e, t) {
  return Object.assign({}, e, t);
}, xe = {
  text: (e) => Be(e, { keepPunct: !0 }, !1),
  normal: (e) => Be(e, on(Ge.normal, { keepPunct: !0 }), !1),
  implicit: (e) => Be(e, on(Ge.implicit, { keepPunct: !0 }), !1),
  machine: (e) => Be(e, Hr, !1),
  root: (e) => Be(e, on(Hr, { form: "root" }), !1),
  hash: (e) => Rn(Be(e, { keepPunct: !0 }, !1)),
  offset: (e) => {
    const t = xe.text(e).length;
    return {
      index: e[0].offset.index,
      start: e[0].offset.start,
      length: t
    };
  },
  terms: (e) => e.map((t) => {
    const n = Object.assign({}, t);
    return n.tags = Array.from(t.tags), n;
  }),
  confidence: (e, t, n) => t.eq(n).confidence(),
  syllables: (e, t, n) => t.eq(n).syllables(),
  sentence: (e, t, n) => t.eq(n).fullSentence().text(),
  dirty: (e) => e.some((t) => t.dirty === !0)
};
xe.sentences = xe.sentence;
xe.clean = xe.normal;
xe.reduced = xe.root;
const Tc = function(e, t) {
  return t = t || {}, typeof t == "string" && (t = {}), t = Object.assign({}, jc, t), t.offset && e.compute("offset"), e.docs.map((n, r) => {
    const o = {};
    return Object.keys(t).forEach((a) => {
      t[a] && xe[a] && (o[a] = xe[a](n, e, r));
    }), o;
  });
}, xn = {
  /** return data */
  json: function(e) {
    const t = Tc(this, e);
    return typeof e == "number" ? t[e] : t;
  }
};
xn.data = xn.json;
const Ic = () => typeof window < "u" && window.document, $c = function(e) {
  const t = this.methods.one.debug || {};
  return e && t.hasOwnProperty(e) ? (t[e](this), this) : Ic() ? (t.clientSide(this), this) : (t.tags(this), this);
}, Dc = function(e) {
  const t = e.pre || "", n = e.post || "";
  return t + e.text + n;
}, Hc = function(e, t) {
  const n = {};
  return Object.keys(t).forEach((r) => {
    e.match(r).fullPointer.forEach((a) => {
      n[a[3]] = { fn: t[r], end: a[2] };
    });
  }), n;
}, Aa = function(e, t) {
  const n = Hc(e, t);
  let r = "";
  return e.docs.forEach((o, a) => {
    for (let i = 0; i < o.length; i += 1) {
      const s = o[i];
      if (n.hasOwnProperty(s.id)) {
        const { fn: u, end: l } = n[s.id], c = e.update([[a, i, l]]);
        r += o[i].pre || "", r += u(c), i = l - 1, r += o[i].post || "";
      } else
        r += Dc(s);
    }
  }), r;
}, Ec = (e) => Object.prototype.toString.call(e) === "[object Object]", Gc = function(e) {
  const t = {};
  return e.forEach((r) => {
    t[r] = t[r] || 0, t[r] += 1;
  }), Object.keys(t).map((r) => ({ normal: r, count: t[r] })).sort((r, o) => r.count > o.count ? -1 : 0);
}, Oc = function(e) {
  if (Ec(e))
    return Aa(this, e);
  if (e === "text")
    return this.text();
  if (e === "normal")
    return this.text("normal");
  if (e === "root")
    return this.text("root");
  if (e === "machine" || e === "reduced")
    return this.text("machine");
  if (e === "hash" || e === "md5")
    return Rn(this.text());
  if (e === "json")
    return this.json();
  if (e === "offset" || e === "offsets")
    return this.compute("offset"), this.json({ offset: !0 });
  if (e === "array")
    return this.docs.map((n) => n.reduce((r, o) => r + o.pre + o.text + o.post, "").trim()).filter((n) => n);
  if (e === "freq" || e === "frequency" || e === "topk")
    return Gc(this.json({ normal: !0 }).map((t) => t.normal));
  if (e === "terms") {
    let t = [];
    return this.docs.forEach((n) => {
      let r = n.map((o) => o.text);
      r = r.filter((o) => o), t = t.concat(r);
    }), t;
  }
  return e === "tags" ? this.docs.map((t) => t.reduce((n, r) => (n[r.implicit || r.normal] = Array.from(r.tags), n), {})) : e === "debug" ? this.debug() : this.text();
}, Fc = {
  /** */
  debug: $c,
  /** */
  out: Oc,
  /** */
  wrap: function(e) {
    return Aa(this, e);
  }
}, zc = (e) => Object.prototype.toString.call(e) === "[object Object]", Vc = {
  /** */
  text: function(e) {
    let t = {};
    if (e && typeof e == "string" && Ge.hasOwnProperty(e) ? t = Object.assign({}, Ge[e]) : e && zc(e) && (t = Object.assign({}, e)), t.keepSpace === void 0 && !this.isFull() && (t.keepSpace = !1), t.keepEndPunct === void 0 && this.pointer) {
      const n = this.pointer[0];
      n && n[1] ? t.keepEndPunct = !1 : t.keepEndPunct = !0;
    }
    return t.keepPunct === void 0 && (t.keepPunct = !0), t.keepSpace === void 0 && (t.keepSpace = !0), xc(this.docs, t);
  }
}, Bc = Object.assign({}, Fc, Vc, xn, kc), Sc = function(e) {
  Object.assign(e.prototype, Bc);
}, Mc = function(e) {
  console.log("%c -=-=- ", "background-color:#6699cc;"), e.forEach((t) => {
    console.groupCollapsed(t.text());
    const r = t.docs[0].map((o) => {
      let a = o.text || "-";
      o.implicit && (a = "[" + o.implicit + "]");
      const i = "[" + Array.from(o.tags).join(", ") + "]";
      return { text: a, tags: i };
    });
    console.table(r, ["text", "tags"]), console.groupEnd();
  });
}, me = "\x1B[0m", X = {
  green: (e) => "\x1B[32m" + e + me,
  red: (e) => "\x1B[31m" + e + me,
  blue: (e) => "\x1B[34m" + e + me,
  magenta: (e) => "\x1B[35m" + e + me,
  cyan: (e) => "\x1B[36m" + e + me,
  yellow: (e) => "\x1B[33m" + e + me,
  black: (e) => "\x1B[30m" + e + me,
  dim: (e) => "\x1B[2m" + e + me,
  i: (e) => "\x1B[3m" + e + me
}, Lc = function(e, t) {
  return t.one.tagSet && (e = e.map((n) => {
    if (!t.one.tagSet.hasOwnProperty(n))
      return n;
    const r = t.one.tagSet[n].color || "blue";
    return X[r](n);
  })), e.join(", ");
}, Kc = function(e) {
  const { docs: t, model: n } = e;
  t.length === 0 && console.log(X.blue(`
     ──────`)), t.forEach((r) => {
    console.log(X.blue(`
  ┌─────────`)), r.forEach((o) => {
      const a = [...o.tags || []];
      let i = o.text || "-";
      o.sense && (i = `{${o.normal}/${o.sense}}`), o.implicit && (i = "[" + o.implicit + "]"), i = X.yellow(i);
      let s = "'" + i + "'";
      if (o.reference) {
        const l = e.update([o.reference]).text("normal");
        s += ` - ${X.dim(X.i("[" + l + "]"))}`;
      }
      s = s.padEnd(18);
      const u = X.blue("  │ ") + X.i(s) + "  - " + Lc(a, n);
      console.log(u);
    });
  }), console.log(`
`);
}, Wc = function(e) {
  const { docs: t } = e;
  console.log(""), t.forEach((n) => {
    const r = [];
    n.forEach((o) => {
      o.chunk === "Noun" ? r.push(X.blue(o.implicit || o.normal)) : o.chunk === "Verb" ? r.push(X.green(o.implicit || o.normal)) : o.chunk === "Adjective" ? r.push(X.yellow(o.implicit || o.normal)) : o.chunk === "Pivot" ? r.push(X.red(o.implicit || o.normal)) : r.push(o.implicit || o.normal);
    }), console.log(r.join(" "), `
`);
  }), console.log(`
`);
}, Jc = (e, t, n) => {
  const r = n * 9, o = t.start + r, a = o + t.length, i = e.substring(0, o), s = e.substring(o, a), u = e.substring(a, e.length);
  return [i, s, u];
}, Uc = function(e, t, n) {
  const r = Jc(e, t, n);
  return `${r[0]}${X.blue(r[1])}${r[2]}`;
}, qc = function(e) {
  if (!e.found)
    return;
  const t = {};
  e.fullPointer.forEach((n) => {
    t[n[0]] = t[n[0]] || [], t[n[0]].push(n);
  }), Object.keys(t).forEach((n) => {
    let o = e.update([[Number(n)]]).text();
    e.update(t[n]).json({ offset: !0 }).forEach((s, u) => {
      o = Uc(o, s.offset, u);
    }), console.log(o);
  }), console.log(`
`);
}, Rc = {
  tags: Kc,
  clientSide: Mc,
  chunks: Wc,
  highlight: qc
}, Qc = {
  api: Sc,
  methods: {
    one: {
      hash: Rn,
      debug: Rc
    }
  }
}, Ca = function(e, t) {
  if (e[0] !== t[0])
    return !1;
  const [, n, r] = e, [, o, a] = t;
  return n <= o && r > o || o <= n && a > n;
}, _c = function(e) {
  let t = e[0][1], n = e[0][2];
  return e.forEach((r) => {
    r[1] < t && (t = r[1]), r[2] > n && (n = r[2]);
  }), [e[0][0], t, n];
}, _t = function(e) {
  const t = {};
  return e.forEach((n) => {
    t[n[0]] = t[n[0]] || [], t[n[0]].push(n);
  }), t;
}, Zc = function(e) {
  const t = {};
  for (let n = 0; n < e.length; n += 1)
    t[e[n].join(",")] = e[n];
  return Object.values(t);
}, Xc = function(e, t) {
  const [n, r] = e, o = t[1], a = t[2], i = {};
  if (r < o) {
    const s = o < e[2] ? o : e[2];
    i.before = [n, r, s];
  }
  return i.match = t, e[2] > a && (i.after = [n, a, e[2]]), i;
}, Yc = function(e, t) {
  return e[1] <= t[1] && t[2] <= e[2];
}, Na = function(e, t) {
  const n = _t(t), r = [];
  return e.forEach((o) => {
    const [a] = o;
    let i = n[a] || [];
    if (i = i.filter((u) => Yc(o, u)), i.length === 0) {
      r.push({ passthrough: o });
      return;
    }
    i = i.sort((u, l) => u[1] - l[1]);
    let s = o;
    i.forEach((u, l) => {
      const c = Xc(s, u);
      i[l + 1] ? (r.push({ before: c.before, match: c.match }), c.after && (s = c.after)) : r.push(c);
    });
  }), r;
}, el = 20, tl = function(e, t, n) {
  for (let r = 0; r < el; r += 1) {
    if (t[n - r]) {
      const o = t[n - r].findIndex((a) => a.id === e);
      if (o !== -1)
        return [n - r, o];
    }
    if (t[n + r]) {
      const o = t[n + r].findIndex((a) => a.id === e);
      if (o !== -1)
        return [n + r, o];
    }
  }
  return null;
}, nl = function(e, t) {
  const [n, r, , , o] = e, a = t[n], i = a.findIndex((s) => s.id === o);
  return i === -1 ? (e[2] = t[n].length, e[4] = a.length ? a[a.length - 1].id : null) : e[2] = i, t[n].slice(r, e[2] + 1);
}, rl = function(e, t) {
  let n = [];
  return e.forEach((r, o) => {
    if (!r)
      return;
    let [a, i, s, u, l] = r, c = t[a] || [];
    if (i === void 0 && (i = 0), s === void 0 && (s = c.length), u && (!c[i] || c[i].id !== u)) {
      const h = tl(u, t, a);
      if (h !== null) {
        const f = s - i;
        c = t[h[0]].slice(h[1], h[1] + f);
        const w = c[0] ? c[0].id : null;
        e[o] = [h[0], h[1], h[1] + f, w];
      }
    } else
      c = c.slice(i, s);
    c.length !== 0 && i !== s && (l && c[c.length - 1].id !== l && (c = nl(r, t)), n.push(c));
  }), n = n.filter((r) => r.length > 0), n;
}, ol = function(e) {
  const t = [];
  for (let n = 0; n < e.length; n += 1)
    for (let r = 0; r < e[n].length; r += 1)
      t.push(e[n][r]);
  return t;
}, al = {
  one: {
    termList: ol,
    getDoc: rl,
    pointer: {
      indexN: _t,
      splitAll: Na
    }
  }
}, xa = function(e, t) {
  const n = e.concat(t), r = _t(n);
  let o = [];
  return n.forEach((a) => {
    const [i] = a;
    if (r[i].length === 1) {
      o.push(a);
      return;
    }
    const s = r[i].filter((l) => Ca(a, l));
    s.push(a);
    const u = _c(s);
    o.push(u);
  }), o = Zc(o), o;
}, ja = function(e, t) {
  const n = [];
  return Na(e, t).forEach((o) => {
    o.passthrough && n.push(o.passthrough), o.before && n.push(o.before), o.after && n.push(o.after);
  }), n;
}, il = function(e, t) {
  const n = e[1] < t[1] ? t[1] : e[1], r = e[2] > t[2] ? t[2] : e[2];
  return n < r ? [e[0], n, r] : null;
}, sl = function(e, t) {
  const n = _t(t), r = [];
  return e.forEach((o) => {
    let a = n[o[0]] || [];
    a = a.filter((i) => Ca(o, i)), a.length !== 0 && a.forEach((i) => {
      const s = il(o, i);
      s && r.push(s);
    });
  }), r;
}, ul = function(e) {
  return Object.prototype.toString.call(e) === "[object Array]";
}, Qn = (e, t) => typeof e == "string" || ul(e) ? t.match(e) : e || t.none(), vt = function(e, t) {
  return e.map((n) => {
    const [r, o] = n;
    return t[r] && t[r][o] && (n[3] = t[r][o].id), n;
  });
}, ge = {};
ge.union = function(e) {
  e = Qn(e, this);
  let t = xa(this.fullPointer, e.fullPointer);
  return t = vt(t, this.document), this.toView(t);
};
ge.and = ge.union;
ge.intersection = function(e) {
  e = Qn(e, this);
  let t = sl(this.fullPointer, e.fullPointer);
  return t = vt(t, this.document), this.toView(t);
};
ge.not = function(e) {
  e = Qn(e, this);
  let t = ja(this.fullPointer, e.fullPointer);
  return t = vt(t, this.document), this.toView(t);
};
ge.difference = ge.not;
ge.complement = function() {
  const e = this.all();
  let t = ja(e.fullPointer, this.fullPointer);
  return t = vt(t, this.document), this.toView(t);
};
ge.settle = function() {
  let e = this.fullPointer;
  return e.forEach((t) => {
    e = xa(e, [t]);
  }), e = vt(e, this.document), this.update(e);
};
const cl = function(e) {
  Object.assign(e.prototype, ge);
}, ll = {
  methods: al,
  api: cl
}, hl = {
  // compile a list of matches into a match-net
  buildNet: function(e) {
    const n = this.methods().one.buildNet(e, this.world());
    return n.isNet = !0, n;
  }
}, dl = function(e) {
  e.prototype.sweep = function(t, n = {}) {
    const { world: r, docs: o } = this, { methods: a } = r;
    let i = a.one.bulkMatch(o, t, this.methods, n);
    n.tagger !== !1 && a.one.bulkTagger(i, o, this.world), i = i.map((u) => {
      const l = u.pointer, c = o[l[0]][l[1]], h = l[2] - l[1];
      return c.index && (u.pointer = [
        c.index[0],
        c.index[1],
        l[1] + h
      ]), u;
    });
    const s = i.map((u) => u.pointer);
    return i = i.map((u) => (u.view = this.update([u.pointer]), delete u.regs, delete u.needs, delete u.pointer, delete u._expanded, u)), {
      view: this.update(s),
      found: i
    };
  };
}, jn = function(e) {
  return e.optional === !0 || e.negative === !0 ? null : e.tag ? "#" + e.tag : e.word ? e.word : e.switch ? `%${e.switch}%` : null;
}, fl = function(e) {
  const t = [];
  return e.forEach((n) => {
    t.push(jn(n)), n.operator === "and" && n.choices && n.choices.forEach((r) => {
      r.forEach((o) => {
        t.push(jn(o));
      });
    });
  }), t.filter((n) => n);
}, pl = function(e) {
  const t = [];
  let n = 0;
  return e.forEach((r) => {
    r.operator === "or" && !r.optional && !r.negative && (r.fastOr && Array.from(r.fastOr).forEach((o) => {
      t.push(o);
    }), r.choices && r.choices.forEach((o) => {
      o.forEach((a) => {
        const i = jn(a);
        i && t.push(i);
      });
    }), n += 1);
  }), { wants: t, count: n };
}, gl = function(e, t) {
  const n = t.methods.one.parseMatch;
  return e.forEach((r) => {
    r.regs = n(r.match, {}, t), typeof r.ifNo == "string" && (r.ifNo = [r.ifNo]), r.notIf && (r.notIf = n(r.notIf, {}, t)), r.needs = fl(r.regs);
    const { wants: o, count: a } = pl(r.regs);
    r.wants = o, r.minWant = a, r.minWords = r.regs.filter((i) => !i.optional).length;
  }), e;
}, ml = function(e, t) {
  e = gl(e, t);
  const n = {};
  e.forEach((o) => {
    o.needs.forEach((a) => {
      n[a] = Array.isArray(n[a]) ? n[a] : [], n[a].push(o);
    }), o.wants.forEach((a) => {
      n[a] = Array.isArray(n[a]) ? n[a] : [], n[a].push(o);
    });
  }), Object.keys(n).forEach((o) => {
    const a = {};
    n[o] = n[o].filter((i) => typeof a[i.match] == "boolean" ? !1 : (a[i.match] = !0, !0));
  });
  const r = e.filter((o) => o.needs.length === 0 && o.wants.length === 0);
  return {
    hooks: n,
    always: r
  };
}, yl = function(e, t) {
  return e.map((n, r) => {
    let o = [];
    Object.keys(t).forEach((i) => {
      e[r].has(i) && (o = o.concat(t[i]));
    });
    const a = {};
    return o = o.filter((i) => typeof a[i.match] == "boolean" ? !1 : (a[i.match] = !0, !0)), o;
  });
}, bl = function(e, t) {
  return e.map((n, r) => {
    const o = t[r];
    return n = n.filter((a) => a.needs.every((i) => o.has(i))), n = n.filter((a) => !(a.ifNo !== void 0 && a.ifNo.some((i) => o.has(i)) === !0)), n = n.filter((a) => a.wants.length === 0 ? !0 : a.wants.filter((s) => o.has(s)).length >= a.minWant), n;
  });
}, vl = function(e, t, n, r, o) {
  const a = [];
  for (let i = 0; i < e.length; i += 1)
    for (let s = 0; s < e[i].length; s += 1) {
      const u = e[i][s], l = r.one.match([t[i]], u);
      if (l.ptrs.length > 0 && (l.ptrs.forEach((c) => {
        c[0] = i;
        const h = Object.assign({}, u, { pointer: c });
        u.unTag !== void 0 && (h.unTag = u.unTag), a.push(h);
      }), o.matchOne === !0))
        return [a[0]];
    }
  return a;
}, wl = function(e, t) {
  return e.map((n, r) => {
    const o = t[r].length;
    return n = n.filter((a) => o >= a.minWords), n;
  });
}, Pl = function(e, t, n, r = {}) {
  const o = n.one.cacheDoc(e);
  let a = yl(o, t.hooks);
  return a = bl(a, o), t.always.length > 0 && (a = a.map((s) => s.concat(t.always))), a = wl(a, e), vl(a, e, o, n, r);
}, kl = function(e, t, n) {
  const r = n.one.tagSet;
  if (!r.hasOwnProperty(t))
    return !0;
  const o = r[t].not || [];
  for (let a = 0; a < e.length; a += 1) {
    const i = e[a];
    for (let s = 0; s < o.length; s += 1)
      if (i.tags.has(o[s]) === !0)
        return !1;
  }
  return !0;
}, Al = function(e, t, n) {
  const { model: r, methods: o } = n, { getDoc: a, setTag: i, unTag: s } = o.one, u = o.two.looksPlural;
  return e.length === 0 ? e : ((typeof process > "u" || !process.env ? self.env || {} : process.env).DEBUG_TAGS && console.log(`

  \x1B[32m→ ${e.length} post-tagger:\x1B[0m`), e.map((c) => {
    if (!c.tag && !c.chunk && !c.unTag)
      return;
    const h = c.reason || c.match, f = a([c.pointer], t)[0];
    if (!(c.safe === !0 && (kl(f, c.tag, r) === !1 || f[f.length - 1].post === "-"))) {
      if (c.tag !== void 0) {
        if (i(f, c.tag, n, c.safe, `[post] '${h}'`), c.tag === "Noun" && u) {
          const w = f[f.length - 1];
          u(w.text) ? i([w], "Plural", n, c.safe, "quick-plural") : i([w], "Singular", n, c.safe, "quick-singular");
        }
        c.freeze === !0 && f.forEach((w) => w.frozen = !0);
      }
      c.unTag !== void 0 && s(f, c.unTag, n, c.safe, h), c.chunk && f.forEach((w) => w.chunk = c.chunk);
    }
  }));
}, Cl = {
  buildNet: ml,
  bulkMatch: Pl,
  bulkTagger: Al
}, Nl = {
  lib: hl,
  api: dl,
  methods: {
    one: Cl
  }
}, Ta = / /, Er = function(e, t) {
  t === "Noun" && (e.chunk = t), t === "Verb" && (e.chunk = t);
}, Ia = function(e, t, n, r) {
  if (e.tags.has(t) === !0 || t === ".")
    return null;
  e.frozen === !0 && (r = !0);
  const o = n[t];
  if (o) {
    if (o.not && o.not.length > 0)
      for (let a = 0; a < o.not.length; a += 1) {
        if (r === !0 && e.tags.has(o.not[a]))
          return null;
        e.tags.delete(o.not[a]);
      }
    if (o.parents && o.parents.length > 0)
      for (let a = 0; a < o.parents.length; a += 1)
        e.tags.add(o.parents[a]), Er(e, o.parents[a]);
  }
  return e.tags.add(t), e.dirty = !0, Er(e, t), !0;
}, xl = function(e, t, n, r) {
  const o = t.split(Ta);
  e.forEach((a, i) => {
    let s = o[i];
    s && (s = s.replace(/^#/, ""), Ia(a, s, n, r));
  });
}, jl = function(e) {
  return Object.prototype.toString.call(e) === "[object Array]";
}, Tl = (e, t, n = "") => {
  const r = (i) => "\x1B[33m\x1B[3m" + i + "\x1B[0m", o = (i) => "\x1B[3m" + i + "\x1B[0m", a = e.map((i) => i.text || "[" + i.implicit + "]").join(" ");
  typeof t != "string" && t.length > 2 && (t = t.slice(0, 2).join(", #") + " +"), t = typeof t != "string" ? t.join(", #") : t, console.log(` ${r(a).padEnd(24)} \x1B[32m→\x1B[0m #${t.padEnd(22)}  ${o(n)}`);
}, $a = function(e, t, n = {}, r, o) {
  const a = n.model.one.tagSet || {};
  if (!t)
    return;
  const i = typeof process > "u" || !process.env ? self.env || {} : process.env;
  if (i && i.DEBUG_TAGS && Tl(e, t, o), jl(t) === !0) {
    t.forEach((s) => $a(e, s, n, r));
    return;
  }
  if (typeof t != "string") {
    console.warn(`compromise: Invalid tag '${t}'`);
    return;
  }
  if (t = t.trim(), Ta.test(t)) {
    xl(e, t, a, r);
    return;
  }
  t = t.replace(/^#/, "");
  for (let s = 0; s < e.length; s += 1)
    Ia(e[s], t, a, r);
}, Il = function(e, t, n) {
  t = t.trim().replace(/^#/, "");
  for (let r = 0; r < e.length; r += 1) {
    const o = e[r];
    if (o.frozen === !0)
      continue;
    if (t === "*") {
      o.tags.clear();
      continue;
    }
    const a = n[t];
    if (a && a.children.length > 0)
      for (let i = 0; i < a.children.length; i += 1)
        o.tags.delete(a.children[i]);
    o.tags.delete(t);
  }
}, $l = function(e, t, n) {
  if (!n.hasOwnProperty(t))
    return !0;
  const r = n[t].not || [];
  for (let o = 0; o < r.length; o += 1)
    if (e.tags.has(r[o]))
      return !1;
  return !0;
}, De = function(e) {
  return e.children = e.children || [], e._cache = e._cache || {}, e.props = e.props || {}, e._cache.parents = e._cache.parents || [], e._cache.children = e._cache.children || [], e;
}, Dl = /^ *(#|\/\/)/, Hl = function(e) {
  let t = e.trim().split(/->/), n = [];
  t.forEach(((o) => {
    n = n.concat((function(a) {
      if (!(a = a.trim())) return null;
      if (/^\[/.test(a) && /\]$/.test(a)) {
        let i = (a = (a = a.replace(/^\[/, "")).replace(/\]$/, "")).split(/,/);
        return i = i.map(((s) => s.trim())).filter(((s) => s)), i = i.map(((s) => De({ id: s }))), i;
      }
      return [De({ id: a })];
    })(o));
  })), n = n.filter(((o) => o));
  let r = n[0];
  for (let o = 1; o < n.length; o += 1) r.children.push(n[o]), r = n[o];
  return n[0];
}, Ne = (e, t) => {
  let n = [], r = [e];
  for (; r.length > 0; ) {
    let o = r.pop();
    n.push(o), o.children && o.children.forEach(((a) => {
      t && t(o, a), r.push(a);
    }));
  }
  return n;
}, _n = (e) => Object.prototype.toString.call(e) === "[object Array]", kt = (e) => (e = e || "").trim(), El = function(e = []) {
  return typeof e == "string" ? (function(n) {
    let r = n.split(/\r?\n/), o = [];
    r.forEach(((i) => {
      if (!i.trim() || Dl.test(i)) return;
      let s = ((u) => {
        const l = /^( {2}|\t)/;
        let c = 0;
        for (; l.test(u); ) u = u.replace(l, ""), c += 1;
        return c;
      })(i);
      o.push({ indent: s, node: Hl(i) });
    }));
    let a = (function(i) {
      let s = { children: [] };
      return i.forEach(((u, l) => {
        u.indent === 0 ? s.children = s.children.concat(u.node) : i[l - 1] && (function(c, h) {
          let f = c[h].indent;
          for (; h >= 0; h -= 1) if (c[h].indent < f) return c[h];
          return c[0];
        })(i, l).node.children.push(u.node);
      })), s;
    })(o);
    return a = De(a), a;
  })(e) : _n(e) ? (function(n) {
    let r = {};
    n.forEach(((a) => {
      r[a.id] = a;
    }));
    let o = De({});
    return n.forEach(((a) => {
      if ((a = De(a)).parent) if (r.hasOwnProperty(a.parent)) {
        let i = r[a.parent];
        delete a.parent, i.children.push(a);
      } else console.warn(`[Grad] - missing node '${a.parent}'`);
      else o.children.push(a);
    })), o;
  })(e) : (Ne(t = e).forEach(De), t);
  var t;
}, Gl = (e) => "\x1B[31m" + e + "\x1B[0m", Ol = (e) => "\x1B[2m" + e + "\x1B[0m", Tn = function(e, t) {
  let n = "-> ";
  t && (n = Ol("→ "));
  let r = "";
  return Ne(e).forEach(((o, a) => {
    let i = o.id || "";
    if (t && (i = Gl(i)), a === 0 && !o.id) return;
    let s = o._cache.parents.length;
    r += "    ".repeat(s) + n + i + `
`;
  })), r;
}, Gr = function(e) {
  let t = Ne(e);
  t.forEach(((r) => {
    delete (r = Object.assign({}, r)).children;
  }));
  let n = t[0];
  return n && !n.id && Object.keys(n.props).length === 0 && t.shift(), t;
}, Or = { text: Tn, txt: Tn, array: Gr, flat: Gr }, Fr = function(e, t) {
  return t === "nested" || t === "json" ? e : t === "debug" ? (console.log(Tn(e, !0)), null) : Or.hasOwnProperty(t) ? Or[t](e) : e;
}, an = (e) => {
  Ne(e, ((t, n) => {
    t.id && (t._cache.parents = t._cache.parents || [], n._cache.parents = t._cache.parents.concat([t.id]));
  }));
}, Fl = (e, t) => (Object.keys(t).forEach(((n) => {
  if (t[n] instanceof Set) {
    let r = e[n] || /* @__PURE__ */ new Set();
    e[n] = /* @__PURE__ */ new Set([...r, ...t[n]]);
  } else if (((r) => r && typeof r == "object" && !Array.isArray(r))(t[n])) {
    let r = e[n] || {};
    e[n] = Object.assign({}, t[n], r);
  } else _n(t[n]) ? e[n] = t[n].concat(e[n] || []) : e[n] === void 0 && (e[n] = t[n]);
})), e), zl = /\//;
let Vl = class Lt {
  constructor(t = {}) {
    Object.defineProperty(this, "json", { enumerable: !1, value: t, writable: !0 });
  }
  get children() {
    return this.json.children;
  }
  get id() {
    return this.json.id;
  }
  get found() {
    return this.json.id || this.json.children.length > 0;
  }
  props(t = {}) {
    let n = this.json.props || {};
    return typeof t == "string" && (n[t] = !0), this.json.props = Object.assign(n, t), this;
  }
  get(t) {
    if (t = kt(t), !zl.test(t)) {
      let r = this.json.children.find(((o) => o.id === t));
      return new Lt(r);
    }
    let n = ((r, o) => {
      let a = ((i) => typeof i != "string" ? i : (i = i.replace(/^\//, "")).split(/\//))(o = o || "");
      for (let i = 0; i < a.length; i += 1) {
        let s = r.children.find(((u) => u.id === a[i]));
        if (!s) return null;
        r = s;
      }
      return r;
    })(this.json, t) || De({});
    return new Lt(n);
  }
  add(t, n = {}) {
    if (_n(t)) return t.forEach(((o) => this.add(kt(o), n))), this;
    t = kt(t);
    let r = De({ id: t, props: n });
    return this.json.children.push(r), new Lt(r);
  }
  remove(t) {
    return t = kt(t), this.json.children = this.json.children.filter(((n) => n.id !== t)), this;
  }
  nodes() {
    return Ne(this.json).map(((t) => (delete (t = Object.assign({}, t)).children, t)));
  }
  cache() {
    return ((t) => {
      let n = Ne(t, ((o, a) => {
        o.id && (o._cache.parents = o._cache.parents || [], o._cache.children = o._cache.children || [], a._cache.parents = o._cache.parents.concat([o.id]));
      })), r = {};
      n.forEach(((o) => {
        o.id && (r[o.id] = o);
      })), n.forEach(((o) => {
        o._cache.parents.forEach(((a) => {
          r.hasOwnProperty(a) && r[a]._cache.children.push(o.id);
        }));
      })), t._cache.children = Object.keys(r);
    })(this.json), this;
  }
  list() {
    return Ne(this.json);
  }
  fillDown() {
    var t;
    return t = this.json, Ne(t, ((n, r) => {
      r.props = Fl(r.props, n.props);
    })), this;
  }
  depth() {
    an(this.json);
    let t = Ne(this.json), n = t.length > 1 ? 1 : 0;
    return t.forEach(((r) => {
      if (r._cache.parents.length === 0) return;
      let o = r._cache.parents.length + 1;
      o > n && (n = o);
    })), n;
  }
  out(t) {
    return an(this.json), Fr(this.json, t);
  }
  debug() {
    return an(this.json), Fr(this.json, "debug"), this;
  }
};
const Da = function(e) {
  let t = El(e);
  return new Vl(t);
};
Da.prototype.plugin = function(e) {
  e(this);
};
const Ue = {
  Noun: "blue",
  Verb: "green",
  Negative: "green",
  Date: "red",
  Value: "red",
  Adjective: "magenta",
  Preposition: "cyan",
  Conjunction: "cyan",
  Determiner: "cyan",
  Hyphenated: "cyan",
  Adverb: "cyan"
}, Bl = function(e) {
  if (Ue.hasOwnProperty(e.id))
    return Ue[e.id];
  if (Ue.hasOwnProperty(e.is))
    return Ue[e.is];
  const t = e._cache.parents.find((n) => Ue[n]);
  return Ue[t];
}, Sl = function(e) {
  const t = {};
  return e.forEach((n) => {
    const { not: r, also: o, is: a, novel: i } = n.props;
    let s = n._cache.parents;
    o && (s = s.concat(o)), t[n.id] = {
      is: a,
      not: r,
      novel: i,
      also: o,
      parents: s,
      children: n._cache.children,
      color: Bl(n)
    };
  }), Object.keys(t).forEach((n) => {
    const r = new Set(t[n].not);
    t[n].not.forEach((o) => {
      t[o] && t[o].children.forEach((a) => r.add(a));
    }), t[n].not = Array.from(r);
  }), t;
}, zr = function(e) {
  return e ? typeof e == "string" ? [e] : e : [];
}, Ml = function(e, t) {
  return Object.keys(e).forEach((n) => {
    e[n].isA && (e[n].is = e[n].isA), e[n].notA && (e[n].not = e[n].notA), e[n].is && typeof e[n].is == "string" && !t.hasOwnProperty(e[n].is) && !e.hasOwnProperty(e[n].is) && (e[e[n].is] = {}), e[n].not && typeof e[n].not == "string" && !e.hasOwnProperty(e[n].not) && !t.hasOwnProperty(e[n].not) && !e.hasOwnProperty(e[n].not) && (e[e[n].not] = {});
  }), e;
}, Ll = function(e, t) {
  return e = Ml(e, t), Object.keys(e).forEach((n) => {
    e[n].children = zr(e[n].children), e[n].not = zr(e[n].not);
  }), Object.keys(e).forEach((n) => {
    (e[n].not || []).forEach((o) => {
      e[o] && e[o].not && e[o].not.push(n);
    });
  }), e;
}, Kl = function(e) {
  const t = Object.keys(e).map((r) => {
    const o = e[r], a = { not: new Set(o.not), also: o.also, is: o.is, novel: o.novel };
    return { id: r, parent: o.is, props: a, children: [] };
  });
  return Da(t).cache().fillDown().out("array");
}, Wl = function(e) {
  return Object.keys(e).forEach((t) => {
    e[t] = Object.assign({}, e[t]), e[t].novel = !0;
  }), e;
}, Jl = function(e, t) {
  Object.keys(t).length > 0 && (e = Wl(e)), e = Ll(e, t);
  const n = Object.assign({}, t, e), r = Kl(n);
  return Sl(r);
}, Ul = {
  one: {
    setTag: $a,
    unTag: Il,
    addTags: Jl,
    canBe: $l
  }
}, Vr = function(e) {
  return Object.prototype.toString.call(e) === "[object Array]";
}, ql = {
  /** add a given tag, to all these terms */
  tag: function(e, t = "", n) {
    if (!this.found || !e)
      return this;
    const r = this.termList();
    if (r.length === 0)
      return this;
    const { methods: o, verbose: a, world: i } = this;
    return a === !0 && console.log(" +  ", e, t || ""), Vr(e) ? e.forEach((s) => o.one.setTag(r, s, i, n, t)) : o.one.setTag(r, e, i, n, t), this.uncache(), this;
  },
  /** add a given tag, only if it is consistent */
  tagSafe: function(e, t = "") {
    return this.tag(e, t, !0);
  },
  /** remove a given tag from all these terms */
  unTag: function(e, t) {
    if (!this.found || !e)
      return this;
    const n = this.termList();
    if (n.length === 0)
      return this;
    const { methods: r, verbose: o, model: a } = this;
    o === !0 && console.log(" -  ", e, t || "");
    const i = a.one.tagSet;
    return Vr(e) ? e.forEach((s) => r.one.unTag(n, s, i)) : r.one.unTag(n, e, i), this.uncache(), this;
  },
  /** return only the terms that can be this tag  */
  canBe: function(e) {
    e = e.replace(/^#/, "");
    const t = this.model.one.tagSet, n = this.methods.one.canBe, r = [];
    this.document.forEach((a, i) => {
      a.forEach((s, u) => {
        n(s, e, t) || r.push([i, u, u + 1]);
      });
    });
    const o = this.update(r);
    return this.difference(o);
  }
}, Rl = function(e) {
  Object.assign(e.prototype, ql);
}, Ql = function(e) {
  const { model: t, methods: n } = this.world(), r = t.one.tagSet, o = n.one.addTags, a = o(e, r);
  return t.one.tagSet = a, this;
}, _l = { addTags: Ql }, Br = /* @__PURE__ */ new Set(["Auxiliary", "Possessive"]), Zl = function(e, t) {
  return e = e.sort((n, r) => {
    if (Br.has(n) || !t.hasOwnProperty(r))
      return 1;
    if (Br.has(r) || !t.hasOwnProperty(n))
      return -1;
    let o = t[n].children || [];
    const a = o.length;
    o = t[r].children || [];
    const i = o.length;
    return a - i;
  }), e;
}, Xl = function(e) {
  const { document: t, world: n } = e, r = n.model.one.tagSet;
  t.forEach((o) => {
    o.forEach((a) => {
      const i = Array.from(a.tags);
      a.tagRank = Zl(i, r);
    });
  });
}, Yl = {
  model: {
    one: { tagSet: {} }
  },
  compute: {
    tagRank: Xl
  },
  methods: Ul,
  api: Rl,
  lib: _l
}, eh = /([.!?\u203D\u2E18\u203C\u2047-\u2049\u3002]+\s)/g, th = /^[.!?\u203D\u2E18\u203C\u2047-\u2049\u3002]+\s$/, nh = /((?:\r?\n|\r)+)/, rh = function(e) {
  const t = [], n = e.split(nh);
  for (let r = 0; r < n.length; r++) {
    const o = n[r].split(eh);
    for (let a = 0; a < o.length; a++)
      o[a + 1] && th.test(o[a + 1]) === !0 && (o[a] += o[a + 1], o[a + 1] = ""), o[a] !== "" && t.push(o[a]);
  }
  return t;
}, oh = /[a-z0-9\u00C0-\u00FF\u00a9\u00ae\u2000-\u3300\ud000-\udfff]/i, ah = /\S/, ih = function(e) {
  const t = [];
  for (let n = 0; n < e.length; n++) {
    const r = e[n];
    if (!(r === void 0 || r === "")) {
      if (ah.test(r) === !1 || oh.test(r) === !1) {
        if (t[t.length - 1]) {
          t[t.length - 1] += r;
          continue;
        } else if (e[n + 1]) {
          e[n + 1] = r + e[n + 1];
          continue;
        }
      }
      t.push(r);
    }
  }
  return t;
}, sh = function(e) {
  return !!e.match(/\n$/);
}, uh = function(e, t) {
  const n = t.methods.one.tokenize.isSentence, r = t.model.one.abbreviations || /* @__PURE__ */ new Set(), o = [];
  for (let a = 0; a < e.length; a++) {
    const i = e[a];
    e[a + 1] && !n(i, r) && !sh(i) ? e[a + 1] = i + (e[a + 1] || "") : i && i.length > 0 && (o.push(i), e[a] = "");
  }
  return o;
}, Sr = 280, Ha = {
  '"': '"',
  // 'StraightDoubleQuotes'
  "＂": "＂",
  // 'StraightDoubleQuotesWide'
  // '\u0027': '\u0027', // 'StraightSingleQuotes'
  "“": "”",
  // 'CommaDoubleQuotes'
  // '\u2018': '\u2019', // 'CommaSingleQuotes'
  "‟": "”",
  // 'CurlyDoubleQuotesReversed'
  // '\u201B': '\u2019', // 'CurlySingleQuotesReversed'
  "„": "”",
  // 'LowCurlyDoubleQuotes'
  "⹂": "”",
  // 'LowCurlyDoubleQuotesReversed'
  "‚": "’",
  // 'LowCurlySingleQuotes'
  "«": "»",
  // 'AngleDoubleQuotes'
  "‹": "›",
  // 'AngleSingleQuotes'
  "‵": "′",
  // 'PrimeSingleQuotes'
  "‶": "″",
  // 'PrimeDoubleQuotes'
  "‷": "‴",
  // 'PrimeTripleQuotes'
  "〝": "〞",
  // 'PrimeDoubleQuotes'
  // '\u0060': '\u00B4', // 'PrimeSingleQuotes'
  "〟": "〞"
  // 'LowPrimeDoubleQuotesReversed'
}, ch = RegExp("[" + Object.keys(Ha).join("") + "]", "g"), lh = RegExp("[" + Object.values(Ha).join("") + "]", "g"), Mr = function(e) {
  if (!e)
    return !1;
  const t = e.match(lh);
  return t !== null && t.length === 1;
}, hh = function(e) {
  const t = [];
  for (let n = 0; n < e.length; n += 1) {
    const o = e[n].match(ch);
    if (o !== null && o.length === 1) {
      if (Mr(e[n + 1]) && e[n + 1].length < Sr) {
        e[n] += e[n + 1], t.push(e[n]), e[n + 1] = "", n += 1;
        continue;
      }
      if (Mr(e[n + 2])) {
        const a = e[n + 1] + e[n + 2];
        if (a.length < Sr) {
          e[n] += a, t.push(e[n]), e[n + 1] = "", e[n + 2] = "", n += 2;
          continue;
        }
      }
    }
    t.push(e[n]);
  }
  return t;
}, dh = 250, Lr = /\(/g, fh = /\)/g, ph = function(e) {
  const t = [];
  for (let n = 0; n < e.length; n += 1) {
    const o = e[n].match(Lr);
    if (o !== null && o.length === 1 && e[n + 1] && e[n + 1].length < dh && e[n + 1].match(fh) !== null && o.length === 1 && !Lr.test(e[n + 1])) {
      e[n] += e[n + 1], t.push(e[n]), e[n + 1] = "", n += 1;
      continue;
    }
    t.push(e[n]);
  }
  return t;
}, gh = /\S/, Kr = /^\s+/, mh = function(e, t) {
  if (e = e || "", e = String(e), !e || typeof e != "string" || gh.test(e) === !1)
    return [];
  e = e.replace(" ", " ");
  const n = rh(e);
  let r = ih(n);
  if (r = uh(r, t), r = hh(r), r = ph(r), r.length === 0)
    return [e];
  for (let o = 1; o < r.length; o += 1) {
    const a = r[o].match(Kr);
    a !== null && (r[o - 1] += a[0], r[o] = r[o].replace(Kr, ""));
  }
  return r;
}, yh = function(e, t) {
  const n = e.split(/[-–—]/);
  if (n.length <= 1)
    return !1;
  const { prefixes: r, suffixes: o } = t.one;
  return n[0].length === 1 && /[a-z]/i.test(n[0]) || r.hasOwnProperty(n[0]) || (n[1] = n[1].trim().replace(/[.?!]$/, ""), o.hasOwnProperty(n[1])) ? !1 : /^([a-z\u00C0-\u00FF`"'/]+)[-–—]([a-z0-9\u00C0-\u00FF].*)/i.test(e) === !0 || /^[('"]?([0-9]{1,4})[-–—]([a-z\u00C0-\u00FF`"'/-]+[)'"]?$)/i.test(e) === !0;
}, bh = function(e) {
  const t = [], n = e.split(/[-–—]/);
  let r = "-";
  const o = e.match(/[-–—]/);
  o && o[0] && (r = o);
  for (let a = 0; a < n.length; a++)
    a === n.length - 1 ? t.push(n[a]) : t.push(n[a] + r);
  return t;
}, vh = function(e) {
  const t = /^[0-9]{1,4}(:[0-9][0-9])?([a-z]{1,2})? ?[-–—] ?$/, n = /^[0-9]{1,4}([a-z]{1,2})? ?$/;
  for (let r = 0; r < e.length - 1; r += 1)
    e[r + 1] && t.test(e[r]) && n.test(e[r + 1]) && (e[r] = e[r] + e[r + 1], e[r + 1] = null);
  return e;
}, wh = new RegExp("\\p{L} ?\\/ ?\\p{L}+$", "u"), Ph = function(e) {
  for (let t = 1; t < e.length - 1; t++)
    wh.test(e[t]) && (e[t - 1] += e[t] + e[t + 1], e[t] = null, e[t + 1] = null);
  return e;
}, kh = /\S/, Ah = /^[!?.]+$/, Ch = /(\S+)/;
let In = [
  ".",
  "?",
  "!",
  ":",
  ";",
  "-",
  "–",
  "—",
  "--",
  "...",
  "(",
  ")",
  "[",
  "]",
  '"',
  "'",
  "`",
  "«",
  "»",
  "*",
  "•"
];
In = In.reduce((e, t) => (e[t] = !0, e), {});
const Nh = function(e) {
  return Object.prototype.toString.call(e) === "[object Array]";
}, xh = function(e, t) {
  let n = [], r = [];
  if (e = e || "", typeof e == "number" && (e = String(e)), Nh(e))
    return e;
  const o = e.split(Ch);
  for (let i = 0; i < o.length; i++) {
    if (yh(o[i], t) === !0) {
      r = r.concat(bh(o[i]));
      continue;
    }
    r.push(o[i]);
  }
  let a = "";
  for (let i = 0; i < r.length; i++) {
    const s = r[i];
    kh.test(s) === !0 && In.hasOwnProperty(s) === !1 && Ah.test(s) === !1 ? (n.length > 0 ? (n[n.length - 1] += a, n.push(s)) : n.push(a + s), a = "") : a += s;
  }
  return a && (n.length === 0 && (n[0] = ""), n[n.length - 1] += a), n = Ph(n), n = vh(n), n = n.filter((i) => i), n;
}, Wr = new RegExp("\\p{Letter}", "u"), At = /[\p{Number}\p{Currency_Symbol}]/u, jh = /^[a-z]\.([a-z]\.)+/i, Th = /[sn]['’]$/, Ih = function(e, t) {
  const { prePunctuation: n, postPunctuation: r, emoticons: o } = t.one;
  let a = e, i = "", s = "";
  const u = Array.from(e);
  if (o.hasOwnProperty(e.trim()))
    return { str: e.trim(), pre: i, post: " " };
  let l = u.length;
  for (let c = 0; c < l; c += 1) {
    const h = u[0];
    if (n[h] !== !0) {
      if ((h === "+" || h === "-") && At.test(u[1]) || h === "'" && h.length === 3 && At.test(u[1]) || Wr.test(h) || At.test(h))
        break;
      i += u.shift();
    }
  }
  l = u.length;
  for (let c = 0; c < l; c += 1) {
    const h = u[u.length - 1];
    if (r[h] !== !0) {
      if (Wr.test(h) || At.test(h))
        break;
      h === "." && jh.test(a) === !0 || h === "'" && Th.test(a) === !0 || (s = u.pop() + s);
    }
  }
  return e = u.join(""), e === "" && (a = a.replace(/ *$/, (c) => (s = c || "", "")), e = a, i = ""), { str: e, pre: i, post: s };
}, $h = (e, t) => {
  const { str: n, pre: r, post: o } = Ih(e, t);
  return {
    text: n,
    pre: r,
    post: o,
    tags: /* @__PURE__ */ new Set()
  };
}, Dh = function(e, t) {
  const n = t.model.one.unicode || {};
  e = e || "";
  const r = e.split("");
  return r.forEach((o, a) => {
    n[o] && (r[a] = n[o]);
  }), r.join("");
}, Hh = function(e) {
  e = e || "", e = e.toLowerCase(), e = e.trim();
  const t = e;
  return e = e.replace(/[,;.!?]+$/, ""), e = e.replace(/\u2026/g, "..."), e = e.replace(/\u2013/g, "-"), /^[:;]/.test(e) === !1 && (e = e.replace(/\.{3,}$/g, ""), e = e.replace(/[",.!:;?)]+$/g, ""), e = e.replace(/^['"(]+/g, "")), e = e.replace(/[\u200B-\u200D\uFEFF]/g, ""), e = e.trim(), e === "" && (e = t), e = e.replace(/([0-9]),([0-9])/g, "$1$2"), e;
}, Eh = /([A-Z]\.)+[A-Z]?,?$/, Gh = /^[A-Z]\.,?$/, Oh = /[A-Z]{2,}('s|,)?$/, Fh = /([a-z]\.)+[a-z]\.?$/, zh = function(e) {
  return Eh.test(e) === !0 || Fh.test(e) === !0 || Gh.test(e) === !0 || Oh.test(e) === !0;
}, Vh = function(e) {
  return zh(e) && (e = e.replace(/\./g, "")), e;
}, Ea = function(e, t) {
  const n = t.methods.one.killUnicode;
  let r = e.text || "";
  r = Hh(r), r = n(r, t), r = Vh(r), e.normal = r;
}, Bh = function(e, t) {
  const { methods: n, model: r } = t, { splitSentences: o, splitTerms: a, splitWhitespace: i } = n.one.tokenize;
  return e = e || "", e = o(e, t).map((u) => {
    let l = a(u, r);
    return l = l.map((c) => i(c, r)), l.forEach((c) => {
      Ea(c, t);
    }), l;
  }), e;
}, Sh = /[ .][A-Z]\.? *$/i, Mh = /(?:\u2026|\.{2,}) *$/, Lh = new RegExp("\\p{L}", "u"), Kh = /\. *$/, Wh = /^[A-Z]\. $/, Jh = function(e, t) {
  if (Lh.test(e) === !1 || Sh.test(e) === !0 || e.length === 3 && Wh.test(e) || Mh.test(e) === !0)
    return !1;
  const r = e.replace(/[.!?\u203D\u2E18\u203C\u2047-\u2049] *$/, "").split(" "), o = r[r.length - 1].toLowerCase();
  return !(t.hasOwnProperty(o) === !0 && Kh.test(e) === !0);
}, Uh = {
  one: {
    killUnicode: Dh,
    tokenize: {
      splitSentences: mh,
      isSentence: Jh,
      splitTerms: xh,
      splitWhitespace: $h,
      fromString: Bh
    }
  }
}, qh = {
  "&": "and",
  "@": "at",
  "%": "percent",
  plz: "please",
  bein: "being"
}, Rh = [
  "approx",
  "apt",
  "bc",
  "cyn",
  "eg",
  "esp",
  "est",
  "etc",
  "ex",
  "exp",
  "prob",
  //probably
  "pron",
  // Pronunciation
  "gal",
  //gallon
  "min",
  "pseud",
  "fig",
  //figure
  "jd",
  "lat",
  //latitude
  "lng",
  //longitude
  "vol",
  //volume
  "fm",
  //not am
  "def",
  //definition
  "misc",
  "plz",
  //please
  "ea",
  //each
  "ps",
  "sec",
  //second
  "pt",
  "pref",
  //preface
  "pl",
  //plural
  "pp",
  //pages
  "qt",
  //quarter
  "fr",
  //french
  "sq",
  "nee",
  //given name at birth
  "ss",
  //ship, or sections
  "tel",
  "temp",
  "vet",
  "ver",
  //version
  "fem",
  //feminine
  "masc",
  //masculine
  "eng",
  //engineering/english
  "adj",
  //adjective
  "vb",
  //verb
  "rb",
  //adverb
  "inf",
  //infinitive
  "situ",
  // in situ
  "vivo",
  "vitro",
  "wr"
  //world record
], Qh = [
  "adj",
  "adm",
  "adv",
  "asst",
  "atty",
  "bldg",
  "brig",
  "capt",
  "cmdr",
  "comdr",
  "cpl",
  "det",
  "dr",
  "esq",
  "gen",
  "gov",
  "hon",
  "jr",
  "llb",
  "lt",
  "maj",
  "messrs",
  "mlle",
  "mme",
  "mr",
  "mrs",
  "ms",
  "mstr",
  "phd",
  "prof",
  "pvt",
  "rep",
  "reps",
  "res",
  "rev",
  "sen",
  "sens",
  "sfc",
  "sgt",
  "sir",
  "sr",
  "supt",
  "surg"
  //miss
  //misses
], _h = ["jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec"], Zh = [
  "ad",
  "al",
  "arc",
  "ba",
  "bl",
  "ca",
  "cca",
  "col",
  "corp",
  "ft",
  "fy",
  "ie",
  "lit",
  "ma",
  "md",
  "pd",
  "tce"
], Xh = ["dept", "univ", "assn", "bros", "inc", "ltd", "co"], Yh = [
  "rd",
  "st",
  "dist",
  "mt",
  "ave",
  "blvd",
  "cl",
  // 'ct',
  "cres",
  "hwy",
  //states
  "ariz",
  "cal",
  "calif",
  "colo",
  "conn",
  "fla",
  "fl",
  "ga",
  "ida",
  "ia",
  "kan",
  "kans",
  "minn",
  "neb",
  "nebr",
  "okla",
  "penna",
  "penn",
  "pa",
  "dak",
  "tenn",
  "tex",
  "ut",
  "vt",
  "va",
  "wis",
  "wisc",
  "wy",
  "wyo",
  "usafa",
  "alta",
  "ont",
  "que",
  "sask"
], ed = [
  "dl",
  "ml",
  "gal",
  // 'ft', //ambiguous
  "qt",
  "pt",
  "tbl",
  "tsp",
  "tbsp",
  "km",
  "dm",
  //decimeter
  "cm",
  "mm",
  "mi",
  "td",
  "hr",
  //hour
  "hrs",
  //hour
  "kg",
  "hg",
  "dg",
  //decigram
  "cg",
  //centigram
  "mg",
  //milligram
  "µg",
  //microgram
  "lb",
  //pound
  "oz",
  //ounce
  "sq ft",
  "hz",
  //hertz
  "mps",
  //meters per second
  "mph",
  "kmph",
  //kilometers per hour
  "kb",
  //kilobyte
  "mb",
  //megabyte
  // 'gb', //ambig
  "tb",
  //terabyte
  "lx",
  //lux
  "lm",
  //lumen
  // 'pa', //ambig
  "fl oz",
  //
  "yb"
], td = [
  [Rh],
  [ed, "Unit"],
  [Zh, "Noun"],
  [Qh, "Honorific"],
  [_h, "Month"],
  [Xh, "Organization"],
  [Yh, "Place"]
], Ga = {}, Kt = {};
td.forEach((e) => {
  e[0].forEach((t) => {
    Ga[t] = !0, Kt[t] = "Abbreviation", e[1] !== void 0 && (Kt[t] = [Kt[t], e[1]]);
  });
});
const nd = [
  "anti",
  "bi",
  "co",
  "contra",
  "de",
  "extra",
  "infra",
  "inter",
  "intra",
  "macro",
  "micro",
  "mis",
  "mono",
  "multi",
  "peri",
  "pre",
  "pro",
  "proto",
  "pseudo",
  "re",
  "sub",
  "supra",
  "trans",
  "tri",
  "un",
  "out",
  //out-lived
  "ex"
  //ex-wife
  // 'counter',
  // 'mid',
  // 'out',
  // 'non',
  // 'over',
  // 'post',
  // 'semi',
  // 'super', //'super-cool'
  // 'ultra', //'ulta-cool'
  // 'under',
  // 'whole',
].reduce((e, t) => (e[t] = !0, e), {}), rd = {
  like: !0,
  ish: !0,
  less: !0,
  able: !0,
  elect: !0,
  type: !0,
  designate: !0
  // 'fold':true,
}, Jr = {
  "!": "¡",
  "?": "¿Ɂ",
  '"': '“”"❝❞',
  "'": "‘‛❛❜’",
  "-": "—–",
  a: "ªÀÁÂÃÄÅàáâãäåĀāĂăĄąǍǎǞǟǠǡǺǻȀȁȂȃȦȧȺΆΑΔΛάαλАаѦѧӐӑӒӓƛæ",
  b: "ßþƀƁƂƃƄƅɃΒβϐϦБВЪЬвъьѢѣҌҍ",
  c: "¢©ÇçĆćĈĉĊċČčƆƇƈȻȼͻͼϲϹϽϾСсєҀҁҪҫ",
  d: "ÐĎďĐđƉƊȡƋƌ",
  e: "ÈÉÊËèéêëĒēĔĕĖėĘęĚěƐȄȅȆȇȨȩɆɇΈΕΞΣέεξϵЀЁЕеѐёҼҽҾҿӖӗễ",
  f: "ƑƒϜϝӺӻҒғſ",
  g: "ĜĝĞğĠġĢģƓǤǥǦǧǴǵ",
  h: "ĤĥĦħƕǶȞȟΉΗЂЊЋНнђћҢңҤҥҺһӉӊ",
  I: "ÌÍÎÏ",
  i: "ìíîïĨĩĪīĬĭĮįİıƖƗȈȉȊȋΊΐΪίιϊІЇіїi̇",
  j: "ĴĵǰȷɈɉϳЈј",
  k: "ĶķĸƘƙǨǩΚκЌЖКжкќҚқҜҝҞҟҠҡ",
  l: "ĹĺĻļĽľĿŀŁłƚƪǀǏǐȴȽΙӀӏ",
  m: "ΜϺϻМмӍӎ",
  n: "ÑñŃńŅņŇňŉŊŋƝƞǸǹȠȵΝΠήηϞЍИЙЛПийлпѝҊҋӅӆӢӣӤӥπ",
  o: "ÒÓÔÕÖØðòóôõöøŌōŎŏŐőƟƠơǑǒǪǫǬǭǾǿȌȍȎȏȪȫȬȭȮȯȰȱΌΘΟθοσόϕϘϙϬϴОФоѲѳӦӧӨөӪӫ",
  p: "ƤΡρϷϸϼРрҎҏÞ",
  q: "Ɋɋ",
  r: "ŔŕŖŗŘřƦȐȑȒȓɌɍЃГЯгяѓҐґ",
  s: "ŚśŜŝŞşŠšƧƨȘșȿЅѕ",
  t: "ŢţŤťŦŧƫƬƭƮȚțȶȾΓΤτϮТт",
  u: "ÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųƯưƱƲǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄΰυϋύ",
  v: "νѴѵѶѷ",
  w: "ŴŵƜωώϖϢϣШЩшщѡѿ",
  x: "×ΧχϗϰХхҲҳӼӽӾӿ",
  y: "ÝýÿŶŷŸƳƴȲȳɎɏΎΥΫγψϒϓϔЎУучўѰѱҮүҰұӮӯӰӱӲӳ",
  z: "ŹźŻżŽžƵƶȤȥɀΖ"
}, Oa = {};
Object.keys(Jr).forEach(function(e) {
  Jr[e].split("").forEach(function(t) {
    Oa[t] = e;
  });
});
const od = {
  "#": !0,
  //#hastag
  "@": !0,
  //@atmention
  _: !0,
  //underscore
  "°": !0,
  // '+': true,//+4
  // '\\-',//-4  (escape)
  // '.',//.4
  // zero-width chars
  "​": !0,
  "‌": !0,
  "‍": !0,
  "\uFEFF": !0
}, ad = {
  "%": !0,
  //88%
  _: !0,
  //underscore
  "°": !0,
  //degrees, italian ordinal
  // '\'',// sometimes
  // zero-width chars
  "​": !0,
  "‌": !0,
  "‍": !0,
  "\uFEFF": !0
}, id = {
  "<3": !0,
  "</3": !0,
  "<\\3": !0,
  ":^P": !0,
  ":^p": !0,
  ":^O": !0,
  ":^3": !0
}, sd = {
  one: {
    aliases: qh,
    abbreviations: Ga,
    prefixes: nd,
    suffixes: rd,
    prePunctuation: od,
    postPunctuation: ad,
    lexicon: Kt,
    //give this one forward
    unicode: Oa,
    emoticons: id
  }
}, Ur = /\//, ud = /[a-z]\.[a-z]/i, cd = /[0-9]/, ld = function(e, t) {
  const n = e.normal || e.text || e.machine, r = t.model.one.aliases;
  if (r.hasOwnProperty(n) && (e.alias = e.alias || [], e.alias.push(r[n])), Ur.test(n) && !ud.test(n) && !cd.test(n)) {
    const o = n.split(Ur);
    o.length <= 3 && o.forEach((a) => {
      a = a.trim(), a !== "" && (e.alias = e.alias || [], e.alias.push(a));
    });
  }
  return e;
}, hd = new RegExp("^\\p{Letter}+-\\p{Letter}+$", "u"), dd = function(e) {
  let t = e.implicit || e.normal || e.text;
  t = t.replace(/['’]s$/, ""), t = t.replace(/s['’]$/, "s"), t = t.replace(/([aeiou][ktrp])in'$/, "$1ing"), hd.test(t) && (t = t.replace(/-/g, "")), t = t.replace(/^[#@]/, ""), t !== e.normal && (e.machine = t);
}, fd = function(e) {
  const t = e.docs, n = {};
  for (let r = 0; r < t.length; r += 1)
    for (let o = 0; o < t[r].length; o += 1) {
      const a = t[r][o], i = a.machine || a.normal;
      n[i] = n[i] || 0, n[i] += 1;
    }
  for (let r = 0; r < t.length; r += 1)
    for (let o = 0; o < t[r].length; o += 1) {
      const a = t[r][o], i = a.machine || a.normal;
      a.freq = n[i];
    }
}, pd = function(e) {
  let t = 0, n = 0;
  const r = e.document;
  for (let o = 0; o < r.length; o += 1)
    for (let a = 0; a < r[o].length; a += 1) {
      const i = r[o][a];
      i.offset = {
        index: n,
        start: t + i.pre.length,
        length: i.text.length
      }, t += i.pre.length + i.text.length + i.post.length, n += 1;
    }
}, gd = function(e) {
  const t = e.document;
  for (let n = 0; n < t.length; n += 1)
    for (let r = 0; r < t[n].length; r += 1)
      t[n][r].index = [n, r];
}, md = function(e) {
  let t = 0;
  const n = e.docs;
  for (let r = 0; r < n.length; r += 1)
    for (let o = 0; o < n[r].length; o += 1)
      n[r][o].normal !== "" && (t += 1, n[r][o].wordCount = t);
}, sn = function(e, t) {
  const n = e.docs;
  for (let r = 0; r < n.length; r += 1)
    for (let o = 0; o < n[r].length; o += 1)
      t(n[r][o], e.world);
}, yd = {
  alias: (e) => sn(e, ld),
  machine: (e) => sn(e, dd),
  normal: (e) => sn(e, Ea),
  freq: fd,
  offset: pd,
  index: gd,
  wordCount: md
}, bd = {
  compute: yd,
  methods: Uh,
  model: sd,
  hooks: ["alias", "machine", "index", "id"]
}, vd = function(e) {
  const t = e.model.one.typeahead, n = e.docs;
  if (n.length === 0 || Object.keys(t).length === 0)
    return;
  const r = n[n.length - 1] || [], o = r[r.length - 1];
  if (!o.post && t.hasOwnProperty(o.normal)) {
    const a = t[o.normal];
    o.implicit = a, o.machine = a, o.typeahead = !0, e.compute.preTagger && e.last().unTag("*").compute(["lexicon", "preTagger"]);
  }
}, wd = { typeahead: vd }, Pd = function() {
  const e = this.docs;
  if (e.length === 0)
    return this;
  const t = e[e.length - 1] || [], n = t[t.length - 1];
  return n.typeahead === !0 && n.machine && (n.text = n.machine, n.normal = n.machine), this;
}, kd = function(e) {
  e.prototype.autoFill = Pd;
}, Ad = function(e, t, n) {
  let r = {};
  const o = [], a = n.prefixes || {};
  return e.forEach((i) => {
    i = i.toLowerCase().trim();
    let s = i.length;
    t.max && s > t.max && (s = t.max);
    for (let u = t.min; u < s; u += 1) {
      const l = i.substring(0, u);
      if (!(t.safe && n.model.one.lexicon.hasOwnProperty(l))) {
        if (a.hasOwnProperty(l) === !0) {
          o.push(l);
          continue;
        }
        if (r.hasOwnProperty(l) === !0) {
          o.push(l);
          continue;
        }
        r[l] = i;
      }
    }
  }), r = Object.assign({}, a, r), o.forEach((i) => {
    delete r[i];
  }), r;
}, Cd = (e) => Object.prototype.toString.call(e) === "[object Object]", Nd = {
  safe: !0,
  min: 3
}, xd = function(e = [], t = {}) {
  const n = this.model();
  t = Object.assign({}, Nd, t), Cd(e) && (Object.assign(n.one.lexicon, e), e = Object.keys(e));
  const r = Ad(e, t, this.world());
  return Object.keys(r).forEach((o) => {
    if (n.one.typeahead.hasOwnProperty(o)) {
      delete n.one.typeahead[o];
      return;
    }
    n.one.typeahead[o] = r[o];
  }), this;
}, jd = {
  typeahead: xd
}, Td = {
  one: {
    typeahead: {}
    //set a blank key-val
  }
}, Id = {
  model: Td,
  api: kd,
  lib: jd,
  compute: wd,
  hooks: ["typeahead"]
};
b.extend(ys);
b.extend(Qc);
b.extend(gc);
b.extend(ll);
b.extend(Yl);
b.plugin(Ks);
b.extend(bd);
b.extend(Us);
b.plugin(Di);
b.extend(hu);
b.extend(Id);
b.extend(ru);
b.extend(Nl);
const Fa = {
  // -a
  addendum: "addenda",
  corpus: "corpora",
  criterion: "criteria",
  curriculum: "curricula",
  genus: "genera",
  memorandum: "memoranda",
  opus: "opera",
  ovum: "ova",
  phenomenon: "phenomena",
  referendum: "referenda",
  // -ae
  alga: "algae",
  alumna: "alumnae",
  antenna: "antennae",
  formula: "formulae",
  larva: "larvae",
  nebula: "nebulae",
  vertebra: "vertebrae",
  // -is
  analysis: "analyses",
  axis: "axes",
  diagnosis: "diagnoses",
  parenthesis: "parentheses",
  prognosis: "prognoses",
  synopsis: "synopses",
  thesis: "theses",
  neurosis: "neuroses",
  // -x
  appendix: "appendices",
  index: "indices",
  matrix: "matrices",
  ox: "oxen",
  sex: "sexes",
  // -i
  alumnus: "alumni",
  bacillus: "bacilli",
  cactus: "cacti",
  fungus: "fungi",
  hippopotamus: "hippopotami",
  libretto: "libretti",
  modulus: "moduli",
  nucleus: "nuclei",
  octopus: "octopi",
  radius: "radii",
  stimulus: "stimuli",
  syllabus: "syllabi",
  // -ie
  cookie: "cookies",
  calorie: "calories",
  auntie: "aunties",
  movie: "movies",
  pie: "pies",
  rookie: "rookies",
  tie: "ties",
  zombie: "zombies",
  // -f
  leaf: "leaves",
  loaf: "loaves",
  thief: "thieves",
  // ee-
  foot: "feet",
  goose: "geese",
  tooth: "teeth",
  // -eaux
  beau: "beaux",
  chateau: "chateaux",
  tableau: "tableaux",
  // -ses
  bus: "buses",
  gas: "gases",
  circus: "circuses",
  crisis: "crises",
  virus: "viruses",
  database: "databases",
  excuse: "excuses",
  abuse: "abuses",
  avocado: "avocados",
  barracks: "barracks",
  child: "children",
  clothes: "clothes",
  echo: "echoes",
  embargo: "embargoes",
  epoch: "epochs",
  deer: "deer",
  halo: "halos",
  man: "men",
  woman: "women",
  mosquito: "mosquitoes",
  mouse: "mice",
  person: "people",
  quiz: "quizzes",
  rodeo: "rodeos",
  shoe: "shoes",
  sombrero: "sombreros",
  stomach: "stomachs",
  tornado: "tornados",
  tuxedo: "tuxedos",
  volcano: "volcanoes"
}, qr = {
  Comparative: "true¦bett1f0;arth0ew0in0;er",
  Superlative: "true¦earlier",
  PresentTense: "true¦bests,sounds",
  Condition: "true¦lest,unless",
  PastTense: "true¦began,came,d4had,kneel3l2m0sa4we1;ea0sg2;nt;eap0i0;ed;id",
  Participle: "true¦0:09;a06b01cZdXeat0fSgQhPoJprov0rHs7t6u4w1;ak0ithdra02o2r1;i02uY;k0v0;nd1pr04;ergoJoJ;ak0hHo3;e9h7lain,o6p5t4un3w1;o1um;rn;g,k;ol0reS;iQok0;ught,wn;ak0o1runk;ne,wn;en,wn;ewriNi1uJ;dd0s0;ut3ver1;do4se0t1;ak0h2;do2g1;roG;ne;ast0i7;iv0o1;ne,tt0;all0loBor1;bi3g2s1;ak0e0;iv0o9;dd0;ove,r1;a5eamt,iv0;hos0lu1;ng;e4i3lo2ui1;lt;wn;tt0;at0en,gun;r2w1;ak0ok0;is0;en",
  Gerund: "true¦accord0be0doin,go0result0stain0;ing",
  Expression: "true¦a0Yb0Uc0Sd0Oe0Mfarew0Lg0FhZjeez,lWmVnToOpLsJtIuFvEw7y0;a5e3i1u0;ck,p;k04p0;ee,pee;a0p,s;!h;!a,h,y;a5h2o1t0;af,f;rd up,w;atsoever,e1o0;a,ops;e,w;hoo,t;ery w06oi0L;gh,h0;! 0h,m;huh,oh;here nPsk,ut tut;h0ic;eesh,hh,it,oo;ff,h1l0ow,sst;ease,s,z;ew,ooey;h1i,mg,o0uch,w,y;h,o,ps;! 0h;hTmy go0wT;d,sh;a7evertheless,o0;!pe;eh,mm;ah,eh,m1ol0;!s;ao,fao;aCeBi9o2u0;h,mph,rra0zzC;h,y;l1o0;r6y9;la,y0;! 0;c1moCsmok0;es;ow;!p hip hoor0;ay;ck,e,llo,y;ha1i,lleluj0;ah;!ha;ah,ee4o1r0;eat scott,r;l1od0sh; grief,bye;ly;! whiz;ell;e0h,t cetera,ureka,ww,xcuse me;k,p;'oh,a0rat,uh;m0ng;mit,n0;!it;mon,o0;ngratulations,wabunga;a2oo1r0tw,ye;avo,r;!ya;h,m; 1h0ka,las,men,rgh,ye;!a,em,h,oy;la",
  Negative: "true¦n0;ever,o0;n,t",
  QuestionWord: "true¦how3wh0;at,e1ich,o0y;!m,se;n,re; come,'s",
  Reflexive: "true¦h4it5my5o1the0your2;ir1m1;ne3ur0;sel0;f,ves;er0im0;self",
  Plural: "true¦dick0gre0ones,records;ens",
  "Unit|Noun": "true¦cEfDgChBinchAk9lb,m6newt5oz,p4qt,t1y0;ardEd;able1b0ea1sp;!l,sp;spo1;a,t,x;on9;!b,g,i1l,m,p0;h,s;!les;!b,elvin,g,m;!es;g,z;al,b;eet,oot,t;m,up0;!s",
  Value: "true¦a few",
  Imperative: "true¦bewa0come he0;re",
  "Plural|Verb": "true¦leaves",
  Demonym: "true¦0:15;1:12;a0Vb0Oc0Dd0Ce08f07g04h02iYjVkTlPmLnIomHpEqatari,rCs7t5u4v3welAz2;am0Gimbabwe0;enezuel0ietnam0I;gAkrai1;aiwTex0hai,rinida0Ju2;ni0Prkmen;a5cotti4e3ingapoOlovak,oma0Spaniard,udRw2y0W;ede,iss;negal0Cr09;sh;mo0uT;o5us0Jw2;and0;a2eru0Fhilippi0Nortugu07uerto r0S;kist3lesti1na2raguay0;ma1;ani;ami00i2orweP;caragu0geri2;an,en;a3ex0Lo2;ngo0Drocc0;cedo1la2;gasy,y07;a4eb9i2;b2thua1;e0Cy0;o,t01;azakh,eny0o2uwaiI;re0;a2orda1;ma0Ap2;anO;celandic,nd4r2sraeli,ta01vo05;a2iB;ni0qi;i0oneU;aiAin2ondur0unO;di;amEe2hanai0reek,uatemal0;or2rm0;gi0;ilipino,ren8;cuadoVgyp4mira3ngli2sto1thiopi0urope0;shm0;ti;ti0;aPominUut3;a9h6o4roat3ub0ze2;ch;!i0;lom2ngol5;bi0;a6i2;le0n2;ese;lifor1m2na3;bo2eroo1;di0;angladeshi,el6o4r3ul2;gaE;azi9it;li2s1;vi0;aru2gi0;si0;fAl7merBngol0r5si0us2;sie,tr2;a2i0;li0;genti2me1;ne;ba1ge2;ri0;ni0;gh0r2;ic0;an",
  Organization: "true¦0:4Q;a3Tb3Bc2Od2He2Df27g1Zh1Ti1Pj1Nk1Ll1Gm12n0Po0Mp0Cqu0Br02sTtHuCv9w3xiaomi,y1;amaha,m1Bou1w1B;gov,tu3C;a4e2iki1orld trade organizati33;leaRped0O;lls fargo,st1;fie2Hinghou2R;l1rner br3U;gree3Jl street journ2Im1E;an halOeriz2Xisa,o1;dafo2Yl1;kswagMvo;b4kip,n2ps,s1;a tod3Aps;es3Mi1;lev3Fted natio3C;er,s; mobi32aco beRd bOe9gi frida3Lh3im horto3Amz,o1witt3D;shi49y1;ota,s r 05;e 1in lizzy;b3carpen3Jdaily ma3Dguess w2holli0s1w2;mashing pumpki35uprem0;ho;ea1lack eyed pe3Xyr0Q;ch bo3Dtl0;l2n3Qs1xas instrumen1U;co,la m1F;efoni0Kus;a8cientology,e5ieme2Ymirnoff,np,o3pice gir6quare0Ata1ubaru;rbuc1to34;ks;ny,undgard1;en;a2x pisto1;ls;g1Wrs;few2Minsbur31lesfor03msu2E;adiohead,b8e4o1yana3C;man empi1Xyal 1;b1dutch she4;ank;a3d 1max,vl20;bu1c2Ahot chili peppe2Ylobst2N;ll;ders dige1Ll madrid;c,s;ant3Aizn2Q;a8bs,e5fiz2Ihilip4i3r1;emier 1udenti1D;leagTo2K;nk floyd,zza hut; morrBs;psi2tro1uge0E;br33chi0Tn33;!co;lant2Un1yp16; 2ason27da2P;ld navy,pec,range juli2xf1;am;us;aAb9e6fl,h5i4o1sa,vid3wa;k2tre dame,vart1;is;ia;ke,ntendo,ss0QvZ;l,s;c,st1Otflix,w1; 1sweek;kids on the block,york0D;a,c;nd22s2t1;ional aca2Po,we0U;a,c02d0S;aDcdonalCe9i6lb,o3tv,y1;spa1;ce;b1Tnsanto,ody blu0t1;ley cr1or0T;ue;c2t1;as,subisO;helin,rosoft;dica2rcedes benz,talli1;ca;id,re;ds;cs milk,tt19z24;a3e1g,ittle caesa1P; ore09novo,x1;is,mark,us; 1bour party;pres0Dz boy;atv,fc,kk,lm,m1od1O;art;iffy lu0Roy divisi0Jpmorgan1sa;! cha09;bm,hop,k3n1tv;g,te1;l,rpol;ea;a5ewlett pack1Vi3o1sbc,yundai;me dep1n1P;ot;tac1zbollah;hi;lliburt08sbro;eneral 6hq,ithub,l5mb,o2reen d0Ou1;cci,ns n ros0;ldman sachs,o1;dye1g0H;ar;axo smith kli04encoW;electr0Nm1;oto0Z;a5bi,c barcelo4da,edex,i2leetwood m03o1rito l0G;rd,xcY;at,fa,nancial1restoZ; tim0;na;cebook,nnie mae;b0Asa,u3xxon1; m1m1;ob0J;!rosceptics;aiml0De5isney,o4u1;nkin donu2po0Zran dur1;an;ts;j,w jon0;a,f lepp12ll,peche mode,r spieg02stiny's chi1;ld;aJbc,hFiDloudflaCnn,o3r1;aigsli5eedence clearwater reviv1ossra09;al;c7inba6l4m1o0Est09;ca2p1;aq;st;dplSg1;ate;se;a c1o chanQ;ola;re;a,sco1tigroup;! systems;ev2i1;ck fil a,na daily;r1y;on;d2pital o1rls jr;ne;bury,ill1;ac;aEbc,eBf9l5mw,ni,o1p,rexiteeU;ei3mbardiIston 1;glo1pizza;be;ng;o2ue c1;roV;ckbuster video,omingda1;le; g1g1;oodriL;cht2e ge0rkshire hathaw1;ay;el;cardi,idu,nana republ3s1xt5y5;f,kin robbi1;ns;ic;bYcTdidSerosmith,iRlKmEnheuser busDol,ppleAr6s4u3v2y1;er;is,on;di,todesk;hland o1sociated E;il;b3g2m1;co;os;ys; compu1be0;te1;rs;ch;c,d,erican3t1;!r1;ak; ex1;pre1;ss; 5catel2ta1;ir;! lu1;ce1;nt;jazeera,qae1;da;g,rbnb;as;/dc,a3er,tivision1;! blizz1;ard;demy of scienc0;es;ba",
  Possessive: "true¦its,my,our0thy;!s",
  "Noun|Verb": "true¦0:9W;1:AA;2:96;3:A3;4:9R;5:A2;6:9K;7:8N;8:7L;9:A8;A:93;B:8D;C:8X;a9Ob8Qc7Id6Re6Gf5Sg5Hh55i4Xj4Uk4Rl4Em40n3Vo3Sp2Squ2Rr21s0Jt02u00vVwGyFzD;ip,oD;ne,om;awn,e6Fie68;aOeMhJiHoErD;ap,e9Oink2;nd0rDuC;kDry,sh5Hth;!shop;ck,nDpe,re,sh;!d,g;e86iD;p,sD;k,p0t2;aDed,lco8W;r,th0;it,lk,rEsDt4ve,x;h,te;!ehou1ra9;aGen5FiFoD;iDmAte,w;ce,d;be,ew,sA;cuum,l4B;pDr7;da5gra6Elo6A;aReQhrPiOoMrGuEwiDy5Z;n,st;nDrn;e,n7O;aGeFiEoDu6;t,ub2;bu5ck4Jgg0m,p;at,k,nd;ck,de,in,nsDp,v7J;f0i8R;ll,ne,p,r4Yss,t94uD;ch,r;ck,de,e,le,me,p,re;e5Wow,u6;ar,e,ll,mp0st,xt;g,lDng2rg7Ps5x;k,ly;a0Sc0Ne0Kh0Fi0Dk0Cl0Am08n06o05pXquaBtKuFwD;ea88iD;ng,pe,t4;bGit,m,ppErD;fa3ge,pri1v2U;lDo6S;e6Py;!je8;aMeLiKoHrEuDy2;dy,ff,mb2;a85eEiDo5Pugg2;ke,ng;am,ss,t4;ckEop,p,rD;e,m;ing,pi2;ck,nk,t4;er,m,p;ck,ff,ge,in,ke,lEmp,nd,p2rDte,y;!e,t;k,l;aJeIiHlGoFrDur,y;ay,e56inDu3;g,k2;ns8Bt;a5Qit;ll,n,r87te;ed,ll;m,n,rk;b,uC;aDee1Tow;ke,p;a5Je4FiDo53;le,rk;eep,iDou4;ce,p,t;ateboa7Ii;de,gnDl2Vnk,p,ze;!al;aGeFiEoDuff2;ck,p,re,w;ft,p,v0;d,i3Ylt0;ck,de,pe,re,ve;aEed,nDrv1It;se,t2N;l,r4t;aGhedu2oBrD;aEeDibb2o3Z;en,w;pe,t4;le,n,r2M;cDfegua72il,mp2;k,rifi3;aZeHhy6LiGoEuD;b,in,le,n,s5X;a6ck,ll,oDpe,u5;f,t;de,ng,ot,p,s1W;aTcSdo,el,fQgPje8lOmMnLo17pJque6sFturn,vDwa6V;eDi27;al,r1;er74oFpe8tEuD;lt,me;!a55;l71rt;air,eaDly,o53;l,t;dezvo2Zt;aDedy;ke,rk;ea1i4G;a6Iist0r5N;act6Yer1Vo71uD;nd,se;a38o6F;ch,s6G;c1Dge,iEke,lly,nDp1Wt1W;ge,k,t;n,se;es6Biv0;a04e00hYiXlToNrEsy4uD;mp,n4rcha1sh;aKeIiHoDu4O;be,ceFdu3fi2grDje8mi1p,te6;amDe6W;!me;ed,ss;ce,de,nt;sDy;er6Cs;cti3i1;iHlFoEp,re,sDuCw0;e,i5Yt;l,p;iDl;ce,sh;nt,s5V;aEce,e32uD;g,mp,n7;ce,nDy;!t;ck,le,n17pe,tNvot;a1oD;ne,tograph;ak,eFnErDt;fu55mA;!c32;!l,r;ckJiInHrFsEtDu1y;ch,e9;s,te;k,tD;!y;!ic;nt,r,se;!a7;bje8ff0il,oErDutli3Qver4B;bAd0ie9;ze;a4ReFoDur1;d,tD;e,i3;ed,gle8tD;!work;aMeKiIoEuD;rd0;ck,d3Rld,nEp,uDve;nt,th;it5EkD;ey;lk,n4Brr5CsDx;s,ta2B;asuBn4UrDss;ge,it;il,nFp,rk3WsEtD;ch,t0;h,k,t0;da5n0oeuvB;aLeJiHoEuD;mp,st;aEbby,ck,g,oDve;k,t;d,n;cDe,ft,mAnIst;en1k;aDc0Pe4vK;ch,d,k,p,se;bFcEnd,p,t4uD;gh,n4;e,k;el,o2U;eEiDno4E;ck,d,ll,ss;el,y;aEo1OuD;i3mp;m,zz;mpJnEr46ssD;ue;c1Rdex,fluGha2k,se2HteDvoi3;nt,rD;e6fa3viD;ew;en3;a8le2A;aJeHiGoEuD;g,nt;l3Ano2Dok,pDr1u1;!e;ghli1Fke,nt,re,t;aDd7lp;d,t;ck,mGndFrEsh,tDu9;ch,e;bo3Xm,ne4Eve6;!le;!m0;aMear,ift,lKossJrFuD;arDe4Alp,n;antee,d;aFiEoDumb2;uCwth;ll,nd,p;de,sp;ip;aBoDue;ss,w;g,in,me,ng,s,te,ze;aZeWiRlNoJrFuD;ck,el,nDss,zz;c38d;aEoDy;st,wn;cDgme,me,nchi1;tuB;cFg,il,ld,rD;ce,e29mDwa31;!at;us;aFe0Vip,oDy;at,ck,od,wD;!er;g,ke,me,re,sh,vo1E;eGgFlEnDre,sh,t,x;an3i0Q;e,m,t0;ht,uB;ld;aEeDn3;d,l;r,tuB;ce,il,ll,rm,vo2W;cho,d7ffe8nMsKxFyeD;!baD;ll;cGerci1hFpDtra8;eriDo0W;en3me9;au6ibA;el,han7u1;caDtima5;pe;count0d,vy;a01eSiMoJrEuDye;b,el,mp,pli2X;aGeFiEoD;ne,p;ft,ll,nk,p,ve;am,ss;ft,g,in;cEd7ubt,wnloD;ad;k,u0E;ge6p,sFt4vD;e,iDor3;de;char7gui1h,liEpD;at4lay,u5;ke;al,bKcJfeIlGmaCposAsEtaD;il;e07iD;gn,re;ay,ega5iD;ght;at,ct;li04rea1;a5ut;b,ma7n3rDte;e,t;a0Eent0Dh06irc2l03oKrFuD;be,e,rDt;b,e,l,ve;aGeFoEuDy;sh;p,ss,wd;dAep;ck,ft,sh;at,de,in,lTmMnFordina5py,re,st,uDv0;gh,nDp2rt;s01t;ceHdu8fli8glomeIsFtDveN;a8rD;a6ol;e9tru8;ct;ntDrn;ra5;bHfoGmFpD;leDouCromi1;me9;aCe9it,u5;rt;at,iD;ne;lap1oD;r,ur;aEiDoud,ub;ck,p;im,w;aEeDip;at,ck,er;iGllen7nErD;ge,m,t;ge,nD;el;n,r;er,re;ke,ll,mp,noe,pGrXsFtEuDve;se,ti0I;alog,ch;h,t;!tuB;re;a03eZiXlToPrHuEyD;pa11;bb2ck2dgEff0mp,rDst,zz;den,n;et;anJeHiFoadEuD;i1sh;ca6;be,d7;ge;aDed;ch,k;ch,d;aFg,mb,nEoDrd0tt2x,ycott;k,st,t;d,e;rd,st;aFeCiDoYur;nk,tz;nd;me;as,d,ke,nd,opsy,tD;!ch,e;aFef,lt,nDt;d,efA;it;r,t;ck,il,lan3nIrFsEtt2;le;e,h;!gDk;aDe;in;!d,g,k;bu1c05dZge,iYlVnTppQrLsIttGucEwaD;rd;tiD;on;aDempt;ck;k,sD;i6ocia5;st;chFmD;!oD;ur;!iD;ve;eEroa4;ch;al;chDg0sw0;or;aEt0;er;rm;d,m,r;dreHvD;an3oD;ca5;te;ce;ss;cDe,he,t;eFoD;rd,u9;nt;nt,ss;se",
  Actor: "true¦0:7B;1:7G;2:6A;3:7F;4:7O;5:7K;a6Nb62c4Ud4Be41f3Sg3Bh30i2Uj2Qkin2Pl2Km26n1Zo1Sp0Vqu0Tr0JsQtJuHvEw8yo6;gi,ut6;h,ub0;aAe9i8o7r6;estl0it0;m2rk0;fe,nn0t2Bza2H;atherm2ld0;ge earn0it0nder0rri1;eter7i6oyF;ll5Qp,s3Z;an,ina2U;n6s0;c6Uder03;aoisea23e9herapi5iktok0o8r6ut1yco6S;a6endseLo43;d0mp,nscri0Bvel0;ddl0u1G;a0Qchn7en6na4st0;ag0;i3Oo0D;aiXcUeRhPiMki0mu26oJpGquaFtBu7wee6;p0theart;lt2per7r6;f0ge6Iviv1;h6inten0Ist5Ivis1;ero,um2;a8ep7r6;ang0eam0;bro2Nc2Ofa2Nmo2Nsi20;ff0tesm2;tt0;ec7ir2Do6;kesp59u0M;ia5Jt3;l7me6An,rcere6ul;r,ss;di0oi5;n7s6;sy,t0;g0n0;am2ephe1Iow6;girl,m2r2Q;cretInior cit3Fr6;gea4v6;a4it1;hol4Xi7reen6ulpt1;wr2C;e01on;l1nt;aEe9o8u6;l0nn6;er up,ingE;g40le mod3Zof0;a4Zc8fug2Ppo32searQv6;ere4Uolution6;ary;e6luYru22;ptio3T;bbi,dic5Vpp0;arter6e2Z;back;aYeWhSiRlOoKr8sycho7u6;nk,p31;logi5;aGeDiBo6;d9fess1g7ph47s6;pe2Ktitu51;en6ramm0;it1y;igy,uc0;est4Nme mini0Unce6s3E;!ss;a7si6;de4;ch0;ctiti39nk0P;dca0Oet,li6pula50rnst42;c2Itic6;al scie6i2;nti5;a6umb0;nn0y6;er,ma4Lwright;lgrim,one0;a8iloso7otogra7ra6ysi1V;se;ph0;ntom,rmaci5;r6ssi1T;form0s4O;i3El,nel3Yr8st1tr6wn;i6on;arWot;ent4Wi42tn0;ccupa4ffBp8r7ut6;ca5l0B;ac4Iganiz0ig2Fph2;er3t6;i1Jomet6;ri5;ic0spring;aBe9ie4Xo7u6;n,rser3J;b6mad,vi4V;le2Vo4D;i6mesis,phew;ce,ghb1;nny,rr3t1X;aEeDiAo7u6yst1Y;m8si16;der3gul,m7n6th0;arDk;!my;ni7s6;f02s0Jt0;on,st0;chan1Qnt1rcha4;gi9k0n8rtyr,t6y1;e,riar6;ch;ag0iac;ci2stra3I;a7e2Aieutena4o6;rd,s0v0;bor0d7ndlo6ss,urea3Fwy0ym2;rd;!y;!s28;e8o7u6;ggl0;gg0urna2U;st0;c3Hdol,llu3Ummigra4n6; l9c1Qfa4habi42nov3s7ve6;nt1stig3;pe0Nt6;a1Fig3ru0M;aw;airFeBistoAo8u6ygie1K;man6sba2H;!ita8;bo,st6usekN;age,e3P;ri2;ir,r6;m7o6;!ine;it;dress0sty2C;aLeIhostGirl26ladi3oCrand7u6;e5ru;c9daug0Jfa8m7pa6s2Y;!re4;a,o6;th0;hi1B;al7d6lf0;!de3A;ie,k6te26;eep0;!wr6;it0;isha,n6;i6tl04;us;mbl0rden0;aDella,iAo7r6;eela2Nie1P;e,re6ster pare4;be1Hm2r6st0;unn0;an2ZgZlmm17nanci0r6tt0;e6st la2H; marsh2OfigXm2;rm0th0;conoEdDlectriCm8n7x6;amin0cellency,i2A;emy,trepreneur,vironmenta1J;c8p6;er1loye6;e,r;ee;ci2;it1;mi5;aKeBi8ork,ri7u6we02;de,tche2H;ft0v0;ct3eti7plom2Hre6va;ct1;ci2ti2;aDcor3fencCi0InAput9s7tectLvel6;op0;ce1Ge6ign0;rt0;ee,y;iz6;en;em2;c1Ml0;d8nc0redev7ug6;ht0;il;!dy;a06e04fo,hXitizenWlToBr9u6;r3stomer6;! representat6;ive;e3it6;ic;lJmGnAord9rpor1Nu7w6;boy,ork0;n6ri0;ciTte1Q;in3;fidantAgressSs9t6;e0Kr6;ibut1o6;ll0;tab13ul1O;!e;edi2m6pos0rade;a0EeQissi6;on0;leag8on7um6;ni5;el;ue;e6own;an0r6;ic,k;!s;a9e7i6um;ld;erle6f;ad0;ir7nce6plFract0;ll1;m2wI;lebri6o;ty;dBptAr6shi0;e7pe6;nt0;r,t6;ak0;ain;et;aMeLiJlogg0oErBu6;dd0Fild0rgl9siness6;m2p7w6;om2;ers05;ar;i7o6;!k0th0;cklay0de,gadi0;hemi2oge8y6;!frie6;nd;ym2;an;cyc6sR;li5;atbox0ings;by,nk0r6;b0on7te6;nd0;!e07;c04dWge4nQpLrHsFtAu7yatull6;ah;nt7t6;h1oG;!ie;h8t6;e6orney;nda4;ie5le6;te;sis00tron6;aut,om0;chbis8isto7tis6;an,t;crU;hop;ost9p6;ari6rentiS;ti6;on;le;a9cest1im3nou8y6;bo6;dy;nc0;ly5rc6;hi5;mi8v6;entur0is1;er;ni7r6;al;str3;at1;or;counBquaintanArob9t6;ivi5or,re6;ss;st;at;ce;ta4;nt",
  "Adj|Noun": "true¦0:16;a1Db17c0Ud0Re0Mf0Dg0Ah08i06ju05l02mWnUoSpNrIsBt7u4v1watershed;a1ision0Z;gabo4nilla,ria1;b0Vnt;ndergr1pstairs;adua14ou1;nd;a3e1oken,ri0;en,r1;min0rori13;boo,n;age,e5ilv0Flack,o3quat,ta2u1well;bordina0Xper5;b0Lndard;ciali0Yl1vereign;e,ve16;cret,n1ri0;ior;a4e2ou1ubbiL;nd,tiY;ar,bBl0Wnt0p1side11;resent0Vublican;ci0Qsh;a4eriodic0last0Zotenti0r1;emi2incip0o1;!fession0;er,um;rall4st,tie0U;ff1pposi0Hv0;ens0Oi0C;agg01ov1uts;el;a5e3iniatJo1;bi01der07r1;al,t0;di1tr0N;an,um;le,riG;attOi2u1;sh;ber0ght,qC;stice,veniT;de0mpressioYn1;cumbe0Edividu0no0Dsta0Eterim;alf,o1umdrum;bby,melF;en2old,ra1;ph0Bve;er0ious;a7e5i4l3u1;git03t1;ure;uid;ne;llow,m1;aFiL;ir,t,vo1;riOuriO;l3p00x1;c1ecutUpeV;ess;d1iK;er;ar2e1;mographUrivO;k,l2;hiGlassSo2rude,unn1;ing;m5n1operK;creCstitueOte2vertab1;le;mpor1nt;ary;ic,m2p1;anion,lex;er2u1;ni8;ci0;al;e5lank,o4r1;i2u1;te;ef;ttom,urgeois;st;cadem9d6l2ntarct9r1;ab,ct8;e3tern1;at1;ive;rt;oles1ult;ce1;nt;ic",
  "Adj|Past": "true¦0:4Q;1:4C;2:4H;3:4E;a44b3Tc36d2Je29f20g1Wh1Si1Jj1Gkno1Fl1Am15n12o0Xp0Mqu0Kr08sLtEuAv9w4yellow0;a7ea6o4rinkl0;r4u3Y;n,ri0;k31th3;rp0sh0tZ;ari0e1O;n5p4s0;d1li1Rset;cov3derstood,i4;fi0t0;a8e3Rhr7i6ouTr4urn0wi4C;a4imm0ou2G;ck0in0pp0;ed,r0;eat2Qi37;m0nn0r4;get0ni2T;aOcKeIhGimFm0Hoak0pDt7u4;bsid3Ogge44s4;pe4ta2Y;ct0nd0;a8e7i2Eok0r5u4;ff0mp0nn0;ength2Hip4;ed,p0;am0reotyp0;in0t0;eci4ik0oH;al3Efi0;pRul1;a4ock0ut;d0r0;a4c1Jle2t31;l0s3Ut0;a6or5r4;at4e25;ch0;r0tt3;t4ut0;is2Mur1;aEe5o4;tt0;cAdJf2Bg9je2l8m0Knew0p7qu6s4;eTpe2t4;or0ri2;e3Dir0;e1lac0;at0e2Q;i0Rul1;eiv0o4ycl0;mme2Lrd0v3;in0lli0ti2A;a4ot0;li28;aCer30iBlAo9r5u4;mp0zzl0;e6i2Oo4;ce2Fd4lo1Anou30pos0te2v0;uc0;fe1CocCp0Iss0;i2Kli1L;ann0e2CuS;ck0erc0ss0;ck0i2Hr4st0;allLk0;bse7c6pp13rgan2Dver4;lo4whelm0;ok0;cupi0;rv0;aJe5o4;t0uri1A;ed0gle2;a6e5ix0o4ut0ys1N;di1Nt15u26;as0Clt0;n4rk0;ag0ufact0A;e6i5o4;ad0ck0st,v0;cens0m04st0;ft,v4;el0;tt0wn;a5o15u4;dg0s1B;gg0;llumSmpAn4sol1;br0cre1Ldebt0f8jZspir0t5v4;it0olv0;e4ox0Y;gr1n4re23;d0si15;e2l1o1Wuri1;li0o01r4;ov0;a6e1o4um03;ok0r4;ri0Z;mm3rm0;i6r5u4;a1Bid0;a0Ui0Rown;ft0;aAe9i8l6oc0Ir4;a4i0oz0Y;ctHg19m0;avo0Ju4;st3;ni08tt0x0;ar0;d0il0sc4;in1;dCl1mBn9quipp0s8x4;agger1c6p4te0T;a0Se4os0;ct0rie1D;it0;cap0tabliZ;cha0XgFha1As4;ur0;a0Zbarra0N;i0Buc1;aMeDi5r4;a01i0;gni08miniSre2s4;a9c6grun0Ft4;o4re0Hu17;rt0;iplWou4;nt0r4;ag0;bl0;cBdRf9l8p7ra6t5v4;elop0ot0;ail0ermQ;ng0;re07;ay0ight0;e4in0o0M;rr0;ay0enTor1;m5t0z4;ed,zl0;ag0p4;en0;aPeLhIlHo9r6u4;lt4r0stom03;iv1;a5owd0u4;sh0;ck0mp0;d0loAm7n4ok0v3;centr1f5s4troC;id3olid1;us0;b5pl4;ic1;in0;r0ur0;assi9os0utt3;ar5i4;ll0;g0m0;lebr1n6r4;ti4;fi0;tralJ;g0lcul1;aDewild3iCl9o7r5urn4;ed,t;ok4uis0;en;il0r0t4und;tl0;e5i4;nd0;ss0;as0;ffl0k0laMs0tt3;bPcNdKfIg0lFmaz0nDppBrm0ss9u5wa4;rd0;g5thor4;iz0;me4;nt0;o6u4;m0r0;li0re4;ci1;im1ticip1;at0;a5leg0t3;er0;rm0;fe2;ct0;ju5o7va4;nc0;st0;ce4knowledg0;pt0;and5so4;rb0;on0;ed",
  Singular: "true¦0:5J;1:5H;2:4W;3:4S;4:52;5:57;6:5L;7:56;8:5B;a52b4Lc3Nd35e2Xf2Og2Jh28in24j23k22l1Um1Ln1Ho1Bp0Rqu0Qr0FsZtMuHvCw9x r58yo yo;a9ha3Po3Q;f3i4Rt0Gy9;! arou39;arCeAideo ga2Qo9;cabu4Jl5C;gOr9t;di4Zt1Y;iety,ni4P;nBp30rAs 9;do43s5E;bani1in0;coordinat3Ader9;estima1to24we41; rex,aKeJhHiFoErBuAv9;! show;m2On2rntLto1D;agedy,ib9o4E;e,u9;n0ta46;ni1p2rq3L;c,er,m9;etF;ing9ree26;!y;am,mp3F;ct2le6x return;aNcMeKhor4QiJkHoGpin off,tDuBy9;ll9ner7st4T;ab2X;b9i1n28per bowl,rro1X;st3Ltot0;atAipe2Go1Lrate7udent9;! lo0I;i39u1;ft ser4Lmeo1I;elet5i9;ll,r3V;b38gn2Tte;ab2Jc9min3B;t,urity gua2N;e6ho2Y;bbatic0la3Jndwi0Qpi5;av5eDhetor2iAo9;de6om,w;tAv9;erb2C;e,u0;bDcBf9publ2r10spi1;er9orm3;e6r0;i9ord label;p2Ht0;a1u46;estion mark,ot2F;aPeMhoLiIlGoErAu9yram1F;ddi3HpErpo1Js3J;eBo9;bl3Zs9;pe3Jta1;dic1Rmi1Fp1Qroga8ss relea1F;p9rt0;py;a9ebisci1;q2Dte;cn2eAg9;!gy;!r;ne call,tocoK;anut,dAr9t0yo1;cen3Jsp3K;al,est0;nop4rAt9;e,hog5;adi11i2V;atme0bj3FcBpia1rde0thers,utspok5ve9wn3;n,r9;ti0Pview;cuAe9;an;pi3;arBitAot9umb3;a2Fhi2R;e,ra1;cot2ra8;aFeCiAo9ur0;nopo4p18rni2Nsq1Rti36uld;c,li11n0As9tt5;chief,si34;dAnu,t9;al,i3;al,ic;gna1mm0nd15rsupi0te9yf4;ri0;aDegCiBu9;ddi1n9;ch;me,p09; Be0M;bor14y9; 9er;up;eyno1itt5;el4ourn0;cBdices,itia8ni25sAtel0Lvert9;eb1J;e28titu1;en8i2T;aIeEighDoAu9;man right,s22;me9rmoFsp1Ftb0K;! r9;un; scho0YriY;a9i1N;d9v5; start,pho9;ne;ndful,sh brown,v5ze;aBelat0Ilaci3r9ul4yp1S;an9enadi3id;a1Cd slam,ny;df4r9;l2ni1I;aGeti1HiFlu1oCrAun9;er0;ee market,i9onti3;ga1;l4ur9;so9;me;ePref4;br2mi4;conoFffi7gg,lecto0Rmbas1EnCpidem2s1Zth2venBxAyel9;id;ampZempl0Nte6;i19t;er7terp9;ri9;se;my;eLiEoBr9ump tru0U;agonf4i9;er,ve thru;cAg7i4or,ssi3wn9;side;to0EumenE;aEgniDnn3sAvide9;nd;conte6incen8p9tri11;osi9;ti0C;ta0H;le0X;athBcAf9ni0terre6;ault 05err0;al,im0;!b9;ed;aWeThMiLlJoDr9;edit caBuc9;ib9;le;rd;efficDke,lCmmuniqLnsApi3rr0t0Xus9yo1;in;erv9uI;ato02;ic,lQ;ie6;er7i9oth;e6n2;ty,vil wM;aDeqCick5ocoBr9;istmas car9ysanthemum;ol;la1;ue;ndeli3racteri9;st2;iAllEr9;e0tifica1;liZ;hi3nFpErCt9ucus;erpi9hedr0;ll9;ar;!bohyd9ri3;ra1;it0;aAe,nib0t9;on;l,ry;aMeLiop2leJoHrDu9;nny,r9tterf4;g9i0;la9;ry;eakAi9;ck;fa9throB;st;dy,ro9wl;ugh;mi9;sh;an,l4;nkiArri3;er;ng;cSdMlInFppeti1rDsBtt2utop9;sy;ic;ce6pe9;ct;r9sen0;ay;ecAoma4tiA;ly;do1;i5l9;er7y;gy;en; hominDjAvan9;tage;ec8;ti9;ve;em;cCeAqui9;tt0;ta1;te;iAru0;al;de6;nt",
  "Person|Noun": "true¦a0Eb07c03dWeUfQgOhLjHkiGlFmCnBolive,p7r4s3trini06v1wa0;ng,rd,tts;an,enus,iol0;a,et;ky,onPumm09;ay,e1o0uby;bin,d,se;ed,x;a2e1o0;l,tt04;aLnJ;dYge,tR;at,orm;a0eloW;t0x,ya;!s;a9eo,iH;ng,tP;a2e1o0;lGy;an,w3;de,smi4y;a0erb,iOolBuntR;ll,z0;el;ail,e0iLuy;ne;a1ern,i0lo;elds,nn;ith,n0;ny;a0dEmir,ula,ve;rl;a4e3i1j,ol0;ly;ck,x0;ie;an,ja;i0wn;sy;am,h0liff,rystal;a0in,ristian;mbers,ri0;ty;a4e3i2o,r0ud;an0ook;dy;ll;nedict,rg;k0nks;er;l0rt;fredo,ma",
  "Actor|Verb": "true¦aCb8c5doctor,engineAfool,g3host,judge,m2nerd,p1recruit,scout,ushAvolunteAwi0;mp,tneA;arent,ilot;an,ime;eek,oof,r0uide;adu8oom;ha1o0;ach,nscript,ok;mpion,uffeur;o2u0;lly,tch0;er;ss;ddi1ffili0rchite1;ate;ct",
  MaleName: "true¦0:H6;1:FZ;2:DS;3:GQ;4:CZ;5:FV;6:GM;7:FP;8:GW;9:ET;A:C2;B:GD;aF8bE1cCQdBMeASfA1g8Yh88i7Uj6Sk6Bl5Mm48n3So3Ip33qu31r26s1Et0Ru0Ov0CwTxSyHzC;aCor0;cChC1karia,nAT;!hDkC;!aF6;!ar7CeF5;aJevgenBSoEuC;en,rFVsCu3FvEF;if,uf;nDs6OusC;ouf,s6N;aCg;s,tC;an,h0;hli,nCrosE1ss09;is,nC;!iBU;avi2ho5;aPeNiDoCyaEL;jcieBJlfgang,odrFutR;lFnC;f8TsC;lCt1;ow;bGey,frEhe4QlC;aE5iCy;am,e,s;ed8iC;d,ed;eAur;i,ndeD2rn2sC;!l9t1;lDyC;l1ne;lDtC;!er;aCHy;aKernDAiFladDoC;jteB0lodymyr;!iC;mFQsDB;cFha0ktBZnceDrgCOvC;a0ek;!nC;t,zo;!e4StBV;lCnC7sily;!entC;in9J;ghE2lCm70nax,ri,sm0;riCyss87;ch,k;aWeRhNiLoGrEuDyC;!l2roEDs1;n6r6E;avD0eCist0oy,um0;ntCRvBKy;bFdAWmCny;!asDmCoharu;aFFie,y;!z;iA6y;mCt4;!my,othy;adEeoDia0SomC;!as;!dor91;!de4;dFrC;enBKrC;anBJeCy;ll,nBI;!dy;dgh,ha,iCnn2req,tsu5V;cDAka;aYcotWeThPiMlobod0oKpenc2tEurDvenAEyCzym1;ed,lvest2;aj,e9V;anFeDuC;!aA;fan17phEQvCwaA;e77ie;!islaCl9;v,w;lom1rBuC;leymaDHta;dDgmu9UlCm1yabonga;as,v8B;!dhart8Yn9;aEeClo75;lCrm0;d1t1;h9Jne,qu1Jun,wn,yne;aDbastiEDk2Yl5Mpp,rgCth,ymoCU;e1Dio;m4n;!tC;!ie,y;eDPlFmEnCq67tosCMul;dCj2UtiA5;e01ro;!iATkeB6mC4u5;!ik,vato9K;aZeUheC8iRoGuDyC;an,ou;b99dDf4peAssC;!elEG;ol00y;an,bLc7MdJel,geIh0lHmGnEry,sDyC;!ce;ar7Ocoe,s;!aCnBU;ld,n;an,eo;a7Ef;l7Jr;e3Eg2n9olfo,riC;go;bBNeDH;cCl9;ar87c86h54kCo;!ey,ie,y;cFeA3gDid,ubByCza;an8Ln06;g85iC;naC6s;ep;ch8Kfa5hHin2je8HlGmFndEoHpha5sDul,wi36yC;an,mo8O;h9Im4;alDSol3O;iD0on;f,ph;ul;e9CinC;cy,t1;aOeLhilJiFrCyoG;aDeC;m,st1;ka85v2O;eDoC;tr;r8GtC;er,ro;!ipCl6H;!p6U;dCLrcy,tC;ar,e9JrC;!o7;b9Udra8So9UscAHtri62ulCv8I;!ie,o7;ctav6Ji2lImHndrBRrGsDtCum6wB;is,to;aDc6k6m0vCwaBE;al79;ma;i,vR;ar,er;aDeksandr,ivC;er,i2;f,v;aNeLguyBiFoCu3O;aDel,j4l0ma0rC;beAm0;h,m;cFels,g5i9EkDlC;es,s;!au,h96l78olaC;!i,y;hCkCol76;ol75;al,d,il,ls1vC;ilAF;hom,tC;e,hC;anCy;!a5i5;aYeViLoGuDyC;l4Nr1;hamDr84staC;fa,p6E;ed,mG;di10e,hamEis4JntDritz,sCussa;es,he;e,y;ad,ed,mC;ad,ed;cGgu5hai,kFlEnDtchC;!e8O;a9Pik;house,o7t1;ae73eC3ha8Iolaj;ah,hDkC;!ey,y;aDeC;al,l;el,l;hDlv3rC;le,ri8Ev4T;di,met;ay0c00gn4hWjd,ks2NlTmadZnSrKsXtDuric7VxC;imilBKwe8B;eHhEi69tCus,y69;!eo,hCia7;ew,i67;eDiC;as,eu,s;us,w;j,o;cHiGkFlEqu8Qsha83tCv3;iCy;!m,n;in,on;el,o7us;a6Yo7us;!elCin,o7us;!l8o;frAEi5Zny,u5;achDcoCik;lm;ai,y;amDdi,e5VmC;oud;adCm6W;ou;aulCi9P;ay;aWeOiMloyd,oJuDyC;le,nd1;cFdEiDkCth2uk;a7e;gi,s,z;ov7Cv6Hw6H;!as,iC;a6Een;g0nn52renDuCvA4we7D;!iS;!zo;am,n4oC;n5r;a9Yevi,la5KnHoFst2thaEvC;eCi;nte;bo;nCpo8V;!a82el,id;!nC;aAy;mEnd1rDsz73urenCwr6K;ce,t;ry,s;ar,beAont;aOeIhalHiFla4onr63rDu5SylC;e,s;istCzysztof;i0oph2;er0ngsl9p,rC;ilA9k,ollos;ed,id;en0iGnDrmCv4Z;it;!dDnCt1;e2Ny;ri4Z;r,th;cp2j4mEna8BrDsp6them,uC;ri;im,l;al,il;a03eXiVoFuC;an,lCst3;en,iC;an,en,o,us;aQeOhKkub4AnIrGsDzC;ef;eDhCi9Wue;!ua;!f,ph;dCge;i,on;!aCny;h,s,th6J;anDnC;!ath6Hie,n72;!nC;!es;!l,sCy;ph;o,qu3;an,mC;!i,m6V;d,ffFns,rCs4;a7JemDmai7QoCry;me,ni1H;i9Dy;!e73rC;ey,y;cKdBkImHrEsDvi2yC;dBs1;on,p2;ed,oDrCv67;e6Qod;d,s61;al,es5Wis1;a,e,oCub;b,v;ob,qu13;aTbNchiMgLke53lija,nuKonut,rIsEtCv0;ai,suC;ki;aDha0i8XmaCsac;el,il;ac,iaC;h,s;a,vinCw3;!g;k,nngu6X;nac1Xor;ka;ai,rahC;im;aReLoIuCyd6;beAgGmFsC;eyDsC;a3e3;in,n;ber5W;h,o;m2raDsse3wC;a5Pie;c49t1K;a0Qct3XiGnDrC;beAman08;dr7VrC;iCy2N;!k,q1R;n0Tt3S;bKlJmza,nIo,rEsDyC;a5KdB;an,s0;lEo67r2IuCv9;hi5Hki,tC;a,o;an,ey;k,s;!im;ib;a08e00iUlenToQrMuCyorgy;iHnFsC;!taC;f,vC;!e,o;n6tC;er,h2;do,lC;herDlC;auCerQ;me;aEegCov2;!g,orC;!io,y;dy,h7C;dfr9nza3XrDttfC;ri6C;an,d47;!n;acoGlEno,oCuseppe;rgiCvan6O;!o,s;be6Ies,lC;es;mo;oFrC;aDha4HrCt;it,y;ld,rd8;ffErgC;!e7iCy;!os;!r9;bElBrCv3;eCla1Nr4Hth,y;th;e,rC;e3YielC;!i4;aXeSiQlOorrest,rCyod2E;aHedFiC;edDtC;s,z;ri18;!d42eri11riC;ck,k;nCs2;cEkC;ie,lC;in,yn;esLisC;!co,z3M;etch2oC;ri0yd;d5lConn;ip;deriFliEng,rC;dinaCg4nan0B;nd8;pe,x;co;bCdi,hd;iEriC;ce,zC;io;an,en,o;benez2dZfrYit0lTmMnJo3rFsteb0th0ugenEvCymBzra;an,eCge4D;ns,re3K;!e;gi,iDnCrol,v3w3;est8ie,st;cCk;!h,k;o0DriCzo;co,qC;ue;aHerGiDmC;aGe3A;lCrh0;!iC;a10o,s;s1y;nu5;beAd1iEliDm2t1viCwood;n,s;ot28s;!as,j5Hot,sC;ha;a3en;!dGg6mFoDua2QwC;a2Pin;arC;do;oZuZ;ie;a04eTiOmitrNoFrag0uEwDylC;an,l0;ay3Hig4D;a3Gdl9nc0st3;minFnDri0ugCvydGy2S;!lF;!a36nCov0;e1Eie,y;go,iDykC;as;cCk;!k;i,y;armuFetDll1mitri7neCon,rk;sh;er,m6riC;ch;id;andLepak,j0lbeAmetri4nIon,rGsEvDwCxt2;ay30ey;en,in;hawn,moC;nd;ek,riC;ck;is,nC;is,y;rt;re;an,le,mKnIrEvC;e,iC;!d;en,iEne0PrCyl;eCin,yl;l45n;n,o,us;!iCny;el,lo;iCon;an,en,on;a0Fe0Ch03iar0lRoJrFuDyrC;il,us;rtC;!is;aEistC;iaCob12;no;ig;dy,lInErC;ey,neliCy;s,us;nEor,rDstaC;nt3;ad;or;by,e,in,l3t1;aHeEiCyde;fCnt,ve;fo0Xt1;menDt4;us;s,t;rFuDyC;!t1;dCs;e,io;enC;ce;aHeGrisC;!toC;phCs;!eC;!r;st2t;d,rCs;b5leC;s,y;cDdrCs6;ic;il;lHmFrC;ey,lDroCy;ll;!o7t1;er1iC;lo;!eb,v3;a09eZiVjorn,laUoSrEuCyr1;ddy,rtKst2;er;aKeFiEuDyC;an,ce,on;ce,no;an,ce;nDtC;!t;dDtC;!on;an,on;dFnC;dDisC;lav;en,on;!foOl9y;bby,gd0rCyd;is;i0Lke;bElDshC;al;al,lL;ek;nIrCshoi;at,nEtC;!raC;m,nd;aDhaCie;rd;rd8;!iDjam3nCs1;ie,y;to;kaMlazs,nHrC;n9rDtC;!holomew;eCy;tt;ey;dCeD;ar,iC;le;ar1Nb1Dd16fon15gust3hm12i0Zja0Yl0Bm07nTputsiSrGsaFugustEveDyCziz;a0kh0;ry;o,us;hi;aMchiKiJjun,mHnEon,tCy0;em,hCie,ur8;ur;aDoC;!ld;ud,v;aCin;an,nd8;!el,ki;baCe;ld;ta;aq;aMdHgel8tCw6;hoFoC;iDnC;!i8y;ne;ny;er7rCy;eDzC;ej;!as,i,j,s,w;!s;s,tolC;iCy;!y;ar,iEmaCos;nu5r;el;ne,r,t;aVbSdBeJfHiGl01onFphonsEt1vC;aPin;on;e,o;so,zo;!sR;!onZrC;ed;c,jaHksFssaHxC;!andC;er,rC;e,os,u;andCei;ar,er,r;ndC;ro;en;eDrecC;ht;rt8;dd3in,n,sC;taC;ir;ni;dDm6;ar;an,en;ad,eC;d,t;in;so;aGi,olErDvC;ik;ian8;f8ph;!o;mCn;!a;dGeFraDuC;!bakr,lfazl;hCm;am;!l;allFel,oulaye,ulC;!lDrahm0;an;ah,o;ah;av,on",
  Uncountable: "true¦0:2E;1:2L;2:33;a2Ub2Lc29d22e1Rf1Ng1Eh16i11j0Yk0Wl0Rm0Hn0Do0Cp03rZsLt9uran2Jv7w3you gu0E;a5his17i4oo3;d,l;ldlife,ne;rm8t1;apor,ernacul29i3;neg28ol1Otae;eDhBiAo8r4un3yranny;a,gst1B;aff2Oea1Ko4ue nor3;th;o08u3;bleshoot2Ose1Tt;night,othpas1Vwn3;foEsfoE;me off,n;er3und1;e,mod2S;a,nnis;aDcCeBhAi9ki8o7p6t4u3weepstak0;g1Unshi2Hshi;ati08e3;am,el;ace2Keci0;ap,cc1meth2C;n,ttl0;lk;eep,ingl0or1C;lf,na1Gri0;ene1Kisso1C;d0Wfe2l4nd,t3;i0Iurn;m1Ut;abi0e4ic3;e,ke15;c3i01laxa11search;ogni10rea10;a9e8hys7luto,o5re3ut2;amble,mis0s3ten20;en1Zs0L;l3rk;i28l0EyH; 16i28;a24tr0F;nt3ti0M;i0s;bstetri24vercrowd1Qxyg09;a5e4owada3utella;ys;ptu1Ows;il poliZtional securi2;aAe8o5u3;m3s1H;ps;n3o1K;ey,o3;gamy;a3cha0Elancholy,rchandi1Htallurgy;sl0t;chine3g1Aj1Hrs,thema1Q; learn1Cry;aught1e6i5ogi4u3;ck,g12;c,s1M;ce,ghtn18nguis1LteratWv1;ath1isVss;ara0EindergartPn3;icke0Aowled0Y;e3upit1;a3llyfiGwel0G;ns;ce,gnor6mp5n3;forma00ter3;net,sta07;atiSort3rov;an18;a7e6isto09o3ung1;ckey,mework,ne4o3rseradi8spitali2use arrest;ky;s2y;adquarteXre;ir,libut,ppiHs3;hi3te;sh;ene8l6o5r3um,ymnas11;a3eZ;niUss;lf,re;ut3yce0F;en; 3ti0W;edit0Hpo3;ol;aNicFlour,o4urnit3;ure;od,rgive3uri1wl;ness;arCcono0LducaBlectr9n7quip8thi0Pvery6x3;ist4per3;ti0B;en0J;body,o08th07;joy3tertain3;ment;ici2o3;ni0H;tiS;nings,th;emi02i6o4raugh3ynas2;ts;pe,wnstai3;rs;abet0ce,s3;honZrepu3;te;aDelciChAivi07l8o3urrency;al,ld w6mmenta5n3ral,ttIuscoB;fusiHt 3;ed;ry;ar;assi01oth0;es;aos,e3;eMwK;us;d,rO;a8i6lood,owlHread5u3;ntGtt1;er;!th;lliarJs3;on;g3ss;ga3;ge;cKdviJeroGirFmBn6ppeal court,r4spi3thleL;rin;ithmet3sen3;ic;i6y3;o4th3;ing;ne;se;en5n3;es2;ty;ds;craft;bi8d3nau7;yna3;mi6;ce;id,ous3;ti3;cs",
  Infinitive: "true¦0:9G;1:9T;2:AD;3:90;4:9Z;5:84;6:AH;7:A9;8:92;9:A0;A:AG;B:AI;C:9V;D:8R;E:8O;F:97;G:6H;H:7D;a94b8Hc7Jd68e4Zf4Mg4Gh4Ai3Qj3Nk3Kl3Bm34nou48o2Vp2Equ2Dr1Es0CtZuTvRwI;aOeNiLors5rI;eJiI;ng,te;ak,st3;d5e8TthI;draw,er;a2d,ep;i2ke,nIrn;d1t;aIie;liADniAry;nJpI;ho8Llift;cov1dJear8Hfound8DlIplug,rav82tie,ve94;eaAo3X;erIo;cut,go,staAFvalA3w2G;aSeQhNoMrIu73;aIe72;ffi3Smp3nsI;aBfo7CpI;i8oD;pp3ugh5;aJiJrIwaD;eat5i2;nk;aImA0;ch,se;ck3ilor,keImp1r8L;! paD;a0Ic0He0Fh0Bi0Al08mugg3n07o05p02qu01tUuLwI;aJeeIim;p,t5;ll7Wy;bNccMffLggeCmmKppJrI;mouFpa6Zvi2;o0re6Y;ari0on;er,i4;e7Numb;li9KmJsiIveD;de,st;er9it;aMe8MiKrI;ang3eIi2;ng27w;fIng;f5le;b,gg1rI;t3ve;a4AiA;a4UeJit,l7DoI;il,of;ak,nd;lIot7Kw;icEve;atGeak,i0O;aIi6;m,y;ft,ng,t;aKi6CoJriIun;nk,v6Q;ot,rt5;ke,rp5tt1;eIll,nd,que8Gv1w;!k,m;aven9ul8W;dd5tis1Iy;a0FeKiJoI;am,t,ut;d,p5;a0Ab08c06d05f01group,hea00iZjoi4lXmWnVpTq3MsOtMup,vI;amp,eJiIo3B;sEve;l,rI;e,t;i8rI;ie2ofE;eLiKpo8PtIurfa4;o24rI;aHiBuctu8;de,gn,st;mb3nt;el,hra0lIreseF;a4e71;d1ew,o07;aHe3Fo2;a7eFiIo6Jy;e2nq41ve;mbur0nf38;r0t;inKleBocus,rJuI;el,rbiA;aBeA;an4e;aBu4;ei2k8Bla43oIyc3;gni39nci3up,v1;oot,uI;ff;ct,d,liIp;se,ze;tt3viA;aAenGit,o7;aWerUinpoiFlumm1LoTrLuI;b47ke,niArIt;poDsuI;aFe;eMoI;cKd,fe4XhibEmo7noJpo0sp1tru6vI;e,i6o5L;un4;la3Nu8;aGclu6dJf1occupy,sup0JvI;a6BeF;etermi4TiB;aGllu7rtr5Ksse4Q;cei2fo4NiAmea7plex,sIva6;eve8iCua6;mp1rItrol,ve;a6It6E;bOccuNmEpMutLverIwe;l07sJtu6Yu0wI;helm;ee,h1F;gr5Cnu2Cpa4;era7i4Ipo0;py,r;ey,seItaH;r2ss;aMe0ViJoIultiply;leCu6Pw;micJnIspla4;ce,g3us;!k;iIke,na9;m,ntaH;aPeLiIo0u3N;ke,ng1quIv5;eIi6S;fy;aKnIss5;d,gI;th5;rn,ve;ng2Gu1N;eep,idnJnI;e4Cow;ap;oHuI;gg3xtaI;po0;gno8mVnIrk;cTdRfQgeChPitia7ju8q1CsNtKun6EvI;a6eIo11;nt,rt,st;erJimi6BoxiPrI;odu4u6;aBn,pr03ru6C;iCpi8tIu8;all,il,ruB;abEibE;eCo3Eu0;iIul9;ca7;i7lu6;b5Xmer0pI;aLer4Uin9ly,oJrI;e3Ais6Bo2;rt,se,veI;riA;le,rt;aLeKiIoiCuD;de,jaInd1;ck;ar,iT;mp1ng,pp5raIve;ng5Mss;ath1et,iMle27oLrI;aJeIow;et;b,pp3ze;!ve5A;gg3ve;aTer45i5RlSorMrJuI;lf4Cndrai0r48;eJiIolic;ght5;e0Qsh5;b3XeLfeEgJsI;a3Dee;eIi2;!t;clo0go,shIwa4Z;ad3F;att1ee,i36;lt1st5;a0OdEl0Mm0FnXquip,rWsVtGvTxI;aRcPeDhOiNpJtIu6;ing0Yol;eKi8lIo0un9;aHoI;it,re;ct,di7l;st,t;a3oDu3B;e30lI;a10u6;lt,mi28;alua7oI;ke,l2;chew,pou0tab19;a0u4U;aYcVdTfSgQhan4joy,lPqOrNsuMtKvI;e0YisI;a9i50;er,i4rI;aHenGuC;e,re;iGol0F;ui8;ar9iC;a9eIra2ulf;nd1;or4;ang1oIu8;r0w;irc3lo0ou0ErJuI;mb1;oaGy4D;b3ct;bKer9pI;hasiIow1;ze;aKody,rI;a4oiI;d1l;lm,rk;ap0eBuI;ci40de;rIt;ma0Rn;a0Re04iKo,rIwind3;aw,ed9oI;wn;agno0e,ff1g,mi2Kne,sLvI;eIul9;rIst;ge,t;aWbVcQlod9mant3pNru3TsMtI;iIoDu37;lJngI;uiA;!l;ol2ua6;eJlIo0ro2;a4ea0;n0r0;a2Xe36lKoIu0S;uIv1;ra9;aIo0;im;a3Kur0;b3rm;af5b01cVduBep5fUliTmQnOpMrLsiCtaGvI;eIol2;lop;ch;a20i2;aDiBloIoD;re,y;oIy;te,un4;eJoI;liA;an;mEv1;a4i0Ao06raud,y;ei2iMla8oKrI;ee,yI;!pt;de,mIup3;missi34po0;de,ma7ph1;aJrief,uI;g,nk;rk;mp5rk5uF;a0Dea0h0Ai09l08oKrIurta1G;a2ea7ipp3uI;mb3;ales4e04habEinci6ll03m00nIrro6;cXdUfQju8no7qu1sLtKvI;eIin4;ne,r9y;aHin2Bribu7;er2iLoli2Epi8tJuI;lt,me;itu7raH;in;d1st;eKiJoIroFu0;rm;de,gu8rm;ss;eJoI;ne;mn,n0;eIlu6ur;al,i2;buCe,men4pI;eIi3ly;l,te;eBi6u6;r4xiC;ean0iT;rcumveFte;eJirp,oI;o0p;riAw;ncIre5t1ulk;el;a02eSi6lQoPrKuI;iXrIy;st,y;aLeaKiJoad5;en;ng;stfeLtX;ke;il,l11mba0WrrMth1;eIow;ed;!coQfrie1LgPhMliLqueaKstJtrIwild1;ay;ow;th;e2tt3;a2eJoI;ld;ad;!in,ui3;me;bysEckfi8ff3tI;he;b15c0Rd0Iff0Ggree,l0Cm09n03ppZrXsQttOuMvJwaE;it;eDoI;id;rt;gIto0X;meF;aIeCraB;ch,in;pi8sJtoI;niA;aKeIi04u8;mb3rt,ss;le;il;re;g0Hi0ou0rI;an9i2;eaKly,oiFrI;ai0o2;nt;r,se;aMi0GnJtI;icipa7;eJoIul;un4y;al;ly0;aJu0;se;lga08ze;iKlI;e9oIu6;t,w;gn;ix,oI;rd;a03jNmiKoJsoI;rb;pt,rn;niIt;st1;er;ouJuC;st;rn;cLhie2knowled9quiItiva7;es4re;ce;ge;eQliOoKrJusI;e,tom;ue;mIst;moJpI;any,liA;da7;ma7;te;pt;andPduBet,i6oKsI;coKol2;ve;liArt,uI;nd;sh;de;ct;on",
  Person: "true¦0:1Q;a29b1Zc1Md1Ee18f15g13h0Ri0Qj0Nk0Jl0Gm09n06o05p00rPsItCusain bolt,v9w4xzibit,y1;anni,oko on2uji,v1;an,es;en,o;a3ednesday adams,i2o1;lfram,o0Q;ll ferrell,z khalifa;lt disn1Qr1;hol,r0G;a2i1oltai06;n dies0Zrginia wo17;lentino rossi,n goG;a4h3i2ripp,u1yra banks;lZpac shakur;ger woods,mba07;eresa may,or;kashi,t1ylor;um,ya1B;a5carlett johanss0h4i3lobodan milosevic,no2ocr1Lpider1uperm0Fwami; m0Em0E;op dogg,w whi1H;egfried,nbad;akespeaTerlock holm1Sia labeouf;ddam hussa16nt1;a cla11ig9;aAe6i5o3u1za;mi,n dmc,paul,sh limbau1;gh;bin hood,d stew16nald1thko;in0Mo;han0Yngo starr,valdo;ese witherspo0i1mbrandt;ll2nh1;old;ey,y;chmaninoff,ffi,iJshid,y roma1H;a4e3i2la16o1uff daddy;cahont0Ie;lar,p19;le,rZ;lm17ris hilt0;leg,prah winfr0Sra;a2e1iles cra1Bostradam0J; yo,l5tt06wmQ;pole0s;a5e4i2o1ubar03;by,lie5net,rriss0N;randa ju1tt romn0M;ly;rl0GssiaB;cklemo1rkov,s0ta hari,ya angelou;re;ady gaga,e1ibera0Pu;bron jam0Xch wale1e;sa;anye west,e3i1obe bryant;d cudi,efer suther1;la0P;ats,sha;a2effers0fk,k rowling,rr tolki1;en;ck the ripp0Mwaharlal nehru,y z;liTnez,ron m7;a7e5i3u1;lk hog5mphrey1sa01;! bog05;l1tl0H;de; m1dwig,nry 4;an;ile selassFlle ber4m3rrison1;! 1;ford;id,mo09;ry;ast0iannis,o1;odwPtye;ergus0lorence nightinga08r1;an1ederic chopN;s,z;ff5m2nya,ustaXzeki1;el;eril lagasse,i1;le zatop1nem;ek;ie;a6e4i2octor w1rake;ho;ck w1ego maradoC;olf;g1mi lovaOnzel washingt0;as;l1nHrth vadR;ai lNt0;a8h5lint0o1thulhu;n1olio;an,fuci1;us;on;aucKop2ristian baMy1;na;in;millo,ptain beefhe4r1;dinal wols2son1;! palmF;ey;art;a8e5hatt,i3oHro1;ck,n1;te;ll g1ng crosby;atB;ck,nazir bhut2rtil,yon1;ce;to;nksy,rack ob1;ama;l 6r3shton kutch2vril lavig8yn ra1;nd;er;chimed2istot1;le;es;capo2paci1;no;ne",
  Adjective: "true¦0:AI;1:BS;2:BI;3:BA;4:A8;5:84;6:AV;7:AN;8:AF;9:7H;A:BQ;B:AY;C:BC;D:BH;E:9Y;aA2b9Ec8Fd7We79f6Ng6Eh61i4Xj4Wk4Tl4Im41n3Po36p2Oquart7Pr2Ds1Dt14uSvOwFye29;aMeKhIiHoF;man5oFrth7G;dADzy;despreB1n w97s86;acked1UoleF;!sa6;ather1PeFll o70ste1D;!k5;nt1Ist6Ate4;aHeGiFola5T;bBUce versa,gi3Lle;ng67rsa5R;ca1gBSluAV;lt0PnLpHrGsFttermoBL;ef9Ku3;b96ge1; Hb32pGsFtiAH;ca6ide d4R;er,i85;f52to da2;a0Fbeco0Hc0Bd04e02f01gu1XheaBGiXkn4OmUnTopp06pRrNsJtHus0wF;aFiel3K;nt0rra0P;app0eXoF;ld,uS;eHi37o5ApGuF;perv06spec39;e1ok9O;en,ttl0;eFu5;cogn06gul2RlGqu84sF;erv0olv0;at0en33;aFrecede0E;id,rallel0;am0otic0;aFet;rri0tF;ch0;nFq26vers3;sur0terFv7U;eFrupt0;st0;air,inish0orese98;mploy0n7Ov97xpF;ect0lain0;eHisFocume01ue;clFput0;os0;cid0rF;!a8Scov9ha8Jlyi8nea8Gprivileg0sMwF;aFei9I;t9y;hGircumcFonvin2U;is0;aFeck0;lleng0rt0;b20ppea85ssuGttend0uthorF;iz0;mi8;i4Ara;aLeIhoHip 25oGrF;anspare1encha1i2;geth9leADp notch,rpB;rny,ugh6H;ena8DmpGrFs6U;r49tia4;eCo8P;leFst4M;nt0;a0Dc09e07h06i04ki03l01mug,nobbi4XoVpRqueami4XtKuFymb94;bHccinAi generis,pFr5;erFre7N;! dup9b,vi70;du0li7Lp6IsFurb7J;eq9Atanda9X;aKeJi16o2QrGubboFy4Q;rn;aightFin5GungS; fFfF;or7V;adfa9Pri6;lwa6Ftu82;arHeGir6NlendBot Fry;on;c3Qe1S;k5se; call0lImb9phistic16rHuFviV;ndFth1B;proof;dBry;dFub6; o2A;e60ipF;pe4shod;ll0n d7R;g2HnF;ceEg6ist9;am3Se9;co1Zem5lfFn6Are7; suf4Xi43;aGholFient3A;ar5;rlFt4A;et;cr0me,tisfac7F;aOeIheumatoBiGoF;bu8Ztt7Gy3;ghtFv3; 1Sf6X;cJdu8PlInown0pro69sGtF;ard0;is47oF;lu2na1;e1Suc45;alcit8Xe1ondi2;bBci3mpa1;aSePicayu7laOoNrGuF;bl7Tnjabi;eKiIoF;b7VfGmi49pFxi2M;er,ort81;a7uD;maFor,sti7va2;!ry;ciDexis0Ima2CpaB;in55puli8G;cBid;ac2Ynt 3IrFti2;ma40tFv7W;!i3Z;i2YrFss7R;anoBtF; 5XiF;al,s5V;bSffQkPld OnMrLth9utKverF;!aIbMdHhGni75seas,t,wF;ei74rou74;a63e7A;ue;ll;do1Ger,si6A;d3Qg2Aotu5Z; bFbFe on o7g3Uli7;oa80;fashion0school;!ay; gua7XbFha5Uli7;eat;eHligGsF;ce7er0So1C;at0;diFse;a1e1;aOeNiMoGuF;anc0de; moEnHrthFt6V;!eFwe7L;a7Krn;chaGdescri7Iprof30sF;top;la1;ght5;arby,cessa4ighbor5wlyw0xt;k0usiaFv3;ti8;aQeNiLoHuF;dIltiF;facet0p6;deHlGnFot,rbBst;ochro4Xth5;dy;rn,st;ddle ag0nF;dbloZi,or;ag9diocEga,naGrFtropolit4Q;e,ry;ci8;cIgenta,inHj0Fkeshift,mmGnFri4Oscu61ver18;da5Dy;ali4Lo4U;!stream;abEho;aOeLiIoFumberi8;ngFuti1R;stan3RtF;erm,i4H;ghtGteraF;l,ry,te;heart0wei5O;ft JgFss9th3;al,eFi0M;nda4;nguBps0te5;apGind5noF;wi8;ut;ad0itte4uniW;ce co0Hgno6Mll0Cm04nHpso 2UrF;a2releF;va1; ZaYcoWdReQfOgrNhibi4Ri05nMoLsHtFvalu5M;aAeF;nDrdepe2K;a7iGolFuboI;ub6ve1;de,gF;nifica1;rdi5N;a2er;own;eriIiLluenVrF;ar0eq5H;pt,rt;eHiGoFul1O;or;e,reA;fiFpe26termi5E;ni2;mpFnsideCrreA;le2;ccuCdeq5Ene,ppr4J;fFsitu,vitro;ro1;mJpF;arHeGl15oFrop9;li2r11;n2LrfeA;ti3;aGeFi18;d4BnD;tuE;egGiF;c0YteC;al,iF;tiF;ma2;ld;aOelNiLoFuma7;a4meInHrrGsFur5;ti6;if4E;e58o3U; ma3GsF;ick;ghfalut2HspF;an49;li00pf33;i4llow0ndGrdFtM; 05coEworki8;sy,y;aLener44iga3Blob3oKrGuF;il1Nng ho;aFea1Fizzl0;cGtF;ef2Vis;ef2U;ld3Aod;iFuc2D;nf2R;aVeSiQlOoJrF;aGeFil5ug3;q43tf2O;gFnt3S;i6ra1;lk13oHrF; keeps,eFge0Vm9tu41;g0Ei2Ds3R;liF;sh;ag4Mowe4uF;e1or45;e4nF;al,i2;d Gmini7rF;ti6ve1;up;bl0lDmIr Fst pac0ux;oGreacF;hi8;ff;ed,ili0R;aXfVlTmQnOqu3rMthere3veryday,xF;aApIquisi2traHuF;be48lF;ta1;!va2L;edRlF;icF;it;eAstF;whi6; Famor0ough,tiE;rou2sui2;erGiF;ne1;ge1;dFe2Aoq34;er5;ficF;ie1;g9sF;t,ygF;oi8;er;aWeMiHoGrFue;ea4owY;ci6mina1ne,r31ti8ubQ;dact2Jfficult,m,sGverF;ge1se;creGePjoi1paCtF;a1inA;et,te; Nadp0WceMfiLgeneCliJmuEpeIreliAsGvoF;id,ut;pFtitu2ul1L;eCoF;nde1;ca2ghF;tf13;a1ni2;as0;facto;i5ngero0I;ar0Ce09h07i06l05oOrIuF;rmudgeon5stoma4teF;sy;ly;aIeHu1EystalF; cleFli7;ar;epy;fFv17z0;ty;erUgTloSmPnGrpoCunterclVveFy;rt;cLdJgr21jIsHtrF;aFi2;dic0Yry;eq1Yta1;oi1ug3;escenFuN;di8;a1QeFiD;it0;atoDmensuCpF;ass1SulF;so4;ni3ss3;e1niza1;ci1J;ockwiD;rcumspeAvil;eFintzy;e4wy;leGrtaF;in;ba2;diac,ef00;a00ePiLliJoGrFuck nak0;and new,isk,on22;gGldface,naF; fi05fi05;us;nd,tF;he;gGpartisFzarE;an;tiF;me;autifOhiNlLnHsFyoN;iWtselF;li8;eGiFt;gn;aFfi03;th;at0oF;v0w;nd;ul;ckwards,rF;e,rT; priori,b13c0Zd0Tf0Ng0Ihe0Hl09mp6nt06pZrTsQttracti0MuLvIwF;aGkF;wa1B;ke,re;ant garGeraF;ge;de;diIsteEtF;heFoimmu7;nt07;re;to4;hGlFtu2;eep;en;bitIchiv3roHtF;ifiFsy;ci3;ga1;ra4;ry;pFt;aHetizi8rF;oprF;ia2;llFre1;ed,i8;ng;iquFsy;at0e;ed;cohKiJkaHl,oGriFterX;ght;ne,of;li7;ne;ke,ve;olF;ic;ad;ain07gressiIi6rF;eeF;ab6;le;ve;fGraB;id;ectGlF;ue1;ioF;na2; JaIeGvF;erD;pt,qF;ua2;ma1;hoc,infinitum;cuCquiGtu3u2;al;esce1;ra2;erSjeAlPoNrKsGuF;nda1;e1olu2trF;aAuD;se;te;eaGuF;pt;st;aFve;rd;aFe;ze;ct;ra1;nt",
  Pronoun: "true¦elle,h3i2me,she,th0us,we,you;e0ou;e,m,y;!l,t;e,im",
  Preposition: "true¦aPbMcLdKexcept,fIinGmid,notwithstandiWoDpXqua,sCt7u4v2w0;/o,hereSith0;! whHin,oW;ersus,i0;a,s a vis;n1p0;!on;like,til;h1ill,oward0;!s;an,ereby,r0;ough0u;!oM;ans,ince,o that,uch G;f1n0ut;!to;!f;! 0to;effect,part;or,r0;om;espite,own,u3;hez,irca;ar1e0oBy;sides,tween;ri7;bo8cross,ft7lo6m4propos,round,s1t0;!op;! 0;a whole,long 0;as;id0ong0;!st;ng;er;ut",
  SportsTeam: "true¦0:18;1:1E;2:1D;3:14;a1Db15c0Sd0Kfc dallas,g0Ihouston 0Hindiana0Gjacksonville jagua0k0El0Am01new UoRpKqueens parkJreal salt lake,sBt6utah jazz,vancouver whitecaps,w4yW;ashington 4h10;natio1Mredski2wizar0W;ampa bay 7e6o4;ronto 4ttenham hotspur;blue ja0Mrapto0;nnessee tita2xasD;buccanee0ra0K;a8eattle 6porting kansas0Wt4; louis 4oke0V;c1Drams;marine0s4;eah13ounH;cramento Rn 4;antonio spu0diego 4francisco gJjose earthquak1;char08paB; ran07;a9h6ittsburgh 5ortland t4;imbe0rail blaze0;pirat1steele0;il4oenix su2;adelphia 4li1;eagl1philNunE;dr1;akland 4klahoma city thunder,rlando magic;athle0Lrai4;de0;england 8orleans 7york 4;g5je3knYme3red bul0Xy4;anke1;ian3;pelica2sain3;patrio3revolut4;ion;anchEeAi4ontreal impact;ami 8lwaukee b7nnesota 4;t5vi4;kings;imberwolv1wi2;rewe0uc0J;dolphi2heat,marli2;mphis grizz4ts;li1;a6eic5os angeles 4;clippe0dodFlaB;esterV; galaxy,ke0;ansas city 4nF;chiefs,roya0D; pace0polis col3;astr05dynamo,rocke3texa2;olden state warrio0reen bay pac4;ke0;allas 8e4i04od6;nver 6troit 4;lio2pisto2ti4;ge0;broncYnugge3;cowbo5maver4;icZ;ys;arEelLhAincinnati 8leveland 6ol4;orado r4umbus crew sc;api7ocki1;brow2cavalie0guar4in4;dia2;bengaVre4;ds;arlotte horAicago 4;b5cubs,fire,wh4;iteB;ea0ulQ;diff4olina panthe0; city;altimore Alackburn rove0oston 6rooklyn 4uffalo bilN;ne3;ts;cel5red4; sox;tics;rs;oriol1rave2;rizona Ast8tlanta 4;brav1falco2h4;awA;ns;es;on villa,r4;os;c6di4;amondbac4;ks;ardi4;na4;ls",
  Unit: "true¦a07b04cXdWexVfTgRhePinYjoule0BkMlJmDnan08oCp9quart0Bsq ft,t7volts,w6y2ze3°1µ0;g,s;c,f,n;dVear1o0;ttR; 0s 0;old;att,b;erNon0;!ne02;ascals,e1i0;cXnt00;rcent,tJ;hms,unceY;/s,e4i0m²,²,³;/h,cro2l0;e0liK;!²;grLsR;gCtJ;it1u0;menQx;erPreP;b5elvins,ilo1m0notO;/h,ph,²;!byGgrEmCs;ct0rtzL;aJogrC;allonJb0ig3rB;ps;a0emtEl oz,t4;hrenheit,radG;aby9;eci3m1;aratDe1m0oulombD;²,³;lsius,nti0;gr2lit1m0;et0;er8;am7;b1y0;te5;l,ps;c2tt0;os0;econd1;re0;!s",
  "Noun|Gerund": "true¦0:3O;1:3M;2:3N;3:3D;4:32;5:2V;6:3E;7:3K;8:36;9:3J;A:3B;a3Pb37c2Jd27e23f1Vg1Sh1Mi1Ij1Gk1Dl18m13n11o0Wp0Pques0Sr0EsTtNunderMvKwFyDzB;eroi0oB;ni0o3P;aw2eB;ar2l3;aEed4hispe5i5oCrB;ap8est3i1;n0ErB;ki0r31;i1r2s9tc9;isualizi0oB;lunt1Vti0;stan4ta6;aFeDhin6iCraBy8;c6di0i2vel1M;mi0p8;aBs1;c9si0;l6n2s1;aUcReQhOiMkatKl2Wmo6nowJpeItFuCwB;ea5im37;b35f0FrB;fi0vB;e2Mi2J;aAoryt1KrCuB;d2KfS;etc9ugg3;l3n4;bCi0;ebBi0;oar4;gnBnAt1;a3i0;ip8oB;p8rte2u1;a1r27t1;hCo5reBulp1;a2Qe2;edu3oo3;i3yi0;aKeEi4oCuB;li0n2;oBwi0;fi0;aFcEhear7laxi0nDpor1sB;pon4tructB;r2Iu5;de5;or4yc3;di0so2;p8ti0;aFeacek20laEoCrBublis9;a1Teten4in1oces7;iso2siB;tio2;n2yi0;ckaAin1rB;ki0t1O;fEpeDrganiCvB;erco24ula1;si0zi0;ni0ra1;fe5;avi0QeBur7;gotia1twor6;aDeCi2oB;de3nito5;a2dita1e1ssaA;int0XnBrke1;ifUufactu5;aEeaDiBodAyi0;cen7f1mi1stB;e2i0;r2si0;n4ug9;iCnB;ea4it1;c6l3;ogAuB;dAgg3stif12;ci0llust0VmDnBro2;nova1sp0NterBven1;ac1vie02;agi2plo4;aDea1iCoBun1;l4w3;ki0ri0;nd3rB;roWvB;es1;aCene0Lli4rBui4;ee1ie0N;rde2the5;aHeGiDlCorBros1un4;e0Pmat1;ir1oo4;gh1lCnBs9;anZdi0;i0li0;e3nX;r0Zscina1;a1du01nCxB;erci7plo5;chan1di0ginB;ee5;aLeHiGoub1rCum8wB;el3;aDeCiB;bb3n6vi0;a0Qs7;wi0;rTscoDvi0;ba1coZlBvelo8;eCiB;ve5;ga1;nGti0;aVelebUhSlPoDrBur3yc3;aBos7yi0;f1w3;aLdi0lJmFnBo6pi0ve5;dDsCvinB;ci0;trBul1;uc1;muniDpB;lBo7;ai2;ca1;lBo5;ec1;c9ti0;ap8eaCimToBubT;ni0t9;ni0ri0;aBee5;n1t1;ra1;m8rCs1te5;ri0;vi0;aPeNitMlLoGrDuB;dge1il4llBr8;yi0;an4eat9oadB;cas1;di0;a1mEokB;i0kB;ee8;pi0;bi0;es7oa1;c9i0;gin2lonAt1;gi0;bysit1c6ki0tt3;li0;ki0;bando2cGdverti7gi0pproac9rgDssuCtB;trac1;mi0;ui0;hi0;si0;coun1ti0;ti0;ni0;ng",
  PhrasalVerb: "true¦0:92;1:96;2:8H;3:8V;4:8A;5:83;6:85;7:98;8:90;9:8G;A:8X;B:8R;C:8U;D:8S;E:70;F:97;G:8Y;H:81;I:7H;J:79;a9Fb7Uc6Rd6Le6Jf5Ig50h4Biron0j47k40l3Em31n2Yo2Wp2Cquiet Hr1Xs0KtZuXvacuu6QwNyammerBzK;ero Dip LonK;e0k0;by,ov9up;aQeMhLiKor0Mrit19;mp0n3Fpe0r5s5;ackAeel Di0S;aLiKn33;gh 3Wrd0;n Dr K;do1in,oJ;it 79k5lk Lrm 69sh Kt83v60;aw3do1o7up;aw3in,oC;rgeBsK;e 2herE;a00eYhViRoQrMuKypP;ckErn K;do1in,oJup;aLiKot0y 30;ckl7Zp F;ck HdK;e 5Y;n7Wp 3Es5K;ck MdLe Kghten 6me0p o0Rre0;aw3ba4do1in,up;e Iy 2;by,oG;ink Lrow K;aw3ba4in,up;ba4ov9up;aKe 77ll62;m 2r 5M;ckBke Llk K;ov9shit,u47;aKba4do1in,leave,o4Dup;ba4ft9pa69w3;a0Vc0Te0Mh0Ii0Fl09m08n07o06p01quar5GtQuOwK;earMiK;ngLtch K;aw3ba4o8K; by;cKi6Bm 2ss0;k 64;aReQiPoNrKud35;aigh2Det75iK;ke 7Sng K;al6Yup;p Krm2F;by,in,oG;c3Ln3Lr 2tc4O;p F;c3Jmp0nd LrKveAy 2O;e Ht 2L;ba4do1up;ar3GeNiMlLrKurB;ead0ingBuc5;a49it 6H;c5ll o3Cn 2;ak Fe1Xll0;a3Bber 2rt0und like;ap 5Vow Duggl5;ash 6Noke0;eep NiKow 6;cLp K;o6Dup;e 68;in,oK;ff,v9;de19gn 4NnKt 6Gz5;gKkE; al6Ale0;aMoKu5W;ot Kut0w 7M;aw3ba4f48oC;c2WdeEk6EveA;e Pll1Nnd Orv5tK; Ktl5J;do1foLin,o7upK;!on;ot,r5Z;aw3ba4do1in,o33up;oCto;al66out0rK;ap65ew 6J;ilAv5;aXeUiSoOuK;b 5Yle0n Kstl5;aLba4do1inKo2Ith4Nu5P;!to;c2Xr8w3;ll Mot LpeAuK;g3Ind17;a2Wf3Po7;ar8in,o7up;ng 68p oKs5;ff,p18;aKelAinEnt0;c6Hd K;o4Dup;c27t0;aZeYiWlToQrOsyc35uK;ll Mn5Kt K;aKba4do1in,oJto47up;pa4Dw3;a3Jdo1in,o21to45up;attleBess KiNop 2;ah2Fon;iLp Kr4Zu1Gwer 6N;do1in,o6Nup;nt0;aLuK;gEmp 6;ce u20y 6D;ck Kg0le 4An 6p5B;oJup;el 5NncilE;c53ir 39n0ss MtLy K;ba4oG; Hc2R;aw3ba4in,oJ;pKw4Y;e4Xt D;aLerd0oK;dAt53;il Hrrow H;aTeQiPoLuK;ddl5ll I;c1FnkeyMp 6uthAve K;aKdo1in,o4Lup;l4Nw3; wi4K;ss0x 2;asur5e3SlLss K;a21up;t 6;ke Ln 6rKs2Ax0;k 6ryA;do,fun,oCsure,up;a02eViQoLuK;ck0st I;aNc4Fg MoKse0;k Kse4D;aft9ba4do1forw37in56o0Zu46;in,oJ;d 6;e NghtMnLsKve 00;ten F;e 2k 2; 2e46;ar8do1in;aMt LvelK; oC;do1go,in,o7up;nEve K;in,oK;pKut;en;c5p 2sh LtchBughAy K;do1o59;in4Po7;eMick Lnock K;do1oCup;oCup;eLy K;in,up;l Ip K;aw3ba4do1f04in,oJto,up;aMoLuK;ic5mpE;ke3St H;c43zz 2;a01eWiToPuK;nLrrKsh 6;y 2;keLt K;ar8do1;r H;lKneErse3K;d Ke 2;ba4dKfast,o0Cup;ear,o1;de Lt K;ba4on,up;aw3o7;aKlp0;d Ml Ir Kt 2;fKof;rom;f11in,o03uW;cPm 2nLsh0ve Kz2P;at,it,to;d Lg KkerP;do1in,o2Tup;do1in,oK;ut,v9;k 2;aZeTive Rloss IoMrLunK; f0S;ab hold,in43ow 2U; Kof 2I;aMb1Mit,oLr8th1IuK;nd9;ff,n,v9;bo7ft9hQw3;aw3bKdo1in,oJrise,up,w3;a4ir2H;ar 6ek0t K;aLb1Fdo1in,oKr8up;ff,n,ut,v9;cLhKl2Fr8t,w3;ead;ross;d aKng 2;bo7;a0Ee07iYlUoQrMuK;ck Ke2N;ar8up;eLighten KownBy 2;aw3oG;eKshe27; 2z5;g 2lMol Krk I;aKwi20;bo7r8;d 6low 2;aLeKip0;sh0;g 6ke0mKrKtten H;e F;gRlPnNrLsKzzle0;h F;e Km 2;aw3ba4up;d0isK;h 2;e Kl 1T;aw3fPin,o7;ht ba4ure0;ePnLsK;s 2;cMd K;fKoG;or;e D;d04l 2;cNll Krm0t1G;aLbKdo1in,o09sho0Eth08victim;a4ehi2O;pa0C;e K;do1oGup;at Kdge0nd 12y5;in,o7up;aOi1HoNrK;aLess 6op KuN;aw3b03in,oC;gBwB; Ile0ubl1B;m 2;a0Ah05l02oOrLut K;aw3ba4do1oCup;ackBeep LoKy0;ss Dwd0;by,do1in,o0Uup;me NoLuntK; o2A;k 6l K;do1oG;aRbQforOin,oNtKu0O;hLoKrue;geth9;rough;ff,ut,v9;th,wK;ard;a4y;paKr8w3;rt;eaLose K;in,oCup;n 6r F;aNeLiK;ll0pE;ck Der Kw F;on,up;t 2;lRncel0rOsMtch LveE; in;o1Nup;h Dt K;doubt,oG;ry LvK;e 08;aw3oJ;l Km H;aLba4do1oJup;ff,n,ut;r8w3;a0Ve0MiteAl0Fo04rQuK;bblNckl05il0Dlk 6ndl05rLsKtMy FzzA;t 00;n 0HsK;t D;e I;ov9;anWeaUiLush K;oGup;ghQng K;aNba4do1forMin,oLuK;nd9p;n,ut;th;bo7lKr8w3;ong;teK;n 2;k K;do1in,o7up;ch0;arTg 6iRn5oPrNssMttlLunce Kx D;aw3ba4;e 6; ar8;e H;do1;k Dt 2;e 2;l 6;do1up;d 2;aPeed0oKurt0;cMw K;aw3ba4do1o7up;ck;k K;in,oC;ck0nk0stA; oQaNef 2lt0nd K;do1ov9up;er;up;r Lt K;do1in,oCup;do1o7;ff,nK;to;ck Pil0nMrgLsK;h D;ainBe D;g DkB; on;in,o7;aw3do1in,oCup;ff,ut;ay;ct FdQir0sk MuctionA; oG;ff;ar8o7;ouK;nd; o7;d K;do1oKup;ff,n;wn;o7up;ut",
  ProperNoun: "true¦aIbDc8dalhousHe7f5gosford,h4iron maiden,kirby,landsdowne,m2nis,r1s0wembF;herwood,paldiB;iel,othwe1;cgi0ercedes,issy;ll;intBudsB;airview,lorence,ra0;mpt9nco;lmo,uro;a1h0;arlt6es5risti;rl0talina;et4i0;ng;arb3e0;et1nt0rke0;ley;on;ie;bid,jax",
  "Person|Place": "true¦a8d6h4jordan,k3orlando,s1vi0;ctor9rgin9;a0ydney;lvador,mara,ntia4;ent,obe;amil0ous0;ton;arw2ie0;go;lexandr1ust0;in;ia",
  LastName: "true¦0:BR;1:BF;2:B5;3:BH;4:AX;5:9Y;6:B6;7:BK;8:B0;9:AV;A:AL;B:8Q;C:8G;D:7K;E:BM;F:AH;aBDb9Zc8Wd88e81f7Kg6Wh64i60j5Lk4Vl4Dm39n2Wo2Op25quispe,r1Ls0Pt0Ev03wTxSyKzG;aIhGimmerm6A;aGou,u;ng,o;khar5ytsE;aKeun9BiHoGun;koya32shiBU;!lG;diGmaz;rim,z;maGng;da,g52mo83sGzaC;aChiBV;iao,u;aLeJiHoGright,u;jcA5lff,ng;lGmm0nkl0sniewsC;kiB1liams33s3;bGiss,lt0;b,er,st0;a6Vgn0lHtG;anabe,s3;k0sh,tG;e2Non;aLeKiHoGukD;gt,lk5roby5;dHllalGnogr3Kr1Css0val3S;ba,ob1W;al,ov4;lasHsel8W;lJn dIrgBEsHzG;qu7;ilyEqu7siljE;en b6Aijk,yk;enzueAIverde;aPeix1VhKi2j8ka43oJrIsui,uG;om5UrG;c2n0un1;an,emblA7ynisC;dorAMlst3Km4rrAth;atch0i8UoG;mHrG;are84laci79;ps3sG;en,on;hirDkah9Mnaka,te,varA;a06ch01eYhUiRmOoMtIuHvGzabo;en9Jobod3N;ar7bot4lliv2zuC;aIeHoG;i7Bj4AyanAB;ele,in2FpheBvens25;l8rm0;kol5lovy5re7Tsa,to,uG;ng,sa;iGy72;rn5tG;!h;l71mHnGrbu;at9cla9Egh;moBo7M;aIeGimizu;hu,vchG;en8Luk;la,r1G;gu9infe5YmGoh,pulveA7rra5P;jGyG;on5;evi6iltz,miHneid0roed0uGwarz;be3Elz;dHtG;!t,z;!t;ar4Th8ito,ka4OlJnGr4saCto,unde19v4;ch7dHtGz;a5Le,os;b53e16;as,ihDm4Po0Y;aVeSiPoJuHyG;a6oo,u;bio,iz,sG;so,u;bKc8Fdrigue67ge10j9YmJosevelt,sItHux,wG;e,li6;a9Ch;enb4Usi;a54e4L;erts15i93;bei4JcHes,vGzzo;as,e9;ci,hards12;ag2es,iHut0yG;es,nol5N;s,t0;dImHnGsmu97v6C;tan1;ir7os;ic,u;aUeOhMiJoHrGut8;asad,if6Zochazk27;lishc2GpGrti72u10we76;e3Aov51;cHe45nG;as,to;as70hl0;aGillips;k,m,n6I;a3Hde3Wete0Bna,rJtG;ersHrovGters54;!a,ic;!en,on;eGic,kiBss3;i9ra,tz,z;h86k,padopoulIrk0tHvG;ic,l4N;el,te39;os;bMconn2Ag2TlJnei6PrHsbor6XweBzG;dem7Rturk;ella4DtGwe6N;ega,iz;iGof7Hs8I;vGyn1R;ei9;aSri1;aPeNiJoGune50ym2;rHvGwak;ak4Qik5otn66;odahl,r4S;cholsZeHkolGls4Jx3;ic,ov84;ls1miG;!n1;ils3mG;co4Xec;gy,kaGray2sh,var38;jiGmu9shiG;ma;a07c04eZiWoMuHyeG;rs;lJnIrGssoli6S;atGp03r7C;i,ov4;oz,te58;d0l0;h2lOnNo0RrHsGza1A;er,s;aKeJiIoz5risHtG;e56on;!on;!n7K;au,i9no,t5J;!lA;r1Btgome59;i3El0;cracFhhail5kkeHlG;l0os64;ls1;hmeJiIj30lHn3Krci0ssiGyer2N;!er;n0Po;er,j0;dDti;cartHlG;aughl8e2;hy;dQe7Egnu68i0jer3TkPmNnMrItHyG;er,r;ei,ic,su21thews;iHkDquAroqu8tinG;ez,s;a5Xc,nG;!o;ci5Vn;a5UmG;ad5;ar5e6Kin1;rig77s1;aVeOiLoJuHyG;!nch;k4nGo;d,gu;mbarGpe3Fvr4we;di;!nGu,yana2B;coln,dG;b21holm,strom;bedEfeKhIitn0kaHn8rGw35;oy;!j;m11tG;in1on1;bvGvG;re;iGmmy,ng,rs2Qu,voie,ws3;ne,t1F;aZeYh2iWlUnez50oNrJuHvar2woG;k,n;cerGmar68znets5;a,o34;aHem0isGyeziu;h23t3O;m0sni4Fus3KvG;ch4O;bay57ch,rh0Usk16vaIwalGzl5;czGsC;yk;cIlG;!cGen4K;huk;!ev4ic,s;e8uiveG;rt;eff0kGl4mu9nnun1;ucF;ll0nnedy;hn,llKminsCne,pIrHstra3Qto,ur,yGzl5;a,s0;j0Rls22;l2oG;or;oe;aPenOha6im14oHuG;ng,r4;e32hInHrge32u6vG;anD;es,ss3;anHnsG;en,on,t3;nesGs1R;en,s1;kiBnings,s1;cJkob4EnGrv0E;kDsG;en,sG;en0Ion;ks3obs2A;brahimDglesi5Nke5Fl0Qno07oneIshikHto,vanoG;u,v54;awa;scu;aVeOiNjaltal8oIrist50uG;!aGb0ghAynh;m2ng;a6dz4fIjgaa3Hk,lHpUrGwe,x3X;ak1Gvat;mAt;er,fm3WmG;ann;ggiBtchcock;iJmingw4BnHrGss;nand7re9;deGriks1;rs3;kkiHnG;on1;la,n1;dz4g1lvoQmOns0ZqNrMsJuIwHyG;asFes;kiB;g1ng;anHhiG;mo14;i,ov0J;di6p0r10t;ue;alaG;in1;rs1;aVeorgUheorghe,iSjonRoLrJuGw3;errGnnar3Co,staf3Ctierr7zm2;a,eG;ro;ayli6ee2Lg4iffithGub0;!s;lIme0UnHodGrbachE;e,m2;calvAzale0S;dGubE;bGs0E;erg;aj,i;bs3l,mGordaO;en7;iev3U;gnMlJmaIndFo,rGsFuthi0;cGdn0za;ia;ge;eaHlG;agh0i,o;no;e,on;aVerQiLjeldsted,lKoIrHuG;chs,entAji41ll0;eem2iedm2;ntaGrt8urni0wl0;na;emi6orA;lipIsHtzgeraG;ld;ch0h0;ovG;!ic;hatDnanIrG;arGei9;a,i;deY;ov4;b0rre1D;dKinsJriksIsGvaB;cob3GpGtra3D;inoza,osiQ;en,s3;te8;er,is3warG;ds;aXePiNjurhuMoKrisco15uHvorakG;!oT;arte,boHmitru,nn,rGt3C;and,ic;is;g2he0Omingu7nErd1ItG;to;us;aGcki2Hmitr2Ossanayake,x3;s,z; JbnaIlHmirGrvisFvi,w2;!ov4;gado,ic;th;bo0groot,jo6lHsilGvriA;va;a cruz,e3uG;ca;hl,mcevsCnIt2WviG;dGes,s;ov,s3;ielsGku22;!en;ki;a0Be06hRiobQlarkPoIrGunningh1H;awfo0RivGuz;elli;h1lKntJoIrGs2Nx;byn,reG;a,ia;ke,p0;i,rer2K;em2liB;ns;!e;anu;aOeMiu,oIristGu6we;eGiaG;ns1;i,ng,p9uHwGy;!dH;dGng;huJ;!n,onGu6;!g;kJnIpm2ttHudhGv7;ry;erjee,o14;!d,g;ma,raboG;rty;bJl0Cng4rG;eghetHnG;a,y;ti;an,ota1C;cerAlder3mpbeLrIstGvadi0B;iGro;llo;doHl0Er,t0uGvalho;so;so,zo;ll;a0Fe01hYiXlUoNrKuIyG;rLtyG;qi;chan2rG;ke,ns;ank5iem,oGyant;oks,wG;ne;gdan5nIruya,su,uchaHyKziG;c,n5;rd;darGik;enG;ko;ov;aGond15;nco,zG;ev4;ancFshw16;a08oGuiy2;umGwmG;ik;ckRethov1gu,ktPnNrG;gJisInG;ascoGds1;ni;ha;er,mG;anG;!n;gtGit7nP;ss3;asF;hi;er,hG;am;b4ch,ez,hRiley,kk0ldw8nMrIshHtAu0;es;ir;bInHtlGua;ett;es,i0;ieYosa;dGik;a9yoG;padhyG;ay;ra;k,ng;ic;bb0Acos09d07g04kht05lZnPrLsl2tJyG;aHd8;in;la;chis3kiG;ns3;aImstro6sl2;an;ng;ujo,ya;dJgelHsaG;ri;ovG;!a;ersJov,reG;aGjEws;ss1;en;en,on,s3;on;eksejEiyEmeiIvG;ar7es;ez;da;ev;arwHuilG;ar;al;ams,l0;er;ta;as",
  Ordinal: "true¦eBf7nin5s3t0zeroE;enDhir1we0;lfCn7;d,t3;e0ixt8;cond,vent7;et0th;e6ie7;i2o0;r0urt3;tie4;ft1rst;ight0lev1;e0h,ie1;en0;th",
  Cardinal: "true¦bEeBf5mEnine7one,s4t0zero;en,h2rDw0;e0o;lve,n5;irt6ousands,ree;even2ix2;i3o0;r1ur0;!t2;ty;ft0ve;e2y;ight0lev1;!e0y;en;illions",
  Multiple: "true¦b3hundred,m3qu2se1t0;housand,r2;pt1xt1;adr0int0;illion",
  City: "true¦0:74;1:61;2:6G;3:6J;4:5S;a68b53c4Id48e44f3Wg3Hh39i31j2Wk2Fl23m1Mn1Co19p0Wq0Ur0Os05tRuQvLwDxiBy9z5;a7h5i4Muri4O;a5e5ongsh0;ng3H;greb,nzib5G;ang2e5okoha3Sunfu;katerin3Hrev0;a5n0Q;m5Hn;arsBeAi6roclBu5;h0xi,zh5P;c7n5;d5nipeg,terth4;hoek,s1L;hi5Zkl3A;l63xford;aw;a8e6i5ladivost5Molgogr6L;en3lni6S;ni22r5;o3saill4N;lenc4Wncouv3Sr3ughn;lan bat1Crumqi,trecht;aFbilisi,eEheDiBo9r7u5;l21n63r5;in,ku;i5ondh62;es51poli;kyo,m2Zron1Pulo5;n,uS;an5jua3l2Tmisoa6Bra3;j4Tshui; hag62ssaloni2H;gucigal26hr0l av1U;briz,i6llinn,mpe56ng5rtu,shk2R;i3Esh0;an,chu1n0p2Eyu0;aEeDh8kopje,owe1Gt7u5;ra5zh4X;ba0Ht;aten is55ockholm,rasbou67uttga2V;an8e6i5;jiazhua1llo1m5Xy0;f50n5;ya1zh4H;gh3Kt4Q;att45o1Vv44;cramen16int ClBn5o paulo,ppo3Rrajevo; 7aa,t5;a 5o domin3E;a3fe,m1M;antonio,die3Cfrancisco,j5ped3Nsalvad0J;o5u0;se;em,t lake ci5Fz25;lou58peters24;a9e8i6o5;me,t59;ga,o5yadh;! de janei3F;cife,ims,nn3Jykjavik;b4Sip4lei2Inc2Pwalpindi;ingdao,u5;ez2i0Q;aFeEhDiCo9r7u6yong5;ya1;eb59ya1;a5etor3M;g52to;rt5zn0; 5la4Co;au prin0Melizabe24sa03;ls3Prae5Atts26;iladelph3Gnom pe1Aoenix;ki1tah tik3E;dua,lerYnaji,r4Ot5;na,r32;ak44des0Km1Mr6s5ttawa;a3Vlo;an,d06;a7ew5ing2Fovosibir1Jyc; 5cast36;del24orlea44taip14;g8iro4Wn5pl2Wshv33v0;ch6ji1t5;es,o1;a1o1;a6o5p4;ya;no,sa0W;aEeCi9o6u5;mb2Ani26sc3Y;gadishu,nt6s5;c13ul;evideo,pelli1Rre2Z;ami,l6n14s5;kolc,sissauga;an,waukee;cca,d5lbour2Mmph41ndo1Cssi3;an,ell2Xi3;cau,drAkass2Sl9n8r5shh4A;aca6ib5rakesh,se2L;or;i1Sy;a4EchFdal0Zi47;mo;id;aDeAi8o6u5vSy2;anMckn0Odhia3;n5s angel26;d2g bea1N;brev2Be3Lma5nz,sb2verpo28;!ss27; ma39i5;c5pzig;est16; p6g5ho2Wn0Cusan24;os;az,la33;aHharFiClaipeBo9rak0Du7y5;iv,o5;to;ala lump4n5;mi1sh0;hi0Hlka2Xpavog4si5wlo2;ce;da;ev,n5rkuk;gst2sha5;sa;k5toum;iv;bHdu3llakuric0Qmpa3Fn6ohsiu1ra5un1Iwaguc0Q;c0Pj;d5o,p4;ah1Ty;a7e6i5ohannesV;l1Vn0;dd36rusalem;ip4k5;ar2H;bad0mph1OnArkutUs7taXz5;mir,tapala5;pa;fah0l6tanb5;ul;am2Zi2H;che2d5;ianap2Mo20;aAe7o5yder2W; chi mi5ms,nolulu;nh;f6lsin5rakli2;ki;ei;ifa,lifax,mCn5rb1Dva3;g8nov01oi;aFdanEenDhCiPlasgBo9raz,u5;a5jr23;dal6ng5yaquil;zh1J;aja2Oupe;ld coa1Bthen5;bu2S;ow;ent;e0Uoa;sk;lw7n5za;dhi5gt1E;nag0U;ay;aisal29es,o8r6ukuya5;ma;ankfu5esno;rt;rt5sh0; wor6ale5;za;th;d5indhov0Pl paso;in5mont2;bur5;gh;aBe8ha0Xisp4o7resd0Lu5;b5esseldorf,nkirk,rb0shanbe;ai,l0I;ha,nggu0rtmu13;hradSl6nv5troit;er;hi;donghIe6k09l5masc1Zr es sala1KugavpiY;i0lU;gu,je2;aJebu,hAleve0Vo5raio02uriti1Q;lo7n6penhag0Ar5;do1Ok;akKst0V;gUm5;bo;aBen8i6ongqi1ristchur5;ch;ang m7ca5ttago1;go;g6n5;ai;du,zho1;ng5ttogr14;ch8sha,zh07;gliari,i9lga8mayenJn6pe town,r5tanO;acCdiff;ber1Ac5;un;ry;ro;aWeNhKirmingh0WoJr9u5;chareTdapeTenos air7r5s0tu0;g5sa;as;es;a9is6usse5;ls;ba6t5;ol;ne;sil8tisla7zzav5;il5;le;va;ia;goZst2;op6ubaneshw5;ar;al;iCl9ng8r5;g6l5n;in;en;aluru,hazi;fa6grade,o horizon5;te;st;ji1rut;ghd0BkFn9ot8r7s6yan n4;ur;el,r07;celo3i,ranquil09;ou;du1g6ja lu5;ka;alo6k5;ok;re;ng;ers5u;field;a05b02cc01ddis aba00gartaZhmedXizawl,lSmPnHqa00rEsBt7uck5;la5;nd;he7l5;an5;ta;ns;h5unci2;dod,gab5;at;li5;ngt2;on;a8c5kaOtwerp;hora6o3;na;ge;h7p5;ol5;is;eim;aravati,m0s5;terd5;am; 7buquerq6eppo,giers,ma5;ty;ue;basrah al qadim5mawsil al jadid5;ah;ab5;ad;la;ba;ra;idj0u dha5;bi;an;lbo6rh5;us;rg",
  Region: "true¦0:2O;1:2L;2:2U;3:2F;a2Sb2Fc21d1Wes1Vf1Tg1Oh1Ki1Fj1Bk16l13m0Sn09o07pYqVrSsJtEuBverAw6y4zacatec2W;akut0o0Fu4;cat1k09;a5est 4isconsin,yomi1O;bengal,virgin0;rwick3shington4;! dc;acruz,mont;dmurt0t4;ah,tar4; 2Pa12;a6e5laxca1Vripu21u4;scaEva;langa2nnessee,x2J;bas10m4smQtar29;aulip2Hil nadu;a9elang07i7o5taf16u4ylh1J;ff02rr09s1E;me1Gno1Uuth 4;cZdY;ber0c4kkim,naloa;hu1ily;n5rawak,skatchew1xo4;ny; luis potosi,ta catari2;a4hodeA;j4ngp0C;asth1shahi;ingh29u4;e4intana roo;bec,en6retaro;aAe6rince edward4unjab; i4;sl0G;i,n5r4;ak,nambu0F;a0Rnsylv4;an0;ha0Pra4;!na;axa0Zdisha,h4klaho21ntar4reg7ss0Dx0I;io;aLeEo6u4;evo le4nav0X;on;r4tt18va scot0;f9mandy,th4; 4ampton3;c6d5yo4;rk3;ako1O;aroli2;olk;bras1Nva0Dw4; 6foundland4;! and labrad4;or;brunswick,hamp3jers5mexiTyork4;! state;ey;galPyarit;aAeghala0Mi6o4;nta2r4;dov0elos;ch6dlanDn5ss4zor11;issippi,ouri;as geraPneso18;ig1oac1;dhy12harasht0Gine,lac07ni5r4ssachusetts;anhao,i el,ylG;p4toba;ur;anca3e4incoln3ouisI;e4iR;ds;a6e5h4omi;aka06ul2;dah,lant1ntucky,ra01;bardino,lmyk0ns0Qr4;achay,el0nata0X;alis6har4iangxi;kh4;and;co;daho,llino7n4owa;d5gush4;et0;ia2;is;a6ert5i4un1;dalFm0D;ford3;mp3rya2waii;ansu,eorg0lou7oa,u4;an4izhou,jarat;ajuato,gdo4;ng;cester3;lori4uji1;da;sex;ageUe7o5uran4;go;rs4;et;lawaMrby3;aFeaEh9o4rim08umbr0;ahui7l6nnectic5rsi4ventry;ca;ut;i03orado;la;e5hattisgarh,i4uvash0;apRhuahua;chn5rke4;ss0;ya;ra;lGm4;bridge3peche;a9ihar,r8u4;ck4ryat0;ingham3;shi4;re;emen,itish columb0;h0ja cal8lk7s4v7;hkorto4que;st1;an;ar0;iforn0;ia;dygHguascalientes,lBndhr9r5ss4;am;izo2kans5un4;achal 7;as;na;a 4;pradesh;a6ber5t4;ai;ta;ba5s4;ka;ma;ea",
  Place: "true¦0:4T;1:4V;2:44;3:4B;4:3I;a4Eb3Gc2Td2Ge26f25g1Vh1Ji1Fk1Cl14m0Vn0No0Jp08r04sTtNuLvJw7y5;a5o0Syz;kut1Bngtze;aDeChitBi9o5upatki,ycom2P;ki26o5;d5l1B;b3Ps5;i4to3Y;c0SllowbroCn5;c2Qgh2;by,chur1P;ed0ntw3Gs22;ke6r3St5;erf1f1; is0Gf3V;auxha3Mirgin is0Jost5;ok;laanbaatar,pto5xb3E;n,wn;a9eotihuac43h7ive49o6ru2Nsarskoe selo,u5;l2Dzigo47;nto,rquay,tt2J;am3e 5orn3E;bronx,hamptons;hiti,j mah0Iu1N;aEcotts bluff,eCfo,herbroQoApring9t7u5yd2F;dbu1Wn5;der03set3B;aff1ock2Nr5;atf1oud;hi37w24;ho,uth5; 1Iam1Zwo3E;a5i2O;f2Tt0;int lawrence riv3Pkhal2D;ayleigh,ed7i5oc1Z;chmo1Eo gran4ver5;be1Dfr09si4; s39cliffe,hi2Y;aCe9h8i5ompeii,utn2;c6ne5tcai2T; 2Pc0G;keri13t0;l,x;k,lh2mbr6n5r2J;n1Hzance;oke;cif38pahanaumokuak30r5;k5then0;si4w1K;ak7r6x5;f1l2X;ange county,d,f1inoco;mTw1G;e8i1Uo5;r5tt2N;th5wi0E; 0Sam19;uschwanste1Pw5; eng6a5h2market,po36;rk;la0P;a8co,e6i5uc;dt1Yll0Z;adow5ko0H;lands;chu picchu,gad2Ridsto1Ql8n7ple6r5;kh2; g1Cw11;hatt2Osf2B;ibu,t0ve1Z;a8e7gw,hr,in5owlOynd02;coln memori5dl2C;al;asi4w3;kefr7mbe1On5s,x;ca2Ig5si05;f1l27t0;ont;azan kreml14e6itchen2Gosrae,rasnoyar5ul;sk;ns0Hs1U;ax,cn,lf1n6ps5st;wiN;d5glew0Lverness;ian27ochina;aDeBi6kg,nd,ov5unti2H;d,enweep;gh6llc5;reL;bu03l5;and5;!s;r5yw0C;ef1tf1;libu24mp6r5stings;f1lem,row;stead,t0;aDodavari,r5uelph;avenAe5imsS;at 8en5; 6f1Fwi5;ch;acr3vall1H;brita0Flak3;hur5;st;ng3y villa0W;airhavHco,ra;aAgli9nf17ppi8u7ver6x5;et1Lf1;glad3t0;rope,st0;ng;nt0;rls1Ls5;t 5;e5si4;nd;aCe9fw,ig8o7ryd6u5xb;mfri3nstab00rh2tt0;en;nca18rcKv19wnt0B;by;n6r5vonpo1D;ry;!h2;nu8r5;l6t5;f1moor;ingt0;be;aLdg,eIgk,hClBo5royd0;l6m5rnwa0B;pt0;c7lingw6osse5;um;ood;he0S;earwat0St;a8el6i5uuk;chen itza,mney ro07natSricahua;m0Zt5;enh2;mor5rlottetPth2;ro;dar 5ntervilA;breaks,faZg5;rove;ld9m8r5versh2;lis6rizo pla5;in;le;bLpbellf1;weQ;aZcn,eNingl01kk,lackLolt0r5uckV;aGiAo5;ckt0ok5wns cany0;lyn,s5;i4to5;ne;de;dge6gh5;am,t0;n6t5;own;or5;th;ceb6m5;lNpt0;rid5;ge;bu5pool,wa8;rn;aconsfEdf1lBr9verly7x5;hi5;ll; hi5;lls;wi5;ck; air,l5;ingh2;am;ie5;ld;ltimore,rnsl6tters5;ea;ey;bLct0driadic,frica,ginJlGmFn9rc8s7tl6yleOzor3;es;!ant8;hcroft,ia; de triomphe,t6;adyr,ca8dov9tarct5;ic5; oce5;an;st5;er;ericas,s;be6dersh5hambra,list0;ot;rt0;cou5;rt;bot7i5;ngd0;on;sf1;ord",
  Country: "true¦0:38;1:2L;2:3B;a2Xb2Ec22d1Ye1Sf1Mg1Ch1Ai14j12k0Zl0Um0Gn05om2pZqat1KrXsKtCu7v5wal4yemTz3;a25imbabwe;es,lis and futu2Y;a3enezue32ietnam;nuatu,tican city;gTk6nited 4ruXs3zbeE; 2Ca,sr;arab emirat0Kkingdom,states3;! of am2Y;!raiV;a8haCimor les0Co7rinidad 5u3;nis0rk3valu;ey,me2Zs and caic1V;and t3t3;oba1L;go,kel10nga;iw2ji3nz2T;ki2V;aDcotl1eCi9lov8o6pa2Dri lanka,u5w3yr0;az3edAitzerl1;il1;d2riname;lomon1Xmal0uth 3;afr2KkMsud2;ak0en0;erra leoFn3;gapo1Yt maart3;en;negLrb0ychellZ;int 3moa,n marino,udi arab0;hele26luc0mart21;epublic of ir0Eom2Euss0w3;an27;a4eIhilippinUitcairn1Mo3uerto riN;l1rtugF;ki2Dl4nama,pua new0Vra3;gu7;au,esti3;ne;aBe9i7or3;folk1Ith4w3;ay; k3ern mariana1D;or0O;caragua,ger3ue;!ia;p3ther1Aw zeal1;al;mib0u3;ru;a7exi6icro0Bo3yanm06;ldova,n3roc5zambA;a4gol0t3;enegro,serrat;co;cAdagasc01l7r5urit4yot3;te;an0i16;shall0Xtin3;ique;a4div3i,ta;es;wi,ys0;ao,ed02;a6e5i3uxembourg;b3echtenste12thu1G;er0ya;ban0Isotho;os,tv0;azakh1Fe4iriba04o3uwait,yrgyz1F;rXsovo;eling0Knya;a3erG;ma16p2;c7nd6r4s3taly,vory coast;le of m2rael;a3el1;n,q;ia,oJ;el1;aiTon3ungary;dur0Ng kong;aBermany,ha0QibraltAre8u3;a6ern5inea3ya0P;! biss3;au;sey;deloupe,m,tema0Q;e3na0N;ce,nl1;ar;bUmb0;a7i6r3;ance,ench 3;guia0Epoly3;nes0;ji,nl1;lklandUroeU;ast tim7cu6gypt,l salv6ngl1quatorial4ritr5st3thiop0;on0; guin3;ea;ad3;or;enmark,jibou5ominica4r con3;go;!n C;ti;aBentral african Ah8o5roat0u4yprRzech3; 9ia;ba,racao;c4lo3morQngo brazzaville,okGsta r04te de ivoiL;mb0;osE;i3ristmasG;le,na;republic;m3naUpe verde,ymanA;bod0ero3;on;aGeDhut2o9r5u3;lgar0r3;kina faso,ma,undi;azil,itish 3unei;virgin3; is3;lands;liv0nai5snia and herzegoviHtswaHuvet3; isl1;and;re;l3n8rmuG;ar3gium,ize;us;h4ngladesh,rbad3;os;am4ra3;in;as;fghaGlDmBn6r4ustr3zerbaij2;al0ia;genti3men0uba;na;dorra,g5t3;arct7igua and barbu3;da;o3uil3;la;er3;ica;b3ger0;an0;ia;ni3;st2;an",
  FirstName: "true¦aTblair,cQdOfrancoZgabMhinaLilya,jHkClBm6ni4quinn,re3s0;h0umit,yd;ay,e0iloh;a,lby;g9ne;co,ko0;!s;a1el0ina,org6;!okuhF;ds,naia,r1tt0xiB;i,y;ion,lo;ashawn,eif,uca;a3e1ir0rM;an;lsFn0rry;dall,yat5;i,sD;a0essIie,ude;i1m0;ie,mG;me;ta;rie0y;le;arcy,ev0;an,on;as1h0;arl8eyenne;ey,sidy;drien,kira,l4nd1ubr0vi;ey;i,r0;a,e0;a,y;ex2f1o0;is;ie;ei,is",
  WeekDay: "true¦fri2mon2s1t0wednesd3;hurs1ues1;aturd1und1;!d0;ay0;!s",
  Month: "true¦dec0february,july,nov0octo1sept0;em0;ber",
  Date: "true¦ago,on4som4t1week0yesterd5; end,ends;mr1o0;d2morrow;!w;ed0;ay",
  Duration: "true¦centurAd8h7m5q4se3w1y0;ear8r8;eek0k7;!end,s;ason,c5;tr,uarter;i0onth3;llisecond2nute2;our1r1;ay0ecade0;!s;ies,y",
  FemaleName: "true¦0:J7;1:JB;2:IJ;3:IK;4:J1;5:IO;6:JS;7:JO;8:HB;9:JK;A:H4;B:I2;C:IT;D:JH;E:IX;F:BA;G:I4;aGTbFLcDRdD0eBMfB4gADh9Ti9Gj8Dk7Cl5Wm48n3Lo3Hp33qu32r29s15t0Eu0Cv02wVxiTyOzH;aLeIineb,oHsof3;e3Sf3la,ra;h2iKlIna,ynH;ab,ep;da,ma;da,h2iHra;nab;aKeJi0FolB7uIvH;et8onDP;i0na;le0sen3;el,gm3Hn,rGLs8W;aoHme0nyi;m5XyAD;aMendDZhiDGiH;dele9lJnH;if48niHo0;e,f47;a,helmi0lHma;a,ow;ka0nB;aNeKiHusa5;ck84kIl8oleAviH;anFenJ4;ky,toriBK;da,lA8rHs0;a,nHoniH9;a,iFR;leHnesH9;nILrH;i1y;g9rHs6xHA;su5te;aYeUhRiNoLrIuHy2;i,la;acJ3iHu0J;c3na,sH;hFta;nHr0F;iFya;aJffaEOnHs6;a,gtiH;ng;!nFSra;aIeHomasi0;a,l9Oo8Ares1;l3ndolwethu;g9Fo88rIssH;!a,ie;eHi,ri7;sa,za;bOlMmKnIrHs6tia0wa0;a60yn;iHya;a,ka,s6;arFe2iHm77ra;!ka;a,iH;a,t6;at6it6;a0Ecarlett,e0AhWiSkye,neza0oQri,tNuIyH;bIGlvi1;ha,mayIJniAsIzH;an3Net8ie,y;anHi7;!a,e,nH;aCe;aIeH;fan4l5Dphan6E;cI5r5;b3fiAAm0LnHphi1;d2ia,ja,ya;er2lJmon1nIobh8QtH;a,i;dy;lETv3;aMeIirHo0risFDy5;a,lDM;ba,e0i5lJrH;iHr6Jyl;!d8Ifa;ia,lDZ;hd,iMki2nJrIu0w0yH;la,ma,na;i,le9on,ron,yn;aIda,ia,nHon;a,on;!ya;k6mH;!aa;lJrItaye82vH;da,inj;e0ife;en1i0ma;anA9bLd5Oh1SiBkKlJmInd2rHs6vannaC;aCi0;ant6i2;lDOma,ome;ee0in8Tu2;in1ri0;a05eZhXiUoHuthDM;bScRghQl8LnPsJwIxH;anB3ie,y;an,e0;aIeHie,lD;ann7ll1marDGtA;!lHnn1;iHyn;e,nH;a,dF;da,i,na;ayy8G;hel67io;bDRerAyn;a,cIkHmas,nFta,ya;ki,o;h8Xki;ea,iannGMoH;da,n1P;an0bJemFgi0iInHta,y0;a8Bee;han86na;a,eH;cHkaC;a,ca;bi0chIe,i0mo0nHquETy0;di,ia;aERelHiB;!e,le;een4ia0;aPeOhMiLoJrHute6A;iHudenCV;scil3LyamvaB;lHrt3;i0ly;a,paluk;ilome0oebe,ylH;is,lis;ggy,nelope,r5t2;ige,m0VnKo5rvaDMtIulH;a,et8in1;ricHt4T;a,e,ia;do2i07;ctav3dIfD3is6ksa0lHphD3umC5yunbileg;a,ga,iv3;eHvAF;l3t8;aWeUiMoIurHy5;!ay,ul;a,eJor,rIuH;f,r;aCeEma;ll1mi;aNcLhariBQkKlaJna,sHta,vi;anHha;ur;!y;a,iDZki;hoGk9YolH;a,e4P;!mh;hir,lHna,risDEsreE;!a,iDDlBV;asuMdLh3i6Dl5nKomi7rgEVtH;aHhal4;lHs6;i1ya;cy,et8;e9iF0ya;nngu2X;a0Ackenz4e02iMoJrignayani,uriDJyH;a,rH;a,iOlNna,tG;bi0i2llBJnH;a,iH;ca,ka,qD9;a,cUdo4ZkaTlOmi,nMrItzi,yH;ar;aJiIlH;anET;am;!l,nB;dy,eHh,n4;nhGrva;aKdJe0iCUlH;iHy;cent,e;red;!gros;!e5;ae5hH;ae5el3Z;ag5DgNi,lKrH;edi7AiIjem,on,yH;em,l;em,sCG;an4iHliCF;nHsCJ;a,da;!an,han;b09cASd07e,g05ha,i04ja,l02n00rLsoum5YtKuIv84xBKyHz4;bell,ra,soBB;d7rH;a,eE;h8Gild1t4;a,cUgQiKjor4l7Un4s6tJwa,yH;!aHbe6Xja9lAE;m,nBL;a,ha,in1;!aJbCGeIja,lDna,sHt63;!a,ol,sa;!l1D;!h,mInH;!a,e,n1;!awit,i;arJeIie,oHr48ueri8;!t;!ry;et46i3B;el4Xi7Cy;dHon,ue5;akranAy;ak,en,iHlo3S;a,ka,nB;a,re,s4te;daHg4;!l3E;alDd4elHge,isDJon0;ei9in1yn;el,le;a0Ne0CiXoQuLyH;d3la,nH;!a,dIe2OnHsCT;!a,e2N;a,sCR;aD4cJel0Pis1lIna,pHz;e,iA;a,u,wa;iHy;a0Se,ja,l2NnB;is,l1UrItt1LuHvel4;el5is1;aKeIi7na,rH;aADi7;lHn1tA;ei;!in1;aTbb9HdSepa,lNnKsJvIzH;!a,be5Ret8z4;!ia;a,et8;!a,dH;a,sHy;ay,ey,i,y;a,iJja,lH;iHy;aA8e;!aH;!nF;ia,ya;!nH;!a,ne;aPda,e0iNjYla,nMoKsJtHx93y5;iHt4;c3t3;e2PlCO;la,nHra;a,ie,o2;a,or1;a,gh,laH;!ni;!h,nH;a,d2e,n5V;cOdon9DiNkes6mi9Gna,rMtJurIvHxmi,y5;ern1in3;a,e5Aie,yn;as6iIoH;nya,ya;fa,s6;a,isA9;a,la;ey,ie,y;a04eZhXiOlASoNrJyH;lHra;a,ee,ie;istHy6I;a,en,iIyH;!na;!e,n5F;nul,ri,urtnB8;aOerNlB7mJrHzzy;a,stH;en,in;!berlImernH;aq;eHi,y;e,y;a,stE;!na,ra;aHei2ongordzol;dij1w5;el7UiKjsi,lJnIrH;a,i,ri;d2na,za;ey,i,lBLs4y;ra,s6;biAcARdiat7MeBAiSlQmPnyakuma1DrNss6NtKviAyH;!e,lH;a,eH;e,i8T;!a6HeIhHi4TlDri0y;ar8Her8Hie,leErBAy;!lyn8Ori0;a,en,iHl5Xoli0yn;!ma,nFs95;a5il1;ei8Mi,lH;e,ie;a,tl6O;a0AeZiWoOuH;anMdLlHst88;es,iH;a8NeHs8X;!n9tH;!a,te;e5Mi3My;a,iA;!anNcelDdMelGhan7VleLni,sIva0yH;a,ce;eHie;fHlDph7Y;a,in1;en,n1;i7y;!a,e,n45;lHng;!i1DlH;!i1C;anNle0nKrJsH;i8JsH;!e,i8I;i,ri;!a,elGif2CnH;a,et8iHy;!e,f2A;a,eJiInH;a,eIiH;e,n1;!t8;cMda,mi,nIque4YsminFvie2y9zH;min7;a7eIiH;ce,e,n1s;!lHs82t0F;e,le;inIk6HlDquelH;in1yn;da,ta;da,lRmPnOo0rNsIvaHwo0zaro;!a0lu,na;aJiIlaHob89;!n9R;do2;belHdo2;!a,e,l3B;a7Ben1i0ma;di2es,gr72ji;a9elBogH;en1;a,e9iHo0se;a0na;aSeOiJoHus7Kyacin2C;da,ll4rten24snH;a,i9U;lImaH;ri;aIdHlaI;a,egard;ry;ath1BiJlInrietArmi9sH;sa,t1A;en2Uga,mi;di;bi2Fil8MlNnMrJsItHwa,yl8M;i5Tt4;n60ti;iHmo51ri53;etH;!te;aCnaC;a,ey,l4;a02eWiRlPoNrKunJwH;enHyne1R;!dolD;ay,el;acieIetHiselB;a,chE;!la;ld1CogooH;sh;adys,enHor3yn2K;a,da,na;aKgi,lIna,ov8EselHta;a,e,le;da,liH;an;!n0;mLnJorgIrH;ald5Si,m3Etrud7;et8i4X;a,eHna;s29vieve;ma;bIle,mHrnet,yG;al5Si5;iIrielH;a,l1;!ja;aTeQiPlorOoz3rH;anJeIiH;da,eB;da,ja;!cH;esIiHoi0P;n1s66;!ca;a,enc3;en,o0;lIn0rnH;anB;ec3ic3;jr,nArKtHy7;emIiHma,oumaA;ha,ma,n;eh;ah,iBrah,za0;cr4Rd0Re0Qi0Pk0Ol07mXn54rUsOtNuMvHwa;aKelIiH;!e,ta;inFyn;!a;!ngel4V;geni1ni47;h5Yien9ta;mLperanKtH;eIhHrel5;er;l31r7;za;a,eralB;iHma,ne4Lyn;cHka,n;a,ka;aPeNiKmH;aHe21ie,y;!li9nuH;elG;lHn1;e7iHy;a,e,ja;lHrald;da,y;!nue5;aWeUiNlMma,no2oKsJvH;a,iH;na,ra;a,ie;iHuiH;se;a,en,ie,y;a0c3da,e,f,nMsJzaH;!betHveA;e,h;aHe,ka;!beH;th;!a,or;anor,nH;!a,i;!in1na;ate1Rta;leEs6;vi;eIiHna,wi0;e,th;l,n;aYeMh3iLjeneKoH;lor5Vminiq4Ln3FrHtt4;a,eEis,la,othHthy;ea,y;ba;an09naCon9ya;anQbPde,eOiMlJmetr3nHsir5M;a,iH;ce,se;a,iIla,orHphi9;es,is;a,l6F;dHrdH;re;!d5Ena;!b2ForaCraC;a,d2nH;!a,e;hl3i0l0GmNnLphn1rIvi1WyH;le,na;a,by,cIia,lH;a,en1;ey,ie;a,et8iH;!ca,el1Aka,z;arHia;is;a0Re0Nh04i02lUoJristIynH;di,th3;al,i0;lPnMrIurH;tn1D;aJd2OiHn2Ori9;!nH;a,e,n1;!l4;cepci5Cn4sH;tanHuelo;ce,za;eHleE;en,t8;aJeoIotH;il54;!pat2;ir7rJudH;et8iH;a,ne;a,e,iH;ce,sZ;a2er2ndH;i,y;aReNloe,rH;isJyH;stH;al;sy,tH;a1Sen,iHy;an1e,n1;deJlseIrH;!i7yl;a,y;li9;nMrH;isKlImH;ai9;a,eHot8;n1t8;!sa;d2elGtH;al,elG;cIlH;es8i47;el3ilH;e,ia,y;itlYlXmilWndVrMsKtHy5;aIeIhHri0;er1IleErDy;ri0;a38sH;a37ie;a,iOlLmeJolIrH;ie,ol;!e,in1yn;lHn;!a,la;a,eIie,otHy;a,ta;ne,y;na,s1X;a0Ii0I;a,e,l1;isAl4;in,yn;a0Ke02iZlXoUrH;andi7eRiJoIyH;an0nn;nwDoke;an3HdgMgiLtH;n31tH;!aInH;ey,i,y;ny;d,t8;etH;!t7;an0e,nH;da,na;bbi7glarIlo07nH;iAn4;ka;ancHythe;a,he;an1Clja0nHsm3M;iAtH;ou;aWcVlinUniArPssOtJulaCvH;!erlH;ey,y;hJsy,tH;e,iHy7;e,na;!anH;ie,y;!ie;nItHyl;ha,ie;adIiH;ce;et8i9;ay,da;ca,ky;!triH;ce,z;rbJyaH;rmH;aa;a2o2ra;a2Ub2Od25g21i1Sj5l18m0Zn0Boi,r06sWtVuPvOwa,yIzH;ra,u0;aKes6gJlIn,seH;!l;in;un;!nH;a,na;a,i2K;drLguJrIsteH;ja;el3;stH;in1;a,ey,i,y;aahua,he0;hIi2Gja,miAs2DtrH;id;aMlIraqHt21;at;eIi7yH;!n;e,iHy;gh;!nH;ti;iJleIo6piA;ta;en,n1t8;aHelG;!n1J;a01dje5eZgViTjRnKohito,toHya;inet8nH;el5ia;te;!aKeIiHmJ;e,ka;!mHtt7;ar4;!belIliHmU;sa;!l1;a,eliH;ca;ka,sHta;a,sa;elHie;a,iH;a,ca,n1qH;ue;!tH;a,te;!bImHstasiMya;ar3;el;aLberKeliJiHy;e,l3naH;!ta;a,ja;!ly;hGiIl3nB;da;a,ra;le;aWba,ePiMlKthJyH;a,c3sH;a,on,sa;ea;iHys0N;e,s0M;a,cIn1sHza;a,e,ha,on,sa;e,ia,ja;c3is6jaKksaKna,sJxH;aHia;!nd2;ia,saH;nd2;ra;ia;i0nIyH;ah,na;a,is,naCoud;la;c6da,leEmNnLsH;haClH;inHyY;g,n;!h;a,o,slH;ey;ee;en;at6g4nIusH;ti0;es;ie;aWdiTelMrH;eJiH;anMenH;a,e,ne;an0;na;!aLeKiIyH;nn;a,n1;a,e;!ne;!iH;de;e,lDsH;on;yn;!lH;i9yn;ne;aKbIiHrL;!e,gaK;ey,i7y;!e;gaH;il;dKliyJradhIs6;ha;ya;ah;a,ya",
  Honorific: "true¦director1field marsh2lieutenant1rear0sergeant major,vice0; admir1; gener0;al",
  "Adj|Gerund": "true¦0:3F;1:3H;2:31;3:2X;4:35;5:33;6:3C;7:2Z;8:36;9:29;a33b2Tc2Bd1Te1If19g12h0Zi0Rl0Nm0Gnu0Fo0Ap04rYsKtEuBvAw1Ayiel3;ar6e08;nBpA;l1Rs0B;fol3n1Zsett2;aEeDhrBi4ouc7rAwis0;e0Bif2oub2us0yi1;ea1SiA;l2vi1;l2mp0rr1J;nt1Vxi1;aMcreec7enten2NhLkyrocke0lo0Vmi2oJpHtDuBweA;e0Ul2;pp2ArA;gi1pri5roun3;aBea8iAri2Hun9;mula0r4;gge4rA;t2vi1;ark2eAraw2;e3llb2F;aAot7;ki1ri1;i9oc29;dYtisf6;aEeBive0oAus7;a4l2;assu4defi9fres7ig9juve07mai9s0vAwar3;ea2italiAol1G;si1zi1;gi1ll6mb2vi1;a6eDier23lun1VrAun2C;eBoA;mi5vo1Z;ce3s5vai2;n3rpleA;xi1;ffCpWutBverAwi1;arc7lap04p0Pri3whel8;goi1l6st1J;en3sA;et0;m2Jrtu4;aEeDiCoBuAyst0L;mb2;t1Jvi1;s5tiga0;an1Rl0n3smeri26;dAtu4;de9;aCeaBiAo0U;fesa0Tvi1;di1ni1;c1Fg19s0;llumiGmFnArri0R;cDfurHsCtBviA;go23ti1;e1Oimi21oxica0rig0V;pi4ul0;orpo20r0K;po5;na0;eaBorr02umilA;ia0;li1rtwar8;lFrA;atiDipCoBuelA;i1li1;undbrea10wi1;pi1;f6ng;a4ea8;a3etc7it0lEoCrBulfA;il2;ee1FighXust1L;rAun3;ebo3thco8;aCoA;a0wA;e4i1;mi1tte4;lectrJmHnExA;aCci0hBis0pA;an3lo3;aOila1B;c0spe1A;ab2coura0CdBergi13ga0Clive9ric7s02tA;hral2i0J;ea4u4;barras5er09pA;owe4;if6;aQeIiBrA;if0;sAzz6;aEgDhearCsen0tA;rAur11;ac0es5;te9;us0;ppoin0r8;biliGcDfi9gra3ligh0mBpres5sAvasG;erE;an3ea9orA;ali0L;a6eiBli9rA;ea5;vi1;ta0;maPri1s7un0zz2;aPhMlo5oAripp2ut0;mGnArrespon3;cer9fDspi4tA;inBrA;as0ibu0ol2;ui1;lic0u5;ni1;fDmCpA;eAromi5;l2ti1;an3;or0;aAil2;llenAnAr8;gi1;l8ptAri1;iva0;aff2eGin3lFoDrBuA;d3st2;eathtaAui5;ki1;gg2i2o8ri1unA;ci1;in3;co8wiA;lAtc7;de4;bsorVcOgonMlJmHnno6ppea2rFsA;pi4su4toA;nBun3;di1;is7;hi1;res0;li1;aFu5;si1;ar8lu4;ri1;mi1;iAzi1;zi1;cAhi1;eleDomA;moBpan6;yi1;da0;ra0;ti1;bi1;ng",
  Comparable: "true¦0:3C;1:3Q;2:3F;a3Tb3Cc33d2Te2Mf2Ag1Wh1Li1Fj1Ek1Bl13m0Xn0So0Rp0Iqu0Gr07sHtCug0vAw4y3za0Q;el10ouN;ary,e6hi5i3ry;ck0Cde,l3n1ry,se;d,y;ny,te;a3i3R;k,ry;a3erda2ulgar;gue,in,st;a6en2Xhi5i4ouZr3;anqu2Cen1ue;dy,g36me0ny;ck,rs28;ll,me,rt,wd3I;aRcaPeOhMiLkin0BlImGoEpDt6u4w3;eet,ift;b3dd0Wperfi21rre28;sta26t21;a8e7iff,r4u3;pUr1;a4ict,o3;ng;ig2Vn0N;a1ep,rn;le,rk,te0;e1Si2Vright0;ci1Yft,l3on,re;emn,id;a3el0;ll,rt;e4i3y;g2Mm0Z;ek,nd2T;ck24l0mp1L;a3iRrill,y;dy,l01rp;ve0Jxy;n1Jr3;ce,y;d,fe,int0l1Hv0V;a8e6i5o3ude;mantic,o19sy,u3;gh;pe,t1P;a3d,mo0A;dy,l;gg4iFndom,p3re,w;id;ed;ai2i3;ck,et;hoAi1Fl9o8r5u3;ny,r3;e,p11;egna2ic4o3;fouSud;ey,k0;liXor;ain,easa2;ny;dd,i0ld,ranL;aive,e5i4o3u14;b0Sisy,rm0Ysy;bb0ce,mb0R;a3r1w;r,t;ad,e5ild,o4u3;nda12te;ist,o1;a4ek,l3;low;s0ty;a8e7i6o3ucky;f0Jn4o15u3ve0w10y0N;d,sy;e0g;ke0l,mp,tt0Eve0;e1Qwd;me,r3te;ge;e4i3;nd;en;ol0ui19;cy,ll,n3;secu6t3;e3ima4;llege2rmedia3;te;re;aAe7i6o5u3;ge,m3ng1C;bYid;me0t;gh,l0;a3fXsita2;dy,rWv3;en0y;nd13ppy,r3;d3sh;!y;aFenEhCiBlAoofy,r3;a8e6i5o3ue0Z;o3ss;vy;m,s0;at,e3y;dy,n;nd,y;ad,ib,ooD;a2d1;a3o3;st0;tDuiS;u1y;aCeebBi9l8o6r5u3;ll,n3r0N;!ny;aCesh,iend0;a3nd,rmD;my;at,ir7;erce,nan3;ci9;le;r,ul3;ty;a6erie,sse4v3xtre0B;il;nti3;al;r4s3;tern,y;ly,th0;appZe9i5ru4u3;mb;nk;r5vi4z3;zy;ne;e,ty;a3ep,n9;d3f,r;!ly;agey,h8l7o5r4u3;dd0r0te;isp,uel;ar3ld,mmon,st0ward0zy;se;evKou1;e3il0;ap,e3;sy;aHiFlCoAr5u3;ff,r0sy;ly;a6i3oad;g4llia2;nt;ht;sh,ve;ld,un3;cy;a4o3ue;nd,o1;ck,nd;g,tt3;er;d,ld,w1;dy;bsu6ng5we3;so3;me;ry;rd",
  Adverb: "true¦a08b05d00eYfSheQinPjustOkinda,likewiZmMnJoEpCquite,r9s5t2u0very,well;ltima01p0; to,wards5;h1iny bit,o0wiO;o,t6;en,us;eldom,o0uch;!me1rt0; of;how,times,w0C;a1e0;alS;ndomRth05;ar excellenEer0oint blank; Lhaps;f3n0utright;ce0ly;! 0;ag05moX; courGten;ewJo0; longWt 0;onHwithstand9;aybe,eanwhiNore0;!ovT;! aboX;deed,steY;lla,n0;ce;or3u0;ck1l9rther0;!moK;ing; 0evK;exampCgood,suH;n mas0vI;se;e0irect2; 2fini0;te0;ly;juAtrop;ackward,y 0;far,no0; means,w; GbroFd nauseam,gEl7ny5part,s4t 2w0;ay,hi0;le;be7l0mo7wor7;arge,ea6; soon,i4;mo0way;re;l 3mo2ongsi1ready,so,togeth0ways;er;de;st;b1t0;hat;ut;ain;ad;lot,posteriori",
  Conjunction: "true¦aXbTcReNhowMiEjust00noBo9p8supposing,t5wh0yet;e1il0o3;e,st;n1re0thN; if,by,vM;evL;h0il,o;erefOo0;!uU;lus,rovided th9;r0therwiM;! not; mattEr,w0;! 0;since,th4w7;f4n0; 0asmuch;as mIcaForder t0;h0o;at;! 0;only,t0w0;hen;!ev3;ith2ven0;! 0;if,tB;er;o0uz;s,z;e0ut,y the time;cau1f0;ore;se;lt3nd,s 0;far1if,m0soon1t2;uch0; as;hou0;gh",
  Currency: "true¦$,aud,bQcOdJeurIfHgbp,hkd,iGjpy,kElDp8r7s3usd,x2y1z0¢,£,¥,ден,лв,руб,฿,₡,₨,€,₭,﷼;lotyQł;en,uanP;af,of;h0t5;e0il5;k0q0;elK;oubleJp,upeeJ;e2ound st0;er0;lingG;n0soF;ceEnies;empi7i7;n,r0wanzaCyatC;!onaBw;ls,nr;ori7ranc9;!os;en3i2kk,o0;b0ll2;ra5;me4n0rham4;ar3;e0ny;nt1;aht,itcoin0;!s",
  Determiner: "true¦aBboth,d9e6few,le5mu8neiDplenty,s4th2various,wh0;at0ich0;evC;a0e4is,ose;!t;everal,ome;!ast,s;a1l0very;!se;ch;e0u;!s;!n0;!o0y;th0;er",
  "Adj|Present": "true¦a07b04cVdQeNfJhollIidRlEmCnarrIoBp9qua8r7s3t2uttFw0;aKet,ro0;ng,u08;endChin;e2hort,l1mooth,our,pa9tray,u0;re,speU;i2ow;cu6da02leSpaN;eplica01i02;ck;aHerfePr0;eseUime,omV;bscu1pen,wn;atu0e3odeH;re;a2e1ive,ow0;er;an;st,y;ow;a2i1oul,r0;ee,inge;rm;iIke,ncy,st;l1mpty,x0;emHpress;abo4ic7;amp,e2i1oub0ry,ull;le;ffu9re6;fu8libe0;raE;alm,l5o0;mpleCn3ol,rr1unterfe0;it;e0u7;ct;juga8sum7;ea1o0;se;n,r;ankru1lu0;nt;pt;li2pproxi0rticula1;ma0;te;ght",
  "Person|Adj": "true¦b3du2earnest,frank,mi2r0san1woo1;an0ich,u1;dy;sty;ella,rown",
  Modal: "true¦c5lets,m4ought3sh1w0;ill,o5;a0o4;ll,nt;! to,a;ight,ust;an,o0;uld",
  Verb: "true¦born,cannot,gonna,has,keep tabs,msg",
  "Person|Verb": "true¦b8ch7dr6foster,gra5ja9lan4ma2ni9ollie,p1rob,s0wade;kip,pike,t5ue;at,eg,ier2;ck,r0;k,shal;ce;ce,nt;ew;ase,u1;iff,l1ob,u0;ck;aze,ossom",
  "Person|Date": "true¦a2j0sep;an0une;!uary;p0ugust,v0;ril"
}, Me = 36, $n = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", Rr = $n.split("").reduce(function(e, t, n) {
  return e[t] = n, e;
}, {}), $d = function(e) {
  if ($n[e] !== void 0)
    return $n[e];
  let t = 1, n = Me, r = "";
  for (; e >= n; e -= n, t++, n *= Me)
    ;
  for (; t--; ) {
    const o = e % Me;
    r = String.fromCharCode((o < 10 ? 48 : 55) + o) + r, e = (e - o) / Me;
  }
  return r;
}, Dd = function(e) {
  if (Rr[e] !== void 0)
    return Rr[e];
  let t = 0, n = 1, r = Me, o = 1;
  for (; n < e.length; t += r, n++, r *= Me)
    ;
  for (let a = e.length - 1; a >= 0; a--, o *= Me) {
    let i = e.charCodeAt(a) - 48;
    i > 10 && (i -= 7), t += i * o;
  }
  return t;
}, Dn = {
  toAlphaCode: $d,
  fromAlphaCode: Dd
}, Hd = function(e) {
  const t = new RegExp("([0-9A-Z]+):([0-9A-Z]+)");
  for (let n = 0; n < e.nodes.length; n++) {
    const r = t.exec(e.nodes[n]);
    if (!r) {
      e.symCount = n;
      break;
    }
    e.syms[Dn.fromAlphaCode(r[1])] = Dn.fromAlphaCode(r[2]);
  }
  e.nodes = e.nodes.slice(e.symCount, e.nodes.length);
}, Ed = function(e, t, n) {
  const r = Dn.fromAlphaCode(t);
  return r < e.symCount ? e.syms[r] : n + r + 1 - e.symCount;
}, Gd = function(e) {
  const t = [], n = (r, o) => {
    let a = e.nodes[r];
    a[0] === "!" && (t.push(o), a = a.slice(1));
    const i = a.split(/([A-Z0-9,]+)/g);
    for (let s = 0; s < i.length; s += 2) {
      const u = i[s], l = i[s + 1];
      if (!u)
        continue;
      const c = o + u;
      if (l === "," || l === void 0) {
        t.push(c);
        continue;
      }
      const h = Ed(e, l, r);
      n(h, c);
    }
  };
  return n(0, ""), t;
}, Od = function(e) {
  const t = {
    nodes: e.split(";"),
    syms: [],
    symCount: 0
  };
  return e.match(":") && Hd(t), Gd(t);
}, Fd = function(e) {
  if (!e)
    return {};
  const t = e.split("|").reduce((r, o) => {
    const a = o.split("¦");
    return r[a[0]] = a[1], r;
  }, {}), n = {};
  return Object.keys(t).forEach(function(r) {
    const o = Od(t[r]);
    r === "true" && (r = !0);
    for (let a = 0; a < o.length; a++) {
      const i = o[a];
      n.hasOwnProperty(i) === !0 ? Array.isArray(n[i]) === !1 ? n[i] = [n[i], r] : n[i].push(r) : n[i] = r;
    }
  }), n;
}, ie = ["Possessive", "Pronoun"], zd = {
  // numbers
  "20th century fox": "Organization",
  "7 eleven": "Organization",
  "motel 6": "Organization",
  g8: "Organization",
  vh1: "Organization",
  "76ers": "SportsTeam",
  "49ers": "SportsTeam",
  q1: "Date",
  q2: "Date",
  q3: "Date",
  q4: "Date",
  km2: "Unit",
  m2: "Unit",
  dm2: "Unit",
  cm2: "Unit",
  mm2: "Unit",
  mile2: "Unit",
  in2: "Unit",
  yd2: "Unit",
  ft2: "Unit",
  m3: "Unit",
  dm3: "Unit",
  cm3: "Unit",
  in3: "Unit",
  ft3: "Unit",
  yd3: "Unit",
  // ampersands
  "at&t": "Organization",
  "black & decker": "Organization",
  "h & m": "Organization",
  "johnson & johnson": "Organization",
  "procter & gamble": "Organization",
  "ben & jerry's": "Organization",
  "&": "Conjunction",
  //pronouns
  i: ["Pronoun", "Singular"],
  he: ["Pronoun", "Singular"],
  she: ["Pronoun", "Singular"],
  it: ["Pronoun", "Singular"],
  they: ["Pronoun", "Plural"],
  we: ["Pronoun", "Plural"],
  was: ["Copula", "PastTense"],
  is: ["Copula", "PresentTense"],
  are: ["Copula", "PresentTense"],
  am: ["Copula", "PresentTense"],
  were: ["Copula", "PastTense"],
  // possessive pronouns
  her: ie,
  his: ie,
  hers: ie,
  their: ie,
  theirs: ie,
  themselves: ie,
  your: ie,
  our: ie,
  ours: ie,
  my: ie,
  its: ie,
  // misc
  vs: ["Conjunction", "Abbreviation"],
  if: ["Condition", "Preposition"],
  closer: "Comparative",
  closest: "Superlative",
  much: "Adverb",
  may: "Modal",
  // irregular conjugations with two forms
  babysat: "PastTense",
  blew: "PastTense",
  drank: "PastTense",
  drove: "PastTense",
  forgave: "PastTense",
  skiied: "PastTense",
  spilt: "PastTense",
  stung: "PastTense",
  swam: "PastTense",
  swung: "PastTense",
  guaranteed: "PastTense",
  shrunk: "PastTense",
  // support 'near', 'nears', 'nearing'
  nears: "PresentTense",
  nearing: "Gerund",
  neared: "PastTense",
  no: ["Negative", "Expression"]
  // '-': 'Preposition', //june - july
  // there: 'There'
}, Vd = {
  "20th century fox": "Organization",
  "7 eleven": "Organization",
  "motel 6": "Organization",
  "excuse me": "Expression",
  "financial times": "Organization",
  "guns n roses": "Organization",
  "la z boy": "Organization",
  "labour party": "Organization",
  "new kids on the block": "Organization",
  "new york times": "Organization",
  "the guess who": "Organization",
  "thin lizzy": "Organization",
  "prime minister": "Actor",
  "free market": "Singular",
  "lay up": "Singular",
  "living room": "Singular",
  "living rooms": "Plural",
  "spin off": "Singular",
  "appeal court": "Uncountable",
  "cold war": "Uncountable",
  "gene pool": "Uncountable",
  "machine learning": "Uncountable",
  "nail polish": "Uncountable",
  "time off": "Uncountable",
  "take part": "Infinitive",
  "bill gates": "Person",
  "doctor who": "Person",
  "dr who": "Person",
  "he man": "Person",
  "iron man": "Person",
  "kid cudi": "Person",
  "run dmc": "Person",
  "rush limbaugh": "Person",
  "snow white": "Person",
  "tiger woods": "Person",
  "brand new": "Adjective",
  "en route": "Adjective",
  "left wing": "Adjective",
  "off guard": "Adjective",
  "on board": "Adjective",
  "part time": "Adjective",
  "right wing": "Adjective",
  "so called": "Adjective",
  "spot on": "Adjective",
  "straight forward": "Adjective",
  "super duper": "Adjective",
  "tip top": "Adjective",
  "top notch": "Adjective",
  "up to date": "Adjective",
  "win win": "Adjective",
  "brooklyn nets": "SportsTeam",
  "chicago bears": "SportsTeam",
  "houston astros": "SportsTeam",
  "houston dynamo": "SportsTeam",
  "houston rockets": "SportsTeam",
  "houston texans": "SportsTeam",
  "minnesota twins": "SportsTeam",
  "orlando magic": "SportsTeam",
  "san antonio spurs": "SportsTeam",
  "san diego chargers": "SportsTeam",
  "san diego padres": "SportsTeam",
  "iron maiden": "ProperNoun",
  "isle of man": "Country",
  "united states": "Country",
  "united states of america": "Country",
  "prince edward island": "Region",
  "cedar breaks": "Place",
  "cedar falls": "Place",
  "point blank": "Adverb",
  "tiny bit": "Adverb",
  "by the time": "Conjunction",
  "no matter": "Conjunction",
  "civil wars": "Plural",
  "credit cards": "Plural",
  "default rates": "Plural",
  "free markets": "Plural",
  "head starts": "Plural",
  "home runs": "Plural",
  "lay ups": "Plural",
  "phone calls": "Plural",
  "press releases": "Plural",
  "record labels": "Plural",
  "soft serves": "Plural",
  "student loans": "Plural",
  "tax returns": "Plural",
  "tv shows": "Plural",
  "video games": "Plural",
  "took part": "PastTense",
  "takes part": "PresentTense",
  "taking part": "Gerund",
  "taken part": "Participle",
  "light bulb": "Noun",
  "rush hour": "Noun",
  "fluid ounce": "Unit",
  "the rolling stones": "Organization"
}, Bd = [
  ":(",
  ":)",
  ":P",
  ":p",
  ":O",
  ";(",
  ";)",
  ";P",
  ";p",
  ";O",
  ":3",
  ":|",
  ":/",
  ":\\",
  ":$",
  ":*",
  ":@",
  ":-(",
  ":-)",
  ":-P",
  ":-p",
  ":-O",
  ":-3",
  ":-|",
  ":-/",
  ":-\\",
  ":-$",
  ":-*",
  ":-@",
  ":^(",
  ":^)",
  ":^P",
  ":^p",
  ":^O",
  ":^3",
  ":^|",
  ":^/",
  ":^\\",
  ":^$",
  ":^*",
  ":^@",
  "):",
  "(:",
  "$:",
  "*:",
  ")-:",
  "(-:",
  "$-:",
  "*-:",
  ")^:",
  "(^:",
  "$^:",
  "*^:",
  "<3",
  "</3",
  "<\\3",
  "=("
], Ct = {
  a: [
    [/(antenn|formul|nebul|vertebr|vit)a$/i, "$1ae"],
    [/ia$/i, "ia"]
  ],
  e: [
    [/(kn|l|w)ife$/i, "$1ives"],
    [/(hive)$/i, "$1s"],
    [/([m|l])ouse$/i, "$1ice"],
    [/([m|l])ice$/i, "$1ice"]
  ],
  f: [
    [/^(dwar|handkerchie|hoo|scar|whar)f$/i, "$1ves"],
    [/^((?:ca|e|ha|(?:our|them|your)?se|she|wo)l|lea|loa|shea|thie)f$/i, "$1ves"]
  ],
  i: [[/(octop|vir)i$/i, "$1i"]],
  m: [[/([ti])um$/i, "$1a"]],
  n: [[/^(oxen)$/i, "$1"]],
  o: [[/(al|ad|at|er|et|ed)o$/i, "$1oes"]],
  s: [
    [/(ax|test)is$/i, "$1es"],
    [/(alias|status)$/i, "$1es"],
    [/sis$/i, "ses"],
    [/(bu)s$/i, "$1ses"],
    [/(sis)$/i, "ses"],
    [/^(?!talis|.*hu)(.*)man$/i, "$1men"],
    [/(octop|vir|radi|nucle|fung|cact|stimul)us$/i, "$1i"]
  ],
  x: [
    [/(matr|vert|ind|cort)(ix|ex)$/i, "$1ices"],
    [/^(ox)$/i, "$1en"]
  ],
  y: [[/([^aeiouy]|qu)y$/i, "$1ies"]],
  z: [[/(quiz)$/i, "$1zes"]]
}, Sd = /([xsz]|ch|sh)$/, Md = function(e) {
  const t = e[e.length - 1];
  if (Ct.hasOwnProperty(t) === !0)
    for (let n = 0; n < Ct[t].length; n += 1) {
      const r = Ct[t][n][0];
      if (r.test(e) === !0)
        return e.replace(r, Ct[t][n][1]);
    }
  return null;
}, Zt = function(e = "", t) {
  const { irregularPlurals: n, uncountable: r } = t.two;
  if (r.hasOwnProperty(e))
    return e;
  if (n.hasOwnProperty(e))
    return n[e];
  const o = Md(e);
  return o !== null ? o : Sd.test(e) ? e + "es" : e + "s";
}, Ld = /\|/, ot = zd, Hn = {}, Kd = { two: { irregularPlurals: Fa, uncountable: {} } };
Object.keys(qr).forEach((e) => {
  const t = Fd(qr[e]);
  if (!Ld.test(e)) {
    Object.keys(t).forEach((n) => {
      ot[n] = e;
    });
    return;
  }
  Object.keys(t).forEach((n) => {
    if (Hn[n] = e, e === "Noun|Verb") {
      const r = Zt(n, Kd);
      Hn[r] = "Plural|Verb";
    }
  });
});
Bd.forEach((e) => ot[e] = "Emoticon");
delete ot[""];
delete ot[null];
delete ot[" "];
const d = "Singular", D = {
  beforeTags: {
    Determiner: d,
    //the date
    Possessive: d,
    //his date
    Acronym: d,
    //u.s. state
    // ProperNoun:n,
    Noun: d,
    //nasa funding
    Adjective: d,
    //whole bottles
    // Verb:true, //save storm victims
    PresentTense: d,
    //loves hiking
    Gerund: d,
    //uplifting victims
    PastTense: d,
    //saved storm victims
    Infinitive: d,
    //profess love
    Date: d,
    //9pm show
    Ordinal: d,
    //first date
    Demonym: d
    //dutch map
  },
  afterTags: {
    Value: d,
    //date nine  -?
    Modal: d,
    //date would
    Copula: d,
    //fear is
    PresentTense: d,
    //babysitting sucks
    PastTense: d,
    //babysitting sucked
    // Noun:n, //talking therapy, planning process
    Demonym: d,
    //american touch
    Actor: d
    //dance therapist
  },
  // ownTags: { ProperNoun: n },
  beforeWords: {
    the: d,
    //the brands
    with: d,
    //with cakes
    without: d,
    //
    // was:n, //was time  -- was working
    // is:n, //
    of: d,
    //of power
    for: d,
    //for rats
    any: d,
    //any rats
    all: d,
    //all tips
    on: d,
    //on time
    // thing-ish verbs
    cut: d,
    //cut spending
    cuts: d,
    //cut spending
    increase: d,
    // increase funding
    decrease: d,
    //
    raise: d,
    //
    drop: d,
    //
    // give: n,//give parents
    save: d,
    //
    saved: d,
    //
    saves: d,
    //
    make: d,
    //
    makes: d,
    //
    made: d,
    //
    minus: d,
    //minus laughing
    plus: d,
    //
    than: d,
    //more than age
    another: d,
    //
    versus: d,
    //
    neither: d,
    //
    about: d,
    //about claims
    // strong adjectives
    favorite: d,
    //
    best: d,
    //
    daily: d,
    //
    weekly: d,
    //
    linear: d,
    //
    binary: d,
    //
    mobile: d,
    //
    lexical: d,
    //
    technical: d,
    //
    computer: d,
    //
    scientific: d,
    //
    security: d,
    //
    government: d,
    //
    popular: d,
    //
    formal: d,
    no: d,
    //no worries
    more: d,
    //more details
    one: d,
    //one flood
    let: d,
    //let fear
    her: d,
    //her boots
    his: d,
    //
    their: d,
    //
    our: d,
    //
    us: d,
    //served us drinks
    sheer: d,
    monthly: d,
    yearly: d,
    current: d,
    previous: d,
    upcoming: d,
    last: d,
    next: d,
    main: d,
    initial: d,
    final: d,
    beginning: d,
    end: d,
    top: d,
    bottom: d,
    future: d,
    past: d,
    major: d,
    minor: d,
    side: d,
    central: d,
    peripheral: d,
    public: d,
    private: d
  },
  afterWords: {
    of: d,
    //date of birth (preposition)
    system: d,
    aid: d,
    method: d,
    utility: d,
    tool: d,
    reform: d,
    therapy: d,
    philosophy: d,
    room: d,
    authority: d,
    says: d,
    said: d,
    wants: d,
    wanted: d,
    is: d,
    did: d,
    do: d,
    can: d,
    //parents can
    wise: d
    //service-wise
    // they: n,//snakes they
  }
}, p = "Infinitive", J = {
  beforeTags: {
    Modal: p,
    //would date
    Adverb: p,
    //quickly date
    Negative: p,
    //not date
    Plural: p
    //characters drink
    // ProperNoun: vb,//google thought
  },
  afterTags: {
    Determiner: p,
    //flash the
    Adverb: p,
    //date quickly
    Possessive: p,
    //date his
    Reflexive: p,
    //resolve yourself
    // Noun:true, //date spencer
    Preposition: p,
    //date around, dump onto, grumble about
    // Conjunction: v, // dip to, dip through
    Cardinal: p,
    //cut 3 squares
    Comparative: p,
    //feel greater
    Superlative: p
    //feel greatest
  },
  beforeWords: {
    i: p,
    //i date
    we: p,
    //we date
    you: p,
    //you date
    they: p,
    //they date
    to: p,
    //to date
    please: p,
    //please check
    will: p,
    //will check
    have: p,
    had: p,
    would: p,
    could: p,
    should: p,
    do: p,
    did: p,
    does: p,
    can: p,
    must: p,
    us: p,
    me: p,
    let: p,
    even: p,
    when: p,
    help: p,
    //help combat
    // them: v,
    he: p,
    she: p,
    it: p,
    being: p,
    // prefixes
    bi: p,
    co: p,
    contra: p,
    de: p,
    inter: p,
    intra: p,
    mis: p,
    pre: p,
    out: p,
    counter: p,
    nobody: p,
    somebody: p,
    anybody: p,
    everybody: p
    // un: v,
    // over: v,
    // under: v,
  },
  afterWords: {
    the: p,
    //echo the
    me: p,
    //date me
    you: p,
    //date you
    him: p,
    //loves him
    us: p,
    //cost us
    her: p,
    //
    his: p,
    //
    them: p,
    //
    they: p,
    //
    it: p,
    //hope it
    himself: p,
    herself: p,
    itself: p,
    myself: p,
    ourselves: p,
    themselves: p,
    something: p,
    anything: p,
    a: p,
    //covers a
    an: p,
    //covers an
    // from: v, //ranges from
    up: p,
    //serves up
    down: p,
    //serves up
    by: p,
    // in: v, //bob in
    out: p,
    // on: v,
    off: p,
    under: p,
    what: p,
    //look what
    // when: v,//starts when
    // for:true, //settled for
    all: p,
    //shiver all night
    // conjunctions
    to: p,
    //dip to
    because: p,
    //
    although: p,
    //
    // after: v,
    // before: v,//
    how: p,
    //
    otherwise: p,
    //
    together: p,
    //fit together
    though: p,
    //
    into: p,
    //
    yet: p,
    //
    more: p,
    //kill more
    here: p,
    // look here
    there: p,
    //
    away: p
    //float away
  }
}, Wd = {
  beforeTags: Object.assign({}, J.beforeTags, D.beforeTags, {}),
  afterTags: Object.assign({}, J.afterTags, D.afterTags, {}),
  beforeWords: Object.assign({}, J.beforeWords, D.beforeWords, {}),
  afterWords: Object.assign({}, J.afterWords, D.afterWords, {})
}, g = "Adjective", O = {
  beforeTags: {
    Determiner: g,
    //the detailed
    // Copula: jj, //is detailed
    Possessive: g,
    //spencer's detailed
    Hyphenated: g
    //rapidly-changing
  },
  afterTags: {
    // Noun: jj, //detailed plan, overwhelming evidence
    Adjective: g
    //intoxicated little
  },
  beforeWords: {
    seem: g,
    //seem prepared
    seemed: g,
    seems: g,
    feel: g,
    //feel prepared
    feels: g,
    felt: g,
    stay: g,
    appear: g,
    appears: g,
    appeared: g,
    also: g,
    over: g,
    //over cooked
    under: g,
    too: g,
    //too insulting
    it: g,
    //find it insulting
    but: g,
    //nothing but frustrating
    still: g,
    //still scared
    // adverbs that are adjective-ish
    really: g,
    //really damaged
    quite: g,
    well: g,
    very: g,
    truly: g,
    how: g,
    //how slow
    deeply: g,
    hella: g,
    // always: jj,
    // never: jj,
    profoundly: g,
    extremely: g,
    so: g,
    badly: g,
    mostly: g,
    totally: g,
    awfully: g,
    rather: g,
    nothing: g,
    //nothing secret,
    something: g,
    //something wrong
    anything: g,
    not: g,
    //not swell
    me: g,
    //called me swell
    is: g,
    face: g,
    //faces shocking revelations
    faces: g,
    faced: g,
    look: g,
    looks: g,
    looked: g,
    reveal: g,
    reveals: g,
    revealed: g,
    sound: g,
    sounded: g,
    sounds: g,
    remains: g,
    remained: g,
    prove: g,
    //would prove shocking
    proves: g,
    proved: g,
    becomes: g,
    stays: g,
    tastes: g,
    taste: g,
    smells: g,
    smell: g,
    gets: g,
    //gets shocking snowfall
    grows: g,
    as: g,
    rings: g,
    radiates: g,
    conveys: g,
    convey: g,
    conveyed: g,
    of: g
    // 'smacks of': jj,
    // 'reeks of': jj,
  },
  afterWords: {
    too: g,
    //insulting too
    also: g,
    //insulting too
    or: g,
    //insulting or
    enough: g,
    //cool enough
    as: g
    //as shocking as
    //about: jj, //cool about
  }
}, m = "Gerund", He = {
  beforeTags: {
    // Verb: g, // loves shocking
    Adverb: m,
    //quickly shocking
    Preposition: m,
    //by insulting
    Conjunction: m
    //to insulting
  },
  afterTags: {
    Adverb: m,
    //shocking quickly
    Possessive: m,
    //shocking spencer's
    Person: m,
    //telling spencer
    Pronoun: m,
    //shocking him
    Determiner: m,
    //shocking the
    Copula: m,
    //shocking is
    Preposition: m,
    //dashing by, swimming in
    Conjunction: m,
    //insulting to
    Comparative: m
    //growing shorter
  },
  beforeWords: {
    been: m,
    keep: m,
    //keep going
    continue: m,
    //
    stop: m,
    //
    am: m,
    //am watching
    be: m,
    //be timing
    me: m,
    //got me thinking
    // action-words
    began: m,
    start: m,
    starts: m,
    started: m,
    stops: m,
    stopped: m,
    help: m,
    helps: m,
    avoid: m,
    avoids: m,
    love: m,
    //love painting
    loves: m,
    loved: m,
    hate: m,
    hates: m,
    hated: m
    // was:g,//was working
    // is:g,
    // be:g,
  },
  afterWords: {
    you: m,
    //telling you
    me: m,
    //
    her: m,
    //
    him: m,
    //
    his: m,
    //
    them: m,
    //
    their: m,
    // fighting their
    it: m,
    //dumping it
    this: m,
    //running this
    there: m,
    // swimming there
    on: m,
    // landing on
    about: m,
    // talking about
    for: m,
    // paying for
    up: m,
    //speeding up
    down: m
    //
  }
}, k = "Gerund", je = "Adjective", Jd = {
  beforeTags: Object.assign({}, O.beforeTags, He.beforeTags, {
    // Copula: jj,
    Imperative: k,
    //recommend living in
    Infinitive: je,
    //say charming things
    // PresentTense: g,
    Plural: k
    //kids cutting
  }),
  afterTags: Object.assign({}, O.afterTags, He.afterTags, {
    Noun: je
    //shocking ignorance
    // Plural: jj, //shocking lies
  }),
  beforeWords: Object.assign({}, O.beforeWords, He.beforeWords, {
    is: je,
    are: k,
    //is overflowing: JJ, are overflowing : VB ??
    was: je,
    of: je,
    //of varying
    suggest: k,
    suggests: k,
    suggested: k,
    recommend: k,
    recommends: k,
    recommended: k,
    imagine: k,
    imagines: k,
    imagined: k,
    consider: k,
    considered: k,
    considering: k,
    resist: k,
    resists: k,
    resisted: k,
    avoid: k,
    avoided: k,
    avoiding: k,
    except: je,
    accept: je,
    assess: k,
    explore: k,
    fear: k,
    fears: k,
    appreciate: k,
    question: k,
    help: k,
    embrace: k,
    with: je
    //filled with daring
  }),
  afterWords: Object.assign({}, O.afterWords, He.afterWords, {
    to: k,
    not: k,
    //trying not to car
    the: k
    //sweeping the country
  })
}, Qr = {
  beforeTags: {
    Determiner: void 0,
    //the premier university
    Cardinal: "Noun",
    //1950 convertable
    PhrasalVerb: "Adjective"
    //starts out fine
  },
  afterTags: {
    // Pronoun: 'Noun'//as an adult i
  }
}, Ud = {
  beforeTags: Object.assign({}, O.beforeTags, D.beforeTags, Qr.beforeTags),
  afterTags: Object.assign({}, O.afterTags, D.afterTags, Qr.afterTags),
  beforeWords: Object.assign({}, O.beforeWords, D.beforeWords, {
    // are representative
    are: "Adjective",
    is: "Adjective",
    was: "Adjective",
    be: "Adjective",
    // phrasals
    off: "Adjective",
    //start off fine
    out: "Adjective"
    //comes out fine
  }),
  afterWords: Object.assign({}, O.afterWords, D.afterWords)
}, y = "PastTense", ut = "Adjective", Nt = {
  beforeTags: {
    Adverb: y,
    //quickly detailed
    Pronoun: y,
    //he detailed
    ProperNoun: y,
    //toronto closed
    Auxiliary: y,
    Noun: y
    //eye closed  -- i guess.
  },
  afterTags: {
    Possessive: y,
    //hooked him
    Pronoun: y,
    //hooked me
    Determiner: y,
    //hooked the
    Adverb: y,
    //cooked perfectly
    Comparative: y,
    //closed higher
    Date: y,
    // alleged thursday
    Gerund: y
    //left dancing
  },
  beforeWords: {
    be: y,
    //be hooked vs be embarrassed
    who: y,
    //who lost
    get: ut,
    //get charged
    had: y,
    has: y,
    have: y,
    been: y,
    it: y,
    //it intoxicated him
    as: y,
    //as requested
    for: ut,
    //for discounted items
    more: ut,
    //more broken promises
    always: ut
  },
  afterWords: {
    by: y,
    //damaged by
    back: y,
    //charged back
    out: y,
    //charged out
    in: y,
    //crowded in
    up: y,
    //heated up
    down: y,
    //hammered down
    before: y,
    //
    after: y,
    //
    for: y,
    //settled for
    the: y,
    //settled the
    with: y,
    //obsessed with
    as: y,
    //known as
    on: y,
    //focused on
    at: y,
    //recorded at
    between: y,
    //settled between
    to: y,
    //dedicated to
    into: y,
    //pumped into
    us: y,
    //charged us
    them: y,
    //charged us
    his: y,
    //shared his
    her: y,
    //
    their: y,
    //
    our: y,
    //
    me: y,
    //
    about: ut
  }
}, qd = {
  beforeTags: Object.assign({}, O.beforeTags, Nt.beforeTags),
  afterTags: Object.assign({}, O.afterTags, Nt.afterTags),
  beforeWords: Object.assign({}, O.beforeWords, Nt.beforeWords),
  afterWords: Object.assign({}, O.afterWords, Nt.afterWords)
}, Rd = {
  afterTags: {
    Noun: "Adjective",
    //ruling party
    Conjunction: void 0
    //clean and excellent
  }
}, Qd = {
  beforeTags: Object.assign({}, O.beforeTags, J.beforeTags, {
    // always clean
    Adverb: void 0,
    Negative: void 0
  }),
  afterTags: Object.assign({}, O.afterTags, J.afterTags, Rd.afterTags),
  beforeWords: Object.assign({}, O.beforeWords, J.beforeWords, {
    // have seperate contracts
    have: void 0,
    had: void 0,
    not: void 0,
    //went wrong, got wrong
    went: "Adjective",
    goes: "Adjective",
    got: "Adjective",
    // be sure
    be: "Adjective"
  }),
  afterWords: Object.assign({}, O.afterWords, J.afterWords, {
    to: void 0,
    //slick to the touch
    as: "Adjective"
    //pale as
  })
}, xt = {
  beforeTags: {
    Copula: "Gerund",
    PastTense: "Gerund",
    PresentTense: "Gerund",
    Infinitive: "Gerund"
  },
  afterTags: {
    Value: "Gerund"
    //maintaining 500
  },
  beforeWords: {
    are: "Gerund",
    were: "Gerund",
    be: "Gerund",
    no: "Gerund",
    without: "Gerund",
    //are you playing
    you: "Gerund",
    we: "Gerund",
    they: "Gerund",
    he: "Gerund",
    she: "Gerund",
    //stop us playing
    us: "Gerund",
    them: "Gerund"
  },
  afterWords: {
    // offering the
    the: "Gerund",
    this: "Gerund",
    that: "Gerund",
    //got me thinking
    me: "Gerund",
    us: "Gerund",
    them: "Gerund"
  }
}, _d = {
  beforeTags: Object.assign({}, He.beforeTags, D.beforeTags, xt.beforeTags),
  afterTags: Object.assign({}, He.afterTags, D.afterTags, xt.afterTags),
  beforeWords: Object.assign({}, He.beforeWords, D.beforeWords, xt.beforeWords),
  afterWords: Object.assign({}, He.afterWords, D.afterWords, xt.afterWords)
}, qe = "Singular", Oe = "Infinitive", Zd = {
  beforeTags: Object.assign({}, J.beforeTags, D.beforeTags, {
    // Noun: undefined
    Adjective: qe,
    //great name
    Particle: qe
    //brought under control
  }),
  afterTags: Object.assign({}, J.afterTags, D.afterTags, {
    ProperNoun: Oe,
    Gerund: Oe,
    Adjective: Oe,
    Copula: qe
  }),
  beforeWords: Object.assign({}, J.beforeWords, D.beforeWords, {
    // is time
    is: qe,
    was: qe,
    //balance of power
    of: qe,
    have: null
    //have cash
  }),
  afterWords: Object.assign({}, J.afterWords, D.afterWords, {
    // for: vb,//work for
    instead: Oe,
    // that: nn,//subject that was
    // for: vb,//work for
    about: Oe,
    //talk about
    his: Oe,
    //shot his
    her: Oe,
    //
    to: null,
    by: null,
    in: null
  })
}, C = "Person", F = {
  beforeTags: {
    Honorific: C,
    Person: C
    // Preposition: p, //with sue
  },
  afterTags: {
    Person: C,
    ProperNoun: C,
    Verb: C
    //bob could
    // Modal:true, //bob could
    // Copula:true, //bob is
    // PresentTense:true, //bob seems
  },
  beforeWords: {
    hi: C,
    hey: C,
    yo: C,
    dear: C,
    hello: C
  },
  afterWords: {
    // person-usually verbs
    said: C,
    says: C,
    told: C,
    tells: C,
    feels: C,
    felt: C,
    seems: C,
    thinks: C,
    thought: C,
    spends: C,
    spendt: C,
    plays: C,
    played: C,
    sing: C,
    sang: C,
    learn: C,
    learned: C,
    wants: C,
    wanted: C
    // and:true, //sue and jeff
  }
}, I = "Month", Xd = "Person", jt = {
  beforeTags: {
    Date: I,
    Value: I
  },
  afterTags: {
    Date: I,
    Value: I
  },
  beforeWords: {
    by: I,
    in: I,
    on: I,
    during: I,
    after: I,
    before: I,
    between: I,
    until: I,
    til: I,
    sometime: I,
    of: I,
    //5th of april
    this: I,
    //this april
    next: I,
    last: I,
    previous: I,
    following: I,
    with: Xd
    // for: p,
  },
  afterWords: {
    sometime: I,
    in: I,
    of: I,
    until: I,
    the: I
    //june the 4th
  }
}, Yd = {
  beforeTags: Object.assign({}, F.beforeTags, jt.beforeTags),
  afterTags: Object.assign({}, F.afterTags, jt.afterTags),
  beforeWords: Object.assign({}, F.beforeWords, jt.beforeWords),
  afterWords: Object.assign({}, F.afterWords, jt.afterWords)
}, ef = {
  beforeTags: Object.assign({}, D.beforeTags, F.beforeTags),
  afterTags: Object.assign({}, D.afterTags, F.afterTags),
  beforeWords: Object.assign({}, D.beforeWords, F.beforeWords, { i: "Infinitive", we: "Infinitive" }),
  afterWords: Object.assign({}, D.afterWords, F.afterWords)
}, tf = {
  beforeTags: Object.assign({}, D.beforeTags, F.beforeTags, J.beforeTags),
  afterTags: Object.assign({}, D.afterTags, F.afterTags, J.afterTags),
  beforeWords: Object.assign({}, D.beforeWords, F.beforeWords, J.beforeWords),
  afterWords: Object.assign({}, D.afterWords, F.afterWords, J.afterWords)
}, M = "Place", Tt = {
  beforeTags: {
    Place: M
  },
  afterTags: {
    Place: M,
    Abbreviation: M
  },
  beforeWords: {
    in: M,
    by: M,
    near: M,
    from: M,
    to: M
  },
  afterWords: {
    in: M,
    by: M,
    near: M,
    from: M,
    to: M,
    government: M,
    council: M,
    region: M,
    city: M
  }
}, nf = {
  beforeTags: Object.assign({}, Tt.beforeTags, F.beforeTags),
  afterTags: Object.assign({}, Tt.afterTags, F.afterTags),
  beforeWords: Object.assign({}, Tt.beforeWords, F.beforeWords),
  afterWords: Object.assign({}, Tt.afterWords, F.afterWords)
}, rf = {
  beforeTags: Object.assign({}, F.beforeTags, O.beforeTags),
  afterTags: Object.assign({}, F.afterTags, O.afterTags),
  beforeWords: Object.assign({}, F.beforeWords, O.beforeWords),
  afterWords: Object.assign({}, F.afterWords, O.afterWords)
}, ne = "Unit", of = {
  beforeTags: { Value: ne },
  afterTags: {},
  beforeWords: {
    per: ne,
    every: ne,
    each: ne,
    square: ne,
    //square km
    cubic: ne,
    sq: ne,
    metric: ne
    //metric ton
  },
  afterWords: {
    per: ne,
    squared: ne,
    cubed: ne,
    long: ne
    //foot long
  }
}, tt = {
  "Actor|Verb": Wd,
  "Adj|Gerund": Jd,
  "Adj|Noun": Ud,
  "Adj|Past": qd,
  "Adj|Present": Qd,
  "Noun|Verb": Zd,
  "Noun|Gerund": _d,
  "Person|Noun": ef,
  "Person|Date": Yd,
  "Person|Verb": tf,
  "Person|Place": nf,
  "Person|Adj": rf,
  "Unit|Noun": of
}, It = (e, t) => {
  const n = Object.keys(e).reduce((r, o) => (r[o] = e[o] === "Infinitive" ? "PresentTense" : "Plural", r), {});
  return Object.assign(n, t);
};
tt["Plural|Verb"] = {
  beforeWords: It(tt["Noun|Verb"].beforeWords, {
    had: "Plural",
    //had tears
    have: "Plural"
  }),
  afterWords: It(tt["Noun|Verb"].afterWords, {
    his: "PresentTense",
    her: "PresentTense",
    its: "PresentTense",
    in: null,
    to: null,
    is: "PresentTense",
    //the way it works is
    by: "PresentTense"
    //it works by
  }),
  beforeTags: It(tt["Noun|Verb"].beforeTags, {
    Conjunction: "PresentTense",
    //and changes
    Noun: void 0,
    //the century demands
    ProperNoun: "PresentTense"
    //john plays
  }),
  afterTags: It(tt["Noun|Verb"].afterTags, {
    Gerund: "Plural",
    //ice caps disappearing
    Noun: "PresentTense",
    //changes gears
    Value: "PresentTense"
    //changes seven gears
  })
};
const A = "Adjective", z = "Infinitive", Fe = "PresentTense", v = "Singular", V = "PastTense", Re = "Adverb", _ = "Plural", H = "Actor", $t = "Verb", K = "Noun", af = "ProperNoun", se = "LastName", _r = "Modal", N = "Place", un = "Participle", sf = [
  null,
  null,
  {
    //2-letter
    ea: v,
    ia: K,
    ic: A,
    ly: Re,
    "'n": $t,
    "'t": $t
  },
  {
    //3-letter
    oed: V,
    ued: V,
    xed: V,
    " so": Re,
    "'ll": _r,
    "'re": "Copula",
    azy: A,
    eer: K,
    end: $t,
    ped: V,
    ffy: A,
    ify: z,
    ing: "Gerund",
    ize: z,
    ibe: z,
    lar: A,
    mum: A,
    nes: Fe,
    nny: A,
    // oid: Adj,
    ous: A,
    que: A,
    ger: K,
    ber: K,
    rol: v,
    sis: v,
    ogy: v,
    oid: v,
    ian: v,
    zes: Fe,
    eld: V,
    ken: un,
    //awoken
    ven: un,
    //woven
    ten: un,
    //brighten
    ect: z,
    ict: z,
    // ide: Inf,
    ign: z,
    oze: z,
    ful: A,
    bal: A,
    ton: K,
    pur: N
  },
  {
    //4-letter
    amed: V,
    aped: V,
    ched: V,
    lked: V,
    rked: V,
    reed: V,
    nded: V,
    mned: A,
    cted: V,
    dged: V,
    ield: v,
    akis: se,
    cede: z,
    chuk: se,
    czyk: se,
    ects: Fe,
    iend: v,
    ends: $t,
    enko: se,
    ette: v,
    iary: v,
    wner: v,
    //owner
    fies: Fe,
    fore: Re,
    gate: z,
    gone: A,
    ices: _,
    ints: _,
    ruct: z,
    ines: _,
    ions: _,
    ners: _,
    pers: _,
    lers: _,
    less: A,
    llen: A,
    made: A,
    nsen: se,
    oses: Fe,
    ould: _r,
    some: A,
    sson: se,
    ians: _,
    // tage: Inf,
    tion: v,
    tage: K,
    ique: v,
    tive: A,
    tors: K,
    vice: v,
    lier: v,
    fier: v,
    wned: V,
    gent: v,
    tist: H,
    pist: H,
    rist: H,
    mist: H,
    yist: H,
    vist: H,
    ists: H,
    lite: v,
    site: v,
    rite: v,
    mite: v,
    bite: v,
    mate: v,
    date: v,
    ndal: v,
    vent: v,
    uist: H,
    gist: H,
    note: v,
    cide: v,
    //homicide
    ence: v,
    //absence
    wide: A,
    //nationwide
    // side: Adj,//alongside
    vide: z,
    //provide
    ract: z,
    duce: z,
    pose: z,
    eive: z,
    lyze: z,
    lyse: z,
    iant: A,
    nary: A,
    ghty: A,
    uent: A,
    erer: H,
    //caterer
    bury: N,
    dorf: K,
    esty: K,
    wych: N,
    dale: N,
    folk: N,
    vale: N,
    abad: N,
    sham: N,
    wick: N,
    view: N
  },
  {
    //5-letter
    elist: H,
    holic: v,
    phite: v,
    tized: V,
    urned: V,
    eased: V,
    ances: _,
    bound: A,
    ettes: _,
    fully: Re,
    ishes: Fe,
    ities: _,
    marek: se,
    nssen: se,
    ology: K,
    osome: v,
    tment: v,
    ports: _,
    rough: A,
    tches: Fe,
    tieth: "Ordinal",
    tures: _,
    wards: Re,
    where: Re,
    archy: K,
    pathy: K,
    opoly: K,
    embly: K,
    phate: K,
    ndent: v,
    scent: v,
    onist: H,
    anist: H,
    alist: H,
    olist: H,
    icist: H,
    ounce: z,
    iable: A,
    borne: A,
    gnant: A,
    inant: A,
    igent: A,
    atory: A,
    // ctory: Adj,
    rient: v,
    dient: v,
    maker: H,
    burgh: N,
    mouth: N,
    ceter: N,
    ville: N,
    hurst: N,
    stead: N,
    endon: N,
    brook: N,
    shire: N,
    worth: K,
    field: af,
    ridge: N
  },
  {
    //6-letter
    auskas: se,
    parent: v,
    cedent: v,
    ionary: v,
    cklist: v,
    brooke: N,
    keeper: H,
    logist: H,
    teenth: "Value",
    worker: H,
    master: H,
    writer: H,
    brough: N,
    cester: N,
    ington: N,
    cliffe: N,
    ingham: N
  },
  {
    //7-letter
    chester: N,
    logists: H,
    opoulos: se,
    borough: N,
    sdottir: se
    //swedish female
  }
], Z = "Adjective", x = "Noun", ct = "Verb", uf = [
  null,
  null,
  {
    // 2-letter
  },
  {
    // 3-letter
    neo: x,
    bio: x,
    // pre: Noun,
    "de-": ct,
    "re-": ct,
    "un-": ct,
    "ex-": x
  },
  {
    // 4-letter
    anti: x,
    auto: x,
    faux: Z,
    hexa: x,
    kilo: x,
    mono: x,
    nano: x,
    octa: x,
    poly: x,
    semi: Z,
    tele: x,
    "pro-": Z,
    "mis-": ct,
    "dis-": ct,
    "pre-": Z
    //hmm
  },
  {
    // 5-letter
    anglo: x,
    centi: x,
    ethno: x,
    ferro: x,
    grand: x,
    hepta: x,
    hydro: x,
    intro: x,
    macro: x,
    micro: x,
    milli: x,
    nitro: x,
    penta: x,
    quasi: Z,
    radio: x,
    tetra: x,
    "omni-": Z,
    "post-": Z
  },
  {
    // 6-letter
    pseudo: Z,
    "extra-": Z,
    "hyper-": Z,
    "inter-": Z,
    "intra-": Z,
    "deca-": Z
    // 'trans-': Noun,
  },
  {
    // 7-letter
    electro: x
  }
], $ = "Adjective", Dt = "Infinitive", Ht = "PresentTense", ye = "Singular", U = "PastTense", Zr = "Adverb", be = "Expression", Xr = "Actor", Yr = "Verb", eo = "Noun", Et = "LastName", cf = {
  a: [
    [/.[aeiou]na$/, eo, "tuna"],
    [/.[oau][wvl]ska$/, Et],
    [/.[^aeiou]ica$/, ye, "harmonica"],
    [/^([hyj]a+)+$/, be, "haha"]
    //hahah
  ],
  c: [[/.[^aeiou]ic$/, $]],
  d: [
    //==-ed==
    //double-consonant
    [/[aeiou](pp|ll|ss|ff|gg|tt|rr|bb|nn|mm)ed$/, U, "popped"],
    //double-vowel
    [/.[aeo]{2}[bdgmnprvz]ed$/, U, "rammed"],
    //-hed
    [/.[aeiou][sg]hed$/, U, "gushed"],
    //-rd
    [/.[aeiou]red$/, U, "hired"],
    [/.[aeiou]r?ried$/, U, "hurried"],
    // ard
    [/[^aeiou]ard$/, ye, "steward"],
    // id
    [/[aeiou][^aeiou]id$/, $, ""],
    [/.[vrl]id$/, $, "livid"],
    // ===== -ed ======
    //-led
    [/..led$/, U, "hurled"],
    //-sed
    [/.[iao]sed$/, U, ""],
    [/[aeiou]n?[cs]ed$/, U, ""],
    //-med
    [/[aeiou][rl]?[mnf]ed$/, U, ""],
    //-ked
    [/[aeiou][ns]?c?ked$/, U, "bunked"],
    //-gned
    [/[aeiou]gned$/, U],
    //-ged
    [/[aeiou][nl]?ged$/, U],
    //-ted
    [/.[tdbwxyz]ed$/, U],
    [/[^aeiou][aeiou][tvx]ed$/, U],
    //-ied
    [/.[cdflmnprstv]ied$/, U, "emptied"]
  ],
  e: [
    [/.[lnr]ize$/, Dt, "antagonize"],
    [/.[^aeiou]ise$/, Dt, "antagonise"],
    [/.[aeiou]te$/, Dt, "bite"],
    [/.[^aeiou][ai]ble$/, $, "fixable"],
    [/.[^aeiou]eable$/, $, "maleable"],
    [/.[ts]ive$/, $, "festive"],
    [/[a-z]-like$/, $, "woman-like"]
  ],
  h: [
    [/.[^aeiouf]ish$/, $, "cornish"],
    [/.v[iy]ch$/, Et, "..ovich"],
    [/^ug?h+$/, be, "ughh"],
    [/^uh[ -]?oh$/, be, "uhoh"],
    [/[a-z]-ish$/, $, "cartoon-ish"]
  ],
  i: [[/.[oau][wvl]ski$/, Et, "polish-male"]],
  k: [
    [/^(k){2}$/, be, "kkkk"]
    //kkkk
  ],
  l: [
    [/.[gl]ial$/, $, "familial"],
    [/.[^aeiou]ful$/, $, "fitful"],
    [/.[nrtumcd]al$/, $, "natal"],
    [/.[^aeiou][ei]al$/, $, "familial"]
  ],
  m: [
    [/.[^aeiou]ium$/, ye, "magnesium"],
    [/[^aeiou]ism$/, ye, "schism"],
    [/^[hu]m+$/, be, "hmm"],
    [/^\d+ ?[ap]m$/, "Date", "3am"]
  ],
  n: [
    [/.[lsrnpb]ian$/, $, "republican"],
    [/[^aeiou]ician$/, Xr, "musician"],
    [/[aeiou][ktrp]in'$/, "Gerund", "cookin'"]
    // 'cookin', 'hootin'
  ],
  o: [
    [/^no+$/, be, "noooo"],
    [/^(yo)+$/, be, "yoo"],
    [/^wo{2,}[pt]?$/, be, "woop"]
    //woo
  ],
  r: [
    [/.[bdfklmst]ler$/, "Noun"],
    [/[aeiou][pns]er$/, ye],
    [/[^i]fer$/, Dt],
    [/.[^aeiou][ao]pher$/, Xr],
    [/.[lk]er$/, "Noun"],
    [/.ier$/, "Comparative"]
  ],
  t: [
    [/.[di]est$/, "Superlative"],
    [/.[icldtgrv]ent$/, $],
    [/[aeiou].*ist$/, $],
    [/^[a-z]et$/, Yr]
  ],
  s: [
    [/.[^aeiou]ises$/, Ht],
    [/.[rln]ates$/, Ht],
    [/.[^z]ens$/, Yr],
    [/.[lstrn]us$/, ye],
    [/.[aeiou]sks$/, Ht],
    [/.[aeiou]kes$/, Ht],
    [/[aeiou][^aeiou]is$/, ye],
    [/[a-z]'s$/, eo],
    [/^yes+$/, be]
    //yessss
  ],
  v: [
    [/.[^aeiou][ai][kln]ov$/, Et]
    //east-europe
  ],
  y: [
    [/.[cts]hy$/, $],
    [/.[st]ty$/, $],
    [/.[tnl]ary$/, $],
    [/.[oe]ry$/, ye],
    [/[rdntkbhs]ly$/, Zr],
    [/.(gg|bb|zz)ly$/, $],
    [/...lly$/, Zr],
    [/.[gk]y$/, $],
    [/[bszmp]{2}y$/, $],
    [/.[ai]my$/, $],
    [/[ea]{2}zy$/, $],
    [/.[^aeiou]ity$/, ye]
  ]
}, W = "Verb", j = "Noun", lf = {
  // looking at the previous word's tags:
  leftTags: [
    ["Adjective", j],
    ["Possessive", j],
    ["Determiner", j],
    ["Adverb", W],
    ["Pronoun", W],
    ["Value", j],
    ["Ordinal", j],
    ["Modal", W],
    ["Superlative", j],
    ["Demonym", j],
    ["Honorific", "Person"]
    //dr. Smith
  ],
  // looking at the previous word:
  leftWords: [
    ["i", W],
    ["first", j],
    ["it", W],
    ["there", W],
    ["not", W],
    ["because", j],
    ["if", j],
    ["but", j],
    ["who", W],
    ["this", j],
    ["his", j],
    ["when", j],
    ["you", W],
    ["very", "Adjective"],
    ["old", j],
    ["never", W],
    ["before", j],
    ["a", j],
    ["the", j],
    ["been", W]
  ],
  // looking at the next word's tags:
  rightTags: [
    ["Copula", j],
    ["PastTense", j],
    ["Conjunction", j],
    ["Modal", j]
  ],
  // looking at the next word:
  rightWords: [
    ["there", W],
    ["me", W],
    ["man", "Adjective"],
    // ['only', vb],
    ["him", W],
    ["it", W],
    //relaunch it
    ["were", j],
    ["took", j],
    ["himself", W],
    ["went", j],
    ["who", j],
    ["jr", "Person"]
  ]
}, We = {
  Comparative: {
    fwd: "3:ser,ier¦1er:h,t,f,l,n¦1r:e¦2er:ss,or,om",
    both: "3er:ver,ear,alm¦3ner:hin¦3ter:lat¦2mer:im¦2er:ng,rm,mb¦2ber:ib¦2ger:ig¦1er:w,p,k,d¦ier:y",
    rev: "1:tter,yer¦2:uer,ver,ffer,oner,eler,ller,iler,ster,cer,uler,sher,ener,gher,aner,adder,nter,eter,rter,hter,rner,fter¦3:oser,ooler,eafer,user,airer,bler,maler,tler,eater,uger,rger,ainer,urer,ealer,icher,pler,emner,icter,nser,iser¦4:arser,viner,ucher,rosser,somer,ndomer,moter,oother,uarer,hiter¦5:nuiner,esser,emier¦ar:urther",
    ex: "worse:bad¦better:good¦4er:fair,gray,poor¦1urther:far¦3ter:fat,hot,wet¦3der:mad,sad¦3er:shy,fun¦4der:glad¦:¦4r:cute,dire,fake,fine,free,lame,late,pale,rare,ripe,rude,safe,sore,tame,wide¦5r:eerie,stale"
  },
  Gerund: {
    fwd: "1:nning,tting,rring,pping,eing,mming,gging,dding,bbing,kking¦2:eking,oling,eling,eming¦3:velling,siting,uiting,fiting,loting,geting,ialing,celling¦4:graming",
    both: "1:aing,iing,fing,xing,ying,oing,hing,wing¦2:tzing,rping,izzing,bting,mning,sping,wling,rling,wding,rbing,uping,lming,wning,mping,oning,lting,mbing,lking,fting,hting,sking,gning,pting,cking,ening,nking,iling,eping,ering,rting,rming,cting,lping,ssing,nting,nding,lding,sting,rning,rding,rking¦3:belling,siping,toming,yaking,uaking,oaning,auling,ooping,aiding,naping,euring,tolling,uzzing,ganing,haning,ualing,halling,iasing,auding,ieting,ceting,ouling,voring,ralling,garing,joring,oaming,oaking,roring,nelling,ooring,uelling,eaming,ooding,eaping,eeting,ooting,ooming,xiting,keting,ooking,ulling,airing,oaring,biting,outing,oiting,earing,naling,oading,eeding,ouring,eaking,aiming,illing,oining,eaning,onging,ealing,aining,eading¦4:thoming,melling,aboring,ivoting,weating,dfilling,onoring,eriting,imiting,tialling,rgining,otoring,linging,winging,lleting,louding,spelling,mpelling,heating,feating,opelling,choring,welling,ymaking,ctoring,calling,peating,iloring,laiting,utoring,uditing,mmaking,loating,iciting,waiting,mbating,voiding,otalling,nsoring,nselling,ocusing,itoring,eloping¦5:rselling,umpeting,atrolling,treating,tselling,rpreting,pringing,ummeting,ossoming,elmaking,eselling,rediting,totyping,onmaking,rfeiting,ntrolling¦5e:chmaking,dkeeping,severing,erouting,ecreting,ephoning,uthoring,ravening,reathing,pediting,erfering,eotyping,fringing,entoring,ombining,ompeting¦4e:emaking,eething,twining,rruling,chuting,xciting,rseding,scoping,edoring,pinging,lunging,agining,craping,pleting,eleting,nciting,nfining,ncoding,tponing,ecoding,writing,esaling,nvening,gnoring,evoting,mpeding,rvening,dhering,mpiling,storing,nviting,ploring¦3e:tining,nuring,saking,miring,haling,ceding,xuding,rining,nuting,laring,caring,miling,riding,hoking,piring,lading,curing,uading,noting,taping,futing,paring,hading,loding,siring,guring,vading,voking,during,niting,laning,caping,luting,muting,ruding,ciding,juring,laming,caling,hining,uoting,liding,ciling,duling,tuting,puting,cuting,coring,uiding,tiring,turing,siding,rading,enging,haping,buting,lining,taking,anging,haring,uiring,coming,mining,moting,suring,viding,luding¦2e:tring,zling,uging,oging,gling,iging,vring,fling,lging,obing,psing,pling,ubing,cling,dling,wsing,iking,rsing,dging,kling,ysing,tling,rging,eging,nsing,uning,osing,uming,using,ibing,bling,aging,ising,asing,ating¦2ie:rlying¦1e:zing,uing,cing,ving",
    rev: "ying:ie¦1ing:se,ke,te,we,ne,re,de,pe,me,le,c,he¦2ing:ll,ng,dd,ee,ye,oe,rg,us¦2ning:un¦2ging:og,ag,ug,ig,eg¦2ming:um¦2bing:ub,ab,eb,ob¦3ning:lan,can,hin,pin,win¦3ring:cur,lur,tir,tar,pur,car¦3ing:ait,del,eel,fin,eat,oat,eem,lel,ool,ein,uin¦3ping:rop,rap,top,uip,wap,hip,hop,lap,rip,cap¦3ming:tem,wim,rim,kim,lim¦3ting:mat,cut,pot,lit,lot,hat,set,pit,put¦3ding:hed,bed,bid¦3king:rek¦3ling:cil,pel¦3bing:rib¦4ning:egin¦4ing:isit,ruit,ilot,nsit,dget,rkel,ival,rcel¦4ring:efer,nfer¦4ting:rmit,mmit,ysit,dmit,emit,bmit,tfit,gret¦4ling:evel,xcel,ivel¦4ding:hred¦5ing:arget,posit,rofit¦5ring:nsfer¦5ting:nsmit,orget,cquit¦5ling:ancel,istil",
    ex: "3:adding,eating,aiming,aiding,airing,outing,gassing,setting,getting,putting,cutting,winning,sitting,betting,mapping,tapping,letting,bidding,hitting,tanning,netting,popping,fitting,capping,lapping,barring,banning,vetting,topping,rotting,tipping,potting,wetting,pitting,dipping,budding,hemming,pinning,jetting,kidding,padding,podding,sipping,wedding,bedding,donning,warring,penning,gutting,cueing,wadding,petting,ripping,napping,matting,tinning,binning,dimming,hopping,mopping,nodding,panning,rapping,ridding,sinning¦4:selling,falling,calling,waiting,editing,telling,rolling,heating,boating,hanging,beating,coating,singing,tolling,felling,polling,discing,seating,voiding,gelling,yelling,baiting,reining,ruining,seeking,spanning,stepping,knitting,emitting,slipping,quitting,dialing,omitting,clipping,shutting,skinning,abutting,flipping,trotting,cramming,fretting,suiting¦5:bringing,treating,spelling,stalling,trolling,expelling,rivaling,wringing,deterring,singeing,befitting,refitting¦6:enrolling,distilling,scrolling,strolling,caucusing,travelling¦7:installing,redefining,stencilling,recharging,overeating,benefiting,unraveling,programing¦9:reprogramming¦is:being¦2e:using,aging,owing¦3e:making,taking,coming,noting,hiring,filing,coding,citing,doping,baking,coping,hoping,lading,caring,naming,voting,riding,mining,curing,lining,ruling,typing,boring,dining,firing,hiding,piling,taping,waning,baling,boning,faring,honing,wiping,luring,timing,wading,piping,fading,biting,zoning,daring,waking,gaming,raking,ceding,tiring,coking,wining,joking,paring,gaping,poking,pining,coring,liming,toting,roping,wiring,aching¦4e:writing,storing,eroding,framing,smoking,tasting,wasting,phoning,shaking,abiding,braking,flaking,pasting,priming,shoring,sloping,withing,hinging¦5e:defining,refining,renaming,swathing,fringing,reciting¦1ie:dying,tying,lying,vying¦7e:sunbathing"
  },
  Participle: {
    fwd: "1:mt¦2:llen¦3:iven,aken¦:ne¦y:in",
    both: "1:wn¦2:me,aten¦3:seen,bidden,isen¦4:roven,asten¦3l:pilt¦3d:uilt¦2e:itten¦1im:wum¦1eak:poken¦1ine:hone¦1ose:osen¦1in:gun¦1ake:woken¦ear:orn¦eal:olen¦eeze:ozen¦et:otten¦ink:unk¦ing:ung",
    rev: "2:un¦oken:eak¦ought:eek¦oven:eave¦1ne:o¦1own:ly¦1den:de¦1in:ay¦2t:am¦2n:ee¦3en:all¦4n:rive,sake,take¦5n:rgive",
    ex: "2:been¦3:seen,run¦4:given,taken¦5:shaken¦2eak:broken¦1ive:dove¦2y:flown¦3e:hidden,ridden¦1eek:sought¦1ake:woken¦1eave:woven"
  },
  PastTense: {
    fwd: "1:tted,wed,gged,nned,een,rred,pped,yed,bbed,oed,dded,rd,wn,mmed¦2:eed,nded,et,hted,st,oled,ut,emed,eled,lded,ken,rt,nked,apt,ant,eped,eked¦3:eared,eat,eaded,nelled,ealt,eeded,ooted,eaked,eaned,eeted,mited,bid,uit,ead,uited,ealed,geted,velled,ialed,belled¦4:ebuted,hined,comed¦y:ied¦ome:ame¦ear:ore¦ind:ound¦ing:ung,ang¦ep:pt¦ink:ank,unk¦ig:ug¦all:ell¦ee:aw¦ive:ave¦eeze:oze¦old:eld¦ave:ft¦ake:ook¦ell:old¦ite:ote¦ide:ode¦ine:one¦in:un,on¦eal:ole¦im:am¦ie:ay¦and:ood¦1ise:rose¦1eak:roke¦1ing:rought¦1ive:rove¦1el:elt¦1id:bade¦1et:got¦1y:aid¦1it:sat¦3e:lid¦3d:pent",
    both: "1:aed,fed,xed,hed¦2:sged,xted,wled,rped,lked,kied,lmed,lped,uped,bted,rbed,rked,wned,rled,mped,fted,mned,mbed,zzed,omed,ened,cked,gned,lted,sked,ued,zed,nted,ered,rted,rmed,ced,sted,rned,ssed,rded,pted,ved,cted¦3:cled,eined,siped,ooned,uked,ymed,jored,ouded,ioted,oaned,lged,asped,iged,mured,oided,eiled,yped,taled,moned,yled,lit,kled,oaked,gled,naled,fled,uined,oared,valled,koned,soned,aided,obed,ibed,meted,nicked,rored,micked,keted,vred,ooped,oaded,rited,aired,auled,filled,ouled,ooded,ceted,tolled,oited,bited,aped,tled,vored,dled,eamed,nsed,rsed,sited,owded,pled,sored,rged,osed,pelled,oured,psed,oated,loned,aimed,illed,eured,tred,ioned,celled,bled,wsed,ooked,oiled,itzed,iked,iased,onged,ased,ailed,uned,umed,ained,auded,nulled,ysed,eged,ised,aged,oined,ated,used,dged,doned¦4:ntied,efited,uaked,caded,fired,roped,halled,roked,himed,culed,tared,lared,tuted,uared,routed,pited,naked,miled,houted,helled,hared,cored,caled,tired,peated,futed,ciled,called,tined,moted,filed,sided,poned,iloted,honed,lleted,huted,ruled,cured,named,preted,vaded,sured,talled,haled,peded,gined,nited,uided,ramed,feited,laked,gured,ctored,unged,pired,cuted,voked,eloped,ralled,rined,coded,icited,vided,uaded,voted,mined,sired,noted,lined,nselled,luted,jured,fided,puted,piled,pared,olored,cided,hoked,enged,tured,geoned,cotted,lamed,uiled,waited,udited,anged,luded,mired,uired,raded¦5:modelled,izzled,eleted,umpeted,ailored,rseded,treated,eduled,ecited,rammed,eceded,atrolled,nitored,basted,twined,itialled,ncited,gnored,ploded,xcited,nrolled,namelled,plored,efeated,redited,ntrolled,nfined,pleted,llided,lcined,eathed,ibuted,lloted,dhered,cceded¦3ad:sled¦2aw:drew¦2ot:hot¦2ke:made¦2ow:hrew,grew¦2ose:hose¦2d:ilt¦2in:egan¦1un:ran¦1ink:hought¦1ick:tuck¦1ike:ruck¦1eak:poke,nuck¦1it:pat¦1o:did¦1ow:new¦1ake:woke¦go:went",
    rev: "3:rst,hed,hut,cut,set¦4:tbid¦5:dcast,eread,pread,erbid¦ought:uy,eek¦1ied:ny,ly,dy,ry,fy,py,vy,by,ty,cy¦1ung:ling,ting,wing¦1pt:eep¦1ank:rink¦1ore:bear,wear¦1ave:give¦1oze:reeze¦1ound:rind,wind¦1ook:take,hake¦1aw:see¦1old:sell¦1ote:rite¦1ole:teal¦1unk:tink¦1am:wim¦1ay:lie¦1ood:tand¦1eld:hold¦2d:he,ge,re,le,leed,ne,reed,be,ye,lee,pe,we¦2ed:dd,oy,or,ey,gg,rr,us,ew,to¦2ame:ecome,rcome¦2ped:ap¦2ged:ag,og,ug,eg¦2bed:ub,ab,ib,ob¦2lt:neel¦2id:pay¦2ang:pring¦2ove:trive¦2med:um¦2ode:rride¦2at:ysit¦3ted:mit,hat,mat,lat,pot,rot,bat¦3ed:low,end,tow,und,ond,eem,lay,cho,dow,xit,eld,ald,uld,law,lel,eat,oll,ray,ank,fin,oam,out,how,iek,tay,haw,ait,vet,say,cay,bow¦3d:ste,ede,ode,ete,ree,ude,ame,oke,ote,ime,ute,ade¦3red:lur,cur,pur,car¦3ped:hop,rop,uip,rip,lip,tep,top¦3ded:bed,rod,kid¦3ade:orbid¦3led:uel¦3ned:lan,can,kin,pan,tun¦3med:rim,lim¦4ted:quit,llot¦4ed:pear,rrow,rand,lean,mand,anel,pand,reet,link,abel,evel,imit,ceed,ruit,mind,peal,veal,hool,head,pell,well,mell,uell,band,hear,weak¦4led:nnel,qual,ebel,ivel¦4red:nfer,efer,sfer¦4n:sake,trew¦4d:ntee¦4ded:hred¦4ned:rpin¦5ed:light,nceal,right,ndear,arget,hread,eight,rtial,eboot¦5d:edite,nvite¦5ted:egret¦5led:ravel",
    ex: "2:been,upped¦3:added,aged,aided,aimed,aired,bid,died,dyed,egged,erred,eyed,fit,gassed,hit,lied,owed,pent,pied,tied,used,vied,oiled,outed,banned,barred,bet,canned,cut,dipped,donned,ended,feed,inked,jarred,let,manned,mowed,netted,padded,panned,pitted,popped,potted,put,set,sewn,sowed,tanned,tipped,topped,vowed,weed,bowed,jammed,binned,dimmed,hopped,mopped,nodded,pinned,rigged,sinned,towed,vetted¦4:ached,baked,baled,boned,bored,called,caned,cared,ceded,cited,coded,cored,cubed,cured,dared,dined,edited,exited,faked,fared,filed,fined,fired,fuelled,gamed,gelled,hired,hoped,joked,lined,mined,named,noted,piled,poked,polled,pored,pulled,reaped,roamed,rolled,ruled,seated,shed,sided,timed,tolled,toned,voted,waited,walled,waned,winged,wiped,wired,zoned,yelled,tamed,lubed,roped,faded,mired,caked,honed,banged,culled,heated,raked,welled,banded,beat,cast,cooled,cost,dealt,feared,folded,footed,handed,headed,heard,hurt,knitted,landed,leaked,leapt,linked,meant,minded,molded,neared,needed,peaked,plodded,plotted,pooled,quit,read,rooted,sealed,seeded,seeped,shipped,shunned,skimmed,slammed,sparred,stemmed,stirred,suited,thinned,twinned,swayed,winked,dialed,abutted,blotted,fretted,healed,heeded,peeled,reeled¦5:basted,cheated,equalled,eroded,exiled,focused,opined,pleated,primed,quoted,scouted,shored,sloped,smoked,sniped,spelled,spouted,routed,staked,stored,swelled,tasted,treated,wasted,smelled,dwelled,honored,prided,quelled,eloped,scared,coveted,sweated,breaded,cleared,debuted,deterred,freaked,modeled,pleaded,rebutted,speeded¦6:anchored,defined,endured,impaled,invited,refined,revered,strolled,cringed,recast,thrust,unfolded¦7:authored,combined,competed,conceded,convened,excreted,extruded,redefined,restored,secreted,rescinded,welcomed¦8:expedited,infringed¦9:interfered,intervened,persevered¦10:contravened¦eat:ate¦is:was¦go:went¦are:were¦3d:bent,lent,rent,sent¦3e:bit,fled,hid,lost¦3ed:bled,bred¦2ow:blew,grew¦1uy:bought¦2tch:caught¦1o:did¦1ive:dove,gave¦2aw:drew¦2ed:fed¦2y:flew,laid,paid,said¦1ight:fought¦1et:got¦2ve:had¦1ang:hung¦2ad:led¦2ght:lit¦2ke:made¦2et:met¦1un:ran¦1ise:rose¦1it:sat¦1eek:sought¦1each:taught¦1ake:woke,took¦1eave:wove¦2ise:arose¦1ear:bore,tore,wore¦1ind:bound,found,wound¦2eak:broke¦2ing:brought,wrung¦1ome:came¦2ive:drove¦1ig:dug¦1all:fell¦2el:felt¦4et:forgot¦1old:held¦2ave:left¦1ing:rang,sang¦1ide:rode¦1ink:sank¦1ee:saw¦2ine:shone¦4e:slid¦1ell:sold,told¦4d:spent¦2in:spun¦1in:won"
  },
  PresentTense: {
    fwd: "1:oes¦1ve:as",
    both: "1:xes¦2:zzes,ches,shes,sses¦3:iases¦2y:llies,plies¦1y:cies,bies,ties,vies,nies,pies,dies,ries,fies¦:s",
    rev: "1ies:ly¦2es:us,go,do¦3es:cho,eto",
    ex: "2:does,goes¦3:gasses¦5:focuses¦is:are¦3y:relies¦2y:flies¦2ve:has"
  },
  Superlative: {
    fwd: "1st:e¦1est:l,m,f,s¦1iest:cey¦2est:or,ir¦3est:ver",
    both: "4:east¦5:hwest¦5lest:erful¦4est:weet,lgar,tter,oung¦4most:uter¦3est:ger,der,rey,iet,ong,ear¦3test:lat¦3most:ner¦2est:pt,ft,nt,ct,rt,ht¦2test:it¦2gest:ig¦1est:b,k,n,p,h,d,w¦iest:y",
    rev: "1:ttest,nnest,yest¦2:sest,stest,rmest,cest,vest,lmest,olest,ilest,ulest,ssest,imest,uest¦3:rgest,eatest,oorest,plest,allest,urest,iefest,uelest,blest,ugest,amest,yalest,ealest,illest,tlest,itest¦4:cerest,eriest,somest,rmalest,ndomest,motest,uarest,tiffest¦5:leverest,rangest¦ar:urthest¦3ey:riciest",
    ex: "best:good¦worst:bad¦5est:great¦4est:fast,full,fair,dull¦3test:hot,wet,fat¦4nest:thin¦1urthest:far¦3est:gay,shy,ill¦4test:neat¦4st:late,wide,fine,safe,cute,fake,pale,rare,rude,sore,ripe,dire¦6st:severe"
  },
  AdjToNoun: {
    fwd: "1:tistic,eable,lful,sful,ting,tty¦2:onate,rtable,geous,ced,seful,ctful¦3:ortive,ented¦arity:ear¦y:etic¦fulness:begone¦1ity:re¦1y:tiful,gic¦2ity:ile,imous,ilous,ime¦2ion:ated¦2eness:iving¦2y:trious¦2ation:iring¦2tion:vant¦3ion:ect¦3ce:mant,mantic¦3tion:irable¦3y:est,estic¦3m:mistic,listic¦3ess:ning¦4n:utious¦4on:rative,native,vative,ective¦4ce:erant",
    both: "1:king,wing¦2:alous,ltuous,oyful,rdous¦3:gorous,ectable,werful,amatic¦4:oised,usical,agical,raceful,ocused,lined,ightful¦5ness:stful,lding,itous,nuous,ulous,otous,nable,gious,ayful,rvous,ntous,lsive,peful,entle,ciful,osive,leful,isive,ncise,reful,mious¦5ty:ivacious¦5ties:ubtle¦5ce:ilient,adiant,atient¦5cy:icient¦5sm:gmatic¦5on:sessive,dictive¦5ity:pular,sonal,eative,entic¦5sity:uminous¦5ism:conic¦5nce:mperate¦5ility:mitable¦5ment:xcited¦5n:bitious¦4cy:brant,etent,curate¦4ility:erable,acable,icable,ptable¦4ty:nacious,aive,oyal,dacious¦4n:icious¦4ce:vient,erent,stent,ndent,dient,quent,ident¦4ness:adic,ound,hing,pant,sant,oing,oist,tute¦4icity:imple¦4ment:fined,mused¦4ism:otic¦4ry:dantic¦4ity:tund,eral¦4edness:hand¦4on:uitive¦4lity:pitable¦4sm:eroic,namic¦4sity:nerous¦3th:arm¦3ility:pable,bable,dable,iable¦3cy:hant,nant,icate¦3ness:red,hin,nse,ict,iet,ite,oud,ind,ied,rce¦3ion:lute¦3ity:ual,gal,volous,ial¦3ce:sent,fensive,lant,gant,gent,lent,dant¦3on:asive¦3m:fist,sistic,iastic¦3y:terious,xurious,ronic,tastic¦3ur:amorous¦3e:tunate¦3ation:mined¦3sy:rteous¦3ty:ain¦3ry:ave¦3ment:azed¦2ness:de,on,ue,rn,ur,ft,rp,pe,om,ge,rd,od,ay,ss,er,ll,oy,ap,ht,ld,ad,rt¦2inousness:umous¦2ity:neous,ene,id,ane¦2cy:bate,late¦2ation:ized¦2ility:oble,ible¦2y:odic¦2e:oving,aring¦2s:ost¦2itude:pt¦2dom:ee¦2ance:uring¦2tion:reet¦2ion:oted¦2sion:ending¦2liness:an¦2or:rdent¦1th:ung¦1e:uable¦1ness:w,h,k,f¦1ility:mble¦1or:vent¦1ement:ging¦1tiquity:ncient¦1ment:hed¦verty:or¦ength:ong¦eat:ot¦pth:ep¦iness:y",
    rev: "",
    ex: "5:forceful,humorous¦8:charismatic¦13:understanding¦5ity:active¦11ness:adventurous,inquisitive,resourceful¦8on:aggressive,automatic,perceptive¦7ness:amorous,fatuous,furtive,ominous,serious¦5ness:ample,sweet¦12ness:apprehensive,cantankerous,contemptuous,ostentatious¦13ness:argumentative,conscientious¦9ness:assertive,facetious,imperious,inventive,oblivious,rapacious,receptive,seditious,whimsical¦10ness:attractive,expressive,impressive,loquacious,salubrious,thoughtful¦3edom:boring¦4ness:calm,fast,keen,tame¦8ness:cheerful,gracious,specious,spurious,timorous,unctuous¦5sity:curious¦9ion:deliberate¦8ion:desperate¦6e:expensive¦7ce:fragrant¦3y:furious¦9ility:ineluctable¦6ism:mystical¦8ity:physical,proactive,sensitive,vertical¦5cy:pliant¦7ity:positive¦9ity:practical¦12ism:professional¦6ce:prudent¦3ness:red¦6cy:vagrant¦3dom:wise"
  }
}, hf = function(e, t = {}) {
  return t.hasOwnProperty(e) ? t[e] : null;
}, df = function(e, t = []) {
  for (let n = 0; n < t.length; n += 1)
    if (e.endsWith(t[n]))
      return e;
  return null;
}, ff = function(e, t, n = {}) {
  t = t || {};
  let r = e.length - 1;
  for (let o = r; o >= 1; o -= 1) {
    let a = e.length - o, i = e.substring(a, e.length);
    if (t.hasOwnProperty(i) === !0)
      return e.slice(0, a) + t[i];
    if (n.hasOwnProperty(i) === !0)
      return e.slice(0, a) + n[i];
  }
  return t.hasOwnProperty("") ? e += t[""] : n.hasOwnProperty("") ? e += n[""] : null;
}, Y = function(e = "", t = {}) {
  let n = hf(e, t.ex);
  return n = n || df(e, t.same), n = n || ff(e, t.fwd, t.both), n = n || e, n;
}, to = function(e) {
  return Object.entries(e).reduce((t, n) => (t[n[1]] = n[0], t), {});
}, at = function(e = {}) {
  return {
    reversed: !0,
    // keep these two
    both: to(e.both),
    ex: to(e.ex),
    // swap this one in
    fwd: e.rev || {}
  };
}, no = /^([0-9]+)/, pf = function(e) {
  let t = {};
  return e.split("¦").forEach((n) => {
    let [r, o] = n.split(":");
    o = (o || "").split(","), o.forEach((a) => {
      t[a] = r;
    });
  }), t;
}, gf = function(e = "", t = "") {
  t = String(t);
  let n = t.match(no);
  if (n === null)
    return t;
  let r = Number(n[1]) || 0;
  return e.substring(0, r) + t.replace(no, "");
}, Gt = function(e) {
  let t = pf(e);
  return Object.keys(t).reduce((n, r) => (n[r] = gf(r, t[r]), n), {});
}, Je = function(e = {}) {
  return typeof e == "string" && (e = JSON.parse(e)), e.fwd = Gt(e.fwd || ""), e.both = Gt(e.both || ""), e.rev = Gt(e.rev || ""), e.ex = Gt(e.ex || ""), e;
}, za = Je(We.PastTense), Va = Je(We.PresentTense), Ba = Je(We.Gerund), Sa = Je(We.Participle), mf = at(za), yf = at(Va), bf = at(Ba), vf = at(Sa), Ma = Je(We.Comparative), La = Je(We.Superlative), wf = at(Ma), Pf = at(La), kf = Je(We.AdjToNoun), Ka = {
  fromPast: za,
  fromPresent: Va,
  fromGerund: Ba,
  fromParticiple: Sa,
  toPast: mf,
  toPresent: yf,
  toGerund: bf,
  toParticiple: vf,
  // adjectives
  toComparative: Ma,
  toSuperlative: La,
  fromComparative: wf,
  fromSuperlative: Pf,
  adjToNoun: kf
}, Af = [
  //web tags
  [/^[\w.]+@[\w.]+\.[a-z]{2,3}$/, "Email"],
  [/^(https?:\/\/|www\.)+\w+\.[a-z]{2,3}/, "Url", "http.."],
  [/^[a-z0-9./].+\.(com|net|gov|org|ly|edu|info|biz|dev|ru|jp|de|in|uk|br|io|ai)/, "Url", ".com"],
  // timezones
  [/^[PMCE]ST$/, "Timezone", "EST"],
  //names
  [/^ma?c'[a-z]{3}/, "LastName", "mc'neil"],
  [/^o'[a-z]{3}/, "LastName", "o'connor"],
  [/^ma?cd[aeiou][a-z]{3}/, "LastName", "mcdonald"],
  //slang things
  [/^(lol)+[sz]$/, "Expression", "lol"],
  [/^wo{2,}a*h?$/, "Expression", "wooah"],
  [/^(hee?){2,}h?$/, "Expression", "hehe"],
  [/^(un|de|re)\\-[a-z\u00C0-\u00FF]{2}/, "Verb", "un-vite"],
  // m/h
  [/^(m|k|cm|km)\/(s|h|hr)$/, "Unit", "5 k/m"],
  // μg/g
  [/^(ug|ng|mg)\/(l|m3|ft3)$/, "Unit", "ug/L"],
  // love/hate
  [new RegExp("[^:/]\\/\\p{Letter}", "u"), "SlashedTerm", "love/hate"]
], Cf = [
  // #coolguy
  [new RegExp("^#[\\p{Number}_]*\\p{Letter}", "u"), "HashTag"],
  // can't be all numbers
  // @spencermountain
  [/^@\w{2,}$/, "AtMention"],
  // period-ones acronyms - f.b.i.
  [/^([A-Z]\.){2}[A-Z]?/i, ["Acronym", "Noun"], "F.B.I"],
  //ascii-only
  // ending-apostrophes
  [/.{3}[lkmnp]in['‘’‛‵′`´]$/, "Gerund", "chillin'"],
  [/.{4}s['‘’‛‵′`´]$/, "Possessive", "flanders'"],
  //from https://www.regextester.com/106421
  // [/^([\u00a9\u00ae\u2319-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/, 'Emoji', 'emoji-range']
  // unicode character range
  [/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u, "Emoji", "emoji-class"]
], Nf = [
  [/^@1?[0-9](am|pm)$/i, "Time", "3pm"],
  [/^@1?[0-9]:[0-9]{2}(am|pm)?$/i, "Time", "3:30pm"],
  [/^'[0-9]{2}$/, "Year"],
  // times
  [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])$/, "Time", "3:12:31"],
  [/^[012]?[0-9](:[0-5][0-9])?(:[0-5][0-9])? ?(am|pm)$/i, "Time", "1:12pm"],
  [/^[012]?[0-9](:[0-5][0-9])(:[0-5][0-9])? ?(am|pm)?$/i, "Time", "1:12:31pm"],
  //can remove?
  // iso-dates
  [/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}/i, "Date", "iso-date"],
  [/^[0-9]{1,4}-[0-9]{1,2}-[0-9]{1,4}$/, "Date", "iso-dash"],
  [/^[0-9]{1,4}\/[0-9]{1,2}\/([0-9]{4}|[0-9]{2})$/, "Date", "iso-slash"],
  [/^[0-9]{1,4}\.[0-9]{1,2}\.[0-9]{1,4}$/, "Date", "iso-dot"],
  [/^[0-9]{1,4}-[a-z]{2,9}-[0-9]{1,4}$/i, "Date", "12-dec-2019"],
  // timezones
  [/^utc ?[+-]?[0-9]+$/, "Timezone", "utc-9"],
  [/^(gmt|utc)[+-][0-9]{1,2}$/i, "Timezone", "gmt-3"],
  //phone numbers
  [/^[0-9]{3}-[0-9]{4}$/, "PhoneNumber", "421-0029"],
  [/^(\+?[0-9][ -])?[0-9]{3}[ -]?[0-9]{3}-[0-9]{4}$/, "PhoneNumber", "1-800-"],
  //money
  //like $5.30
  [new RegExp("^[-+]?\\p{Currency_Symbol}[-+]?[0-9]+(,[0-9]{3})*(\\.[0-9]+)?([kmb]|bn)?\\+?$", "u"), ["Money", "Value"], "$5.30"],
  //like 5.30$
  [new RegExp("^[-+]?[0-9]+(,[0-9]{3})*(\\.[0-9]+)?\\p{Currency_Symbol}\\+?$", "u"), ["Money", "Value"], "5.30£"],
  //like
  [/^[-+]?[$£]?[0-9]([0-9,.])+(usd|eur|jpy|gbp|cad|aud|chf|cny|hkd|nzd|kr|rub)$/i, ["Money", "Value"], "$400usd"],
  //numbers
  // 50 | -50 | 3.23  | 5,999.0  | 10+
  [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?\+?$/, ["Cardinal", "NumericValue"], "5,999"],
  [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?(st|nd|rd|r?th)$/, ["Ordinal", "NumericValue"], "53rd"],
  // .73th
  [/^\.[0-9]+\+?$/, ["Cardinal", "NumericValue"], ".73th"],
  //percent
  [/^[-+]?[0-9]+(,[0-9]{3})*(\.[0-9]+)?%\+?$/, ["Percent", "Cardinal", "NumericValue"], "-4%"],
  [/^\.[0-9]+%$/, ["Percent", "Cardinal", "NumericValue"], ".3%"],
  //fraction
  [/^[0-9]{1,4}\/[0-9]{1,4}(st|nd|rd|th)?s?$/, ["Fraction", "NumericValue"], "2/3rds"],
  //range
  [/^[0-9.]{1,3}[a-z]{0,2}[-–—][0-9]{1,3}[a-z]{0,2}$/, ["Value", "NumberRange"], "3-4"],
  //time-range
  [/^[0-9]{1,2}(:[0-9][0-9])?(am|pm)? ?[-–—] ?[0-9]{1,2}(:[0-9][0-9])?(am|pm)$/, ["Time", "NumberRange"], "3-4pm"],
  //number with unit
  [/^[0-9.]+([a-z°]{1,4})$/, "NumericValue", "9km"]
], xf = [
  "academy",
  "administration",
  "agence",
  "agences",
  "agencies",
  "agency",
  "airlines",
  "airways",
  "army",
  "assoc",
  "associates",
  "association",
  "assurance",
  "authority",
  "autorite",
  "aviation",
  "bank",
  "banque",
  "board",
  "boys",
  "brands",
  "brewery",
  "brotherhood",
  "brothers",
  "bureau",
  "cafe",
  "co",
  "caisse",
  "capital",
  "care",
  "cathedral",
  "center",
  "centre",
  "chemicals",
  "choir",
  "chronicle",
  "church",
  "circus",
  "clinic",
  "clinique",
  "club",
  "co",
  "coalition",
  "coffee",
  "collective",
  "college",
  "commission",
  "committee",
  "communications",
  "community",
  "company",
  "comprehensive",
  "computers",
  "confederation",
  "conference",
  "conseil",
  "consulting",
  "containers",
  "corporation",
  "corps",
  "corp",
  "council",
  "crew",
  "data",
  "departement",
  "department",
  "departments",
  "design",
  "development",
  "directorate",
  "division",
  "drilling",
  "education",
  "eglise",
  "electric",
  "electricity",
  "energy",
  "ensemble",
  "enterprise",
  "enterprises",
  "entertainment",
  "estate",
  "etat",
  "faculty",
  "faction",
  "federation",
  "financial",
  "fm",
  "foundation",
  "fund",
  "gas",
  "gazette",
  "girls",
  "government",
  "group",
  "guild",
  "herald",
  "holdings",
  "hospital",
  "hotel",
  "hotels",
  "inc",
  "industries",
  "institut",
  "institute",
  "institutes",
  "insurance",
  "international",
  "interstate",
  "investment",
  "investments",
  "investors",
  "journal",
  "laboratory",
  "labs",
  "llc",
  "ltd",
  "limited",
  "machines",
  "magazine",
  "management",
  "marine",
  "marketing",
  "markets",
  "media",
  "memorial",
  "ministere",
  "ministry",
  "military",
  "mobile",
  "motor",
  "motors",
  "musee",
  "museum",
  "news",
  "observatory",
  "office",
  "oil",
  "optical",
  "orchestra",
  "organization",
  "partners",
  "partnership",
  "petrol",
  "petroleum",
  "pharmacare",
  "pharmaceutical",
  "pharmaceuticals",
  "pizza",
  "plc",
  "police",
  "politburo",
  "polytechnic",
  "post",
  "power",
  "press",
  "productions",
  "quartet",
  "radio",
  "reserve",
  "resources",
  "restaurant",
  "restaurants",
  "savings",
  "school",
  "securities",
  "service",
  "services",
  "societe",
  "subsidiary",
  "society",
  "sons",
  // 'standard',
  "subcommittee",
  "syndicat",
  "systems",
  "telecommunications",
  "telegraph",
  "television",
  "times",
  "tribunal",
  "tv",
  "union",
  "university",
  "utilities",
  "workers"
].reduce((e, t) => (e[t] = !0, e), {}), jf = [
  // geology
  "atoll",
  "basin",
  "bay",
  "beach",
  "bluff",
  "bog",
  "camp",
  "canyon",
  "canyons",
  "cape",
  "cave",
  "caves",
  // 'cliff',
  "cliffs",
  "coast",
  "cove",
  "coves",
  "crater",
  "crossing",
  "creek",
  "desert",
  "dune",
  "dunes",
  "downs",
  "estates",
  "escarpment",
  "estuary",
  "falls",
  "fjord",
  "fjords",
  "forest",
  "forests",
  "glacier",
  "gorge",
  "gorges",
  "grove",
  "gulf",
  "gully",
  "highland",
  "heights",
  "hollow",
  "hill",
  "hills",
  "inlet",
  "island",
  "islands",
  "isthmus",
  "junction",
  "knoll",
  "lagoon",
  "lake",
  "lakeshore",
  "marsh",
  "marshes",
  "mount",
  "mountain",
  "mountains",
  "narrows",
  "peninsula",
  "plains",
  "plateau",
  "pond",
  "rapids",
  "ravine",
  "reef",
  "reefs",
  "ridge",
  // 'river delta',
  "river",
  "rivers",
  "sandhill",
  "shoal",
  "shore",
  "shoreline",
  "shores",
  "strait",
  "straits",
  "springs",
  "stream",
  "swamp",
  "tombolo",
  "trail",
  "trails",
  "trench",
  "valley",
  "vallies",
  "village",
  "volcano",
  "waterfall",
  "watershed",
  "wetland",
  "woods",
  "acres",
  // districts
  "burough",
  "county",
  "district",
  "municipality",
  "prefecture",
  "province",
  "region",
  "reservation",
  "state",
  "territory",
  "borough",
  "metropolis",
  "downtown",
  "uptown",
  "midtown",
  "city",
  "town",
  "township",
  "hamlet",
  "country",
  "kingdom",
  "enclave",
  "neighbourhood",
  "neighborhood",
  "kingdom",
  "ward",
  "zone",
  // 'range',
  //building/ complex
  "airport",
  "amphitheater",
  "arch",
  "arena",
  "auditorium",
  "bar",
  "barn",
  "basilica",
  "battlefield",
  "bridge",
  "building",
  "castle",
  "centre",
  "coliseum",
  "cineplex",
  "complex",
  "dam",
  "farm",
  "field",
  "fort",
  "garden",
  "gardens",
  // 'grounds',
  "gymnasium",
  "hall",
  "house",
  "levee",
  "library",
  "manor",
  "memorial",
  "monument",
  "museum",
  "gallery",
  "palace",
  "pillar",
  "pits",
  // 'pit',
  // 'place',
  // 'point',
  // 'room',
  "plantation",
  "playhouse",
  "quarry",
  // 'ruins',
  "sportsfield",
  "sportsplex",
  "stadium",
  // 'statue',
  "terrace",
  "terraces",
  "theater",
  "tower",
  "park",
  "parks",
  "site",
  "ranch",
  "raceway",
  "sportsplex",
  // 'sports centre',
  // 'sports field',
  // 'soccer complex',
  // 'soccer centre',
  // 'sports complex',
  // 'civic centre',
  // roads
  "ave",
  "st",
  "street",
  "rd",
  "road",
  "lane",
  "landing",
  "crescent",
  "cr",
  "way",
  "tr",
  "terrace",
  "avenue"
].reduce((e, t) => (e[t] = !0, e), {}), Ot = [
  [/([^v])ies$/i, "$1y"],
  [/(ise)s$/i, "$1"],
  //promises
  [/(kn|[^o]l|w)ives$/i, "$1ife"],
  [/^((?:ca|e|ha|(?:our|them|your)?se|she|wo)l|lea|loa|shea|thie)ves$/i, "$1f"],
  [/^(dwar|handkerchie|hoo|scar|whar)ves$/i, "$1f"],
  [/(antenn|formul|nebul|vertebr|vit)ae$/i, "$1a"],
  [/(octop|vir|radi|nucle|fung|cact|stimul)(i)$/i, "$1us"],
  [/(buffal|tomat|tornad)(oes)$/i, "$1o"],
  [/(ause)s$/i, "$1"],
  //causes
  [/(ease)s$/i, "$1"],
  //diseases
  [/(ious)es$/i, "$1"],
  //geniouses
  [/(ouse)s$/i, "$1"],
  //houses
  [/(ose)s$/i, "$1"],
  //roses
  [/(..ase)s$/i, "$1"],
  [/(..[aeiu]s)es$/i, "$1"],
  [/(vert|ind|cort)(ices)$/i, "$1ex"],
  [/(matr|append)(ices)$/i, "$1ix"],
  [/([xo]|ch|ss|sh)es$/i, "$1"],
  [/men$/i, "man"],
  [/(n)ews$/i, "$1ews"],
  [/([ti])a$/i, "$1um"],
  [/([^aeiouy]|qu)ies$/i, "$1y"],
  [/(s)eries$/i, "$1eries"],
  [/(m)ovies$/i, "$1ovie"],
  [/(cris|ax|test)es$/i, "$1is"],
  [/(alias|status)es$/i, "$1"],
  [/(ss)$/i, "$1"],
  [/(ic)s$/i, "$1"],
  [/s$/i, ""]
], Tf = function(e) {
  return Object.keys(e).reduce((t, n) => (t[e[n]] = n, t), {});
}, Wa = function(e, t) {
  const { irregularPlurals: n } = t.two, r = Tf(n);
  if (r.hasOwnProperty(e))
    return r[e];
  for (let o = 0; o < Ot.length; o++)
    if (Ot[o][0].test(e) === !0)
      return e = e.replace(Ot[o][0], Ot[o][1]), e;
  return e;
}, If = function(e, t) {
  const n = [e], r = Zt(e, t);
  r !== e && n.push(r);
  const o = Wa(e, t);
  return o !== e && n.push(o), n;
}, $f = { toPlural: Zt, toSingular: Wa, all: If };
let Le = {
  Gerund: ["ing"],
  Actor: ["erer"],
  Infinitive: [
    "ate",
    "ize",
    "tion",
    "rify",
    "then",
    "ress",
    "ify",
    "age",
    "nce",
    "ect",
    "ise",
    "ine",
    "ish",
    "ace",
    "ash",
    "ure",
    "tch",
    "end",
    "ack",
    "and",
    "ute",
    "ade",
    "ock",
    "ite",
    "ase",
    "ose",
    "use",
    "ive",
    "int",
    "nge",
    "lay",
    "est",
    "ain",
    "ant",
    "ent",
    "eed",
    "er",
    "le",
    "unk",
    "ung",
    "upt",
    "en"
  ],
  PastTense: ["ept", "ed", "lt", "nt", "ew", "ld"],
  PresentTense: [
    "rks",
    "cks",
    "nks",
    "ngs",
    "mps",
    "tes",
    "zes",
    "ers",
    "les",
    "acks",
    "ends",
    "ands",
    "ocks",
    "lays",
    "eads",
    "lls",
    "els",
    "ils",
    "ows",
    "nds",
    "ays",
    "ams",
    "ars",
    "ops",
    "ffs",
    "als",
    "urs",
    "lds",
    "ews",
    "ips",
    "es",
    "ts",
    "ns"
  ],
  Participle: ["ken", "wn"]
};
Le = Object.keys(Le).reduce((e, t) => (Le[t].forEach((n) => e[n] = t), e), {});
const Ja = function(e) {
  const t = e.substring(e.length - 3);
  if (Le.hasOwnProperty(t) === !0)
    return Le[t];
  const n = e.substring(e.length - 2);
  return Le.hasOwnProperty(n) === !0 ? Le[n] : e.substring(e.length - 1) === "s" ? "PresentTense" : null;
}, Df = function(e, t) {
  let n = "", r = {};
  t.one && t.one.prefixes && (r = t.one.prefixes);
  let [o, a] = e.split(/ /);
  return a && r[o] === !0 && (n = o, o = a, a = ""), {
    prefix: n,
    verb: o,
    particle: a
  };
}, ro = {
  are: "be",
  were: "be",
  been: "be",
  is: "be",
  am: "be",
  was: "be",
  be: "be",
  being: "be"
}, En = function(e, t, n) {
  const { fromPast: r, fromPresent: o, fromGerund: a, fromParticiple: i } = t.two.models, { prefix: s, verb: u, particle: l } = Df(e, t);
  let c = "";
  if (n || (n = Ja(e)), ro.hasOwnProperty(e))
    c = ro[e];
  else if (n === "Participle")
    c = Y(u, i);
  else if (n === "PastTense")
    c = Y(u, r);
  else if (n === "PresentTense")
    c = Y(u, o);
  else if (n === "Gerund")
    c = Y(u, a);
  else
    return e;
  return l && (c += " " + l), s && (c = s + " " + c), c;
}, Hf = (e) => / /.test(e) ? e.split(/ /) : [e, ""], Zn = function(e, t) {
  const { toPast: n, toPresent: r, toGerund: o, toParticiple: a } = t.two.models;
  if (e === "be")
    return {
      Infinitive: e,
      Gerund: "being",
      PastTense: "was",
      PresentTense: "is"
    };
  const [i, s] = Hf(e), u = {
    Infinitive: i,
    PastTense: Y(i, n),
    PresentTense: Y(i, r),
    Gerund: Y(i, o),
    FutureTense: "will " + i
  };
  let l = Y(i, a);
  if (l !== e && l !== u.PastTense) {
    const c = t.one.lexicon || {};
    (c[l] === "Participle" || c[l] === "Adjective") && (e === "play" && (l = "played"), u.Participle = l);
  }
  return s && Object.keys(u).forEach((c) => {
    u[c] += " " + s;
  }), u;
}, Ef = function(e, t) {
  const n = Zn(e, t);
  return delete n.FutureTense, Object.values(n).filter((r) => r);
}, Gf = {
  toInfinitive: En,
  conjugate: Zn,
  all: Ef
}, Xn = function(e, t) {
  const n = t.two.models.toSuperlative;
  return Y(e, n);
}, Yn = function(e, t) {
  const n = t.two.models.toComparative;
  return Y(e, n);
}, Of = function(e, t) {
  const n = t.two.models.fromComparative;
  return Y(e, n);
}, Ff = function(e, t) {
  const n = t.two.models.fromSuperlative;
  return Y(e, n);
}, zf = function(e, t) {
  const n = t.two.models.adjToNoun;
  return Y(e, n);
}, Ua = function(e = "", t = []) {
  const n = e.length, r = n <= 6 ? n - 1 : 6;
  for (let o = r; o >= 1; o -= 1) {
    const a = e.substring(n - o, e.length);
    if (t[a.length].hasOwnProperty(a) === !0) {
      const i = e.slice(0, n - o), s = t[a.length][a];
      return i + s;
    }
  }
  return null;
}, P = "ically", Vf = /* @__PURE__ */ new Set([
  "analyt" + P,
  //analytical
  "chem" + P,
  // chemical
  "class" + P,
  //classical
  "clin" + P,
  // clinical
  "crit" + P,
  // critical
  "ecolog" + P,
  // ecological
  "electr" + P,
  // electrical
  "empir" + P,
  // empirical
  "frant" + P,
  // frantical
  "grammat" + P,
  // grammatical
  "ident" + P,
  // identical
  "ideolog" + P,
  // ideological
  "log" + P,
  // logical
  "mag" + P,
  //magical
  "mathemat" + P,
  // mathematical
  "mechan" + P,
  // mechanical
  "med" + P,
  // medical
  "method" + P,
  // methodical
  "method" + P,
  // methodical
  "mus" + P,
  // musical
  "phys" + P,
  // physical
  "phys" + P,
  // physical
  "polit" + P,
  // political
  "pract" + P,
  // practical
  "rad" + P,
  //radical
  "satir" + P,
  // satirical
  "statist" + P,
  // statistical
  "techn" + P,
  // technical
  "technolog" + P,
  // technological
  "theoret" + P,
  // theoretical
  "typ" + P,
  // typical
  "vert" + P,
  // vertical
  "whims" + P
  // whimsical
]), Bf = [
  null,
  {},
  { ly: "" },
  {
    ily: "y",
    bly: "ble",
    ply: "ple"
  },
  {
    ally: "al",
    rply: "rp"
  },
  {
    ually: "ual",
    ially: "ial",
    cally: "cal",
    eally: "eal",
    rally: "ral",
    nally: "nal",
    mally: "mal",
    eeply: "eep",
    eaply: "eap"
  },
  {
    ically: "ic"
  }
], Sf = /* @__PURE__ */ new Set([
  "early",
  "only",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "mostly",
  "duly",
  "unduly",
  "especially",
  "undoubtedly",
  "conversely",
  "namely",
  "exceedingly",
  "presumably",
  "accordingly",
  "overly",
  "best",
  "latter",
  "little",
  "long",
  "low"
]), oo = {
  wholly: "whole",
  fully: "full",
  truly: "true",
  gently: "gentle",
  singly: "single",
  customarily: "customary",
  idly: "idle",
  publically: "public",
  quickly: "quick",
  superbly: "superb",
  cynically: "cynical",
  well: "good"
  // -?
}, Mf = function(e) {
  return e.endsWith("ly") ? Vf.has(e) ? e.replace(/ically/, "ical") : Sf.has(e) ? null : oo.hasOwnProperty(e) ? oo[e] : Ua(e, Bf) || e : null;
}, Lf = [
  null,
  {
    y: "ily"
  },
  {
    ly: "ly",
    //unchanged
    ic: "ically"
  },
  {
    ial: "ially",
    ual: "ually",
    tle: "tly",
    ble: "bly",
    ple: "ply",
    ary: "arily"
  },
  {},
  {},
  {}
], ao = {
  cool: "cooly",
  whole: "wholly",
  full: "fully",
  good: "well",
  idle: "idly",
  public: "publicly",
  single: "singly",
  special: "especially"
}, qa = function(e) {
  if (ao.hasOwnProperty(e))
    return ao[e];
  let t = Ua(e, Lf);
  return t || (t = e + "ly"), t;
}, Kf = function(e, t) {
  let n = [e];
  return n.push(Xn(e, t)), n.push(Yn(e, t)), n.push(qa(e)), n = n.filter((r) => r), n = new Set(n), Array.from(n);
}, Wf = {
  toSuperlative: Xn,
  toComparative: Yn,
  toAdverb: qa,
  toNoun: zf,
  fromAdverb: Mf,
  fromSuperlative: Ff,
  fromComparative: Of,
  all: Kf
}, Jf = {
  noun: $f,
  verb: Gf,
  adjective: Wf
}, io = {
  // add plural forms of singular nouns
  Singular: (e, t, n, r) => {
    const o = r.one.lexicon, a = n.two.transform.noun.toPlural(e, r);
    o[a] || (t[a] = t[a] || "Plural");
  },
  // 'lawyer', 'manager' plural forms
  Actor: (e, t, n, r) => {
    const o = r.one.lexicon, a = n.two.transform.noun.toPlural(e, r);
    o[a] || (t[a] = t[a] || ["Plural", "Actor"]);
  },
  // superlative/ comparative forms for adjectives
  Comparable: (e, t, n, r) => {
    const o = r.one.lexicon, { toSuperlative: a, toComparative: i } = n.two.transform.adjective, s = a(e, r);
    o[s] || (t[s] = t[s] || "Superlative");
    const u = i(e, r);
    o[u] || (t[u] = t[u] || "Comparative"), t[e] = "Adjective";
  },
  // 'german' -> 'germans'
  Demonym: (e, t, n, r) => {
    const o = n.two.transform.noun.toPlural(e, r);
    t[o] = t[o] || ["Demonym", "Plural"];
  },
  // conjugate all forms of these verbs
  Infinitive: (e, t, n, r) => {
    const o = r.one.lexicon, a = n.two.transform.verb.conjugate(e, r);
    Object.entries(a).forEach((i) => {
      !o[i[1]] && !t[i[1]] && i[0] !== "FutureTense" && (t[i[1]] = i[0]);
    });
  },
  // 'walk up' should conjugate, too
  PhrasalVerb: (e, t, n, r) => {
    const o = r.one.lexicon;
    t[e] = ["PhrasalVerb", "Infinitive"];
    const a = r.one._multiCache, [i, s] = e.split(" ");
    o[i] || (t[i] = t[i] || "Infinitive");
    const u = n.two.transform.verb.conjugate(i, r);
    delete u.FutureTense, Object.entries(u).forEach((l) => {
      if (l[0] === "Actor" || l[1] === "")
        return;
      !t[l[1]] && !o[l[1]] && (t[l[1]] = l[0]), a[l[1]] = 2;
      const c = l[1] + " " + s;
      t[c] = t[c] || [l[0], "PhrasalVerb"];
    });
  },
  // expand 'million'
  Multiple: (e, t) => {
    t[e] = ["Multiple", "Cardinal"], t[e + "th"] = ["Multiple", "Ordinal"], t[e + "ths"] = ["Multiple", "Fraction"];
  },
  // expand number-words
  Cardinal: (e, t) => {
    t[e] = ["TextValue", "Cardinal"];
  },
  // 'millionth'
  Ordinal: (e, t) => {
    t[e] = ["TextValue", "Ordinal"], t[e + "s"] = ["TextValue", "Fraction"];
  },
  // 'thames'
  Place: (e, t) => {
    t[e] = ["Place", "ProperNoun"];
  },
  // 'ontario'
  Region: (e, t) => {
    t[e] = ["Region", "ProperNoun"];
  }
}, Uf = function(e, t) {
  const { methods: n, model: r } = t, o = {}, a = {};
  return Object.keys(e).forEach((i) => {
    const s = e[i];
    i = i.toLowerCase().trim(), i = i.replace(/'s\b/, "");
    const u = i.split(/ /);
    u.length > 1 && (a[u[0]] === void 0 || u.length > a[u[0]]) && (a[u[0]] = u.length), io.hasOwnProperty(s) === !0 && io[s](i, o, n, r), o[i] = o[i] || s;
  }), delete o[""], delete o[null], delete o[" "], { lex: o, _multi: a };
}, qf = function(e, t) {
  const n = /^[0-9]+$/, r = e[t];
  if (!r)
    return !1;
  const o = /* @__PURE__ */ new Set(["may", "april", "august", "jan"]);
  if (r.normal === "like" || o.has(r.normal) || r.tags.has("Place") || r.tags.has("Date"))
    return !1;
  if (e[t - 1]) {
    const i = e[t - 1];
    if (i.tags.has("Date") || o.has(i.normal) || i.tags.has("Adjective") || r.tags.has("Adjective"))
      return !1;
  }
  const a = r.normal;
  return !((a.length === 1 || a.length === 2 || a.length === 4) && n.test(a));
}, Rf = function(e) {
  const t = /[,:;]/, n = [];
  return e.forEach((r) => {
    let o = 0;
    r.forEach((a, i) => {
      t.test(a.post) && qf(r, i + 1) && (n.push(r.slice(o, i + 1)), o = i + 1);
    }), o < r.length && n.push(r.slice(o, r.length));
  }), n;
}, so = {
  e: ["mice", "louse", "antennae", "formulae", "nebulae", "vertebrae", "vitae"],
  i: ["tia", "octopi", "viri", "radii", "nuclei", "fungi", "cacti", "stimuli"],
  n: ["men"],
  t: ["feet"]
}, Qf = /* @__PURE__ */ new Set([
  // 'formulas',
  // 'umbrellas',
  // 'gorillas',
  // 'koalas',
  "israelis",
  "menus",
  "logos"
]), _f = [
  "bus",
  "mas",
  //christmas
  "was",
  // 'las',
  "ias",
  //alias
  "xas",
  "vas",
  "cis",
  //probocis
  "lis",
  "nis",
  //tennis
  "ois",
  "ris",
  "sis",
  //thesis
  "tis",
  //mantis, testis
  "xis",
  "aus",
  "cus",
  "eus",
  //nucleus
  "fus",
  //doofus
  "gus",
  //fungus
  "ius",
  //radius
  "lus",
  //stimulus
  "nus",
  "das",
  "ous",
  "pus",
  //octopus
  "rus",
  //virus
  "sus",
  //census
  "tus",
  //status,cactus
  "xus",
  "aos",
  //chaos
  "igos",
  "ados",
  //barbados
  "ogos",
  "'s",
  "ss"
], Ra = function(e) {
  if (!e || e.length <= 3)
    return !1;
  if (Qf.has(e))
    return !0;
  const t = e[e.length - 1];
  return so.hasOwnProperty(t) ? so[t].find((n) => e.endsWith(n)) : !(t !== "s" || _f.find((n) => e.endsWith(n)));
}, Gn = {
  two: {
    quickSplit: Rf,
    expandLexicon: Uf,
    transform: Jf,
    looksPlural: Ra
  }
}, Zf = function(e) {
  const { irregularPlurals: t } = e.two, { lexicon: n } = e.one;
  return Object.entries(t).forEach((r) => {
    n[r[0]] = n[r[0]] || "Singular", n[r[1]] = n[r[1]] || "Plural";
  }), e;
}, On = {
  one: { lexicon: {} },
  two: { models: Ka }
}, Xf = {
  // 'pilot'
  "Actor|Verb": "Actor",
  //
  // 'amusing'
  "Adj|Gerund": "Adjective",
  //+conjugations
  // 'standard'
  "Adj|Noun": "Adjective",
  // 'boiled'
  "Adj|Past": "Adjective",
  //+conjugations
  // 'smooth'
  "Adj|Present": "Adjective",
  //+conjugations
  // 'box'
  "Noun|Verb": "Singular",
  //+conjugations (no-present)
  //'singing'
  "Noun|Gerund": "Gerund",
  //+conjugations
  // 'hope'
  "Person|Noun": "Noun",
  // 'April'
  "Person|Date": "Month",
  // 'rob'
  "Person|Verb": "FirstName",
  //+conjugations
  // 'victoria'
  "Person|Place": "Person",
  // 'rusty'
  "Person|Adj": "Comparative",
  // 'boxes'
  "Plural|Verb": "Plural",
  //(these are already derivative)
  // 'miles'
  "Unit|Noun": "Noun"
}, Qa = function(e, t) {
  const n = { model: t, methods: Gn }, { lex: r, _multi: o } = Gn.two.expandLexicon(e, n);
  return Object.assign(t.one.lexicon, r), Object.assign(t.one._multiCache, o), t;
}, Yf = function(e, t) {
  return Object.keys(e).forEach((n) => {
    e[n] === "Uncountable" && (t.two.uncountable[n] = !0, e[n] = "Uncountable");
  }), t;
}, uo = function(e, t, n) {
  const r = Zn(e, On);
  t[r.PastTense] = t[r.PastTense] || "PastTense", t[r.Gerund] = t[r.Gerund] || "Gerund", n === !0 && (t[r.PresentTense] = t[r.PresentTense] || "PresentTense");
}, co = function(e, t, n) {
  const r = Xn(e, n);
  t[r] = t[r] || "Superlative";
  const o = Yn(e, n);
  t[o] = t[o] || "Comparative";
}, ep = function(e, t, n) {
  const r = Zt(e, n);
  t[r] = t[r] || "Plural";
}, tp = function(e, t) {
  const n = {}, r = t.one.lexicon;
  return Object.keys(e).forEach((o) => {
    const a = e[o];
    if (n[o] = Xf[a], (a === "Noun|Verb" || a === "Person|Verb" || a === "Actor|Verb") && uo(o, r, !1), a === "Adj|Present" && (uo(o, r, !0), co(o, r, t)), a === "Person|Adj" && co(o, r, t), a === "Adj|Gerund" || a === "Noun|Gerund") {
      const i = En(o, On, "Gerund");
      r[i] || (n[i] = "Infinitive");
    }
    if ((a === "Noun|Gerund" || a === "Adj|Noun" || a === "Person|Noun") && ep(o, r, t), a === "Adj|Past") {
      const i = En(o, On, "PastTense");
      r[i] || (n[i] = "Infinitive");
    }
  }), t = Qa(n, t), t;
}, np = function(e) {
  return e = Qa(e.one.lexicon, e), e = Yf(e.one.lexicon, e), e = tp(e.two.switches, e), e = Zf(e), e;
};
let Fn = {
  one: {
    _multiCache: {},
    lexicon: ot,
    frozenLex: Vd
  },
  two: {
    irregularPlurals: Fa,
    models: Ka,
    suffixPatterns: sf,
    prefixPatterns: uf,
    endsWith: cf,
    neighbours: lf,
    regexNormal: Af,
    regexText: Cf,
    regexNumbers: Nf,
    switches: Hn,
    clues: tt,
    uncountable: {},
    orgWords: xf,
    placeWords: jf
  }
};
Fn = np(Fn);
const rp = function(e, t, n, r) {
  const o = r.methods.one.setTag;
  if (e.length >= 3) {
    const a = /:/;
    if (e[0].post.match(a)) {
      const s = e[1];
      if (s.tags.has("Value") || s.tags.has("Email") || s.tags.has("PhoneNumber"))
        return;
      o([e[0]], "Expression", r, null, "2-punct-colon''");
    }
  }
}, op = function(e, t, n, r) {
  const o = r.methods.one.setTag;
  e[t].post === "-" && e[t + 1] && o([e[t], e[t + 1]], "Hyphenated", r, null, "1-punct-hyphen''");
}, lo = /^(under|over|mis|re|un|dis|semi)-?/, ap = function(e, t, n) {
  const r = n.two.switches, o = e[t];
  if (r.hasOwnProperty(o.normal)) {
    o.switch = r[o.normal];
    return;
  }
  if (lo.test(o.normal)) {
    const a = o.normal.replace(lo, "");
    a.length > 3 && r.hasOwnProperty(a) && (o.switch = r[a]);
  }
}, ip = (e, t, n = "") => {
  const r = (i) => "\x1B[33m\x1B[3m" + i + "\x1B[0m", o = (i) => "\x1B[3m" + i + "\x1B[0m", a = e.text || "[" + e.implicit + "]";
  typeof t != "string" && t.length > 2 && (t = t.slice(0, 2).join(", #") + " +"), t = typeof t != "string" ? t.join(", #") : t, console.log(` ${r(a).padEnd(24)} \x1B[32m→\x1B[0m #${t.padEnd(22)}  ${o(n)}`);
}, E = function(e, t, n) {
  if (!t || t.length === 0 || e.frozen === !0)
    return;
  const r = typeof process > "u" || !process.env ? self.env || {} : process.env;
  r && r.DEBUG_TAGS && ip(e, t, n), e.tags = e.tags || /* @__PURE__ */ new Set(), typeof t == "string" ? e.tags.add(t) : t.forEach((o) => e.tags.add(o));
}, sp = [
  "Acronym",
  "Abbreviation",
  "ProperNoun",
  "Uncountable",
  "Possessive",
  "Pronoun",
  "Activity",
  "Honorific",
  "Month"
], up = function(e) {
  !e.tags.has("Noun") || e.tags.has("Plural") || e.tags.has("Singular") || sp.find((t) => e.tags.has(t)) || (Ra(e.normal) ? E(e, "Plural", "3-plural-guess") : E(e, "Singular", "3-singular-guess"));
}, cp = function(e) {
  const t = e.tags;
  if (t.has("Verb") && t.size === 1) {
    const n = Ja(e.normal);
    n && E(e, n, "3-verb-tense-guess");
  }
}, wt = function(e, t, n) {
  const r = e[t], o = Array.from(r.tags);
  for (let a = 0; a < o.length; a += 1)
    if (n.one.tagSet[o[a]]) {
      const i = n.one.tagSet[o[a]].parents;
      E(r, i, ` -inferred by #${o[a]}`);
    }
  up(r), cp(r);
}, lp = new RegExp("^\\p{Lu}[\\p{Ll}'’]", "u"), hp = /[0-9]/, dp = ["Date", "Month", "WeekDay", "Unit", "Expression"], fp = /[IVX]/, pp = /^[IVXLCDM]{2,}$/, gp = /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/, mp = {
  li: !0,
  dc: !0,
  md: !0,
  dm: !0,
  ml: !0
}, yp = function(e, t, n) {
  const r = e[t];
  r.index = r.index || [0, 0];
  const o = r.index[1], a = r.text || "";
  return o !== 0 && lp.test(a) === !0 && hp.test(a) === !1 ? dp.find((i) => r.tags.has(i)) || r.pre.match(/["']$/) || r.normal === "the" ? null : (wt(e, t, n), !r.tags.has("Noun") && !r.frozen && r.tags.clear(), E(r, "ProperNoun", "2-titlecase"), !0) : a.length >= 2 && pp.test(a) && fp.test(a) && gp.test(a) && !mp[r.normal] ? (E(r, "RomanNumeral", "2-xvii"), !0) : null;
}, ho = function(e = "", t = []) {
  const n = e.length;
  let r = 7;
  n <= r && (r = n - 1);
  for (let o = r; o > 1; o -= 1) {
    const a = e.substring(n - o, n);
    if (t[a.length].hasOwnProperty(a) === !0)
      return t[a.length][a];
  }
  return null;
}, bp = function(e, t, n) {
  const r = e[t];
  if (r.tags.size === 0) {
    let o = ho(r.normal, n.two.suffixPatterns);
    if (o !== null)
      return E(r, o, "2-suffix"), r.confidence = 0.7, !0;
    if (r.implicit && (o = ho(r.implicit, n.two.suffixPatterns), o !== null))
      return E(r, o, "2-implicit-suffix"), r.confidence = 0.7, !0;
  }
  return null;
}, fo = /['‘’‛‵′`´]/, cn = function(e, t) {
  for (let n = 0; n < t.length; n += 1)
    if (t[n][0].test(e) === !0)
      return t[n];
  return null;
}, vp = function(e = "", t) {
  const n = e[e.length - 1];
  if (t.hasOwnProperty(n) === !0) {
    const r = t[n] || [];
    for (let o = 0; o < r.length; o += 1)
      if (r[o][0].test(e) === !0)
        return r[o];
  }
  return null;
}, wp = function(e, t, n, r) {
  const o = r.methods.one.setTag, { regexText: a, regexNormal: i, regexNumbers: s, endsWith: u } = n.two, l = e[t], c = l.machine || l.normal;
  let h = l.text;
  fo.test(l.post) && !fo.test(l.pre) && (h += l.post.trim());
  let f = cn(h, a) || cn(c, i);
  return !f && /[0-9]/.test(c) && (f = cn(c, s)), !f && l.tags.size === 0 && (f = vp(c, u)), f ? (o([l], f[1], r, null, `2-regex-'${f[2] || f[0]}'`), l.confidence = 0.6, !0) : null;
}, Pp = function(e = "", t = []) {
  const n = e.length;
  let r = 7;
  r > n - 3 && (r = n - 3);
  for (let o = r; o > 2; o -= 1) {
    const a = e.substring(0, o);
    if (t[a.length].hasOwnProperty(a) === !0)
      return t[a.length][a];
  }
  return null;
}, kp = function(e, t, n) {
  const r = e[t];
  if (r.tags.size === 0) {
    const o = Pp(r.normal, n.two.prefixPatterns);
    if (o !== null)
      return E(r, o, "2-prefix"), r.confidence = 0.5, !0;
  }
  return null;
}, Ap = 1400, Cp = 2100, Np = /* @__PURE__ */ new Set([
  "in",
  "on",
  "by",
  "until",
  "for",
  "to",
  "during",
  "throughout",
  "through",
  "within",
  "before",
  "after",
  "of",
  "this",
  "next",
  "last",
  "circa",
  "around",
  "post",
  "pre",
  "budget",
  "classic",
  "plan",
  "may"
]), po = function(e) {
  if (!e)
    return !1;
  const t = e.normal || e.implicit;
  return !!(Np.has(t) || e.tags.has("Date") || e.tags.has("Month") || e.tags.has("WeekDay") || e.tags.has("Year") || e.tags.has("ProperNoun"));
}, go = function(e) {
  return e ? !!(e.tags.has("Ordinal") || e.tags.has("Cardinal") && e.normal.length < 3 || e.normal === "is" || e.normal === "was") : !1;
}, mo = function(e) {
  return e && (e.tags.has("Date") || e.tags.has("Month") || e.tags.has("WeekDay") || e.tags.has("Year"));
}, xp = function(e, t) {
  const n = e[t];
  if (n.tags.has("NumericValue") && n.tags.has("Cardinal") && n.normal.length === 4) {
    const r = Number(n.normal);
    if (r && !isNaN(r) && r > Ap && r < Cp) {
      const o = e[t - 1], a = e[t + 1];
      if (po(o) || po(a))
        return E(n, "Year", "2-tagYear");
      if (r >= 1920 && r < 2025) {
        if (go(o) || go(a))
          return E(n, "Year", "2-tagYear-close");
        if (mo(e[t - 2]) || mo(e[t + 2]))
          return E(n, "Year", "2-tagYear-far");
        if (o && (o.tags.has("Determiner") || o.tags.has("Possessive")) && a && a.tags.has("Noun") && !a.tags.has("Plural"))
          return E(n, "Year", "2-tagYear-noun");
      }
    }
  }
  return null;
}, jp = function(e, t, n, r) {
  const o = r.methods.one.setTag, a = e[t], i = ["PastTense", "PresentTense", "Auxiliary", "Modal", "Particle"];
  a.tags.has("Verb") && (i.find((u) => a.tags.has(u)) || o([a], "Infinitive", r, null, "2-verb-type''"));
}, _a = /^[A-Z]('s|,)?$/, Za = /^[A-Z-]+$/, Xa = /^[A-Z]+s$/, Tp = /([A-Z]\.)+[A-Z]?,?$/, Ip = /[A-Z]{2,}('s|,)?$/, $p = /([a-z]\.)+[a-z]\.?$/, Ya = {
  I: !0,
  A: !0
}, Dp = {
  la: !0,
  ny: !0,
  us: !0,
  dc: !0,
  gb: !0
}, Hp = function(e, t) {
  let n = e.text;
  if (Za.test(n) === !1)
    if (n.length > 3 && Xa.test(n) === !0)
      n = n.replace(/s$/, "");
    else
      return !1;
  return n.length > 5 || Ya.hasOwnProperty(n) || t.one.lexicon.hasOwnProperty(e.normal) ? !1 : Tp.test(n) === !0 || $p.test(n) === !0 || _a.test(n) === !0 || Ip.test(n) === !0;
}, Ep = function(e, t, n) {
  const r = e[t];
  return r.tags.has("RomanNumeral") || r.tags.has("Acronym") || r.frozen ? null : Hp(r, n) ? (r.tags.clear(), E(r, ["Acronym", "Noun"], "3-no-period-acronym"), Dp[r.normal] === !0 && E(r, "Place", "3-place-acronym"), Xa.test(r.text) === !0 && E(r, "Plural", "3-plural-acronym"), !0) : !Ya.hasOwnProperty(r.text) && _a.test(r.text) ? (r.tags.clear(), E(r, ["Acronym", "Noun"], "3-one-letter-acronym"), !0) : r.tags.has("Organization") && r.text.length <= 3 ? (E(r, "Acronym", "3-org-acronym"), !0) : r.tags.has("Organization") && Za.test(r.text) && r.text.length <= 6 ? (E(r, "Acronym", "3-titlecase-acronym"), !0) : null;
}, yo = function(e, t) {
  if (!e)
    return null;
  const n = t.find((r) => e.normal === r[0]);
  return n ? n[1] : null;
}, bo = function(e, t) {
  if (!e)
    return null;
  const n = t.find((r) => e.tags.has(r[0]));
  return n ? n[1] : null;
}, Gp = function(e, t, n) {
  const { leftTags: r, leftWords: o, rightWords: a, rightTags: i } = n.two.neighbours, s = e[t];
  if (s.tags.size === 0) {
    let u = null;
    if (u = u || yo(e[t - 1], o), u = u || yo(e[t + 1], a), u = u || bo(e[t - 1], r), u = u || bo(e[t + 1], i), u)
      return E(s, u, "3-[neighbour]"), wt(e, t, n), e[t].confidence = 0.2, !0;
  }
  return null;
}, Op = (e) => new RegExp("^\\p{Lu}[\\p{Ll}'’]", "u").test(e), vo = function(e, t, n) {
  return !e || e.tags.has("FirstName") || e.tags.has("Place") ? !1 : e.tags.has("ProperNoun") || e.tags.has("Organization") || e.tags.has("Acronym") ? !0 : !n && Op(e.text) ? t === 0 ? e.tags.has("Singular") : !0 : !1;
}, Fp = function(e, t, n, r) {
  const o = n.model.two.orgWords, a = n.methods.one.setTag, i = e[t], s = i.machine || i.normal;
  if (o[s] === !0 && vo(e[t - 1], t - 1, r)) {
    a([e[t]], "Organization", n, null, "3-[org-word]");
    for (let u = t; u >= 0 && vo(e[u], u, r); u -= 1)
      a([e[u]], "Organization", n, null, "3-[org-word]");
  }
  return null;
}, zp = (e) => new RegExp("^\\p{Lu}[\\p{Ll}'’]", "u").test(e), Vp = /'s$/, wo = /* @__PURE__ */ new Set([
  "athletic",
  "city",
  "community",
  "eastern",
  "federal",
  "financial",
  "great",
  "historic",
  "historical",
  "local",
  "memorial",
  "municipal",
  "national",
  "northern",
  "provincial",
  "southern",
  "state",
  "western",
  "spring",
  "pine",
  "sunset",
  "view",
  "oak",
  "maple",
  "spruce",
  "cedar",
  "willow"
]), Bp = /* @__PURE__ */ new Set(["center", "centre", "way", "range", "bar", "bridge", "field", "pit"]), Po = function(e, t, n) {
  if (!e)
    return !1;
  const r = e.tags;
  return r.has("Organization") || r.has("Possessive") || Vp.test(e.normal) ? !1 : r.has("ProperNoun") || r.has("Place") ? !0 : !n && zp(e.text) ? t === 0 ? r.has("Singular") : !0 : !1;
}, Sp = function(e, t, n, r) {
  const o = n.model.two.placeWords, a = n.methods.one.setTag, i = e[t], s = i.machine || i.normal;
  if (o[s] === !0) {
    for (let u = t - 1; u >= 0; u -= 1)
      if (!wo.has(e[u].normal)) {
        if (Po(e[u], u, r)) {
          a(e.slice(u, t + 1), "Place", n, null, "3-[place-of-foo]");
          continue;
        }
        break;
      }
    if (Bp.has(s))
      return !1;
    for (let u = t + 1; u < e.length; u += 1) {
      if (Po(e[u], u, r))
        return a(e.slice(t, u + 1), "Place", n, null, "3-[foo-place]"), !0;
      if (!(e[u].normal === "of" || wo.has(e[u].normal)))
        break;
    }
  }
  return null;
}, Mp = function(e, t, n) {
  let r = !1;
  const o = e[t].tags;
  (o.size === 0 || o.size === 1 && (o.has("Hyphenated") || o.has("HashTag") || o.has("Prefix") || o.has("SlashedTerm"))) && (r = !0), r && (E(e[t], "Noun", "3-[fallback]"), wt(e, t, n), e[t].confidence = 0.1);
}, Lp = /^[A-Z][a-z]/, ue = (e, t) => e[t].tags.has("ProperNoun") && Lp.test(e[t].text) ? "Noun" : null, ko = (e, t, n) => t === 0 && !e[1] ? n : null, Kp = function(e, t) {
  return !e[t + 1] && e[t - 1] && e[t - 1].tags.has("Determiner") ? "Noun" : null;
}, Wp = function(e, t, n) {
  return t === 0 && e.length > 3 ? n : null;
}, Ao = {
  "Adj|Gerund": (e, t) => ue(e, t),
  "Adj|Noun": (e, t) => ue(e, t) || Kp(e, t),
  "Actor|Verb": (e, t) => ue(e, t),
  "Adj|Past": (e, t) => ue(e, t),
  "Adj|Present": (e, t) => ue(e, t),
  "Noun|Gerund": (e, t) => ue(e, t),
  "Noun|Verb": (e, t) => t > 0 && ue(e, t) || ko(e, t, "Infinitive"),
  "Plural|Verb": (e, t) => ue(e, t) || ko(e, t, "PresentTense") || Wp(e, t, "Plural"),
  "Person|Noun": (e, t) => ue(e, t),
  "Person|Verb": (e, t) => t !== 0 ? ue(e, t) : null,
  "Person|Adj": (e, t) => t === 0 && e.length > 1 || ue(e, t) ? "Person" : null
}, er = typeof process > "u" || !process.env ? self.env || {} : process.env, Co = /^(under|over|mis|re|un|dis|semi)-?/, No = (e, t) => {
  if (!e || !t)
    return null;
  const n = e.normal || e.implicit;
  let r = null;
  return t.hasOwnProperty(n) && (r = t[n]), r && er.DEBUG_TAGS && console.log(`
  \x1B[2m\x1B[3m     ↓ - '${n}' \x1B[0m`), r;
}, xo = (e, t = {}, n) => {
  if (!e || !t)
    return null;
  let o = Array.from(e.tags).sort((a, i) => {
    const s = n[a] ? n[a].parents.length : 0, u = n[i] ? n[i].parents.length : 0;
    return s > u ? -1 : 1;
  }).find((a) => t[a]);
  return o && er.DEBUG_TAGS && console.log(`  \x1B[2m\x1B[3m      ↓ - '${e.normal || e.implicit}' (#${o})  \x1B[0m`), o = t[o], o;
}, Jp = function(e, t, n, r) {
  var s;
  if (!n)
    return null;
  const o = ((s = e[t - 1]) == null ? void 0 : s.text) !== "also" ? t - 1 : Math.max(0, t - 2), a = r.one.tagSet;
  let i = No(e[t + 1], n.afterWords);
  return i = i || No(e[o], n.beforeWords), i = i || xo(e[o], n.beforeTags, a), i = i || xo(e[t + 1], n.afterTags, a), i;
}, Up = function(e, t, n) {
  const r = n.model, o = n.methods.one.setTag, { switches: a, clues: i } = r.two, s = e[t];
  let u = s.normal || s.implicit || "";
  if (Co.test(u) && !a[u] && (u = u.replace(Co, "")), s.switch) {
    const l = s.switch;
    if (s.tags.has("Acronym") || s.tags.has("PhrasalVerb"))
      return;
    let c = Jp(e, t, i[l], r);
    Ao[l] && (c = Ao[l](e, t) || c), c ? (o([s], c, n, null, `3-[switch] (${l})`), wt(e, t, r)) : er.DEBUG_TAGS && console.log(`
 -> X  - '${u}'  : (${l})  `);
  }
}, qp = {
  there: !0,
  //go there
  this: !0,
  //try this
  it: !0,
  //do it
  him: !0,
  her: !0,
  us: !0
  //tell us
}, Rp = function(e, t) {
  const n = t.methods.one.setTag, r = t.model.one._multiCache || {}, o = e[0];
  if ((o.switch === "Noun|Verb" || o.tags.has("Infinitive")) && e.length >= 2) {
    if (e.length < 4 && !qp[e[1].normal] || !o.tags.has("PhrasalVerb") && r.hasOwnProperty(o.normal))
      return;
    (e[1].tags.has("Noun") || e[1].tags.has("Determiner")) && (!e.slice(1, 3).some((u) => u.tags.has("Verb")) || o.tags.has("#PhrasalVerb")) && n([o], "Imperative", t, null, "3-[imperative]");
  }
}, Qp = function(e) {
  if (e.filter((n) => !n.tags.has("ProperNoun")).length <= 3)
    return !1;
  const t = /^[a-z]/;
  return e.every((n) => !t.test(n.text));
}, _p = function(e, t, n) {
  e.forEach((r) => {
    rp(r, 0, t, n);
  });
}, Zp = function(e, t, n, r) {
  for (let o = 0; o < e.length; o += 1)
    e[o].frozen !== !0 && (ap(e, o, t), r === !1 && yp(e, o, t), bp(e, o, t), wp(e, o, t, n), kp(e, o, t), xp(e, o));
}, Xp = function(e, t, n, r) {
  for (let o = 0; o < e.length; o += 1) {
    let a = Ep(e, o, t);
    wt(e, o, t), a = a || Gp(e, o, t), a = a || Mp(e, o, t);
  }
  for (let o = 0; o < e.length; o += 1)
    e[o].frozen !== !0 && (Fp(e, o, n, r), Sp(e, o, n, r), Up(e, o, n), jp(e, o, t, n), op(e, o, t, n));
  Rp(e, n);
}, Yp = function(e) {
  const { methods: t, model: n, world: r } = e, o = e.docs;
  _p(o, n, r);
  const a = t.two.quickSplit(o);
  for (let i = 0; i < a.length; i += 1) {
    const s = a[i], u = Qp(s);
    Zp(s, n, r, u), Xp(s, n, r, u);
  }
  return a;
}, jo = {
  // 'spencer's' -> 'spencer'
  Possessive: (e) => {
    let t = e.machine || e.normal || e.text;
    return t = t.replace(/'s$/, ""), t;
  },
  // 'drinks' -> 'drink'
  Plural: (e, t) => {
    const n = e.machine || e.normal || e.text;
    return t.methods.two.transform.noun.toSingular(n, t.model);
  },
  // ''
  Copula: () => "is",
  // 'walked' -> 'walk'
  PastTense: (e, t) => {
    const n = e.machine || e.normal || e.text;
    return t.methods.two.transform.verb.toInfinitive(n, t.model, "PastTense");
  },
  // 'walking' -> 'walk'
  Gerund: (e, t) => {
    const n = e.machine || e.normal || e.text;
    return t.methods.two.transform.verb.toInfinitive(n, t.model, "Gerund");
  },
  // 'walks' -> 'walk'
  PresentTense: (e, t) => {
    const n = e.machine || e.normal || e.text;
    return e.tags.has("Infinitive") ? n : t.methods.two.transform.verb.toInfinitive(n, t.model, "PresentTense");
  },
  // 'quieter' -> 'quiet'
  Comparative: (e, t) => {
    const n = e.machine || e.normal || e.text;
    return t.methods.two.transform.adjective.fromComparative(n, t.model);
  },
  // 'quietest' -> 'quiet'
  Superlative: (e, t) => {
    const n = e.machine || e.normal || e.text;
    return t.methods.two.transform.adjective.fromSuperlative(n, t.model);
  },
  // 'suddenly' -> 'sudden'
  Adverb: (e, t) => {
    const { fromAdverb: n } = t.methods.two.transform.adjective, r = e.machine || e.normal || e.text;
    return n(r);
  }
}, eg = function(e) {
  const t = e.world, n = Object.keys(jo);
  e.docs.forEach((r) => {
    for (let o = 0; o < r.length; o += 1) {
      const a = r[o];
      for (let i = 0; i < n.length; i += 1)
        if (a.tags.has(n[i])) {
          const s = jo[n[i]], u = s(a, t);
          a.normal !== u && (a.root = u);
          break;
        }
    }
  });
}, To = {
  // adverbs
  // 'Comparative': 'RBR',
  // 'Superlative': 'RBS',
  Adverb: "RB",
  // adjectives
  Comparative: "JJR",
  Superlative: "JJS",
  Adjective: "JJ",
  TO: "Conjunction",
  // verbs
  Modal: "MD",
  Auxiliary: "MD",
  Gerund: "VBG",
  //throwing
  PastTense: "VBD",
  //threw
  Participle: "VBN",
  //thrown
  PresentTense: "VBZ",
  //throws
  Infinitive: "VB",
  //throw
  Particle: "RP",
  //phrasal particle
  Verb: "VB",
  // throw
  // pronouns
  Pronoun: "PRP",
  // misc
  Cardinal: "CD",
  Conjunction: "CC",
  Determiner: "DT",
  Preposition: "IN",
  // 'Determiner': 'WDT',
  // 'Expression': 'FW',
  QuestionWord: "WP",
  Expression: "UH",
  //nouns
  Possessive: "POS",
  ProperNoun: "NNP",
  Person: "NNP",
  Place: "NNP",
  Organization: "NNP",
  Singular: "NN",
  Plural: "NNS",
  Noun: "NN",
  There: "EX"
  //'there'
  // 'Adverb':'WRB',
  // 'Noun':'PDT', //predeterminer
  // 'Noun':'SYM', //symbol
  // 'Noun':'NFP', //
  //  WDT 	Wh-determiner
  // 	WP 	Wh-pronoun
  // 	WP$ 	Possessive wh-pronoun
  // 	WRB 	Wh-adverb
}, tg = function(e) {
  if (e.tags.has("ProperNoun") && e.tags.has("Plural"))
    return "NNPS";
  if (e.tags.has("Possessive") && e.tags.has("Pronoun"))
    return "PRP$";
  if (e.normal === "there")
    return "EX";
  if (e.normal === "to")
    return "TO";
  const t = e.tagRank || [];
  for (let n = 0; n < t.length; n += 1)
    if (To.hasOwnProperty(t[n]))
      return To[t[n]];
  return null;
}, ng = function(e) {
  e.compute("tagRank"), e.docs.forEach((t) => {
    t.forEach((n) => {
      n.penn = tg(n);
    });
  });
}, rg = { preTagger: Yp, root: eg, penn: ng }, ln = ["Person", "Place", "Organization"], og = {
  Noun: {
    not: ["Verb", "Adjective", "Adverb", "Value", "Determiner"]
  },
  Singular: {
    is: "Noun",
    not: ["Plural", "Uncountable"]
  },
  // 'Canada'
  ProperNoun: {
    is: "Noun"
  },
  Person: {
    is: "Singular",
    also: ["ProperNoun"],
    not: ["Place", "Organization", "Date"]
  },
  FirstName: {
    is: "Person"
  },
  MaleName: {
    is: "FirstName",
    not: ["FemaleName", "LastName"]
  },
  FemaleName: {
    is: "FirstName",
    not: ["MaleName", "LastName"]
  },
  LastName: {
    is: "Person",
    not: ["FirstName"]
  },
  // 'dr.'
  Honorific: {
    is: "Person",
    not: ["FirstName", "LastName", "Value"]
  },
  Place: {
    is: "Singular",
    not: ["Person", "Organization"]
  },
  Country: {
    is: "Place",
    also: ["ProperNoun"],
    not: ["City"]
  },
  City: {
    is: "Place",
    also: ["ProperNoun"],
    not: ["Country"]
  },
  // 'california'
  Region: {
    is: "Place",
    also: ["ProperNoun"]
  },
  Address: {
    // is: 'Place',
  },
  Organization: {
    is: "ProperNoun",
    not: ["Person", "Place"]
  },
  SportsTeam: {
    is: "Organization"
  },
  School: {
    is: "Organization"
  },
  Company: {
    is: "Organization"
  },
  Plural: {
    is: "Noun",
    not: ["Singular", "Uncountable"]
  },
  // 'gravity'
  Uncountable: {
    is: "Noun"
  },
  // 'it'
  Pronoun: {
    is: "Noun",
    not: ln
  },
  // 'swimmer'
  Actor: {
    is: "Noun",
    not: ["Place", "Organization"]
  },
  // walking
  Activity: {
    is: "Noun",
    not: ["Person", "Place"]
  },
  // kilometres
  Unit: {
    is: "Noun",
    not: ln
  },
  // canadian
  Demonym: {
    is: "Noun",
    also: ["ProperNoun"],
    not: ln
  },
  // [spencer's] hat
  Possessive: {
    is: "Noun"
  },
  // 'yourself'
  Reflexive: {
    is: "Pronoun"
  }
}, ag = {
  Verb: {
    not: ["Noun", "Adjective", "Adverb", "Value", "Expression"]
  },
  // 'he [walks]'
  PresentTense: {
    is: "Verb",
    not: ["PastTense", "FutureTense"]
  },
  // 'will [walk]'
  Infinitive: {
    is: "PresentTense",
    not: ["Gerund"]
  },
  // '[walk] now!'
  Imperative: {
    is: "Verb",
    not: ["PastTense", "Gerund", "Copula"]
  },
  // walking
  Gerund: {
    is: "PresentTense",
    not: ["Copula"]
  },
  // walked
  PastTense: {
    is: "Verb",
    not: ["PresentTense", "Gerund", "FutureTense"]
  },
  // will walk
  FutureTense: {
    is: "Verb",
    not: ["PresentTense", "PastTense"]
  },
  // is/was
  Copula: {
    is: "Verb"
  },
  // '[could] walk'
  Modal: {
    is: "Verb",
    not: ["Infinitive"]
  },
  // 'awaken'
  Participle: {
    is: "PastTense"
  },
  // '[will have had] walked'
  Auxiliary: {
    is: "Verb",
    not: ["PastTense", "PresentTense", "Gerund", "Conjunction"]
  },
  // 'walk out'
  PhrasalVerb: {
    is: "Verb"
  },
  // 'walk [out]'
  Particle: {
    is: "PhrasalVerb",
    not: ["PastTense", "PresentTense", "Copula", "Gerund"]
  },
  // 'walked by'
  Passive: {
    is: "Verb"
  }
}, ig = {
  Value: {
    not: ["Verb", "Adjective", "Adverb"]
  },
  Ordinal: {
    is: "Value",
    not: ["Cardinal"]
  },
  Cardinal: {
    is: "Value",
    not: ["Ordinal"]
  },
  Fraction: {
    is: "Value",
    not: ["Noun"]
  },
  Multiple: {
    is: "TextValue"
  },
  RomanNumeral: {
    is: "Cardinal",
    not: ["TextValue"]
  },
  TextValue: {
    is: "Value",
    not: ["NumericValue"]
  },
  NumericValue: {
    is: "Value",
    not: ["TextValue"]
  },
  Money: {
    is: "Cardinal"
  },
  Percent: {
    is: "Value"
  }
}, sg = {
  Date: {
    not: ["Verb", "Adverb", "Adjective"]
  },
  Month: {
    is: "Date",
    also: ["Noun"],
    not: ["Year", "WeekDay", "Time"]
  },
  WeekDay: {
    is: "Date",
    also: ["Noun"]
  },
  Year: {
    is: "Date",
    not: ["RomanNumeral"]
  },
  FinancialQuarter: {
    is: "Date",
    not: "Fraction"
  },
  // 'easter'
  Holiday: {
    is: "Date",
    also: ["Noun"]
  },
  // 'summer'
  Season: {
    is: "Date"
  },
  Timezone: {
    is: "Date",
    also: ["Noun"],
    not: ["ProperNoun"]
  },
  Time: {
    is: "Date",
    not: ["AtMention"]
  },
  // 'months'
  Duration: {
    is: "Date",
    also: ["Noun"]
  }
}, ug = ["Noun", "Verb", "Adjective", "Adverb", "Value", "QuestionWord"], cg = {
  Adjective: {
    not: ["Noun", "Verb", "Adverb", "Value"]
  },
  Comparable: {
    is: "Adjective"
  },
  Comparative: {
    is: "Adjective"
  },
  Superlative: {
    is: "Adjective",
    not: ["Comparative"]
  },
  NumberRange: {},
  Adverb: {
    not: ["Noun", "Verb", "Adjective", "Value"]
  },
  Determiner: {
    not: ["Noun", "Verb", "Adjective", "Adverb", "QuestionWord", "Conjunction"]
    //allow 'a' to be a Determiner/Value
  },
  Conjunction: {
    not: ug
  },
  Preposition: {
    not: ["Noun", "Verb", "Adjective", "Adverb", "QuestionWord", "Determiner"]
  },
  QuestionWord: {
    not: ["Determiner"]
  },
  Currency: {
    is: "Noun"
  },
  Expression: {
    not: ["Noun", "Adjective", "Verb", "Adverb"]
  },
  Abbreviation: {},
  Url: {
    not: ["HashTag", "PhoneNumber", "Verb", "Adjective", "Value", "AtMention", "Email", "SlashedTerm"]
  },
  PhoneNumber: {
    not: ["HashTag", "Verb", "Adjective", "Value", "AtMention", "Email"]
  },
  HashTag: {},
  AtMention: {
    is: "Noun",
    not: ["HashTag", "Email"]
  },
  Emoji: {
    not: ["HashTag", "Verb", "Adjective", "Value", "AtMention"]
  },
  Emoticon: {
    not: ["HashTag", "Verb", "Adjective", "Value", "AtMention", "SlashedTerm"]
  },
  SlashedTerm: {
    not: ["Emoticon", "Url", "Value"]
  },
  Email: {
    not: ["HashTag", "Verb", "Adjective", "Value", "AtMention"]
  },
  Acronym: {
    not: ["Plural", "RomanNumeral", "Pronoun", "Date"]
  },
  Negative: {
    not: ["Noun", "Adjective", "Value", "Expression"]
  },
  Condition: {
    not: ["Verb", "Adjective", "Noun", "Value"]
  },
  // existential 'there'
  There: {
    not: ["Verb", "Adjective", "Noun", "Value", "Conjunction", "Preposition"]
  },
  // 'co-wrote'
  Prefix: {
    not: ["Abbreviation", "Acronym", "ProperNoun"]
  },
  // hard-nosed, bone-headed
  Hyphenated: {}
}, lg = Object.assign({}, og, ag, ig, sg, cg), hg = {
  compute: rg,
  methods: Gn,
  model: Fn,
  tags: lg,
  hooks: ["preTagger"]
}, dg = /[,)"';:\-–—.…]/, ve = function(e, t) {
  if (!e.found)
    return;
  const n = e.termList();
  for (let r = 0; r < n.length - 1; r++) {
    const o = n[r];
    if (dg.test(o.post))
      return;
  }
  n[0].implicit = n[0].normal, n[0].text += t, n[0].normal += t, n.slice(1).forEach((r) => {
    r.implicit = r.normal, r.text = "", r.normal = "";
  });
  for (let r = 0; r < n.length - 1; r++)
    n[r].post = n[r].post.replace(/ /, "");
}, fg = function() {
  const e = this.not("@hasContraction");
  let t = e.match("(we|they|you) are");
  return ve(t, "'re"), t = e.match("(he|she|they|it|we|you) will"), ve(t, "'ll"), t = e.match("(he|she|they|it|we) is"), ve(t, "'s"), t = e.match("#Person is"), ve(t, "'s"), t = e.match("#Person would"), ve(t, "'d"), t = e.match("(is|was|had|would|should|could|do|does|have|has|can) not"), ve(t, "n't"), t = e.match("(i|we|they) have"), ve(t, "'ve"), t = e.match("(would|should|could) have"), ve(t, "'ve"), t = e.match("i am"), ve(t, "'m"), t = e.match("going to"), this;
}, pg = new RegExp("^\\p{Lu}[\\p{Ll}'’]", "u"), gg = function(e = "") {
  return e = e.replace(/^ *[a-z\u00C0-\u00FF]/, (t) => t.toUpperCase()), e;
}, mg = function(e) {
  class t extends e {
    constructor(r, o, a) {
      super(r, o, a), this.viewType = "Contraction";
    }
    /** i've -> 'i have' */
    expand() {
      return this.docs.forEach((r) => {
        const o = pg.test(r[0].text);
        r.forEach((a, i) => {
          a.text = a.implicit || "", delete a.implicit, i < r.length - 1 && a.post === "" && (a.post += " "), a.dirty = !0;
        }), o && (r[0].text = gg(r[0].text));
      }), this.compute("normal"), this;
    }
  }
  e.prototype.contractions = function() {
    const n = this.match("@hasContraction+");
    return new t(this.document, n.pointer);
  }, e.prototype.contract = fg;
}, yg = function(e, t, n) {
  const [r, o] = t;
  !n || n.length === 0 || (n = n.map((a, i) => (a.implicit = a.text, a.machine = a.text, a.pre = "", a.post = "", a.text = "", a.normal = "", a.index = [r, o + i], a)), n[0] && (n[0].pre = e[r][o].pre, n[n.length - 1].post = e[r][o].post, n[0].text = e[r][o].text, n[0].normal = e[r][o].normal), e[r].splice(o, 1, ...n));
}, bg = /'/, vg = /* @__PURE__ */ new Set([
  "been",
  //the meeting's been ..
  "become"
  //my son's become
]), wg = /* @__PURE__ */ new Set([
  "what",
  //it's what
  "how",
  //it's how
  "when",
  "if",
  //it's if
  "too"
]), Pg = /* @__PURE__ */ new Set(["too", "also", "enough"]), kg = (e, t) => {
  for (let n = t + 1; n < e.length; n += 1) {
    const r = e[n];
    if (vg.has(r.normal))
      return "has";
    if (wg.has(r.normal) || r.tags.has("Gerund") || r.tags.has("Determiner") || r.tags.has("Adjective") || r.switch === "Adj|Past" && e[n + 1] && (Pg.has(e[n + 1].normal) || e[n + 1].tags.has("Preposition")))
      return "is";
    if (r.tags.has("PastTense"))
      return e[n + 1] && e[n + 1].normal === "for" ? "is" : "has";
  }
  return "is";
}, Ag = function(e, t) {
  const n = e[t].normal.split(bg)[0];
  if (n === "let")
    return [n, "us"];
  if (n === "there") {
    const r = e[t + 1];
    if (r && r.tags.has("Plural"))
      return [n, "are"];
  }
  return kg(e, t) === "has" ? [n, "has"] : [n, "is"];
}, Cg = /'/, Ng = /* @__PURE__ */ new Set([
  "better",
  //had better
  "done",
  //had done
  "before",
  // he'd _ before
  "it",
  // he'd _ it
  "had"
  //she'd had -> she would have..
]), xg = /* @__PURE__ */ new Set([
  "have",
  // 'i'd have' -> i would have..
  "be"
  //' she'd be'
]), jg = (e, t) => {
  for (let n = t + 1; n < e.length; n += 1) {
    const r = e[n];
    if (Ng.has(r.normal))
      return "had";
    if (xg.has(r.normal))
      return "would";
    if (r.tags.has("PastTense") || r.switch === "Adj|Past")
      return "had";
    if (r.tags.has("PresentTense") || r.tags.has("Infinitive"))
      return "would";
    if (r.tags.has("#Determiner"))
      return "had";
    if (r.tags.has("Adjective"))
      return "would";
  }
  return !1;
}, Tg = function(e, t) {
  const n = e[t].normal.split(Cg)[0];
  return n === "how" || n === "what" ? [n, "did"] : jg(e, t) === "had" ? [n, "had"] : [n, "would"];
}, Ig = function(e, t) {
  for (let n = t - 1; n >= 0; n -= 1)
    if (e[n].tags.has("Noun") || e[n].tags.has("Pronoun") || e[n].tags.has("Plural") || e[n].tags.has("Singular"))
      return e[n];
  return null;
}, $g = function(e, t) {
  if (e[t].normal === "ain't" || e[t].normal === "aint") {
    if (e[t + 1] && e[t + 1].normal === "never")
      return ["have"];
    const r = Ig(e, t);
    if (r) {
      if (r.normal === "we" || r.normal === "they")
        return ["are", "not"];
      if (r.normal === "i")
        return ["am", "not"];
      if (r.tags && r.tags.has("Plural"))
        return ["are", "not"];
    }
    return ["is", "not"];
  }
  return [e[t].normal.replace(/n't/, ""), "not"];
}, Dg = {
  that: !0,
  there: !0,
  let: !0,
  here: !0,
  everywhere: !0
}, Hg = {
  in: !0,
  //in sunday's
  by: !0,
  //by sunday's
  for: !0
  //for sunday's
}, Eg = /* @__PURE__ */ new Set(["too", "also", "enough", "about"]), Gg = /* @__PURE__ */ new Set(["is", "are", "did", "were", "could", "should", "must", "had", "have"]), Og = (e, t) => {
  const n = e[t];
  if (Dg.hasOwnProperty(n.machine || n.normal))
    return !1;
  if (n.tags.has("Possessive"))
    return !0;
  if (n.tags.has("QuestionWord") || n.normal === "he's" || n.normal === "she's")
    return !1;
  const r = e[t + 1];
  if (!r)
    return !0;
  if (n.normal === "it's")
    return !!r.tags.has("#Noun");
  if (r.switch == "Noun|Gerund") {
    const o = e[t + 2];
    return o ? o.tags.has("Copula") ? !0 : (o.normal === "on" || o.normal === "in", !1) : !!(n.tags.has("Actor") || n.tags.has("ProperNoun"));
  }
  if (r.tags.has("Verb"))
    return r.tags.has("Infinitive") ? !0 : r.tags.has("Gerund") ? !1 : !!r.tags.has("PresentTense");
  if (r.switch === "Adj|Noun") {
    const o = e[t + 2];
    if (!o)
      return !1;
    if (Gg.has(o.normal))
      return !0;
    if (Eg.has(o.normal))
      return !1;
  }
  if (r.tags.has("Noun")) {
    const o = r.machine || r.normal;
    return !(o === "here" || o === "there" || o === "everywhere" || r.tags.has("Possessive") || r.tags.has("ProperNoun") && !n.tags.has("ProperNoun"));
  }
  if (e[t - 1] && Hg[e[t - 1].normal] === !0)
    return !0;
  if (r.tags.has("Adjective")) {
    const o = e[t + 2];
    if (!o)
      return !1;
    if (o.tags.has("Noun") && !o.tags.has("Pronoun")) {
      const a = r.normal;
      return !(a === "above" || a === "below" || a === "behind");
    }
    return o.switch === "Noun|Verb";
  }
  return !!r.tags.has("Value");
}, Io = /'/, Fg = function(e) {
  e.forEach((t, n) => {
    t.index && (t.index[1] = n);
  });
}, zg = function(e, t, n, r) {
  const o = t.update();
  o.document = [e];
  let a = n + r;
  n > 0 && (n -= 1), e[a] && (a += 1), o.ptrs = [[0, n, a]], o.compute(["freeze", "lexicon", "preTagger", "unfreeze"]), Fg(e);
}, $o = {
  // how'd
  d: (e, t) => Tg(e, t),
  // we ain't
  t: (e, t) => $g(e, t),
  // bob's
  s: (e, t, n) => Og(e, t) ? n.methods.one.setTag([e[t]], "Possessive", n, null, "2-contraction") : Ag(e, t)
}, Vg = function(e, t) {
  const n = t.fromText(e.join(" "));
  return n.compute("id"), n.docs[0];
}, Bg = (e) => {
  const { world: t, document: n } = e;
  n.forEach((r, o) => {
    for (let a = r.length - 1; a >= 0; a -= 1) {
      if (r[a].implicit)
        continue;
      let i = null;
      Io.test(r[a].normal) === !0 && (i = r[a].normal.split(Io)[1]);
      let s = null;
      if ($o.hasOwnProperty(i) && (s = $o[i](r, a, t)), s) {
        s = Vg(s, e), yg(n, [o, a], s), zg(n[o], e, a, s.length);
        continue;
      }
    }
  });
}, Sg = { contractionTwo: Bg }, Mg = {
  compute: Sg,
  api: mg,
  hooks: ["contractionTwo"]
}, Lg = [
  // all fell apart
  { match: "[(all|both)] #Determiner #Noun", group: 0, tag: "Noun", reason: "all-noun" },
  //sometimes not-adverbs
  { match: "#Copula [(just|alone)]$", group: 0, tag: "Adjective", reason: "not-adverb" },
  //jack is guarded
  { match: "#Singular is #Adverb? [#PastTense$]", group: 0, tag: "Adjective", reason: "is-filled" },
  // smoked poutine is
  { match: "[#PastTense] #Singular is", group: 0, tag: "Adjective", reason: "smoked-poutine" },
  // baked onions are
  { match: "[#PastTense] #Plural are", group: 0, tag: "Adjective", reason: "baked-onions" },
  // well made
  { match: "well [#PastTense]", group: 0, tag: "Adjective", reason: "well-made" },
  // is f*ed up
  { match: "#Copula [fucked up?]", group: 0, tag: "Adjective", reason: "swears-adjective" },
  //jack seems guarded
  { match: "#Singular (seems|appears) #Adverb? [#PastTense$]", group: 0, tag: "Adjective", reason: "seems-filled" },
  // jury is out - preposition ➔ adjective
  { match: "#Copula #Adjective? [(out|in|through)]$", group: 0, tag: "Adjective", reason: "still-out" },
  // shut the door
  { match: "^[#Adjective] (the|your) #Noun", group: 0, notIf: "(all|even)", tag: "Infinitive", reason: "shut-the" },
  // the said card
  { match: "the [said] #Noun", group: 0, tag: "Adjective", reason: "the-said-card" },
  // faith-based, much-appreciated, soft-boiled
  { match: "[#Hyphenated (#Hyphenated && #PastTense)] (#Noun|#Conjunction)", group: 0, tag: "Adjective", notIf: "#Adverb", reason: "faith-based" },
  //self-driving
  { match: "[#Hyphenated (#Hyphenated && #Gerund)] (#Noun|#Conjunction)", group: 0, tag: "Adjective", notIf: "#Adverb", reason: "self-driving" },
  //dammed-up
  { match: "[#PastTense (#Hyphenated && #PhrasalVerb)] (#Noun|#Conjunction)", group: 0, tag: "Adjective", reason: "dammed-up" },
  //two-fold
  { match: "(#Hyphenated && #Value) fold", tag: "Adjective", reason: "two-fold" },
  //must-win
  { match: "must (#Hyphenated && #Infinitive)", tag: "Adjective", reason: "must-win" },
  // vacuum-sealed
  { match: "(#Hyphenated && #Infinitive) #Hyphenated", tag: "Adjective", notIf: "#PhrasalVerb", reason: "vacuum-sealed" },
  { match: "too much", tag: "Adverb Adjective", reason: "bit-4" },
  { match: "a bit much", tag: "Determiner Adverb Adjective", reason: "bit-3" },
  // adjective-prefixes - 'un skilled'
  { match: "[(un|contra|extra|inter|intra|macro|micro|mid|mis|mono|multi|pre|sub|tri|ex)] #Adjective", group: 0, tag: ["Adjective", "Prefix"], reason: "un-skilled" }
], Kg = "(dark|bright|flat|light|soft|pale|dead|dim|faux|little|wee|sheer|most|near|good|extra|all)", Do = "(hard|fast|late|early|high|right|deep|close|direct)", Wg = [
  // kinda sparkly
  { match: "#Adverb [#Adverb] (and|or|then)", group: 0, tag: "Adjective", reason: "kinda-sparkly-and" },
  // dark green
  { match: `[${Kg}] #Adjective`, group: 0, tag: "Adverb", reason: "dark-green" },
  // far too
  { match: "#Copula [far too] #Adjective", group: 0, tag: "Adverb", reason: "far-too" },
  // was still in
  { match: "#Copula [still] (in|#Gerund|#Adjective)", group: 0, tag: "Adverb", reason: "was-still-walking" },
  // studies hard
  { match: `#Plural ${Do}`, tag: "#PresentTense #Adverb", reason: "studies-hard" },
  // shops direct
  {
    match: `#Verb [${Do}] !#Noun?`,
    group: 0,
    notIf: "(#Copula|get|got|getting|become|became|becoming|feel|feels|feeling|#Determiner|#Preposition)",
    tag: "Adverb",
    reason: "shops-direct"
  },
  // studies a lot
  { match: "[#Plural] a lot", tag: "PresentTense", reason: "studies-a-lot" }
], Jg = [
  //a staggering cost
  // { match: '(a|an) [#Gerund]', group: 0, tag: 'Adjective', reason: 'a|an' },
  //as amusing as
  { match: "as [#Gerund] as", group: 0, tag: "Adjective", reason: "as-gerund-as" },
  // more amusing than
  { match: "more [#Gerund] than", group: 0, tag: "Adjective", reason: "more-gerund-than" },
  // very amusing
  { match: "(so|very|extremely) [#Gerund]", group: 0, tag: "Adjective", reason: "so-gerund" },
  // found it amusing
  { match: "(found|found) it #Adverb? [#Gerund]", group: 0, tag: "Adjective", reason: "found-it-gerund" },
  // a bit amusing
  { match: "a (little|bit|wee) bit? [#Gerund]", group: 0, tag: "Adjective", reason: "a-bit-gerund" },
  // looking annoying
  {
    match: "#Gerund [#Gerund]",
    group: 0,
    tag: "Adjective",
    notIf: "(impersonating|practicing|considering|assuming)",
    reason: "looking-annoying"
  },
  // looked amazing
  {
    match: "(looked|look|looks) #Adverb? [%Adj|Gerund%]",
    group: 0,
    tag: "Adjective",
    notIf: "(impersonating|practicing|considering|assuming)",
    reason: "looked-amazing"
  },
  // were really amazing
  // { match: '(looked|look|looks) #Adverb [%Adj|Gerund%]', group: 0, tag: 'Adjective', notIf: '(impersonating|practicing|considering|assuming)', reason: 'looked-amazing' },
  // developing a
  { match: "[%Adj|Gerund%] #Determiner", group: 0, tag: "Gerund", reason: "developing-a" },
  // world's leading manufacturer
  { match: "#Possessive [%Adj|Gerund%] #Noun", group: 0, tag: "Adjective", reason: "leading-manufacturer" },
  // meaning alluring
  { match: "%Noun|Gerund% %Adj|Gerund%", tag: "Gerund #Adjective", reason: "meaning-alluring" },
  // face shocking revelations
  {
    match: "(face|embrace|reveal|stop|start|resume) %Adj|Gerund%",
    tag: "#PresentTense #Adjective",
    reason: "face-shocking"
  },
  // are enduring symbols
  { match: "(are|were) [%Adj|Gerund%] #Plural", group: 0, tag: "Adjective", reason: "are-enduring-symbols" }
], Ug = [
  //the above is clear
  { match: "#Determiner [#Adjective] #Copula", group: 0, tag: "Noun", reason: "the-adj-is" },
  //real evil is
  { match: "#Adjective [#Adjective] #Copula", group: 0, tag: "Noun", reason: "adj-adj-is" },
  //his fine
  { match: "(his|its) [%Adj|Noun%]", group: 0, tag: "Noun", notIf: "#Hyphenated", reason: "his-fine" },
  //is all
  { match: "#Copula #Adverb? [all]", group: 0, tag: "Noun", reason: "is-all" },
  // have fun
  { match: "(have|had) [#Adjective] #Preposition .", group: 0, tag: "Noun", reason: "have-fun" },
  // brewing giant
  { match: "#Gerund (giant|capital|center|zone|application)", tag: "Noun", reason: "brewing-giant" },
  // in an instant
  { match: "#Preposition (a|an) [#Adjective]$", group: 0, tag: "Noun", reason: "an-instant" },
  // no golden would
  { match: "no [#Adjective] #Modal", group: 0, tag: "Noun", reason: "no-golden" },
  // brand new
  { match: "[brand #Gerund?] new", group: 0, tag: "Adverb", reason: "brand-new" },
  // some kind
  { match: "(#Determiner|#Comparative|new|different) [kind]", group: 0, tag: "Noun", reason: "some-kind" },
  // her favourite sport
  { match: "#Possessive [%Adj|Noun%] #Noun", group: 0, tag: "Adjective", reason: "her-favourite" },
  // must-win
  { match: "must && #Hyphenated .", tag: "Adjective", reason: "must-win" },
  // the present
  {
    match: "#Determiner [#Adjective]$",
    tag: "Noun",
    notIf: "(this|that|#Comparative|#Superlative)",
    reason: "the-south"
  },
  //are that crazy.
  // company-wide
  {
    match: "(#Noun && #Hyphenated) (#Adjective && #Hyphenated)",
    tag: "Adjective",
    notIf: "(this|that|#Comparative|#Superlative)",
    reason: "company-wide"
  },
  // the poor were
  {
    match: "#Determiner [#Adjective] (#Copula|#Determiner)",
    notIf: "(#Comparative|#Superlative)",
    group: 0,
    tag: "Noun",
    reason: "the-poor"
  },
  // professional bodybuilder
  {
    match: "[%Adj|Noun%] #Noun",
    notIf: "(#Pronoun|#ProperNoun)",
    group: 0,
    tag: "Adjective",
    reason: "stable-foundations"
  }
], qg = [
  // amusing his aunt
  // { match: '[#Adjective] #Possessive #Noun', group: 0, tag: 'Verb', reason: 'gerund-his-noun' },
  // loving you
  // { match: '[#Adjective] (us|you)', group: 0, tag: 'Gerund', reason: 'loving-you' },
  // slowly stunning
  { match: "(slowly|quickly) [#Adjective]", group: 0, tag: "Verb", reason: "slowly-adj" },
  // does mean
  { match: "does (#Adverb|not)? [#Adjective]", group: 0, tag: "PresentTense", reason: "does-mean" },
  // okay by me
  { match: "[(fine|okay|cool|ok)] by me", group: 0, tag: "Adjective", reason: "okay-by-me" },
  // i mean
  { match: "i (#Adverb|do)? not? [mean]", group: 0, tag: "PresentTense", reason: "i-mean" },
  //will secure our
  { match: "will #Adjective", tag: "Auxiliary Infinitive", reason: "will-adj" },
  //he disguised the thing
  { match: "#Pronoun [#Adjective] #Determiner #Adjective? #Noun", group: 0, tag: "Verb", reason: "he-adj-the" },
  //is eager to go
  { match: "#Copula [%Adj|Present%] to #Verb", group: 0, tag: "Verb", reason: "adj-to" },
  //is done well
  { match: "#Copula [#Adjective] (well|badly|quickly|slowly)", group: 0, tag: "Verb", reason: "done-well" },
  // rude and insulting
  { match: "#Adjective and [#Gerund] !#Preposition?", group: 0, tag: "Adjective", reason: "rude-and-x" },
  // were over cooked
  { match: "#Copula #Adverb? (over|under) [#PastTense]", group: 0, tag: "Adjective", reason: "over-cooked" },
  // was bland and overcooked
  { match: "#Copula #Adjective+ (and|or) [#PastTense]$", group: 0, tag: "Adjective", reason: "bland-and-overcooked" },
  // got tired of
  { match: "got #Adverb? [#PastTense] of", group: 0, tag: "Adjective", reason: "got-tired-of" },
  //felt loved
  {
    match: "(seem|seems|seemed|appear|appeared|appears|feel|feels|felt|sound|sounds|sounded) (#Adverb|#Adjective)? [#PastTense]",
    group: 0,
    tag: "Adjective",
    reason: "felt-loved"
  },
  // seem confused
  { match: "(seem|feel|seemed|felt) [#PastTense #Particle?]", group: 0, tag: "Adjective", reason: "seem-confused" },
  // a bit confused
  { match: "a (bit|little|tad) [#PastTense #Particle?]", group: 0, tag: "Adjective", reason: "a-bit-confused" },
  // do not be embarrassed
  { match: "not be [%Adj|Past% #Particle?]", group: 0, tag: "Adjective", reason: "do-not-be-confused" },
  // is just right
  { match: "#Copula just [%Adj|Past% #Particle?]", group: 0, tag: "Adjective", reason: "is-just-right" },
  // as pale as
  { match: "as [#Infinitive] as", group: 0, tag: "Adjective", reason: "as-pale-as" },
  //failed and oppressive
  { match: "[%Adj|Past%] and #Adjective", group: 0, tag: "Adjective", reason: "faled-and-oppressive" },
  // or heightened emotion
  {
    match: "or [#PastTense] #Noun",
    group: 0,
    tag: "Adjective",
    notIf: "(#Copula|#Pronoun)",
    reason: "or-heightened-emotion"
  },
  // became involved
  { match: "(become|became|becoming|becomes) [#Verb]", group: 0, tag: "Adjective", reason: "become-verb" },
  // their declared intentions
  { match: "#Possessive [#PastTense] #Noun", group: 0, tag: "Adjective", reason: "declared-intentions" },
  // is he cool
  { match: "#Copula #Pronoun [%Adj|Present%]", group: 0, tag: "Adjective", reason: "is-he-cool" },
  // is crowded with
  {
    match: "#Copula [%Adj|Past%] with",
    group: 0,
    tag: "Adjective",
    notIf: "(associated|worn|baked|aged|armed|bound|fried|loaded|mixed|packed|pumped|filled|sealed)",
    reason: "is-crowded-with"
  },
  // is empty$
  { match: "#Copula #Adverb? [%Adj|Present%]$", group: 0, tag: "Adjective", reason: "was-empty$" }
], Rg = [
  //still good
  { match: "[still] #Adjective", group: 0, tag: "Adverb", reason: "still-advb" },
  //still make
  { match: "[still] #Verb", group: 0, tag: "Adverb", reason: "still-verb" },
  // so hot
  { match: "[so] #Adjective", group: 0, tag: "Adverb", reason: "so-adv" },
  // way hotter
  { match: "[way] #Comparative", group: 0, tag: "Adverb", reason: "way-adj" },
  // way too hot
  { match: "[way] #Adverb #Adjective", group: 0, tag: "Adverb", reason: "way-too-adj" },
  // all singing
  { match: "[all] #Verb", group: 0, tag: "Adverb", reason: "all-verb" },
  // sing like an angel
  { match: "#Verb  [like]", group: 0, notIf: "(#Modal|#PhrasalVerb)", tag: "Adverb", reason: "verb-like" },
  //barely even walk
  { match: "(barely|hardly) even", tag: "Adverb", reason: "barely-even" },
  //even held
  { match: "[even] #Verb", group: 0, tag: "Adverb", reason: "even-walk" },
  //even worse
  { match: "[even] #Comparative", group: 0, tag: "Adverb", reason: "even-worse" },
  // even the greatest
  { match: "[even] (#Determiner|#Possessive)", group: 0, tag: "#Adverb", reason: "even-the" },
  // even left
  { match: "even left", tag: "#Adverb #Verb", reason: "even-left" },
  // way over
  { match: "[way] #Adjective", group: 0, tag: "#Adverb", reason: "way-over" },
  //cheering hard - dropped -ly's
  {
    match: "#PresentTense [(hard|quick|bright|slow|fast|backwards|forwards)]",
    notIf: "#Copula",
    group: 0,
    tag: "Adverb",
    reason: "lazy-ly"
  },
  // much appreciated
  { match: "[much] #Adjective", group: 0, tag: "Adverb", reason: "bit-1" },
  // is well
  { match: "#Copula [#Adverb]$", group: 0, tag: "Adjective", reason: "is-well" },
  // a bit cold
  { match: "a [(little|bit|wee) bit?] #Adjective", group: 0, tag: "Adverb", reason: "a-bit-cold" },
  // super strong
  { match: "[(super|pretty)] #Adjective", group: 0, tag: "Adverb", reason: "super-strong" },
  // become overly weakened
  { match: "(become|fall|grow) #Adverb? [#PastTense]", group: 0, tag: "Adjective", reason: "overly-weakened" },
  // a completely beaten man
  { match: "(a|an) #Adverb [#Participle] #Noun", group: 0, tag: "Adjective", reason: "completely-beaten" },
  //a close
  { match: "#Determiner #Adverb? [close]", group: 0, tag: "Adjective", reason: "a-close" },
  //walking close
  { match: "#Gerund #Adverb? [close]", group: 0, tag: "Adverb", notIf: "(getting|becoming|feeling)", reason: "being-close" },
  // a blown motor
  { match: "(the|those|these|a|an) [#Participle] #Noun", group: 0, tag: "Adjective", reason: "blown-motor" },
  // charged back
  { match: "(#PresentTense|#PastTense) [back]", group: 0, tag: "Adverb", notIf: "(#PhrasalVerb|#Copula)", reason: "charge-back" },
  // send around
  { match: "#Verb [around]", group: 0, tag: "Adverb", notIf: "#PhrasalVerb", reason: "send-around" },
  // later say
  { match: "[later] #PresentTense", group: 0, tag: "Adverb", reason: "later-say" },
  // the well
  { match: "#Determiner [well] !#PastTense?", group: 0, tag: "Noun", reason: "the-well" },
  // high enough
  { match: "#Adjective [enough]", group: 0, tag: "Adverb", reason: "high-enough" }
], Qg = [
  // ==== Holiday ====
  { match: "#Holiday (day|eve)", tag: "Holiday", reason: "holiday-day" },
  //5th of March
  { match: "#Value of #Month", tag: "Date", reason: "value-of-month" },
  //5 March
  { match: "#Cardinal #Month", tag: "Date", reason: "cardinal-month" },
  //march 5 to 7
  { match: "#Month #Value to #Value", tag: "Date", reason: "value-to-value" },
  //march the 12th
  { match: "#Month the #Value", tag: "Date", reason: "month-the-value" },
  //june 7
  { match: "(#WeekDay|#Month) #Value", tag: "Date", reason: "date-value" },
  //7 june
  { match: "#Value (#WeekDay|#Month)", tag: "Date", reason: "value-date" },
  //may twenty five
  { match: "(#TextValue && #Date) #TextValue", tag: "Date", reason: "textvalue-date" },
  // 'aug 20-21'
  { match: "#Month #NumberRange", tag: "Date", reason: "aug 20-21" },
  // wed march 5th
  { match: "#WeekDay #Month #Ordinal", tag: "Date", reason: "week mm-dd" },
  // aug 5th 2021
  { match: "#Month #Ordinal #Cardinal", tag: "Date", reason: "mm-dd-yyy" },
  // === timezones ===
  // china standard time
  { match: "(#Place|#Demonmym|#Time) (standard|daylight|central|mountain)? time", tag: "Timezone", reason: "std-time" },
  // eastern time
  {
    match: "(eastern|mountain|pacific|central|atlantic) (standard|daylight|summer)? time",
    tag: "Timezone",
    reason: "eastern-time"
  },
  // 5pm central
  { match: "#Time [(eastern|mountain|pacific|central|est|pst|gmt)]", group: 0, tag: "Timezone", reason: "5pm-central" },
  // central european time
  { match: "(central|western|eastern) european time", tag: "Timezone", reason: "cet" }
], _g = [
  // ==== WeekDay ====
  // sun the 5th
  { match: "[sun] the #Ordinal", tag: "WeekDay", reason: "sun-the-5th" },
  //sun feb 2
  { match: "[sun] #Date", group: 0, tag: "WeekDay", reason: "sun-feb" },
  //1pm next sun
  { match: "#Date (on|this|next|last|during)? [sun]", group: 0, tag: "WeekDay", reason: "1pm-sun" },
  //this sat
  { match: "(in|by|before|during|on|until|after|of|within|all) [sat]", group: 0, tag: "WeekDay", reason: "sat" },
  { match: "(in|by|before|during|on|until|after|of|within|all) [wed]", group: 0, tag: "WeekDay", reason: "wed" },
  { match: "(in|by|before|during|on|until|after|of|within|all) [march]", group: 0, tag: "Month", reason: "march" },
  //sat november
  { match: "[sat] #Date", group: 0, tag: "WeekDay", reason: "sat-feb" },
  // ==== Month ====
  //all march
  { match: "#Preposition [(march|may)]", group: 0, tag: "Month", reason: "in-month" },
  //this march
  { match: "(this|next|last) (march|may) !#Infinitive?", tag: "#Date #Month", reason: "this-month" },
  // march 5th
  { match: "(march|may) the? #Value", tag: "#Month #Date #Date", reason: "march-5th" },
  // 5th of march
  { match: "#Value of? (march|may)", tag: "#Date #Date #Month", reason: "5th-of-march" },
  // march and feb
  { match: "[(march|may)] .? #Date", group: 0, tag: "Month", reason: "march-and-feb" },
  // feb to march
  { match: "#Date .? [(march|may)]", group: 0, tag: "Month", reason: "feb-and-march" },
  //quickly march
  { match: "#Adverb [(march|may)]", group: 0, tag: "Verb", reason: "quickly-march" },
  //march quickly
  { match: "[(march|may)] #Adverb", group: 0, tag: "Verb", reason: "march-quickly" },
  //12 am
  { match: "#Value (am|pm)", tag: "Time", reason: "2-am" }
], Zg = "(feel|sense|process|rush|side|bomb|bully|challenge|cover|crush|dump|exchange|flow|function|issue|lecture|limit|march|process)", Xg = [
  //'more' is not always an adverb
  // any more
  { match: "(the|any) [more]", group: 0, tag: "Singular", reason: "more-noun" },
  // more players
  { match: "[more] #Noun", group: 0, tag: "Adjective", reason: "more-noun" },
  // rights of man
  { match: "(right|rights) of .", tag: "Noun", reason: "right-of" },
  // a bit
  { match: "a [bit]", group: 0, tag: "Singular", reason: "bit-2" },
  // a must
  { match: "a [must]", group: 0, tag: "Singular", reason: "must-2" },
  // we all
  { match: "(we|us) [all]", group: 0, tag: "Noun", reason: "we all" },
  // due to weather
  { match: "due to [#Verb]", group: 0, tag: "Noun", reason: "due-to" },
  //some pressing issues
  { match: "some [#Verb] #Plural", group: 0, tag: "Noun", reason: "determiner6" },
  // my first thought
  { match: "#Possessive #Ordinal [#PastTense]", group: 0, tag: "Noun", reason: "first-thought" },
  //the nice swim
  {
    match: "(the|this|those|these) #Adjective [%Verb|Noun%]",
    group: 0,
    tag: "Noun",
    notIf: "#Copula",
    reason: "the-adj-verb"
  },
  // the truly nice swim
  { match: "(the|this|those|these) #Adverb #Adjective [#Verb]", group: 0, tag: "Noun", reason: "determiner4" },
  //the wait to vote
  { match: "the [#Verb] #Preposition .", group: 0, tag: "Noun", reason: "determiner1" },
  //a sense of
  { match: "(a|an|the) [#Verb] of", group: 0, tag: "Noun", reason: "the-verb-of" },
  //the threat of force
  { match: "#Determiner #Noun of [#Verb]", group: 0, tag: "Noun", notIf: "#Gerund", reason: "noun-of-noun" },
  // ended in ruins
  {
    match: "#PastTense #Preposition [#PresentTense]",
    group: 0,
    notIf: "#Gerund",
    tag: "Noun",
    reason: "ended-in-ruins"
  },
  //'u' as pronoun
  { match: "#Conjunction [u]", group: 0, tag: "Pronoun", reason: "u-pronoun-2" },
  { match: "[u] #Verb", group: 0, tag: "Pronoun", reason: "u-pronoun-1" },
  //the western line
  {
    match: "#Determiner [(western|eastern|northern|southern|central)] #Noun",
    group: 0,
    tag: "Noun",
    reason: "western-line"
  },
  //air-flow
  { match: "(#Singular && @hasHyphen) #PresentTense", tag: "Noun", reason: "hyphen-verb" },
  //is no walk
  { match: "is no [#Verb]", group: 0, tag: "Noun", reason: "is-no-verb" },
  //do so
  { match: "do [so]", group: 0, tag: "Noun", reason: "so-noun" },
  // what the hell
  { match: "#Determiner [(shit|damn|hell)]", group: 0, tag: "Noun", reason: "swears-noun" },
  // go to shit
  { match: "to [(shit|hell)]", group: 0, tag: "Noun", reason: "to-swears" },
  // the staff were
  { match: "(the|these) [#Singular] (were|are)", group: 0, tag: "Plural", reason: "singular-were" },
  // a comdominium, or simply condo
  { match: "a #Noun+ or #Adverb+? [#Verb]", group: 0, tag: "Noun", reason: "noun-or-noun" },
  // walk the walk
  {
    match: "(the|those|these|a|an) #Adjective? [#PresentTense #Particle?]",
    group: 0,
    tag: "Noun",
    notIf: "(seem|appear|include|#Gerund|#Copula)",
    reason: "det-inf"
  },
  // { match: '(the|those|these|a|an) #Adjective? [#PresentTense #Particle?]', group: 0, tag: 'Noun', notIf: '(#Gerund|#Copula)', reason: 'det-pres' },
  // ==== Actor ====
  //Aircraft designer
  { match: "#Noun #Actor", tag: "Actor", notIf: "(#Person|#Pronoun)", reason: "thing-doer" },
  //lighting designer
  { match: "#Gerund #Actor", tag: "Actor", reason: "gerund-doer" },
  // captain sanders
  // { match: '[#Actor+] #ProperNoun', group: 0, tag: 'Honorific', reason: 'sgt-kelly' },
  // co-founder
  { match: "co #Singular", tag: "Actor", reason: "co-noun" },
  // co-founder
  {
    match: "[#Noun+] #Actor",
    group: 0,
    tag: "Actor",
    notIf: "(#Honorific|#Pronoun|#Possessive)",
    reason: "air-traffic-controller"
  },
  // fine-artist
  {
    match: "(urban|cardiac|cardiovascular|respiratory|medical|clinical|visual|graphic|creative|dental|exotic|fine|certified|registered|technical|virtual|professional|amateur|junior|senior|special|pharmaceutical|theoretical)+ #Noun? #Actor",
    tag: "Actor",
    reason: "fine-artist"
  },
  // dance coach
  {
    match: "#Noun+ (coach|chef|king|engineer|fellow|personality|boy|girl|man|woman|master)",
    tag: "Actor",
    reason: "dance-coach"
  },
  // chief design officer
  { match: "chief . officer", tag: "Actor", reason: "chief-x-officer" },
  // chief of police
  { match: "chief of #Noun+", tag: "Actor", reason: "chief-of-police" },
  // president of marketing
  { match: "senior? vice? president of #Noun+", tag: "Actor", reason: "president-of" },
  // ==== Singular ====
  //the sun
  { match: "#Determiner [sun]", group: 0, tag: "Singular", reason: "the-sun" },
  //did a 900, paid a 20
  { match: "#Verb (a|an) [#Value]$", group: 0, tag: "Singular", reason: "did-a-value" },
  //'the can'
  { match: "the [(can|will|may)]", group: 0, tag: "Singular", reason: "the can" },
  // ==== Possessive ====
  //spencer kelly's
  { match: "#FirstName #Acronym? (#Possessive && #LastName)", tag: "Possessive", reason: "name-poss" },
  //Super Corp's fundraiser
  { match: "#Organization+ #Possessive", tag: "Possessive", reason: "org-possessive" },
  //Los Angeles's fundraiser
  { match: "#Place+ #Possessive", tag: "Possessive", reason: "place-possessive" },
  // Ptolemy's experiments
  { match: "#Possessive #PresentTense #Particle?", notIf: "(#Gerund|her)", tag: "Noun", reason: "possessive-verb" },
  // anna's eating vs anna's eating lunch
  // my presidents house
  { match: "(my|our|their|her|his|its) [(#Plural && #Actor)] #Noun", tag: "Possessive", reason: "my-dads" },
  // 10th of a second
  { match: "#Value of a [second]", group: 0, unTag: "Value", tag: "Singular", reason: "10th-of-a-second" },
  // 10 seconds
  { match: "#Value [seconds]", group: 0, unTag: "Value", tag: "Plural", reason: "10-seconds" },
  // in time
  { match: "in [#Infinitive]", group: 0, tag: "Singular", reason: "in-age" },
  // a minor in
  { match: "a [#Adjective] #Preposition", group: 0, tag: "Noun", reason: "a-minor-in" },
  //the repairer said
  { match: "#Determiner [#Singular] said", group: 0, tag: "Actor", reason: "the-actor-said" },
  //the euro sense
  {
    match: `#Determiner #Noun [${Zg}] !(#Preposition|to|#Adverb)?`,
    group: 0,
    tag: "Noun",
    reason: "the-noun-sense"
  },
  // photographs of a computer are
  { match: "[#PresentTense] (of|by|for) (a|an|the) #Noun #Copula", group: 0, tag: "Plural", reason: "photographs-of" },
  // fight and win
  { match: "#Infinitive and [%Noun|Verb%]", group: 0, tag: "Infinitive", reason: "fight and win" },
  // peace and flowers and love
  { match: "#Noun and [#Verb] and #Noun", group: 0, tag: "Noun", reason: "peace-and-flowers" },
  // the 1992 classic
  { match: "the #Cardinal [%Adj|Noun%]", group: 0, tag: "Noun", reason: "the-1992-classic" },
  // the premier university
  { match: "#Copula the [%Adj|Noun%] #Noun", group: 0, tag: "Adjective", reason: "the-premier-university" },
  // scottish - i ate me sandwich
  { match: "i #Verb [me] #Noun", group: 0, tag: "Possessive", reason: "scottish-me" },
  // dance music
  {
    match: "[#PresentTense] (music|class|lesson|night|party|festival|league|ceremony)",
    group: 0,
    tag: "Noun",
    reason: "dance-music"
  },
  // wit it
  { match: "[wit] (me|it)", group: 0, tag: "Presposition", reason: "wit-me" },
  //left-her-boots, shoved her hand
  { match: "#PastTense #Possessive [#Verb]", group: 0, tag: "Noun", notIf: "(saw|made)", reason: "left-her-boots" },
  //35 signs
  { match: "#Value [%Plural|Verb%]", group: 0, tag: "Plural", notIf: "(one|1|a|an)", reason: "35-signs" },
  //had time
  { match: "had [#PresentTense]", group: 0, tag: "Noun", notIf: "(#Gerund|come|become)", reason: "had-time" },
  //instant access
  { match: "%Adj|Noun% %Noun|Verb%", tag: "#Adjective #Noun", notIf: "#ProperNoun #Noun", reason: "instant-access" },
  // a representative to
  { match: "#Determiner [%Adj|Noun%] #Conjunction", group: 0, tag: "Noun", reason: "a-rep-to" },
  // near death experiences, ambitious sales targets
  {
    match: "#Adjective #Noun [%Plural|Verb%]$",
    group: 0,
    tag: "Plural",
    notIf: "#Pronoun",
    reason: "near-death-experiences"
  },
  // your guild colors
  { match: "#Possessive #Noun [%Plural|Verb%]$", group: 0, tag: "Plural", reason: "your-guild-colors" }
], Yg = [
  // the planning processes
  { match: "(this|that|the|a|an) [#Gerund #Infinitive]", group: 0, tag: "Singular", reason: "the-planning-process" },
  // the paving stones
  { match: "(that|the) [#Gerund #PresentTense]", group: 0, ifNo: "#Copula", tag: "Plural", reason: "the-paving-stones" },
  // this swimming
  // { match: '(this|that|the) [#Gerund]', group: 0, tag: 'Noun', reason: 'this-gerund' },
  // the remaining claims
  { match: "#Determiner [#Gerund] #Noun", group: 0, tag: "Adjective", reason: "the-gerund-noun" },
  // i think tipping sucks
  { match: "#Pronoun #Infinitive [#Gerund] #PresentTense", group: 0, tag: "Noun", reason: "tipping-sucks" },
  // early warning
  { match: "#Adjective [#Gerund]", group: 0, tag: "Noun", notIf: "(still|even|just)", reason: "early-warning" },
  //walking is cool
  { match: "[#Gerund] #Adverb? not? #Copula", group: 0, tag: "Activity", reason: "gerund-copula" },
  //are doing is
  { match: "#Copula [(#Gerund|#Activity)] #Copula", group: 0, tag: "Gerund", reason: "are-doing-is" },
  //walking should be fun
  { match: "[#Gerund] #Modal", group: 0, tag: "Activity", reason: "gerund-modal" },
  // finish listening
  // { match: '#Infinitive [#Gerund]', group: 0, tag: 'Activity', reason: 'finish-listening' },
  // the ruling party
  // responsibility for setting
  { match: "#Singular for [%Noun|Gerund%]", group: 0, tag: "Gerund", reason: "noun-for-gerund" },
  // better for training
  { match: "#Comparative (for|at) [%Noun|Gerund%]", group: 0, tag: "Gerund", reason: "better-for-gerund" },
  // keep the touching
  { match: "#PresentTense the [#Gerund]", group: 0, tag: "Noun", reason: "keep-the-touching" }
], em = [
  // do the dance
  { match: "#Infinitive (this|that|the) [#Infinitive]", group: 0, tag: "Noun", reason: "do-this-dance" },
  //running-a-show
  { match: "#Gerund #Determiner [#Infinitive]", group: 0, tag: "Noun", reason: "running-a-show" },
  //the-only-reason
  { match: "#Determiner (only|further|just|more|backward) [#Infinitive]", group: 0, tag: "Noun", reason: "the-only-reason" },
  // a stream runs
  { match: "(the|this|a|an) [#Infinitive] #Adverb? #Verb", group: 0, tag: "Noun", reason: "determiner5" },
  //a nice deal
  { match: "#Determiner #Adjective #Adjective? [#Infinitive]", group: 0, tag: "Noun", reason: "a-nice-inf" },
  // the mexican train
  { match: "#Determiner #Demonym [#PresentTense]", group: 0, tag: "Noun", reason: "mexican-train" },
  //next career move
  { match: "#Adjective #Noun+ [#Infinitive] #Copula", group: 0, tag: "Noun", reason: "career-move" },
  // at some point
  { match: "at some [#Infinitive]", group: 0, tag: "Noun", reason: "at-some-inf" },
  // goes to sleep
  { match: "(go|goes|went) to [#Infinitive]", group: 0, tag: "Noun", reason: "goes-to-verb" },
  //a close watch on
  { match: "(a|an) #Adjective? #Noun [#Infinitive] (#Preposition|#Noun)", group: 0, notIf: "from", tag: "Noun", reason: "a-noun-inf" },
  //a tv show
  { match: "(a|an) #Noun [#Infinitive]$", group: 0, tag: "Noun", reason: "a-noun-inf2" },
  //is mark hughes
  // { match: '#Copula [#Infinitive] #Noun', group: 0, tag: 'Noun', reason: 'is-pres-noun' },
  // good wait staff
  // { match: '#Adjective [#Infinitive] #Noun', group: 0, tag: 'Noun', reason: 'good-wait-staff' },
  // running for congress
  { match: "#Gerund #Adjective? for [#Infinitive]", group: 0, tag: "Noun", reason: "running-for" },
  // running to work
  // { match: '#Gerund #Adjective to [#Infinitive]', group: 0, tag: 'Noun', reason: 'running-to' },
  // about love
  { match: "about [#Infinitive]", group: 0, tag: "Singular", reason: "about-love" },
  // singers on stage
  { match: "#Plural on [#Infinitive]", group: 0, tag: "Noun", reason: "on-stage" },
  // any charge
  { match: "any [#Infinitive]", group: 0, tag: "Noun", reason: "any-charge" },
  // no doubt
  { match: "no [#Infinitive]", group: 0, tag: "Noun", reason: "no-doubt" },
  // number of seats
  { match: "number of [#PresentTense]", group: 0, tag: "Noun", reason: "number-of-x" },
  // teaches/taught
  { match: "(taught|teaches|learns|learned) [#PresentTense]", group: 0, tag: "Noun", reason: "teaches-x" },
  // use reverse
  { match: "(try|use|attempt|build|make) [#Verb #Particle?]", notIf: "(#Copula|#Noun|sure|fun|up)", group: 0, tag: "Noun", reason: "do-verb" },
  //make sure of
  // checkmate is
  { match: "^[#Infinitive] (is|was)", group: 0, tag: "Noun", reason: "checkmate-is" },
  // get much sleep
  { match: "#Infinitive much [#Infinitive]", group: 0, tag: "Noun", reason: "get-much" },
  // cause i gotta
  { match: "[cause] #Pronoun #Verb", group: 0, tag: "Conjunction", reason: "cause-cuz" },
  // the cardio dance party
  { match: "the #Singular [#Infinitive] #Noun", group: 0, tag: "Noun", notIf: "#Pronoun", reason: "cardio-dance" },
  // that should smoke
  { match: "#Determiner #Modal [#Noun]", group: 0, tag: "PresentTense", reason: "should-smoke" },
  //this rocks
  { match: "this [#Plural]", group: 0, tag: "PresentTense", notIf: "(#Preposition|#Date)", reason: "this-verbs" },
  //voice that rocks
  { match: "#Noun that [#Plural]", group: 0, tag: "PresentTense", notIf: "(#Preposition|#Pronoun|way)", reason: "voice-that-rocks" },
  //that leads to
  { match: "that [#Plural] to", group: 0, tag: "PresentTense", notIf: "#Preposition", reason: "that-leads-to" },
  //let him glue
  {
    match: "(let|make|made) (him|her|it|#Person|#Place|#Organization)+ [#Singular] (a|an|the|it)",
    group: 0,
    tag: "Infinitive",
    reason: "let-him-glue"
  },
  // assign all tasks
  { match: "#Verb (all|every|each|most|some|no) [#PresentTense]", notIf: "#Modal", group: 0, tag: "Noun", reason: "all-presentTense" },
  // PresentTense/Noun ambiguities
  // big dreams, critical thinking
  // have big dreams
  { match: "(had|have|#PastTense) #Adjective [#PresentTense]", group: 0, tag: "Noun", notIf: "better", reason: "adj-presentTense" },
  // excellent answer spencer
  // { match: '^#Adjective [#PresentTense]', group: 0, tag: 'Noun', reason: 'start adj-presentTense' },
  // one big reason
  { match: "#Value #Adjective [#PresentTense]", group: 0, tag: "Noun", notIf: "#Copula", reason: "one-big-reason" },
  // won widespread support
  { match: "#PastTense #Adjective+ [#PresentTense]", group: 0, tag: "Noun", notIf: "(#Copula|better)", reason: "won-wide-support" },
  // many poses
  { match: "(many|few|several|couple) [#PresentTense]", group: 0, tag: "Noun", notIf: "#Copula", reason: "many-poses" },
  // very big dreams
  { match: "#Determiner #Adverb #Adjective [%Noun|Verb%]", group: 0, tag: "Noun", notIf: "#Copula", reason: "very-big-dream" },
  // from start to finish
  { match: "from #Noun to [%Noun|Verb%]", group: 0, tag: "Noun", reason: "start-to-finish" },
  // for comparison or contrast
  { match: "(for|with|of) #Noun (and|or|not) [%Noun|Verb%]", group: 0, tag: "Noun", notIf: "#Pronoun", reason: "for-food-and-gas" },
  // adorable little store
  { match: "#Adjective #Adjective [#PresentTense]", group: 0, tag: "Noun", notIf: "#Copula", reason: "adorable-little-store" },
  // of basic training
  // { match: '#Preposition #Adjective [#PresentTense]', group: 0, tag: 'Noun', reason: 'of-basic-training' },
  // justifiying higher costs
  { match: "#Gerund #Adverb? #Comparative [#PresentTense]", group: 0, tag: "Noun", notIf: "#Copula", reason: "higher-costs" },
  { match: "(#Noun && @hasComma) #Noun (and|or) [#PresentTense]", group: 0, tag: "Noun", notIf: "#Copula", reason: "noun-list" },
  // any questions for
  { match: "(many|any|some|several) [#PresentTense] for", group: 0, tag: "Noun", reason: "any-verbs-for" },
  // to facilitate gas exchange with
  { match: "to #PresentTense #Noun [#PresentTense] #Preposition", group: 0, tag: "Noun", reason: "gas-exchange" },
  // waited until release
  { match: "#PastTense (until|as|through|without) [#PresentTense]", group: 0, tag: "Noun", reason: "waited-until-release" },
  // selling like hot cakes
  { match: "#Gerund like #Adjective? [#PresentTense]", group: 0, tag: "Plural", reason: "like-hot-cakes" },
  // some valid reason
  { match: "some #Adjective [#PresentTense]", group: 0, tag: "Noun", reason: "some-reason" },
  // for some reason
  { match: "for some [#PresentTense]", group: 0, tag: "Noun", reason: "for-some-reason" },
  // same kind of shouts
  { match: "(same|some|the|that|a) kind of [#PresentTense]", group: 0, tag: "Noun", reason: "some-kind-of" },
  // a type of shout
  { match: "(same|some|the|that|a) type of [#PresentTense]", group: 0, tag: "Noun", reason: "some-type-of" },
  // doing better for fights
  { match: "#Gerund #Adjective #Preposition [#PresentTense]", group: 0, tag: "Noun", reason: "doing-better-for-x" },
  // get better aim
  { match: "(get|got|have) #Comparative [#PresentTense]", group: 0, tag: "Noun", reason: "got-better-aim" },
  // whose name was
  { match: "whose [#PresentTense] #Copula", group: 0, tag: "Noun", reason: "whos-name-was" },
  // give up on reason
  { match: "#PhrasalVerb #Particle #Preposition [#PresentTense]", group: 0, tag: "Noun", reason: "given-up-on-x" },
  //there are reasons
  { match: "there (are|were) #Adjective? [#PresentTense]", group: 0, tag: "Plural", reason: "there-are" },
  // 30 trains
  { match: "#Value [#PresentTense] of", group: 0, notIf: "(one|1|#Copula|#Infinitive)", tag: "Plural", reason: "2-trains" },
  // compromises are possible
  { match: "[#PresentTense] (are|were) #Adjective", group: 0, tag: "Plural", reason: "compromises-are-possible" },
  // hope i helped
  { match: "^[(hope|guess|thought|think)] #Pronoun #Verb", group: 0, tag: "Infinitive", reason: "suppose-i" },
  //pursue its dreams
  // { match: '#PresentTense #Possessive [#PresentTense]', notIf: '#Gerund', group: 0, tag: 'Plural', reason: 'pursue-its-dreams' },
  // our unyielding support
  { match: "#Possessive #Adjective [#Verb]", group: 0, tag: "Noun", notIf: "#Copula", reason: "our-full-support" },
  // tastes good
  { match: "[(tastes|smells)] #Adverb? #Adjective", group: 0, tag: "PresentTense", reason: "tastes-good" },
  // are you playing golf
  // { match: '^are #Pronoun [#Noun]', group: 0, notIf: '(here|there)', tag: 'Verb', reason: 'are-you-x' },
  // ignoring commute
  { match: "#Copula #Gerund [#PresentTense] !by?", group: 0, tag: "Noun", notIf: "going", reason: "ignoring-commute" },
  // noun-pastTense variables
  { match: "#Determiner #Adjective? [(shed|thought|rose|bid|saw|spelt)]", group: 0, tag: "Noun", reason: "noun-past" },
  // 'verb-to'
  // how to watch
  { match: "how to [%Noun|Verb%]", group: 0, tag: "Infinitive", reason: "how-to-noun" },
  // which boost it
  { match: "which [%Noun|Verb%] #Noun", group: 0, tag: "Infinitive", reason: "which-boost-it" },
  // asking questions
  { match: "#Gerund [%Plural|Verb%]", group: 0, tag: "Plural", reason: "asking-questions" },
  // ready to stream
  { match: "(ready|available|difficult|hard|easy|made|attempt|try) to [%Noun|Verb%]", group: 0, tag: "Infinitive", reason: "ready-to-noun" },
  // bring to market
  { match: "(bring|went|go|drive|run|bike) to [%Noun|Verb%]", group: 0, tag: "Noun", reason: "bring-to-noun" },
  // can i sleep, would you look
  { match: "#Modal #Noun [%Noun|Verb%]", group: 0, tag: "Infinitive", reason: "would-you-look" },
  // is just spam
  { match: "#Copula just [#Infinitive]", group: 0, tag: "Noun", reason: "is-just-spam" },
  // request copies
  { match: "^%Noun|Verb% %Plural|Verb%", tag: "Imperative #Plural", reason: "request-copies" },
  // homemade pickles and drinks
  { match: "#Adjective #Plural and [%Plural|Verb%]", group: 0, tag: "#Plural", reason: "pickles-and-drinks" },
  // the 1968 film
  { match: "#Determiner #Year [#Verb]", group: 0, tag: "Noun", reason: "the-1968-film" },
  // the break up
  { match: "#Determiner [#PhrasalVerb #Particle]", group: 0, tag: "Noun", reason: "the-break-up" },
  // the individual goals
  { match: "#Determiner [%Adj|Noun%] #Noun", group: 0, tag: "Adjective", notIf: "(#Pronoun|#Possessive|#ProperNoun)", reason: "the-individual-goals" },
  // work or prepare
  { match: "[%Noun|Verb%] or #Infinitive", group: 0, tag: "Infinitive", reason: "work-or-prepare" },
  // to give thanks
  { match: "to #Infinitive [#PresentTense]", group: 0, tag: "Noun", notIf: "(#Gerund|#Copula|help)", reason: "to-give-thanks" },
  // kills me
  { match: "[#Noun] me", group: 0, tag: "Verb", reason: "kills-me" },
  // removes wrinkles
  { match: "%Plural|Verb% %Plural|Verb%", tag: "#PresentTense #Plural", reason: "removes-wrinkles" }
], tm = [
  { match: "#Money and #Money #Currency?", tag: "Money", reason: "money-and-money" },
  // 6 dollars and 5 cents
  { match: "#Value #Currency [and] #Value (cents|ore|centavos|sens)", group: 0, tag: "money", reason: "and-5-cents" },
  // maybe currencies
  { match: "#Value (mark|rand|won|rub|ore)", tag: "#Money #Currency", reason: "4-mark" },
  // 3 pounds
  { match: "a pound", tag: "#Money #Unit", reason: "a-pound" },
  { match: "#Value (pound|pounds)", tag: "#Money #Unit", reason: "4-pounds" }
], nm = [
  // half a penny
  { match: "[(half|quarter)] of? (a|an)", group: 0, tag: "Fraction", reason: "millionth" },
  // nearly half
  { match: "#Adverb [half]", group: 0, tag: "Fraction", reason: "nearly-half" },
  // half the
  { match: "[half] the", group: 0, tag: "Fraction", reason: "half-the" },
  // and a half
  { match: "#Cardinal and a half", tag: "Fraction", reason: "and-a-half" },
  // two-halves
  { match: "#Value (halves|halfs|quarters)", tag: "Fraction", reason: "two-halves" },
  // ---ordinals as fractions---
  // a fifth
  { match: "a #Ordinal", tag: "Fraction", reason: "a-quarter" },
  // seven fifths
  { match: "[#Cardinal+] (#Fraction && /s$/)", tag: "Fraction", reason: "seven-fifths" },
  // doc.match('(#Fraction && /s$/)').lookBefore('#Cardinal+$').tag('Fraction')
  // one third of ..
  { match: "[#Cardinal+ #Ordinal] of .", group: 0, tag: "Fraction", reason: "ordinal-of" },
  // 100th of
  { match: "[(#NumericValue && #Ordinal)] of .", group: 0, tag: "Fraction", reason: "num-ordinal-of" },
  // a twenty fifth
  { match: "(a|one) #Cardinal?+ #Ordinal", tag: "Fraction", reason: "a-ordinal" },
  // //  '3 out of 5'
  { match: "#Cardinal+ out? of every? #Cardinal", tag: "Fraction", reason: "out-of" }
], rm = [
  // ==== Ambiguous numbers ====
  // 'second'
  { match: "#Cardinal [second]", tag: "Unit", reason: "one-second" },
  //'a/an' can mean 1 - "a hour"
  {
    match: "!once? [(a|an)] (#Duration|hundred|thousand|million|billion|trillion)",
    group: 0,
    tag: "Value",
    reason: "a-is-one"
  },
  // ==== PhoneNumber ====
  //1 800 ...
  { match: "1 #Value #PhoneNumber", tag: "PhoneNumber", reason: "1-800-Value" },
  //(454) 232-9873
  { match: "#NumericValue #PhoneNumber", tag: "PhoneNumber", reason: "(800) PhoneNumber" },
  // ==== Currency ====
  // chinese yuan
  { match: "#Demonym #Currency", tag: "Currency", reason: "demonym-currency" },
  // ten bucks
  { match: "#Value [(buck|bucks|grand)]", group: 0, tag: "Currency", reason: "value-bucks" },
  // ==== Money ====
  { match: "[#Value+] #Currency", group: 0, tag: "Money", reason: "15 usd" },
  // ==== Ordinal ====
  { match: "[second] #Noun", group: 0, tag: "Ordinal", reason: "second-noun" },
  // ==== Units ====
  //5 yan
  { match: "#Value+ [#Currency]", group: 0, tag: "Unit", reason: "5-yan" },
  { match: "#Value [(foot|feet)]", group: 0, tag: "Unit", reason: "foot-unit" },
  //5 kg.
  { match: "#Value [#Abbreviation]", group: 0, tag: "Unit", reason: "value-abbr" },
  { match: "#Value [k]", group: 0, tag: "Unit", reason: "value-k" },
  { match: "#Unit an hour", tag: "Unit", reason: "unit-an-hour" },
  // ==== Magnitudes ====
  //minus 7
  { match: "(minus|negative) #Value", tag: "Value", reason: "minus-value" },
  //seven point five
  { match: "#Value (point|decimal) #Value", tag: "Value", reason: "value-point-value" },
  //quarter million
  { match: "#Determiner [(half|quarter)] #Ordinal", group: 0, tag: "Value", reason: "half-ordinal" },
  // thousand and two
  { match: "#Multiple+ and #Value", tag: "Value", reason: "magnitude-and-value" },
  // ambiguous units like 'gb'
  // { match: '#Value square? [(kb|mb|gb|tb|ml|pt|qt|tbl|tbsp|km|cm|mm|mi|ft|yd|kg|hg|mg|oz|lb|mph|pa|miles|yard|yards|pound|pounds)]', group: 0, tag: 'Unit', reason: '12-gb' },
  // 5 miles per hour
  { match: "#Value #Unit [(per|an) (hr|hour|sec|second|min|minute)]", group: 0, tag: "Unit", reason: "12-miles-per-second" },
  // 5 square miles
  { match: "#Value [(square|cubic)] #Unit", group: 0, tag: "Unit", reason: "square-miles" }
  // 5) The expenses
  // { match: '^[#Value] (#Determiner|#Gerund)', group: 0, tag: 'Expression', unTag: 'Value', reason: 'numbered-list' },
], om = [
  // ==== FirstNames ====
  //is foo Smith
  { match: "#Copula [(#Noun|#PresentTense)] #LastName", group: 0, tag: "FirstName", reason: "copula-noun-lastname" },
  //pope francis
  {
    match: "(sister|pope|brother|father|aunt|uncle|grandpa|grandfather|grandma) #ProperNoun",
    tag: "Person",
    reason: "lady-titlecase",
    safe: !0
  },
  // ==== Nickname ====
  // Dwayne 'the rock' Johnson
  { match: "#FirstName [#Determiner #Noun] #LastName", group: 0, tag: "Person", reason: "first-noun-last" },
  {
    match: "#ProperNoun (b|c|d|e|f|g|h|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z) #ProperNoun",
    tag: "Person",
    reason: "titlecase-acronym-titlecase",
    safe: !0
  },
  { match: "#Acronym #LastName", tag: "Person", reason: "acronym-lastname", safe: !0 },
  { match: "#Person (jr|sr|md)", tag: "Person", reason: "person-honorific" },
  //remove single 'mr'
  { match: "#Honorific #Acronym", tag: "Person", reason: "Honorific-TitleCase" },
  { match: "#Person #Person the? #RomanNumeral", tag: "Person", reason: "roman-numeral" },
  { match: "#FirstName [/^[^aiurck]$/]", group: 0, tag: ["Acronym", "Person"], reason: "john-e" },
  //j.k Rowling
  { match: "#Noun van der? #Noun", tag: "Person", reason: "van der noun", safe: !0 },
  //king of spain
  { match: "(king|queen|prince|saint|lady) of #Noun", tag: "Person", reason: "king-of-noun", safe: !0 },
  //lady Florence
  { match: "(prince|lady) #Place", tag: "Person", reason: "lady-place" },
  //saint Foo
  { match: "(king|queen|prince|saint) #ProperNoun", tag: "Person", notIf: "#Place", reason: "saint-foo" },
  // al sharpton
  { match: "al (#Person|#ProperNoun)", tag: "Person", reason: "al-borlen", safe: !0 },
  //ferdinand de almar
  { match: "#FirstName de #Noun", tag: "Person", reason: "bill-de-noun" },
  //Osama bin Laden
  { match: "#FirstName (bin|al) #Noun", tag: "Person", reason: "bill-al-noun" },
  //John L. Foo
  { match: "#FirstName #Acronym #ProperNoun", tag: "Person", reason: "bill-acronym-title" },
  //Andrew Lloyd Webber
  { match: "#FirstName #FirstName #ProperNoun", tag: "Person", reason: "bill-firstname-title" },
  //Mr Foo
  { match: "#Honorific #FirstName? #ProperNoun", tag: "Person", reason: "dr-john-Title" },
  //peter the great
  { match: "#FirstName the #Adjective", tag: "Person", reason: "name-the-great" },
  // dick van dyke
  { match: "#ProperNoun (van|al|bin) #ProperNoun", tag: "Person", reason: "title-van-title", safe: !0 },
  //jose de Sucre
  { match: "#ProperNoun (de|du) la? #ProperNoun", tag: "Person", notIf: "#Place", reason: "title-de-title" },
  //Jani K. Smith
  { match: "#Singular #Acronym #LastName", tag: "#FirstName #Person .", reason: "title-acro-noun", safe: !0 },
  //Foo Ford
  { match: "[#ProperNoun] #Person", group: 0, tag: "Person", reason: "proper-person", safe: !0 },
  // john keith jones
  {
    match: "#Person [#ProperNoun #ProperNoun]",
    group: 0,
    tag: "Person",
    notIf: "#Possessive",
    reason: "three-name-person",
    safe: !0
  },
  //John Foo
  {
    match: "#FirstName #Acronym? [#ProperNoun]",
    group: 0,
    tag: "LastName",
    notIf: "#Possessive",
    reason: "firstname-titlecase"
  },
  // john stewart
  { match: "#FirstName [#FirstName]", group: 0, tag: "LastName", reason: "firstname-firstname" },
  //Joe K. Sombrero
  { match: "#FirstName #Acronym #Noun", tag: "Person", reason: "n-acro-noun", safe: !0 },
  //Anthony de Marco
  { match: "#FirstName [(de|di|du|van|von)] #Person", group: 0, tag: "LastName", reason: "de-firstname" },
  // baker jenna smith
  // { match: '[#Actor+] #Person', group: 0, tag: 'Person', reason: 'baker-sam-smith' },
  // sergeant major Harold
  {
    match: "[(lieutenant|corporal|sergeant|captain|qeen|king|admiral|major|colonel|marshal|president|queen|king)+] #ProperNoun",
    group: 0,
    tag: "Honorific",
    reason: "seargeant-john"
  },
  // ==== Honorics ====
  {
    match: "[(private|general|major|rear|prime|field|count|miss)] #Honorific? #Person",
    group: 0,
    tag: ["Honorific", "Person"],
    reason: "ambg-honorifics"
  },
  // dr john foobar
  {
    match: "#Honorific #FirstName [#Singular]",
    group: 0,
    tag: "LastName",
    notIf: "#Possessive",
    reason: "dr-john-foo",
    safe: !0
  },
  //his-excellency
  {
    match: "[(his|her) (majesty|honour|worship|excellency|honorable)] #Person",
    group: 0,
    tag: "Honorific",
    reason: "his-excellency"
  },
  // Lieutenant colonel
  { match: "#Honorific #Actor", tag: "Honorific", reason: "Lieutenant colonel" },
  // first lady, second admiral
  { match: "(first|second|third|1st|2nd|3rd) #Actor", tag: "Honorific", reason: "first lady" },
  // Louis IV
  { match: "#Person #RomanNumeral", tag: "Person", reason: "louis-IV" }
], am = [
  // ebenezer scrooge
  {
    match: "#FirstName #Noun$",
    tag: ". #LastName",
    notIf: "(#Possessive|#Organization|#Place|#Pronoun|@hasTitleCase)",
    reason: "firstname-noun"
  },
  // ===person-date===
  { match: "%Person|Date% #Acronym? #ProperNoun", tag: "Person", reason: "jan-thierson" },
  // ===person-noun===
  //Cliff Clavin
  { match: "%Person|Noun% #Acronym? #ProperNoun", tag: "Person", reason: "switch-person", safe: !0 },
  // olive garden
  { match: "%Person|Noun% #Organization", tag: "Organization", reason: "olive-garden" },
  // ===person-verb===
  // ollie faroo
  { match: "%Person|Verb% #Acronym? #ProperNoun", tag: "Person", reason: "verb-propernoun", ifNo: "#Actor" },
  // chuck will ...
  {
    match: "[%Person|Verb%] (will|had|has|said|says|told|did|learned|wants|wanted)",
    group: 0,
    tag: "Person",
    reason: "person-said"
  },
  // ===person-place===
  //sydney harbour
  {
    match: "[%Person|Place%] (harbor|harbour|pier|town|city|place|dump|landfill)",
    group: 0,
    tag: "Place",
    reason: "sydney-harbour"
  },
  // east sydney
  { match: "(west|east|north|south) [%Person|Place%]", group: 0, tag: "Place", reason: "east-sydney" },
  // ===person-adjective===
  // rusty smith
  // { match: `${personAdj} #Person`, tag: 'Person', reason: 'randy-smith' },
  // rusty a. smith
  // { match: `${personAdj} #Acronym? #ProperNoun`, tag: 'Person', reason: 'rusty-smith' },
  // very rusty
  // { match: `#Adverb [${personAdj}]`, group: 0, tag: 'Adjective', reason: 'really-rich' },
  // ===person-verb===
  // would wade
  { match: "#Modal [%Person|Verb%]", group: 0, tag: "Verb", reason: "would-mark" },
  // really wade
  { match: "#Adverb [%Person|Verb%]", group: 0, tag: "Verb", reason: "really-mark" },
  // drew closer
  { match: "[%Person|Verb%] (#Adverb|#Comparative)", group: 0, tag: "Verb", reason: "drew-closer" },
  // wade smith
  { match: "%Person|Verb% #Person", tag: "Person", reason: "rob-smith" },
  // wade m. Cooper
  { match: "%Person|Verb% #Acronym #ProperNoun", tag: "Person", reason: "rob-a-smith" },
  // will go
  { match: "[will] #Verb", group: 0, tag: "Modal", reason: "will-verb" },
  // will Pharell
  { match: "(will && @isTitleCase) #ProperNoun", tag: "Person", reason: "will-name" },
  // jack layton won
  {
    match: "(#FirstName && !#Possessive) [#Singular] #Verb",
    group: 0,
    safe: !0,
    tag: "LastName",
    reason: "jack-layton"
  },
  // sherwood anderson told
  { match: "^[#Singular] #Person #Verb", group: 0, safe: !0, tag: "Person", reason: "sherwood-anderson" },
  // bought a warhol
  { match: "(a|an) [#Person]$", group: 0, unTag: "Person", reason: "a-warhol" }
], im = [
  //sometimes adverbs - 'pretty good','well above'
  {
    match: "#Copula (pretty|dead|full|well|sure) (#Adjective|#Noun)",
    tag: "#Copula #Adverb #Adjective",
    reason: "sometimes-adverb"
  },
  //i better ..
  { match: "(#Pronoun|#Person) (had|#Adverb)? [better] #PresentTense", group: 0, tag: "Modal", reason: "i-better" },
  // adj -> gerund
  // like
  { match: "(#Modal|i|they|we|do) not? [like]", group: 0, tag: "PresentTense", reason: "modal-like" },
  // ==== Tense ====
  //he left
  { match: "#Noun #Adverb? [left]", group: 0, tag: "PastTense", reason: "left-verb" },
  // ==== Copula ====
  //will be running (not copula)
  { match: "will #Adverb? not? #Adverb? [be] #Gerund", group: 0, tag: "Copula", reason: "will-be-copula" },
  //for more complex forms, just tag 'be'
  { match: "will #Adverb? not? #Adverb? [be] #Adjective", group: 0, tag: "Copula", reason: "be-copula" },
  // ==== Infinitive ====
  //march to
  { match: "[march] (up|down|back|toward)", notIf: "#Date", group: 0, tag: "Infinitive", reason: "march-to" },
  //must march
  { match: "#Modal [march]", group: 0, tag: "Infinitive", reason: "must-march" },
  // may be
  { match: "[may] be", group: 0, tag: "Verb", reason: "may-be" },
  // subject to
  { match: "[(subject|subjects|subjected)] to", group: 0, tag: "Verb", reason: "subject to" },
  // subject to
  { match: "[home] to", group: 0, tag: "PresentTense", reason: "home to" },
  // === misc==
  // side with
  // { match: '[(side|fool|monkey)] with', group: 0, tag: 'Infinitive', reason: 'fool-with' },
  // open the door
  { match: "[open] #Determiner", group: 0, tag: "Infinitive", reason: "open-the" },
  //were being run
  { match: "(were|was) being [#PresentTense]", group: 0, tag: "PastTense", reason: "was-being" },
  //had been broken
  { match: "(had|has|have) [been /en$/]", group: 0, tag: "Auxiliary Participle", reason: "had-been-broken" },
  //had been smoked
  { match: "(had|has|have) [been /ed$/]", group: 0, tag: "Auxiliary PastTense", reason: "had-been-smoked" },
  //were being run
  { match: "(had|has) #Adverb? [been] #Adverb? #PastTense", group: 0, tag: "Auxiliary", reason: "had-been-adj" },
  //had to walk
  { match: "(had|has) to [#Noun] (#Determiner|#Possessive)", group: 0, tag: "Infinitive", reason: "had-to-noun" },
  // have read
  { match: "have [#PresentTense]", group: 0, tag: "PastTense", notIf: "(come|gotten)", reason: "have-read" },
  // does that work
  { match: "(does|will|#Modal) that [work]", group: 0, tag: "PastTense", reason: "does-that-work" },
  // sounds fun
  { match: "[(sound|sounds)] #Adjective", group: 0, tag: "PresentTense", reason: "sounds-fun" },
  // look good
  { match: "[(look|looks)] #Adjective", group: 0, tag: "PresentTense", reason: "looks-good" },
  // stops thinking
  { match: "[(start|starts|stop|stops|begin|begins)] #Gerund", group: 0, tag: "Verb", reason: "starts-thinking" },
  // have read
  { match: "(have|had) read", tag: "Modal #PastTense", reason: "read-read" },
  //were under cooked
  {
    match: "(is|was|were) [(under|over) #PastTense]",
    group: 0,
    tag: "Adverb Adjective",
    reason: "was-under-cooked"
  },
  // damn them
  { match: "[shit] (#Determiner|#Possessive|them)", group: 0, tag: "Verb", reason: "swear1-verb" },
  { match: "[damn] (#Determiner|#Possessive|them)", group: 0, tag: "Verb", reason: "swear2-verb" },
  { match: "[fuck] (#Determiner|#Possessive|them)", group: 0, tag: "Verb", reason: "swear3-verb" },
  // jobs that fit
  { match: "#Plural that %Noun|Verb%", tag: ". #Preposition #Infinitive", reason: "jobs-that-work" },
  // works for me
  { match: "[works] for me", group: 0, tag: "PresentTense", reason: "works-for-me" },
  // as we please
  { match: "as #Pronoun [please]", group: 0, tag: "Infinitive", reason: "as-we-please" },
  // verb-prefixes - 'co write'
  { match: "[(co|mis|de|inter|intra|pre|re|un|out|under|over|counter)] #Verb", group: 0, tag: ["Verb", "Prefix"], notIf: "(#Copula|#PhrasalVerb)", reason: "co-write" },
  // dressed and left
  { match: "#PastTense and [%Adj|Past%]", group: 0, tag: "PastTense", reason: "dressed-and-left" },
  // melted and fallen
  { match: "[%Adj|Past%] and #PastTense", group: 0, tag: "PastTense", reason: "dressed-and-left" },
  // is he stoked
  { match: "#Copula #Pronoun [%Adj|Past%]", group: 0, tag: "Adjective", reason: "is-he-stoked" },
  // to dream of
  { match: "to [%Noun|Verb%] #Preposition", group: 0, tag: "Infinitive", reason: "to-dream-of" }
], sm = [
  // ==== Auxiliary ====
  // have been
  { match: "will (#Adverb|not)+? [have] (#Adverb|not)+? #Verb", group: 0, tag: "Auxiliary", reason: "will-have-vb" },
  //was walking
  { match: "[#Copula] (#Adverb|not)+? (#Gerund|#PastTense)", group: 0, tag: "Auxiliary", reason: "copula-walking" },
  //would walk
  { match: "[(#Modal|did)+] (#Adverb|not)+? #Verb", group: 0, tag: "Auxiliary", reason: "modal-verb" },
  //would have had
  { match: "#Modal (#Adverb|not)+? [have] (#Adverb|not)+? [had] (#Adverb|not)+? #Verb", group: 0, tag: "Auxiliary", reason: "would-have" },
  //support a splattering of auxillaries before a verb
  { match: "[(has|had)] (#Adverb|not)+? #PastTense", group: 0, tag: "Auxiliary", reason: "had-walked" },
  // will walk
  { match: "[(do|does|did|will|have|had|has|got)] (not|#Adverb)+? #Verb", group: 0, tag: "Auxiliary", reason: "have-had" },
  // about to go
  { match: "[about to] #Adverb? #Verb", group: 0, tag: ["Auxiliary", "Verb"], reason: "about-to" },
  //would be walking
  { match: "#Modal (#Adverb|not)+? [be] (#Adverb|not)+? #Verb", group: 0, tag: "Auxiliary", reason: "would-be" },
  //had been walking
  { match: "[(#Modal|had|has)] (#Adverb|not)+? [been] (#Adverb|not)+? #Verb", group: 0, tag: "Auxiliary", reason: "had-been" },
  // was being driven
  { match: "[(be|being|been)] #Participle", group: 0, tag: "Auxiliary", reason: "being-driven" },
  // may want
  { match: "[may] #Adverb? #Infinitive", group: 0, tag: "Auxiliary", reason: "may-want" },
  // was being walked
  { match: "#Copula (#Adverb|not)+? [(be|being|been)] #Adverb+? #PastTense", group: 0, tag: "Auxiliary", reason: "being-walked" },
  // will be walked
  { match: "will [be] #PastTense", group: 0, tag: "Auxiliary", reason: "will-be-x" },
  // been walking
  { match: "[(be|been)] (#Adverb|not)+? #Gerund", group: 0, tag: "Auxiliary", reason: "been-walking" },
  // used to walk
  { match: "[used to] #PresentTense", group: 0, tag: "Auxiliary", reason: "used-to-walk" },
  // was going to walk
  { match: "#Copula (#Adverb|not)+? [going to] #Adverb+? #PresentTense", group: 0, tag: "Auxiliary", reason: "going-to-walk" },
  // tell me
  { match: "#Imperative [(me|him|her)]", group: 0, tag: "Reflexive", reason: "tell-him" },
  // there is no x
  { match: "(is|was) #Adverb? [no]", group: 0, tag: "Negative", reason: "is-no" },
  // been told
  { match: "[(been|had|became|came)] #PastTense", group: 0, notIf: "#PhrasalVerb", tag: "Auxiliary", reason: "been-told" },
  // being born
  { match: "[(being|having|getting)] #Verb", group: 0, tag: "Auxiliary", reason: "being-born" },
  // be walking
  { match: "[be] #Gerund", group: 0, tag: "Auxiliary", reason: "be-walking" },
  // better go
  { match: "[better] #PresentTense", group: 0, tag: "Modal", notIf: "(#Copula|#Gerund)", reason: "better-go" },
  // even better
  { match: "even better", tag: "Adverb #Comparative", reason: "even-better" }
], um = [
  // ==== Phrasal ====
  //'foo-up'
  { match: "(#Verb && @hasHyphen) up", tag: "PhrasalVerb", reason: "foo-up" },
  { match: "(#Verb && @hasHyphen) off", tag: "PhrasalVerb", reason: "foo-off" },
  { match: "(#Verb && @hasHyphen) over", tag: "PhrasalVerb", reason: "foo-over" },
  { match: "(#Verb && @hasHyphen) out", tag: "PhrasalVerb", reason: "foo-out" },
  // walk in on
  {
    match: "[#Verb (in|out|up|down|off|back)] (on|in)",
    notIf: "#Copula",
    tag: "PhrasalVerb Particle",
    reason: "walk-in-on"
  },
  // went on for
  { match: "(lived|went|crept|go) [on] for", group: 0, tag: "PhrasalVerb", reason: "went-on" },
  // the curtains come down
  { match: "#Verb (up|down|in|on|for)$", tag: "PhrasalVerb #Particle", notIf: "#PhrasalVerb", reason: "come-down$" },
  // got me thinking
  // { match: '(got|had) me [#Noun]', group: 0, tag: 'Verb', reason: 'got-me-gerund' },
  // help stop
  { match: "help [(stop|end|make|start)]", group: 0, tag: "Infinitive", reason: "help-stop" },
  // work in the office
  { match: "#PhrasalVerb (in && #Particle) #Determiner", tag: "#Verb #Preposition #Determiner", unTag: "PhrasalVerb", reason: "work-in-the" },
  // start listening
  { match: "[(stop|start|finish|help)] #Gerund", group: 0, tag: "Infinitive", reason: "start-listening" },
  // mis-fired
  // { match: '[(mis)] #Verb', group: 0, tag: 'Verb', reason: 'mis-firedsa' },
  //back it up
  {
    match: "#Verb (him|her|it|us|himself|herself|itself|everything|something) [(up|down)]",
    group: 0,
    tag: "Adverb",
    reason: "phrasal-pronoun-advb"
  }
], hn = "(i|we|they)", cm = [
  // do not go
  { match: "^do not? [#Infinitive #Particle?]", notIf: hn, group: 0, tag: "Imperative", reason: "do-eat" },
  // please go
  { match: "^please do? not? [#Infinitive #Particle?]", group: 0, tag: "Imperative", reason: "please-go" },
  // just go
  { match: "^just do? not? [#Infinitive #Particle?]", group: 0, tag: "Imperative", reason: "just-go" },
  // do it better
  { match: "^[#Infinitive] it #Comparative", notIf: hn, group: 0, tag: "Imperative", reason: "do-it-better" },
  // do it again
  { match: "^[#Infinitive] it (please|now|again|plz)", notIf: hn, group: 0, tag: "Imperative", reason: "do-it-please" },
  // go quickly.
  { match: "^[#Infinitive] (#Adjective|#Adverb)$", group: 0, tag: "Imperative", notIf: "(so|such|rather|enough)", reason: "go-quickly" },
  // turn down the noise
  { match: "^[#Infinitive] (up|down|over) #Determiner", group: 0, tag: "Imperative", reason: "turn-down" },
  // eat my shorts
  { match: "^[#Infinitive] (your|my|the|a|an|any|each|every|some|more|with|on)", group: 0, notIf: "like", tag: "Imperative", reason: "eat-my-shorts" },
  // tell him the story
  { match: "^[#Infinitive] (him|her|it|us|me|there)", group: 0, tag: "Imperative", reason: "tell-him" },
  // avoid loud noises
  { match: "^[#Infinitive] #Adjective #Noun$", group: 0, tag: "Imperative", reason: "avoid-loud-noises" },
  // call and reserve
  { match: "^[#Infinitive] (#Adjective|#Adverb)? and #Infinitive", group: 0, tag: "Imperative", reason: "call-and-reserve" },
  // one-word imperatives
  { match: "^(go|stop|wait|hurry) please?$", tag: "Imperative", reason: "go" },
  // somebody call
  { match: "^(somebody|everybody) [#Infinitive]", group: 0, tag: "Imperative", reason: "somebody-call" },
  // let's leave
  { match: "^let (us|me) [#Infinitive]", group: 0, tag: "Imperative", reason: "lets-leave" },
  // shut the door
  { match: "^[(shut|close|open|start|stop|end|keep)] #Determiner #Noun", group: 0, tag: "Imperative", reason: "shut-the-door" },
  // turn off the light
  { match: "^[#PhrasalVerb #Particle] #Determiner #Noun", group: 0, tag: "Imperative", reason: "turn-off-the-light" },
  // go to toronto
  { match: "^[go] to .", group: 0, tag: "Imperative", reason: "go-to-toronto" },
  // would you recommend
  { match: "^#Modal you [#Infinitive]", group: 0, tag: "Imperative", reason: "would-you-" },
  // never say
  { match: "^never [#Infinitive]", group: 0, tag: "Imperative", reason: "never-stop" },
  // come have a drink
  { match: "^come #Infinitive", tag: "Imperative", notIf: "on", reason: "come-have" },
  // come and have a drink
  { match: "^come and? #Infinitive", tag: "Imperative . Imperative", notIf: "#PhrasalVerb", reason: "come-and-have" },
  // stay away
  { match: "^stay (out|away|back)", tag: "Imperative", reason: "stay-away" },
  // stay cool
  { match: "^[(stay|be|keep)] #Adjective", group: 0, tag: "Imperative", reason: "stay-cool" },
  // keep it silent
  { match: "^[keep it] #Adjective", group: 0, tag: "Imperative", reason: "keep-it-cool" },
  // don't be late
  { match: "^do not [#Infinitive]", group: 0, tag: "Imperative", reason: "do-not-be" },
  // allow yourself
  { match: "[#Infinitive] (yourself|yourselves)", group: 0, tag: "Imperative", reason: "allow-yourself" },
  // look what
  { match: "[#Infinitive] what .", group: 0, tag: "Imperative", reason: "look-what" },
  // continue playing
  { match: "^[#Infinitive] #Gerund", group: 0, tag: "Imperative", reason: "keep-playing" },
  // go to it
  { match: "^[#Infinitive] (to|for|into|toward|here|there)", group: 0, tag: "Imperative", reason: "go-to" },
  // relax and unwind
  { match: "^[#Infinitive] (and|or) #Infinitive", group: 0, tag: "Imperative", reason: "inf-and-inf" },
  // commit to
  { match: "^[%Noun|Verb%] to", group: 0, tag: "Imperative", reason: "commit-to" },
  // maintain eye contact
  { match: "^[#Infinitive] #Adjective? #Singular #Singular", group: 0, tag: "Imperative", reason: "maintain-eye-contact" },
  // don't forget to clean
  { match: "do not (forget|omit|neglect) to [#Infinitive]", group: 0, tag: "Imperative", reason: "do-not-forget" },
  // pay attention
  { match: "^[(ask|wear|pay|look|help|show|watch|act|fix|kill|stop|start|turn|try|win)] #Noun", group: 0, tag: "Imperative", reason: "pay-attention" }
], lm = [
  // that were growing
  { match: "(that|which) were [%Adj|Gerund%]", group: 0, tag: "Gerund", reason: "that-were-growing" },
  // was dissapointing
  // { match: '#Copula [%Adj|Gerund%]$', group: 0, tag: 'Adjective', reason: 'was-disappointing$' },
  // repairing crubling roads
  { match: "#Gerund [#Gerund] #Plural", group: 0, tag: "Adjective", reason: "hard-working-fam" }
  // { match: '(that|which) were [%Adj|Gerund%]', group: 0, tag: 'Gerund', reason: 'that-were-growing' },
], hm = [
  // got walked, was walked, were walked
  { match: "(got|were|was|is|are|am) (#PastTense|#Participle)", tag: "Passive", reason: "got-walked" },
  // was being walked
  { match: "(was|were|is|are|am) being (#PastTense|#Participle)", tag: "Passive", reason: "was-being" },
  // had been walked, have been eaten
  { match: "(had|have|has) been (#PastTense|#Participle)", tag: "Passive", reason: "had-been" },
  // will be cleaned
  { match: "will be being? (#PastTense|#Participle)", tag: "Passive", reason: "will-be-cleaned" },
  // suffered by the country
  { match: "#Noun [(#PastTense|#Participle)] by (the|a) #Noun", group: 0, tag: "Passive", reason: "suffered-by" }
], dm = [
  // u r cool
  { match: "u r", tag: "#Pronoun #Copula", reason: "u r" },
  { match: "#Noun [(who|whom)]", group: 0, tag: "Determiner", reason: "captain-who" },
  // ==== Conditions ====
  // had he survived,
  { match: "[had] #Noun+ #PastTense", group: 0, tag: "Condition", reason: "had-he" },
  // were he to survive
  { match: "[were] #Noun+ to #Infinitive", group: 0, tag: "Condition", reason: "were-he" },
  // some sort of
  { match: "some sort of", tag: "Adjective Noun Conjunction", reason: "some-sort-of" },
  // some of
  // { match: 'some of', tag: 'Noun Conjunction', reason: 'some-of' },
  // of some sort
  { match: "of some sort", tag: "Conjunction Adjective Noun", reason: "of-some-sort" },
  // such skill
  { match: "[such] (a|an|is)? #Noun", group: 0, tag: "Determiner", reason: "such-skill" },
  // another one
  // { match: '[another] (#Noun|#Value)', group: 0, tag: 'Adjective', reason: 'another-one' },
  // right after
  { match: "[right] (before|after|in|into|to|toward)", group: 0, tag: "#Adverb", reason: "right-into" },
  // at about
  { match: "#Preposition [about]", group: 0, tag: "Adjective", reason: "at-about" },
  // are ya
  { match: "(are|#Modal|see|do|for) [ya]", group: 0, tag: "Pronoun", reason: "are-ya" },
  // long live
  { match: "[long live] .", group: 0, tag: "#Adjective #Infinitive", reason: "long-live" },
  // plenty of
  { match: "[plenty] of", group: 0, tag: "#Uncountable", reason: "plenty-of" },
  // 'there' as adjective
  { match: "(always|nearly|barely|practically) [there]", group: 0, tag: "Adjective", reason: "always-there" },
  // existential 'there'
  // there she is
  { match: "[there] (#Adverb|#Pronoun)? #Copula", group: 0, tag: "There", reason: "there-is" },
  // is there food
  { match: "#Copula [there] .", group: 0, tag: "There", reason: "is-there" },
  // should there
  { match: "#Modal #Adverb? [there]", group: 0, tag: "There", reason: "should-there" },
  // do you
  { match: "^[do] (you|we|they)", group: 0, tag: "QuestionWord", reason: "do-you" },
  // does he
  { match: "^[does] (he|she|it|#ProperNoun)", group: 0, tag: "QuestionWord", reason: "does-he" },
  // the person who
  { match: "#Determiner #Noun+ [who] #Verb", group: 0, tag: "Preposition", reason: "the-x-who" },
  // the person which
  { match: "#Determiner #Noun+ [which] #Verb", group: 0, tag: "Preposition", reason: "the-x-which" },
  // a while
  { match: "a [while]", group: 0, tag: "Noun", reason: "a-while" },
  // guess who
  { match: "guess who", tag: "#Infinitive #QuestionWord", reason: "guess-who" },
  // swear words
  { match: "[fucking] !#Verb", group: 0, tag: "#Gerund", reason: "f-as-gerund" }
], fm = [
  // Foo University
  // { match: `#Noun ${orgMap}`, tag: 'Organization', safe: true, reason: 'foo-university' },
  // // University of Toronto
  // { match: `${orgMap} of #Place`, tag: 'Organization', safe: true, reason: 'university-of-foo' },
  // // foo regional health authority
  // { match: `${orgMap} (health|local|regional)+ authority`, tag: 'Organization', reason: 'regional-health' },
  // // foo stock exchange
  // { match: `${orgMap} (stock|mergantile)+ exchange`, tag: 'Organization', reason: 'stock-exchange' },
  // // foo news service
  // { match: `${orgMap} (daily|evening|local)+ news service?`, tag: 'Organization', reason: 'foo-news' },
  //University of Foo
  { match: "university of #Place", tag: "Organization", reason: "university-of-Foo" },
  //John & Joe's
  { match: "#Noun (&|n) #Noun", tag: "Organization", reason: "Noun-&-Noun" },
  // teachers union of Ontario
  { match: "#Organization of the? #ProperNoun", tag: "Organization", reason: "org-of-place", safe: !0 },
  //walmart USA
  { match: "#Organization #Country", tag: "Organization", reason: "org-country" },
  //organization
  { match: "#ProperNoun #Organization", tag: "Organization", notIf: "#FirstName", reason: "titlecase-org" },
  //FitBit Inc
  { match: "#ProperNoun (ltd|co|inc|dept|assn|bros)", tag: "Organization", reason: "org-abbrv" },
  // the OCED
  { match: "the [#Acronym]", group: 0, tag: "Organization", reason: "the-acronym", safe: !0 },
  // government of india
  { match: "government of the? [#Place+]", tag: "Organization", reason: "government-of-x" },
  // school board
  { match: "(health|school|commerce) board", tag: "Organization", reason: "school-board" },
  // special comittee
  {
    match: "(nominating|special|conference|executive|steering|central|congressional) committee",
    tag: "Organization",
    reason: "special-comittee"
  },
  // global trade union
  {
    match: "(world|global|international|national|#Demonym) #Organization",
    tag: "Organization",
    reason: "global-org"
  },
  // schools
  { match: "#Noun+ (public|private) school", tag: "School", reason: "noun-public-school" },
  // new york yankees
  { match: "#Place+ #SportsTeam", tag: "SportsTeam", reason: "place-sportsteam" },
  // 'manchester united'
  {
    match: "(dc|atlanta|minnesota|manchester|newcastle|sheffield) united",
    tag: "SportsTeam",
    reason: "united-sportsteam"
  },
  // 'toronto fc'
  { match: "#Place+ fc", tag: "SportsTeam", reason: "fc-sportsteam" },
  // baltimore quilting club
  {
    match: "#Place+ #Noun{0,2} (club|society|group|team|committee|commission|association|guild|crew)",
    tag: "Organization",
    reason: "place-noun-society"
  }
], pm = [
  // ==== Region ====
  // West Norforlk
  { match: "(west|north|south|east|western|northern|southern|eastern)+ #Place", tag: "Region", reason: "west-norfolk" },
  //some us-state acronyms (exlude: al, in, la, mo, hi, me, md, ok..)
  {
    match: "#City [(al|ak|az|ar|ca|ct|dc|fl|ga|id|il|nv|nh|nj|ny|oh|pa|sc|tn|tx|ut|vt|pr)]",
    group: 0,
    tag: "Region",
    reason: "us-state"
  },
  // portland oregon
  { match: "portland [or]", group: 0, tag: "Region", reason: "portland-or" },
  //words removed from preTagger/placeWords
  {
    match: "#ProperNoun+ (cliff|place|range|pit|place|point|room|grounds|ruins)",
    tag: "Place",
    reason: "foo-point"
  },
  // in Foo California
  { match: "in [#ProperNoun] #Place", group: 0, tag: "Place", reason: "propernoun-place" },
  // Address
  {
    match: "#Value #Noun (st|street|rd|road|crescent|cr|way|tr|terrace|avenue|ave)",
    tag: "Address",
    reason: "address-st"
  },
  // port dover
  { match: "(port|mount|mt) #ProperName", tag: "Place", reason: "port-name" }
  // generic 'oak ridge' names
  // { match: '(oak|maple|spruce|pine|cedar|willow|green|sunset|sunrise) #Place', tag: 'Place', reason: 'tree-name' },
  // generic 'sunset view' names
  // { match: '() #Place', tag: 'Place', reason: 'tree-name' },
  // Sports Arenas and Complexs
  // {
  //   match:
  //     '(#Place+|#Place|#ProperNoun) (memorial|athletic|community|financial)? (sportsplex|stadium|sports centre|sports field|soccer complex|soccer centre|sports complex|civic centre|centre|arena|gardens|complex|coliseum|auditorium|place|building)',
  //   tag: 'Place',
  //   reason: 'sport-complex',
  // },
], gm = [
  // ==== Conjunctions ====
  { match: "[so] #Noun", group: 0, tag: "Conjunction", reason: "so-conj" },
  //how he is driving
  {
    match: "[(who|what|where|why|how|when)] #Noun #Copula #Adverb? (#Verb|#Adjective)",
    group: 0,
    tag: "Conjunction",
    reason: "how-he-is-x"
  },
  // when he
  { match: "#Copula [(who|what|where|why|how|when)] #Noun", group: 0, tag: "Conjunction", reason: "when-he" },
  // says that he..
  { match: "#Verb [that] #Pronoun", group: 0, tag: "Conjunction", reason: "said-that-he" },
  // things that are required
  { match: "#Noun [that] #Copula", group: 0, tag: "Conjunction", reason: "that-are" },
  // things that seem cool
  { match: "#Noun [that] #Verb #Adjective", group: 0, tag: "Conjunction", reason: "that-seem" },
  // wasn't that wide..
  { match: "#Noun #Copula not? [that] #Adjective", group: 0, tag: "Adverb", reason: "that-adj" },
  // ==== Prepositions ====
  //all students
  { match: "#Verb #Adverb? #Noun [(that|which)]", group: 0, tag: "Preposition", reason: "that-prep" },
  //work, which has been done.
  { match: "@hasComma [which] (#Pronoun|#Verb)", group: 0, tag: "Preposition", reason: "which-copula" },
  //folks like her
  { match: "#Noun [like] #Noun", group: 0, tag: "Preposition", reason: "noun-like" },
  //like the time
  { match: "^[like] #Determiner", group: 0, tag: "Preposition", reason: "like-the" },
  //a day like this
  { match: "a #Noun [like] (#Noun|#Determiner)", group: 0, tag: "Preposition", reason: "a-noun-like" },
  // really like
  { match: "#Adverb [like]", group: 0, tag: "Verb", reason: "really-like" },
  // nothing like
  { match: "(not|nothing|never) [like]", group: 0, tag: "Preposition", reason: "nothing-like" },
  // treat them like
  { match: "#Infinitive #Pronoun [like]", group: 0, tag: "Preposition", reason: "treat-them-like" },
  // ==== Questions ====
  // where
  // why
  // when
  // who
  // whom
  // whose
  // what
  // which
  //the word 'how many'
  // { match: '^(how|which)', tag: 'QuestionWord', reason: 'how-question' },
  // how-he, when the
  { match: "[#QuestionWord] (#Pronoun|#Determiner)", group: 0, tag: "Preposition", reason: "how-he" },
  // when stolen
  { match: "[#QuestionWord] #Participle", group: 0, tag: "Preposition", reason: "when-stolen" },
  // how is
  { match: "[how] (#Determiner|#Copula|#Modal|#PastTense)", group: 0, tag: "QuestionWord", reason: "how-is" },
  // children who dance
  { match: "#Plural [(who|which|when)] .", group: 0, tag: "Preposition", reason: "people-who" }
], mm = [
  //swear-words as non-expression POS
  { match: "holy (shit|fuck|hell)", tag: "Expression", reason: "swears-expression" },
  // well..
  { match: "^[(well|so|okay|now)] !#Adjective?", group: 0, tag: "Expression", reason: "well-" },
  // well..
  { match: "^come on", tag: "Expression", reason: "come-on" },
  // sorry
  { match: "(say|says|said) [sorry]", group: 0, tag: "Expression", reason: "say-sorry" },
  // ok,
  { match: "^(ok|alright|shoot|hell|anyways)", tag: "Expression", reason: "ok-" },
  // c'mon marge..
  // { match: '^[come on] #Noun', group: 0, tag: 'Expression', reason: 'come-on' },
  // say,
  { match: "^(say && @hasComma)", tag: "Expression", reason: "say-" },
  { match: "^(like && @hasComma)", tag: "Expression", reason: "like-" },
  // dude we should
  { match: "^[(dude|man|girl)] #Pronoun", group: 0, tag: "Expression", reason: "dude-i" }
], ym = [].concat(
  // order matters top-matches can get overwritten
  hm,
  Lg,
  Wg,
  Jg,
  Ug,
  Rg,
  _g,
  Qg,
  Xg,
  Yg,
  em,
  tm,
  nm,
  rm,
  om,
  am,
  im,
  qg,
  sm,
  um,
  cm,
  lm,
  dm,
  fm,
  pm,
  gm,
  mm
), bm = {
  two: {
    matches: ym
  }
};
let dn = null;
const vm = function(e) {
  const { world: t } = e, { model: n, methods: r } = t;
  dn = dn || r.one.buildNet(n.two.matches, t);
  const a = r.two.quickSplit(e.document).map((s) => {
    const u = s[0];
    return [u.index[0], u.index[1], u.index[1] + s.length];
  }), i = e.update(a);
  return i.cache(), i.sweep(dn), e.uncache(), e.unfreeze(), e;
}, wm = (e) => e.compute(["freeze", "lexicon", "preTagger", "postTagger", "unfreeze"]), Pm = { postTagger: vm, tagger: wm }, km = (e) => Math.round(e * 100) / 100;
function Am(e) {
  e.prototype.confidence = function() {
    let t = 0, n = 0;
    return this.docs.forEach((r) => {
      r.forEach((o) => {
        n += 1, t += o.confidence || 1;
      });
    }), n === 0 ? 1 : km(t / n);
  }, e.prototype.tagger = function() {
    return this.compute(["tagger"]);
  };
}
const Cm = {
  api: Am,
  compute: Pm,
  model: bm,
  hooks: ["postTagger"]
}, Nm = function(e) {
  return Object.keys(e.hooks).filter((t) => !t.startsWith("#") && !t.startsWith("%"));
}, xm = function(e, t) {
  const n = Nm(t);
  if (n.length === 0)
    return e;
  e._cache || e.cache();
  const r = e._cache;
  return e.filter((o, a) => n.some((i) => r[a].has(i)));
}, jm = function(e, t) {
  let n = t;
  typeof t == "string" && (n = this.buildNet([{ match: t }]));
  const r = this.tokenize(e), o = xm(r, n);
  return o.found ? (o.compute(["index", "tagger"]), o.match(t)) : r.none();
}, Tm = {
  lib: {
    lazy: jm
  }
}, Im = function(e, t) {
  const n = e.methods.two.transform.verb.conjugate, r = n(t, e.model);
  return e.has("#Gerund") ? r.Gerund : e.has("#PastTense") ? r.PastTense : e.has("#PresentTense") ? r.PresentTense : e.has("#Gerund") ? r.Gerund : t;
}, $m = function(e, t) {
  let n = t;
  return e.forEach((r) => {
    r.has("#Infinitive") || (n = Im(r, t)), r.replaceWith(n);
  }), e;
}, Dm = function(e, t) {
  let n = t;
  if (e.has("#Plural")) {
    const r = e.methods.two.transform.noun.toPlural;
    n = r(t, e.model);
  }
  e.replaceWith(n, { possessives: !0 });
}, Hm = function(e, t) {
  const { toAdverb: n } = e.methods.two.transform.adjective, o = n(t);
  o && e.replaceWith(o);
}, Em = function(e, t) {
  const { toComparative: n, toSuperlative: r } = e.methods.two.transform.adjective;
  let o = t;
  e.has("#Comparative") ? o = n(o, e.model) : e.has("#Superlative") && (o = r(o, e.model)), o && e.replaceWith(o);
}, Gm = function(e, t, n) {
  let r = e.split(/ /g).map((a) => a.toLowerCase().trim());
  r = r.filter((a) => a), r = r.map((a) => `{${a}}`).join(" ");
  let o = this.match(r);
  return n && (o = o.if(n)), o.has("#Verb") ? $m(o, t) : o.has("#Noun") ? Dm(o, t) : o.has("#Adverb") ? Hm(o, t) : o.has("#Adjective") ? Em(o, t) : this;
}, Om = function(e) {
  e.prototype.swap = Gm;
}, Fm = {
  api: Om
};
b.plugin(hg);
b.plugin(Mg);
b.plugin(Cm);
b.plugin(Tm);
b.plugin(Fm);
const Qe = function(e) {
  const { fromComparative: t, fromSuperlative: n } = e.methods.two.transform.adjective, r = e.text("normal");
  return e.has("#Comparative") ? t(r, e.model) : e.has("#Superlative") ? n(r, e.model) : r;
}, zm = function(e) {
  class t extends e {
    constructor(r, o, a) {
      super(r, o, a), this.viewType = "Adjectives";
    }
    json(r = {}) {
      const { toAdverb: o, toNoun: a, toSuperlative: i, toComparative: s } = this.methods.two.transform.adjective;
      return r.normal = !0, this.map((u) => {
        const l = u.toView().json(r)[0] || {}, c = Qe(u);
        return l.adjective = {
          adverb: o(c, this.model),
          noun: a(c, this.model),
          superlative: i(c, this.model),
          comparative: s(c, this.model)
        }, l;
      }, []);
    }
    adverbs() {
      return this.before("#Adverb+$").concat(this.after("^#Adverb+"));
    }
    conjugate(r) {
      const { toComparative: o, toSuperlative: a, toNoun: i, toAdverb: s } = this.methods.two.transform.adjective;
      return this.getNth(r).map((u) => {
        const l = Qe(u);
        return {
          Adjective: l,
          Comparative: o(l, this.model),
          Superlative: a(l, this.model),
          Noun: i(l, this.model),
          Adverb: s(l, this.model)
        };
      }, []);
    }
    toComparative(r) {
      const { toComparative: o } = this.methods.two.transform.adjective;
      return this.getNth(r).map((a) => {
        const i = Qe(a), s = o(i, this.model);
        return a.replaceWith(s);
      });
    }
    toSuperlative(r) {
      const { toSuperlative: o } = this.methods.two.transform.adjective;
      return this.getNth(r).map((a) => {
        const i = Qe(a), s = o(i, this.model);
        return a.replaceWith(s);
      });
    }
    toAdverb(r) {
      const { toAdverb: o } = this.methods.two.transform.adjective;
      return this.getNth(r).map((a) => {
        const i = Qe(a), s = o(i, this.model);
        return a.replaceWith(s);
      });
    }
    toNoun(r) {
      const { toNoun: o } = this.methods.two.transform.adjective;
      return this.getNth(r).map((a) => {
        const i = Qe(a), s = o(i, this.model);
        return a.replaceWith(s);
      });
    }
  }
  e.prototype.adjectives = function(n) {
    let r = this.match("#Adjective");
    return r = r.getNth(n), new t(r.document, r.pointer);
  }, e.prototype.superlatives = function(n) {
    let r = this.match("#Superlative");
    return r = r.getNth(n), new t(r.document, r.pointer);
  }, e.prototype.comparatives = function(n) {
    let r = this.match("#Comparative");
    return r = r.getNth(n), new t(r.document, r.pointer);
  };
}, Vm = { api: zm }, Bm = function(e) {
  return e.compute("root").text("root");
}, Sm = function(e) {
  class t extends e {
    constructor(r, o, a) {
      super(r, o, a), this.viewType = "Adverbs";
    }
    conjugate(r) {
      return this.getNth(r).map((o) => {
        const a = Bm(o);
        return {
          Adverb: o.text("normal"),
          Adjective: a
        };
      }, []);
    }
    json(r = {}) {
      const o = this.methods.two.transform.adjective.fromAdverb;
      return r.normal = !0, this.map((a) => {
        const i = a.toView().json(r)[0] || {};
        return i.adverb = {
          adjective: o(i.normal)
        }, i;
      }, []);
    }
  }
  e.prototype.adverbs = function(n) {
    let r = this.match("#Adverb");
    return r = r.getNth(n), new t(r.document, r.pointer);
  };
}, Mm = { api: Sm }, Lm = function(e) {
  let t = e.match("@hasComma");
  return t = t.filter((n) => {
    if (n.growLeft(".").wordCount() === 1 || n.growRight(". .").wordCount() === 1)
      return !1;
    let r = n.grow(".");
    return r = r.ifNo("@hasComma @hasComma"), r = r.ifNo("@hasComma (and|or) ."), r = r.ifNo("(#City && @hasComma) #Country"), r = r.ifNo("(#WeekDay && @hasComma) #Date"), r = r.ifNo("(#Date+ && @hasComma) #Value"), r = r.ifNo("(#Adjective && @hasComma) #Adjective"), r.found;
  }), e.splitAfter(t);
}, Km = function(e) {
  let t = e.parentheses();
  return t = t.filter((n) => n.wordCount() >= 3 && n.has("#Verb") && n.has("#Noun")), e.splitOn(t);
}, Wm = function(e) {
  let t = e.quotations();
  return t = t.filter((n) => n.wordCount() >= 3 && n.has("#Verb") && n.has("#Noun")), e.splitOn(t);
}, Jm = function(e) {
  let t = this;
  t = Km(t), t = Wm(t), t = Lm(t), t = t.splitAfter("(@hasEllipses|@hasSemicolon|@hasDash|@hasColon)"), t = t.splitAfter("^#Pronoun (said|says)"), t = t.splitBefore("(said|says) #ProperNoun$"), t = t.splitBefore(". . if .{4}"), t = t.splitBefore("and while"), t = t.splitBefore("now that"), t = t.splitBefore("ever since"), t = t.splitBefore("(supposing|although)"), t = t.splitBefore("even (while|if|though)"), t = t.splitBefore("(whereas|whose)"), t = t.splitBefore("as (though|if)"), t = t.splitBefore("(til|until)");
  const n = t.match("#Verb .* [but] .* #Verb", 0);
  n.found && (t = t.splitBefore(n));
  const r = t.if("if .{2,9} then .").match("then");
  return t = t.splitBefore(r), typeof e == "number" && (t = t.get(e)), t;
}, Um = function(e) {
  const t = [];
  let n = null;
  return e.clauses().docs.forEach((a) => {
    a.forEach((i) => {
      !i.chunk || i.chunk !== n ? (n = i.chunk, t.push([i.index[0], i.index[1], i.index[1] + 1])) : t[t.length - 1][2] = i.index[1] + 1;
    }), n = null;
  }), e.update(t);
}, qm = function(e) {
  class t extends e {
    constructor(r, o, a) {
      super(r, o, a), this.viewType = "Chunks";
    }
    isVerb() {
      return this.filter((r) => r.has("<Verb>"));
    }
    isNoun() {
      return this.filter((r) => r.has("<Noun>"));
    }
    isAdjective() {
      return this.filter((r) => r.has("<Adjective>"));
    }
    isPivot() {
      return this.filter((r) => r.has("<Pivot>"));
    }
    // chunk-friendly debug
    debug() {
      return this.toView().debug("chunks"), this;
    }
    // overloaded - keep Sentences class
    update(r) {
      const o = new t(this.document, r);
      return o._cache = this._cache, o;
    }
  }
  e.prototype.chunks = function(n) {
    let r = Um(this);
    return r = r.getNth(n), new t(this.document, r.pointer);
  }, e.prototype.clauses = Jm;
}, Ho = {
  this: "Noun",
  then: "Pivot"
}, Rm = function(e) {
  for (let t = 0; t < e.length; t += 1)
    for (let n = 0; n < e[t].length; n += 1) {
      const r = e[t][n];
      if (Ho.hasOwnProperty(r.normal) === !0) {
        r.chunk = Ho[r.normal];
        continue;
      }
      if (r.tags.has("Verb")) {
        r.chunk = "Verb";
        continue;
      }
      if (r.tags.has("Noun") || r.tags.has("Determiner")) {
        r.chunk = "Noun";
        continue;
      }
      if (r.tags.has("Value")) {
        r.chunk = "Noun";
        continue;
      }
      if (r.tags.has("QuestionWord")) {
        r.chunk = "Pivot";
        continue;
      }
    }
}, Qm = function(e) {
  for (let t = 0; t < e.length; t += 1)
    for (let n = 0; n < e[t].length; n += 1) {
      const r = e[t][n];
      if (r.chunk)
        continue;
      const o = e[t][n + 1], a = e[t][n - 1];
      if (r.tags.has("Adjective")) {
        if (a && a.tags.has("Copula")) {
          r.chunk = "Adjective";
          continue;
        }
        if (a && a.tags.has("Determiner")) {
          r.chunk = "Noun";
          continue;
        }
        if (o && o.tags.has("Noun")) {
          r.chunk = "Noun";
          continue;
        }
        continue;
      }
      if (r.tags.has("Adverb") || r.tags.has("Negative")) {
        if (a && a.tags.has("Adjective")) {
          r.chunk = "Adjective";
          continue;
        }
        if (a && a.tags.has("Verb")) {
          r.chunk = "Verb";
          continue;
        }
        if (o && o.tags.has("Adjective")) {
          r.chunk = "Adjective";
          continue;
        }
        if (o && o.tags.has("Verb")) {
          r.chunk = "Verb";
          continue;
        }
      }
    }
}, _m = [
  // === Conjunction ===
  // that the houses
  { match: "[that] #Determiner #Noun", group: 0, chunk: "Pivot" },
  // estimated that
  { match: "#PastTense [that]", group: 0, chunk: "Pivot" },
  // so the
  { match: "[so] #Determiner", group: 0, chunk: "Pivot" },
  // === Adjective ===
  // was really nice
  { match: "#Copula #Adverb+? [#Adjective]", group: 0, chunk: "Adjective" },
  // was nice
  // { match: '#Copula [#Adjective]', group: 0, chunk: 'Adjective' },
  // nice and cool
  { match: "#Adjective and #Adjective", chunk: "Adjective" },
  // really nice
  // { match: '#Adverb+ #Adjective', chunk: 'Adjective' },
  // === Verb ===
  // quickly and suddenly run
  { match: "#Adverb+ and #Adverb #Verb", chunk: "Verb" },
  // sitting near
  { match: "#Gerund #Adjective$", chunk: "Verb" },
  // going to walk
  { match: "#Gerund to #Verb", chunk: "Verb" },
  // come and have a drink
  { match: "#PresentTense and #PresentTense", chunk: "Verb" },
  // really not
  { match: "#Adverb #Negative", chunk: "Verb" },
  // want to see
  { match: "(want|wants|wanted) to #Infinitive", chunk: "Verb" },
  // walk ourselves
  { match: "#Verb #Reflexive", chunk: "Verb" },
  // tell him the story
  // { match: '#PresentTense [#Pronoun] #Determiner', group: 0, chunk: 'Verb' },
  // tries to walk
  { match: "#Verb [to] #Adverb? #Infinitive", group: 0, chunk: "Verb" },
  // upon seeing
  { match: "[#Preposition] #Gerund", group: 0, chunk: "Verb" },
  // ensure that
  { match: "#Infinitive [that] <Noun>", group: 0, chunk: "Verb" },
  // === Noun ===
  // the brown fox
  // { match: '#Determiner #Adjective+ #Noun', chunk: 'Noun' },
  // the fox
  // { match: '(the|this) <Noun>', chunk: 'Noun' },
  // brown fox
  // { match: '#Adjective+ <Noun>', chunk: 'Noun' },
  // --- of ---
  // son of a gun
  { match: "#Noun of #Determiner? #Noun", chunk: "Noun" },
  // 3 beautiful women
  { match: "#Value+ #Adverb? #Adjective", chunk: "Noun" },
  // the last russian tsar
  { match: "the [#Adjective] #Noun", chunk: "Noun" },
  // breakfast in bed
  { match: "#Singular in #Determiner? #Singular", chunk: "Noun" },
  // Some citizens in this Canadian capital
  { match: "#Plural [in] #Determiner? #Noun", group: 0, chunk: "Pivot" },
  // indoor and outdoor seating
  { match: "#Noun and #Determiner? #Noun", notIf: "(#Possessive|#Pronoun)", chunk: "Noun" }
  //  boys and girls
  // { match: '#Plural and #Determiner? #Plural', chunk: 'Noun' },
  // tomatoes and cheese
  // { match: '#Noun and #Determiner? #Noun', notIf: '#Pronoun', chunk: 'Noun' },
  // that is why
  // { match: '[that] (is|was)', group: 0, chunk: 'Noun' },
];
let fn = null;
const Zm = function(e, t, n) {
  const { methods: r } = n;
  fn = fn || r.one.buildNet(_m, n), e.sweep(fn);
}, pn = function(e, t) {
  if ((typeof process > "u" || !process.env ? self.env || {} : process.env).DEBUG_CHUNKS) {
    const r = (e.normal + "'").padEnd(8);
    console.log(`  | '${r}  →  \x1B[34m${t.padEnd(12)}\x1B[0m \x1B[2m -fallback- \x1B[0m`);
  }
  e.chunk = t;
}, Xm = function(e) {
  for (let t = 0; t < e.length; t += 1)
    for (let n = 0; n < e[t].length; n += 1) {
      const r = e[t][n];
      r.chunk === void 0 && (r.tags.has("Conjunction") || r.tags.has("Preposition") ? pn(r, "Pivot") : r.tags.has("Adverb") ? pn(r, "Verb") : r.chunk = "Noun");
    }
}, Ym = function(e) {
  const t = [];
  let n = null;
  e.forEach((r) => {
    for (let o = 0; o < r.length; o += 1) {
      const a = r[o];
      n && a.chunk === n ? t[t.length - 1].terms.push(a) : (t.push({ chunk: a.chunk, terms: [a] }), n = a.chunk);
    }
  }), t.forEach((r) => {
    r.chunk === "Verb" && (r.terms.find((a) => a.tags.has("Verb")) || r.terms.forEach((a) => a.chunk = null));
  });
}, e0 = function(e) {
  const { document: t, world: n } = e;
  Rm(t), Qm(t), Zm(e, t, n), Xm(t), Ym(t);
}, t0 = { chunks: e0 }, n0 = {
  compute: t0,
  api: qm,
  hooks: ["chunks"]
}, Ft = /\./g, r0 = function(e) {
  class t extends e {
    constructor(r, o, a) {
      super(r, o, a), this.viewType = "Acronyms";
    }
    strip() {
      return this.docs.forEach((r) => {
        r.forEach((o) => {
          o.text = o.text.replace(Ft, ""), o.normal = o.normal.replace(Ft, "");
        });
      }), this;
    }
    addPeriods() {
      return this.docs.forEach((r) => {
        r.forEach((o) => {
          o.text = o.text.replace(Ft, ""), o.normal = o.normal.replace(Ft, ""), o.text = o.text.split("").join(".") + ".", o.normal = o.normal.split("").join(".") + ".";
        });
      }), this;
    }
  }
  e.prototype.acronyms = function(n) {
    let r = this.match("#Acronym");
    return r = r.getNth(n), new t(r.document, r.pointer);
  };
}, ei = /\(/, ti = /\)/, o0 = function(e, t) {
  for (; t < e.length; t += 1)
    if (e[t].post && ti.test(e[t].post)) {
      let [, n] = e[t].index;
      return n = n || 0, n;
    }
  return null;
}, a0 = function(e) {
  const t = [];
  return e.docs.forEach((n) => {
    for (let r = 0; r < n.length; r += 1) {
      const o = n[r];
      if (o.pre && ei.test(o.pre)) {
        const a = o0(n, r);
        if (a !== null) {
          const [i, s] = n[r].index;
          t.push([i, s, a + 1, n[r].id]), r = a;
        }
      }
    }
  }), e.update(t);
}, i0 = function(e) {
  return e.docs.forEach((t) => {
    t[0].pre = t[0].pre.replace(ei, "");
    const n = t[t.length - 1];
    n.post = n.post.replace(ti, "");
  }), e;
}, s0 = function(e) {
  class t extends e {
    constructor(r, o, a) {
      super(r, o, a), this.viewType = "Possessives";
    }
    strip() {
      return i0(this);
    }
  }
  e.prototype.parentheses = function(n) {
    let r = a0(this);
    return r = r.getNth(n), new t(r.document, r.pointer);
  };
}, Eo = /'s$/, u0 = function(e) {
  let t = e.match("#Possessive+");
  return t.has("#Person") && (t = t.growLeft("#Person+")), t.has("#Place") && (t = t.growLeft("#Place+")), t.has("#Organization") && (t = t.growLeft("#Organization+")), t;
}, c0 = function(e) {
  class t extends e {
    constructor(r, o, a) {
      super(r, o, a), this.viewType = "Possessives";
    }
    strip() {
      return this.docs.forEach((r) => {
        r.forEach((o) => {
          o.text = o.text.replace(Eo, ""), o.normal = o.normal.replace(Eo, "");
        });
      }), this;
    }
  }
  e.prototype.possessives = function(n) {
    let r = u0(this);
    return r = r.getNth(n), new t(r.document, r.pointer);
  };
}, qt = {
  '"': '"',
  // 'StraightDoubleQuotes'
  "＂": "＂",
  // 'StraightDoubleQuotesWide'
  "'": "'",
  // 'StraightSingleQuotes'
  "“": "”",
  // 'CommaDoubleQuotes'
  "‘": "’",
  // 'CommaSingleQuotes'
  "‟": "”",
  // 'CurlyDoubleQuotesReversed'
  "‛": "’",
  // 'CurlySingleQuotesReversed'
  "„": "”",
  // 'LowCurlyDoubleQuotes'
  "⹂": "”",
  // 'LowCurlyDoubleQuotesReversed'
  "‚": "’",
  // 'LowCurlySingleQuotes'
  "«": "»",
  // 'AngleDoubleQuotes' «, »
  "‹": "›",
  // 'AngleSingleQuotes'
  // Prime 'non quotation'
  "‵": "′",
  // 'PrimeSingleQuotes'
  "‶": "″",
  // 'PrimeDoubleQuotes'
  "‷": "‴",
  // 'PrimeTripleQuotes'
  // Prime 'quotation' variation
  "〝": "〞",
  // 'PrimeDoubleQuotes'
  "`": "´",
  // 'PrimeSingleQuotes'
  "〟": "〞"
  // 'LowPrimeDoubleQuotesReversed'
}, tr = RegExp("[" + Object.keys(qt).join("") + "]"), l0 = RegExp("[" + Object.values(qt).join("") + "]"), h0 = function(e, t) {
  const n = e[t].pre.match(tr)[0] || "";
  if (!n || !qt[n])
    return null;
  const r = qt[n];
  for (; t < e.length; t += 1)
    if (e[t].post && e[t].post.match(r))
      return t;
  return null;
}, d0 = function(e) {
  const t = [];
  return e.docs.forEach((n) => {
    for (let r = 0; r < n.length; r += 1) {
      const o = n[r];
      if (o.pre && tr.test(o.pre)) {
        const a = h0(n, r);
        if (a !== null) {
          const [i, s] = n[r].index;
          t.push([i, s, a + 1, n[r].id]), r = a;
        }
      }
    }
  }), e.update(t);
}, f0 = function(e) {
  e.docs.forEach((t) => {
    t[0].pre = t[0].pre.replace(tr, "");
    const n = t[t.length - 1];
    n.post = n.post.replace(l0, "");
  });
}, p0 = function(e) {
  class t extends e {
    constructor(r, o, a) {
      super(r, o, a), this.viewType = "Possessives";
    }
    strip() {
      return f0(this);
    }
  }
  e.prototype.quotations = function(n) {
    let r = d0(this);
    return r = r.getNth(n), new t(r.document, r.pointer);
  };
}, g0 = function(e) {
  let t = this.splitAfter("@hasComma");
  return t = t.match("#PhoneNumber+"), t = t.getNth(e), t;
}, m0 = [
  ["hyphenated", "@hasHyphen ."],
  ["hashTags", "#HashTag"],
  ["emails", "#Email"],
  ["emoji", "#Emoji"],
  ["emoticons", "#Emoticon"],
  ["atMentions", "#AtMention"],
  ["urls", "#Url"],
  // ['pronouns', '#Pronoun'],
  ["conjunctions", "#Conjunction"],
  ["prepositions", "#Preposition"],
  ["abbreviations", "#Abbreviation"],
  ["honorifics", "#Honorific"]
], y0 = [
  ["emojis", "emoji"],
  ["atmentions", "atMentions"]
], b0 = function(e) {
  m0.forEach((t) => {
    e.prototype[t[0]] = function(n) {
      const r = this.match(t[1]);
      return typeof n == "number" ? r.get(n) : r;
    };
  }), e.prototype.phoneNumbers = g0, y0.forEach((t) => {
    e.prototype[t[0]] = e.prototype[t[1]];
  });
}, v0 = /\//, w0 = function(e) {
  class t extends e {
    constructor(r, o, a) {
      super(r, o, a), this.viewType = "Slashes";
    }
    split() {
      return this.map((r) => {
        const a = r.text().split(v0);
        return r = r.replaceWith(a.join(" ")), r.growRight("(" + a.join("|") + ")+");
      });
    }
  }
  e.prototype.slashes = function(n) {
    let r = this.match("#SlashedTerm");
    return r = r.getNth(n), new t(r.document, r.pointer);
  };
}, P0 = {
  api: function(e) {
    r0(e), s0(e), c0(e), p0(e), b0(e), w0(e);
  }
}, zt = function(e, t) {
  e.docs.forEach((n) => {
    n.forEach(t);
  });
}, Go = {
  // remove titlecasing, uppercase
  case: (e) => {
    zt(e, (t) => {
      t.text = t.text.toLowerCase();
    });
  },
  // visually romanize/anglicize 'Björk' into 'Bjork'.
  unicode: (e) => {
    const t = e.world, n = t.methods.one.killUnicode;
    zt(e, (r) => r.text = n(r.text, t));
  },
  // remove hyphens, newlines, and force one space between words
  whitespace: (e) => {
    zt(e, (t) => {
      t.post = t.post.replace(/\s+/g, " "), t.post = t.post.replace(/\s([.,?!:;])/g, "$1"), t.pre = t.pre.replace(/\s+/g, "");
    });
  },
  // remove commas, semicolons - but keep sentence-ending punctuation
  punctuation: (e) => {
    zt(e, (r) => {
      r.post = r.post.replace(/[–—-]/g, " "), r.post = r.post.replace(/[,:;]/g, ""), r.post = r.post.replace(/\.{2,}/g, ""), r.post = r.post.replace(/\?{2,}/g, "?"), r.post = r.post.replace(/!{2,}/g, "!"), r.post = r.post.replace(/\?!+/g, "?");
    });
    const t = e.docs, n = t[t.length - 1];
    if (n && n.length > 0) {
      const r = n[n.length - 1];
      r.post = r.post.replace(/ /g, "");
    }
  },
  // ====== subsets ===
  // turn "isn't" to "is not"
  contractions: (e) => {
    e.contractions().expand();
  },
  //remove periods from acronyms, like 'F.B.I.'
  acronyms: (e) => {
    e.acronyms().strip();
  },
  //remove words inside brackets (like these)
  parentheses: (e) => {
    e.parentheses().strip();
  },
  // turn "Google's tax return" to "Google tax return"
  possessives: (e) => {
    e.possessives().strip();
  },
  // turn "tax return" to tax return
  quotations: (e) => {
    e.quotations().strip();
  },
  // remove them
  emoji: (e) => {
    e.emojis().remove();
  },
  //turn 'Vice Admiral John Smith' to 'John Smith'
  honorifics: (e) => {
    e.match("#Honorific+ #Person").honorifics().remove();
  },
  // remove needless adverbs
  adverbs: (e) => {
    e.adverbs().remove();
  },
  // turn "batmobiles" into "batmobile"
  nouns: (e) => {
    e.nouns().toSingular();
  },
  // turn all verbs into Infinitive form - "I walked" → "I walk"
  verbs: (e) => {
    e.verbs().toInfinitive();
  },
  // turn "fifty" into "50"
  numbers: (e) => {
    e.numbers().toNumber();
  },
  /** remove bullets from beginning of phrase */
  debullet: (e) => {
    const t = /^\s*([-–—*•])\s*$/;
    return e.docs.forEach((n) => {
      t.test(n[0].pre) && (n[0].pre = n[0].pre.replace(t, ""));
    }), e;
  }
}, gn = (e) => e.split("|").reduce((t, n) => (t[n] = !0, t), {}), mn = "unicode|punctuation|whitespace|acronyms", Oo = "|case|contractions|parentheses|quotations|emoji|honorifics|debullet", k0 = "|possessives|adverbs|nouns|verbs", A0 = {
  light: gn(mn),
  medium: gn(mn + Oo),
  heavy: gn(mn + Oo + k0)
};
function C0(e) {
  e.prototype.normalize = function(t = "light") {
    return typeof t == "string" && (t = A0[t]), Object.keys(t).forEach((n) => {
      Go.hasOwnProperty(n) && Go[n](this, t[n]);
    }), this;
  };
}
const N0 = {
  api: C0
}, x0 = function(e) {
  let t = e.clauses().match("<Noun>"), n = t.match("@hasComma");
  return n = n.not("#Place"), n.found && (t = t.splitAfter(n)), t = t.splitOn("#Expression"), t = t.splitOn("(he|she|we|you|they|i)"), t = t.splitOn("(#Noun|#Adjective) [(he|him|she|it)]", 0), t = t.splitOn("[(he|him|she|it)] (#Determiner|#Value)", 0), t = t.splitBefore("#Noun [(the|a|an)] #Adjective? #Noun", 0), t = t.splitOn("[(here|there)] #Noun", 0), t = t.splitOn("[#Noun] (here|there)", 0), t = t.splitBefore("(our|my|their|your)"), t = t.splitOn("#Noun [#Determiner]", 0), t = t.if("#Noun"), t;
}, Fo = [
  "after",
  "although",
  "as if",
  "as long as",
  "as",
  "because",
  "before",
  "even if",
  "even though",
  "ever since",
  "if",
  "in order that",
  "provided that",
  "since",
  "so that",
  "than",
  "that",
  "though",
  "unless",
  "until",
  "what",
  "whatever",
  "when",
  "whenever",
  "where",
  "whereas",
  "wherever",
  "whether",
  "which",
  "whichever",
  "who",
  "whoever",
  "whom",
  "whomever",
  "whose"
], j0 = function(e) {
  if (e.before("#Preposition$").found)
    return !0;
  if (!e.before().found)
    return !1;
  for (let n = 0; n < Fo.length; n += 1)
    if (e.has(Fo[n]))
      return !0;
  return !1;
}, T0 = "(#Pronoun|#Place|#Value|#Person|#Uncountable|#Month|#WeekDay|#Holiday|#Possessive)", I0 = function(e, t) {
  if (e.has("#Plural") || e.has("#Noun and #Noun") || e.has("(we|they)"))
    return !0;
  if (t.has(T0) === !0 || e.has("#Singular"))
    return !1;
  const n = t.text("normal");
  return n.length > 3 && n.endsWith("s") && !n.endsWith("ss");
}, $0 = function(e) {
  let t = e.clone();
  return t = t.match("#Noun+"), t = t.remove("(#Adjective|#Preposition|#Determiner|#Value)"), t = t.not("#Possessive"), t = t.first(), t.found ? t : e;
}, $e = function(e) {
  const t = $0(e);
  return {
    determiner: e.match("#Determiner").eq(0),
    adjectives: e.match("#Adjective"),
    number: e.values(),
    isPlural: I0(e, t),
    isSubordinate: j0(e),
    root: t
  };
}, zo = (e) => e.text(), D0 = (e) => e.json({ terms: !1, normal: !0 }).map((t) => t.normal), H0 = function(e) {
  if (!e.found)
    return null;
  const n = e.values(0);
  return n.found ? (n.parse()[0] || {}).num : null;
}, E0 = function(e) {
  const t = $e(e);
  return {
    root: zo(t.root),
    number: H0(t.number),
    determiner: zo(t.determiner),
    adjectives: D0(t.adjectives),
    isPlural: t.isPlural,
    isSubordinate: t.isSubordinate
  };
}, ni = function(e) {
  return !e.has("^(#Uncountable|#ProperNoun|#Place|#Pronoun|#Acronym)+$");
}, G0 = { tags: !0 }, O0 = function(e, t) {
  if (t.isPlural === !0 || (t.root.has("#Possessive") && (t.root = t.root.possessives().strip()), !ni(t.root)))
    return e;
  const { methods: n, model: r } = e.world, { toPlural: o } = n.two.transform.noun, a = t.root.text({ keepPunct: !1 }), i = o(a, r);
  e.match(t.root).replaceWith(i, G0).tag("Plural", "toPlural"), t.determiner.has("(a|an)") && e.remove(t.determiner);
  const s = t.root.after("not? #Adverb+? [#Copula]", 0);
  return s.found && (s.has("is") ? e.replace(s, "are") : s.has("was") && e.replace(s, "were")), e;
}, F0 = { tags: !0 }, z0 = function(e, t) {
  if (t.isPlural === !1)
    return e;
  const { methods: n, model: r } = e.world, { toSingular: o } = n.two.transform.noun, a = t.root.text("normal"), i = o(a, r);
  return e.replace(t.root, i, F0).tag("Singular", "toPlural"), e;
}, V0 = function(e) {
  class t extends e {
    constructor(r, o, a) {
      super(r, o, a), this.viewType = "Nouns";
    }
    parse(r) {
      return this.getNth(r).map($e);
    }
    json(r) {
      const o = typeof r == "object" ? r : {};
      return this.getNth(r).map((a) => {
        const i = a.toView().json(o)[0] || {};
        return o && o.noun !== !1 && (i.noun = E0(a)), i;
      }, []);
    }
    conjugate(r) {
      const o = this.world.methods.two.transform.noun;
      return this.getNth(r).map((a) => {
        const i = $e(a), s = i.root.compute("root").text("root"), u = {
          Singular: s
        };
        return ni(i.root) && (u.Plural = o.toPlural(s, this.model)), u.Singular === u.Plural && delete u.Plural, u;
      }, []);
    }
    isPlural(r) {
      return this.filter((a) => $e(a).isPlural).getNth(r);
    }
    isSingular(r) {
      return this.filter((a) => !$e(a).isPlural).getNth(r);
    }
    adjectives(r) {
      let o = this.update([]);
      return this.forEach((a) => {
        const i = $e(a).adjectives;
        i.found && (o = o.concat(i));
      }), o.getNth(r);
    }
    toPlural(r) {
      return this.getNth(r).map((o) => O0(o, $e(o)));
    }
    toSingular(r) {
      return this.getNth(r).map((o) => {
        const a = $e(o);
        return z0(o, a);
      });
    }
    // create a new View, from this one
    update(r) {
      const o = new t(this.document, r);
      return o._cache = this._cache, o;
    }
  }
  e.prototype.nouns = function(n) {
    let r = x0(this);
    return r = r.getNth(n), new t(this.document, r.pointer);
  };
}, B0 = {
  api: V0
}, S0 = function(e, t) {
  let n = e.match("#Fraction+");
  return n = n.filter((r) => !r.lookBehind("#Value and$").found), n = n.notIf("#Value seconds"), n;
}, M0 = (e) => {
  const t = [
    {
      reg: /^(minus|negative)[\s-]/i,
      mult: -1
    },
    {
      reg: /^(a\s)?half[\s-](of\s)?/i,
      mult: 0.5
    }
    //  {
    //   reg: /^(a\s)?quarter[\s\-]/i,
    //   mult: 0.25
    // }
  ];
  for (let n = 0; n < t.length; n++)
    if (t[n].reg.test(e) === !0)
      return {
        amount: t[n].mult,
        str: e.replace(t[n].reg, "")
      };
  return {
    amount: 1,
    str: e
  };
}, G = {
  ones: {
    zeroth: 0,
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5,
    sixth: 6,
    seventh: 7,
    eighth: 8,
    ninth: 9,
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9
  },
  teens: {
    tenth: 10,
    eleventh: 11,
    twelfth: 12,
    thirteenth: 13,
    fourteenth: 14,
    fifteenth: 15,
    sixteenth: 16,
    seventeenth: 17,
    eighteenth: 18,
    nineteenth: 19,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19
  },
  tens: {
    twentieth: 20,
    thirtieth: 30,
    fortieth: 40,
    fourtieth: 40,
    fiftieth: 50,
    sixtieth: 60,
    seventieth: 70,
    eightieth: 80,
    ninetieth: 90,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fourty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90
  },
  multiples: {
    hundredth: 100,
    thousandth: 1e3,
    millionth: 1e6,
    billionth: 1e9,
    trillionth: 1e12,
    quadrillionth: 1e15,
    quintillionth: 1e18,
    sextillionth: 1e21,
    septillionth: 1e24,
    hundred: 100,
    thousand: 1e3,
    million: 1e6,
    billion: 1e9,
    trillion: 1e12,
    quadrillion: 1e15,
    quintillion: 1e18,
    sextillion: 1e21,
    septillion: 1e24,
    grand: 1e3
  }
}, L0 = (e, t) => {
  if (G.ones.hasOwnProperty(e)) {
    if (t.ones || t.teens)
      return !1;
  } else if (G.teens.hasOwnProperty(e)) {
    if (t.ones || t.teens || t.tens)
      return !1;
  } else if (G.tens.hasOwnProperty(e) && (t.ones || t.teens || t.tens))
    return !1;
  return !0;
}, K0 = function(e) {
  let t = "0.";
  for (let n = 0; n < e.length; n++) {
    const r = e[n];
    if (G.ones.hasOwnProperty(r) === !0)
      t += G.ones[r];
    else if (G.teens.hasOwnProperty(r) === !0)
      t += G.teens[r];
    else if (G.tens.hasOwnProperty(r) === !0)
      t += G.tens[r];
    else if (/^[0-9]$/.test(r) === !0)
      t += r;
    else
      return 0;
  }
  return parseFloat(t);
}, W0 = (e) => (e = e.replace(/1st$/, "1"), e = e.replace(/2nd$/, "2"), e = e.replace(/3rd$/, "3"), e = e.replace(/([4567890])r?th$/, "$1"), e = e.replace(/^[$€¥£¢]/, ""), e = e.replace(/[%$€¥£¢]$/, ""), e = e.replace(/,/g, ""), e = e.replace(/([0-9])([a-z\u00C0-\u00FF]{1,2})$/, "$1"), e), J0 = /^([0-9,. ]+)\/([0-9,. ]+)$/, Vo = {
  "a few": 3,
  "a couple": 2,
  "a dozen": 12,
  "two dozen": 24,
  zero: 0
}, Vt = (e) => Object.keys(e).reduce((t, n) => (t += e[n], t), 0), zn = function(e) {
  if (Vo.hasOwnProperty(e) === !0)
    return Vo[e];
  if (e === "a" || e === "an")
    return 1;
  const t = M0(e);
  e = t.str;
  let n = null, r = {}, o = 0, a = !1;
  const i = e.split(/[ -]/);
  for (let s = 0; s < i.length; s++) {
    let u = i[s];
    if (u = W0(u), !u || u === "and")
      continue;
    if (u === "-" || u === "negative") {
      a = !0;
      continue;
    }
    if (u.charAt(0) === "-" && (a = !0, u = u.substring(1)), u === "point")
      return o += Vt(r), o += K0(i.slice(s + 1, i.length)), o *= t.amount, o;
    const l = u.match(J0);
    if (l) {
      const c = parseFloat(l[1].replace(/[, ]/g, "")), h = parseFloat(l[2].replace(/[, ]/g, ""));
      h && (o += c / h || 0);
      continue;
    }
    if (G.tens.hasOwnProperty(u) && r.ones && Object.keys(r).length === 1 && (o = r.ones * 100, r = {}), L0(u, r) === !1)
      return null;
    if (/^[0-9.]+$/.test(u))
      r.ones = parseFloat(u);
    else if (G.ones.hasOwnProperty(u) === !0)
      r.ones = G.ones[u];
    else if (G.teens.hasOwnProperty(u) === !0)
      r.teens = G.teens[u];
    else if (G.tens.hasOwnProperty(u) === !0)
      r.tens = G.tens[u];
    else if (G.multiples.hasOwnProperty(u) === !0) {
      let c = G.multiples[u];
      if (c === n)
        return null;
      if (c === 100 && i[s + 1] !== void 0) {
        const h = i[s + 1];
        G.multiples[h] && (c *= G.multiples[h], s += 1);
      }
      n === null || c < n ? (o += (Vt(r) || 1) * c, n = c, r = {}) : (o += Vt(r), n = c, o = (o || 1) * c, r = {});
    }
  }
  return o += Vt(r), o *= t.amount, o *= a ? -1 : 1, o === 0 && Object.keys(r).length === 0 ? null : o;
}, Bo = /s$/, pt = function(e) {
  const t = e.text("reduced");
  return zn(t);
}, Rt = {
  half: 2,
  halve: 2,
  quarter: 4
}, U0 = function(e) {
  const n = e.text("reduced").match(/^([-+]?[0-9]+)\/([-+]?[0-9]+)(st|nd|rd|th)?s?$/);
  return n && n[1] && n[0] ? {
    numerator: Number(n[1]),
    denominator: Number(n[2])
  } : null;
}, q0 = function(e) {
  const t = e.match("[<num>#Value+] out of every? [<den>#Value+]");
  if (t.found !== !0)
    return null;
  let { num: n, den: r } = t.groups();
  return !n || !r || (n = pt(n), r = pt(r), !n || !r) ? null : typeof n == "number" && typeof r == "number" ? {
    numerator: n,
    denominator: r
  } : null;
}, R0 = function(e) {
  const t = e.match("[<num>(#Cardinal|a)+] [<den>#Fraction+]");
  if (t.found !== !0)
    return null;
  let { num: n, den: r } = t.groups();
  n.has("a") ? n = 1 : n = pt(n);
  let o = r.text("reduced");
  return Bo.test(o) && (o = o.replace(Bo, ""), r = r.replaceWith(o)), Rt.hasOwnProperty(o) ? r = Rt[o] : r = pt(r), typeof n == "number" && typeof r == "number" ? {
    numerator: n,
    denominator: r
  } : null;
}, Q0 = function(e) {
  const t = e.match("^#Ordinal$");
  return t.found !== !0 ? null : e.lookAhead("^of .") ? {
    numerator: 1,
    denominator: pt(t)
  } : null;
}, _0 = function(e) {
  const t = e.text("reduced");
  return Rt.hasOwnProperty(t) ? { numerator: 1, denominator: Rt[t] } : null;
}, Z0 = (e) => {
  const t = Math.round(e * 1e3) / 1e3;
  return t === 0 && e !== 0 ? e : t;
}, Pe = function(e) {
  e = e.clone();
  const t = _0(e) || U0(e) || q0(e) || R0(e) || Q0(e) || null;
  return t !== null && t.numerator && t.denominator && (t.decimal = t.numerator / t.denominator, t.decimal = Z0(t.decimal)), t;
}, nr = function(e) {
  if (e < 1e6)
    return String(e);
  let t;
  return typeof e == "number" ? t = e.toFixed(0) : t = e, t.indexOf("e+") === -1 ? t : t.replace(".", "").split("e+").reduce(function(n, r) {
    return n + Array(r - n.length + 2).join(0);
  });
}, Bt = [
  ["ninety", 90],
  ["eighty", 80],
  ["seventy", 70],
  ["sixty", 60],
  ["fifty", 50],
  ["forty", 40],
  ["thirty", 30],
  ["twenty", 20]
], So = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen"
], X0 = [
  [1e24, "septillion"],
  [1e20, "hundred sextillion"],
  [1e21, "sextillion"],
  [1e20, "hundred quintillion"],
  [1e18, "quintillion"],
  [1e17, "hundred quadrillion"],
  [1e15, "quadrillion"],
  [1e14, "hundred trillion"],
  [1e12, "trillion"],
  [1e11, "hundred billion"],
  [1e9, "billion"],
  [1e8, "hundred million"],
  [1e6, "million"],
  [1e5, "hundred thousand"],
  [1e3, "thousand"],
  [100, "hundred"],
  [1, "one"]
], Y0 = function(e) {
  let t = e;
  const n = [];
  return X0.forEach((r) => {
    if (e >= r[0]) {
      const o = Math.floor(t / r[0]);
      t -= o * r[0], o && n.push({
        unit: r[1],
        count: o
      });
    }
  }), n;
}, e1 = function(e) {
  const t = [];
  if (e > 100)
    return t;
  for (let n = 0; n < Bt.length; n++)
    e >= Bt[n][1] && (e -= Bt[n][1], t.push(Bt[n][0]));
  return So[e] && t.push(So[e]), t;
}, t1 = (e) => {
  const t = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"], n = [], o = nr(e).match(/\.([0-9]+)/);
  if (!o || !o[0])
    return n;
  n.push("point");
  const a = o[0].split("");
  for (let i = 0; i < a.length; i++)
    n.push(t[a[i]]);
  return n;
}, gt = function(e) {
  let t = e.num;
  if (t === 0 || t === "0")
    return "zero";
  t > 1e21 && (t = nr(t));
  let n = [];
  t < 0 && (n.push("minus"), t = Math.abs(t));
  const r = Y0(t);
  for (let o = 0; o < r.length; o++) {
    let a = r[o].unit;
    a === "one" && (a = "", n.length > 1 && n.push("and")), n = n.concat(e1(r[o].count)), n.push(a);
  }
  return n = n.concat(t1(t)), n = n.filter((o) => o), n.length === 0 && (n[0] = ""), n.join(" ");
}, n1 = function(e) {
  if (!e.numerator || !e.denominator)
    return "";
  const t = gt({ num: e.numerator }), n = gt({ num: e.denominator });
  return `${t} out of ${n}`;
}, Mo = {
  one: "first",
  two: "second",
  three: "third",
  five: "fifth",
  eight: "eighth",
  nine: "ninth",
  twelve: "twelfth",
  twenty: "twentieth",
  thirty: "thirtieth",
  forty: "fortieth",
  fourty: "fourtieth",
  fifty: "fiftieth",
  sixty: "sixtieth",
  seventy: "seventieth",
  eighty: "eightieth",
  ninety: "ninetieth"
}, ri = (e) => {
  const t = gt(e).split(" "), n = t[t.length - 1];
  return Mo.hasOwnProperty(n) ? t[t.length - 1] = Mo[n] : t[t.length - 1] = n.replace(/y$/, "i") + "th", t.join(" ");
}, r1 = function(e) {
  if (!e.numerator || !e.denominator)
    return "";
  const t = gt({ num: e.numerator });
  let n = ri({ num: e.denominator });
  return e.denominator === 2 && (n = "half"), t && n ? (e.numerator !== 1 && (n += "s"), `${t} ${n}`) : "";
}, o1 = function(e) {
  class t extends e {
    constructor(r, o, a) {
      super(r, o, a), this.viewType = "Fractions";
    }
    parse(r) {
      return this.getNth(r).map(Pe);
    }
    get(r) {
      return this.getNth(r).map(Pe);
    }
    json(r) {
      return this.getNth(r).map((o) => {
        const a = o.toView().json(r)[0], i = Pe(o);
        return a.fraction = i, a;
      }, []);
    }
    // become 0.5
    toDecimal(r) {
      return this.getNth(r).forEach((o) => {
        const { decimal: a } = Pe(o);
        o = o.replaceWith(String(a), !0), o.tag("NumericValue"), o.unTag("Fraction");
      }), this;
    }
    toFraction(r) {
      return this.getNth(r).forEach((o) => {
        const a = Pe(o);
        if (a && typeof a.numerator == "number" && typeof a.denominator == "number") {
          const i = `${a.numerator}/${a.denominator}`;
          this.replace(o, i);
        }
      }), this;
    }
    toOrdinal(r) {
      return this.getNth(r).forEach((o) => {
        const a = Pe(o);
        let i = r1(a);
        o.after("^#Noun").found && (i += " of"), o.replaceWith(i);
      }), this;
    }
    toCardinal(r) {
      return this.getNth(r).forEach((o) => {
        const a = Pe(o), i = n1(a);
        o.replaceWith(i);
      }), this;
    }
    toPercentage(r) {
      return this.getNth(r).forEach((o) => {
        const { decimal: a } = Pe(o);
        let i = a * 100;
        i = Math.round(i * 100) / 100, o.replaceWith(`${i}%`);
      }), this;
    }
  }
  e.prototype.fractions = function(n) {
    let r = S0(this);
    return r = r.getNth(n), new t(this.document, r.pointer);
  };
}, a1 = "one|two|three|four|five|six|seven|eight|nine", Te = "twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|fourty", i1 = "eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen", yn = function(e) {
  let t = e.match("#Value+");
  if (t.has("#NumericValue #NumericValue") && (t.has("#Value @hasComma #Value") ? t.splitAfter("@hasComma") : t.has("#NumericValue #Fraction") ? t.splitAfter("#NumericValue #Fraction") : t = t.splitAfter("#NumericValue")), t.has("#Value #Value #Value") && !t.has("#Multiple") && t.has("(" + Te + ") #Cardinal #Cardinal") && (t = t.splitAfter("(" + Te + ") #Cardinal")), t.has("#Value #Value")) {
    t.has("#NumericValue #NumericValue") && (t = t.splitOn("#Year")), t.has("(" + Te + ") (" + i1 + ")") && (t = t.splitAfter("(" + Te + ")"));
    const n = t.match("#Cardinal #Cardinal");
    if (n.found && !t.has("(point|decimal|#Fraction)") && !n.has("#Cardinal (#Multiple|point|decimal)")) {
      const r = t.has(`(${a1}) (${Te})`), o = n.has("(" + Te + ") #Cardinal"), a = n.has("#Multiple #Value");
      !r && !o && !a && n.terms().forEach((i) => {
        t = t.splitOn(i);
      });
    }
    t.match("#Ordinal #Ordinal").match("#TextValue").found && !t.has("#Multiple") && (t.has("(" + Te + ") #Ordinal") || (t = t.splitAfter("#Ordinal"))), t = t.splitBefore("#Ordinal [#Cardinal]", 0), t.has("#TextValue #NumericValue") && !t.has("(" + Te + "|#Multiple)") && (t = t.splitBefore("#TextValue #NumericValue"));
  }
  return t = t.splitAfter("#NumberRange"), t = t.splitBefore("#Year"), t;
}, s1 = function(e, t) {
  e = e.replace(/,/g, "");
  const n = e.split(/([0-9.,]*)/);
  let [r, o] = n, a = n.slice(2).join("");
  return o !== "" && t.length < 2 ? (o = Number(o || e), typeof o != "number" && (o = null), a = a || "", (a === "st" || a === "nd" || a === "rd" || a === "th") && (a = ""), {
    prefix: r || "",
    num: o,
    suffix: a
  }) : null;
}, L = function(e) {
  if (typeof e == "string")
    return { num: zn(e) };
  let t = e.text("reduced");
  const n = e.growRight("#Unit").match("#Unit$").text("machine"), r = /[0-9],[0-9]/.test(e.text("text"));
  if (e.terms().length === 1 && !e.has("#Multiple")) {
    const s = s1(t, e);
    if (s !== null)
      return s.hasComma = r, s.unit = n, s;
  }
  let o = e.match("#Fraction{2,}$");
  o = o.found === !1 ? e.match("^#Fraction$") : o;
  let a = null;
  o.found && (o.has("#Value and #Value #Fraction") && (o = o.match("and #Value #Fraction")), a = Pe(o), e = e.not(o), e = e.not("and$"), t = e.text("reduced"));
  let i = 0;
  return t && (i = zn(t) || 0), a && a.decimal && (i += a.decimal), {
    hasComma: r,
    prefix: "",
    num: i,
    suffix: "",
    isOrdinal: e.has("#Ordinal"),
    isText: e.has("#TextValue"),
    isFraction: e.has("#Fraction"),
    isMoney: e.has("#Money"),
    unit: n
  };
}, u1 = function(e) {
  const t = e.num;
  if (!t && t !== 0)
    return null;
  const n = t % 100;
  if (n > 10 && n < 20)
    return String(t) + "th";
  const r = {
    0: "th",
    1: "st",
    2: "nd",
    3: "rd"
  };
  let o = nr(t);
  const a = o.slice(o.length - 1, o.length);
  return r[a] ? o += r[a] : o += "th", o;
}, Lo = {
  "¢": "cents",
  $: "dollars",
  "£": "pounds",
  "¥": "yen",
  "€": "euros",
  "₡": "colón",
  "฿": "baht",
  "₭": "kip",
  "₩": "won",
  "₹": "rupees",
  "₽": "ruble",
  "₺": "liras"
}, Ko = {
  "%": "percent",
  // s: 'seconds',
  // cm: 'centimetres',
  // km: 'kilometres',
  // ft: 'feet',
  "°": "degrees"
}, Wo = function(e) {
  const t = {
    suffix: "",
    prefix: e.prefix
  };
  return Lo.hasOwnProperty(e.prefix) && (t.suffix += " " + Lo[e.prefix], t.prefix = ""), Ko.hasOwnProperty(e.suffix) && (t.suffix += " " + Ko[e.suffix]), t.suffix && e.num === 1 && (t.suffix = t.suffix.replace(/s$/, "")), !t.suffix && e.suffix && (t.suffix += " " + e.suffix), t;
}, ze = function(e, t) {
  if (t === "TextOrdinal") {
    const { prefix: r, suffix: o } = Wo(e);
    return r + ri(e) + o;
  }
  if (t === "Ordinal")
    return e.prefix + u1(e) + e.suffix;
  if (t === "TextCardinal") {
    const { prefix: r, suffix: o } = Wo(e);
    return r + gt(e) + o;
  }
  let n = e.num;
  return e.hasComma && (n = n.toLocaleString()), e.prefix + String(n) + e.suffix;
}, c1 = (e) => Object.prototype.toString.call(e) === "[object Array]", l1 = function(e) {
  if (typeof e == "string" || typeof e == "number") {
    const t = {};
    return t[e] = !0, t;
  }
  return c1(e) ? e.reduce((t, n) => (t[n] = !0, t), {}) : e || {};
}, h1 = function(e, t = {}) {
  return t = l1(t), e.filter((n) => {
    const { unit: r } = L(n);
    return !!(r && t[r] === !0);
  });
}, d1 = function(e) {
  class t extends e {
    constructor(r, o, a) {
      super(r, o, a), this.viewType = "Numbers";
    }
    parse(r) {
      return this.getNth(r).map(L);
    }
    get(r) {
      return this.getNth(r).map(L).map((o) => o.num);
    }
    json(r) {
      const o = typeof r == "object" ? r : {};
      return this.getNth(r).map((a) => {
        const i = a.toView().json(o)[0], s = L(a);
        return i.number = {
          prefix: s.prefix,
          num: s.num,
          suffix: s.suffix,
          hasComma: s.hasComma,
          unit: s.unit
        }, i;
      }, []);
    }
    /** any known measurement unit, for the number */
    units() {
      return this.growRight("#Unit").match("#Unit$");
    }
    /** return values that match a given unit */
    isUnit(r) {
      return h1(this, r);
    }
    /** return only ordinal numbers */
    isOrdinal() {
      return this.if("#Ordinal");
    }
    /** return only cardinal numbers*/
    isCardinal() {
      return this.if("#Cardinal");
    }
    /** convert to numeric form like '8' or '8th' */
    toNumber() {
      const r = this.map((o) => {
        if (!this.has("#TextValue"))
          return o;
        const a = L(o);
        if (a.num === null)
          return o;
        const i = o.has("#Ordinal") ? "Ordinal" : "Cardinal", s = ze(a, i);
        return o.replaceWith(s, { tags: !0 }), o.tag("NumericValue");
      });
      return new t(r.document, r.pointer);
    }
    /** add commas, or nicer formatting for numbers */
    toLocaleString() {
      return this.forEach((o) => {
        const a = L(o);
        if (a.num === null)
          return;
        let i = a.num.toLocaleString();
        if (o.has("#Ordinal")) {
          const u = ze(a, "Ordinal").match(/[a-z]+$/);
          u && (i += u[0] || "");
        }
        o.replaceWith(i, { tags: !0 });
      }), this;
    }
    /** convert to numeric form like 'eight' or 'eighth' */
    toText() {
      const o = this.map((a) => {
        if (a.has("#TextValue"))
          return a;
        const i = L(a);
        if (i.num === null)
          return a;
        const s = a.has("#Ordinal") ? "TextOrdinal" : "TextCardinal", u = ze(i, s);
        return a.replaceWith(u, { tags: !0 }), a.tag("TextValue"), a;
      });
      return new t(o.document, o.pointer);
    }
    /** convert ordinal to cardinal form, like 'eight', or '8' */
    toCardinal() {
      const o = this.map((a) => {
        if (!a.has("#Ordinal"))
          return a;
        const i = L(a);
        if (i.num === null)
          return a;
        const s = a.has("#TextValue") ? "TextCardinal" : "Cardinal", u = ze(i, s);
        return a.replaceWith(u, { tags: !0 }), a.tag("Cardinal"), a;
      });
      return new t(o.document, o.pointer);
    }
    /** convert cardinal to ordinal form, like 'eighth', or '8th' */
    toOrdinal() {
      const o = this.map((a) => {
        if (a.has("#Ordinal"))
          return a;
        const i = L(a);
        if (i.num === null)
          return a;
        const s = a.has("#TextValue") ? "TextOrdinal" : "Ordinal", u = ze(i, s);
        return a.replaceWith(u, { tags: !0 }), a.tag("Ordinal"), a;
      });
      return new t(o.document, o.pointer);
    }
    /** return only numbers that are == n */
    isEqual(r) {
      return this.filter((o) => L(o).num === r);
    }
    /** return only numbers that are > n*/
    greaterThan(r) {
      return this.filter((o) => L(o).num > r);
    }
    /** return only numbers that are < n*/
    lessThan(r) {
      return this.filter((o) => L(o).num < r);
    }
    /** return only numbers > min and < max */
    between(r, o) {
      return this.filter((a) => {
        const i = L(a).num;
        return i > r && i < o;
      });
    }
    /** set these number to n */
    set(r) {
      if (r === void 0)
        return this;
      typeof r == "string" && (r = L(r).num);
      const a = this.map((i) => {
        const s = L(i);
        if (s.num = r, s.num === null)
          return i;
        let u = i.has("#Ordinal") ? "Ordinal" : "Cardinal";
        i.has("#TextValue") && (u = i.has("#Ordinal") ? "TextOrdinal" : "TextCardinal");
        let l = ze(s, u);
        return s.hasComma && u === "Cardinal" && (l = Number(l).toLocaleString()), i = i.not("#Currency"), i.replaceWith(l, { tags: !0 }), i;
      });
      return new t(a.document, a.pointer);
    }
    add(r) {
      if (!r)
        return this;
      typeof r == "string" && (r = L(r).num);
      const a = this.map((i) => {
        const s = L(i);
        if (s.num === null)
          return i;
        s.num += r;
        let u = i.has("#Ordinal") ? "Ordinal" : "Cardinal";
        s.isText && (u = i.has("#Ordinal") ? "TextOrdinal" : "TextCardinal");
        const l = ze(s, u);
        return i.replaceWith(l, { tags: !0 }), i;
      });
      return new t(a.document, a.pointer);
    }
    /** decrease each number by n*/
    subtract(r, o) {
      return this.add(r * -1, o);
    }
    /** increase each number by 1 */
    increment(r) {
      return this.add(1, r);
    }
    /** decrease each number by 1 */
    decrement(r) {
      return this.add(-1, r);
    }
    // overloaded - keep Numbers class
    update(r) {
      const o = new t(this.document, r);
      return o._cache = this._cache, o;
    }
  }
  t.prototype.toNice = t.prototype.toLocaleString, t.prototype.isBetween = t.prototype.between, t.prototype.minus = t.prototype.subtract, t.prototype.plus = t.prototype.add, t.prototype.equals = t.prototype.isEqual, e.prototype.numbers = function(n) {
    let r = yn(this);
    return r = r.getNth(n), new t(this.document, r.pointer);
  }, e.prototype.percentages = function(n) {
    let r = yn(this);
    return r = r.filter((o) => o.has("#Percent") || o.after("^percent")), r = r.getNth(n), new t(this.document, r.pointer);
  }, e.prototype.money = function(n) {
    let r = yn(this);
    return r = r.filter((o) => o.has("#Money") || o.after("^#Currency")), r = r.getNth(n), new t(this.document, r.pointer);
  }, e.prototype.values = e.prototype.numbers;
}, f1 = function(e) {
  o1(e), d1(e);
}, p1 = {
  api: f1
  // add @greaterThan, @lessThan
  // mutate: world => {
  //   let termMethods = world.methods.one.termMethods
  //   termMethods.lessThan = function (term) {
  //     return false //TODO: implement
  //     // return /[aeiou]/.test(term.text)
  //   }
  // },
}, g1 = {
  people: !0,
  emails: !0,
  phoneNumbers: !0,
  places: !0
}, m1 = function(e = {}) {
  return e = Object.assign({}, g1, e), e.people !== !1 && this.people().replaceWith("██████████"), e.emails !== !1 && this.emails().replaceWith("██████████"), e.places !== !1 && this.places().replaceWith("██████████"), e.phoneNumbers !== !1 && this.phoneNumbers().replaceWith("███████"), this;
}, y1 = {
  api: function(e) {
    e.prototype.redact = m1;
  }
}, b1 = function(e) {
  const t = e.clauses();
  return /\.\.$/.test(e.out("text")) || e.has("^#QuestionWord") && e.has("@hasComma") ? !1 : !!(e.has("or not$") || e.has("^#QuestionWord") || e.has("^(do|does|did|is|was|can|could|will|would|may) #Noun") || e.has("^(have|must) you") || t.has("(do|does|is|was) #Noun+ #Adverb? (#Adjective|#Infinitive)$"));
}, v1 = function(e) {
  const t = /\?/, { document: n } = e;
  return e.filter((r) => {
    const o = r.docs[0] || [], a = o[o.length - 1];
    return !a || n[a.index[0]].length !== o.length ? !1 : t.test(a.post) ? !0 : b1(r);
  });
}, w1 = "(after|although|as|because|before|if|since|than|that|though|when|whenever|where|whereas|wherever|whether|while|why|unless|until|once)", P1 = "(that|which|whichever|who|whoever|whom|whose|whomever)", k1 = function(e) {
  let t = e;
  return t.length === 1 || (t = t.if("#Verb"), t.length === 1) || (t = t.ifNo(w1), t = t.ifNo("^even (if|though)"), t = t.ifNo("^so that"), t = t.ifNo("^rather than"), t = t.ifNo("^provided that"), t.length === 1) || (t = t.ifNo(P1), t.length === 1) || (t = t.ifNo("(^despite|^during|^before|^through|^throughout)"), t.length === 1) || (t = t.ifNo("^#Gerund"), t.length === 1) ? t : (t.length === 0 && (t = e), t.eq(0));
}, A1 = function(e) {
  let t = null;
  return e.has("#PastTense") ? t = "PastTense" : e.has("#FutureTense") ? t = "FutureTense" : e.has("#PresentTense") && (t = "PresentTense"), {
    tense: t
  };
}, Ve = function(e) {
  const t = e.clauses(), r = k1(t).chunks();
  let o = e.none(), a = e.none(), i = e.none();
  return r.forEach((s, u) => {
    if (u === 0 && !s.has("<Verb>")) {
      o = s;
      return;
    }
    if (!a.found && s.has("<Verb>")) {
      a = s;
      return;
    }
    a.found && (i = i.concat(s));
  }), a.found && !o.found && (o = a.before("<Noun>+").first()), {
    subj: o,
    verb: a,
    pred: i,
    grammar: A1(a)
  };
}, C1 = function(e) {
  let t = e.verbs();
  const n = t.eq(0);
  if (n.has("#PastTense"))
    return e;
  if (n.toPastTense(), t.length > 1) {
    t = t.slice(1), t = t.filter((o) => !o.lookBehind("to$").found), t = t.if("#PresentTense"), t = t.notIf("#Gerund");
    const r = e.match("to #Verb+ #Conjunction #Verb").terms();
    t = t.not(r), t.found && t.verbs().toPastTense();
  }
  return e;
}, N1 = function(e) {
  let t = e.verbs();
  return t.eq(0).toPresentTense(), t.length > 1 && (t = t.slice(1), t = t.filter((r) => !r.lookBehind("to$").found), t = t.notIf("#Gerund"), t.found && t.verbs().toPresentTense()), e;
}, x1 = function(e) {
  let t = e.verbs();
  if (t.eq(0).toFutureTense(), e = e.fullSentence(), t = e.verbs(), t.length > 1) {
    t = t.slice(1);
    const r = t.filter((o) => o.lookBehind("to$").found ? !1 : o.has("#Copula #Gerund") ? !0 : o.has("#Gerund") ? !1 : o.has("#Copula") ? !0 : !(o.has("#PresentTense") && !o.has("#Infinitive") && o.lookBefore("(he|she|it|that|which)$").found));
    r.found && r.forEach((o) => {
      if (o.has("#Copula")) {
        o.match("was").replaceWith("is"), o.match("is").replaceWith("will be");
        return;
      }
      o.toInfinitive();
    });
  }
  return e;
}, j1 = function(e) {
  return e.verbs().first().toNegative().compute("chunks"), e;
}, T1 = function(e) {
  return e.verbs().first().toPositive().compute("chunks"), e;
}, I1 = function(e) {
  return e.verbs().toInfinitive(), e;
}, $1 = function(e) {
  class t extends e {
    constructor(o, a, i) {
      super(o, a, i), this.viewType = "Sentences";
    }
    json(o = {}) {
      return this.map((a) => {
        const i = a.toView().json(o)[0] || {}, { subj: s, verb: u, pred: l, grammar: c } = Ve(a);
        return i.sentence = {
          subject: s.text("normal"),
          verb: u.text("normal"),
          predicate: l.text("normal"),
          grammar: c
        }, i;
      }, []);
    }
    toPastTense(o) {
      return this.getNth(o).map((a) => (Ve(a), C1(a)));
    }
    toPresentTense(o) {
      return this.getNth(o).map((a) => (Ve(a), N1(a)));
    }
    toFutureTense(o) {
      return this.getNth(o).map((a) => (Ve(a), a = x1(a), a));
    }
    toInfinitive(o) {
      return this.getNth(o).map((a) => (Ve(a), I1(a)));
    }
    toNegative(o) {
      return this.getNth(o).map((a) => (Ve(a), j1(a)));
    }
    toPositive(o) {
      return this.getNth(o).map((a) => (Ve(a), T1(a)));
    }
    isQuestion(o) {
      return this.questions(o);
    }
    isExclamation(o) {
      return this.filter((i) => i.lastTerm().has("@hasExclamation")).getNth(o);
    }
    isStatement(o) {
      return this.filter((i) => !i.isExclamation().found && !i.isQuestion().found).getNth(o);
    }
    // overloaded - keep Sentences class
    update(o) {
      const a = new t(this.document, o);
      return a._cache = this._cache, a;
    }
  }
  t.prototype.toPresent = t.prototype.toPresentTense, t.prototype.toPast = t.prototype.toPastTense, t.prototype.toFuture = t.prototype.toFutureTense;
  const n = {
    sentences: function(r) {
      let o = this.map((a) => a.fullSentence());
      return o = o.getNth(r), new t(this.document, o.pointer);
    },
    questions: function(r) {
      return v1(this).getNth(r);
    }
  };
  Object.assign(e.prototype, n);
}, D1 = { api: $1 }, H1 = function(e) {
  let t = e.splitAfter("@hasComma");
  t = t.match("#Honorific+? #Person+");
  const n = t.match("#Possessive").notIf("(his|her)");
  return t = t.splitAfter(n), t;
}, Jo = function(e) {
  const t = {};
  t.firstName = e.match("#FirstName+"), t.lastName = e.match("#LastName+"), t.honorific = e.match("#Honorific+");
  const n = t.lastName, r = t.firstName;
  return (!r.found || !n.found) && !r.found && !n.found && e.has("^#Honorific .$") && (t.lastName = e.match(".$")), t;
}, oe = "male", q = "female", Uo = {
  mr: oe,
  mrs: q,
  miss: q,
  madam: q,
  // british stuff
  king: oe,
  queen: q,
  duke: oe,
  duchess: q,
  baron: oe,
  baroness: q,
  count: oe,
  countess: q,
  prince: oe,
  princess: q,
  sire: oe,
  dame: q,
  lady: q,
  ayatullah: oe,
  //i think?
  congressman: oe,
  congresswoman: q,
  "first lady": q,
  // marked as non-binary
  mx: null
}, E1 = function(e, t) {
  const { firstName: n, honorific: r } = e;
  if (n.has("#FemaleName"))
    return q;
  if (n.has("#MaleName"))
    return oe;
  if (r.found) {
    let a = r.text("normal");
    if (a = a.replace(/\./g, ""), Uo.hasOwnProperty(a))
      return Uo[a];
    if (/^her /.test(a))
      return q;
    if (/^his /.test(a))
      return oe;
  }
  const o = t.after();
  if (!o.has("#Person") && o.has("#Pronoun")) {
    const a = o.match("#Pronoun");
    if (a.has("(they|their)"))
      return null;
    const i = a.has("(he|his)"), s = a.has("(she|her|hers)");
    if (i && !s)
      return oe;
    if (s && !i)
      return q;
  }
  return null;
}, G1 = function(e) {
  class t extends e {
    constructor(r, o, a) {
      super(r, o, a), this.viewType = "People";
    }
    parse(r) {
      return this.getNth(r).map(Jo);
    }
    json(r) {
      const o = typeof r == "object" ? r : {};
      return this.getNth(r).map((a) => {
        const i = a.toView().json(o)[0], s = Jo(a);
        return i.person = {
          firstName: s.firstName.text("normal"),
          lastName: s.lastName.text("normal"),
          honorific: s.honorific.text("normal"),
          presumed_gender: E1(s, a)
        }, i;
      }, []);
    }
    // used for co-reference resolution only
    presumedMale() {
      return this.filter((r) => r.has("(#MaleName|mr|mister|sr|jr|king|pope|prince|sir)"));
    }
    presumedFemale() {
      return this.filter((r) => r.has("(#FemaleName|mrs|miss|queen|princess|madam)"));
    }
    // overloaded - keep People class
    update(r) {
      const o = new t(this.document, r);
      return o._cache = this._cache, o;
    }
  }
  e.prototype.people = function(n) {
    let r = H1(this);
    return r = r.getNth(n), new t(this.document, r.pointer);
  };
}, O1 = function(e) {
  let t = e.match("(#Place|#Address)+"), n = t.match("@hasComma");
  return n = n.filter((r) => r.has("(asia|africa|europe|america)$") ? !0 : !(r.has("(#City|#Region|#ProperNoun)$") && r.after("^(#Country|#Region)").found)), t = t.splitAfter(n), t;
}, F1 = function(e) {
  e.prototype.places = function(t) {
    let n = O1(this);
    return n = n.getNth(t), new e(this.document, n.pointer);
  };
}, z1 = function(e) {
  e.prototype.organizations = function(t) {
    return this.match("#Organization+").getNth(t);
  };
}, V1 = function(e) {
  const t = this.clauses();
  let n = t.people();
  return n = n.concat(t.places()), n = n.concat(t.organizations()), n = n.not("(someone|man|woman|mother|brother|sister|father)"), n = n.sort("seq"), n = n.getNth(e), n;
}, B1 = function(e) {
  e.prototype.topics = V1;
}, S1 = function(e) {
  G1(e), F1(e), z1(e), B1(e);
}, M1 = { api: S1 }, L1 = function(e) {
  let t = e.match("<Verb>");
  return t = t.not("#Conjunction"), t = t.not("#Preposition"), t = t.splitAfter("@hasComma"), t = t.splitAfter("[(do|did|am|was|is|will)] (is|was)", 0), t = t.splitBefore("(#Verb && !#Copula) [being] #Verb", 0), t = t.splitBefore("#Verb [to be] #Verb", 0), t = t.splitAfter("[help] #PresentTense", 0), t = t.splitBefore("(#PresentTense|#PastTense) [#Copula]$", 0), t = t.splitBefore("(#PresentTense|#PastTense) [will be]$", 0), t = t.splitBefore("(#PresentTense|#PastTense) [(had|has)]", 0), t = t.not("#Reflexive$"), t = t.not("#Adjective"), t = t.splitAfter("[#PastTense] #PastTense", 0), t = t.splitAfter("[#PastTense] #Auxiliary+ #PastTense", 0), t = t.splitAfter("#Copula [#Gerund] #PastTense", 0), t = t.if("#Verb"), t.has("(#Verb && !#Auxiliary) #Adverb+? #Copula") && (t = t.splitBefore("#Copula")), t;
}, K1 = function(e) {
  let t = e;
  return e.wordCount() > 1 && (t = e.not("(#Negative|#Auxiliary|#Modal|#Adverb|#Prefix)")), t.length > 1 && !t.has("#Phrasal #Particle") && (t = t.last()), t = t.not("(want|wants|wanted) to"), t.found || (t = e.not("#Negative")), t;
}, W1 = function(e, t) {
  const n = {
    pre: e.none(),
    post: e.none()
  };
  if (!e.has("#Adverb"))
    return n;
  const r = e.splitOn(t);
  return r.length === 3 ? {
    pre: r.eq(0).adverbs(),
    post: r.eq(2).adverbs()
  } : r.eq(0).isDoc(t) ? (n.post = r.eq(1).adverbs(), n) : (n.pre = r.eq(0).adverbs(), n);
}, J1 = function(e, t) {
  const n = e.splitBefore(t);
  if (n.length <= 1)
    return e.none();
  let r = n.eq(0);
  return r = r.not("(#Adverb|#Negative|#Prefix)"), r;
}, U1 = function(e) {
  return e.match("#Negative");
}, q1 = function(e) {
  if (!e.has("(#Particle|#PhrasalVerb)"))
    return {
      verb: e.none(),
      particle: e.none()
    };
  const t = e.match("#Particle$");
  return {
    verb: e.not(t),
    particle: t
  };
}, le = function(e) {
  const t = e.clone();
  t.contractions().expand();
  const n = K1(t);
  return {
    root: n,
    prefix: t.match("#Prefix"),
    adverbs: W1(t, n),
    auxiliary: J1(t, n),
    negative: U1(t),
    phrasal: q1(n)
  };
}, ce = { tense: "PresentTense" }, St = { conditional: !0 }, we = { tense: "FutureTense" }, _e = { progressive: !0 }, B = { tense: "PastTense" }, Ze = { complete: !0, progressive: !1 }, Ie = { passive: !0 }, R1 = { plural: !0 }, Q1 = { plural: !1 }, _1 = function(e) {
  const t = {};
  return e.forEach((n) => {
    Object.assign(t, n);
  }), t;
}, qo = {
  // === Simple ===
  imperative: [
    // walk!
    ["#Imperative", []]
  ],
  "want-infinitive": [
    ["^(want|wants|wanted) to #Infinitive$", [ce]],
    ["^wanted to #Infinitive$", [B]],
    ["^will want to #Infinitive$", [we]]
  ],
  "gerund-phrase": [
    // started looking
    ["^#PastTense #Gerund$", [B]],
    // starts looking
    ["^#PresentTense #Gerund$", [ce]],
    // start looking
    ["^#Infinitive #Gerund$", [ce]],
    // will start looking
    ["^will #Infinitive #Gerund$", [we]],
    // have started looking
    ["^have #PastTense #Gerund$", [B]],
    // will have started looking
    ["^will have #PastTense #Gerund$", [B]]
  ],
  "simple-present": [
    // he walks',
    ["^#PresentTense$", [ce]],
    // we walk
    ["^#Infinitive$", [ce]]
  ],
  "simple-past": [
    // he walked',
    ["^#PastTense$", [B]]
  ],
  "simple-future": [
    // he will walk
    ["^will #Adverb? #Infinitive", [we]]
  ],
  // === Progressive ===
  "present-progressive": [
    // he is walking
    ["^(is|are|am) #Gerund$", [ce, _e]]
  ],
  "past-progressive": [
    // he was walking
    ["^(was|were) #Gerund$", [B, _e]]
  ],
  "future-progressive": [
    // he will be
    ["^will be #Gerund$", [we, _e]]
  ],
  // === Perfect ===
  "present-perfect": [
    // he has walked
    ["^(has|have) #PastTense$", [B, Ze]]
    //past?
  ],
  "past-perfect": [
    // he had walked
    ["^had #PastTense$", [B, Ze]],
    // had been to see
    ["^had #PastTense to #Infinitive", [B, Ze]]
  ],
  "future-perfect": [
    // he will have
    ["^will have #PastTense$", [we, Ze]]
  ],
  // === Progressive-perfect ===
  "present-perfect-progressive": [
    // he has been walking
    ["^(has|have) been #Gerund$", [B, _e]]
    //present?
  ],
  "past-perfect-progressive": [
    // he had been
    ["^had been #Gerund$", [B, _e]]
  ],
  "future-perfect-progressive": [
    // will have been
    ["^will have been #Gerund$", [we, _e]]
  ],
  // ==== Passive ===
  "passive-past": [
    // got walked, was walked, were walked
    ["(got|were|was) #Passive", [B, Ie]],
    // was being walked
    ["^(was|were) being #Passive", [B, Ie]],
    // had been walked, have been eaten
    ["^(had|have) been #Passive", [B, Ie]]
  ],
  "passive-present": [
    // is walked, are stolen
    ["^(is|are|am) #Passive", [ce, Ie]],
    // is being walked
    ["^(is|are|am) being #Passive", [ce, Ie]],
    // has been cleaned
    ["^has been #Passive", [ce, Ie]]
  ],
  "passive-future": [
    // will have been walked
    ["will have been #Passive", [we, Ie, St]],
    // will be cleaned
    ["will be being? #Passive", [we, Ie, St]]
  ],
  // === Conditional ===
  "present-conditional": [
    // would be walked
    ["would be #PastTense", [ce, St]]
  ],
  "past-conditional": [
    // would have been walked
    ["would have been #PastTense", [B, St]]
  ],
  // ==== Auxiliary ===
  "auxiliary-future": [
    // going to drink
    ["(is|are|am|was) going to (#Infinitive|#PresentTense)", [we]]
  ],
  "auxiliary-past": [
    // he did walk
    ["^did #Infinitive$", [B, Q1]],
    // used to walk
    ["^used to #Infinitive$", [B, Ze]]
  ],
  "auxiliary-present": [
    // we do walk
    ["^(does|do) #Infinitive$", [ce, Ze, R1]]
  ],
  // === modals ===
  "modal-past": [
    // he could have walked
    ["^(could|must|should|shall) have #PastTense$", [B]]
  ],
  "modal-infinitive": [
    // he can walk
    ["^#Modal #Infinitive$", []]
  ],
  infinitive: [
    // walk
    ["^#Infinitive$", []]
  ]
}, Vn = [];
Object.keys(qo).map((e) => {
  qo[e].forEach((t) => {
    Vn.push({
      name: e,
      match: t[0],
      data: _1(t[1])
    });
  });
});
const Z1 = function(e, t) {
  return e = e.clone(), t.adverbs.post && t.adverbs.post.found && e.remove(t.adverbs.post), t.adverbs.pre && t.adverbs.pre.found && e.remove(t.adverbs.pre), e.has("#Negative") && (e = e.remove("#Negative")), e.has("#Prefix") && (e = e.remove("#Prefix")), t.root.has("#PhrasalVerb #Particle") && e.remove("#Particle$"), e = e.not("#Adverb"), e;
}, X1 = function(e) {
  return !!(e.has("#Infinitive") && e.growLeft("to").has("^to #Infinitive"));
}, ke = function(e, t) {
  const n = {};
  e = Z1(e, t);
  for (let r = 0; r < Vn.length; r += 1) {
    const o = Vn[r];
    if (e.has(o.match) === !0) {
      n.form = o.name, Object.assign(n, o.data);
      break;
    }
  }
  return n.form || e.has("^#Verb$") && (n.form = "infinitive"), n.tense || (n.tense = t.root.has("#PastTense") ? "PastTense" : "PresentTense"), n.copula = t.root.has("#Copula"), n.isInfinitive = X1(e), n;
}, Ro = function(e) {
  return e.length <= 1 ? !1 : (e.parse()[0] || {}).isSubordinate;
}, Y1 = function(e) {
  let t = e.clauses();
  return t = t.filter((n, r) => !(n.has("^(if|unless|while|but|for|per|at|by|that|which|who|from)") || r > 0 && n.has("^#Verb . #Noun+$") || r > 0 && n.has("^#Adverb"))), t.length === 0 ? e : t;
}, ey = function(e) {
  let t = e.before();
  t = Y1(t);
  const n = t.nouns();
  let r = n.last();
  const o = r.match("(i|he|she|we|you|they)");
  if (o.found)
    return o.nouns();
  let a = n.if("^(that|this|those)");
  return a.found || n.found === !1 && (a = t.match("^(that|this|those)"), a.found) ? a : (r = n.last(), Ro(r) && (n.remove(r), r = n.last()), Ro(r) && (n.remove(r), r = n.last()), r);
}, ty = function(e, t) {
  return t.has("(are|were|does)") || e.has("(those|they|we)") ? !0 : e.found && e.isPlural ? e.isPlural().found : !1;
}, pe = function(e) {
  const t = ey(e);
  return {
    subject: t,
    plural: ty(t, e)
  };
}, T = (e) => e, lt = (e, t) => {
  const n = pe(e), r = n.subject;
  return r.has("i") || r.has("we") ? !0 : n.plural;
}, ny = (e, t) => {
  const { subject: n, plural: r } = pe(e);
  return r || n.has("we") ? "were" : "was";
}, ht = function(e, t) {
  if (e.has("were"))
    return "are";
  const { subject: n, plural: r } = pe(e);
  return n.has("i") ? "am" : n.has("we") || r ? "are" : "is";
}, rr = function(e, t) {
  const n = pe(e), r = n.subject;
  return r.has("i") || r.has("we") || n.plural ? "do" : "does";
}, ee = function(e) {
  if (e.has("#Infinitive"))
    return "Infinitive";
  if (e.has("#Participle"))
    return "Participle";
  if (e.has("#PastTense"))
    return "PastTense";
  if (e.has("#Gerund"))
    return "Gerund";
  if (e.has("#PresentTense"))
    return "PresentTense";
}, Bn = function(e, t) {
  const { toInfinitive: n } = e.methods.two.transform.verb;
  let r = t.root.text({ keepPunct: !1 });
  return r = n(r, e.model, ee(e)), r && e.replace(t.root, r), e;
}, Qo = (e) => e.has("will not") ? e.replace("will not", "have not") : e.remove("will"), _o = function(e) {
  if (!e || !e.isView)
    return [];
  const t = { normal: !0, terms: !1, text: !1 };
  return e.json(t).map((n) => n.normal);
}, Zo = function(e) {
  return !e || !e.isView ? "" : e.text("normal");
}, ry = function(e) {
  const { toInfinitive: t } = e.methods.two.transform.verb, n = e.text("normal");
  return t(n, e.model, ee(e));
}, oy = function(e) {
  const t = le(e);
  e = e.clone().toView();
  const n = ke(e, t);
  return {
    root: t.root.text(),
    preAdverbs: _o(t.adverbs.pre),
    postAdverbs: _o(t.adverbs.post),
    auxiliary: Zo(t.auxiliary),
    negative: t.negative.found,
    prefix: Zo(t.prefix),
    infinitive: ry(t.root),
    grammar: n
  };
}, ay = { tags: !0 }, iy = function(e, t) {
  const { toInfinitive: n } = e.methods.two.transform.verb, { root: r, auxiliary: o } = t, a = o.terms().harden();
  let i = r.text("normal");
  if (i = n(i, e.model, ee(r)), i && e.replace(r, i, ay).tag("Verb").firstTerm().tag("Infinitive"), a.found && e.remove(a), t.negative.found) {
    e.has("not") || e.prepend("not");
    const s = rr(e);
    e.prepend(s);
  }
  return e.fullSentence().compute(["freeze", "lexicon", "preTagger", "postTagger", "unfreeze", "chunks"]), e;
}, re = { tags: !0 }, Ae = {
  noAux: (e, t) => (t.auxiliary.found && (e = e.remove(t.auxiliary)), e),
  // walk->walked
  simple: (e, t) => {
    const { conjugate: n, toInfinitive: r } = e.methods.two.transform.verb, o = t.root;
    if (o.has("#Modal"))
      return e;
    let a = o.text({ keepPunct: !1 });
    return a = r(a, e.model, ee(o)), a = n(a, e.model).PastTense, a = a === "been" ? "was" : a, a === "was" && (a = ny(e)), a && e.replace(o, a, re), e;
  },
  both: function(e, t) {
    return t.negative.found ? (e.replace("will", "did"), e) : (e = Ae.simple(e, t), e = Ae.noAux(e, t), e);
  },
  hasHad: (e) => (e.replace("has", "had", re), e),
  // some verbs have this weird past-tense form
  // drive -> driven, (!drove)
  hasParticiple: (e, t) => {
    const { conjugate: n, toInfinitive: r } = e.methods.two.transform.verb, o = t.root;
    let a = o.text("normal");
    return a = r(a, e.model, ee(o)), n(a, e.model).Participle;
  }
}, Xo = {
  // walk -> walked
  infinitive: Ae.simple,
  // he walks -> he walked
  "simple-present": Ae.simple,
  // he walked
  "simple-past": T,
  // he will walk -> he walked
  "simple-future": Ae.both,
  // he is walking
  "present-progressive": (e) => (e.replace("are", "were", re), e.replace("(is|are|am)", "was", re), e),
  // he was walking
  "past-progressive": T,
  // he will be walking
  "future-progressive": (e, t) => (e.match(t.root).insertBefore("was"), e.remove("(will|be)"), e),
  // has walked -> had walked (?)
  "present-perfect": Ae.hasHad,
  // had walked
  "past-perfect": T,
  // will have walked -> had walked
  "future-perfect": (e, t) => (e.match(t.root).insertBefore("had"), e.has("will") && (e = Qo(e)), e.remove("have"), e),
  // has been walking -> had been
  "present-perfect-progressive": Ae.hasHad,
  // had been walking
  "past-perfect-progressive": T,
  // will have been -> had
  "future-perfect-progressive": (e) => (e.remove("will"), e.replace("have", "had", re), e),
  // got walked
  "passive-past": (e) => (e.replace("have", "had", re), e),
  // is being walked  -> 'was being walked'
  "passive-present": (e) => (e.replace("(is|are)", "was", re), e),
  // will be walked -> had been walked
  "passive-future": (e, t) => (t.auxiliary.has("will be") && (e.match(t.root).insertBefore("had been"), e.remove("(will|be)")), t.auxiliary.has("will have been") && (e.replace("have", "had", re), e.remove("will")), e),
  // would be walked -> 'would have been walked'
  "present-conditional": (e) => (e.replace("be", "have been"), e),
  // would have been walked
  "past-conditional": T,
  // is going to drink -> was going to drink
  "auxiliary-future": (e) => (e.replace("(is|are|am)", "was", re), e),
  // used to walk
  "auxiliary-past": T,
  // we do walk -> we did walk
  "auxiliary-present": (e) => (e.replace("(do|does)", "did", re), e),
  // must walk -> 'must have walked'
  "modal-infinitive": (e, t) => (e.has("can") ? e.replace("can", "could", re) : (Ae.simple(e, t), e.match("#Modal").insertAfter("have").tag("Auxiliary")), e),
  // must have walked
  "modal-past": T,
  // wanted to walk
  "want-infinitive": (e) => (e.replace("(want|wants)", "wanted", re), e.remove("will"), e),
  // started looking
  "gerund-phrase": (e, t) => (t.root = t.root.not("#Gerund$"), Ae.simple(e, t), Qo(e), e)
}, sy = function(e, t, n) {
  return Xo.hasOwnProperty(n) && (e = Xo[n](e, t), e.fullSentence().compute(["tagger", "chunks"])), e;
}, Sn = function(e, t) {
  const n = pe(e), r = n.subject;
  return r.has("(i|we|you)") ? "have" : n.plural === !1 || r.has("he") || r.has("she") || r.has("#Person") ? "has" : "have";
}, Mn = (e, t) => {
  const { conjugate: n, toInfinitive: r } = e.methods.two.transform.verb, { root: o, auxiliary: a } = t;
  if (o.has("#Modal"))
    return e;
  let i = o.text({ keepPunct: !1 });
  i = r(i, e.model, ee(o));
  const s = n(i, e.model);
  if (i = s.Participle || s.PastTense, i) {
    e = e.replace(o, i);
    const u = Sn(e);
    e.prepend(u).match(u).tag("Auxiliary"), e.remove(a);
  }
  return e;
}, Yo = {
  // walk -> walked
  infinitive: Mn,
  // he walks -> he walked
  "simple-present": Mn,
  // he walked
  // 'simple-past': noop,
  // he will walk -> he walked
  "simple-future": (e, t) => e.replace("will", Sn(e)),
  // he is walking
  // 'present-progressive': noop,
  // he was walking
  // 'past-progressive': noop,
  // he will be walking
  // 'future-progressive': noop,
  // has walked -> had walked (?)
  "present-perfect": T,
  // had walked
  "past-perfect": T,
  // will have walked -> had walked
  "future-perfect": (e, t) => e.replace("will have", Sn(e)),
  // has been walking -> had been
  "present-perfect-progressive": T,
  // had been walking
  "past-perfect-progressive": T,
  // will have been -> had
  "future-perfect-progressive": T
  // got walked
  // 'passive-past': noop,
  // is being walked  -> 'was being walked'
  // 'passive-present': noop,
  // will be walked -> had been walked
  // 'passive-future': noop,
  // would be walked -> 'would have been walked'
  // 'present-conditional': noop,
  // would have been walked
  // 'past-conditional': noop,
  // is going to drink -> was going to drink
  // 'auxiliary-future': noop,
  // used to walk
  // 'auxiliary-past': noop,
  // we do walk -> we did walk
  // 'auxiliary-present': noop,
  // must walk -> 'must have walked'
  // 'modal-infinitive': noop,
  // must have walked
  // 'modal-past': noop,
  // wanted to walk
  // 'want-infinitive': noop,
  // started looking
  // 'gerund-phrase': noop,
}, uy = function(e, t, n) {
  return Yo.hasOwnProperty(n) ? (e = Yo[n](e, t), e.fullSentence().compute(["tagger", "chunks"]), e) : (e = Mn(e, t), e.fullSentence().compute(["tagger", "chunks"]), e);
}, Ce = { tags: !0 }, Xe = (e, t) => {
  const { conjugate: n, toInfinitive: r } = e.methods.two.transform.verb, o = t.root;
  let a = o.text("normal");
  return a = r(a, e.model, ee(o)), lt(e) === !1 && (a = n(a, e.model).PresentTense), o.has("#Copula") && (a = ht(e)), a && (e = e.replace(o, a, Ce), e.not("#Particle").tag("PresentTense")), e;
}, ea = (e, t) => {
  const { conjugate: n, toInfinitive: r } = e.methods.two.transform.verb, o = t.root;
  let a = o.text("normal");
  return a = r(a, e.model, ee(o)), lt(e) === !1 && (a = n(a, e.model).Gerund), a && (e = e.replace(o, a, Ce), e.not("#Particle").tag("Gerund")), e;
}, cy = (e, t) => {
  const { toInfinitive: n } = e.methods.two.transform.verb, r = t.root;
  let o = t.root.text("normal");
  return o = n(o, e.model, ee(r)), o && (e = e.replace(t.root, o, Ce)), e;
}, ta = {
  // walk
  infinitive: Xe,
  // he walks -> he walked
  "simple-present": (e, t) => {
    const { conjugate: n } = e.methods.two.transform.verb, { root: r } = t;
    if (r.has("#Infinitive")) {
      const a = pe(e).subject;
      if (lt(e) || a.has("i"))
        return e;
      const i = r.text("normal"), s = n(i, e.model).PresentTense;
      i !== s && e.replace(r, s, Ce);
    } else
      return Xe(e, t);
    return e;
  },
  // he walked
  "simple-past": Xe,
  // he will walk -> he walked
  "simple-future": (e, t) => {
    const { root: n, auxiliary: r } = t;
    if (r.has("will") && n.has("be")) {
      const o = ht(e);
      e.replace(n, o), e = e.remove("will"), e.replace("not " + o, o + " not");
    } else
      Xe(e, t), e = e.remove("will");
    return e;
  },
  // is walking ->
  "present-progressive": T,
  // was walking -> is walking
  "past-progressive": (e, t) => {
    const n = ht(e);
    return e.replace("(were|was)", n, Ce);
  },
  // will be walking -> is walking
  "future-progressive": (e) => (e.match("will").insertBefore("is"), e.remove("be"), e.remove("will")),
  // has walked ->  (?)
  "present-perfect": (e, t) => (Xe(e, t), e = e.remove("(have|had|has)"), e),
  // had walked -> has walked
  "past-perfect": (e, t) => {
    const r = pe(e).subject;
    return lt(e) || r.has("i") ? (e = Bn(e, t), e.remove("had"), e) : (e.replace("had", "has", Ce), e);
  },
  // will have walked -> has walked
  "future-perfect": (e) => (e.match("will").insertBefore("has"), e.remove("have").remove("will")),
  // has been walking
  "present-perfect-progressive": T,
  // had been walking
  "past-perfect-progressive": (e) => e.replace("had", "has", Ce),
  // will have been -> has been
  "future-perfect-progressive": (e) => (e.match("will").insertBefore("has"), e.remove("have").remove("will")),
  // got walked -> is walked
  // was walked -> is walked
  // had been walked -> is walked
  "passive-past": (e, t) => {
    const n = ht(e);
    return e.has("(had|have|has)") && e.has("been") ? (e.replace("(had|have|has)", n, Ce), e.replace("been", "being"), e) : e.replace("(got|was|were)", n);
  },
  // is being walked  ->
  "passive-present": T,
  // will be walked -> is being walked
  "passive-future": (e) => (e.replace("will", "is"), e.replace("be", "being")),
  // would be walked ->
  "present-conditional": T,
  // would have been walked ->
  "past-conditional": (e) => (e.replace("been", "be"), e.remove("have")),
  // is going to drink -> is drinking
  "auxiliary-future": (e, t) => (ea(e, t), e.remove("(going|to)"), e),
  // used to walk -> is walking
  // did walk -> is walking
  "auxiliary-past": (e, t) => {
    if (t.auxiliary.has("did")) {
      const n = rr(e);
      return e.replace(t.auxiliary, n), e;
    }
    return ea(e, t), e.replace(t.auxiliary, "is"), e;
  },
  // we do walk ->
  "auxiliary-present": T,
  // must walk -> 'must have walked'
  "modal-infinitive": T,
  // must have walked
  "modal-past": (e, t) => (cy(e, t), e.remove("have")),
  // started looking
  "gerund-phrase": (e, t) => (t.root = t.root.not("#Gerund$"), Xe(e, t), e.remove("(will|have)")),
  // wanted to walk
  "want-infinitive": (e, t) => {
    let n = "wants";
    return lt(e) && (n = "want"), e.replace("(want|wanted|wants)", n, Ce), e.remove("will"), e;
  }
}, ly = function(e, t, n) {
  return ta.hasOwnProperty(n) && (e = ta[n](e, t), e.fullSentence().compute(["tagger", "chunks"])), e;
}, oi = { tags: !0 }, Mt = (e, t) => {
  const { toInfinitive: n } = e.methods.two.transform.verb, { root: r, auxiliary: o } = t;
  if (r.has("#Modal"))
    return e;
  let a = r.text("normal");
  return a = n(a, e.model, ee(r)), a && (e = e.replace(r, a, oi), e.not("#Particle").tag("Verb")), e.prepend("will").match("will").tag("Auxiliary"), e.remove(o), e;
}, na = (e, t) => {
  const { conjugate: n, toInfinitive: r } = e.methods.two.transform.verb, { root: o, auxiliary: a } = t;
  let i = o.text("normal");
  return i = r(i, e.model, ee(o)), i && (i = n(i, e.model).Gerund, e.replace(o, i, oi), e.not("#Particle").tag("PresentTense")), e.remove(a), e.prepend("will be").match("will be").tag("Auxiliary"), e;
}, ra = {
  // walk ->
  infinitive: Mt,
  // he walks ->
  "simple-present": Mt,
  // he walked
  "simple-past": Mt,
  // he will walk ->
  "simple-future": T,
  // is walking ->
  "present-progressive": na,
  // was walking ->
  "past-progressive": na,
  // will be walking ->
  "future-progressive": T,
  // has walked ->
  "present-perfect": (e) => (e.match("(have|has)").replaceWith("will have"), e),
  // had walked ->
  "past-perfect": (e) => e.replace("(had|has)", "will have"),
  // will have walked ->
  "future-perfect": T,
  // has been walking
  "present-perfect-progressive": (e) => e.replace("has", "will have"),
  // had been walking
  "past-perfect-progressive": (e) => e.replace("had", "will have"),
  // will have been ->
  "future-perfect-progressive": T,
  // got walked ->
  // was walked ->
  // was being walked ->
  // had been walked ->
  "passive-past": (e) => e.has("got") ? e.replace("got", "will get") : e.has("(was|were)") ? (e.replace("(was|were)", "will be"), e.remove("being")) : e.has("(have|has|had) been") ? e.replace("(have|has|had) been", "will be") : e,
  // is being walked  ->
  "passive-present": (e) => (e.replace("being", "will be"), e.remove("(is|are|am)"), e),
  // will be walked ->
  "passive-future": T,
  // would be walked ->
  "present-conditional": (e) => e.replace("would", "will"),
  // would have been walked ->
  "past-conditional": (e) => e.replace("would", "will"),
  // is going to drink ->
  "auxiliary-future": T,
  // used to walk -> is walking
  // did walk -> is walking
  "auxiliary-past": (e) => e.has("used") && e.has("to") ? (e.replace("used", "will"), e.remove("to")) : (e.replace("did", "will"), e),
  // we do walk ->
  // he does walk ->
  "auxiliary-present": (e) => e.replace("(do|does)", "will"),
  // must walk ->
  "modal-infinitive": T,
  // must have walked
  "modal-past": T,
  // started looking
  "gerund-phrase": (e, t) => (t.root = t.root.not("#Gerund$"), Mt(e, t), e.remove("(had|have)")),
  // wanted to walk
  "want-infinitive": (e) => (e.replace("(want|wants|wanted)", "will want"), e)
}, hy = function(e, t, n) {
  return e.has("will") || e.has("going to") || ra.hasOwnProperty(n) && (e = ra[n](e, t), e.fullSentence().compute(["tagger", "chunks"])), e;
}, dy = { tags: !0 }, fy = function(e, t) {
  const { toInfinitive: n, conjugate: r } = e.methods.two.transform.verb, { root: o, auxiliary: a } = t;
  if (e.has("#Gerund"))
    return e;
  let i = o.text("normal");
  i = n(i, e.model, ee(o));
  const s = r(i, e.model).Gerund;
  if (s) {
    const u = ht(e);
    e.replace(o, s, dy), e.remove(a), e.prepend(u);
  }
  return e.replace("not is", "is not"), e.replace("not are", "are not"), e.fullSentence().compute(["tagger", "chunks"]), e;
}, oa = { tags: !0 }, bn = function(e, t) {
  const n = rr(e);
  return e.prepend(n + " not"), e;
}, Wt = function(e) {
  let t = e.match("be");
  return t.found ? (t.prepend("not"), e) : (t = e.match("(is|was|am|are|will|were)"), t.found && t.append("not"), e);
}, Jt = (e) => e.has("(is|was|am|are|will|were|be)"), aa = {
  // he walks' -> 'he does not walk'
  "simple-present": (e, t) => Jt(e) === !0 ? Wt(e) : (e = Bn(e, t), e = bn(e), e),
  // 'he walked' -> 'he did not walk'
  "simple-past": (e, t) => Jt(e) === !0 ? Wt(e) : (e = Bn(e, t), e.prepend("did not"), e),
  // walk! -> 'do not walk'
  imperative: (e) => (e.prepend("do not"), e),
  // walk -> does not walk
  infinitive: (e, t) => Jt(e) === !0 ? Wt(e) : bn(e),
  "passive-past": (e) => {
    if (e.has("got"))
      return e.replace("got", "get", oa), e.prepend("did not"), e;
    const t = e.match("(was|were|had|have)");
    return t.found && t.append("not"), e;
  },
  "auxiliary-past": (e) => {
    if (e.has("used"))
      return e.prepend("did not"), e;
    const t = e.match("(did|does|do)");
    return t.found && t.append("not"), e;
  },
  // wants to walk
  "want-infinitive": (e, t) => (e = bn(e), e = e.replace("wants", "want", oa), e)
}, py = function(e, t, n) {
  if (e.has("#Negative"))
    return e;
  if (aa.hasOwnProperty(n))
    return e = aa[n](e, t), e;
  let r = e.matchOne("be");
  return r.found ? (r.prepend("not"), e) : Jt(e) === !0 ? Wt(e) : (r = e.matchOne("(will|had|have|has|did|does|do|#Modal)"), r.found && r.append("not"), e);
}, gy = function(e) {
  class t extends e {
    constructor(r, o, a) {
      super(r, o, a), this.viewType = "Verbs";
    }
    parse(r) {
      return this.getNth(r).map(le);
    }
    json(r, o) {
      return this.getNth(o).map((s) => {
        const u = s.toView().json(r)[0] || {};
        return u.verb = oy(s), u;
      }, []);
    }
    subjects(r) {
      return this.getNth(r).map((o) => (le(o), pe(o).subject));
    }
    adverbs(r) {
      return this.getNth(r).map((o) => o.match("#Adverb"));
    }
    isSingular(r) {
      return this.getNth(r).filter((o) => pe(o).plural !== !0);
    }
    isPlural(r) {
      return this.getNth(r).filter((o) => pe(o).plural === !0);
    }
    isImperative(r) {
      return this.getNth(r).filter((o) => o.has("#Imperative"));
    }
    toInfinitive(r) {
      return this.getNth(r).map((o) => {
        const a = le(o), i = ke(o, a);
        return iy(o, a, i.form);
      });
    }
    toPresentTense(r) {
      return this.getNth(r).map((o) => {
        const a = le(o), i = ke(o, a);
        return i.isInfinitive ? o : ly(o, a, i.form);
      });
    }
    toPastTense(r) {
      return this.getNth(r).map((o) => {
        const a = le(o), i = ke(o, a);
        return i.isInfinitive ? o : sy(o, a, i.form);
      });
    }
    toFutureTense(r) {
      return this.getNth(r).map((o) => {
        const a = le(o), i = ke(o, a);
        return i.isInfinitive ? o : hy(o, a, i.form);
      });
    }
    toGerund(r) {
      return this.getNth(r).map((o) => {
        const a = le(o), i = ke(o, a);
        return i.isInfinitive ? o : fy(o, a, i.form);
      });
    }
    toPastParticiple(r) {
      return this.getNth(r).map((o) => {
        const a = le(o), i = ke(o, a);
        return i.isInfinitive ? o : uy(o, a, i.form);
      });
    }
    conjugate(r) {
      const { conjugate: o, toInfinitive: a } = this.world.methods.two.transform.verb;
      return this.getNth(r).map((i) => {
        const s = le(i), u = ke(i, s);
        u.form === "imperative" && (u.form = "simple-present");
        let l = s.root.text("normal");
        if (!s.root.has("#Infinitive")) {
          const c = ee(s.root);
          l = a(l, i.model, c) || l;
        }
        return o(l, i.model);
      }, []);
    }
    /** return only verbs with 'not'*/
    isNegative() {
      return this.if("#Negative");
    }
    /**  return only verbs without 'not'*/
    isPositive() {
      return this.ifNo("#Negative");
    }
    /** remove 'not' from these verbs */
    toPositive() {
      const r = this.match("do not #Verb");
      return r.found && r.remove("do not"), this.remove("#Negative");
    }
    toNegative(r) {
      return this.getNth(r).map((o) => {
        const a = le(o), i = ke(o, a);
        return py(o, a, i.form);
      });
    }
    // overloaded - keep Verb class
    update(r) {
      const o = new t(this.document, r);
      return o._cache = this._cache, o;
    }
  }
  t.prototype.toPast = t.prototype.toPastTense, t.prototype.toPresent = t.prototype.toPresentTense, t.prototype.toFuture = t.prototype.toFutureTense, e.prototype.verbs = function(n) {
    let r = L1(this);
    return r = r.getNth(n), new t(this.document, r.pointer);
  };
}, my = {
  api: gy
}, Ln = function(e, t) {
  const n = t.match(e);
  if (n.found) {
    const r = n.pronouns().refersTo();
    if (r.found)
      return r;
  }
  return t.none();
}, ia = function(e) {
  if (!e.found)
    return e;
  const [t] = e.fullPointer[0];
  return t && t > 0 ? e.update([[t - 1]]) : e.none();
}, yy = function(e, t) {
  return t === "m" ? e.filter((n) => !n.presumedFemale().found) : t === "f" ? e.filter((n) => !n.presumedMale().found) : e;
}, sa = function(e, t) {
  let n = e.people();
  return n = yy(n, t), n.found || (n = e.nouns("#Actor"), n.found) ? n.last() : t === "f" ? Ln("(she|her|hers)", e) : t === "m" ? Ln("(he|him|his)", e) : e.none();
}, by = function(e) {
  const t = e.nouns();
  let n = t.isPlural().notIf("#Pronoun");
  if (n.found)
    return n.last();
  const r = Ln("(they|their|theirs)", e);
  return r.found ? r : (n = t.match("(somebody|nobody|everybody|anybody|someone|noone|everyone|anyone)"), n.found ? n.last() : e.none());
}, vy = function(e, t) {
  if (t && t.found) {
    const n = e.docs[0][0];
    n.reference = t.ptrs[0];
  }
}, vn = function(e, t) {
  let n = e.before(), r = t(n);
  return r.found || (n = ia(e), r = t(n), r.found) || (n = ia(n), r = t(n), r.found) ? r : e.none();
}, wy = function(e) {
  e.pronouns().if("(he|him|his|she|her|hers|they|their|theirs|it|its)").forEach((n) => {
    let r = null;
    n.has("(he|him|his)") ? r = vn(n, (o) => sa(o, "m")) : n.has("(she|her|hers)") ? r = vn(n, (o) => sa(o, "f")) : n.has("(they|their|theirs)") && (r = vn(n, by)), r && r.found && vy(n, r);
  });
}, Py = function(e) {
  class t extends e {
    constructor(r, o, a) {
      super(r, o, a), this.viewType = "Pronouns";
    }
    hasReference() {
      return this.compute("coreference"), this.filter((r) => r.docs[0][0].reference);
    }
    // get the noun-phrase this pronoun refers to
    refersTo() {
      return this.compute("coreference"), this.map((r) => {
        if (!r.found)
          return r.none();
        const o = r.docs[0][0];
        return o.reference ? r.update([o.reference]) : r.none();
      });
    }
    // overloaded - keep Numbers class
    update(r) {
      const o = new t(this.document, r);
      return o._cache = this._cache, o;
    }
  }
  e.prototype.pronouns = function(n) {
    let r = this.match("#Pronoun");
    return r = r.getNth(n), new t(r.document, r.pointer);
  };
}, ky = {
  compute: { coreference: wy },
  api: Py
};
b.plugin(Vm);
b.plugin(Mm);
b.plugin(n0);
b.plugin(ky);
b.plugin(P0);
b.plugin(N0);
b.plugin(B0);
b.plugin(p1);
b.plugin(y1);
b.plugin(D1);
b.plugin(M1);
b.plugin(my);
export {
  b as default
};
//# sourceMappingURL=three-BdZdFcoN.js.map
