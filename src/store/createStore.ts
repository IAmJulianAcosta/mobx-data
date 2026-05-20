import 'reflect-metadata';
import { SchemaService } from '@mobx-data/schema';
import { Model } from '@mobx-data/model';
import { Store, type AdapterLike, type SerializerLike } from './Store.js';
import { RestAdapter } from '../adapter/RestAdapter.js';
import { JsonSerializer } from '../serializer/JsonSerializer.js';

export interface CreateStoreOptions {
  models: Array<typeof Model & { modelName: string }>;
  adapter?: AdapterLike;
  serializer?: SerializerLike;
}

export function createStore(options: CreateStoreOptions): Store {
  if (typeof Reflect.getMetadata !== 'function') {
    throw new Error(
      'mobx-data requires reflect-metadata. '
      + 'Did you forget to import "reflect-metadata" at the top of your entry point?',
    );
  }

  const schema = new SchemaService();
  for (const modelClass of options.models) {
    schema.registerModel(modelClass.modelName, modelClass as never);
  }

  const store = new Store(schema);
  const adapter = options.adapter ?? new RestAdapter();
  const serializer = options.serializer ?? new JsonSerializer();

  for (const modelClass of options.models) {
    store.registerAdapter(modelClass.modelName, adapter);
    store.registerSerializer(modelClass.modelName, serializer);
  }
  store.registerAdapter('application', adapter);
  store.registerSerializer('application', serializer);

  return store;
}
