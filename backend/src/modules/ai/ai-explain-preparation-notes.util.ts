import { extractServiceNameFromPrompt } from './ai-payments.util.js';
import { isExplainTourMeetingPointPrompt } from './ai-tour-meeting-point.util.js';
import type { PreparationNotesAspect } from './ai-explain-preparation-notes.fixtures.js';

export const EXPLAIN_PREPARATION_NOTES_INTENTS = [
  'explain_preparation_notes',
] as const;

export type ExplainPreparationNotesIntent =
  (typeof EXPLAIN_PREPARATION_NOTES_INTENTS)[number];

export interface ParsedExplainPreparationNotes {
  aspect: PreparationNotesAspect;
  bookingId?: string;
  serviceName?: string;
}

export const CUSTOMER_PUBLIC_EXPLAIN_PREPARATION_NOTES_CLASSIFIER_RULES = `- explain_preparation_notes: READ — return visit preparation for the visitor's current or most recent booking: clinic fasting flag, preparationNotes, and what to bring/included items. Triggers: "Do I need to fast before my visit?", "What should I bring to my appointment?", "Prep instructions for my appointment". Set aspect to fasting|preparation|what_to_bring|all when clear. Uses session bookingId when present; otherwise next matching upcoming visit for signed-in customers. NOT explain_tour_meeting_point (tour meeting point / arrival time), NOT explain_lab_prep (catalog lab prep before booking), NOT explain_clinic_booking (checkout form fields/symptoms/referral), NOT confirm_my_booking_details (time/provider summary), NOT get_directions_to_salon (salon address navigation), NOT explain_tour_booking (catalog group size/pricing).`;

const READ_CUE = new RegExp(
  String.raw`\b(what|do i|should i|need|bring|prepare|prep|fast|fasting|meeting|meet|arrive|instructions?)\b|ինչ|պետք|բեր|ծոմավոր|հանդիպ|что|нужно|голод|взять|встреч|подготов`,
  'iu',
);

const CATALOG_CHECKOUT_PREP_BLOCK = new RegExp(
  String.raw`\b(?:this\s+blood\s+draw|this\s+lab\s+test|on\s+(?:the\s+)?(?:checkout|booking\s+page|booking\s+form)|before\s+this\s+(?:lab|test|blood\s+draw|draw))\b|checkout|booking\s+page|գրանցման\s+էջ|страниц[аеы]\s+записи`,
  'iu',
);

const VISIT_BOOKING_CONTEXT = new RegExp(
  String.raw`\b(?:my|this|upcoming|current|just|tomorrow|today)\b.*\b(?:appointment|visit|booking|tour|blood\s+draw|lab\s+test|draw)\b|\b(?:appointment|visit|booking|tour)\b.*\b(?:my|this|tomorrow|today)\b|for\s+my\s+(?:visit|appointment|tour|booking)|before\s+my\s+(?:visit|appointment|blood\s+draw|lab\s+test)|to\s+my\s+appointment|my\s+blood\s+draw|my\s+lab\s+test|what\s+do\s+i\s+need\s+to\s+bring(?:\s+(?:to|for)\s+my)?|do\s+i\s+need\s+to\s+fast(?:\s+(?:before|for)\s+my|\?)|where\s+do\s+we\s+meet(?:\s+for\s+my)?|meeting\s+point|prep\s+instructions?\s+for\s+my|իմ\s+այց|мо(?:ем|его|й)\s+(?:визит|тура|приёма)|на\s+при[её]м`,
  'iu',
);

const FASTING_TOPIC = new RegExp(
  String.raw`\b(?:do i need to fast|should i fast|fast(?:ing)?\s+before|fast\s+for)\b|ծոմավոր|голод|натощак`,
  'iu',
);

const PREP_TOPIC = new RegExp(
  String.raw`\b(?:prep(?:aration)?|prepare|preparation\s+notes?|prep\s+instructions?|how\s+should\s+i\s+prepare)\b|նախապատրաստ|պատրաստ|подготов`,
  'iu',
);

