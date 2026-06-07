import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { ClinicSpecimenQueueItem } from '../clinic-test-results/specimen/clinic-specimen.service.js';
import { assertClinicPatientChartBusinessType } from './ai-clinic-patient-chart.util.js';
import {
  extractVisitCustomerNameFromPrompt,
  isListTestOrdersPrompt,
  normalizeMultilingualCustomerName,
} from './ai-clinic-test-order.util.js';
import { extractCustomerNameFromPrompt } from './ai-retail-finance.util.js';
import { extractSingleIsoDayFromPrompt } from './ai-orchestration.helpers.js';
import {
  LIST_MY_COLLECTION_QUEUE_PROMPTS,
  MARK_SPECIMEN_COLLECTED_PROMPTS,
} from './ai-provider-clinic-collection.fixtures.js';

export const PROVIDER_CLINIC_COLLECTION_READ_INTENTS = [
  'list_my_collection_queue',
] as const;

export const PROVIDER_CLINIC_COLLECTION_MUTATE_INTENTS = [
  'mark_specimen_collected',
] as const;

export const PROVIDER_CLINIC_COLLECTION_INTENTS = [
  ...PROVIDER_CLINIC_COLLECTION_READ_INTENTS,
  ...PROVIDER_CLINIC_COLLECTION_MUTATE_INTENTS,
] as const;

export type ProviderClinicCollectionIntent =
  (typeof PROVIDER_CLINIC_COLLECTION_INTENTS)[number];

