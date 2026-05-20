import 'reflect-metadata';
import { Model } from '@mobx-data/model';
import { Store, type AdapterLike, type SerializerLike } from './Store.js';
export interface CreateStoreOptions {
    models: Array<typeof Model & {
        modelName: string;
    }>;
    adapter?: AdapterLike;
    serializer?: SerializerLike;
}
export declare function createStore(options: CreateStoreOptions): Store;
//# sourceMappingURL=createStore.d.ts.map