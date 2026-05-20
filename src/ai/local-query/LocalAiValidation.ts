import type {
  LocalAiQueryResult,
  GetPostsByUserArguments,
  GetUserProfileArguments,
  GetCommentsByPostArguments,
  SearchPostsArguments,
  GetRecentPostsArguments,
} from './LocalAiTypes.js';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

function validationError(message: string): LocalAiQueryResult {
  return {
    status: 'validation_error',
    message,
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateUserArguments(
  arguments_: GetPostsByUserArguments | GetUserProfileArguments,
): LocalAiQueryResult | null {
  if (!isNonEmptyString(arguments_.userId) && !isNonEmptyString(arguments_.userName)) {
    return validationError('Either userId or userName must be provided.');
  }
  return null;
}

export function validatePostArguments(
  arguments_: GetCommentsByPostArguments,
): LocalAiQueryResult | null {
  if (!isNonEmptyString(arguments_.postId) && !isNonEmptyString(arguments_.postTitle)) {
    return validationError('Either postId or postTitle must be provided.');
  }
  return null;
}

export function validateSearchArguments(
  arguments_: SearchPostsArguments,
): LocalAiQueryResult | null {
  if (!isNonEmptyString(arguments_.text)) {
    return validationError('Search text must be a non-empty string.');
  }
  return null;
}

export function normalizeLimit(arguments_: GetRecentPostsArguments): number {
  const raw = arguments_.limit;
  if (raw === undefined || raw === null) {
    return DEFAULT_LIMIT;
  }
  const value = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  if (Number.isNaN(value) || value < 1) {
    return DEFAULT_LIMIT;
  }
  return Math.min(value, MAX_LIMIT);
}
