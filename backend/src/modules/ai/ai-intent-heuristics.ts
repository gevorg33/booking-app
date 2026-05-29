import { todayDisplay, formatDateDisplay, applyRelativeDateFromPrompt, getTodayDateKey } from '../../common/utils/date-format.util.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';
import {
  extractSingleDateFromPrompt,
  fuzzyMatchServiceByName,
  normalizeServiceLookup,
  resolveDateRange,
} from './ai-orchestration.helpers.js';
import { normalizeMultilingualPrompt } from './ai-prompt-i18n.js';
import type { CustomerInsightMetric } from '../customer/customer.service.js';

export type ServiceInsightMetric = 'most_booked' | 'top_revenue' | 'least_booked' | 'overview';
export type StaffInsightMetric = 'busiest' | 'most_revenue' | 'most_bookings' | 'overview';
export type ServiceAssignmentLookup = 'providers_for_service' | 'services_for_provider';

export interface HeuristicIntent {
  action: string;
  params: Record<string, any>;
  reasoning: string;
  confidence: number;
}

export interface HeuristicDetectionInput {
  prompt: string;
  sessionContext?: Record<string, any>;
  timeZone?: string;
  employees: Array<{ id: string; name: string; serviceIds?: string[] | null }>;
  customers?: Array<{ id: string; name: string }>;
  services?: Array<{ id: string; name: string }>;
  templates?: Array<{ id: string; name: string }>;
}

const BOOKING_STATUS_ALIASES: Record<string, string> = {
  cancelled: 'cancelled',
  canceled: 'cancelled',
  'no-show': 'no_show',
  no_show: 'no_show',
  noshow: 'no_show',
  done: 'completed',
  finished: 'completed',
  confirmed: 'confirmed',
  pending: 'pending',
  completed: 'completed',
  'in-progress': 'in_progress',
  in_progress: 'in_progress',
};

export function inheritSessionParams(
  sessionContext: Record<string, any> | undefined,
  keys: string[],
): Record<string, any> {
  const params: Record<string, any> = {};
  if (!sessionContext) return params;
  for (const key of keys) {
    if (sessionContext[key] != null && sessionContext[key] !== '') {
      params[key] = sessionContext[key];
    }
  }
  return params;
}

export function extractLimitFromPrompt(prompt: string, defaultLimit = 5): number {
  const topMatch = prompt.match(/\btop\s+(\d{1,2})\b/i);
  if (topMatch) return Math.min(parseInt(topMatch[1], 10), 20);
  const firstMatch = prompt.match(/\b(\d{1,2})\s+(top|best|highest)\b/i);
  if (firstMatch) return Math.min(parseInt(firstMatch[1], 10), 20);
  return defaultLimit;
}

export function extractStatusFilterFromPrompt(prompt: string): string | null {
  const filters = extractStatusFiltersFromPrompt(prompt);
  return filters.length === 1 ? filters[0] : filters[0] ?? null;
}

export function extractStatusFiltersFromPrompt(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const found = new Set<string>();
  for (const [alias, status] of Object.entries(BOOKING_STATUS_ALIASES)) {
    if (new RegExp(`\\b${alias.replace(/[-_]/g, '[\\s-_]?')}\\b`, 'i').test(lower)) {
      found.add(status);
    }
  }
  return [...found];
}

export function extractHideLimitFromPrompt(prompt: string): number | null {
  const lower = prompt.toLowerCase();
  if (/\b(one|single|a)\s+(appointment|booking)\b/i.test(lower)) return 1;
  const countMatch = lower.match(
    /\b(?:hide|remove|clear|delete)\s+(\d{1,2})\s+(?:appointment|booking)/i,
  );
  if (countMatch) return Math.min(parseInt(countMatch[1], 10), 50);
  return null;
}

export function extractTimeSlotFromPrompt(prompt: string): string | null {
  const at24 = prompt.match(/\b(?:at|@)\s*(\d{1,2}):(\d{2})\b/i);
  if (at24) return normalizeTime24(`${at24[1]}:${at24[2]}`);

  const bare24 = prompt.match(/\b(\d{1,2}):(\d{2})\b/);
  if (bare24) return normalizeTime24(`${bare24[1]}:${bare24[2]}`);

  const pm = prompt.match(/\b(?:at\s+)?(\d{1,2})\s*(?:pm|p\.m\.)\b/i);
  if (pm) {
    const h = parseInt(pm[1], 10);
    return normalizeTime24(`${h === 12 ? 12 : h + 12}:00`);
  }
  const am = prompt.match(/\b(?:at\s+)?(\d{1,2})\s*(?:am|a\.m\.)\b/i);
  if (am) {
    const h = parseInt(am[1], 10);
    return normalizeTime24(`${h === 12 ? 0 : h}:00`);
  }

  const atHourOnly = prompt.match(/\b(?:at|@)\s*(\d{1,2})\b(?!\s*:\d)/i);
  if (atHourOnly) {
    const h = parseInt(atHourOnly[1], 10);
    if (h >= 0 && h <= 23) return normalizeTime24(`${h}:00`);
  }

  return null;
}

/** New time from "move ... to 16:00" / "reschedule to 18:00". */
export function extractRescheduleTimeSlotFromPrompt(prompt: string): string | null {
  const toAt = prompt.match(/\bto\s+(?:at\s+)?(\d{1,2}):(\d{2})\b/i);
  if (toAt) return normalizeTime24(`${toAt[1]}:${toAt[2]}`);

  const toAtHour = prompt.match(/\bto\s+(?:at\s+)?(\d{1,2})\b(?!\s*:\d)/i);
  if (toAtHour) {
    const h = parseInt(toAtHour[1], 10);
    if (h >= 0 && h <= 23) return normalizeTime24(`${h}:00`);
  }

  return null;
}

