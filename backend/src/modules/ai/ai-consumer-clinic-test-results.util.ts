import type { ClinicPatientReleasedResultView } from '../clinic-test-results/clinic-test-results.service.js';
import type { ClinicTestResultStatus } from '../../common/utils/clinic-lab-state.util.js';
import {
  formatClinicTestResultStatusLabel,
  isClinicTestResultStatus,
} from '../../common/utils/clinic-lab-state.util.js';
import type { AppLocale } from '../../common/i18n/messages.js';
import { assertClinicPatientChartBusinessType } from './ai-clinic-patient-chart.util.js';
import {
  EXPLAIN_RESULT_STATUS_PROMPTS,
  LIST_MY_TEST_RESULTS_PROMPTS,
} from './ai-consumer-clinic-test-results.fixtures.js';
import { CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_SCENARIOS } from './ai-consumer-clinic-test-results-deferred-multilingual.fixtures.js';
import { LIST_MY_DOCUMENTS_BLOCK } from './ai-list-my-documents.fixtures.js';
import { EXPLAIN_ABNORMAL_RESULT_FLAG_BLOCK } from './ai-explain-abnormal-result-flag.fixtures.js';
import {
  hasResultsThenRebookFollowUpCue,
  hasResultsThenRebookResultsCue,
} from './ai-results-then-rebook-cue.util.js';
import { rescueResultsThenRebookCompoundIntent } from './ai-results-then-rebook-compound.util.js';

export const CONSUMER_CLINIC_TEST_RESULTS_READ_INTENTS = [
  'list_my_test_results',
  'explain_result_status',
] as const;

export const CONSUMER_CLINIC_TEST_RESULTS_INTENTS = [
  ...CONSUMER_CLINIC_TEST_RESULTS_READ_INTENTS,
] as const;

export type ConsumerClinicTestResultsIntent =
  (typeof CONSUMER_CLINIC_TEST_RESULTS_INTENTS)[number];

export interface ParsedListMyTestResultsRequest {
  testName?: string;
}

export interface ParsedExplainResultStatusRequest {
  status?: ClinicTestResultStatus;
  testName?: string;
  resultId?: string;
}

const UNICODE_WORD_SUFFIX = '[\\p{L}\\p{M}\\u055B]*';

const LAB_ORDER_BLOCK = new RegExp(
  String.raw`(?:\b(test|lab)\s+orders?\b)|(?:թեստ(?:ի)?\s+պատվեր)|(?:լաբորատոր\s+պատվեր)|(?:тест${UNICODE_WORD_SUFFIX}\s+заказ)|(?:лабораторн${UNICODE_WORD_SUFFIX}\s+заказ${UNICODE_WORD_SUFFIX})`,
  'iu',
);

const LAB_BOOKING_COLLECTION_BLOCK = new RegExp(
  String.raw`\b(book|schedule|reserve|complete)\b.*\b(?:lab\s+collection|blood\s+draw|collection\s+appointment)\b|(?:ամրագրիր|գրանցիր|забронируй|запиши|зарезервируй|заверши).*(?:լաբ\s*հավաք|արյան\s*վերց|лабораторн${UNICODE_WORD_SUFFIX}\s+забор|забор\s+крови)`,
  'iu',
);

const LAB_BOOKING_LIST_BLOCK = new RegExp(
  String.raw`\b(?:lab\s+appointments?\s+to\s+book|pending\s+lab\s+collection|lab\s+to\s+book|open\s+my\s+lab\s+booking)\b|(?:ինչ\s+լաբ|սպասող\s+լաբ\s+հայտ|բացիր\s+իմ\s+լաբ|լաբ\s+այց|լաբ\s+հավաքումներ|արյան\s+վերցումներ|պետք\s*է\s+գրանցեմ|կա[՞?].*արյան|կլինիկան\s+խնդրել|իմ\s+լաբ\s+ամրագր|իմ\s+հաշվում\s+լաբ|какие\s+лаб|ожидающие\s+запросы\s+на\s+лаб|открой\s+мои\s+запросы\s+на\s+лаб|лаб.*забронир|мне\s+нужно\s+забронировать|попросила\s+меня|мой\s+список\s+лаб|есть\s+ли\s+забор|հիվանդի\s+ինքնուրույն\s+ամրագրման|заказы.*ожидающие\s+бронирования\s+пациент)`,
  'iu',
);

