import { isExplainDataRightsPrompt } from './ai-data-rights.util.js';
import { isExplainWhySignInPrompt } from './ai-explain-why-sign-in.util.js';
import { isExplainTenantCurrencyPrompt } from './ai-tenant-currency.util.js';
import { isExplainNotificationCurrencyPrompt } from './ai-notification-currency.util.js';
import { isExplainClinicBookingPrompt } from './ai-clinic-booking.util.js';
import { isExplainAmountDueNowPrompt } from './ai-explain-amount-due-now.util.js';
import { isFixCheckoutValidationErrorPrompt } from './ai-fix-checkout-validation-error.util.js';
import { isConfigureGranularConsentPrompt } from './ai-business-compliance.util.js';
import { isConfigureStripeConnectPrompt } from './ai-stripe-connect.util.js';
import { isExplainProviderDateDisplayPrompt } from './ai-provider-date-format.util.js';
import { isExplainPackageDisplayNamePrompt } from './ai-package-display-name.util.js';
import { isExplainCheckoutRecommendationsPrompt } from './ai-checkout-recommendations.util.js';
import { isExplainRecommendationAnalyticsPrompt } from './ai-recommendation-analytics.util.js';
import { isExplainRecommendationSetupPrompt } from './ai-recommendation-product.util.js';

export const GUEST_CHECKOUT_FIELDS_INTENTS = [
  'explain_guest_checkout_fields',
] as const;

export type GuestCheckoutFieldsIntent =
  (typeof GUEST_CHECKOUT_FIELDS_INTENTS)[number];

export type GuestCheckoutFieldsAspect =
  | 'email'
  | 'phone'
  | 'name'
  | 'guest_vs_account'
  | 'contact_merge'
  | 'reminders'
  | 'consent'
  | 'all';

export interface ParsedExplainGuestCheckoutFields {
  aspect: GuestCheckoutFieldsAspect;
}

export const CUSTOMER_PUBLIC_EXPLAIN_GUEST_CHECKOUT_FIELDS_CLASSIFIER_RULES = `- explain_guest_checkout_fields: READ — explain guest checkout contact fields on the consumer app or public booking page: why name/email/phone are collected, email OR phone rule, signed-in vs guest merge, reminder toggles, and privacy consent checkboxes. Triggers: "Why do you need my email?", "Do I need both email and phone?", "Will my guest booking link after sign-in?". Set aspect when clear (email|phone|name|guest_vs_account|contact_merge|reminders|consent|all). NOT explain_why_sign_in (account required/benefits/history — no field focus), NOT sign_in_after_booking (PostBookingSignInPrompt after confirmation), NOT booking_help (full funnel walkthrough without field focus), NOT explain_data_rights (GDPR export/delete/cookie banner), NOT explain_clinic_booking (symptoms/referral/fasting), NOT explain_clinic_booking_fields (ID/DOB/insurance/intake identity fields), NOT fix_checkout_validation_error (validation error troubleshooting), NOT privacy_export|privacy_delete (mutate), NOT explain_amount_due_now|explain_checkout_total (payment math).`;

const READ_CUE = new RegExp(
  String.raw`\b(what|why|how|where|explain|tell|describe|should|do i|does|can i|need|required|optional|mean|means|without|guest|account)\b|ինչ|ինչու|ինչպես|բացատր|պետք|համար\s+է|что|почему|как|объясни|нужно|зачем|можно\s+ли|без\s+аккаунта`,
  'iu',
);

const CHECKOUT_CONTACT_CONTEXT = new RegExp(
  String.raw`\b(checkout|booking\s+page|booking\s+form|contact\s+details?|guest\s+checkout|when\s+i\s+book|this\s+page|confirm(?:ing)?\s+(?:my\s+)?booking)\b|checkout|գրանցման\s+էջ|հեռախոս|էլ\.?\s*փոստ|страниц[аеы]\s+записи|при\s+записи|контакт`,
  'iu',
);

const EMAIL_TOPIC = new RegExp(
  String.raw`\b(?:e-?mail|email\s+address|my\s+email)\b|էլ\.?\s*փոստ|электронн`,
  'iu',
);

const PHONE_TOPIC = new RegExp(
  String.raw`\b(?:phone|mobile|cell|whatsapp|sms)\b|հեռախոս|телефон|whatsapp`,
  'iu',
);

const NAME_TOPIC = new RegExp(
  String.raw`\b(?:my\s+)?name(?:\s+field)?|full\s+name|your\s+name\b|անուն|имя|фио`,
  'iu',
);

const GUEST_ACCOUNT_TOPIC = new RegExp(
  String.raw`\b(?:guest|without(?:\s+(?:creating|making))?\s+(?:an?\s+)?account|no\s+account|sign[\s-]?up|create\s+(?:an?\s+)?account|log[\s-]?in|signed[\s-]?in|register|book\s+without)\b|հյուր|հաշիվ|գրանցվել|без\s+аккаунта|гостев|регистрац`,
  'iu',
);

