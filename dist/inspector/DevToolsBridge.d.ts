import type { Store } from '@mobx-data/store';
import { StoreInspector } from './StoreInspector.js';
export interface DevToolsHook {
    stores: Map<string, StoreInspector>;
    version: string;
    registerStore(storeId: string, store: Store): void;
    unregisterStore(storeId: string): void;
}
export declare class DevToolsBridge {
    private readonly stores;
    private readonly disposers;
    private messageHandler;
    install(): void;
    registerStore(storeId: string, store: Store): void;
    unregisterStore(storeId: string): void;
    destroy(): void;
    private handleMessage;
    private isValidPayload;
    private sendToPanel;
}
//# sourceMappingURL=DevToolsBridge.d.ts.map