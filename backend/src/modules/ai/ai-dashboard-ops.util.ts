import {
  isTopStaffRevenuePrompt,
  isTotalEarningsPrompt,
  STAFF_ROLE_WORDS,
} from './dashboard-revenue-analytics.util.js';
import { isRevenueForecastPrompt } from './ai-operations.util.js';

/** "Summarize customer Maria Lopez who has a booking with Gevorg today at 10:00". */
export function isCustomerBookingContextPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
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

/** Single named provider revenue — not top-N ranking. */
export function isSingleProviderRevenuePrompt(prompt: string): boolean {
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
