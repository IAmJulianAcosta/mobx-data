import type { Store } from '@mobx-data/store';

// ─── Query result statuses ──────────────────────────────────

export type LocalAiQueryStatus =
  | 'success'
  | 'unsupported'
  | 'validation_error'
  | 'not_found'
  | 'error';

// ─── Generic intent (schema-driven) ────────────────────────

export type DataSourceMode = 'local' | 'server' | 'both';

export interface GenericIntent {
  target: string;
  filterType: string | null;
  filterAttribute: string | null;
  filterValue: string | null;
  throughType: string | null;
  search: string | null;
  limit: number | null;
  confidence: number;
}

export class NotADataQueryError extends Error {
  public readonly originalQuery: string;

  constructor(originalQuery: string) {
    super(`Not a data query: "${originalQuery}"`);
    this.name = 'NotADataQueryError';
    this.originalQuery = originalQuery;
  }
}

// ─── Schema introspection ──────────────────────────────────

export interface SchemaTypeDescriptor {
  typeName: string;
  attributes: Array<{ name: string; type: string | null }>;
  relationships: Array<{
    name: string;
    kind: 'belongsTo' | 'hasMany';
    relatedType: string;
  }>;
}

export interface RelationshipGraphEdge {
  relatedType: string;
  relationshipName: string;
  kind: 'belongsTo' | 'hasMany';
}

export interface SchemaIntrospectionResult {
  typeNames: string[];
  types: Map<string, SchemaTypeDescriptor>;
  relationshipGraph: Map<string, RelationshipGraphEdge[]>;
  systemPrompt: string;
  jsonSchema: string;
  stringAttributes: Map<string, string[]>;
}

// ─── Parser interface ──────────────────────────────────────

export interface LocalAiIntent<TArguments = unknown> {
  intent: string;
  arguments: TArguments;
  originalQuery: string;
  confidence: number;
}

export interface LocalAiQueryResult<TData = unknown> {
  status: LocalAiQueryStatus;
  intent?: string;
  parsedIntent?: unknown;
  data?: TData;
  message: string;
  error?: string;
}

export interface LocalAiIntentParser {
  parse(query: string): Promise<LocalAiIntent | null>;
}

// ─── Legacy types (backward compat) ────────────────────────

/** @deprecated Use GenericIntent instead. */
export type LocalAiIntentName =
  | 'get_posts_by_user'
  | 'get_user_profile'
  | 'get_comments_by_post'
  | 'get_comments_by_user'
  | 'search_posts'
  | 'get_recent_posts';

/** @deprecated Use GenericQueryExecutor instead. */
export interface LocalAiTool<TArguments = unknown, TData = unknown> {
  name: LocalAiIntentName;
  execute(arguments_: TArguments, store: Store): Promise<LocalAiQueryResult<TData>>;
}

/** @deprecated */
export interface GetPostsByUserArguments {
  userId?: string;
  userName?: string;
}

/** @deprecated */
export interface GetUserProfileArguments {
  userId?: string;
  userName?: string;
}

/** @deprecated */
export interface GetCommentsByPostArguments {
  postId?: string;
  postTitle?: string;
}

/** @deprecated */
export interface GetCommentsByUserArguments {
  userId?: string;
  userName?: string;
}

/** @deprecated */
export interface SearchPostsArguments {
  text: string;
}

/** @deprecated */
export interface GetRecentPostsArguments {
  limit?: number;
}
