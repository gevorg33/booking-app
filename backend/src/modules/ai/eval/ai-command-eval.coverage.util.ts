import type { CommandSurface } from '../ai-command-registry.types.js';
import type {
  AiCommandEvalCase,
  AiEvalCorpusTag,
  AiEvalDifficulty,
  AiEvalLocale,
} from './ai-command-eval.types.js';

/** acc-2.3 — core product domains that must stay balanced in the eval set. */
export const ACC_EVAL_CORE_DOMAINS = [
  'booking',
  'catalog',
  'schedule',
  'payments',
  'gift',
  'crm',
  'integrations',
] as const;

export type AiEvalCoreDomain = (typeof ACC_EVAL_CORE_DOMAINS)[number];

export const ACC_EVAL_MIN_TOTAL_CASES = 2000;
export const ACC_EVAL_MIN_PER_CORE_DOMAIN = 180;
export const ACC_EVAL_MIN_LOCALES = ['en', 'hy', 'ru'] as const satisfies readonly AiEvalLocale[];
export const ACC_EVAL_MIN_SURFACES = [
  'dashboard',
  'provider',
  'customer',
  'public',
] as const satisfies readonly CommandSurface[];
export const ACC_EVAL_MIN_DIFFICULTIES = [
  'easy',
  'medium',
  'hard',
] as const satisfies readonly AiEvalDifficulty[];

export const ACC_EVAL_MIN_HARD_CASES = 360;

export interface AiEvalCoverageBucket {
  key: string;
  total: number;
}

export interface AiEvalCoverageReport {
  totalCases: number;
  taggedCases: number;
  byDomain: AiEvalCoverageBucket[];
  bySurface: AiEvalCoverageBucket[];
  byLocale: AiEvalCoverageBucket[];
  byDifficulty: AiEvalCoverageBucket[];
  coreDomainCounts: Record<AiEvalCoreDomain, number>;
  balanceFailures: string[];
  balancePassed: boolean;
}

function collectActionTokens(evalCase: AiCommandEvalCase): string[] {
  const { expect } = evalCase;
  const tokens = [
    expect.rescuedAction,
    expect.action,
    ...(expect.compoundSteps ?? []),
    ...(expect.compoundActionsContains ?? []),
  ].filter((value): value is string => typeof value === 'string');
  return tokens.map((value) => value.toLowerCase());
}

function matchesAny(haystack: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(haystack));
}

function inferDomainFromActions(actions: string[]): AiEvalCoreDomain | 'clinic' | 'compliance' {
  const joined = actions.join(' ');
  if (
    matchesAny(joined, [
      /^security_blocked$/,
      /configure_zendesk|contact_support|webhook|zapier|integration|sync_/,
    ])
  ) {
    return 'integrations';
  }
  if (matchesAny(joined, [/gift_card|gift card|physical_gift|gift fulfillment/])) {
    return 'gift';
  }
  if (
    matchesAny(joined, [
      /clinic|test_order|test_result|patient_chart|specimen|lab_booking|lab_collection|phi_guard/,
    ])
  ) {
    return 'clinic';
  }
  if (
    matchesAny(joined, [
      /compliance|hipaa|gdpr|privacy|breach|consent|retention|data_rights|phi_encryption/,
    ])
  ) {
    return 'compliance';
  }
  if (
    matchesAny(joined, [
      /tag_customer|lookup_customer|list_inactive|loyalty|customer_subscription|discover_packages|crm/,
    ])
  ) {
    return 'crm';
  }
  if (
    matchesAny(joined, [
      /bulk_create_catalog|create_package|list_packages|create_service|list_services|subscription_plan|localized_name|recommendation_product|configure_recommendation|link_recommended|tour_service|create_product|list_products|catalog/,
    ])
  ) {
    return 'catalog';
  }
  if (
    matchesAny(joined, [
      /clear_schedule|create_resource|resource_assignment|package_line_availability|block_time|working_hours|shift|schedule/,
    ])
  ) {
    return 'schedule';
  }
  if (
    matchesAny(joined, [
      /mark_paid|summarize_unpaid|payment|revenue|tax|currency|stripe|checkout|cash|invoice|earnings|unpaid|collect_cash/,
    ])
  ) {
    return 'payments';
  }
  if (
    matchesAny(joined, [
      /book_|booking|appointment|waitlist|reschedule|cancel_|check_providers|check_availability|nearest_slot|show_appointments|list_my_appointments|package_visit|assign_booking/,
    ])
  ) {
    return 'booking';
  }
  return 'booking';
}

