import type { Store } from '@mobx-data/store';
import type { Model } from '@mobx-data/model';
import type {
  LocalAiTool,
  LocalAiQueryResult,
  GetCommentsByUserArguments,
} from '../LocalAiTypes.js';
import { validateUserArguments } from '../LocalAiValidation.js';

export class GetCommentsByUserTool implements LocalAiTool<GetCommentsByUserArguments, Model[]> {
  public readonly name = 'get_comments_by_user' as const;

  public async execute(
    arguments_: GetCommentsByUserArguments,
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
        const { name } = (record as unknown as Record<string, unknown>);
        return typeof name === 'string' && name.toLowerCase() === lowerName;
      });
    }

    if (!user) {
      const identifier = arguments_.userName ?? arguments_.userId;
      return {
        status: 'success',
        intent: this.name,
        data: [],
        message: `No user found matching "${identifier}".`,
      };
    }

    const userId = user.id;
    const allPosts = store.peekAll('post').toArray();
    const userPostIds = new Set(
      allPosts
        .filter((post: Model) => {
          const author = (post as unknown as Record<string, unknown>).author as Model | null;
          if (author && author.id === userId) { return true; }
          return (post as unknown as Record<string, unknown>).authorId === userId;
        })
        .map((post: Model) => post.id),
    );

    const allComments = store.peekAll('comment').toArray();
    const userComments = allComments.filter((comment: Model) => {
      const commentPost = (comment as unknown as Record<string, unknown>).post as Model | null;
      if (commentPost && userPostIds.has(commentPost.id)) { return true; }
      const commentPostId = (comment as unknown as Record<string, unknown>).postId as string | undefined;
      return commentPostId !== undefined && userPostIds.has(commentPostId);
    });

    const identifier = arguments_.userName ?? arguments_.userId;
    return {
      status: 'success',
      intent: this.name,
      data: userComments,
      message: userComments.length > 0
        ? `Found ${userComments.length} comment(s) on ${userPostIds.size} post(s) by ${identifier}.`
        : `No comments found on posts by ${identifier}.`,
    };
  }
}
