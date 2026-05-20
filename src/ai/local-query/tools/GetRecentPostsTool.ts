import type { Store } from '@mobx-data/store';
import type { Model } from '@mobx-data/model';
import type {
  LocalAiTool,
  LocalAiQueryResult,
  GetRecentPostsArguments,
} from '../LocalAiTypes.js';
import { normalizeLimit } from '../LocalAiValidation.js';

export class GetRecentPostsTool implements LocalAiTool<GetRecentPostsArguments, Model[]> {
  public readonly name = 'get_recent_posts' as const;

  public async execute(
    arguments_: GetRecentPostsArguments,
    store: Store,
  ): Promise<LocalAiQueryResult<Model[]>> {
    const limit = normalizeLimit(arguments_);
    const allPosts = store.peekAll('post').toArray();
    const recentPosts = allPosts.slice(-limit).reverse();

    return {
      status: 'success',
      intent: this.name,
      data: recentPosts,
      message: recentPosts.length > 0
        ? `Found ${recentPosts.length} recent post(s).`
        : 'No posts found.',
    };
  }
}
