import {
  resolveCustomerSelfServiceSettings,
  type CustomerSelfServiceSettings,
} from '../../common/utils/customer-self-service.util.js';
import { isExplainCancelPolicyPrompt } from './ai-explain-cancel-policy.util.js';
import { isCancelPackageVisitSelfPrompt } from './ai-cancel-package-visit-self.util.js';
import { isReschedulePackageVisitSelfPrompt } from './ai-reschedule-package-visit-self.util.js';
import { isExplainPackageDisplayNamePrompt } from './ai-package-display-name.util.js';
import {
  EXPLAIN_PACKAGE_VISIT_RULES_PROMPTS,
  type ExplainPackageVisitRulesFocus,
  type ExplainPackageVisitRulesPromptFixture,
} from './ai-explain-package-visit-rules.fixtures.js';
import { EXPLAIN_PACKAGE_VISIT_RULES_MULTILINGUAL_SCENARIOS } from './ai-explain-package-visit-rules-multilingual.fixtures.js';

export const EXPLAIN_PACKAGE_VISIT_RULES_INTENTS = [
  'explain_package_visit_rules',
] as const;

export type ExplainPackageVisitRulesIntent =
  (typeof EXPLAIN_PACKAGE_VISIT_RULES_INTENTS)[number];

export {
  CUSTOMER_EXPLAIN_PACKAGE_VISIT_RULES_CLASSIFIER_RULES,
  EXPLAIN_PACKAGE_VISIT_RULES_PROMPTS,
  EXPLAIN_PACKAGE_VISIT_RULES_RESCUE_SCENARIOS,
} from './ai-explain-package-visit-rules.fixtures.js';

const PACKAGE_VISIT_RULES_CUE = new RegExp(
  String.raw`\b(?:package\s+visit|spa\s+day|package\s+bundle|package\s+appointment|bundle\s+visit|пакетн(?:ый|ого)?\s+визит|package\s+visit)\b`,
  'iu',
);

const RULES_QUESTION_CUE = new RegExp(
  String.raw`\b(?:can\s+i|am\s+i\s+allowed|do\s+unused|will\s+i|what\s+(?:are|is|happens)|explain|tell\s+me|how\s+do|is\s+it|terms?|rules?|policy|expire|expir|keep\s+the\s+package|lose\s+(?:my|the)\s+package|lose\s+the\s+rest|skip\s+a?\s*visit)\b|կարո՞ղ\s+եմ|ժամկետանց|բացատր|можно\s+ли|сгора|правил|политик|объясн`,
  'iu',
);

function extractPackageNameFromPrompt(prompt: string): string | undefined {
  if (/\bspa\s+day\b/i.test(prompt)) return 'Spa Day';
  const quoted = prompt.match(/["']([^"']+?)["']\s+package/i)?.[1];
  if (quoted) return quoted.trim();
  const named = prompt.match(
    /\b(?:book|reserve|schedule|check)\s+(?:the\s+)?([a-z][\w\s-]{2,30}?)\s+package\b/i,
  );
  if (named?.[1]) return named[1].trim();
  return undefined;
}

function matchExplainPackageVisitRulesScenario(
  prompt: string,
): ExplainPackageVisitRulesPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_PACKAGE_VISIT_RULES_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_PACKAGE_VISIT_RULES_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isPackageVisitRulesQuestionPrompt(prompt: string): boolean {
  if (
    /\b(how\s+many|visits?\s+left|remaining|still\s+have)\b/i.test(prompt) &&
    /\bpackage\b/i.test(prompt) &&
    /\bvisit/i.test(prompt) &&
    !/\b(rules?|policy|terms?|expire|cancel|skip|lose|keep|forfeit)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    /\b(cancel|skip|reschedule|move)\s+(?:visit|package|spa\s+day)\b/i.test(
      prompt,
    )
  ) {
    if (
      /\b(can\s+i|am\s+i|will\s+i|do\s+i|what\s+happens|what\s+if|explain|rules?|policy|terms?|lose|keep)\b/i.test(
        prompt,
      )
    ) {
      return true;
    }
  }
  return (
    RULES_QUESTION_CUE.test(prompt) &&
    (PACKAGE_VISIT_RULES_CUE.test(prompt) ||
      (/\bpackage\b/i.test(prompt) && /\bvisit/i.test(prompt)) ||
      /\bmy\s+package\b/i.test(prompt) ||
      /\bbundle\b/i.test(prompt))
  );
}

