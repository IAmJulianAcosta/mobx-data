import type { Store } from '@mobx-data/store';
import { StoreInspector } from './StoreInspector.js';
import type { DevToolsMessage, DevToolsPayload } from './types.js';

export interface DevToolsHook {
  stores: Map<string, StoreInspector>;
  version: string;
  registerStore(storeId: string, store: Store): void;
  unregisterStore(storeId: string): void;
}

const HOOK_KEY = '__MOBX_DATA_DEVTOOLS_HOOK__';
const SOURCE = 'mobx-data-devtools' as const;
const VERSION = '1.4.0';

function getGlobal(): Record<string, unknown> {
  if (typeof globalThis !== 'undefined') { return globalThis as unknown as Record<string, unknown>; }
  if (typeof window !== 'undefined') { return window as unknown as Record<string, unknown>; }
  return {};
}

function getEventTarget(): {
  addEventListener?(type: string, handler: (event: unknown) => void): void;
  removeEventListener?(type: string, handler: (event: unknown) => void): void;
  postMessage?(data: unknown, origin?: string): void;
} | null {
  const global = getGlobal();
  if (typeof global.addEventListener === 'function') { return global as unknown as typeof window; }
  return null;
}

export class DevToolsBridge {
  private readonly stores = new Map<string, StoreInspector>();
  private readonly disposers = new Map<string, () => void>();
  private messageHandler: ((event: unknown) => void) | null = null;

  install(): void {
    const global = getGlobal();

    const hook: DevToolsHook = {
      stores: this.stores,
      version: VERSION,
      registerStore: (storeId, store) => this.registerStore(storeId, store),
      unregisterStore: (storeId) => this.unregisterStore(storeId),
    };

    Object.defineProperty(global, HOOK_KEY, {
      value: hook,
      writable: true,
      enumerable: false,
      configurable: true,
    });

    const eventTarget = getEventTarget();
    if (eventTarget?.addEventListener) {
      this.messageHandler = (event: unknown) => {
        const messageEvent = event as MessageEvent;
        if (messageEvent.origin && typeof location !== 'undefined' && messageEvent.origin !== location.origin) { return; }
        if (messageEvent.data?.source !== SOURCE || messageEvent.data?.direction !== 'panel-to-page') { return; }
        if (!this.isValidPayload(messageEvent.data?.payload)) { return; }
        this.handleMessage(messageEvent as MessageEvent<DevToolsMessage>);
      };
      eventTarget.addEventListener('message', this.messageHandler);
    }
  }

  registerStore(storeId: string, store: Store): void {
    const inspector = new StoreInspector(store);
    this.stores.set(storeId, inspector);

    const disposer = inspector.observe((event) => {
      this.sendToPanel({
        type: 'changeEvent',
        storeId,
        event,
      });
    });
    this.disposers.set(storeId, disposer);

    this.sendToPanel({
      type: 'init',
      storeId,
      storeCount: this.stores.size,
      version: VERSION,
    });
  }

  unregisterStore(storeId: string): void {
    const disposer = this.disposers.get(storeId);
    if (disposer) {
      disposer();
      this.disposers.delete(storeId);
    }
    this.stores.delete(storeId);
  }

  destroy(): void {
    for (const disposer of this.disposers.values()) {
      disposer();
    }
    this.disposers.clear();
    this.stores.clear();

    const eventTarget = getEventTarget();
    if (eventTarget?.removeEventListener && this.messageHandler) {
      eventTarget.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }

    const global = getGlobal();
    delete global[HOOK_KEY];
  }

  private handleMessage(event: MessageEvent<DevToolsMessage>): void {
    const { payload } = event.data;
    const storeId = 'storeId' in payload ? payload.storeId : undefined;
    const inspector = storeId ? this.stores.get(storeId) : undefined;

    switch (payload.type) {
      case 'requestSummary': {
        if (!inspector) { return; }
        this.sendToPanel({ type: 'summary', storeId: storeId!, data: inspector.summary() });
        break;
      }
      case 'requestRecords': {
        if (!inspector || !('modelName' in payload)) { return; }
        this.sendToPanel({
          type: 'records',
          storeId: storeId!,
          modelName: payload.modelName,
          data: inspector.records(payload.modelName),
        });
        break;
      }
      case 'requestRecordDetail': {
        if (!inspector || !('modelName' in payload) || !('id' in payload)) { return; }
        const detail = inspector.record(payload.modelName, payload.id);
        if (!detail) { return; }
        this.sendToPanel({
          type: 'recordDetail',
          storeId: storeId!,
          modelName: payload.modelName,
          id: payload.id,
          data: detail,
        });
        break;
      }
      case 'requestSchema': {
        if (!inspector || !('modelName' in payload)) { return; }
        this.sendToPanel({
          type: 'schema',
          storeId: storeId!,
          modelName: payload.modelName,
          data: inspector.schema(payload.modelName),
        });
        break;
      }
      case 'requestSnapshot': {
        if (!inspector) { return; }
        this.sendToPanel({ type: 'snapshot', storeId: storeId!, data: inspector.snapshot() });
        break;
      }
      case 'requestQuery': {
        if (!inspector || !('queryText' in payload)) { return; }
        const { queryText } = (payload as { queryText: string });
        try {
          const { modelName, results } = inspector.queryWithMeta(queryText);
          const allRecords = inspector.records(modelName);
          const recordIndex = new Map(allRecords.map((s) => [s.id, s]));
          const summaries = results
            .map((record) => recordIndex.get((record as unknown as { id: string }).id))
            .filter(Boolean) as import('./types.js').RecordSummary[];
          this.sendToPanel({
            type: 'queryResult',
            storeId: storeId!,
            queryText,
            data: summaries,
            error: null,
          });
        } catch (error) {
          this.sendToPanel({
            type: 'queryResult',
            storeId: storeId!,
            queryText,
            data: [],
            error: error instanceof Error ? error.message : String(error),
          });
        }
        break;
      }
      default:
        break;
    }
  }

  private isValidPayload(payload: unknown): boolean {
    if (!payload || typeof payload !== 'object') { return false; }
    const typed = payload as Record<string, unknown>;
    const validTypes = ['requestSummary', 'requestRecords', 'requestRecordDetail', 'requestSchema', 'requestSnapshot', 'requestQuery'];
    return typeof typed.type === 'string' && validTypes.includes(typed.type) && typeof typed.storeId === 'string';
  }

  private sendToPanel(payload: DevToolsPayload): void {
    const eventTarget = getEventTarget();
    if (!eventTarget?.postMessage) { return; }
    const message: DevToolsMessage = {
      source: SOURCE,
      direction: 'page-to-panel',
      payload,
    };
    const origin = typeof location !== 'undefined' ? location.origin : '*';
    eventTarget.postMessage(message, origin);
  }
}
