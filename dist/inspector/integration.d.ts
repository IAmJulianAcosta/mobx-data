import type { Store } from '@mobx-data/store';
import { ConsoleInspector } from './ConsoleInspector.js';
declare global {
    interface Window {
        $mobxData?: ConsoleInspector;
        $m?: (input?: string) => unknown;
    }
}
export declare function enableConsoleInspector(store: Store, name?: string): ConsoleInspector;
export declare function enableDevTools(store: Store, storeId?: string): () => void;
export declare function enableInspector(store: Store, name?: string): {
    consoleInspector: ConsoleInspector;
    cleanup: () => void;
};
//# sourceMappingURL=integration.d.ts.map