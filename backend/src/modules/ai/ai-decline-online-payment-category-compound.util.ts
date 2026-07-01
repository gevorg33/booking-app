import {
  enrichParamsWithSharedEntities,
  propagateCompoundStepParamsAcrossSteps,
} from './ai-command-entity-params.util.js';
import {
  parseCashPaymentsToggle,
  hasCashMutateCue,
} from './ai-payments.util.js';
import {
  extractCategoryPaymentRowsFromPrompt,
  isConfigureServicesPaymentMatrixCompoundPrompt,
  type CategoryPaymentRow,
} from './ai-configure-services-payment-matrix-compound.util.js';
import { parseServiceOnlinePaymentConfig } from './ai-service-online-payment.util.js';
import { isSetupSalonCheckoutCompoundPrompt } from './ai-setup-salon-checkout-compound.util.js';

export const DECLINE_ONLINE_PAYMENT_CATEGORY_STEP_ACTIONS = [
  'configure_service_online_payment',
  'configure_cash_payments',
] as const;

export type DeclineOnlinePaymentCategoryStepAction =
  (typeof DECLINE_ONLINE_PAYMENT_CATEGORY_STEP_ACTIONS)[number];

export const DECLINE_ONLINE_PAYMENT_CATEGORY_RECIPE_ID =
  'decline_online_payment_category';

const COMPOUND_MARKERS =
  /\band\s+then\b|\bthen\b|;\s*|\s+and\s+(?=(?:accept|require|enable|decline|disable|turn)\b)/i;

const SPLIT_ACCEPT_DECLINE =
  /\s*;\s*|\s+but\s+|\s+while\s+|\s+and\s+then\s+|\s+,\s+and\s+(?=(?:accept|require|enable|decline|disable|turn)\b)|\s+and\s+(?=(?:accept|require|enable|decline|disable|turn)\b)/i;

export const DECLINE_ONLINE_PAYMENT_CATEGORY_CLASSIFIER_RULES = `- decline_online_payment_category (compound): dashboard accept/decline split — decomposes to configure_service_online_payment per category (prepaymentMode=none for declined categories, full/deposit for enabled categories). Use for "decline online payment for dental services but accept 50% prepayment for massage services", "turn off online payment for hair category and enable full prepayment for facial services". NOT configure_services_payment_matrix (cash/price/matrix setup); NOT setup_salon_checkout; NOT configure_service_online_payment alone when user splits decline vs enable across categories in one message.`;

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
  'decline',
  'disable',
  'services',
  'service',
  'category',
  'categories',
  'payment',
  'prepayment',
  'deposit',
  'others',
  'other',
]);

