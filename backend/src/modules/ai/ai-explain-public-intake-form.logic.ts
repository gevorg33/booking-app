import { isClinicVerticalBusinessType } from '../../common/utils/clinic-service.util.js';
import type { CommandResult } from './command-completion.types.js';
import type { ClinicBookingLogicDeps } from './ai-clinic-booking.logic.js';
import {
  assemblePublicIntakeFormSummary,
  buildExplainPublicIntakeFormNavigate,
  enrichExplainPublicIntakeFormParamsFromPrompt,
  isExplainPublicIntakeFormPrompt,
  parseExplainPublicIntakeFormFromPrompt,
  resolvePublicIntakeFormExplainContext,
} from './ai-explain-public-intake-form.util.js';

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function readBusinessType(settings: unknown): string | null {
  const businessType = (settings as { businessType?: unknown } | null)
    ?.businessType;
  return typeof businessType === 'string' ? businessType : null;
}

export async function handleExplainPublicIntakeFormLogic(
  deps: ClinicBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const enriched = enrichExplainPublicIntakeFormParamsFromPrompt(
    { ...params, _prompt: textPrompt },
    textPrompt,
  );

  if (textPrompt && !isExplainPublicIntakeFormPrompt(textPrompt)) {
    return failure(
      'explain_public_intake_form',
      'Ask about the optional pre-visit intake questionnaire (e.g. "Why these health questions?" or "Can I skip the form?").',
      { clarify: true },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_public_intake_form', 'Business not found.');
  }

  const businessType = readBusinessType(business.settings);
  if (!isClinicVerticalBusinessType(businessType)) {
    return failure(
      'explain_public_intake_form',
      'Pre-visit intake guidance is only available for clinic vertical businesses.',
      { businessType },
    );
  }

  const parsed = parseExplainPublicIntakeFormFromPrompt(textPrompt, enriched);
  const aspect = parsed?.aspect ?? 'how_it_works';
  const ctx = resolvePublicIntakeFormExplainContext(enriched);
  const summary = assemblePublicIntakeFormSummary(aspect, ctx);
  const navigate = buildExplainPublicIntakeFormNavigate(aspect, ctx);

  return success('explain_public_intake_form', summary, {
    aspect,
    offersPreVisitIntake: ctx.offersPreVisitIntake,
    intakeInProgress: ctx.intakeInProgress,
    signedIn: ctx.signedIn,
    serviceId: ctx.serviceId,
    publicIntakeCheckout: true,
    ...(navigate ? { navigate } : {}),
  });
}
