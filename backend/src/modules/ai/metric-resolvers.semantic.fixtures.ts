import type { CommandSurface } from './ai-command-registry.types.js';
/** acc-3.14 — metric resolver semantic corpus. */
export const METRIC_RESOLVERS_SEMANTIC_PIPE_MARKER = 'acc-3.14';

export type MetricResolverKind =
  | 'booking'
  | 'staff'
  | 'service'
  | 'customer'
  | 'appointment';

export type MetricResolverSemanticScenario = {
  id: string;
  prompt: string;
  kind: MetricResolverKind;
  expectedMetric: string;
  surface?: CommandSurface;
  mustDetect: boolean;
};

export const METRIC_RESOLVER_POSITIVE_SCENARIOS: MetricResolverSemanticScenario[] =
  [
    {
      id: 'booking-revenue-today',
      prompt: 'Calculate total earnings for today',
      kind: 'booking',
      expectedMetric: 'revenue',
      mustDetect: true,
    },
    {
      id: 'booking-revenue-week',
      prompt: 'How much did we earn last month?',
      kind: 'booking',
      expectedMetric: 'revenue',
      mustDetect: true,
    },
    {
      id: 'booking-count-today',
      prompt: 'How many appointments do we have today?',
      kind: 'booking',
      expectedMetric: 'count',
      mustDetect: true,
    },
    {
      id: 'booking-upcoming',
      prompt: 'Summarize upcoming bookings for today',
      kind: 'booking',
      expectedMetric: 'upcoming',
      mustDetect: true,
    },
    {
      id: 'booking-busiest',
      prompt: 'Who is the busiest provider this week?',
      kind: 'booking',
      expectedMetric: 'busiest_provider',
      mustDetect: true,
    },
    {
      id: 'booking-no-shows',
      prompt: 'How many no-shows this month?',
      kind: 'booking',
      expectedMetric: 'no_shows',
      mustDetect: true,
    },
    {
      id: 'booking-cancelled',
      prompt: 'Summarize cancelled appointments today',
      kind: 'booking',
      expectedMetric: 'cancelled',
      mustDetect: true,
    },
    {
      id: 'booking-unpaid',
      prompt: 'List unpaid appointments this week',
      kind: 'booking',
      expectedMetric: 'unpaid',
      mustDetect: true,
    },
    {
      id: 'booking-overview',
      prompt: 'Give me a booking overview for today',
      kind: 'booking',
      expectedMetric: 'overview',
      mustDetect: true,
    },
    {
      id: 'staff-most-revenue',
      prompt: 'Top 5 specialists by revenue last month',
      kind: 'staff',
      expectedMetric: 'most_revenue',
      mustDetect: true,
    },
    {
      id: 'staff-busiest',
      prompt: 'Which stylist is busiest today?',
      kind: 'staff',
      expectedMetric: 'busiest',
      mustDetect: true,
    },
    {
      id: 'staff-most-bookings',
      prompt: 'Who has the most bookings this week?',
      kind: 'staff',
      expectedMetric: 'most_bookings',
      mustDetect: true,
    },
    {
      id: 'service-most-booked',
      prompt: 'What is the most popular service this month?',
      kind: 'service',
      expectedMetric: 'most_booked',
      mustDetect: true,
    },
    {
      id: 'service-top-revenue',
      prompt: 'Which service earned the most revenue last week?',
      kind: 'service',
      expectedMetric: 'top_revenue',
      mustDetect: true,
    },
    {
      id: 'service-least-booked',
      prompt: 'What is the least booked service?',
      kind: 'service',
      expectedMetric: 'least_booked',
      mustDetect: true,
    },
    {
      id: 'customer-no-shows',
      prompt: 'Find customers with the most no-shows',
      kind: 'customer',
      expectedMetric: 'most_no_shows',
      mustDetect: true,
    },
    {
      id: 'customer-at-risk',
      prompt: 'Re-engage inactive customers',
      kind: 'customer',
      expectedMetric: 'at_risk',
      mustDetect: true,
    },
    {
      id: 'customer-top-spenders',
      prompt: 'Who are our top spenders this year?',
      kind: 'customer',
      expectedMetric: 'top_spenders',
      mustDetect: true,
    },
    {
      id: 'customer-new',
      prompt: 'Show new customers from last month',
      kind: 'customer',
      expectedMetric: 'new_customers',
      mustDetect: true,
    },
    {
      id: 'customer-vip',
      prompt: 'List VIP loyal customers',
      kind: 'customer',
      expectedMetric: 'vip',
      mustDetect: true,
    },
    {
      id: 'appointment-most-expensive',
      prompt: 'Which appointment was the most expensive today?',
      kind: 'appointment',
      expectedMetric: 'most_expensive',
      mustDetect: true,
    },
    {
      id: 'appointment-longest',
      prompt: 'Show the longest appointment this week',
      kind: 'appointment',
      expectedMetric: 'longest',
      mustDetect: true,
    },
    {
      id: 'appointment-earliest',
      prompt: 'What is the earliest appointment tomorrow?',
      kind: 'appointment',
      expectedMetric: 'earliest',
      mustDetect: true,
    },
    {
      id: 'hy-booking-revenue',
      prompt: 'Օրվա ընդհանուր եկամուտը',
      kind: 'booking',
      expectedMetric: 'revenue',
      mustDetect: true,
    },
    {
      id: 'ru-booking-revenue',
      prompt: 'Сколько мы заработали за сегодня?',
      kind: 'booking',
      expectedMetric: 'revenue',
      mustDetect: true,
    },
  ];

export const METRIC_RESOLVER_NEGATIVE_SCENARIOS: MetricResolverSemanticScenario[] =
  [
    {
      id: 'booking-not-metric',
      prompt: 'book massage with any provider tomorrow',
      kind: 'booking',
      expectedMetric: 'revenue',
      mustDetect: false,
    },
    {
      id: 'staff-not-recommend',
      prompt: 'suggest top specialists for haircut on Monday',
      kind: 'staff',
      expectedMetric: 'most_revenue',
      mustDetect: false,
    },
  ];

export const METRIC_RESOLVER_SEMANTIC_SCENARIOS: MetricResolverSemanticScenario[] =
  [
    ...METRIC_RESOLVER_POSITIVE_SCENARIOS,
    ...METRIC_RESOLVER_NEGATIVE_SCENARIOS,
  ];
