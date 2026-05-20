import type { Store } from '@mobx-data/store';
import { ConsoleInspector } from './ConsoleInspector.js';
import { DevToolsBridge } from './DevToolsBridge.js';

let bridge: DevToolsBridge | null = null;
let storeCounter = 0;

declare global {
  interface Window {
    $mobxData?: ConsoleInspector;
    $m?: (input?: string) => ConsoleInspector;
  }
}

export function enableConsoleInspector(
  store: Store,
  name: string = 'default',
): ConsoleInspector {
  const inspector = new ConsoleInspector(store, name);
  if (typeof window !== 'undefined') {
    window.$mobxData = inspector;
    window.$m = (input?: string) => {
      inspector.command(input ?? 'summary');
      return inspector;
    };
  }
  return inspector;
}

export function enableDevTools(
  store: Store,
  storeId?: string,
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  if (!bridge) {
    bridge = new DevToolsBridge();
    bridge.install();
  }

  storeCounter += 1;
  const resolvedId = storeId ?? `store-${storeCounter}`;
  bridge.registerStore(resolvedId, store);

  return () => {
    bridge?.unregisterStore(resolvedId);
  };
}

export function enableInspector(
  store: Store,
  name: string = 'default',
): { consoleInspector: ConsoleInspector; cleanup: () => void } {
  const consoleInspector = enableConsoleInspector(store, name);
  const cleanup = enableDevTools(store, name);
  return { consoleInspector, cleanup };
}
