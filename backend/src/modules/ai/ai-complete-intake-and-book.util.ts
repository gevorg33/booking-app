import {
  isClinicLabTestService,
  clinicLabTestOffersPreVisitIntake,
} from '../../common/utils/clinic-public-pre-visit-intake.util.js';
import { isClinicVerticalBusinessType } from '../../common/utils/clinic-service.util.js';
import {
  propagateSharedBookingContextAcrossSteps,
  buildSharedBookingContextFromPrompt,
} from './ai-compound-booking-context.util.js';
import { enrichBookingTimeHintsFromPrompt } from './ai-intent-heuristics.js';
import { isBookLabCollectionNearestCompoundPrompt } from './ai-book-lab-collection-nearest.util.js';
import { hasIntakeLabBookPayPaymentCue } from './ai-intake-lab-book-pay-payment-cue.util.js';
import { isBookLabCollectionPrompt } from './ai-clinic-lab-booking.util.js';
import { isExplainPublicIntakeFormPrompt } from './ai-explain-public-intake-form.util.js';
import { isFirstAvailableBookingPrompt } from './booking-first-available.semantic.util.js';
import { COMPLETE_INTAKE_AND_BOOK_MULTILINGUAL_SCENARIOS } from './ai-complete-intake-and-book-multilingual.fixtures.js';
import {
  COMPLETE_INTAKE_AND_BOOK_PROMPTS,
  type CompleteIntakeAndBookPromptFixture,
} from './ai-complete-intake-and-book.fixtures.js';
import type { CommandSurface } from './ai-command-registry.types.js';

export const COMPLETE_INTAKE_AND_BOOK_RECIPE_ID = 'complete_intake_and_book';
export const PUBLIC_COMPLETE_INTAKE_AND_BOOK_RECIPE_ID =
  'public_complete_intake_and_book';

export const COMPLETE_INTAKE_AND_BOOK_INTENTS = [
  'complete_intake_and_book',
] as const;

export type CompleteIntakeAndBookIntent =
  (typeof COMPLETE_INTAKE_AND_BOOK_INTENTS)[number];

export {
  COMPLETE_INTAKE_AND_BOOK_CLASSIFIER_RULES,
  COMPLETE_INTAKE_AND_BOOK_PROMPTS,
  COMPLETE_INTAKE_AND_BOOK_RESCUE_SCENARIOS,
  CUSTOMER_COMPLETE_INTAKE_AND_BOOK_CLASSIFIER_RULES,
  PUBLIC_COMPLETE_INTAKE_AND_BOOK_CLASSIFIER_RULES,
} from './ai-complete-intake-and-book.fixtures.js';

const INTAKE_MUTATE_CUE = new RegExp(
  String.raw`\b(?:fill|complete|finish|answer|submit)\b.{0,30}\b(?:intake|questionnaire|health\s+(?:form|questions)|pre-visit)\b|\b(?:intake|questionnaire|health\s+form).{0,20}\b(?:fill|complete|finish|answer)\b|լրացն|լրացր|անկետ|հարցաթերթիկ|заполн|анкет`,
  'iu',
);

const LAB_BOOK_CUE = new RegExp(
  String.raw`\b(?:book|schedule|reserve)\b.{0,40}\b(?:blood\s+draw|blood\s+work|lab\s+test|lab\s+appointment|blood\s+collection|CBC|lipid(?:\s+panel)?|metabolic\s+panel|TSH)\b|\b(?:blood\s+draw|blood\s+work|lab\s+test|CBC|lipid(?:\s+panel)?).{0,30}\b(?:book|schedule|reserve)\b|արյան\s+վերց|լաբ\s+թեստ|забор\s+крови|анализ`,
  'iu',
);

const COMPOUND_LINK_CUE = /\b(?:and|then|after|;&|;)\b|և|ու|и\s+затем|потом/i;

const LAB_SERVICE_NAME_CUE =
  /\b(CBC|lipid(?:\s+panel)?|TSH|metabolic\s+panel|blood\s+draw|blood\s+work|blood\s+collection|lab\s+test|lab\s+appointment)\b/i;

