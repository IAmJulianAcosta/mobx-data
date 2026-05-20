import type { Model, RelationshipRef } from '@mobx-data/model';
import type { Store } from '@mobx-data/store';
import type { RecordSummary, RecordDetail, SchemaInfo } from './types.js';

interface ModelInternals {
  _data: Record<string, unknown>;
  _originalData: Record<string, unknown>;
  _relationships: Map<string, RelationshipRef>;
  _clientId: string;
}

function internals(record: Model): ModelInternals {
  return record as unknown as ModelInternals;
}

export function summarizeRecord(record: Model): RecordSummary {
  return {
    modelName: record.modelName,
    id: record.id,
    clientId: internals(record)._clientId,
    currentState: record.currentState,
    isNew: record.isNew,
    isDirty: record.isDirty,
    isDeleted: record.isDeleted,
    isError: record.isError,
    isLoading: record.isLoading,
    isSaving: record.isSaving,
    hasDirtyAttributes: record.hasDirtyAttributes,
    hasErrors: !record.isValid,
  };
}

export function detailRecord(record: Model): RecordDetail {
  const internal = internals(record);
  const relationships: Record<string, unknown> = {};
  if (internal._relationships) {
    for (const [name, reference] of internal._relationships) {
      relationships[name] = reference;
    }
  }

  const errors: Array<{ attribute: string; messages: string[] }> = [];
  for (const [attribute, errorMessages] of record.errors) {
    errors.push({
      attribute,
      messages: errorMessages.map((e) => e.message),
    });
  }

  const attributes = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(internal._data)) {
    if (key === '__proto__' || key === 'constructor') continue;
    attributes[key] = internal._data[key];
  }
  const originalAttributes = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(internal._originalData)) {
    if (key === '__proto__' || key === 'constructor') continue;
    originalAttributes[key] = internal._originalData[key];
  }

  return {
    ...summarizeRecord(record),
    attributes,
    originalAttributes,
    changedAttributes: record.changedAttributes(),
    relationships,
    errors,
  };
}

export function extractSchemaInfo(store: Store, modelName: string): SchemaInfo {
  const attributeDefinitions = store.schema.attributesDefinitionFor(modelName);
  const relationshipDefinitions = store.schema.relationshipsDefinitionFor(modelName);
  const discriminator = store.schema.discriminatorFor(modelName);

  const attributes: SchemaInfo['attributes'] = [];
  for (const [name, definition] of attributeDefinitions) {
    attributes.push({ name, type: definition.type });
  }

  const relationships: SchemaInfo['relationships'] = [];
  for (const [name, definition] of relationshipDefinitions) {
    relationships.push({
      name,
      kind: definition.kind,
      type: definition.type,
      async: definition.options.async ?? false,
      inverse: definition.options.inverse ?? null,
      polymorphic: definition.options.polymorphic ?? false,
    });
  }

  return {
    modelName,
    isAbstract: store.schema.isAbstract(modelName),
    discriminator: discriminator ? { key: discriminator.key } : null,
    attributes,
    relationships,
  };
}
