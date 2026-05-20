import type { Store } from '@mobx-data/store';
import type { Model } from '@mobx-data/model';
import type {
  LocalAiTool,
  LocalAiQueryResult,
  SearchPostsArguments,
} from '../LocalAiTypes.js';
import { validateSearchArguments } from '../LocalAiValidation.js';

const SEARCHABLE_FIELDS = ['title', 'body', 'content', 'description', 'tags'];

export class SearchPostsTool implements LocalAiTool<SearchPostsArguments, Model[]> {
  public readonly name = 'search_posts' as const;

  public async execute(
    arguments_: SearchPostsArguments,
    store: Store,
  ): Promise<LocalAiQueryResult<Model[]>> {
    const validationError = validateSearchArguments(arguments_);
    if (validationError) {
      return { ...validationError, intent: this.name } as LocalAiQueryResult<Model[]>;
    }

    const lowerText = arguments_.text.toLowerCase();
    const allPosts = store.peekAll('post').toArray();

    const matchingPosts = allPosts.filter((post: Model) => {
      const record = post as unknown as Record<string, unknown>;
      for (const field of SEARCHABLE_FIELDS) {
        const value = record[field];
        if (typeof value === 'string' && value.toLowerCase().includes(lowerText)) {
          return true;
        }
        if (Array.isArray(value)) {
          const hasMatch = value.some(
            (item) => typeof item === 'string' && item.toLowerCase().includes(lowerText),
          );
          if (hasMatch) {
            return true;
          }
        }
      }
      return false;
    });

    return {
      status: 'success',
      intent: this.name,
      data: matchingPosts,
      message: matchingPosts.length > 0
        ? `Found ${matchingPosts.length} post(s) matching "${arguments_.text}".`
        : `No posts found matching "${arguments_.text}".`,
    };
  }
}
