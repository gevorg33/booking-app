import { isExplainDataRightsPrompt } from './ai-data-rights.util.js';
import { isExplainClinicBookingPrompt } from './ai-clinic-booking.util.js';
import { isExplainPublicIntakeFormPrompt } from './ai-explain-public-intake-form.util.js';
import { isExplainGuestCheckoutFieldsPrompt } from './ai-explain-guest-checkout-fields.util.js';
import { isExplainLabPrepPrompt } from './ai-explain-lab-prep.util.js';
import { EXPLAIN_CLINIC_BOOKING_FIELDS_MULTILINGUAL_SCENARIOS } from './ai-explain-clinic-booking-fields-multilingual.fixtures.js';
import {
  EXPLAIN_CLINIC_BOOKING_FIELDS_PROMPTS,
  type ExplainClinicBookingFieldsPromptFixture,
} from './ai-explain-clinic-booking-fields.fixtures.js';

export const EXPLAIN_CLINIC_BOOKING_FIELDS_INTENTS = [
  'explain_clinic_booking_fields',
] as const;

export type ExplainClinicBookingFieldsIntent =
  (typeof EXPLAIN_CLINIC_BOOKING_FIELDS_INTENTS)[number];

export type ClinicBookingFieldsAspect =
  | 'governmentId'
  | 'dateOfBirth'
  | 'insurance'
  | 'emergencyContact'
  | 'address'
  | 'intakeQuestion'
  | 'all';

export interface ParsedExplainClinicBookingFields {
  aspect: ClinicBookingFieldsAspect;
}

const READ_CUE = new RegExp(
  String.raw`\b(what|why|how|where|explain|tell|describe|should|do i|does|can i|need|required|optional|mean|means|for)\b|ինչ|ինչու|ինչպես|բացատր|պետք|համար\s+է|что|почему|как|объясни|нужно|зачем|для\s+чего`,
  'iu',
);

const CLINIC_BOOKING_CONTEXT = new RegExp(
  String.raw`\b(clinic|booking\s+page|booking\s+form|checkout|registration|intake|pre[-\s]?visit|questionnaire|when\s+i\s+book|this\s+page)\b|checkout|գրանցման|կլինիկ|анкет|клиник|записи|checkout`,
  'iu',
);

const GOVERNMENT_ID_TOPIC = new RegExp(
  String.raw`\b(?:government\s+id|national\s+id|identity\s+(?:card|document|verification)|passport(?:\s+number)?|(?:my|for)\s+id\b|id\s+(?:number|field|on\s+the)|document\s+number|ssn|social\s+security)\b|անձնագիր|նույնական|паспорт|удостовер|личност|идентиф`,
  'iu',
);

const DOB_TOPIC = new RegExp(
  String.raw`\b(?:date\s+of\s+birth|birth\s?date|dob|birthday)\b|ծննդյան\s+ամսաթիվ|дата\s+рождения|день\s+рождения`,
  'iu',
);

const INSURANCE_TOPIC = new RegExp(
  String.raw`\b(?:insurance|health\s+plan|policy\s+number|member\s+id|coverage\s+provider)\b|ապահովագր|страхов|полис|member\s+id`,
  'iu',
);

const EMERGENCY_CONTACT_TOPIC = new RegExp(
  String.raw`\b(?:emergency\s+contact|next\s+of\s+kin|ice\s+contact)\b|արտակարգ\s+կոնտակտ|экстренн\s+контакт`,
  'iu',
);

const ADDRESS_TOPIC = new RegExp(
  String.raw`\b(?:home\s+address|mailing\s+address|street\s+address|postal\s+address|zip\s+code|postcode)\b|հասց|адрес|почтов`,
  'iu',
);

const INTAKE_TOPIC = new RegExp(
  String.raw`\b(?:pre[-\s]?visit\s+(?:intake|questionnaire)|intake\s+(?:form|questionnaire)|registration\s+form|personal\s+details)\b|նախապես\s+այց|анкет|опросник|регистрац`,
  'iu',
);

const IDENTITY_OVERVIEW = new RegExp(
  String.raw`\b(?:identity\s+fields?|registration\s+fields?|clinic\s+booking\s+fields?|personal\s+information\s+fields?)\b|identity\s+fields|регистрационн`,
  'iu',
);

const GUEST_CONTACT_BLOCK = new RegExp(
  String.raw`\b(?:e-?mail|email\s+address|phone|mobile|guest\s+checkout|without\s+an?\s+account|sign[\s-]?in|reminder\s+toggle|marketing\s+opt)\b|էլ\.?\s*փոստ|հեռախոս|без\s+аккаунта|email\s+или\s+телефон`,
  'iu',
);

const HY_RU_ID_CUE =
  /(?:ինչու|зачем|почему).{0,30}(?:id|անձնագիր|паспорт|удостовер)/iu;

function matchExplainClinicBookingFieldsScenario(
  prompt: string,
): ExplainClinicBookingFieldsPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_CLINIC_BOOKING_FIELDS_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_CLINIC_BOOKING_FIELDS_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

