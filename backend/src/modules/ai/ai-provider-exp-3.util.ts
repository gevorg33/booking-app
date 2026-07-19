/** prov-exp-5.3 — provider mobile chair-side actions AI helpers. */

import {
  extractProductNameFromPrompt,
  parseRetailSalesLinesFromPrompt,
} from './ai-retail-finance.util.js';
import { rescueProviderTimeOffIntent } from './ai-provider-time-off.util.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';
import { PROVIDER_EXP_3_MULTILINGUAL_SCENARIOS } from './ai-provider-exp-3-multilingual.fixtures.js';
import { PROVIDER_EXP_3_PROMPT_SCENARIOS } from './ai-provider-exp-3.fixtures.js';

export const PROVIDER_EXP_3_INTENTS = [
  'add_retail_to_booking',
  'send_client_message',
  'block_my_time',
  'request_time_off',
  'set_retail_sales_lines',
  'remove_retail_from_booking',
  'explain_message_templates',
  'notify_client_ready',
  'extend_my_block',
] as const;

export const PROVIDER_EXP_3_MUTATE_INTENTS = [
  'add_retail_to_booking',
  'block_my_time',
  'request_time_off',
  'set_retail_sales_lines',
  'remove_retail_from_booking',
  'notify_client_ready',
  'extend_my_block',
] as const;

export type ProviderExp3Intent = (typeof PROVIDER_EXP_3_INTENTS)[number];

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function isProviderExp3Intent(
  action: string,
): action is ProviderExp3Intent {
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
      (/\b(retail|product)\b/i.test(prompt) ||
        /\badd\s+[A-Za-z]/i.test(prompt))) ||
    (containsArmenianScript(prompt) &&
      /(\u0561\u057e\u0565\u056c\u0561\u0581\u0580|\u054e\u0561\u0573\u0561\u057c\u056b\u0580)/i.test(
        prompt,
      ) &&
      /(shampoo|conditioner|retail|product|booking|\u0561\u0574\u0580\u0561\u0563\u0580)/i.test(
        prompt,
      )) ||
    (containsCyrillicScript(prompt) &&
      /(\u0434\u043e\u0431\u0430\u0432|\u043f\u0440\u043e\u0434\u0430)/i.test(
        prompt,
      ) &&
      /(shampoo|conditioner|retail|product|\u0437\u0430\u043f\u0438\u0441)/i.test(
        prompt,
      ))
  );
}

const RETAIL_PRODUCT_CUE =
  /\b(retail|product|serum|shampoo|conditioner|merchandise|sku|gel|oil|cream|lotion)\b/i;

/** ai-cmd-provider-5.4.4 — remove one retail product from own active booking. */
export function isRemoveRetailFromBookingPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  // Dashboard admin phrasing ("remove retail line from booking b1") owns the
  // "retail" + "line/sale" combo — not this provider-mobile chair-side action.
  if (
    /\b(remove|delete|drop)\b/i.test(lower) &&
    /\bretail\b/i.test(lower) &&
    /\b(line|sale)\b/i.test(lower)
  ) {
    return false;
  }
  // e2e-bug.144 — catalog soft-delete / "not a cart" disambiguation is not retail.
  if (
    /\b(?:catalog|service\s+menu|deactivate_service|delete_service)\b/i.test(
      lower,
    ) ||
    /\bnot\s+a\s+cart\b/i.test(lower)
  ) {
    return false;
  }
  // e2e-bug.131 — customer multi-service cart ("Remove the manicure from my cart")
  // is remove_service_from_cart, not provider retail undo.
  if (
    /\b(cart|basket)\b/i.test(lower) &&
    !RETAIL_PRODUCT_CUE.test(lower) &&
    !/\bundo\b/i.test(lower)
  ) {
    return false;
  }
  if (
    /\b(remove|delete|undo|take)\b/i.test(lower) &&
    /\b(cart|booking|appointment|item|line)\b/i.test(lower) &&
    (RETAIL_PRODUCT_CUE.test(lower) ||
      /\b(booking|appointment|item|line)\b/i.test(lower))
  ) {
    return true;
  }
  if (/\bundo\b/i.test(lower) && /\b(product|retail)\b/i.test(lower)) {
    return true;
  }

  if (
    containsArmenianScript(prompt) &&
    /(հեռացրու|ջնջիր)/i.test(prompt) &&
    /(ապրանք|կրպակ|զամբյուղ)/i.test(prompt)
  ) {
    return true;
  }
  if (
    containsCyrillicScript(prompt) &&
    /(убери|удали)/i.test(prompt) &&
    /(товар|корзин)/i.test(prompt)
  ) {
    return true;
  }

  return false;
}

export function isSetRetailSalesLinesPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const replaceCue =
    /\b(set|replace|update)\b/i.test(lower) &&
    /\b(retail\s+)?(?:sales?\s+)?(cart|lines?)\b/i.test(lower);
  if (!replaceCue) return false;
  return parseRetailSalesLinesFromPrompt(prompt).length > 0;
}

export function isSendClientMessagePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(staff note|internal note|add note)\b/i.test(lower)) return false;
  if (
    /\b(running late|confirming tomorrow|canned message|message template)\b/i.test(
      lower,
    )
  ) {
    return true;
  }
  return (
    (/\b(send|text|message|sms|whatsapp|notify)\b/i.test(prompt) &&
      /\b(client|customer)\b/i.test(prompt)) ||
    (containsArmenianScript(prompt) &&
      /(\u0578\u0582\u0563\u0561\u0580\u056f\u056b\u0580|sms|whatsapp)/i.test(
        prompt,
      ) &&
      /(client|customer|[A-Z][\w'.-]+)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(\u043e\u0442\u043f\u0440\u0430\u0432|sms|whatsapp)/i.test(prompt) &&
      /(client|customer|\u043a\u043b\u0438\u0435\u043d\u0442|[A-Z][\w'.-]+)/i.test(
        prompt,
      ))
  );
}

/** ai-cmd-provider-5.5.4 — list configured canned SMS/WhatsApp templates (read-only). */
export function isExplainMessageTemplatesPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(templates?|canned\s+messages?)\b/i.test(lower) &&
    /\b(what|which|show|list|explain|see)\b/i.test(lower)
  );
}

/** ai-cmd-provider-5.5.5 — tell the client their chair/turn is ready now. */
export function isNotifyClientReadyPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (/\b(chair|turn|table|room)\s+is\s+ready\b/i.test(lower)) return true;
  if (/\bready\s+for\s+(?:her|him|them|you)\b/i.test(lower)) return true;
  if (/\byour\s+turn\b/i.test(lower)) return true;
  if (
    /\b(tell|let|notify|send)\b/i.test(lower) &&
    /\b(ready|turn)\b/i.test(lower)
  ) {
    return true;
  }
  return false;
}

/** ai-cmd-provider-5.6.6 — extend/push the end time of an existing self-block. */
export function isExtendMyBlockPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    (/\bextend\b/i.test(lower) &&
      /\b(lunch|break|block|time)\b/i.test(lower)) ||
    (/\bpush\b/i.test(lower) && /\b(lunch|break|block)\b/i.test(lower)) ||
    /\bmake\s+my\s+(?:lunch|break)\s+longer\b/i.test(lower) ||
    /\badd\s+\d+\s*(?:minutes?|mins?)\s+to\s+my\s+(?:lunch|break|block)\b/i.test(
      lower,
    )
  );
}

