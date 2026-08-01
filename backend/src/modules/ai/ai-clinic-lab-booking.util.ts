import type { Repository } from 'typeorm';
import type { Business } from '../business/entities/business.entity.js';
import type { ClinicLabQueueItem } from '../clinic-test-results/order/clinic-test-order.service.js';
import type { ClinicLabBookingRequestView } from '../../common/utils/clinic-lab-booking-request.util.js';
import { isClinicVerticalBusinessType } from '../../common/utils/clinic-service.util.js';
import { buildUtcStartTimeFromDayAndTime } from '../../common/utils/date-format.util.js';
import { normalizeTime24 } from '../../common/utils/time-format.util.js';
import { extractSingleIsoDayFromPrompt } from './ai-orchestration.helpers.js';
import { extractOrderIdFromPrompt } from './ai-clinic-test-result.util.js';
import {
  extractVisitCustomerNameFromPrompt,
  normalizeMultilingualCustomerName,
} from './ai-clinic-test-order.util.js';
import { extractCustomerNameFromPrompt } from './ai-retail-finance.util.js';
import {
  BOOK_LAB_FROM_ORDER_BLOCK,
  rescueBookLabFromOrderIntent,
} from './ai-book-lab-from-order.util.js';
import {
  AWAITING_PATIENT_BOOKING_LIST_PROMPTS,
  BOOK_LAB_COLLECTION_PROMPTS,
  LIST_MY_LAB_BOOKING_REQUESTS_PROMPTS,
  LIST_PATIENT_PENDING_LAB_REQUESTS_PROMPTS,
  PUSH_LAB_BOOKING_TO_PATIENT_PROMPTS,
  STAFF_BOOK_LAB_COLLECTION_PROMPTS,
} from './ai-clinic-lab-booking.fixtures.js';

export const DASHBOARD_CLINIC_LAB_BOOKING_MUTATE_INTENTS = [
  'push_lab_booking_to_patient',
  'staff_book_lab_collection',
] as const;

export const DASHBOARD_CLINIC_LAB_BOOKING_INTENTS = [
  ...DASHBOARD_CLINIC_LAB_BOOKING_MUTATE_INTENTS,
] as const;

export const CONSUMER_CLINIC_LAB_BOOKING_READ_INTENTS = [
  'list_my_lab_booking_requests',
  'book_lab_collection',
] as const;

export const CONSUMER_CLINIC_LAB_BOOKING_MUTATE_INTENTS = [
  'book_lab_from_order',
] as const;

export const CONSUMER_CLINIC_LAB_BOOKING_INTENTS = [
  ...CONSUMER_CLINIC_LAB_BOOKING_READ_INTENTS,
  ...CONSUMER_CLINIC_LAB_BOOKING_MUTATE_INTENTS,
] as const;

export const PROVIDER_CLINIC_LAB_BOOKING_READ_INTENTS = [
  'list_patient_pending_lab_requests',
] as const;

export const PROVIDER_CLINIC_LAB_BOOKING_MUTATE_INTENTS = [
  'notify_patient_book_lab',
] as const;

export const PROVIDER_CLINIC_LAB_BOOKING_INTENTS = [
  ...PROVIDER_CLINIC_LAB_BOOKING_READ_INTENTS,
  ...PROVIDER_CLINIC_LAB_BOOKING_MUTATE_INTENTS,
] as const;

export type DashboardClinicLabBookingIntent =
  (typeof DASHBOARD_CLINIC_LAB_BOOKING_INTENTS)[number];
export type ConsumerClinicLabBookingIntent =
  (typeof CONSUMER_CLINIC_LAB_BOOKING_INTENTS)[number];
export type ProviderClinicLabBookingIntent =
  (typeof PROVIDER_CLINIC_LAB_BOOKING_INTENTS)[number];

export interface ParsedPushLabBookingRequest {
  orderId?: string;
  customerName?: string;
  collectionServiceName?: string;
}

export interface ParsedStaffBookLabCollectionRequest {
  orderId?: string;
  customerName?: string;
  employeeName?: string;
  employeeId?: string;
  startTime?: string;
  date?: string;
  timeSlot?: string;
  collectionServiceName?: string;
}

export interface ParsedListMyLabBookingRequestsRequest {
  orderId?: string;
}

export interface ParsedBookLabCollectionRequest {
  orderId?: string;
  testName?: string;
}

/** e2e-bug.202 — topic/slot fragments must not count as a named lab panel. */
const LAB_COLLECTION_NEAREST_FILLER_NAME =
  /^(?:(?:my|the|a|an)\s+)?(?:lab(?:\s+(?:draw|collection|visit|blood\s+draw|test))?|blood\s+draw|blood\s+collection|blood\s+test)(?:\s+(?:earliest|soonest|nearest|first\s+available|asap|next\s+available))*(?:\s+(?:slot|opening|available|appointment|time))?$/i;

const LAB_COLLECTION_SLOT_ONLY_NAME =
  /^(?:the\s+)?(?:earliest|soonest|nearest|asap|first\s+available|next\s+available)(?:\s+(?:slot|opening|available|time|appointment))?$/i;

export function isLabCollectionNearestFillerName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return true;
  if (LAB_COLLECTION_NEAREST_FILLER_NAME.test(trimmed)) return true;
  if (LAB_COLLECTION_SLOT_ONLY_NAME.test(trimmed)) return true;
  return false;
}

/**
 * e2e-bug.202 — "Book lab draw earliest slot for unicorn-panel-xyzzy"
 * → panel name for resolve/abort (not the lab-draw topic itself).
 */
export function extractNamedLabPanelFromPrompt(prompt: string): string | null {
  const text = prompt.trim();
  if (!text) return null;
  const forMatch = text.match(
    /\bfor\s+([a-z0-9][\w'.-]{1,40}(?:\s+[a-z0-9][\w'.-]{1,40}){0,4})\s*$/i,
  );
  const raw = forMatch?.[1]?.trim();
  if (!raw) return null;
  if (isLabCollectionNearestFillerName(raw)) return null;
  return raw;
}

export function resolveBookLabCollectionTestName(
  prompt: string,
  params: Record<string, unknown> = {},
): string | undefined {
  if (typeof params.testName === 'string' && params.testName.trim()) {
    return params.testName.trim();
  }
  const fromPrompt = extractNamedLabPanelFromPrompt(prompt);
  if (fromPrompt) return fromPrompt;
  if (
    typeof params.serviceName === 'string' &&
    params.serviceName.trim() &&
    !isLabCollectionNearestFillerName(params.serviceName)
  ) {
    return params.serviceName.trim();
  }
  return undefined;
}

const UNICODE_WORD_SUFFIX = '[\\p{L}\\p{M}\\u055B]*';