const ORDER_MUTATE_CONTEXT = new RegExp(
  String.raw`\b(order|place|request|add|create)\b|(?:պատվիր|ստեղծ|ավելացր|ցուցակավոր)|(?:закаж|оформи|добавь|создай|список)`,
  'iu',
);

const RESULTS_NOUN = new RegExp(
  String.raw`\b(test|lab)\s+results?\b|\bmy\s+results\b|արդյունք|լաբ(?:որատոր)?\s+արդյունք|թեստ(?:ի)?\s+արդյունք|результат|лабораторн${UNICODE_WORD_SUFFIX}\s+результат|анализ`,
  'iu',
);

const EXPLAIN_QUERY_MARKERS = new RegExp(
  String.raw`\b(how|when|why|explain|mean|means|status)\b|ինչու|երբ|ինչ|ինչպես|բացատրիր|նշանակություն|քանի|почему|когда|что\s+означает|объясни|статус|какой|как|сколько`,
  'iu',
);

const MY_SCOPE = new RegExp(
  String.raw`\b(my|account|released)\b|իմ|հաշիվ|My\s+Results|мо(и|й|ю|я|ём|ем)|аккаунт|Мои\s+результаты`,
  'iu',
);

const LIST_VERBS = new RegExp(
  String.raw`\b(show|list|check|open|see|view)\b|ցույց|բացիր|ցուցակավոր|տեսն|կարո[ղ]|покаж|открой|список|проверь`,
  'iu',
);

const PUBLIC_SURFACE = new RegExp(
  String.raw`\b(page|booking|portal|visit|here|site|section)\b|էջ|կայք|այս|այստեղ|այցելություն|գրանցման|страниц|сайт|записи|визит|здесь|этой`,
  'iu',
);

const APP_SURFACE = new RegExp(
  String.raw`\b(app|application)\b|հավելված|приложени`,
  'iu',
);

const NON_LAB_RESULT_CONSUMER_TOPIC_BLOCK = new RegExp(
  String.raw`\b(checkout\s+success|booking\s+success|success\s+screen|product\s+cards?|recommendations?|you might also like|checkout\s+tax|payment\s+summary|loyalty\s+points|gift\s+card|promo\s+code|stripe|currency|vat|gst|pst|incl\.|tax\b|налог|հարկ)`,
  'iu',
);

const STAFF_RESULT_NOTIFY_BLOCK = new RegExp(
  String.raw`\b(notify|alert|remind|send|push|text|email|sms|whatsapp)\b.*\b(patient|customer|client)\b|\b(notify|alert|remind|send|push|text|email|sms|whatsapp)\b.*\b(?:results?|lab|test)\b.*\b(?:ready|released)\b|\b(?:results?|lab|test)\b.*\b(?:ready|released)\b.*\b(?:patient|customer|notify|email|sms|whatsapp|send)\b|result[- ]?ready|уведом(?:ить|и|ление)|оповест(?:ить|и)|напомн(?:ить|и)|отправ(?:ить|ь)\s+(?:пациент|клиент|письмо|whatsapp)|հիվանդին\s+տեղեկացր|հիվանդին\s+ծանուց|տեղեկացն.*արդյունք|ուղարկ.*(?:արդյունք|whatsapp).*(?:պատրաստ|ready)`,
  'iu',
);

const MY_RESULTS_CONTEXT =
  /\b(my|account|released)\b.*\b(test|lab)\s+results?\b|\b(test|lab)\s+results?\b.*\b(my|account|released)\b|\bmy\s+results\b|\bresults?\s+in\s+my\s+account\b/i;

const SCOPED_MY = `(?:${MY_SCOPE.source})`;
const SCOPED_RESULTS_NOUN = `(?:${RESULTS_NOUN.source})`;

