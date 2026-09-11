import type { ClinicPreVisitIntakeService } from '../clinic-pre-visit-intakes/clinic-pre-visit-intake.service.js';
import type { CommandResult } from './command-completion.types.js';

export interface ClinicPreVisitIntakeLogicDeps {
  intakeService: ClinicPreVisitIntakeService;
}

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

export async function handleAssignPreVisitIntakeToBookingLogic(
  deps: ClinicPreVisitIntakeLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const bookingId =
    typeof params.bookingId === 'string' ? params.bookingId.trim() : '';
  if (!bookingId) {
    return failure(
      'assign_pre_visit_intake_to_booking',
      'Which booking should I assign the pre-visit intake to?',
      { clarify: true, missing: ['bookingId'] },
    );
  }

  const questionnaireId =
    typeof params.questionnaireId === 'string'
      ? params.questionnaireId
      : undefined;

  try {
    const intake = await deps.intakeService.assignForBooking(
      businessId,
      userId,
      bookingId,
      { questionnaireId },
    );
    return success(
      'assign_pre_visit_intake_to_booking',
      `Assigned a pre-visit intake to booking ${bookingId}.`,
      { bookingId, intake },
    );
  } catch (err: any) {
    return failure(
      'assign_pre_visit_intake_to_booking',
      err?.message ?? 'Could not assign the pre-visit intake.',
    );
  }
}

export async function handleStaffSubmitIntakeAnswersLogic(
  deps: ClinicPreVisitIntakeLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const bookingId =
    typeof params.bookingId === 'string' ? params.bookingId.trim() : '';
  const values = Array.isArray(params.values)
    ? params.values.filter(
        (value): value is string => typeof value === 'string',
      )
    : typeof params.values === 'string'
      ? [params.values]
      : [];

  if (!bookingId || values.length === 0) {
    return failure(
      'staff_submit_intake_answers',
      'Which booking is this intake for, and what are the answer values?',
      { clarify: true, missing: ['bookingId', 'values'] },
    );
  }

  const questionId =
    typeof params.questionId === 'string'
      ? params.questionId.trim()
      : undefined;

  try {
    const intake = await deps.intakeService.getForBooking(
      businessId,
      userId,
      bookingId,
    );
    if (!intake) {
      return failure(
        'staff_submit_intake_answers',
        'No pre-visit intake is assigned to that booking yet. Assign one first.',
      );
    }

    const submitted = await deps.intakeService.submitAnswers(
      businessId,
      userId,
      intake.id,
      { questionId, values },
    );
    return success(
      'staff_submit_intake_answers',
      `Submitted intake answers for booking ${bookingId}.`,
      { bookingId, intake: submitted },
    );
  } catch (err: any) {
    return failure(
      'staff_submit_intake_answers',
      err?.message ?? 'Could not submit the intake answers.',
    );
  }
}
