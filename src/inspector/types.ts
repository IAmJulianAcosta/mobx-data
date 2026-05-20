export interface StoreSummary {
  types: Array<{ modelName: string; count: number }>;
  totalRecords: number;
}

export interface RecordSummary {
  modelName: string;
  id: string | null;
  clientId: string;
  currentState: string;
  isNew: boolean;
  isDirty: boolean;
  isDeleted: boolean;
  isError: boolean;
  isLoading: boolean;
  isSaving: boolean;
  hasDirtyAttributes: boolean;
  hasErrors: boolean;
}

export interface RecordDetail extends RecordSummary {
  attributes: Record<string, unknown>;
  originalAttributes: Record<string, unknown>;
  changedAttributes: Record<string, [unknown, unknown]>;
  relationships: Record<string, unknown>;
  errors: Array<{ attribute: string; messages: string[] }>;
}

export interface SchemaInfo {
  modelName: string;
  isAbstract: boolean;
  discriminator: { key: string } | null;
  attributes: Array<{ name: string; type: string | null }>;
  relationships: Array<{
    name: string;
    kind: 'belongsTo' | 'hasMany';
    type: string;
    async: boolean;
    inverse: string | null;
    polymorphic: boolean;
  }>;
}

export interface InspectorChangeEvent {
  type: 'added' | 'removed' | 'updated';
  modelName: string;
  id: string | null;
  record?: RecordSummary;
}

export interface DevToolsMessage {
  source: 'mobx-data-devtools';
  direction: 'page-to-panel' | 'panel-to-page';
  payload: DevToolsPayload;
}

export type DevToolsPayload =
  | DevToolsInitPayload
  | DevToolsSummaryPayload
  | DevToolsRecordsPayload
  | DevToolsRecordDetailPayload
  | DevToolsSchemaPayload
  | DevToolsSnapshotPayload
  | DevToolsChangeEventPayload
  | DevToolsQueryResultPayload
  | DevToolsRequestSummaryPayload
  | DevToolsRequestRecordsPayload
  | DevToolsRequestRecordDetailPayload
  | DevToolsRequestSchemaPayload
  | DevToolsRequestSnapshotPayload
  | DevToolsRequestQueryPayload;

export interface DevToolsInitPayload {
  type: 'init';
  storeId: string;
  storeCount: number;
  version: string;
}

export interface DevToolsSummaryPayload {
  type: 'summary';
  storeId: string;
  data: StoreSummary;
}

export interface DevToolsRecordsPayload {
  type: 'records';
  storeId: string;
  modelName: string;
  data: RecordSummary[];
}

export interface DevToolsRecordDetailPayload {
  type: 'recordDetail';
  storeId: string;
  modelName: string;
  id: string;
  data: RecordDetail;
}

export interface DevToolsSchemaPayload {
  type: 'schema';
  storeId: string;
  modelName: string;
  data: SchemaInfo;
}

export interface DevToolsSnapshotPayload {
  type: 'snapshot';
  storeId: string;
  data: unknown;
}

export interface DevToolsChangeEventPayload {
  type: 'changeEvent';
  storeId: string;
  event: InspectorChangeEvent;
}

export interface DevToolsRequestSummaryPayload {
  type: 'requestSummary';
  storeId: string;
}

export interface DevToolsRequestRecordsPayload {
  type: 'requestRecords';
  storeId: string;
  modelName: string;
}

export interface DevToolsRequestRecordDetailPayload {
  type: 'requestRecordDetail';
  storeId: string;
  modelName: string;
  id: string;
}

export interface DevToolsRequestSchemaPayload {
  type: 'requestSchema';
  storeId: string;
  modelName: string;
}

export interface DevToolsRequestSnapshotPayload {
  type: 'requestSnapshot';
  storeId: string;
}

export interface DevToolsRequestQueryPayload {
  type: 'requestQuery';
  storeId: string;
  queryText: string;
}

export interface DevToolsQueryResultPayload {
  type: 'queryResult';
  storeId: string;
  queryText: string;
  data: RecordSummary[];
  error: string | null;
}
