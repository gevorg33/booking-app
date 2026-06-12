import type { CommandSurface } from './ai-command-registry.types.js';
import { EXPLAIN_TOUR_CALENDAR_SPAN_PROMPTS } from './ai-tour-calendar-span.fixtures.js';
import { LIST_TOUR_CALENDAR_WEEK_PROMPTS } from './ai-tour-calendar-week.fixtures.js';
import { PROVIDER_REVENUE_SCENARIOS } from './ai-dashboard-ops.fixtures.js';
import {
  TOP_SPECIALIST_REVENUE_SCENARIOS,
  TOTAL_EARNINGS_SCENARIOS,
} from './dashboard-revenue-analytics.fixtures.js';
import {
  CONFIGURE_RECOMMENDATION_PRODUCT_PROMPTS,
  EXPLAIN_RECOMMENDATION_SETUP_PROMPTS,
  LINK_RECOMMENDED_PRODUCTS_PROMPTS,
} from './ai-recommendation-product.fixtures.js';

/** pipe-1.5.3 / acc-2.8 — domain prompts semantic must not steal into core booking/schedule intents. */
export const SEMANTIC_STEAL_GUARD_PIPE_MARKER = 'pipe-1.5.3';

export type SemanticStealGuardDomain =
  | 'tour_calendar'
  | 'provider_stats'
  | 'recommendation';

export type SemanticStealGuardScenario = {
  id: string;
  domain: SemanticStealGuardDomain;
  prompt: string;
  surface: CommandSurface;
  expectedAction: string;
  rescueReason?: string;
};

function tourCalendarScenarios(): SemanticStealGuardScenario[] {
  const span = EXPLAIN_TOUR_CALENDAR_SPAN_PROMPTS.slice(0, 6).map((entry) => ({
    id: `tour-span-${entry.id}`,
    domain: 'tour_calendar' as const,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    expectedAction: 'explain_tour_calendar_span',
    rescueReason: 'explain_tour_calendar_span',
  }));
  const week = LIST_TOUR_CALENDAR_WEEK_PROMPTS.slice(0, 6).map((entry) => ({
    id: `tour-week-${entry.id}`,
    domain: 'tour_calendar' as const,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    expectedAction: 'list_tour_calendar_week',
    rescueReason: 'list_tour_calendar_week',
  }));
  return [...span, ...week];
}

function providerStatsScenarios(): SemanticStealGuardScenario[] {
  const revenue = PROVIDER_REVENUE_SCENARIOS.map((entry) => ({
    id: `provider-revenue-${entry.id}`,
    domain: 'provider_stats' as const,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    expectedAction: entry.expectedAction,
    rescueReason: entry.rescueReason,
  }));
  const topStaff = TOP_SPECIALIST_REVENUE_SCENARIOS.slice(0, 4).map((entry) => ({
    id: `top-staff-${entry.id}`,
    domain: 'provider_stats' as const,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    expectedAction: 'summarize_staff',
    rescueReason: 'top_staff_revenue',
  }));
  const totals = TOTAL_EARNINGS_SCENARIOS.slice(0, 2).map((entry) => ({
    id: `total-earnings-${entry.id}`,
    domain: 'provider_stats' as const,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    expectedAction: 'summarize_bookings',
    rescueReason: 'total_earnings',
  }));
  return [...revenue, ...topStaff, ...totals];
}

function recommendationScenarios(): SemanticStealGuardScenario[] {
  const configure = CONFIGURE_RECOMMENDATION_PRODUCT_PROMPTS.slice(0, 4).map(
    (entry) => ({
      id: `rec-configure-${entry.id}`,
      domain: 'recommendation' as const,
      prompt: entry.prompt,
      surface: 'dashboard' as const,
      expectedAction: 'configure_recommendation_product',
      rescueReason: 'configure_recommendation_product',
    }),
  );
  const link = LINK_RECOMMENDED_PRODUCTS_PROMPTS.slice(0, 4).map((entry) => ({
    id: `rec-link-${entry.id}`,
    domain: 'recommendation' as const,
    prompt: entry.prompt,
    surface: 'dashboard' as const,
    expectedAction: 'link_recommended_products',
    rescueReason: 'link_recommended_products',
  }));
  const explain = EXPLAIN_RECOMMENDATION_SETUP_PROMPTS.slice(0, 4).map(
    (entry) => ({
      id: `rec-explain-${entry.id}`,
      domain: 'recommendation' as const,
      prompt: entry.prompt,
      surface: 'dashboard' as const,
      expectedAction: 'explain_recommendation_setup',
      rescueReason: 'explain_recommendation_setup',
    }),
  );
  return [...configure, ...link, ...explain];
}

export const SEMANTIC_STEAL_GUARD_SCENARIOS: SemanticStealGuardScenario[] = [
  ...tourCalendarScenarios(),
  ...providerStatsScenarios(),
  ...recommendationScenarios(),
];

export const SEMANTIC_STEAL_GUARD_SCENARIOS_BY_DOMAIN: Record<
  SemanticStealGuardDomain,
  SemanticStealGuardScenario[]
> = {
  tour_calendar: SEMANTIC_STEAL_GUARD_SCENARIOS.filter(
    (scenario) => scenario.domain === 'tour_calendar',
  ),
  provider_stats: SEMANTIC_STEAL_GUARD_SCENARIOS.filter(
    (scenario) => scenario.domain === 'provider_stats',
  ),
  recommendation: SEMANTIC_STEAL_GUARD_SCENARIOS.filter(
    (scenario) => scenario.domain === 'recommendation',
  ),
};

/** Core semantic intents that must not absorb specialized domain prompts. */
export const SEMANTIC_STEAL_FORBIDDEN_ACTIONS = [
  'create_booking',
  'book_nearest_slot',
  'check_providers_for_service',
  'create_direct_schedule',
] as const;
