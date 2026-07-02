import { isExplainGuestCheckoutFieldsPrompt } from './ai-explain-guest-checkout-fields.util.js';
import { isExplainClinicBookingPrompt } from './ai-clinic-booking.util.js';
import { isExplainDataRightsPrompt } from './ai-data-rights.util.js';

export const FIX_CHECKOUT_VALIDATION_ERROR_INTENTS = [
  'fix_checkout_validation_error',
] as const;

export type FixCheckoutValidationErrorIntent =
  (typeof FIX_CHECKOUT_VALIDATION_ERROR_INTENTS)[number];

export type CheckoutValidationErrorAspect =
  | 'email'
  | 'phone'
  | 'name'
  | 'contact_or'
  | 'profile_merge'
  | 'consent'
  | 'compact_hidden'
  | 'all';

export interface ParsedFixCheckoutValidationError {
  aspect: CheckoutValidationErrorAspect;
}

export const CUSTOMER_PUBLIC_FIX_CHECKOUT_VALIDATION_ERROR_CLASSIFIER_RULES = `- fix_checkout_validation_error: READ — troubleshoot checkout contact-field validation errors on the consumer app or public booking page when the user already tried to fill the form. Triggers: "It says enter email but I filled it in", "won't accept my email", "enter an email or phone number", "signed in but contact details missing", collapsed contact details blocking confirm. Set aspect when clear (email|phone|name|contact_or|profile_merge|consent|compact_hidden|all). Explains guest/profile merge, email OR phone rule, compact contact UI, and links field-hint guidance. NOT explain_guest_checkout_fields (proactive why/what without an error), NOT booking_help (funnel walkthrough), NOT explain_data_rights, NOT explain_clinic_booking (symptoms/referral), NOT apply_promo_code_checkout, NOT choose_payment_method|pay_online, NOT explain_amount_due_now|explain_checkout_total.`;

const VALIDATION_CUE = new RegExp(
  String.raw`\b(?:validation\s+error|error\s+message|invalid|won'?t\s+(?:accept|let)|can'?t\s+(?:book|finish|confirm|complete)|keeps?\s+(?:saying|showing|asking|telling)|still\s+(?:says|shows|asks|get|requires?)|already\s+filled|(?:say|says)\s+enter|enter\s+(?:your\s+)?(?:email|phone|name|contact)|not\s+working|blocked|fails?\s+validation|form\s+validation|contact\s+details?\s+(?:missing|required|still)|missing\s+contact|contact\s+details?.*(?:պահանջ|require|enter))\b|էլ\.?\s*փոստ.*(?:լրացր|գր|սխալ)|հեռախոս.*(?:լրացր|գր|սխալ)|սխալ\s+էլ\.?\s*փոստ|contact\s+details.*պահանջ|не\s+принимает|ошибк|уже\s+ввел|просит\s+email|не\s+могу\s+заверш|контакт.*данн`,
  'iu',
);

const CHECKOUT_CONTEXT = new RegExp(
  String.raw`\b(?:checkout|booking\s+form|booking\s+page|confirm(?:ing)?\s+(?:my\s+)?booking|contact\s+details?|personal\s+information|book\s+button|finish\s+checkout|guest\s+checkout)\b|checkout|գրանցման\s+էջ|контакт|оформлен`,
  'iu',
);

const EMAIL_TOPIC = new RegExp(
  String.raw`\b(?:e-?mail|email\s+address)\b|էլ\.?\s*փոստ|электронн`,
  'iu',
);

const PHONE_TOPIC = new RegExp(
  String.raw`\b(?:phone|mobile|cell|whatsapp|sms|number)\b|հեռախոս|телефон`,
  'iu',
);

const NAME_TOPIC = new RegExp(
  String.raw`\b(?:your\s+name|name\s+field|enter\s+(?:your\s+)?name|(?:asking|ask)\s+(?:for\s+)?(?:my\s+)?name)\b|անուն|имя`,
  'iu',
);

const CONTACT_OR_TOPIC = new RegExp(
  String.raw`\b(?:email\s+or\s+phone|phone\s+or\s+email|contact\s+details?|both\s+fields)\b|կամ\s+հեռախոս|или\s+телефон`,
  'iu',
);

const PROFILE_MERGE_TOPIC = new RegExp(
  String.raw`\b(?:signed[\s-]?in|profile\s+email|profile\s+phone|pre-?fill|my\s+profile|account\s+email|contact\s+details\s+missing)\b|մուտք(?:\s+եմ)?\s+գործ|профил|вошел`,
  'iu',
);

const CONSENT_TOPIC = new RegExp(
  String.raw`\b(?:privacy\s+consent|consent\s+checkbox|privacy\s+checkbox|data\s+processing\s+consent|agree\s+to\s+privacy)\b|համաձայն|согласи`,
  'iu',
);

const COMPACT_TOPIC = new RegExp(
  String.raw`\b(?:collapsed|expand|hidden|compact)\b.*\b(?:contact|personal\s+information|fields?)\b|\b(?:contact|personal\s+information)\b.*\b(?:collapsed|hidden|compact)\b`,
  'iu',
);

const PROACTIVE_HELP_CUE = new RegExp(
  String.raw`\b(?:why\s+do\s+you\s+need|how\s+do\s+(?:promo|guest)|can\s+i\s+book\s+without|what\s+is\s+the\s+(?:name|email|phone)\s+field\s+for|will\s+my\s+guest\s+booking\s+link|do\s+i\s+need\s+both)\b|ինչու\s+է\s+հարկավոր|зачем\s+нужен`,
  'iu',
);

