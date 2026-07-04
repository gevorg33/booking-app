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
