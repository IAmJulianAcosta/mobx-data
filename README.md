# mobx-data

A feature-complete port of Ember Data to MobX — framework-agnostic, TypeScript-first, fully observable.

---

## Overview

`mobx-data` brings the battle-tested Ember Data mental model (Identity Map, pluggable adapters/serializers, record state machines, async relationships) to any MobX application.  All state is observable; no manual invalidation or subscriptions are needed.

### Design principles

- **Framework-agnostic** — works with React, Vue, Solid, or plain JS
- **MobX-native** — every piece of state is a MobX `observable`; computed props react automatically
- **TypeScript-first** — full generic types throughout
- **Ember Data parity** — near 1-to-1 API mapping so Ember Data users feel at home

---

## Features

| Feature | Status |
|---------|--------|
| `Store` with Identity Map | ✅ |
| `Model` base class + lifecycle hooks | ✅ |
| `@attr`, `@belongsTo`, `@hasMany` decorators | ✅ |
| Record state machine (`isNew`, `isDirty`, `isSaving`, …) | ✅ |
| Dirty tracking & `rollbackAttributes` | ✅ |
| `RecordArray` / `AdapterPopulatedRecordArray` | ✅ |
| `RestAdapter` | ✅ |
| `JsonApiAdapter` | ✅ |
| `ODataAdapter` (v4) | ✅ |
| `JsonSerializer` / `RestSerializer` / `JsonApiSerializer` | ✅ |
| `EmbeddedRecordsMixin` | ✅ |
| Async & sync `belongsTo` / `hasMany` | ✅ |
| Inverse relationship tracking | ✅ |
| `Snapshot` | ✅ |
| `RequestManager` + handler chain | ✅ |
| `FetchHandler` / `CacheHandler` | ✅ |
| Built-in transforms (`string`, `number`, `boolean`, `date`) | ✅ |
| `SchemaService` | ✅ |
| `Errors` (field-level validation) | ✅ |

---

## Installation

```bash
pnpm add mobx-data mobx reflect-metadata tsyringe
```

Enable decorator metadata in your `tsconfig.json`:

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
import 'reflect-metadata';
```

---

## Quick start

### 1. Define models

```ts
import { Model, attr, belongsTo, hasMany } from 'mobx-data/model';

class User extends Model {
  static modelName = 'user';

  @attr('string') name!: string;
  @attr('string') email!: string;

  @hasMany('post', { async: false, inverse: 'author' })
  posts!: ManyArray<Post>;
}

class Post extends Model {
  static modelName = 'post';

  @attr('string') title!: string;
  @attr('date')   publishedAt!: Date | null;

  @belongsTo('user', { async: false, inverse: 'posts' })
  author!: User | null;
}
```

### 2. Create a store

```ts
import 'reflect-metadata';
import { container } from 'tsyringe';
import { Store } from 'mobx-data/store';
import { SchemaService } from 'mobx-data/schema';
import { RestAdapter } from 'mobx-data/adapter';
import { JsonSerializer } from 'mobx-data/serializer';

const schema = container.resolve(SchemaService);
schema.registerModel('user', User);
schema.registerModel('post', Post);

const store = container.resolve(Store);

const adapter = new RestAdapter();
adapter.host = 'https://api.example.com';

store.registerAdapter('application', adapter);
store.registerSerializer('application', new JsonSerializer());
```

### 3. Use the store

```ts
// Find a single record
const user = await store.findRecord('user', '1');
console.log(user.name); // 'Alice'

// Find all
const users = await store.findAll('user');

// Query
const posts = await store.query('post', { filter: { published: true } });

// Create
const post = store.createRecord('post', { title: 'Hello World' });
await post.save();

// Update
user.name = 'Bob';
await user.save();

// Delete
await post.destroyRecord();

