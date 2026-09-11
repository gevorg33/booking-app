import type { CommandResult } from './command-completion.types.js';
import type { AiRecommendationProductService } from './ai-recommendation-product.service.js';
import {
  parseConfigureRecommendationProductFromPrompt,
  parseExplainRecommendationSetupFromPrompt,
  parseLinkRecommendedProductsFromPrompt,
} from './ai-recommendation-product.util.js';
import { parseExplainRecommendationAnalyticsFromPrompt } from './ai-recommendation-analytics.util.js';
import { parseSummarizeRecommendationPerformanceFromPrompt } from './ai-recommendation-performance.util.js';

export type RecommendationProductDispatchContext = {
  businessId: string;
  action: string;
  params: Record<string, unknown>;
  prompt: string;
};

export type RecommendationProductDispatchHandler = (
  service: AiRecommendationProductService,
  ctx: RecommendationProductDispatchContext,
) => Promise<CommandResult>;

export function buildRecommendationProductDispatchMap(): ReadonlyMap<
  string,
  RecommendationProductDispatchHandler
> {
  const map = new Map<string, RecommendationProductDispatchHandler>();

  map.set('explain_recommendation_setup', async (service, ctx) => {
    const parsed = parseExplainRecommendationSetupFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    const merged = parsed
      ? {
          ...ctx.params,
          ...(parsed.serviceId ? { serviceId: parsed.serviceId } : {}),
          ...(parsed.serviceName ? { serviceName: parsed.serviceName } : {}),
          ...(parsed.categoryId ? { categoryId: parsed.categoryId } : {}),
          ...(parsed.categoryName ? { categoryName: parsed.categoryName } : {}),
        }
      : ctx.params;
    return service.handleExplainRecommendationSetup(
      ctx.businessId,
      merged,
      ctx.prompt,
    );
  });

  map.set('explain_recommendation_analytics', async (service, ctx) => {
    const parsed = parseExplainRecommendationAnalyticsFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    const merged = parsed
      ? {
          ...ctx.params,
          ...(parsed.aspect ? { aspect: parsed.aspect } : {}),
          ...(parsed.surface ? { surface: parsed.surface } : {}),
          ...(parsed.productName ? { productName: parsed.productName } : {}),
          ...(parsed.daysAhead ? { daysAhead: parsed.daysAhead } : {}),
        }
      : ctx.params;
    return service.handleExplainRecommendationAnalytics(
      ctx.businessId,
      merged,
      ctx.prompt,
    );
  });

  map.set('summarize_recommendation_performance', async (service, ctx) => {
    const parsed = parseSummarizeRecommendationPerformanceFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    const merged = parsed
      ? {
          ...ctx.params,
          ...(parsed.aspect ? { aspect: parsed.aspect } : {}),
          ...(parsed.surface ? { surface: parsed.surface } : {}),
          ...(parsed.serviceName ? { serviceName: parsed.serviceName } : {}),
          ...(parsed.productName ? { productName: parsed.productName } : {}),
          ...(parsed.daysAhead ? { daysAhead: parsed.daysAhead } : {}),
        }
      : ctx.params;
    return service.handleSummarizeRecommendationPerformance(
      ctx.businessId,
      merged,
      ctx.prompt,
    );
  });

  map.set('configure_recommendation_product', async (service, ctx) => {
    const parsed = parseConfigureRecommendationProductFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    const merged = parsed
      ? {
          ...ctx.params,
          ...(parsed.productId ? { productId: parsed.productId } : {}),
          ...(parsed.productName
            ? { productName: parsed.productName, name: parsed.productName }
            : {}),
          ...(parsed.description ? { description: parsed.description } : {}),
          ...(parsed.imageUrl ? { imageUrl: parsed.imageUrl } : {}),
          ...(parsed.externalLink ? { externalLink: parsed.externalLink } : {}),
          ...(parsed.retailPrice !== undefined
            ? { retailPrice: parsed.retailPrice }
            : {}),
          ...(parsed.wantsImage ? { wantsImage: true } : {}),
          ...(parsed.wantsLink ? { wantsLink: true } : {}),
          ...(parsed.isUpdate ? { isUpdate: true } : {}),
        }
      : ctx.params;
    return service.handleConfigureRecommendationProduct(
      ctx.businessId,
      merged,
      ctx.prompt,
    );
  });

  map.set('link_recommended_products', async (service, ctx) => {
    const parsed = parseLinkRecommendedProductsFromPrompt(
      ctx.prompt,
      ctx.params,
    );
    const merged = parsed
      ? {
          ...ctx.params,
          ...(parsed.productNames.length > 0
            ? { productNames: parsed.productNames }
            : {}),
          ...(parsed.productIds ? { productIds: parsed.productIds } : {}),
          ...(parsed.serviceId ? { serviceId: parsed.serviceId } : {}),
          ...(parsed.serviceName ? { serviceName: parsed.serviceName } : {}),
          ...(parsed.categoryId ? { categoryId: parsed.categoryId } : {}),
          ...(parsed.categoryName ? { categoryName: parsed.categoryName } : {}),
        }
      : ctx.params;
    return service.handleLinkRecommendedProducts(
      ctx.businessId,
      merged,
      ctx.prompt,
    );
  });

  return map;
}

/** Registry-driven dispatch table for AiRecommendationProductService (ai-cmd-ext-0.5). */
export const RECOMMENDATION_PRODUCT_DISPATCH_MAP =
  buildRecommendationProductDispatchMap();
