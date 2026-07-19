import type { CommandResult } from './command-completion.types.js';
import type { AiOpenaiIntegrationService } from './ai-openai-integration.service.js';
import {
  OPENAI_INTEGRATION_DISPATCH_MAP,
  type OpenaiIntegrationDispatchContext,
  type OpenaiIntegrationDispatchHandler,
} from './ai-openai-integration-dispatch.build.js';

export function getOpenaiIntegrationDispatchHandler(
  action: string,
): OpenaiIntegrationDispatchHandler | undefined {
  return OPENAI_INTEGRATION_DISPATCH_MAP.get(action);
}

export async function dispatchOpenaiIntegrationIntent(
  service: AiOpenaiIntegrationService,
  ctx: OpenaiIntegrationDispatchContext,
): Promise<CommandResult | null> {
  const handler = OPENAI_INTEGRATION_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(service, ctx);
}

export function openaiIntegrationDispatchMapHas(action: string): boolean {
  return OPENAI_INTEGRATION_DISPATCH_MAP.has(action);
}
