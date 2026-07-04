/** ai-cmd-dashboard-6.3.3 — assign pre-visit intake to booking classifier appendix. */
export const CLINIC_PRE_VISIT_INTAKE_CLASSIFIER_RULES = `- assign_pre_visit_intake_to_booking: MUTATE — clinic only: assign a pre-visit intake questionnaire to a booking (auto-picks the default questionnaire when questionnaireId is omitted). Requires bookingId. Triggers: assign a pre-visit intake to this booking, send the intake form for this appointment. NOT create_intake_draft/start_pre_visit_intake (customer-facing draft flow before booking exists).
- Examples:
  - "Assign a pre-visit intake to booking b1" → assign_pre_visit_intake_to_booking, bookingId=b1`;
