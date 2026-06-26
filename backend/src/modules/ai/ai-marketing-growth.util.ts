import { buildTenantPublicUrl } from '../../common/utils/tenant-public-url.util.js';
import { isSendReengagementPrompt } from './ai-customer-crm.util.js';
import { isConfigureMarketingRegistrationEmailPrompt } from './ai-integrations.util.js';
import { rescueBillingLoyaltyDashboardIntent } from './ai-billing-loyalty-dashboard.util.js';
import { MARKETING_GROWTH_MULTILINGUAL_SCENARIOS } from './ai-marketing-growth-multilingual.fixtures.js';

export const DASHBOARD_MARKETING_GROWTH_MUTATE_INTENTS = [
  'configure_marketing_automation',
  'trigger_reengagement',
  'toggle_annual_billing',
] as const;

export const DASHBOARD_MARKETING_GROWTH_READ_INTENTS = [
  'summarize_automation_performance',
  'list_inactive_customers',
  'explain_plan_limits',
  'suggest_upgrade',
  'summarize_new_registrations',
  'open_billing_settings',
  'summarize_loyalty_program',
] as const;

export const CUSTOMER_MARKETING_GROWTH_INTENTS = [
  'how_to_download_app',
  'switch_to_consumer_app',
  'promo_code_help',
  'loyalty_points_balance',
] as const;

export const MARKETING_GROWTH_INTENTS = [
  ...DASHBOARD_MARKETING_GROWTH_MUTATE_INTENTS,
  ...DASHBOARD_MARKETING_GROWTH_READ_INTENTS,
  ...CUSTOMER_MARKETING_GROWTH_INTENTS,
] as const;

export type MarketingGrowthIntent = (typeof MARKETING_GROWTH_INTENTS)[number];

export interface MarketingGrowthCompoundStep {
  action: MarketingGrowthIntent;
  params: Record<string, unknown>;
  segment: string;
}

const MARKETING_GROWTH_VERB =
  /\b(configure|summarize|trigger|list|explain|suggest|toggle|switch|download|promo|loyalty|automation|re[\s-]?engagement|inactive|plan|billing|registration|annual|upgrade|app|points|consumer)\b/i;

const COMPOUND_NEXT =
  '(?:configure|summarize|trigger|list|explain|suggest|toggle|switch|download|check|promo|loyalty|automation|reengagement|re-engagement|inactive|plan|billing|registration|annual|upgrade|app|points|consumer|marketing|limits|performance|customers)';

const COMPOUND_SPLIT = new RegExp(
  `\\s*;\\s*|\\s+and\\s+(?=${COMPOUND_NEXT}\\b)|\\s+then\\s+(?=${COMPOUND_NEXT}\\b)`,
  'i',
);

export function isMarketingGrowthIntent(
  action: string,
): action is MarketingGrowthIntent {
  return (MARKETING_GROWTH_INTENTS as readonly string[]).includes(action);
}

export function isConfigureMarketingAutomationPrompt(prompt: string): boolean {
  if (isConfigureMarketingRegistrationEmailPrompt(prompt)) return false;
  return (
    /\b(configure|set|update|enable|turn on|adjust)\b/i.test(prompt) &&
    /\b(marketing\s+automation|re[\s-]?engagement|win[\s-]?back\s+automation)\b/i.test(
      prompt,
    )
  );
}

export function isSummarizeAutomationPerformancePrompt(
  prompt: string,
): boolean {
  return (
    /\b(summarize|show|report|how\s+is)\b/i.test(prompt) &&
    /\b(automation\s+performance|marketing\s+automation|re[\s-]?engagement\s+(stats|performance|results))\b/i.test(
      prompt,
    )
  );
}

export function isTriggerReengagementPrompt(prompt: string): boolean {
  if (isSingleCustomerReengagementPrompt(prompt)) return false;
  return (
    /\b(trigger|run|process|start|execute|launch)\b/i.test(prompt) &&
    /\b(re[\s-]?engagement|win[\s-]?back|inactive\s+customers?\s+campaign)\b/i.test(
      prompt,
    )
  );
}

