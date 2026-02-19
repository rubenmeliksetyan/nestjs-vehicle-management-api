import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../database/models/user.model';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    return request.user;
  },
);
