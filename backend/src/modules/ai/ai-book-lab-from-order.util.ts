import { extractOrderIdFromPrompt } from './ai-clinic-test-result.util.js';
import { isBookLabCollectionNearestCompoundPrompt } from './ai-book-lab-collection-nearest.util.js';
import {
  BOOK_LAB_FROM_ORDER_PROMPTS,
  type BookLabFromOrderFixture,
} from './ai-book-lab-from-order.fixtures.js';
import { BOOK_LAB_FROM_ORDER_MULTILINGUAL_SCENARIOS } from './ai-book-lab-from-order-multilingual.fixtures.js';

export const BOOK_LAB_FROM_ORDER_INTENTS = ['book_lab_from_order'] as const;

export type BookLabFromOrderIntent =
  (typeof BOOK_LAB_FROM_ORDER_INTENTS)[number];

export { CUSTOMER_BOOK_LAB_FROM_ORDER_CLASSIFIER_RULES } from './ai-book-lab-from-order.fixtures.js';

const LAB_ORDER_NOUN =
  /\b(?:lab\s+order|lab\s+request|pending\s+lab\s+order)\b|(?:լաբ\s*պատվեր|լաբ\s*հայտ)|(?:лабораторн(?:ый|ого)?\s+заказ|лаб\s*заказ)/iu;

const LAB_TO_BOOK_TAB_CUE =
  /\b(?:lab\s+to\s+book(?:\s+tab|\s+page)?|my\s+lab\s+requests?\s+list|myLabToBook)\b|(?:լաբ\s*ամրագրելու\s*ներդիր|լաբ\s*ամրագրելու)|(?:лаборатория\s+к\s+записи|вкладк[ае]\s+лаб)/iu;

const BOOK_LAB_ORDER_CUE =
  /\b(?:book|schedule|reserve|open)\b.{0,40}\b(?:lab\s+order|lab\s+request|pending\s+lab\s+order)\b|\b(?:book|schedule|reserve)\b.{0,20}\b(?:collection|draw|blood\s+draw)\b.{0,30}\b(?:lab\s+order|from\s+lab\s+to\s+book)\b|(?:ամրագրիր|գրանցիր|բացիր).{0,30}(?:լաբ\s*պատվեր|լաբ\s*հայտ|լաբ\s*ամրագրելու)|(?:забронируй|запишись|открой).{0,30}(?:лабораторн(?:ый|ого)?\s+заказ|лаб\s*заказ|лаборатория\s+к\s+записи)/iu;

const COMPLETE_INTAKE_AND_BOOK_BLOCK =
  /\b(?:fill|complete|finish|answer|submit)\b.{0,30}\b(?:intake|questionnaire|health\s+form)\b.{0,30}\b(?:and|then|after)\b.{0,30}\b(?:book|schedule|reserve)\b/i;

export const BOOK_LAB_FROM_ORDER_BLOCK =
  /\b(?:book|schedule|reserve|open)\b.{0,40}\b(?:lab\s+order|from\s+lab\s+to\s+book)\b|\blab\s+to\s+book\s+tab\b|\bbook\s+collection\s+for\s+(?:my\s+)?lab\s+order\b/i;

const LIST_ONLY_CUE =
  /\b(?:what|which|show|list|any|how\s+many)\b.{0,30}(?:lab\s+to\s+book|lab\s+appointments?\s+to\s+book|pending\s+lab)|(?:ինչ|որ|ցույց|сколько|какие).{0,20}(?:լաբ|лаб).{0,20}(?:ամրագր|забронир)/iu;

const LAB_TO_BOOK_LIST_REFERENCE_BLOCK =
  /^\s*(?:my\s+)?lab\s+to\s+book(?:\s+(?:list|tab|page))?\s*$|\blab\s+to\s+book\b.{0,20}\b(?:on|in)\s+my\s+account\b/i;

const MY_SCOPE =
  /\b(?:my|the)\b|(?:^|[\s,.;])իմ(?:[\s,.;]|$)|(?:^|[\s,.;])мои(?:[\s,.;]|$)|(?:^|[\s,.;])мой(?:[\s,.;]|$)|(?:^|[\s,.;])мою(?:[\s,.;]|$)/iu;

const TEST_NAME_CUE =
  /\b(CBC|lipid(?:\s+panel)?|TSH|metabolic\s+panel|blood\s+panel)\b/i;

function containsArmenianScript(prompt: string): boolean {
  return /[\u0530-\u058F]/.test(prompt);
}

function containsCyrillicScript(prompt: string): boolean {
  return /[\u0400-\u04FF]/.test(prompt);
}

