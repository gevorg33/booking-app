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

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function isClinicBookingIntent(action: string): action is ClinicBookingIntent {
  return (CLINIC_BOOKING_INTENTS as readonly string[]).includes(action);
}

export function assertClinicBookingBusinessType(
  businessType: string | undefined | null,
): void {
  if (!isClinicVerticalBusinessType(businessType)) {
    throw new Error('Clinic booking checkout fields are only available for clinic vertical businesses.');
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
    if (!/^(visit|this|on|checkout|booking|form|page|field)$/i.test(candidate)) {
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

export function isExplainClinicBookingPrompt(prompt: string): boolean {
  if (CLINIC_CATALOG_FASTING_EXPLAIN.test(prompt)) return false;
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
    ['symptoms', 'referralNotes', 'preparation', 'preVisitIntake', 'all'].includes(
      params.aspect,
    )
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
