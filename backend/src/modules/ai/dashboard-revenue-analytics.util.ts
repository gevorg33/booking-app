import { isSummarizeMyRevenuePrompt } from './ai-provider-earnings.util.js';
import { isMyStatsPrompt } from './ai-provider-exp-2.util.js';

export const STAFF_ROLE_WORDS =
  /\b(staff|provider|providers|employee|employees|team|specialist|specialists|stylist|stylists|therapist|therapists)\b/i;

function isReportsCurrencyExplainPrompt(prompt: string): boolean {
  const hasReportsSurface =
    /\b(reports?|analytics|dashboard\s+overview|operations|p\s*&\s*l|profit\s+(and|&)\s+loss|kpi|kpis)\b/i.test(
      prompt,
    ) ||
    /\b(staff\s+(?:performance|revenue)|service\s+(?:popularity|revenue)|revenue\s+this\s+month|net\s+profit|gross\s+revenue)\b/i.test(
      prompt,
    );

  return (
    hasReportsSurface &&
    /\b(why|explain|what\s+currency|which\s+currency|convert|conversion|fx|currency)\b/i.test(
      prompt,
    )
  );
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

/** Dashboard: total business earnings/revenue for a period (not per-provider rankings). */
export function isTotalEarningsPrompt(prompt: string): boolean {
  if (isReportsCurrencyExplainPrompt(prompt)) return false;
  if (isTopStaffRevenuePrompt(prompt)) return false;
  if (isSummarizeMyRevenuePrompt(prompt)) return false;
  if (isMyStatsPrompt(prompt)) return false;
  if (
    /\b(?:for|of)\s+(?!today|tomorrow|yesterday|this|last|the\b|week|month|year)([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (STAFF_ROLE_WORDS.test(prompt) && !/\btotal\b/i.test(prompt)) return false;
  const lower = prompt.toLowerCase();
  return (
    isDashboardTotalEarningsPromptHyRu(prompt) ||
    /\b(calculate|compute|what(?:'s| is)|show|tell me|get)\b[\s\S]{0,50}\b(total\s+)?(earnings?|revenue|sales|income)\b/i.test(
      lower,
    ) ||
    /\b(how much)\b[\s\S]{0,40}\b(earn(?:ed)?|made|brought in|revenue|sales|income)\b/i.test(
      lower,
    ) ||
    /\btotal\s+(earnings?|revenue|sales|income)\b/i.test(lower) ||
    /\btotal\b[\s\S]{0,24}\b(revenue|earnings?|sales|income)\b/i.test(lower)
  );
}

export function isDashboardTotalEarningsPromptHyRu(prompt: string): boolean {
  if (isTopStaffRevenuePrompt(prompt)) return false;
  if (isSummarizeMyRevenuePrompt(prompt)) return false;
  if (isMyStatsPrompt(prompt)) return false;

  if (containsArmenianScript(prompt)) {
    return /(ընդհանուր\s+եկամուտ|օրվա\s+եկամուտ|ամսվա\s+եկամուտ)/i.test(prompt);
  }

  if (containsCyrillicScript(prompt)) {
    return (
      /сколько\s+мы\s+заработали/i.test(prompt) ||
      /общая\s+выручк/i.test(prompt) ||
      /итого\s+(выручк|доход)/i.test(prompt)
    );
  }

  return false;
}

function isCustomerRecommendSpecialistsPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(best|top|highest|highly)\s+(rated|rating|reviewed|reviews?)\b/i.test(
      lower,
    ) ||
    /\b(rated|rating|reviews?)\s+(best|top|highest)\b/i.test(lower) ||
    /\b(suggest|recommend)\b[\s\S]{0,40}\b(specialists?|providers?|therapists?|stylists?|masseurs?|doctors?)\b/i.test(
      lower,
    ) ||
    /\bwho\s+(is|are)\s+(the\s+)?(best|top|highest)\b/i.test(lower) ||
    /\bbest\s+(specialists?|providers?|therapists?|stylists?)\b/i.test(lower)
  );
}

/** Dashboard: rank specialists/providers by revenue for a period (supports top N). */
export function isTopStaffRevenuePrompt(prompt: string): boolean {
  if (isCustomerRecommendSpecialistsPrompt(prompt)) return false;
  const lower = prompt.toLowerCase();
  const hasRevenue =
    /\b(revenue|earnings?|earned|sales|income|made the most|brought in|top earner|highest earner)\b/i.test(
      lower,
    );
  const hasStaffRole = STAFF_ROLE_WORDS.test(lower);
  const topRanking =
    /\b(top\s+\d+|which\s+(?:specialist|provider|stylist|therapist)|who\s+(?:earned|made|brought in)|most\s+revenue|highest\s+revenue|best\s+performing)\b/i.test(
      lower,
    );
  return (
    hasRevenue && (topRanking || (hasStaffRole && /\branking\b/i.test(lower)))
  );
}
