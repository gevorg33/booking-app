import { isClinicVerticalBusinessType } from '../../common/utils/clinic-service.util.js';
import type { CommandResult } from './command-completion.types.js';
import type { ClinicBookingLogicDeps } from './ai-clinic-booking.logic.js';
import {
  enrichExplainClinicBookingFieldsParamsFromPrompt,
  isExplainClinicBookingFieldsPrompt,
  type ClinicBookingFieldsAspect,
  type ParsedExplainClinicBookingFields,
} from './ai-explain-clinic-booking-fields.util.js';

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

const FIELD_EXPLANATIONS: Record<
  Exclude<ClinicBookingFieldsAspect, 'all'>,
  string
> = {
  governmentId:
    'Clinics may ask for a government ID or passport during registration or pre-visit intake to verify your identity before treatment or lab work—especially when results must match official records. Enter it on the booking or intake form, not in this chat when HIPAA mode is on.',
  dateOfBirth:
    'Date of birth helps the clinic match you to prior visits, lab orders, and insurance eligibility. Provide it on the registration or intake form when shown.',
  insurance:
    'Insurance provider, policy number, or member ID let the clinic verify coverage or prepare billing before your visit. Fill these on checkout or intake only when the clinic collects them.',
  emergencyContact:
    'Emergency contact name and phone let staff reach someone if you are unavailable during your appointment. These are usually optional unless the clinic marks them required on intake.',
  address:
    'A home or mailing address may be collected for registration, billing correspondence, or visit coordination. Enter it on the booking or intake form when prompted.',
  intakeQuestion:
    'Pre-visit intake questionnaires ask structured personal and medical questions—such as ID, insurance, or history—so the clinic can prepare before you arrive. Complete the questionnaire in the booking flow when signed in.',
};

function buildAspectSummary(aspect: ClinicBookingFieldsAspect): string {
  if (aspect === 'all') {
    return [
      FIELD_EXPLANATIONS.governmentId,
      FIELD_EXPLANATIONS.dateOfBirth,
      FIELD_EXPLANATIONS.insurance,
      FIELD_EXPLANATIONS.emergencyContact,
      FIELD_EXPLANATIONS.intakeQuestion,
    ].join(' ');
  }
  return FIELD_EXPLANATIONS[aspect];
}

export async function handleExplainClinicBookingFieldsLogic(
  deps: ClinicBookingLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
  prompt?: string,
): Promise<CommandResult> {
  const textPrompt = String(prompt ?? params._prompt ?? '');
  const enriched = enrichExplainClinicBookingFieldsParamsFromPrompt(
    { ...params, _prompt: textPrompt },
    textPrompt,
  );

  if (textPrompt && !isExplainClinicBookingFieldsPrompt(textPrompt)) {
    return failure(
      'explain_clinic_booking_fields',
      'Ask why a clinic booking or intake field is collected (e.g. "Why do you ask for my ID?").',
      { clarify: true, missing: ['aspect'] },
    );
  }

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('explain_clinic_booking_fields', 'Business not found.');
  }

  const businessType = readBusinessType(business.settings);
  if (!isClinicVerticalBusinessType(businessType)) {
    return failure(
      'explain_clinic_booking_fields',
      'Clinic booking field guidance is only available for clinic vertical businesses.',
      { businessType },
    );
  }

  const parsed: ParsedExplainClinicBookingFields = {
    aspect:
      typeof enriched.aspect === 'string'
        ? (enriched.aspect as ClinicBookingFieldsAspect)
        : 'all',
  };

  const summary = buildAspectSummary(parsed.aspect);

  return success('explain_clinic_booking_fields', summary, {
    aspect: parsed.aspect,
    navigate: { path: 'checkout', query: {} },
  });
}
