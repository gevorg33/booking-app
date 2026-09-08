import { isExplainClinicBookingPrompt } from './ai-clinic-booking.util.js';
import { isExplainLabPrepPrompt } from './ai-explain-lab-prep.util.js';
import {
  EXPLAIN_PUBLIC_INTAKE_FORM_PROMPTS,
  type ExplainPublicIntakeFormAspect,
  type ExplainPublicIntakeFormFixture,
} from './ai-explain-public-intake-form.fixtures.js';
import { EXPLAIN_PUBLIC_INTAKE_FORM_MULTILINGUAL_SCENARIOS } from './ai-explain-public-intake-form-multilingual.fixtures.js';

export const EXPLAIN_PUBLIC_INTAKE_FORM_INTENTS = [
  'explain_public_intake_form',
] as const;

export type ExplainPublicIntakeFormIntent =
  (typeof EXPLAIN_PUBLIC_INTAKE_FORM_INTENTS)[number];

export {
  CUSTOMER_PUBLIC_EXPLAIN_PUBLIC_INTAKE_FORM_CLASSIFIER_RULES,
  EXPLAIN_PUBLIC_INTAKE_FORM_PROMPTS,
  EXPLAIN_PUBLIC_INTAKE_FORM_RESCUE_SCENARIOS,
} from './ai-explain-public-intake-form.fixtures.js';

const INTAKE_AND_BOOK_MUTATE_BLOCK =
  /\b(?:fill|complete|finish|answer).{0,40}\b(?:intake|questionnaire|health\s+form).{0,40}\b(?:book|schedule|reserve)\b/i;

const SYMPTOMS_CHECKOUT_CUE =
  /\b(symptoms?\s+field|referral\s+notes?|reason\s+for\s+visit\s+field)\b/i;

const IDENTITY_FIELD_CUE = new RegExp(
  String.raw`\b(passport|government\s+id|date\s+of\s+birth|insurance(?:\s+policy)?|emergency\s+contact|mailing\s+address|personal\s+details)\b|(?:ինչու|зачем|почему).*(?:\bid\b|անձնագիր|паспорт|удостовер)`,
  'iu',
);

const READ_CUE = new RegExp(
  String.raw`\b(what|why|how|when|do i|does|can i|must|have to|explain|tell|skip|optional)\b|ինչ|ինչու|բաց թողնել|что|почему|можно|пропуст|анкет`,
  'iu',
);

const PUBLIC_INTAKE_CUE =
  /\b(why.{0,40}(?:health questions|questionnaire)|skip.{0,20}(?:form|questionnaire)|optional pre-visit|pre-visit (?:intake|questionnaire)|intake (?:form|questionnaire|step)|questionnaire before|health questions|publicIntake|start questionnaire|skip for now.{0,20}intake)\b/i;

const SKIP_FORM_CUE =
  /\b(skip.{0,20}(?:form|questionnaire)|skip for now|book without|have to complete|must complete|optional)\b/i;

const WHY_QUESTIONS_CUE =
  /\b(why.{0,40}(?:health questions|questionnaire)|health questions)\b/i;

const WHAT_IS_FORM_CUE =
  /\b(what.{0,30}(?:questionnaire|health questions|intake form)|optional pre-visit)\b/i;

const WHEN_SHOWN_CUE =
  /\b(when.{0,30}(?:questionnaire|intake)|see the intake)\b/i;

const SIGN_IN_CUE =
  /\b(sign in.{0,30}(?:questionnaire|intake)|need to sign in)\b/i;

function containsArmenianScript(prompt: string): boolean {
  return /[\u0530-\u058F]/.test(prompt);
}

function containsCyrillicScript(prompt: string): boolean {
  return /[\u0400-\u04FF]/.test(prompt);
}

