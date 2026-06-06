import { isExplainRecommendationSetupPrompt } from './ai-recommendation-product.util.js';
import {
  hasConsumerAppContext,
  isExplainConsumerCheckoutSuccessPrompt,
} from './ai-consumer-checkout-success.util.js';
import { isExplainRecommendationAnalyticsPrompt } from './ai-recommendation-analytics.util.js';
import { isExplainTenantCurrencyPrompt } from './ai-tenant-currency.util.js';

export const CHECKOUT_RECOMMENDATIONS_INTENTS = [
  'explain_checkout_recommendations',
] as const;

export type CheckoutRecommendationsIntent =
  (typeof CHECKOUT_RECOMMENDATIONS_INTENTS)[number];

export type CheckoutRecommendationsAspect =
  | 'products'
  | 'whyShown'
  | 'shopLink'
  | 'maxCount'
  | 'all';

export interface ParsedExplainCheckoutRecommendations {
  serviceId?: string;
  serviceName?: string;
  bookingId?: string;
  productName?: string;
  aspect: CheckoutRecommendationsAspect;
}

export function isCheckoutRecommendationsIntent(
  action: string,
): action is CheckoutRecommendationsIntent {
  return (CHECKOUT_RECOMMENDATIONS_INTENTS as readonly string[]).includes(action);
}

export function hasCheckoutSuccessVisitorContext(prompt: string): boolean {
  return (
    /\byou\s+might\s+also\s+like\b/i.test(prompt) ||
    /\b(?:booking\s+)?(?:success|confirmation)\s+(?:screen|page)\b/i.test(
      prompt,
    ) ||
    /\bafter\s+(?:i\s+)?booked\b/i.test(prompt) ||
    /\bafter\s+(?:my\s+)?(?:booking|appointment)\s+is\s+confirmed\b/i.test(
      prompt,
    ) ||
    /\bpost[- ]?booking\s+product\b/i.test(prompt) ||
    /\bconsumer\s+app\s+success\b/i.test(prompt) ||
    /\bjust\s+booked\b/i.test(prompt) ||
    /\bproduct\s+cards?\s+(?:on|after)\b/i.test(prompt) ||
    /\bafter\s+(?:i\s+)?(?:confirm|booked)\b/i.test(prompt) ||
    /\bon\s+checkout\s+success\b/i.test(prompt) ||
    /\bafter\s+booking\s+in\s+the\s+app\b/i.test(prompt)
  );
}

function hasReadCheckoutRecommendationsCue(prompt: string): boolean {
  return (
    /\b(what|which|why|how|explain|show|describe|mean|does|do|are|can)\b/i.test(
      prompt,
    ) ||
    /\?\s*$/.test(prompt.trim())
  );
}

function hasCheckoutRecommendationsTopic(prompt: string): boolean {
  return (
    /\byou\s+might\s+also\s+like\b/i.test(prompt) ||
    /\b(?:recommended|suggested)\s+products?\b/i.test(prompt) ||
    /\bproduct\s+recommendations?\b/i.test(prompt) ||
    /\bproduct\s+(?:cards?|suggestions?|recommendations?)\b/i.test(prompt) ||
    /\bproducts?\s+show(?:\s+up)?\b/i.test(prompt) ||
    /\b(?:shop|external)\s+links?\b/i.test(prompt) ||
    /\brecommendation\s+card\b/i.test(prompt) ||
    /\bpost[- ]?booking\s+(?:product|recommendation)/i.test(prompt) ||
    /\bafter\s+(?:checkout|booking|i\s+booked|my\s+haircut|my\s+)/i.test(
      prompt,
    ) ||
    /\brecommended\s+here\b/i.test(prompt) ||
    /\bconfirmation\s+screen\b/i.test(prompt) ||
    /\bcheckout\s+success\b/i.test(prompt) ||
    /\bsuccess\s+screen\b/i.test(prompt) ||
    /\bfrom\s+my\s+booked\b/i.test(prompt)
  );
}

function isAdminRecommendationSetupVoice(prompt: string): boolean {
  if (!isExplainRecommendationSetupPrompt(prompt)) return false;
  return !hasCheckoutSuccessVisitorContext(prompt);
}

function isProviderRetailUpsellPrompt(prompt: string): boolean {
  return (
    /\b(?:suggest|recommend)\s+retail\s+upsell\b/i.test(prompt) ||
    /\bchair[- ]?side\s+upsell\b/i.test(prompt) ||
    /\bprovider\s+app\b/i.test(prompt)
  );
}

