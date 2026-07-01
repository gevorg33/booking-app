import { isBookLabCollectionPrompt } from './ai-clinic-lab-booking.util.js';
import { isExplainClinicBookingPrompt } from './ai-clinic-booking.util.js';
import { isExplainClinicServicesPrompt } from './ai-clinic-service.util.js';
import { isConfigureClinicServicePrompt } from './ai-clinic-service.util.js';
import {
  isExplainResultStatusPrompt,
  isListMyTestResultsPrompt,
} from './ai-consumer-clinic-test-results.util.js';
import { isExplainPreparationNotesPrompt } from './ai-explain-preparation-notes.util.js';
import { EXPLAIN_LAB_PREP_MULTILINGUAL_SCENARIOS } from './ai-explain-lab-prep-multilingual.fixtures.js';
import {
  EXPLAIN_LAB_PREP_PROMPTS,
  type ExplainLabPrepPromptFixture,
} from './ai-explain-lab-prep.fixtures.js';
import { extractServiceNameFromClinicBookingPrompt } from './ai-clinic-booking.util.js';
import { isExplainServiceOnlinePaymentSetupPrompt } from './ai-service-online-payment-setup.util.js';

export {
  CUSTOMER_PUBLIC_EXPLAIN_LAB_PREP_CLASSIFIER_RULES,
  EXPLAIN_LAB_PREP_PROMPTS,
  EXPLAIN_LAB_PREP_RESCUE_SCENARIOS,
} from './ai-explain-lab-prep.fixtures.js';

export const EXPLAIN_LAB_PREP_INTENTS = ['explain_lab_prep'] as const;

export type ExplainLabPrepIntent = (typeof EXPLAIN_LAB_PREP_INTENTS)[number];

export interface ParsedExplainLabPrep {
  serviceName?: string;
  serviceId?: string;
}

const READ_CUE = new RegExp(
  String.raw`\b(what|why|how|do i|does|should|need|require|explain|tell|which|is|are)\b|ինչ|պետք|ծոմավոր|как|нужно|голод|какие|требует`,
  'iu',
);

const CHECKOUT_CONTEXT = new RegExp(
  String.raw`\b(checkout|booking\s+page|booking\s+form|this\s+page|on\s+checkout|symptoms?\s+field|referral\s+notes?|reason\s+for\s+visit\s+field|pre-visit\s+intake)\b|checkout|գրանցման\s+էջ|поле\s+симптом|checkout\s+пол`,
  'iu',
);

const BOOKING_DRAW_CONTEXT = new RegExp(
  String.raw`\b(?:this\s+blood\s+draw|this\s+lab\s+test|before\s+this\s+(?:lab|test|blood\s+draw|draw))\b`,
  'iu',
);

const VISIT_PREP_CONTEXT = new RegExp(
  String.raw`\b(?:for\s+my\s+(?:visit|appointment|booking|blood\s+draw|lab\s+test)|before\s+my\s+(?:visit|appointment|blood\s+draw|lab\s+test)|my\s+blood\s+draw|my\s+lab\s+test|prep\s+instructions?\s+for\s+my)\b|իմ\s+այց|мо(?:ем|его|й)\s+(?:визит|анализ|приёма)`,
  'iu',
);

const LAB_PREP_TOPIC = new RegExp(
  String.raw`\b(fast(?:ing)?|lab\s+prep|preparation|prepare|prep\s+instructions?|blood\s+work|lab\s+work|blood\s+tests?|NPO)\b|ծոմավոր|նախապատրաստ|голод|натощак|подготов|анализ|забор|кров`,
  'iu',
);

const LAB_TARGET = new RegExp(
  String.raw`\b(lab|test|blood|draw|panel|CBC|lipid|TSH|metabolic|analy|լաբ|թեստ|արյան|анализ|кров|лаборатор)/iu`,
);

const CATALOG_FASTING_EXPLAIN = new RegExp(
  String.raw`\b(?:which|what)\s+(?:lab\s+tests?|services?|tests?).*(?:fasting|prep(?:aration)?)\b|\bfasting\s+requirements?\b|(?:[Кк]акие|[Кк]акой)\s+(?:лабораторн[\p{L}\p{M}]*\s+)?(?:тест[\p{L}\p{M}]*|услуг[\p{L}\p{M}]*|анализ[\p{L}\p{M}]*).*?(?:голод|натощак|пост)|(?:ինչ|որ)\s+(?:լաբ|ծառայ).*(?:ծոմավոր|նախապատրաստ)`,
  'iu',
);

