import type { CommandResult } from './command-completion.types.js';
import type { ClinicBookingLogicDeps } from './ai-clinic-booking.logic.js';

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
}

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  return (
    (params.sessionCustomerId as string | undefined) ??
    (params.customerId as string | undefined)
  );
}

async function resolveBusinessSlug(
  deps: ClinicBookingLogicDeps,
  businessId: string,
): Promise<string | null> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  return business?.slug ?? null;
}

export async function handleStartPreVisitIntakeLogic(
  deps: ClinicBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'start_pre_visit_intake',
      'Sign in to start your pre-visit intake.',
      { clarify: true, missing: ['sessionCustomerId'] },
    );
  }

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('start_pre_visit_intake', 'Business not found.');

  const intakeId =
    (params.intakeId as string | undefined) ??
    (params.sessionIntakeId as string | undefined);
  if (!intakeId) {
    return failure(
      'start_pre_visit_intake',
      'Create a pre-visit intake draft first, then I can start the questionnaire.',
      { clarify: true, missing: ['intakeId'] },
    );
  }

  try {
    const flow = await deps.publicPreVisitIntakeService.startCustomerIntake(
      slug,
      customerId,
      intakeId,
    );
    const summary = flow.nextQuestion
      ? `Started "${flow.questionnaire.title}" — first question: ${flow.nextQuestion.text ?? 'answer to continue'}.`
      : `Started "${flow.questionnaire.title}".`;
    return success('start_pre_visit_intake', summary, {
      intakeId: flow.id,
      status: flow.status,
      nextQuestion: flow.nextQuestion,
      sessionContext: { intakeId: flow.id },
    });
  } catch (err: any) {
    return failure(
      'start_pre_visit_intake',
      err?.message ?? 'Could not start this pre-visit intake.',
      { intakeId, reason: 'start_failed' },
    );
  }
}