const PUSH_VERB = new RegExp(
  String.raw`\b(push|send|notify|ask|have|let)\b|(?:ուղարկ(?:իր|ել)|տեղեկացրիր|հրավիրիր|հարցրիր|թող|տեղեկացն|հրավիր|հարցր|թողն)|(?:отправь|отправить|уведоми(?:ть)?|попроси(?:ть|те)?|пусть)(?=[\s,.;!?]|$)`,
  'iu',
);
const PUSH_TARGET = new RegExp(
  String.raw`\b(patient|self[- ]?book|book(?:ing)?\s+(?:request|link|appointment)|blood\s+draw|lab\s+(?:collection|draw|booking|appointment)|collection\s+booking|link)\b|(?:հիվանդ|արյան\s*վերց|լաբ(?:որատոր)?\s*հավաք|հավաքման|ամրագր|հղում|հրավեր|ինքնուրույն|լաբ\s*այց)|(?:пациент|кров|лаборатор|забор|бронир|ссылк|самостоятельн|лабораторн${UNICODE_WORD_SUFFIX}\s+визит)`,
  'iu',
);

const STAFF_BOOK_VERB = new RegExp(
  String.raw`\b(book|schedule|reserve)\b|(?:\p{L}*ամրագր${UNICODE_WORD_SUFFIX}|ամրագր${UNICODE_WORD_SUFFIX}|\p{L}*գրանց${UNICODE_WORD_SUFFIX}|գրանց${UNICODE_WORD_SUFFIX})|(?:[Зз]апиш${UNICODE_WORD_SUFFIX}|[Зз]абронир${UNICODE_WORD_SUFFIX}|[Зз]арезервир${UNICODE_WORD_SUFFIX}|[Нн]азнач${UNICODE_WORD_SUFFIX}|[Зз]апланир${UNICODE_WORD_SUFFIX})|(?:կարո[՞?]ղ\s+եք|можете)`,
  'iu',
);
const STAFF_BOOK_LAB_ORDER_TIME_CUE = new RegExp(
  String.raw`\b(?:tomorrow|today|tonight|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|afternoon|evening|\d{1,2}\s*(?:am|pm)|\d{1,2}:\d{2})\b`,
  'i',
);

const STAFF_BOOK_TARGET = new RegExp(
  String.raw`\b(lab\s+collection|blood\s+draw|collection\s+appointment|collection\s+slot|draw\s+slot|draw\s+visit|collection\s+for)\b|(?:լաբ(?:որատոր)?\s*հավաք|արյան\s*վերց|հավաքման\s*այց|հավաքման\s*սլոթ|հավաքում)|(?:лабораторн${UNICODE_WORD_SUFFIX}\s+заказ${UNICODE_WORD_SUFFIX}|лабораторн${UNICODE_WORD_SUFFIX}\s+забор|забор\s+крови|сбор\s+образц|лабораторн${UNICODE_WORD_SUFFIX}\s+сбор|при[её]м\s+на\s+забор)`,
  'iu',
);

const MY_SCOPE =
  /\b(?:my|the)\b|(?:^|[\s,.;])իմ(?:[\s,.;]|$)|(?:^|[\s,.;])իրենց(?:[\s,.;]|$)|(?:^|[\s,.;])мои(?:[\s,.;]|$)|(?:^|[\s,.;])мою(?:[\s,.;]|$)|(?:^|[\s,.;])мой(?:[\s,.;]|$)|(?:^|[\s,.;])моего(?:[\s,.;]|$)|(?:^|[\s,.;])моё(?:[\s,.;]|$)/iu;

const LAB_TO_BOOK_CONTEXT = new RegExp(
  String.raw`\b(lab\s+to\s+book|lab\s+appointments?\s+(?:to\s+book|do\s+i\s+need\s+to\s+book|i\s+need\s+to\s+book|i\s+am\s+waiting\s+to\s+book)|pending\s+lab\s+collection|lab\s+booking\s+requests?|lab\s+tests?\s+(?:to|i\s+need\s+to|did\s+the\s+clinic\s+ask\s+me\s+to)\s+book|open\s+my\s+lab\s+booking|lab\s+blood\s+draws?\s+i\s+still\s+need|lab\s+collections?\s+i\s+need\s+to\s+schedule)\b|(?:լաբ\s*ամրագր|սպասող\s*լաբ|լաբ.*ամրագրման|լաբ\s*հավաք.*ամրագր|կլինիկան\s+խնդրել.*ամրագր|պետք\s+է\s+գրանցեմ)|(?:лаб.*забронир|ожида.*лаб|лаб.*бронирован|лаб.*запис|клиник.*попросил[а]?.*забронир|лабораторн${UNICODE_WORD_SUFFIX}\s+тест${UNICODE_WORD_SUFFIX}.*забронир|нужно\s+записать|жду\s+ли.*бронирован)`,
  'iu',
);

const BOOK_MY_LAB_CONTEXT = new RegExp(
  String.raw`\b(book|schedule|reserve|complete)\b.*\b(my|the)\b.*\b(lab\s+(?:collection|test\s+collection|draw|visit)|blood\s+draw|collection\s+appointment)\b|\b(book|schedule)\s+(?:my\s+lab|lab\s+collection)\b|\bbook\s+lab\s+collection\s+from\b|(?:ամրագրիր|գրանցիր|ավարտիր|ինչպես\s+ամրագր|забронируй|запиши|зарезервируй|заверши).*(?:իմ|իրենց|мою|мой|мои|моё|свой|свою|свои).*(?:լաբ|արյան\s*վերց|հավաքման|лаб|забор|сбор|бронирован)|(?:ամրագրիր|գրանցիր|забронируй|запиши).*(?:լաբ|лаб).*(?:հավաքում|забор|сбор|запрос|клиник|հայտ)|(?:պետք\s*է|нужно).*(?:ամրագր|забронир|запис).*(?:իմ|мой|мою|свой|свою).*(?:լաբ|արյան|лаб|забор)`,
  'iu',
);