export function detectExplainPackageVisitRulesFocus(
  prompt: string,
  scenario?: ExplainPackageVisitRulesPromptFixture | null,
): ExplainPackageVisitRulesFocus {
  if (scenario?.focus) return scenario.focus;
  if (
    /\b(expire|expir|expiration|validity|unused|сгора|жгут|ժամկետանց)\b/i.test(
      prompt,
    )
  ) {
    return 'expiration';
  }
  if (
    /\b(reschedule|move|change|shift|перенес|վերամրագր)\b/i.test(prompt) &&
    /\b(visit|package|bundle|визит)\b/i.test(prompt)
  ) {
    return 'rescheduleRules';
  }
  if (
    /\b(cancel|skip|lose|keep|forfeit|չեղարկ|отмен)\b/i.test(prompt) &&
    /\b(visit|package|bundle|rest|визит|пакет)\b/i.test(prompt)
  ) {
    return 'cancelKeepPackage';
  }
  return 'general';
}

export function isExplainPackageVisitRulesPrompt(prompt: string): boolean {
  if (isExplainPackageDisplayNamePrompt(prompt)) return false;
  if (matchExplainPackageVisitRulesScenario(prompt)) return true;
  if (isCancelPackageVisitSelfPrompt(prompt)) return false;
  if (isReschedulePackageVisitSelfPrompt(prompt)) return false;
  if (
    isExplainCancelPolicyPrompt(prompt) &&
    PACKAGE_VISIT_RULES_CUE.test(prompt)
  ) {
    return false;
  }
  return isPackageVisitRulesQuestionPrompt(prompt);
}

export function isExplainPackageVisitRulesIntent(
  action: string,
): action is ExplainPackageVisitRulesIntent {
  return (EXPLAIN_PACKAGE_VISIT_RULES_INTENTS as readonly string[]).includes(
    action,
  );
}

export function enrichExplainPackageVisitRulesParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  const scenario = matchExplainPackageVisitRulesScenario(prompt);
  const packageName =
    (typeof params.packageName === 'string' && params.packageName.trim()) ||
    scenario?.packageName ||
    extractPackageNameFromPrompt(prompt);
  if (packageName) next.packageName = packageName;
  const focus = detectExplainPackageVisitRulesFocus(prompt, scenario);
  next.focus = focus;
  return next;
}

export function parseExplainPackageVisitRulesFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): {
  packageName?: string;
  focus: ExplainPackageVisitRulesFocus;
} | null {
  if (!isExplainPackageVisitRulesPrompt(prompt)) return null;
  const enriched = enrichExplainPackageVisitRulesParamsFromPrompt(
    params,
    prompt,
  );
  return {
    packageName:
      typeof enriched.packageName === 'string'
        ? enriched.packageName
        : undefined,
    focus: enriched.focus as ExplainPackageVisitRulesFocus,
  };
}

export function rescueExplainPackageVisitRulesIntent(
  prompt: string,
  action: string,
): { action: ExplainPackageVisitRulesIntent; rescueReason: string } | null {
  if (isExplainPackageVisitRulesIntent(action)) return null;
  if (!parseExplainPackageVisitRulesFromPrompt(prompt)) return null;
  return {
    action: 'explain_package_visit_rules',
    rescueReason: 'package_visit_rules',
  };
}

export interface PackageVisitRulesCatalogInput {
  name: string;
  description?: string | null;
  expiresAt?: Date | string | null;
  items?: Array<{ serviceName: string; quantity: number }>;
}