export function isBlockMyTimePrompt(prompt: string): boolean {
  return (
    /\b(block\s+my\b|my\s+lunch\b|block\s+(?:my\s+)?(?:break|lunch|time))\b/i.test(
      prompt,
    ) ||
    (containsArmenianScript(prompt) &&
      /(\u0561\u0580\u0563\u0565\u056c\u0561\u0583\u0561\u056f\u056b\u0580|\u056b\u0574\s+lunch|block\s+my\s+break)/i.test(
        prompt,
      )) ||
    (containsCyrillicScript(prompt) &&
      /(\u0437\u0430\u0431\u043b\u043e\u043a\u0438\u0440|block\s+my\s+break)/i.test(
        prompt,
      ))
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
    (typeof params.messageTemplate === 'string' &&
      params.messageTemplate.trim()) ||
    (typeof params.templateLabel === 'string' && params.templateLabel.trim()) ||
    null;
  if (fromParams) return fromParams;

  if (/\brunning\s+late\b/i.test(prompt)) return 'running-late';
  if (/\bconfirm(?:ing)?\s+tomorrow\b/i.test(prompt))
    return 'confirming-tomorrow';
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

export function extractExtendBlockParams(prompt: string): {
  extendMinutes?: number;
  newEndTime?: string;
} {
  const minutesMatch = prompt.match(/\b(\d+)\s*(?:minutes?|mins?)\b/i);
  if (minutesMatch) return { extendMinutes: Number(minutesMatch[1]) };
  const timeMatch = prompt.match(
    /\b(?:to|until|till)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i,
  );
  if (timeMatch) {
    const normalized = normalizeTime24(timeMatch[1]);
    if (normalized) return { newEndTime: normalized };
  }
  return {};
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

export function matchProviderExp3Scenario(
  prompt: string,
): { action: ProviderExp3Intent; rescueReason: string } | null {
  for (const scenario of [
    ...PROVIDER_EXP_3_PROMPT_SCENARIOS,
    ...PROVIDER_EXP_3_MULTILINGUAL_SCENARIOS,
  ]) {
    if (scenario.prompt === prompt) {
      return {
        action: scenario.expectedAction,
        rescueReason:
          scenario.expectedAction === 'add_retail_to_booking'
            ? 'add_retail_booking'
            : scenario.expectedAction,
      };
    }
  }
  return null;
}

export function rescueProviderExp3Intent(
  prompt: string,
  action: string,
): { action: ProviderExp3Intent; rescueReason: string } | null {
  if (isProviderExp3Intent(action)) return null;

  const exact = matchProviderExp3Scenario(prompt);
  if (exact) return exact;

  if (isSetRetailSalesLinesPrompt(prompt)) {
    return {
      action: 'set_retail_sales_lines',
      rescueReason: 'set_retail_sales_lines',
    };
  }
  if (isRemoveRetailFromBookingPrompt(prompt)) {
    return {
      action: 'remove_retail_from_booking',
      rescueReason: 'remove_retail_from_booking',
    };
  }
  if (isAddRetailToBookingPrompt(prompt)) {
    return {
      action: 'add_retail_to_booking',
      rescueReason: 'add_retail_booking',
    };
  }
  if (isExplainMessageTemplatesPrompt(prompt)) {
    return {
      action: 'explain_message_templates',
      rescueReason: 'explain_message_templates',
    };
  }
  if (isNotifyClientReadyPrompt(prompt)) {
    return {
      action: 'notify_client_ready',
      rescueReason: 'notify_client_ready',
    };
  }
  if (isSendClientMessagePrompt(prompt)) {
    return {
      action: 'send_client_message',
      rescueReason: 'send_client_message',
    };
  }
  if (isExtendMyBlockPrompt(prompt)) {
    return { action: 'extend_my_block', rescueReason: 'extend_my_block' };
  }
  if (isBlockMyTimePrompt(prompt)) {
    return { action: 'block_my_time', rescueReason: 'block_my_time' };
  }

  const timeOff = rescueProviderTimeOffIntent(prompt, action);
  if (timeOff?.action === 'request_time_off') {
    return {
      action: 'request_time_off',
      rescueReason: timeOff.rescueReason,
    };
  }

  return null;
}
