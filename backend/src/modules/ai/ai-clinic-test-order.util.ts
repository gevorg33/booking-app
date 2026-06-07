import type { Repository } from 'typeorm';
import {
  BookingStatus,
  type Booking,
} from '../booking/entities/booking.entity.js';
import type { Business } from '../business/entities/business.entity.js';
import type { ClinicTestPanel } from '../clinic-test-results/entities/clinic-test-panel.entity.js';
import type { ClinicTestType } from '../clinic-test-results/entities/clinic-test-type.entity.js';
import { normalizeCatalogMatchKey } from '../clinic-test-results/catalog/clinic-test-catalog-seed.util.js';
import { isClinicVerticalBusinessType } from '../../common/utils/clinic-service.util.js';
import {
  extractBookingIdFromPrompt,
  extractCustomerNameFromPrompt,
} from './ai-retail-finance.util.js';
import { extractSingleIsoDayFromPrompt } from './ai-orchestration.helpers.js';
import {
  CREATE_TEST_ORDER_PROMPTS,
  LIST_TEST_ORDERS_PROMPTS,
} from './ai-clinic-test-order.fixtures.js';

export const CLINIC_TEST_ORDER_READ_INTENTS = ['list_test_orders'] as const;
export const CLINIC_TEST_ORDER_MUTATE_INTENTS = ['create_test_order'] as const;
export const CLINIC_TEST_ORDER_INTENTS = [
  ...CLINIC_TEST_ORDER_READ_INTENTS,
  ...CLINIC_TEST_ORDER_MUTATE_INTENTS,
] as const;

export type ClinicTestOrderIntent = (typeof CLINIC_TEST_ORDER_INTENTS)[number];

export interface ParsedClinicTestOrderRequest {
  bookingId?: string;
  customerName?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  testNames?: string[];
  testPanels?: string[];
  awaitingPatientBooking?: boolean;
}

const UNICODE_WORD_SUFFIX = '[\\p{L}\\p{M}\\u055B]*';

const CREATE_ORDER_VERB = new RegExp(
  String.raw`\b(order|place|request|add|create|book|schedule|reserve)\b|(?:\p{L}*պատվիր${UNICODE_WORD_SUFFIX}|պատվիր${UNICODE_WORD_SUFFIX}|\p{L}*ավելացր${UNICODE_WORD_SUFFIX}|ավելացր${UNICODE_WORD_SUFFIX}|\p{L}*ստեղծ${UNICODE_WORD_SUFFIX}|ստեղծ${UNICODE_WORD_SUFFIX}|\p{L}*գրանց${UNICODE_WORD_SUFFIX})|(?:[Зз]акаж${UNICODE_WORD_SUFFIX}|[Оо]форм${UNICODE_WORD_SUFFIX}|[Дд]обав${UNICODE_WORD_SUFFIX}|[Сс]озда${UNICODE_WORD_SUFFIX}|[Нн]азнач${UNICODE_WORD_SUFFIX})`,
  'iu',
);
const LIST_ORDER_VERB = new RegExp(
  String.raw`\b(list|show|what|which|pending|open)\b|(?:\p{L}*ցույց${UNICODE_WORD_SUFFIX}|ցույց${UNICODE_WORD_SUFFIX}|\p{L}*ցուցադր${UNICODE_WORD_SUFFIX}|ցուցադր${UNICODE_WORD_SUFFIX}|\p{L}*ցուցակավոր${UNICODE_WORD_SUFFIX}|ցուցակավոր${UNICODE_WORD_SUFFIX}|\p{L}*ինչ${UNICODE_WORD_SUFFIX}|ինչ${UNICODE_WORD_SUFFIX}|\p{L}*որոն${UNICODE_WORD_SUFFIX}|որոն${UNICODE_WORD_SUFFIX}|սպասող|սպասում|\p{L}*բաց${UNICODE_WORD_SUFFIX})|(?:[Пп]окаж${UNICODE_WORD_SUFFIX}|[Сс]писок${UNICODE_WORD_SUFFIX}|[Кк]акие${UNICODE_WORD_SUFFIX}|[Кк]акой${UNICODE_WORD_SUFFIX}|ожида${UNICODE_WORD_SUFFIX}|открыт${UNICODE_WORD_SUFFIX})`,
  'iu',
);
const LAB_ORDER_NOUN = new RegExp(
  String.raw`\b(lab\s+orders?|test\s+orders?|blood\s+work|cbc|bmp|lipid|panel|specimen\s+orders?)\b|(?:լաբորատոր|թեստ(?:ի)?\s*պատվեր|արյան\s*աշխատանք)|(?:лабораторн${UNICODE_WORD_SUFFIX}|тестов(?:ые|ый)\s*заказ${UNICODE_WORD_SUFFIX}|анализ${UNICODE_WORD_SUFFIX}|заказ${UNICODE_WORD_SUFFIX})`,
  'iu',
);