/** Bulk automation — not customerCrm single-customer Zendesk message. */
export function isSingleCustomerReengagementPrompt(prompt: string): boolean {
  if (!isSendReengagementPrompt(prompt)) return false;
  return (
    /\bto\s+[A-Z][a-z]+/i.test(prompt) ||
    /\bcustomer\s+[A-Z][a-z]+/i.test(prompt) ||
    /\b(client|customer)\s+"[^"]+"/i.test(prompt) ||
    /\b(zendesk|ticket|message)\b/i.test(prompt)
  );
}

export function isListInactiveCustomersPrompt(prompt: string): boolean {
  return (
    /\b(list|show|find|who\s+are)\b/i.test(prompt) &&
    /\b(inactive(?:\s+customers?)?|re[\s-]?engagement\s+candidates?|lapsed\s+customers?)\b/i.test(
      prompt,
    )
  );
}

export function isExplainPlanLimitsPrompt(prompt: string): boolean {
  return (
    /\b(explain|what\s+are|show|describe)\b/i.test(prompt) &&
    /\b(plan\s+limits?|entitlements?|subscription\s+limits?|what(?:'s|\s+is)\s+included)\b/i.test(
      prompt,
    )
  );
}

export function isSuggestUpgradePrompt(prompt: string): boolean {
  return (
    /\b(suggest|recommend|should\s+i|need\s+to)\b/i.test(prompt) &&
    /\b(upgrade|higher\s+plan|next\s+tier|more\s+seats|hit\s+(?:the\s+)?limit)\b/i.test(
      prompt,
    )
  );
}

export function isToggleAnnualBillingPrompt(prompt: string): boolean {
  return (
    /\b(switch|toggle|enable|move|change)\b/i.test(prompt) &&
    /\b(annual|yearly)\b/i.test(prompt) &&
    /\b(billing|subscription|plan)\b/i.test(prompt)
  );
}

export function isSummarizeNewRegistrationsPrompt(prompt: string): boolean {
  return (
    /\b(summarize|count|how\s+many|show)\b/i.test(prompt) &&
    /\b(new\s+(?:customer\s+)?registrations?|new\s+customers?\s+(?:signed\s+up|registered))\b/i.test(
      prompt,
    )
  );
}

export function isHowToDownloadAppPrompt(prompt: string): boolean {
  return (
    (/\b(how\s+(?:do\s+i|to)|where\s+(?:can\s+i|do\s+i)|download|get)\b/i.test(
      prompt,
    ) ||
      /(ինչպես|նerbерн|download|get|скач|как)/i.test(prompt)) &&
    (/\b(app|ios|android|iphone|mobile\s+app|consumer\s+app|booking\s+app)\b/i.test(
      prompt,
    ) ||
      /(app|consumer app|booking app|прилож|мобильн|iphone|android)/i.test(
        prompt,
      )) &&
    !isSwitchToConsumerAppPrompt(prompt)
  );
}

export function isSwitchToConsumerAppPrompt(prompt: string): boolean {
  return (
    (/\b(switch|open|use|go\s+to|move\s+to)\b/i.test(prompt) ||
      /(բաց|switch|open|перей|откр|использ)/i.test(prompt)) &&
    (/\b(consumer\s+app|booking\s+app|customer\s+app|mobile\s+app)\b/i.test(
      prompt,
    ) ||
      /(consumer app|booking app|customer app|прилож|mobile app)/i.test(
        prompt,
      ))
  );
}

export function isPromoCodeHelpPrompt(prompt: string): boolean {
  return (
    (/\b(promo\s+codes?|discount\s+codes?|coupons?)\b/i.test(prompt) ||
      /(promo code|discount code|промокод|промо|скидк|купон)/i.test(prompt)) &&
    (/\b(how|work|help|explain|validate|check|apply|use)\b/i.test(prompt) ||
      /(ինչպես|how|work|help|как|работ|примен|использ)/i.test(prompt))
  );
}

export function isLoyaltyPointsBalancePrompt(prompt: string): boolean {
  return (
    (/\b(loyalty|bonus|reward)\b/i.test(prompt) ||
      /(loyalty|bonus|reward|бонус|лояльн|балл)/i.test(prompt)) &&
    (/\b(points?|balance|how\s+many)\b/i.test(prompt) ||
      /(points|balance|балл|очк|point)/i.test(prompt)) &&
    (/\bmy\b/i.test(prompt) ||
      /\b(check|show|what(?:'s|\s+is))\b/i.test(prompt) ||
      /(իմ|my|мои|показ|check|show|tsuyts|ցույց)/i.test(prompt))
  );
}

export function isMarketingGrowthCompoundPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (trimmed.length < 20 || !MARKETING_GROWTH_VERB.test(trimmed)) return false;
  return (
    COMPOUND_SPLIT.test(trimmed) ||
    decomposeMarketingGrowthCompoundPrompt(trimmed).length > 1
  );
}

export function extractPromoCodeFromPrompt(prompt: string): string | null {
  const quoted = prompt.match(/\bcode\s+"([^"]+)"/i);
  if (quoted) return quoted[1].trim();
  const validate = prompt.match(/\bvalidate\s+([A-Z0-9_-]{3,})\b/i);
  if (validate) return validate[1].trim();
  const code = prompt.match(
    /\b(?:promo|discount|coupon)\s+codes?\s+([A-Z0-9_-]{3,})\b/i,
  );
  return code?.[1]?.trim() ?? null;
}

export function extractInactiveDaysFromPrompt(prompt: string): number | null {
  const days = prompt.match(/\b(\d+)\s+days?\b/i);
  return days ? Number(days[1]) : null;
}

export function extractReengagementPromoFromPrompt(
  prompt: string,
): string | null {
  const promo = prompt.match(/\bpromo\s+code\s+([A-Za-z0-9_-]+)\b/i);
  return promo?.[1]?.trim() ?? null;
}

export function extractAutomationToggleFromPrompt(
  prompt: string,
): boolean | null {
  if (/\b(enable|turn on|activate)\b/i.test(prompt)) return true;
  if (/\b(disable|turn off|deactivate)\b/i.test(prompt)) return false;
  return null;
}

export function formatEntitlementsSummary(view: {
  tierName: string;
  tierId: string;
  isPaid: boolean;
  limits: {
    maxProviderSeats: number;
    aiCommandsPerMonth: number;
    flags: Record<string, boolean>;
  };
  usage: { providerSeats: number; aiCommandsThisMonth: number };
  atLimit: { providerSeats: boolean; aiCommands: boolean };
}): string {
  const lines = [
    `Plan: ${view.tierName} (${view.tierId})`,
    `Provider seats: ${view.usage.providerSeats}/${view.limits.maxProviderSeats}${view.atLimit.providerSeats ? ' (at limit)' : ''}`,
    `AI commands this month: ${view.usage.aiCommandsThisMonth}/${view.limits.aiCommandsPerMonth}${view.atLimit.aiCommands ? ' (at limit)' : ''}`,
  ];
  const enabledFlags = Object.entries(view.limits.flags)
    .filter(([, on]) => on)
    .map(([key]) => key);
  lines.push(
    enabledFlags.length
      ? `Included features: ${enabledFlags.join(', ')}`
      : 'Included features: core scheduling only',
  );
  return lines.join('. ');
}

export function buildConsumerAppDownloadGuidance(input: {
  frontendUrl: string;
  iosAppUrl?: string | null;
  androidAppUrl?: string | null;
  businessSlug?: string | null;
}): {
  summary: string;
  iosUrl: string | null;
  androidUrl: string | null;
  pwaUrl: string;
  steps: string[];
} {
  const frontendUrl = input.frontendUrl.replace(/\/$/, '');
  const pwaUrl = input.businessSlug
    ? buildTenantPublicUrl({ slug: input.businessSlug, frontendUrl: input.frontendUrl })
    : frontendUrl;
  const iosUrl = input.iosAppUrl?.trim() || null;
  const androidUrl = input.androidAppUrl?.trim() || null;
  const steps = [
    `Open the booking page in your mobile browser: ${pwaUrl}`,
    'Tap Share (iOS) or Menu (Android) and choose "Add to Home Screen" for a PWA shortcut.',
  ];
  if (iosUrl) steps.unshift(`Install from the App Store: ${iosUrl}`);
  if (androidUrl) steps.unshift(`Install from Google Play: ${androidUrl}`);
  const summary =
    iosUrl || androidUrl
      ? 'Use the native app links below, or add the booking page to your home screen.'
      : 'No native app links are configured — use the mobile web booking page and add it to your home screen.';
  return { summary, iosUrl, androidUrl, pwaUrl, steps };
}

export function buildConsumerAppSwitchGuidance(input: {
  frontendUrl: string;
  businessSlug?: string | null;
}): { summary: string; deepLink: string; steps: string[] } {
  const frontendUrl = input.frontendUrl.replace(/\/$/, '');
  const deepLink = input.businessSlug
    ? buildTenantPublicUrl({ slug: input.businessSlug, frontendUrl: input.frontendUrl })
    : frontendUrl;
  return {
    summary:
      'Open the consumer booking experience to manage appointments and loyalty.',
    deepLink,
    steps: [
      `Open ${deepLink} in your phone browser or home-screen shortcut.`,
      'Sign in with the same email or phone you used when booking.',
      'Use My appointments / My profile for account actions.',
    ],
  };
}

function matchMarketingGrowthMultilingualScenario(
  prompt: string,
): (typeof MARKETING_GROWTH_MULTILINGUAL_SCENARIOS)[number] | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of MARKETING_GROWTH_MULTILINGUAL_SCENARIOS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

/** NL rescue when classifier returns unknown or a nearby action. */
export function rescueMarketingGrowthIntent(
  prompt: string,
  action: string,
): { action: MarketingGrowthIntent; rescueReason: string } | null {
  const billingLoyalty = rescueBillingLoyaltyDashboardIntent(prompt, action);
  if (billingLoyalty) return billingLoyalty;

  if (isMarketingGrowthIntent(action)) return null;
  if (isMarketingGrowthCompoundPrompt(prompt)) return null;
  if (isConfigureMarketingRegistrationEmailPrompt(prompt)) return null;
  if (isSingleCustomerReengagementPrompt(prompt)) return null;

  const multilingualScenario = matchMarketingGrowthMultilingualScenario(prompt);
  if (multilingualScenario) {
    return {
      action: multilingualScenario.expectedAction,
      rescueReason: multilingualScenario.rescueReason,
    };
  }

  if (isLoyaltyPointsBalancePrompt(prompt)) {
    return {
      action: 'loyalty_points_balance',
      rescueReason: 'loyalty_balance',
    };
  }
  if (isPromoCodeHelpPrompt(prompt)) {
    return { action: 'promo_code_help', rescueReason: 'promo_help' };
  }
  if (isSwitchToConsumerAppPrompt(prompt)) {
    return { action: 'switch_to_consumer_app', rescueReason: 'switch_app' };
  }
  if (isHowToDownloadAppPrompt(prompt)) {
    return { action: 'how_to_download_app', rescueReason: 'download_app' };
  }

  if (isToggleAnnualBillingPrompt(prompt)) {
    return { action: 'toggle_annual_billing', rescueReason: 'annual_billing' };
  }
  if (isSuggestUpgradePrompt(prompt)) {
    return { action: 'suggest_upgrade', rescueReason: 'suggest_upgrade' };
  }
  if (isExplainPlanLimitsPrompt(prompt)) {
    return { action: 'explain_plan_limits', rescueReason: 'plan_limits' };
  }
  if (isSummarizeNewRegistrationsPrompt(prompt)) {
    return {
      action: 'summarize_new_registrations',
      rescueReason: 'new_registrations',
    };
  }
  if (isTriggerReengagementPrompt(prompt)) {
    return {
      action: 'trigger_reengagement',
      rescueReason: 'trigger_reengagement',
    };
  }
  if (isListInactiveCustomersPrompt(prompt)) {
    return {
      action: 'list_inactive_customers',
      rescueReason: 'inactive_customers',
    };
  }
  if (isSummarizeAutomationPerformancePrompt(prompt)) {
    return {
      action: 'summarize_automation_performance',
      rescueReason: 'automation_summary',
    };
  }
  if (isConfigureMarketingAutomationPrompt(prompt)) {
    return {
      action: 'configure_marketing_automation',
      rescueReason: 'configure_automation',
    };
  }

  return null;
}

function classifyMarketingGrowthSegment(
  segment: string,
): MarketingGrowthCompoundStep | null {
  const text = segment.trim();
  if (!text) return null;

  const base: Record<string, unknown> = {};
  const promoCode = extractPromoCodeFromPrompt(text);
  if (promoCode) base.promoCode = promoCode;
  const inactiveDays = extractInactiveDaysFromPrompt(text);
  if (inactiveDays !== null) base.inactiveDaysThreshold = inactiveDays;
  const rePromo = extractReengagementPromoFromPrompt(text);
  if (rePromo) base.reEngagementPromoCode = rePromo;
  const toggle = extractAutomationToggleFromPrompt(text);
  if (toggle !== null) base.reEngagementEnabled = toggle;
  if (/\bthis\s+month\b/i.test(text)) base.dateRange = 'this_month';
  if (/\bthis\s+week\b/i.test(text)) base.dateRange = 'this_week';

  if (isConfigureMarketingAutomationPrompt(text)) {
    if (
      base.reEngagementEnabled === undefined &&
      /\bre[\s-]?engagement\b/i.test(text)
    ) {
      base.reEngagementEnabled = true;
    }
    return {
      action: 'configure_marketing_automation',
      params: base,
      segment: text,
    };
  }
  if (isSummarizeAutomationPerformancePrompt(text)) {
    return {
      action: 'summarize_automation_performance',
      params: base,
      segment: text,
    };
  }
  if (isTriggerReengagementPrompt(text)) {
    return { action: 'trigger_reengagement', params: base, segment: text };
  }
  if (isListInactiveCustomersPrompt(text)) {
    return { action: 'list_inactive_customers', params: base, segment: text };
  }
  if (isExplainPlanLimitsPrompt(text)) {
    return { action: 'explain_plan_limits', params: base, segment: text };
  }
  if (isSuggestUpgradePrompt(text)) {
    return { action: 'suggest_upgrade', params: base, segment: text };
  }
  if (isToggleAnnualBillingPrompt(text)) {
    return { action: 'toggle_annual_billing', params: base, segment: text };
  }
  if (isSummarizeNewRegistrationsPrompt(text)) {
    return {
      action: 'summarize_new_registrations',
      params: base,
      segment: text,
    };
  }
  if (isHowToDownloadAppPrompt(text)) {
    return { action: 'how_to_download_app', params: base, segment: text };
  }
  if (isSwitchToConsumerAppPrompt(text)) {
    return { action: 'switch_to_consumer_app', params: base, segment: text };
  }
  if (isPromoCodeHelpPrompt(text)) {
    return { action: 'promo_code_help', params: base, segment: text };
  }
  if (isLoyaltyPointsBalancePrompt(text)) {
    return { action: 'loyalty_points_balance', params: base, segment: text };
  }
  return null;
}

/** Deterministic multi-command split for marketing, growth, and billing operations. */
export function decomposeMarketingGrowthCompoundPrompt(
  prompt: string,
): MarketingGrowthCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed) return [];

  const segments = trimmed.split(COMPOUND_SPLIT).map((s) => s.trim());
  const nonEmpty = segments.filter(Boolean);

  if (nonEmpty.length <= 1) {
    const single = classifyMarketingGrowthSegment(trimmed);
    return single ? [single] : [];
  }

  const steps: MarketingGrowthCompoundStep[] = [];
  for (const segment of segments) {
    const step = classifyMarketingGrowthSegment(segment);
    if (step) steps.push(step);
  }
  return steps;
}