function matchCompleteIntakeAndBookScenario(
  prompt: string,
): CompleteIntakeAndBookPromptFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of COMPLETE_INTAKE_AND_BOOK_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of COMPLETE_INTAKE_AND_BOOK_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function extractLabServiceNameFromIntakeBookPrompt(
  prompt: string,
): string | undefined {
  const scenario = matchCompleteIntakeAndBookScenario(prompt);
  if (scenario?.serviceName) return scenario.serviceName;

  const quoted = prompt.match(/["'«]([^"'»]+)["'»]/);
  if (quoted?.[1]?.trim()) return quoted[1].trim();

  const named = prompt.match(LAB_SERVICE_NAME_CUE);
  if (named?.[1]) return named[1].trim();

  if (/\bblood\b/i.test(prompt)) return 'blood draw';
  if (/\blab\b/i.test(prompt)) return 'lab test';

  return undefined;
}

export function isCompleteIntakeAndBookCorePrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchCompleteIntakeAndBookScenario(text)) return true;
  if (isExplainPublicIntakeFormPrompt(text)) return false;
  if (isBookLabCollectionNearestCompoundPrompt(text)) return false;
  if (isBookLabCollectionPrompt(text) && !INTAKE_MUTATE_CUE.test(text)) {
    return false;
  }

  const hasIntakeMutate = INTAKE_MUTATE_CUE.test(text);
  const hasLabBook = LAB_BOOK_CUE.test(text);
  if (!hasIntakeMutate || !hasLabBook) return false;

  return COMPOUND_LINK_CUE.test(text) || hasIntakeMutate;
}

export function isCompleteIntakeAndBookCompoundPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchCompleteIntakeAndBookScenario(text)) {
    return !hasIntakeLabBookPayPaymentCue(text);
  }
  if (!isCompleteIntakeAndBookCorePrompt(text)) return false;
  return !hasIntakeLabBookPayPaymentCue(text);
}

export function isCompleteIntakeAndBookIntent(
  action: string,
): action is CompleteIntakeAndBookIntent {
  return (COMPLETE_INTAKE_AND_BOOK_INTENTS as readonly string[]).includes(
    action,
  );
}

export interface ParsedCompleteIntakeAndBook {
  serviceName?: string;
  bookingFirstAvailable?: boolean;
}

export function parseCompleteIntakeAndBookFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedCompleteIntakeAndBook | null {
  if (
    !isCompleteIntakeAndBookCompoundPrompt(prompt) &&
    !params.completeIntakeAndBook
  ) {
    if (!isCompleteIntakeAndBookIntent(String(params._action ?? ''))) {
      return null;
    }
  }

  const serviceName =
    (typeof params.serviceName === 'string' && params.serviceName.trim()
      ? params.serviceName.trim()
      : undefined) ?? extractLabServiceNameFromIntakeBookPrompt(prompt);

  return {
    serviceName,
    bookingFirstAvailable:
      params.bookingFirstAvailable === true ||
      isFirstAvailableBookingPrompt(prompt),
  };
}

export function buildCompleteIntakeAndBookCompoundParams(
  prompt: string,
): Record<string, unknown> {
  const params: Record<string, unknown> = {
    ...buildSharedBookingContextFromPrompt(prompt),
    completeIntakeAndBook: true,
    preVisitIntakeRequired: true,
    bookingPhase: 'intake',
  };
  const serviceName = extractLabServiceNameFromIntakeBookPrompt(prompt);
  if (serviceName) params.serviceName = serviceName;
  if (isFirstAvailableBookingPrompt(prompt)) {
    params.bookingFirstAvailable = true;
    params.timeSlot = null;
  }
  enrichBookingTimeHintsFromPrompt('complete_intake_and_book', params, prompt);
  return params;
}

export type CompleteIntakeAndBookCompoundStep = {
  action:
    | CompleteIntakeAndBookIntent
    | 'book_nearest_slot'
    | 'book_appointment';
  params: Record<string, unknown>;
  segment: string;
};

function resolveBookActionForSurface(
  surface: Extract<CommandSurface, 'customer' | 'public'>,
): 'book_nearest_slot' | 'book_appointment' {
  return surface === 'public' ? 'book_appointment' : 'book_nearest_slot';
}

export function decomposeCompleteIntakeAndBookCompoundPrompt(
  prompt: string,
  surface: Extract<CommandSurface, 'customer' | 'public'> = 'customer',
): CompleteIntakeAndBookCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !isCompleteIntakeAndBookCompoundPrompt(trimmed)) {
    return [];
  }
  return decomposeCompleteIntakeAndBookCoreCompoundPrompt(trimmed, surface);
}