const BRING_TOPIC = new RegExp(
  String.raw`\b(?:what\s+should\s+i\s+bring|what\s+do\s+i\s+need\s+to\s+bring|what\s+to\s+bring)\b|ինչ.*բեր|что.*взять`,
  'iu',
);

const MEETING_TOPIC = new RegExp(
  String.raw`\b(?:where\s+do\s+we\s+meet|meeting\s+point|pickup\s+point|where\s+should\s+i\s+arrive)\b|որտեղ.*հանդիպ|где.*встреч|точк.*встреч`,
  'iu',
);

const CLINIC_CHECKOUT_BLOCK = new RegExp(
  String.raw`\b(?:checkout|booking\s+form|booking\s+page|symptoms?\s+field|referral\s+notes?|reason\s+for\s+visit\s+field|pre-visit\s+intake\s+step|this\s+page)\b|checkout|գրանցման\s+էջ|поле\s+симптом|checkout\s+пол`,
  'iu',
);

const CATALOG_LAB_PREP_BLOCK = new RegExp(
  String.raw`\b(?:do i need to fast\s+for\s+(?:blood\s+work|lab\s+work|lab\s+tests?|blood\s+tests?)|should i fast\s+for\s+(?:blood\s+work|lab\s+work|lab\s+tests?|blood\s+tests?)|fast(?:ing)?\s+for\s+(?:blood\s+work|lab\s+work|lab\s+tests?|blood\s+tests?)|(?:does|do)\s+[A-Za-z][\w-]*(?:\s+[A-Za-z][\w-]*){0,3}\s+require\s+fasting|prep(?:aration)?\s+(?:instructions?\s+)?for\s+(?:the\s+)?(?:CBC|lipid|blood\s+work|lab|panel|TSH|metabolic)|(?:which|what)\s+(?:lab\s+tests?|services?|tests?).*(?:fasting|prep|require)|fasting\s+requirements?)\b|ծոմավոր.*(?:արյան|լաբ)|голод.*(?:кров|анализ|лаб)|натощак|CBC.{0,10}(?:ծոմավոր|голод)|(?:ինչ|որ)\s+(?:լաբ|ծառայ).*(?:ծոմավոր|նախապատրաստ)`,
  'iu',
);

const BOOKING_SUMMARY_BLOCK = new RegExp(
  String.raw`\b(?:what\s+time\s+is\s+my\s+appointment|summarize\s+my\s+booking|confirm\s+my\s+booking|who\s+is\s+my\s+appointment)\b|ամփոփ|подтверди\s+детали|когда\s+моя\s+запись`,
  'iu',
);

const CALENDAR_BLOCK = new RegExp(
  String.raw`\b(?:add\s+to\s+(?:my\s+)?calendar|ics|google\s+calendar)\b|օրացույց|календар`,
  'iu',
);

const SALON_DIRECTIONS_BLOCK = new RegExp(
  String.raw`\b(?:directions?\s+to\s+(?:the\s+)?salon|navigate\s+to\s+(?:the\s+)?salon|google\s+maps\s+directions?|where\s+do\s+i\s+park)\b|ուղղություն.*սրահ|как\s+добраться\s+до\s+салон`,
  'iu',
);

export function isExplainPreparationNotesIntent(
  action: string,
): action is ExplainPreparationNotesIntent {
  return (EXPLAIN_PREPARATION_NOTES_INTENTS as readonly string[]).includes(
    action,
  );
}

export function inferPreparationNotesAspect(
  prompt: string,
): PreparationNotesAspect {
  if (/\b(?:how should i prepare|prepare for my visit)\b/i.test(prompt)) {
    return 'all';
  }
  if (/^(?:ինչպես\s+պատրաստ|как\s+подготов)/iu.test(prompt.trim())) {
    return 'all';
  }
  const fasting = FASTING_TOPIC.test(prompt);
  const prep = PREP_TOPIC.test(prompt);
  const bring = BRING_TOPIC.test(prompt);
  const meeting = MEETING_TOPIC.test(prompt);
  const topics = [fasting, prep, bring, meeting].filter(Boolean).length;
  if (topics > 1) return 'all';
  if (fasting) return 'fasting';
  if (bring) return 'what_to_bring';
  if (meeting) return 'meeting_point';
  if (prep) return 'preparation';
  return 'all';
}

