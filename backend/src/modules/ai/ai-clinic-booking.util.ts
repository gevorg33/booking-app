import {
  extractClinicMetadata,
  isClinicVerticalBusinessType,
} from '../../common/utils/clinic-service.util.js';
import { isExplainDataRightsPrompt } from './ai-data-rights.util.js';
import {
  isExplainResultStatusPrompt,
  isListMyTestResultsPrompt,
} from './ai-consumer-clinic-test-results.util.js';
import {
  isBookLabCollectionPrompt,
  isListMyLabBookingRequestsPrompt,
} from './ai-clinic-lab-booking.util.js';
import { isListMyCollectionQueuePrompt } from './ai-provider-clinic-collection.util.js';
import { EXPLAIN_CLINIC_BOOKING_PROMPTS } from './ai-clinic-booking.fixtures.js';

export const CLINIC_BOOKING_INTENTS = ['explain_clinic_booking'] as const;

export type ClinicBookingIntent = (typeof CLINIC_BOOKING_INTENTS)[number];

export type ClinicBookingAspect =
  | 'symptoms'
  | 'referralNotes'
  | 'preparation'
  | 'preVisitIntake'
  | 'all';

export interface ParsedExplainClinicBooking {
  serviceName?: string;
  serviceId?: string;
  aspect: ClinicBookingAspect;
}

const UNICODE_WORD_SUFFIX = '[\\p{L}\\p{M}\\u055B]*';

const READ_CUE = new RegExp(
  String.raw`\b(what|why|how|where|explain|tell|describe|should|do i|does|are|mean|means|required|optional|need)\b|ինչ|ինչու|ինչպես|բացատր|պետք|համար\s+է|что|почему|как|объясни|нужно|зачем|для\s+чего`,
  'iu',
);

const CHECKOUT_CONTEXT = new RegExp(
  String.raw`\b(checkout|booking\s+page|booking\s+form|when\s+i\s+book|this\s+page|here|consumer\s+app|appointment\s+page)\b|checkout|գրանցման\s+էջ|այս\s+էջ|հավելված|страниц[аеы]\s+записи|при\s+записи|checkout`,
  'iu',
);

const SYMPTOMS_TOPIC = new RegExp(
  String.raw`\b(symptoms?|reason\s+for\s+visit|chief\s+complaint|why\s+(?:i\s+)?(?:am\s+)?(?:booking|visiting))\b|ախտանիշ|այց(?:ելության)?\s+պատճառ|симптом|жалоб|повод\s+визита`,
  'iu',
);

const REFERRAL_TOPIC = new RegExp(
  String.raw`\b(referral\s+notes?|referring\s+doctor|referral\s+from|prior\s+test\s+results?\s+field)\b|ուղղորդ|referral|направлен|направляющ`,
  'iu',
);

const PREPARATION_TOPIC = new RegExp(
  String.raw`\b(fast(?:ing)?|lab\s+prep|preparation|prepare|before\s+(?:the\s+)?(?:lab|test|blood\s+draw|draw)|NPO|prep\s+instructions?)\b|ծոմավոր|նախապատրաստ|голод|подготов|натощак|забор`,
  'iu',
);

const INTAKE_TOPIC = new RegExp(
  String.raw`\b(pre[-\s]?visit\s+intake|intake\s+(?:form|questionnaire|step)|questionnaire\s+before\s+checkout)\b|նախապես\s+այց|questionnaire|анкет|опросник`,
  'iu',
);

const CLINIC_CHECKOUT_OVERVIEW = new RegExp(
  String.raw`\b(clinic\s+checkout\s+fields?|checkout\s+fields?|patient\s+notes?\s+field)\b|(?:կլինիկական\s+checkout|checkout\s+դաշտ)|(?:поля\s+записи|checkout\s+пол)/iu`,
  'iu',
);

const NON_CLINIC_BOOKING_BLOCK = new RegExp(
  String.raw`\b(tour|trek|excursion|pax|group\s+size|per[-\s]?person|gift\s+card|promo\s+code|stripe|tax\b|vat|package\s+checkout)\b|էքսկուրս|тур|налог|пакет`,
  'iu',
);

const STAFF_CLINIC_ADMIN_BLOCK = new RegExp(
  String.raw`\b(configure|apply\s+playbook|explain_clinic_services|catalog|dashboard|our\s+clinic\s+services|department\s+count)\b|կարգավոր|настро`,
  'iu',
);

const CLINIC_CATALOG_FASTING_EXPLAIN = new RegExp(
  String.raw`\b(?:which|what)\s+(?:lab\s+tests?|services?).*(?:fasting|prep|require)\b|\bfasting\s+requirements?\b|(?:[Кк]акие|[Кк]акой)\s+(?:лабораторн[\p{L}\p{M}]*\s+)?(?:тест[\p{L}\p{M}]*|услуг[\p{L}\p{M}]*).*?(?:голод|натощак|пост)|(?:ինչ|որ)\s+(?:լաբ|ծառայ).*(?:ծոմավոր|նախապատրաստ)`,
  'iu',
);

