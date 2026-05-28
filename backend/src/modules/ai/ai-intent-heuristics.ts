import { todayDisplay } from '../../common/utils/date-format.util.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';
import type { CustomerInsightMetric } from '../customer/customer.service.js';

export interface HeuristicIntent {
  action: string;
  params: Record<string, any>;
  reasoning: string;
  confidence: number;
}

export interface HeuristicDetectionInput {
  prompt: string;
  sessionContext?: Record<string, any>;
  employees: Array<{ id: string; name: string }>;
  customers?: Array<{ id: string; name: string }>;
  services?: Array<{ id: string; name: string }>;
}

const BOOKING_STATUS_ALIASES: Record<string, string> = {
  cancelled: 'cancelled',
  canceled: 'cancelled',
  'no-show': 'no_show',
  no_show: 'no_show',
  noshow: 'no_show',
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
  const lower = prompt.toLowerCase();
  for (const [alias, status] of Object.entries(BOOKING_STATUS_ALIASES)) {
    if (new RegExp(`\\b${alias.replace(/[-_]/g, '[\\s-_]?')}\\b`, 'i').test(lower)) {
      return status;
    }
  }
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
  if (/latest|last appointment/i.test(lower)) return 'latest';
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
    /how many|count|number of|total appointments|total bookings|summarize today|summarize.*for all providers/i.test(
      lower,
    )
  ) {
    return 'count';
  }
  if (/overview|summary|breakdown|stats/i.test(lower) && /\bappointments?\b|\bbookings?\b/i.test(lower)) {
    return 'overview';
  }
  return null;
}