function matchBookLabFromOrderScenario(
  prompt: string,
): BookLabFromOrderFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of BOOK_LAB_FROM_ORDER_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of BOOK_LAB_FROM_ORDER_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function extractTestNameFromBookLabFromOrderPrompt(
  prompt: string,
): string | undefined {
  const scenario = matchBookLabFromOrderScenario(prompt);
  if (scenario?.testName) return scenario.testName;

  const quoted = prompt.match(/["'«]([^"'»]+)["'»]/);
  if (quoted?.[1]?.trim()) return quoted[1].trim();

  const named = prompt.match(TEST_NAME_CUE);
  if (named?.[1]) return named[1].trim();

  const forTest = prompt.match(
    /\b(?:for|on)\s+(?:my\s+)?([A-Za-z][\w\s-]{1,40})\s+(?:order|panel|test)\b/i,
  );
  const candidate = forTest?.[1]?.trim();
  if (candidate && !/^(lab|blood|draw)$/i.test(candidate)) return candidate;

  return undefined;
}

export function isBookLabFromOrderPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchBookLabFromOrderScenario(text)) return true;
  if (isBookLabCollectionNearestCompoundPrompt(text)) return false;
  if (COMPLETE_INTAKE_AND_BOOK_BLOCK.test(text)) return false;
  if (LIST_ONLY_CUE.test(text) && !BOOK_LAB_ORDER_CUE.test(text)) return false;
  if (
    LAB_TO_BOOK_LIST_REFERENCE_BLOCK.test(text) &&
    !BOOK_LAB_ORDER_CUE.test(text)
  ) {
    return false;
  }

  if (
    (containsArmenianScript(text) &&
      /(լաբ|պատվեր|հավաք|արյան)/i.test(text) &&
      /(ամրագր|գրանցիր|ներդիր|ամրագրելու)/i.test(text) &&
      (/(պատվեր|ներդիր|ամրագրելու)/i.test(text) ||
        /\bիմ\s+լաբ\s+պատվեր/i.test(text))) ||
    (containsCyrillicScript(text) &&
      /(лаб|забор|кров)/i.test(text) &&
      /(забронир|запис|вкладк)/i.test(text) &&
      MY_SCOPE.test(text) &&
      /(лабораторн(?:ый|ого)?\s+заказ|лаб\s*заказ|вкладк|к\s+записи)/i.test(
        text,
      ))
  ) {
    return true;
  }

  if (
    LAB_TO_BOOK_TAB_CUE.test(text) &&
    /\b(?:book|schedule|reserve|open)\b/i.test(text)
  ) {
    return true;
  }

  if (BOOK_LAB_ORDER_CUE.test(text)) return true;

  if (
    LAB_ORDER_NOUN.test(text) &&
    /\b(?:book|schedule|reserve|open)\b/i.test(text) &&
    MY_SCOPE.test(text)
  ) {
    return true;
  }

  return false;
}

export function isBookLabFromOrderIntent(
  action: string,
): action is BookLabFromOrderIntent {
  return (BOOK_LAB_FROM_ORDER_INTENTS as readonly string[]).includes(action);
}

export interface ParsedBookLabFromOrderRequest {
  orderId?: string;
  testName?: string;
}

export function parseBookLabFromOrderFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedBookLabFromOrderRequest | null {
  if (!isBookLabFromOrderPrompt(prompt)) return null;

  const orderId =
    (typeof params.orderId === 'string' && params.orderId.trim()
      ? params.orderId.trim()
      : undefined) ??
    matchBookLabFromOrderScenario(prompt)?.orderId ??
    (() => {
      const extracted = extractOrderIdFromPrompt(prompt);
      if (!extracted) return undefined;
      if (
        /^ord-/i.test(extracted) ||
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          extracted,
        )
      ) {
        return extracted;
      }
      return undefined;
    })();
  const testName =
    (typeof params.testName === 'string' && params.testName.trim()
      ? params.testName.trim()
      : undefined) ?? extractTestNameFromBookLabFromOrderPrompt(prompt);

  return { orderId, testName };
}

export function rescueBookLabFromOrderIntent(
  prompt: string,
  action: string,
): { action: BookLabFromOrderIntent; rescueReason: string } | null {
  if (isBookLabFromOrderIntent(action)) return null;
  if (!parseBookLabFromOrderFromPrompt(prompt)) return null;
  return {
    action: 'book_lab_from_order',
    rescueReason: 'book_lab_from_order',
  };
}

export function formatBookLabFromOrderSummary(input: {
  displayNames: string | null;
  collectionServiceName: string;
  orderCount: number;
}): string {
  if (input.orderCount === 0) {
    return 'No open lab orders were found on your Lab to book tab. Open Lab to book after sign-in to refresh pending requests.';
  }
  if (input.orderCount > 1) {
    return `You have ${input.orderCount} lab orders on Lab to book. Open the tab, pick ${input.displayNames ?? 'the order'}, and continue to schedule collection (${input.collectionServiceName}).`;
  }
  return `Open Lab to book to schedule collection for ${input.displayNames ?? 'your lab order'} (${input.collectionServiceName}). Continue on the booking link to pick a time.`;
}

export function buildBookLabFromOrderNavigate(input: {
  orderId?: string | null;
}): { path: string; query: Record<string, string> } {
  const query: Record<string, string> = { section: 'my-lab-requests' };
  if (input.orderId) query.orderId = input.orderId;
  return { path: '/lab-to-book', query };
}