const PENDING_PATIENT_LAB_CONTEXT = new RegExp(
  String.raw`\b(patients?|who)\b.*\b(waiting|still\s+need|awaiting|has\s+not)\b.*\b(book|self[- ]?book)\b.*\b(lab|collection|blood\s+draw)\b|\b(pending|unbooked|awaiting)\b.*\b(lab\s+booking|lab\s+collection)\b|\blab\s+orders?\s+awaiting\s+patient\b|(?:որ\s+հիվանդ|հիվանդներ).*(?:սպասում|սպասող|դեռ).*(?:ինքնուրույն|ամրագր).*(?:լաբ|արյան|հավաք|պատվեր)|(?:որ\s+հիվանդ|հիվանդների?).*(?:լաբ|հավաք).*(?:չի\s+ամրագրվել|չամրագրված|դեռ)|(?:լաբ\s*պատվեր).*(?:սպասում\s*հիվանդի\s*ամրագրման)|(?:արյան\s*վերց).*(?:ինքնուրույն|սպասում)|(?:у\s+каких\s+пациент).*(?:лаб|забор).*(?:не\s+забронир|ещё)|(?:пациент|кто|какие\s+пациент|мои\s+пациент).*(?:ожида|ещё\s*нужно|не\s+забронир|должны).*(?:забронир|самостоятельн|бронирован).*(?:лаб|забор)|(?:лабораторн${UNICODE_WORD_SUFFIX}\s+заказ).*(?:ожида.*бронирования\s+пациент)|(?:незабронирован|отправлен).*(?:лаб|забор)`,
  'iu',
);

const AWAITING_PATIENT_BOOKING_CONTEXT = new RegExp(
  String.raw`\b(awaiting|waiting\s+for)\s+patient\s+(?:to\s+)?book\b|\borders?\s+awaiting\s+patient\s+booking\b|\bpushed\b.*\bnot\s+booked\b|\bpatient\s+self[- ]?booking\b|(?:լաբ\s*հերթ\s*սպասող\s*հիվանդի)|(?:սպասում\s*է\s*հիվանդ|պատվերներ.*սպասում\s*հիվանդ|ուղարկվել|ուղարկված).*(?:չամրագրված|չի\s+ամրագրվել|հիվանդ|ինքնուրույն)|(?:սպասում\s*են\s*հիվանդի.*ամրագր)|(?:հիվանդի\s+ինքնուրույն\s+ամրագրման).*(?:ամրագր|ինքնուրույն|սպասման)|(?:ожидает\s+бронирования\s+пациент|заказы.*ожидают\s+бронирования\s+пациент|ожидающие\s+бронирования\s+(?:забора\s+)?пациентом|очередь\s+лабораторн${UNICODE_WORD_SUFFIX}\s+заказ${UNICODE_WORD_SUFFIX}.*ожидающ${UNICODE_WORD_SUFFIX}\s+бронирования\s+пациентом|отправлен.*не\s+забронирован|ожидающие\s+самостоятельного\s+бронирования)`,
  'iu',
);

const LIST_QUERY_VERB = new RegExp(
  String.raw`\b(show|list|what|any|open|waiting|am\s+i|which|who|check)\b|(?:[Ցց]ույց${UNICODE_WORD_SUFFIX}|\p{L}*ցույց${UNICODE_WORD_SUFFIX}|ցույց${UNICODE_WORD_SUFFIX}|[Ցց]ուցակավոր${UNICODE_WORD_SUFFIX}|\p{L}*ցուցակավոր${UNICODE_WORD_SUFFIX}|ստուգիր|որ\s+հիվանդ|ինչ|կա[՞?])|(?:[Пп]окаж${UNICODE_WORD_SUFFIX}|[Сс]писок${UNICODE_WORD_SUFFIX}|[Кк]акие${UNICODE_WORD_SUFFIX}|[Кк]то|[Пп]ровер${UNICODE_WORD_SUFFIX})`,
  'iu',
);

const DASHBOARD_TEST_ORDER_LIST_BLOCK = new RegExp(
  String.raw`\b(?:list|show|check|open)\b.*\b(?:pending|waiting)\b.*\b(?:lab\s+orders?|test\s+orders?)\b|\b(?:list|show)\b.*\b(?:lab|test)\s+orders?\b.*\b(?:this\s+week|today|tomorrow)\b|(?:ցուցակավոր|պատվեր).*(?:սպասող|լաբորատոր)|(?:ցույց|ցուցադր).*(?:հավաքման\s+)?(?:սպասող).*(?:լաբորատոր|պատվեր)|(?:список|покаж).*(?:ожида|лабораторн).*(?:заказ|заказы)|(?:покаж).*(?:заказ).*(?:ожидающ).*(?:забор)`,
  'iu',
);

const LAB_RESULT_STATUS_EXPLAIN_BLOCK = new RegExp(
  String.raw`\b(what\s+does|what\s+is|what\s+do|mean|means|explain|status\s+of|why\s+is|when\s+will|when\s+are)\b.*\b(pending|released|reviewed|processing|waiting|ready)\b.*\b(?:results?|lab|test)\b|\b(pending|released|reviewed|processing)\b.*\bmean\b|ինչ\s+նշանակություն|что\s+означает|объясни\s+статус`,
  'iu',
);

const LAB_BOOKING_NOUN = new RegExp(
  String.raw`\b(lab\s+collection|lab\s+appointment|lab\s+booking|blood\s+draw|lab\s+tests?)\b|(?:լաբորատոր\s*հավաք|լաբ\s*այց|լաբ\s*հայտ|արյան\s*վերց|լաբ\s*պատվեր|լաբ\s*ամրագրման)|(?:лабораторн${UNICODE_WORD_SUFFIX}\s+забор|лабораторн${UNICODE_WORD_SUFFIX}\s+запис|лабораторн${UNICODE_WORD_SUFFIX}\s+бронирован|забор\s+крови|лабораторн${UNICODE_WORD_SUFFIX}\s+заказ)`,
  'iu',
);

const LIST_LAB_BOOKING_STATUS_CONTEXT = new RegExp(
  String.raw`\b(pushed|not\s+booked|still\s+not|pending|awaiting|unbooked)\b|(?:ուղարկվել|ուղարկված|չամրագրված|չի\s+ամրագրվել|սպասող|առանց\s+ամրագրված)|(?:отправлен|забронирован|незабронирован|не\s+забронирован|ожида)`,
  'iu',
);

const BOOK_ACTION_VERB = new RegExp(
  String.raw`\b(book|schedule|to\s+book|need\s+to|waiting)\b|ամրագր|գրանց|պետք\s*է|սպասում\s+ամրագր|забронир|запис|нужно|жду\s+ли`,
  'iu',
);

const LAB_COLLECTION_NEAREST_BLOCK = new RegExp(
  String.raw`\b(?:book|schedule|reserve)\b.*\b(?:lab\s+(?:collection|draw|visit|blood\s+draw)|blood\s+draw|lab\s+draw)\b.*\b(?:earliest|soonest|nearest|first\s+available|asap|next\s+available)\b|\b(?:earliest|soonest|nearest|first\s+available|asap|next\s+available)\b.*\b(?:lab\s+(?:collection|draw|visit|blood\s+draw)|blood\s+draw|lab\s+draw)\b|\b(?:lab\s+draw|blood\s+draw)\s+(?:earliest|soonest|nearest|first\s+available)\s+slot\b|(?:ամրագրիր|գրանցիր).{0,30}(?:լաբ|արյան).{0,30}(?:ամենամոտ|ամենաառաջին)|(?:забронируй|запиши).{0,30}(?:лаб|забор|кров).{0,30}(?:ближайш|раньше|скорее)`,
  'iu',
);

