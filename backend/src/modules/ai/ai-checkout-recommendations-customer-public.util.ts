import { CHECKOUT_RECOMMENDATIONS_CLASSIFIER_RULES } from './ai-checkout-recommendations.fixtures.js';
import { EXPLAIN_CHECKOUT_RECOMMENDATIONS_PROMPTS } from './ai-checkout-recommendations.fixtures.js';
import {
  isExplainCheckoutRecommendationsPrompt,
  parseExplainCheckoutRecommendationsFromPrompt,
  rescueExplainCheckoutRecommendationsIntent,
  type CheckoutRecommendationsAspect,
} from './ai-checkout-recommendations.util.js';

export const CUSTOMER_PUBLIC_CHECKOUT_RECOMMENDATIONS_CLASSIFIER_RULES =
  CHECKOUT_RECOMMENDATIONS_CLASSIFIER_RULES;

export type CheckoutRecommendationsCustomerPublicAction =
  'explain_checkout_recommendations';

export type CheckoutRecommendationsCustomerPublicPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: CheckoutRecommendationsCustomerPublicAction;
  rescueReason: 'explain_checkout_recommendations';
  aspect?: CheckoutRecommendationsAspect;
  serviceName?: string;
  productName?: string;
};

export const CHECKOUT_RECOMMENDATIONS_CUSTOMER_PUBLIC_PROMPTS: readonly CheckoutRecommendationsCustomerPublicPromptFixture[] =
  EXPLAIN_CHECKOUT_RECOMMENDATIONS_PROMPTS.map((entry) => ({
    id: entry.id,
    prompt: entry.prompt,
    surface: entry.surface,
    expectedAction: 'explain_checkout_recommendations' as const,
    rescueReason: 'explain_checkout_recommendations' as const,
    ...('aspect' in entry && entry.aspect ? { aspect: entry.aspect } : {}),
    ...('serviceName' in entry && entry.serviceName
      ? { serviceName: entry.serviceName }
      : {}),
  }));

export function rescueCheckoutRecommendationsCustomerPublicIntent(
  prompt: string,
  action: string,
): {
  action: CheckoutRecommendationsCustomerPublicAction;
  rescueReason: string;
} | null {
  const rescued = rescueExplainCheckoutRecommendationsIntent(prompt, action);
  if (!rescued) return null;
  return {
    action: 'explain_checkout_recommendations',
    rescueReason: rescued.rescueReason,
  };
}

export function detectCheckoutRecommendationsCustomerPublicAction(
  prompt: string,
): CheckoutRecommendationsCustomerPublicAction | null {
  return (
    rescueCheckoutRecommendationsCustomerPublicIntent(prompt, 'unknown')
      ?.action ?? null
  );
}

export function enrichCheckoutRecommendationsParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseExplainCheckoutRecommendationsFromPrompt(prompt, params);
  if (!parsed) return params;

  const next = { ...params };
  if (parsed.serviceId && !next.serviceId) next.serviceId = parsed.serviceId;
  if (parsed.serviceName && !next.serviceName) {
    next.serviceName = parsed.serviceName;
  }
  if (parsed.bookingId && !next.bookingId) next.bookingId = parsed.bookingId;
  if (parsed.productName && !next.productName) {
    next.productName = parsed.productName;
  }
  if (parsed.aspect && !next.aspect) next.aspect = parsed.aspect;
  return next;
}

export { isExplainCheckoutRecommendationsPrompt };