function extractAspect(prompt: string): CheckoutRecommendationsAspect {
  if (
    /\b(?:shop|external)\s+links?\b/i.test(prompt) ||
    /\bwhat\s+(?:is|does)\s+the\s+(?:shop|external)\s+link\b/i.test(prompt)
  ) {
    return 'shopLink';
  }
  if (
    /\bhow\s+many\s+products?\b/i.test(prompt) ||
    /\bmax(?:imum)?\s+(?:product|card)\s+count\b/i.test(prompt)
  ) {
    return 'maxCount';
  }
  if (
    /\bwhy\b.+\b(?:seeing|show|appear|recommended|chosen|suggestions?)\b/i.test(
      prompt,
    ) ||
    /\bhow\s+were\b.+\b(?:chosen|picked|selected)\b/i.test(prompt) ||
    /\bfrom\s+my\s+booked\b/i.test(prompt) ||
    /\bwhy\s+don'?t\s+i\s+see\b/i.test(prompt)
  ) {
    return 'whyShown';
  }
  if (
    /\bwhat\s+are\b.+\b(?:products?|cards?|recommendations?)\b/i.test(prompt) ||
    /\bwhat\s+products?\s+show\b/i.test(prompt)
  ) {
    return 'products';
  }
  return 'all';
}

function extractServiceName(prompt: string): string | undefined {
  const patterns = [
    /\brecommended\s+here\s+after\s+my\s+([A-Za-z][\w\s'-]+)\b/i,
    /\bafter\s+my\s+([A-Za-z][\w\s'-]+?)\s+(?:booking|service|appointment)\b/i,
    /\bafter\s+my\s+([A-Za-z][\w\s'-]+)\b/i,
    /\bafter\s+(?:the\s+)?([A-Za-z][\w\s'-]+?)\s+service\b/i,
    /\bfrom\s+my\s+booked\s+([A-Za-z][\w\s'-]+?)\s+service\b/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

export function isExplainCheckoutRecommendationsPrompt(prompt: string): boolean {
  if (isExplainTenantCurrencyPrompt(prompt)) return false;
  if (isExplainRecommendationAnalyticsPrompt(prompt)) return false;
  if (isExplainConsumerCheckoutSuccessPrompt(prompt)) return false;
  if (
    /\b(?:dismiss|hide|close)\b/i.test(prompt) &&
    /\b(?:recommendations?|you might also like|product cards?|close button|x button)\b/i.test(
      prompt,
    ) &&
    hasConsumerAppContext(prompt)
  ) {
    return false;
  }
  if (isAdminRecommendationSetupVoice(prompt)) return false;
  if (isProviderRetailUpsellPrompt(prompt)) return false;
  if (!hasReadCheckoutRecommendationsCue(prompt)) return false;
  if (!hasCheckoutRecommendationsTopic(prompt)) return false;
  if (
    !hasCheckoutSuccessVisitorContext(prompt) &&
    !/\bafter\s+(?:checkout|booking|my\s+)/i.test(prompt) &&
    !/\b(?:recommended|suggested)\s+products?\b/i.test(prompt) &&
    !/\bproduct\s+recommendations?\b/i.test(prompt) &&
    !/\b(?:shop|external)\s+links?\b/i.test(prompt) &&
    !/\brecommendation\s+card\b/i.test(prompt) &&
    !/\bfrom\s+my\s+booked\b/i.test(prompt)
  ) {
    return false;
  }
  return true;
}

export function parseExplainCheckoutRecommendationsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainCheckoutRecommendations | null {
  if (!isExplainCheckoutRecommendationsPrompt(prompt)) return null;

  const serviceId =
    typeof params.serviceId === 'string' ? params.serviceId.trim() : undefined;
  const bookingId =
    typeof params.bookingId === 'string' ? params.bookingId.trim() : undefined;
  const serviceName =
    (typeof params.serviceName === 'string'
      ? params.serviceName.trim()
      : undefined) ?? extractServiceName(prompt);
  const productName =
    typeof params.productName === 'string'
      ? params.productName.trim()
      : undefined;
  const aspectFromParams =
    typeof params.aspect === 'string' ? params.aspect.trim() : undefined;
  const aspect =
    aspectFromParams &&
    ['products', 'whyShown', 'shopLink', 'maxCount', 'all'].includes(
      aspectFromParams,
    )
      ? (aspectFromParams as CheckoutRecommendationsAspect)
      : extractAspect(prompt);

  return {
    serviceId,
    serviceName,
    bookingId,
    productName,
    aspect,
  };
}

export function rescueExplainCheckoutRecommendationsIntent(
  prompt: string,
  action: string,
): { action: CheckoutRecommendationsIntent; rescueReason: string } | null {
  if (isCheckoutRecommendationsIntent(action)) return null;
  if (!isExplainCheckoutRecommendationsPrompt(prompt)) return null;
  return {
    action: 'explain_checkout_recommendations',
    rescueReason: 'explain_checkout_recommendations',
  };
}
