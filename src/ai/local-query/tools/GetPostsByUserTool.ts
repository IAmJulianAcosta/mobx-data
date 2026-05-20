import type { Store } from '@mobx-data/store';
import type { Model } from '@mobx-data/model';
import type {
  LocalAiTool,
  LocalAiQueryResult,
  GetPostsByUserArguments,
} from '../LocalAiTypes.js';
import { validateUserArguments } from '../LocalAiValidation.js';

export class GetPostsByUserTool implements LocalAiTool<GetPostsByUserArguments, Model[]> {
  public readonly name = 'get_posts_by_user' as const;

  public async execute(
    arguments_: GetPostsByUserArguments,
    store: Store,
  ): Promise<LocalAiQueryResult<Model[]>> {
    const validationError = validateUserArguments(arguments_);
    if (validationError) {
      return { ...validationError, intent: this.name } as LocalAiQueryResult<Model[]>;
    }

    const allUsers = store.peekAll('user');
    let user: Model | undefined;

    if (arguments_.userId) {
      user = store.peekRecord('user', arguments_.userId) ?? undefined;
    } else if (arguments_.userName) {
      const lowerName = arguments_.userName.toLowerCase();
      user = allUsers.toArray().find((record: Model) => {
        const name = (record as unknown as Record<string, unknown>).name;
        return typeof name === 'string' && name.toLowerCase() === lowerName;
      });
    }

    if (!user) {
      return {
        status: 'success',
        intent: this.name,
        data: [],
        message: `No user found matching "${arguments_.userId ?? arguments_.userName}".`,
      };
    }

    const userId = user.id;
    const allPosts = store.peekAll('post').toArray();
    const userPosts = allPosts.filter((post: Model) => {
      const author = (post as unknown as Record<string, unknown>).author as Model | null;
      if (author && author.id === userId) {
        return true;
      }
      const authorId = (post as unknown as Record<string, unknown>).authorId;
      return authorId === userId;
    });

    const identifier = arguments_.userName ?? arguments_.userId;
    return {
      status: 'success',
      intent: this.name,
      data: userPosts,
      message: userPosts.length > 0
        ? `Found ${userPosts.length} post(s) for ${identifier}.`
        : `No posts found for ${identifier}.`,
    };
  }
}