function inferDomainFromPrompt(prompt: string): AiEvalCoreDomain | 'clinic' | 'compliance' {
  const lower = prompt.toLowerCase();
  if (matchesAny(lower, [/zendesk|webhook|zapier|integration|contact support|export client|system prompt|ignore previous/])) {
    return 'integrations';
  }
  if (matchesAny(lower, [/gift card|gift certificate|physical gift/])) {
    return 'gift';
  }
  if (matchesAny(lower, [/lab test|specimen|patient chart|test result|test order|clinic/])) {
    return 'clinic';
  }
  if (matchesAny(lower, [/hipaa|gdpr|privacy|breach|consent|retention|compliance/])) {
    return 'compliance';
  }
  if (matchesAny(lower, [/tag .* vip|inactive customer|loyalty points|customer profile|lookup customer/])) {
    return 'crm';
  }
  if (matchesAny(lower, [/create category|list packages|subscription plan|catalog|service translation|recommendation product/])) {
    return 'catalog';
  }
  if (matchesAny(lower, [/clear .* schedule|resource assignment|working hours|block time|shift/])) {
    return 'schedule';
  }
  if (matchesAny(lower, [/unpaid|mark .* paid|revenue|tax rate|currency|stripe|checkout|cash payment|invoice/])) {
    return 'payments';
  }
  return 'booking';
}

function inferDomainFromId(id: string): AiEvalCoreDomain | 'clinic' | 'compliance' | null {
  if (id.startsWith('adv-') || id.startsWith('integrations-')) return 'integrations';
  if (id.startsWith('gift-') || id.includes('gift-card')) return 'gift';
  if (id.includes('clinic') || id.includes('lab-booking') || id.includes('test-order')) {
    return 'clinic';
  }
  if (id.includes('compliance') || id.includes('hipaa') || id.includes('phi-guard')) {
    return 'compliance';
  }
  if (id.includes('crm') || id.includes('customer-tax') || id.includes('inactive-customer')) {
    return 'crm';
  }
  if (
    id.includes('catalog') ||
    id.includes('package-localized') ||
    id.includes('recommendation') ||
    id.includes('tour-service') ||
    id.includes('bulk-create')
  ) {
    return 'catalog';
  }
  if (id.includes('schedule') || id.includes('clear-schedule') || id.includes('resource')) {
    return 'schedule';
  }
  if (
    id.includes('payment') ||
    id.includes('currency') ||
    id.includes('tax') ||
    id.includes('stripe') ||
    id.includes('revenue') ||
    id.includes('checkout')
  ) {
    return 'payments';
  }
  if (
    id.includes('check-book') ||
    id.includes('flexible-booking') ||
    id.includes('booking') ||
    id.includes('compound') ||
    id.includes('disambiguation')
  ) {
    return 'booking';
  }
  return null;
}

export function inferEvalCaseDomain(evalCase: AiCommandEvalCase): string {
  if (evalCase.domain) return evalCase.domain;
  const fromId = inferDomainFromId(evalCase.id);
  if (fromId) return fromId;
  const fromActions = inferDomainFromActions(collectActionTokens(evalCase));
  if (fromActions !== 'booking') return fromActions;
  return inferDomainFromPrompt(evalCase.prompt);
}

export function inferEvalCaseSurface(evalCase: AiCommandEvalCase): CommandSurface {
  if (evalCase.surface) return evalCase.surface;
  if (evalCase.expect.compoundSurface) return evalCase.expect.compoundSurface;
  const id = evalCase.id.toLowerCase();
  if (id.includes('-public-') || id.startsWith('public-')) return 'public';
  if (id.includes('-provider-') || id.startsWith('provider-')) return 'provider';
  if (id.includes('-customer-') || id.startsWith('customer-')) return 'customer';
  if (id.includes('consumer-')) return 'customer';
  return 'dashboard';
}

export function inferEvalCaseLocale(evalCase: AiCommandEvalCase): AiEvalLocale {
  return evalCase.locale ?? 'en';
}

export function inferEvalCaseDifficulty(evalCase: AiCommandEvalCase): AiEvalDifficulty {
  if (evalCase.difficulty) return evalCase.difficulty;
  if (evalCase.expect.securityBlocked) return 'adversarial';
  if (evalCase.expect.compoundExpectEmpty) return 'ambiguity';
  if (evalCase.corpus === 'typo') return 'medium';
  if (evalCase.corpus === 'adversarial') return 'adversarial';
  if (evalCase.corpus === 'ambiguity') return 'ambiguity';
  if (evalCase.corpus === 'harvested') return 'hard';
  if (
    evalCase.expect.compoundSteps?.length ||
    evalCase.expect.compoundActionsContains?.length ||
    evalCase.expect.routeTier === 'compound'
  ) {
    return 'hard';
  }
  if (evalCase.expect.rescueFromAction || evalCase.expect.needsMultilingual) {
    return 'medium';
  }
  return 'easy';
}