const HY_CUSTOMER_NAME_BLOCKLIST = new Set([
  'այց',
  'պատվեր',
  'թեստ',
  'լաբորատոր',
]);

const HY_CUSTOMER_POSSESSIVE_TO_NOMINATIVE: Record<string, string> = {
  Մարիայի: 'Մարիա',
  Մարիային: 'Մարիա',
  Մարիայ: 'Մարիա',
  Մարիան: 'Մարիա',
  Ջոնի: 'Ջոն',
  Ջո: 'Ջոն',
  Աննայի: 'Աննա',
  Աննայ: 'Աննա',
  Սոֆիայի: 'Սոֆիա',
  Սոֆիայ: 'Սոֆիա',
  Ջեյմսի: 'Ջեյմս',
  Ալեքսի: 'Ալեքս',
  Անիի: 'Անի',
  Լոպեզի: 'Լոպեզ',
  Ջեյնի: 'Ջեյն',
  Ջեյնին: 'Ջեյն',
  Ջեյն: 'Ջեյն',
};

const RU_CUSTOMER_GENITIVE_TO_NOMINATIVE: Record<string, string> = {
  Марии: 'Мария',
  Марию: 'Мария',
  Джона: 'Джон',
  Джону: 'Джон',
  Анны: 'Анна',
  Софии: 'София',
  Софию: 'София',
  Джеймса: 'Джеймс',
  Алекса: 'Алекс',
  Алексу: 'Алекс',
  Джейн: 'Джейн',
};

const HY_POSSESSIVE_CUSTOMER_PATTERN = new RegExp(
  `(${Object.keys(HY_CUSTOMER_POSSESSIVE_TO_NOMINATIVE)
    .sort((left, right) => right.length - left.length)
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')})`,
  'u',
);

export function normalizeMultilingualCustomerName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes(' ')) {
    return trimmed
      .split(/\s+/)
      .map((part) => normalizeMultilingualCustomerName(part))
      .join(' ');
  }
  if (HY_CUSTOMER_POSSESSIVE_TO_NOMINATIVE[trimmed]) {
    return HY_CUSTOMER_POSSESSIVE_TO_NOMINATIVE[trimmed];
  }
  if (RU_CUSTOMER_GENITIVE_TO_NOMINATIVE[trimmed]) {
    return RU_CUSTOMER_GENITIVE_TO_NOMINATIVE[trimmed];
  }
  if (trimmed.endsWith('ին') && trimmed.length > 3) {
    return trimmed.slice(0, -2);
  }
  return trimmed;
}

export function isCreateTestOrderPrompt(prompt: string): boolean {
  if (isListTestOrdersPrompt(prompt)) return false;
  return CREATE_ORDER_VERB.test(prompt) && LAB_ORDER_NOUN.test(prompt);
}

