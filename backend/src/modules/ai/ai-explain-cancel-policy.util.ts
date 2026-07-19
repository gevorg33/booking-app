import {
  evaluateCustomerBookingPolicy,
  resolveCustomerSelfServiceSettings,
  resolvePublicPaymentSettings,
  type CustomerSelfServiceSettings,
  type PublicPaymentSettings,
} from '../../common/utils/customer-self-service.util.js';
import { PaymentStatus } from '../booking/entities/booking.entity.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import { resolveServicePrepaymentDueAmount } from './ai-explain-prepayment.util.js';
import {
  EXPLAIN_CANCEL_POLICY_PROMPTS,
  type ExplainCancelPolicyPromptFixture,
} from './ai-explain-cancel-policy.fixtures.js';
import {
  EXPLAIN_CANCEL_POLICY_MULTILINGUAL_SCENARIOS,
  type ExplainCancelPolicyMultilingualScenario,
} from './ai-explain-cancel-policy-multilingual.fixtures.js';
import { isExplainDepositForfeiturePrompt } from './ai-explain-deposit-forfeiture.util.js';

export const EXPLAIN_CANCEL_POLICY_INTENTS = ['explain_cancel_policy'] as const;

export type ExplainCancelPolicyIntent =
  (typeof EXPLAIN_CANCEL_POLICY_INTENTS)[number];

export { CUSTOMER_EXPLAIN_CANCEL_POLICY_CLASSIFIER_RULES } from './ai-explain-cancel-policy.fixtures.js';

const POLICY_EXPLAIN_CUE = new RegExp(
  String.raw`\b(?:explain|what\s+is|tell\s+me|describe|what\s+are)\b.*\b(?:cancel(?:lation)?|reschedule|self[\s-]?service)\b.*\b(?:policy|rules?|window|notice)\b|\b(?:cancel(?:lation)?|reschedule)\b.*\b(?:policy|rules?|window|notice)\b`,
  'iu',
);

const DEPOSIT_FORFEITURE_CUE = new RegExp(
  String.raw`\b(?:deposit|prepayment|50\s*%|forfeit|refund(?:able)?|lose\s+my|get\s+my|give\s+back|cancellation\s+fee|cancel\s+for\s+free|free\s+cancel|late\s+cancel)\b|անկախավճ|վերադարձ|депозит|вернут|бесплатн|forfeit`,
  'iu',
);

const CANCEL_POLICY_CONTEXT = new RegExp(
  String.raw`\b(?:cancel|cancellation|policy|rules?|notice|window|reschedule|booking|appointment|visit|if\s+i\s+cancel)\b|չեղարկ|отмен|политик|правил|amragr|amրag`,
  'iu',
);

const AMOUNT_DUE_CUE = new RegExp(
  String.raw`\b(?:how\s+much|what(?:'s| is)\s+due|due\s+today|pay\s+today|amount\s+due|\$\d+)\b|որքան\s+եմ\s+վճարում|сколько\s+я\s+плачу`,
  'iu',
);

