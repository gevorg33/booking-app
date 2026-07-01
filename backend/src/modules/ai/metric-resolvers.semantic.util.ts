import type { CommandSurface } from './ai-command-registry.types.js';
import type { CustomerInsightMetric } from '../customer/customer.service.js';
import {
  buildSemanticMatchFromAnchor,
  filterAnchorsForSurface,
  rankAnchorsDeterministic,
  resolveSemanticMatch,
  SEMANTIC_CONCEPT_THRESHOLD,
} from './ai-semantic-intent.util.js';
import { buildCanonicalPhrasingBank } from './intent-phrasing-bank.util.js';
import { METRIC_RESOLVERS_SEMANTIC_PIPE_MARKER } from './metric-resolvers.semantic.fixtures.js';
import type {
  ServiceInsightMetric,
  StaffInsightMetric,
} from './ai-metric-resolvers.util.js';

export { METRIC_RESOLVERS_SEMANTIC_PIPE_MARKER };

const BOOKING_METRIC_LANGUAGE: Partial<
  Record<
    NonNullable<ReturnType<typeof resolveBookingMetricFromSemantic>>,
    RegExp
  >
> = {
  no_shows: /\bno[-\s]?shows?\b/i,
  cancelled: /\bcancel(?:led|ed)?\b/i,
  unpaid: /\bunpaid\b|\bnot\s+paid\b/i,
  revenue:
    /\b(revenue|earnings|earn|earned|income|sales|money|ekamut|yndhanur|եկամուտ|ընդհանուր|zarabot|заработ|выручк|доход|vyruchk|dohod|skolko)\b/i,
  upcoming: /\bupcoming\b|\bcoming\b/i,
  busiest_provider: /\bbusiest\b|\bmost\s+booked\b/i,
  overview: /\boverview\b|\bsummary\b|\bbreakdown\b/i,
};

function bookingMetricSupportedByPrompt(
  metric: string,
  prompt: string,
  anchorId?: string,
): boolean {
  const pattern =
    BOOKING_METRIC_LANGUAGE[metric as keyof typeof BOOKING_METRIC_LANGUAGE];
  if (!pattern) return true;
  if (pattern.test(prompt)) return true;
  if (
    metric === 'revenue' &&
    anchorId != null &&
    anchorId.includes('metric-booking-revenue')
  ) {
    return true;
  }
  return false;
}

function filterMetricSemanticMatch(
  prompt: string,
  match: ReturnType<typeof resolveSemanticMatch>,
): ReturnType<typeof resolveSemanticMatch> {
  if (!match?.paramHints) return match;
  const bookingMetric = match.paramHints.bookingMetric;
  if (
    typeof bookingMetric === 'string' &&
    !bookingMetricSupportedByPrompt(bookingMetric, prompt, match.anchorId)
  ) {
    return null;
  }
  return match;
}

const METRIC_PARAM_KEYS = [
  'bookingMetric',
  'staffMetric',
  'serviceMetric',
  'customerMetric',
  'appointmentMetric',
] as const;

type MetricParamKey = (typeof METRIC_PARAM_KEYS)[number];

const DEFAULT_METRIC_RESOLVER_SURFACES = [
  'dashboard',
  'customer',
  'public',
] as const satisfies readonly CommandSurface[];

function metricResolverAnchors(surface: CommandSurface) {
  return filterAnchorsForSurface(
    buildCanonicalPhrasingBank([]),
    surface,
  ).filter((anchor) =>
    METRIC_PARAM_KEYS.some((key) => anchor.paramHints?.[key] != null),
  );
}

