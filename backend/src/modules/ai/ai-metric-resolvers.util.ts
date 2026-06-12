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

  const raw = params.customerMetric as string | undefined;
  if (raw && allowed.includes(raw as CustomerInsightMetric)) {
    return raw as CustomerInsightMetric;
  }
  return resolveCustomerMetricFromSemantic(prompt) ?? 'overview';
}
