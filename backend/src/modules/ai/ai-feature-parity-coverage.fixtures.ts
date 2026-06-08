import type { AiTraceAnalyticsRow } from './ai-command-trace.util.js';

export const AI_PARITY_COVERAGE_TRACE_FIXTURES: AiTraceAnalyticsRow[] = [
  {
    traceId: 'trace-billing-1',
    surface: 'dashboard',
    locale: 'en',
    action: 'summarize_day',
    outcome: 'executed',
    confidence: 0.9,
    failureSignal: null,
    feedbackRating: null,
    correctedAction: null,
    rawPrompt: 'how is today',
    createdAt: new Date('2026-06-01T10:00:00Z'),
  },
  {
    traceId: 'trace-billing-2',
    surface: 'dashboard',
    locale: 'en',
    action: 'summarize_day',
    outcome: 'executed',
    confidence: 0.88,
    failureSignal: null,
    feedbackRating: null,
    correctedAction: null,
    rawPrompt: 'today summary',
    createdAt: new Date('2026-06-02T10:00:00Z'),
  },
  {
    traceId: 'trace-customers-1',
    surface: 'dashboard',
    locale: 'en',
    action: 'summarize_customers',
    outcome: 'failed',
    confidence: 0.4,
    failureSignal: 'suspected_miss',
    feedbackRating: 'down',
    correctedAction: null,
    rawPrompt: 'summarize customers',
    createdAt: new Date('2026-06-03T10:00:00Z'),
  },
  {
    traceId: 'trace-book-1',
    surface: 'customer',
    locale: 'en',
    action: 'book_package',
    outcome: 'executed',
    confidence: 0.95,
    failureSignal: null,
    feedbackRating: null,
    correctedAction: null,
    rawPrompt: 'book package',
    createdAt: new Date('2026-06-04T10:00:00Z'),
  },
];

export const AI_PARITY_COVERAGE_ANALYTICS_FIXTURES = [
  {
    appSurface: 'dashboard_web' as const,
    screenOrRoute: '/dashboard/billing',
    eventCount: 420,
  },
  {
    appSurface: 'dashboard_web' as const,
    screenOrRoute: '/dashboard/adoption',
    eventCount: 180,
  },
  {
    appSurface: 'dashboard_web' as const,
    screenOrRoute: '/dashboard/customers',
    eventCount: 950,
  },
  {
    appSurface: 'consumer_app' as const,
    screenOrRoute: '/s/:slug/services',
    eventCount: 1200,
  },
] as const;

export const AI_PARITY_COVERAGE_SCENARIOS = [
  {
    id: 'billing-covered-with-analytics',
    featureId: 'dashboard.nav.billing',
    tier: 'owner' as const,
    surface: 'dashboard' as const,
    expectUncovered: false,
  },
  {
    id: 'route-calendar-covered',
    featureId: 'dashboard.route.calendar',
    tier: 'staff' as const,
    surface: 'dashboard' as const,
    expectUncovered: false,
  },
] as const;
