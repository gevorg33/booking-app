import {
  isExplainCheckoutTotalPrompt,
  isExplainPaymentStatusPrompt,
} from './ai-payments.util.js';
import { isExplainTourBookingRecordPrompt } from './ai-tour-booking-record.util.js';

export const NOTIFICATION_CURRENCY_INTENTS = [
  'explain_notification_currency',
] as const;

export type NotificationCurrencyIntent =
  (typeof NOTIFICATION_CURRENCY_INTENTS)[number];

export function isNotificationCurrencyIntent(
  action: string,
): action is NotificationCurrencyIntent {
  return (NOTIFICATION_CURRENCY_INTENTS as readonly string[]).includes(action);
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function hasCurrencyCue(prompt: string): boolean {
  return (
    /[€֏₽$£]/.test(prompt) ||
    /\b(currency|dram|drams|euro|euros|ruble|rubles|dollar|dollars)\b/i.test(
      prompt,
    ) ||
    /\b(AMD|EUR|RUB|USD|GBP|GEL)\b/i.test(prompt)
  );
}

export function hasNotificationCurrencyContext(prompt: string): boolean {
  return (
    /\b(booking\s+confirmation|appointment\s+reminder|gift\s*card\s+(?:email|confirmation|receipt|purchase\s+email|message))\b/i.test(
      prompt,
    ) ||
    /\b(confirmation|reminder)\s+(?:email|message|text|sms|whatsapp)\b/i.test(
      prompt,
    ) ||
    (/\b(confirmation|reminder|notification)\b/i.test(prompt) &&
      /\b(email|e-mail|whatsapp|what'?s?\s*app|sms|text\s*message|message|sent|received|got)\b/i.test(
        prompt,
      )) ||
    (/\b(email|e-mail|whatsapp|what'?s?\s*app|sms)\b/i.test(prompt) &&
      /\b(confirmation|reminder|booking|appointment|gift\s*card|amount|price)\b/i.test(
        prompt,
      )) ||
    /(?:նամակ|հաստատում|հիշեցում|whatsapp|հաղորդագր)/i.test(prompt) ||
    /(?:письм|подтвержден|напоминан|whatsapp|сообщен)/i.test(prompt)
  );
}

export function isExplainNotificationCurrencyPrompt(prompt: string): boolean {
  if (isExplainTourBookingRecordPrompt(prompt)) return false;
  if (isExplainCheckoutTotalPrompt(prompt)) return false;
  if (isExplainPaymentStatusPrompt(prompt) && !hasCurrencyCue(prompt)) {
    return false;
  }
  if (!hasNotificationCurrencyContext(prompt)) return false;

  const hasCurrencyCueFlag = hasCurrencyCue(prompt);

  if (
    /\bwhy\b.+\b(email|reminder|confirmation|whatsapp|message|notification|amount|price)\b/i.test(
      prompt,
    ) &&
    hasCurrencyCueFlag
  ) {
    return true;
  }

  if (/\bwhat currency\b/i.test(prompt)) {
    return true;
  }

  if (
    /\b(why|what|which)\b/i.test(prompt) &&
    hasCurrencyCueFlag &&
    /\b(email|reminder|confirmation|whatsapp|message|notification|sent|received)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(currency|money|symbol)\b/i.test(prompt) &&
    /\b(email|reminder|confirmation|whatsapp|message|notification|gift\s*card)\b/i.test(
      prompt,
    )
  ) {
    return /\b(why|what|which|explain|different)\b/i.test(prompt);
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(ինչու|ինչ|որն|որը|որ)/i.test(prompt) &&
      /(արժույթ|գին|գումար|նամակ|հաստատում|հիշեցում|€|֏|₽|AMD|EUR|RUB|USD)/i.test(
        prompt,
      )
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(почему|зачем|какая|какой|объясни)/i.test(prompt) &&
      /(валют|цен|сумм|письм|подтвержден|напоминан|€|֏|₽|рубл|евро|драм)/i.test(
        prompt,
      )
    ) {
      return true;
    }
  }

  return false;
}

export function rescueNotificationCurrencyIntent(
  prompt: string,
  action: string,
): { action: NotificationCurrencyIntent; rescueReason: string } | null {
  if (isNotificationCurrencyIntent(action)) return null;
  if (!isExplainNotificationCurrencyPrompt(prompt)) return null;
  return {
    action: 'explain_notification_currency',
    rescueReason: 'explain_notification_currency',
  };
}
