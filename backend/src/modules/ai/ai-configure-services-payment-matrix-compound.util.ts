import {
  enrichParamsWithSharedEntities,
  propagateCompoundStepParamsAcrossSteps,
} from './ai-command-entity-params.util.js';
import {
  isPricingAdjustmentPrompt,
  parsePriceAdjustment,
} from './ai-operations.util.js';
import { parseCashPaymentsToggle } from './ai-payments.util.js';
import { parseServiceOnlinePaymentConfig } from './ai-service-online-payment.util.js';
import { isSetupSalonCheckoutCompoundPrompt } from './ai-setup-salon-checkout-compound.util.js';

export const CONFIGURE_SERVICES_PAYMENT_MATRIX_STEP_ACTIONS = [
  'update_service_prices',
  'configure_service_online_payment',
  'configure_cash_payments',
] as const;

export type ConfigureServicesPaymentMatrixStepAction =
  (typeof CONFIGURE_SERVICES_PAYMENT_MATRIX_STEP_ACTIONS)[number];

export const CONFIGURE_SERVICES_PAYMENT_MATRIX_RECIPE_ID =
  'configure_services_payment_matrix';

const COMPOUND_MARKERS =
  /\band\s+then\b|\bthen\b|;\s*|\s+and\s+(?=(?:raise|increase|accept|require|enable|configure|turn)\b)/i;

export const CONFIGURE_SERVICES_PAYMENT_MATRIX_CLASSIFIER_RULES = `- configure_services_payment_matrix (compound): dashboard per-category payment setup — optional update_service_prices → configure_service_online_payment per category (categoryName + prepaymentMode/depositPercent) → configure_cash_payments. Use for "configure services payment matrix", "full prepayment for massage and 50% deposit for hair services; enable cash", "raise facial prices 5% then category prepayment matrix + cash". NOT setup_salon_checkout (Stripe + all-services checkout + booking); NOT configure_service_online_payment alone when user asks for multi-category matrix or matrix + cash; NOT configure_checkout_defaults; NOT update_service_prices alone when user also sets per-category online payment and cash.`;

const PAYMENT_MATRIX_CUE =
  /\b(?:services?\s+payment\s+matrix|payment\s+matrix|category\s+payment\s+matrix|prepayment\s+by\s+category|per[\s-]category\s+(?:online\s+)?payment|category\s+prepayment\s+matrix)\b/i;

const CASH_STEP_CUE =
  /\b(?:cash|pay\s+at\s+(?:the\s+)?venue|accept\s+cash|enable\s+cash|turn\s+on\s+cash)\b/i;

const CATEGORY_BLOCKLIST = new Set([
  'all',
  'every',
  'each',
  'some',
  'public',
  'the',
  'cash',
  'online',
  'enable',
  'turn',
  'configure',
  'require',
  'accept',
  'services',
  'service',
  'category',
  'categories',
  'matrix',
  'payment',
  'prepayment',
  'deposit',
]);

export type CategoryPaymentRow = {
  categoryName: string;
  prepaymentMode: 'none' | 'full' | 'deposit';
  depositPercent?: number;
};

function normalizeCategoryName(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const key = trimmed.toLowerCase();
  if (CATEGORY_BLOCKLIST.has(key)) return null;
  return trimmed;
}

function parsePrepaymentFromClause(
  clause: string,
): Pick<CategoryPaymentRow, 'prepaymentMode' | 'depositPercent'> | null {
  const config = parseServiceOnlinePaymentConfig(clause, {});
  if (!config?.prepaymentMode || config.allServices) return null;
  if (!config.categoryName && !config.serviceName) return null;
  return {
    prepaymentMode: config.prepaymentMode,
    depositPercent: config.depositPercent ?? undefined,
  };
}

function addCategoryCandidate(
  candidates: Array<{ index: number; row: CategoryPaymentRow }>,
  seen: Set<string>,
  index: number,
  categoryName: string,
  prepaymentMode: CategoryPaymentRow['prepaymentMode'],
  depositPercent?: number,
): void {
  const normalized = normalizeCategoryName(categoryName);
  if (!normalized) return;
  const key = normalized.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  candidates.push({
    index,
    row: {
      categoryName: normalized,
      prepaymentMode,
      ...(depositPercent != null ? { depositPercent } : {}),
    },
  });
}

