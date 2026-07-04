/** ai-cmd-dashboard-6.3.3 — assign a pre-visit intake questionnaire to a booking (dashboard admin). */

export const DASHBOARD_CLINIC_PRE_VISIT_INTAKE_MUTATE_INTENTS = [
  'assign_pre_visit_intake_to_booking',
] as const;

export type ClinicPreVisitIntakeIntent =
  (typeof DASHBOARD_CLINIC_PRE_VISIT_INTAKE_MUTATE_INTENTS)[number];

const CLINIC_PRE_VISIT_INTAKE_INTENT_SET = new Set<string>(
  DASHBOARD_CLINIC_PRE_VISIT_INTAKE_MUTATE_INTENTS,
);

export function isClinicPreVisitIntakeIntent(
  action: string,
): action is ClinicPreVisitIntakeIntent {
  return CLINIC_PRE_VISIT_INTAKE_INTENT_SET.has(action);
}

export function isAssignPreVisitIntakeToBookingPrompt(
  prompt: string,
): boolean {
  return (
    /\bassign\b/i.test(prompt) &&
    /\b(pre[-\s]?visit\s+)?intake\b/i.test(prompt) &&
    /\b(booking|appointment)\b/i.test(prompt)
  );
}

export function rescueClinicPreVisitIntakeIntent(
  prompt: string,
  action: string,
): { action: ClinicPreVisitIntakeIntent; rescueReason: string } | null {
  if (isClinicPreVisitIntakeIntent(action)) return null;
  if (isAssignPreVisitIntakeToBookingPrompt(prompt)) {
    return {
      action: 'assign_pre_visit_intake_to_booking',
      rescueReason: 'assign_intake',
    };
  }
  return null;
}