const CREATE_LAB_ORDER_BLOCK = new RegExp(
  String.raw`\bcreate\b.*\b(lab|test)\s+order\b|(?:ստեղծ|պատվիր).*(?:լաբորատոր|թեստ)|(?:созда|закаж).*(?:лаборатор|тест|анализ)`,
  'iu',
);

const PATIENT_RESULT_READY_NOTIFY_BLOCK = new RegExp(
  String.raw`\b(notify|alert|remind|send|push|text|email|sms|whatsapp)\b.*\b(?:patient|customer)\b.*\b(?:results?|lab|test)\b.*\b(?:ready|released)\b|\b(?:results?|lab|test)\b.*\b(?:ready|released)\b.*\b(?:patient|customer|notify|email|sms|whatsapp|send)\b|result[- ]?ready|տեղեկացն.*արդյունք|ուղարկ.*(?:արդյունք|whatsapp).*(?:պատրաստ|ready)|отправ(?:ить|ь).*(?:результат|анализ|письмо).*(?:готов|пациент)|уведоми.*(?:результат|пациент).*(?:готов|выпущен)|сообщи.*(?:результат|пациент).*(?:готов|выпущен)`,
  'iu',
);

export function isPushLabBookingToPatientPrompt(prompt: string): boolean {
  if (PATIENT_RESULT_READY_NOTIFY_BLOCK.test(prompt)) return false;
  if (CREATE_LAB_ORDER_BLOCK.test(prompt)) return false;
  if (
    /\b(?:send|release|push)\b/i.test(prompt) &&
    /\b(?:lab\s+)?results?\b/i.test(prompt) &&
    /\bpatient\b/i.test(prompt)
  ) {
    return false;
  }
  if (
    /(?:կլինիկայի\s+ուղարկած|ուղարկած\s+լաբ|отправила\s+клиника|отправленн)/iu.test(
      prompt,
    ) &&
    !/(?:^\s*ուղարկիր|^\s*отправь)/iu.test(prompt)
  ) {
    return false;
  }
  if (
    LIST_QUERY_VERB.test(prompt) &&
    LIST_LAB_BOOKING_STATUS_CONTEXT.test(prompt) &&
    !/(?:ուղարկիր|տեղեկացրիր|հրավիրիր|հարցրիր|отправь|уведоми|попроси)/iu.test(
      prompt,
    )
  ) {
    return false;
  }
  return PUSH_VERB.test(prompt) && PUSH_TARGET.test(prompt);
}

/** ai-cmd-provider-5.19.4 — provider mobile: remind/nudge a patient to self-book pending lab collection. Deliberately narrower than isPushLabBookingToPatientPrompt (which also matches dashboard's push/send/notify verbs) so it doesn't steal that shared vocabulary from push_lab_booking_to_patient on other surfaces. */
export function isNotifyPatientBookLabPrompt(prompt: string): boolean {
  return /\b(remind|nudge)\b/i.test(prompt) && PUSH_TARGET.test(prompt);
}

export function isStaffBookLabCollectionPrompt(prompt: string): boolean {
  if (
    BOOK_LAB_FROM_ORDER_BLOCK.test(prompt) &&
    !STAFF_BOOK_LAB_ORDER_TIME_CUE.test(prompt)
  ) {
    return false;
  }
  if (
    LIST_QUERY_VERB.test(prompt) &&
    LIST_LAB_BOOKING_STATUS_CONTEXT.test(prompt) &&
    !/(?:^\s*(?:book|schedule|reserve|ամրագրիր|գրանցիր|запиши|забронируй))/iu.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    /(?:^|\s)мне\s+нужно|(?:^|\s)ինձ\s+պետք|(?:^|\s)меня\s+|(?:^|\s)ինձ\s+/iu.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    /(?:клиника\s+попросила|կլինիկան\s+խնդրել)/iu.test(prompt) &&
    /(?:меня|ինձ|իմ)/iu.test(prompt)
  ) {
    return false;
  }
  if (
    /(?:կա[՞?]|есть\s+ли|ինչ\s+լաբ|какие\s+лаб)/iu.test(prompt) &&
    /(?:պետք\s*է|нужно|забронир|записать|ամրագր)/iu.test(prompt) &&
    !/(?:հիվանդ|пациент|for\s+patient)/iu.test(prompt)
  ) {
    return false;
  }
  if (
    /պետք\s*է\s+գրանցեմ|мне\s+нужно\s+записать|нужно\s+забронировать/iu.test(
      prompt,
    ) &&
    !/(?:հիվանդ|пациент|for\s+patient)/iu.test(prompt)
  ) {
    return false;
  }
  if (
    MY_SCOPE.test(prompt) &&
    !/\bstaff\b/i.test(prompt) &&
    !/(?:անձնակազմ|персонал)/iu.test(prompt)
  ) {
    return false;
  }
  if (/\bfrom\s+(?:clinic|the\s+clinic)\b/i.test(prompt)) return false;
  if (
    /(?:կլինիկայից|կլինիկայի\s+ուղարկած|который\s+отправила\s+клиника)/iu.test(
      prompt,
    )
  ) {
    return false;
  }
  if (
    /(?:կլինիկայի|клиник)/iu.test(prompt) &&
    !/(?:հիվանդ|пациент|for\s+patient)/iu.test(prompt) &&
    !extractLabBookingPatientNameFromPrompt(prompt)
  ) {
    return false;
  }
  if (isPushLabBookingToPatientPrompt(prompt)) return false;
  if (CREATE_LAB_ORDER_BLOCK.test(prompt)) return false;
  if (
    STAFF_BOOK_VERB.test(prompt) &&
    (STAFF_BOOK_TARGET.test(prompt) ||
      /\b(book|schedule|reserve)\s+[A-Za-z][\w-]*\s+lab\s+collection\b/i.test(
        prompt,
      ) ||
      /(?:ամրագրիր|գրանցիր|запиши|забронируй)\s+[\p{L}]+\s+լաբ/u.test(prompt) ||
      /(?:запиши|забронируй)\s+[\p{L}]+\s+лаб/iu.test(prompt) ||
      /\bschedule\s+collection\s+for\b/i.test(prompt) ||
      /(?:գրանցիր|запланируй)\s+հավաքման\s+պատվեր/iu.test(prompt))
  ) {
    return true;
  }
  return false;
}