export function buildPackageVisitStructureLine(
  pkg: PackageVisitRulesCatalogInput,
): string {
  const items = pkg.items ?? [];
  if (!items.length) {
    return `${pkg.name} bundles multiple services into scheduled visit blocks on your account.`;
  }
  const visitCount = items.reduce((sum, row) => sum + row.quantity, 0);
  const serviceSummary = items
    .map((row) =>
      row.quantity > 1
        ? `${row.quantity}× ${row.serviceName}`
        : row.serviceName,
    )
    .join(', ');
  return `${pkg.name} includes ${visitCount} visit block(s) with ${serviceSummary}. Each visit schedules bundled services together on one day.`;
}

export function buildPackageVisitCatalogTermsLines(
  pkg: PackageVisitRulesCatalogInput,
): string[] {
  const lines: string[] = [];
  if (pkg.description?.trim()) {
    lines.push(pkg.description.trim());
  }
  if (pkg.expiresAt) {
    const date =
      typeof pkg.expiresAt === 'string'
        ? pkg.expiresAt.slice(0, 10)
        : pkg.expiresAt.toISOString().slice(0, 10);
    lines.push(
      `Catalog listing expires ${date} — that deadline applies to buying the package, not visits you already purchased.`,
    );
  } else {
    lines.push(
      'This package listing has no catalog expiration date in the app.',
    );
  }
  return lines;
}

export function buildPackageVisitSelfServiceLines(
  settings: CustomerSelfServiceSettings,
): string[] {
  return [
    settings.allowCancel
      ? 'Online cancellation is allowed per visit when policy permits.'
      : 'Online cancellation is disabled — contact the salon to change a visit.',
    settings.allowReschedule
      ? 'Online rescheduling moves the whole visit block to a new same-day time.'
      : 'Online rescheduling is disabled for package visits.',
    `Give at least ${settings.minimumNoticeHours} hours notice before canceling or moving a visit.`,
    `Each appointment in a visit block can be rescheduled up to ${settings.maxReschedulesPerBooking} time(s).`,
  ];
}

export function buildPackageVisitRulesFocusLines(
  focus: ExplainPackageVisitRulesFocus,
): string[] {
  switch (focus) {
    case 'cancelKeepPackage':
      return [
        'You can cancel one package visit without losing the rest of your bundle — only that visit’s appointments are removed.',
        'Remaining unused visits stay on your purchase until you schedule or cancel them.',
      ];
    case 'expiration':
      return [
        'Unused visits you already bought stay on your account — the app does not auto-expire purchased visit credits.',
        'Check the package description or ask the salon if they enforce a use-by date beyond the catalog listing.',
      ];
    case 'rescheduleRules':
      return [
        'Rescheduling moves every active appointment in that visit block to a new same-day time together.',
        'You cannot move a single service from a visit without rescheduling the whole block.',
      ];
    default:
      return [
        'Package visits are booked as same-day blocks; cancel or reschedule applies to the whole block.',
        'Use cancel package visit or reschedule package visit for one block — your remaining bundle visits stay intact.',
      ];
  }
}

export function assemblePackageVisitRulesSummary(
  catalogLines: string[],
  selfServiceLines: string[],
  focusLines: string[],
): string {
  return [...focusLines, ...catalogLines, ...selfServiceLines]
    .filter(Boolean)
    .join(' ');
}

export function buildPackageVisitRulesSummaryFromCatalog(
  pkg: PackageVisitRulesCatalogInput,
  businessSettings: Record<string, unknown> | null | undefined,
  focus: ExplainPackageVisitRulesFocus,
): {
  summary: string;
  policyLines: string[];
  catalogLines: string[];
  selfServiceLines: string[];
} {
  const settings = resolveCustomerSelfServiceSettings(businessSettings);
  const focusLines = buildPackageVisitRulesFocusLines(focus);
  const catalogLines = [
    buildPackageVisitStructureLine(pkg),
    ...buildPackageVisitCatalogTermsLines(pkg),
  ];
  const selfServiceLines = buildPackageVisitSelfServiceLines(settings);
  return {
    summary: assemblePackageVisitRulesSummary(
      catalogLines,
      selfServiceLines,
      focusLines,
    ),
    policyLines: focusLines,
    catalogLines,
    selfServiceLines,
  };
}
