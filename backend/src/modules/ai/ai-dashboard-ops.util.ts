import {
  isTopStaffRevenuePrompt,
  isTotalEarningsPrompt,
  STAFF_ROLE_WORDS,
} from './dashboard-revenue-analytics.util.js';
import { isRevenueForecastPrompt } from './ai-operations.util.js';
import { isMyStatsPrompt } from './ai-provider-exp-2.util.js';
import { isSummarizeMyRevenuePrompt } from './ai-provider-earnings.util.js';
import { isConfigureOnlineBookingPrompt } from './ai-staff-operations.util.js';

/** e2e-bug.137 — browse/filter customer list (not rankings). */
export function isListCustomersPrompt(prompt: string): boolean {
  if (/\b(rank|top\s+\d+|most\s+(?:bookings?|no-?shows?|spend)|vip\s+ranking)\b/i.test(prompt)) {
    return false;
  }
  if (isCustomerRetentionPrompt(prompt)) return false;
  // e2e-bug.138 — membership/subscription lists are list_customer_subscriptions.
  if (/\b(memberships?|subscriptions?|plans?)\b/i.test(prompt)) {
    return false;
  }
  return (
    /\b(list|show|search|browse|find|how many)\b/i.test(prompt) &&
    /\bcustomers?\b/i.test(prompt) &&
    !/\b(inactive|lapsed|re[\s-]?engagement)\b/i.test(prompt)
  );
}

/** e2e-bug.137 — retention / repeat-rate → summarize_customers at_risk segment. */
export function isCustomerRetentionPrompt(prompt: string): boolean {
  return (
    /\b(retention|repeat)\s+rate\b/i.test(prompt) ||
    (/\bretention\b/i.test(prompt) &&
      /\b(customer|clients?|rate|how)\b/i.test(prompt))
  );
}

/** e2e-bug.137 — single customer profile lookup without booking-context phrasing. */
export function isLookupCustomerPrompt(prompt: string): boolean {
  if (isListCustomersPrompt(prompt) || isCustomerRetentionPrompt(prompt)) {
    return false;
  }
  if (
    /\b(anonymize|forget|erase|gdpr|erasure|right\s+to)\b/i.test(prompt) &&
    /\b(customer|profile|pii|data)\b/i.test(prompt)
  ) {
    return false;
  }
  const hasLookupCue =
    /\b(look\s*up|lookup|find|show|profile|tell me about|who is)\b/i.test(
      prompt,
    );
  const hasCustomerCue =
    /\b(customer|client)\b/i.test(prompt) ||
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:'s|’s)\s+(?:profile|history|details)\b/.test(
      prompt,
    );
  return hasLookupCue && hasCustomerCue;
}

export function extractLookupCustomerNameFromPrompt(
  prompt: string,
): string | undefined {
  const patterns = [
    /\b(?:customer|client)\s+(?:profile\s+for\s+|named\s+|for\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    /\b(?:look\s*up|find|show|tell me about)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:'s|’s)\s+(?:profile|history|details)\b/,
  ];
  for (const re of patterns) {
    const m = prompt.match(re);
    if (
      m?.[1] &&
      !/^(Customer|Client|Profile|Service|Provider)$/i.test(m[1])
    ) {
      return m[1].trim();
    }
  }
  return undefined;
}

/** "Summarize customer Maria Lopez who has a booking with Gevorg today at 10:00". */
export function isCustomerBookingContextPrompt(prompt: string): boolean {
  if (isConfigureOnlineBookingPrompt(prompt)) {
    return false;
  }
  const lower = prompt.toLowerCase();
  if (
    /\b(anonymize|forget|erase|gdpr|erasure|right\s+to)\b/i.test(lower) &&
    /\b(customer|profile|pii|data)\b/i.test(lower)
  ) {
    return false;
  }
  if (
    !/\bcustomer\b/i.test(lower) &&
    !/\b(who has|has a booking|booking with|booking on)\b/i.test(lower)
  ) {
    return false;
  }
  return (
    /\b(summarize|summary|profile|tell me about|look up|lookup|who is)\b/i.test(
      lower,
    ) ||
    /\bwho has (?:a )?booking\b/i.test(lower) ||
    /\bhas (?:a )?booking (?:with|on)\b/i.test(lower) ||
    /\bbooking (?:with|on)\b/i.test(lower)
  );
}

export function extractCustomerBookingContextFromPrompt(prompt: string): {
  customerName?: string;
  employeeName?: string;
  timeSlot?: string;
  dateHint?: string;
} {
  const result: {
    customerName?: string;
    employeeName?: string;
    timeSlot?: string;
    dateHint?: string;
  } = {};

  const customerPatterns = [
    /\bcustomer\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)/i,
    /\b(?:summarize|summary|profile|lookup|look up|tell me about)\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)/i,
    /\bwho is\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)/i,
  ];
  for (const re of customerPatterns) {
    const m = prompt.match(re);
    if (m?.[1] && !/^(customer|service|provider|specialist)$/i.test(m[1])) {
      result.customerName = m[1].trim();
      break;
    }
  }

  const providerPatterns = [
    /\b(?:with|on)\s+(?:service\s+)?provider\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)/i,
    /\bbooking (?:with|on)\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)(?=\s+(?:today|tomorrow|at|on)\b|\s*$)/i,
    /\bwith\s+([A-Za-z][\w]+)\s+today\b/i,
  ];
  for (const re of providerPatterns) {
    const m = prompt.match(re);
    if (m?.[1]) {
      result.employeeName = m[1].replace(/\s+(today|tomorrow)$/i, '').trim();
      break;
    }
  }

  const timeMatch =
    prompt.match(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i) ??
    prompt.match(/\b(\d{1,2}:\d{2})\b/);
  if (timeMatch?.[1]) result.timeSlot = timeMatch[1].trim();

  if (/\btoday\b/i.test(prompt)) result.dateHint = 'today';
  else if (/\btomorrow\b/i.test(prompt)) result.dateHint = 'tomorrow';

  return result;
}

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