function extractLabBookingOrderIdFromPrompt(prompt: string): string | null {
  return (
    extractOrderIdFromPrompt(prompt) ??
    prompt.match(/\b(ord-[a-z0-9-]+)\b/i)?.[1]?.trim() ??
    prompt.match(/(?:պատվեր|заказ)\s+(ord-[a-z0-9-]+)/iu)?.[1]?.trim() ??
    prompt
      .match(/(?:պատվերի\s+համար|для\s+заказа)\s+(ord-[a-z0-9-]+)/iu)?.[1]
      ?.trim() ??
    null
  );
}

const LAB_BOOKING_NAME_STOP_WORDS =
  /^(?:հիվանդ|պատվեր|հրավեր|հղում|հավաքման|ամրագրման|запрос|ссылку|пациента|пациенту|забора|забор)$/iu;

function extractLabBookingPatientNameFromPrompt(prompt: string): string | null {
  const hySendTargets = [...prompt.matchAll(/([\p{L}]{2,})(?:ին|ի)\b/gu)];
  const hySendNamed = hySendTargets
    .map((match) => match[1]?.trim())
    .filter(
      (name): name is string =>
        !!name && !LAB_BOOKING_NAME_STOP_WORDS.test(name),
    )
    .pop();
  if (hySendNamed) {
    return normalizeMultilingualCustomerName(hySendNamed);
  }

  const hyPossLab = prompt.match(/([\p{L}]+)ի\s+լաբ(?:որատոր)?/u);
  if (hyPossLab?.[1] && !LAB_BOOKING_NAME_STOP_WORDS.test(hyPossLab[1])) {
    return normalizeMultilingualCustomerName(hyPossLab[1].trim());
  }

  const ruPatientNamed = prompt.match(/пациент[ау]?\s+([\p{L}]+)/iu);
  if (ruPatientNamed?.[1]) {
    return normalizeMultilingualCustomerName(ruPatientNamed[1].trim());
  }

  const ruVerbNamed = prompt.match(
    /(?:попроси|отправь|уведоми|можете\s+отправить)\s+([\p{L}]+)/iu,
  );
  if (ruVerbNamed?.[1] && !LAB_BOOKING_NAME_STOP_WORDS.test(ruVerbNamed[1])) {
    return normalizeMultilingualCustomerName(ruVerbNamed[1].trim());
  }

  const ruNameAfterDraw = prompt.match(/(?:забора|забор)\s+([\p{L}]+)\s*$/iu);
  if (ruNameAfterDraw?.[1]) {
    return normalizeMultilingualCustomerName(ruNameAfterDraw[1].trim());
  }

  const ruForNamed = prompt.match(
    /(?:для|забронируй\s+лабораторн\w*\s+забор\s+для)\s+([\p{L}]+)/iu,
  );
  if (ruForNamed?.[1] && !LAB_BOOKING_NAME_STOP_WORDS.test(ruForNamed[1])) {
    return normalizeMultilingualCustomerName(ruForNamed[1].trim());
  }

  const sendNamed = prompt.match(
    /\b(?:send|push|notify)\s+([A-Za-z][\w-]*)\s+(?:a\s+)?(?:link|the)\b/i,
  );
  if (sendNamed?.[1]) return sendNamed[1].trim();

  const toPatientName = prompt.match(/\bto\s+patient\s+([A-Za-z][\w-]*)\b/i);
  if (toPatientName?.[1]) return toPatientName[1].trim();

  const patientNamed = prompt.match(/\bpatient\s+([A-Za-z][\w-]*)\b/i);
  if (patientNamed?.[1]) return patientNamed[1].trim();

  const haveSelfBook = prompt.match(
    /\b(?:have|let|ask|remind|nudge)\s+([A-Za-z][\w-]*)\s+(?:self[- ]?book|to\s+book)\b/i,
  );
  if (haveSelfBook?.[1]) return haveSelfBook[1].trim();

  const toNamed = prompt.match(
    /\b(?:push|send|notify)\b[^.]*?\bto\s+(?!book\b|self\b)([A-Za-z][\w-]*)\b/i,
  );
  if (toNamed?.[1]) return toNamed[1].trim();

  const forPatient = prompt.match(/\bfor\s+(?:patient\s+)?([A-Za-z][\w-]*)\b/i);
  if (
    forPatient?.[1] &&
    !/^(her|his|their|next|tomorrow|order|lab|patient)$/i.test(forPatient[1])
  ) {
    return forPatient[1].trim();
  }

  const possessive = prompt.match(
    /\b([A-Za-z][\w-]*)['’]s\s+(?:cbc|lab|blood)\b/i,
  );
  if (possessive?.[1]) return possessive[1].trim();

  const bookNamedLab = prompt.match(
    /\b(?:book|schedule|reserve)\s+([A-Za-z][\w-]*)\s+lab\b/i,
  );
  if (bookNamedLab?.[1] && bookNamedLab[1].toLowerCase() !== 'a') {
    return bookNamedLab[1].trim();
  }

  return (
    extractVisitCustomerNameFromPrompt(prompt) ??
    extractCustomerNameFromPrompt(prompt)
  );
}

export function isListMyLabBookingRequestsPrompt(prompt: string): boolean {
  if (BOOK_LAB_FROM_ORDER_BLOCK.test(prompt)) return false;
  if (LAB_COLLECTION_NEAREST_BLOCK.test(prompt)) return false;
  if (isPushLabBookingToPatientPrompt(prompt)) return false;
  if (isStaffBookLabCollectionPrompt(prompt)) return false;
  if (isAwaitingPatientBookingListPrompt(prompt)) return false;
  if (DASHBOARD_TEST_ORDER_LIST_BLOCK.test(prompt) && !MY_SCOPE.test(prompt)) {
    return false;
  }
  if (/\bmy\b.*\b(test|lab)\s+results?\b/i.test(prompt)) return false;
  if (/(?:իմ|мои).*(?:արդյունք|результат)/iu.test(prompt)) return false;
  if (
    (/\bmy\s+appointments?\b/i.test(prompt) ||
      /(?:իմ|мои)\s+այց/iu.test(prompt)) &&
    !LAB_TO_BOOK_CONTEXT.test(prompt)
  ) {
    return false;
  }
  if (BOOK_MY_LAB_CONTEXT.test(prompt)) return false;
  if (LAB_TO_BOOK_CONTEXT.test(prompt)) return true;
  if (
    (/\bwaiting\s+to\s+book\b/i.test(prompt) ||
      /սպասում\s+ամրագր/iu.test(prompt)) &&
    /\blab\b|լաբ|лаб/i.test(prompt)
  ) {
    return true;
  }
  if (
    LIST_QUERY_VERB.test(prompt) &&
    LAB_BOOKING_NOUN.test(prompt) &&
    BOOK_ACTION_VERB.test(prompt)
  ) {
    return true;
  }
  return false;
}

export function isBookLabCollectionPrompt(prompt: string): boolean {
  if (BOOK_LAB_FROM_ORDER_BLOCK.test(prompt)) return false;
  if (LAB_COLLECTION_NEAREST_BLOCK.test(prompt)) return false;
  if (isListMyLabBookingRequestsPrompt(prompt)) return false;
  if (isStaffBookLabCollectionPrompt(prompt)) return false;
  if (
    (/\bfor\s+(?:patient\s+)?[A-Za-z][\w-]*\b/i.test(prompt) ||
      /(?:հիվանդ|пациент)/iu.test(prompt)) &&
    !MY_SCOPE.test(prompt)
  ) {
    return false;
  }
  if (BOOK_MY_LAB_CONTEXT.test(prompt)) return true;
  if (
    /(?:ամրագրիր|գրանցիր).*(?:կլինիկայի\s+ուղարկած|ուղարկած\s+լաբ).*(?:հավաքում|լաբ)/iu.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    (/\b(how\s+do\s+i|need\s+to)\b/i.test(prompt) ||
      /(?:ինչպես|как).*(?:ամրագր|забронир)/iu.test(prompt) ||
      /(?:պետք\s*է|нужно).*(?:ամրագր|забронир)/iu.test(prompt)) &&
    (/\bbook\b.*\b(lab\s+collection|blood\s+draw)\b/i.test(prompt) ||
      /(?:լաբ|արյան\s*վերց|лаборатор|забор)/iu.test(prompt))
  ) {
    return true;
  }
  return false;
}

function isProviderPendingLabFallback(prompt: string): boolean {
  return (
    (/(?:ով|ու՞մ|кто|какие\s+пациент|мои\s+пациент)/iu.test(prompt) &&
      /(?:պետք|нужно|должны|սպասում)/iu.test(prompt) &&
      /(?:ամրագր|забронир|запис|бронирован)/iu.test(prompt) &&
      /(?:լաբ|հավաք|лаб|забор)/iu.test(prompt)) ||
    (LIST_QUERY_VERB.test(prompt) &&
      /(?:սպասող|չամրագրված|ուղարկված|незабронирован|ожида|отправлен)/iu.test(
        prompt,
      ) &&
      LAB_BOOKING_NOUN.test(prompt) &&
      /(?:հիվանդ|пациент|мои\s+пациент)/iu.test(prompt))
  );
}

export function isListPatientPendingLabRequestsPrompt(prompt: string): boolean {
  if (DASHBOARD_TEST_ORDER_LIST_BLOCK.test(prompt)) return false;
  if (
    /\b(?:list|show|which)\s+(?:lab\s+)?orders?\b/i.test(prompt) &&
    /\b(?:pushed|awaiting|waiting|not\s+booked|self[- ]?book)/i.test(prompt)
  ) {
    return false;
  }
  if (LAB_RESULT_STATUS_EXPLAIN_BLOCK.test(prompt)) return false;
  if (/\bmy\s+collection\s+queue\b/i.test(prompt)) return false;
  if (/(?:իմ|моя).*(?:հավաքման\s*հերթ|очередь\s+забора)/iu.test(prompt)) {
    return false;
  }
  if (
    /(?:որ\s+հիվանդ|հիվանդներ)/iu.test(prompt) &&
    /(?:սպասում|դեռ)/iu.test(prompt) &&
    /(?:ինքնուրույն|ամրագր)/iu.test(prompt) &&
    /(?:լաբ|արյան|հավաք|պատվեր)/iu.test(prompt)
  ) {
    return true;
  }
  if (
    /(?:какие\s+пациент|пациент)/iu.test(prompt) &&
    /(?:ещё\s+)?(?:ждут|ожида|должны|нужно)/iu.test(prompt) &&
    /(?:самостоятельн|бронирован|забронир)/iu.test(prompt) &&
    /(?:лаб|забор|заказ)/iu.test(prompt)
  ) {
    return true;
  }
  if (/չամրագրված/iu.test(prompt) && /(?:լաբ|հավաք|հայտ)/iu.test(prompt)) {
    return true;
  }
  if (PENDING_PATIENT_LAB_CONTEXT.test(prompt)) {
    if (
      MY_SCOPE.test(prompt) &&
      !/(?:հիվանդ|пациент|мои\s+пациент|patients?|which|who)/iu.test(prompt)
    ) {
      return false;
    }
    return true;
  }
  if (
    /(?:ստուգիր|check)/iu.test(prompt) &&
    MY_SCOPE.test(prompt) &&
    /(?:սպասող|pending)/iu.test(prompt) &&
    LAB_BOOKING_NOUN.test(prompt)
  ) {
    return true;
  }
  if (
    (/\b(who|which\s+patients?)\b/i.test(prompt) ||
      /(?:ու՞մ|кто|какие\s+пациент)/iu.test(prompt)) &&
    (/\b(book|self[- ]?book)\b/i.test(prompt) ||
      /(?:ամրագր|ինքնուրույն|забронир|самостоятельн)/iu.test(prompt)) &&
    /\b(lab|collection|blood\s+draw)\b|լաբ|հավաք|лаб|забор/i.test(prompt)
  ) {
    return true;
  }
  if (
    LIST_QUERY_VERB.test(prompt) &&
    (/\b(pending|awaiting|unbooked|still\s+not|pushed|without)\b/i.test(
      prompt,
    ) ||
      /(?:սպասող|չամրագրված|ուղարկված|без\s+брони|ожида)/iu.test(prompt)) &&
    LAB_BOOKING_NOUN.test(prompt) &&
    (!MY_SCOPE.test(prompt) ||
      /(?:հիվանդ|пациент|мои\s+пациент|patients?)/iu.test(prompt))
  ) {
    return true;
  }
  if (
    (/\b(patients?|my\s+patients?)\b/i.test(prompt) ||
      /(?:հիվանդներ|мои\s+пациент)/iu.test(prompt)) &&
    (/\b(lab\s+to\s+book|lab\s+collection)\b/i.test(prompt) ||
      /(?:լաբ\s*ամրագր|лаб.*забронир)/iu.test(prompt))
  ) {
    return true;
  }
  if (
    (/\bpushed\b/i.test(prompt) || /ուղարկված|отправлен/iu.test(prompt)) &&
    /\b(lab|collection)\b|լաբ|հավաք|лаб/i.test(prompt) &&
    (/\b(not\s+booked|without)\b/i.test(prompt) ||
      /չամրագրված|առանց\s+ամրագրված|не\s+забронир/iu.test(prompt))
  ) {
    return true;
  }
  return isProviderPendingLabFallback(prompt);
}

export function isAwaitingPatientBookingListPrompt(prompt: string): boolean {
  return (
    AWAITING_PATIENT_BOOKING_CONTEXT.test(prompt) ||
    (LIST_QUERY_VERB.test(prompt) &&
      /(?:սպասող\s*պատվեր|ինքնուրույն\s*ամրագր|ожида.*бронирования\s+пациент|самостоятельного\s+бронирования)/iu.test(
        prompt,
      ) &&
      /(?:պատվեր|заказ|լաբ|лаб)/iu.test(prompt) &&
      /(?:հիվանդ|пациент|ինքնուրույն|self[- ]?book|patient)/iu.test(prompt))
  );
}

function extractTimeSlotFromPrompt(prompt: string): string | null {
  const atTime = prompt.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (atTime) {
    let hour = Number(atTime[1]);
    const minute = atTime[2] ?? '00';
    const meridiem = atTime[3]?.toLowerCase();
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    return normalizeTime24(`${hour}:${minute}`);
  }

  const plainTime = prompt.match(/\b(\d{1,2}):(\d{2})\b/);
  if (plainTime) {
    return normalizeTime24(`${plainTime[1]}:${plainTime[2]}`);
  }

  if (/\bmorning\b/i.test(prompt)) return '09:00';
  if (/\bafternoon\b/i.test(prompt)) return '14:00';
  if (/\bevening\b/i.test(prompt)) return '17:00';

  return null;
}

export function buildStartTimeIso(
  prompt: string,
  params: Record<string, unknown>,
  timeZone = 'UTC',
): string | null {
  const date =
    (typeof params.date === 'string' && params.date.trim()
      ? params.date.trim()
      : undefined) ??
    extractSingleIsoDayFromPrompt(prompt, timeZone) ??
    undefined;
  const timeSlot =
    (typeof params.timeSlot === 'string' && params.timeSlot.trim()
      ? normalizeTime24(params.timeSlot.trim())
      : undefined) ??
    (typeof params.startTime === 'string' && params.startTime.includes('T')
      ? params.startTime
      : undefined) ??
    extractTimeSlotFromPrompt(prompt) ??
    undefined;

  if (!date || !timeSlot) return null;
  if (timeSlot.includes('T')) return timeSlot;
  return buildUtcStartTimeFromDayAndTime(date, timeSlot);
}

export function parsePushLabBookingFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedPushLabBookingRequest | null {
  if (
    !isPushLabBookingToPatientPrompt(prompt) &&
    !isNotifyPatientBookLabPrompt(prompt)
  ) {
    return null;
  }

  const orderId =
    (typeof params.orderId === 'string' && params.orderId.trim()
      ? params.orderId.trim()
      : undefined) ??
    extractLabBookingOrderIdFromPrompt(prompt) ??
    undefined;
  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()
      ? params.customerName.trim()
      : undefined) ??
    extractLabBookingPatientNameFromPrompt(prompt) ??
    undefined;
  const collectionServiceName =
    typeof params.collectionServiceName === 'string' &&
    params.collectionServiceName.trim()
      ? params.collectionServiceName.trim()
      : undefined;

  if (!orderId && !customerName) return null;
  return { orderId, customerName, collectionServiceName };
}

export function parseStaffBookLabCollectionFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
  timeZone = 'UTC',
): ParsedStaffBookLabCollectionRequest | null {
  if (!isStaffBookLabCollectionPrompt(prompt)) return null;

  const orderId =
    (typeof params.orderId === 'string' && params.orderId.trim()
      ? params.orderId.trim()
      : undefined) ??
    extractLabBookingOrderIdFromPrompt(prompt) ??
    undefined;
  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()
      ? params.customerName.trim()
      : undefined) ??
    extractLabBookingPatientNameFromPrompt(prompt) ??
    undefined;
  const employeeName =
    typeof params.employeeName === 'string' && params.employeeName.trim()
      ? params.employeeName.trim()
      : undefined;
  const employeeId =
    typeof params.employeeId === 'string' && params.employeeId.trim()
      ? params.employeeId.trim()
      : undefined;
  const startTime = buildStartTimeIso(prompt, params, timeZone) ?? undefined;
  const collectionServiceName =
    typeof params.collectionServiceName === 'string' &&
    params.collectionServiceName.trim()
      ? params.collectionServiceName.trim()
      : undefined;

  if (!orderId && !customerName) return null;
  return {
    orderId,
    customerName,
    employeeName,
    employeeId,
    startTime,
    collectionServiceName,
  };
}

