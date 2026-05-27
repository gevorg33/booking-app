import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { BusinessApiKey } from '../../modules/integrations/entities/business-api-key.entity.js';

export const CurrentApiKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): BusinessApiKey => {
    const request = ctx.switchToHttp().getRequest();
    return request.apiKey;
  },
);

export const ApiBusinessId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.apiKeyBusinessId;
  },
);
