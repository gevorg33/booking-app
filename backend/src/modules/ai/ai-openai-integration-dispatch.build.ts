import type { CommandResult } from './command-completion.types.js';
import type { AiOpenaiIntegrationService } from './ai-openai-integration.service.js';

export type OpenaiIntegrationDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt?: string;
};

export type OpenaiIntegrationDispatchHandler = (
  service: AiOpenaiIntegrationService,
  ctx: OpenaiIntegrationDispatchContext,
) => Promise<CommandResult>;

export function buildOpenaiIntegrationDispatchMap(): ReadonlyMap<
  string,
  OpenaiIntegrationDispatchHandler
> {
  const map = new Map<string, OpenaiIntegrationDispatchHandler>();

  map.set('configure_openai_integration', async (service, ctx) =>
    service.handleConfigureOpenaiIntegration(ctx.businessId, ctx.params, ctx.prompt),
  );

  return map;
}

/** Registry-driven dispatch table for AiOpenaiIntegrationService (ai-cmd-ext-0.5). */
export const OPENAI_INTEGRATION_DISPATCH_MAP = buildOpenaiIntegrationDispatchMap();