export function resolveCustomerMetric(
  params: Record<string, any>,
  prompt: string,
): CustomerInsightMetric {
  const raw = params.customerMetric as string | undefined;
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
  if (raw && allowed.includes(raw as CustomerInsightMetric)) {
    return raw as CustomerInsightMetric;
  }

  const lower = prompt.toLowerCase();
  if (
    /paid the most|spent the most|top spenders?|highest spend|most paid|who paid|best payers?|customers? who paid/i.test(
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
  if (/best customer|top customer/i.test(lower) && !/paid|spend|spent|\$|revenue/i.test(lower)) {
    return 'vip';
  }
  if (/most booking|most appointment|books the most|frequent|top booker/i.test(lower)) {
    return 'most_bookings';
  }
  return 'overview';
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
      lastAction === 'summarize_day') &&
    /\b(book|schedule|add|create)\b/i.test(prompt) &&
    (/\bappointment\b|\bbooking\b/i.test(prompt) ||
      inherited.serviceName ||
      extractTimeSlotFromPrompt(prompt) ||
      input.services?.some((s) => prompt.toLowerCase().includes(s.name.toLowerCase())))
  ) {
    const params = { ...inherited };
    const service = input.services ? matchEntityInPrompt(prompt, input.services) : undefined;
    if (service) params.serviceName = service.name;
    const slot = extractTimeSlotFromPrompt(prompt);
    if (slot) params.timeSlot = slot;
    if (!params.date && !params.dateFrom) params.date = sessionContext?.date ?? todayDisplay();
    return {
      action: 'create_booking',
      params,
      reasoning: 'Follow-up — book after availability or appointment view',
      confidence: 0.93,
    };
  }

  if (
    (lastAction === 'show_appointments' ||
      lastAction === 'summarize_day' ||
      lastAction === 'summarize_bookings' ||
      lastAction === 'analyze_appointments') &&
    /\bcancel\b/i.test(prompt) &&
    (/\b(those|these|them|all|it)\b/i.test(prompt) || inherited.date || inherited.serviceName)
  ) {
    return {
      action: 'cancel_bookings',
      params: inherited,
      reasoning: 'Follow-up — cancel after viewing appointments',
      confidence: 0.92,
    };
  }

  if (
    (lastAction === 'show_appointments' || lastAction === 'summarize_day') &&
    /\b(move|reschedule|shift|change)\b/i.test(prompt)
  ) {
    const params = { ...inherited };
    const slot = extractTimeSlotFromPrompt(prompt);
    if (slot) params.timeSlot = slot;
    return {
      action: 'reschedule_booking',
      params,
      reasoning: 'Follow-up — reschedule after viewing appointments',
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
    (lastAction === 'summarize_bookings' || lastAction === 'analyze_appointments') &&
    /\b(who|which|what about|and)\b/i.test(prompt)
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
  const asksAboutDaysWithGaps =
    /\b(which|what)\s+(exact\s+)?days?\b/i.test(prompt) ||
    /\bdays?\s+(with|have|has|contain)\s+(gaps?|open|empty|free|unused)/i.test(prompt) ||
    /\b(gaps?|open\s+slots?|empty\s+slots?|unused\s+slots?)\s+(on\s+)?which\s+days?\b/i.test(prompt) ||
    (/\bgaps?\b/i.test(prompt) && /\b(which|what|when)\b/i.test(prompt));

  const asksWhoIsFree =
    /\bwho\s+(is|has|are)\s+(free|available|open)\b/i.test(prompt) ||
    /\b(free|available|open)\s+(slots?|times?)\b/i.test(prompt) ||
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
  if (employee) params.employeeName = employee.name;
  if (asksWhoIsFree && !employee && /all providers|everyone|all staff/i.test(prompt)) {
    params.allProviders = true;
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
    params.date = todayDisplay();
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
    /no[\s-]?show|at[\s-]?risk|vip|cancellation|cancelled|book(s|ed)? the most|most appointment|frequent|churn|inactive|haven't been|not been back|top customer|best customer|crm|segment|paid the most|spent the most|top spenders?|highest spend|most paid|new customers?|lapsed/i.test(
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
    /\b(show|list|display|see|view|what are|what's)\b/i.test(prompt) &&
    /\bappointments?\b|\bbookings?\b|\bschedule\b/i.test(prompt);

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

  if (!wantsList && !statusOnly && !customerAppts && !whatsComingUp) return null;

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
  if (sessionContext?.todayOnly && !params.date) params.date = todayDisplay();
  if (whatsComingUp && !params.date) {
    params.date = /\btomorrow\b/i.test(prompt) ? undefined : todayDisplay();
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

function detectCheckAvailabilityIntent(input: HeuristicDetectionInput): HeuristicIntent | null {
  const { prompt, sessionContext, employees } = input;
  const lower = prompt.toLowerCase();

  const wantsAvailability =
    /\b(available|availability|free slots?|open slots?|open times?|can (i|we) book)\b/i.test(
      lower,
    ) ||
    /\bwhat slots\b|\bwhich slots\b|\bwhen is .* free\b/i.test(lower) ||
    /\bschedule for\b/i.test(lower);

  if (!wantsAvailability) return null;
  if (/\b(show|list|cancel|how many)\b/i.test(lower) && !/\bavailable\b/i.test(lower)) return null;

  const params = inheritSessionParams(sessionContext, ['date', 'employeeName']);
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
    return {
      action: 'fill_unused_slots',
      params,
      reasoning: 'Fill unused schedule slots',
      confidence: 0.87,
    };
  }

  return null;
}

/** Run ordered heuristic detectors before LLM classification. */
export function runHeuristicIntentDetection(
  input: HeuristicDetectionInput,
): HeuristicIntent | null {
  const detectors = [
    detectFollowUpIntents,
    detectListScheduleGapsIntent,
    detectAppointmentAnalysisIntent,
    detectSummarizeBookingsIntent,
    detectCustomerInsightsIntent,
    detectShowAppointmentsIntent,
    detectCheckAvailabilityIntent,
    detectSummarizeUtilizationIntent,
    detectSummarizeDayIntent,
    detectListServicesIntent,
    detectOrchestrationIntent,
  ];

  for (const detect of detectors) {
    const result = detect(input);
    if (result) return result;
  }
  return null;
}