const MERGE_TOPIC = new RegExp(
  String.raw`\b(?:merge|link|same\s+(?:email|phone)|after\s+(?:i\s+)?sign[\s-]?in|existing\s+customer|returning\s+guest|pre-?fill|profile)\b|միացն|նույն\s+էլ|привяз|тот\s+же\s+email|объедин`,
  'iu',
);

const REMINDER_TOPIC = new RegExp(
  String.raw`\b(?:reminders?|remind\s+me|email\s+reminders?|sms\s+reminders?|whatsapp\s+reminders?)\b|հիշեցում|напоминан`,
  'iu',
);

const CONSENT_TOPIC = new RegExp(
  String.raw`\b(?:consent|privacy\s+checkbox|marketing\s+opt|agree\s+to\s+privacy|data\s+processing)\b|համաձայն|согласи`,
  'iu',
);

const BOTH_CONTACT_TOPIC = new RegExp(
  String.raw`\b(?:both\s+(?:email\s+and\s+phone|phone\s+and\s+email)|email\s+or\s+phone|phone\s+or\s+email|either\s+email)\b|կամ\s+հեռախոս|կամ\s+էլ|և՛\s+հեռախոս|և՛\s+էլ|или\s+телефон|или\s+email|и\s+телефон,\s+и\s+email`,
  'iu',
);

const BLOCK_TOPIC = new RegExp(
  String.raw`\b(?:validation\s+error|invalid\s+email|won'?t\s+accept|(?:say|says)\s+enter|already\s+filled|error\s+message|fix\s+checkout|still\s+(?:get|says|show|ask).*enter|contact\s+details?\s+missing|passenger|pax|group\s+size|tour\s+checkout|symptoms?|referral|fasting|lab\s+prep|export\s+my\s+data|delete\s+my\s+account|cookie\s+banner|gdpr|deposit|due\s+today|pay\s+today|checkout\s+total)\b|ախտանիշ|экспорт\s+данных|удалить\s+аккаунт|депозит`,
  'iu',
);

const GENERIC_FUNNEL_WALKTHROUGH = new RegExp(
  String.raw`\b(?:walk\s+me\s+through\s+(?:booking|checkout\s+and\s+payment)|how\s+do\s+i\s+book(?:\s+online)?\s+step\s+by\s+step|what\s+happens\s+after\s+i\s+pick\s+a\s+time|pick\s+a\s+service\s+and\s+provider)\b`,
  'iu',
);

const GUEST_FIELD_TOPIC = new RegExp(
  String.raw`${EMAIL_TOPIC.source}|${PHONE_TOPIC.source}|${NAME_TOPIC.source}|${GUEST_ACCOUNT_TOPIC.source}|${MERGE_TOPIC.source}|${REMINDER_TOPIC.source}|${CONSENT_TOPIC.source}|${BOTH_CONTACT_TOPIC.source}|guest\s+checkout|contact\s+details?`,
  'iu',
);

export function isGuestCheckoutFieldsIntent(
  action: string,
): action is GuestCheckoutFieldsIntent {
  return (GUEST_CHECKOUT_FIELDS_INTENTS as readonly string[]).includes(action);
}

function isCheckoutConsentPrompt(prompt: string): boolean {
  return (
    CONSENT_TOPIC.test(prompt) &&
    (CHECKOUT_CONTACT_CONTEXT.test(prompt) ||
      /\b(?:checkbox|before\s+(?:i\s+)?confirm)\b/i.test(prompt))
  );
}

function isGuestCheckoutOverviewPrompt(prompt: string): boolean {
  return /\b(?:guest\s+checkout\s+requires?|what\s+guest\s+checkout|guest\s+checkout\s+fields?)\b/iu.test(
    prompt,
  );
}

export function extractGuestCheckoutFieldsAspectFromPrompt(
  prompt: string,
): GuestCheckoutFieldsAspect {
  if (BOTH_CONTACT_TOPIC.test(prompt)) return 'all';
  if (isGuestCheckoutOverviewPrompt(prompt)) return 'all';
  if (CONSENT_TOPIC.test(prompt)) return 'consent';
  if (REMINDER_TOPIC.test(prompt)) return 'reminders';
  if (MERGE_TOPIC.test(prompt)) return 'contact_merge';
  if (GUEST_ACCOUNT_TOPIC.test(prompt)) return 'guest_vs_account';
  if (EMAIL_TOPIC.test(prompt) && /\b(?:no|without)\s+phone\b/i.test(prompt)) {
    return 'email';
  }
  if (PHONE_TOPIC.test(prompt) && /\b(?:no|without)\s+email\b/i.test(prompt)) {
    return 'phone';
  }
  if (EMAIL_TOPIC.test(prompt) && /\bjust\s+email\b/i.test(prompt))
    return 'email';
  if (PHONE_TOPIC.test(prompt) && /\bjust\s+(?:my\s+)?phone\b/i.test(prompt)) {
    return 'phone';
  }
  if (NAME_TOPIC.test(prompt)) return 'name';
  if (EMAIL_TOPIC.test(prompt)) return 'email';
  if (PHONE_TOPIC.test(prompt)) return 'phone';
  if (
    /\b(?:guest\s+checkout|contact\s+details?|checkout\s+fields?)\b/iu.test(
      prompt,
    )
  ) {
    return 'all';
  }
  return 'all';
}