function matchExplainCancelPolicyScenario(
  prompt: string,
): ExplainCancelPolicyPromptFixture | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of EXPLAIN_CANCEL_POLICY_PROMPTS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function matchExplainCancelPolicyMultilingualScenario(
  prompt: string,
): ExplainCancelPolicyMultilingualScenario | null {
  const normalized = prompt.trim().toLowerCase();
  for (const scenario of EXPLAIN_CANCEL_POLICY_MULTILINGUAL_SCENARIOS) {
    if (scenario.prompt.trim().toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isExplainCancelPolicyDepositForfeitureFocus(
  prompt: string,
): boolean {
  return isExplainDepositForfeiturePrompt(prompt);
}

export function isExplainCancelPolicyPrompt(prompt: string): boolean {
  if (isExplainDepositForfeiturePrompt(prompt)) return false;
  if (
    /\b(package\s+visit|spa\s+day|package\s+bundle|package\s+appointment)\b/i.test(
      prompt,
    ) &&
    /\b(rules?|terms?|expire|unused|keep\s+the\s+package|lose\s+the\s+package)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (
    AMOUNT_DUE_CUE.test(prompt) &&
    !/\b(?:notice|hours?\s+before)\b/i.test(prompt) &&
    !isExplainCancelPolicyDepositForfeitureFocus(prompt)
  ) {
    return false;
  }

  if (matchExplainCancelPolicyScenario(prompt)) return true;
  if (matchExplainCancelPolicyMultilingualScenario(prompt)) return true;

  if (
    /(?:բացատր.{0,20}չեղարկ|объясн.{0,20}политик|правила\s+переноса)/iu.test(
      prompt,
    ) &&
    !isExplainDepositForfeiturePrompt(prompt)
  ) {
    return true;
  }

  if (POLICY_EXPLAIN_CUE.test(prompt)) return true;

  if (
    /\b(?:how\s+much\s+notice|notice\s+do\s+i\s+need)\b/i.test(prompt) &&
    /\b(?:cancel|cancellation|reschedule)\b/i.test(prompt)
  ) {
    return true;
  }

  // e2e-bug.132 — casual / slang cancel-policy questions without "policy/rules".
  if (isCasualCancelPolicyPrompt(prompt)) return true;

  return (
    (/\b(explain|what\s+is|tell\s+me|describe)\b/i.test(prompt) &&
      /\b(cancel(?:lation)?|reschedule|self[\s-]?service)\b/i.test(prompt) &&
      /\b(policy|rules?|window|notice)\b/i.test(prompt)) ||
    (/(բացատր|explain)/i.test(prompt) &&
      /(չեղարկ|cancel|reschedule|self[\s-]?service)/i.test(prompt) &&
      /(policy|rules?|window|notice|կանon|kanon|правил|политик)/i.test(
        prompt,
      )) ||
    (/(объясн|расскаж|explain)/i.test(prompt) &&
      /(отмен|cancel|reschedule|перенос)/i.test(prompt) &&
      /(политик|правил|policy|rules?)/i.test(prompt))
  );
}

/** "whats the deal if i cancel", "what happens if I cancel", typo cancelation rulz. */
function isCasualCancelPolicyPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (
    /\b(package|bundle|spa\s+day)\b/i.test(text) &&
    /\b(save|saving|cheaper|worth|discount)\b/i.test(text)
  ) {
    return false;
  }
  const cancelCue =
    /\b(cancel|cancellation|cancelation|reschedule)\b/i.test(text) ||
    /\bcancelation\b/i.test(text) ||
    /\brulz\b/i.test(text);
  if (!cancelCue) return false;

  return (
    /\b(what'?s\s+the\s+deal|whats\s+the\s+deal|wut'?s\s+the\s+deal)\b/i.test(
      text,
    ) ||
    /\bwhat\s+happens\b/i.test(text) ||
    /\bwhat\s+if\s+i\s+cancel\b/i.test(text) ||
    /\bif\s+i\s+cancel\b/i.test(text) ||
    /\bdeal\s+if\s+i\s+cancel\b/i.test(text) ||
    (/\b(wut|whats|what'?s)\b/i.test(text) &&
      /\b(rulz|rules?|policy|cancelation|cancellation)\b/i.test(text))
  );
}

export function isExplainCancelPolicyIntent(
  action: string,
): action is ExplainCancelPolicyIntent {
  return (EXPLAIN_CANCEL_POLICY_INTENTS as readonly string[]).includes(action);
}

export function parseExplainCancelPolicyFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): { focusDepositForfeiture: boolean; bookingId?: string } | null {
  if (!isExplainCancelPolicyPrompt(prompt)) return null;

  const bookingId =
    (params.bookingId as string | undefined) ??
    (params.sessionBookingId as string | undefined);

  return {
    focusDepositForfeiture: isExplainCancelPolicyDepositForfeitureFocus(prompt),
    ...(bookingId ? { bookingId } : {}),
  };
}

export function rescueExplainCancelPolicyIntent(
  prompt: string,
  action: string,
): { action: ExplainCancelPolicyIntent; rescueReason: string } | null {
  if (isExplainCancelPolicyIntent(action)) return null;
  if (!parseExplainCancelPolicyFromPrompt(prompt)) return null;
  return {
    action: 'explain_cancel_policy',
    rescueReason: 'cancel_policy',
  };
}

export interface CancelPolicyDepositContext {
  minimumNoticeHours: number;
  defaultPrepaymentMode?: PublicPaymentSettings['defaultServicePrepaymentMode'];
  defaultDepositPercent?: number | null;
  serviceName?: string | null;
  prepaymentMode?: 'none' | 'full' | 'deposit';
  prepaymentDueAmount?: number;
  servicePrice?: number;
  paymentStatus?: string;
  cancelAllowedNow?: boolean;
  cancelBlockedReason?: string | null;
  focusDepositForfeiture?: boolean;
}

export function buildCancelPolicySettingsLines(
  settings: CustomerSelfServiceSettings,
): string[] {
  return [
    settings.allowCancel
      ? 'Online cancellation is allowed.'
      : 'Online cancellation is disabled.',
    settings.allowReschedule
      ? 'Online rescheduling is allowed.'
      : 'Online rescheduling is disabled.',
    `Minimum notice: ${settings.minimumNoticeHours} hours before the appointment.`,
    `Maximum reschedules per booking: ${settings.maxReschedulesPerBooking}.`,
    settings.allowProviderChangeOnReschedule
      ? 'You may change provider when rescheduling.'
      : 'Provider cannot be changed when rescheduling.',
  ];
}

function formatDepositLabel(
  prepaymentMode: 'none' | 'full' | 'deposit',
  prepaymentDueAmount: number,
  servicePrice?: number,
): string {
  if (prepaymentMode === 'full') {
    return `$${prepaymentDueAmount.toFixed(2)} full prepayment`;
  }
  if (prepaymentDueAmount > 0 && servicePrice != null && servicePrice > 0) {
    const pct = Math.round((prepaymentDueAmount / servicePrice) * 100);
    return `$${prepaymentDueAmount.toFixed(2)} deposit (${pct}% of service price)`;
  }
  return `$${prepaymentDueAmount.toFixed(2)} deposit`;
}

export function buildDepositForfeitureLines(
  ctx: CancelPolicyDepositContext,
): string[] {
  const lines: string[] = [];
  const notice = ctx.minimumNoticeHours;

  if (ctx.prepaymentMode === 'none' || (ctx.prepaymentDueAmount ?? 0) <= 0) {
    if (ctx.focusDepositForfeiture) {
      lines.push(
        'This service does not require an online deposit, so there is no deposit to forfeit when you cancel.',
      );
    }
    if (ctx.focusDepositForfeiture) {
      lines.push(
        ctx.cancelAllowedNow === false
          ? `You are inside the ${notice}-hour notice window — online cancellation is blocked. Contact the salon to discuss options.`
          : `You can cancel online if you give at least ${notice} hours notice.`,
      );
    }
    return lines;
  }

  const paidOnline =
    ctx.paymentStatus === PaymentStatus.PAID ||
    ctx.paymentStatus === PaymentStatus.PARTIALLY_PAID;
  const label = formatDepositLabel(
    ctx.prepaymentMode ?? 'deposit',
    ctx.prepaymentDueAmount ?? 0,
    ctx.servicePrice,
  );

  if (!paidOnline) {
    lines.push(
      `No online payment has been collected yet (${label} would be due at checkout). Cancelling before you pay avoids any charge.`,
    );
    return lines;
  }

  if (ctx.cancelAllowedNow === false) {
    lines.push(
      `You paid ${label} online. You are inside the ${notice}-hour notice window, so online cancellation is blocked and that prepayment may be forfeited.`,
    );
    if (ctx.cancelBlockedReason) {
      lines.push(ctx.cancelBlockedReason);
    }
    return lines;
  }

  lines.push(
    `You paid ${label} online. Cancelling with at least ${notice} hours notice is allowed online.`,
  );
  lines.push(
    'Refunds for deposits and prepayments are handled by the salon — they are not automatic in the app, so contact them if you need a refund.',
  );
  return lines;
}

export function buildGeneralDepositForfeitureLine(
  settings: CustomerSelfServiceSettings,
  payment: PublicPaymentSettings,
): string | null {
  const mode = payment.defaultServicePrepaymentMode ?? 'none';
  if (mode === 'none') {
    return 'Most services here do not require an online deposit — cancelling only needs to meet the notice window above.';
  }
  const pct =
    payment.defaultServiceDepositPercent != null
      ? `${payment.defaultServiceDepositPercent}%`
      : '50%';
  const prepaymentLabel =
    mode === 'full' ? 'full prepayment' : `${pct} deposit prepayment`;
  return `Services with ${prepaymentLabel} may forfeit what you paid online when you cancel inside the ${settings.minimumNoticeHours}-hour notice window. Cancel earlier to stay within policy.`;
}

export function assembleCancelPolicySummary(
  settingsLines: string[],
  depositLines: string[],
  generalDepositLine: string | null,
  focusDepositForfeiture: boolean,
): string {
  const parts = [...settingsLines];
  if (depositLines.length > 0) {
    parts.push(...depositLines);
  } else if (generalDepositLine) {
    parts.push(generalDepositLine);
  } else if (focusDepositForfeiture) {
    parts.push(
      `Ask about a specific booking to see whether a deposit applies, or cancel at least ${settingsLines.find((line) => line.startsWith('Minimum notice'))?.match(/\d+/)?.[0] ?? '24'} hours before your visit.`,
    );
  }
  return parts.join(' ');
}

export function buildCancelPolicyDepositContext(input: {
  businessSettings: Record<string, unknown> | null | undefined;
  booking?: {
    startTime: Date;
    status: string;
    paymentStatus: string;
    metadata?: Record<string, unknown> | null;
    service?: {
      name?: string | null;
      price?: number | string;
      prepaymentMode?: PrepaymentMode;
      depositAmount?: number | string | null;
    } | null;
  } | null;
  focusDepositForfeiture?: boolean;
  now?: Date;
}): CancelPolicyDepositContext {
  const settings = resolveCustomerSelfServiceSettings(input.businessSettings);
  const payment = resolvePublicPaymentSettings(input.businessSettings);
  const base: CancelPolicyDepositContext = {
    minimumNoticeHours: settings.minimumNoticeHours,
    defaultPrepaymentMode: payment.defaultServicePrepaymentMode,
    defaultDepositPercent: payment.defaultServiceDepositPercent ?? null,
    focusDepositForfeiture: input.focusDepositForfeiture,
  };

  if (!input.booking?.service) {
    return base;
  }

  const service = input.booking.service;
  const prepaymentMode = service.prepaymentMode ?? PrepaymentMode.NONE;
  const prepaymentDueAmount = resolveServicePrepaymentDueAmount({
    price: Number(service.price),
    prepaymentMode,
    depositAmount:
      service.depositAmount != null ? Number(service.depositAmount) : null,
  });
  const cancel = evaluateCustomerBookingPolicy(
    {
      status: input.booking.status,
      startTime: input.booking.startTime,
      metadata: input.booking.metadata,
    },
    settings,
    'cancel',
    input.now,
  );

  return {
    ...base,
    serviceName: service.name ?? null,
    prepaymentMode,
    prepaymentDueAmount,
    servicePrice: Number(service.price),
    paymentStatus: input.booking.paymentStatus,
    cancelAllowedNow: cancel.allowed,
    cancelBlockedReason: cancel.allowed ? null : (cancel.reason ?? null),
  };
}