const CONSUMER_LAB_PREP_EXPLAIN = new RegExp(
  String.raw`\b(?:do i need to fast\s+for\s+(?:blood\s+work|lab\s+work|lab\s+tests?|blood\s+tests?)|should i fast\s+for\s+(?:blood\s+work|lab\s+work|lab\s+tests?|blood\s+tests?)|fast(?:ing)?\s+for\s+(?:blood\s+work|lab\s+work|lab\s+tests?|blood\s+tests?)|(?:does|do)\s+[A-Za-z][\w-]*(?:\s+[A-Za-z][\w-]*){0,3}\s+require\s+fasting|prep(?:aration)?\s+(?:instructions?\s+)?for\s+(?:the\s+)?(?:CBC|lipid|blood\s+work|lab|panel|TSH|metabolic))\b|ծոմավոր.*(?:արյան|լաբ)|голод.*(?:кров|анализ|лаб)|натощак`,
  'iu',
);

const THIS_TEST_BOOKING_REFERENCE = new RegExp(
  String.raw`\bthis\s+(?:test|lab|blood\s+draw|panel)\b|այս\s+(?:թեստ${UNICODE_WORD_SUFFIX}|լաբ${UNICODE_WORD_SUFFIX})|этим?\s+(?:анализ${UNICODE_WORD_SUFFIX}|тест${UNICODE_WORD_SUFFIX})`,
  'iu',
);

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function isClinicBookingIntent(
  action: string,
): action is ClinicBookingIntent {
  return (CLINIC_BOOKING_INTENTS as readonly string[]).includes(action);
}

export function assertClinicBookingBusinessType(
  businessType: string | undefined | null,
): void {
  if (!isClinicVerticalBusinessType(businessType)) {
    throw new Error(
      'Clinic booking checkout fields are only available for clinic vertical businesses.',
    );
  }
}

function hasClinicCheckoutTopic(prompt: string): boolean {
  return (
    SYMPTOMS_TOPIC.test(prompt) ||
    REFERRAL_TOPIC.test(prompt) ||
    PREPARATION_TOPIC.test(prompt) ||
    INTAKE_TOPIC.test(prompt) ||
    CLINIC_CHECKOUT_OVERVIEW.test(prompt)
  );
}

export function extractClinicBookingAspectFromPrompt(
  prompt: string,
): ClinicBookingAspect {
  if (SYMPTOMS_TOPIC.test(prompt)) return 'symptoms';
  if (REFERRAL_TOPIC.test(prompt)) return 'referralNotes';
  if (PREPARATION_TOPIC.test(prompt)) return 'preparation';
  if (INTAKE_TOPIC.test(prompt)) return 'preVisitIntake';
  return 'all';
}

export function extractServiceNameFromClinicBookingPrompt(
  prompt: string,
): string | null {
  const quoted = prompt.match(/["'«]([^"'»]+)["'»]/);
  if (quoted?.[1]?.trim()) return quoted[1].trim();

  const named = prompt.match(
    /\b(CBC|lipid(?:\s+panel)?|TSH|metabolic\s+panel)\b/i,
  );
  if (named?.[1]) return named[1].trim();

  const prepFor = prompt.match(
    /\b(?:prep(?:aration)?\s+for|lab\s+prep\s+for)\s+(?:the\s+)?([A-Za-z][\w-]*(?:\s+[A-Za-z][\w-]*){0,3})/i,
  );
  if (prepFor?.[1]?.trim()) {
    const candidate = prepFor[1].trim();
    if (
      !/^(visit|this|on|checkout|booking|form|page|field)$/i.test(candidate)
    ) {
      return candidate;
    }
  }

  if (containsArmenianScript(prompt)) {
    const hy = prompt.match(/(?:Lipid\s+panel|CBC|TSH)/i);
    if (hy?.[0]) return hy[0].trim();
  }

  if (containsCyrillicScript(prompt)) {
    const ru = prompt.match(/(?:Lipid\s+panel|CBC|TSH|липид)/i);
    if (ru?.[0]) return ru[0].trim();
  }

  return null;
}

const VISIT_PREP_AFTER_BOOKING = new RegExp(
  String.raw`\b(?:do i need to fast(?:\s+(?:before|for)\s+my|\?)|should i fast(?:\s+(?:before|for)\s+my|\?)|what should i bring(?:\s+(?:to|for)\s+my)?|what do i need to bring(?:\s+(?:to|for)\s+my)?|meeting point|where do we meet(?:\s+for\s+my)?|prep instructions? for my|prepare for my visit|before my appointment|for my tour)\b|ինչ.*բեր.*իմ|ծոմավոր.*իմ\s+այց|որտեղ.*հանդիպ.*իմ|что.*взять.*мо|голод.*(?:мо(?:ем|его|й)\s+)?визит|где.*встреч.*мо`,
  'iu',
);

