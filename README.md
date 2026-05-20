# @iamjulianacosta/mobx-data

[![build](https://img.shields.io/endpoint?url=https://iamjulianacosta.github.io/mobx-data/build-badge.json)](https://github.com/IAmJulianAcosta/mobx-data)
[![coverage](https://img.shields.io/endpoint?url=https://iamjulianacosta.github.io/mobx-data/coverage-badge.json)](https://github.com/IAmJulianAcosta/mobx-data)
[![version](https://img.shields.io/endpoint?url=https://iamjulianacosta.github.io/mobx-data/version-badge.json)](https://github.com/IAmJulianAcosta/mobx-data/releases)
[![license](https://img.shields.io/endpoint?url=https://iamjulianacosta.github.io/mobx-data/license-badge.json)](./LICENSE)

An Ember Data-inspired data layer for MobX applications — framework-agnostic, TypeScript-first, fully observable.

---

## Overview

`@iamjulianacosta/mobx-data` provides a structured data layer built on MobX. It brings identity-mapped records, pluggable adapters and serializers, record state machines, and async relationships to any MobX application. All state is observable; no manual invalidation or subscriptions are needed.

### Design principles

- **Framework-agnostic** — works with React, Vue, Solid, or plain JS
- **MobX-native** — every piece of state is a MobX `observable`; computed props react automatically
- **TypeScript-first** — full generic types throughout
- **Ember Data-inspired** — familiar API patterns for Ember Data users

---

## Features

| Feature | Status |
|---------|--------|
| `Store` with Identity Map | Done |
| `Model` base class + lifecycle hooks | Done |
| `@attr`, `@belongsTo`, `@hasMany` decorators | Done |
| Record state machine (`isNew`, `isDirty`, `isSaving`, ...) | Done |
| Dirty tracking & `rollbackAttributes` | Done |
| `RecordArray` / `AdapterPopulatedRecordArray` | Done |
| `RestAdapter` | Done |
| `JsonApiAdapter` | Done |
| `ODataAdapter` (v4) | Done |
| `JsonSerializer` / `RestSerializer` / `JsonApiSerializer` | Done |
| `EmbeddedRecordsMixin` | Done |
| Async & sync `belongsTo` / `hasMany` | Done |
| Inverse relationship tracking | Done |
| Polymorphic models (discriminator-based) | Done |
| `Snapshot` | Done |
| `RequestManager` + handler chain | Done |
| `FetchHandler` / `CacheHandler` | Done |
| Built-in transforms (`string`, `number`, `boolean`, `date`) | Done |
| `SchemaService` | Done |
| `Errors` (field-level validation) | Done |
| `coalesceFindRequests` (batched findRecord calls) | Done |
| `IndexedDBCache` (offline-first persistent cache) | Done |
| MDQL query builder (`store.select()`) | Done |

---

## Installation

```bash
npm install @iamjulianacosta/mobx-data mobx reflect-metadata tsyringe
```

### Decorator compatibility

This library uses TypeScript legacy decorators and `reflect-metadata`.

Required `tsconfig.json` settings:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

Import `reflect-metadata` once at your application entry point:

```ts
import "reflect-metadata";
```

**Compatibility notes:**
- TypeScript 4.7+ is required
- Only legacy decorators (`experimentalDecorators`) are supported
- TC39 stage 3 decorators are not yet supported
- If `reflect-metadata` is missing, the library throws a clear error at startup

---

## Quick start

### 1. Define models

```ts
import { Model, attr, belongsTo, hasMany } from "@iamjulianacosta/mobx-data/model";

class User extends Model {
  static modelName = "user";

  @attr("string") name!: string;
  @attr("string") email!: string;

  @hasMany("post", { async: false, inverse: "author" })
  posts!: ManyArray<Post>;
}

class Post extends Model {
  static modelName = "post";

  @attr("string") title!: string;
  @attr("date") publishedAt!: Date | null;

  @belongsTo("user", { async: false, inverse: "posts" })
  author!: User | null;
}
```

### 2. Create a store

The simplest way to get started:

```ts
import "reflect-metadata";
import { createStore } from "@iamjulianacosta/mobx-data/store";

const store = createStore({
  models: [User, Post],
});
```

This registers all models, creates a `SchemaService`, and wires up a default `RestAdapter` and `JsonSerializer`.

For custom adapters or serializers:

```ts
import { createStore } from "@iamjulianacosta/mobx-data/store";
import { JsonApiAdapter } from "@iamjulianacosta/mobx-data/json-api";
import { JsonApiSerializer } from "@iamjulianacosta/mobx-data/json-api";

const store = createStore({
  models: [User, Post],
  adapter: new JsonApiAdapter(),
  serializer: new JsonApiSerializer(),
});
```

For full control, use the manual setup:

```ts
import "reflect-metadata";
import { container } from "tsyringe";
import { Store } from "@iamjulianacosta/mobx-data/store";
import { SchemaService } from "@iamjulianacosta/mobx-data/schema";
import { RestAdapter } from "@iamjulianacosta/mobx-data/adapter";
import { JsonSerializer } from "@iamjulianacosta/mobx-data/serializer";

const schema = container.resolve(SchemaService);
schema.registerModel("user", User);
schema.registerModel("post", Post);

const store = container.resolve(Store);

const adapter = new RestAdapter();
adapter.host = "https://api.example.com";

store.registerAdapter("application", adapter);
store.registerSerializer("application", new JsonSerializer());
```

### 3. Use the store

```ts
// Find a single record
const user = await store.findRecord("user", "1");
console.log(user.name); // "Alice"

// Find all
const users = await store.findAll("user");

// Query
const posts = await store.query("post", { filter: { published: true } });

// Create
const post = store.createRecord("post", { title: "Hello World" });
await post.save();

// Update
user.name = "Bob";
await user.save();

// Delete
await post.destroyRecord();

// Push raw data
store.push({
  data: { type: "user", id: "2", attributes: { name: "Carol" } },
});
```

---

## Adapters

### RestAdapter

Standard REST conventions (`GET /users/1`, `POST /users`, `PUT /users/1`, `DELETE /users/1`).

```ts
import { RestAdapter } from "@iamjulianacosta/mobx-data/adapter";

const adapter = new RestAdapter();
adapter.host = "https://api.example.com";
adapter.namespace = "api/v2";
adapter.headers = { Authorization: "Bearer ..." };
```

### JsonApiAdapter

Implements the [JSON:API](https://jsonapi.org) specification, including `application/vnd.api+json` MIME type and PATCH for updates.

```ts
import { JsonApiAdapter } from "@iamjulianacosta/mobx-data/json-api";

const adapter = new JsonApiAdapter();
adapter.host = "https://api.example.com";
```

### ODataAdapter

Implements OData v4 conventions (PascalCase entity sets, key-in-parentheses URLs, `$filter` / `$expand` / `$select` / `$top` / `$skip` / `$orderby` / `$count`).

```ts
import { ODataAdapter } from "@iamjulianacosta/mobx-data/odata";

const adapter = new ODataAdapter();
adapter.host = "https://api.example.com/odata";

const posts = await adapter.query(store, "post", {
  $expand: "author,comments",
  $filter: "publishedAt gt '2026-01-01'",
  $orderby: "title asc",
});
```

---

## Serializers

| Class | Format |
|-------|--------|
| `JsonSerializer` | Flat JSON objects / arrays |
| `RestSerializer` | Root-key format with optional sideloading |
| `JsonApiSerializer` | [JSON:API](https://jsonapi.org) compound documents |

### EmbeddedRecordsMixin

```ts
import { RestSerializer, EmbeddedRecordsMixin } from "@iamjulianacosta/mobx-data/serializer";

class PostSerializer extends EmbeddedRecordsMixin(RestSerializer) {
  attrs = {
    comments: { embedded: "always" },
  };
}
```

---

## Relationships

```ts
// Sync (records must already be in the store)
@belongsTo("user", { async: false }) author!: User | null;
@hasMany("tag", { async: false }) tags!: ManyArray<Tag>;

// Async (loaded on demand)
@belongsTo("user", { async: true }) author!: AsyncBelongsTo<User>;
@hasMany("comment", { async: true }) comments!: AsyncHasMany<Comment>;
```

Async wrappers are `PromiseLike` -- they can be `await`ed or used in MobX reactions:

```ts
const author = await post.author; // AsyncBelongsTo<User>
console.log(post.author.isLoaded); // true
```

Inverse tracking is automatic when `inverse` is specified:

```ts
@belongsTo("user", { async: false, inverse: "posts" }) author!: User | null;
// Setting post.author automatically adds post to user.posts
```

---

## Polymorphic Models

Discriminator-based polymorphism lets you define abstract parent models whose concrete subtype is determined at deserialization time:

```ts
import { model, attr, Model } from "@iamjulianacosta/mobx-data";

@model({
  name: "vehicle",
  abstract: true,
  discriminator: {
    key: "vehicleType", // payload field to inspect (defaults to "type")
    map: {
      car: () => Car,
      motorcycle: () => Motorcycle,
    },
  },
})
abstract class Vehicle extends Model {
  static modelName = "vehicle";
  @attr("string") make!: string;
}

class Car extends Vehicle {
  static modelName = "car";
  @attr("number") doors!: number;
}

class Motorcycle extends Vehicle {
  static modelName = "motorcycle";
  @attr("number") cc!: number;
}
```

When you push a `vehicle` record, the store reads the discriminator key and instantiates the correct concrete class. All subtypes share the parent's identity map bucket, preventing duplicates.

---

## Transforms

```ts
@attr("string") name!: string;
@attr("number") age!: number;
@attr("boolean") active!: boolean;
@attr("date") createdAt!: Date | null;
@attr() raw!: unknown; // pass-through
```

---

## Request pipeline

The `RequestManager` provides a middleware-style handler chain:

```ts
import { RequestManager, FetchHandler, CacheHandler } from "@iamjulianacosta/mobx-data/request";

const manager = new RequestManager()
  .useCache(new CacheHandler())
  .use(new FetchHandler());
```

Implement custom handlers for authentication, logging, retry logic, etc.:

```ts
class AuthHandler {
  async request(context, next) {
    context.request.headers = {
      ...context.request.headers,
      Authorization: `Bearer ${getToken()}`,
    };
    return next(context.request);
  }
}
```

---

## Record state

Every record exposes observable boolean flags derived from its internal state machine:

| Property | Description |
|----------|-------------|
| `isNew` | Created locally, never saved |
| `isDirty` | Has unsaved local changes |
| `isSaving` | Adapter request in flight |
| `isLoading` | Being fetched from server |
| `isLoaded` | Loaded and available |
| `isDeleted` | Marked for deletion |
| `isError` | Last operation failed |
| `isValid` | No validation errors |

```ts
const post = store.createRecord("post", { title: "Draft" });
post.isNew; // true
post.isDirty; // true

await post.save();
post.isNew; // false
post.isDirty; // false
```

---

## MDQL -- Query Builder

`store.select()` provides a chainable, type-safe query builder for filtering, sorting, and paginating records from the in-memory identity map without going through the adapter:

```ts
// Published posts, newest first, page 1
const posts = await store
  .select<Post>("post")
  .where("status", "equals", "published")
  .orderBy("createdAt", "desc")
  .limit(20)
  .toArray();

// Boolean logic with nested groups
const users = await store
  .select<User>("user")
  .or((b) => {
    b.where("name", "equals", "Alice");
    b.where("name", "startsWith", "B");
  })
  .toArray();

// Reactive live query -- updates when the store changes
const adults = store
  .select<User>("user")
  .where("age", "greaterThanOrEquals", 18)
  .toLiveArray();
```

Queries compile to structured `MdqlQueryObject` data (not code), making them safe for programmatic construction and AI-generated queries. All queries are validated against the schema before execution.

---

## IndexedDB Cache

Register an `IndexedDBCache` to enable offline-first reads. The store checks the persistent cache before hitting the network, and automatically respects HTTP cache headers (`Cache-Control`, `Expires`):

```ts
import { IndexedDBCache } from "@iamjulianacosta/mobx-data/cache";

const cache = new IndexedDBCache({
  databaseName: "my-app-cache", // default: "mobx-data-cache"
  defaultTTL: 3_600_000, // default: 1 hour
});

store.registerCache(cache);

// First call: network fetch, result cached in IndexedDB
const user = await store.findRecord("user", "1");

// Second call (even after page reload): served from IndexedDB instantly
const user2 = await store.findRecord("user", "1");
```

Cache entries are automatically invalidated when records are deleted. The store parses `Cache-Control: max-age`, `s-maxage`, and `Expires` headers to set per-entry TTLs.

---

## Coalesced Find Requests

When `adapter.coalesceFindRequests = true`, multiple concurrent `findRecord` calls for the same model type are batched into a single `findMany` network request:

```ts
const adapter = new RestAdapter();
adapter.coalesceFindRequests = true;
store.registerAdapter("application", adapter);

// These three calls produce a single GET /users?ids[]=1&ids[]=2&ids[]=3
const [u1, u2, u3] = await Promise.all([
  store.findRecord("user", "1"),
  store.findRecord("user", "2"),
  store.findRecord("user", "3"),
]);
```

IDs are deduplicated. Errors propagate to all pending callers. Requests with `include` options bypass coalescing.

---

## Testing

The project uses [Vitest](https://vitest.dev) with 900+ tests covering every subsystem:

- **Unit tests** — model lifecycle, state machine, dirty tracking, snapshots, errors, transforms
- **Adapter tests** — RestAdapter, JsonApiAdapter, ODataAdapter, MemoryAdapter, buildURL
- **Serializer tests** — JsonSerializer, RestSerializer, JsonApiSerializer, EmbeddedRecordsMixin
- **Store tests** — identity map, push, peek, find, query, save, relationships, polymorphism, live queries
- **MDQL tests** — query builder, validator, memory executor, store integration
- **Cache tests** — IndexedDB cache, cache utilities, store integration
- **E2E tests** — full round-trip tests against in-process OData and JSON:API servers

```bash
npm run test             # run all tests once
npm run test:watch       # watch mode
npm run test:coverage    # run with coverage report
npm run typecheck        # TypeScript type check
```

---

## Project structure

```
src/
  adapter/          -- Adapter, RestAdapter, MemoryAdapter
  cache/            -- IndexedDBCache, CacheLike interface, cache-utils
  json-api/         -- JsonApiAdapter, JsonApiSerializer
  mdql/             -- MdqlQueryBuilder, MdqlValidator, MdqlMemoryExecutor
  model/            -- Model, StateMachine, Errors, Snapshot, relationships
  odata/            -- ODataAdapter
  request/          -- RequestManager, FetchHandler, CacheHandler
  schema/           -- SchemaService, decorators (@attr, @belongsTo, @hasMany, @model)
  serializer/       -- Serializer, JsonSerializer, RestSerializer, EmbeddedRecordsMixin
  store/            -- Store, IdentityMap, RecordArray, createStore
  transforms/       -- Transform, BooleanTransform, DateTransform, NumberTransform, StringTransform
tests/
  adapter/          -- adapter unit tests
  cache/            -- IndexedDB cache and store integration tests
  coverage/         -- edge-case tests
  e2e/              -- end-to-end tests (OData server, JSON:API, cache)
  mdql/             -- MDQL query builder, validator, executor tests
  model/            -- model unit tests
  store/            -- store operation tests
  (...)
```

---

## License

MIT

---

> **Note:** This project is developed internally and published as open source.
> Bug reports and issues are welcome.