export function isLabCollectionNearestCompoundPrompt(prompt: string): boolean {
  return LAB_COLLECTION_NEAREST_BLOCK.test(prompt);
}

export function parseListMyLabBookingRequestsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedListMyLabBookingRequestsRequest | null {
  if (
    !isListMyLabBookingRequestsPrompt(prompt) &&
    !isLabCollectionNearestCompoundPrompt(prompt)
  ) {
    return null;
  }
  const orderId =
    typeof params.orderId === 'string' && params.orderId.trim()
      ? params.orderId.trim()
      : undefined;
  return { orderId };
}

export function parseBookLabCollectionFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedBookLabCollectionRequest | null {
  if (
    !isBookLabCollectionPrompt(prompt) &&
    !isLabCollectionNearestCompoundPrompt(prompt) &&
    !(
      params.bookingFirstAvailable === true &&
      (typeof params.orderId === 'string' ||
        typeof params.testName === 'string')
    )
  ) {
    return null;
  }
  const orderId =
    (typeof params.orderId === 'string' && params.orderId.trim()
      ? params.orderId.trim()
      : undefined) ??
    extractOrderIdFromPrompt(prompt) ??
    undefined;
  const testName = resolveBookLabCollectionTestName(prompt, params);
  return { orderId, testName };
}

export function parseListPatientPendingLabRequestsFromPrompt(
  prompt: string,
): boolean {
  return isListPatientPendingLabRequestsPrompt(prompt);
}

export function matchLabQueueOrder(
  orders: ClinicLabQueueItem[],
  input: { orderId?: string; customerName?: string },
): ClinicLabQueueItem | null {
  if (input.orderId) {
    const needle = input.orderId.toLowerCase();
    const byId = orders.find(
      (order) =>
        order.id === input.orderId ||
        order.id.toLowerCase() === needle ||
        order.id.toLowerCase().startsWith(needle),
    );
    if (byId) return byId;
  }

  if (input.customerName) {
    const needle = input.customerName.toLowerCase();
    const matches = orders.filter((order) =>
      (order.customerName ?? '').toLowerCase().includes(needle),
    );
    return matches[0] ?? null;
  }

  return null;
}