function matchExplainPublicIntakeFormScenario(
  prompt: string,
): ExplainPublicIntakeFormFixture | null {
  const trimmed = prompt.trim();
  const normalized = trimmed.toLowerCase();
  for (const scenario of EXPLAIN_PUBLIC_INTAKE_FORM_PROMPTS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  for (const scenario of EXPLAIN_PUBLIC_INTAKE_FORM_MULTILINGUAL_SCENARIOS) {
    const candidate = scenario.prompt.trim();
    if (candidate === trimmed || candidate.toLowerCase() === normalized) {
      return scenario;
    }
  }
  return null;
}

export function resolveExplainPublicIntakeFormAspect(
  prompt: string,
): ExplainPublicIntakeFormAspect {
  const scenario = matchExplainPublicIntakeFormScenario(prompt);
  if (scenario?.aspect) return scenario.aspect;
  if (SIGN_IN_CUE.test(prompt)) return 'sign_in_required';
  if (SKIP_FORM_CUE.test(prompt)) return 'skip_form';
  if (WHY_QUESTIONS_CUE.test(prompt)) return 'why_questions';
  if (WHAT_IS_FORM_CUE.test(prompt)) return 'what_is_form';
  if (WHEN_SHOWN_CUE.test(prompt)) return 'when_shown';
  if (/\bhow\b/i.test(prompt) && /\b(intake|questionnaire)\b/i.test(prompt)) {
    return 'how_it_works';
  }
  return 'how_it_works';
}

export function isExplainPublicIntakeFormPrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (matchExplainPublicIntakeFormScenario(text)) return true;
  if (INTAKE_AND_BOOK_MUTATE_BLOCK.test(text)) return false;
  if (SYMPTOMS_CHECKOUT_CUE.test(text)) return false;
  if (IDENTITY_FIELD_CUE.test(text)) return false;
  if (isExplainLabPrepPrompt(text)) return false;
  if (isExplainClinicBookingPrompt(text)) return false;

  if (
    (containsArmenianScript(text) &&
      // e2e-bug.531 — 'ձև' (form) also matches inside 'ձևանմուշ' (template),
      // which is a different word that merely shares the morpheme. With
      // 'ինչու' satisfying the third clause, the provider prompt 'Ինչու չեմ
      // կարող խմբագրել հաղորդագրության ձևանմուշները' ('why can't I edit the
      // message templates') matched all three and rescued to
      // explain_public_intake_form.
      //
      // That is not allowed on the provider surface, so acceptRescueForSurface
      // discarded it — and because the correct explain_dashboard_only_action
      // rescue sits *later in the same phase*, it was never reached and the
      // provider got **no answer at all**. A word boundary cannot express this:
      // \b is ASCII-only and matches nothing beside Armenian script.
      /(առողջության|ձև(?!անմուշ)|հարցաթերթիկ|նախապոստ)/i.test(text) &&
      /(ինչու|բաց թողնել|հարց)/i.test(text)) ||
    (containsCyrillicScript(text) &&
      /(здоров|анкет|вопрос)/i.test(text) &&
      /(почему|пропуст|можно|работа)/i.test(text))
  ) {
    return true;
  }

  if (!READ_CUE.test(text) && !/\?\s*$/.test(text)) return false;
  return PUBLIC_INTAKE_CUE.test(text);
}

export function isExplainPublicIntakeFormIntent(
  action: string,
): action is ExplainPublicIntakeFormIntent {
  return (EXPLAIN_PUBLIC_INTAKE_FORM_INTENTS as readonly string[]).includes(
    action,
  );
}

export interface ParsedExplainPublicIntakeForm {
  aspect: ExplainPublicIntakeFormAspect;
}

export function parseExplainPublicIntakeFormFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedExplainPublicIntakeForm | null {
  if (!isExplainPublicIntakeFormPrompt(prompt)) return null;
  const aspectFromParams =
    typeof params.aspect === 'string' &&
    [
      'why_questions',
      'skip_form',
      'what_is_form',
      'how_it_works',
      'when_shown',
      'sign_in_required',
    ].includes(params.aspect)
      ? (params.aspect as ExplainPublicIntakeFormAspect)
      : undefined;
  return {
    aspect: aspectFromParams ?? resolveExplainPublicIntakeFormAspect(prompt),
  };
}

export function enrichExplainPublicIntakeFormParamsFromPrompt(
  params: Record<string, unknown>,
  prompt: string,
): Record<string, unknown> {
  const parsed = parseExplainPublicIntakeFormFromPrompt(prompt, params);
  if (!parsed) return params;
  return { ...params, aspect: parsed.aspect };
}

export function rescueExplainPublicIntakeFormIntent(
  prompt: string,
  action: string,
): { action: ExplainPublicIntakeFormIntent; rescueReason: string } | null {
  if (isExplainPublicIntakeFormIntent(action)) return null;
  if (!parseExplainPublicIntakeFormFromPrompt(prompt)) return null;
  return {
    action: 'explain_public_intake_form',
    rescueReason: 'public_intake_form',
  };
}

export function detectExplainPublicIntakeFormAction(
  prompt: string,
): ExplainPublicIntakeFormIntent | null {
  return isExplainPublicIntakeFormPrompt(prompt)
    ? 'explain_public_intake_form'
    : null;
}

export interface PublicIntakeFormExplainContext {
  offersPreVisitIntake: boolean | null;
  intakeInProgress: boolean;
  signedIn: boolean | null;
  serviceId: string | null;
}

export function resolvePublicIntakeFormExplainContext(
  params: Record<string, unknown>,
): PublicIntakeFormExplainContext {
  const offersPreVisitIntake =
    typeof params.offersPreVisitIntake === 'boolean'
      ? params.offersPreVisitIntake
      : typeof params.preVisitIntakeEnabled === 'boolean'
        ? params.preVisitIntakeEnabled
        : null;
  const intakeInProgress =
    params.bookingPhase === 'intake' ||
    params.intakeInProgress === true ||
    params.onIntakeStep === true;
  const signedIn =
    typeof params.sessionCustomerId === 'string'
      ? true
      : typeof params.signedIn === 'boolean'
        ? params.signedIn
        : null;
  const serviceId =
    typeof params.serviceId === 'string' && params.serviceId.trim()
      ? params.serviceId.trim()
      : null;

  return {
    offersPreVisitIntake,
    intakeInProgress,
    signedIn,
    serviceId,
  };
}