export function isFixCheckoutValidationErrorIntent(
  action: string,
): action is FixCheckoutValidationErrorIntent {
  return (FIX_CHECKOUT_VALIDATION_ERROR_INTENTS as readonly string[]).includes(
    action,
  );
}

export function extractCheckoutValidationErrorAspectFromPrompt(
  prompt: string,
): CheckoutValidationErrorAspect {
  if (COMPACT_TOPIC.test(prompt)) return 'compact_hidden';
  if (CONSENT_TOPIC.test(prompt)) return 'consent';
  if (PROFILE_MERGE_TOPIC.test(prompt)) return 'profile_merge';
  if (CONTACT_OR_TOPIC.test(prompt)) return 'contact_or';
  if (NAME_TOPIC.test(prompt)) return 'name';
  if (/անուն/iu.test(prompt)) return 'name';
  if (EMAIL_TOPIC.test(prompt) && PHONE_TOPIC.test(prompt)) return 'contact_or';
  if (EMAIL_TOPIC.test(prompt)) return 'email';
  if (PHONE_TOPIC.test(prompt)) return 'phone';
  if (/\bvalidation\s+error\b/i.test(prompt)) return 'all';
  return 'all';
}

export function isFixCheckoutValidationErrorPrompt(prompt: string): boolean {
  if (isExplainDataRightsPrompt(prompt)) return false;
  if (isExplainClinicBookingPrompt(prompt)) return false;
  if (PROACTIVE_HELP_CUE.test(prompt) && !VALIDATION_CUE.test(prompt)) {
    return false;
  }

  if (
    /(?:checkout\s+validation\s+error.*անուն|անուն.*պահանջ)/iu.test(prompt) ||
    /(?:ошибка\s+валидации.*имя|имя.*ошибк)/iu.test(prompt) ||
    /(?:ասում\s+է\s+գր(?:ե|ի)ր\s+էլ\.?\s*փոստ|уже\s+ввел\s+email|ошибка\s+email|не\s+принимает\s+email)/iu.test(
      prompt,
    ) ||
    /(?:սխալ\s+էլ\.?\s*փոստ|просит\s+контакт|ошибка\s+валидации\s+checkout)/iu.test(
      prompt,
    )
  ) {
    return true;
  }

  if (!VALIDATION_CUE.test(prompt)) return false;

  return (
    CHECKOUT_CONTEXT.test(prompt) ||
    EMAIL_TOPIC.test(prompt) ||
    PHONE_TOPIC.test(prompt) ||
    NAME_TOPIC.test(prompt) ||
    CONTACT_OR_TOPIC.test(prompt) ||
    PROFILE_MERGE_TOPIC.test(prompt) ||
    CONSENT_TOPIC.test(prompt) ||
    COMPACT_TOPIC.test(prompt)
  );
}

export function parseFixCheckoutValidationErrorFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedFixCheckoutValidationError | null {
  if (!isFixCheckoutValidationErrorPrompt(prompt)) return null;

  const aspectFromParams =
    typeof params.aspect === 'string' &&
    [
      'email',
      'phone',
      'name',
      'contact_or',
      'profile_merge',
      'consent',
      'compact_hidden',
      'all',
    ].includes(params.aspect)
      ? (params.aspect as CheckoutValidationErrorAspect)
      : undefined;

  return {
    aspect:
      aspectFromParams ??
      extractCheckoutValidationErrorAspectFromPrompt(prompt),
  };
}

export function buildFixCheckoutValidationErrorNavigate(
  aspect: CheckoutValidationErrorAspect,
  params: Record<string, unknown> = {},
): {
  path: string;
  query: Record<string, string>;
  fieldHints: {
    action: 'explain_guest_checkout_fields';
    aspect: 'email' | 'phone' | 'name' | 'contact_merge' | 'consent' | 'all';
  };
} {
  const query: Record<string, string> = {};
  const serviceId = params.serviceId as string | undefined;
  const startTime = params.startTime as string | undefined;
  const employeeId = params.employeeId as string | undefined;
  const packageId = params.packageId as string | undefined;

  if (serviceId) query.serviceId = serviceId;
  if (startTime) query.startTime = startTime;
  if (employeeId) query.employeeId = employeeId;
  if (packageId) query.packageId = packageId;

  const focus =
    aspect === 'email' || aspect === 'phone' || aspect === 'name'
      ? aspect
      : aspect === 'profile_merge'
        ? 'email'
        : undefined;
  if (focus) query.focus = focus;
  if (aspect === 'compact_hidden') query.expandContact = '1';

  const fieldHintsAspect =
    aspect === 'profile_merge'
      ? 'contact_merge'
      : aspect === 'contact_or' ||
          aspect === 'compact_hidden' ||
          aspect === 'all'
        ? 'all'
        : aspect === 'consent'
          ? 'consent'
          : aspect;

  return {
    path: 'checkout',
    query,
    fieldHints: {
      action: 'explain_guest_checkout_fields',
      aspect: fieldHintsAspect,
    },
  };
}

export function rescueFixCheckoutValidationErrorIntent(
  prompt: string,
  action: string,
): { action: FixCheckoutValidationErrorIntent; rescueReason: string } | null {
  if (isFixCheckoutValidationErrorIntent(action)) return null;
  if (!parseFixCheckoutValidationErrorFromPrompt(prompt)) return null;
  return {
    action: 'fix_checkout_validation_error',
    rescueReason: 'checkout_validation_error',
  };
}
