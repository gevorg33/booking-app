/** prov-exp-5.3 — provider mobile chair-side actions AI helpers. */

import { extractProductNameFromPrompt } from './ai-retail-finance.util.js';
import { rescueProviderTimeOffIntent } from './ai-provider-time-off.util.js';

export const PROVIDER_EXP_3_INTENTS = [
  'add_retail_to_booking',
  'send_client_message',
  'block_my_time',
  'request_time_off',
] as const;

export const PROVIDER_EXP_3_MUTATE_INTENTS = [
  'add_retail_to_booking',
  'block_my_time',
  'request_time_off',
] as const;

export type ProviderExp3Intent = (typeof PROVIDER_EXP_3_INTENTS)[number];

export function isProviderExp3Intent(action: string): action is ProviderExp3Intent {
  return (PROVIDER_EXP_3_INTENTS as readonly string[]).includes(action);
}

export function isAddRetailToBookingPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(remove|delete)\b/i.test(lower)) return false;
  return (
    (/\b(add|attach|sell)\b/i.test(prompt) &&
      /\b(booking|appointment)\b/i.test(prompt) &&
      (/\b(product|retail|shampoo|conditioner|sku)\b/i.test(prompt) ||
        /\badd\s+[A-Za-z]/i.test(prompt))) ||
    (/\badd\b/i.test(prompt) &&
      /\bmy\s+(booking|appointment)\b/i.test(prompt) &&
      (/\b(retail|product)\b/i.test(prompt) || /\badd\s+[A-Za-z]/i.test(prompt)))
  );
}

export function isSendClientMessagePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(staff note|internal note|add note)\b/i.test(lower)) return false;
  if (/\b(running late|confirming tomorrow|canned message|message template)\b/i.test(lower)) {
    return true;
  }
  return (
    /\b(send|text|message|sms|whatsapp|notify)\b/i.test(prompt) &&
    /\b(client|customer)\b/i.test(prompt)
  );
}

export function isBlockMyTimePrompt(prompt: string): boolean {
  return /\b(block\s+my\b|my\s+lunch\b|block\s+(?:my\s+)?(?:break|lunch|time))\b/i.test(
    prompt,
  );
}

export function extractSendMessageChannel(
  prompt: string,
  params: Record<string, unknown>,
): 'sms' | 'whatsapp' {
  const raw = String(params.channel ?? '').toLowerCase();
  if (raw === 'whatsapp') return 'whatsapp';
  if (raw === 'sms') return 'sms';
  if (/\bwhatsapp\b/i.test(prompt)) return 'whatsapp';
  return 'sms';
}

export function extractMessageTemplateHint(
  prompt: string,
  params: Record<string, unknown>,
): string | null {
  const fromParams =
    (typeof params.templateId === 'string' && params.templateId.trim()) ||
    (typeof params.messageTemplate === 'string' && params.messageTemplate.trim()) ||
    (typeof params.templateLabel === 'string' && params.templateLabel.trim()) ||
    null;
  if (fromParams) return fromParams;

  if (/\brunning\s+late\b/i.test(prompt)) return 'running-late';
  if (/\bconfirm(?:ing)?\s+tomorrow\b/i.test(prompt)) return 'confirming-tomorrow';
  return null;
}

export function extractBlockWindowFromPrompt(prompt: string): {
  startTime: string | null;
  endTime: string | null;
} {
  const range = prompt.match(
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|–|-)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
  );
  if (!range) return { startTime: null, endTime: null };
  return { startTime: range[1].trim(), endTime: range[2].trim() };
}

export function extractRetailProductName(
  prompt: string,
  params: Record<string, unknown>,
): string | null {
  const fromParams =
    (typeof params.productName === 'string' && params.productName.trim()) ||
    (typeof params.serviceName === 'string' && params.serviceName.trim()) ||
    null;
  return fromParams ?? extractProductNameFromPrompt(prompt);
}

export function rescueProviderExp3Intent(
  prompt: string,
  action: string,
): { action: ProviderExp3Intent; rescueReason: string } | null {
  if (isProviderExp3Intent(action)) return null;

  if (isAddRetailToBookingPrompt(prompt)) {
    return { action: 'add_retail_to_booking', rescueReason: 'add_retail_booking' };
  }
  if (isSendClientMessagePrompt(prompt)) {
    return { action: 'send_client_message', rescueReason: 'send_client_message' };
  }
  if (isBlockMyTimePrompt(prompt)) {
    return { action: 'block_my_time', rescueReason: 'block_my_time' };
  }

  const timeOff = rescueProviderTimeOffIntent(prompt, action);
  if (timeOff) {
    return {
      action: 'request_time_off',
      rescueReason: timeOff.rescueReason,
    };
  }

  return null;
}
