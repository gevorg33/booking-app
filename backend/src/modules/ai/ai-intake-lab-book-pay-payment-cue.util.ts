import {
  isChoosePaymentMethodPrompt,
  isPayOnlinePrompt,
} from './ai-payments.util.js';
import { isAskPaymentOptionsPrompt } from './ai-cash-payment-checkout.util.js';

export function hasIntakeLabBookPayPaymentCue(prompt: string): boolean {
  if (isPayOnlinePrompt(prompt)) return true;
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
  return false;
}
