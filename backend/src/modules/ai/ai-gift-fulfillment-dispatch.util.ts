import type { CommandResult } from './command-completion.types.js';
import {
  GIFT_FULFILLMENT_LOGIC_DISPATCH_MAP,
  type GiftFulfillmentDispatchContext,
  type GiftFulfillmentLogicDispatchHandler,
} from './ai-gift-fulfillment-dispatch.build.js';
import type { GiftFulfillmentLogicDeps } from './ai-gift-fulfillment.logic.js';

export function getGiftFulfillmentLogicDispatchHandler(
  action: string,
): GiftFulfillmentLogicDispatchHandler | undefined {
  return GIFT_FULFILLMENT_LOGIC_DISPATCH_MAP.get(action);
}

export async function dispatchGiftFulfillmentLogicIntent(
  deps: GiftFulfillmentLogicDeps,
  ctx: GiftFulfillmentDispatchContext,
): Promise<CommandResult | null> {
  const handler = GIFT_FULFILLMENT_LOGIC_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(deps, ctx);
}

export function giftFulfillmentDispatchMapHas(action: string): boolean {
  return GIFT_FULFILLMENT_LOGIC_DISPATCH_MAP.has(action);
}