function normalizeCategoryName(raw: string): string | null {
  const trimmed = raw
    .trim()
    .replace(/\s+category$/i, '')
    .trim();
  if (!trimmed) return null;
  const key = trimmed.toLowerCase();
  if (CATEGORY_BLOCKLIST.has(key)) return null;
  return trimmed;
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

export function extractDeclineAcceptCategoryRowsFromPrompt(
  prompt: string,
): CategoryPaymentRow[] {
  const candidates: Array<{ index: number; row: CategoryPaymentRow }> = [];
  const seen = new Set<string>();

  const segments = prompt
    .split(SPLIT_ACCEPT_DECLINE)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const useSegmentOnly = segments.length > 1;

  if (!useSegmentOnly) {
    for (const row of extractCategoryPaymentRowsFromPrompt(prompt)) {
      const idx = prompt
        .toLowerCase()
        .indexOf(`${row.categoryName.toLowerCase()} services`);
      addCategoryCandidate(
        candidates,
        seen,
        idx >= 0 ? idx : prompt.length,
        row.categoryName,
        row.prepaymentMode,
        row.depositPercent,
      );
    }
  }

  const declinePatterns: Array<RegExp> = [
    /\b(?:decline|disable|turn\s+off|stop|reject)\s+(?:online\s+payment\s+)?(?:on\s+public\s+booking\s+)?for\s+([a-z][\w&'-]+)\s+services?/gi,
    /\b(?:decline|disable|turn\s+off)\s+(?:online\s+payment\s+)?for\s+([a-z][\w&'-]+)\s+category\b/gi,
  ];

  const declineTargets = useSegmentOnly ? segments : [prompt];
  for (const declineText of declineTargets) {
    for (const pattern of declinePatterns) {
      for (const match of declineText.matchAll(pattern)) {
        addCategoryCandidate(
          candidates,
          seen,
          match.index ?? 0,
          match[1],
          'none',
        );
      }
    }
  }

  let segmentOffset = 0;
  for (const segment of segments) {
    const segmentIndex = prompt.indexOf(segment, segmentOffset);
    segmentOffset =
      segmentIndex >= 0
        ? segmentIndex + segment.length
        : segmentOffset + segment.length;

    const config = parseServiceOnlinePaymentConfig(segment, {});
    if (config && !config.allServices) {
      const categoryName = config.categoryName ?? config.serviceName;
      if (categoryName) {
        addCategoryCandidate(
          candidates,
          seen,
          segmentIndex >= 0 ? segmentIndex : segmentOffset,
          categoryName,
          config.prepaymentMode,
          config.depositPercent ?? undefined,
        );
      }
    }

    if (useSegmentOnly) {
      for (const row of extractCategoryPaymentRowsFromPrompt(segment)) {
        addCategoryCandidate(
          candidates,
          seen,
          segmentIndex >= 0 ? segmentIndex : segmentOffset,
          row.categoryName,
          row.prepaymentMode,
          row.depositPercent,
        );
      }
    }
  }

  return candidates
    .sort((left, right) => left.index - right.index)
    .map((candidate) => candidate.row);
}

export function hasDeclineAndAcceptCategorySplit(
  rows: CategoryPaymentRow[],
): boolean {
  if (rows.length < 2) return false;
  const hasDecline = rows.some((row) => row.prepaymentMode === 'none');
  const hasAccept = rows.some(
    (row) => row.prepaymentMode === 'full' || row.prepaymentMode === 'deposit',
  );
  return hasDecline && hasAccept;
}

export function isDeclineOnlinePaymentCategoryCompoundPrompt(
  prompt: string,
): boolean {
  const text = prompt.trim();
  if (text.length < 36) return false;
  if (isSetupSalonCheckoutCompoundPrompt(text)) return false;
  if (isConfigureServicesPaymentMatrixCompoundPrompt(text)) return false;
  if (
    /\b(?:stripe|online\s+booking|booking\s+page|booking\s+website)\b/i.test(
      text,
    )
  ) {
    return false;
  }

  const rows = extractDeclineAcceptCategoryRowsFromPrompt(text);
  if (!hasDeclineAndAcceptCategorySplit(rows)) return false;

  return (
    COMPOUND_MARKERS.test(text) ||
    /\b(?:but|while|however)\b/i.test(text) ||
    /;\s*/.test(text) ||
    rows.length >= 2
  );
}

export type DeclineOnlinePaymentCategoryStep = {
  action: DeclineOnlinePaymentCategoryStepAction;
  params: Record<string, unknown>;
  segment: string;
};

export function buildDeclineOnlinePaymentCategoryCompoundParams(
  prompt: string,
): Record<string, unknown> {
  return enrichParamsWithSharedEntities({}, prompt);
}

export function decomposeDeclineOnlinePaymentCategoryCompoundPrompt(
  prompt: string,
): DeclineOnlinePaymentCategoryStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !isDeclineOnlinePaymentCategoryCompoundPrompt(trimmed)) {
    return [];
  }

  const base = buildDeclineOnlinePaymentCategoryCompoundParams(trimmed);
  const categoryRows = extractDeclineAcceptCategoryRowsFromPrompt(trimmed);
  const steps: DeclineOnlinePaymentCategoryStep[] = categoryRows.map((row) => ({
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
  }));

  if (steps.length < 2) return [];

  if (hasCashMutateCue(trimmed)) {
    const toggle = parseCashPaymentsToggle(trimmed);
    return propagateCompoundStepParamsAcrossSteps([
      ...steps,
      {
        action: 'configure_cash_payments',
        params: enrichParamsWithSharedEntities(
          { acceptCashPayments: toggle ?? true },
          trimmed,
        ),
        segment: trimmed,
      },
    ]);
  }

  return propagateCompoundStepParamsAcrossSteps(steps);
}

export function rescueDeclineOnlinePaymentCategoryCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isDeclineOnlinePaymentCategoryCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'decline_online_payment_category_compound',
  };
}
