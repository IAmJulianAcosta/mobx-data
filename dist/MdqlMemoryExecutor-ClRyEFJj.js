class n {
  static executeMany(t, e) {
    let s = t.filter((i) => n.matchesNode(i, e.filters));
    e.orderBy.length > 0 && (s = n.sortRecords(s, e.orderBy));
    const r = e.offset ?? 0;
    if (r > 0 || e.limit !== null) {
      const i = e.limit !== null ? r + e.limit : void 0;
      s = s.slice(r, i);
    }
    return s;
  }
  static executeOne(t, e) {
    return n.executeMany(t, e)[0] ?? null;
  }
  static count(t, e) {
    let s = 0;
    for (const r of t)
      n.matchesNode(r, e.filters) && s++;
    return s;
  }
  static exists(t, e) {
    return t.some((s) => n.matchesNode(s, e.filters));
  }
  static compilePredicate(t) {
    return (e) => n.matchesNode(e, t.filters);
  }
  static matchesNode(t, e) {
    return e.kind === "condition" ? n.evaluateCondition(t, e) : e.kind === "and" ? e.children.every((s) => n.matchesNode(t, s)) : e.kind === "or" ? e.children.some((s) => n.matchesNode(t, s)) : !e.children.some((s) => n.matchesNode(t, s));
  }
  static resolveFieldValues(t, e) {
    const s = e.split(".");
    let r = [t];
    for (const i of s) {
      const o = [];
      for (const a of r)
        if (a != null)
          if (Array.isArray(a))
            for (const c of a)
              c != null && o.push(c[i]);
          else
            o.push(a[i]);
      r = o;
    }
    return r;
  }
  static resolveFieldValue(t, e) {
    const s = n.resolveFieldValues(t, e);
    return s.length === 1 ? s[0] : s.length === 0 ? void 0 : s;
  }
  static evaluateCondition(t, e) {
    const s = n.resolveFieldValues(t, e.field);
    if (s.length > 1)
      return s.some((i) => n.evaluateSingleCondition(i, e.operator, e.value));
    const r = s[0];
    return n.evaluateSingleCondition(r, e.operator, e.value);
  }
  static evaluateSingleCondition(t, e, s) {
    switch (e) {
      case "equals":
        return t === s;
      case "notEquals":
        return t !== s;
      case "in":
        return Array.isArray(s) && s.includes(t);
      case "notIn":
        return Array.isArray(s) && !s.includes(t);
      case "isNull":
        return t == null;
      case "isNotNull":
        return t != null;
      case "contains":
        return typeof t == "string" && typeof s == "string" && t.toLowerCase().includes(s.toLowerCase());
      case "startsWith":
        return typeof t == "string" && typeof s == "string" && t.toLowerCase().startsWith(s.toLowerCase());
      case "endsWith":
        return typeof t == "string" && typeof s == "string" && t.toLowerCase().endsWith(s.toLowerCase());
      case "greaterThan":
        return n.compareValues(t, s) > 0;
      case "greaterThanOrEquals":
        return n.compareValues(t, s) >= 0;
      case "lessThan":
        return n.compareValues(t, s) < 0;
      case "lessThanOrEquals":
        return n.compareValues(t, s) <= 0;
      case "between": {
        if (!Array.isArray(s) || s.length !== 2)
          return !1;
        const r = n.compareValues(t, s[0]), i = n.compareValues(t, s[1]);
        return r >= 0 && i <= 0;
      }
      default:
        return !1;
    }
  }
  static compareValues(t, e) {
    return t == null ? -1 : e == null ? 1 : t instanceof Date && e instanceof Date ? t.getTime() - e.getTime() : typeof t == "number" && typeof e == "number" ? t - e : typeof t == "string" && typeof e == "string" ? t.localeCompare(e) : String(t).localeCompare(String(e));
  }
  static sortRecords(t, e) {
    return [...t].sort((s, r) => {
      for (const i of e) {
        const o = n.resolveFieldValue(s, i.field), a = n.resolveFieldValue(r, i.field);
        if (o === a)
          continue;
        if (o == null)
          return 1;
        if (a == null)
          return -1;
        const c = n.compareValues(o, a);
        if (c !== 0)
          return i.direction === "desc" ? -c : c;
      }
      return 0;
    });
  }
}
export {
  n as M
};
//# sourceMappingURL=MdqlMemoryExecutor-ClRyEFJj.js.map
