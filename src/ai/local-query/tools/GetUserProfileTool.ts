import type { Store } from '@mobx-data/store';
import type { Model } from '@mobx-data/model';
import type {
  LocalAiTool,
  LocalAiQueryResult,
  GetUserProfileArguments,
} from '../LocalAiTypes.js';
import { validateUserArguments } from '../LocalAiValidation.js';

export class GetUserProfileTool implements LocalAiTool<GetUserProfileArguments, Model> {
  public readonly name = 'get_user_profile' as const;

  public async execute(
    arguments_: GetUserProfileArguments,
    store: Store,
  ): Promise<LocalAiQueryResult<Model>> {
    const validationError = validateUserArguments(arguments_);
    if (validationError) {
      return { ...validationError, intent: this.name } as LocalAiQueryResult<Model>;
    }

    let user: Model | null = null;

    if (arguments_.userId) {
      user = store.peekRecord('user', arguments_.userId);
    } else if (arguments_.userName) {
      const lowerName = arguments_.userName.toLowerCase();
      const allUsers = store.peekAll('user').toArray();
      user = allUsers.find((record: Model) => {
        const { name } = (record as unknown as Record<string, unknown>);
        return typeof name === 'string' && name.toLowerCase() === lowerName;
      }) ?? null;
    }

    if (!user) {
      return {
        status: 'not_found',
        intent: this.name,
        message: `No user found matching "${arguments_.userId ?? arguments_.userName}".`,
      };
    }

    return {
      status: 'success',
      intent: this.name,
      data: user,
      message: `Found profile for ${(user as unknown as Record<string, unknown>).name ?? user.id}.`,
    };
  }
}