export function extractCategoryPaymentRowsFromPrompt(
  prompt: string,
): CategoryPaymentRow[] {
  const candidates: Array<{ index: number; row: CategoryPaymentRow }> = [];
  const seen = new Set<string>();

  const patterns: Array<RegExp> = [
    /\b((?:full(?:\s+prepayment)?)|(?:\d+\s*%|half)\s+(?:deposit|prepayment))\s+for\s+([a-z][\w&'-]+)\s+services?/gi,
    /\b((?:\d+\s*%|half)\s+deposit)\s+on\s+([a-z][\w&'-]+)\s+services?/gi,
    /\bfor\s+([a-z][\w&'-]+)\s+services?\s+with\s+([^;]+?)(?=\s*(?:;|,\s*and\s+for\b|\s+and\s+for\s+[a-z]|$))/gi,
    /\b(?:require|accept|enable)\s+((?:full(?:\s+prepayment)?)|(?:\d+\s*%|half)\s+(?:deposit|prepayment))\s+(?:on|for)\s+([a-z][\w&'-]+)\s+services?/gi,
    /\b([a-z][\w&'-]+)\s*:\s*((?:full|50\s*%|half)(?:\s+(?:prepayment|deposit))?)/gi,
  ];

  for (const pattern of patterns) {
    for (const match of prompt.matchAll(pattern)) {
      const matchIndex = match.index ?? 0;
      if (pattern.source.startsWith('\\b((?:full')) {
        const prepayment = parsePrepaymentModeFromText(match[1]);
        if (!prepayment) continue;
        addCategoryCandidate(
          candidates,
          seen,
          matchIndex,
          match[2],
          prepayment.prepaymentMode,
          prepayment.depositPercent,
        );
        continue;
      }
      if (pattern.source.includes('deposit)\\s+on')) {
        const prepayment = parsePrepaymentModeFromText(match[1]);
        if (!prepayment) continue;
        addCategoryCandidate(
          candidates,
          seen,
          matchIndex,
          match[2],
          prepayment.prepaymentMode,
          prepayment.depositPercent,
        );
        continue;
      }
      if (pattern.source.startsWith('\\bfor')) {
        const prepayment = parsePrepaymentModeFromText(match[2]);
        if (!prepayment) continue;
        addCategoryCandidate(
          candidates,
          seen,
          matchIndex,
          match[1],
          prepayment.prepaymentMode,
          prepayment.depositPercent,
        );
        continue;
      }
      if (pattern.source.includes('require|accept|enable')) {
        const prepayment = parsePrepaymentModeFromText(match[1]);
        if (!prepayment) continue;
        addCategoryCandidate(
          candidates,
          seen,
          matchIndex,
          match[2],
          prepayment.prepaymentMode,
          prepayment.depositPercent,
        );
        continue;
      }
      const prepayment = parsePrepaymentModeFromText(match[2]);
      if (!prepayment) continue;
      addCategoryCandidate(
        candidates,
        seen,
        matchIndex,
        match[1],
        prepayment.prepaymentMode,
        prepayment.depositPercent,
      );
    }
  }

  const segments = prompt
    .split(/\s*;\s*|\s+and\s+then\s+|\s+and\s+(?=(?:for|require|accept|enable)\b)/i)
    .map((segment) => segment.trim())
    .filter(Boolean);

  let segmentOffset = 0;
  for (const segment of segments) {
    const segmentIndex = prompt.indexOf(segment, segmentOffset);
    segmentOffset =
      segmentIndex >= 0 ? segmentIndex + segment.length : segmentOffset + segment.length;
    const parsed = parsePrepaymentFromClause(segment);
    if (!parsed) continue;
    const config = parseServiceOnlinePaymentConfig(segment, {});
    const categoryName = config?.categoryName ?? config?.serviceName;
    if (!categoryName) continue;
    addCategoryCandidate(
      candidates,
      seen,
      segmentIndex >= 0 ? segmentIndex : segmentOffset,
      categoryName,
      parsed.prepaymentMode,
      parsed.depositPercent,
    );
  }

  return candidates
    .sort((left, right) => left.index - right.index)
    .map((candidate) => candidate.row);
}

function parsePrepaymentModeFromText(
  text: string,
): Pick<CategoryPaymentRow, 'prepaymentMode' | 'depositPercent'> | null {
  const lower = text.toLowerCase();
  if (/\b(?:none|no\s+online|decline|disable|turn\s+off)\b/i.test(lower)) {
    return { prepaymentMode: 'none' };
  }
  if (/\b(?:full|100\s*%|pay\s+in\s+full)\b/i.test(lower)) {
    return { prepaymentMode: 'full' };
  }
  const pctMatch = lower.match(/\b(\d+)\s*%/);
  if (pctMatch) {
    return {
      prepaymentMode: 'deposit',
      depositPercent: Number.parseInt(pctMatch[1], 10),
    };
  }
  if (/\bhalf\b/i.test(lower)) {
    return { prepaymentMode: 'deposit', depositPercent: 50 };
  }
  if (/\bdeposit\b/i.test(lower)) {
    return { prepaymentMode: 'deposit', depositPercent: 50 };
  }
  return null;
}

export function hasPaymentMatrixPriceStep(prompt: string): boolean {
  return isPricingAdjustmentPrompt(prompt);
}

function hasDeclineAndEnableCategorySplitCue(text: string): boolean {
  const hasDecline = /\b(?:decline|disable|turn\s+off|reject|refuse)\b/i.test(
    text,
  );
  const hasEnable = /\b(?:accept|require|enabl(?:e|ing)|allow)\b/i.test(text);
  if (!hasDecline || !hasEnable) return false;

  const categoryScopes = text.match(/\bfor\s+[a-z][\w'-]+\s+services\b/gi);
  return (
    /\b(?:but|while|however)\b/i.test(text) ||
    /;\s*/.test(text) ||
    (categoryScopes?.length ?? 0) >= 2
  );
}

export function isConfigureServicesPaymentMatrixCompoundPrompt(
  prompt: string,
): boolean {
  const text = prompt.trim();
  if (text.length < 36) return false;
  if (isSetupSalonCheckoutCompoundPrompt(text)) return false;
  if (/\b(?:stripe|online\s+booking|booking\s+page|booking\s+website)\b/i.test(text)) {
    return false;
  }

  const categoryRows = extractCategoryPaymentRowsFromPrompt(text);
  if (categoryRows.length === 0) return false;
  if (!CASH_STEP_CUE.test(text)) return false;
  if (hasDeclineAndEnableCategorySplitCue(text) && categoryRows.length >= 2) {
    return false;
  }

  const hasMatrixCue = PAYMENT_MATRIX_CUE.test(text);
  if (categoryRows.length < 2 && !hasMatrixCue) return false;

  const hasPrice = hasPaymentMatrixPriceStep(text);
  const stepFamilies =
    categoryRows.length + (hasPrice ? 1 : 0) + (CASH_STEP_CUE.test(text) ? 1 : 0);

  if (stepFamilies < 3 && categoryRows.length < 2) return false;

  return (
    hasMatrixCue ||
    categoryRows.length >= 2 ||
    hasPrice ||
    COMPOUND_MARKERS.test(text) ||
    /;\s*/.test(text)
  );
}

export type ConfigureServicesPaymentMatrixStep = {
  action: ConfigureServicesPaymentMatrixStepAction;
  params: Record<string, unknown>;
  segment: string;
};

export function buildConfigureServicesPaymentMatrixCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const params = enrichParamsWithSharedEntities({}, prompt);

  const cashToggle = parseCashPaymentsToggle(prompt);
  params.acceptCashPayments = cashToggle ?? true;

  const priceAdj = parsePriceAdjustment(prompt, params);
  if (priceAdj) {
    params.percentChange = priceAdj.percentChange;
    if (priceAdj.categoryHint) params.categoryName = priceAdj.categoryHint;
    if (priceAdj.effectiveFrom) params.effectiveFrom = priceAdj.effectiveFrom;
  }

  return params;
}

export function decomposeConfigureServicesPaymentMatrixCompoundPrompt(
  prompt: string,
): ConfigureServicesPaymentMatrixStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !isConfigureServicesPaymentMatrixCompoundPrompt(trimmed)) {
    return [];
  }

  const base = buildConfigureServicesPaymentMatrixCompoundParams(trimmed);
  const categoryRows = extractCategoryPaymentRowsFromPrompt(trimmed);
  const steps: ConfigureServicesPaymentMatrixStep[] = [];

  if (hasPaymentMatrixPriceStep(trimmed)) {
    const adjustment = parsePriceAdjustment(trimmed, base);
    if (adjustment) {
      steps.push({
        action: 'update_service_prices',
        params: {
          ...base,
          percentChange: adjustment.percentChange,
          ...(adjustment.categoryHint
            ? { categoryName: adjustment.categoryHint }
            : {}),
          ...(adjustment.effectiveFrom
            ? { effectiveFrom: adjustment.effectiveFrom }
            : {}),
        },
        segment: trimmed,
      });
    }
  }

  for (const row of categoryRows) {
    steps.push({
      action: 'configure_service_online_payment',
      params: {
        ...base,
        categoryName: row.categoryName,
        prepaymentMode: row.prepaymentMode,
        ...(row.depositPercent != null
          ? { depositPercent: row.depositPercent }
          : {}),
      },
      segment: trimmed,
    });
  }

  steps.push({
    action: 'configure_cash_payments',
    params: { ...base },
    segment: trimmed,
  });

  if (steps.length < 2) return [];

  return propagateCompoundStepParamsAcrossSteps(steps);
}

export function rescueConfigureServicesPaymentMatrixCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isConfigureServicesPaymentMatrixCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'configure_services_payment_matrix_compound',
  };
}