/** Single named provider revenue — not top-N ranking. */
export function isSingleProviderRevenuePrompt(prompt: string): boolean {
  if (isReportsCurrencyExplainPrompt(prompt)) return false;
  if (isSummarizeMyRevenuePrompt(prompt)) return false;
  if (isMyStatsPrompt(prompt)) return false;
  if (
    isTopStaffRevenuePrompt(prompt) ||
    isTotalEarningsPrompt(prompt) ||
    isRevenueForecastPrompt(prompt)
  ) {
    return false;
  }
  const lower = prompt.toLowerCase();
  const hasRevenue =
    /\b(revenue|earnings?|earned|income|sales|make|made)\b/i.test(lower) ||
    /\bshow\s+revenue\b/i.test(lower) ||
    /\bhow much\b[\s\S]{0,40}\b(make|made|earn(?:ed)?)\b/i.test(lower);
  if (!hasRevenue) return false;

  const hasNamedProvider =
    /\b(?:for|of)\s+[A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?\b/i.test(prompt) ||
    /\b[A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?\s+(?:revenue|earnings?)\b/i.test(
      prompt,
    );

  const genericProvider =
    STAFF_ROLE_WORDS.test(lower) &&
    !/\btop\s+\d+\b/i.test(lower) &&
    !/\bwhich\b/i.test(lower);

  return hasNamedProvider || genericProvider;
}

export function extractSingleProviderNameFromPrompt(
  prompt: string,
): string | undefined {
  const patterns = [
    /\b(?:for|of)\s+(?:service\s+)?provider\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)/i,
    /\b(?:for|of)\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)\s+(?:last|this|today)/i,
    /\bsummarize\s+([A-Za-z][\w]+(?:\s+[A-Za-z][\w]+)?)\s+(?:revenue|earnings?)\b/i,
    /\b([A-Za-z][\w]+)\s+(?:revenue|earnings?)\b/i,
  ];
  for (const re of patterns) {
    const m = prompt.match(re);
    if (
      m?.[1] &&
      !/^(service|provider|service provider|specialist|staff|team|revenue|earnings|summarize|show|list|today|tomorrow)$/i.test(
        m[1],
      )
    ) {
      return m[1]
        .replace(/\s+(last|this|today|tomorrow|week|month)$/i, '')
        .trim();
    }
  }
  return undefined;
}

/** "Show upcoming appointments for Gevorg and Maria" / "all providers". */
export function isUpcomingAppointmentsPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  // e2e-bug.77 — "cancel all my upcoming bookings" is customer bulk-cancel, not
  // dashboard/provider show_appointments.
  if (/\bcancel\b/i.test(lower)) return false;
  return (
    /\bupcoming\b/i.test(lower) &&
    /\b(appointments?|bookings?)\b/i.test(lower) &&
    (/\b(show|list|display|view|see)\b/i.test(lower) ||
      /\bupcoming\s+(?:appointments?|bookings?)\b/i.test(lower))
  );
}

export function extractUpcomingAppointmentScope(prompt: string): {
  allProviders: boolean;
  employeeNames: string[];
} {
  if (
    /\b(all|every)\s+(?:service\s+)?providers?\b/i.test(prompt) ||
    /\bfor all providers?\b/i.test(prompt) ||
    /\bfor\s+some\s+(?:service\s+)?providers?\b/i.test(prompt)
  ) {
    return { allProviders: true, employeeNames: [] };
  }

  const names: string[] = [];
  const forProviders =
    prompt.match(/\bfor\s+(.+?)(?:\s*$|\s+(?:today|this|next|all)\b)/i) ??
    prompt.match(/\bfor\s+(.+)$/i);
  if (forProviders?.[1]) {
    const chunks = forProviders[1].split(/\s*,\s*|\s+and\s+/i);
    for (const chunk of chunks) {
      const trimmed = chunk.trim();
      if (trimmed && !/^(some|all|every|providers?)$/i.test(trimmed))
        names.push(trimmed);
    }
  }

  return { allProviders: names.length === 0, employeeNames: names };
}
