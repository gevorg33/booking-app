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

type IntakeAnswerInput = string | { questionId?: string; value: string };

function normalizeAnswers(params: Record<string, unknown>): IntakeAnswerInput[] {
  if (Array.isArray(params.answers)) {
    return params.answers as IntakeAnswerInput[];
  }
  if (typeof params.answer === 'string') return [params.answer];
  if (typeof params.value === 'string') return [params.value];
  return [];
}

/**
 * Submits one or more intake answers in a single command. The backend only
 * accepts one question's answer per call, so a "batch" of free-text answers
 * is walked sequentially against the questionnaire's own next-question order
 * (ai-cmd-customer-6.4.1) — the caller doesn't need to know question ids.
 */
export async function handleSubmitIntakeAnswersLogic(
  deps: ClinicBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'submit_intake_answers',
      'Sign in to submit your pre-visit intake answers.',
      { clarify: true, missing: ['sessionCustomerId'] },
    );
  }

  const slug = await resolveBusinessSlug(deps, businessId);
  if (!slug) return failure('submit_intake_answers', 'Business not found.');

  const intakeId =
    (params.intakeId as string | undefined) ??
    (params.sessionIntakeId as string | undefined);
  if (!intakeId) {
    return failure(
      'submit_intake_answers',
      'Create a pre-visit intake draft first, then I can submit your answers.',
      { clarify: true, missing: ['intakeId'] },
    );
  }

  const answers = normalizeAnswers(params);
  if (!answers.length) {
    return failure(
      'submit_intake_answers',
      'What answer(s) would you like to submit for the intake questionnaire?',
      { clarify: true, missing: ['answers'], intakeId },
    );
  }

  let flow: Awaited<
    ReturnType<ClinicBookingLogicDeps['publicPreVisitIntakeService']['getCustomerFlow']>
  >;
  try {
    flow = await deps.publicPreVisitIntakeService.getCustomerFlow(
      slug,
      customerId,
      intakeId,
    );
  } catch (err: any) {
    return failure(
      'submit_intake_answers',
      err?.message ?? 'Could not find this pre-visit intake.',
      { intakeId, reason: 'not_found' },
    );
  }

  let submittedCount = 0;
  for (const answer of answers) {
    if (flow.isCompleted) break;

    const questionId =
      typeof answer === 'object' && answer.questionId
        ? answer.questionId
        : flow.nextQuestion?.id;
    if (!questionId) break;

    const value = typeof answer === 'string' ? answer : answer.value;

    try {
      flow = await deps.publicPreVisitIntakeService.submitCustomerAnswers(
        slug,
        customerId,
        intakeId,
        { questionId, values: [value] },
      );
      submittedCount += 1;
    } catch (err: any) {
      return failure(
        'submit_intake_answers',
        err?.message ?? 'Could not submit this intake answer.',
        {
          intakeId,
          submittedCount,
          reason: 'submit_failed',
        },
      );
    }
  }

  if (submittedCount === 0) {
    return failure(
      'submit_intake_answers',
      'The intake questionnaire has no pending question to answer right now.',
      { intakeId, isCompleted: flow.isCompleted, clarify: true },
    );
  }

  const summary = flow.isCompleted
    ? `Submitted ${submittedCount} answer(s) — your "${flow.questionnaire.title}" intake is complete.`
    : `Submitted ${submittedCount} answer(s) — next: ${flow.nextQuestion?.text ?? 'one more question'}.`;

  return success('submit_intake_answers', summary, {
    intakeId: flow.id,
    status: flow.status,
    isCompleted: flow.isCompleted,
    nextQuestion: flow.nextQuestion,
    submittedCount,
    sessionContext: { intakeId: flow.id },
  });
}