const MY_RESULTS_CONTEXT_MULTILINGUAL = new RegExp(
  String.raw`${SCOPED_MY}.*${SCOPED_RESULTS_NOUN}|${SCOPED_RESULTS_NOUN}.*${SCOPED_MY}|${SCOPED_MY}.*(?:թողարկված|выпущен|готовы?\s+ли)|(?:թողարկված|выпущен).*(?:արդյունք|результат).*(?:իմ|мо|аккаунт)`,
  'iu',
);

const EXPLAIN_STATUS_CONTEXT =
  /\b(explain|what|why|when|how|mean|means|status|processing|released|pending|reviewed|ready|available|showing|waiting|long|appear)\b/i;

const EXPLAIN_STATUS_CONTEXT_MULTILINGUAL = new RegExp(
  String.raw`${EXPLAIN_STATUS_CONTEXT.source}|ինչու|երբ|ինչ|նշանակություն|բացատրիր|սպասման|թողարկված|մշակում|պատրաստ|почему|когда|что\s+означает|объясни|ожидани|выпущен|обработ|готов|не\s+вижу|не\s+показыва|չեմ\s+տեսնում`,
  'iu',
);

const LIST_MY_GUARD = new RegExp(
  String.raw`\b(do\s+i\s+have|are\s+my|are\s+any|show\s+my|list\s+my|check\s+my|open\s+my|see\s+my)\b|ցույց\s+տուր\s+իմ|բացիր\s+իմ|կա[՞?]|ունեմ|покажи\s+мои|открой\s+мои|есть\s+ли\s+у\s+меня|готовы\s+ли`,
  'iu',
);

const TRACK_LAB_ORDER_STATUS_BLOCK = new RegExp(
  String.raw`\b(?:are|is)\s+(?:my|the|any(?:\s+of)?\s+my)\s+(?:results?|lab\s+(?:tests?|work|orders?))(?:\s+ready|\s+(?:done|available|back|in))|track\s+(?:my\s+)?(?:lab|order|results?)|(?:lab|test)\s+order\s+status|where\s+is\s+my\s+(?:lab|blood|test|CBC|lipid)|(?:has|have)\s+my\s+(?:lab|blood|test).*(?:come\s+back|back|ready|done)|check\s+if\s+my\s+(?:test\s+)?results?\s+(?:are\s+)?ready|(?:готов|готовы)\s+ли\s+(?:мои\s+)?(?:результат|анализ)|պատրա[՞]?\s+են\s+(?:իմ\s+)?(?:արդյունք|լաբ)|հետևիր\s+իմ\s+լաբ|որտեղ\s+ե(?:մ|ս)\s+իմ\s+(?:արյան|լաբ)|отслед(?:ить|и)\s+(?:мой\s+)?(?:лаб|заказ)|где\s+(?:мой|моя)\s+(?:анализ|кров)`,
  'iu',
);

function normalizeConsumerClinicPromptForExactMatch(prompt: string): string {
  return prompt.trim().toLowerCase().replace(/\s+/g, ' ');
}

function matchConsumerClinicTestResultsDeferredMultilingualScenario(
  prompt: string,
):
  | (typeof CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_SCENARIOS)[number]
  | null {
  const normalized = normalizeConsumerClinicPromptForExactMatch(prompt);
  for (const scenario of CONSUMER_CLINIC_TEST_RESULTS_DEFERRED_MULTILINGUAL_SCENARIOS) {
    if (
      normalizeConsumerClinicPromptForExactMatch(scenario.prompt) === normalized
    ) {
      return scenario;
    }
  }
  return null;
}

const PATIENT_RESULT_STATUS_EXPLANATIONS: Record<
  ClinicTestResultStatus,
  string