const CATALOG_FASTING_EXPLAIN_BLOCK = new RegExp(
  String.raw`\b(?:which|what)\s+(?:lab\s+tests?|services?).*(?:fasting|prep)\b|\bfasting\s+requirements?\b|(?:[Кк]акие|[Кк]акой)\s+(?:лабораторн[\p{L}\p{M}]*\s+)?(?:тест[\p{L}\p{M}]*|услуг[\p{L}\p{M}]*).*?(?:голод|натощак|пост)|(?:ինչ|որ)\s+(?:լաբ|ծառայ).*(?:ծոմավոր|նախապատրաստ)`,
  'iu',
);

export function isListTestOrdersPrompt(prompt: string): boolean {
  if (CATALOG_FASTING_EXPLAIN_BLOCK.test(prompt)) return false;
  if (
    /\bmy\b/i.test(prompt) &&
    /\bresults?\b/i.test(prompt) &&
    !/\borders?\b/i.test(prompt)
  ) {
    return false;
  }
  if (/\bstatus\b.*\bresult\b/i.test(prompt) && /\bmy\b/i.test(prompt)) {
    return false;
  }
  if (/\bstatus\b.*\bmy\b/i.test(prompt) && !/\borders?\b/i.test(prompt)) {
    return false;
  }
  if (
    /\b(awaiting|waiting\s+for)\s+patient\s+(?:to\s+)?(?:self[- ]?)?book(?:ing)?\b|\borders?\s+awaiting\s+patient\s+(?:self[- ]?)?book(?:ing)?\b|\bawaiting\s+patient\s+(?:self[- ]?)?book(?:ing)?\b|\bpushed\b.*\bnot\s+booked\b|(?:սպասող\s*պատվեր|ուղարկվել|ուղարկված).*(?:չամրագրված|չի\s+ամրագրել|հիվանդ|ինքնուրույն)|(?:պատվերներ.*հիվանդի|լաբ\s*հերթ\s*սպասող\s*հիվանդի|հիվանդի\s+ինքնուրույն\s+ամրագրման).*(?:հիվանդ|ինքնուրույն|ամրագր|սպասման)|(?:ожидают\s+бронирования\s+пациент|отправлен.*не\s+забронирован|заказы.*ожидающие\s+бронирования\s+пациент|очередь\s+лабораторн[\p{L}\p{M}]*\s+заказ[\p{L}\p{M}]*.*ожидающ[\p{L}\p{M}]*\s+бронирования\s+пациент)/iu.test(
      prompt,
    )
  ) {
    return true;
  }
  return LIST_ORDER_VERB.test(prompt) && LAB_ORDER_NOUN.test(prompt);
}

function normalizeTestOrderNameSegment(part: string): string {
  let cleaned = part.trim();
  cleaned = cleaned.replace(/^(?:lab\s+(?:test\s+)?order\s+)/i, '');
  cleaned = cleaned.replace(/^(?:blood\s+work\s+)/i, '');
  cleaned = cleaned.replace(/^(?:a|an|the)\s+/i, '');
  cleaned = cleaned.replace(/\s+order\s*$/i, '');
  cleaned = cleaned.replace(/\s+թեստ\s*$/iu, '');
  cleaned = cleaned.replace(/\s+պատվեր\s*$/iu, '');
  return cleaned.trim();
}

