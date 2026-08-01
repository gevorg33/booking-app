/**
 * Metric param resolution — semantic anchors (acc-3.14); classifier params override.
 */
import type { CustomerInsightMetric } from '../customer/customer.service.js';
import {
  resolveAppointmentMetricFromSemantic,
  resolveBookingMetricFromSemantic,
  resolveCustomerMetricFromSemantic,
  resolveServiceMetricFromSemantic,
  resolveStaffMetricFromSemantic,
} from './metric-resolvers.semantic.util.js';
import { isUnscopedBookingCountPrompt } from './ai-unscoped-booking-count.util.js';

export type ServiceInsightMetric =
  | 'most_booked'
  | 'top_revenue'
  | 'least_booked'
  | 'overview';
export type StaffInsightMetric =
  | 'busiest'
  | 'most_revenue'
  | 'most_bookings'
  | 'overview';

export function resolveServiceMetric(
  params: Record<string, any>,
  prompt: string,
): ServiceInsightMetric {
  const raw = params.serviceMetric as string | undefined;
  const allowed: ServiceInsightMetric[] = [
    'most_booked',
    'top_revenue',
    'least_booked',
    'overview',
  ];
  if (raw && allowed.includes(raw as ServiceInsightMetric)) {
    return raw as ServiceInsightMetric;
  }
  return resolveServiceMetricFromSemantic(prompt) ?? 'overview';
}

export function resolveStaffMetric(
  params: Record<string, any>,
  prompt: string,
): StaffInsightMetric {
  const raw = params.staffMetric as string | undefined;
  const allowed: StaffInsightMetric[] = [
    'busiest',
    'most_revenue',
    'most_bookings',
    'overview',
  ];
  if (raw && allowed.includes(raw as StaffInsightMetric)) {
    return raw as StaffInsightMetric;
  }
  return resolveStaffMetricFromSemantic(prompt) ?? 'overview';
}

export function resolveAppointmentMetric(
  params: Record<string, any>,
  prompt: string,
): 'most_expensive' | 'longest' | 'shortest' | 'earliest' | 'latest' | null {
  type AppointmentMetric =
    | 'most_expensive'
    | 'longest'
    | 'shortest'
    | 'earliest'
    | 'latest';
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
  return resolveAppointmentMetricFromSemantic(prompt);
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
  // e2e-bug.154 — "how many bookings in total?" is a count, not today's overview.
  if (isUnscopedBookingCountPrompt(prompt)) {
    return 'count';
  }
  const raw = params.bookingMetric as string | undefined;
  if (raw && allowed.includes(raw as BookingMetric)) {
    return raw as BookingMetric;
  }
  return resolveBookingMetricFromSemantic(prompt);
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

  // e2e-bug.153 — "How many customers do I have?" must use overview's
  // totalCustomers, never a ranked metric whose row count looks like a total.
  // Runs before trusting classifier params (which often default to most_no_shows).
  if (isUnscopedCustomerCountPrompt(prompt)) {
    return 'overview';
  }

  // e2e-bug.155 — unqualified cancellation totals need overview aggregates,
  // not a per-customer ranking (most_cancellations) that omits the total.
  if (isCustomerCancellationTotalPrompt(prompt)) {
    return 'overview';
  }
  if (isCustomerMostCancellationsPrompt(prompt)) {
    return 'most_cancellations';
  }
  // e2e-bug.137 — "customer retention rate" has no real react_agent tool;
  // the same repeat-visit data already lives in getCustomerInsights.
  if (isCustomerRetentionRatePrompt(prompt)) {
    return 'retention';
  }

  const raw = params.customerMetric as string | undefined;
  if (raw && allowed.includes(raw as CustomerInsightMetric)) {
    return raw as CustomerInsightMetric;
  }
  return resolveCustomerMetricFromSemantic(prompt) ?? 'overview';
}

/**
 * e2e-bug.153 — unqualified customer roster totals.
 * Must not match ranking/segment asks ("which customers…", "most no-shows", VIP, etc.).
 */
export function isUnscopedCustomerCountPrompt(prompt: string): boolean {
  if (!/\b(customers?|clients?)\b/i.test(prompt)) return false;
  if (/\b(which|who)\b/i.test(prompt)) return false;
  if (
    /\b(no[- ]?shows?|cancellations?|spenders?|at[- ]?risk|inactive|lapsed|vip|new)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  return (
    /\b(how\s+many|count|number of)\s+(customers?|clients?)\b/i.test(prompt) ||
    /\b(total\s+(number\s+of\s+)?(customers?|clients?)|(customers?|clients?)\s+in\s+total)\b/i.test(
      prompt,
    )
  );
}

/** Rescue wrong/unknown actions into summarize_customers overview for roster totals. */
export function rescueUnscopedCustomerCountIntent(
  prompt: string,
  action: string,
): {
  action: 'summarize_customers';
  customerMetric: 'overview';
  rescueReason: 'unscoped_customer_count';
} | null {
  if (!isUnscopedCustomerCountPrompt(prompt)) return null;
  const steerable = new Set([
    'unknown',
    'summarize_customers',
    'list_customers',
    'react_agent',
    'show_appointments',
    'list_bookings',
    'my_appointments',
  ]);
  if (!steerable.has(action)) return null;
  return {
    action: 'summarize_customers',
    customerMetric: 'overview',
    rescueReason: 'unscoped_customer_count',
  };
}

/** "How many cancellations have I had in total?" → overview (has totalCancellations). */
export function isCustomerCancellationTotalPrompt(prompt: string): boolean {
  if (!/\bcancellations?\b/i.test(prompt)) return false;
  if (isCustomerMostCancellationsPrompt(prompt)) return false;
  return (
    /\b(how\s+many|total|in\s+total|altogether|overall|across\s+all)\b/i.test(
      prompt,
    ) || /\bhave\s+i\s+had\b/i.test(prompt)
  );
}

/** "Which customers have the most cancellations" → ranking metric. */
export function isCustomerMostCancellationsPrompt(prompt: string): boolean {
  return (
    /\bcancellations?\b/i.test(prompt) &&
    /\b(which|who|most|top)\b/i.test(prompt)
  );
}

/**
 * e2e-bug.137 — "What is my customer retention rate?" / "How many customers
 * are returning?". No dashboard action or react_agent tool ever answered this;
 * getCustomerInsights already tracks repeat-visit counts per customer.
 */
export function isCustomerRetentionRatePrompt(prompt: string): boolean {
  return (
    /\bretention\b/i.test(prompt) ||
    /\b(returning|repeat)\s+customers?\b/i.test(prompt) ||
    /\bcustomers?\s+(coming|come)\s+back\b/i.test(prompt)
  );
}

/** Rescue wrong/unknown actions into summarize_customers for retention-rate asks. */
export function rescueCustomerRetentionRateIntent(
  prompt: string,
  action: string,
): {
  action: 'summarize_customers';
  customerMetric: 'retention';
  rescueReason: 'customer_retention_rate';
} | null {
  if (!isCustomerRetentionRatePrompt(prompt)) return null;
  const steerable = new Set([
    'unknown',
    'summarize_customers',
    'list_customers',
    'react_agent',
  ]);
  if (!steerable.has(action)) return null;
  return {
    action: 'summarize_customers',
    customerMetric: 'retention',
    rescueReason: 'customer_retention_rate',
  };
}