/** Existing appointment time from "Maria's 14:00 appointment" before a move. */
export function extractFromTimeSlotFromReschedulePrompt(prompt: string): string | null {
  const possessive = prompt.match(/(?:'s|s)\s+(\d{1,2}):(\d{2})\s+(?:appointment|booking)/i);
  if (possessive) return normalizeTime24(`${possessive[1]}:${possessive[2]}`);

  const beforeAppt = prompt.match(/\b(\d{1,2}):(\d{2})\s+(?:appointment|booking)\s+to\b/i);
  if (beforeAppt) return normalizeTime24(`${beforeAppt[1]}:${beforeAppt[2]}`);

  return null;
}

function matchServiceByNameFragment(
  fragment: string,
  services: Array<{ id: string; name: string }>,
): { id: string; name: string } | undefined {
  return fuzzyMatchServiceByName(services, fragment);
}

function matchServiceInPrompt(
  prompt: string,
  services: Array<{ id: string; name: string }>,
): { id: string; name: string } | undefined {
  const lower = prompt.toLowerCase();
  const normalizedPrompt = normalizeServiceLookup(lower);

  let best: { id: string; name: string } | undefined;
  let bestLen = 0;
  for (const service of services) {
    if (lower.includes(service.name.toLowerCase()) && service.name.length > bestLen) {
      best = service;
      bestLen = service.name.length;
      continue;
    }
    const normalizedName = normalizeServiceLookup(service.name);
    if (
      normalizedName.length >= 4 &&
      normalizedPrompt.includes(normalizedName) &&
      normalizedName.length > bestLen
    ) {
      best = service;
      bestLen = normalizedName.length;
    }
  }
  if (best) return best;

  const whoCanPatterns = [
    /\bwho\s+can\s+(?:do|give|perform|provide|offer)?\s*(?:a\s+|an\s+)?([a-z][a-z\s-]+?)(?:\s+today|\s+tomorrow|\s+this|\s+on\b|\s+at\b|\?|$)/i,
    /\bwho(?:'s|\s+is|\s+are)\s+(?:doing|performing|giving|offering|providing)\s+(?:a\s+|an\s+)?([a-z][a-z\s-]+?)(?:\s+today|\s+tomorrow|\s+this|\s+on\b|\s+at\b|\?|$)/i,
    /\b(?:free|available|open)\s+(?:slot|time)s?\s+for\s+(?:a\s+|an\s+)?([a-z][a-z\s-]+?)(?:\s+today|\s+tomorrow|\s+this|\s+on\b|\?|$)/i,
  ];
  for (const re of whoCanPatterns) {
    const match = lower.match(re);
    if (match?.[1]) {
      const svc = fuzzyMatchServiceByName(services, match[1].trim());
      if (svc) return svc;
    }
  }

  const phraseMatch = lower.match(
    /\b(?:give|do|perform|provide|offer|for)\s+(?:a\s+|an\s+)?([a-z][a-z\s-]+?)(?:\s+today|\s+tomorrow|\s+at\b|\s+on\b|\?|$)/i,
  );
  if (phraseMatch?.[1]) {
    return fuzzyMatchServiceByName(services, phraseMatch[1].trim());
  }

  return undefined;
}

/** Exported for post-LLM prompt entity override (prompt beats session). */
export function extractServiceFromPrompt(
  prompt: string,
  services: Array<{ id: string; name: string }>,
): { id: string; name: string } | undefined {
  return matchServiceInPrompt(prompt, services);
}

/** Team-wide provider availability — do not inherit a single provider from session. */
export function isTeamWideProviderAvailabilityQuery(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    isWhoHasFreeSlotForServiceQuery(lower) ||
    isWhoIsDoingServiceQuery(lower) ||
    /\bwho\s+can\s+(?:do|give|perform|provide|offer)\b/i.test(lower) ||
    /\bwho\s+(?:is|are)\s+(?:available|free|open)\b/i.test(lower)
  );
}

function isProviderAvailabilityQuery(lower: string): boolean {
  return (
    /\b(is|are)\s+.+\s+available\b/i.test(lower) ||
    /\bavailable\s+to\s+(give|do|perform|provide|offer)\b/i.test(lower) ||
    /\bcan\s+.+\s+(give|do|perform|provide|offer)\b/i.test(lower) ||
    /\b(does|do|will|would)\s+.+\s+(do|give|perform|provide|offer)\b/i.test(lower)
  );
}

const MUTATING_ACTIONS = new Set([
  'create_booking',
  'create_service',
  'create_services',
  'cancel_bookings',
  'bulk_smart_cancel',
  'hide_appointments_from_calendar',
  'unhide_appointments_from_calendar',
  'fill_slot_from_waitlist',
  'reschedule_booking',
  'fill_unused_slots',
  'apply_schedule',
  'block_schedule',
  'setup_week_schedule',
]);

/** Explicit booking/cancel verbs — required before heuristic mutating actions run. */
export function isExplicitMutationRequest(lower: string): boolean {
  return (
    /\b(book|reserve|set up an appointment|make an appointment|add an appointment|schedule an appointment|schedule a)\b/i.test(
      lower,
    ) ||
    /\b(cancel|hide|unhide|restore|block|fill those|fill them|apply template)\b/i.test(lower)
  );
}

function isLikelyReadOnlyQuestion(prompt: string): boolean {
  const lower = prompt.toLowerCase().trim();
  if (lower.endsWith('?')) return true;
  return /^(does|do|is|are|can|could|will|would|who|what|when|where|which|how)\b/i.test(lower);
}

/** When heuristics guess a mutation on a question without explicit verbs, prefer LLM classification. */
export function shouldPreferLlmOverHeuristic(
  result: HeuristicIntent | null,
  prompt: string,
): boolean {
  if (!result) return false;

  const lower = prompt.toLowerCase();

  // Natural-language availability / provider lookup — LLM handles wording variations better.
  if (
    result.action === 'lookup_service_assignment' ||
    result.action === 'check_availability' ||
    result.action === 'summarize_customers' ||
    result.action === 'summarize_bookings' ||
    result.action === 'analyze_appointments' ||
    result.action === 'analyze_services' ||
    result.action === 'summarize_staff'
  ) {
    return true;
  }

  if (!MUTATING_ACTIONS.has(result.action)) return false;

  if (isProviderAvailabilityQuery(lower) || isLikelyReadOnlyQuestion(prompt)) {
    return !isExplicitMutationRequest(lower);
  }

  if (!isExplicitMutationRequest(lower)) return true;
  return false;
}

function isWhoHasFreeSlotForServiceQuery(lower: string): boolean {
  return (
    (/\bwho\s+(is|has|are)\s+(?:a\s+)?(?:free|available|open)\b/i.test(lower) ||
      /\bwho\s+has\s+(?:a\s+)?(?:free|open|available)\s+(?:slot|time)/i.test(lower) ||
      /\b(free|available|open)\s+(?:slot|time)s?\s+for\b/i.test(lower)) &&
    !/\b(which|what)\s+(exact\s+)?days?\b/i.test(lower)
  );
}

/** "Who is doing facemassage today" — scheduled service blocks with open time, not catalog assignment. */
function isWhoIsDoingServiceQuery(lower: string): boolean {
  return (
    /\bwho(?:'s|\s+is|\s+are)\s+(?:doing|performing|giving|offering|providing)\b/i.test(
      lower,
    ) ||
    /\bwho\s+is\s+(?:on|scheduled\s+(?:for|to\s+do))\b/i.test(lower)
  );
}

/** Target service from "change service to X" / "switch to X" — not a time like 16:00. */
export function extractNewServiceNameFromChangePrompt(
  prompt: string,
  services?: Array<{ id: string; name: string }>,
): string | null {
  const patterns = [
    /\b(?:change|switch|update|replace|convert)\s+(?:the\s+)?(?:service(?:\s+type)?|appointment(?:\s+service)?)\s+(?:to|into)\s+(.+?)(?:\s+and\b|\s+on\b|\s+at\b|\s+for\b|\s+tomorrow\b|\s+today\b|$)/i,
    /\b(?:change|switch|update)\s+.+'s\s+(?:appointment|booking)\s+(?:to|into)\s+(.+?)(?:\s+and\b|\s+at\b|\s+on\b|$)/i,
    /\bswitch\s+to\s+(.+?)(?:\s+and\b|\s+move\b|\s+at\b|\s+on\b|\s+tomorrow\b|\s+today\b|$)/i,
  ];

  for (const re of patterns) {
    const match = prompt.match(re);
    if (!match?.[1]) continue;
    const raw = match[1].trim().replace(/\s+(only|instead)$/i, '');
    if (!raw || extractTimeSlotFromPrompt(raw)) continue;
    if (services?.length) {
      const svc = matchServiceByNameFragment(raw, services);
      if (svc) return svc.name;
    }
    return raw;
  }

  return null;
}

export function matchEntityInPrompt<T extends { name: string }>(
  prompt: string,
  items: T[],
): T | undefined {
  const lower = prompt.toLowerCase();
  for (const item of items) {
    if (lower.includes(item.name.toLowerCase())) return item;
    const first = item.name.split(/\s+/)[0];
    if (first.length >= 3 && new RegExp(`\\b${first.toLowerCase()}\\b`).test(lower)) {
      return item;
    }
  }
  return undefined;
}

/** Apply dates, entities, and common flags from prompt onto params. */
export function enrichParamsFromPrompt(
  params: Record<string, any>,
  input: HeuristicDetectionInput,
): void {
  const { prompt, sessionContext, employees, customers, services, templates } = input;
  const lower = prompt.toLowerCase();
  const timeZone = input.timeZone ?? sessionContext?.timeZone ?? 'UTC';

  const range = resolveDateRange(params, prompt, timeZone);
  if (range) {
    if (!params.dateFrom) params.dateFrom = formatDateDisplay(range.start);
    if (!params.dateTo) params.dateTo = formatDateDisplay(range.end);
    if (range.start === range.end && !params.date) {
      params.date = formatDateDisplay(range.start);
    }
  } else {
    applyRelativeDateFromPrompt(params, prompt, timeZone);
    if (!params.date) {
      const single = extractSingleDateFromPrompt(prompt, timeZone);
      if (single) params.date = single;
      else {
        const ordinal = extractOrdinalDateFromPrompt(prompt, timeZone);
        if (ordinal) params.date = ordinal;
      }
    }
  }

  // Prompt-relative dates always win over stale LLM/session values.
  applyRelativeDateFromPrompt(params, prompt, timeZone);

  if (!params.employeeName && employees?.length) {
    const emp = matchEntityInPrompt(prompt, employees);
    if (emp) params.employeeName = emp.name;
  }
  if (
    !params.employeeName &&
    sessionContext?.employeeName &&
    /\b(his|her|their|him|she)\b/i.test(prompt)
  ) {
    params.employeeName = sessionContext.employeeName;
  }

  if (!params.customerName && customers?.length) {
    const cust = matchEntityInPrompt(prompt, customers);
    if (cust) params.customerName = cust.name;
  }

  if (!params.serviceName && services?.length) {
    const svc = matchServiceInPrompt(prompt, services);
    if (svc) params.serviceName = svc.name;
  }

  if (!params.serviceName && services?.length) {
    const keywordMatch = lower.match(/\b(?:a|an)\s+([\w\s-]+?)\s+schedule\b/);
    if (keywordMatch) {
      const keyword = keywordMatch[1].trim().toLowerCase();
      const partial = services.find(
        (s) =>
          s.name.toLowerCase().includes(keyword) ||
          keyword.includes(s.name.toLowerCase()) ||
          s.name.toLowerCase().split(/\s+/).some((t) => t.length >= 4 && keyword.includes(t)),
      );
      if (partial) params.serviceName = partial.name;
    }
  }

  if (!params.templateName && templates?.length) {
    const tpl = matchEntityInPrompt(prompt, templates);
    if (tpl) params.templateName = tpl.name;
  }

  const slot = extractTimeSlotFromPrompt(prompt);
  const isRescheduleLike =
    /\b(move|reschedule|shift|push)\b/i.test(lower) ||
    (/\bchange\b/i.test(lower) && /\b(appointment|booking)\b/i.test(lower));
  const toSlot = isRescheduleLike ? extractRescheduleTimeSlotFromPrompt(prompt) : null;
  const fromSlot = isRescheduleLike ? extractFromTimeSlotFromReschedulePrompt(prompt) : null;
  if (fromSlot && toSlot) {
    params.fromTimeSlot = fromSlot;
    params.timeSlot = toSlot;
  } else if (toSlot) {
    params.timeSlot = toSlot;
  } else if (slot && !params.timeSlot) {
    params.timeSlot = slot;
  }

  const status = extractStatusFilterFromPrompt(prompt);
  if (status && !params.statusFilter) params.statusFilter = status;
  const statusFilters = extractStatusFiltersFromPrompt(prompt);
  if (statusFilters.length > 0) params.statusFilters = statusFilters;

  const hideLimit = extractHideLimitFromPrompt(prompt);
  if (hideLimit && !params.limit) params.limit = hideLimit;

  if (/all providers|everyone|all staff|whole team|entire team|each provider/i.test(lower)) {
    params.allProviders = true;
  }

  if (/\bfull day\b|\bentire day\b|\bwhole day\b/i.test(lower)) {
    params.blockFullDay = true;
  }

  const reasonMatch =
    prompt.match(/\bwith a reason(?:\s+that)?\s+(.+?)(?:\.|$)/i) ||
    prompt.match(/\bbecause\b[:\s]+(.+)/i) ||
    prompt.match(/\breason[:\s]+(.+)/i);
  if (reasonMatch && !params.reason) {
    params.reason = reasonMatch[1].trim().slice(0, 200);
  }

  if (
    /\bcancel\b/i.test(lower) &&
    (/\bwhatsapp\b|\bnotify\b|\bmessage\b|\btext\b|\bcustomer\b|\breason\b|\bsick\b|\bbecause\b/i.test(
      lower,
    ) ||
      params.reason)
  ) {
    params.notifyCustomers = true;
  }
}

export function resolveServiceMetric(
  params: Record<string, any>,
  prompt: string,
): ServiceInsightMetric {
  const raw = params.serviceMetric as string | undefined;
  const allowed: ServiceInsightMetric[] = ['most_booked', 'top_revenue', 'least_booked', 'overview'];
  if (raw && allowed.includes(raw as ServiceInsightMetric)) return raw as ServiceInsightMetric;

  const lower = prompt.toLowerCase();
  if (/least popular|least booked|worst performing/i.test(lower)) return 'least_booked';
  if (/revenue|earned|sales|money/i.test(lower) && /\bservice/i.test(lower)) return 'top_revenue';
  if (/most popular|most booked|top service|best service|busiest service/i.test(lower)) {
    return 'most_booked';
  }
  if (/\bservice/i.test(lower) && /\b(popular|booked|performing)\b/i.test(lower)) return 'most_booked';
  return 'overview';
}

export function resolveStaffMetric(params: Record<string, any>, prompt: string): StaffInsightMetric {
  const raw = params.staffMetric as string | undefined;
  const allowed: StaffInsightMetric[] = ['busiest', 'most_revenue', 'most_bookings', 'overview'];
  if (raw && allowed.includes(raw as StaffInsightMetric)) return raw as StaffInsightMetric;

  const lower = prompt.toLowerCase();
  if (/revenue|earned|sales/i.test(lower) && /\b(staff|provider|employee|team)\b/i.test(lower)) {
    return 'most_revenue';
  }
  if (/busiest|most packed|most appointments/i.test(lower)) return 'busiest';
  if (/most bookings/i.test(lower)) return 'most_bookings';
  return 'overview';
}

export function resolveAppointmentMetric(
  params: Record<string, any>,
  prompt: string,
): 'most_expensive' | 'longest' | 'shortest' | 'earliest' | 'latest' | null {
  type AppointmentMetric = 'most_expensive' | 'longest' | 'shortest' | 'earliest' | 'latest';
  const allowed: AppointmentMetric[] = [
    'most_expensive',
    'longest',
    'shortest',
    'earliest',
    'latest',
  ];
  const raw = params.appointmentMetric as string | undefined;
  if (raw && allowed.includes(raw as AppointmentMetric)) {
    return raw as AppointmentMetric;
  }

  const lower = prompt.toLowerCase();
  if (/most expensive|highest price|priciest|costs the most|expensive appointment/i.test(lower)) {
    return 'most_expensive';
  }
  if (/longest|most time|takes the longest|longest appointment/i.test(lower)) return 'longest';
  if (/shortest|least time|quickest|shortest appointment/i.test(lower)) return 'shortest';
  if (/earliest|first appointment/i.test(lower)) return 'earliest';
  if (/latest|last appointment|final appointment/i.test(lower)) return 'latest';
  return null;
}

export function resolveBookingMetric(
  params: Record<string, any>,
  prompt: string,
):
  | 'count'
  | 'revenue'
  | 'busiest_provider'
  | 'cancelled'
  | 'no_shows'
  | 'unpaid'
  | 'upcoming'
  | 'confirmed'
  | 'pending'
  | 'completed'
  | 'overview'
  | null {
  type BookingMetric =
    | 'count'
    | 'revenue'
    | 'busiest_provider'
    | 'cancelled'
    | 'no_shows'
    | 'unpaid'
    | 'upcoming'
    | 'confirmed'
    | 'pending'
    | 'completed'
    | 'overview';
  const allowed: BookingMetric[] = [
    'count',
    'revenue',
    'busiest_provider',
    'cancelled',
    'no_shows',
    'unpaid',
    'upcoming',
    'confirmed',
    'pending',
    'completed',
    'overview',
  ];
  const raw = params.bookingMetric as string | undefined;
  if (raw && allowed.includes(raw as BookingMetric)) {
    return raw as BookingMetric;
  }

  const lower = prompt.toLowerCase();
  if (/upcoming|coming up|later today|rest of (the )?day/i.test(lower)) return 'upcoming';
  if (/busiest|most appointments|most bookings|fully booked|most packed/i.test(lower)) {
    return 'busiest_provider';
  }
  if (/revenue|how much.*(made|earned)|total.*(\$|usd|money)|sales/i.test(lower)) {
    return 'revenue';
  }
  if (/no[\s-]?show/i.test(lower)) return 'no_shows';
  if (/cancel/i.test(lower) && !/reassign|recover/i.test(lower)) return 'cancelled';
  if (/unpaid|not paid|pending payment/i.test(lower)) return 'unpaid';
  if (/confirmed/i.test(lower)) return 'confirmed';
  if (/pending/i.test(lower) && /\bappointments?\b|\bbookings?\b/i.test(lower)) return 'pending';
  if (/completed|finished|done appointments/i.test(lower)) return 'completed';
  if (
    /how many|count|number of|total appointments|total bookings|summarize today|summarize.*for all providers|any appointments/i.test(
      lower,
    )
  ) {
    return 'count';
  }
  if (/empty|quiet|slow day|no bookings/i.test(lower)) return 'count';
  if (/overview|summary|breakdown|stats/i.test(lower) && /\bappointments?\b|\bbookings?\b/i.test(lower)) {
    return 'overview';
  }
  return null;
}

export function resolveCustomerMetric(
  params: Record<string, any>,
  prompt: string,
): CustomerInsightMetric {
  const allowed: CustomerInsightMetric[] = [
    'most_no_shows',
    'most_bookings',
    'most_cancellations',
    'at_risk',
    'high_no_show',
    'vip',
    'top_spenders',
    'new_customers',
    'overview',
  ];

  const lower = prompt.toLowerCase();
  if (
    /pay(?:s|ing)?\s+(?:the\s+)?most|paid the most|spent the most|top spenders?|highest spend|most paid|who paid|best payers?|customers? who paid|biggest spender|most revenue from customers?/i.test(
      lower,
    )
  ) {
    return 'top_spenders';
  }
  if (/new customers?|recent customers?|first.?time|never booked/i.test(lower)) return 'new_customers';
  if (/high no[\s-]?show|no[\s-]?show rate/i.test(lower)) return 'high_no_show';
  if (/no[\s-]?show|no show/i.test(lower)) return 'most_no_shows';
  if (/at[\s-]?risk|churn|inactive|not been back|haven't been|lapsed/i.test(lower)) return 'at_risk';
  if (/cancel/i.test(lower)) return 'most_cancellations';
  if (/vip|loyal/i.test(lower)) return 'vip';
  if (/best customer|top customer/i.test(lower) && !/paid|spend|spent|\$|revenue|pay/i.test(lower)) {
    return 'vip';
  }
  if (/most booking|most appointment|books the most|frequent|top booker/i.test(lower)) {
    return 'most_bookings';
  }

  const raw = params.customerMetric as string | undefined;
  if (raw && allowed.includes(raw as CustomerInsightMetric)) {
    return raw as CustomerInsightMetric;
  }

  return 'overview';
}

function detectContextShiftIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, sessionContext } = input;
  const lastAction = sessionContext?.lastAction;
  if (!lastAction || lastAction === 'unknown' || lastAction === 'error') return null;

  const shiftEmployee =
    /\b(same for|what about|how about|and|now for|do it for)\b/i.test(prompt) ||
    (input.employees?.some((e) => prompt.toLowerCase().includes(e.name.toLowerCase())) ?? false);

  const shiftDate =
    /\b(tomorrow|yesterday|next week|this week|last week|this month|instead)\b/i.test(prompt) ||
    /\bwhat about\b/i.test(prompt);

  if (!shiftEmployee && !shiftDate) return null;
  if (!shiftEmployee && shiftDate && !sessionContext?.date && !sessionContext?.dateFrom) {
    // still allow date-only shift if explicit
  }

  const params = inheritSessionParams(sessionContext, [
    'employeeName',
    'date',
    'dateFrom',
    'dateTo',
    'serviceName',
    'timeSlot',
    'customerName',
    'bookingMetric',
    'appointmentMetric',
    'customerMetric',
    'statusFilter',
    'allProviders',
  ]);

  enrichParamsFromPrompt(params, input);

  const employee = input.employees ? matchEntityInPrompt(prompt, input.employees) : undefined;
  if (employee) params.employeeName = employee.name;

  const repeatable = [
    'summarize_bookings',
    'analyze_appointments',
    'show_appointments',
    'check_availability',
    'summarize_utilization',
    'list_schedule_gaps',
    'summarize_day',
    'summarize_customers',
    'analyze_services',
    'summarize_staff',
  ];
  if (!repeatable.includes(lastAction)) return null;

  return {
    action: lastAction,
    params,
    reasoning: `Context shift — repeat ${lastAction} with new entity or date`,
    confidence: 0.89,
  };
}

/** Questions about who is working / scheduled — not booking mutations. */
function isInformationalScheduleQuery(lower: string): boolean {
  return (
    /\bwho (has|is|are|'s|have)\b/i.test(lower) ||
    /\bwhich (provider|staff|employee|team member|team member)s?\b/i.test(lower) ||
    /\bwho(?:'s| is) (on duty|working|scheduled)\b/i.test(lower) ||
    /\bwho has a\b.*\b(schedule|shift|appointment|booking)\b/i.test(lower)
  );
}

function detectWhoHasScheduleIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, sessionContext } = input;
  const lower = prompt.toLowerCase();

  const wantsWhoSchedule =
    isInformationalScheduleQuery(lower) &&
    (/\b(schedule|shift|on duty|working|appointment|booking)\b/i.test(lower) ||
      /\bat\s+\d/i.test(lower));

  if (!wantsWhoSchedule) return null;
  if (/\b(cancel|book|reserve)\b/i.test(lower) && !/\bwho\b/i.test(lower)) return null;

  const params = inheritSessionParams(sessionContext, ['date', 'serviceName', 'timeSlot']);
  enrichParamsFromPrompt(params, input);
  params.allProviders = true;

  return {
    action: 'show_appointments',
    params,
    reasoning: 'Who has schedule — list providers with matching appointments or shifts',
    confidence: 0.94,
  };
}

function tzFrom(input: HeuristicDetectionInput): string {
  return input.timeZone ?? input.sessionContext?.timeZone ?? 'UTC';
}

/** "30th may", "30 may", "May 30" → DD_MM_YYYY */
function extractOrdinalDateFromPrompt(prompt: string, timeZone = 'UTC'): string | null {
  const match = prompt.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i,
  );
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const monthKey = match[2].slice(0, 3).toLowerCase();
  const monthMap: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };
  const month = monthMap[monthKey];
  if (!month || day < 1 || day > 31) return null;

  const year = parseInt(getTodayDateKey(timeZone).split('-')[0], 10);
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return formatDateDisplay(iso);
}