export interface ParsedListMyCollectionQueueRequest {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ParsedMarkSpecimenCollectedRequest {
  specimenId?: string;
  orderId?: string;
  customerName?: string;
}

const UNICODE_WORD_SUFFIX = '[\\p{L}\\p{M}\\u055B]*';

const COLLECTION_QUEUE_CONTEXT = new RegExp(
  String.raw`\b(collection\s+queue|specimen\s+collection|collection\s+worklist|draw\s+queue|lab\s+collection\s+queue|specimens?\s+waiting\s+for\s+collection|draw\s+blood|patients?\s+to\s+collect|collection\s+specimens?)\b|(?:հավաքման\s+հերթականություն|նմուշ(?:ի)?\s+հավաքման\s+հերթականություն|լաբորատոր\s+հավաքման\s+հերթականություն|արյան\s+վերցում|հավաքման\s+սպասող|collection\s+queue|collection\s+worklist)|(?:очеред${UNICODE_WORD_SUFFIX}\s+на\s+забор|забор${UNICODE_WORD_SUFFIX}\s+образц|лабораторн${UNICODE_WORD_SUFFIX}\s+очеред${UNICODE_WORD_SUFFIX}\s+на\s+забор|взять\s+кровь|ожидающ${UNICODE_WORD_SUFFIX}\s+забор|collection\s+queue|collection\s+worklist)`,
  'iu',
);
const LIST_QUEUE_VERB = new RegExp(
  String.raw`\b(show|list|what'?s?\s+on|any|do\s+i\s+have)\b|(?:\p{L}*ցույց${UNICODE_WORD_SUFFIX}|ցույց${UNICODE_WORD_SUFFIX}|\p{L}*ցուցակավոր${UNICODE_WORD_SUFFIX}|ցուցակավոր${UNICODE_WORD_SUFFIX}|ինչ${UNICODE_WORD_SUFFIX})|(?:[Пп]окаж${UNICODE_WORD_SUFFIX}|[Сс]писок${UNICODE_WORD_SUFFIX}|[Чч]то${UNICODE_WORD_SUFFIX})`,
  'iu',
);
const PROVIDER_SELF_SCOPE = new RegExp(
  String.raw`\b(my|today'?s?)\b|իմ|այսօր|мою|моей|мой|моя|сегодня|мне`,
  'iu',
);

const MARK_COLLECTED_CONTEXT = new RegExp(
  String.raw`\b(mark|collected|collection\s+done|done\s+drawing|sample\s+collected|specimen\s+collected|drawn)\b|(?:\p{L}*նշիր${UNICODE_WORD_SUFFIX}|նշիր${UNICODE_WORD_SUFFIX}|հավաքված|հավաքեցի|ավարտեցի|արյան\s+վերցում)|(?:[Оо]тмет${UNICODE_WORD_SUFFIX}|собран${UNICODE_WORD_SUFFIX}|собрал|закончил\s+забор)`,
  'iu',
);
const SPECIMEN_NOUN = new RegExp(
  String.raw`\b(specimen|sample)\b|նմուշ|օրինակ|образец`,
  'iu',
);

const CONSUMER_LAB_BOOKING_BLOCK = new RegExp(
  String.raw`(?:ամրագրիր|գրանցիր|забронируй|запиши|зарезервируй).*(?:իմ|мой|мою|мои|свой|свою)`,
  'iu',
);

export function isListMyCollectionQueuePrompt(prompt: string): boolean {
  if (CONSUMER_LAB_BOOKING_BLOCK.test(prompt)) return false;
  if (isListTestOrdersPrompt(prompt) && !PROVIDER_SELF_SCOPE.test(prompt)) {
    return false;
  }
  if (
    PROVIDER_SELF_SCOPE.test(prompt) &&
    COLLECTION_QUEUE_CONTEXT.test(prompt)
  ) {
    return true;
  }

  if (LIST_QUEUE_VERB.test(prompt) && COLLECTION_QUEUE_CONTEXT.test(prompt)) {
    return true;
  }

  if (
    /\bwho\b.*\b(draw|collect)\b/i.test(prompt) &&
    /\btoday\b/i.test(prompt)
  ) {
    return true;
  }

  if (/ումից.*(?:արյուն|հավաք)/iu.test(prompt) && /այսօր/iu.test(prompt)) {
    return true;
  }

  if (
    /(?:у\s+кого|кому).*(?:взять|забор)/iu.test(prompt) &&
    /сегодня/iu.test(prompt)
  ) {
    return true;
  }

  if (
    PROVIDER_SELF_SCOPE.test(prompt) &&
    new RegExp(
      String.raw`(?:հավաքման\s+սպասող|ожидающ${UNICODE_WORD_SUFFIX}\s+забор)`,
      'iu',
    ).test(prompt) &&
    /(?:նմուշ|образц)/iu.test(prompt)
  ) {
    return true;
  }

  if (
    /(?:կա[՞?]|есть\s+ли)/iu.test(prompt) &&
    /(?:նմուշ|образц)/iu.test(prompt) &&
    /(?:հավաքման|забор)/iu.test(prompt)
  ) {
    return true;
  }

  return false;
}

export function isMarkSpecimenCollectedPrompt(prompt: string): boolean {
  if (!MARK_COLLECTED_CONTEXT.test(prompt)) return false;

  if (SPECIMEN_NOUN.test(prompt)) {
    return true;
  }

  if (
    /\b(done\s+drawing|drawn|collection\s+done)\b/i.test(prompt) &&
    extractMarkSpecimenCustomerNameFromPrompt(prompt)
  ) {
    return true;
  }

  if (
    /(?:ավարտեցի|հավաքեցի|закончил\s+забор|собрал)/iu.test(prompt) &&
    extractMarkSpecimenCustomerNameFromPrompt(prompt)
  ) {
    return true;
  }

  return false;
}

export function parseListMyCollectionQueueFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedListMyCollectionQueueRequest | null {
  if (!isListMyCollectionQueuePrompt(prompt)) return null;

  const date =
    (typeof params.date === 'string' && params.date.trim()
      ? params.date.trim()
      : undefined) ??
    extractSingleIsoDayFromPrompt(prompt) ??
    (/\btoday\b/i.test(prompt) || /այսօր|сегодня/iu.test(prompt)
      ? new Date().toISOString().slice(0, 10)
      : undefined);

  return {
    date,
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

export function extractSpecimenIdFromPrompt(prompt: string): string | null {
  const hashRef = prompt.match(/\bspecimen\s+#([a-z0-9-]+)\b/i);
  if (hashRef?.[1]) return hashRef[1].trim();

  const hyHashRef = prompt.match(/նմուշ(?:ը)?\s+#([a-z0-9-]+)/iu);
  if (hyHashRef?.[1]) return hyHashRef[1].trim();

  const ruHashRef = prompt.match(/образец\s+#([a-z0-9-]+)/iu);
  if (ruHashRef?.[1]) return ruHashRef[1].trim();

  const specimenRef = prompt.match(/\bspecimen\s+(?:id\s+)?([a-f0-9-]{6,})\b/i);
  if (specimenRef?.[1]) return specimenRef[1].trim();

  return null;
}

export function extractSpecimenOrderIdFromPrompt(
  prompt: string,
): string | null {
  const orderRef = prompt.match(/\border\s+#?([a-z0-9-]{4,})\b/i);
  if (orderRef?.[1]) return orderRef[1].trim();

  const hyOrderRef = prompt.match(/պատվեր\s+#?([a-z0-9-]{4,})/iu);
  if (hyOrderRef?.[1]) return hyOrderRef[1].trim();

  const ruOrderRef = prompt.match(/заказ\s+#?([a-z0-9-]{4,})/iu);
  if (ruOrderRef?.[1]) return ruOrderRef[1].trim();

  return null;
}

export function extractMarkSpecimenCustomerNameFromPrompt(
  prompt: string,
): string | null {
  const possessive = prompt.match(
    /\b([A-Za-z][\w-]*?)(?:['’]s)\s+(?:specimen|sample|visit)\b/i,
  );
  if (possessive?.[1]) return possessive[1].trim();

  const forPatient = prompt.match(
    /\bfor\s+(?:patient\s+)?([A-Za-z][\w-]*(?:\s+[A-Za-z][\w-]*)?)\b/i,
  );
  if (forPatient?.[1]) return forPatient[1].trim();

  const drawing = prompt.match(/\bdone\s+drawing\s+([A-Za-z][\w-]*)\b/i);
  if (drawing?.[1]) return drawing[1].trim();

  const hyVisitFor = prompt.match(/([\p{L}]+)ի\s+այցի\s+համար/iu);
  if (hyVisitFor?.[1]) {
    return normalizeMultilingualCustomerName(hyVisitFor[1] + 'ի');
  }

  const hyPossessiveForMatches = [
    ...prompt.matchAll(/([\p{L}]{2,}(?:\s+[\p{L}]{2,})?)ի\s+համար/giu),
  ]
    .map((match) => match[1])
    .filter((name) => name && !/հավաքված|նմուշ|պատվեր|այց|հիվանդ/iu.test(name));
  const hyPossessiveFor = hyPossessiveForMatches.at(-1);
  if (hyPossessiveFor) {
    return normalizeMultilingualCustomerName(hyPossessiveFor + 'ի');
  }

  const hyForPatient = prompt.match(/հիվանդ\s+([\p{L}]+)ի\s+համար/iu);
  if (hyForPatient?.[1]) {
    return normalizeMultilingualCustomerName(hyForPatient[1] + 'ի');
  }

  const hyWithPatient = prompt.match(/([\p{L}]+)ի\s+հետ/iu);
  if (hyWithPatient?.[1] && /(?:ավարտեցի|արյան\s+վերցում)/iu.test(prompt)) {
    return normalizeMultilingualCustomerName(hyWithPatient[1] + 'ի');
  }

  const ruAfterVisit = prompt.match(/для\s+([\p{L}]+)\s+после\s+визита/iu);
  if (ruAfterVisit?.[1]) {
    return normalizeMultilingualCustomerName(ruAfterVisit[1]);
  }

  const ruNamedFor = prompt.match(
    /для\s+(?:пациента\s+)?([\p{L}]+(?:\s+[\p{L}]+)?)/iu,
  );
  if (ruNamedFor?.[1] && !/после|визита/iu.test(ruNamedFor[1])) {
    return normalizeMultilingualCustomerName(ruNamedFor[1]);
  }

  const ruAtPatient = prompt.match(/у\s+([\p{L}]+)\s+—/iu);
  if (ruAtPatient?.[1]) {
    return normalizeMultilingualCustomerName(ruAtPatient[1]);
  }

  const ruGenitiveSpecimen = prompt.match(/образец\s+([\p{L}]+)\s+как/iu);
  if (ruGenitiveSpecimen?.[1]) {
    return normalizeMultilingualCustomerName(ruGenitiveSpecimen[1]);
  }

  return (
    extractVisitCustomerNameFromPrompt(prompt) ??
    extractCustomerNameFromPrompt(prompt)
  );
}

export function parseMarkSpecimenCollectedFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedMarkSpecimenCollectedRequest | null {
  if (!isMarkSpecimenCollectedPrompt(prompt)) return null;

  const specimenId =
    (typeof params.specimenId === 'string' && params.specimenId.trim()
      ? params.specimenId.trim()
      : undefined) ??
    extractSpecimenIdFromPrompt(prompt) ??
    undefined;
  const orderId =
    (typeof params.orderId === 'string' && params.orderId.trim()
      ? params.orderId.trim()
      : undefined) ??
    extractSpecimenOrderIdFromPrompt(prompt) ??
    undefined;
  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()
      ? params.customerName.trim()
      : undefined) ??
    extractMarkSpecimenCustomerNameFromPrompt(prompt) ??
    undefined;

  if (!specimenId && !orderId && !customerName) return null;

  return { specimenId, orderId, customerName };
}

export function rescueProviderClinicCollectionIntent(
  prompt: string,
  action: string,
): { action: ProviderClinicCollectionIntent; rescueReason: string } | null {
  if (
    (PROVIDER_CLINIC_COLLECTION_INTENTS as readonly string[]).includes(action)
  ) {
    return null;
  }

  if (parseMarkSpecimenCollectedFromPrompt(prompt)) {
    return {
      action: 'mark_specimen_collected',
      rescueReason: 'mark_specimen_collected',
    };
  }

  if (parseListMyCollectionQueueFromPrompt(prompt)) {
    return {
      action: 'list_my_collection_queue',
      rescueReason: 'list_my_collection_queue',
    };
  }

  return null;
}

export { assertClinicPatientChartBusinessType as assertProviderClinicCollectionBusinessType };

export function resolveCollectionQueueDayBounds(
  parsed: ParsedListMyCollectionQueueRequest,
): { from: string; to: string; label: string } {
  const day =
    parsed.date ?? parsed.dateFrom ?? new Date().toISOString().slice(0, 10);
  const start = new Date(`${day.slice(0, 10)}T00:00:00.000Z`);
  const end = new Date(`${day.slice(0, 10)}T23:59:59.999Z`);
  return {
    from: start.toISOString(),
    to: end.toISOString(),
    label: day.slice(0, 10),
  };
}

export function formatProviderCollectionQueueSummary(
  items: ClinicSpecimenQueueItem[],
  label: string,
): string {
  if (items.length === 0) {
    return `Your collection queue for ${label} is empty.`;
  }

  const lines = items.slice(0, 8).map((item, index) => {
    const time = item.bookingStartTime
      ? item.bookingStartTime.slice(11, 16)
      : 'unscheduled';
    const patient = item.customerName ?? 'Patient';
    const tests = item.orderDisplayNames ?? 'Lab order';
    return `${index + 1}. ${patient} — ${tests} (${item.status}) at ${time}`;
  });

  const suffix = items.length > 8 ? `\n…and ${items.length - 8} more.` : '';
  return `Collection queue for ${label} (${items.length} specimen${items.length === 1 ? '' : 's'}):\n${lines.join('\n')}${suffix}`;
}

export function buildProviderClinicCollectionFixtureExpectations() {
  return {
    list: LIST_MY_COLLECTION_QUEUE_PROMPTS,
    mark: MARK_SPECIMEN_COLLECTED_PROMPTS,
  };
}