const CONSUMER_LAB_PREP = new RegExp(
  String.raw`\b(?:do i need to fast\s+for\s+(?:blood\s+work|lab\s+work|lab\s+tests?|blood\s+tests?)|should i fast\s+for\s+(?:blood\s+work|lab\s+work|lab\s+tests?|blood\s+tests?)|fast(?:ing)?\s+for\s+(?:blood\s+work|lab\s+work|lab\s+tests?|blood\s+tests?)|(?:does|do)\s+[A-Za-z][\w-]*(?:\s+[A-Za-z][\w-]*){0,3}\s+require\s+fasting|prep(?:aration)?\s+(?:instructions?\s+)?for\s+(?:the\s+)?(?:CBC|lipid|blood\s+work|lab|panel|TSH|metabolic))\b|ծոմավոր.*(?:արյան|լաբ)|голод.*(?:кров|анализ|лаб)|натощак|CBC.{0,10}(?:ծոմավոր|голод)`,
  'iu',
);

const HY_RU_LAB_PREP_CUE =
  /ծոմավոր.{0,25}(արյան|լաբ)|CBC.{0,10}ծոմավոր|голод.{0,20}(кров|анализ|лаб)|натощак|CBC.{0,10}голод/iu;

function matchExplainLabPrepScenario(
  prompt: string,
): ExplainLabPrepPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_LAB_PREP_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_LAB_PREP_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function isExplainLabPrepIntent(
  action: string,
): action is ExplainLabPrepIntent {
  return (EXPLAIN_LAB_PREP_INTENTS as readonly string[]).includes(action);
}

export function isExplainLabPrepPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (isExplainServiceOnlinePaymentSetupPrompt(text)) return false;
  if (isConfigureClinicServicePrompt(text)) return false;
  if (
    /\b(?:prepayment|online\s+payment|stripe|deposit|public\s+booking)\b/i.test(
      text,
    )
  ) {
    return false;
  }
  if (matchExplainLabPrepScenario(text)) return true;
  if (isExplainPreparationNotesPrompt(text)) return false;
  if (isExplainClinicBookingPrompt(text)) return false;
  if (isExplainClinicServicesPrompt(text)) return false;
  if (isListMyTestResultsPrompt(text)) return false;
  if (isExplainResultStatusPrompt(text)) return false;
  if (isBookLabCollectionPrompt(text)) return false;
  if (CHECKOUT_CONTEXT.test(text)) return false;
  if (BOOKING_DRAW_CONTEXT.test(text)) return false;
  if (VISIT_PREP_CONTEXT.test(text)) return false;

  if (CATALOG_FASTING_EXPLAIN.test(text)) return true;
  if (CONSUMER_LAB_PREP.test(text)) return true;
  if (HY_RU_LAB_PREP_CUE.test(text)) return true;

  return (
    (READ_CUE.test(text) || /\?\s*$/.test(text)) &&
    LAB_PREP_TOPIC.test(text) &&
    LAB_TARGET.test(text)
  );
}

export function enrichExplainLabPrepParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const next = { ...params };
  const scenario = matchExplainLabPrepScenario(prompt);
  const serviceName =
    (typeof params.serviceName === 'string' && params.serviceName.trim()) ||
    scenario?.serviceName ||
    extractServiceNameFromClinicBookingPrompt(prompt);
  if (serviceName) next.serviceName = serviceName;
  return next;
}

export function parseExplainLabPrepFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainLabPrep | null {
  if (!isExplainLabPrepPrompt(prompt)) return null;

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
    ...(serviceName ? { serviceName } : {}),
    ...(serviceId ? { serviceId } : {}),
  };
}

export function rescueExplainLabPrepIntent(
  prompt: string,
  action: string,
): { action: ExplainLabPrepIntent; rescueReason: string } | null {
  if (isExplainLabPrepIntent(action)) return null;
  if (!parseExplainLabPrepFromPrompt(prompt)) return null;
  return {
    action: 'explain_lab_prep',
    rescueReason: 'lab_prep',
  };
}

export function detectExplainLabPrepAction(
  prompt: string,
): ExplainLabPrepIntent | null {
  return rescueExplainLabPrepIntent(prompt, 'unknown')?.action ?? null;
}