function detectFollowUpIntents(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, sessionContext } = input;
  const lastAction = sessionContext?.lastAction;
  const inherited = inheritSessionParams(sessionContext, [
    'employeeName',
    'date',
    'dateFrom',
    'dateTo',
    'serviceName',
    'timeSlot',
    'customerName',
    'timeFrom',
    'timeTo',
    'allProviders',
    'statusFilter',
  ]);

  if (
    (lastAction === 'check_availability' ||
      lastAction === 'show_appointments' ||
      lastAction === 'summarize_day' ||
      lastAction === 'lookup_service_assignment') &&
    !isInformationalScheduleQuery(prompt.toLowerCase()) &&
    !isProviderAvailabilityQuery(prompt.toLowerCase()) &&
    (/\b(book|schedule|add|create|reserve)\b/i.test(prompt) ||
      (extractTimeSlotFromPrompt(prompt) &&
        (inherited.serviceName || sessionContext?.serviceName))) &&
    /\b(book|reserve|add an appointment|make an appointment|schedule an appointment)\b/i.test(
      prompt,
    ) &&
    (/\bappointment\b|\bbooking\b/i.test(prompt) ||
      inherited.serviceName ||
      sessionContext?.serviceName ||
      extractTimeSlotFromPrompt(prompt) ||
      input.services?.some((s) => prompt.toLowerCase().includes(s.name.toLowerCase())))
  ) {
    const params = { ...inherited };
    const service = input.services ? matchEntityInPrompt(prompt, input.services) : undefined;
    if (service) params.serviceName = service.name;
    if (!params.serviceName && sessionContext?.serviceName) {
      params.serviceName = sessionContext.serviceName;
    }
    const employee = input.employees ? matchEntityInPrompt(prompt, input.employees) : undefined;
    if (employee) params.employeeName = employee.name;
    if (
      !params.employeeName &&
      Array.isArray(sessionContext?.availableProviders) &&
      sessionContext.availableProviders.length === 1
    ) {
      params.employeeName = sessionContext.availableProviders[0];
    }
    const slot = extractTimeSlotFromPrompt(prompt);
    if (slot) params.timeSlot = slot;
    if (!params.date && !params.dateFrom) {
      params.date = sessionContext?.date ?? todayDisplay(tzFrom(input));
    }
    enrichParamsFromPrompt(params, input);
    return {
      action: 'create_booking',
      params,
      reasoning: 'Follow-up — book after provider lookup or availability view',
      confidence: 0.93,
    };
  }

  if (
    (lastAction === 'show_appointments' ||
      lastAction === 'summarize_day' ||
      lastAction === 'summarize_bookings' ||
      lastAction === 'analyze_appointments' ||
      lastAction === 'lookup_customer') &&
    /\bcancel\b/i.test(prompt) &&
    (/\b(those|these|them|all|it|that one)\b/i.test(prompt) || inherited.date || inherited.serviceName)
  ) {
    enrichParamsFromPrompt(inherited, input);
    return {
      action: 'cancel_bookings',
      params: inherited,
      reasoning: 'Follow-up — cancel after viewing appointments',
      confidence: 0.92,
    };
  }

  if (
    (lastAction === 'show_appointments' ||
      lastAction === 'summarize_day' ||
      lastAction === 'lookup_customer') &&
    (/\b(move|reschedule|shift|change|switch)\b/i.test(prompt) ||
      extractNewServiceNameFromChangePrompt(prompt, input.services))
  ) {
    const params = { ...inherited };
    const newServiceName = extractNewServiceNameFromChangePrompt(prompt, input.services);
    if (newServiceName || /\b(change|switch)\b.*\bservice/i.test(prompt)) {
      delete params.serviceName;
    }
    if (newServiceName) {
      const svc = input.services?.length
        ? matchServiceByNameFragment(newServiceName, input.services)
        : undefined;
      params.serviceName = svc?.name ?? newServiceName;
    }
    const slot = extractTimeSlotFromPrompt(prompt);
    if (slot) params.timeSlot = slot;
    enrichParamsFromPrompt(params, input);
    if (newServiceName && input.services?.length) {
      const svc = matchServiceByNameFragment(newServiceName, input.services);
      if (svc) params.serviceName = svc.name;
    }
    return {
      action: 'reschedule_booking',
      params,
      reasoning: newServiceName
        ? 'Follow-up — change service after viewing appointments'
        : 'Follow-up — reschedule after viewing appointments',
      confidence: 0.91,
    };
  }

  const gapContext =
    lastAction === 'list_schedule_gaps' ||
    lastAction === 'summarize_utilization' ||
    lastAction === 'fill_unused_slots';
  if (
    gapContext &&
    /\bfill\b/i.test(prompt) &&
    (/\b(those|these|the|them|his|her|their)\b/i.test(prompt) ||
      /\bgaps?\b|\bslots?\b|\bopen\b|\bempty\b|\bunused\b/i.test(prompt))
  ) {
    return {
      action: 'fill_unused_slots',
      params: inherited,
      reasoning: 'Follow-up — fill gaps from prior utilization/gap analysis',
      confidence: 0.93,
    };
  }

  if (
    sessionContext?.lastMetric &&
    (lastAction === 'summarize_bookings' ||
      lastAction === 'analyze_appointments' ||
      lastAction === 'summarize_staff' ||
      lastAction === 'analyze_services') &&
    /\b(who|which|what about|and|how about)\b/i.test(prompt)
  ) {
    const bookingFollow = resolveBookingMetric({}, prompt);
    if (bookingFollow) {
      return {
        action: 'summarize_bookings',
        params: { ...inherited, bookingMetric: bookingFollow },
        reasoning: 'Follow-up — booking analytics chain',
        confidence: 0.9,
      };
    }
    const apptFollow = resolveAppointmentMetric({}, prompt);
    if (apptFollow) {
      return {
        action: 'analyze_appointments',
        params: { ...inherited, appointmentMetric: apptFollow },
        reasoning: 'Follow-up — appointment analysis chain',
        confidence: 0.9,
      };
    }
  }

  return null;
}

function detectListScheduleGapsIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, sessionContext, employees } = input;
  const lower = prompt.toLowerCase();

  // "Who has a free slot for facemassage" is provider+availability lookup, not schedule-gap drill-down.
  if (isWhoHasFreeSlotForServiceQuery(lower)) return null;

  const asksAboutDaysWithGaps =
    /\b(which|what)\s+(exact\s+)?days?\b/i.test(prompt) ||
    /\bdays?\s+(with|have|has|contain)\s+(gaps?|open|empty|free|unused)/i.test(prompt) ||
    /\b(gaps?|open\s+slots?|empty\s+slots?|unused\s+slots?)\s+(on\s+)?which\s+days?\b/i.test(prompt) ||
    (/\bgaps?\b/i.test(prompt) && /\b(which|what|when)\b/i.test(prompt));

  const asksWhoIsFree =
    /\bwho\s+(is|has|are)\s+(?:a\s+)?(?:free|available|open)\b/i.test(prompt) ||
    /\bwho\s+has\s+(?:a\s+)?(?:free|open|available)\s+(?:slot|time)/i.test(prompt) ||
    /\bwho\s+has\s+(gaps?|open|availability)\b/i.test(prompt);

  const followUpAfterUtilization =
    sessionContext?.lastAction === 'summarize_utilization' &&
    (/\bgaps?\b/i.test(prompt) || asksAboutDaysWithGaps || /\bdays?\b/i.test(prompt));

  if (!asksAboutDaysWithGaps && !followUpAfterUtilization && !asksWhoIsFree) {
    return null;
  }

  const params = inheritSessionParams(sessionContext, [
    'dateFrom',
    'dateTo',
    'date',
    'timeFrom',
    'timeTo',
    'allProviders',
  ]);
  const employee = matchEntityInPrompt(prompt, employees);
  if (employee) {
    params.employeeName = employee.name;
  } else if (asksWhoIsFree) {
    // Do not pin to a prior provider when asking who is free across the team.
    params.employeeName = null;
    if (/all providers|everyone|all staff/i.test(prompt)) {
      params.allProviders = true;
    }
  }

  return {
    action: 'list_schedule_gaps',
    params,
    reasoning: asksWhoIsFree ? 'Who has open availability' : 'Gap drill-down — list open windows per day',
    confidence: 0.92,
  };
}

function detectAppointmentAnalysisIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, sessionContext } = input;
  const metric = resolveAppointmentMetric({}, prompt);
  if (!metric) return null;

  const lower = prompt.toLowerCase();
  const hasContext =
    /\bappointments?\b|\bbooking/i.test(prompt) ||
    /\btoday\b|\btomorrow\b|\byesterday\b/i.test(lower) ||
    sessionContext?.lastAction === 'analyze_appointments' ||
    sessionContext?.lastAction === 'show_appointments' ||
    sessionContext?.lastAction === 'summarize_day' ||
    sessionContext?.lastAction === 'summarize_bookings';

  if (!hasContext) return null;

  const params: Record<string, any> = { appointmentMetric: metric };
  Object.assign(params, inheritSessionParams(sessionContext, ['date', 'employeeName']));

  return {
    action: 'analyze_appointments',
    params,
    reasoning: `Appointment analysis — ${metric.replace(/_/g, ' ')}`,
    confidence: 0.92,
  };
}

function detectSummarizeBookingsIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, sessionContext } = input;
  const metric = resolveBookingMetric({}, prompt);
  if (!metric) return null;

  const wantsList =
    /\b(show|list|display|see)\b/i.test(prompt) &&
    /\b(all|every|each)\b/i.test(prompt) &&
    /\bappointments?\b|\bbookings?\b/i.test(prompt);

  if (wantsList && metric === 'count') return null;

  const lower = prompt.toLowerCase();
  const hasBookingContext =
    /\bappointments?\b|\bbookings?\b|\brevenue\b|\bbusiest\b|\bcancelled\b|\bno[\s-]?show/i.test(
      prompt,
    ) ||
    /\btoday\b|\btomorrow\b|\bthis week\b|\byesterday\b/i.test(lower) ||
    ['summarize_bookings', 'show_appointments', 'analyze_appointments', 'summarize_day'].includes(
      sessionContext?.lastAction ?? '',
    );

  if (!hasBookingContext && metric !== 'busiest_provider') return null;

  const params: Record<string, any> = { bookingMetric: metric };
  Object.assign(
    params,
    inheritSessionParams(sessionContext, [
      'date',
      'dateFrom',
      'dateTo',
      'employeeName',
      'statusFilter',
    ]),
  );
  const status = extractStatusFilterFromPrompt(prompt);
  if (status) params.statusFilter = status;
  if (sessionContext?.todayOnly && !params.date && !params.dateFrom) {
    params.date = todayDisplay(tzFrom(input));
  }

  return {
    action: 'summarize_bookings',
    params,
    reasoning: `Booking analytics — ${metric.replace(/_/g, ' ')}`,
    confidence: 0.91,
  };
}

function detectCustomerInsightsIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, sessionContext } = input;
  const lower = prompt.toLowerCase();

  const asksAboutCustomers =
    /\bcustomers?\b/i.test(prompt) || /\bwho\b/i.test(prompt) || /\bwhich\b/i.test(prompt);

  const customerAnalytics =
    /no[\s-]?show|at[\s-]?risk|vip|cancellation|cancelled|book(s|ed)? the most|most appointment|frequent|churn|inactive|haven't been|not been back|top customer|best customer|crm|segment|pay(?:s|ing)?\s+(?:the\s+)?most|paid the most|spent the most|top spenders?|highest spend|most paid|new customers?|lapsed|biggest spender/i.test(
      lower,
    );

  const asksLastVisit =
    /\blast visit\b|\bwhen did .* last\b|\bwhen was .* here\b/i.test(lower) &&
    input.customers?.some((c) => prompt.toLowerCase().includes(c.name.toLowerCase()));

  if (!asksAboutCustomers && !customerAnalytics && !asksLastVisit) {
    if (!/(most no[\s-]?show|at[\s-]?risk|top vip)/i.test(lower)) return null;
  }
  if (!customerAnalytics && !/\bcustomers?\b/i.test(prompt) && !asksLastVisit) return null;

  const segmentFilter = sessionContext?.segmentFilter as string | undefined;
  const segmentMetricMap: Partial<Record<string, CustomerInsightMetric>> = {
    at_risk: 'at_risk',
    high_no_show: 'high_no_show',
    vip: 'vip',
    new: 'new_customers',
  };

  let metric = resolveCustomerMetric({}, prompt);
  if (metric === 'overview' && segmentFilter && segmentMetricMap[segmentFilter]) {
    metric = segmentMetricMap[segmentFilter]!;
  }

  const params: Record<string, any> = {
    customerMetric: metric,
    limit: extractLimitFromPrompt(prompt),
  };
  const customer = input.customers ? matchEntityInPrompt(prompt, input.customers) : undefined;
  if (customer) params.customerName = customer.name;

  return {
    action: 'summarize_customers',
    params,
    reasoning: asksLastVisit ? 'Customer visit history question' : 'Customer CRM insight question',
    confidence: 0.9,
  };
}

function detectShowAppointmentsIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, sessionContext, employees, customers } = input;
  const lower = prompt.toLowerCase();

  const wantsList =
    /\b(show|list|display|see|view|what are|what's|pull up)\b/i.test(prompt) &&
    /\bappointments?\b|\bbookings?\b|\bschedule\b/i.test(prompt);

  const scheduleView =
    /\b(schedule|calendar)\b/i.test(lower) &&
    (input.employees?.some((e) => lower.includes(e.name.toLowerCase())) ?? false);

  const statusOnly =
    extractStatusFilterFromPrompt(prompt) &&
    /\bappointments?\b|\bbookings?\b/i.test(prompt) &&
    !resolveBookingMetric({}, prompt);

  const customerAppts =
    customers &&
    customers.some((c) => lower.includes(c.name.toLowerCase())) &&
    /\bappointments?\b|\bbookings?\b|\bschedule\b/i.test(prompt);

  const whatsComingUp =
    /\b(coming up|upcoming|next appointments?|what's on)\b/i.test(lower) &&
    /\btoday\b|\btomorrow\b|\bthis week\b/i.test(lower);

  if (!wantsList && !statusOnly && !customerAppts && !whatsComingUp && !scheduleView) return null;

  if (resolveBookingMetric({}, prompt) === 'count' && !wantsList) return null;
  if (resolveAppointmentMetric({}, prompt)) return null;

  const params = inheritSessionParams(sessionContext, [
    'date',
    'dateFrom',
    'dateTo',
    'employeeName',
    'customerName',
    'statusFilter',
    'todayOnly',
  ]);

  const employee = matchEntityInPrompt(prompt, employees);
  if (employee) params.employeeName = employee.name;
  const customer = customers ? matchEntityInPrompt(prompt, customers) : undefined;
  if (customer) params.customerName = customer.name;

  const status = extractStatusFilterFromPrompt(prompt);
  if (status) params.statusFilter = status;
  if (sessionContext?.todayOnly && !params.date) params.date = todayDisplay(tzFrom(input));
  if (whatsComingUp && !params.date) {
    params.date = /\btomorrow\b/i.test(prompt) ? undefined : todayDisplay(tzFrom(input));
  }

  return {
    action: 'show_appointments',
    params,
    reasoning: customerAppts
      ? 'List appointments for a specific customer'
      : whatsComingUp
        ? 'Upcoming appointments'
        : 'List appointments for a day or filter',
    confidence: 0.9,
  };
}

function detectProviderAvailabilityIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, sessionContext, employees } = input;
  const lower = prompt.toLowerCase();

  if (isWhoHasFreeSlotForServiceQuery(lower)) return null;
  if (!isProviderAvailabilityQuery(lower)) return null;
  if (/\b(book|reserve|schedule an appointment|make an appointment)\b/i.test(lower)) return null;

  const params = inheritSessionParams(sessionContext, [
    'date',
    'employeeName',
    'serviceName',
    'timeSlot',
  ]);

  // Named-provider questions only — team-wide "who is free" uses lookup_service_assignment.
  const employee = employees?.length ? matchEntityInPrompt(prompt, employees) : undefined;
  if (!employee && /\bwho\b/i.test(lower)) return null;
  if (employee) params.employeeName = employee.name;

  return {
    action: 'check_availability',
    params,
    reasoning: 'Check if provider is available for requested service/time',
    confidence: 0.94,
  };
}

function detectCheckAvailabilityIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, sessionContext, employees } = input;
  const lower = prompt.toLowerCase();

  const wantsAvailability =
    isProviderAvailabilityQuery(lower) ||
    /\b(available|availability|free slots?|open slots?|open times?|can (i|we) book)\b/i.test(
      lower,
    ) ||
    /\bwhat slots\b|\bwhich slots\b|\bwhen is .* free\b/i.test(lower) ||
    /\bschedule for\b/i.test(lower) ||
    /\b(is|are)\b.*\b(working|on schedule)\b/i.test(lower) ||
    /\bwho is working\b/i.test(lower);

  if (!wantsAvailability) return null;
  if (/\b(show|list|cancel|how many)\b/i.test(lower) && !/\bavailable\b/i.test(lower)) return null;

  const params = inheritSessionParams(sessionContext, [
    'date',
    'employeeName',
    'serviceName',
    'timeSlot',
  ]);
  const employee = matchEntityInPrompt(prompt, employees);
  if (employee) params.employeeName = employee.name;

  return {
    action: 'check_availability',
    params,
    reasoning: 'Check open bookable slots',
    confidence: 0.9,
  };
}

function detectSummarizeUtilizationIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, sessionContext } = input;
  const lower = prompt.toLowerCase();

  if (
    !/\butilization\b|\butilised\b|\butilized\b|\bwho has (the )?most gaps\b|\bteam capacity\b/i.test(
      lower,
    )
  ) {
    return null;
  }
  if (/\b(which|what)\s+(exact\s+)?days?\b/i.test(prompt) && /\bgaps?\b/i.test(prompt)) {
    return null;
  }

  const params = inheritSessionParams(sessionContext, ['dateFrom', 'dateTo', 'employeeName']);
  return {
    action: 'summarize_utilization',
    params,
    reasoning: 'Team utilization summary',
    confidence: 0.91,
  };
}

function detectSummarizeDayIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, sessionContext, employees } = input;
  const lower = prompt.toLowerCase();

  if (
    !/\bsummarize\b|\brundown\b|\bday summary\b|\bdaily summary\b|\boverview for today\b/i.test(
      lower,
    )
  ) {
    return null;
  }
  if (/\bcustomers?\b/i.test(prompt) && !/\bappointments?\b/i.test(prompt)) return null;

  const params = inheritSessionParams(sessionContext, ['date', 'employeeName']);
  const employee = matchEntityInPrompt(prompt, employees);
  if (employee) params.employeeName = employee.name;

  return {
    action: 'summarize_day',
    params,
    reasoning: 'Combined day summary — schedule + appointments',
    confidence: 0.9,
  };
}

function detectListServicesIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, services } = input;
  const lower = prompt.toLowerCase();

  const wantsCatalog =
    /\b(what services|list services|show services|our services|service catalog|services do we offer|menu of services)\b/i.test(
      lower,
    );
  const wantsPrice =
    /\b(how much|price of|cost of|what does .* cost)\b/i.test(lower) &&
    services?.some((s) => lower.includes(s.name.toLowerCase()));

  if (!wantsCatalog && !wantsPrice) return null;
  if (/\b(add|create|new service)\b/i.test(lower)) return null;

  const params: Record<string, any> = {};
  if (wantsPrice && services) {
    const service = matchEntityInPrompt(prompt, services);
    if (service) params.serviceName = service.name;
  }

  return {
    action: 'list_services',
    params,
    reasoning: wantsPrice ? 'Service price lookup' : 'List service catalog',
    confidence: 0.92,
  };
}

function detectOrchestrationIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, sessionContext, employees } = input;
  const lower = prompt.toLowerCase();
  const params = inheritSessionParams(sessionContext, [
    'date',
    'dateFrom',
    'dateTo',
    'employeeName',
    'templateName',
    'timeFrom',
    'timeTo',
  ]);
  const employee = matchEntityInPrompt(prompt, employees);
  if (employee) params.employeeName = employee.name;

  if (/\boptimize\b|\bimprove.*schedule\b|\bmake.*efficient\b/i.test(lower)) {
    return {
      action: 'optimize_schedule',
      params,
      reasoning: 'Schedule optimization request',
      confidence: 0.88,
    };
  }
  if (/\bconflict|double.?book|overlap|overlapping appointments\b/i.test(lower)) {
    return {
      action: 'resolve_conflicts',
      params,
      reasoning: 'Scheduling conflict resolution',
      confidence: 0.9,
    };
  }
  if (/\breassign\b|\brecover.*cancel|\brebook.*cancel|\bfreed slots?\b/i.test(lower)) {
    return {
      action: 'reassign_cancelled',
      params,
      reasoning: 'Cancellation recovery',
      confidence: 0.88,
    };
  }
  if (/\bset up.*week\b|\bsetup.*week.*schedule\b|\bprepare.*week\b/i.test(lower)) {
    return {
      action: 'setup_week_schedule',
      params,
      reasoning: 'Weekly schedule setup combo',
      confidence: 0.89,
    };
  }
  if (/\bwaitlist\b|\bfill.*from waitlist\b/i.test(lower)) {
    const slot = extractTimeSlotFromPrompt(prompt);
    if (slot) params.timeSlot = slot;
    return {
      action: 'fill_slot_from_waitlist',
      params,
      reasoning: 'Waitlist slot fill',
      confidence: 0.9,
    };
  }
  if (/\bnotify.*cancel|\bsmart cancel|\bcancel.*waitlist|\bcancel.*notify\b/i.test(lower)) {
    return {
      action: 'bulk_smart_cancel',
      params,
      reasoning: 'Cancel with customer notification and waitlist recovery',
      confidence: 0.89,
    };
  }
  if (/\bapply\b.*\btemplate\b|\buse\b.*\btemplate\b/i.test(lower)) {
    return {
      action: 'apply_schedule',
      params,
      reasoning: 'Apply schedule template',
      confidence: 0.88,
    };
  }
  if (/\bblock\b.*\b(lunch|break|time|day)\b|\bblock\b.*\d{1,2}:\d{2}/i.test(lower)) {
    return {
      action: 'block_schedule',
      params,
      reasoning: 'Block schedule time or day',
      confidence: 0.87,
    };
  }
  if (/\bfill\b.*\b(gaps?|slots?|empty)\b/i.test(lower) && !sessionContext?.lastAction) {
    enrichParamsFromPrompt(params, input);
    return {
      action: 'fill_unused_slots',
      params,
      reasoning: 'Fill unused schedule slots',
      confidence: 0.87,
    };
  }

  return null;
}

function detectChangeBookingServiceIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, sessionContext } = input;
  const lower = prompt.toLowerCase();

  const newServiceName = extractNewServiceNameFromChangePrompt(prompt, input.services);
  const wantsServiceChange =
    !!newServiceName ||
    (/\b(change|switch|update|replace|convert)\b/i.test(lower) &&
      /\bservice(\s+type)?\b/i.test(lower));

  if (!wantsServiceChange) return null;
  if (/\bassign\b/i.test(lower)) return null;
  if (/\b(add|create|new)\b/i.test(lower) && /\$|\d+\s*min/i.test(lower)) return null;

  const params = inheritSessionParams(sessionContext, [
    'employeeName',
    'date',
    'timeSlot',
    'customerName',
    'bookingId',
  ]);

  if (newServiceName) {
    const svc = input.services?.length
      ? matchServiceByNameFragment(newServiceName, input.services)
      : undefined;
    params.serviceName = svc?.name ?? newServiceName;
  }

  enrichParamsFromPrompt(params, input);

  if (newServiceName && input.services?.length) {
    const svc = matchServiceByNameFragment(newServiceName, input.services);
    if (svc) params.serviceName = svc.name;
  }

  if (!params.serviceName) return null;

  return {
    action: 'reschedule_booking',
    params,
    reasoning: 'Change appointment service type',
    confidence: 0.91,
  };
}

function detectDirectMutationIntents(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt } = input;
  const lower = prompt.toLowerCase();
  const params: Record<string, any> = inheritSessionParams(input.sessionContext, [
    'employeeName',
    'date',
    'serviceName',
    'timeSlot',
    'customerName',
    'reason',
  ]);
  enrichParamsFromPrompt(params, input);

  if (isInformationalScheduleQuery(lower)) return null;
  if (isProviderAvailabilityQuery(lower)) return null;

  if (
    /\b(book|reserve|set up an appointment|make an appointment|add an appointment|schedule an appointment|schedule a)\b/i.test(
      lower,
    ) &&
    (params.employeeName || params.serviceName || params.timeSlot) &&
    !/\b(show|list|how many|cancel)\b/i.test(lower)
  ) {
    return {
      action: 'create_booking',
      params,
      reasoning: 'Direct booking request',
      confidence: 0.88,
    };
  }

  const timeOnlyBooking =
    extractTimeSlotFromPrompt(prompt) &&
    (params.serviceName || input.sessionContext?.serviceName) &&
    (params.date || input.sessionContext?.date) &&
    (params.employeeName ||
      input.sessionContext?.employeeName ||
      (Array.isArray(input.sessionContext?.availableProviders) &&
        input.sessionContext.availableProviders.length === 1));
  if (
    timeOnlyBooking &&
    !/\b(cancel|show|list|how many|who can|who has|who is|which|available)\b/i.test(lower) &&
    !isLikelyReadOnlyQuestion(prompt) &&
    !isProviderAvailabilityQuery(lower) &&
    isExplicitMutationRequest(lower)
  ) {
    if (!params.serviceName && input.sessionContext?.serviceName) {
      params.serviceName = input.sessionContext.serviceName;
    }
    if (!params.date && input.sessionContext?.date) {
      params.date = input.sessionContext.date;
    }
    if (
      !params.employeeName &&
      Array.isArray(input.sessionContext?.availableProviders) &&
      input.sessionContext.availableProviders.length === 1
    ) {
      params.employeeName = input.sessionContext.availableProviders[0];
    }
    return {
      action: 'create_booking',
      params,
      reasoning: 'Time-only booking follow-up from prior provider/service context',
      confidence: 0.9,
    };
  }

  const wantsUnhideFromCalendar =
    /\b(unhide|restore)\b/i.test(lower) ||
    (/\b(show|bring|put)\b/i.test(lower) &&
      /\b(back|again|on)\b/i.test(lower) &&
      /\b(calendar|schedule)\b/i.test(lower) &&
      /\b(appointment|booking|hidden)s?\b/i.test(lower));

  if (wantsUnhideFromCalendar) {
    return {
      action: 'unhide_appointments_from_calendar',
      params,
      reasoning: 'Restore hidden appointments to calendar view',
      confidence: 0.89,
    };
  }

  const wantsHideFromCalendar =
    (/\b(hide|remove|clear)\b/i.test(lower) &&
      /\b(calendar|schedule)\b/i.test(lower) &&
      /\b(appointment|booking)s?\b/i.test(lower)) ||
    (/\bdelete\b/i.test(lower) &&
      /\b(appointment|booking)s?\b/i.test(lower) &&
      /\b(calendar|schedule)\b/i.test(lower) &&
      !/\b(permanently|forever|database)\b/i.test(lower));

  if (wantsHideFromCalendar) {
    return {
      action: 'hide_appointments_from_calendar',
      params,
      reasoning: 'Hide appointments from calendar without deleting records',
      confidence: 0.89,
    };
  }

  if (
    /\bcancel\b/i.test(lower) &&
    /\b(all|every|appointments?|bookings?|tomorrow|today|facemassage|haircut|\w+\s+\d{1,2}:\d{2})/i.test(
      lower,
    ) &&
    !/\b(don't cancel|do not cancel|without cancel)\b/i.test(lower)
  ) {
    return {
      action: 'cancel_bookings',
      params,
      reasoning: 'Direct cancellation request',
      confidence: 0.87,
    };
  }

  if (
    (/\b(move|reschedule|shift|push)\b/i.test(lower) &&
      /\b(appointment|booking|to)\b/i.test(lower)) ||
    (/\bchange\b/i.test(lower) &&
      /\b(appointment|booking)\b/i.test(lower) &&
      (params.timeSlot || params.date || /\bto\b/i.test(lower))) ||
    /\breschedule\b/i.test(lower)
  ) {
    return {
      action: 'reschedule_booking',
      params,
      reasoning: 'Direct reschedule request',
      confidence: 0.87,
    };
  }

  if (/\bassign\b/i.test(lower) && /\bservice/i.test(lower)) {
    return {
      action: 'assign_employee_services',
      params,
      reasoning: 'Assign services to provider',
      confidence: 0.86,
    };
  }

  if (
    (/\b(add|create|new)\b/i.test(lower)) &&
    /\bservice/i.test(lower) &&
    (/\$\d|\d+\s*min|\d+\s*minutes|\d+\s*hour/i.test(lower) || params.serviceName)
  ) {
    return {
      action: 'create_service',
      params,
      reasoning: 'Add new service to catalog',
      confidence: 0.85,
    };
  }

  return null;
}

function detectLookupCustomerIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, customers } = input;
  const lower = prompt.toLowerCase();
  const customer = customers ? matchEntityInPrompt(prompt, customers) : undefined;
  if (!customer) return null;

  const wantsProfile =
    /\blast visit\b|\bwhen did .* (last|come|visit)\b|\bhow many appointments\b|\btell me about\b|\bcustomer profile\b|\bhistory for\b|\binfo on\b/i.test(
      lower,
    );

  if (!wantsProfile && !/\b(customer|client)\b/i.test(lower)) return null;
  if (resolveCustomerMetric({}, prompt) !== 'overview' && /top|most|at.?risk|vip/i.test(lower)) {
    return null;
  }

  const params: Record<string, any> = { customerName: customer.name };
  enrichParamsFromPrompt(params, input);

  return {
    action: 'lookup_customer',
    params,
    reasoning: 'Single customer profile lookup',
    confidence: 0.91,
  };
}

function detectAnalyzeServicesIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt } = input;
  const lower = prompt.toLowerCase();

  const wantsServiceAnalytics =
    /\b(service|services|treatment|offering)\b/i.test(lower) &&
    (/\b(most|top|popular|booked|revenue|performing|best|least)\b/i.test(lower) ||
      /\bwhich service\b/i.test(lower));

  if (!wantsServiceAnalytics) return null;
  if (/\b(add|create|new|price of|how much is)\b/i.test(lower) && !/\bmost\b/i.test(lower)) {
    return null;
  }

  const params: Record<string, any> = {
    serviceMetric: resolveServiceMetric({}, prompt),
    limit: extractLimitFromPrompt(prompt),
  };
  enrichParamsFromPrompt(params, input);

  return {
    action: 'analyze_services',
    params,
    reasoning: 'Service popularity / revenue analytics',
    confidence: 0.9,
  };
}

function detectSummarizeStaffIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt } = input;
  const lower = prompt.toLowerCase();

  const wantsStaffAnalytics =
    /\b(staff|provider|employee|team member|therapist|stylist)\b/i.test(lower) &&
    (/\b(busiest|revenue|most bookings|performance|compare|ranking|top)\b/i.test(lower) ||
      /\bwho (earned|made|brought in)\b/i.test(lower));

  const wantsTeamCompare =
    /\bcompare\b/i.test(lower) &&
    /\b(providers|staff|employees|team)\b/i.test(lower);

  if (!wantsStaffAnalytics && !wantsTeamCompare) return null;
  if (resolveBookingMetric({}, prompt) === 'busiest_provider' && !wantsTeamCompare) return null;

  const params: Record<string, any> = {
    staffMetric: resolveStaffMetric({}, prompt),
    limit: extractLimitFromPrompt(prompt),
  };
  enrichParamsFromPrompt(params, input);

  return {
    action: 'summarize_staff',
    params,
    reasoning: 'Staff / provider performance summary',
    confidence: 0.9,
  };
}

function detectListEmployeesIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, employees } = input;
  const lower = prompt.toLowerCase();

  if (
    !/\b(list|show|who are|who works|our team|all providers|staff members|employees)\b/i.test(
      lower,
    )
  ) {
    return null;
  }
  if (/\b(busiest|utilization|revenue|appointments today)\b/i.test(lower)) return null;

  const params: Record<string, any> = {};
  enrichParamsFromPrompt(params, input);

  return {
    action: 'list_employees',
    params,
    reasoning: 'List team / providers',
    confidence: 0.92,
  };
}

function buildServiceAssignmentIntent(
  assignmentLookup: ServiceAssignmentLookup,
  params: Record<string, any>,
): HeuristicIntent {
  return {
    action: 'lookup_service_assignment',
    params: { assignmentLookup, ...params },
    reasoning:
      assignmentLookup === 'providers_for_service'
        ? params.withAvailability
          ? 'Which providers can perform a service on a given day (with availability)'
          : 'Which providers can perform a service'
        : 'Which services a provider can perform',
    confidence: 0.91,
  };
}

function hasSchedulingDateContext(
  prompt: string,
  params: Record<string, any>,
): boolean {
  const lower = prompt.toLowerCase();
  return !!(
    params.date ||
    params.dateFrom ||
    /\btoday\b|\btomorrow\b|\byesterday\b|\btonight\b/i.test(lower) ||
    /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i.test(
      lower,
    ) ||
    /\d{1,2}[/_]\d{1,2}[/_]\d{4}/i.test(prompt)
  );
}

function applyServiceAssignmentDateMode(params: Record<string, any>, prompt: string): void {
  if (hasSchedulingDateContext(prompt, params)) {
    params.withAvailability = true;
  }
}

function detectSummarizeWaitlistIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt } = input;
  const lower = prompt.toLowerCase();

  const wantsWaitlist =
    /\bwaitlist\b/i.test(lower) ||
    /\bwaiting\s*list\b/i.test(lower) ||
    /\b(list|show|how many|count|who is on)\b.*\bwaitlist\b/i.test(lower) ||
    /\bwaitlist\b.*\b(customers?|clients?|people)\b/i.test(lower);

  if (!wantsWaitlist) return null;
  if (/\bfill\b.*\bwaitlist\b/i.test(lower) || /\bfrom waitlist\b/i.test(lower)) return null;

  const params: Record<string, any> = {
    limit: extractLimitFromPrompt(prompt),
  };
  enrichParamsFromPrompt(params, input);

  return {
    action: 'summarize_waitlist',
    params,
    reasoning: 'Waitlist summary — tagged customers and open recovery slots',
    confidence: 0.92,
  };
}

function detectLookupServiceAssignmentIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, employees, services } = input;
  const lower = prompt.toLowerCase();

  const employee = employees ? matchEntityInPrompt(prompt, employees) : undefined;
  const service = services ? matchServiceInPrompt(prompt, services) : undefined;

  const servicesForProvider =
    employee &&
    (/\bwhat services\b/i.test(lower) ||
      /\bwhich services\b/i.test(lower) ||
      /\bservices (can|does)\b/i.test(lower) ||
      /\b(offer|perform|provide)\b/i.test(lower));

  const providersForService =
    service &&
    (/\bwho (can|does|offers|performs|provides)\b/i.test(lower) ||
      /\bwhich providers?\b/i.test(lower) ||
      /\bwhich (staff|employees|providers)\b/i.test(lower) ||
      /\bwho does\b/i.test(lower) ||
      isWhoHasFreeSlotForServiceQuery(lower) ||
      isWhoIsDoingServiceQuery(lower));

  if (!servicesForProvider && !providersForService) {
    if (
      (/\bwho can do\b/i.test(lower) ||
        /\bwho (offers|performs)\b/i.test(lower) ||
        isWhoHasFreeSlotForServiceQuery(lower) ||
        isWhoIsDoingServiceQuery(lower)) &&
      service
    ) {
      const p: Record<string, any> = { serviceName: service.name };
      enrichParamsFromPrompt(p, input);
      applyServiceAssignmentDateMode(p, prompt);
      return buildServiceAssignmentIntent('providers_for_service', p);
    }
    if (isWhoHasFreeSlotForServiceQuery(lower)) {
      const p: Record<string, any> = {};
      enrichParamsFromPrompt(p, input);
      if (p.serviceName) {
        applyServiceAssignmentDateMode(p, prompt);
        return buildServiceAssignmentIntent('providers_for_service', p);
      }
    }
    return null;
  }

  if (servicesForProvider && employee) {
    return buildServiceAssignmentIntent('services_for_provider', {
      ...inheritSessionParams(input.sessionContext, ['employeeName']),
      employeeName: employee.name,
    });
  }

  if (providersForService && service) {
    const p: Record<string, any> = {};
    enrichParamsFromPrompt(p, input);
    p.serviceName = matchServiceInPrompt(prompt, services!)?.name ?? service.name;
    if (isTeamWideProviderAvailabilityQuery(prompt)) {
      p.employeeName = null;
    }
    applyServiceAssignmentDateMode(p, prompt);
    return buildServiceAssignmentIntent('providers_for_service', p);
  }

  return null;
}

function detectListTemplatesIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, templates } = input;
  const lower = prompt.toLowerCase();

  if (
    !/\b(templates?|schedule templates?)\b/i.test(lower) ||
    !/\b(list|show|what|available|which)\b/i.test(lower)
  ) {
    return null;
  }
  if (/\bapply\b/i.test(lower)) return null;

  const params: Record<string, any> = {};
  enrichParamsFromPrompt(params, input);

  if (!templates?.length) {
    return {
      action: 'list_templates',
      params,
      reasoning: 'List schedule templates (none configured)',
      confidence: 0.85,
    };
  }

  return {
    action: 'list_templates',
    params,
    reasoning: 'List schedule templates',
    confidence: 0.92,
  };
}

/** Run ordered heuristic detectors before LLM classification. */
export function runHeuristicIntentDetection(
  input: HeuristicDetectionInput,
): HeuristicIntent | null {
  const normalizedInput: HeuristicDetectionInput = {
    ...input,
    prompt: normalizeMultilingualPrompt(input.prompt),
  };

  const detectors = [
    detectFollowUpIntents,
    detectContextShiftIntent,
    detectWhoHasScheduleIntent,
    detectProviderAvailabilityIntent,
    detectLookupServiceAssignmentIntent,
    detectChangeBookingServiceIntent,
    detectDirectMutationIntents,
    detectListScheduleGapsIntent,
    detectLookupCustomerIntent,
    detectSummarizeWaitlistIntent,
    detectAppointmentAnalysisIntent,
    detectAnalyzeServicesIntent,
    detectSummarizeStaffIntent,
    detectSummarizeBookingsIntent,
    detectCustomerInsightsIntent,
    detectShowAppointmentsIntent,
    detectCheckAvailabilityIntent,
    detectSummarizeUtilizationIntent,
    detectSummarizeDayIntent,
    detectListServicesIntent,
    detectListEmployeesIntent,
    detectListTemplatesIntent,
    detectOrchestrationIntent,
  ];

  for (const detect of detectors) {
    const result = detect(normalizedInput);
    if (result) {
      enrichParamsFromPrompt(result.params, normalizedInput);
      return result;
    }
  }
  return null;
}