export function buildWhyQuestionsLines(
  ctx: PublicIntakeFormExplainContext,
): string[] {
  const lines = [
    'The optional pre-visit questionnaire (publicIntakeCheckout*) collects health answers before lab-test checkout so the clinic can prepare for your draw.',
    'Questions come from the clinic published intake questionnaire — not free-text symptoms on the main checkout form.',
  ];
  if (ctx.offersPreVisitIntake === false) {
    lines.push(
      'This lab service or clinic does not currently offer the pre-visit intake step.',
    );
  } else if (ctx.intakeInProgress) {
    lines.push(
      'You are on the intake step now — answers save to your draft before booking continues.',
    );
  }
  return lines;
}

export function buildSkipFormLines(
  ctx: PublicIntakeFormExplainContext,
): string[] {
  const lines = [
    'The intake step is optional. Tap Skip for now (publicIntakeSkip) to continue scheduling without answering.',
    'You can still complete booking; the clinic may ask again at the visit if information is missing.',
  ];
  if (ctx.intakeInProgress) {
    lines.push('Skip for now is visible on the intake screen you are viewing.');
  }
  if (ctx.signedIn === false) {
    lines.push(
      'Sign in first — the intake step only appears for signed-in customers on lab tests that offer it.',
    );
  }
  return lines;
}

export function buildWhatIsFormLines(): string[] {
  return [
    'publicIntakeCheckoutTitle describes an optional pre-visit questionnaire shown before checkout on qualifying lab tests.',
    'After Start questionnaire you answer clinic-defined health questions one at a time, then Continue to booking.',
    'Answers are stored against your intake draft and can be linked to the booking once confirmed.',
  ];
}

export function buildWhenShownLines(
  ctx: PublicIntakeFormExplainContext,
): string[] {
  const lines = [
    'The intake step appears on the consumer book flow when the selected service is a clinic lab test and the business published a pre-visit questionnaire (GET checkout/pre-visit-intake/config).',
    'It shows after you pick a slot and tap continue — before payment/checkout submission.',
  ];
  if (ctx.offersPreVisitIntake) {
    lines.push('Your current service offers the pre-visit intake step.');
  } else if (ctx.offersPreVisitIntake === false) {
    lines.push('Your current service does not offer the intake step.');
  }
  if (ctx.signedIn === false) {
    lines.push('You must be signed in for the intake step to appear.');
  }
  return lines;
}

export function buildSignInRequiredLines(): string[] {
  return [
    'Pre-visit intake drafts are tied to your customer account so answers can link to your booking and chart.',
    'Sign in on the consumer app or public booking page before the lab test book flow to see the optional questionnaire.',
  ];
}

export function buildPublicIntakeHowItWorksLines(
  ctx: PublicIntakeFormExplainContext,
): string[] {
  const lines = [
    'Flow: create intake draft → Start questionnaire → answer each question → Continue to booking → optional link intake to confirmed booking.',
    'Skip for now bypasses the questionnaire and returns you to slot confirmation/checkout.',
  ];
  if (ctx.intakeInProgress) {
    lines.push('You are currently in the intake phase of booking.');
  }
  if (ctx.serviceId) {
    lines.push(`Active service context: ${ctx.serviceId}.`);
  }
  return lines;
}

export function assemblePublicIntakeFormSummary(
  aspect: ExplainPublicIntakeFormAspect,
  ctx: PublicIntakeFormExplainContext,
): string {
  let lines: string[];
  switch (aspect) {
    case 'why_questions':
      lines = buildWhyQuestionsLines(ctx);
      break;
    case 'skip_form':
      lines = buildSkipFormLines(ctx);
      break;
    case 'what_is_form':
      lines = buildWhatIsFormLines();
      break;
    case 'when_shown':
      lines = buildWhenShownLines(ctx);
      break;
    case 'sign_in_required':
      lines = buildSignInRequiredLines();
      break;
    case 'how_it_works':
    default:
      lines = buildPublicIntakeHowItWorksLines(ctx);
      break;
  }
  return lines.join(' ');
}

export function buildExplainPublicIntakeFormNavigate(
  aspect: ExplainPublicIntakeFormAspect,
  ctx: PublicIntakeFormExplainContext,
): { path: string; query: Record<string, string> } | null {
  if (
    aspect === 'skip_form' ||
    aspect === 'what_is_form' ||
    aspect === 'how_it_works' ||
    aspect === 'when_shown' ||
    aspect === 'why_questions'
  ) {
    return {
      path: 'book',
      query: ctx.serviceId ? { serviceId: ctx.serviceId } : {},
    };
  }
  return null;
}
