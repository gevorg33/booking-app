import {
  isChoosePaymentMethodPrompt,
  isPayCashAtVisitPrompt,
  isPayOnlinePrompt,
} from './ai-payments.util.js';
import { isAskPaymentOptionsPrompt } from './ai-cash-payment-checkout.util.js';

/** e2e-bug.99 — cash-at-visit is a valid third-step payment cue for intake+lab. */
const CASH_AT_VISIT_PAYMENT_CUE =
  /\b(?:pay|paying|paid|will\s+pay)\b.{0,40}\b(?:cash|at\s+(?:the\s+)?(?:visit|venue|salon|appointment))\b|\bcash\s+(?:payment\s+)?at\s+(?:the\s+)?(?:visit|venue|appointment)\b/i;

export function hasIntakeLabBookPayPaymentCue(prompt: string): boolean {
  if (isPayOnlinePrompt(prompt)) return true;
  if (isPayCashAtVisitPrompt(prompt)) return true;
  if (isChoosePaymentMethodPrompt(prompt)) return true;
  if (
    isAskPaymentOptionsPrompt(prompt) &&
    /\b(?:intake|questionnaire|health\s+form|blood|lab|draw|CBC)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /\b(?:pay|paying|paid)\b/i.test(prompt) &&
    /\b(?:deposit|prepay|prepayment|online|card|stripe|checkout)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /\b(?:and|then|;\s*)\s*pay\b/i.test(prompt) &&
    /\b(?:online|card|stripe|checkout|deposit|payment)\b/i.test(prompt)
  ) {
    return true;
  }
  // e2e-bug.99 — "pay cash at the visit" / "I will pay cash at the visit"
  if (CASH_AT_VISIT_PAYMENT_CUE.test(prompt)) return true;
  return false;
}