export function inferEvalCaseCorpus(evalCase: AiCommandEvalCase): AiEvalCorpusTag {
  return evalCase.corpus ?? 'golden';
}

export function normalizeEvalCaseTags(evalCase: AiCommandEvalCase): AiCommandEvalCase {
  return {
    ...evalCase,
    domain: inferEvalCaseDomain(evalCase),
    surface: inferEvalCaseSurface(evalCase),
    locale: inferEvalCaseLocale(evalCase),
    difficulty: inferEvalCaseDifficulty(evalCase),
    corpus: inferEvalCaseCorpus(evalCase),
  };
}

function bucketize(
  cases: AiCommandEvalCase[],
  pickKey: (evalCase: AiCommandEvalCase) => string,
): AiEvalCoverageBucket[] {
  const buckets = new Map<string, number>();
  for (const evalCase of cases) {
    const key = pickKey(evalCase);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()]
    .map(([key, total]) => ({ key, total }))
    .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key));
}

export function buildEvalCoverageReport(
  cases: AiCommandEvalCase[],
): AiEvalCoverageReport {
  const normalized = cases.map(normalizeEvalCaseTags);
  const coreDomainCounts = Object.fromEntries(
    ACC_EVAL_CORE_DOMAINS.map((domain) => [domain, 0]),
  ) as Record<AiEvalCoreDomain, number>;

  for (const evalCase of normalized) {
    const domain = evalCase.domain ?? 'booking';
    if ((ACC_EVAL_CORE_DOMAINS as readonly string[]).includes(domain)) {
      coreDomainCounts[domain as AiEvalCoreDomain] += 1;
    }
  }

  const balanceFailures: string[] = [];
  if (normalized.length < ACC_EVAL_MIN_TOTAL_CASES) {
    balanceFailures.push(
      `total cases ${normalized.length} below minimum ${ACC_EVAL_MIN_TOTAL_CASES}`,
    );
  }
  for (const domain of ACC_EVAL_CORE_DOMAINS) {
    if (coreDomainCounts[domain] < ACC_EVAL_MIN_PER_CORE_DOMAIN) {
      balanceFailures.push(
        `${domain} has ${coreDomainCounts[domain]} cases (min ${ACC_EVAL_MIN_PER_CORE_DOMAIN})`,
      );
    }
  }
  for (const locale of ACC_EVAL_MIN_LOCALES) {
    const count = normalized.filter((entry) => entry.locale === locale).length;
    if (count < 300) {
      balanceFailures.push(`${locale} locale has ${count} cases (min 300)`);
    }
  }
  for (const surface of ACC_EVAL_MIN_SURFACES) {
    const count = normalized.filter((entry) => entry.surface === surface).length;
    if (count < 200) {
      balanceFailures.push(`${surface} surface has ${count} cases (min 200)`);
    }
  }
  for (const difficulty of ACC_EVAL_MIN_DIFFICULTIES) {
    const count = normalized.filter((entry) => entry.difficulty === difficulty).length;
    const min =
      difficulty === 'hard' ? ACC_EVAL_MIN_HARD_CASES : 400;
    if (count < min) {
      balanceFailures.push(`${difficulty} difficulty has ${count} cases (min ${min})`);
    }
  }

  return {
    totalCases: normalized.length,
    taggedCases: normalized.length,
    byDomain: bucketize(normalized, (entry) => entry.domain ?? 'unknown'),
    bySurface: bucketize(normalized, (entry) => entry.surface ?? 'dashboard'),
    byLocale: bucketize(normalized, (entry) => entry.locale ?? 'en'),
    byDifficulty: bucketize(normalized, (entry) => entry.difficulty ?? 'easy'),
    coreDomainCounts,
    balanceFailures,
    balancePassed: balanceFailures.length === 0,
  };
}

export function formatEvalCoverageReport(report: AiEvalCoverageReport): string {
  const lines = [
    `Eval coverage (acc-2.3): ${report.totalCases} labeled cases`,
    `Balance gate: ${report.balancePassed ? 'PASS' : 'FAIL'}`,
  ];
  if (report.balanceFailures.length) {
    lines.push(`Failures: ${report.balanceFailures.join('; ')}`);
  }
  lines.push('', 'Core domains:');
  for (const domain of ACC_EVAL_CORE_DOMAINS) {
    lines.push(`  ${domain}: ${report.coreDomainCounts[domain]}`);
  }
  lines.push('', 'Locales:');
  for (const row of report.byLocale.slice(0, 6)) {
    lines.push(`  ${row.key}: ${row.total}`);
  }
  lines.push('', 'Surfaces:');
  for (const row of report.bySurface) {
    lines.push(`  ${row.key}: ${row.total}`);
  }
  return lines.join('\n');
}