> = {
  NotReceived:
    'The lab has not received your sample results yet. This usually means collection or transport is still in progress.',
  Pending:
    'Your sample is being processed at the lab. Results are not ready to share yet.',
  WaitingCompletion:
    'The lab is finishing partial measurements. Your care team will review before anything is released to you.',
  Completed:
    'Testing is complete at the lab. A clinician may still review the result before it appears in My Results.',
  Reviewed:
    'Your clinician reviewed the result. It will appear in My Results once it is released to you.',
  AutomaticallyReviewed:
    'The result passed automatic review and should be released to My Results soon.',
  Released:
    'Your result was reviewed and released. You can view it in My Results.',
  Rejected:
    'This test could not be completed. Contact the clinic for next steps.',
};

const RESULT_TEST_NAME_STOP_WORDS = new Set([
  'lab',
  'test',
  'panel',
  'my',
  'the',
  'any',
  'released',
]);

export function isListMyTestResultsPrompt(prompt: string): boolean {
  const deferredMatch =
    matchConsumerClinicTestResultsDeferredMultilingualScenario(prompt);
  if (deferredMatch?.expectedAction === 'explain_result_status') {
    return false;
  }
  if (deferredMatch?.expectedAction === 'list_my_test_results') {
    return true;
  }

  if (STAFF_RESULT_NOTIFY_BLOCK.test(prompt)) return false;
  if (LIST_MY_DOCUMENTS_BLOCK.test(prompt)) return false;
  if (LAB_BOOKING_LIST_BLOCK.test(prompt)) return false;
  if (LAB_BOOKING_COLLECTION_BLOCK.test(prompt)) return false;
  if (LAB_ORDER_BLOCK.test(prompt)) return false;
  if (
    TRACK_LAB_ORDER_STATUS_BLOCK.test(prompt) &&
    !APP_SURFACE.test(prompt) &&
    !PUBLIC_SURFACE.test(prompt)
  ) {
    return false;
  }
  if (
    ORDER_MUTATE_CONTEXT.test(prompt) &&
    /(?:թեստ|պատվեր|заказ|анализ|լաբորատոր)/iu.test(prompt) &&
    !/արդյունք|результат/iu.test(prompt)
  ) {
    return false;
  }
  if (EXPLAIN_QUERY_MARKERS.test(prompt) && RESULTS_NOUN.test(prompt)) {
    return false;
  }
  if (
    /\b(how|when|why|explain|mean|means|status)\b/i.test(prompt) &&
    /\bmy\s+results\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(what\s+does|what\s+is\s+the\s+status|why|when\s+will|when\s+are|explain|mean|means|status\s+of|not\s+showing|don'?t\s+see|still\s+processing|still\s+waiting)\b/i.test(
      prompt,
    ) &&
    /\b(results?|lab|test|released|pending|reviewed|processing)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    EXPLAIN_QUERY_MARKERS.test(prompt) &&
    (MY_SCOPE.test(prompt) || /արդյունք|результат/iu.test(prompt))
  ) {
    return false;
  }

  if (MY_RESULTS_CONTEXT.test(prompt)) return true;
  if (MY_RESULTS_CONTEXT_MULTILINGUAL.test(prompt)) return true;
  if (
    /\b(show|list|check|open|see)\b/i.test(prompt) &&
    /\b(test|lab)\s+results?\b/i.test(prompt) &&
    (MY_SCOPE.test(prompt) || /\bmy\s+results\b/i.test(prompt))
  ) {
    return true;
  }
  if (
    /\b(do\s+i\s+have|are\s+any)\b/i.test(prompt) &&
    /\b(results?|cbc|lipid|panel)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(lab|test)\s+results?\b.*\b(in\s+my\s+account|do\s+i\s+have)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /\b(releas(?:e|ed)|results?)\b/i.test(prompt) &&
    /\b(my\s+account|to\s+my\s+account|on\s+my\s+account)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(show|list|open|view|check)\b/i.test(prompt) &&
    /\bresults?\b/i.test(prompt) &&
    /\b(app|page|portal|booking|visit|section|my\s+results)\b/i.test(prompt) &&
    !/\b(when|why|how|explain|mean|means|status)\b/i.test(prompt)
  ) {
    return true;
  }

  if (LIST_VERBS.test(prompt) && RESULTS_NOUN.test(prompt)) {
    if (APP_SURFACE.test(prompt) || PUBLIC_SURFACE.test(prompt)) {
      return true;
    }
    if (MY_SCOPE.test(prompt)) {
      return true;
    }
  }

  if (
    /(?:կա[՞?]|ունեմ|պատրա[՞?]ստ\s+են|есть\s+ли|готовы\s+ли)/iu.test(prompt) &&
    RESULTS_NOUN.test(prompt)
  ) {
    return true;
  }

  if (
    PUBLIC_SURFACE.test(prompt) &&
    RESULTS_NOUN.test(prompt) &&
    !EXPLAIN_QUERY_MARKERS.test(prompt)
  ) {
    return true;
  }

  if (
    LIST_VERBS.test(prompt) &&
    MY_SCOPE.test(prompt) &&
    /(?:выпущен|выпустил|ազատած|released|թողարկված)/iu.test(prompt)
  ) {
    return true;
  }

  if (
    (/могу\s+ли/i.test(prompt) ||
      /կարող\s+ե[մ]/iu.test(prompt) ||
      /\bcan\s+i\b/i.test(prompt)) &&
    RESULTS_NOUN.test(prompt) &&
    (APP_SURFACE.test(prompt) || PUBLIC_SURFACE.test(prompt))
  ) {
    return true;
  }

  if (
    LIST_VERBS.test(prompt) &&
    RESULTS_NOUN.test(prompt) &&
    /(?:այց|визит|visit|clinic)/iu.test(prompt)
  ) {
    return true;
  }

  return false;
}