const CLINIC_BOOKING_FIELDS_BLOCK = new RegExp(
  String.raw`\b(?:why\s+(?:do\s+you\s+)?(?:ask|need)\s+(?:for\s+)?(?:my\s+)?(?:id|passport|government\s+id|national\s+id)|passport\s+number|date\s+of\s+birth|insurance\s+(?:provider|policy|number|field)|emergency\s+contact|home\s+address|identity\s+fields?)\b|ինչու.*(?:id|անձնագիր)|зачем.*(?:id|паспорт|дата\s+рождения|страхов)`,
  'iu',
);

const PUBLIC_INTAKE_FORM_BLOCK = new RegExp(
  String.raw`\b(?:why\s+these\s+health\s+questions|can\s+i\s+skip\s+the\s+form|optional\s+pre-visit|skip\s+for\s+now|health\s+questions|book\s+without\s+filling\s+the\s+questionnaire|questionnaire\s+before\s+checkout)\b|ինչու.*առողջության|բաց\s+թողնել.*ձև|почему.*здоров|пропуст.*анкет`,
  'iu',
);

export function isExplainClinicBookingPrompt(prompt: string): boolean {
  if (PUBLIC_INTAKE_FORM_BLOCK.test(prompt)) return false;
  if (CLINIC_BOOKING_FIELDS_BLOCK.test(prompt)) return false;
  if (VISIT_PREP_AFTER_BOOKING.test(prompt) && !CHECKOUT_CONTEXT.test(prompt)) {
    return false;
  }
  if (CLINIC_CATALOG_FASTING_EXPLAIN.test(prompt)) return false;
  if (
    CONSUMER_LAB_PREP_EXPLAIN.test(prompt) &&
    !CHECKOUT_CONTEXT.test(prompt) &&
    !THIS_TEST_BOOKING_REFERENCE.test(prompt)
  ) {
    return false;
  }
  if (NON_CLINIC_BOOKING_BLOCK.test(prompt)) return false;
  if (STAFF_CLINIC_ADMIN_BLOCK.test(prompt)) return false;
  if (isExplainDataRightsPrompt(prompt)) return false;
  if (isListMyTestResultsPrompt(prompt)) return false;
  if (isExplainResultStatusPrompt(prompt)) return false;
  if (isListMyLabBookingRequestsPrompt(prompt)) return false;
  if (isBookLabCollectionPrompt(prompt)) return false;
  if (isListMyCollectionQueuePrompt(prompt)) return false;
  if (
    /\b(phi|hipaa|encryption|minimum\s+necessary|access\s+audit|encrypted\s+at\s+rest)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (!READ_CUE.test(prompt) && !/\?\s*$/.test(prompt.trim())) return false;
  if (!hasClinicCheckoutTopic(prompt)) return false;

  const hasCheckoutSurface =
    CHECKOUT_CONTEXT.test(prompt) || CLINIC_CHECKOUT_OVERVIEW.test(prompt);

  if (PREPARATION_TOPIC.test(prompt) || INTAKE_TOPIC.test(prompt)) {
    if (hasCheckoutSurface) return true;
    return (
      READ_CUE.test(prompt) &&
      /(?:lab|test|blood|analy|draw|լաբ|թեստ|արյան|анализ|забор|кров)/iu.test(
        prompt,
      )
    );
  }

  if (SYMPTOMS_TOPIC.test(prompt) || REFERRAL_TOPIC.test(prompt)) {
    return hasCheckoutSurface;
  }

  if (CLINIC_CHECKOUT_OVERVIEW.test(prompt)) return hasCheckoutSurface;

  return (
    hasCheckoutSurface &&
    /clinic|lab|visit|կլինիկ|лаб|визит|checkout/iu.test(prompt)
  );
}

export function parseExplainClinicBookingFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainClinicBooking | null {
  if (!isExplainClinicBookingPrompt(prompt)) return null;

  const aspectFromParams =
    typeof params.aspect === 'string' &&
    [
      'symptoms',
      'referralNotes',
      'preparation',
      'preVisitIntake',
      'all',
    ].includes(params.aspect)
      ? (params.aspect as ClinicBookingAspect)
      : undefined;

  const serviceName =
    (typeof params.serviceName === 'string' && params.serviceName.trim()
      ? params.serviceName.trim()
      : undefined) ??
    extractServiceNameFromClinicBookingPrompt(prompt) ??
    undefined;

  const serviceId =
    typeof params.serviceId === 'string' && params.serviceId.trim()
      ? params.serviceId.trim()
      : undefined;

  return {
    aspect: aspectFromParams ?? extractClinicBookingAspectFromPrompt(prompt),
    serviceName,
    serviceId,
  };
}

export function rescueExplainClinicBookingIntent(
  prompt: string,
  action: string,
): { action: ClinicBookingIntent; rescueReason: string } | null {
  if (isClinicBookingIntent(action)) return null;
  if (!parseExplainClinicBookingFromPrompt(prompt)) return null;
  return {
    action: 'explain_clinic_booking',
    rescueReason: 'explain_clinic_booking',
  };
}

export function buildClinicBookingFixtureExpectations() {
  return EXPLAIN_CLINIC_BOOKING_PROMPTS;
}