export function decomposeCompleteIntakeAndBookCoreCompoundPrompt(
  prompt: string,
  surface: Extract<CommandSurface, 'customer' | 'public'> = 'customer',
): CompleteIntakeAndBookCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed || !isCompleteIntakeAndBookCorePrompt(trimmed)) {
    return [];
  }

  const base = buildCompleteIntakeAndBookCompoundParams(trimmed);
  const bookAction = resolveBookActionForSurface(surface);
  const bookParams = {
    ...base,
    bookingPhase: 'schedule',
    continueAfterIntake: true,
  };
  enrichBookingTimeHintsFromPrompt(bookAction, bookParams, trimmed);

  const steps: CompleteIntakeAndBookCompoundStep[] = [
    {
      action: 'complete_intake_and_book',
      params: { ...base },
      segment: trimmed,
    },
    {
      action: bookAction,
      params: bookParams,
      segment: trimmed,
    },
  ];

  return propagateSharedBookingContextAcrossSteps(steps);
}

export function decomposeCustomerCompleteIntakeAndBookCompoundPrompt(
  prompt: string,
): CompleteIntakeAndBookCompoundStep[] {
  return decomposeCompleteIntakeAndBookCompoundPrompt(prompt, 'customer');
}

export function decomposePublicCompleteIntakeAndBookCompoundPrompt(
  prompt: string,
): CompleteIntakeAndBookCompoundStep[] {
  return decomposeCompleteIntakeAndBookCompoundPrompt(prompt, 'public');
}

export function rescueCompleteIntakeAndBookCompoundIntent(
  prompt: string,
  action: string,
): { action: 'compound_intent'; rescueReason: string } | null {
  if (action === 'compound_intent') return null;
  if (!isCompleteIntakeAndBookCompoundPrompt(prompt)) return null;
  return {
    action: 'compound_intent',
    rescueReason: 'complete_intake_and_book_compound',
  };
}

export function resolveIntakeBookLabService(
  services: Array<{ id: string; name: string; metadata?: unknown }>,
  serviceName?: string,
  hasPublishedQuestionnaire = true,
): { id: string; name: string } | null {
  const labTests = services.filter((service) =>
    isClinicLabTestService(
      service.metadata as Record<string, unknown> | null | undefined,
    ),
  );
  const intakeEligible = labTests.filter((service) =>
    clinicLabTestOffersPreVisitIntake(
      service.metadata as Record<string, unknown> | null | undefined,
      hasPublishedQuestionnaire,
    ),
  );
  const pool = intakeEligible.length > 0 ? intakeEligible : labTests;
  if (pool.length === 0) return null;

  if (serviceName) {
    const needle = serviceName.toLowerCase();
    const exact = pool.find((service) => service.name.toLowerCase() === needle);
    if (exact) return exact;
    const partial = pool.find((service) =>
      service.name.toLowerCase().includes(needle),
    );
    if (partial) return partial;
    if (needle.includes('cbc')) {
      const cbc = pool.find((service) => /\bcbc\b/i.test(service.name));
      if (cbc) return cbc;
    }
    if (needle.includes('lipid')) {
      const lipid = pool.find((service) => /lipid/i.test(service.name));
      if (lipid) return lipid;
    }
    if (needle.includes('blood') || needle.includes('draw')) {
      const draw = pool.find((service) =>
        /blood|draw|collection/i.test(service.name),
      );
      if (draw) return draw;
    }
  }

  return pool[0] ?? null;
}

export function assertCompleteIntakeAndBookBusinessType(
  businessType: string | null | undefined,
): string | null {
  if (!isClinicVerticalBusinessType(businessType)) {
    return businessType ?? 'unknown';
  }
  return null;
}

export function buildCompleteIntakeAndBookNavigate(serviceId: string): {
  path: string;
  query: Record<string, string>;
} {
  return {
    path: 'book',
    query: {
      serviceId,
      bookingPhase: 'intake',
      completeIntakeAndBook: '1',
    },
  };
}

export function formatCompleteIntakeAndBookSummary(
  serviceName: string,
  bookingFirstAvailable: boolean,
): string {
  const slotHint = bookingFirstAvailable
    ? ' Then I will pick the earliest available slot after intake.'
    : ' Then continue to slot selection after intake.';
  return `Starting the optional pre-visit intake for ${serviceName}.${slotHint} Sign in is required; answers save to your draft before booking continues.`;
}
