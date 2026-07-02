import {
  extractMaxPriceFromBudgetPrompt,
  isBudgetAdministrativeOrExplainContext,
  isBudgetGiftCardMisroute,
  isBudgetPackageDiscoveryPrompt,
} from './ai-budget-service-discovery.util.js';
import {
  FIND_SERVICES_UNDER_BUDGET_MULTILINGUAL_SCENARIOS,
  type FindServicesUnderBudgetMultilingualScenario,
} from './ai-find-services-under-budget-multilingual.fixtures.js';
import {
  FIND_SERVICES_UNDER_BUDGET_PROMPTS,
  type FindServicesUnderBudgetPromptFixture,
} from './ai-find-services-under-budget.fixtures.js';
import { enrichListServicesParamsFromPrompt } from './ai-orchestration.helpers.js';
import { isBudgetServiceDiscoveryCompoundPrompt } from './ai-budget-service-discovery-compound.util.js';

export const FIND_SERVICES_UNDER_BUDGET_INTENTS = [
  'find_services_under_budget',
] as const;

export type FindServicesUnderBudgetIntent =
  (typeof FIND_SERVICES_UNDER_BUDGET_INTENTS)[number];

export { CUSTOMER_PUBLIC_FIND_SERVICES_UNDER_BUDGET_CLASSIFIER_RULES } from './ai-find-services-under-budget.fixtures.js';

const BUDGET_CHIP_CUE = new RegExp(
  String.raw`\b(?:services?\s+under|anything\s+under|options?\s+under|what(?:'s| is| can i get| can i book)\s+(?:available\s+)?under|show\s+(?:me\s+)?services?\s+under|affordable\s+options?\s+under)\b`,
  'iu',
);

const BUDGET_CHIP_MULTILINGUAL_CUE = /(?:до|do)\s+\$?\d|(?:ից\s+ցած)/iu;

const COMPOUND_OR_AVAILABILITY_CUE = new RegExp(
  String.raw`\b(?:book|reserve|schedule|who(?:'s| is)\s+free|check\s+(?:who|availability)|nearest|soonest|asap|tomorrow|this\s+week)\b`,
  'iu',
);

const RANK_ONLY_CUE = new RegExp(
  String.raw`\b(?:premium\s+services?|luxury|deluxe|most\s+expensive|highest[\s-]?priced)\b`,
  'iu',
);

const SPECIALIST_RANK_CUE = new RegExp(
  String.raw`\b(?:best\s+(?:rated\s+)?(?:specialist|stylist|therapist|provider)|recommend\s+specialist|top\s+rated\s+(?:stylist|specialist))\b`,
  'iu',
);

function matchFindServicesUnderBudgetFixture(
  prompt: string,
): FindServicesUnderBudgetPromptFixture | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of FIND_SERVICES_UNDER_BUDGET_PROMPTS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function matchFindServicesUnderBudgetMultilingualScenario(
  prompt: string,
): FindServicesUnderBudgetMultilingualScenario | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of FIND_SERVICES_UNDER_BUDGET_MULTILINGUAL_SCENARIOS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isFindServicesUnderBudgetPrompt(prompt: string): boolean {
  if (matchFindServicesUnderBudgetFixture(prompt)) return true;
  if (matchFindServicesUnderBudgetMultilingualScenario(prompt)) return true;

  if (isBudgetAdministrativeOrExplainContext(prompt)) return false;
  if (isBudgetGiftCardMisroute(prompt)) return false;
  if (isBudgetPackageDiscoveryPrompt(prompt)) return false;
  if (isBudgetServiceDiscoveryCompoundPrompt(prompt)) return false;
  if (COMPOUND_OR_AVAILABILITY_CUE.test(prompt)) return false;
  if (RANK_ONLY_CUE.test(prompt) && !extractMaxPriceFromBudgetPrompt(prompt)) {
    return false;
  }
  if (SPECIALIST_RANK_CUE.test(prompt)) return false;

  if (
    /(?:до\s+\$?\d|do\s+\$?\d|ից\s+ցած|\$\d+\s*ից\s+ցած)/iu.test(prompt) &&
    /\b(?:услуг|service|book|կարող)/iu.test(prompt)
  ) {
    return true;
  }

  const maxPrice = extractMaxPriceFromBudgetPrompt(prompt);
  if (maxPrice == null) return false;

  return (
    BUDGET_CHIP_CUE.test(prompt) ||
    BUDGET_CHIP_MULTILINGUAL_CUE.test(prompt) ||
    /\bunder\s+\$?\d/i.test(prompt)
  );
}

export function isFindServicesUnderBudgetIntent(
  action: string,
): action is FindServicesUnderBudgetIntent {
  return (FIND_SERVICES_UNDER_BUDGET_INTENTS as readonly string[]).includes(
    action,
  );
}

export function enrichFindServicesUnderBudgetParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const maxPrice = extractMaxPriceFromBudgetPrompt(prompt);
  const enriched = enrichListServicesParamsFromPrompt(prompt, {
    ...params,
    ...(maxPrice != null ? { maxPrice } : {}),
  });
  return enriched;
}

export function parseFindServicesUnderBudgetFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): Record<string, unknown> | null {
  if (!isFindServicesUnderBudgetPrompt(prompt)) return null;
  return enrichFindServicesUnderBudgetParamsFromPrompt(params, prompt);
}

export function rescueFindServicesUnderBudgetIntent(
  prompt: string,
  action: string,
): { action: FindServicesUnderBudgetIntent; rescueReason: string } | null {
  if (isFindServicesUnderBudgetIntent(action)) return null;
  if (!parseFindServicesUnderBudgetFromPrompt(prompt)) return null;
  return {
    action: 'find_services_under_budget',
    rescueReason: 'budget_discover_chip',
  };
}