// Push raw data
store.push({
  data: { type: 'user', id: '2', attributes: { name: 'Carol' } }
});
```

---

## Adapters

### RestAdapter

Standard REST conventions (`GET /users/1`, `POST /users`, `PUT /users/1`, `DELETE /users/1`).

```ts
const adapter = new RestAdapter();
adapter.host = 'https://api.example.com';
adapter.namespace = 'api/v2';
adapter.headers = { Authorization: 'Bearer …' };
```

### JsonApiAdapter

Implements the [JSON:API](https://jsonapi.org) specification, including `application/vnd.api+json` MIME type and PATCH for updates.

```ts
const adapter = new JsonApiAdapter();
adapter.host = 'https://api.example.com';
```

### ODataAdapter

Implements OData v4 conventions (PascalCase entity sets, key-in-parentheses URLs, `$filter` / `$expand` / `$select` / `$top` / `$skip` / `$orderby` / `$count`).

```ts
import { ODataAdapter } from 'mobx-data/odata';

const adapter = new ODataAdapter();
adapter.host = 'https://api.example.com/odata';

// $expand navigation properties
const posts = await adapter.query(store, 'post', {
  $expand: 'author,comments',
  $filter: "publishedAt gt '2026-01-01'",
  $orderby: 'title asc',
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
import { RestSerializer, EmbeddedRecordsMixin } from 'mobx-data/serializer';

class PostSerializer extends EmbeddedRecordsMixin(RestSerializer) {
  attrs = {
    comments: { embedded: 'always' },
  };
}
```

---

## Relationships

```ts
// Sync (records must already be in the store)
@belongsTo('user', { async: false }) author!: User | null;
@hasMany('tag',  { async: false })   tags!: ManyArray<Tag>;

// Async (loaded on demand)
@belongsTo('user',    { async: true }) author!: AsyncBelongsTo<User>;
@hasMany('comment',   { async: true }) comments!: AsyncHasMany<Comment>;
```

Async wrappers are `PromiseLike` — they can be `await`ed or used in MobX reactions:

```ts
const author = await post.author; // AsyncBelongsTo<User>
console.log(post.author.isLoaded); // true
```

Inverse tracking is automatic when `inverse` is specified:

```ts
@belongsTo('user', { async: false, inverse: 'posts' }) author!: User | null;
// Setting post.author automatically adds post to user.posts
```

---

## Transforms

```ts
@attr('string')  name!: string;
@attr('number')  age!: number;
@attr('boolean') active!: boolean;
@attr('date')    createdAt!: Date | null;
@attr()          raw!: unknown;  // pass-through
```

---

## Request pipeline

The `RequestManager` provides a middleware-style handler chain:

```ts
import { RequestManager, FetchHandler, CacheHandler } from 'mobx-data/request';

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
const post = store.createRecord('post', { title: 'Draft' });
post.isNew;   // true
post.isDirty; // true

await post.save();
post.isNew;   // false
post.isDirty; // false
```

---

## Testing

The project includes a full end-to-end test suite against an in-process OData server built with [`simple-odata-server`](https://github.com/pofider/simple-odata-server).

```bash
pnpm test          # run all tests once
pnpm test:watch    # watch mode
pnpm typecheck     # TypeScript type check
```

To run the test OData server manually:

```bash
bun tests/e2e/fixtures/run-bun.ts
```

---

## Project structure

```
src/
  adapter/          — Adapter, RestAdapter
  json-api/         — JsonApiAdapter, JsonApiSerializer
  model/            — Model, StateMachine, Errors, Snapshot, relationships
  odata/            — ODataAdapter
  request/          — RequestManager, FetchHandler, CacheHandler, types
  schema/           — SchemaService, decorators (@attr, @belongsTo, @hasMany), types
  serializer/       — Serializer, JsonSerializer, RestSerializer, EmbeddedRecordsMixin
  store/            — Store, IdentityMap, RecordArray
  transforms/       — Transform, BooleanTransform, DateTransform, NumberTransform, StringTransform
tests/
  e2e/              — end-to-end tests against a live OData server
    fixtures/       — in-process OData server, seed data, filter engine
  adapter/          — adapter unit tests
  model/            — model unit tests
  (…)
```

---

## License

MIT

---

> **Note:** This project is developed internally and published as open source.
> Bug reports and issues are welcome.
