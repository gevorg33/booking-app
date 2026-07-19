import type { CommandResult } from './command-completion.types.js';
import type { AiRecommendationProductService } from './ai-recommendation-product.service.js';
import {
  RECOMMENDATION_PRODUCT_DISPATCH_MAP,
  type RecommendationProductDispatchContext,
  type RecommendationProductDispatchHandler,
} from './ai-recommendation-product-dispatch.build.js';

export function getRecommendationProductDispatchHandler(
  action: string,
): RecommendationProductDispatchHandler | undefined {
  return RECOMMENDATION_PRODUCT_DISPATCH_MAP.get(action);
}

export async function dispatchRecommendationProductIntent(
  service: AiRecommendationProductService,
  ctx: RecommendationProductDispatchContext,
): Promise<CommandResult | null> {
  const handler = RECOMMENDATION_PRODUCT_DISPATCH_MAP.get(ctx.action);
  if (!handler) return null;
  return handler(service, ctx);
}

export function recommendationProductDispatchMapHas(action: string): boolean {
  return RECOMMENDATION_PRODUCT_DISPATCH_MAP.has(action);
}