function hasClinicBookingFieldsTopic(prompt: string): boolean {
  return (
    GOVERNMENT_ID_TOPIC.test(prompt) ||
    DOB_TOPIC.test(prompt) ||
    INSURANCE_TOPIC.test(prompt) ||
    EMERGENCY_CONTACT_TOPIC.test(prompt) ||
    ADDRESS_TOPIC.test(prompt) ||
    INTAKE_TOPIC.test(prompt) ||
    IDENTITY_OVERVIEW.test(prompt) ||
    HY_RU_ID_CUE.test(prompt)
  );
}

export function isExplainClinicBookingFieldsIntent(
  action: string,
): action is ExplainClinicBookingFieldsIntent {
  return (EXPLAIN_CLINIC_BOOKING_FIELDS_INTENTS as readonly string[]).includes(
    action,
  );
}

export function extractClinicBookingFieldsAspectFromPrompt(
  prompt: string,
): ClinicBookingFieldsAspect {
  if (IDENTITY_OVERVIEW.test(prompt)) return 'all';
  if (
    INTAKE_TOPIC.test(prompt) &&
    /(?:questionnaire|intake|personal\s+details|анкет|опросник)/iu.test(prompt)
  ) {
    return 'intakeQuestion';
  }
  if (GOVERNMENT_ID_TOPIC.test(prompt) || HY_RU_ID_CUE.test(prompt)) {
    return 'governmentId';
  }
  if (DOB_TOPIC.test(prompt)) return 'dateOfBirth';
  if (INSURANCE_TOPIC.test(prompt)) return 'insurance';
  if (EMERGENCY_CONTACT_TOPIC.test(prompt)) return 'emergencyContact';
  if (ADDRESS_TOPIC.test(prompt)) return 'address';
  if (INTAKE_TOPIC.test(prompt)) return 'intakeQuestion';
  return 'all';
}

export function isExplainClinicBookingFieldsPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchExplainClinicBookingFieldsScenario(text)) return true;
  if (isExplainPublicIntakeFormPrompt(text)) return false;
  if (isExplainGuestCheckoutFieldsPrompt(text)) return false;
  if (isExplainClinicBookingPrompt(text)) return false;
  if (isExplainLabPrepPrompt(text)) return false;
  if (isExplainDataRightsPrompt(text)) return false;
  if (GUEST_CONTACT_BLOCK.test(text) && !GOVERNMENT_ID_TOPIC.test(text)) {
    return false;
  }
  if (!READ_CUE.test(text) && !/\?\s*$/.test(text)) return false;
  if (!hasClinicBookingFieldsTopic(text)) return false;

  if (
    GOVERNMENT_ID_TOPIC.test(text) ||
    DOB_TOPIC.test(text) ||
    INSURANCE_TOPIC.test(text) ||
    EMERGENCY_CONTACT_TOPIC.test(text) ||
    ADDRESS_TOPIC.test(text)
  ) {
    if (CLINIC_BOOKING_CONTEXT.test(text) || INTAKE_TOPIC.test(text)) {
      return true;
    }
    return (
      READ_CUE.test(text) &&
      (GOVERNMENT_ID_TOPIC.test(text) ||
        DOB_TOPIC.test(text) ||
        HY_RU_ID_CUE.test(text))
    );
  }

  return CLINIC_BOOKING_CONTEXT.test(text) || INTAKE_TOPIC.test(text);
}

export function enrichExplainClinicBookingFieldsParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  const scenario = matchExplainClinicBookingFieldsScenario(prompt);
  const aspect =
    (typeof params.aspect === 'string' ? params.aspect : undefined) ??
    scenario?.aspect ??
    extractClinicBookingFieldsAspectFromPrompt(prompt);
  if (aspect) next.aspect = aspect;
  return next;
}

export function parseExplainClinicBookingFieldsFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainClinicBookingFields | null {
  if (!isExplainClinicBookingFieldsPrompt(prompt)) return null;

  const aspectFromParams =
    typeof params.aspect === 'string' &&
    [
      'governmentId',
      'dateOfBirth',
      'insurance',
      'emergencyContact',
      'address',
      'intakeQuestion',
      'all',
    ].includes(params.aspect)
      ? (params.aspect as ClinicBookingFieldsAspect)
      : undefined;

  const scenario = matchExplainClinicBookingFieldsScenario(prompt);

  return {
    aspect:
      aspectFromParams ??
      scenario?.aspect ??
      extractClinicBookingFieldsAspectFromPrompt(prompt),
  };
}

export function rescueExplainClinicBookingFieldsIntent(
  prompt: string,
  action: string,
): { action: ExplainClinicBookingFieldsIntent; rescueReason: string } | null {
  if (isExplainClinicBookingFieldsIntent(action)) return null;
  if (!parseExplainClinicBookingFieldsFromPrompt(prompt)) return null;
  return {
    action: 'explain_clinic_booking_fields',
    rescueReason: 'clinic_booking_fields',
  };
}

export function detectExplainClinicBookingFieldsAction(
  prompt: string,
): ExplainClinicBookingFieldsIntent | null {
  return (
    rescueExplainClinicBookingFieldsIntent(prompt, 'unknown')?.action ?? null
  );
}
