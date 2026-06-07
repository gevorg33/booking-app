import type { Repository } from 'typeorm';
import {
  BookingStatus,
  type Booking,
} from '../booking/entities/booking.entity.js';
import type { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import { CLINIC_RESULT_RELEASE_QUEUE_STATUSES } from '../../common/utils/clinic-lab-state.util.js';
import { isNotifyPatientResultReadyPrompt } from './ai-notification-date-format.util.js';
import {
  assertClinicTestOrderBusinessType,
  extractVisitCustomerNameFromPrompt,
  normalizeMultilingualCustomerName,
} from './ai-clinic-test-order.util.js';
import {
  ENTER_TEST_RESULT_PROMPTS,
  RELEASE_TEST_RESULT_PROMPTS,
} from './ai-clinic-test-result.fixtures.js';

export const CLINIC_TEST_RESULT_MUTATE_INTENTS = [
  'enter_test_result',
  'release_test_result',
] as const;

export const CLINIC_TEST_RESULT_INTENTS = [
  ...CLINIC_TEST_RESULT_MUTATE_INTENTS,
] as const;

export type ClinicTestResultIntent =
  (typeof CLINIC_TEST_RESULT_INTENTS)[number];

export interface ParsedEnterTestResultRequest {
  orderId?: string;
  resultId?: string;
  measurementCode?: string;
  value?: string;
  customerName?: string;
}

export interface ParsedReleaseTestResultRequest {
  orderId?: string;
  resultId?: string;
  customerName?: string;
  bookingId?: string;
  date?: string;
}

const UNICODE_WORD_SUFFIX = '[\\p{L}\\p{M}\\u055B]*';

const ENTER_RESULT_VERB = new RegExp(
  String.raw`\b(enter|record|log|set|input|type)\b|(?:\p{L}*մուտքագր${UNICODE_WORD_SUFFIX}|մուտքագր${UNICODE_WORD_SUFFIX}|\p{L}*գրանց${UNICODE_WORD_SUFFIX}|գրանց${UNICODE_WORD_SUFFIX}|\p{L}*նշ${UNICODE_WORD_SUFFIX}|նշ${UNICODE_WORD_SUFFIX}|\p{L}*ավելացր${UNICODE_WORD_SUFFIX}|ավելացր${UNICODE_WORD_SUFFIX})|(?:[Вв]вед${UNICODE_WORD_SUFFIX}|[Зз]апиш${UNICODE_WORD_SUFFIX}|[Уу]каж${UNICODE_WORD_SUFFIX})`,
  'iu',
);
const RELEASE_RESULT_VERB = new RegExp(
  String.raw`\b(release|publish)\b|(?:\p{L}*ազատիր${UNICODE_WORD_SUFFIX}|ազատիր${UNICODE_WORD_SUFFIX}|\p{L}*հրապարակիր${UNICODE_WORD_SUFFIX}|հրապարակիր${UNICODE_WORD_SUFFIX}|\p{L}*տեսանելի${UNICODE_WORD_SUFFIX}|տեսանելի${UNICODE_WORD_SUFFIX})|(?:[Вв]ыпуст${UNICODE_WORD_SUFFIX}|[Оо]публик${UNICODE_WORD_SUFFIX}|доступн${UNICODE_WORD_SUFFIX}|видим${UNICODE_WORD_SUFFIX})`,
  'iu',
);
const LAB_RESULT_NOUN = new RegExp(
  String.raw`\b(?:lab\s+results?|test\s+results?|results?|result\s+value|measurement|wbc|cbc|bmp|glucose|hemoglobin|sodium|lipid)\b|(?:արդյունք|լաբորատոր|թեստ(?:ի)?\s*արդյունք|պատվեր)|(?:результат${UNICODE_WORD_SUFFIX}|лабораторн${UNICODE_WORD_SUFFIX}|анализ${UNICODE_WORD_SUFFIX}|заказ${UNICODE_WORD_SUFFIX})`,
  'iu',
);

function orderIdMatches(
  candidate: string | null | undefined,
  needle: string,
): boolean {
  if (!candidate) return false;
  if (candidate === needle) return true;
  if (candidate.startsWith(needle)) return true;
  if (candidate.endsWith(needle)) return true;
  return candidate.includes(needle);
}

export function extractOrderIdFromPrompt(prompt: string): string | null {
  const uuid = prompt.match(
    /\b(?:lab\s+)?order\s+#?\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
  );
  if (uuid) return uuid[1];

  const hashShort = prompt.match(/\border\s+#\s*([a-z0-9-]{2,})\b/i);
  if (hashShort) return hashShort[1].trim();

  const trailingOrder = prompt.match(/\b(?:lab\s+)?order\s+([a-z0-9-]{2,})\b/i);
  if (trailingOrder) return trailingOrder[1].trim();

  const compactOrder = prompt.match(
    /\b(?:lab\s+)?value\s+[A-Za-z][\w-]*\s+order\s+([a-z0-9-]{2,})\b/i,
  );
  if (compactOrder?.[1]) return compactOrder[1].trim();

  const hyOrderFor = prompt.match(/պատվերի\s+համար\s+#?\s*([a-z0-9-]{2,})/iu);
  if (hyOrderFor?.[1]) return hyOrderFor[1].trim();

  const hyOrder = prompt.match(/պատվեր(?:ի)?\s+#?\s*([a-z0-9-]{2,})/iu);
  if (hyOrder?.[1]) return hyOrder[1].trim();

  const ruOrder = prompt.match(
    /(?:для\s+)?заказ(?:а)?\s+#?\s*([a-z0-9-]{2,})/iu,
  );
  return ruOrder?.[1]?.trim() ?? null;
}

export function extractResultIdFromPrompt(prompt: string): string | null {
  const uuid = prompt.match(
    /\bresult\s+#?\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
  );
  if (uuid) return uuid[1];

  const hashShort = prompt.match(/\bresult\s+#\s*([a-z0-9-]{2,})\b/i);
  if (hashShort) return hashShort[1].trim();

  const plain = prompt.match(
    /\bresult\s+(?!for\b|to\b)#?\s*([a-z0-9-]{2,})\b/i,
  );
  if (plain?.[1]) return plain[1].trim();

  const hyResult = prompt.match(/արդյունք(?:ը)?\s+#?\s*([a-z0-9-]{2,})/iu);
  if (hyResult?.[1]) return hyResult[1].trim();

  const ruResult = prompt.match(
    /(?:для\s+)?результат(?:а)?\s+#?\s*([a-z0-9-]{2,})/iu,
  );
  return ruResult?.[1]?.trim() ?? null;
}

export function extractMeasurementReadingFromPrompt(
  prompt: string,
): { measurementCode: string; value: string } | null {
  const direct = prompt.match(
    /\b(?:enter|record|log|set|input|type)\s+(?:result\s+)?(?:lab\s+(?:value\s+)?)?([A-Za-z][\w-]*)\s+(?:value\s+of\s+|to\s+)?([0-9]+(?:\.[0-9]+)?)\b/i,
  );
  if (direct?.[1] && direct?.[2]) {
    return {
      measurementCode: direct[1].trim(),
      value: direct[2].trim(),
    };
  }

  const resultFirst = prompt.match(
    /\b(?:record|enter)\s+(?:a\s+)?([A-Za-z][\w-]*)\s+result\s+([0-9]+(?:\.[0-9]+)?)\b/i,
  );
  if (resultFirst?.[1] && resultFirst?.[2]) {
    return {
      measurementCode: resultFirst[1].trim(),
      value: resultFirst[2].trim(),
    };
  }

  const valueOf = prompt.match(
    /\b(?:record|enter)\s+(?:a\s+)?([A-Za-z][\w-]*)\s+value\s+of\s+([0-9]+(?:\.[0-9]+)?)\b/i,
  );
  if (valueOf?.[1] && valueOf?.[2]) {
    return {
      measurementCode: valueOf[1].trim(),
      value: valueOf[2].trim(),
    };
  }

  const setTo = prompt.match(
    /\bset\s+([A-Za-z][\w-]*)\s+to\s+([0-9]+(?:\.[0-9]+)?)\b/i,
  );
  if (setTo?.[1] && setTo?.[2]) {
    return {
      measurementCode: setTo[1].trim(),
      value: setTo[2].trim(),
    };
  }

  const hyDirect = prompt.match(
    new RegExp(
      String.raw`(?:մուտքագր|գրանց|նշ|ավելացր)${UNICODE_WORD_SUFFIX}\s+(?:արդյունք\s+)?(?:լաբորատոր\s+)?([A-Za-z][\w-]*)\s+(?:արժեք\s+)?([0-9]+(?:\.[0-9]+)?)`,
      'iu',
    ),
  );
  if (hyDirect?.[1] && hyDirect?.[2]) {
    return {
      measurementCode: hyDirect[1].trim(),
      value: hyDirect[2].trim(),
    };
  }

  const hyResultFirst = prompt.match(
    new RegExp(
      String.raw`(?:գրանց)${UNICODE_WORD_SUFFIX}\s+([A-Za-z][\w-]*)\s+արդյունք\s+([0-9]+(?:\.[0-9]+)?)`,
      'iu',
    ),
  );
  if (hyResultFirst?.[1] && hyResultFirst?.[2]) {
    return {
      measurementCode: hyResultFirst[1].trim(),
      value: hyResultFirst[2].trim(),
    };
  }

  const ruDirect = prompt.match(
    new RegExp(
      String.raw`(?:[Вв]вед|[Зз]апиш|[Уу]каж)${UNICODE_WORD_SUFFIX}\s+(?:результат\s+)?([A-Za-z][\w-]*)\s+([0-9]+(?:\.[0-9]+)?)`,
      'iu',
    ),
  );
  if (ruDirect?.[1] && ruDirect?.[2]) {
    return {
      measurementCode: ruDirect[1].trim(),
      value: ruDirect[2].trim(),
    };
  }

  const ruResultFirst = prompt.match(
    new RegExp(
      String.raw`(?:[Зз]апиш)${UNICODE_WORD_SUFFIX}\s+результат\s+([A-Za-z][\w-]*)\s+([0-9]+(?:\.[0-9]+)?)`,
      'iu',
    ),
  );
  if (ruResultFirst?.[1] && ruResultFirst?.[2]) {
    return {
      measurementCode: ruResultFirst[1].trim(),
      value: ruResultFirst[2].trim(),
    };
  }

  return null;
}

export function isEnterTestResultPrompt(prompt: string): boolean {
  if (!ENTER_RESULT_VERB.test(prompt)) return false;
  if (!extractMeasurementReadingFromPrompt(prompt)) return false;
  return (
    !!extractOrderIdFromPrompt(prompt) ||
    !!extractResultIdFromPrompt(prompt) ||
    LAB_RESULT_NOUN.test(prompt)
  );
}

export function isReleaseTestResultPrompt(prompt: string): boolean {
  if (isNotifyPatientResultReadyPrompt(prompt)) return false;
  const hasReleaseCue =
    RELEASE_RESULT_VERB.test(prompt) ||
    (/\bmake\b/i.test(prompt) && /\b(?:available|visible)\b/i.test(prompt)) ||
    (/\bsend\b/i.test(prompt) && /\bpatient\b/i.test(prompt)) ||
    /տար\s+հասանելի/i.test(prompt) ||
    /դարձրու\s+տեսանելի/i.test(prompt) ||
    /сделай\s+доступн/i.test(prompt) ||
    /сделай\s+видим/i.test(prompt);
  if (!hasReleaseCue) return false;
  return (
    LAB_RESULT_NOUN.test(prompt) ||
    /\b(?:to\s+patient|patient\s+chart|visible\s+to)\b/i.test(prompt) ||
    /(?:հիվանդ|հիվանդի)/iu.test(prompt) ||
    /(?:пациент|пациенту)/iu.test(prompt)
  );
}

export function parseEnterTestResultFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedEnterTestResultRequest | null {
  if (!isEnterTestResultPrompt(prompt)) return null;

  const reading = extractMeasurementReadingFromPrompt(prompt);
  const measurementCode =
    (typeof params.measurementCode === 'string' && params.measurementCode.trim()
      ? params.measurementCode.trim()
      : undefined) ?? reading?.measurementCode;
  const value =
    (typeof params.value === 'string' && params.value.trim()
      ? params.value.trim()
      : undefined) ??
    (typeof params.measurementValue === 'number'
      ? String(params.measurementValue)
      : typeof params.measurementValue === 'string'
        ? params.measurementValue.trim()
        : undefined) ??
    reading?.value;

  const orderId =
    (typeof params.orderId === 'string' && params.orderId.trim()
      ? params.orderId.trim()
      : undefined) ??
    extractOrderIdFromPrompt(prompt) ??
    undefined;
  const resultId =
    (typeof params.resultId === 'string' && params.resultId.trim()
      ? params.resultId.trim()
      : undefined) ??
    extractResultIdFromPrompt(prompt) ??
    undefined;
  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()
      ? params.customerName.trim()
      : undefined) ??
    extractVisitCustomerNameFromPrompt(prompt) ??
    undefined;

  if (!measurementCode || !value) return null;
  if (!orderId && !resultId) return null;

  return {
    orderId,
    resultId,
    measurementCode,
    value,
    customerName,
  };
}

export function parseReleaseTestResultFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedReleaseTestResultRequest | null {
  if (!isReleaseTestResultPrompt(prompt)) return null;

  const orderId =
    (typeof params.orderId === 'string' && params.orderId.trim()
      ? params.orderId.trim()
      : undefined) ??
    extractOrderIdFromPrompt(prompt) ??
    undefined;
  const resultId =
    (typeof params.resultId === 'string' && params.resultId.trim()
      ? params.resultId.trim()
      : undefined) ??
    extractResultIdFromPrompt(prompt) ??
    undefined;
  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()
      ? params.customerName.trim()
      : undefined) ??
    extractReleaseCustomerNameFromPrompt(prompt) ??
    undefined;

  return {
    orderId,
    resultId,
    customerName,
    bookingId:
      typeof params.bookingId === 'string' && params.bookingId.trim()
        ? params.bookingId.trim()
        : undefined,
    date:
      typeof params.date === 'string' && params.date.trim()
        ? params.date.trim()
        : undefined,
  };
}

export function extractReleaseCustomerNameFromPrompt(
  prompt: string,
): string | null {
  const possessiveResults = prompt.match(
    /\b([A-Za-z][\w-]*?)(?:['’]s)\s+(?:(?:lab|test)\s+|cbc\s+|bmp\s+)?results?\b/i,
  );
  if (possessiveResults?.[1]) return possessiveResults[1].trim();

  const toPatient = prompt.match(
    /\b(?:to|for)\s+patient\s+([A-Za-z][\w-]*)\b/i,
  );
  if (toPatient?.[1]) return toPatient[1].trim();

  const publishTo = prompt.match(
    /\bpublish\s+results?\s+to\s+([A-Za-z][\w-]*)\b/i,
  );
  if (publishTo?.[1]) return publishTo[1].trim();

  const availableTo = prompt.match(/\bavailable\s+to\s+([A-Za-z][\w-]*)\b/i);
  if (availableTo?.[1]) return availableTo[1].trim();

  const hyPatientDative = prompt.match(/([\p{L}]+)ին\s+լաբորատոր/iu);
  if (hyPatientDative?.[1]) {
    return normalizeMultilingualCustomerName(hyPatientDative[1] + 'ին');
  }

  const ruResultsForPatient = prompt.match(
    new RegExp(
      String.raw`результат${UNICODE_WORD_SUFFIX}\s+для\s+([\p{L}]+)`,
      'iu',
    ),
  );
  if (ruResultsForPatient?.[1]) {
    return normalizeMultilingualCustomerName(ruResultsForPatient[1]);
  }

  const ruLabResultsPatient = prompt.match(
    new RegExp(
      String.raw`лабораторн${UNICODE_WORD_SUFFIX}\s+результат${UNICODE_WORD_SUFFIX}(?:\s+для)?\s+([\p{L}]+)`,
      'iu',
    ),
  );
  if (ruLabResultsPatient?.[1]) {
    return normalizeMultilingualCustomerName(ruLabResultsPatient[1]);
  }

  const ruVisibleForPatient = prompt.match(/для\s+([\p{L}]+)\s*$/iu);
  if (ruVisibleForPatient?.[1]) {
    return normalizeMultilingualCustomerName(ruVisibleForPatient[1]);
  }

  return extractVisitCustomerNameFromPrompt(prompt);
}

export function rescueClinicTestResultIntent(
  prompt: string,
  action: string,
): { action: ClinicTestResultIntent; rescueReason: string } | null {
  if ((CLINIC_TEST_RESULT_INTENTS as readonly string[]).includes(action)) {
    return null;
  }

  if (parseEnterTestResultFromPrompt(prompt)) {
    return { action: 'enter_test_result', rescueReason: 'enter_test_result' };
  }

  if (parseReleaseTestResultFromPrompt(prompt)) {
    return {
      action: 'release_test_result',
      rescueReason: 'release_test_result',
    };
  }

  return null;
}

export interface ClinicTestResultResolveDeps {
  bookingRepo: Pick<Repository<Booking>, 'find' | 'findOne'>;
  resultRepo: Pick<Repository<ClinicTestResult>, 'find' | 'findOne'>;
}

export async function resolveReleaseCandidates(
  deps: ClinicTestResultResolveDeps,
  businessId: string,
  parsed: ParsedReleaseTestResultRequest,
): Promise<ClinicTestResult[]> {
  const releaseStatuses = [...CLINIC_RESULT_RELEASE_QUEUE_STATUSES];

  if (parsed.resultId) {
    const byId = await deps.resultRepo.findOne({
      where: { id: parsed.resultId, businessId },
    });
    if (byId && releaseStatuses.includes(byId.status as never)) {
      return [byId];
    }

    const results = await deps.resultRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    const prefixMatch = results.find(
      (row) =>
        releaseStatuses.includes(row.status as never) &&
        (row.id === parsed.resultId ||
          row.id.startsWith(parsed.resultId ?? '')),
    );
    return prefixMatch ? [prefixMatch] : [];
  }

  if (parsed.orderId) {
    const byOrder = await deps.resultRepo.find({
      where: { businessId, orderId: parsed.orderId },
      order: { createdAt: 'DESC' },
    });
    const filtered = byOrder.filter((row) =>
      releaseStatuses.includes(row.status as never),
    );
    if (filtered.length > 0) return filtered;

    const results = await deps.resultRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return results.filter(
      (row) =>
        releaseStatuses.includes(row.status as never) &&
        row.orderId &&
        orderIdMatches(row.orderId, parsed.orderId ?? ''),
    );
  }

  let customerId: string | undefined;
  if (parsed.customerName) {
    const bookings = await deps.bookingRepo.find({
      where: { businessId },
      relations: { customer: true },
      order: { startTime: 'DESC' },
      take: 100,
    });
    const needle = parsed.customerName.toLowerCase();
    const booking = bookings.find(
      (row) =>
        row.status !== BookingStatus.CANCELLED &&
        row.customer?.name?.toLowerCase().includes(needle),
    );
    customerId = booking?.customerId;
  }

  const results = await deps.resultRepo.find({
    where: customerId ? { businessId, customerId } : { businessId },
    order: { createdAt: 'DESC' },
    take: 50,
  });

  return results.filter((row) => releaseStatuses.includes(row.status as never));
}

export { assertClinicTestOrderBusinessType as assertClinicTestResultBusinessType };

export function buildClinicTestResultFixtureExpectations() {
  return {
    enter: ENTER_TEST_RESULT_PROMPTS,
    release: RELEASE_TEST_RESULT_PROMPTS,
  };
}
