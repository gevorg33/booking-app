import type { AiEvalLocale } from './eval/ai-command-eval.types.js';
import type { RecommendationAnalyticsAspect } from './ai-recommendation-analytics.util.js';
import type { RecommendationPerformanceAspect } from './ai-recommendation-performance.util.js';
import { EXPLAIN_RECOMMENDATION_ANALYTICS_PROMPTS } from './ai-recommendation-analytics.fixtures.js';
import { SUMMARIZE_RECOMMENDATION_PERFORMANCE_PROMPTS } from './ai-recommendation-performance.fixtures.js';

export type RecommendationAnalyticsEvalAction =
  | 'explain_recommendation_analytics'
  | 'summarize_recommendation_performance';

export interface RecommendationAnalyticsEvalScenario {
  id: string;
  prompt: string;
  locale: AiEvalLocale;
  expectedAction: RecommendationAnalyticsEvalAction;
  rescueReason?: string;
  paramsPartial?: Record<string, unknown>;
  aspect?: RecommendationAnalyticsAspect | RecommendationPerformanceAspect;
  needsMultilingual?: boolean;
}

/** Armenian/Russian recommendation analytics + performance phrasing (ai-cmd-rec-10). */
export const RECOMMENDATION_ANALYTICS_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian checkout recommendation analytics + performance (dashboard):
  - explain_recommendation_analytics: hy «բացատրիր recommendation analytics», «քանի checkout recommendation impressions ունենք», «ցույց տուր product_recommendation.shown և clicked counts», «web checkout vs consumer app recommendation stats»; ru «объясни аналитику рекомендаций», «сколько показов рекомендаций после checkout», «покажи product_recommendation.shown и clicked», «разбей клики рекомендаций по surface». READ raw impression/click counts, top products, surfaces — NOT summarize_recommendation_performance (CTR/bookings summary) and NOT explain_recommendation_setup (link configuration).
  - summarize_recommendation_performance: hy «ամփոփիր recommendation performance», «checkout recommendation CTR-ը որքան է», «CTR ըստ ապրանքների post-checkout recommendations-ի համար», «քանի booking ունեցավ recommendations shown»; ru «сводка эффективности рекомендаций», «какой CTR у checkout recommendations», «CTR по продуктам для рекомендаций после оплаты», «сколько бронирований с показанными рекомендациями». READ CTR by product/service and bookings-with-shown count — NOT explain_recommendation_analytics (raw counts) and NOT explain_recommendation_setup.`;

export const MULTILINGUAL_RECOMMENDATION_ANALYTICS_EVAL_SCENARIOS: RecommendationAnalyticsEvalScenario[] =
  [
    {
      id: 'hy-explain-analytics',
      locale: 'hy',
      prompt: 'Բացատրիր recommendation analytics',
      expectedAction: 'explain_recommendation_analytics',
      rescueReason: 'explain_recommendation_analytics',
      aspect: 'all',
      needsMultilingual: true,
    },
    {
      id: 'hy-impression-count',
      locale: 'hy',
      prompt: 'Քանի checkout recommendation impressions ունենք',
      expectedAction: 'explain_recommendation_analytics',
      rescueReason: 'explain_recommendation_analytics',
      aspect: 'impressions',
      needsMultilingual: true,
    },
    {
      id: 'hy-shown-clicked-counts',
      locale: 'hy',
      prompt: 'Ցույց տուր product_recommendation.shown և clicked counts',
      expectedAction: 'explain_recommendation_analytics',
      rescueReason: 'explain_recommendation_analytics',
      aspect: 'all',
      needsMultilingual: true,
    },
    {
      id: 'hy-web-vs-consumer-stats',
      locale: 'hy',
      prompt: 'Ցույց տուր web checkout vs consumer app recommendation stats',
      expectedAction: 'explain_recommendation_analytics',
      rescueReason: 'explain_recommendation_analytics',
      aspect: 'surfaces',
      needsMultilingual: true,
    },
    {
      id: 'hy-summarize-performance',
      locale: 'hy',
      prompt: 'Ամփոփիր recommendation performance',
      expectedAction: 'summarize_recommendation_performance',
      rescueReason: 'summarize_recommendation_performance',
      aspect: 'all',
      needsMultilingual: true,
    },
    {
      id: 'hy-checkout-ctr',
      locale: 'hy',
      prompt: 'Checkout recommendation CTR-ը որքան է',
      expectedAction: 'summarize_recommendation_performance',
      rescueReason: 'summarize_recommendation_performance',
      aspect: 'ctr',
      needsMultilingual: true,
    },
    {
      id: 'hy-ctr-by-product',
      locale: 'hy',
      prompt: 'CTR ըստ ապրանքների post-checkout recommendations-ի համար',
      expectedAction: 'summarize_recommendation_performance',
      rescueReason: 'summarize_recommendation_performance',
      aspect: 'byProduct',
      needsMultilingual: true,
    },
    {
      id: 'hy-bookings-with-shown',
      locale: 'hy',
      prompt: 'Քանի booking ունեցավ recommendations shown',
      expectedAction: 'summarize_recommendation_performance',
      rescueReason: 'summarize_recommendation_performance',
      aspect: 'bookings',
      needsMultilingual: true,
    },
    {
      id: 'ru-explain-analytics',
      locale: 'ru',
      prompt: 'Объясни аналитику рекомендаций',
      expectedAction: 'explain_recommendation_analytics',
      rescueReason: 'explain_recommendation_analytics',
      aspect: 'all',
      needsMultilingual: true,
    },
    {
      id: 'ru-impression-count',
      locale: 'ru',
      prompt: 'Сколько показов рекомендаций после checkout',
      expectedAction: 'explain_recommendation_analytics',
      rescueReason: 'explain_recommendation_analytics',
      aspect: 'impressions',
      needsMultilingual: true,
    },
    {
      id: 'ru-shown-clicked-counts',
      locale: 'ru',
      prompt: 'Покажи product_recommendation.shown и clicked counts',
      expectedAction: 'explain_recommendation_analytics',
      rescueReason: 'explain_recommendation_analytics',
      aspect: 'all',
      needsMultilingual: true,
    },
    {
      id: 'ru-clicks-by-surface',
      locale: 'ru',
      prompt: 'Разбей клики рекомендаций по surface',
      expectedAction: 'explain_recommendation_analytics',
      rescueReason: 'explain_recommendation_analytics',
      aspect: 'surfaces',
      needsMultilingual: true,
    },
    {
      id: 'ru-summarize-performance',
      locale: 'ru',
      prompt: 'Сводка эффективности рекомендаций после оплаты',
      expectedAction: 'summarize_recommendation_performance',
      rescueReason: 'summarize_recommendation_performance',
      aspect: 'all',
      needsMultilingual: true,
    },
    {
      id: 'ru-checkout-ctr',
      locale: 'ru',
      prompt: 'Какой CTR у checkout recommendations',
      expectedAction: 'summarize_recommendation_performance',
      rescueReason: 'summarize_recommendation_performance',
      aspect: 'ctr',
      needsMultilingual: true,
    },
    {
      id: 'ru-ctr-by-product',
      locale: 'ru',
      prompt: 'CTR по продуктам для рекомендаций после оплаты',
      expectedAction: 'summarize_recommendation_performance',
      rescueReason: 'summarize_recommendation_performance',
      aspect: 'byProduct',
      needsMultilingual: true,
    },
    {
      id: 'ru-bookings-with-shown',
      locale: 'ru',
      prompt: 'Сколько бронирований с показанными рекомендациями',
      expectedAction: 'summarize_recommendation_performance',
      rescueReason: 'summarize_recommendation_performance',
      aspect: 'bookings',
      needsMultilingual: true,
    },
  ] as const;

export function buildEnglishRecommendationAnalyticsEvalScenarios(): RecommendationAnalyticsEvalScenario[] {
  const analytics = EXPLAIN_RECOMMENDATION_ANALYTICS_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('aspect' in entry && entry.aspect) paramsPartial.aspect = entry.aspect;
    if ('surface' in entry && entry.surface) paramsPartial.surface = entry.surface;
    if ('daysAhead' in entry && entry.daysAhead) {
      paramsPartial.daysAhead = entry.daysAhead;
    }
    return {
      id: `en-analytics-${entry.id}`,
      locale: 'en' as const,
      prompt: entry.prompt,
      expectedAction: 'explain_recommendation_analytics' as const,
      rescueReason: 'explain_recommendation_analytics',
      aspect: entry.aspect,
      ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
    };
  });

  const performance = SUMMARIZE_RECOMMENDATION_PERFORMANCE_PROMPTS.map((entry) => {
    const paramsPartial: Record<string, unknown> = {};
    if ('aspect' in entry && entry.aspect) paramsPartial.aspect = entry.aspect;
    if ('surface' in entry && entry.surface) paramsPartial.surface = entry.surface;
    if ('daysAhead' in entry && entry.daysAhead) {
      paramsPartial.daysAhead = entry.daysAhead;
    }
    return {
      id: `en-performance-${entry.id}`,
      locale: 'en' as const,
      prompt: entry.prompt,
      expectedAction: 'summarize_recommendation_performance' as const,
      rescueReason: 'summarize_recommendation_performance',
      aspect: entry.aspect,
      ...(Object.keys(paramsPartial).length > 0 ? { paramsPartial } : {}),
    };
  });

  return [...analytics, ...performance];
}