function normalizeVisitCustomerName(name: string): string {
  return name.replace(/['’]s$/i, '').trim();
}

export function extractTestOrderNamesFromPrompt(prompt: string): string[] {
  const hyOrderMatch = new RegExp(
    String.raw`(?:\p{L}*պատվիր${UNICODE_WORD_SUFFIX}|պատվիր${UNICODE_WORD_SUFFIX}|\p{L}*ավելացր${UNICODE_WORD_SUFFIX}|ավելացր${UNICODE_WORD_SUFFIX}|\p{L}*ստեղծ${UNICODE_WORD_SUFFIX}|ստեղծ${UNICODE_WORD_SUFFIX})\s+(.+?)(?:\s+${HY_POSSESSIVE_CUSTOMER_PATTERN.source}|$)`,
    'iu',
  );
  const ruOrderMatch = new RegExp(
    String.raw`(?:[Зз]акаж${UNICODE_WORD_SUFFIX}|[Оо]форм${UNICODE_WORD_SUFFIX}(?:\s+заказ)?|[Дд]обав${UNICODE_WORD_SUFFIX}|[Сс]озда${UNICODE_WORD_SUFFIX}(?:\s+лабораторн${UNICODE_WORD_SUFFIX}\s+заказ)?)\s+(.+?)(?:\s+для\s+|$)`,
    'iu',
  );
  const orderMatch =
    prompt.match(
      /\b(?:order|place|request|add|create|book|schedule|reserve)\b\s+(.+?)(?:\s+for\s+|\s+on\s+|\s+at\s+|;\s+visit|$)/i,
    ) ??
    prompt.match(hyOrderMatch) ??
    prompt.match(ruOrderMatch);
  const segment = orderMatch?.[1] ?? prompt;
  const cleaned = segment
    .replace(/\bfor\b.+$/i, '')
    .replace(/\s+для.+$/iu, '')
    .replace(/['’]s\s+visit\b.*$/i, '')
    .replace(/['’]s\s+appointment\b.*$/i, '')
    .replace(
      new RegExp(
        String.raw`\s+${HY_POSSESSIVE_CUSTOMER_PATTERN.source}(?:\s+վաղը)?.*$`,
        'iu',
      ),
      '',
    )
    .replace(
      /^(?:արյան\s+աշխատանք|լաբորատոր\s+թեստ|թեստ\s+պատվեր|պատվեր)\s+/iu,
      '',
    )
    .replace(
      new RegExp(
        String.raw`^(?:лабораторн${UNICODE_WORD_SUFFIX}\s+заказ|заказ\s+на\s+анализ${UNICODE_WORD_SUFFIX}|анализ${UNICODE_WORD_SUFFIX})\s+`,
        'iu',
      ),
      '',
    )
    .trim();
  if (!cleaned) return [];
  return cleaned
    .split(/\s*,\s*|\s+and\s+|\s+և\s+|\s+и\s+|\s*;\s*/iu)
    .map((part) => normalizeTestOrderNameSegment(part))
    .filter((part) => part.length > 0);
}

export function extractVisitCustomerNameFromPrompt(
  prompt: string,
): string | null {
  const possessiveOrders = prompt.match(
    /\b([A-Za-z][\w-]*?)(?:['’]s)\s+(?:(?:lab|test)\s+)*orders?\b/i,
  );
  if (possessiveOrders?.[1]) {
    return normalizeVisitCustomerName(possessiveOrders[1]);
  }

  const hyNamedCustomer = prompt.match(HY_POSSESSIVE_CUSTOMER_PATTERN);
  if (hyNamedCustomer?.[1]) {
    return normalizeMultilingualCustomerName(hyNamedCustomer[1]);
  }

  const hyPossessiveLabOrders = prompt.match(
    /([\p{L}]{2,}?)ի\s+լաբորատոր\s+պատվեր/u,
  );
  if (hyPossessiveLabOrders?.[1]) {
    return normalizeMultilingualCustomerName(hyPossessiveLabOrders[1]);
  }

  const hyPossessiveTestOrders = prompt.match(
    /([\p{L}]{2,}?)ի\s+թեստի\s+պատվեր/u,
  );
  if (hyPossessiveTestOrders?.[1]) {
    return normalizeMultilingualCustomerName(hyPossessiveTestOrders[1]);
  }

  const hyVisitCustomer = prompt.match(/([\p{L}]{2,}?)ի\s+(?:վաղը\s+)?այց/u);
  if (hyVisitCustomer?.[1]) {
    return normalizeMultilingualCustomerName(hyVisitCustomer[1]);
  }

  const hyForCustomer = prompt.match(/([\p{L}]{2,}?)ի\s+համար/u);
  if (hyForCustomer?.[1] && !HY_CUSTOMER_NAME_BLOCKLIST.has(hyForCustomer[1])) {
    return normalizeMultilingualCustomerName(hyForCustomer[1]);
  }

  const hyHasOrders = prompt.match(/ունի\s+([\p{L}]+)ն?\s+վաղը/u);
  if (hyHasOrders?.[1]) {
    return normalizeMultilingualCustomerName(hyHasOrders[1]);
  }

  const ruVisitCustomer = prompt.match(/для\s+визита\s+([\p{L}]+)/iu);
  if (ruVisitCustomer?.[1]) {
    return normalizeMultilingualCustomerName(ruVisitCustomer[1]);
  }

  const ruPatientCustomer = prompt.match(/для\s+пациента\s+([\p{L}]+)/iu);
  if (ruPatientCustomer?.[1]) {
    return normalizeMultilingualCustomerName(ruPatientCustomer[1]);
  }

  const ruForCustomer = prompt.match(/для\s+([\p{L}]+)/iu);
  if (ruForCustomer?.[1]) {
    return normalizeMultilingualCustomerName(ruForCustomer[1]);
  }

  const ruGenitiveOrders = prompt.match(
    new RegExp(
      String.raw`(?:лабораторн${UNICODE_WORD_SUFFIX}\s+заказ${UNICODE_WORD_SUFFIX}|тестов${UNICODE_WORD_SUFFIX}\s+заказ${UNICODE_WORD_SUFFIX})\s+([\p{L}]+)(?:\s+на\s+|\s+в\s+|$)`,
      'iu',
    ),
  );
  if (ruGenitiveOrders?.[1]) {
    return normalizeMultilingualCustomerName(ruGenitiveOrders[1]);
  }

  const ruPatientOrders = prompt.match(
    new RegExp(
      String.raw`(?:тестов${UNICODE_WORD_SUFFIX}\s+заказ${UNICODE_WORD_SUFFIX})\s+([\p{L}]+)(?:\s+в\s+)`,
      'iu',
    ),
  );
  if (ruPatientOrders?.[1]) {
    return normalizeMultilingualCustomerName(ruPatientOrders[1]);
  }

  const ruWhoseOrders = prompt.match(/у\s+([\p{L}]+)\s+на\s+завтра/iu);
  if (ruWhoseOrders?.[1]) {
    return normalizeMultilingualCustomerName(ruWhoseOrders[1]);
  }

  const doesHaveOrders = prompt.match(
    /\b(?:test\s+orders?|lab\s+orders?)\s+does\s+([A-Za-z][\w-]*)\s+have\b/i,
  );
  if (doesHaveOrders?.[1]) return doesHaveOrders[1].trim();

  const pendingForCustomer = prompt.match(
    /\bpending\s+for\s+([A-Za-z][\w-]*)\b/i,
  );
  if (pendingForCustomer?.[1]) return pendingForCustomer[1].trim();

  const possessiveVisit = prompt.match(
    /\bfor\s+([A-Za-z][\w-]*?)(?:['’]s)?(?:\s+on\s+(?:his|her|their)\s+)?\s+(?:visit|appointment)\b/i,
  );
  if (possessiveVisit?.[1]) {
    return normalizeVisitCustomerName(possessiveVisit[1]);
  }

  const forPatient = prompt.match(/\bfor\s+patient\s+([A-Za-z][\w-]*)\b/i);
  if (forPatient?.[1]) return forPatient[1].trim();

  const customerName = extractCustomerNameFromPrompt(prompt);
  return customerName ? normalizeVisitCustomerName(customerName) : null;
}

export function parseCreateTestOrderFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedClinicTestOrderRequest | null {
  if (!isCreateTestOrderPrompt(prompt)) return null;

  const bookingId =
    (typeof params.bookingId === 'string' && params.bookingId.trim()
      ? params.bookingId.trim()
      : undefined) ??
    extractBookingIdFromPrompt(prompt) ??
    undefined;
  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()
      ? params.customerName.trim()
      : undefined) ??
    extractVisitCustomerNameFromPrompt(prompt) ??
    undefined;
  const testNamesFromParams = Array.isArray(params.testNames)
    ? params.testNames
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
    : typeof params.testName === 'string' && params.testName.trim()
      ? [params.testName.trim()]
      : [];
  const testNames =
    testNamesFromParams.length > 0
      ? testNamesFromParams
      : extractTestOrderNamesFromPrompt(prompt);
  const date =
    (typeof params.date === 'string' && params.date.trim()
      ? params.date.trim()
      : undefined) ?? undefined;

  if (!bookingId && !customerName) return null;
  if (testNames.length === 0) return null;

  return {
    bookingId,
    customerName,
    date,
    testNames,
  };
}

export function parseListTestOrdersFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedClinicTestOrderRequest | null {
  if (!isListTestOrdersPrompt(prompt)) return null;

  const bookingId =
    (typeof params.bookingId === 'string' && params.bookingId.trim()
      ? params.bookingId.trim()
      : undefined) ??
    extractBookingIdFromPrompt(prompt) ??
    undefined;
  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()
      ? params.customerName.trim()
      : undefined) ??
    extractVisitCustomerNameFromPrompt(prompt) ??
    extractCustomerNameFromPrompt(prompt) ??
    undefined;
  const status =
    typeof params.status === 'string' && params.status.trim()
      ? params.status.trim()
      : /\bawaiting\s+results?\b/i.test(prompt)
        ? 'AwaitingResults'
        : /\bpending\b|\bnot\s+collected\b|\bwaiting\s+for\s+collection\b|ожида\w*|забор\w*|сбор\w*|սպասող|հավաքման/i.test(
              prompt,
            )
          ? 'NotCollected'
          : undefined;
  const awaitingPatientBooking =
    params.awaitingPatientBooking === true ||
    params.awaitingPatientBooking === 'true' ||
    /\b(awaiting|waiting\s+for)\s+patient\s+(?:to\s+)?(?:self[- ]?)?book(?:ing)?\b|\borders?\s+awaiting\s+patient\s+(?:self[- ]?)?book(?:ing)?\b|\bawaiting\s+patient\s+(?:self[- ]?)?book(?:ing)?\b|\bpushed\b.*\bnot\s+booked\b|\bpatient\s+self[- ]?book(?:ing)?\b|(?:սպասող\s*պատվեր|ուղարկվել|ուղարկված).*(?:չամրագրված|չի\s+ամրագրել|հիվանդ|ինքնուրույն)|(?:պատվերներ.*հիվանդի|լաբ\s*հերթ\s*սպասող\s*հիվանդի|հիվանդի\s+ինքնուրույն\s+ամրագրման).*(?:հիվանդ|ինքնուրույն|ամրագր|սպասման)|(?:ожидают\s+бронирования\s+пациент|отправлен.*не\s+забронирован|заказы.*ожидающие\s+бронирования\s+пациент|очередь\s+лабораторн[\p{L}\p{M}]*\s+заказ[\p{L}\p{M}]*.*ожидающ[\p{L}\p{M}]*\s+бронирования\s+пациент)/iu.test(
      prompt,
    );

  return {
    bookingId,
    customerName,
    status,
    awaitingPatientBooking: awaitingPatientBooking || undefined,
    date:
      typeof params.date === 'string' && params.date.trim()
        ? params.date.trim()
        : undefined,
    dateFrom:
      typeof params.dateFrom === 'string' && params.dateFrom.trim()
        ? params.dateFrom.trim()
        : undefined,
    dateTo:
      typeof params.dateTo === 'string' && params.dateTo.trim()
        ? params.dateTo.trim()
        : undefined,
  };
}

export function rescueClinicTestOrderIntent(
  prompt: string,
  action: string,
): { action: ClinicTestOrderIntent; rescueReason: string } | null {
  if ((CLINIC_TEST_ORDER_INTENTS as readonly string[]).includes(action)) {
    return null;
  }

  if (parseCreateTestOrderFromPrompt(prompt)) {
    return { action: 'create_test_order', rescueReason: 'create_test_order' };
  }

  if (parseListTestOrdersFromPrompt(prompt)) {
    return { action: 'list_test_orders', rescueReason: 'list_test_orders' };
  }

  return null;
}

export function matchClinicCatalogItem(input: {
  label: string;
  testTypes: ClinicTestType[];
  testPanels: ClinicTestPanel[];
}):
  | { type: 'test_type'; id: string; label: string }
  | { type: 'test_panel'; id: string; label: string }
  | null {
  const normalized = normalizeCatalogMatchKey(input.label);
  const panel = input.testPanels.find((row) => {
    if (row.code?.trim().toLowerCase() === input.label.trim().toLowerCase()) {
      return true;
    }
    return normalizeCatalogMatchKey(row.title) === normalized;
  });
  if (panel) {
    return { type: 'test_panel', id: panel.id, label: panel.title };
  }

  const testType = input.testTypes.find((row) => {
    if (row.code?.trim().toLowerCase() === input.label.trim().toLowerCase()) {
      return true;
    }
    return normalizeCatalogMatchKey(row.title) === normalized;
  });
  if (testType) {
    return { type: 'test_type', id: testType.id, label: testType.title };
  }

  return null;
}

export interface ClinicTestOrderBookingQueryDeps {
  bookingRepo: Pick<Repository<Booking>, 'find' | 'findOne'>;
}

export async function resolveBookingForClinicTestOrder(
  deps: ClinicTestOrderBookingQueryDeps,
  businessId: string,
  parsed: ParsedClinicTestOrderRequest,
  prompt: string,
  timeZone = 'UTC',
): Promise<Booking | null> {
  if (parsed.bookingId) {
    const byId = await deps.bookingRepo.findOne({
      where: { id: parsed.bookingId, businessId },
      relations: { customer: true },
    });
    if (byId) return byId;

    const bookings = await deps.bookingRepo.find({
      where: { businessId },
      relations: { customer: true },
      order: { startTime: 'ASC' },
      take: 100,
    });
    return (
      bookings.find(
        (booking) =>
          booking.id === parsed.bookingId ||
          booking.id.startsWith(parsed.bookingId ?? ''),
      ) ?? null
    );
  }

  const isoDay =
    extractSingleIsoDayFromPrompt(parsed.date ?? prompt, timeZone) ??
    extractSingleIsoDayFromPrompt(prompt, timeZone);

  const bookings = await deps.bookingRepo.find({
    where: { businessId },
    relations: { customer: true },
    order: { startTime: 'ASC' },
    take: 100,
  });

  let candidates = bookings.filter(
    (booking) => booking.status !== BookingStatus.CANCELLED,
  );

  if (parsed.customerName) {
    const needle = parsed.customerName.toLowerCase();
    candidates = candidates.filter((booking) =>
      booking.customer?.name?.toLowerCase().includes(needle),
    );
  }

  if (isoDay) {
    candidates = candidates.filter((booking) => {
      const dayKey = booking.startTime.toISOString().slice(0, 10);
      return dayKey === isoDay;
    });
  }

  return candidates[0] ?? null;
}

export function assertClinicTestOrderBusinessType(
  business: Business | null | undefined,
): string | null {
  const businessType =
    typeof business?.settings?.businessType === 'string'
      ? business.settings.businessType
      : null;
  if (!isClinicVerticalBusinessType(businessType)) {
    return businessType;
  }
  return null;
}

export function buildClinicTestOrderFixtureExpectations() {
  return {
    create: CREATE_TEST_ORDER_PROMPTS,
    list: LIST_TEST_ORDERS_PROMPTS,
  };
}