export function resolveMetricSemanticParamHints(
  prompt: string,
  surface: CommandSurface = 'dashboard',
): Partial<Record<MetricParamKey, string>> | null {
  const trimmed = prompt.trim();
  if (!trimmed) return null;

  const anchors = metricResolverAnchors(surface);
  if (!anchors.length) return null;

  const ranked = rankAnchorsDeterministic(trimmed, anchors);
  let match = resolveSemanticMatch(ranked, {
    threshold: SEMANTIC_CONCEPT_THRESHOLD,
  });
  if (
    !match &&
    ranked[0] &&
    ranked[0].score >= SEMANTIC_CONCEPT_THRESHOLD &&
    METRIC_PARAM_KEYS.some((key) => ranked[0].anchor.paramHints?.[key] != null)
  ) {
    match = buildSemanticMatchFromAnchor(ranked[0].anchor, ranked[0].score);
  }
  match = filterMetricSemanticMatch(trimmed, match);
  if (!match) {
    for (const candidate of ranked) {
      if (candidate.score < SEMANTIC_CONCEPT_THRESHOLD) continue;
      const retry = filterMetricSemanticMatch(
        trimmed,
        buildSemanticMatchFromAnchor(candidate.anchor, candidate.score),
      );
      if (retry) {
        match = retry;
        break;
      }
    }
  }
  if (!match?.paramHints) return null;

  const hints: Partial<Record<MetricParamKey, string>> = {};
  for (const key of METRIC_PARAM_KEYS) {
    const value = match.paramHints[key];
    if (typeof value === 'string' && value.length) {
      hints[key] = value;
    }
  }
  return Object.keys(hints).length ? hints : null;
}

export function resolveBookingMetricFromSemantic(
  prompt: string,
  surface: CommandSurface = 'dashboard',
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
  const metric = resolveMetricSemanticParamHints(
    prompt,
    surface,
  )?.bookingMetric;
  const allowed = [
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
  ] as const;
  return allowed.includes(metric as (typeof allowed)[number])
    ? (metric as (typeof allowed)[number])
    : null;
}

export function resolveStaffMetricFromSemantic(
  prompt: string,
  surface: CommandSurface = 'dashboard',
): StaffInsightMetric | null {
  const metric = resolveMetricSemanticParamHints(prompt, surface)?.staffMetric;
  const allowed: StaffInsightMetric[] = [
    'busiest',
    'most_revenue',
    'most_bookings',
    'overview',
  ];
  return allowed.includes(metric as StaffInsightMetric)
    ? (metric as StaffInsightMetric)
    : null;
}

export function resolveServiceMetricFromSemantic(
  prompt: string,
  surface: CommandSurface = 'dashboard',
): ServiceInsightMetric | null {
  const metric = resolveMetricSemanticParamHints(
    prompt,
    surface,
  )?.serviceMetric;
  const allowed: ServiceInsightMetric[] = [
    'most_booked',
    'top_revenue',
    'least_booked',
    'overview',
  ];
  return allowed.includes(metric as ServiceInsightMetric)
    ? (metric as ServiceInsightMetric)
    : null;
}

export function resolveCustomerMetricFromSemantic(
  prompt: string,
  surface: CommandSurface = 'dashboard',
): CustomerInsightMetric | null {
  const metric = resolveMetricSemanticParamHints(
    prompt,
    surface,
  )?.customerMetric;
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
  return allowed.includes(metric as CustomerInsightMetric)
    ? (metric as CustomerInsightMetric)
    : null;
}

export function resolveAppointmentMetricFromSemantic(
  prompt: string,
  surface: CommandSurface = 'dashboard',
): 'most_expensive' | 'longest' | 'shortest' | 'earliest' | 'latest' | null {
  const metric = resolveMetricSemanticParamHints(
    prompt,
    surface,
  )?.appointmentMetric;
  const allowed = [
    'most_expensive',
    'longest',
    'shortest',
    'earliest',
    'latest',
  ] as const;
  return allowed.includes(metric as (typeof allowed)[number])
    ? (metric as (typeof allowed)[number])
    : null;
}

export function impliesMetricFromSemantic(
  prompt: string,
  surfaces: readonly CommandSurface[] = DEFAULT_METRIC_RESOLVER_SURFACES,
): boolean {
  return surfaces.some(
    (surface) => resolveMetricSemanticParamHints(prompt, surface) != null,
  );
}
