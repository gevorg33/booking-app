import { COMMAND_REGISTRY } from './ai-command-registry.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import { resolveHandlerForSurface } from './ai-command-registry.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  PAYMENTS_LOGIC_DISPATCH_MAP,
  type PaymentsDispatchContext,
  type PaymentsLogicDispatchHandler,
} from './ai-payments-dispatch.build.js';
import type { PaymentsLogicDeps } from './ai-payments.logic.js';

const AI_PAYMENTS_HANDLER = 'AiPaymentsService';

/** Intent ids whose registry default or per-surface handler is AiPaymentsService. */
export function listAiPaymentsServiceRegistryIntentIds(): string[] {
  return COMMAND_REGISTRY.filter((entry) => {
    if (entry.handler === AI_PAYMENTS_HANDLER) return true;
    return Object.values(entry.surfaceHandlers ?? {}).includes(
      AI_PAYMENTS_HANDLER,
    );
  })
    .map((entry) => entry.id)
    .sort((a, b) => a.localeCompare(b));
}

export function isAiPaymentsServiceRegistryIntent(intentId: string): boolean {
  return listAiPaymentsServiceRegistryIntentIds().includes(intentId);
}

export function isAiPaymentsServiceIntentForSurface(
  intentId: string,
  surface: CommandSurface,
): boolean {
  return resolveHandlerForSurface(intentId, surface) === AI_PAYMENTS_HANDLER;
}

export function getPaymentsLogicDispatchHandler(
  action: string,
): PaymentsLogicDispatchHandler | undefined {
  return PAYMENTS_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchPaymentsLogicIntent(
  deps: PaymentsLogicDeps,
  ctx: PaymentsDispatchContext,
): Promise<CommandResult | null> {
  const handler = PAYMENTS_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function paymentsDispatchMapHas(action: string): boolean {
  return PAYMENTS_LOGIC_DISPATCH_MAP.has(action);
}