export function pickCollectionServiceId(
  supported: Array<{ id: string; name: string }>,
  collectionServiceName?: string,
): string | null {
  if (supported.length === 0) return null;
  if (!collectionServiceName) return supported[0]?.id ?? null;
  const needle = collectionServiceName.toLowerCase();
  const match = supported.find((service) =>
    service.name.toLowerCase().includes(needle),
  );
  return match?.id ?? supported[0]?.id ?? null;
}

export function formatLabBookingRequestsSummary(
  requests: ClinicLabBookingRequestView[],
): string {
  if (requests.length === 0) {
    return 'You have no pending lab collection appointments to book.';
  }
  const lines = requests.map(
    (request) =>
      `${request.displayNames ?? 'Lab tests'} — ${request.collectionServiceName} (pushed ${new Date(request.pushedAt).toLocaleDateString()})`,
  );
  return `You have ${requests.length} lab appointment(s) to book:\n${lines.join('\n')}`;
}

export function formatBookLabCollectionSummary(
  requests: ClinicLabBookingRequestView[],
  options?: { bookingFirstAvailable?: boolean },
): string {
  if (requests.length === 0) {
    return 'No open lab collection booking requests were found on your account.';
  }
  if (requests.length === 1) {
    const request = requests[0];
    if (options?.bookingFirstAvailable) {
      return `Book the earliest available lab collection slot for ${request.displayNames ?? 'ordered tests'} (${request.collectionServiceName}). Continue to choose the soonest opening.`;
    }
    return `Open your lab collection booking for ${request.displayNames ?? 'ordered tests'} (${request.collectionServiceName}). Use the book link to choose a time.`;
  }
  if (options?.bookingFirstAvailable) {
    return `You have ${requests.length} lab collections to book. Open one from your Lab to book list — the earliest available slot will be selected when you continue.`;
  }
  return `You have ${requests.length} lab collections to book. Pick one from your Lab to book list and use its booking link.`;
}

export function appendBookingFirstAvailableToLabBookUrl(
  bookUrl: string,
  bookingFirstAvailable: boolean,
): string {
  if (!bookingFirstAvailable) return bookUrl;
  try {
    const url = new URL(bookUrl);
    url.searchParams.set('bookingFirstAvailable', '1');
    return url.toString();
  } catch {
    const separator = bookUrl.includes('?') ? '&' : '?';
    return `${bookUrl}${separator}bookingFirstAvailable=1`;
  }
}

export function formatPendingPatientLabRequestsSummary(
  orders: ClinicLabQueueItem[],
): string {
  if (orders.length === 0) {
    return 'No patients are waiting to self-book lab collection.';
  }
  const lines = orders.map(
    (order) =>
      `${order.customerName ?? 'Patient'} — ${order.displayNames ?? 'Lab order'} (pushed ${order.bookingRequestPushedAt ? new Date(order.bookingRequestPushedAt).toLocaleDateString() : 'recently'})`,
  );
  return `${orders.length} patient lab order(s) awaiting booking:\n${lines.join('\n')}`;
}

export function assertClinicLabBookingBusinessType(
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

export function rescueDashboardClinicLabBookingIntent(
  prompt: string,
  action: string,
): { action: DashboardClinicLabBookingIntent; rescueReason: string } | null {
  if (isAwaitingPatientBookingListPrompt(prompt)) {
    return null;
  }
  if (
    (DASHBOARD_CLINIC_LAB_BOOKING_INTENTS as readonly string[]).includes(action)
  ) {
    return null;
  }

  if (parsePushLabBookingFromPrompt(prompt)) {
    return {
      action: 'push_lab_booking_to_patient',
      rescueReason: 'push_lab_booking_to_patient',
    };
  }

  if (parseStaffBookLabCollectionFromPrompt(prompt)) {
    return {
      action: 'staff_book_lab_collection',
      rescueReason: 'staff_book_lab_collection',
    };
  }

  return null;
}

export function rescueConsumerClinicLabBookingIntent(
  prompt: string,
  action: string,
): { action: ConsumerClinicLabBookingIntent; rescueReason: string } | null {
  if (isLabCollectionNearestCompoundPrompt(prompt)) {
    return null;
  }

  const bookFromOrder = rescueBookLabFromOrderIntent(prompt, action);
  if (bookFromOrder) return bookFromOrder;

  if (
    isPushLabBookingToPatientPrompt(prompt) ||
    isStaffBookLabCollectionPrompt(prompt) ||
    isListPatientPendingLabRequestsPrompt(prompt) ||
    isAwaitingPatientBookingListPrompt(prompt)
  ) {
    return null;
  }

  if (
    (CONSUMER_CLINIC_LAB_BOOKING_INTENTS as readonly string[]).includes(action)
  ) {
    return null;
  }

  if (parseListMyLabBookingRequestsFromPrompt(prompt)) {
    return {
      action: 'list_my_lab_booking_requests',
      rescueReason: 'list_my_lab_booking_requests',
    };
  }

  if (parseBookLabCollectionFromPrompt(prompt)) {
    return {
      action: 'book_lab_collection',
      rescueReason: 'book_lab_collection',
    };
  }

  return null;
}

export function rescueProviderClinicLabBookingIntent(
  prompt: string,
  action: string,
): { action: ProviderClinicLabBookingIntent; rescueReason: string } | null {
  if (
    isAwaitingPatientBookingListPrompt(prompt) &&
    /(?:պատվերներ|заказы)/iu.test(prompt) &&
    !/(?:հիվանդներ|какие\s+пациент|мои\s+пациент)/iu.test(prompt)
  ) {
    return null;
  }
  if (
    (PROVIDER_CLINIC_LAB_BOOKING_INTENTS as readonly string[]).includes(action)
  ) {
    return null;
  }

  if (parseListPatientPendingLabRequestsFromPrompt(prompt)) {
    return {
      action: 'list_patient_pending_lab_requests',
      rescueReason: 'list_patient_pending_lab_requests',
    };
  }

  if (isNotifyPatientBookLabPrompt(prompt)) {
    return {
      action: 'notify_patient_book_lab',
      rescueReason: 'notify_patient_book_lab',
    };
  }

  return null;
}

export { resolveSessionCustomerId } from './ai-consumer-clinic-test-results.util.js';

export function buildClinicLabBookingFixtureExpectations() {
  return {
    push: PUSH_LAB_BOOKING_TO_PATIENT_PROMPTS,
    staffBook: STAFF_BOOK_LAB_COLLECTION_PROMPTS,
    listMyRequests: LIST_MY_LAB_BOOKING_REQUESTS_PROMPTS,
    bookCollection: BOOK_LAB_COLLECTION_PROMPTS,
    providerPending: LIST_PATIENT_PENDING_LAB_REQUESTS_PROMPTS,
    awaitingPatientBooking: AWAITING_PATIENT_BOOKING_LIST_PROMPTS,
  };
}