export function isExplainPreparationNotesPrompt(prompt: string): boolean {
  if (isExplainTourMeetingPointPrompt(prompt)) return false;
  if (BOOKING_SUMMARY_BLOCK.test(prompt)) return false;
  if (CALENDAR_BLOCK.test(prompt)) return false;
  if (SALON_DIRECTIONS_BLOCK.test(prompt)) return false;
  if (CLINIC_CHECKOUT_BLOCK.test(prompt)) return false;
  if (CATALOG_CHECKOUT_PREP_BLOCK.test(prompt)) return false;
  if (CATALOG_LAB_PREP_BLOCK.test(prompt)) return false;

  const hasTopic =
    FASTING_TOPIC.test(prompt) ||
    PREP_TOPIC.test(prompt) ||
    BRING_TOPIC.test(prompt) ||
    MEETING_TOPIC.test(prompt);

  if (!hasTopic) return false;

  if (
    FASTING_TOPIC.test(prompt) ||
    BRING_TOPIC.test(prompt) ||
    MEETING_TOPIC.test(prompt) ||
    PREP_TOPIC.test(prompt)
  ) {
    return (
      VISIT_BOOKING_CONTEXT.test(prompt) ||
      /\b(?:do i need to fast(?:\s+(?:before|for)\s+my|\?)|what should i bring(?:\s+(?:to|for)\s+my)?|where do we meet(?:\s+for\s+my)?|meeting point|prep instructions?\s+for\s+my)\b/i.test(
        prompt,
      ) ||
      /(?:ծոմավոր|ինչ.*բեր|որտեղ.*հանդիպ|голод|что.*взять|где.*встреч|подготов)/iu.test(
        prompt,
      )
    );
  }

  return READ_CUE.test(prompt) && VISIT_BOOKING_CONTEXT.test(prompt);
}

export function enrichExplainPreparationNotesParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const aspect =
    (params.aspect as PreparationNotesAspect | undefined) ??
    inferPreparationNotesAspect(prompt);
  const serviceName =
    (params.serviceName as string | undefined) ??
    extractServiceNameFromPrompt(prompt) ??
    undefined;
  return {
    ...params,
    aspect,
    ...(serviceName ? { serviceName } : {}),
  };
}

export function parseExplainPreparationNotesFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainPreparationNotes | null {
  if (!isExplainPreparationNotesPrompt(prompt)) return null;

  const aspectFromParams =
    typeof params.aspect === 'string' &&
    [
      'fasting',
      'preparation',
      'what_to_bring',
      'meeting_point',
      'all',
    ].includes(params.aspect)
      ? (params.aspect as PreparationNotesAspect)
      : undefined;

  const bookingId =
    (params.bookingId as string | undefined) ??
    (params.sessionBookingId as string | undefined);

  const serviceName =
    (params.serviceName as string | undefined) ??
    extractServiceNameFromPrompt(prompt) ??
    undefined;

  return {
    aspect: aspectFromParams ?? inferPreparationNotesAspect(prompt),
    ...(bookingId ? { bookingId } : {}),
    ...(serviceName ? { serviceName } : {}),
  };
}

export function rescueExplainPreparationNotesIntent(
  prompt: string,
  action: string,
): { action: ExplainPreparationNotesIntent; rescueReason: string } | null {
  if (isExplainPreparationNotesIntent(action)) return null;
  if (!parseExplainPreparationNotesFromPrompt(prompt)) return null;
  return {
    action: 'explain_preparation_notes',
    rescueReason: 'preparation_notes',
  };
}

export function detectExplainPreparationNotesAction(
  prompt: string,
): ExplainPreparationNotesIntent | null {
  return rescueExplainPreparationNotesIntent(prompt, 'unknown')?.action ?? null;
}
