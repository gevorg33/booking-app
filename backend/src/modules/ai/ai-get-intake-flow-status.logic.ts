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

export async function handleGetIntakeFlowStatusLogic(
  deps: ClinicBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'get_intake_flow_status',
      'Sign in to check your pre-visit intake status.',
      { clarify: true, missing: ['sessionCustomerId'] },
    );
  }

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('get_intake_flow_status', 'Business not found.');

  const intakeId =
    (params.intakeId as string | undefined) ??
    (params.sessionIntakeId as string | undefined);
  if (!intakeId) {
    return failure(
      'get_intake_flow_status',
      'Start a pre-visit intake first, then I can check its status.',
      { clarify: true, missing: ['intakeId'] },
    );
  }

  try {
    const flow = await deps.publicPreVisitIntakeService.getCustomerFlow(
      slug,
      customerId,
      intakeId,
    );
    const summary = flow.isCompleted
      ? `Your "${flow.questionnaire.title}" intake is complete.`
      : flow.nextQuestion
        ? `Your "${flow.questionnaire.title}" intake is ${flow.status} — next: ${flow.nextQuestion.text ?? 'answer the next question'}.`
        : `Your "${flow.questionnaire.title}" intake is ${flow.status}.`;
    return success('get_intake_flow_status', summary, {
      intakeId: flow.id,
      status: flow.status,
      isCompleted: flow.isCompleted,
      nextQuestion: flow.nextQuestion,
      sessionContext: { intakeId: flow.id },
    });
  } catch (err: any) {
    return failure(
      'get_intake_flow_status',
      err?.message ?? 'Could not find this pre-visit intake.',
      { intakeId, reason: 'not_found' },
    );
  }
}