export function isExplainGuestCheckoutFieldsPrompt(prompt: string): boolean {
  if (isConfigureGranularConsentPrompt(prompt)) return false;
  if (isConfigureStripeConnectPrompt(prompt)) return false;
  if (isExplainProviderDateDisplayPrompt(prompt)) return false;
  if (isExplainPackageDisplayNamePrompt(prompt)) return false;
  if (isExplainCheckoutRecommendationsPrompt(prompt)) return false;
  if (isExplainRecommendationAnalyticsPrompt(prompt)) return false;
  if (isExplainRecommendationSetupPrompt(prompt)) return false;
  if (isExplainWhySignInPrompt(prompt)) return false;
  if (
    /\b(save (?:this )?booking to (?:my )?account|sign in with google after|post-booking sign|after (?:my )?booking|maybe later on save|confirmation screen save)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }
  if (isFixCheckoutValidationErrorPrompt(prompt)) return false;
  if (isCheckoutConsentPrompt(prompt)) return true;
  if (isExplainDataRightsPrompt(prompt)) return false;
  if (isExplainTenantCurrencyPrompt(prompt)) return false;
  if (isExplainNotificationCurrencyPrompt(prompt)) return false;
  if (isExplainClinicBookingPrompt(prompt)) return false;
  if (isExplainAmountDueNowPrompt(prompt)) return false;
  if (BLOCK_TOPIC.test(prompt)) return false;
  if (
    GENERIC_FUNNEL_WALKTHROUGH.test(prompt) &&
    !GUEST_FIELD_TOPIC.test(prompt)
  ) {
    return false;
  }

  if (
    /(?:ինչու\s+է\s+հարկավոր\s+(?:է\s+)?էլ\.?\s*փոստ|կարո՞ղ\s+եմ\s+ամրագրել\s+առանց\s+հաշվի|պետք\s+է՞.*հեռախոս.*էլ)/iu.test(
      prompt,
    ) ||
    /(?:зачем\s+нужен\s+email|можно\s+ли\s+записаться\s+без\s+аккаунта|нужны\s+ли\s+и\s+телефон,\s+и\s+email)/iu.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    (EMAIL_TOPIC.test(prompt) || PHONE_TOPIC.test(prompt)) &&
    /\b(?:just|only)\b/i.test(prompt) &&
    /\b(?:book|checkout)\b/i.test(prompt)
  ) {
    return true;
  }

  if (!READ_CUE.test(prompt) && !GUEST_ACCOUNT_TOPIC.test(prompt)) {
    return false;
  }

  if (GUEST_FIELD_TOPIC.test(prompt)) {
    return (
      CHECKOUT_CONTACT_CONTEXT.test(prompt) ||
      GUEST_ACCOUNT_TOPIC.test(prompt) ||
      MERGE_TOPIC.test(prompt) ||
      isGuestCheckoutOverviewPrompt(prompt) ||
      /\b(?:guest\s+checkout|contact\s+details?)\b/iu.test(prompt)
    );
  }

  return false;
}

export function parseExplainGuestCheckoutFieldsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainGuestCheckoutFields | null {
  if (!isExplainGuestCheckoutFieldsPrompt(prompt)) return null;

  const aspectFromParams =
    typeof params.aspect === 'string' &&
    [
      'email',
      'phone',
      'name',
      'guest_vs_account',
      'contact_merge',
      'reminders',
      'consent',
      'all',
    ].includes(params.aspect)
      ? (params.aspect as GuestCheckoutFieldsAspect)
      : undefined;

  return {
    aspect:
      aspectFromParams ?? extractGuestCheckoutFieldsAspectFromPrompt(prompt),
  };
}

export function rescueExplainGuestCheckoutFieldsIntent(
  prompt: string,
  action: string,
): { action: GuestCheckoutFieldsIntent; rescueReason: string } | null {
  if (isGuestCheckoutFieldsIntent(action)) return null;
  if (!parseExplainGuestCheckoutFieldsFromPrompt(prompt)) return null;
  return {
    action: 'explain_guest_checkout_fields',
    rescueReason: 'guest_checkout_fields',
  };
}
