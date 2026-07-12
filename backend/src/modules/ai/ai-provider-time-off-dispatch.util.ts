import type { CommandResult } from './command-completion.types.js';
import type { AiProviderTimeOffService } from './ai-provider-time-off.service.js';
import {
  PROVIDER_TIME_OFF_DISPATCH_MAP,
  type ProviderTimeOffDispatchContext,
  type ProviderTimeOffDispatchHandler,
} from './ai-provider-time-off-dispatch.build.js';

export function getProviderTimeOffDispatchHandler(
  action: string,
): ProviderTimeOffDispatchHandler | undefined {
  return PROVIDER_TIME_OFF_DISPATCH_MAP.get(action);
}

export async function dispatchProviderTimeOffIntent(
  service: AiProviderTimeOffService,
  ctx: ProviderTimeOffDispatchContext,
): Promise<CommandResult | null> {
  const handler = PROVIDER_TIME_OFF_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(service, ctx);
}

export function providerTimeOffDispatchMapHas(action: string): boolean {
  return PROVIDER_TIME_OFF_DISPATCH_MAP.has(action);
}
