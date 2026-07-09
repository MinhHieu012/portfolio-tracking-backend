import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../../modules/users/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const context = GqlExecutionContext.create(ctx);
    const request = context.getContext<{ req: { user: User } }>().req;
    return request.user;
  },
);
