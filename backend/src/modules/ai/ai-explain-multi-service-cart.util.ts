import {
  EXPLAIN_MULTI_SERVICE_CART_PROMPTS,
  type ExplainMultiServiceCartFocus,
  type ExplainMultiServiceCartPromptFixture,
} from './ai-explain-multi-service-cart.fixtures.js';
import { EXPLAIN_MULTI_SERVICE_CART_MULTILINGUAL_SCENARIOS } from './ai-explain-multi-service-cart-multilingual.fixtures.js';
import { isAddServicesToCartPrompt } from './ai-self-service-booking.util.js';

export type MultiServiceCartLine = {
  id: string;
  name: string;
  durationMinutes: number;
  bufferMinutes?: number;
  price?: number;
};

export function computeMultiServiceCartTotalMinutes(
  services: Array<{ durationMinutes: number; bufferMinutes?: number }>,
  turnoverBufferMinutes = 5,
): number {
  const base = services.reduce(
    (sum, svc) => sum + svc.durationMinutes + (svc.bufferMinutes ?? 0),
    0,
  );
  if (services.length <= 1) return base;
  return base + (services.length - 1) * turnoverBufferMinutes;
}

function matchExplainMultiServiceCartScenario(
  prompt: string,
): ExplainMultiServiceCartPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_MULTI_SERVICE_CART_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_MULTI_SERVICE_CART_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function inferExplainMultiServiceCartFocus(
  prompt: string,
): ExplainMultiServiceCartFocus {
  const scenario = matchExplainMultiServiceCartScenario(prompt);
  if (scenario?.focus) return scenario.focus;
  if (
    /\b(how\s+long|how\s+much\s+time|duration|minutes?|take)\b/i.test(prompt)
  ) {
    return 'duration';
  }
  if (
    /\b(what(?:'s|\s+is|\s+did)|list|show|which|contents?|picked|selected|added)\b/i.test(
      prompt,
    )
  ) {
    return 'contents';
  }
  return 'overview';
}

const HY_RU_EXPLAIN_CART_CUE =
  /ինչ\s+կա.{0,20}(zambyugh|cart|զambyugh)|բացատր.{0,15}cart|քանի\s+ժամ.{0,20}spa|что\s+в.{0,20}корзин|сколько\s+длит.{0,20}spa|показать\s+услуг.{0,20}корзин/iu;

export function isExplainMultiServiceCartPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (
    /\bpackage\s+visits?\b/i.test(text) &&
    /\b(status|progress|left|remaining|still\s+have|how\s+many|list|show)\b/i.test(
      text,
    )
  ) {
    return false;
  }
  if (/\bcart\s+total\s+duration\b/i.test(text)) return false;
  if (
    /\b(show|what\s+is|how\s+long|total)\b/i.test(text) &&
    /\b(cart|basket|visit)\b/i.test(text) &&
    /\b(duration|time|minutes?|long)\b/i.test(text) &&
    !/\b(what(?:'s|\s+did)|picked|selected|added|treatments?|services?\s+are|in\s+my)\b/i.test(
      text,
    )
  ) {
    return false;
  }
  if (matchExplainMultiServiceCartScenario(text)) return true;
  if (
    isAddServicesToCartPrompt(text) &&
    !/\b(what|show|list|explain)\b/i.test(text)
  ) {
    return false;
  }
  if (HY_RU_EXPLAIN_CART_CUE.test(text)) return true;
  if (
    /\b(spa\s+day)\b/i.test(text) &&
    /\b(how\s+long|duration|take|time)\b/i.test(text)
  ) {
    return true;
  }
  if (
    /\b(what(?:'s|\s+is|\s+did)|show|list|explain)\b/i.test(text) &&
    /\b(cart|basket|selected\s+services?|treatments?|picked|visit)\b/i.test(
      text,
    )
  ) {
    return true;
  }
  if (
    /\b(how\s+long|how\s+much\s+time)\b/i.test(text) &&
    /\b(these\s+services?|multi-service|all\s+my\s+services?|visit)\b/i.test(
      text,
    )
  ) {
    return true;
  }
  return false;
}

export function buildExplainMultiServiceCartSummary(input: {
  lines: MultiServiceCartLine[];
  totalMinutes: number;
  turnoverBufferMinutes?: number;
  focus?: ExplainMultiServiceCartFocus;
}): string {
  const { lines, totalMinutes } = input;
  const turnoverBufferMinutes = input.turnoverBufferMinutes ?? 5;
  const focus = input.focus ?? 'overview';
  if (!lines.length) {
    return 'Your multi-service cart is empty — add treatments to see duration and line items.';
  }

  const names = lines.map((line) => line.name).join(', ');
  const lineDetails = lines
    .map(
      (line) =>
        `${line.name} (${line.durationMinutes} min${
          line.bufferMinutes ? ` + ${line.bufferMinutes} min buffer` : ''
        })`,
    )
    .join('; ');

  if (focus === 'contents') {
    return `Your cart has ${lines.length} service(s): ${names}.`;
  }
  if (focus === 'duration') {
    const bufferNote =
      lines.length > 1
        ? ` including ${turnoverBufferMinutes}-minute turnover between services`
        : '';
    return `Your visit is about ${totalMinutes} minutes total${bufferNote}: ${lineDetails}.`;
  }

  const priceTotal = lines.reduce((sum, line) => sum + (line.price ?? 0), 0);
  const priceNote =
    priceTotal > 0 ? ` Catalog subtotal about ${priceTotal}.` : '';
  const bufferNote =
    lines.length > 1
      ? ` Includes ${turnoverBufferMinutes}-minute turnover buffers between services.`
      : '';
  return `Your cart: ${lineDetails}. About ${totalMinutes} minutes total.${bufferNote}${priceNote}`;
}

export function rescueExplainMultiServiceCartIntent(
  prompt: string,
  action: string,
): {
  action: 'explain_multi_service_cart';
  rescueReason: string;
} | null {
  if (action === 'explain_multi_service_cart') return null;
  if (!isExplainMultiServiceCartPrompt(prompt)) return null;
  return {
    action: 'explain_multi_service_cart',
    rescueReason: 'explain_multi_service_cart',
  };
}