export function isExplainResultStatusPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (
    hasResultsThenRebookResultsCue(text) &&
    hasResultsThenRebookFollowUpCue(text)
  ) {
    return false;
  }

  const deferredMatch =
    matchConsumerClinicTestResultsDeferredMultilingualScenario(prompt);
  if (deferredMatch?.expectedAction === 'list_my_test_results') {
    return false;
  }
  if (deferredMatch?.expectedAction === 'explain_result_status') {
    return true;
  }

  if (NON_LAB_RESULT_CONSUMER_TOPIC_BLOCK.test(prompt)) return false;
  if (STAFF_RESULT_NOTIFY_BLOCK.test(prompt)) return false;
  if (EXPLAIN_ABNORMAL_RESULT_FLAG_BLOCK.test(prompt)) return false;
  if (LAB_BOOKING_LIST_BLOCK.test(prompt)) return false;
  if (LAB_BOOKING_COLLECTION_BLOCK.test(prompt)) return false;
  if (LAB_ORDER_BLOCK.test(prompt)) return false;
  if (TRACK_LAB_ORDER_STATUS_BLOCK.test(prompt)) return false;
  if (
    ORDER_MUTATE_CONTEXT.test(prompt) &&
    /(?:թեստ|պատվեր|заказ|անալիզ|լաբորատոր)/iu.test(prompt) &&
    !/արդյունք|результат/iu.test(prompt)
  ) {
    return false;
  }

  if (
    /\bhow\b/i.test(prompt) &&
    (/\b(lab|test)\s+results?\b/i.test(prompt) ||
      /\bmy\s+results\b/i.test(prompt))
  ) {
    return true;
  }

  if (
    /ինչու.*(?:արդյունք|լաբ|CBC|թեստ|անալիզ)/iu.test(prompt) ||
    /почему.*(?:результат|лабораторн|CBC|анализ)/iu.test(prompt)
  ) {
    return true;
  }

  if (
    /ինչպես.*(?:արդյունք|My\s+Results)|как.*(?:результат|Мои\s+результаты|попадают)/iu.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /(?:քանի[՞?]?\s*ժամանակում|сколько\s+ждать).*(?:արդյունք|результат)/iu.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /(?:կհայտնվ|հայտնվ).*(?:արդյունք|результат).*(?:այստեղ|էջ|страниц)/iu.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /(?:ինչ\s+ե|какой\s+статус).*(?:կարգավիճակ|результат|lipid|լաբ)/iu.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    LIST_MY_GUARD.test(prompt) &&
    RESULTS_NOUN.test(prompt) &&
    !EXPLAIN_STATUS_CONTEXT_MULTILINGUAL.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(do\s+i\s+have|are\s+my|are\s+any|show\s+my|list\s+my|check\s+my|open\s+my|see\s+my)\b/i.test(
      prompt,
    ) &&
    /\b(lab|test)\s+results?\b/i.test(prompt) &&
    !/\b(mean|means|status|why|when\s+will|explain|processing|pending|reviewed|released|not\s+showing|don't\s+see|don'?t\s+see)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (!EXPLAIN_STATUS_CONTEXT_MULTILINGUAL.test(prompt)) return false;
  if (RESULTS_NOUN.test(prompt)) return true;
  if (/\b(CBC|lipid(?:\s+panel)?)\b.*\bresults?\b/i.test(prompt)) return true;
  if (/\bmy\s+results\b/i.test(prompt)) return true;
  if (/\bstatus\b.*\b(?:test|lab|panel)?\s*results?\b/i.test(prompt))
    return true;
  if (
    /\bstatus\b.*\bmy\b/i.test(prompt) &&
    /\b(lipid|cbc|panel|app|results?)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    (/\b(released|pending|reviewed|processing)\b|թողարկված|սպասման|выпущен|ожидани|обработ/iu.test(
      prompt,
    ) &&
      RESULTS_NOUN.test(prompt)) ||
    (/\b(released|pending|reviewed)\b/i.test(prompt) &&
      /\b(status|mean|means|explain)\b/i.test(prompt) &&
      /\b(lab|test|results?)\b/i.test(prompt))
  ) {
    return true;
  }
  if (
    /\bwhy\b.*\b(not\s+showing|don'?t\s+(?:i\s+)?see|still\s+waiting|still\s+processing)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /ինչու.*(?:չեմ\s+տեսնում|չի\s+երևում)/iu.test(prompt) ||
    /почему.*(?:не\s+вижу|не\s+показыва)/iu.test(prompt)
  ) {
    return true;
  }
  if (
    /\bwhy\b/i.test(prompt) &&
    /\b(CBC|lipid(?:\s+panel)?)\b/i.test(prompt) &&
    /\b(pending|processing|released|reviewed|waiting|ready|not\s+showing)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (
    /բացատրիր.*սպասման.*(?:լաբ|թեստ)/iu.test(prompt) ||
    /ինչ\s+նշանակ(?:ություն|ում).*սպասման.*(?:լաբ|թեստ)/iu.test(prompt) ||
    /объясни\s+статус\s+ожидания/iu.test(prompt) ||
    /что\s+означает\s+ожидани.*(?:лаб|тест|анализ)/iu.test(prompt)
  ) {
    return true;
  }
  if (/\bwhen\b.*\b(available|ready|released|appear|show)\b/i.test(prompt)) {
    return true;
  }
  if (
    /երբ.*(?:կհայտնվ|պատրաաստ|թողարկ|հայտնվ)/iu.test(prompt) ||
    /когда.*(?:появятся|готов|выпущ)/iu.test(prompt)
  ) {
    return true;
  }
  if (/\bhow\b/i.test(prompt) && /\b(lab|test)\s+results?\b/i.test(prompt)) {
    return true;
  }
  if (/\bhow\b/i.test(prompt) && /\bmy\s+results\b/i.test(prompt)) return true;
  if (/ինչ.*նշանակություն|что\s+означает/iu.test(prompt)) return true;
  return false;
}

function normalizeExtractedTestName(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const name = raw.trim();
  if (RESULT_TEST_NAME_STOP_WORDS.has(name.toLowerCase())) return null;
  return name;
}

export function extractTestNameFromResultsPrompt(
  prompt: string,
): string | null {
  if (!/\bstatus\s+of\s+my\b/i.test(prompt)) {
    const named = prompt.match(
      /\b(?:my|the|any)\s+([A-Za-z][\w-]*(?:\s+[A-Za-z][\w-]*)?)\s+(?:test|lab|panel)\s+results?\b/i,
    );
    const namedResult = normalizeExtractedTestName(named?.[1]);
    if (namedResult) return namedResult;
  }

  const statusOf = prompt.match(
    /\bstatus\s+of\s+my\s+([A-Za-z][\w-]*(?:\s+[A-Za-z][\w-]*)*)/i,
  );
  const statusResult = normalizeExtractedTestName(
    statusOf?.[1]
      ?.replace(/\s+(?:in|on|for)\b.+$/i, '')
      .replace(/\s+results?\s*$/i, '')
      .trim(),
  );
  if (statusResult) return statusResult;

  const cbc = prompt.match(/\b(CBC|lipid(?:\s+panel)?)\b/i);
  if (cbc?.[1]) return cbc[1].trim();

  return null;
}

export function extractResultStatusFromPrompt(
  prompt: string,
): ClinicTestResultStatus | undefined {
  const hyRuStatusQuestion = prompt.match(
    /(?:ինչ\s+նշանակություն\s+ունի\s+|что\s+означает\s+[«"]?)(թողարկված|սպասման|վերանայված|выпущен|ожидани|рассмотрен|проверен)(?:ը|о)?/iu,
  );
  if (hyRuStatusQuestion?.[1]) {
    const word = hyRuStatusQuestion[1].toLowerCase();
    if (/թողարկված|выпущен/.test(word)) return 'Released';
    if (/սպասման|ожидани/.test(word)) return 'Pending';
    if (/վերանայված|рассмотрен/.test(word)) return 'Reviewed';
  }

  const statusQuestion = prompt.match(
    /\bwhat\s+does\s+(released|pending|reviewed|processing|completed|rejected|not\s+received)\s+mean\b/i,
  );
  if (statusQuestion?.[1]) {
    const word = statusQuestion[1].toLowerCase().replace(/\s+/g, '');
    if (word === 'released') return 'Released';
    if (word === 'pending') return 'Pending';
    if (word === 'reviewed') return 'Reviewed';
    if (word === 'processing') return 'WaitingCompletion';
    if (word === 'completed') return 'Completed';
    if (word === 'rejected') return 'Rejected';
    if (word === 'notreceived') return 'NotReceived';
  }

  if (/\breviewed\b|վերանայված|проверен|рассмотрен/iu.test(prompt)) {
    return 'Reviewed';
  }
  if (/\breleased\b|թողարկված|выпущен/iu.test(prompt)) return 'Released';
  if (/\bpending\b|սպասման|ожидани/iu.test(prompt)) return 'Pending';
  if (/\b(processing|waiting\s+completion)\b/i.test(prompt)) {
    return 'WaitingCompletion';
  }
  if (/\b(rejected|cancelled)\b/i.test(prompt)) return 'Rejected';
  if (/\b(not\s+received|awaiting\s+results)\b/i.test(prompt)) {
    return 'NotReceived';
  }
  if (/\bcompleted\b/i.test(prompt)) return 'Completed';
  return undefined;
}

export function parseListMyTestResultsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedListMyTestResultsRequest | null {
  const deferredMatch =
    matchConsumerClinicTestResultsDeferredMultilingualScenario(prompt);
  if (deferredMatch?.expectedAction === 'list_my_test_results') {
    const testName =
      typeof deferredMatch.paramsPartial?.testName === 'string'
        ? deferredMatch.paramsPartial.testName
        : undefined;
    return { testName };
  }

  if (!isListMyTestResultsPrompt(prompt)) return null;
  const testName =
    (typeof params.testName === 'string' && params.testName.trim()
      ? params.testName.trim()
      : undefined) ??
    extractTestNameFromResultsPrompt(prompt) ??
    undefined;
  return { testName };
}

export function parseExplainResultStatusFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainResultStatusRequest | null {
  const deferredMatch =
    matchConsumerClinicTestResultsDeferredMultilingualScenario(prompt);
  if (deferredMatch?.expectedAction === 'explain_result_status') {
    const status =
      typeof deferredMatch.paramsPartial?.status === 'string' &&
      isClinicTestResultStatus(deferredMatch.paramsPartial.status)
        ? deferredMatch.paramsPartial.status
        : undefined;
    const testName =
      typeof deferredMatch.paramsPartial?.testName === 'string'
        ? deferredMatch.paramsPartial.testName
        : undefined;
    return { status, testName };
  }

  const fromCompound = params.resultsThenRebook === true;
  if (!isExplainResultStatusPrompt(prompt) && !fromCompound) return null;

  const statusFromParams =
    typeof params.status === 'string' && isClinicTestResultStatus(params.status)
      ? params.status
      : undefined;
  const status = statusFromParams ?? extractResultStatusFromPrompt(prompt);
  const testName =
    (typeof params.testName === 'string' && params.testName.trim()
      ? params.testName.trim()
      : undefined) ??
    extractTestNameFromResultsPrompt(prompt) ??
    undefined;
  const resultId =
    typeof params.resultId === 'string' && params.resultId.trim()
      ? params.resultId.trim()
      : undefined;

  return { status, testName, resultId };
}

export function rescueConsumerClinicTestResultsIntent(
  prompt: string,
  action: string,
): {
  action: ConsumerClinicTestResultsIntent | 'compound_intent';
  rescueReason: string;
} | null {
  if (
    (CONSUMER_CLINIC_TEST_RESULTS_INTENTS as readonly string[]).includes(
      action,
    ) ||
    action === 'compound_intent'
  ) {
    return null;
  }

  const compound = rescueResultsThenRebookCompoundIntent(prompt, action);
  if (compound) return compound;

  if (parseListMyTestResultsFromPrompt(prompt)) {
    return {
      action: 'list_my_test_results',
      rescueReason: 'list_my_test_results',
    };
  }

  if (parseExplainResultStatusFromPrompt(prompt)) {
    return {
      action: 'explain_result_status',
      rescueReason: 'explain_result_status',
    };
  }

  return null;
}

export { assertClinicPatientChartBusinessType as assertConsumerClinicTestResultsBusinessType };

export function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  return (
    (typeof params.sessionCustomerId === 'string'
      ? params.sessionCustomerId
      : undefined) ??
    (typeof params.customerId === 'string' ? params.customerId : undefined)
  );
}

export function formatReleasedResultsSummary(
  results: ClinicPatientReleasedResultView[],
  testName?: string,
): string {
  const filtered = testName
    ? results.filter((result) =>
        (result.testName ?? '').toLowerCase().includes(testName.toLowerCase()),
      )
    : results;

  if (filtered.length === 0) {
    return testName
      ? `No released ${testName} results are in My Results yet.`
      : 'You have no released lab results in My Results yet.';
  }

  const lines = filtered.slice(0, 8).map((result, index) => {
    const name = result.testName ?? 'Lab result';
    const released = result.releasedAt
      ? result.releasedAt.slice(0, 10)
      : 'date pending';
    const flag = result.measurementFlag ? ` — ${result.measurementFlag}` : '';
    return `${index + 1}. ${name} (Released ${released})${flag}`;
  });
  const suffix =
    filtered.length > 8 ? `\n…and ${filtered.length - 8} more.` : '';
  return `You have ${filtered.length} released result${filtered.length === 1 ? '' : 's'} in My Results:\n${lines.join('\n')}${suffix}`;
}

export function formatPatientResultStatusExplanation(
  status: ClinicTestResultStatus,
  locale: AppLocale = 'en',
): string {
  const label = formatClinicTestResultStatusLabel(status, locale);
  return `${label}: ${PATIENT_RESULT_STATUS_EXPLANATIONS[status]}`;
}

export function formatGeneralResultPipelineExplanation(): string {
  return [
    'Lab results move through collection, lab processing, clinical review, and release.',
    'Only Released results appear in My Results.',
    'If a test is still processing or under review, it will not show there yet.',
  ].join(' ');
}

export function buildConsumerClinicTestResultsFixtureExpectations() {
  return {
    list: LIST_MY_TEST_RESULTS_PROMPTS,
    explain: EXPLAIN_RESULT_STATUS_PROMPTS,
  };
}
