import type { Store } from '@mobx-data/store';
import type { Model } from '@mobx-data/model';
import type {
  LocalAiTool,
  LocalAiQueryResult,
  GetCommentsByPostArguments,
} from '../LocalAiTypes.js';
import { validatePostArguments } from '../LocalAiValidation.js';

export class GetCommentsByPostTool implements LocalAiTool<GetCommentsByPostArguments, Model[]> {
  public readonly name = 'get_comments_by_post' as const;

  public async execute(
    arguments_: GetCommentsByPostArguments,
    store: Store,
  ): Promise<LocalAiQueryResult<Model[]>> {
    const validationError = validatePostArguments(arguments_);
    if (validationError) {
      return { ...validationError, intent: this.name } as LocalAiQueryResult<Model[]>;
    }

    let post: Model | null = null;

    if (arguments_.postId) {
      post = store.peekRecord('post', arguments_.postId);
    } else if (arguments_.postTitle) {
      const lowerTitle = arguments_.postTitle.toLowerCase();
      const allPosts = store.peekAll('post').toArray();
      post = allPosts.find((record: Model) => {
        const { title } = (record as unknown as Record<string, unknown>);
        return typeof title === 'string' && title.toLowerCase().includes(lowerTitle);
      }) ?? null;
    }

    if (!post) {
      return {
        status: 'success',
        intent: this.name,
        data: [],
        message: `No post found matching "${arguments_.postId ?? arguments_.postTitle}".`,
      };
    }

    const postId = post.id;
    const allComments = store.peekAll('comment').toArray();
    const postComments = allComments.filter((comment: Model) => {
      const commentPost = (comment as unknown as Record<string, unknown>).post as Model | null;
      if (commentPost && commentPost.id === postId) {
        return true;
      }
      const commentPostId = (comment as unknown as Record<string, unknown>).postId;
      return commentPostId === postId;
    });

    const identifier = arguments_.postTitle ?? arguments_.postId;
    return {
      status: 'success',
      intent: this.name,
      data: postComments,
      message: postComments.length > 0
        ? `Found ${postComments.length} comment(s) for post "${identifier}".`
        : `No comments found for post "${identifier}".`,
    };
  }
}
